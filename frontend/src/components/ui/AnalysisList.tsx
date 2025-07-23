'use client';

import { useQuery } from '@tanstack/react-query';
import { Eye, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { AxiosError } from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMedicalImageAnalysisPlatform } from '@/lib/api-client';
import { formatDate, getStatusColor } from '@/lib/utils';
import type { AnalysisResponse } from '@/lib/api-client';

const api = getMedicalImageAnalysisPlatform();

const statusIcons = {
  PENDING: Clock,
  ANALYZING: Clock,
  COMPLETE: CheckCircle2,
  FAILED: XCircle,
  CANCELLED: AlertCircle,
};

export function AnalysisList() {
  const {
    data: analyses,
    isLoading,
    error,
  } = useQuery<AnalysisResponse[], AxiosError>({
    queryKey: ['analyses'],
    queryFn: async () => {
      const response = await api.listAnalysesApiV1AnalysisGet({
        skip: 0,
        limit: 10,
      });
      return response.data as AnalysisResponse[]; // Need to fix assertions it
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load analyses</p>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No analyses yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload an image to start your first analysis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* With the fix, `analyses` is correctly typed as an array, so .map and its parameter are valid. */}
      {analyses.map((analysis: AnalysisResponse) => {
        const StatusIcon = statusIcons[analysis.status as keyof typeof statusIcons];

        return (
          <Card key={analysis.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <StatusIcon className="h-5 w-5 text-gray-500" />
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        analysis.status
                      )}`}
                    >
                      {analysis.status}
                    </span>
                    {analysis.model_name && (
                      <span className="text-sm text-gray-500">
                        {analysis.model_name} v{analysis.model_version}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-900 font-medium mb-1">
                    {analysis.image_filename || `Analysis ${analysis.id.slice(0, 8)}`}
                  </p>

                  <p className="text-xs text-gray-500">
                    Started {formatDate(analysis.created_at)}
                    {analysis.processing_time_seconds && (
                      <span> • Completed in {Math.round(analysis.processing_time_seconds)}s</span>
                    )}
                    {analysis.confidence_score && (
                      <span> • {Math.round(analysis.confidence_score * 100)}% confidence</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to analysis details page
                      window.location.href = `/analysis/${analysis.id}`;
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}