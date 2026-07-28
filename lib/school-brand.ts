/** Official school branding for report cards and result checker. */
export const SCHOOL_BRAND = {
  name: 'HABSAN ACHIEVERS ACADEMY GAJIRI',
  shortName: 'HABSAN ACHIEVERS ACADEMY',
  address: 'Gajiri Tafa Local Govt, Niger State',
  phones: ['09023837175', '08036527117', '09052498332'],
  motto: 'Knowledge, Discipline & Excellence',
  logoPath: '/school-logo.svg',
  reportTitle: 'END OF TERM RESULT',
} as const;

export function schoolPhoneLine(): string {
  return SCHOOL_BRAND.phones.join(', ');
}
