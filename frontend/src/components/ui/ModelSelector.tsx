'use client';

import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getMedicalImageAnalysisPlatform } from '@/lib/api-client';
import type { AIModel } from '@/types/analysis';
import { AlertCircle } from 'lucide-react';

const api = getMedicalImageAnalysisPlatform();

interface ModelSelectorProps {
  selectedModelId: string | null;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModelId,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const {
    data: models,
    isLoading,
    error,
  } = useQuery<AIModel[], AxiosError>({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const response = await api.listAiModelsApiV1AnalysisModelsGet({ active_only: true });
      // FIX: Use a double cast to 'unknown' first.
      // This tells TypeScript that we are intentionally overriding the generic type and are confident
      // that the API response will match our specific AIModel interface.
      return response.data as unknown as AIModel[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div>
        <label htmlFor="model-selector" className="block text-sm font-medium text-gray-700 mb-1">
          Select AI Model
        </label>
        <div className="w-full h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        Could not load AI models.
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        No active AI models available.
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="model-selector" className="block text-sm font-medium text-gray-700 mb-1">
        Select AI Model
      </label>
      <select
        id="model-selector"
        value={selectedModelId || ''}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled || isLoading}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="" disabled>
          -- Choose a model --
        </option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} (v{model.version})
          </option>
        ))}
      </select>
    </div>
  );
}