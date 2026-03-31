/*
  Google Sheets lead capture for the Blue Ocean landing page.

  Setup:
  1. Create a Google Sheet.
  2. Open Extensions -> Apps Script.
  3. Paste this file into the script editor.
  4. Deploy -> New deployment -> Web app.
  5. Execute as: Me
  6. Who has access: Anyone
  7. Copy the deployed web app URL that ends with /exec.
  8. Paste that URL into SHEET_WEBHOOK_URL in /Users/chaitanyasingh/land/index.html.
*/

const SHEET_NAME = 'Leads';
const HEADERS = [
  'timestamp',
  'form_source',
  'user_type',
  'first_name',
  'last_name',
  'email',
  'phone',
  'grade',
  'school_name',
  'financial_aid',
  'page_url',
  'page_title'
];

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Lead capture endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getLeadSheet_();
  ensureHeaders_(sheet);

  const params = (e && e.parameter) || {};
  const row = HEADERS.map((header) => params[header] || '');

  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
