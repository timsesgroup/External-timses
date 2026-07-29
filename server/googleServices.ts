import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { DocumentEntry, FormSubmissionPayload, AppSettings } from '../src/types';

const CREDENTIALS_PATH = '/assets/.aistudio/oauth_credentials.json';
const TOKENS_PATH = '/assets/.aistudio/oauth_tokens.json';

// In-memory + file cached persistent storage for document entries when server runs
const LOCAL_DATA_FILE = path.join(process.cwd(), 'data_entries.json');

export function getOAuth2Client() {
  if (!fs.existsSync(CREDENTIALS_PATH) || !fs.existsSync(TOKENS_PATH)) {
    console.warn('[Google OAuth] Credentials or tokens file not found at default path');
    return null;
  }

  try {
    const credsRaw = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const tokensRaw = fs.readFileSync(TOKENS_PATH, 'utf-8');
    
    const creds = JSON.parse(credsRaw);
    const tokens = JSON.parse(tokensRaw);

    const key = creds.installed || creds.web;
    if (!key) return null;

    const oauth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      key.redirect_uris ? key.redirect_uris[0] : 'http://localhost:3000/oauth2callback'
    );

    oauth2Client.setCredentials(tokens);

    // Save updated tokens on refresh
    oauth2Client.on('tokens', (newTokens) => {
      try {
        const mergedTokens = { ...tokens, ...newTokens };
        fs.writeFileSync(TOKENS_PATH, JSON.stringify(mergedTokens, null, 2));
      } catch (e) {
        console.error('Failed to update OAuth tokens file:', e);
      }
    });

    return oauth2Client;
  } catch (err) {
    console.error('Error creating OAuth2 client:', err);
    return null;
  }
}

export function loadLocalEntries(): DocumentEntry[] {
  if (fs.existsSync(LOCAL_DATA_FILE)) {
    try {
      const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load local entries:', e);
      return [];
    }
  }
  return getInitialMockEntries();
}

export function saveLocalEntries(entries: DocumentEntry[]) {
  try {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(entries, null, 2));
  } catch (e) {
    console.error('Failed to save local entries:', e);
  }
}

