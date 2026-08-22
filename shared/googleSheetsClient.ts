/** Browser-safe utilities for importing one-column, publicly published Google Sheet CSV files. */
export function getGoogleSheetCsvUrl(sheetUrl: string): string {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) ?? sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error("Enter a valid Google Sheets URL.");
  const gid = sheetUrl.match(/[#&]gid=([0-9]+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}

export function parseTermCsv(csvText: string): string[] {
  const rows = csvText
    .split(/\r?\n/)
    .map(row => row.replace(/^\uFEFF/, "").trim())
    .filter(Boolean);
  if (rows.length <= 1) throw new Error("CSV must include a header row and at least one term.");
  return rows.slice(1);
}
