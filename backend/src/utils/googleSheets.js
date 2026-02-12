import { google } from 'googleapis';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Team } from '../models/Team.js';
import { User } from '../models/User.js';

// Ensure referenced models are registered for populate() calls.
import '../models/Year.js';
import '../models/Subject.js';

const SHEET_TABS = [
  'Y1_Subject1',
  'Y1_Subject2',
  'Y2_Subject1',
  'Y2_Subject2',
  'Y3_Subject1',
  'Y3_Subject2',
];

const SHEET_HEADER = [
  'Team ID',
  'Team Name',
  'Year',
  'Subject',
  'Leader Roll',
  'Leader Name',
  'Leader Email',
  'Member1 Roll',
  'Member1 Name',
  'Member1 Email',
  'Member2 Roll',
  'Member2 Name',
  'Member2 Email',
  'Member3 Roll',
  'Member3 Name',
  'Member3 Email',
  'Mentor Name',
  'Mentor Email',
  'Status',
  'Member1 Marks',
  'Member1 Remarks',
  'Member2 Marks',
  'Member2 Remarks',
  'Member3 Marks',
  'Member3 Remarks',
];

function columnLetterFromIndex(index1Based) {
  let n = Number(index1Based);
  if (!Number.isFinite(n) || n < 1) return 'A';
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const SHEET_END_COL = columnLetterFromIndex(SHEET_HEADER.length);

function normalizeRowToHeader(row) {
  const out = Array.isArray(row) ? row.map((v) => (v ?? '')) : [];
  if (out.length > SHEET_HEADER.length) return out.slice(0, SHEET_HEADER.length);
  while (out.length < SHEET_HEADER.length) out.push('');
  return out;
}

function getEnv(name) {
  const v = process.env[name];
  return v && String(v).trim() ? String(v).trim() : null;
}

function getSheetsConfig() {
  const spreadsheetId = getEnv('GOOGLE_SHEETS_ID');
  const tabName = getEnv('GOOGLE_SHEETS_TAB') || 'Teams';
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  let privateKey = getEnv('GOOGLE_PRIVATE_KEY');
  const serviceAccountJsonPath = getEnv('GOOGLE_SERVICE_ACCOUNT_JSON_PATH');
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return { spreadsheetId, tabName, clientEmail, privateKey, serviceAccountJsonPath };
}

async function loadServiceAccountFromJson(maybePath) {
  if (!maybePath) return null;
  const resolvedPath = path.resolve(maybePath);
  const raw = await fs.readFile(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);
  const email = parsed?.client_email ? String(parsed.client_email).trim() : null;
  const key = parsed?.private_key ? String(parsed.private_key) : null;
  if (!email || !key) return null;
  return { clientEmail: email, privateKey: key };
}

async function getSheetsClient() {
  const { spreadsheetId, clientEmail: envEmail, privateKey: envKey, serviceAccountJsonPath } = getSheetsConfig();

  let clientEmail = envEmail;
  let privateKey = envKey;

  if ((!clientEmail || !privateKey) && serviceAccountJsonPath) {
    try {
      const fromJson = await loadServiceAccountFromJson(serviceAccountJsonPath);
      if (fromJson?.clientEmail && fromJson?.privateKey) {
        clientEmail = fromJson.clientEmail;
        privateKey = fromJson.privateKey;
      }
    } catch {
      // ignore; handled by missing vars check below
    }
  }

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!spreadsheetId || !clientEmail || !privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

function a1Range(tabName, cellsRange) {
  const safeTabName = String(tabName || '').replace(/'/g, "''");
  // Always quote tab names to support spaces and special characters
  return `'${safeTabName}'!${cellsRange}`;
}

function normalizeToken(v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '');
}

function parseYearNumber(year) {
  const code = normalizeToken(year?.code);
  const name = normalizeToken(year?.name);
  const v = code || name;
  if (v === '1' || v === 'y1') return '1';
  if (v === '2' || v === 'y2') return '2';
  if (v === '3' || v === 'y3') return '3';
  if (v === 'fy' || v.includes('firstyear')) return '1';
  if (v === 'sy' || v.includes('secondyear')) return '2';
  if (v === 'ty' || v.includes('thirdyear')) return '3';
  return null;
}

function parseSubjectSlot(subject) {
  const code = normalizeToken(subject?.code);
  const name = normalizeToken(subject?.name);
  const v = code || name;

  if (v === 'subject1' || v === 'sub1' || v === 's1') return '1';
  if (v === 'subject2' || v === 'sub2' || v === 's2') return '2';
  return null;
}

function tabNameForTeam(team) {
  const y = parseYearNumber(team?.year);
  const s = parseSubjectSlot(team?.subject);
  if (!y || !s) return null;
  return `Y${y}_Subject${s}`;
}

function flatRowForTeam(team) {
  const members = Array.isArray(team?.members) ? team.members : [];
  const leaderIndex = members.findIndex((m) => m?.role === 'leader');
  const leader = (leaderIndex >= 0 ? members[leaderIndex] : null) || members[0] || null;

  // Member subdocuments are stored with `_id: false`, so we must not use `_id` for comparisons.
  const others = members
    .filter((_, idx) => {
      if (leaderIndex >= 0) return idx !== leaderIndex;
      // If there is no explicit leader, treat the first member as leader.
      return idx !== 0;
    })
    .slice(0, 3);
  while (others.length < 3) others.push(null);

  const yearNum = parseYearNumber(team?.year) || '';
  const subjectSlot = parseSubjectSlot(team?.subject);
  const subjectText = subjectSlot ? `Subject${subjectSlot}` : '';

  const memberCols = others.flatMap((m) => [m?.rollNumber || '', m?.name || '', m?.email || '']);
  const marksCols = others.flatMap((m) => [m?.marks?.score ?? '', m?.marks?.remarks ?? '']);

  return [
    String(team._id),
    team.teamName || '',
    yearNum,
    subjectText,
    leader?.rollNumber || '',
    leader?.name || '',
    leader?.email || '',
    ...memberCols,
    team.mentor?.name || '',
    team.mentor?.email || '',
    team.status || '',
    ...marksCols,
  ];
}

async function ensureTabsExist(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingTitles = new Set((meta.data.sheets || []).map((s) => s.properties?.title).filter(Boolean));
  const missing = SHEET_TABS.filter((t) => !existingTitles.has(t));
  if (!missing.length) return { created: 0 };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
    },
  });

  return { created: missing.length };
}

