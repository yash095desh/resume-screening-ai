'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText, X, Loader2, Paperclip, Upload } from 'lucide-react';

export interface AttachmentMeta {
  filename: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

interface StepAttachmentsProps {
  attachments: AttachmentMeta[];
  onChange: (attachments: AttachmentMeta[]) => void;
  sequenceId?: string;
  stepNumber?: number;
  maxFiles?: number;
  maxFileSizeMB?: number;
  maxTotalSizeMB?: number;
}

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  return '📎';
}

export function StepAttachments({
  attachments,
  onChange,
  sequenceId,
  stepNumber,
  maxFiles = 3,
  maxFileSizeMB = 5,
  maxTotalSizeMB = 10,
}: StepAttachmentsProps) {
  const [uploading, setUploading] = useState(false);

  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
  const canAdd = attachments.length < maxFiles;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // Check how many more we can accept
      const slotsLeft = maxFiles - attachments.length;
      if (slotsLeft <= 0) {
        toast.error(`Maximum ${maxFiles} attachments allowed`);
        return;
      }

      const filesToUpload = acceptedFiles.slice(0, slotsLeft);
      if (filesToUpload.length < acceptedFiles.length) {
        toast.warning(`Only ${slotsLeft} more file(s) allowed, skipping the rest`);
      }

      // Validate each file
      for (const file of filesToUpload) {
        if (!ALLOWED_TYPES[file.type]) {
          toast.error(`${file.name}: Unsupported type. Use PDF, DOC, DOCX, XLS, XLSX, PNG, or JPG`);
          return;
        }
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          toast.error(`${file.name}: Exceeds ${maxFileSizeMB}MB limit`);
          return;
        }
      }

      // Check total size
      const newTotalSize = totalSize + filesToUpload.reduce((s, f) => s + f.size, 0);
      if (newTotalSize > maxTotalSizeMB * 1024 * 1024) {
        toast.error(`Total attachments would exceed ${maxTotalSizeMB}MB limit`);
        return;
      }

      // Upload
      setUploading(true);
      try {
        const formData = new FormData();
        filesToUpload.forEach((f) => formData.append('files', f));
        if (sequenceId) formData.append('sequenceId', sequenceId);
        if (stepNumber !== undefined) formData.append('stepNumber', String(stepNumber));

        const res = await fetch('/api/uploads/attachments', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await res.json();

        if (data.errors?.length > 0) {
          data.errors.forEach((err: { fileName: string; error: string }) => {
            toast.error(`${err.fileName}: ${err.error}`);
          });
        }

        if (data.files?.length > 0) {
          onChange([...attachments, ...data.files]);
          toast.success(`${data.files.length} file(s) uploaded`);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to upload attachments');
      } finally {
        setUploading(false);
      }
    },
    [attachments, onChange, sequenceId, stepNumber, maxFiles, maxFileSizeMB, maxTotalSizeMB, totalSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading || !canAdd,
    accept: Object.keys(ALLOWED_TYPES).reduce(
      (acc, mime) => ({ ...acc, [mime]: [] }),
      {} as Record<string, string[]>
    ),
    maxFiles: maxFiles - attachments.length,
    multiple: true,
  });

  function handleRemove(index: number) {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Attachments ({attachments.length}/{maxFiles})
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {formatFileSize(totalSize)} / {maxTotalSizeMB} MB
        </span>
      </div>

      {/* Existing attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att, index) => (
            <div
              key={att.path}
              className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <span className="text-base">{getFileIcon(att.mimeType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.filename}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(att.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      {canAdd && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          ) : isDragActive ? (
            <p className="text-sm text-primary">Drop files here</p>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, XLS, XLSX, PNG, JPG — max {maxFileSizeMB}MB each
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
