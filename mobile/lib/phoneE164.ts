/**
 * Convert a US-style stored display (e.g. 555-123-4567) to E.164 for Appwrite (+1...).
 * Returns null if the number of digits is invalid for US.
 */
export function usDisplayToE164(display: string): string | null {
  const digits = display.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return null;
}

/**
 * Format a US E.164 number for display (###-###-####). Non-US numbers are returned unchanged.
 */
export function e164ToUsDisplay(e164: string | null | undefined): string {
  if (e164 == null || typeof e164 !== 'string') {
    return '';
  }
  const s = e164.replace(/\s/g, '');
  if (s.startsWith('+1') && s.length === 12) {
    const d = s.slice(2);
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  return s;
}

export function normalizeE164Key(e164: string | null | undefined): string {
  return e164 && String(e164).trim() ? String(e164).trim() : '';
}
