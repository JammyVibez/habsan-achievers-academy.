/** Official school branding for report cards and site chrome. */
export const SCHOOL_BRAND = {
  name: 'HABSAN ACHIEVERS ACADEMY GAJIRI',
  shortName: 'HABSAN ACHIEVERS ACADEMY',
  address: 'Gajiri Tafa Local Govt, Niger State',
  phones: ['09023837175', '08036527117', '09052498332'],
  motto: 'Knowledge, Discipline & Excellence',
  /** Official crest PNG used on report cards and website branding */
  logoPath: '/school-logo.png',
  /** Opaque white-background variant for print/PDF reliability */
  logoPrintPath: '/school-logo-print.png',
  reportTitle: 'END OF TERM RESULT',
  brandGreen: '#0B4D2C',
} as const;

export function schoolPhoneLine(): string {
  return SCHOOL_BRAND.phones.join(', ');
}
