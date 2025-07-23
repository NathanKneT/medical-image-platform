'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ImageUploadResponse } from '@/lib/api-client';
import { AnalysisList } from '@/components/ui/AnalysisList';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { ModelSelector } from '@/components/ui/ModelSelector'; // Import the new component

export default function HomePage() {
  const [uploadedImage, setUploadedImage] = useState<ImageUploadResponse | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { analysis, startAnalysis, progress, isLoading, error, clearError } = useImageAnalysis();

  const handleUploadSuccess = (image: ImageUploadResponse) => {
    setUploadedImage(image);
    setSelectedModelId(null); // Reset model selection on new upload
    if (analysis) {
      clearError();
    }
  };

  const handleStartAnalysis = () => {
    if (uploadedImage && selectedModelId) {
      startAnalysis(uploadedImage.id, selectedModelId);
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
                Image "{uploadedImage.filename}" is ready.
              </p>
              <ModelSelector
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                disabled={isLoading}
              />
              <Button onClick={handleStartAnalysis} disabled={!selectedModelId || isLoading}>
                {isLoading ? 'Starting...' : 'Start Analysis with Selected Model'}
              </Button>
               {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
          ) : (
            analysis && (
              <AnalysisProgress
                status={analysis.status}
                progress={progress}
                modelName={analysis.model_name || 'Selected Model'}
                error={error}
              />
            )
          )}
        </Card>
      )}

      {/* Recent Analyses */}
      <Card className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Recent Analyses
        </h2>
        <AnalysisList />
      </Card>
    </div>
  );
}