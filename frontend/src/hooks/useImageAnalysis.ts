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
  const [isStarting, setIsStarting] = useState(false);

  const queryClient = useQueryClient();
  const currentAnalysisId = useRef<string | null>(analysisId || null);
  const retryParams = useRef<AnalysisRequest | null>(null);

  // Query for analysis data with more aggressive polling during active states
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
      if (data?.status && !['COMPLETE', 'FAILED', 'CANCELLED'].includes(data.status)) {
        return 2000; // Poll every 2 seconds during active analysis
      }
      return false;
    },
    // Retry failed requests more aggressively
    retry: 3,
    retryDelay: 1000,
  });

  // Handle WebSocket analysis updates with better error handling
  const handleAnalysisUpdate = useCallback(
    (data: any) => {
      console.log('📊 Analysis update received:', data);

      try {
        if (typeof data.progress === 'number') {
          setProgress(data.progress);
        }

        if (data.status) {
          // Invalidate the specific analysis to get the latest data
          queryClient.invalidateQueries({ queryKey: ['analysis', currentAnalysisId.current] });
          queryClient.invalidateQueries({ queryKey: ['analyses'] });

          if (data.status === 'COMPLETE') {
            toast.success('Analysis completed successfully!');
            setProgress(100);
          } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
            toast.error(`Analysis ${data.status.toLowerCase()}`);
            setProgress(0);
          }
        }
      } catch (updateError) {
        console.error('Error handling analysis update:', updateError);
      }
    },
    [queryClient] 
  );

  // Start analysis mutation with better state management
  const startAnalysisMutation = useMutation<
    AnalysisStartResponse,
    AxiosError,
    AnalysisRequest
  >({
    mutationFn: async (request: AnalysisRequest) => {
      setIsStarting(true);
      const response = await api.startAnalysisApiV1AnalysisStartPost(request);
      return response.data as AnalysisStartResponse;
    },
    onSuccess: (data) => {
      setIsStarting(false);
      currentAnalysisId.current = data.analysis_id;
      retryParams.current = null;

      // Connect WebSocket immediately
      if (!wsClient.isConnected) {
        wsClient.connect().catch(console.error);
      }

      // Subscribe to analysis updates
      wsClient.subscribeToAnalysis(data.analysis_id, handleAnalysisUpdate);

      // Set initial progress and clear errors
      setProgress(0);
      setError(null);
      
      toast.success('Analysis started successfully!');

      // Invalidate and refetch queries immediately
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      
      // Force refetch the specific analysis after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['analysis', data.analysis_id] });
      }, 500);
    },
    onError: (error: any) => {
      setIsStarting(false);
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
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
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

  // Sync error state with analysis
  useEffect(() => {
    if (analysis?.error_message && analysis.status === 'FAILED') {
      setError(analysis.error_message);
    }
  }, [analysis?.error_message, analysis?.status]);

  return {
    analysis: analysis ?? null,
    isLoading: isLoading || startAnalysisMutation.isPending || isStarting,
    error,
    progress,
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    clearError,
  };
}