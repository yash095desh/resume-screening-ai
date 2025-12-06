'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadResumesPage() {
  const params = useParams();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [job, setJob] = useState<any>(null);

  // Fetch job details
  useEffect(() => {
    fetch(`/api/jobs/${params.jobId}`)
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((err) => console.error('Error fetching job:', err));
  }, [params.jobId]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
        '.docx',
      ],
      'application/msword': ['.doc'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one resume to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      formData.append('jobId', params?.jobId as string);

      const response = await fetch('/api/uploads/resumes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      toast.success( `${result.uploaded} resumes uploaded successfully. ${
          result.failed > 0 ? `${result.failed} failed.` : ''}`
        );

      setUploadProgress(100);
      
      // Wait a moment before navigating
      setTimeout(() => {
        router.push(`/jobs/${params.jobId}`);
      }, 1000);
    } catch (error: any) {
      toast.error( error.message || 'Failed to upload resumes.');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/jobs/${params.jobId}/process`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();

      toast.info( 'Your resumes are being analyzed. This may take a few minutes.');

      router.push(`/jobs/${params.jobId}`);
    } catch (error: any) {
      toast.error( error.message || 'Failed to process resumes.');
      setProcessing(false);
    }
  };

  useEffect(()=>{
    console.log("JOb ID:",params.jobId)
  },[params.jobId])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload Resumes</h1>
        {job && (
          <p className="mt-2 text-muted-foreground">
            Job: <span className="font-semibold">{job.title}</span>
          </p>
        )}
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Drop Resumes Here</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium">
              {isDragActive
                ? 'Drop the files here...'
                : 'Drag & drop resumes here, or click to browse'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Supports PDF and DOCX files (max 5MB each, up to 500 files)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFile.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/jobs')}
          disabled={uploading || processing}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading || processing}
        >
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {uploading ? 'Uploading...' : 'Upload Resumes'}
        </Button>
      </div>
    </div>
  );
}