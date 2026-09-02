import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Sample, ContainerItem, RingItem, ConsolRingItem, DsProvingItem, DsRingItem, TrxRingItem, UctRingItem, PycnometerItem, MoldItem } from '../../types';
import { UserProfile } from '../../types/userTypes';
import { MobileDashboardView } from './MobileDashboardView';
import { MobileTaskQueueView } from './MobileTaskQueueView';
import { MobileWorksheetView } from './MobileWorksheetView';
import { MobileToolLookupView } from './MobileToolLookupView';
import { MobileLabTimersView } from './MobileLabTimersView';
import { MobileHistoryView } from './MobileHistoryView';
import { MobileProfileView } from './MobileProfileView';
import { getOfflineQueue, queueOfflineSampleUpdate, syncOfflineQueueToPos, PendingOfflineUpdate } from '../../utils/mobileSync';
import { loadStateFromCloud, saveStateToCloud } from '../../services/cloudSyncService';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Scale,
  Timer,
  History,
  User,
  Monitor,
  Sparkles,
  Layers,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface MobileTechnicianAppProps {
  pos: PurchaseOrder[];
  setPos: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  users: UserProfile[];
  containerCatalogue?: ContainerItem[];
  ringCatalogue?: RingItem[];
  consolRingCatalogue?: ConsolRingItem[];
  dsProvingCatalogue?: DsProvingItem[];
  dsRingCatalogue?: DsRingItem[];
  trxRingCatalogue?: TrxRingItem[];
  uctRingCatalogue?: UctRingItem[];
  pycnometerCatalogue?: PycnometerItem[];
  moldCatalogue?: MoldItem[];
  onSwitchToDesktop?: () => void;
  onLogout?: () => void;
}

