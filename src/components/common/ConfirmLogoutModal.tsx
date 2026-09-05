import React, { useEffect } from 'react';
import { LogOut, X, ShieldAlert } from 'lucide-react';
import { UserProfile, USER_ROLE_LABELS } from '../../types/userTypes';

export interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: UserProfile;
}

export const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-950/25 overflow-hidden transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Header */}
        <div className="bg-gradient-to-br from-rose-50/90 via-red-50/40 to-transparent p-6 pb-4 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
            title="Batal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
              <LogOut className="w-5 h-5 ml-0.5" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-md font-mono inline-block">
                Konfirmasi Sesi
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Keluar dari Akun?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Apakah Anda yakin ingin mengakhiri sesi login saat ini?
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Active User Card Badge */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
              {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 truncate">
                  {user.name}
                </span>
                {user.analyistCode && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-mono font-black shrink-0">
                    {user.analyistCode}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-semibold text-slate-500 font-mono">
                  {USER_ROLE_LABELS[user.role] || user.role}
                </span>
                {user.nip && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {user.nip}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Security & Data Safety Reminder */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-amber-900 leading-relaxed font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Seluruh data perhitungan yang telah tersimpan tetap aman di cloud server. Anda dapat login kembali kapan saja.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 font-bold text-xs shadow-2xs transition cursor-pointer active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 font-bold text-xs shadow-md shadow-rose-600/25 flex items-center gap-2 transition cursor-pointer active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ya, Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
