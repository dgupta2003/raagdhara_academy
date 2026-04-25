#!/usr/bin/env node
/**
 * Raagdhara Academy — Data Migration Script
 *
 * Imports students, guardians, payments, and attendance from CSV spreadsheets
 * into Firestore.
 *
 * Run:  node scripts/migrate.js            (live)
 *       node scripts/migrate.js --dry-run  (preview only, no writes)
 *
 * Requires .env.local in the project root with Firebase Admin credentials.
 */

const fs = require('fs');
const path = require('path');

// ── Environment loading ───────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local not found in project root');
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsv(content) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  // Normalize line endings
  const str = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuotes) {
      if (ch === '"' && str[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cell += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(cell.trim()); cell = ''; }
      else if (ch === '\n') { row.push(cell.trim()); rows.push(row); row = []; cell = ''; }
      else { cell += ch; }
    }
  }
  if (cell || row.length > 0) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

function readCsv(filename) {
  const filepath = path.join(__dirname, '..', 'current_datafiles', filename);
  if (!fs.existsSync(filepath)) { console.warn(`  [WARN] File not found: ${filename}`); return []; }
  return parseCsv(fs.readFileSync(filepath, 'utf8'));
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COURSE_MAP = {
  'Hindustani Classical Vocal Music': 'hindustani-classical-vocal',
  'Popular and Film Music - Hindi': 'popular-film-music-hindi',
  'Devotional - Hindi': 'devotional-hindi',
  'Ghazal': 'ghazal',
  'Bhatkhande Sangeet Vidyapeeth - Full Course': 'bhatkhande-full-course',
};

const BATCH_MAP = {
  'Normal Batch': 'normal',
  'Special Batch': 'special',
  'Personal Classes': 'personal',
};

const MONTH_NUM = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
};

// ── Name utilities ─────────────────────────────────────────────────────────────

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function namesMatch(n1, n2) {
  const a = normalizeName(n1), b = normalizeName(n2);
  if (!a || !b) return null;
  if (a === b) return 'exact';
  if (a.startsWith(b + ' ') || b.startsWith(a + ' ') || a === b.split(' ')[0] || b === a.split(' ')[0]) return 'prefix';
  const aw = a.split(' ')[0], bw = b.split(' ')[0];
  if (aw === bw) return 'first-word';
  if (levenshtein(aw, bw) <= 1 && aw.length > 3) return 'fuzzy-first';
  return null;
}

// ── Date utilities ─────────────────────────────────────────────────────────────

function toISODate(year, month, day) {
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function parseAttendanceDateHeader(header, fallbackYear = 2026) {
  const h = (header || '').trim();
  // "02-01-2026" → MM-DD-YYYY
  let m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(h);
  if (m) return { month: parseInt(m[1]), day: parseInt(m[2]), year: parseInt(m[3]) };
  // "1 March" or "31 March"
  m = /^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)$/i.exec(h);
  if (m) return { day: parseInt(m[1]), month: MONTH_NUM[m[2].toLowerCase()], year: fallbackYear };
  return null;
}

function parseJoiningDate(dateStr) {
  if (!dateStr) return null;
  const m = /(\d+)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{4})/i.exec(dateStr.trim());
  if (!m) return null;
  const mon = MONTH_NUM[m[2].toLowerCase().slice(0,3) + (m[2].length > 3 ? m[2].slice(3) : '')] ||
    MONTH_NUM[{ jan:'january',feb:'february',mar:'march',apr:'april',may:'may',jun:'june',
      jul:'july',aug:'august',sep:'september',oct:'october',nov:'november',dec:'december'
    }[m[2].toLowerCase()]];
  if (!mon) return null;
  return new Date(`${m[3]}-${String(mon).padStart(2,'0')}-${String(parseInt(m[1])).padStart(2,'0')}`);
}

function parseAge(ageStr) {
  const m = /\d+/.exec((ageStr || '').trim());
  return m ? parseInt(m[0]) : null;
}

