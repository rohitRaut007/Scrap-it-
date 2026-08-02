/** Builds a wa.me deep link. Pass `phone` to open a chat with that number
 * (any format — non-digits are stripped), `text` to pre-fill a message, or
 * both. Omitting `phone` produces a share-sheet link (`wa.me/?text=...`). */
export function buildWhatsAppUrl(phone?: string, text?: string): string {
  const digits = phone ? phone.replace(/\D/g, "") : "";
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export const SUPPORT_WHATSAPP_NUMBER = "+917769977012";
