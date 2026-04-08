/**
 * Cleans Mathpix data for rendering.
 * - Converts block math \[ \] to inline math \( \)
 * - Removes extra whitespace and newlines
 * - Handles escaped backslashes if present
 */
export const cleanMathpixData = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  
  const cleaned = text
    .replace(/\\\\/g, '\\')         // Normalize double backslashes
    .replace(/\\\[/g, '$$$$')          // Convert Block Math to $$
    .replace(/\\\]/g, '$$$$')          // Convert Block Math to $$
    .replace(/\\\(/g, '$$')          // Convert Inline Math \( to $
    .replace(/\\\)/g, '$$')          // Convert Inline Math \) to $
    .replace(/\r\n/g, '\n')         // Normalize Windows newlines to Unix newlines (Do NOT remove them completely)
    .trim();

  return cleaned;
};
