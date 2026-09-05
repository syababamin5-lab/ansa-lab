import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  itemSubtitle?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Hapus',
  itemName,
  itemSubtitle,
  message = 'Apakah Anda yakin ingin menghapus data ini secara permanen?',
  confirmText = 'Ya, Hapus Sekarang',
  cancelText = 'Batal',
  variant = 'danger'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/30 overflow-hidden transform animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient & Header */}
        <div className="bg-gradient-to-b from-rose-50/90 to-transparent p-6 pb-4 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-xl transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {itemName && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1 shadow-2xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Dokumen Terpilih
              </div>
              <div className="font-mono font-extrabold text-sm text-slate-900 break-all">
                {itemName}
              </div>
              {itemSubtitle && (
                <div className="text-xs text-slate-600 font-medium pt-0.5">
                  {itemSubtitle}
                </div>
              )}
            </div>
          )}

          {/* Warning Banner */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-rose-900 leading-relaxed font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              Tindakan ini bersifat <strong>permanen</strong>. Data yang telah dihapus tidak dapat dipulihkan kembali dari sistem.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 font-bold text-xs shadow-2xs transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 font-bold text-xs shadow-md shadow-rose-600/25 flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