function parseAmount(amountStr) {
  // Returns rupees as a float, or null if not a valid amount
  const s = (amountStr || '').trim().replace(/[₹,\s]/g, '');
  if (!s || s === '-' || s.toLowerCase() === 'pending') return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalizeEmail(email) {
  return (email || '').toLowerCase().trim();
}

function deriveCategory(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('usa') || c.includes('united states') || c.includes('us ') || c === 'us') return 'nri';
  if (c.includes('canada') || c.includes('uk') || c.includes('australia') || c.includes('singapore') || c.includes('uae')) return 'nri';
  return 'india';
}

function deriveCountryCode(country) {
  const c = (country || '').toLowerCase();
  if (c.includes('usa') || c.includes('united states')) return '+1';
  if (c.includes('uk') || c.includes('united kingdom')) return '+44';
  if (c.includes('canada')) return '+1';
  if (c.includes('australia')) return '+61';
  if (c.includes('singapore')) return '+65';
  if (c.includes('uae') || c.includes('dubai')) return '+971';
  return '+91';
}

// ── Parse registration forms ───────────────────────────────────────────────────

function parseRegistrationForm(filename) {
  const rows = readCsv(filename);
  const students = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 18 || !r[2]) continue;
    const email = normalizeEmail(r[1]);
    const displayName = (r[2] || '').trim();
    const ageRaw = r[3] || '';
    const country = r[5] || '';
    const phone = (r[7] || '').replace(/[\s\-()]/g, '');
    const isMinorRaw = (r[9] || '').trim().toLowerCase() === 'yes';
    const parentName = (r[10] || '').trim();
    const parentPhone = (r[11] || '').replace(/[\s\-()]/g, '');
    const parentEmail = normalizeEmail(r[12]);
    const courseRaw = (r[17] || '').trim();
    const batchRaw = (r[18] || '').trim();
    const timestamp = r[0] || '';

    if (!displayName) continue;

    const age = parseAge(ageRaw);
    const isMinor = age !== null ? age < 18 : isMinorRaw;
    const category = deriveCategory(country);
    const countryCode = phone.startsWith('+') ? phone.slice(0, phone.search(/\d{5,}/)) || deriveCountryCode(country) : deriveCountryCode(country);
    const cleanPhone = phone.replace(/^\+\d+/, '').replace(/[^0-9]/g, '').slice(-10);
    const courseId = COURSE_MAP[courseRaw] || 'hindustani-classical-vocal';
    const batchType = BATCH_MAP[batchRaw] || 'normal';

    const enrollDate = timestamp ? new Date(timestamp) : null;

    students.push({
      source: 'form',
      email,
      displayName,
      age,
      phone: cleanPhone || phone,
      countryCode: countryCode.startsWith('+') ? countryCode : '+91',
      country,
      category,
      courseId,
      batchType,
      isMinor,
      parentName,
      parentPhone,
      parentEmail,
      enrollDate,
      nriCurrencyPreference: category === 'nri' ? 'usd' : 'inr-equivalent',
    });
  }
  return students;
}

// ── Parse ledger ───────────────────────────────────────────────────────────────

function parseLedger(filename) {
  const rows = readCsv(filename);
  const months = [];   // [{ monthLabel, year, month, students: [{name, batch, amountRupees, joiningDate, status}] }]
  let currentMonth = null;
  let inHeader = false;

  for (const r of rows) {
    if (!r || r.length === 0 || r.every(c => !c)) continue;
    const firstCell = (r[0] || '').trim();
    // Detect month header: "MONTH - February 2026" or "Month - March 2026"
    if (/^(MONTH|Month)\s*-\s*(.+)/i.test(firstCell)) {
      const mMatch = /(\w+)\s+(\d{4})/.exec(firstCell);
      if (mMatch) {
        const monthName = mMatch[1].toLowerCase();
        const year = parseInt(mMatch[2]);
        const month = MONTH_NUM[monthName];
        if (month) {
          currentMonth = { monthLabel: firstCell, year, month, students: [] };
          months.push(currentMonth);
          inHeader = true;
        }
      }
      continue;
    }
    // Detect header row
    if (firstCell === 'STUDENT NAME') { inHeader = false; continue; }
    if (!currentMonth || inHeader) continue;
    // Skip total/blank rows
    if (!firstCell || firstCell === 'Total' || firstCell.toLowerCase().startsWith('total')) continue;

    const name = firstCell;
    const batch = (r[1] || '').trim();
    const amountRaw = (r[2] || '').trim();
    const joiningDateRaw = (r[3] || '').trim();

    const isPending = amountRaw.toLowerCase() === 'pending';
    const amountRupees = parseAmount(amountRaw);
    const joiningDate = parseJoiningDate(joiningDateRaw);
    const status = isPending ? 'pending' : (amountRupees !== null ? 'paid' : null);

    // Derive batch type and category from ledger batch label
    let batchType = 'normal', category = 'india';
    const batchLower = batch.toLowerCase();
    if (batchLower.includes('personal') && batchLower.includes('nri')) { batchType = 'personal'; category = 'nri'; }
    else if (batchLower.includes('personal')) { batchType = 'personal'; category = 'india'; }
    else if (batchLower.includes('special')) { batchType = 'special'; }
    else if (batchLower.includes('normal') || batchLower.includes('kids')) { batchType = 'normal'; }

    if (status !== null) {
      currentMonth.students.push({ name, batch, batchType, category, amountRupees, joiningDate, status });
    }
  }
  return months;
}

