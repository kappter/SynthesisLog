/**
 * Google Sheets integration for Synthesis Log
 * Supports importing term banks from publicly accessible Google Sheets
 */

/**
 * Convert Google Sheets URL to CSV export URL
 * Supports both edit and view URLs
 */
export function getSheetCsvUrl(sheetUrl: string): string {
  // Extract sheet ID from various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  let sheetId = null;
  for (const pattern of patterns) {
    const match = sheetUrl.match(pattern);
    if (match) {
      sheetId = match[1];
      break;
    }
  }

  if (!sheetId) {
    throw new Error("Invalid Google Sheets URL");
  }

  // Extract gid (sheet tab ID) if present
  const gidMatch = sheetUrl.match(/[#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetch and parse terms from a Google Sheet CSV export
 */
export async function fetchTermsFromSheet(sheetUrl: string): Promise<string[]> {
  const csvUrl = getSheetCsvUrl(sheetUrl);

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.statusText}. Make sure the sheet is publicly accessible.`);
  }

  const csvText = await response.text();
  return parseTermsFromCsv(csvText);
}

/**
 * Parse terms from CSV text
 * Expects a header row and one term per line
 */
function parseTermsFromCsv(csvText: string): string[] {
  const lines = csvText.split(/\r?\n/);
  const trimmed = lines
    .map(l => l.replace(/^\uFEFF/, '').trim()) // Remove BOM
    .filter(l => l !== '');

  if (trimmed.length <= 1) {
    throw new Error('CSV must have a header and at least one term');
  }

  // Skip header, return terms
  return trimmed.slice(1);
}

/**
 * Validate that a Google Sheets URL is accessible
 */
export async function validateSheetAccess(sheetUrl: string): Promise<boolean> {
  try {
    const csvUrl = getSheetCsvUrl(sheetUrl);
    const response = await fetch(csvUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
