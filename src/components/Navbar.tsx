import React from 'react';
import { FileSpreadsheet, Mail, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  settings: AppSettings;
  health: { oauthConnected: boolean; hasAppsScriptUrl: boolean } | null;
  onSyncSheet: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ settings, health, onSyncSheet, isSyncing }) => {
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`;

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold text-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white leading-none">
                Ex TIMSES <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">PRO</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block mt-0.5">
              Input Dokumen Web Real-Time & Notifikasi Email Automatic
            </p>
          </div>
        </div>

        {/* Sync Status & Target Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Status Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            {health?.oauthConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Google OAuth Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                Sheet Sync Active
              </span>
            )}
            
            <span className="text-slate-600">|</span>

            {settings.enableAutoEmail ? (
              <span className="flex items-center gap-1 text-cyan-400">
                <Mail className="w-3.5 h-3.5" />
                Auto Email ON
              </span>
            ) : (
              <span className="text-slate-400">Email OFF</span>
            )}
          </div>

          {/* Sync Sheet Action Button */}
          <button
            onClick={onSyncSheet}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition disabled:opacity-50"
            title="Tarik data terbaru dari Google Sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Sync Sheet</span>
          </button>

          {/* Open Google Sheet External Button */}
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buka Google Sheet</span>
            <ExternalLink className="w-3 h-3 text-emerald-200 ml-0.5" />
          </a>

        </div>

      </div>
    </header>
  );
};
