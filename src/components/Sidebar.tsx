import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FolderTree, 
  Database, 
  Settings, 
  FlaskConical,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  PackageCheck,
  Scissors,
  Building2,
  Printer,
  CreditCard,
  Users,
  Timer,
  Sparkles,
  TrendingUp,
  UserCog,
  QrCode,
  UserCheck,
  Tv
} from 'lucide-react';
import { UserProfile, USER_ROLE_LABELS, USER_ROLE_BADGE } from '../types/userTypes';
import { isMenuAllowed } from '../utils/userPermissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  runningPOCount: number;
  urgentPOCount: number;
  currentUser: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  runningPOCount,
  urgentPOCount,
  currentUser
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ansa_lab_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('ansa_lab_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white/95 backdrop-blur-md border-r border-slate-200/80 text-slate-700 flex flex-col justify-between h-[105.3vh] sticky top-0 select-none z-20 shadow-[1px_0_15px_rgba(0,0,0,0.03)] transition-all duration-300 ease-in-out shrink-0`}
    >
      <div className="flex flex-col min-h-0 overflow-hidden">
        {/* Logo Branding & Collapse Toggle */}
        <div className={`p-3 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} bg-slate-50/40 gap-1`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2.5 overflow-hidden text-left focus:outline-none group cursor-pointer min-w-0 flex-1"
            title={isCollapsed ? "Perluas Sidebar" : "Kecilkan Sidebar"}
          >
            <div className="relative p-1 rounded-xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-indigo-500/15 border border-emerald-500/20 shadow-2xs group-hover:scale-105 transition-transform duration-200 shrink-0">
              <img 
                src="/logo.png" 
                alt="Logo Terraforma Geoteknik Indonesia" 
                className="w-7 h-7 object-contain shrink-0" 
              />
            </div>
            {!isCollapsed && (
              <div className="whitespace-nowrap transition-opacity duration-200 overflow-hidden min-w-0">
                <h1 className="font-extrabold text-slate-900 tracking-tight text-xs flex items-center gap-1">
                  <span>ANSA LIMS</span>
                  <span className="text-[8.5px] font-mono font-bold px-1 py-0.2 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs tracking-wider shrink-0">
                    TIMES®
                  </span>
                </h1>
                <p className="text-[8.5px] text-slate-500 font-semibold tracking-tight truncate">PT. Terraforma Geoteknik Indonesia</p>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Kecilkan Sidebar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Items (Scrollable List) */}
        <nav className="px-2.5 space-y-1 overflow-y-auto flex-1 custom-scrollbar pb-4">
          {/* GROUP 1: ADMINISTRASI & EXECUTIVE ANALYTICS */}
          {!isCollapsed && (
            <div className="px-3 pt-3 pb-1 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Administrasi &amp; Keuangan</span>
            </div>
          )}
          {isCollapsed && <div className="my-2 border-t border-slate-100 mx-1" />}
          
          {[
            { id: 'financial_analytics', label: 'Dashboard Keuangan & Analisis', icon: TrendingUp },
            { id: 'client_master', label: 'Master Data Client & Lab', icon: Users },
            { id: 'quotation', label: 'Penawaran Harga', icon: FileText },
            { id: 'invoice', label: 'Invoice & Tagihan', icon: CreditCard },
          ].filter(item => isMenuAllowed(item.id, currentUser.role)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-bold transition-colors duration-150 relative group cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 text-emerald-950 border-emerald-500/30 shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-r-full shadow-2xs" />
                )}
                
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0 flex-1'}`}>
                  <div className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 group-hover:text-slate-700'
                  }`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  {!isCollapsed && <span className="tracking-tight truncate">{item.label}</span>}
                </div>
              </button>
            );
          })}

          {/* GROUP 2: OPERASIONAL LAB */}
          {!isCollapsed && (
            <div className="px-3 pt-4 pb-1 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Operasional Lab</span>
            </div>
          )}
          {isCollapsed && <div className="my-2 border-t border-slate-100 mx-1" />}
          
          {[
            { id: 'sample_receipt', label: 'Tanda Terima Sampel', icon: PackageCheck, badge: null as number | null, badgeColor: '' },
            { id: 'sample_prep', label: 'Preparasi Sampel & BA', icon: Scissors, badge: null as number | null, badgeColor: '' },
            { id: 'subcontract_notice', label: 'Subkontrak Lab Rekanan', icon: Building2, badge: null as number | null, badgeColor: '' },
            { id: 'blank_worksheet', label: 'Form Kosong Teknisi', icon: Printer, badge: null as number | null, badgeColor: '' },
            { id: 'waktu_pengujian', label: 'Waktu Pengujian', icon: Timer, badge: null as number | null, badgeColor: '' },
            { id: 'dashboard', label: 'Dashboard LSCP & Monitoring', icon: LayoutDashboard, badge: 'LSCP', badgeColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-2xs font-black' },
            { id: 'tv_lscp', label: 'TV Display LSCP (Wall Screen)', icon: Tv, badge: 'TV', badgeColor: 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-2xs font-black' },
            { id: 'po_management', label: 'Kelola PO & Sampel', icon: FolderKanban, badge: runningPOCount, badgeColor: 'bg-emerald-600 text-white' },
            { id: 'pp_worksheet', label: 'Input Data Uji (Kertas Kerja)', icon: FileSpreadsheet, badge: null as number | null, badgeColor: '' },
            { id: 'sandbox_test', label: 'Sandbox Uji Rumus (All-in-One)', icon: FlaskConical, badge: 'TEST', badgeColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-2xs font-black' },
            { id: 'public_verification', label: 'Portal Verifikasi LHU (QR)', icon: QrCode, badge: 'QR', badgeColor: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs font-black' },
            { id: 'guest_book', label: 'Buku Tamu Digital (QR)', icon: UserCheck, badge: 'TAMU', badgeColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs font-black' },
          ].filter(item => isMenuAllowed(item.id, currentUser.role)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? `${item.label}${item.badge !== null && item.badge !== undefined ? ` (${item.badge})` : ''}` : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-2.5 py-2'
                } rounded-xl text-xs font-bold transition-colors duration-150 relative group cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 text-emerald-950 border-emerald-500/30 shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-r-full shadow-2xs" />
                )}

                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2 min-w-0 flex-1'}`}>
                  <div className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 group-hover:text-slate-700'
                  }`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  {!isCollapsed && <span className="tracking-tight truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 text-[8.5px] font-extrabold rounded-full shadow-2xs shrink-0 ml-1 ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge !== null && item.badge !== undefined && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* GROUP 3: SISTEM */}
          {!isCollapsed && (
            <div className="px-3 pt-4 pb-1 text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Sistem</span>
            </div>
          )}
          {isCollapsed && <div className="my-2 border-t border-slate-100 mx-1" />}
          
          {[
            { id: 'file_explorer', label: 'Windows File Explorer', icon: FolderTree },
            { id: 'db_schema', label: 'Skema DB Future-Proof', icon: Database },
            { id: 'user_management', label: 'Manajemen User & Akses', icon: UserCog },
            { id: 'settings', label: 'Pengaturan & Master', icon: Settings },
          ].filter(item => isMenuAllowed(item.id === 'user_management' ? 'settings' : item.id, currentUser.role)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                } rounded-xl text-xs font-bold transition-colors duration-150 relative group cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 text-emerald-950 border-emerald-500/30 shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-r-full shadow-2xs" />
                )}
                
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5 min-w-0 flex-1'}`}>
                  <div className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-400 group-hover:text-slate-700'
                  }`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  {!isCollapsed && <span className="tracking-tight truncate">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Info */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500 shrink-0">
          <div className="flex items-center justify-between text-slate-800 text-[10.5px] mb-1 font-extrabold">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>System Info</span>
            </div>
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ONLINE
            </span>
          </div>

          <p className="text-[11px] text-slate-900 font-black leading-tight">
            ANSA LIMS <span className="text-emerald-700 text-[9.5px] font-mono">v1.2</span>
          </p>
          <p className="text-[10px] text-slate-600 font-semibold leading-tight mt-0.5">
            Lab Mekanika Tanah — TIMES® Engine
          </p>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">
            © 2026 PT. Terraforma Geoteknik Indonesia
          </p>
        </div>
      ) : (
        <div 
          className="p-3 border-t border-slate-100 bg-slate-50/70 flex justify-center shrink-0" 
          title="ANSA LIMS v1.2 — Lab Mekanika Tanah (TIMES® Engine) - © 2026 PT. Terraforma Geoteknik Indonesia"
        >
          <div className="relative">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      )}
    </aside>
  );
};