// ── Parse group attendance (Kids/Normal A/Normal B) ────────────────────────────

function parseGroupAttendance(filename) {
  // Returns: [{studentName, date: 'YYYY-MM-DD', status: 'present'|'absent'}]
  const rows = readCsv(filename);
  const records = [];

  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    if (!r || r.length < 2) { i++; continue; }
    const firstCell = (r[0] || '').trim();

    // Detect section header: first cell is "Sr No" or "Sr. No."
    if (/^sr\.?\s*no\.?/i.test(firstCell)) {
      // Parse date columns (indices 2 onwards, until we hit non-date or summary columns)
      const dateCols = []; // [{colIndex, date}]
      for (let col = 2; col < r.length; col++) {
        const parsed = parseAttendanceDateHeader(r[col]);
        if (parsed && parsed.day && parsed.month) {
          dateCols.push({ col, date: toISODate(parsed.year, parsed.month, parsed.day) });
        }
      }

      i += 2; // Skip header + day-name row

      // Read student rows until blank row or next section header
      while (i < rows.length) {
        const sr = rows[i];
        if (!sr || sr.length < 2) { i++; break; }
        const srFirst = (sr[0] || '').trim();
        if (/^sr\.?\s*no\.?/i.test(srFirst)) break; // next section

        const studentName = (sr[1] || '').trim();
        if (!studentName) { i++; continue; }

        for (const { col, date } of dateCols) {
          const val = (sr[col] || '').trim().toUpperCase();
          if (val === 'P') records.push({ studentName, date, status: 'present' });
          else if (val === 'A') records.push({ studentName, date, status: 'absent' });
          // OVER and blank = skip
        }
        i++;
      }
    } else {
      i++;
    }
  }
  return records;
}

// ── Parse individual attendance (Hriday/Rajendra/Shasvat) ─────────────────────

function parseIndividualAttendance(filename) {
  const rows = readCsv(filename);
  const records = [];
  const YEAR = 2026;

  // Find the row with "Month" header (row 2, 0-indexed)
  let monthRow = null;
  for (let i = 0; i < rows.length && i < 5; i++) {
    if ((rows[i][0] || '').trim().toLowerCase() === 'month') { monthRow = i; break; }
  }
  if (monthRow === null) return records;

  const monthHeaders = rows[monthRow]; // ['Month', 'March', 'April', ...]
  // Extract month columns: [{colIndex, month: 3}]
  const monthCols = [];
  for (let col = 1; col < monthHeaders.length; col++) {
    const mName = (monthHeaders[col] || '').trim().toLowerCase();
    if (MONTH_NUM[mName]) monthCols.push({ col, month: MONTH_NUM[mName] });
  }

  // Read day rows (below month header)
  for (let i = monthRow + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    const dayNum = parseInt((r[0] || '').trim());
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) continue; // stop at Classes Done/Status rows

    for (const { col, month } of monthCols) {
      if (dayNum > daysInMonth(YEAR, month)) continue; // skip invalid dates
      const val = (r[col] || '').trim().toUpperCase();
      if (val === 'P') records.push({ date: toISODate(YEAR, month, dayNum), status: 'present' });
      else if (val === 'A') records.push({ date: toISODate(YEAR, month, dayNum), status: 'absent' });
    }
  }
  return records;
}

