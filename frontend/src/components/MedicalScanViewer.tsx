'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Square, 
  Circle,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Download,
  Maximize,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getMedicalImageAnalysisPlatform } from '@/lib/api-client';

const api = getMedicalImageAnalysisPlatform();

interface MedicalScanViewerProps {
  imageId: string;
  analysisResults?: any;
  className?: string;
}

interface ViewerControls {
  zoom: number;
  rotation: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  slice: number;
  windowing: { level: number; width: number };
  annotations: boolean;
  measurements: boolean;
}

export function MedicalScanViewer({ 
  imageId, 
  analysisResults,
  className = '' 
}: MedicalScanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTool, setCurrentTool] = useState<'select' | 'measure' | 'annotate'>('select');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [controls, setControls] = useState<ViewerControls>({
    zoom: 1,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    slice: 0,
    windowing: { level: 128, width: 256 },
    annotations: true,
    measurements: true,
  });

  // Fetch image data
  const { data: imageData, isLoading: imageLoading } = useQuery({
    queryKey: ['image-download', imageId],
    queryFn: async () => {
      const response = await api.downloadImageApiV1ImagesImageIdDownloadGet(imageId);
      return response.data;
    },
    enabled: !!imageId,
  });

  // Initialize 3D viewer
  useEffect(() => {
    if (!canvasRef.current || !imageData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setError('Failed to get 2D context');
      return;
    }

    // For demo purposes, we'll simulate a medical scan viewer
    const initializeViewer = async () => {
      try {
        setIsLoading(true);
        
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Draw a placeholder medical scan visualization
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw simulated CT/MRI scan slices
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Main scan area
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
        
        // Crosshair
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
        
        // Simulated anatomical structures
        for (let i = 0; i < 5; i++) {
          const x = centerX + (Math.random() - 0.5) * 200;
          const y = centerY + (Math.random() - 0.5) * 200;
          const radius = Math.random() * 30 + 10;
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Slice information
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`Slice: ${controls.slice + 1}/128`, 10, 30);
        ctx.fillText(`Zoom: ${(controls.zoom * 100).toFixed(0)}%`, 10, 50);
        ctx.fillText(`W/L: ${controls.windowing.width}/${controls.windowing.level}`, 10, 70);
        
        // Analysis annotations if available
        if (analysisResults && controls.annotations) {
          ctx.strokeStyle = '#ff0000';
          ctx.lineWidth = 3;
          ctx.strokeRect(centerX - 50, centerY - 30, 100, 60);
          ctx.fillStyle = '#ff0000';
          ctx.fillText('AI Detection', centerX - 40, centerY + 50);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize 3D viewer');
        setIsLoading(false);
      }
    };

    initializeViewer();
  }, [imageData, controls, analysisResults]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        // Redraw would happen here
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    setControls(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  };

  const handleZoomOut = () => {
    setControls(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  };

  const handleReset = () => {
    setControls(prev => ({
      ...prev,
      zoom: 1,
      rotation: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 0, z: 0 },
    }));
  };

  const handleSliceChange = (direction: 'prev' | 'next') => {
    setControls(prev => ({
      ...prev,
      slice: direction === 'next' 
        ? Math.min(prev.slice + 1, 127)
        : Math.max(prev.slice - 1, 0)
    }));
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // Implement slice animation here
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleAnnotations = () => {
    setControls(prev => ({ ...prev, annotations: !prev.annotations }));
  };

  if (imageLoading || isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>3D Medical Scan Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white text-sm">Loading 3D viewer...</p>
              <Progress value={65} className="w-48 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>3D Medical Scan Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-gray-600">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => setError(null)}>
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>3D Medical Scan Viewer</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={toggleAnnotations}>
              {controls.annotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2">
        {/* Main Viewer */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full aspect-video bg-black rounded-lg cursor-move"
            style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px',
              maxHeight: isFullscreen ? 'calc(100vh - 200px)' : '600px'
            }}
          />
          
          {/* Overlay Controls */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg p-2">
            <div className="text-white text-xs space-y-1">
              <div>Slice: {controls.slice + 1}/128</div>
              <div>Zoom: {(controls.zoom * 100).toFixed(0)}%</div>
              <div>W/L: {controls.windowing.width}/{controls.windowing.level}</div>
            </div>
          </div>
          
          {/* Analysis Overlay */}
          {analysisResults && controls.annotations && (
            <div className="absolute top-4 right-4 bg-red-600 bg-opacity-90 rounded-lg p-2">
              <div className="text-white text-xs">
                <div className="font-medium">AI Detection</div>
                <div>Confidence: 87%</div>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="mt-4 space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-2 bg-gray-100 rounded-lg p-2">
            <Button variant="ghost" size="sm" onClick={() => handleSliceChange('prev')}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleSliceChange('next')}>
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 mx-4">
              <input
                type="range"
                min="0"
                max="127"
                value={controls.slice}
                onChange={(e) => setControls(prev => ({ ...prev, slice: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <span className="text-sm text-gray-600 min-w-[80px] text-center">
              {controls.slice + 1} / 128
            </span>
          </div>

          {/* Tool Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-700">Tools:</div>
              <div className="flex space-x-1">
                {[
                  { id: 'select', icon: Move3D, label: 'Select' },
                  { id: 'measure', icon: Square, label: 'Measure' },
                  { id: 'annotate', icon: Circle, label: 'Annotate' },
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant={currentTool === tool.id ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentTool(tool.id as any)}
                      title={tool.label}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-700">View:</div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 px-2 py-1">
                  {(controls.zoom * 100).toFixed(0)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} title="Reset View">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Windowing Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Window Level: {controls.windowing.level}
              </label>
              <input
                type="range"
                min="0"
                max="255"
                value={controls.windowing.level}
                onChange={(e) => setControls(prev => ({
                  ...prev,
                  windowing: { ...prev.windowing, level: parseInt(e.target.value) }
                }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Window Width: {controls.windowing.width}
              </label>
              <input
                type="range"
                min="1"
                max="512"
                value={controls.windowing.width}
                onChange={(e) => setControls(prev => ({
                  ...prev,
                  windowing: { ...prev.windowing, width: parseInt(e.target.value) }
                }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={controls.annotations}
                  onChange={toggleAnnotations}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show AI Annotations</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={controls.measurements}
                  onChange={(e) => setControls(prev => ({ ...prev, measurements: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Show Measurements</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded p-2">
          <div className="flex justify-between">
            <span>Image: {imageId.slice(0, 8)}... | Format: DICOM</span>
            <span>Voxel Size: 0.5×0.5×1.0mm | Matrix: 512×512×128</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}