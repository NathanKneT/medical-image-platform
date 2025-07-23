'use client';

import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { AnalysisStatus } from '@/lib/api-client';

interface AnalysisProgressProps {
  status: AnalysisStatus;
  progress: number;
  modelName?: string;
  estimatedTime?: number;
  error?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Pending',
    description: 'Analysis queued and waiting to start'
  },
  ANALYZING: {
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Analyzing',
    description: 'AI model processing your image'
  },
  COMPLETE: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Complete',
    description: 'Analysis finished successfully'
  },
  FAILED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Failed',
    description: 'Analysis encountered an error'
  },
  CANCELLED: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Cancelled',
    description: 'Analysis was cancelled by user'
  }
};

export function AnalysisProgress({
  status,
  progress,
  modelName,
  estimatedTime,
  error,
  onCancel,
  onRetry,
  className = ''
}: AnalysisProgressProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isProcessing = status === 'ANALYZING';
  const isComplete = status === 'COMPLETE';
  const isFailed = status === 'FAILED' || status === 'CANCELLED';
  const canCancel = (status === 'PENDING' || status === 'ANALYZING') && onCancel;
  const canRetry = (status === 'FAILED') && onRetry;

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTimeRemaining = (): number | null => {
    if (!estimatedTime || progress <= 0 || progress >= 100) return null;
    const progressRatio = progress / 100;
    const elapsedTime = estimatedTime * progressRatio;
    return Math.max(0, Math.round(estimatedTime - elapsedTime));
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mt-4">
          {/* Status Icon */}
          <div className={`flex-shrink-0 ${config.color}`}>
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Icon className="h-6 w-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {config.label}
              </h3>
              
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-gray-500 hover:text-red-600"
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">
              {config.description}
              {modelName && ` using ${modelName}`}
            </p>

            {/* Progress Bar (for processing status) */}
            {isProcessing && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
                {timeRemaining && (
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated time remaining: {formatTimeRemaining(timeRemaining)}
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && isFailed && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            {canRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Retry Analysis
              </Button>
            )}

            {/* Success Indicator */}
            {isComplete && (
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Analysis completed successfully!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Processing Steps (for analyzing status) */}
        {isProcessing && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-6 text-sm">
              <div className={`flex items-center space-x-2 ${progress >= 20 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 20 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <span>Preprocessing</span>
              </div>
              <div className={`flex items-center space-x-2 ${progress >= 60 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 60 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <span>Inference</span>
              </div>
              <div className={`flex items-center space-x-2 ${progress >= 90 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 90 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <span>Post-processing</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}