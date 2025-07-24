'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Clock, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import type { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

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
      return response.data as AnalysisResponse[];
    },
  });
  
  // Mutation for deleting an analysis (works for all statuses)
  const deleteMutation = useMutation({
    mutationFn: (analysisId: string) => {
      return api.deleteAnalysisApiV1AnalysisAnalysisIdDelete(analysisId);
    },
    onSuccess: () => {
      toast.success('Analysis has been deleted.');
      // Invalidate the query to refetch the list from the server
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      handleCloseDialog();
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as any)?.detail || 'Failed to delete analysis.';
      toast.error(errorMessage);
      handleCloseDialog();
    },
  });
  
  const handleOpenDialog = (analysisId: string) => {
    setSelectedAnalysisId(analysisId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedAnalysisId(null);
    setIsDialogOpen(false);
  };

  const handleConfirmDelete = () => {
    if (selectedAnalysisId) {
      deleteMutation.mutate(selectedAnalysisId);
    }
  };

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
    <>
      <div className="space-y-4">
        {analyses.map((analysis: AnalysisResponse) => {
          const StatusIcon = statusIcons[analysis.status as keyof typeof statusIcons];

          return (
            <Card key={analysis.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2 mt-4">
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
                        router.push(`/analysis/${analysis.id}`); 
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => handleOpenDialog(analysis.id)}
                      aria-label={`Delete analysis ${analysis.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Analysis"
        message="Are you sure you want to delete this analysis? This action cannot be undone."
        confirmText="Yes, Delete"
        isConfirming={deleteMutation.isPending}
      />
    </>
  );
}