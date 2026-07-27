const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
] as const;

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
] as const;

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones ? `${tens} ${ONES[ones]}` : tens;
}

function threeDigits(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));
  return parts.join(" ");
}

/** Whole-rupee part, Indian grouping (crore / lakh / thousand / hundred). */
function rupeesToWords(rupees: number): string {
  if (rupees === 0) return "Zero";

  const crore = Math.floor(rupees / 1e7);
  const lakh = Math.floor((rupees % 1e7) / 1e5);
  const thousand = Math.floor((rupees % 1e5) / 1e3);
  const hundred = rupees % 1e3;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(" ");
}

/**
 * Converts a rupee amount to words using Indian numbering (lakh/crore, not
 * million/billion) — e.g. 56000 -> "Fifty Six Thousand", 125000.50 ->
 * "One Lakh Twenty Five Thousand and Fifty Paise". Does not prepend "Rupees"
 * or append "Only" — callers own the surrounding sentence (e.g. "Rs, {this} Only.").
 */
export function numberToWordsInr(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const rupeeWords = rupeesToWords(rupees);
  if (paise === 0) return rupeeWords;

  const paiseWords = `${twoDigits(paise)} Paise`;
  return rupees === 0 ? paiseWords : `${rupeeWords} and ${paiseWords}`;
}
