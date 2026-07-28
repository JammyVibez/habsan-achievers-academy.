import { prisma } from '@/lib/prisma';
import { decimalToNumber, gradeToPoint, scoreToComment, scoreToGrade } from '@/lib/grades';
import { determinePosition, getPositionSuffix } from '@/lib/grading';

export type ReportSubjectRow = {
  subject: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  score: number;
  grade: string;
  comment: string;
  minInClass: number | null;
  maxInClass: number | null;
  classAverage: number | null;
  positionInSubject: string;
};

export type ReportCardPayload = {
  studentName: string;
  admissionNumber: string;
  className: string;
  academicSession: string;
  term: string;
  results: ReportSubjectRow[];
  gpa: number;
  overallGrade: string;
  position: string;
  totalFinalScore: number;
  averageScore: number;
  classLowestFinalScore: number | null;
  classHighestFinalScore: number | null;
  overallRemark: string;
  schoolClosed: string;
  nextTermBegins: string;
  attendance: { daysPresent: number; daysAbsent: number; daysLate: number };
  conduct: string;
  comments: string;
  principalSignature: boolean;
  classTeacherComment: string;
  principalComment: string;
};

function overallGradeFromGpa(gpa: number): string {
  if (gpa >= 4.5) return 'A';
  if (gpa >= 3.5) return 'B';
  if (gpa >= 2.5) return 'C';
  if (gpa >= 1.5) return 'D';
  return 'F';
}

function formatPosition(position: number, classSize: number): string {
  if (position <= 0 || classSize <= 0) return '—';
  return `${position}${getPositionSuffix(position)} / ${classSize}`;
}

function overallRemarkFromAverage(average: number): string {
  if (average >= 50) return 'PASS';
  return 'FAIL';
}

function principalCommentFromAverage(average: number, overallGrade: string): string {
  if (average >= 70) return 'A Very Good Result, keep it up.';
  if (average >= 50) return 'A Good Result. Work harder for higher scores.';
  if (overallGrade === 'F' || average < 40) return 'Poor Result. Extra effort is required next term.';
  return 'Fair Result. Improve in weaker subjects.';
}

