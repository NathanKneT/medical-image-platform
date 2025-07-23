'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUpload } from '@/components/ImageUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ImageUploadResponse } from '@/lib/api-client';
import { AnalysisList } from '@/components/ui/AnalysisList';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { ModelSelector } from '@/components/ui/ModelSelector';

export default function HomePage() {
  const router = useRouter();
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResponse | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  
  const { analysis, startAnalysis, progress, isLoading, error, clearError } = useImageAnalysis();

  // Auto-navigate to analysis detail page when analysis starts
  useEffect(() => {
    if (analysis?.id && !currentAnalysisId) {
      setCurrentAnalysisId(analysis.id);
      // Navigate to analysis page after a short delay to ensure state is set
      setTimeout(() => {
        router.push(`/analysis/${analysis.id}`);
      }, 1000);
    }
  }, [analysis?.id, currentAnalysisId, router]);

  const handleUploadSuccess = (image: ImageUploadResponse) => {
    setUploadedImage(image);
    setSelectedModelId(null);
    setCurrentAnalysisId(null);
    if (analysis) {
      clearError();
    }
  };

  const handleStartAnalysis = async () => {
    if (uploadedImage && selectedModelId) {
      try {
        await startAnalysis(uploadedImage.id, selectedModelId);
        // The useEffect above will handle navigation
      } catch (error) {
        console.error('Failed to start analysis:', error);
      }
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
                        setCurrentAnalysisId(null);
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
            onClick={() => {
              // Refresh the analyses list
              window.location.reload();
            }}
          >
            Refresh
          </Button>
        </div>
        <AnalysisList />
      </Card>
    </div>
  );
}