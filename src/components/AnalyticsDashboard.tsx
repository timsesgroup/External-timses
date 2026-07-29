import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ArrowUpRight, 
  RefreshCw,
  Share2,
  Tag,
  UserCheck
} from 'lucide-react';
import { DashboardSummary } from '../types';

interface AnalyticsDashboardProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateForm: () => void;
}

const PLATFORM_COLORS = [
  '#e1306c', // Instagram Pink
  '#00f2fe', // TikTok Cyan
  '#ff0000', // YouTube Red
  '#1877f2', // Facebook Blue
  '#1da1f2', // Twitter Blue
  '#10b981', // Threads / Emerald
  '#8b5cf6'  // Slate / Other
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summary,
  isLoading,
  onRefresh,
  onNavigateForm
}) => {
  const [dateRange, setDateRange] = useState<'7d' | '14d'>('14d');

  if (isLoading || !summary) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Memuat Statistik &amp; Grafik Entri Harian...</p>
      </div>
    );
  }

  const filteredDailyStats = dateRange === '7d' 
    ? summary.dailyStats.slice(-7) 
    : summary.dailyStats;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-10 space-y-6">
      
      {/* Top Banner & Control Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dasbor Statistik Postingan Konten</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Real-Time Google Sheets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring performa publikasi konten harian, platform, dan statistik ID REFF akun.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Date range filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateRange === '7d' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateRange('14d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                dateRange === '14d' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Hari
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="Perbarui Grafik"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Postingan Hari Ini */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Postingan Hari Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.totalToday}</span>
            <span className="text-xs text-slate-500 font-medium">konten</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            Bulan ini: <strong className="text-slate-800">{summary.totalThisMonth}</strong> postingan
          </div>
        </div>

        {/* KPI 2: Total Publikasi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telah Dipublikasi</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.publishedCount}</span>
            <span className="text-xs text-slate-500 font-medium">konten</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-medium">
            Tingkat Sukses: <strong>{summary.publishedRate}%</strong>
          </div>
        </div>

        {/* KPI 3: Pending / Draft */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending / Draft</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{summary.pendingCount}</span>
            <span className="text-xs text-slate-500 font-medium">antrean</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-medium">
            Status butuh eksekusi
          </div>
        </div>

        {/* KPI 4: Total Rekam Datapoint */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entri Data</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.totalAllTime}</span>
            <span className="text-xs text-slate-500 font-medium">baris</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Tersimpan di Google Sheets
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Entry Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Tren Entri Postingan Konten Harian
              </h3>
              <p className="text-xs text-slate-500">
                Grafik volume entri harian ({dateRange === '7d' ? '7 hari terakhir' : '14 hari terakhir'})
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredDailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: 'none', 
                    color: '#ffffff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [value, 'Total Postingan']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  name="count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Share2 className="w-4 h-4 text-cyan-600" />
              Distribusi Platform
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Persentase postingan berdasarkan media sosial
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              {summary.platformStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.platformStats}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {summary.platformStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderRadius: '8px', 
                        border: 'none', 
                        color: '#fff',
                        fontSize: '11px'
                      }}
                      formatter={(val: any) => [`${val} postingan`, 'Jumlah']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">Belum ada data platform</p>
              )}
            </div>
          </div>

          {/* Platform Legend List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-40 overflow-y-auto pr-1">
            {summary.platformStats.map((plat, idx) => (
              <div key={plat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: PLATFORM_COLORS[idx % PLATFORM_COLORS.length] }} 
                  />
                  <span className="text-slate-700 font-semibold truncate">{plat.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 font-semibold shrink-0">
                  <span>{plat.count}</span>
                  <span className="text-slate-400">({plat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Row 2: Content Types & Top Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Content Types Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            Breakdown Jenis Konten (Kolom Konten)
          </h3>
          <div className="space-y-2">
            {summary.contentTypeStats.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{item.name}</span>
                  <span className="font-mono text-emerald-700">{item.count} postingan ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.max(item.percentage, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top ID REFF Accounts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            Top ID REFF / Akun Teraktif (Kolom ID REFF)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {summary.topAccounts.map(acc => (
              <div key={acc.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 block">{acc.name}</span>
                  <span className="text-[10px] text-slate-500">{acc.percentage}% dari total</span>
                </div>
                <span className="px-2 py-1 rounded-lg bg-cyan-100 text-cyan-800 font-extrabold text-xs">
                  {acc.count}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white">Ingin menginput postingan konten baru sekarang?</h4>
          <p className="text-xs text-emerald-100 mt-0.5">
            Gunakan web form otomatis yang tersinkron langsung ke Google Sheet &amp; email penerima.
          </p>
        </div>
        <button
          onClick={onNavigateForm}
          className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs shadow-xs transition shrink-0"
        >
          + Input Postingan Konten
        </button>
      </div>

    </div>
  );
};

