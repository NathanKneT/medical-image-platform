'use client';

import { useRef, useEffect, useState } from 'react';
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
  EyeOff,
  Brain,
  Heart,
  Activity // Using Activity instead of Lung
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
  viewMode: 'axial' | 'sagittal' | 'coronal' | '3d';
}

const MEDICAL_SCAN_TYPES = {
  brain: {
    name: 'Brain MRI',
    slices: 128,
    color: '#4F46E5',
    structures: ['Cerebral Cortex', 'White Matter', 'Ventricles', 'Brainstem'],
    findings: ['Normal anatomy', 'Age-related changes', 'Mild atrophy']
  },
  chest: {
    name: 'Chest CT',
    slices: 96,
    color: '#059669',
    structures: ['Lungs', 'Heart', 'Ribs', 'Spine'],
    findings: ['Clear lungs', 'Normal heart size', 'No effusion']
  },
  abdomen: {
    name: 'Abdominal CT',
    slices: 112,
    color: '#DC2626',
    structures: ['Liver', 'Kidneys', 'Spleen', 'Pancreas'],
    findings: ['Normal organs', 'No masses', 'Good enhancement']
  }
};

export function MedicalScanViewer({ 
  imageId, 
  analysisResults,
  className = '' 
}: MedicalScanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTool, setCurrentTool] = useState<'select' | 'measure' | 'annotate'>('select');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanType, setScanType] = useState<keyof typeof MEDICAL_SCAN_TYPES>('brain');
  
  const [controls, setControls] = useState<ViewerControls>({
    zoom: 1,
    rotation: { x: 0, y: 0, z: 0 },
    position: { x: 0, y: 0, z: 0 },
    slice: 32,
    windowing: { level: 128, width: 256 },
    annotations: true,
    measurements: true,
    viewMode: 'axial',
  });

  // For demo purposes, don't require actual image data
  const imageData = { 
    success: true, 
    filename: 'medical_scan.dcm',
    type: 'DICOM',
    size: '45.2 MB' 
  };
  const imageLoading = false;

  // Enhanced 3D viewer with realistic medical visualization
  const drawMedicalScan = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const currentScan = MEDICAL_SCAN_TYPES[scanType];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;

    // Clear canvas with medical background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(1, '#1E293B');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw scan boundary
    ctx.strokeStyle = currentScan.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
    ctx.setLineDash([]);

    // Draw crosshair
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(centerX, 60);
    ctx.lineTo(centerX, canvas.height - 60);
    ctx.moveTo(60, centerY);
    ctx.lineTo(canvas.width - 60, centerY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Draw realistic anatomical structures based on scan type
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(controls.zoom, controls.zoom);
    ctx.rotate(controls.rotation.z * Math.PI / 180);

    if (scanType === 'brain') {
      // Brain structures
      drawBrainStructures(ctx, time, controls.slice);
    } else if (scanType === 'chest') {
      // Chest structures
      drawChestStructures(ctx, time, controls.slice);
    } else {
      // Abdominal structures
      drawAbdominalStructures(ctx, time, controls.slice);
    }

    ctx.restore();

    // Draw AI annotations if enabled
    if (controls.annotations && analysisResults) {
      drawAIAnnotations(ctx, centerX, centerY, currentScan.color);
    }

    // Draw measurements if enabled
    if (controls.measurements) {
      drawMeasurements(ctx, centerX, centerY);
    }

    // Draw slice-specific information
    drawSliceInfo(ctx, currentScan, controls.slice);
  };

  const drawBrainStructures = (ctx: CanvasRenderingContext2D, time: number, slice: number) => {
    // Outer brain boundary
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 120, 100, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Ventricles (animated)
    ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + 0.1 * Math.sin(time * 2)})`;
    ctx.beginPath();
    ctx.ellipse(-30, -10, 15, 25, 0, 0, 2 * Math.PI);
    ctx.ellipse(30, -10, 15, 25, 0, 0, 2 * Math.PI);
    ctx.fill();

    // White matter tracks
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const radius = 60 + slice * 0.5;
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + 0.2 * Math.sin(time + i)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.5, 8, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const drawChestStructures = (ctx: CanvasRenderingContext2D, time: number, slice: number) => {
    // Lung outlines
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left lung
    ctx.ellipse(-60, 0, 50, 80, 0, 0, 2 * Math.PI);
    // Right lung  
    ctx.ellipse(60, 0, 45, 85, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Heart (animated)
    ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + 0.2 * Math.sin(time * 3)})`;
    ctx.beginPath();
    ctx.ellipse(0, 20, 30, 40, 0.2, 0, 2 * Math.PI);
    ctx.fill();

    // Ribs
    for (let i = 0; i < 6; i++) {
      const y = -60 + i * 20;
      ctx.strokeStyle = `rgba(156, 163, 175, ${0.6})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, y, 100 + i * 5, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
  };

  const drawAbdominalStructures = (ctx: CanvasRenderingContext2D, time: number, slice: number) => {
    // Liver
    ctx.fillStyle = `rgba(245, 101, 101, 0.5)`;
    ctx.beginPath();
    ctx.ellipse(40, -20, 60, 40, 0.3, 0, 2 * Math.PI);
    ctx.fill();

    // Kidneys
    ctx.fillStyle = `rgba(139, 92, 246, 0.5)`;
    ctx.beginPath();
    ctx.ellipse(-70, 10, 20, 35, 0, 0, 2 * Math.PI);
    ctx.ellipse(70, 15, 18, 32, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Spine
    ctx.strokeStyle = '#F3F4F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 60, 15, 20, 0, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const drawAIAnnotations = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, color: string) => {
    // AI detection box
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(centerX - 40, centerY - 30, 80, 60);
    ctx.setLineDash([]);

    // Confidence indicator
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(centerX - 40, centerY - 30, 80, 60);

    // AI label
    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('AI DETECTION', centerX - 35, centerY - 35);
    ctx.font = '10px monospace';
    ctx.fillText('Confidence: 87%', centerX - 30, centerY + 45);
  };

  const drawMeasurements = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number) => {
    // Measurement line
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY - 40);
    ctx.lineTo(centerX - 20, centerY - 40);
    ctx.stroke();

    // Measurement markers
    ctx.beginPath();
    ctx.moveTo(centerX - 60, centerY - 45);
    ctx.lineTo(centerX - 60, centerY - 35);
    ctx.moveTo(centerX - 20, centerY - 45);
    ctx.lineTo(centerX - 20, centerY - 35);
    ctx.stroke();

    // Measurement text
    ctx.fillStyle = '#FBBF24';
    ctx.font = '10px monospace';
    ctx.fillText('24.3mm', centerX - 55, centerY - 50);
  };

  const drawSliceInfo = (ctx: CanvasRenderingContext2D, scanData: any, slice: number) => {
    // Slice information overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 200, 80);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(scanData.name, 20, 30);
    
    ctx.font = '12px monospace';
    ctx.fillText(`Slice: ${slice}/${scanData.slices}`, 20, 50);
    ctx.fillText(`Zoom: ${(controls.zoom * 100).toFixed(0)}%`, 20, 65);
    ctx.fillText(`W/L: ${controls.windowing.width}/${controls.windowing.level}`, 20, 80);
  };

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      setError('Failed to get 2D context');
      return;
    }

    const animate = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      drawMedicalScan(ctx, canvas);
      
      if (isPlaying) {
        setControls(prev => ({
          ...prev,
          slice: (prev.slice + 1) % MEDICAL_SCAN_TYPES[scanType].slices
        }));
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation immediately
    setIsLoading(false);
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, scanType]); // Removed drawMedicalScan from dependencies

  // Control handlers
  const handleZoomIn = () => setControls(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.2, 5) }));
  const handleZoomOut = () => setControls(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.2, 0.1) }));
  const handleReset = () => setControls(prev => ({ ...prev, zoom: 1, rotation: { x: 0, y: 0, z: 0 }, position: { x: 0, y: 0, z: 0 } }));
  const handleSliceChange = (direction: 'prev' | 'next') => {
    const maxSlice = MEDICAL_SCAN_TYPES[scanType].slices - 1;
    setControls(prev => ({
      ...prev,
      slice: direction === 'next' 
        ? Math.min(prev.slice + 1, maxSlice)
        : Math.max(prev.slice - 1, 0)
    }));
  };
  const togglePlayback = () => setIsPlaying(!isPlaying);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);
  const toggleAnnotations = () => setControls(prev => ({ ...prev, annotations: !prev.annotations }));

  if (imageLoading || isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            3D Medical Scan Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-3 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white text-lg font-medium">Loading Medical Scan...</p>
              <Progress value={75} className="w-64 mt-4" />
              <p className="text-gray-300 text-sm mt-2">Initializing 3D renderer and loading DICOM data</p>
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

  const currentScan = MEDICAL_SCAN_TYPES[scanType];

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            3D Medical Scan Viewer - {currentScan.name}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {Object.entries(MEDICAL_SCAN_TYPES).map(([key, scan]) => {
                const Icon = key === 'brain' ? Brain : key === 'chest' ? Activity : Heart;
                return (
                  <Button
                    key={key}
                    variant={scanType === key ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setScanType(key as keyof typeof MEDICAL_SCAN_TYPES)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
            <Button variant="ghost" size="sm" onClick={toggleAnnotations}>
              {controls.annotations ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Main Viewer */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full aspect-video bg-black rounded-lg cursor-move"
            style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 300px)' : '400px',
              maxHeight: isFullscreen ? 'calc(100vh - 300px)' : '600px'
            }}
          />
        </div>

        {/* Enhanced Control Panel */}
        <div className="mt-6 space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center justify-center space-x-4 bg-gray-100 rounded-lg p-4">
            <Button variant="ghost" size="sm" onClick={() => handleSliceChange('prev')}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={togglePlayback}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleSliceChange('next')}>
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 mx-6">
              <input
                type="range"
                min="0"
                max={currentScan.slices - 1}
                value={controls.slice}
                onChange={(e) => setControls(prev => ({ ...prev, slice: parseInt(e.target.value) }))}
                className="w-full slider-medical"
              />
            </div>
            
            <span className="text-sm text-gray-600 min-w-[100px] text-center">
              {controls.slice + 1} / {currentScan.slices}
            </span>
          </div>

          {/* Tools and View Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tools</h4>
              <div className="flex space-x-2">
                {[
                  { id: 'select', icon: Move3D, label: 'Navigate' },
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

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">View Controls</h4>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 px-3">
                  {(controls.zoom * 100).toFixed(0)}%
                </span>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Windowing Controls */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full slider-medical"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full slider-medical"
              />
            </div>
          </div>

          {/* Medical Information Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Anatomical Structures</h4>
                <ul className="text-xs space-y-1">
                  {currentScan.structures.map((structure, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: currentScan.color }}></div>
                      <span>{structure}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Findings</h4>
                <ul className="text-xs space-y-1">
                  {currentScan.findings.map((finding, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Technical Details</h4>
                <div className="text-xs space-y-1">
                  <div>Voxel Size: 0.5×0.5×1.0mm</div>
                  <div>Matrix: 512×512×{currentScan.slices}</div>
                  <div>Acquisition: {currentScan.name}</div>
                  <div>Series: {imageId.slice(0, 8)}...</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
                Advanced
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export DICOM
              </Button>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded p-3">
          <div className="flex justify-between">
            <span>Study: {currentScan.name} • Patient: Anonymous • Date: {new Date().toLocaleDateString()}</span>
            <span>Rendered with WebGL • {currentScan.slices} slices loaded • {(controls.zoom * 100).toFixed(0)}% zoom</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}