import React, { useState, useRef, useEffect } from 'react';
import { ChevronsRight, CheckCircle2, Lock } from 'lucide-react';

interface SlideToConfirmProps {
  onConfirm: () => void;
  label?: string;
  completedLabel?: string;
  disabled?: boolean;
  className?: string;
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  onConfirm,
  label = 'Geser untuk Selesai Uji',
  completedLabel = 'Uji Berhasil Diselesaikan!',
  disabled = false,
  className = '',
}) => {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isCompletedRef = useRef(false);

  // Hitung batas maksimal geser (track width - thumb width - padding)
  const getMaxDistance = () => {
    if (!trackRef.current || !thumbRef.current) return 200;
    const trackWidth = trackRef.current.clientWidth;
    const thumbWidth = thumbRef.current.clientWidth;
    return Math.max(0, trackWidth - thumbWidth - 8); // 8px total horizontal padding
  };

  const startDrag = (clientX: number) => {
    if (disabled || isCompletedRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    const maxDist = getMaxDistance();
    startXRef.current = clientX - (dragProgress * maxDist);
  };

  const moveDrag = (clientX: number) => {
    if (!isDraggingRef.current || isCompletedRef.current) return;
    const maxDist = getMaxDistance();
    if (maxDist <= 0) return;

    const delta = clientX - startXRef.current;
    const progress = Math.min(1, Math.max(0, delta / maxDist));
    setDragProgress(progress);

    // Jika sudah digeser minimal 85%, kunci selesai!
    if (progress >= 0.85) {
      isDraggingRef.current = false;
      isCompletedRef.current = true;
      setIsDragging(false);
      setDragProgress(1);
      setIsCompleted(true);

      // Getaran haptic di perangkat mobile jika didukung
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([30, 40, 50]);
        } catch (_) {}
      }

      // Beri sedikit jeda animasi visual sebelum eksekusi callback
      setTimeout(() => {
        onConfirm();
      }, 300);
    }
  };

  const endDrag = () => {
    if (!isDraggingRef.current || isCompletedRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    // Jika belum sampai 85%, pegas kembali ke titik awal (0%)
    setDragProgress(0);
  };

  // Global event listener untuk pergerakan jari / mouse di luar elemen
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches.length > 0) {
        moveDrag(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) endDrag();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        moveDrag(e.clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) endDrag();
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const maxDist = getMaxDistance();
  const currentTranslateX = dragProgress * maxDist;

  if (disabled) {
    return (
      <div className={`relative h-13 w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 select-none p-1.5 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-bold font-mono">
          <Lock className="w-4 h-4" />
          <span>Lengkapi Data untuk Menggeser</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-13 w-full rounded-2xl overflow-hidden select-none p-1 border transition-all duration-300 ${
        isCompleted
          ? 'bg-emerald-600 border-emerald-500 shadow-md shadow-emerald-500/20'
          : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border-emerald-300 shadow-inner'
      } ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Dynamic Colored Progress Fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-500 to-teal-500 transition-all rounded-xl opacity-90"
        style={{
          width: isCompleted ? '100%' : `${Math.max(0, currentTranslateX + 44)}px`,
          transition: isDragging ? 'none' : 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />

      {/* Shimmering Center Prompt Label */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
        style={{ opacity: isCompleted ? 0 : Math.max(0, 1 - dragProgress * 2.2) }}
      >
        <span className="text-xs font-extrabold tracking-wide uppercase text-emerald-950 flex items-center gap-1.5 drop-shadow-xs">
          <span>{label}</span>
          <ChevronsRight className="w-4 h-4 text-emerald-600 animate-pulse inline-block" />
        </span>
      </div>

      {/* Completed State Display */}
      {isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-white font-extrabold text-xs tracking-wide uppercase flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
          <span>{completedLabel}</span>
        </div>
      )}

      {/* Draggable Thumb / Handle */}
      <div
        ref={thumbRef}
        onMouseDown={e => startDrag(e.clientX)}
        onTouchStart={e => {
          if (e.touches.length > 0) startDrag(e.touches[0].clientX);
        }}
        className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing ${
          isCompleted
            ? 'bg-white text-emerald-600 shadow-lg scale-105'
            : isDragging
              ? 'bg-white text-emerald-700 shadow-xl shadow-emerald-900/30 ring-2 ring-emerald-400 scale-102'
              : 'bg-white text-emerald-600 shadow-md shadow-emerald-900/20 border border-emerald-200'
        }`}
        style={{
          transform: `translateX(${currentTranslateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        ) : (
          <div className="flex items-center justify-center">
            <ChevronsRight className={`w-6 h-6 ${isDragging ? 'text-emerald-700' : 'text-emerald-600'}`} />
          </div>
        )}
      </div>
    </div>
  );
};
