/**
 * Normalizes phone numbers for WhatsApp and Tel protocols
 * Handles international codes, leading zeroes, spaces, hyphens, and brackets
 */
export function normalizePhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If starts with 0 and is 11 digits (e.g. 09845012345), remove leading 0
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }

  // If 10 digits (standard Indian mobile format e.g. 9845012345), prepend Indian country code 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If already 12 digits starting with 91, return as is
  if (digits.startsWith('91') && digits.length === 12) {
    return digits;
  }

  return digits;
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
  );
}

export function getWhatsAppUrl(phone: string, text: string): string {
  const normalizedPhone = normalizePhoneNumberForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);

  if (isMobileDevice()) {
    // Mobile deep-link / standard API protocol
    return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
  }

  // Desktop: open WhatsApp Web
  return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`;
}
