import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  databaseSchemaMessage,
  databaseUnavailableMessage,
  isPrismaConnectionError,
  isPrismaMissingTable,
  isPrismaUniqueViolation,
} from '@/lib/prisma-errors';
import { createStudentAccount, StudentInputError } from '@/lib/student-service';
import type { StudentCreationData } from '@/lib/student-utils';
import { requireAdminFromRequest } from '@/lib/require-admin-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await requireAdminFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    let body: { applicationId?: string; applicationRef?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const key = body.applicationRef ?? body.applicationId;
    if (!key) {
      return NextResponse.json({ error: 'applicationRef or applicationId is required' }, { status: 400 });
    }

    const app = await prisma.admissionApplication.findFirst({
      where: { OR: [{ id: key }, { applicationRef: key }], status: 'pending' },
    });

    if (!app) {
      return NextResponse.json(
        { error: 'Pending application not found. It may already have been approved or rejected.' },
        { status: 404 },
      );
    }

    const phone = app.parentPhone?.trim();
    if (!phone) {
      return NextResponse.json(
        { error: 'This application has no parent phone number. Add one before approving.' },
        { status: 400 },
      );
    }

    const parentEmail = app.parentEmail?.trim();
    if (!parentEmail) {
      return NextResponse.json(
        { error: 'This application has no parent email address, which is required to create a student account.' },
        { status: 400 },
      );
    }

    const studentPayload: StudentCreationData = {
      firstName: app.firstName,
      lastName: app.lastName,
      dateOfBirth: app.dateOfBirth.toISOString().slice(0, 10),
      classAssigned: app.classLevel,
      parentEmail,
      parentPhone: phone,
      address: (app.address ?? app.parentAddress ?? '').trim() || 'Not provided',
      medicalInfo: app.medicalConditions ?? undefined,
      gender: app.gender === 'Female' ? 'Female' : app.gender === 'Male' ? 'Male' : undefined,
      parentGuardianName: app.parentName ?? undefined,
    };

    // The student account and the application status change must succeed together,
    // otherwise an orphan account blocks every later approval attempt.
    const account = await prisma.$transaction(async (tx) => {
      const created = await createStudentAccount(studentPayload, tx);
      const updated = await tx.admissionApplication.updateMany({
        where: { id: app.id, status: 'pending' },
        data: { status: 'approved' },
      });
      if (updated.count !== 1) {
        throw new Error('APPLICATION_ALREADY_PROCESSED');
      }
      return created;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application approved. Student account created successfully.',
        admissionNumber: account.admissionNumber,
        studentEmail: account.email,
        defaultPassword: account.defaultPassword,
        accountCreated: true,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'APPLICATION_ALREADY_PROCESSED') {
      return NextResponse.json(
        { error: 'This application was already processed. Refresh the list to see the latest status.' },
        { status: 409 },
      );
    }
    if (error instanceof StudentInputError) {
      return NextResponse.json(
        { error: `Could not create the student account: ${error.message}` },
        { status: 400 },
      );
    }
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json(
        {
          error:
            'A student with this email or admission number already exists. Check the Students list before approving again.',
        },
        { status: 409 },
      );
    }
    if (isPrismaMissingTable(error)) {
      return NextResponse.json({ error: databaseSchemaMessage() }, { status: 503 });
    }
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 503 });
    }
    console.error('Error approving admission:', error);
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }
}
