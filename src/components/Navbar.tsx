import React from 'react';
import { Search, Bell, RefreshCw, Sparkles, Smartphone, LogOut } from 'lucide-react';
import { UserProfile, USER_ROLE_LABELS, USER_ROLE_BADGE } from '../types/userTypes';

interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  urgentAlertsCount?: number;
  onOpenSchemaModal: () => void;
  onResetLocalData?: () => void;
  currentUser: UserProfile;
  onLogout: () => void;
  onToggleMobileMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  setSearchTerm,
  urgentAlertsCount = 0,
  onOpenSchemaModal,
  onResetLocalData,
  currentUser,
  onLogout,
  onToggleMobileMode,
}) => {
  const badge = USER_ROLE_BADGE[currentUser.role];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Input */}
      <div className="relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari PO, Kode Sampel, Klien..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
        />
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-3">


        {/* Reset Local Data Button */}
        {onResetLocalData && (
          <button
            onClick={() => {
              if (confirm('Apakah Anda yakin ingin mereset/sinkronkan data ke sampel default? Seluruh perubahan lokal akan diperbarui.')) {
                onResetLocalData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition cursor-pointer"
            title="Reset & Sync LocalStorage Data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset / Sync Data</span>
          </button>
        )}

        {/* DB Schema Button */}
        <button
          onClick={onOpenSchemaModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs font-semibold transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Skema DB</span>
        </button>



        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition relative cursor-pointer"
            title={urgentAlertsCount > 0 ? `${urgentAlertsCount} PO Mendekati Deadline` : 'Tidak Ada Warning Critical'}
          >
            <Bell className="w-4 h-4" />
            {urgentAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
            {urgentAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* ===== AUTHENTIC USER PROFILE BADGE & LOGOUT BUTTON ===== */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 pl-2 rounded-2xl">
          <div className={`w-8 h-8 rounded-xl ${badge.bg} ${badge.text} flex items-center justify-center font-black text-xs border-2 ${badge.border} shadow-xs shrink-0`}>
            {currentUser.avatarInitials}
          </div>

          <div className="text-left hidden sm:block font-sans pr-1">
            <div className="text-xs font-extrabold text-slate-900 leading-tight flex items-center gap-1">
              <span>{currentUser.shortName}</span>
              {currentUser.analyistCode && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                  {currentUser.analyistCode}
                </span>
              )}
            </div>
            <div className="text-[9.5px] font-bold text-slate-500 font-mono">
              {USER_ROLE_LABELS[currentUser.role]}
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm(`Apakah Anda yakin ingin keluar dari akun ${currentUser.name}?`)) {
                onLogout();
              }
            }}
            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 ml-1"
            title="Keluar dari Akun / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
