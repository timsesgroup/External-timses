import React, { useState } from 'react';
import { 
  Search, 
  RefreshCw, 
  ExternalLink, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  X,
  FileText,
  Calendar,
  Tag,
  User,
  Link2,
  Users,
  List,
  ChevronDown,
  ChevronRight,
  Globe
} from 'lucide-react';
import { DocumentEntry, AppSettings, PostStatus } from '../types';

interface DocumentListProps {
  entries: DocumentEntry[];
  settings: AppSettings;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  entries,
  settings,
  onRefresh,
  isRefreshing
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWebsiteFilter, setSelectedWebsiteFilter] = useState<string>('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');
  const [selectedKonten, setSelectedKonten] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedIdReffFilter, setSelectedIdReffFilter] = useState<string>('ALL');
  const [groupByReff, setGroupByReff] = useState<boolean>(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedDoc, setSelectedDoc] = useState<DocumentEntry | null>(null);

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`;

  // Extract unique ID REFF list and Website list for filter dropdowns
  const idReffList = Array.from(new Set(entries.map(e => e.idReff).filter(Boolean))).sort();
  const knownWebsites = ['studiobet78', 'bigbet78', 'piala45', 'bambu189'];
  const discoveredWebs = Array.from(new Set(entries.map(e => e.website).filter(Boolean))) as string[];
  const websiteList = Array.from(new Set([...knownWebsites, ...discoveredWebs]));

  const filteredEntries = entries.filter(e => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      e.idReff.toLowerCase().includes(term) ||
      e.konten.toLowerCase().includes(term) ||
      e.platform.toLowerCase().includes(term) ||
      e.catatan.toLowerCase().includes(term) ||
      e.linkKonten.toLowerCase().includes(term) ||
      (e.website || '').toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(term);

    const matchesWebsite = selectedWebsiteFilter === 'ALL' || (e.website || 'studiobet78').toLowerCase() === selectedWebsiteFilter.toLowerCase();
    const matchesPlatform = selectedPlatform === 'ALL' || e.platform === selectedPlatform;
    const matchesKonten = selectedKonten === 'ALL' || e.konten === selectedKonten;
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus;
    const matchesIdReff = selectedIdReffFilter === 'ALL' || e.idReff === selectedIdReffFilter;

    return matchesSearch && matchesWebsite && matchesPlatform && matchesKonten && matchesStatus && matchesIdReff;
  });

  // Group entries by ID REFF
  const groupedEntries: Record<string, DocumentEntry[]> = {};
  filteredEntries.forEach(entry => {
    const key = entry.idReff || 'Lainnya';
    if (!groupedEntries[key]) {
      groupedEntries[key] = [];
    }
    groupedEntries[key].push(entry);
  });

  const toggleGroupCollapse = (reff: string) => {
    setCollapsedGroups(prev => ({ ...prev, [reff]: !prev[reff] }));
  };

  const getWebsiteBadge = (website?: string) => {
    const web = (website || 'studiobet78').toLowerCase();
    switch (web) {
      case 'studiobet78':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 studiobet78</span>;
      case 'bigbet78':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔵 bigbet78</span>;
      case 'piala45':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🟡 piala45</span>;
      case 'bambu189':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🟣 bambu189</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">🎰 {website}</span>;
    }
  };

  const getStatusBadge = (status: PostStatus | string) => {
    switch (status) {
      case 'Dipublikasikan':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dipublikasikan</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit"><Clock className="w-3 h-3 text-amber-600" /> Pending</span>;
      case 'Scheduled':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 flex items-center gap-1 w-fit"><Calendar className="w-3 h-3 text-cyan-600" /> Terjadwal</span>;
      case 'Gagal':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3 text-rose-600" /> Gagal</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 flex items-center gap-1 w-fit">Draft</span>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200">INSTAGRAM</span>;
      case 'TIKTOK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">TIKTOK</span>;
      case 'YOUTUBE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">YOUTUBE</span>;
      case 'FACEBOOK':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">FACEBOOK</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">{platform}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-4">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Riwayat Entri Postingan Konten
            </h2>
            <p className="text-xs text-slate-500">
              Total <strong className="text-slate-800">{filteredEntries.length}</strong> entri postingan ({Object.keys(groupedEntries).length} ID REFF)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setGroupByReff(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  groupByReff ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kelompokkan berdasarkan ID REFF"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Group ID REFF</span>
              </button>
              <button
                onClick={() => setGroupByReff(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  !groupByReff ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan daftar lurus"
              >
                <List className="w-3.5 h-3.5" />
                <span>Daftar Lurus</span>
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Sheet</span>
            </button>

            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Sheet</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </a>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          
          {/* Search Box */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari ID REFF, link..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
          </div>

          {/* Filter Website */}
          <select
            value={selectedWebsiteFilter}
            onChange={e => setSelectedWebsiteFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-800 bg-emerald-50/50 focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">🌐 Semua Web</option>
            {websiteList.map(web => (
              <option key={web} value={web}>🎰 {web}</option>
            ))}
          </select>

          {/* Filter ID REFF */}
          <select
            value={selectedIdReffFilter}
            onChange={e => setSelectedIdReffFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua ID REFF ({idReffList.length})</option>
            {idReffList.map(reff => (
              <option key={reff} value={reff}>{reff}</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua Platform</option>
            <option value="INSTAGRAM">INSTAGRAM</option>
            <option value="TIKTOK">TIKTOK</option>
            <option value="YOUTUBE">YOUTUBE</option>
            <option value="FACEBOOK">FACEBOOK</option>
            <option value="X / TWITTER">X / TWITTER</option>
            <option value="THREADS">THREADS</option>
            <option value="OTHER">OTHER</option>
          </select>

          {/* Konten Filter */}
          <select
            value={selectedKonten}
            onChange={e => setSelectedKonten(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua Jenis Konten</option>
            <option value="BRANDING">BRANDING</option>
            <option value="PROMOSI">PROMOSI</option>
            <option value="ENDORSEMENT">ENDORSEMENT</option>
            <option value="EDUKASI">EDUKASI</option>
            <option value="ENTERTAINMENT">ENTERTAINMENT</option>
            <option value="ORGANIC">ORGANIC</option>
            <option value="REVIEW">REVIEW</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-emerald-500 outline-none transition"
          >
            <option value="ALL">Semua Status</option>
            <option value="Dipublikasikan">Dipublikasikan</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled / Terjadwal</option>
            <option value="Draft">Draft</option>
            <option value="Gagal">Gagal</option>
          </select>

        </div>

      </div>

      {/* Main Content Area */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
          Tidak ada data postingan yang sesuai kriteria pencarian atau filter.
        </div>
      ) : groupByReff ? (
        /* GROUPED BY ID REFF VIEW */
        <div className="space-y-4">
          {Object.entries(groupedEntries).map(([reff, groupItems]) => {
            const isCollapsed = collapsedGroups[reff];
            const platforms = Array.from(new Set(groupItems.map(i => i.platform)));

            return (
              <div key={reff} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition">
                {/* Group Header */}
                <div 
                  onClick={() => toggleGroupCollapse(reff)}
                  className="bg-slate-50 hover:bg-slate-100/80 p-4 border-b border-slate-200 flex items-center justify-between gap-3 cursor-pointer select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 bg-white border border-slate-200">
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono text-base font-extrabold text-slate-900">{reff}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                      {groupItems.length} Postingan
                    </span>
                  </div>

                  {/* Platforms Summary Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {platforms.map(p => (
                      <span key={p} className="text-[10px]">
                        {getPlatformBadge(p)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Group Body Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-4">Konten (Kolom A)</th>
                          <th className="py-2.5 px-4">Platform (Kolom B)</th>
                          <th className="py-2.5 px-4">Status (Kolom D)</th>
                          <th className="py-2.5 px-4">Tanggal Postingan</th>
                          <th className="py-2.5 px-4">Link & Catatan</th>
                          <th className="py-2.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {groupItems.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{entry.konten}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getPlatformBadge(entry.platform)}
                            </td>
                            <td className="py-3 px-4">
                              {getStatusBadge(entry.status)}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">
                              {entry.tanggalPostingan || '-'}
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                              <div className="truncate font-medium text-slate-800">{entry.catatan || '-'}</div>
                              {entry.linkKonten && (
                                <a
                                  href={entry.linkKonten}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-cyan-600 hover:underline flex items-center gap-1 truncate mt-0.5"
                                >
                                  <Link2 className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{entry.linkKonten}</span>
                                </a>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedDoc(entry)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD STRAIGHT TABLE VIEW */
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Konten (Kolom A)</th>
                    <th className="py-3 px-4">Platform (Kolom B)</th>
                    <th className="py-3 px-4">ID REFF (Kolom C)</th>
                    <th className="py-3 px-4">Status (Kolom D)</th>
                    <th className="py-3 px-4">Tanggal Postingan</th>
                    <th className="py-3 px-4">Link / Catatan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{entry.konten}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getPlatformBadge(entry.platform)}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-800">
                        {entry.idReff}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(entry.status)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {entry.tanggalPostingan || '-'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        <div className="truncate font-medium">{entry.catatan || '-'}</div>
                        {entry.linkKonten && (
                          <a
                            href={entry.linkKonten}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-cyan-600 hover:underline flex items-center gap-0.5 truncate"
                          >
                            <Link2 className="w-3 h-3" /> {entry.linkKonten}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedDoc(entry)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {getPlatformBadge(entry.platform)}
                      <span className="font-mono text-xs font-bold text-slate-900">{entry.idReff}</span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1">{entry.konten}</h3>
                  </div>
                  {getStatusBadge(entry.status)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-xs text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Postingan:</span>
                    <span className="font-mono font-medium text-slate-800">{entry.tanggalPostingan || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Catatan:</span>
                    <p className="text-slate-800 line-clamp-2">{entry.catatan || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {entry.linkKonten ? (
                    <a
                      href={entry.linkKonten}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 hover:underline"
                    >
                      <Link2 className="w-3.5 h-3.5" /> Buka Link Konten
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Tanpa Link</span>
                  )}

                  <button
                    onClick={() => setSelectedDoc(entry)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Entry Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 animate-scale-up">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedDoc.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDoc.konten} - {selectedDoc.platform}</h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Jenis Konten (Kolom A)</span>
                  <span className="font-bold text-slate-900">{selectedDoc.konten}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">PLATFORM (Kolom B)</span>
                  <span className="font-bold text-slate-900">{selectedDoc.platform}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">ID REFF (Kolom C)</span>
                  <span className="font-mono font-extrabold text-emerald-800">{selectedDoc.idReff}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Status (Kolom D)</span>
                  {getStatusBadge(selectedDoc.status)}
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tanggal Postingan (Kolom E)</span>
                  <span className="font-mono font-semibold text-slate-900">{selectedDoc.tanggalPostingan}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">LINK KONTEN (Kolom F)</span>
                {selectedDoc.linkKonten ? (
                  <a
                    href={selectedDoc.linkKonten}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-900 font-medium break-all flex items-center gap-1.5 hover:underline"
                  >
                    <Link2 className="w-4 h-4 shrink-0 text-cyan-700" />
                    {selectedDoc.linkKonten}
                  </a>
                ) : (
                  <p className="text-slate-400 italic">Tidak ada link konten.</p>
                )}
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold mb-1">CATATAN (Kolom G)</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap">
                  {selectedDoc.catatan || 'Tidak ada catatan.'}
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <div>• Waktu Input Web: <strong className="text-slate-800">{selectedDoc.timestamp}</strong></div>
                <div>• Email Notifikasi: <strong className="text-slate-800">{selectedDoc.notificationEmail || '-'}</strong> ({selectedDoc.emailSent ? '✓ Terkirim' : 'Belum/Batal'})</div>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Buka di Google Sheet
              </a>

              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
