import React, { useRef, useState, useEffect } from 'react';
import { PurchaseOrder } from '../../types';
import { UserProfile, USER_ROLE_LABELS, USER_ROLE_BADGE } from '../../types/userTypes';
import {
  User,
  PenTool,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  Award,
  ShieldCheck,
  Smartphone,
  LogOut,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  BarChart2,
  FileSpreadsheet,
  Layers,
  FolderCheck,
} from 'lucide-react';
import { normalizeTestCode, getTestStatus3State } from '../../utils/helpers';
import { isSampleAssignedToUser, isSingleTestAssignedToUser } from '../../utils/userPermissions';

interface MobileProfileViewProps {
  pos?: PurchaseOrder[];
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  users: UserProfile[];
  isOnline?: boolean;
  onToggleOnlineMode?: (targetMode?: boolean) => void;
  pendingQueueCount?: number;
  onManualSync?: () => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onLogout?: () => void;
}

const getTestStatProps = (code: string) => {
  const norm = normalizeTestCode(code);
  if (norm === 'SG') return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', label: 'Berat Jenis (SG)' };
  if (norm === 'MC') return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700', label: 'Kadar Air (MC)' };
  if (norm === 'UW') return { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700', label: 'Berat Volume (UW)' };
  if (norm === 'ATB' || norm === 'ATT') return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700', label: 'Atterberg Limits (ATB)' };
  if (norm === 'Sieve-Hydro' || norm === 'SVE-HYD' || norm === 'S&H' || norm === 'SVE') return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700', label: 'Sieve & Hydro' };
  if (norm === 'PB' || norm === 'PRM' || norm === 'PERM') return { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-700', label: 'Permeability (PB)' };
  if (norm === 'CT' || norm === 'CNS') return { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700', label: 'Consolidation (CT)' };
  if (norm === 'UCT') return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700', label: 'Unconfined (UCT)' };
  if (norm === 'DS-UU') return { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700', label: 'Direct Shear UU' };
  if (norm === 'DS-CU') return { bg: 'bg-fuchsia-700', text: 'text-white', border: 'border-fuchsia-800', label: 'Direct Shear CU' };
  if (norm === 'DS-CD') return { bg: 'bg-fuchsia-800', text: 'text-white', border: 'border-fuchsia-900', label: 'Direct Shear CD' };
  if (norm === 'DS-CDR') return { bg: 'bg-pink-700', text: 'text-white', border: 'border-pink-800', label: 'DS CD Residual' };
  if (norm === 'TRX-UU') return { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700', label: 'Triaxial UU' };
  if (norm === 'TRX-CU') return { bg: 'bg-violet-700', text: 'text-white', border: 'border-violet-800', label: 'Triaxial CU' };
  if (norm === 'TRX-CD') return { bg: 'bg-violet-800', text: 'text-white', border: 'border-violet-900', label: 'Triaxial CD' };
  if (norm.startsWith('CMP')) return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700', label: 'Compaction Proctor' };
  if (norm.startsWith('CBR')) return { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-800', label: 'CBR Laboratory' };
  return { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800', label: norm };
};

export const MobileProfileView: React.FC<MobileProfileViewProps> = ({
  pos = [],
  currentUser,
  setCurrentUser,
  users,
  isOnline = true,
  onToggleOnlineMode,
  pendingQueueCount = 0,
  onManualSync,
  onUpdateUser,
  onLogout,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [inkColor, setInkColor] = useState('#0F172A'); // Default dark ink
  const pointsRef = useRef<Array<{ x: number; y: number }>>([]);

  // High-precision coordinate extractor that maps touch/mouse coordinates to canvas buffer
  const getCoordinates = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      const mouseEvent = e as React.MouseEvent<HTMLCanvasElement>;
      clientX = mouseEvent.clientX;
      clientY = mouseEvent.clientY;
    }

    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Digital Signature Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 3.0 * (dpr / 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;

      const savedSig = localStorage.getItem(`ansa_signature_${currentUser.id}`);
      if (savedSig) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setHasDrawn(true);
        };
        img.src = savedSig;
      }
    };

    setupCanvas();

    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, [currentUser.id, inkColor]);

  // Smooth touch/mouse drawing with Bézier curve interpolation
  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCoordinates(e);
    pointsRef.current = [pt, pt];

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.0 * (dpr / 2);

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, ctx.lineWidth / 2, 0, Math.PI * 2, true);
    ctx.fill();
    setHasDrawn(true);
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCoordinates(e);
    pointsRef.current.push(pt);

    if (pointsRef.current.length >= 3) {
      const p0 = pointsRef.current[pointsRef.current.length - 3];
      const p1 = pointsRef.current[pointsRef.current.length - 2];
      const p2 = pointsRef.current[pointsRef.current.length - 1];

      const mid1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      const mid2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 3.0 * (dpr / 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(mid1.x, mid1.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid2.x, mid2.y);
      ctx.stroke();
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    pointsRef.current = [];
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pointsRef.current = [];
    setHasDrawn(false);
    localStorage.removeItem(`ansa_signature_${currentUser.id}`);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    localStorage.setItem(`ansa_signature_${currentUser.id}`, dataUrl);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // --- STATISTIK KINERJA ANALIS / TEKNISI ---
  const testCountsMap: Record<string, number> = {};
  const completedSampleIds = new Set<string>();
  const completedPoIds = new Set<string>();
  let completedTestsTotal = 0;

  (pos || []).forEach(po => {
    let hasCompletedInPo = false;
    (po.samples || []).forEach(sample => {
      const isMySample = isSampleAssignedToUser(sample, currentUser);
      if (!isMySample) return;

      let hasCompletedInSample = false;
      (sample.tests || []).forEach(test => {
        const rawCode = test.testTypeCode || test.testTypeId || '';
        const normCode = normalizeTestCode(rawCode);
        if (normCode === 'PP') return;

        const isMyTest = isSingleTestAssignedToUser(test, sample, currentUser);
        if (!isMyTest) return;

        const isDone = getTestStatus3State(test).state === 'completed';
        if (isDone) {
          completedTestsTotal++;
          hasCompletedInSample = true;
          hasCompletedInPo = true;
          testCountsMap[normCode] = (testCountsMap[normCode] || 0) + 1;
        }
      });

      if (hasCompletedInSample) {
        completedSampleIds.add(`${po.id}-${sample.id}`);
      }
    });

    if (hasCompletedInPo) {
      completedPoIds.add(po.id);
    }
  });

  const completedSamplesCount = completedSampleIds.size;
  const completedPosCount = completedPoIds.size;

  // Desired sort order for test types
  const canonicalOrder = [
    'MC', 'UW', 'SG', 'ATB', 'Sieve-Hydro', 'PB', 'CT', 'UCT',
    'DS-UU', 'DS-CU', 'DS-CD', 'DS-CDR', 'TRX-UU', 'TRX-CU', 'TRX-CD',
    'CMP', 'CMP-STD', 'CMP-MOD', 'CBR-UNS', 'CBR-SOK'
  ];

  const sortedStats = Object.keys(testCountsMap)
    .sort((a, b) => {
      const idxA = canonicalOrder.indexOf(a);
      const idxB = canonicalOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    })
    .map(code => ({
      code,
      count: testCountsMap[code],
      ...getTestStatProps(code),
    }));

  return (
    <div className="space-y-4 pb-20 font-sans">
      {/* USER PROFILE HEADER CARD */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4.5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-start justify-between gap-2">
          {/* USER INFO */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-lg font-black text-white shadow-inner shrink-0">
              {currentUser.avatarInitials || 'AN'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-black tracking-tight truncate">{currentUser.name}</h2>
                {currentUser.analyistCode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[9px] font-mono shadow-xs">
                    {currentUser.analyistCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200 font-mono mt-0.5">NIP: {currentUser.nip || '-'}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[9.5px] font-bold border border-white/30 backdrop-blur-xs">
                {USER_ROLE_LABELS[currentUser.role]}
              </span>
            </div>
          </div>

          {/* LOGOUT BUTTON ON THE RIGHT INSIDE PROFILE CARD */}
          {onLogout && (
            <button
              onClick={() => {
                if (confirm(`Apakah Anda yakin ingin keluar dari akun ${currentUser.name}?`)) {
                  onLogout();
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white border border-red-400/40 text-[10.5px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0 shadow-2xs backdrop-blur-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-300" />
              <span>Keluar</span>
            </button>
          )}
        </div>

        {currentUser.specialization && (
          <div className="pt-2 border-t border-white/20 text-xs text-blue-100 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">Spesialisasi: <strong>{currentUser.specialization}</strong></span>
          </div>
        )}
      </div>

      {/* STATISTIK KINERJA ANALIS / TEKNISI CARD */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200/60">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide">Statistik Kinerja Analis</h3>
              <p className="text-[10.5px] text-slate-500 font-medium">Ringkasan Hasil Pengujian &amp; Proyek Selesai</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 font-mono">
            {completedTestsTotal} Uji Selesai
          </span>
        </div>

        {/* 3 METRIC TILES */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[10px] text-blue-700 font-bold block mb-0.5">Form Uji</span>
            <span className="text-lg font-black text-blue-950 font-mono">{completedTestsTotal}</span>
            <span className="text-[9px] text-blue-600/80 block mt-0.5 font-medium">Selesai Diuji</span>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100">
            <span className="text-[10px] text-teal-700 font-bold block mb-0.5">Sampel</span>
            <span className="text-lg font-black text-teal-950 font-mono">{completedSamplesCount}</span>
            <span className="text-[9px] text-teal-600/80 block mt-0.5 font-medium">Kode Sampel</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] text-amber-800 font-bold block mb-0.5">PO / Proyek</span>
            <span className="text-lg font-black text-amber-950 font-mono">{completedPosCount}</span>
            <span className="text-[9px] text-amber-700/80 block mt-0.5 font-medium">Project PO</span>
          </div>
        </div>

        {/* RINCIAN PER MASING-MASING JENIS UJI */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>Rincian Pengujian Selesai per Jenis Uji:</span>
            <span className="text-[10px] text-slate-400 font-mono">({sortedStats.length} Jenis Uji)</span>
          </div>

          {sortedStats.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-[11px] text-slate-400">
              Belum ada pengujian yang tercatat selesai untuk akun ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {sortedStats.map(({ code, count, label, bg, text, border }) => (
                <div
                  key={code}
                  className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-black font-mono shrink-0 ${bg} ${text} ${border}`}>
                      {code}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-700 truncate" title={label}>
                      {label}
                    </span>
                  </div>
                  <span className="font-mono font-black text-xs text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CONNECTION & SYNC MODE CARD */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900">Mode Sinkronisasi & Koneksi</h3>
              <p className="text-[10.5px] text-slate-500 font-mono">
                {isOnline ? '● Mode Online (Live Cloud Sync)' : '○ Mode Offline (Local Storage)'}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="bg-slate-50 p-1.5 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => onToggleOnlineMode && onToggleOnlineMode(true)}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isOnline ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Mode Online</span>
          </button>
          <button
            onClick={() => onToggleOnlineMode && onToggleOnlineMode(false)}
            className={`flex-1 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              !isOnline ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mode Offline</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          {isOnline
            ? '🌐 Di Mode Online: Data yang Anda simpan di HP langsung ter-posting secara realtime ke Web App Desktop dan server pusat.'
            : '🔒 Di Mode Offline: Data uji & foto disimpan aman di memori HP Anda. Cocok digunakan saat menguji di area laboratorium/cold room tanpa sinyal internet.'}
        </p>

        {pendingQueueCount !== undefined && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Antrean Data Pending: <strong className="font-mono text-amber-700">{pendingQueueCount} item</strong>
            </span>
            {isOnline && pendingQueueCount > 0 && (
              <button
                onClick={onManualSync}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Sekarang</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* DIGITAL SIGNATURE CANVAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tanda Tangan Digital Analis</span>
            </h3>
            <p className="text-[10.5px] text-slate-400">Goreskan tanda tangan dengan jari/stylus di layar sentuh</p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* INK COLOR SELECTOR */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setInkColor('#0F172A')}
                title="Tinta Hitam"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  inkColor === '#0F172A' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-950 inline-block border border-slate-300" />
                <span>Hitam</span>
              </button>

              <button
                type="button"
                onClick={() => setInkColor('#1E40AF')}
                title="Tinta Biru"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  inkColor === '#1E40AF' ? 'bg-white text-blue-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block border border-blue-400" />
                <span>Biru</span>
              </button>
            </div>

            {savedSuccess && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Tersimpan!</span>
              </span>
            )}
          </div>
        </div>

        {/* TOUCH CANVAS */}
        <div className="relative border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
            className="w-full h-40 bg-white cursor-crosshair block"
          />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-bold">
              Sentuh di sini untuk tanda tangan
            </div>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={clearSignature}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hapus / Ulangi</span>
          </button>

          <button
            onClick={saveSignature}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Tanda Tangan</span>
          </button>
        </div>
      </div>

      {/* APP INFO & CERTIFICATION BADGE */}
      <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Aplikasi Mobile APK &amp; PWA Teknisi</h4>
            <p className="text-[10px] text-blue-200 font-mono">Status: Terpasang di Perangkat / Mode Standalone</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-700/60 pt-2">
          Aplikasi ini dirancang khusus untuk Teknisi Lab Soil Mechanics. Mendukung <strong>Mode Online &amp; Offline</strong> di lapangan. Data pengujian tersimpan aman dan disinkronkan saat terhubung kembali ke jaringan.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
        <div className="flex items-center justify-center gap-1 text-[11px] font-black text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>TIMES® ANSA LIMS Mobile v2.0</span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono">
          PT. Terraforma Geoteknik Indonesia • ISO/IEC 17025 Certified
        </p>
      </div>
    </div>
  );
};
