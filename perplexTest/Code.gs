const SHEET_NAME = 'DailyTerms';

function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('index')
    .setTitle('Roget Amalgamations');
}

// Helper: get all rows as JSON
function getDailyData() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getValues(); // includes header
  const headers = values.shift();
  const rows = values.map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });

  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const todayIndex = rows.findIndex(r =>
    r.Date && Utilities.formatDate(new Date(r.Date), Session.getScriptTimeZone(), 'yyyy-MM-dd') === todayStr
  );

  return { rows, todayIndex, headers };
}

// Save one cell; colKey is header name like "History"
function saveAnswer(rowIndex, colKey, value) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const colIndex = headers.indexOf(colKey) + 1;
  if (colIndex < 1) throw new Error('Unknown column ' + colKey);

  const sheetRow = rowIndex + 2; // +1 for header, +1 because index is 0‑based
  sh.getRange(sheetRow, colIndex).setValue(value);
  return { ok: true };
}
