export const toUnicodeScalarString = (emoji: string): string => {
  const out: number[] = [];
  for (const ch of emoji) out.push(ch.codePointAt(0)!);
  return out.map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`).join('-');
};