export const MobileTechnicianApp: React.FC<MobileTechnicianAppProps> = ({
  pos,
  setPos,
  currentUser,
  setCurrentUser,
  users,
  containerCatalogue = [],
  ringCatalogue = [],
  consolRingCatalogue = [],
  dsProvingCatalogue = [],
  dsRingCatalogue = [],
  trxRingCatalogue = [],
  uctRingCatalogue = [],
  pycnometerCatalogue = [],
  moldCatalogue = [],
  onSwitchToDesktop,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'tools' | 'timers' | 'history' | 'profile' | 'worksheet'>('dashboard');
  const [selectedSample, setSelectedSample] = useState<{ sample: Sample; po: PurchaseOrder; initialTestCode?: string } | null>(null);
  const [taskQueueFilter, setTaskQueueFilter] = useState<'all' | 'unstarted' | 'draft' | 'completed'>('unstarted');

  // Network Online/Offline State & Manual Mode Switcher
  const [networkOnline, setNetworkOnline] = useState<boolean>(navigator.onLine);
  const [isManualOffline, setIsManualOffline] = useState<boolean>(() => {
    return localStorage.getItem('ansa_mobile_manual_offline') === 'true';
  });
  const [pendingQueue, setPendingQueue] = useState<PendingOfflineUpdate[]>(() => getOfflineQueue());
  const [syncToastMsg, setSyncToastMsg] = useState<string | null>(null);

  const isEffectiveOnline = networkOnline && !isManualOffline;

  // PWA Install Event Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkOnline(true);
      if (!isManualOffline) {
        // Auto sync when coming back online
        const res = syncOfflineQueueToPos(pos, setPos);
        if (res.syncedCount > 0) {
          setSyncToastMsg(`🌐 Terhubung Online! Berhasil menyinkronkan ${res.syncedCount} data pengujian offline ke Web App.`);
          setTimeout(() => setSyncToastMsg(null), 4000);
        }
        setPendingQueue(getOfflineQueue());
      }
    };

    const handleOffline = () => {
      setNetworkOnline(false);
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [pos, isManualOffline]);

  const handleToggleOnlineMode = (targetMode?: boolean) => {
    const nextManualOffline = targetMode !== undefined ? !targetMode : !isManualOffline;
    setIsManualOffline(nextManualOffline);
    localStorage.setItem('ansa_mobile_manual_offline', String(nextManualOffline));

    if (!nextManualOffline) {
      // Switching to Mode Online
      if (navigator.onLine) {
        const res = syncOfflineQueueToPos(pos, setPos);
        setPendingQueue(getOfflineQueue());
        if (res.syncedCount > 0) {
          setSyncToastMsg(`🌐 Mode Online Aktif! Berhasil menyinkronkan ${res.syncedCount} data offline ke Web App.`);
        } else {
          setSyncToastMsg('🌐 Mode Online Aktif! Sinkronisasi live terhubung ke server.');
        }
      } else {
        setSyncToastMsg('⚠️ Mode Online dipilih, namun sinyal internet perangkat sedang terputus.');
      }
    } else {
      setSyncToastMsg('🔒 Mode Offline Aktif. Semua data input & foto akan disimpan aman di HP.');
    }
    setTimeout(() => setSyncToastMsg(null), 3500);
  };

  const triggerPWAInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Untuk meng-install aplikasi ini di HP Android:\n1. Buka menu Browser (tiga titik di kanan atas)\n2. Pilih "Tambahkan ke Layar Utama" / "Install App"');
    }
  };

  const handleManualSync = () => {
    if (!isEffectiveOnline) {
      alert('Aplikasi sedang dalam Mode Offline. Aktifkan Mode Online terlebih dahulu untuk menyinkronkan data ke server.');
      return;
    }
    const res = syncOfflineQueueToPos(pos, setPos);
    setPendingQueue(getOfflineQueue());
    if (res.syncedCount > 0) {
      setSyncToastMsg(`✅ Berhasil menyinkronkan ${res.syncedCount} data pengujian ke Web App!`);
    } else {
      setSyncToastMsg('✅ Semua data pengujian sudah tersinkronisasi penuh dengan Web App.');
    }
    setTimeout(() => setSyncToastMsg(null), 3500);
  };

  // Open worksheet for a specific sample and specific test code tab
  const handleOpenWorksheet = (sample: Sample, po: PurchaseOrder, initialTestCode?: string) => {
    setSelectedSample({ sample, po, initialTestCode });
    setActiveTab('worksheet');
  };

  // Save sample updates from mobile worksheet (Online or Offline mode)
  const handleSaveSample = (updatedSample: Sample) => {
    const targetCode = (updatedSample.sampleCode || '').trim().toUpperCase();
    const targetId = (updatedSample.id || '').trim();

    let computedNextPos: PurchaseOrder[] = [];

    // 1. Update React state locally so technician sees their inputs immediately
    setPos(prevPos => {
      const nextPos = prevPos.map(po => {
        const sampleIndex = po.samples.findIndex(s => {
          const sCode = (s.sampleCode || '').trim().toUpperCase();
          const sId = (s.id || '').trim();
          return (targetId && sId === targetId) || (targetCode && sCode === targetCode);
        });

        if (sampleIndex === -1) return po;

        const updatedSamples = [...po.samples];
        updatedSamples[sampleIndex] = {
          ...updatedSamples[sampleIndex],
          ...updatedSample,
          tests: updatedSample.tests || updatedSamples[sampleIndex].tests,
        };

        return {
          ...po,
          samples: updatedSamples,
          updatedAt: new Date().toISOString(),
        };
      });

      computedNextPos = nextPos;

      try {
        localStorage.setItem('ansa_lab_pos', JSON.stringify(nextPos));
      } catch (e) {
        console.error('Failed to persist POS to localStorage:', e);
      }

      return nextPos;
    });

    // 1.1 Also update selectedSample if it matches so subsequent views have freshest data
    setSelectedSample(prev => {
      if (!prev) return null;
      const prevCode = (prev.sample.sampleCode || '').trim().toUpperCase();
      const prevId = (prev.sample.id || '').trim();
      if ((targetId && prevId === targetId) || (targetCode && prevCode === targetCode)) {
        return {
          ...prev,
          sample: {
            ...prev.sample,
            ...updatedSample,
            tests: updatedSample.tests || prev.sample.tests,
          },
        };
      }
      return prev;
    });

    if (!isEffectiveOnline) {
      // 2. Mode Offline: Queue update in offline storage
      const targetPoId = updatedSample.poId || selectedSample?.po.id || '';
      const nextQueue = queueOfflineSampleUpdate(targetPoId, updatedSample);
      setPendingQueue(nextQueue);
      setSyncToastMsg(`🔒 Tersimpan di Mode Offline HP (${nextQueue.length} data pending sync).`);
      setTimeout(() => setSyncToastMsg(null), 4000);
    } else {
      // 3. Mode Online: Broadcast update across tabs (send BOTH pos array & sample object)
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('ansa_lab_realtime_sync');
          channel.postMessage({
            type: 'SYNC_POS',
            pos: computedNextPos.length > 0 ? computedNextPos : undefined,
            sample: updatedSample
          });
          channel.close();
        }
      } catch (e) {
        console.error('Error broadcasting update:', e);
      }

      // 4. Immediately sync to Cloud Database (Vercel KV REST) so Web App on desktop receives it
      loadStateFromCloud().then(cloudState => {
        if (cloudState && computedNextPos.length > 0) {
          saveStateToCloud({
            ...cloudState,
            pos: computedNextPos,
            updatedAt: new Date().toISOString(),
          }).catch(err => console.error('Immediate cloud save error:', err));
        }
      }).catch(err => console.error('Cloud load before save error:', err));

      setSyncToastMsg('🌐 Berhasil Di-Posting ke Web App & Server!');
      setTimeout(() => setSyncToastMsg(null), 3500);
    }

    if (selectedSample) {
      setSelectedSample(prev => prev ? { ...prev, sample: updatedSample } : null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* ONLINE / OFFLINE STATUS TOP BANNER */}
      {!isEffectiveOnline && (
        <div className="bg-amber-600 text-amber-50 px-3.5 py-2 text-[11px] font-bold flex items-center justify-between shadow-sm border-b border-amber-500 sticky top-0 z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
            <span>Mode Offline — Data tersimpan aman di HP</span>
          </div>
          <div className="flex items-center gap-1.5">
            {pendingQueue.length > 0 && (
              <span className="bg-amber-800 text-amber-100 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-black">
                {pendingQueue.length} Pending
              </span>
            )}
            <button
              onClick={() => handleToggleOnlineMode(true)}
              className="px-2 py-0.5 bg-white text-amber-900 hover:bg-amber-100 rounded-lg text-[10px] font-black transition active:scale-95 cursor-pointer shadow-xs"
            >
              Aktifkan Online
            </button>
          </div>
        </div>
      )}

      {/* SYNC TOAST POPUP */}
      {syncToastMsg && (
        <div className="fixed top-14 left-4 right-4 z-[9999] bg-slate-900 text-emerald-400 border border-emerald-500/50 p-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 text-white font-medium">{syncToastMsg}</span>
        </div>
      )}

      {/* MOBILE TOP BAR (EXCEPT WHEN INSIDE WORKSHEET) */}
      {activeTab !== 'worksheet' && (
        <header className="sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
              AL
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-white">ANSA LIMS</span>
                <span className="px-1.5 py-0.2 bg-blue-500 text-[9px] font-black rounded text-white uppercase font-mono">
                  Mobile
                </span>
              </div>
              <div className="flex items-center gap-1.5 -mt-0.5">
                <span className="text-[10px] text-slate-400 font-mono">Portal Teknisi</span>
                <button
                  onClick={() => handleToggleOnlineMode()}
                  className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold cursor-pointer transition active:scale-95 ${
                    isEffectiveOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-amber-500/25 text-amber-200 border border-amber-500/40 hover:bg-amber-500/35'
                  }`}
                  title="Klik untuk beralih mode Online / Offline"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isEffectiveOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isEffectiveOnline ? 'Mode Online' : 'Mode Offline'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {pendingQueue.length > 0 && isEffectiveOnline && (
              <button
                onClick={handleManualSync}
                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-black flex items-center gap-1 shadow-sm active:scale-95 transition cursor-pointer"
                title="Sinkronkan Data Offline ke Server"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync ({pendingQueue.length})</span>
              </button>
            )}

            <button
              onClick={triggerPWAInstall}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 border border-white/20 flex items-center justify-center active:scale-95 transition cursor-pointer"
              title="Install Aplikasi Mobile APK / App"
            >
              <Download className="w-4 h-4 text-blue-300" />
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center border border-blue-400 shadow-sm cursor-pointer active:scale-95"
            >
              {currentUser.avatarInitials || 'RF'}
            </button>
          </div>
        </header>
      )}

      {/* MAIN BODY CONTAINER */}
      <main className="flex-1 p-3.5 sm:p-4 max-w-lg mx-auto w-full">
        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <MobileDashboardView
            pos={pos}
            currentUser={currentUser}
            isOnline={isEffectiveOnline}
            onToggleOnlineMode={handleToggleOnlineMode}
            pendingQueueCount={pendingQueue.length}
            onManualSync={handleManualSync}
            onNavigateTab={tab => setActiveTab(tab as any)}
            onOpenWorksheet={handleOpenWorksheet}
          />
        )}

        {/* 2. TASK QUEUE */}
        {activeTab === 'tasks' && (
          <MobileTaskQueueView
            pos={pos}
            currentUser={currentUser}
            activeFilter={taskQueueFilter}
            onFilterChange={setTaskQueueFilter}
            onOpenWorksheet={handleOpenWorksheet}
          />
        )}

        {/* 3. MOBILE WORKSHEET */}
        {activeTab === 'worksheet' && selectedSample && (
          <MobileWorksheetView
            sample={selectedSample.sample}
            po={selectedSample.po}
            initialTestCode={selectedSample.initialTestCode}
            currentUser={currentUser}
            isOnline={isEffectiveOnline}
            containerCatalogue={containerCatalogue}
            trxRingCatalogue={trxRingCatalogue}
            ringCatalogue={ringCatalogue}
            dsRingCatalogue={dsRingCatalogue}
            dsProvingCatalogue={dsProvingCatalogue}
            uctRingCatalogue={uctRingCatalogue}
            pycnometerCatalogue={pycnometerCatalogue}
            onBack={() => setActiveTab('tasks')}
            onSaveSample={handleSaveSample}
          />
        )}

        {/* 4. CAWAN & ALAT LOOKUP */}
        {activeTab === 'tools' && (
          <MobileToolLookupView
            containerCatalogue={containerCatalogue}
            ringCatalogue={ringCatalogue}
            consolRingCatalogue={consolRingCatalogue}
            dsProvingCatalogue={dsProvingCatalogue}
            dsRingCatalogue={dsRingCatalogue}
            trxRingCatalogue={trxRingCatalogue}
            uctRingCatalogue={uctRingCatalogue}
            pycnometerCatalogue={pycnometerCatalogue}
            moldCatalogue={moldCatalogue}
          />
        )}

        {/* 5. LAB TIMERS */}
        {activeTab === 'timers' && <MobileLabTimersView />}

        {/* 6. HISTORY */}
        {activeTab === 'history' && (
          <MobileHistoryView
            pos={pos}
            currentUser={currentUser}
            onOpenSampleDetail={handleOpenWorksheet}
          />
        )}

        {/* 7. PROFILE */}
        {activeTab === 'profile' && (
          <MobileProfileView
            pos={pos}
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            users={users}
            isOnline={isEffectiveOnline}
            onToggleOnlineMode={handleToggleOnlineMode}
            pendingQueueCount={pendingQueue.length}
            onManualSync={handleManualSync}
            onLogout={onLogout}
          />
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR (HIDDEN IN WORKSHEET VIEW FOR MAXIMUM SCREEN SPACE) */}
      {activeTab !== 'worksheet' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl max-w-lg mx-auto">
          <div className="grid grid-cols-5 items-center px-1 py-1.5 text-center">
            {[
              { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
              { id: 'tasks', label: 'Tugas', icon: FileSpreadsheet },
              { id: 'timers', label: 'Timer', icon: Timer },
              { id: 'history', label: 'Histori', icon: History },
              { id: 'profile', label: 'Profil', icon: User },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex flex-col items-center justify-center py-1 rounded-xl transition cursor-pointer active:scale-95 ${
                    isActive ? 'text-blue-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div
                    className={`p-1 rounded-xl transition ${
                      isActive ? 'bg-blue-100/70 text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
