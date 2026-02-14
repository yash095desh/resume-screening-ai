import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth } from '@/lib/auth/server';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, format } = await req.json();

    if (!jobId || !format) {
      return NextResponse.json(
        { error: 'Job ID and format are required' },
        { status: 400 }
      );
    }

    // Get job with candidates
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        userId,
      },
      include: {
        candidates: {
          where: {
            processingStatus: 'completed',
          },
          orderBy: {
            matchScore: 'desc',
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (format === 'csv') {
      // Export as CSV
      const csvData = job.candidates.map((candidate) => ({
        Name: candidate.name,
        Email: candidate.email || 'N/A',
        Phone: candidate.phone || 'N/A',
        'Match Score': candidate.matchScore,
        'Fit Verdict': candidate.fitVerdict,
        'Matched Skills': candidate.matchedSkills.join(', '),
        'Missing Skills': candidate.missingSkills.join(', '),
        'Total Experience (Years)': candidate.totalExperienceYears || 'N/A',
        Summary: candidate.summary || 'N/A',
      }));

      const csv = Papa.unparse(csvData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="candidates-${jobId}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // Export as PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text(`Candidate Rankings: ${job.title}`, 14, 20);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Total Candidates: ${job.candidates.length}`, 14, 34);

      // Table data
      const tableData = job.candidates.map((candidate) => [
        candidate.name,
        candidate.matchScore?.toString() || 'N/A',
        candidate.fitVerdict || 'N/A',
        candidate.matchedSkills.slice(0, 3).join(', '),
        candidate.missingSkills.slice(0, 3).join(', '),
      ]);

      // Generate table
      autoTable(doc, {
        head: [
          ['Name', 'Score', 'Fit', 'Matched Skills (Top 3)', 'Missing Skills (Top 3)'],
        ],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });

      const pdfBuffer = doc.output('arraybuffer');

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="candidates-${jobId}.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "pdf"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}