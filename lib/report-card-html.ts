import type { ReportCardPayload } from '@/lib/report-card';
import { SCHOOL_BRAND, schoolPhoneLine } from '@/lib/school-brand';
import { NIGERIAN_GRADING_SCALE } from '@/lib/grading';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function gradeClass(grade: string): string {
  switch (grade) {
    case 'A':
      return 'grade-a';
    case 'B':
      return 'grade-b';
    case 'C':
      return 'grade-c';
    case 'D':
      return 'grade-d';
    case 'E':
      return 'grade-e';
    case 'F':
      return 'grade-f';
    default:
      return 'grade-e';
  }
}

export type BuildReportCardHtmlOptions = {
  /** Absolute origin for logo/assets when opening print window, e.g. https://example.com */
  assetOrigin?: string;
  autoPrint?: boolean;
  /** Override logo URL (CMS upload). Absolute or site-relative. */
  logoUrl?: string;
};

export function buildReportCardHtml(
  data: ReportCardPayload,
  options: BuildReportCardHtmlOptions = {},
): string {
  const origin = (options.assetOrigin ?? '').replace(/\/$/, '');
  const configuredLogo =
    (options.logoUrl && options.logoUrl.trim()) ||
    SCHOOL_BRAND.logoPrintPath ||
    SCHOOL_BRAND.logoPath;
  const logoSrc = /^https?:\/\//i.test(configuredLogo) || configuredLogo.startsWith('data:')
    ? configuredLogo
    : `${origin}${configuredLogo.startsWith('/') ? configuredLogo : `/${configuredLogo}`}`;
  const autoPrint = Boolean(options.autoPrint);

  const rows = data.results
    .map(
      (r) => `
          <tr>
            <td class="subject">${esc(r.subject)}</td>
            <td class="num">${esc(fmt(r.ca1))}</td>
            <td class="num">${esc(fmt(r.ca2))}</td>
            <td class="num">${esc(fmt(r.exam))}</td>
            <td class="num total">${esc(fmt(r.total))}</td>
            <td class="num">${esc(fmt(r.minInClass))}</td>
            <td class="num">${esc(fmt(r.maxInClass))}</td>
            <td class="num">${esc(fmt(r.classAverage))}</td>
            <td class="num">${esc(r.positionInSubject)}</td>
            <td>${esc(r.comment)}</td>
            <td class="grade-cell"><span class="grade-badge ${gradeClass(r.grade)}">${esc(r.grade)}</span></td>
          </tr>`,
    )
    .join('');

  const keyRows = NIGERIAN_GRADING_SCALE.map(
    (s) => `${s.min}–${s.max} (${s.grade}: ${s.remark})`,
  ).join(' · ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(SCHOOL_BRAND.shortName)} — ${esc(SCHOOL_BRAND.reportTitle)}</title>
  <style>
    :root {
      --ink: #0f172a;
      --muted: #475569;
      --line: #94a3b8;
      --soft: #f1f5f0;
      --green: #0b4d2c;
      --green-deep: #0b4d2c;
      --gold: #b45309;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #e2e8f0;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.35;
    }
    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      background:
        radial-gradient(circle at 12% 8%, rgba(20,83,45,0.06), transparent 42%),
        radial-gradient(circle at 88% 0%, rgba(180,83,9,0.05), transparent 36%),
        #fff;
      padding: 18mm 14mm 16mm;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
      position: relative;
    }
    .sheet::before {
      content: "";
      position: absolute;
      inset: 8mm;
      border: 1.5px solid rgba(15, 61, 30, 0.35);
      pointer-events: none;
    }
    .brand {
      display: grid;
      grid-template-columns: 78px 1fr;
      gap: 14px;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 3px double var(--green-deep);
    }
    .brand img {
      width: 78px;
      height: 86px;
      object-fit: contain;
    }
    .brand-text { text-align: center; }
    .brand-text h1 {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22px;
      letter-spacing: 0.04em;
      color: var(--green-deep);
      text-transform: uppercase;
      line-height: 1.15;
    }
    .brand-text .addr {
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink);
    }
    .brand-text .tel,
    .brand-text .motto {
      margin: 2px 0 0;
      font-size: 10.5px;
      color: var(--muted);
    }
    .brand-text .motto {
      font-style: italic;
      color: var(--green);
      font-weight: 600;
    }
    .doc-title {
      margin: 14px 0 10px;
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--green-deep);
    }
    table.info, table.summary, table.results {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    table.info td, table.summary td, table.results th, table.results td {
      border: 1px solid var(--line);
      padding: 6px 7px;
      vertical-align: middle;
    }
    table.info td.label, table.summary td.label {
      width: 22%;
      background: var(--soft);
      font-weight: 700;
      color: var(--green-deep);
      font-size: 10.5px;
    }
    table.info td.value, table.summary td.value {
      font-weight: 700;
      font-size: 12px;
    }
    table.results th {
      background: var(--green-deep);
      color: #fff;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    table.results td.subject { font-weight: 600; text-align: left; }
    table.results td.num, table.results th.num { text-align: center; }
    table.results td.total { font-weight: 700; }
    table.results tbody tr:nth-child(even) { background: #f8faf8; }
    .grade-badge {
      display: inline-block;
      min-width: 22px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 800;
      font-size: 11px;
      text-align: center;
    }
    .grade-a { background: #dcfce7; color: #166534; }
    .grade-b { background: #dbeafe; color: #1d4ed8; }
    .grade-c { background: #fef9c3; color: #a16207; }
    .grade-d { background: #ffedd5; color: #c2410c; }
    .grade-e { background: #f1f5f9; color: #475569; }
    .grade-f { background: #fee2e2; color: #b91c1c; }
    .remark-pass { color: #166534; }
    .remark-fail { color: #b91c1c; }
    .key {
      margin: 8px 0 12px;
      padding: 8px 10px;
      border: 1px solid var(--line);
      background: #fafaf9;
      font-size: 10px;
      color: var(--muted);
    }
    .key strong { color: var(--green-deep); }
    .comments {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 8px;
    }
    .comment-box {
      border: 1px solid var(--line);
      padding: 10px;
      min-height: 78px;
    }
    .comment-box h3 {
      margin: 0 0 6px;
      font-size: 11px;
      color: var(--green-deep);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .comment-box p { margin: 0; font-size: 12px; }
    .sign-row {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 16px;
      align-items: end;
      margin-top: 14px;
    }
    .photo {
      width: 90px;
      height: 110px;
      border: 1px dashed var(--line);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 10px;
      text-align: center;
      background: #f8fafc;
    }
    .stamp-wrap { text-align: right; }
    .stamp {
      display: inline-block;
      border: 3px solid #6d28d9;
      color: #6d28d9;
      padding: 10px 14px;
      border-radius: 6px;
      text-align: center;
      transform: rotate(-4deg);
      opacity: 0.9;
      min-width: 190px;
    }
    .stamp .school {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .stamp .meta {
      margin-top: 6px;
      font-size: 11px;
      font-family: "Segoe Script", "Brush Script MT", cursive;
    }
    .actions {
      width: 210mm;
      margin: 0 auto 24px;
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .actions button {
      border: 0;
      background: var(--green-deep);
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }
    .actions button.secondary { background: #334155; }
    @media print {
      body { background: #fff; }
      .sheet {
        margin: 0;
        box-shadow: none;
        width: auto;
        min-height: auto;
        padding: 8mm;
      }
      .sheet::before { inset: 4mm; }
      .actions { display: none !important; }
      @page { size: A4 portrait; margin: 8mm; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
    <button type="button" class="secondary" onclick="window.close()">Close</button>
  </div>
  <div class="sheet">
    <header class="brand">
      <img src="${esc(logoSrc)}" alt="${esc(SCHOOL_BRAND.shortName)} logo" />
      <div class="brand-text">
        <h1>${esc(SCHOOL_BRAND.name)}</h1>
        <p class="addr">${esc(SCHOOL_BRAND.address)}</p>
        <p class="tel">TEL: ${esc(schoolPhoneLine())}</p>
        <p class="motto">MOTTO: ${esc(SCHOOL_BRAND.motto)}</p>
      </div>
    </header>

    <div class="doc-title">${esc(SCHOOL_BRAND.reportTitle)}</div>

    <table class="info">
      <tr>
        <td class="label">Student's Name</td>
        <td class="value">${esc(data.studentName)}</td>
        <td class="label">Admission No</td>
        <td class="value">${esc(data.admissionNumber)}</td>
      </tr>
      <tr>
        <td class="label">Term</td>
        <td class="value">${esc(data.term)}</td>
        <td class="label">Class</td>
        <td class="value">${esc(data.className)}</td>
      </tr>
      <tr>
        <td class="label">Academic Session</td>
        <td class="value">${esc(data.academicSession)}</td>
        <td class="label">Class Position</td>
        <td class="value">${esc(data.position)}</td>
      </tr>
      <tr>
        <td class="label">School Closed</td>
        <td class="value">${esc(data.schoolClosed || '—')}</td>
        <td class="label">Next Term Begins</td>
        <td class="value">${esc(data.nextTermBegins || '—')}</td>
      </tr>
    </table>

    <table class="summary">
      <tr>
        <td class="label">Student's Total Final Score</td>
        <td class="value">${esc(fmt(data.totalFinalScore))}</td>
        <td class="label">Student's Average Score</td>
        <td class="value">${esc(fmt(data.averageScore))}</td>
      </tr>
      <tr>
        <td class="label">Class Lowest Final Score</td>
        <td class="value">${esc(fmt(data.classLowestFinalScore))}</td>
        <td class="label">Class Highest Final Score</td>
        <td class="value">${esc(fmt(data.classHighestFinalScore))}</td>
      </tr>
      <tr>
        <td class="label">GPA / Overall Grade</td>
        <td class="value">${esc(fmt(data.gpa))} / ${esc(data.overallGrade)}</td>
        <td class="label">Overall Remark</td>
        <td class="value ${data.overallRemark === 'PASS' ? 'remark-pass' : 'remark-fail'}">${esc(data.overallRemark)}</td>
      </tr>
    </table>

    <table class="results">
      <thead>
        <tr>
          <th>Subjects</th>
          <th class="num">CA1 (20)</th>
          <th class="num">CA2 (20)</th>
          <th class="num">Exam (60)</th>
          <th class="num">Total (100)</th>
          <th class="num">Min in Class</th>
          <th class="num">Max in Class</th>
          <th class="num">Class Average</th>
          <th class="num">PosT</th>
          <th>Remark</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="11" style="text-align:center">No subject results</td></tr>`}
      </tbody>
    </table>

    <div class="key">
      <strong>KEY TO RATINGS:</strong> ${esc(keyRows)}. Conduct: ${esc(data.conduct)}.
      Attendance — Present: ${data.attendance.daysPresent}, Absent: ${data.attendance.daysAbsent}, Late: ${data.attendance.daysLate}.
    </div>

    <div class="comments">
      <div class="comment-box">
        <h3>Class Teacher's Comment</h3>
        <p>${esc(data.classTeacherComment)}</p>
      </div>
      <div class="comment-box">
        <h3>Principal's Comment</h3>
        <p>${esc(data.principalComment || data.comments)}</p>
      </div>
    </div>

    <div class="sign-row">
      <div class="photo">Student<br/>Photo</div>
      <div class="stamp-wrap">
        ${
          data.principalSignature
            ? `<div class="stamp">
          <div class="school">${esc(SCHOOL_BRAND.name)}<br/>TAFA L.G.A.</div>
          <div class="meta">Signed · ${esc(new Date().toLocaleDateString('en-GB'))}</div>
        </div>`
            : ''
        }
      </div>
    </div>
  </div>
  ${autoPrint ? '<script>window.addEventListener("load", function () { setTimeout(function () { window.print(); }, 350); });</script>' : ''}
</body>
</html>`;
}