// ── Build canonical student roster ─────────────────────────────────────────────

function buildRoster(formStudents, ledgerMonths) {
  // Start with form students as the canonical set
  const roster = formStudents.map(s => ({ ...s, ledgerBatch: null, ledgerCategory: null, joiningDate: s.enrollDate, payments: [] }));

  // Collect all unique names from ledger
  const ledgerNames = new Set();
  for (const month of ledgerMonths) {
    for (const s of month.students) ledgerNames.add(s.name);
  }

  const possibleMatches = [];

  for (const ledgerName of ledgerNames) {
    // Try to find a match in the roster
    let matched = null;
    let matchType = null;
    for (const rs of roster) {
      const mt = namesMatch(ledgerName, rs.displayName);
      if (mt) {
        if (!matched || (matchType === 'fuzzy-first' && mt !== 'fuzzy-first')) {
          matched = rs;
          matchType = mt;
        }
      }
    }

    if (matched && (matchType === 'exact' || matchType === 'prefix')) {
      // Confident match — link
      if (!matched._ledgerNames) matched._ledgerNames = [];
      matched._ledgerNames.push(ledgerName);
    } else if (matched && (matchType === 'first-word' || matchType === 'fuzzy-first')) {
      possibleMatches.push({ ledgerName, registrationName: matched.displayName, matchType, action: 'auto-linked (please verify)' });
      if (!matched._ledgerNames) matched._ledgerNames = [];
      matched._ledgerNames.push(ledgerName);
    } else {
      // No match — stub student (no email)
      const existing = roster.find(r => normalizeName(r.displayName) === normalizeName(ledgerName));
      if (!existing) {
        roster.push({
          source: 'ledger',
          email: '',
          displayName: ledgerName.trim(),
          age: null,
          phone: '',
          countryCode: '+91',
          country: '',
          category: 'india', // will be overridden from ledger batch
          courseId: 'hindustani-classical-vocal',
          batchType: 'normal',
          isMinor: false,
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          enrollDate: null,
          nriCurrencyPreference: 'inr-equivalent',
          payments: [],
          _ledgerNames: [ledgerName],
        });
      }
    }
  }

  // Attach ledger data (batch type, category, joining date) from first appearance
  for (const month of ledgerMonths) {
    for (const ls of month.students) {
      const student = roster.find(r => r._ledgerNames && r._ledgerNames.includes(ls.name));
      if (!student) continue;
      // First appearance determines batch/category/joining date
      if (!student.ledgerBatch) {
        student.ledgerBatch = ls.batchType;
        student.ledgerCategory = ls.category;
        if (!student.joiningDate && ls.joiningDate) student.joiningDate = ls.joiningDate;
        // Override category from ledger (more reliable)
        student.category = ls.category;
        student.batchType = ls.batchType;
        student.nriCurrencyPreference = ls.category === 'nri' ? 'usd' : 'inr-equivalent';
      }
      // Attach payment record
      student.payments.push({
        month: month.month,
        year: month.year,
        amountRupees: ls.amountRupees,
        status: ls.status,
        joiningDate: ls.joiningDate,
      });
    }
  }

  return { roster, possibleMatches };
}

