import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { getMedicalImageAnalysisPlatform } from '@/lib/api-client';
import { wsClient } from '@/lib/websocket';
import type {
  AnalysisResponse,
  AnalysisRequest,
  AnalysisStartResponse,
} from '@/lib/api-client';

const api = getMedicalImageAnalysisPlatform();

export interface UseImageAnalysisReturn {
  analysis: AnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  startAnalysis: (imageId: string, modelId: string, userId?: string) => Promise<void>;
  cancelAnalysis: () => Promise<void>;
  retryAnalysis: () => Promise<void>;
  clearError: () => void;
}

export function useImageAnalysis(analysisId?: string): UseImageAnalysisReturn {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const queryClient = useQueryClient();
  const currentAnalysisId = useRef<string | null>(analysisId || null);
  const retryParams = useRef<AnalysisRequest | null>(null);

  // Query for analysis data
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['analysis', currentAnalysisId.current],
    queryFn: async () => {
      if (!currentAnalysisId.current) return null;
      const response = await api.getAnalysisResultApiV1AnalysisAnalysisIdGet(currentAnalysisId.current);
      return response.data as AnalysisResponse;
    },
    enabled: !!currentAnalysisId.current,
    refetchInterval: (query: Query<AnalysisResponse | null>) => {
      const data = query.state.data;
      return data?.status && !['COMPLETE', 'FAILED', 'CANCELLED'].includes(data.status)
        ? 5000
        : false;
    },
  });

  // Handle WebSocket analysis updates
  const handleAnalysisUpdate = useCallback(
    (data: any) => {
      console.log('📊 Analysis update received:', data);

      if (typeof data.progress === 'number') {
        setProgress(data.progress);
      }

      if (data.error) {
        setError(data.error);
        toast.error(data.error);
      }

      if (data.status) {
        queryClient.invalidateQueries({ queryKey: ['analysis', currentAnalysisId.current] });

        if (data.status === 'COMPLETE') {
          toast.success('Analysis completed successfully!');
          setProgress(100);
        } else if (data.status === 'FAILED') {
          toast.error('Analysis failed');
          setProgress(0);
        }
      }
    },
    [queryClient]
  );

  // Start analysis mutation
  const startAnalysisMutation = useMutation<
    AnalysisStartResponse,
    AxiosError,
    AnalysisRequest
  >({
    mutationFn: async (request: AnalysisRequest) => {
      const response = await api.startAnalysisApiV1AnalysisStartPost(request);
      return response.data as AnalysisStartResponse;
    },
    onSuccess: (data) => {
      currentAnalysisId.current = data.analysis_id;
      retryParams.current = null;

      if (!wsClient.isConnected) {
        wsClient.connect().catch(console.error);
      }

      wsClient.subscribeToAnalysis(data.analysis_id, handleAnalysisUpdate);

      toast.success('Analysis started successfully!');
      setError(null);
      setProgress(0);

      queryClient.invalidateQueries({ queryKey: ['analysis'] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.detail || error.message || 'Failed to start analysis';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Cancel analysis mutation
  const cancelAnalysisMutation = useMutation<unknown, AxiosError, void>({
    mutationFn: async () => {
      if (!currentAnalysisId.current) throw new Error('No analysis to cancel');
      await api.cancelAnalysisApiV1AnalysisAnalysisIdDelete(currentAnalysisId.current);
    },
    onSuccess: () => {
      if (currentAnalysisId.current) {
        wsClient.unsubscribeFromAnalysis(currentAnalysisId.current);
      }
      setProgress(0);
      toast.success('Analysis cancelled');

      queryClient.invalidateQueries({ queryKey: ['analysis', currentAnalysisId.current] });
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.detail || error.message || 'Failed to cancel analysis';
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  // Public interface functions
  const startAnalysis = useCallback(
    async (imageId: string, modelId: string, userId?: string) => {
      const request: AnalysisRequest = {
        image_id: imageId,
        model_id: modelId,
        user_id: userId,
      };

      retryParams.current = request;
      await startAnalysisMutation.mutateAsync(request);
    },
    [startAnalysisMutation]
  );

  const cancelAnalysis = useCallback(async () => {
    await cancelAnalysisMutation.mutateAsync();
  }, [cancelAnalysisMutation]);

  const retryAnalysis = useCallback(async () => {
    if (!retryParams.current) {
      throw new Error('No analysis parameters to retry');
    }
    await startAnalysisMutation.mutateAsync(retryParams.current);
  }, [startAnalysisMutation]);

  const clearError = useCallback(() => {
    setError(null);
    startAnalysisMutation.reset();
    cancelAnalysisMutation.reset();
  }, [startAnalysisMutation, cancelAnalysisMutation]);

  // Load existing analysis on mount if analysisId provided
  useEffect(() => {
    if (analysisId && analysisId !== currentAnalysisId.current) {
      currentAnalysisId.current = analysisId;

      if (analysis && !['COMPLETE', 'FAILED', 'CANCELLED'].includes(analysis.status)) {
        wsClient
          .connect()
          .then(() => {
            wsClient.subscribeToAnalysis(analysisId, handleAnalysisUpdate);
          })
          .catch(console.error);
      }
    }
  }, [analysisId, analysis, handleAnalysisUpdate]);

  // Cleanup WebSocket subscription on unmount
  useEffect(() => {
    return () => {
      if (currentAnalysisId.current) {
        wsClient.unsubscribeFromAnalysis(currentAnalysisId.current);
      }
    };
  }, []);

  // Update progress from analysis data
  useEffect(() => {
    if (analysis?.progress_percentage !== undefined) {
      setProgress(analysis.progress_percentage);
    }
  }, [analysis?.progress_percentage]);

  return {
    analysis: analysis ?? null,
    isLoading: isLoading || startAnalysisMutation.isPending,
    error,
    progress,
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    clearError,
  };
}