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

const ROGETS_SHEET = 'Rogets';

function getState() {
  const ss = SpreadsheetApp.getActive();
  const daily = ss.getSheetByName(SHEET_NAME);
  const rogets = ss.getSheetByName(ROGETS_SHEET);

  const dailyValues = daily.getDataRange().getValues();
  const headers = dailyValues.shift();
  const rows = dailyValues.map(r => {
    const o = {};
    headers.forEach((h, i) => o[h] = r[i]);
    return o;
  });

  const rogetsVals = rogets.getDataRange().getValues();
  rogetsVals.shift(); // header
  const unused = rogetsVals
    .filter(r => !r[2]) // Used is empty/false
    .map(r => ({ id: r[0], term: r[1] }));

  // Last 4 daily rows define current queue
  const last4 = rows.slice(-4);

  return { rows, last4, unused };
}

function advanceDay() {
  const ss = SpreadsheetApp.getActive();
  const daily = ss.getSheetByName(SHEET_NAME);
  const rogets = ss.getSheetByName(ROGETS_SHEET);

  const today = new Date();
  const nextDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // pick next unused term
  const roVals = rogets.getDataRange().getValues();
  const rHeaders = roVals.shift();
  let nextRowIndex = -1;
  for (let i = 0; i < roVals.length; i++) {
    if (!roVals[i][2]) { nextRowIndex = i + 2; break; }
  }
  if (nextRowIndex === -1) throw new Error('No unused Roget terms left');

  const nextTerm = rogets.getRange(nextRowIndex, 1, 1, 2).getValues()[0][1];

  // append next daily row: only Date + Term; others blank
  daily.appendRow([nextDate, nextTerm, '', '', '', '']);

  // mark term as used
  rogets.getRange(nextRowIndex, 3).setValue(true);

  return getState(); // new snapshot for UI
}

