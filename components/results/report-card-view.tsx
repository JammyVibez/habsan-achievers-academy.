'use client';

import { SCHOOL_BRAND, schoolPhoneLine } from '@/lib/school-brand';
import { NIGERIAN_GRADING_SCALE } from '@/lib/grading';
import { SchoolLogo } from '@/components/brand/school-logo';

export type ReportCardViewData = {
  studentName: string;
  admissionNumber: string;
  className: string;
  academicSession: string;
  term: string;
  results: Array<{
    subject: string;
    ca1: number;
    ca2: number;
    exam: number;
    total: number;
    grade: string;
    comment: string;
    minInClass?: number | null;
    maxInClass?: number | null;
    classAverage?: number | null;
    positionInSubject?: string;
  }>;
  gpa: number;
  overallGrade: string;
  position: string;
  totalFinalScore?: number;
  averageScore?: number;
  classLowestFinalScore?: number | null;
  classHighestFinalScore?: number | null;
  overallRemark?: string;
  schoolClosed?: string;
  nextTermBegins?: string;
  attendance: {
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
  };
  conduct: string;
  comments: string;
  classTeacherComment?: string;
  principalComment?: string;
};

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function gradeBadgeClass(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-800';
    case 'B':
      return 'bg-sky-100 text-sky-800';
    case 'C':
      return 'bg-amber-100 text-amber-800';
    case 'D':
      return 'bg-orange-100 text-orange-800';
    case 'E':
      return 'bg-slate-100 text-slate-700';
    case 'F':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function deriveTotals(data: ReportCardViewData) {
  const totalFinalScore =
    data.totalFinalScore ??
    Math.round(data.results.reduce((sum, row) => sum + row.total, 0) * 100) / 100;
  const averageScore =
    data.averageScore ??
    (data.results.length > 0
      ? Math.round((totalFinalScore / data.results.length) * 100) / 100
      : 0);
  const overallRemark = data.overallRemark ?? (averageScore >= 50 ? 'PASS' : 'FAIL');
  return { totalFinalScore, averageScore, overallRemark };
}

export function ReportCardView({ data }: { data: ReportCardViewData }) {
  const { totalFinalScore, averageScore, overallRemark } = deriveTotals(data);
  const principalComment = data.principalComment || data.comments;
  const teacherComment = data.classTeacherComment || 'Satisfactory progress this term.';
  const keyText = NIGERIAN_GRADING_SCALE.map(
    (s) => `${s.min}–${s.max} (${s.grade}: ${s.remark})`,
  ).join(' · ');

  return (
    <article className="overflow-hidden rounded-xl border border-emerald-900/15 bg-[radial-gradient(circle_at_12%_8%,rgba(20,83,45,0.07),transparent_42%),radial-gradient(circle_at_88%_0%,rgba(180,83,9,0.05),transparent_36%),#fff] shadow-sm">
      <header className="border-b-[3px] border-double border-emerald-950 px-4 py-5 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
          <SchoolLogo size={88} priority />
          <div className="text-center sm:flex-1">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wide text-emerald-950 sm:text-2xl">
              {SCHOOL_BRAND.name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-800">{SCHOOL_BRAND.address}</p>
            <p className="text-xs text-slate-600 sm:text-sm">TEL: {schoolPhoneLine()}</p>
            <p className="mt-1 text-xs font-semibold italic text-emerald-800 sm:text-sm">
              MOTTO: {SCHOOL_BRAND.motto}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        <h3 className="text-center text-base font-extrabold uppercase tracking-[0.14em] text-emerald-950 sm:text-lg">
          {SCHOOL_BRAND.reportTitle}
        </h3>

        <div className="overflow-x-auto rounded-md border border-slate-300">
          <table className="w-full min-w-[520px] text-sm">
            <tbody>
              <tr className="border-b border-slate-300">
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Student&apos;s Name
                </th>
                <td className="px-3 py-2 font-semibold">{data.studentName}</td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Admission No
                </th>
                <td className="px-3 py-2 font-mono font-semibold">{data.admissionNumber}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">Term</th>
                <td className="px-3 py-2 font-semibold">{data.term}</td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">Class</th>
                <td className="px-3 py-2 font-semibold">{data.className}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Academic Session
                </th>
                <td className="px-3 py-2 font-semibold">{data.academicSession}</td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Class Position
                </th>
                <td className="px-3 py-2 font-semibold">{data.position}</td>
              </tr>
              <tr>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  School Closed
                </th>
                <td className="px-3 py-2 font-semibold">{data.schoolClosed || '—'}</td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Next Term Begins
                </th>
                <td className="px-3 py-2 font-semibold">{data.nextTermBegins || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-300">
          <table className="w-full min-w-[520px] text-sm">
            <tbody>
              <tr className="border-b border-slate-300">
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Student&apos;s Total Final Score
                </th>
                <td className="px-3 py-2 font-bold">{fmt(totalFinalScore)}</td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Student&apos;s Average Score
                </th>
                <td className="px-3 py-2 font-bold">{fmt(averageScore)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Class Lowest Final Score
                </th>
                <td className="px-3 py-2 font-semibold">{fmt(data.classLowestFinalScore)}</td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Class Highest Final Score
                </th>
                <td className="px-3 py-2 font-semibold">{fmt(data.classHighestFinalScore)}</td>
              </tr>
              <tr>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  GPA / Overall Grade
                </th>
                <td className="px-3 py-2 font-semibold">
                  {fmt(data.gpa)} / {data.overallGrade}
                </td>
                <th className="bg-emerald-50 px-3 py-2 text-left font-semibold text-emerald-950">
                  Overall Remark
                </th>
                <td
                  className={`px-3 py-2 font-extrabold ${
                    overallRemark === 'PASS' ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {overallRemark}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-300">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-emerald-950 text-white">
                <th className="px-2 py-2 text-left font-semibold">Subjects</th>
                <th className="px-2 py-2 text-center font-semibold">CA1 (20)</th>
                <th className="px-2 py-2 text-center font-semibold">CA2 (20)</th>
                <th className="px-2 py-2 text-center font-semibold">Exam (60)</th>
                <th className="px-2 py-2 text-center font-semibold">Total (100)</th>
                <th className="px-2 py-2 text-center font-semibold">Min</th>
                <th className="px-2 py-2 text-center font-semibold">Max</th>
                <th className="px-2 py-2 text-center font-semibold">Class Avg</th>
                <th className="px-2 py-2 text-center font-semibold">PosT</th>
                <th className="px-2 py-2 text-left font-semibold">Remark</th>
                <th className="px-2 py-2 text-center font-semibold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((row, idx) => (
                <tr key={`${row.subject}-${idx}`} className="border-t border-slate-200 odd:bg-emerald-50/40">
                  <td className="px-2 py-2 font-medium">{row.subject}</td>
                  <td className="px-2 py-2 text-center font-semibold">{fmt(row.ca1)}</td>
                  <td className="px-2 py-2 text-center font-semibold">{fmt(row.ca2)}</td>
                  <td className="px-2 py-2 text-center font-semibold">{fmt(row.exam)}</td>
                  <td className="px-2 py-2 text-center font-bold">{fmt(row.total)}</td>
                  <td className="px-2 py-2 text-center">{fmt(row.minInClass)}</td>
                  <td className="px-2 py-2 text-center">{fmt(row.maxInClass)}</td>
                  <td className="px-2 py-2 text-center">{fmt(row.classAverage)}</td>
                  <td className="px-2 py-2 text-center">{row.positionInSubject || '—'}</td>
                  <td className="px-2 py-2 text-slate-600">{row.comment}</td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className={`inline-block min-w-[1.75rem] rounded px-2 py-0.5 text-xs font-extrabold ${gradeBadgeClass(row.grade)}`}
                    >
                      {row.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-md border border-slate-300 bg-stone-50 px-3 py-2 text-xs text-slate-600">
          <strong className="text-emerald-950">KEY TO RATINGS:</strong> {keyText}. Conduct:{' '}
          {data.conduct}. Attendance — Present: {data.attendance.daysPresent}, Absent:{' '}
          {data.attendance.daysAbsent}, Late: {data.attendance.daysLate}.
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-slate-300 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-950">
              Class Teacher&apos;s Comment
            </p>
            <p className="mt-1 text-sm text-slate-800">{teacherComment}</p>
          </div>
          <div className="rounded-md border border-slate-300 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-950">
              Principal&apos;s Comment
            </p>
            <p className="mt-1 text-sm text-slate-800">{principalComment}</p>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex h-28 w-24 items-center justify-center border border-dashed border-slate-400 bg-slate-50 text-center text-[10px] text-slate-500">
            Student
            <br />
            Photo
          </div>
          <div className="rotate-[-3deg] rounded-md border-[3px] border-violet-700 px-4 py-3 text-center text-violet-700 opacity-90">
            <p className="text-[10px] font-extrabold uppercase leading-tight tracking-wide">
              {SCHOOL_BRAND.name}
              <br />
              TAFA L.G.A.
            </p>
            <p className="mt-2 font-serif text-sm italic">Official · Signed</p>
          </div>
        </div>
      </div>
    </article>
  );
}
