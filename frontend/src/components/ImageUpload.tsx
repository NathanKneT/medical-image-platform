'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useImageUpload } from '@/hooks/useImageUpload';
import { formatFileSize } from '@/lib/utils';
import type { ImageUploadResponse } from '@/lib/api-client';

interface ImageUploadProps {
  onUploadSuccess: (image: ImageUploadResponse) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const DEFAULT_ALLOWED_TYPES = ['.jpg', '.jpeg', '.png', '.dcm', '.nii'];

export function ImageUpload({
  onUploadSuccess,
  onUploadError,
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  className = '',
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [patientId, setPatientId] = useState('');
  
  const { uploadImage, isUploading, error, reset } = useImageUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      reset(); // Clear any previous errors
    }
  }, [reset]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': allowedTypes,
      'application/dicom': ['.dcm'],
      'application/octet-stream': ['.nii'],
    },
    maxSize: maxFileSize,
    multiple: false,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadImage(selectedFile, {
        description: description || undefined,
        patientId: patientId || undefined,
        userId: 'demo-user', // In production, get from auth context
      });

      onUploadSuccess(result);
      
      // Reset form
      setSelectedFile(null);
      setDescription('');
      setPatientId('');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError(errorMessage);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    reset();
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? 'border-primary-500 bg-primary-50 scale-105' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} />

        {!selectedFile ? (
          <>
            <Upload 
              className={`mx-auto h-12 w-12 mb-4 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} 
            />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your medical image here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports: {allowedTypes.join(', ')} • Max size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <FileImage className="h-8 w-8 text-primary-500" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <Progress value={85} className="w-full" />
                <p className="text-sm text-gray-600">
                  Uploading...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Rejection Errors */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">File rejected</h3>
              <div className="mt-2 text-sm text-red-700">
                {fileRejections[0].errors.map((error) => (
                  <p key={error.code}>{error.message}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {selectedFile && !isUploading && (
        <div className="mt-6 space-y-4 px-8 pb-8">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
              placeholder="Add any relevant details about this image..."
            />
          </div>

          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-1">
              Patient ID (Optional)
            </label>
            <input
              id="patientId"
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Anonymous patient identifier..."
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading}
            isLoading={isUploading}
            className="w-full"
          >
            {isUploading ? 'Uploading...' : 'Upload Image'}
          </Button>
        </div>
      )}
    </Card>
  );
}