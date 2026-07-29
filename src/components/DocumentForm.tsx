import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RefreshCw, 
  Mail, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Trash2,
  Paperclip,
  Calendar,
  User,
  Bookmark,
  Share2,
  Tag,
  Link2,
  FileText,
  Globe
} from 'lucide-react';
import { FormSubmissionPayload, ContentCategory, PlatformType, PostStatus, SyncResponse, AppSettings } from '../types';

interface DocumentFormProps {
  settings: AppSettings;
  selectedWeb?: string;
  onSubmitSuccess: (res: SyncResponse) => void;
  onNavigateDashboard: () => void;
}

const CONTENT_TYPES: ContentCategory[] = [
  'BRANDING',
  'PROMOSI',
  'ENDORSEMENT',
  'EDUKASI',
  'ENTERTAINMENT',
  'ORGANIC',
  'REVIEW',
  'Lainnya'
];

const PLATFORMS: PlatformType[] = [
  'INSTAGRAM',
  'TIKTOK',
  'YOUTUBE',
  'FACEBOOK',
  'X / TWITTER',
  'THREADS',
  'OTHER'
];

const SAMPLE_ID_REFFS = [
  'miya0812',
  'ojolkeras',
  'zamcuyy',
  'iyan77',
  'cuangki78'
];

const PRESETS = [
  {
    label: '📸 Instagram Branding',
    konten: 'BRANDING' as ContentCategory,
    platform: 'INSTAGRAM' as PlatformType,
    idReff: 'miya0812',
    status: 'Dipublikasikan' as PostStatus,
    catatan: 'MULAI TANGGAL 26 JULI 2026'
  },
  {
    label: '🎵 TikTok Promosi',
    konten: 'PROMOSI' as ContentCategory,
    platform: 'TIKTOK' as PlatformType,
    idReff: 'ojolkeras',
    status: 'Dipublikasikan' as PostStatus,
    catatan: 'POSTINGAN PROMO KAMPANYE UTAMA'
  },
  {
    label: '🌟 Endorsement Review',
    konten: 'ENDORSEMENT' as ContentCategory,
    platform: 'INSTAGRAM' as PlatformType,
    idReff: 'zamcuyy',
    status: 'Dipublikasikan' as PostStatus,
    catatan: 'KONTEN ENDORSEMENT PRODUK'
  },
  {
    label: '🎬 YouTube Shorts',
    konten: 'ENTERTAINMENT' as ContentCategory,
    platform: 'YOUTUBE' as PlatformType,
    idReff: 'iyan77',
    status: 'Dipublikasikan' as PostStatus,
    catatan: 'POSTINGAN JUMAT BAROKAH'
  }
];