export async function appendToGoogleSheet(
  spreadsheetId: string,
  entry: DocumentEntry
): Promise<{ success: boolean; error?: string; rowNumber?: number }> {
  const auth = getOAuth2Client();
  if (!auth) {
    return {
      success: false,
      error: 'Google OAuth belum dikonfigurasi secara lengkap atau token belum tersedia.'
    };
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth });
    let targetSheet = entry.website || 'studiobet78';

    // Verify if targetSheet tab exists in Google Spreadsheet; if not, create it
    try {
      const ssInfo = await sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = ssInfo.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[] || [];
      
      if (existingSheets.length > 0 && !existingSheets.includes(targetSheet)) {
        try {
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: targetSheet
                    }
                  }
                }
              ]
            }
          });
          console.log(`[Google Sheets] Created new tab '${targetSheet}' in spreadsheet ${spreadsheetId}`);
        } catch (addErr: any) {
          console.warn(`[Google Sheets] Could not add tab '${targetSheet}', falling back to '${existingSheets[0]}':`, addErr.message);
          targetSheet = existingSheets[0];
        }
      }
    } catch (metaErr: any) {
      console.warn('[Google Sheets] Metadata check failed:', metaErr.message);
    }

    const targetRange = `'${targetSheet}'!A1`;

    // Format row data according to target Google Sheet format (Columns A-G)
    const rowValues = [
      entry.konten || 'BRANDING',
      entry.platform || 'INSTAGRAM',
      entry.idReff || '-',
      entry.status || 'Dipublikasikan',
      entry.tanggalPostingan || new Date().toLocaleDateString('id-ID'),
      entry.linkKonten || '',
      entry.catatan || ''
    ];

    // First ensure header exists if empty in target sheet
    try {
      const checkRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${targetSheet}'!A1:G1`,
      });

      if (!checkRes.data.values || checkRes.data.values.length === 0) {
        const headers = [
          'Konten',
          'PLATFORM',
          'ID REFF',
          'Status',
          'Tanggal postingan',
          'LINK KONTEN',
          'CATATAN'
        ];
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `'${targetSheet}'!A1:G1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] }
        });
      }
    } catch (err) {
      console.warn(`Could not check/initialize sheet headers for ${targetSheet}:`, err);
    }

    // Append entry
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues]
      }
    });

    const updatedRange = appendRes.data.updates?.updatedRange || '';
    const rowMatch = updatedRange.match(/!A(\d+):/);
    const rowNumber = rowMatch ? parseInt(rowMatch[1], 10) : undefined;

    return { success: true, rowNumber };
  } catch (err: any) {
    console.error('Google Sheets API Error:', err);
    return {
      success: false,
      error: err.message || 'Gagal mengirim data ke Google Sheets API.'
    };
  }
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseSheetRowsToEntries(rawRows: string[][], websiteName: string, startIndex: number): DocumentEntry[] {
  const validRows = rawRows.filter(row => {
    if (!row || row.length === 0) return false;
    const col0 = (row[0] || '').toString().trim().toUpperCase();
    const col1 = (row[1] || '').toString().trim().toUpperCase();
    
    // Header detection
    if (col0 === 'KONTEN' || col1 === 'PLATFORM' || col0 === 'JENIS KONTEN') return false;
    
    // At least one non-empty cell
    return row.some(cell => (cell || '').toString().trim().length > 0);
  });

  return validRows.map((row, idx) => {
    const konten = (row[0] || 'BRANDING').trim();
    const platform = (row[1] || 'INSTAGRAM').trim();
    const idReff = (row[2] || '-').trim();
    const status = (row[3] || 'Dipublikasikan').trim();
    const tanggalPostingan = (row[4] || '').trim();
    const linkKonten = (row[5] || '').trim();
    const catatan = (row[6] || '').trim();

    return {
      id: `POST-${202600 + startIndex + idx + 1}`,
      timestamp: new Date().toISOString(),
      konten,
      platform,
      idReff,
      status: (status as any),
      tanggalPostingan: tanggalPostingan || new Date().toLocaleDateString('id-ID'),
      linkKonten,
      catatan,
      website: websiteName,

      // UI compatibility fields
      title: `${konten} - ${platform} (${idReff})`,
      category: konten,
      refNumber: idReff,
      submitter: idReff,
      recipient: platform,
      amount: 0,
      priority: status === 'Dipublikasikan' ? 'Rendah' : 'Tinggi',
      docDate: tanggalPostingan || new Date().toISOString().split('T')[0],
      notes: catatan,
      attachmentUrl: linkKonten,
      syncedToSheet: true,
      emailSent: true
    };
  });
}

export async function fetchGoogleSheetRows(spreadsheetId: string): Promise<{ success: boolean; entries?: DocumentEntry[]; error?: string }> {
  let allEntries: DocumentEntry[] = [];
  let fetchError: string | undefined;

  const targetTabs = ['studiobet78', 'bigbet78', 'piala45', 'bambu189'];

  // 1. Try Google Sheets API via OAuth
  const auth = getOAuth2Client();
  if (auth) {
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetTitles = meta.data.sheets?.map(s => s.properties?.title).filter(Boolean) as string[] || [];
      const tabsToFetch = sheetTitles.length > 0 ? sheetTitles : targetTabs;

      for (const tabName of tabsToFetch) {
        try {
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!A1:G1000`,
          });
          if (res.data.values && res.data.values.length > 0) {
            const entries = parseSheetRowsToEntries(res.data.values as string[][], tabName, allEntries.length);
            allEntries.push(...entries);
          }
        } catch (e: any) {
          console.warn(`Could not read sheet tab '${tabName}' via API:`, e.message);
        }
      }
    } catch (err: any) {
      console.warn('Google Sheets API error, attempting CSV fallback:', err.message);
      fetchError = err.message;
    }
  }

  // 2. Fallback to public CSV export if Google API returns nothing or fails
  if (allEntries.length === 0 && spreadsheetId) {
    try {
      for (const tabName of targetTabs) {
        const urls = [
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(tabName)}`
        ];

        for (const url of urls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const text = await response.text();
              if (text && !text.includes('<!DOCTYPE html>')) {
                const csvRows = parseCsvRows(text);
                if (csvRows.length > 0) {
                  const entries = parseSheetRowsToEntries(csvRows, tabName, allEntries.length);
                  allEntries.push(...entries);
                  break;
                }
              }
            }
          } catch (e) {
            // ignore individual tab failure
          }
        }
      }

      // If still empty, try default sheet without tab parameter
      if (allEntries.length === 0) {
        const defaultUrls = [
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
          `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
        ];
        for (const url of defaultUrls) {
          const response = await fetch(url);
          if (response.ok) {
            const text = await response.text();
            if (text && !text.includes('<!DOCTYPE html>')) {
              const csvRows = parseCsvRows(text);
              if (csvRows.length > 0) {
                const entries = parseSheetRowsToEntries(csvRows, 'studiobet78', 0);
                allEntries.push(...entries);
                break;
              }
            }
          }
        }
      }
    } catch (csvErr: any) {
      console.warn('CSV export fetch error:', csvErr.message);
      if (!fetchError) fetchError = csvErr.message;
    }
  }

  if (allEntries.length === 0) {
    return {
      success: false,
      error: fetchError || 'Tidak dapat membaca data dari Google Sheet. Pastikan ID Spreadsheet valid dan sheet dapat diakses.'
    };
  }

  return { success: true, entries: allEntries };
}

