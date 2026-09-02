import React, { useState, useEffect } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Flame,
  Waves,
  Clock,
  Bell,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface LabTimerItem {
  id: string;
  title: string;
  subtitle: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  category: 'oven' | 'cbr' | 'consol' | 'custom';
}

const INITIAL_TIMERS: LabTimerItem[] = [
  {
    id: 'timer-oven-24h',
    title: 'Oven Pengeringan Kadar Air (w)',
    subtitle: 'SNI 1965:2008 — Suhu 110±5°C selama 24 Jam',
    totalSeconds: 24 * 3600,
    remainingSeconds: 24 * 3600,
    isRunning: false,
    category: 'oven',
  },
  {
    id: 'timer-cbr-96h',
    title: 'Perendaman CBR Soaked (4 Hari)',
    subtitle: 'SNI 1744:2012 — Perendaman Sampel 96 Jam',
    totalSeconds: 96 * 3600,
    remainingSeconds: 96 * 3600,
    isRunning: false,
    category: 'cbr',
  },
  {
    id: 'timer-consol-1d',
    title: 'Siklus Beban Konsolidasi 1-D (24 Jam)',
    subtitle: 'SNI 2812:2011 — Pembacaan dial 24 jam per beban',
    totalSeconds: 24 * 3600,
    remainingSeconds: 24 * 3600,
    isRunning: false,
    category: 'consol',
  },
];

export const MobileLabTimersView: React.FC = () => {
  const [timers, setTimers] = useState<LabTimerItem[]>(() => {
    try {
      const saved = localStorage.getItem('ansa_lab_mobile_timers');
      return saved ? JSON.parse(saved) : INITIAL_TIMERS;
    } catch {
      return INITIAL_TIMERS;
    }
  });

  const [customTitle, setCustomTitle] = useState('');
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Interval ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev =>
        prev.map(t => {
          if (!t.isRunning) return t;
          if (t.remainingSeconds <= 1) {
            // Timer finished
            return { ...t, remainingSeconds: 0, isRunning: false };
          }
          return { ...t, remainingSeconds: t.remainingSeconds - 1 };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('ansa_lab_mobile_timers', JSON.stringify(timers));
  }, [timers]);

  const toggleTimer = (id: string) => {
    setTimers(prev =>
      prev.map(t => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const resetTimer = (id: string) => {
    setTimers(prev =>
      prev.map(t => (t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false } : t))
    );
  };

  const handleAddCustomTimer = () => {
    const h = parseInt(customHours) || 0;
    const m = parseInt(customMinutes) || 0;
    const totalSec = h * 3600 + m * 60;
    if (totalSec <= 0 || !customTitle.trim()) return;

    const newTimer: LabTimerItem = {
      id: `timer-custom-${Date.now()}`,
      title: customTitle.trim(),
      subtitle: `Custom Timer — ${h} Jam ${m} Menit`,
      totalSeconds: totalSec,
      remainingSeconds: totalSec,
      isRunning: true,
      category: 'custom',
    };

    setTimers(prev => [newTimer, ...prev]);
    setCustomTitle('');
    setCustomHours('');
    setCustomMinutes('');
    setShowAddCustom(false);
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const formatTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-20 font-sans">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
            <Timer className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Timer Lab Geoteknik</h2>
            <p className="text-xs text-amber-100/90 font-medium">Hitung Mundur Uji Oven, CBR, &amp; Konsolidasi</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddCustom(prev => !prev)}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition cursor-pointer text-white flex items-center gap-1 text-xs font-extrabold"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* CUSTOM TIMER FORM MODAL / DRAWER */}
      {showAddCustom && (
        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Buat Timer Baru</span>
            </span>
            <button onClick={() => setShowAddCustom(false)} className="text-slate-400 font-bold text-xs">✕</button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nama Pengujian / Kegiatan:</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="mis. Curing Triaksial Sampel BH-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Jam:</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={customHours}
                  onChange={e => setCustomHours(e.target.value)}
                  placeholder="0 Jam"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Menit:</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  placeholder="0 Menit"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddCustomTimer}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              Mulai Timer
            </button>
          </div>
        </div>
      )}

      {/* TIMERS LIST */}
      <div className="space-y-3">
        {timers.map(timer => {
          const progress = timer.totalSeconds > 0 ? ((timer.totalSeconds - timer.remainingSeconds) / timer.totalSeconds) * 100 : 0;
          const isDone = timer.remainingSeconds === 0;

          return (
            <div
              key={timer.id}
              className={`p-4 rounded-2xl border transition-all ${
                isDone
                  ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                  : timer.isRunning
                  ? 'bg-white border-amber-300 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      timer.category === 'oven'
                        ? 'bg-red-100 text-red-700'
                        : timer.category === 'cbr'
                        ? 'bg-cyan-100 text-cyan-700'
                        : timer.category === 'consol'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {timer.category === 'oven' ? (
                      <Flame className="w-5 h-5" />
                    ) : timer.category === 'cbr' ? (
                      <Waves className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-tight">{timer.title}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{timer.subtitle}</p>
                  </div>
                </div>

                {timer.category === 'custom' && (
                  <button
                    onClick={() => deleteTimer(timer.id)}
                    className="text-slate-400 hover:text-red-500 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* COUNTDOWN DIGITS */}
              <div className="flex items-baseline justify-between pt-3">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-slate-900">
                  {formatTime(timer.remainingSeconds)}
                </span>
                
                {isDone ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center gap-1 animate-bounce">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Waktu Selesai!</span>
                  </span>
                ) : timer.isRunning ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span>Berjalan</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                    Berhenti
                  </span>
                )}
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full transition-all duration-500 ${
                    isDone
                      ? 'bg-emerald-500'
                      : timer.isRunning
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-3">
                <button
                  onClick={() => resetTimer(timer.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-extrabold text-xs flex items-center gap-1 hover:bg-slate-50 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                {!isDone && (
                  <button
                    onClick={() => toggleTimer(timer.id)}
                    className={`px-4 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 ${
                      timer.isRunning
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {timer.isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Mulai</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
