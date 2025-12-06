import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToSupabase } from '@/lib/storage/supabase';
import { validateFileType, validateFileSize } from '@/lib/utils/file-parser';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const jobId = formData.get('jobId') as string;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await prisma.job.findFirst({ where: { id: jobId, userId } });
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    if (files.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 files allowed' }, { status: 400 });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of files) {
      try {
        if (!validateFileType(file.type)) {
          errors.push({ fileName: file.name, error: 'Unsupported file type' });
          continue;
        }
        if (!validateFileSize(file.size, 5)) {
          errors.push({ fileName: file.name, error: 'File size exceeds 5MB' });
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique file name
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '');
        const extension = file.name.split('.').pop();
        const fileName = `${timestamp}-${sanitizedName}.${extension}`;
        const filePath = `${jobId}/${fileName}`; // only jobId folder
        const publicUrl = await uploadToSupabase(buffer, 'resumes', filePath);

        // Save candidate in DB
        const candidate = await prisma.candidate.create({
          data: {
            jobId,
            resumeUrl: publicUrl,
            resumePath: filePath,
            name: sanitizedName,
            processingStatus: 'pending',
            skills: [],
            matchedSkills: [],
            missingSkills: [],
            strengths: [],
            weaknesses: [],
          }
        });

        uploadedFiles.push({
          id: candidate.id,
          fileName: file.name,
          url: publicUrl
        });

      } catch (err: any) {
        console.error(`Error uploading ${file.name}:`, err);
        errors.push({
          fileName: file.name,
          error: err?.message || 'Upload failed'
        });
      }
    }

    await prisma.job.update({
      where: { id: jobId },
      data: { totalCandidates: { increment: uploadedFiles.length } }
    });

    return NextResponse.json({
      success: true,
      uploaded: uploadedFiles.length,
      failed: errors.length,
      files: uploadedFiles,
      errors,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload resumes' }, { status: 500 });
  }
}
