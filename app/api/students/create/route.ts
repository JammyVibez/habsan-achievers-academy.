import { NextRequest, NextResponse } from 'next/server';
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

  let data: StudentCreationData;
  try {
    data = (await request.json()) as StudentCreationData;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!data?.firstName || !data?.lastName || !data?.classAssigned) {
    return NextResponse.json(
      { error: 'Missing required fields: first name, last name and class' },
      { status: 400 },
    );
  }

  try {
    const account = await createStudentAccount(data);

    return NextResponse.json(
      {
        success: true,
        message: `Student ${data.firstName} ${data.lastName} created successfully`,
        student: {
          admissionNumber: account.admissionNumber,
          email: account.email,
          defaultPassword: account.defaultPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          classAssigned: data.classAssigned,
          createdAt: new Date(),
          requiresPasswordChange: true,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof StudentInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json({ error: 'Email or admission number already exists' }, { status: 409 });
    }
    if (isPrismaMissingTable(error)) {
      return NextResponse.json({ error: databaseSchemaMessage() }, { status: 503 });
    }
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 503 });
    }
    console.error('Student creation error:', error);
    return NextResponse.json({ error: 'Failed to create student account' }, { status: 500 });
  }
}
