import 'dotenv/config';
import { google } from 'googleapis';
import fs from 'node:fs/promises';
import path from 'node:path';

const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
const jsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH;

if (!spreadsheetId || !jsonPath) {
  console.log('Missing GOOGLE_SHEETS_ID or GOOGLE_SERVICE_ACCOUNT_JSON_PATH');
  process.exit(1);
}

const raw = await fs.readFile(path.resolve(jsonPath), 'utf8');
const creds = JSON.parse(raw);

const auth = new google.auth.JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

const meta = await sheets.spreadsheets.get({ spreadsheetId });
const titles = (meta.data.sheets || [])
  .map((s) => s.properties?.title)
  .filter(Boolean);

console.log(`Spreadsheet: ${spreadsheetId}`);
console.log(`Tabs (${titles.length}): ${titles.join(' | ')}`);

const picks = ['PBL Teams', 'Teams', 'Y1_Subject1', 'Y1_Subject2', 'Y2_Subject1', 'Y3_Subject1'];
for (const title of picks) {
  if (!titles.includes(title)) continue;

  const range = `'${title.replace(/'/g, "''")}'!A1:R3`;
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const rows = resp.data.values || [];

  console.log(`\nSample ${title} (${range}):`);
  for (const row of rows) console.log(row.join(' | '));
}
