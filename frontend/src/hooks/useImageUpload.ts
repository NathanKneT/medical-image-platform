import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';
import { getMedicalImageAnalysisPlatform } from '@/lib/api-client';
import type {
  ImageUploadResponse,
  BodyUploadImageApiV1ImagesUploadPost,
  UploadImageApiV1ImagesUploadPostParams,
} from '@/lib/api-client';

const api = getMedicalImageAnalysisPlatform();

export interface UseImageUploadReturn {
  uploadImage: (
    file: File,
    options?: {
      description?: string;
      patientId?: string;
      userId?: string;
    }
  ) => Promise<ImageUploadResponse>;
  isUploading: boolean;
  error: string | null;
  progress: number;
  reset: () => void;
}

// Define the type for the mutation variables for clarity
type UploadImageVariables = {
  file: File;
  description?: string;
  patientId?: string;
  userId?: string;
};

export function useImageUpload(): UseImageUploadReturn {
  const queryClient = useQueryClient();

  // Provide explicit generic types to useMutation
  const mutation = useMutation<
    ImageUploadResponse,
    AxiosError,
    UploadImageVariables
  >({
    mutationFn: async ({ file, description, patientId, userId }) => {
      const body: BodyUploadImageApiV1ImagesUploadPost = { file };
      const params: UploadImageApiV1ImagesUploadPostParams = {
        description: description || undefined,
        patient_id: patientId || undefined,
        user_id: userId || undefined,
      };

      const response = await api.uploadImageApiV1ImagesUploadPost(body, params);

      // FIX: Use a type assertion to definitively tell TypeScript the shape of the data.
      // This resolves the "Type 'T' is not assignable to type 'ImageUploadResponse'" error.
      return response.data as ImageUploadResponse;
    },
    onSuccess: (data) => {
      // `data` is now guaranteed to be ImageUploadResponse
      toast.success(`Image "${data.filename}" uploaded successfully!`);

      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
    onError: (error) => {
      const errorMessage =
        (error.response?.data as any)?.detail || error.message || 'Upload failed';
      toast.error(errorMessage);
    },
  });

  const uploadImage = async (
    file: File,
    options: {
      description?: string;
      patientId?: string;
      userId?: string;
    } = {}
  ): Promise<ImageUploadResponse> => {
    return mutation.mutateAsync({
      file,
      description: options.description,
      patientId: options.patientId,
      userId: options.userId,
    });
  };

  return {
    uploadImage,
    isUploading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
    progress: 0,
    reset: mutation.reset,
  };
}