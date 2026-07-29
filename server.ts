import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  getOAuth2Client,
  loadLocalEntries,
  saveLocalEntries,
  appendToGoogleSheet,
  fetchGoogleSheetRows,
  sendNotificationEmail
} from './server/googleServices';
import { DocumentEntry, FormSubmissionPayload, AppSettings, DashboardSummary, DailyStat, DistributionStat } from './src/types';

const SETTINGS_FILE = path.join(process.cwd(), 'app_settings.json');

const DEFAULT_SETTINGS: AppSettings = {
  spreadsheetId: '1YOdn-LDDYayVTqhb2KeXJ2OPnZdwhi4mrDZRKeK_FtY',
  sheetName: 'Sheet1',
  appsScriptUrl: '',
  defaultNotificationEmail: 'geminitimses@gmail.com',
  enableAutoEmail: true,
  emailSubjectTemplate: '[Ex TIMSES] Postingan Konten Baru: {title} ({category})',
  emailBodyTemplate: 'Notifikasi otomatis postingan konten.',
  autoSyncToSheet: true,
  senderName: 'Ex TIMSES'
};

function loadSettings(): AppSettings {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Failed to load app settings:', e);
    }
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to save app settings:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  let entries = loadLocalEntries();
  let settings = loadSettings();

  // Initial attempt to sync directly from Google Sheet on startup
  fetchGoogleSheetRows(settings.spreadsheetId)
    .then(result => {
      if (result.success && result.entries && result.entries.length > 0) {
        entries = result.entries;
        saveLocalEntries(entries);
        console.log(`[DocuSheet Server] Successfully pre-fetched ${entries.length} rows from Google Sheet ${settings.spreadsheetId}`);
      }
    })
    .catch(err => {
      console.warn('[DocuSheet Server] Initial Google Sheet sync attempt failed:', err.message);
    });

  // API ROUTES
  app.get('/api/health', (req, res) => {
    const oauthAvailable = !!getOAuth2Client();
    res.json({
      status: 'ok',
      oauthConnected: oauthAvailable,
      spreadsheetId: settings.spreadsheetId,
      hasAppsScriptUrl: !!settings.appsScriptUrl,
      time: new Date().toISOString()
    });
  });

  // GET Settings
  app.get('/api/settings', (req, res) => {
    res.json(settings);
  });

  // POST Settings
  app.post('/api/settings', (req, res) => {
    const updated = { ...settings, ...req.body };
    settings = updated;
    saveSettings(settings);
    res.json({ success: true, settings });
  });

  // GET Documents List
  app.get('/api/documents', async (req, res) => {
    res.json({ success: true, count: entries.length, entries });
  });

  // POST Sync from Google Sheets
  app.post('/api/documents/sync-sheet', async (req, res) => {
    try {
      const result = await fetchGoogleSheetRows(settings.spreadsheetId);
      if (result.success && result.entries && result.entries.length > 0) {
        entries = result.entries;
        saveLocalEntries(entries);
        return res.json({ success: true, count: entries.length, entries, message: `Berhasil menyinkronkan ${entries.length} data postingan sama persis dari Google Sheets.` });
      } else {
        return res.json({
          success: false,
          message: result.error || 'Tidak ada data ditemukan di Google Sheet atau kueri gagal.',
          entries
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Gagal sinkronisasi dari Google Sheet' });
    }
  });

  // POST Submit Document / Content Entry
  app.post('/api/documents', async (req, res) => {
    try {
      const payload: FormSubmissionPayload = req.body;
      const konten = payload.konten || (req.body.category as string) || 'BRANDING';
      const platform = payload.platform || (req.body.recipient as string) || 'INSTAGRAM';
      const idReff = payload.idReff || (req.body.submitter as string) || 'miya0812';
      const status = payload.status || 'Dipublikasikan';
      const tanggalPostingan = payload.tanggalPostingan || (req.body.docDate as string) || new Date().toLocaleDateString('id-ID');
      const linkKonten = payload.linkKonten || (req.body.attachmentUrl as string) || '';
      const catatan = payload.catatan || (req.body.notes as string) || '';

      const website = payload.website || (req.body.website as string) || 'studiobet78';

      const docId = `POST-${202600 + entries.length + 1}`;
      const nowIso = new Date().toISOString();

      const newEntry: DocumentEntry = {
        id: docId,
        timestamp: nowIso,
        konten,
        platform,
        idReff,
        status,
        tanggalPostingan,
        linkKonten,
        catatan,
        website,

        // UI compatibility properties
        title: `${konten} - ${platform} (${idReff})`,
        category: konten,
        refNumber: idReff,
        submitter: idReff,
        recipient: platform,
        amount: 0,
        priority: status === 'Dipublikasikan' ? 'Rendah' : 'Tinggi',
        docDate: tanggalPostingan,
        notes: catatan,
        attachmentUrl: linkKonten,
        notificationEmail: payload.notificationEmail || settings.defaultNotificationEmail,
        syncedToSheet: false,
        emailSent: false
      };

      let sheetSyncResult: { success: boolean; error?: string; rowNumber?: number } = { success: false, error: '', rowNumber: undefined };
      let emailResult: { success: boolean; error?: string } = { success: false, error: '' };

      // 1. Direct Google Sheets Sync via OAuth API
      if (settings.autoSyncToSheet && settings.spreadsheetId) {
        sheetSyncResult = await appendToGoogleSheet(settings.spreadsheetId, newEntry);
        if (sheetSyncResult.success) {
          newEntry.syncedToSheet = true;
        }
      }

      // 2. Google Apps Script Web App Sync (Backup / Secondary Engine)
      if (settings.appsScriptUrl) {
        try {
          const fetchRes = await fetch(settings.appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'submitDocument',
              document: newEntry,
              sendEmail: settings.enableAutoEmail,
              recipientEmail: newEntry.notificationEmail
            })
          });
          
          const gasText = await fetchRes.text().catch(() => '');
          let gasJson: any = null;
          try {
            gasJson = JSON.parse(gasText);
          } catch (e) {
            // Not JSON
          }

          if (fetchRes.ok || (gasJson && gasJson.status === 'success')) {
            newEntry.syncedViaAppsScript = true;
            newEntry.syncedToSheet = true;
            if (gasJson?.row) {
              sheetSyncResult.rowNumber = gasJson.row;
            }
            if (gasJson?.emailSent) {
              newEntry.emailSent = true;
            }
          } else {
            console.warn('[Apps Script Proxy] Non-ok response:', fetchRes.status, gasText);
          }
        } catch (gasErr: any) {
          console.warn('[Apps Script Proxy] Error connecting to Apps Script URL:', gasErr.message);
        }
      }

      // 3. Automated Email Notification via Gmail API (if not already sent via Apps Script)
      if (settings.enableAutoEmail && newEntry.notificationEmail && !newEntry.emailSent) {
        emailResult = await sendNotificationEmail(newEntry.notificationEmail, newEntry, settings);
        if (emailResult.success) {
          newEntry.emailSent = true;
        }
      }

      // Save to local list
      entries.unshift(newEntry);
      saveLocalEntries(entries);

      res.json({
        success: true,
        message: 'Konten berhasil tersimpan & dicatat ke Google Sheets!',
        entry: newEntry,
        sheetSynced: newEntry.syncedToSheet,
        sheetRow: sheetSyncResult.rowNumber,
        emailSent: newEntry.emailSent,
        errors: {
          sheetError: sheetSyncResult.error,
          emailError: emailResult.error
        }
      });
    } catch (err: any) {
      console.error('Error submitting document:', err);
      res.status(500).json({ success: false, error: err.message || 'Gagal memproses data postingan.' });
    }
  });

  // PUT Update Document Entry
  app.put('/api/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const index = entries.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Dokumen tidak ditemukan.' });
      }

      const updated = { ...entries[index], ...req.body };
      entries[index] = updated;
      saveLocalEntries(entries);

      res.json({ success: true, message: 'Data postingan berhasil diperbarui!', entry: updated, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal memperbarui postingan.' });
    }
  });

  // DELETE Document Entry
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const { id } = req.params;
      entries = entries.filter(e => e.id !== id);
      saveLocalEntries(entries);

      res.json({ success: true, message: 'Data postingan berhasil dihapus!', entries });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal menghapus postingan.' });
    }
  });

  // POST Add New ID REFF
  app.post('/api/id-reff', (req, res) => {
    try {
      const { idReff, platform, konten, notes, website } = req.body;
      if (!idReff || !idReff.trim()) {
        return res.status(400).json({ success: false, message: 'ID REFF tidak boleh kosong.' });
      }

      const cleanId = idReff.trim();
      const targetWeb = website || 'studiobet78';

      // Check if entry already exists or add a starter entry for this ID REFF
      const nowIso = new Date().toISOString();
      const docId = `POST-${202600 + entries.length + 1}`;

      const newEntry: DocumentEntry = {
        id: docId,
        timestamp: nowIso,
        konten: konten || 'BRANDING',
        platform: platform || 'INSTAGRAM',
        idReff: cleanId,
        status: 'Draft',
        tanggalPostingan: new Date().toLocaleDateString('id-ID'),
        linkKonten: '',
        catatan: notes || 'ID REFF baru terdaftar',
        website: targetWeb,
        title: `${konten || 'BRANDING'} - ${platform || 'INSTAGRAM'} (${cleanId})`,
        category: konten || 'BRANDING',
        refNumber: cleanId,
        submitter: cleanId,
        recipient: platform || 'INSTAGRAM',
        amount: 0,
        priority: 'Rendah',
        docDate: new Date().toLocaleDateString('id-ID'),
        notes: notes || 'ID REFF baru terdaftar',
        syncedToSheet: false,
        emailSent: false
      };

      entries.unshift(newEntry);
      saveLocalEntries(entries);

      res.json({ success: true, message: `ID REFF "${cleanId}" berhasil ditambahkan!`, idReff: cleanId, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal menambahkan ID REFF.' });
    }
  });

  // PUT Edit/Rename ID REFF
  app.put('/api/id-reff/:oldId', (req, res) => {
    try {
      const { oldId } = req.params;
      const { newIdReff } = req.body;

      if (!newIdReff || !newIdReff.trim()) {
        return res.status(400).json({ success: false, message: 'ID REFF baru tidak boleh kosong.' });
      }

      const cleanNewId = newIdReff.trim();
      let updatedCount = 0;

      entries = entries.map(e => {
        if (e.idReff === oldId) {
          updatedCount++;
          return {
            ...e,
            idReff: cleanNewId,
            refNumber: cleanNewId,
            submitter: cleanNewId,
            title: `${e.konten} - ${e.platform} (${cleanNewId})`
          };
        }
        return e;
      });

      saveLocalEntries(entries);

      res.json({
        success: true,
        message: `Berhasil mengubah ID REFF dari "${oldId}" menjadi "${cleanNewId}" pada ${updatedCount} postingan!`,
        entries
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal mengubah ID REFF.' });
    }
  });

  // DELETE ID REFF and all its entries
  app.delete('/api/id-reff/:idReff', (req, res) => {
    try {
      const { idReff } = req.params;
      const initialCount = entries.length;
      entries = entries.filter(e => e.idReff !== idReff);
      const deletedCount = initialCount - entries.length;

      saveLocalEntries(entries);

      res.json({
        success: true,
        message: `Berhasil menghapus ID REFF "${idReff}" beserta ${deletedCount} data postingannya!`,
        entries
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Gagal menghapus ID REFF.' });
    }
  });

  // GET Statistics Dashboard
  app.get('/api/stats', (req, res) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Daily entries map for last 14 days
    const daysMap = new Map<string, { count: number; publishedCount: number; pendingCount: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      daysMap.set(ds, { count: 0, publishedCount: 0, pendingCount: 0 });
    }

    let totalToday = 0;
    let totalThisWeek = 0;
    let totalThisMonth = 0;
    let pendingCount = 0;
    let publishedCountTotal = 0;

    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const platformCounts: Record<string, number> = {};
    const contentTypeCounts: Record<string, number> = {};
    const idReffCounts: Record<string, number> = {};

    entries.forEach(e => {
      const entryDate = e.docDate || (e.timestamp ? e.timestamp.split('T')[0] : todayStr);
      const isToday = entryDate === todayStr;
      const isThisMonth = entryDate.startsWith(currentMonthPrefix);
      const entryTimestamp = new Date(e.timestamp || e.docDate);

      if (isToday) {
        totalToday += 1;
      }

      if (entryTimestamp >= sevenDaysAgo) {
        totalThisWeek += 1;
      }

      if (isThisMonth) {
        totalThisMonth += 1;
      }

      if (e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai') {
        publishedCountTotal += 1;
      } else {
        pendingCount += 1;
      }

      // Daily stats
      if (daysMap.has(entryDate)) {
        const item = daysMap.get(entryDate)!;
        item.count += 1;
        if (e.status === 'Dipublikasikan' || e.status === 'Disetujui' || e.status === 'Selesai') {
          item.publishedCount += 1;
        } else {
          item.pendingCount += 1;
        }
      }

      // Distributions
      const plat = e.platform || e.recipient || 'INSTAGRAM';
      platformCounts[plat] = (platformCounts[plat] || 0) + 1;

      const kont = e.konten || e.category || 'BRANDING';
      contentTypeCounts[kont] = (contentTypeCounts[kont] || 0) + 1;

      const ref = e.idReff || e.submitter || '-';
      if (ref && ref !== '-') {
        idReffCounts[ref] = (idReffCounts[ref] || 0) + 1;
      }
    });

    const dailyStats: DailyStat[] = Array.from(daysMap.entries()).map(([dateStr, val]) => {
      const dateObj = new Date(dateStr);
      const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return {
        date: dateStr,
        formattedDate,
        count: val.count,
        publishedCount: val.publishedCount,
        pendingCount: val.pendingCount
      };
    });

    const totalAllTime = entries.length;
    
    const platformStats = Object.entries(platformCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalAllTime > 0 ? Math.round((count / totalAllTime) * 100) : 0
    }));

    const contentTypeStats = Object.entries(contentTypeCounts).map(([name, count]) => ({
      name,
      count,
      percentage: totalAllTime > 0 ? Math.round((count / totalAllTime) * 100) : 0
    }));

    const topAccounts = Object.entries(idReffCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAllTime > 0 ? Math.round((count / totalAllTime) * 100) : 0
      }));

    const publishedRate = totalAllTime > 0 ? Math.round((publishedCountTotal / totalAllTime) * 100) : 0;

    const summary: DashboardSummary = {
      totalToday,
      totalThisWeek,
      totalThisMonth,
      totalAllTime,
      publishedRate,
      pendingCount,
      publishedCount: publishedCountTotal,
      dailyStats,
      platformStats,
      contentTypeStats,
      topAccounts
    };

    res.json({ success: true, summary });
  });

  // GET Apps Script Code generator
  app.get('/api/apps-script-code', (req, res) => {
    const code = `/**
 * ====================================================================
 * DOCUSHEET SAAS - GOOGLE APPS SCRIPT REAL-TIME INTEGRATION & EMAIL NOTIFICATION
 * ====================================================================
 * Skrip ini dipasang di Google Sheets (Extensions -> Apps Script).
 * Menyediakan Endpoint Web App untuk input data otomatis & notifikasi email.
 */

const SHEET_NAME = "${settings.sheetName || 'Sheet1'}";
const NOTIFICATION_EMAIL = "${settings.defaultNotificationEmail || 'geminitimses@gmail.com'}";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const doc = data.document || data;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    
    // Buat Header jika sheet kosong (7 Kolom)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Konten',
        'PLATFORM',
        'ID REFF',
        'Status',
        'Tanggal postingan',
        'LINK KONTEN',
        'CATATAN'
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#f1f5f9');
    }
    
    const rowValues = [
      doc.konten || doc.category || 'BRANDING',
      doc.platform || doc.recipient || 'INSTAGRAM',
      doc.idReff || doc.submitter || '-',
      doc.status || 'Dipublikasikan',
      doc.tanggalPostingan || doc.docDate || new Date().toLocaleDateString('id-ID'),
      doc.linkKonten || doc.attachmentUrl || '',
      doc.catatan || doc.notes || ''
    ];
    
    sheet.appendRow(rowValues);
    const newRowIndex = sheet.getLastRow();
    
    // Kirim Email Notifikasi Otomatis
    let emailSent = false;
    const targetEmail = doc.notificationEmail || NOTIFICATION_EMAIL;
    if (targetEmail && data.sendEmail !== false) {
      try {
        const subject = "[Ex TIMSES] Postingan Konten: " + (doc.konten || 'BRANDING') + " (" + (doc.platform || 'INSTAGRAM') + ")";
        const body = "Halo,\\n\\nData postingan konten baru berhasil diinput via Web SaaS:\\n\\n" +
          "• Konten: " + (doc.konten || '-') + "\\n" +
          "• Platform: " + (doc.platform || '-') + "\\n" +
          "• ID REFF: " + (doc.idReff || '-') + "\\n" +
          "• Status: " + (doc.status || 'Dipublikasikan') + "\\n" +
          "• Tanggal: " + (doc.tanggalPostingan || '-') + "\\n" +
          "• Link: " + (doc.linkKonten || '-') + "\\n" +
          "• Baris Google Sheet: " + newRowIndex + "\\n\\n" +
          "Silakan buka Google Sheet Anda untuk memeriksa detail selengkapnya.";
          
        MailApp.sendEmail(targetEmail, subject, body);
        emailSent = true;
      } catch (emailErr) {
        Logger.log("Email error: " + emailErr.toString());
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data postingan berhasil disimpan ke Google Sheet!",
      row: newRowIndex,
      emailSent: emailSent
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Ex TIMSES Google Apps Script Web App Aktif & Siap Menerima Data Postingan!");
}
`;
    res.json({ success: true, code });
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Ex TIMSES Server] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
