const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertTwoDigits(num: number): string {
  if (num < 20) return ones[num];
  const ten = Math.floor(num / 10);
  const one = num % 10;
  return tens[ten] + (one ? " " + ones[one] : "");
}

function convertThreeDigits(num: number): string {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  
  if (hundred === 0) return convertTwoDigits(remainder);
  if (remainder === 0) return ones[hundred] + " Hundred";
  return ones[hundred] + " Hundred " + convertTwoDigits(remainder);
}

export function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + numberToWords(Math.abs(num));
  
  // Round to avoid floating point issues
  num = Math.round(num);
  
  // Indian numbering system: Crore, Lakh, Thousand, Hundred
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;
  
  const parts: string[] = [];
  
  if (crore > 0) {
    parts.push(convertTwoDigits(crore) + " Crore");
  }
  
  if (lakh > 0) {
    parts.push(convertTwoDigits(lakh) + " Lakh");
  }
  
  if (thousand > 0) {
    parts.push(convertTwoDigits(thousand) + " Thousand");
  }
  
  if (remainder > 0) {
    parts.push(convertThreeDigits(remainder));
  }
  
  return parts.join(" ") + " Rupees";
}
