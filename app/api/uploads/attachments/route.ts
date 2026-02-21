import { NextResponse } from 'next/server';
import { uploadToSupabase } from '@/lib/storage/supabase';
import { auth } from '@/lib/auth/server';

// Constants
const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_TOTAL_SIZE_MB = 10;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
};

interface AttachmentResult {
  filename: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

interface UploadError {
  fileName: string;
  error: string;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const sequenceId = formData.get('sequenceId') as string;
    const stepNumber = formData.get('stepNumber') as string;

    // Validate inputs
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} attachments allowed per step` },
        { status: 400 }
      );
    }

    // Check total size across all files
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Total attachment size exceeds ${MAX_TOTAL_SIZE_MB}MB limit` },
        { status: 400 }
      );
    }

    const uploaded: AttachmentResult[] = [];
    const errors: UploadError[] = [];

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES[file.type]) {
        errors.push({
          fileName: file.name,
          error: 'Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG',
        });
        continue;
      }

      // Validate individual file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push({
          fileName: file.name,
          error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
        });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique file path
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const sanitizedName = file.name
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9.-]/g, '')
          .replace(/\.[^/.]+$/, '');
        const extension = ALLOWED_MIME_TYPES[file.type];
        const fileName = `${timestamp}-${randomSuffix}-${sanitizedName}.${extension}`;

        // Path: userId/sequenceId/stepNumber/filename (or userId/inbox/filename for replies)
        const folder = sequenceId && stepNumber
          ? `${userId}/${sequenceId}/step-${stepNumber}`
          : `${userId}/inbox`;
        const filePath = `${folder}/${fileName}`;

        const publicUrl = await uploadToSupabase(buffer, 'attachments', filePath);

        uploaded.push({
          filename: file.name,
          url: publicUrl,
          path: filePath,
          size: file.size,
          mimeType: file.type,
        });
      } catch (err: any) {
        console.error(`Error uploading attachment ${file.name}:`, err);
        errors.push({
          fileName: file.name,
          error: err?.message || 'Upload failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      uploaded: uploaded.length,
      failed: errors.length,
      files: uploaded,
      errors,
    });
  } catch (error: any) {
    console.error('Attachment upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload attachments' },
      { status: 500 }
    );
  }
}
