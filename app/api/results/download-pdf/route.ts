import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveSessionAndTerm } from '@/lib/academic-calendar';
import { buildReportCardForStudent } from '@/lib/report-card';
import { buildReportCardHtml } from '@/lib/report-card-html';
import { validateResultCheckingPin } from '@/lib/issued-result-pin';
import { isAcceptedAdmissionNumber, normalizeAdmissionNumber } from '@/lib/admission-number';
import { resolveSchoolLogoUrl } from '@/lib/school-logo';

export async function POST(request: NextRequest) {
  try {
    const { pin, admissionNumber, sessionId, termId } = await request.json();

    if (!pin || !admissionNumber) {
      return NextResponse.json({ error: 'PIN and admission number are required' }, { status: 400 });
    }

    const normalizedAdmission = normalizeAdmissionNumber(String(admissionNumber));
    if (!isAcceptedAdmissionNumber(normalizedAdmission)) {
      return NextResponse.json(
        { error: 'Invalid admission number format. Use HAA/YYYY/### (e.g. HAA/2024/001).' },
        { status: 400 },
      );
    }

    const pinCheck = await validateResultCheckingPin(String(pin));
    if (!pinCheck.ok) {
      return NextResponse.json(
        { error: pinCheck.message, pinShopUrl: pinCheck.pinShopPath },
        { status: pinCheck.status },
      );
    }

    const student = await prisma.student.findUnique({
      where: { admissionNumber: normalizedAdmission },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found for this admission number' }, { status: 404 });
    }

    if (!sessionId || !termId) {
      return NextResponse.json({ error: 'Please select academic session and term.' }, { status: 400 });
    }

    let selectedSessionId: string;
    let selectedTermId: string;
    try {
      const resolved = await resolveSessionAndTerm(String(sessionId), String(termId));
      selectedSessionId = resolved.session.id;
      selectedTermId = resolved.term.id;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid session/term selection' },
        { status: 400 },
      );
    }

    const payload = await buildReportCardForStudent(student.id, selectedTermId, selectedSessionId);

    if (!payload || payload.results.length === 0) {
      return NextResponse.json(
        { error: 'No published results for this student in the selected session/term yet.' },
        { status: 404 },
      );
    }

    const assetOrigin = new URL(request.url).origin;
    const logoUrl = await resolveSchoolLogoUrl();
    const reportCardHTML = buildReportCardHtml(payload, {
      assetOrigin,
      autoPrint: true,
      logoUrl,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Report card generated successfully',
        html: reportCardHTML,
        fileName: `ReportCard_${normalizedAdmission.replace(/\//g, '-')}_${payload.term.replace(/\s+/g, '-')}.pdf`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report card' }, { status: 500 });
  }
}