async function ensureHeaderRow(sheets, spreadsheetId, tabTitle) {
  const range = a1Range(tabTitle, `A1:${SHEET_END_COL}1`);
  const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = resp.data.values || [];
  const row = values[0] || [];
  const matches =
    row.length === SHEET_HEADER.length && row.every((v, idx) => String(v || '').trim() === String(SHEET_HEADER[idx]));

  if (matches) return { updated: false };

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADER] },
  });

  return { updated: true };
}

async function ensureAllTabsAndHeaders(sheets, spreadsheetId) {
  const created = await ensureTabsExist(sheets, spreadsheetId);
  let headersUpdated = 0;
  for (const tab of SHEET_TABS) {
    const r = await ensureHeaderRow(sheets, spreadsheetId, tab);
    if (r.updated) headersUpdated += 1;
  }
  return { createdTabs: created.created, headersUpdated };
}

export async function syncToGoogleSheets() {
  const { spreadsheetId } = getSheetsConfig();
  const sheets = await getSheetsClient();
  if (!sheets) return { skipped: true, reason: 'Missing Google Sheets env vars' };

  const init = await ensureAllTabsAndHeaders(sheets, spreadsheetId);

  const teams = await Team.find({})
    .populate('year', 'name code')
    .populate('subject', 'name code')
    .lean();

  const grouped = new Map();
  let unmappedTeams = 0;

  for (const t of teams) {
    const tab = tabNameForTeam(t);
    if (!tab) {
      unmappedTeams += 1;
      continue;
    }
    const arr = grouped.get(tab) || [];
    arr.push(t);
    grouped.set(tab, arr);
  }

  const perTab = {};
  for (const tab of SHEET_TABS) {
    const rows = (grouped.get(tab) || []).map(flatRowForTeam);
    const readRange = a1Range(tab, `A1:${SHEET_END_COL}`);
    const nextValues = [SHEET_HEADER, ...rows.map(normalizeRowToHeader)];

    let existingValues = null;
    try {
      const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: readRange });
      existingValues = Array.isArray(existing?.data?.values) ? existing.data.values : null;
    } catch {
      existingValues = null;
    }

    const existingRowCount = Array.isArray(existingValues) ? existingValues.length : 0;
    const targetRowCount = Math.max(existingRowCount, nextValues.length);
    const paddedNextValues = nextValues.concat(
      Array.from({ length: Math.max(0, targetRowCount - nextValues.length) }, () =>
        Array.from({ length: SHEET_HEADER.length }, () => '')
      )
    );
    const writeRange = a1Range(tab, `A1:${SHEET_END_COL}${targetRowCount}`);

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: writeRange,
        valueInputOption: 'RAW',
        requestBody: { values: paddedNextValues },
      });
    } catch (err) {
      // Best-effort restore to avoid data loss if update fails mid-flight.
      if (existingValues) {
        const paddedExistingValues = existingValues.concat(
          Array.from({ length: Math.max(0, targetRowCount - existingValues.length) }, () =>
            Array.from({ length: SHEET_HEADER.length }, () => '')
          )
        );
        try {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: writeRange,
            valueInputOption: 'RAW',
            requestBody: { values: paddedExistingValues },
          });
        } catch {
          // ignore restore errors
        }
      }
      throw err;
    }
    perTab[tab] = rows.length;
  }

  return {
    skipped: false,
    init,
    tabs: perTab,
    teams: teams.length,
    unmappedTeams,
  };
}

