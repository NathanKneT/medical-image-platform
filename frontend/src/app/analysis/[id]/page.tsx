'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Activity,
  Eye,
  Zap,
  Brain,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { MedicalScanViewer } from '@/components/MedicalScanViewer';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { getMedicalImageAnalysisPlatform } from '@/lib/api-client';
import { formatDate, formatDuration, getStatusColor } from '@/lib/utils';
import type { AnalysisResponse, ImageResponse } from '@/lib/api-client';

const api = getMedicalImageAnalysisPlatform();

const statusIcons = {
  PENDING: Clock,
  ANALYZING: Activity,
  COMPLETE: CheckCircle2,
  FAILED: XCircle,
  CANCELLED: AlertCircle,
};

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'viewer'>('overview');

  // Use the image analysis hook for real-time updates
  const { analysis, isLoading, error, progress, cancelAnalysis, retryAnalysis } = useImageAnalysis(analysisId);

  // Fetch image details separately
  const { data: imageData } = useQuery<ImageResponse>({
    queryKey: ['image', analysis?.image_id],
    queryFn: async () => {
      if (!analysis?.image_id) throw new Error('No image ID');
      const response = await api.getImageApiV1ImagesImageIdGet(analysis.image_id);
      return response.data as ImageResponse;
    },
    enabled: !!analysis?.image_id,
  });

  if (isLoading && !analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Not Found</h3>
            <p className="text-gray-600 mb-4">
              The analysis you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) return null;

  const StatusIcon = statusIcons[analysis.status as keyof typeof statusIcons];
  const isProcessing = analysis.status === 'ANALYZING';
  const isComplete = analysis.status === 'COMPLETE';
  const isFailed = analysis.status === 'FAILED' || analysis.status === 'CANCELLED';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'results', label: 'Results', icon: Brain, disabled: !isComplete },
    { id: 'viewer', label: '3D Viewer', icon: Zap, disabled: !isComplete },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Analysis Details
              </h1>
              <p className="text-sm text-gray-500">
                {analysis.image_filename || `Analysis ${analysis.id.slice(0, 8)}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {isComplete && (
              <>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className="mb-6">
          <AnalysisProgress
            status={analysis.status}
            progress={progress}
            modelName={analysis.model_name || undefined}
            error={error}
            onCancel={isProcessing ? cancelAnalysis : undefined}
            onRetry={isFailed ? retryAnalysis : undefined}
          />
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                  disabled={tab.disabled}
                  className={`
                    flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : tab.disabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Analysis Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-primary-600" />
                      Analysis Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Status
                        </h4>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-5 w-5 text-gray-500" />
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                            {analysis.status}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Model Used
                        </h4>
                        <p className="text-sm text-gray-900">
                          {analysis.model_name || 'Unknown Model'} 
                          {analysis.model_version && (
                            <span className="text-gray-500 ml-1">v{analysis.model_version}</span>
                          )}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Created
                        </h4>
                        <p className="text-sm text-gray-900">
                          {formatDate(analysis.created_at)}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Processing Time
                        </h4>
                        <p className="text-sm text-gray-900">
                          {analysis.processing_time_seconds 
                            ? formatDuration(analysis.processing_time_seconds)
                            : 'N/A'
                          }
                        </p>
                      </div>

                      {analysis.confidence_score && (
                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Confidence Score
                          </h4>
                          <div className="flex items-center space-x-3">
                            <Progress value={analysis.confidence_score * 100} className="flex-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {Math.round(analysis.confidence_score * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Image Information */}
                {imageData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Eye className="h-5 w-5 mr-2 text-primary-600" />
                        Image Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Filename
                          </h4>
                          <p className="text-sm text-gray-900 break-all">
                            {imageData.filename}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                            File Size
                          </h4>
                          <p className="text-sm text-gray-900">
                            {(imageData.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        {imageData.width && imageData.height && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Dimensions
                            </h4>
                            <p className="text-sm text-gray-900">
                              {imageData.width} × {imageData.height} pixels
                            </p>
                          </div>
                        )}

                        {imageData.modality && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Modality
                            </h4>
                            <p className="text-sm text-gray-900">
                              {imageData.modality}
                            </p>
                          </div>
                        )}

                        {imageData.description && (
                          <div className="col-span-2">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Description
                            </h4>
                            <p className="text-sm text-gray-900">
                              {imageData.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'results' && isComplete && (
              <ResultsDisplay 
                results={analysis.results}
                confidenceScore={analysis.confidence_score || undefined}
                analysisId={analysis.id}
              />
            )}

            {activeTab === 'viewer' && isComplete && (
              <MedicalScanViewer 
                imageId={analysis.image_id}
                analysisResults={analysis.results}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isComplete && (
                  <>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Results
                    </Button>
                  </>
                )}
                
                {isFailed && (
                  <Button className="w-full" onClick={retryAnalysis}>
                    <Activity className="h-4 w-4 mr-2" />
                    Retry Analysis
                  </Button>
                )}

                {isProcessing && (
                  <Button className="w-full" variant="destructive" onClick={cancelAnalysis}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Analysis
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Key Findings */}
            {isComplete && analysis.results && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-red-500" />
                    Key Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">
                        Normal Structure
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">
                        Minor Artifacts
                      </span>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    </div>

                    {analysis.confidence_score && analysis.confidence_score > 0.9 && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">
                          High Confidence
                        </span>
                        <Zap className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <Card>
                <CardHeader>
                  <CardTitle>Processing Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className={`flex items-center space-x-3 ${progress >= 20 ? 'text-primary-600' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full ${progress >= 20 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                      <span className="text-sm">Preprocessing</span>
                    </div>
                    <div className={`flex items-center space-x-3 ${progress >= 60 ? 'text-primary-600' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full ${progress >= 60 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                      <span className="text-sm">AI Inference</span>
                    </div>
                    <div className={`flex items-center space-x-3 ${progress >= 90 ? 'text-primary-600' : 'text-gray-400'}`}>
                      <div className={`w-3 h-3 rounded-full ${progress >= 90 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                      <span className="text-sm">Post-processing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}