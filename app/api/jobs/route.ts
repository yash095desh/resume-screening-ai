import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractJDRequirements } from '@/lib/ai/parser';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Extract JD requirements using AI
    const requirements = await extractJDRequirements(description);

    // Create job in database
    const job = await prisma.job.create({
      data: {
        userId,
        title,
        description,
        requiredSkills: requirements.requiredSkills,
        experienceRequired: requirements.experienceRequired,
        qualifications: requirements.qualifications,
        status: 'draft',
      },
    });

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}