export async function sendNotificationEmail(
  recipientEmail: string,
  entry: DocumentEntry,
  settings: AppSettings
): Promise<{ success: boolean; error?: string }> {
  if (!recipientEmail) {
    return { success: false, error: 'Alamat email penerima kosong.' };
  }

  const auth = getOAuth2Client();
  if (!auth) {
    return { success: false, error: 'OAuth client tidak tersedia untuk mengirim email via Gmail.' };
  }

  try {
    const gmail = google.gmail({ version: 'v1', auth });

    const subject = settings.emailSubjectTemplate
      .replace('{title}', entry.title || `${entry.konten} - ${entry.platform}`)
      .replace('{refNumber}', entry.idReff || entry.id)
      .replace('{category}', entry.konten);

    const bodyContent = `Halo,

Notifikasi otomatis entri postingan konten baru telah berhasil disimpan ke Google Sheets!

📱 RINCIAN POSTINGAN KONTEN:
------------------------------------------
• Jenis Konten: ${entry.konten}
• Platform: ${entry.platform}
• ID REFF / User: ${entry.idReff}
• Status Publikasi: ${entry.status}
• Tanggal Postingan: ${entry.tanggalPostingan}
• Link Konten: ${entry.linkKonten || '-'}
• Catatan / Remarks: ${entry.catatan || '-'}
• ID Sistem: ${entry.id}
• Waktu Input Web: ${entry.timestamp}

------------------------------------------
Diinput melalui Ex TIMSES Web Platform
Integrasi Google Sheets & Apps Script Real-Time Engine
`;

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "${settings.senderName || 'Ex TIMSES'}" <me>`,
      `To: ${recipientEmail}`,
      `Subject: ${utf8Subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      bodyContent,
    ];
    const message = messageParts.join('\r\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error('Gmail API send email error:', err);
    return { success: false, error: err.message || 'Gagal mengirim email notifikasi.' };
  }
}

function getInitialMockEntries(): DocumentEntry[] {
  const today = new Date();
  const formatIso = (d: Date) => d.toISOString();

  return [
    {
      id: 'POST-2026001',
      timestamp: formatIso(today),
      konten: 'BRANDING',
      platform: 'INSTAGRAM',
      idReff: 'miya0812',
      status: 'Dipublikasikan',
      tanggalPostingan: '26/07/2026',
      linkKonten: 'https://www.instagram.com/ayu6972562?igsh=MXYzM3dqcDB6MHlzbw==&utm_source=qr',
      catatan: 'MULAI TANGGAL 26 JULI 2026',
      title: 'BRANDING - INSTAGRAM (miya0812)',
      category: 'BRANDING',
      refNumber: 'miya0812',
      submitter: 'miya0812',
      recipient: 'INSTAGRAM',
      amount: 0,
      priority: 'Rendah',
      docDate: '2026-07-26',
      notes: 'MULAI TANGGAL 26 JULI 2026',
      attachmentUrl: 'https://www.instagram.com/ayu6972562?igsh=MXYzM3dqcDB6MHlzbw==&utm_source=qr',
      notificationEmail: 'geminitimses@gmail.com',
      emailSent: true,
      syncedToSheet: true
    },
    {
      id: 'POST-2026002',
      timestamp: formatIso(today),
      konten: 'BRANDING',
      platform: 'INSTAGRAM',
      idReff: 'miya0812',
      status: 'Dipublikasikan',
      tanggalPostingan: '26/07/2026',
      linkKonten: 'https://www.instagram.com/carmila9114105?igsh=MTl3bmM4bnJvMzhpMA==&utm_source=qr',
      catatan: 'MULAI TANGGAL 26 JULI 2026',
      title: 'BRANDING - INSTAGRAM (miya0812)',
      category: 'BRANDING',
      refNumber: 'miya0812',
      submitter: 'miya0812',
      recipient: 'INSTAGRAM',
      amount: 0,
      priority: 'Rendah',
      docDate: '2026-07-26',
      notes: 'MULAI TANGGAL 26 JULI 2026',
      attachmentUrl: 'https://www.instagram.com/carmila9114105?igsh=MTl3bmM4bnJvMzhpMA==&utm_source=qr',
      notificationEmail: 'geminitimses@gmail.com',
      emailSent: true,
      syncedToSheet: true
    },
    {
      id: 'POST-2026003',
      timestamp: formatIso(today),
      konten: 'BRANDING',
      platform: 'INSTAGRAM',
      idReff: 'ojolkeras',
      status: 'Dipublikasikan',
      tanggalPostingan: '26/07/2026',
      linkKonten: 'https://www.instagram.com/akang_meledak?igsh=eWVxZTNnenMzMWx4',
      catatan: 'MULAI TANGGAL 26 JULI 2026',
      title: 'BRANDING - INSTAGRAM (ojolkeras)',
      category: 'BRANDING',
      refNumber: 'ojolkeras',
      submitter: 'ojolkeras',
      recipient: 'INSTAGRAM',
      amount: 0,
      priority: 'Rendah',
      docDate: '2026-07-26',
      notes: 'MULAI TANGGAL 26 JULI 2026',
      attachmentUrl: 'https://www.instagram.com/akang_meledak?igsh=eWVxZTNnenMzMWx4',
      notificationEmail: 'geminitimses@gmail.com',
      emailSent: true,
      syncedToSheet: true
    },
    {
      id: 'POST-2026004',
      timestamp: formatIso(today),
      konten: 'BRANDING',
      platform: 'INSTAGRAM',
      idReff: 'zamcuyy',
      status: 'Dipublikasikan',
      tanggalPostingan: '26/07/2026',
      linkKonten: 'https://www.instagram.com/dika_ferdiannn?igsh=NWw4dXE1NTg3OTd0',
      catatan: 'MULAI TANGGAL 26 JULI 2026',
      title: 'BRANDING - INSTAGRAM (zamcuyy)',
      category: 'BRANDING',
      refNumber: 'zamcuyy',
      submitter: 'zamcuyy',
      recipient: 'INSTAGRAM',
      amount: 0,
      priority: 'Rendah',
      docDate: '2026-07-26',
      notes: 'MULAI TANGGAL 26 JULI 2026',
      attachmentUrl: 'https://www.instagram.com/dika_ferdiannn?igsh=NWw4dXE1NTg3OTd0',
      notificationEmail: 'geminitimses@gmail.com',
      emailSent: true,
      syncedToSheet: true
    },
    {
      id: 'POST-2026005',
      timestamp: formatIso(today),
      konten: 'BRANDING',
      platform: 'INSTAGRAM',
      idReff: 'iyan77',
      status: 'Dipublikasikan',
      tanggalPostingan: '26/07/2026',
      linkKonten: 'https://www.instagram.com/kaniaauliasania?igsh=MWhtczF5djBvaHh0MQ==',
      catatan: 'POSTINGAN JUMAT BAROKAH',
      title: 'BRANDING - INSTAGRAM (iyan77)',
      category: 'BRANDING',
      refNumber: 'iyan77',
      submitter: 'iyan77',
      recipient: 'INSTAGRAM',
      amount: 0,
      priority: 'Rendah',
      docDate: '2026-07-26',
      notes: 'POSTINGAN JUMAT BAROKAH',
      attachmentUrl: 'https://www.instagram.com/kaniaauliasania?igsh=MWhtczF5djBvaHh0MQ==',
      notificationEmail: 'geminitimses@gmail.com',
      emailSent: true,
      syncedToSheet: true
    },
    {
      id: 'POST-2026006',
      timestamp: formatIso(today),
      konten: 'BRANDING',
      platform: 'INSTAGRAM',
      idReff: 'cuangki78',
      status: 'Dipublikasikan',
      tanggalPostingan: '26/07/2026',
      linkKonten: 'https://www.instagram.com/putu15wsm?igsh=bGNqMjJkY3hreXJ6',
      catatan: 'MULAI TANGGAL 26 JULI 2026',
      title: 'BRANDING - INSTAGRAM (cuangki78)',
      category: 'BRANDING',
      refNumber: 'cuangki78',
      submitter: 'cuangki78',
      recipient: 'INSTAGRAM',
      amount: 0,
      priority: 'Rendah',
      docDate: '2026-07-26',
      notes: 'MULAI TANGGAL 26 JULI 2026',
      attachmentUrl: 'https://www.instagram.com/putu15wsm?igsh=bGNqMjJkY3hreXJ6',
      notificationEmail: 'geminitimses@gmail.com',
      emailSent: true,
      syncedToSheet: true
    }
  ];
}
