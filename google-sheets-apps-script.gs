/*
  Google Sheets capture for the Blue Ocean landing page and next-steps newsletter.

  What this script does:
  - Saves landing-page consultations into a `Leads` sheet.
  - Saves newsletter signups into a `Newsletter` sheet.
  - Updates an existing newsletter row when the same email subscribes again.

  Setup:
  1. Create a Google Sheet.
  2. Open Extensions -> Apps Script.
  3. Paste this file into the script editor.
  4. Deploy -> New deployment -> Web app.
  5. Execute as: Me
  6. Who has access: Anyone
  7. Copy the deployed web app URL that ends with /exec.
  8. Paste that URL into SHEET_WEBHOOK_URL in /Users/chaitanyasingh/land/index.html and /Users/chaitanyasingh/land/next-steps.html.
*/

const LEADS_SHEET_NAME = 'Leads';
const NEWSLETTER_SHEET_NAME = 'Newsletter';

const LEAD_HEADERS = [
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

const NEWSLETTER_HEADERS = ['timestamp', 'first_name', 'email', 'source'];

function getOrCreateSheet_(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function ensureNewsletterHeaders_(sheet) {
  ensureHeaders_(sheet, NEWSLETTER_HEADERS);

  const headerRange = sheet.getRange(1, 1, 1, NEWSLETTER_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0];
  const headersMatch = NEWSLETTER_HEADERS.every((header, index) => currentHeaders[index] === header);

  if (!headersMatch) {
    headerRange.setValues([NEWSLETTER_HEADERS]);
  }

  const maxColumns = sheet.getMaxColumns();
  if (maxColumns > NEWSLETTER_HEADERS.length) {
    sheet.deleteColumns(NEWSLETTER_HEADERS.length + 1, maxColumns - NEWSLETTER_HEADERS.length);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Lead and newsletter endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function normaliseEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function isNewsletterSubmission_(params) {
  return String(params.form_source || '').trim() === 'newsletter_next_steps';
}

function appendLead_(params) {
  const sheet = getOrCreateSheet_(LEADS_SHEET_NAME);
  ensureHeaders_(sheet, LEAD_HEADERS);
  const row = LEAD_HEADERS.map((header) => params[header] || '');
  sheet.appendRow(row);
}

function upsertNewsletter_(params) {
  const sheet = getOrCreateSheet_(NEWSLETTER_SHEET_NAME);
  ensureNewsletterHeaders_(sheet);

  const email = normaliseEmail_(params.email);
  if (!email) {
    throw new Error('Newsletter submissions require an email address.');
  }

  const row = [
    params.timestamp || new Date().toISOString(),
    params.first_name || '',
    email,
    params.form_source || 'newsletter_next_steps'
  ];

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const existingEmails = sheet.getRange(2, 3, lastRow - 1, 1).getValues().flat().map(normaliseEmail_);
    const existingIndex = existingEmails.indexOf(email);
    if (existingIndex !== -1) {
      sheet.getRange(existingIndex + 2, 1, 1, NEWSLETTER_HEADERS.length).setValues([row]);
      return;
    }
  }

  sheet.appendRow(row);
}

function doPost(e) {
  const params = (e && e.parameter) || {};
  if (isNewsletterSubmission_(params)) {
    upsertNewsletter_(params);
  } else {
    appendLead_(params);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
