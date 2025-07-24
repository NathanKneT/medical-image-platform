'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ImageUpload } from '@/components/ImageUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisList } from '@/components/ui/AnalysisList';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { wsClient } from '@/lib/websocket';
import type { ImageUploadResponse, AnalysisResponse } from '@/lib/api-client';
import { AnalysisProgress } from '@/components/AnalysisProgress';

export default function HomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResponse | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  const { analysis, startAnalysis, progress, isLoading, error, clearError } = useImageAnalysis();

  // This effect for navigation is fine
  useEffect(() => {
    if (analysis?.id) {
      router.push(`/analysis/${analysis.id}`);
    }
  }, [analysis?.id, router]);

  useEffect(() => {
    const handleNewAnalysis = (message: { type: string; data: AnalysisResponse }) => {
      console.log('New analysis message received, updating cache directly:', message.data);
      
      // Use setQueryData to optimistically update the list
      queryClient.setQueryData(['analyses'], (oldData: AnalysisResponse[] | undefined) => {
        const newAnalysis = message.data;
        // If the cache is empty, start a new list
        if (!oldData) {
          return [newAnalysis];
        }
        // Prepend the new analysis to the existing list
        return [newAnalysis, ...oldData];
      });
    };

    if (!wsClient.isConnected) {
        wsClient.connect();
    }
    // Subscribe using the new logic from the previous fix
    wsClient.subscribeToAnalysis('new_analysis_started', handleNewAnalysis);

    return () => {
      wsClient.unsubscribeFromAnalysis('new_analysis_started');
    };
  }, [queryClient]);

  const handleUploadSuccess = (image: ImageUploadResponse) => {
    setUploadedImage(image);
    setSelectedModelId(null);
    clearError();
  };

  const handleStartAnalysis = async () => {
    if (uploadedImage && selectedModelId) {
      await startAnalysis(uploadedImage.id, selectedModelId);
    }
  };

  const isAnalysisRunning = isLoading || (analysis && !['COMPLETE', 'FAILED', 'CANCELLED'].includes(analysis.status));

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          AI-Powered Medical Image Analysis
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Upload medical images for instant AI analysis with real-time progress tracking
          and comprehensive results visualization.
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          1. Upload Medical Image
        </h2>
        <ImageUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => console.error('Upload error:', error)}
        />
      </Card>

      {/* Analysis Section */}
      {uploadedImage && (
        <Card className="p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            2. Start Analysis
          </h2>
          {!isAnalysisRunning ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Image "{uploadedImage.filename}" is ready for analysis.
              </p>
              <ModelSelector
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                disabled={isLoading}
              />
              <div className="flex space-x-4">
                <Button 
                  onClick={handleStartAnalysis} 
                  disabled={!selectedModelId || isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Starting Analysis...' : 'Start Analysis with Selected Model'}
                </Button>
                {analysis?.id && (
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/analysis/${analysis.id}`)}
                  >
                    View Current Analysis
                  </Button>
                )}
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {analysis && (
                <>
                  <AnalysisProgress
                    status={analysis.status}
                    progress={progress}
                    modelName={analysis.model_name || undefined}
                    error={error}
                  />
                  <div className="flex space-x-4">
                    <Button 
                      onClick={() => router.push(`/analysis/${analysis.id}`)}
                      className="flex-1"
                    >
                      View Detailed Analysis
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setUploadedImage(null);
                        setSelectedModelId(null);
                      }}
                    >
                      Start New Analysis
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Quick Analysis Status */}
      {analysis && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Current Analysis
              </h3>
              <p className="text-blue-700">
                Status: {analysis.status} • Progress: {Math.round(progress)}%
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => router.push(`/analysis/${analysis.id}`)}
                size="sm"
              >
                View Details
              </Button>
              {analysis.status === 'COMPLETE' && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Download results logic here
                    console.log('Download results for:', analysis.id);
                  }}
                >
                  Download Results
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Recent Analyses */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Recent Analyses
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['analyses'] })}
          >
            Refresh
          </Button>
        </div>
        <AnalysisList />
      </Card>
    </div>
  );
}