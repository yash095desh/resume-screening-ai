import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToSupabase } from '@/lib/storage/supabase';
import { validateFileType, validateFileSize } from '@/lib/utils/file-parser';
import { auth } from '@/lib/auth/server';

// Constants
const MAX_FILES = 500;
const MAX_FILE_SIZE_MB = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Types
interface UploadResult {
  id: string;
  fileName: string;
  url: string;
}

interface UploadError {
  fileName: string;
  error: string;
}

/**
 * Retry helper for transient failures
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) throw error;

      // Only retry on network/transient errors
      const isRetryable = error?.message?.includes('network') ||
                         error?.message?.includes('timeout') ||
                         error?.message?.includes('ECONNRESET');

      if (!isRetryable) throw error;

      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Process single file upload (parallel-safe)
 */
async function processFileUpload(
  file: File,
  jobId: string
): Promise<{ success: true; data: UploadResult } | { success: false; error: UploadError }> {
  try {
    // Validate file type
    if (!validateFileType(file.type)) {
      return {
        success: false,
        error: { fileName: file.name, error: 'Unsupported file type. Use PDF, DOC, or DOCX' }
      };
    }

    // Validate file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE_MB)) {
      return {
        success: false,
        error: { fileName: file.name, error: `File size exceeds ${MAX_FILE_SIZE_MB}MB` }
      };
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique file path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .replace(/\.[^/.]+$/, '');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `${timestamp}-${randomSuffix}-${sanitizedName}.${extension}`;
    const filePath = `${jobId}/${fileName}`;

    // Upload to Supabase with retry
    const publicUrl = await retryOperation(() =>
      uploadToSupabase(buffer, 'resumes', filePath)
    );

    // Create candidate record (with retry for DB transient issues)
    const candidate = await retryOperation(() =>
      prisma.candidate.create({
        data: {
          jobId,
          resumeUrl: publicUrl,
          resumePath: filePath,
          name: sanitizedName || 'Unknown',
          processingStatus: 'pending',
          skills: [],
          matchedSkills: [],
          missingSkills: [],
          strengths: [],
          weaknesses: [],
        },
      })
    );

    return {
      success: true,
      data: {
        id: candidate.id,
        fileName: file.name,
        url: publicUrl,
      }
    };

  } catch (err: any) {
    console.error(`Error uploading ${file.name}:`, err);
    return {
      success: false,
      error: {
        fileName: file.name,
        error: err?.message || 'Upload failed',
      }
    };
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const jobId = formData.get('jobId') as string;

    // Validate inputs
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    // Verify job ownership
    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    console.log(`Starting parallel upload of ${files.length} files for job ${jobId}`);
    const startTime = Date.now();

    // Process all files in parallel using Promise.allSettled
    const results = await Promise.allSettled(
      files.map(file => processFileUpload(file, jobId))
    );

    // Separate successes and failures
    const uploadedFiles: UploadResult[] = [];
    const errors: UploadError[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          uploadedFiles.push(result.value.data);
        } else {
          errors.push(result.value.error);
        }
      } else {
        // Promise rejected (shouldn't happen with our error handling, but just in case)
        errors.push({
          fileName: files[index].name,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Update job total candidates count
    if (uploadedFiles.length > 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: { totalCandidates: { increment: uploadedFiles.length } },
      });
    }

    const duration = Date.now() - startTime;
    console.log(
      `Upload completed: ${uploadedFiles.length} succeeded, ${errors.length} failed in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles.length,
      failed: errors.length,
      duration: `${(duration / 1000).toFixed(2)}s`,
      files: uploadedFiles,
      errors,
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload resumes' },
      { status: 500 }
    );
  }
}
