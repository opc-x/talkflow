/** Normalize text for stable SSR/client rendering (ligatures, curly quotes, etc.). */
export function normalizeDisplayText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\uFB00/g, "ff")
    .replace(/\uFB01/g, "fi")
    .replace(/\uFB02/g, "fl")
    .replace(/\uFB03/g, "ffi")
    .replace(/\uFB04/g, "ffl")
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}
