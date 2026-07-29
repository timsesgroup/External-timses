import React from 'react';
import { PlusCircle, UserCheck, BarChart3, FileText, Code2 } from 'lucide-react';

export type TabType = 'form' | 'id-manager' | 'dashboard' | 'documents' | 'apps-script';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const tabs = [
    {
      id: 'form' as TabType,
      label: 'Input Postingan',
      icon: PlusCircle,
      badge: null
    },
    {
      id: 'id-manager' as TabType,
      label: 'Kelola ID REFF',
      icon: UserCheck,
      badge: null
    },
    {
      id: 'dashboard' as TabType,
      label: 'Dasbor Statistik',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'documents' as TabType,
      label: 'Daftar Postingan',
      icon: FileText,
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      id: 'apps-script' as TabType,
      label: 'Integrasi GAS',
      icon: Code2,
      badge: null
    }
  ];

  return (
    <>
      {/* Desktop Sub-Header Navigation */}
      <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-16 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-semibold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Fixed Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-1 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 scale-105' : 'text-slate-400'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-bold animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1 leading-tight text-center truncate max-w-full">
                  {tab.label.replace('Dasbor ', '').replace('Daftar ', '')}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