export const DocumentForm: React.FC<DocumentFormProps> = ({ settings, selectedWeb, onSubmitSuccess, onNavigateDashboard }) => {
  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const defaultWeb = selectedWeb && selectedWeb !== 'ALL' ? selectedWeb : 'studiobet78';

  const initialFormState: FormSubmissionPayload = {
    konten: 'BRANDING',
    platform: 'INSTAGRAM',
    idReff: 'miya0812',
    status: 'Dipublikasikan',
    tanggalPostingan: getTodayFormatted(),
    linkKonten: '',
    catatan: 'MULAI TANGGAL 26 JULI 2026',
    website: defaultWeb,
    notificationEmail: settings.defaultNotificationEmail || 'geminitimses@gmail.com'
  };

  const [formData, setFormData] = useState<FormSubmissionPayload>(() => {
    const savedDraft = localStorage.getItem('content_form_draft');
    if (savedDraft) {
      try {
        return { ...initialFormState, ...JSON.parse(savedDraft) };
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }
    return initialFormState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState<SyncResponse | null>(null);
  const [draftSavedMessage, setDraftSavedMessage] = useState(false);

  // Auto-save draft on form changes
  useEffect(() => {
    localStorage.setItem('content_form_draft', JSON.stringify(formData));
    setDraftSavedMessage(true);
    const timer = setTimeout(() => setDraftSavedMessage(false), 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (field: keyof FormSubmissionPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      konten: preset.konten,
      platform: preset.platform,
      idReff: preset.idReff,
      status: preset.status,
      catatan: preset.catatan
    }));
  };

  const handleClearDraft = () => {
    localStorage.removeItem('content_form_draft');
    setFormData({
      ...initialFormState,
      tanggalPostingan: getTodayFormatted(),
      notificationEmail: settings.defaultNotificationEmail || ''
    });
    setLastResponse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.idReff.trim()) {
      alert('Mohon isi ID REFF / Nama Pengguna.');
      return;
    }

    setIsSubmitting(true);
    setLastResponse(null);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data: SyncResponse = await res.json();
      setLastResponse(data);

      if (data.success) {
        localStorage.removeItem('content_form_draft');
        onSubmitSuccess(data);

        setFormData(prev => ({
          ...initialFormState,
          idReff: prev.idReff, // keep idReff for convenient repetitive entry
          tanggalPostingan: getTodayFormatted(),
          notificationEmail: settings.defaultNotificationEmail || ''
        }));
      }
    } catch (err: any) {
      setLastResponse({
        success: false,
        message: err.message || 'Gagal mengirim data postingan ke server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-10">
      
      {/* Header Banner */}
      <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-5 rounded-2xl shadow-sm border border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Web Input to Google Sheet (7 Kolom)
            </span>
            {draftSavedMessage && (
              <span className="text-[11px] text-slate-400 animate-fade-in">✓ Draf tersimpan lokal</span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Input Postingan Konten Real-Time</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Formulir otomatis disesuaikan dengan struktur Google Sheet: Konten, PLATFORM, ID REFF, Status, Tanggal postingan, LINK KONTEN, &amp; CATATAN.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearDraft}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80 transition"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          Reset Form
        </button>
      </div>

      {/* Quick Presets Bar */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-emerald-600" /> Template Preset Cepat
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="shrink-0 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500/50 rounded-xl text-xs font-medium text-slate-700 shadow-2xs transition flex items-center gap-1.5"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Banner */}
      {lastResponse && (
        <div className={`mb-6 p-4 rounded-2xl border ${
          lastResponse.success 
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-start gap-3">
            {lastResponse.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-bold text-sm">{lastResponse.message}</h4>
              
              {lastResponse.success && lastResponse.entry && (
                <div className="mt-2 pt-2 border-t border-emerald-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">ID System:</span>{' '}
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                      {lastResponse.entry.id}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Google Sheet:</span>{' '}
                    {lastResponse.sheetSynced ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Terkait pada Baris #{lastResponse.sheetRow || 'Terbaru'}
                      </span>
                    ) : (
                      <span className="text-amber-700">Dalam antrean sync</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Notifikasi Email:</span>{' '}
                    {lastResponse.emailSent ? (
                      <span className="text-emerald-700 font-medium">
                        ✓ Email terkirim ke {lastResponse.entry.notificationEmail}
                      </span>
                    ) : (
                      <span className="text-slate-600">Email diabaikan / belum dikirim</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      Buka Google Sheet Target
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {lastResponse.errors?.sheetError && (
                <div className="mt-2 p-2 rounded bg-amber-100/70 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold">⚠️ Google Sheet Notice:</p>
                  <p className="mt-0.5">{lastResponse.errors.sheetError}</p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    <strong>Saran:</strong> Jika OAuth belum terhubung, buka tab <strong>"Integrasi Apps Script"</strong> dan tempelkan Web App URL Google Apps Script Anda untuk sinkronisasi otomatis.
                  </p>
                </div>
              )}

              {lastResponse.errors?.emailError && (
                <div className="mt-2 p-2 rounded bg-amber-100/70 border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold">📧 Notifikasi Email Notice:</p>
                  <p className="mt-0.5">{lastResponse.errors.emailError}</p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    <strong>Saran:</strong> Pastikan Web App URL Apps Script dipasang di menu Integrasi Apps Script, atau terhubung ke Google OAuth dengan izin Gmail.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-5 sm:p-6 space-y-5">

          {/* Website Selection Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-600" />
              Target Website / Tab Google Sheet <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {['studiobet78', 'bigbet78', 'piala45', 'bambu189'].map(web => (
                <button
                  key={web}
                  type="button"
                  onClick={() => handleChange('website', web)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    formData.website === web
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>🎰 {web}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Data akan dicatat ke tab sheet <strong className="text-emerald-700 font-mono">'{formData.website || 'studiobet78'}'</strong> di Google Sheet.
            </p>
          </div>

          {/* Row 1: Konten & PLATFORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                Jenis Konten <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.konten}
                onChange={e => handleChange('konten', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-900 outline-none transition bg-white"
              >
                {CONTENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Kolom A di Google Sheet (mis. BRANDING, PROMOSI).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-teal-600" />
                PLATFORM <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.platform}
                onChange={e => handleChange('platform', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-900 outline-none transition bg-white"
              >
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Kolom B di Google Sheet (mis. INSTAGRAM, TIKTOK).</p>
            </div>

          </div>

          {/* Row 2: ID REFF & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                ID REFF / User Referensi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.idReff}
                onChange={e => handleChange('idReff', e.target.value)}
                placeholder="mis. miya0812, ojolkeras, zamcuyy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-900 outline-none transition"
              />
              {/* Quick ID Reff Suggestion Badges */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">Saran ID:</span>
                {SAMPLE_ID_REFFS.map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleChange('idReff', id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono border transition ${
                      formData.idReff === id 
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Publikasi
              </label>
              <select
                value={formData.status}
                onChange={e => handleChange('status', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-900 outline-none transition bg-white"
              >
                <option value="Dipublikasikan">✅ Dipublikasikan</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Scheduled">📅 Scheduled / Terjadwal</option>
                <option value="Draft">📝 Draft</option>
                <option value="Gagal">❌ Gagal</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Kolom D di Google Sheet.</p>
            </div>

          </div>

          {/* Row 3: Tanggal Postingan & LINK KONTEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal Postingan
              </label>
              <input
                type="text"
                value={formData.tanggalPostingan}
                onChange={e => handleChange('tanggalPostingan', e.target.value)}
                placeholder="26/07/2026"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-mono text-slate-900 outline-none transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">Kolom E di Google Sheet (format: DD/MM/YYYY atau Tanggal).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-cyan-600" />
                LINK KONTEN (URL)
              </label>
              <input
                type="url"
                value={formData.linkKonten}
                onChange={e => handleChange('linkKonten', e.target.value)}
                placeholder="https://www.instagram.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-none transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">Kolom F di Google Sheet.</p>
            </div>

          </div>

          {/* Row 4: CATATAN & Email Notifikasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                CATATAN / Remarks
              </label>
              <textarea
                rows={3}
                value={formData.catatan}
                onChange={e => handleChange('catatan', e.target.value)}
                placeholder="mis. MULAI TANGGAL 26 JULI 2026 / POSTINGAN JUMAT BAROKAH"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-none transition resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Kolom G di Google Sheet.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                Email Penerima Notifikasi Otomatis
              </label>
              <input
                type="email"
                value={formData.notificationEmail}
                onChange={e => handleChange('notificationEmail', e.target.value)}
                placeholder="geminitimses@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-slate-900 outline-none transition"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Setiap submit sukses, notifikasi ringkasan postingan akan otomatis dikirim ke email ini.
              </p>
            </div>

          </div>

        </div>

        {/* Action Footer Bar */}
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Target Sheet ID: <strong className="text-slate-800 font-mono text-[11px]">1YOdn-LDDY...</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-100 transition w-full sm:w-auto text-center"
            >
              Lihat Dasbor Statistik
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim ke Google Sheet &amp; Email
                </>
              )}
            </button>
          </div>

        </div>

      </form>

    </div>
  );
};

