/** Official school branding for report cards and site chrome. */
export const SCHOOL_BRAND = {
  name: 'HABSAN ACHIEVERS ACADEMY GAJIRI',
  shortName: 'HABSAN ACHIEVERS ACADEMY',
  address: 'Gajiri Tafa Local Govt, Niger State',
  phones: ['09023837175', '08036527117', '09052498332'],
  motto: 'Knowledge, Discipline & Excellence',
  /** Original school logo image uploaded to public/ */
  logoPath: '/IMG-20261122-WA0033.jpg',
  /** Use the original image for print/PDF branding as well. */
  logoPrintPath: '/IMG-20261122-WA0033.jpg',
  reportTitle: 'END OF TERM RESULT',
  brandGreen: '#0B4D2C',
} as const;

export function schoolPhoneLine(): string {
  return SCHOOL_BRAND.phones.join(', ');
}
