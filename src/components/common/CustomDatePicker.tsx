import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // ISO format 'YYYY-MM-DD' or empty string ''
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  themeColor?: 'blue' | 'emerald';
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_ID = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Pilih tanggal...',
  themeColor = 'blue',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse initial view year and month
  const parseDate = (str: string) => {
    if (!str) return new Date();
    const parts = str.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const initialDate = parseDate(value);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  const modalRef = useRef<HTMLDivElement>(null);

  // Keep view in sync when value changes
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    const selectedStr = `${viewYear}-${mm}-${dd}`;
    onChange(selectedStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setViewYear(yyyy);
    setViewMonth(today.getMonth());
    onChange(todayStr);
    setIsOpen(false);
  };

  // Format date display (e.g. "28/08/2026" or "28 Agu 2026")
  const formatDisplay = (valStr: string) => {
    if (!valStr) return null;
    const parts = valStr.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
    }
    return valStr;
  };

  // Calendar calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Check if a specific cell matches selected date
  const isSelected = (dayNum: number) => {
    if (!value) return false;
    const parts = value.split('-').map(Number);
    if (parts.length === 3) {
      return parts[0] === viewYear && (parts[1] - 1) === viewMonth && parts[2] === dayNum;
    }
    return false;
  };

  const displayFormatted = formatDisplay(value);

  const themeClasses = themeColor === 'emerald'
    ? {
        border: 'border-emerald-300 focus:ring-emerald-500',
        icon: 'text-emerald-600',
        activeRing: 'border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-black rounded-full shadow-xs',
        todayBtn: 'text-emerald-700 font-extrabold hover:text-emerald-800',
      }
    : {
        border: 'border-slate-300 focus:ring-blue-500',
        icon: 'text-blue-600',
        activeRing: 'border-2 border-blue-500 bg-blue-50 text-blue-700 font-black rounded-full shadow-xs',
        todayBtn: 'text-emerald-600 font-extrabold hover:text-emerald-700',
      };

  return (
    <div className="relative inline-block w-full font-sans">
      {/* INPUT TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-white border ${themeClasses.border} rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800 shadow-2xs hover:border-blue-400 active:scale-[0.99] transition cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className={`w-4 h-4 ${themeClasses.icon} shrink-0`} />
          {displayFormatted ? (
            <span className="text-slate-900 font-extrabold">{displayFormatted}</span>
          ) : (
            <span className="text-slate-400 italic font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {/* POPUP CALENDAR MODAL */}
      {isOpen && (
        <div
          ref={modalRef}
          className="absolute z-50 left-0 top-full mt-1 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 space-y-3 animate-fade-in"
        >
          {/* HEADER: MONTH & YEAR NAVIGATION */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-black text-slate-900 tracking-wide">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-95 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* DAY NAMES ROW */}
          <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400 tracking-wider">
            {DAY_NAMES_ID.map((dayName, idx) => (
              <div key={idx} className="py-1">{dayName}</div>
            ))}
          </div>

          {/* DAYS GRID */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty leading cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const active = isSelected(dayNum);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-bold transition cursor-pointer active:scale-90 ${
                    active
                      ? themeClasses.activeRing
                      : 'text-slate-800 hover:bg-slate-100 rounded-full'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* FOOTER ACTIONS ROW */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className={`${themeClasses.todayBtn} transition cursor-pointer`}
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
