"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Shield,
  Clock,
  Database
} from "lucide-react";
import { apiClient } from "@/lib/api";

interface DocumentUploadProps {
  onUploadComplete?: (documentId: string, analysisId: string) => void;
  onError?: (error: string) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  analysisId?: string;
  error?: string;
}

export function DocumentUpload({ 
  onUploadComplete, 
  onError,
  maxFileSize = 50,
  acceptedTypes = ['.pdf', '.docx', '.doc', '.txt']
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    // Process each file
    for (const uploadFile of newFiles) {
      try {
        await processFile(uploadFile);
      } catch (error) {
        console.error('Upload error:', error);
        updateFileStatus(uploadFile.id, 'error', 0, undefined, error instanceof Error ? error.message : 'Upload failed');
      }
    }

    setIsUploading(false);
  }, []);

  const processFile = async (uploadFile: UploadedFile) => {
    try {
      // Step 1: Request upload URL
      updateFileStatus(uploadFile.id, 'uploading', 15);
      const uploadInit = await apiClient.createDocumentUpload(uploadFile.file);

      if (!uploadInit.success || !uploadInit.data) {
        throw new Error(uploadInit.error || 'Failed to create upload');
      }

      const { documentId, uploadUrl, s3Key } = uploadInit.data;

      // Step 2: Upload file to storage
      updateFileStatus(uploadFile.id, 'uploading', 60);
      await apiClient.uploadFileToSignedUrl(uploadUrl, uploadFile.file);

      // Step 3: Trigger analysis
      updateFileStatus(uploadFile.id, 'analyzing', 80);
      const analysisResponse = await apiClient.startDocumentAnalysis({
        documentId,
        filename: uploadFile.file.name,
        s3Key,
      });

      if (!analysisResponse.success || !analysisResponse.data) {
        throw new Error(analysisResponse.error || 'Analysis failed to start');
      }

      const analysisId = analysisResponse.data.analysisId;
      updateFileStatus(uploadFile.id, 'analyzing', 90, analysisId);

      // Step 4: Poll for completion (simple single check)
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const status = await apiClient.getAnalysisStatus(analysisId);
        const statusPayload = status.data as any;
        const statusValue = statusPayload?.status ?? statusPayload?.data?.status;
        const statusError = statusPayload?.error || statusPayload?.data?.error;
        if (!status.success || statusValue === 'failed') {
          throw new Error(statusError || 'Analysis failed');
        }
      } catch (statusError) {
        updateFileStatus(uploadFile.id, 'error', 100, analysisId, statusError instanceof Error ? statusError.message : 'Analysis failed');
        throw statusError;
      }

      updateFileStatus(uploadFile.id, 'completed', 100, analysisId);
      onUploadComplete?.(documentId, analysisId);
      
    } catch (error) {
      console.error('Upload/analysis error:', error);
      throw error;
    }
  };

  const updateFileStatus = (
    id: string, 
    status: UploadedFile['status'], 
    progress: number, 
    analysisId?: string,
    error?: string
  ) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === id 
        ? { ...file, status, progress, analysisId, error }
        : file
    ));
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: maxFileSize * 1024 * 1024,
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(rejection => 
        `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
      );
      onError?.(errors.join('\n'));
    }
  });

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'analyzing':
        return <Shield className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'analyzing':
        return 'Analyzing compliance...';
      case 'completed':
        return 'Analysis complete';
      case 'error':
        return 'Upload failed';
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-100 text-blue-700';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Document Upload & Analysis
        </CardTitle>
        <CardDescription>
          Upload financial documents for AI-powered compliance analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop files here' : 'Upload documents'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag & drop files or click to browse
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {acceptedTypes.map(type => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Maximum file size: {maxFileSize}MB
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Uploaded Documents ({uploadedFiles.length})
            </h4>
            <div className="space-y-2">
              {uploadedFiles.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(uploadFile.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(uploadFile.status)}`}
                      >
                        {getStatusText(uploadFile.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB</span>
                      {uploadFile.status === 'completed' && uploadFile.analysisId && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Analysis ID: {uploadFile.analysisId}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {(uploadFile.status === 'uploading' || uploadFile.status === 'analyzing') && (
                      <Progress value={uploadFile.progress} className="mt-2 h-1" />
                    )}
                    
                    {uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadFile.id)}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Status */}
        {isUploading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            Processing documents...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