export async function syncMentorUpdatesFromGoogleSheets() {
  const { spreadsheetId } = getSheetsConfig();
  const sheets = await getSheetsClient();
  if (!sheets) return { skipped: true, reason: 'Missing Google Sheets env vars' };

  await ensureAllTabsAndHeaders(sheets, spreadsheetId);

  let processed = 0;
  let updated = 0;
  const byTab = {};
  const unknownMentorEmails = new Set();
  const provisionedTeacherEmails = new Set();
  let provisionedTeachers = 0;

  for (const tab of SHEET_TABS) {
    const range = a1Range(tab, `A1:${SHEET_END_COL}`);
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const values = resp.data.values || [];
    if (!values.length) {
      byTab[tab] = { processed: 0, updated: 0 };
      continue;
    }

    const [header, ...dataRows] = values;
    const idxTeamId = header.indexOf('Team ID');
    const idxMentorName = header.indexOf('Mentor Name');
    const idxMentorEmail = header.indexOf('Mentor Email');

    if (idxTeamId < 0 || idxMentorName < 0 || idxMentorEmail < 0) {
      byTab[tab] = { processed: 0, updated: 0, skipped: true, reason: 'Missing required columns' };
      continue;
    }

    let processedTab = 0;
    let updatedTab = 0;

    const emailsInTab = Array.from(
      new Set(
        dataRows
          .map((row) => String(row?.[idxMentorEmail] || '').trim().toLowerCase())
          .filter(Boolean)
      )
    );

    // Auto-provision teacher users for mentor emails so they can log in.
    const teacherEmailSet = new Set();
    if (emailsInTab.length) {
      const nameByEmail = new Map();
      for (const row of dataRows) {
        const email = String(row?.[idxMentorEmail] || '').trim().toLowerCase();
        const name = String(row?.[idxMentorName] || '').trim();
        if (!email) continue;
        if (name && !nameByEmail.has(email)) nameByEmail.set(email, name);
      }

      const existing = await User.find(
        { email: { $in: emailsInTab } },
        { email: 1, role: 1 }
      ).lean();

      const existingByEmail = new Map();
      for (const u of existing || []) {
        if (u?.email) existingByEmail.set(String(u.email).toLowerCase(), u);
      }

      const toCreate = [];
      for (const email of emailsInTab) {
        const u = existingByEmail.get(email);
        if (!u) {
          toCreate.push({
            email,
            name: nameByEmail.get(email) || 'Teacher',
          });
          continue;
        }
        if (u.role === 'teacher') {
          teacherEmailSet.add(email);
        } else {
          // Email already exists but with a different role; do not auto-change roles.
          unknownMentorEmails.add(email);
        }
      }

      if (toCreate.length) {
        const bulk = toCreate.map((t) => ({
          updateOne: {
            filter: { email: t.email },
            update: {
              $setOnInsert: {
                email: t.email,
                name: t.name,
                role: 'teacher',
              },
            },
            upsert: true,
          },
        }));

        const result = await User.bulkWrite(bulk, { ordered: false });
        const inserted =
          Number(result?.upsertedCount || 0) ||
          (Array.isArray(result?.getUpsertedIds?.()) ? result.getUpsertedIds().length : 0);

        provisionedTeachers += inserted;
        for (const t of toCreate) {
          teacherEmailSet.add(t.email);
          provisionedTeacherEmails.add(t.email);
        }
      }
    }

    for (const row of dataRows) {
      const teamId = row[idxTeamId];
      if (!teamId) continue;
      processed += 1;
      processedTab += 1;

      const mentorName = String(row[idxMentorName] || '').trim();
      const mentorEmail = String(row[idxMentorEmail] || '').trim().toLowerCase();

      if (mentorEmail && !teacherEmailSet.has(mentorEmail)) unknownMentorEmails.add(mentorEmail);

      const result = await Team.updateOne(
        { _id: teamId },
        {
          $set: {
            'mentor.name': mentorName,
            'mentor.email': mentorEmail,
          },
        }
      );
      if (result.modifiedCount > 0) {
        updated += 1;
        updatedTab += 1;
      }
    }

    byTab[tab] = { processed: processedTab, updated: updatedTab };
  }

  return {
    skipped: false,
    processed,
    updated,
    byTab,
    provisionedTeachers,
    provisionedTeacherEmails: Array.from(provisionedTeacherEmails).sort(),
    unknownMentorEmails: Array.from(unknownMentorEmails).sort(),
  };
}

// Backwards-compatible exports (used by controllers)
export async function regenerateTeamsSheet() {
  return syncToGoogleSheets();
}

export async function syncMentorsFromSheet() {
  return syncMentorUpdatesFromGoogleSheets();
}
