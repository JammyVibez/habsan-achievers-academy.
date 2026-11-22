import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import {
  generateAdmissionNumber,
  generateDefaultPassword,
  generateStudentEmail,
  type StudentCreationData,
} from '@/lib/student-utils';
import { nextAdmissionSequence } from '@/lib/sequences';

export type CreatedStudentAccount = {
  admissionNumber: string;
  email: string;
  defaultPassword: string;
  userId: string;
  studentId: string;
};

/** Thrown for invalid or incomplete student details (safe to show to the user). */
export class StudentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentInputError';
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export async function createStudentAccount(
  data: StudentCreationData,
  client?: Prisma.TransactionClient,
): Promise<CreatedStudentAccount> {
  const firstName = clean(data.firstName);
  const lastName = clean(data.lastName);
  const classAssigned = clean(data.classAssigned);
  const parentPhone = clean(data.parentPhone);
  const parentEmail = clean(data.parentEmail);

  if (!firstName) throw new StudentInputError('First name is required');
  if (!lastName) throw new StudentInputError('Last name is required');
  if (!classAssigned) throw new StudentInputError('Class assignment is required');
  if (!parentPhone) throw new StudentInputError('Parent/guardian phone number is required');
  if (!parentEmail) throw new StudentInputError('Parent/guardian email is required');
  if (!EMAIL_PATTERN.test(parentEmail)) {
    throw new StudentInputError('Parent/guardian email address is not valid');
  }

  const dob = new Date(clean(data.dateOfBirth));
  if (Number.isNaN(dob.getTime())) {
    throw new StudentInputError('Date of birth is required and must be a valid date');
  }
  if (dob.getTime() > Date.now()) {
    throw new StudentInputError('Date of birth cannot be in the future');
  }

  const year = new Date().getFullYear();
  const seq = await nextAdmissionSequence(year, client ?? prisma);
  const admissionNumber = generateAdmissionNumber(year, seq);
  const defaultPassword = generateDefaultPassword();
  const gender = data.gender === 'Female' ? 'Female' : 'Male';
  const passwordHash = await hashPassword(defaultPassword);
  const parentName = clean(data.parentGuardianName) || 'Parent / Guardian';

  const createRecords = async (tx: Prisma.TransactionClient) => {
    let email = generateStudentEmail(firstName, lastName, admissionNumber);
    for (let i = 0; i < 5; i++) {
      const taken = await tx.user.findUnique({ where: { email } });
      if (!taken) break;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Math.random().toString(36).slice(2, 6)}@habsan.edu.ng`;
    }

    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'student',
        firstName,
        lastName,
        phone: parentPhone,
        passwordMustChange: true,
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        admissionNumber,
        classLevel: classAssigned,
        dateOfBirth: dob,
        gender,
        address: clean(data.address) || null,
        parentGuardianName: parentName,
        parentGuardianPhone: parentPhone,
        parentGuardianEmail: parentEmail,
        medicalConditions: clean(data.medicalInfo) || null,
        admissionDate: new Date(),
        status: 'active',
      },
    });

    return { user, student, email };
  };

  const result = client ? await createRecords(client) : await prisma.$transaction(createRecords);

  return {
    admissionNumber,
    email: result.email,
    defaultPassword,
    userId: result.user.id,
    studentId: result.student.id,
  };
}