export async function buildReportCardForStudent(
  studentId: string,
  termId: string,
  sessionId: string,
): Promise<ReportCardPayload | null> {
  const term = await prisma.term.findFirst({
    where: { id: termId, sessionId },
    include: { session: true },
  });
  if (!term) return null;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      results: {
        where: { termId, sessionId },
        include: { subject: true },
        orderBy: { subject: { name: 'asc' } },
      },
    },
  });

  if (!student) return null;

  const session = term.session;
  const classLevel = student.classLevel;

  const classmates = await prisma.student.findMany({
    where: { classLevel, status: 'active' },
    select: { id: true },
  });
  const classmateIds = classmates.map((c) => c.id);

  const classResults = classmateIds.length
    ? await prisma.result.findMany({
        where: {
          termId,
          sessionId,
          studentId: { in: classmateIds },
        },
        select: {
          studentId: true,
          subjectId: true,
          total: true,
        },
      })
    : [];

  const subjectTotals = new Map<string, number[]>();
  const studentFinalTotals = new Map<string, number>();

  for (const row of classResults) {
    const total = decimalToNumber(row.total);
    const list = subjectTotals.get(row.subjectId) ?? [];
    list.push(total);
    subjectTotals.set(row.subjectId, list);
    studentFinalTotals.set(row.studentId, (studentFinalTotals.get(row.studentId) ?? 0) + total);
  }

  const results: ReportSubjectRow[] = student.results.map((r) => {
    const ca1 = decimalToNumber(r.ca1);
    const ca2 = decimalToNumber(r.ca2);
    const exam = decimalToNumber(r.exam);
    const total = decimalToNumber(r.total);
    const grade = r.grade ?? scoreToGrade(total);
    const peers = subjectTotals.get(r.subjectId) ?? [total];
    const minInClass = peers.length ? Math.min(...peers) : null;
    const maxInClass = peers.length ? Math.max(...peers) : null;
    const classAverage =
      peers.length > 0
        ? Math.round((peers.reduce((sum, n) => sum + n, 0) / peers.length) * 100) / 100
        : null;
    const subjectPosition = determinePosition(total, peers);

    return {
      subject: r.subject.name,
      ca1,
      ca2,
      exam,
      total,
      score: total,
      grade,
      comment: r.remark ?? scoreToComment(grade),
      minInClass,
      maxInClass,
      classAverage,
      positionInSubject: formatPosition(subjectPosition, peers.length),
    };
  });

  const totalFinalScore =
    Math.round(results.reduce((sum, row) => sum + row.total, 0) * 100) / 100;
  const averageScore =
    results.length > 0
      ? Math.round((totalFinalScore / results.length) * 100) / 100
      : 0;

  const gpaRaw =
    results.length > 0
      ? results.reduce((sum, row) => sum + gradeToPoint(row.grade), 0) / results.length
      : 0;
  const gpa = Math.round(gpaRaw * 10) / 10;
  const overallGrade = overallGradeFromGpa(gpa);

  const classFinalScores = Array.from(studentFinalTotals.values());
  const classLowestFinalScore = classFinalScores.length ? Math.min(...classFinalScores) : null;
  const classHighestFinalScore = classFinalScores.length ? Math.max(...classFinalScores) : null;
  const classSizeWithTotals = classFinalScores.length;
  const overallPosition = determinePosition(totalFinalScore, classFinalScores);

  const from = term.startDate;
  const to = term.endDate;

  const attendanceRows = await prisma.attendance.findMany({
    where: {
      studentId,
      date: { gte: from, lte: to },
    },
  });

  const daysPresent = attendanceRows.filter((a) => a.status === 'present').length;
  const daysAbsent = attendanceRows.filter((a) => a.status === 'absent').length;
  const daysLate = attendanceRows.filter((a) => a.status === 'late').length;

  const studentName = `${student.user.firstName} ${student.user.lastName}`.trim();
  const overallRemark = overallRemarkFromAverage(averageScore);
  const principalComment = principalCommentFromAverage(averageScore, overallGrade);

  return {
    studentName,
    admissionNumber: student.admissionNumber,
    className: student.classLevel,
    academicSession: session.sessionName,
    term: term.termName,
    results,
    gpa,
    overallGrade,
    position: formatPosition(overallPosition, classSizeWithTotals),
    totalFinalScore,
    averageScore,
    classLowestFinalScore,
    classHighestFinalScore,
    overallRemark,
    schoolClosed: '',
    nextTermBegins: '',
    attendance: {
      daysPresent: daysPresent || 0,
      daysAbsent: daysAbsent || 0,
      daysLate: daysLate || 0,
    },
    conduct: 'Good',
    comments: principalComment,
    principalSignature: true,
    classTeacherComment: 'Satisfactory progress this term.',
    principalComment,
  };
}

export async function getCurrentTermAndSession(): Promise<{
  term: { id: string; termName: string; startDate: Date; endDate: Date };
  session: { id: string; sessionName: string };
} | null> {
  let session = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    orderBy: { startDate: 'desc' },
    include: {
      terms: { where: { isCurrent: true }, take: 1 },
    },
  });

  if (!session) {
    session = await prisma.academicSession.findFirst({
      orderBy: { startDate: 'desc' },
      include: {
        terms: { orderBy: { startDate: 'desc' }, take: 1 },
      },
    });
  } else if (session.terms.length === 0) {
    const fallbackTerm = await prisma.term.findFirst({
      where: { sessionId: session.id },
      orderBy: { startDate: 'desc' },
    });
    session = {
      ...session,
      terms: fallbackTerm ? [fallbackTerm] : [],
    };
  }

  if (!session) return null;
  const term = session.terms[0];
  if (!term) return null;

  return {
    term: {
      id: term.id,
      termName: term.termName,
      startDate: term.startDate,
      endDate: term.endDate,
    },
    session: { id: session.id, sessionName: session.sessionName },
  };
}
