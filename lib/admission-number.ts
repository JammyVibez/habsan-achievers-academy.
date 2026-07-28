/** Accept official HAA/YYYY/### and shorter school formats like HAA/037. */
export function isAcceptedAdmissionNumber(admissionNumber: string): boolean {
  const value = admissionNumber.trim().toUpperCase();
  return /^HAA\/(\d{4}\/\d{3}|\d{2,4})$/.test(value);
}

export function normalizeAdmissionNumber(admissionNumber: string): string {
  return admissionNumber.trim().toUpperCase();
}
