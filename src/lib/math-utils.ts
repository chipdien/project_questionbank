/**
 * Cleans Mathpix data for rendering.
 * - Converts block math \[ \] to inline math \( \)
 * - Removes extra whitespace and newlines
 * - Handles escaped backslashes if present
 */
export const cleanMathpixData = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  
  return text
    .replace(/\\\\/g, '\\')         // Normalize double backslashes
    .replace(/\\\[/g, '\\(')        // Convert Block Math to Inline Math
    .replace(/\\\]/g, '\\)')        // Convert Block Math to Inline Math
    .replace(/[\r\n]+/g, ' ')      // Remove extra whitespaces/newlines
    .trim();
};
