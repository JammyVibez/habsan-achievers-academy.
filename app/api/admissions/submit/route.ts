import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  databaseSchemaMessage,
  databaseUnavailableMessage,
  isPrismaConnectionError,
  isPrismaMissingTable,
  isPrismaUniqueViolation,
} from '@/lib/prisma-errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fileMeta(file: File | null): { name: string; size: number; type: string } | null {
  if (!file || typeof file.name !== 'string') return null;
  return { name: file.name, size: file.size, type: file.type };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const pin = formData.get('pin') as string | null;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const gender = formData.get('gender') as string | null;
    const classLevel = formData.get('classLevel') as string;
    const previousSchool = formData.get('previousSchool') as string | null;
    const address = formData.get('address') as string | null;
    const parentName = formData.get('parentName') as string | null;
    const parentPhone = formData.get('parentPhone') as string | null;
    const parentEmail = formData.get('parentEmail') as string;
    const parentAddress = formData.get('parentAddress') as string | null;
    const emergencyContact = formData.get('emergencyContact') as string | null;
    const relationship = formData.get('relationship') as string | null;
    const bloodGroup = formData.get('bloodGroup') as string | null;
    const medicalConditions = formData.get('medicalConditions') as string | null;
    const allergies = formData.get('allergies') as string | null;

    const documents = {
      birthCertificate: formData.get('documents.birthCertificate') as File | null,
      schoolReportCard: formData.get('documents.schoolReportCard') as File | null,
      passportPhotos: formData.getAll('documents.passportPhotos') as File[],
      parentID: formData.get('documents.parentID') as File | null,
      proofOfResidence: formData.get('documents.proofOfResidence') as File | null,
      medicalCertificate: formData.get('documents.medicalCertificate') as File | null,
    };

    if (!firstName?.trim() || !lastName?.trim() || !dateOfBirth || !classLevel?.trim() || !parentEmail?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!EMAIL_PATTERN.test(parentEmail.trim())) {
      return NextResponse.json({ error: 'Parent/guardian email address is not valid' }, { status: 400 });
    }

    if (!parentPhone?.trim()) {
      return NextResponse.json({ error: 'Parent/guardian phone number is required' }, { status: 400 });
    }

    if (
      !fileMeta(documents.birthCertificate) ||
      !fileMeta(documents.parentID) ||
      !fileMeta(documents.proofOfResidence) ||
      !fileMeta(documents.medicalCertificate)
    ) {
      return NextResponse.json(
        { error: 'Birth certificate, parent ID, proof of residence and medical certificate are required' },
        { status: 400 },
      );
    }

    if (documents.passportPhotos.filter((f) => fileMeta(f)).length === 0) {
      return NextResponse.json({ error: 'At least one passport photograph is required' }, { status: 400 });
    }

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 });
    }
    if (dob.getTime() > Date.now()) {
      return NextResponse.json({ error: 'Date of birth cannot be in the future' }, { status: 400 });
    }

    const pinNormalized = pin?.trim().toUpperCase();
    if (!pinNormalized) {
      return NextResponse.json({ error: 'Admission PIN is required' }, { status: 400 });
    }

    const issuedPin = await prisma.issuedPin.findFirst({
      where: {
        pinCode: pinNormalized,
        pinType: 'admission',
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });

    if (!issuedPin) {
      return NextResponse.json(
        {
          error:
            'This admission PIN is invalid, expired or already used. Contact the school office for a new PIN.',
        },
        { status: 400 },
      );
    }

    const applicationRef = `APP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const documentMeta = {
      birthCertificate: fileMeta(documents.birthCertificate),
      schoolReportCard: fileMeta(documents.schoolReportCard),
      passportPhotos: documents.passportPhotos.map((f) => fileMeta(f)).filter(Boolean),
      parentID: fileMeta(documents.parentID),
      proofOfResidence: fileMeta(documents.proofOfResidence),
      medicalCertificate: fileMeta(documents.medicalCertificate),
    };

    await prisma.$transaction(async (tx) => {
      // Only consume the PIN if it is still active, so two simultaneous
      // submissions cannot both use the same PIN.
      const consumed = await tx.issuedPin.updateMany({
        where: { id: issuedPin.id, status: 'active' },
        data: { status: 'used', usedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new Error('PIN_ALREADY_USED');
      }

      await tx.admissionApplication.create({
        data: {
          applicationRef,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          gender: gender?.trim() || null,
          classLevel: classLevel.trim(),
          previousSchool: previousSchool?.trim() || null,
          address: address?.trim() || null,
          parentName: parentName?.trim() || null,
          parentPhone: parentPhone.trim(),
          parentEmail: parentEmail.trim().toLowerCase(),
          parentAddress: parentAddress?.trim() || null,
          emergencyContact: emergencyContact?.trim() || null,
          relationship: relationship?.trim() || null,
          bloodGroup: bloodGroup?.trim() || null,
          medicalConditions: medicalConditions?.trim() || null,
          allergies: allergies?.trim() || null,
          admissionPin: pinNormalized,
          status: 'pending',
          documentMeta,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully. You will receive a confirmation email shortly.',
        applicationRef,
        applicationStatus: 'pending',
        nextSteps: [
          'Wait for admin review of your application',
          'You will receive an email confirming admission status',
          'Upon approval, login credentials will be sent to your email',
        ],
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'PIN_ALREADY_USED') {
      return NextResponse.json(
        { error: 'This admission PIN was just used for another application. Contact the school office for a new PIN.' },
        { status: 409 },
      );
    }
    if (isPrismaUniqueViolation(error)) {
      return NextResponse.json({ error: 'Duplicate application reference; please try again.' }, { status: 409 });
    }
    if (isPrismaMissingTable(error)) {
      return NextResponse.json({ error: databaseSchemaMessage() }, { status: 503 });
    }
    if (isPrismaConnectionError(error)) {
      return NextResponse.json({ error: databaseUnavailableMessage() }, { status: 503 });
    }
    console.error('Admission submission error:', error);
    return NextResponse.json({ error: 'Failed to submit admission application' }, { status: 500 });
  }
}
