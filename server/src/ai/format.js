const inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
// Hand-rolled rather than Intl so output doesn't vary with the runtime's ICU data ("Sep" vs "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatINR(amount) {
  return `₹${inrFormatter.format(amount)}`;
}

/** e.g. "14 Nov 2026" (UTC). */
export function formatDate(date) {
  if (!date) return 'n/a';
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Caps free text so a single long message can't blow up the prompt size. */
export function truncate(text, maxChars) {
  const trimmed = text.trim();
  return trimmed.length <= maxChars ? trimmed : `${trimmed.slice(0, maxChars)}… [truncated]`;
}