// ── Main migration ─────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n🎵 Raagdhara Academy — Migration Script`);
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`   Date: ${new Date().toLocaleString()}\n`);

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error('❌ Missing Firebase Admin credentials in .env.local');
    process.exit(1);
  }

  const admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  const db = admin.firestore();

  const report = {
    runAt: new Date().toISOString(),
    dryRun: isDryRun,
    summary: { studentsCreated: 0, guardiansCreated: 0, paymentsCreated: 0, attendanceCreated: 0, skipped: 0 },
    flags: [],
    possibleNameMatches: [],
    studentsWithoutEmail: [],
    studentRoster: [],
    errors: [],
  };

  // ── Step 1: Parse all data files ─────────────────────────────────────────────

  console.log('📂 Parsing data files...');

  const formNormal = parseRegistrationForm("Raagdhara _ Normal Batch Registration Form (Responses) - Form Responses 1.csv");
  const formPersonal = parseRegistrationForm("Raagdhara _ Personal Class Registration Form (Responses) - Form Responses 1.csv");
  const allFormStudents = [...formNormal, ...formPersonal];
  console.log(`   Registration forms: ${allFormStudents.length} students`);

  // Deduplicate form students by email+name (handle siblings sharing same parent email)
  const uniqueFormStudents = [];
  for (const s of allFormStudents) {
    const dup = uniqueFormStudents.find(u =>
      normalizeEmail(u.email) === normalizeEmail(s.email) &&
      normalizeName(u.displayName) === normalizeName(s.displayName)
    );
    if (!dup) uniqueFormStudents.push(s);
  }

  const ledgerMonths = parseLedger("Raagdhara - Ledger 2026 - Sheet1.csv");
  console.log(`   Ledger: ${ledgerMonths.length} months, ${ledgerMonths.reduce((sum, m) => sum + m.students.length, 0)} payment entries`);

  // ── Step 2: Build canonical roster ──────────────────────────────────────────

  console.log('\n📋 Building canonical student roster...');
  const { roster, possibleMatches } = buildRoster(uniqueFormStudents, ledgerMonths);
  report.possibleNameMatches = possibleMatches;
  console.log(`   Total students: ${roster.length}`);

  // Flag data issues
  const emailToStudents = {};
  for (const s of roster) {
    if (!s.email) {
      report.studentsWithoutEmail.push(s.displayName);
    } else {
      if (!emailToStudents[s.email]) emailToStudents[s.email] = [];
      emailToStudents[s.email].push(s.displayName);
    }
    // Divyanshu: age 24 but possibly flagged as minor
    if (s.displayName.toLowerCase().includes('divyanshu') && s.isMinor) {
      s.isMinor = false;
      report.flags.push({
        name: s.displayName,
        flag: 'Self-reported as minor but age is 24. Set isMinor=false. Please verify.',
      });
    }
    // Lavanya/Abhisht: same contact email (pragyaresham@gmail.com) — same parent
    if (s.parentEmail === 'pandeyudiit@gmail.com') {
      report.flags.push({
        name: s.displayName,
        flag: 'Parent email "pandeyudiit@gmail.com" may be a typo for "pandeyudit@gmail.com". Will use "pandeyudit@gmail.com".',
      });
      s.parentEmail = 'pandeyudit@gmail.com';
    }
    // Student email = guardian email (student and parent share same login)
    if (s.isMinor && s.parentEmail && s.email && s.email === s.parentEmail) {
      report.flags.push({
        name: s.displayName,
        flag: `Student email (${s.email}) is the same as guardian email. One Firebase Auth account will serve as the parent login. Do NOT send a student portal invite to this email — use the guardian invite instead.`,
      });
    }
  }
  // Flag duplicate student emails
  for (const [email, names] of Object.entries(emailToStudents)) {
    if (names.length > 1) {
      report.flags.push({
        name: names.join(' + '),
        flag: `Multiple students share email ${email}: [${names.join(', ')}]. These students cannot each have their own login. Verify if they are siblings (using a shared family email) or duplicates. The student invite will create one account for this email — only the first student's portal will be accessible.`,
      });
    }
  }

  console.log(`   Without email: ${report.studentsWithoutEmail.length}`);
  if (possibleMatches.length) {
    console.log(`   Possible name matches requiring review: ${possibleMatches.length}`);
    for (const m of possibleMatches) console.log(`     - "${m.ledgerName}" ↔ "${m.registrationName}" (${m.matchType})`);
  }

  // ── Step 3: Parse attendance files ──────────────────────────────────────────

  console.log('\n📅 Parsing attendance files...');

  const groupAttendance = [
    ...parseGroupAttendance("Kids Normal Batch - Attendance - Sheet1.csv"),
    ...parseGroupAttendance("Normal Batch - A - Sheet2.csv"),
    ...parseGroupAttendance("Normal Batch - B - Sheet2.csv"),
  ];
  console.log(`   Group attendance records: ${groupAttendance.length}`);

  const individualHriday = parseIndividualAttendance("Hriday -  Attendance 2026 - Sheet1.csv");
  const individualRajendra = parseIndividualAttendance("Rajendra Agarwal -  Attendance 2026 - Sheet1.csv");
  const individualShasvat = parseIndividualAttendance("Shasvat Tripathi - Attendance 2026 - Sheet1.csv");

  // Map individual attendance by file-name → records (candidate names listed for roster lookup)
  const individualFiles = [
    { candidateNames: ['Hriday', 'Hriday Salvi'], records: individualHriday },
    { candidateNames: ['Rajendra Agarwal'], records: individualRajendra },
    { candidateNames: ['Shasvat Tripathi', 'Shaswat Tripathi'], records: individualShasvat },
  ];
  const totalIndividual = individualHriday.length + individualRajendra.length + individualShasvat.length;
  console.log(`   Individual attendance records: ${totalIndividual}`);

  // ── Step 4: Create student Firestore records ─────────────────────────────────

  console.log('\n👥 Creating student records...');
  const studentDocIdByName = {}; // normalizedName → docId (for attendance/payment linking)

  for (const s of roster) {
    try {
      // Check if student already exists (by email if available, else by name)
      let existingDocId = null;
      if (s.email) {
        const snap = await db.collection('students').where('email', '==', s.email).where('displayName', '==', s.displayName).limit(1).get();
        if (!snap.empty) existingDocId = snap.docs[0].id;
      }
      if (!existingDocId) {
        const snap = await db.collection('students').where('displayName', '==', s.displayName).limit(1).get();
        if (!snap.empty) existingDocId = snap.docs[0].id;
      }

      if (existingDocId) {
        console.log(`   [SKIP] ${s.displayName} — already exists (${existingDocId})`);
        report.summary.skipped++;
        studentDocIdByName[normalizeName(s.displayName)] = existingDocId;
        if (s._ledgerNames) {
          for (const ln of s._ledgerNames) studentDocIdByName[normalizeName(ln)] = existingDocId;
        }
        report.studentRoster.push({ docId: existingDocId, displayName: s.displayName, email: s.email, batch: `${s.batchType} (${s.category})`, isMinor: s.isMinor, guardianEmail: s.parentEmail, status: 'existing' });
        continue;
      }

      const docRef = db.collection('students').doc();
      const docId = docRef.id;

      const enrollDate = s.joiningDate ? admin.firestore.Timestamp.fromDate(new Date(s.joiningDate)) : admin.firestore.FieldValue.serverTimestamp();

      const studentData = {
        uid: docId,
        email: s.email || '',
        displayName: s.displayName,
        phone: s.phone || '',
        countryCode: s.countryCode || '+91',
        category: s.category,
        nriCurrencyPreference: s.nriCurrencyPreference,
        courseId: s.courseId,
        batchType: s.batchType,
        status: 'active',
        isMinor: s.isMinor || false,
        enrollmentDate: enrollDate,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const userData = {
        email: s.email || '',
        role: 'student',
        studentId: docId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!isDryRun) {
        const batch = db.batch();
        batch.set(docRef, studentData);
        batch.set(db.collection('users').doc(docId), userData);
        await batch.commit();
      }

      studentDocIdByName[normalizeName(s.displayName)] = docId;
      if (s._ledgerNames) {
        for (const ln of s._ledgerNames) studentDocIdByName[normalizeName(ln)] = docId;
      }

      report.summary.studentsCreated++;
      report.studentRoster.push({ docId, displayName: s.displayName, email: s.email, batch: `${s.batchType} (${s.category})`, isMinor: s.isMinor, guardianEmail: s.parentEmail, status: isDryRun ? 'dry-run' : 'created' });
      console.log(`   [CREATE] ${s.displayName}${s.email ? ` <${s.email}>` : ' (no email)'}  [${s.batchType}/${s.category}]`);

    } catch (err) {
      console.error(`   [ERROR] ${s.displayName}: ${err.message}`);
      report.errors.push({ context: `student:${s.displayName}`, error: err.message });
    }
  }

  // ── Step 5: Create guardian records ─────────────────────────────────────────

  console.log('\n👨‍👩‍👧 Creating guardian records...');

  // Collect minors with parent data
  const guardiansToCreate = new Map(); // parentEmail → { guardian data, studentIds }

  for (const s of roster) {
    if (!s.isMinor || !s.parentEmail) continue;
    const studentDocId = studentDocIdByName[normalizeName(s.displayName)];
    if (!studentDocId) continue;

    const key = s.parentEmail;
    if (!guardiansToCreate.has(key)) {
      guardiansToCreate.set(key, {
        email: s.parentEmail,
        displayName: s.parentName || 'Parent',
        phone: s.parentPhone || '',
        countryCode: s.countryCode || '+91',
        relationship: 'Parent',
        studentIds: [],
        studentNames: {},
      });
    }
    const g = guardiansToCreate.get(key);
    if (!g.studentIds.includes(studentDocId)) {
      g.studentIds.push(studentDocId);
      g.studentNames[studentDocId] = s.displayName;
    }
  }

  for (const [email, gData] of guardiansToCreate) {
    try {
      // Check if guardian already exists
      const snap = await db.collection('guardians').where('email', '==', email).limit(1).get();
      if (!snap.empty) {
        console.log(`   [SKIP] Guardian ${email} — already exists`);
        report.summary.skipped++;
        const existingId = snap.docs[0].id;
        // Still update students with guardianUid
        if (!isDryRun) {
          for (const studentId of gData.studentIds) {
            await db.collection('students').doc(studentId).update({ guardianUid: existingId, isMinor: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          }
        }
        continue;
      }

      // Get or create Firebase Auth account for guardian (no password)
      let guardianAuthUid;
      try {
        const existingUser = await admin.auth().getUserByEmail(email);
        guardianAuthUid = existingUser.uid;
        console.log(`   [AUTH EXISTS] Guardian ${email}`);
      } catch {
        if (!isDryRun) {
          const newUser = await admin.auth().createUser({ email, emailVerified: true });
          guardianAuthUid = newUser.uid;
        } else {
          guardianAuthUid = `dry-run-guardian-${email.split('@')[0]}`;
        }
      }

      const guardianData = {
        uid: guardianAuthUid,
        email,
        displayName: gData.displayName,
        phone: gData.phone,
        countryCode: gData.countryCode,
        relationship: gData.relationship,
        studentIds: gData.studentIds,
        studentNames: gData.studentNames,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!isDryRun) {
        const batch = db.batch();
        batch.set(db.collection('guardians').doc(guardianAuthUid), guardianData);
        batch.set(db.collection('users').doc(guardianAuthUid), {
          email,
          role: 'parent',
          guardianId: guardianAuthUid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await batch.commit();

        // Link guardian to each student
        for (const studentId of gData.studentIds) {
          await db.collection('students').doc(studentId).update({
            guardianUid: guardianAuthUid,
            isMinor: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      report.summary.guardiansCreated++;
      console.log(`   [CREATE] Guardian ${email} → students: ${gData.studentIds.join(', ')}`);
    } catch (err) {
      console.error(`   [ERROR] Guardian ${email}: ${err.message}`);
      report.errors.push({ context: `guardian:${email}`, error: err.message });
    }
  }

  // ── Step 6: Create payment records ──────────────────────────────────────────

  console.log('\n💰 Creating payment records...');

  for (const s of roster) {
    const studentDocId = studentDocIdByName[normalizeName(s.displayName)];
    if (!studentDocId || !s.payments || s.payments.length === 0) continue;

    for (const p of s.payments) {
      const docId = `${studentDocId}_payment_${p.year}-${String(p.month).padStart(2,'0')}`;
      const dueDate = toISODate(p.year, p.month, 1); // 1st of the month
      const amountPaise = p.amountRupees !== null ? Math.round(p.amountRupees * 100) : 0;

      try {
        const existing = await db.collection('payments').doc(docId).get();
        if (existing.exists) {
          report.summary.skipped++;
          continue;
        }

        const paidAt = p.status === 'paid'
          ? admin.firestore.Timestamp.fromDate(new Date(`${p.year}-${String(p.month + 1 > 12 ? 1 : p.month + 1).padStart(2,'0')}-01`))
          : null;

        const paymentData = {
          studentId: studentDocId,
          studentName: s.displayName,
          studentEmail: s.email || '',
          amount: amountPaise,
          currency: 'INR',
          status: p.status,
          dueDate,
          ...(paidAt ? { paidAt } : {}),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (!isDryRun) {
          await db.collection('payments').doc(docId).set(paymentData);
        }
        report.summary.paymentsCreated++;
        console.log(`   [CREATE] Payment ${s.displayName} ${p.year}-${String(p.month).padStart(2,'0')} ₹${p.amountRupees || 0} [${p.status}]`);
      } catch (err) {
        console.error(`   [ERROR] Payment ${s.displayName} ${p.year}-${p.month}: ${err.message}`);
        report.errors.push({ context: `payment:${s.displayName}:${p.year}-${p.month}`, error: err.message });
      }
    }
  }

  // ── Step 7: Create attendance records ────────────────────────────────────────

  console.log('\n📆 Creating attendance records...');

  // Process group attendance
  for (const rec of groupAttendance) {
    const studentDocId = studentDocIdByName[normalizeName(rec.studentName)];
    if (!studentDocId) {
      // Quietly skip — we might not have matched the name yet in dry-run
      continue;
    }
    await writeAttendanceRecord(db, studentDocId, rec.date, rec.status, isDryRun, report, roster);
  }

  // Process individual attendance — resolve each file to one studentDocId using candidate names
  for (const { candidateNames, records } of individualFiles) {
    let studentDocId = null;
    for (const rawName of candidateNames) {
      studentDocId = studentDocIdByName[normalizeName(rawName)];
      if (!studentDocId) {
        for (const [normName, docId] of Object.entries(studentDocIdByName)) {
          if (namesMatch(rawName, normName)) { studentDocId = docId; break; }
        }
      }
      if (studentDocId) break;
    }
    if (!studentDocId) continue;

    for (const rec of records) {
      await writeAttendanceRecord(db, studentDocId, rec.date, rec.status, isDryRun, report, roster);
    }
  }

  // ── Step 8: Write report ──────────────────────────────────────────────────────

  const reportPath = path.join(__dirname, '..', 'current_datafiles', 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n✅ Migration complete!');
  console.log(`   Students created: ${report.summary.studentsCreated}`);
  console.log(`   Guardians created: ${report.summary.guardiansCreated}`);
  console.log(`   Payment records: ${report.summary.paymentsCreated}`);
  console.log(`   Attendance records: ${report.summary.attendanceCreated}`);
  console.log(`   Skipped (already exists): ${report.summary.skipped}`);
  console.log(`   Errors: ${report.errors.length}`);
  if (report.studentsWithoutEmail.length) {
    console.log(`\n⚠️  Students without email (invite disabled until admin fills email):`);
    for (const name of report.studentsWithoutEmail) console.log(`   - ${name}`);
  }
  if (report.errors.length) {
    console.log('\n❌ Errors:');
    for (const e of report.errors) console.log(`   - ${e.context}: ${e.error}`);
  }
  console.log(`\n📄 Full report saved to: ${reportPath}\n`);
}

async function writeAttendanceRecord(db, studentDocId, date, status, isDryRun, report, roster) {
  const docId = `${studentDocId}_${date}`;
  try {
    const existing = await db.collection('attendance').doc(docId).get();
    if (existing.exists) { report.summary.skipped++; return; }

    // Find student courseId/batchType
    const studentDoc = await db.collection('students').doc(studentDocId).get();
    const courseId = studentDoc.exists ? (studentDoc.data().courseId || 'hindustani-classical-vocal') : 'hindustani-classical-vocal';
    const batchType = studentDoc.exists ? (studentDoc.data().batchType || 'normal') : 'normal';

    const data = {
      studentId: studentDocId,
      sessionDate: date,
      courseId,
      batchType,
      status,
      markedBy: 'migration',
      markedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!isDryRun) {
      await db.collection('attendance').doc(docId).set(data);
    }
    report.summary.attendanceCreated++;
  } catch (err) {
    report.errors.push({ context: `attendance:${studentDocId}:${date}`, error: err.message });
  }
}

// Need admin reference in writeAttendanceRecord
let admin;
const originalMain = main;
async function run() {
  admin = require('firebase-admin');
  await originalMain();
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
