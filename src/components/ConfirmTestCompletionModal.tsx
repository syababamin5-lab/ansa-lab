import React, { useState } from 'react';
import { PurchaseOrder, Sample, SampleTest } from '../types';
import { CheckCircle2, Calendar, X, Check } from 'lucide-react';

interface ConfirmTestCompletionModalProps {
  test: SampleTest;
  sample: Sample;
  po: PurchaseOrder;
  onClose: () => void;
  onConfirm: (completionDateIso: string) => void;
}

export const ConfirmTestCompletionModal: React.FC<ConfirmTestCompletionModalProps> = ({
  test,
  sample,
  po,
  onClose,
  onConfirm
}) => {
  // Format current datetime local for input e.g. "2026-07-27T19:39"
  const nowStr = new Date().toISOString().slice(0, 16);
  const [completionDateTime, setCompletionDateTime] = useState<string>(nowStr);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isoDate = new Date(completionDateTime).toISOString();
    onConfirm(isoDate);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Selesai Pengujian</h3>
              <p className="text-[11px] text-slate-500 font-medium">{po.poNumber} — {sample.sampleCode}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono text-xs">
                {test.testTypeCode}
              </span>
              <span>{test.testTypeName}</span>
            </div>

            <div className="text-slate-600 text-[11px] space-y-1">
              <div>Kode Sampel: <strong className="text-slate-900">{sample.sampleCode}</strong> ({sample.idLab})</div>
              <div>Penguji: <strong className="text-teal-700">{test.technicianName || sample.testedBy}</strong></div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed font-medium">
            Apakah pengujian <strong>{test.testTypeName}</strong> pada sampel <strong>{sample.sampleCode}</strong> ini benar-benar telah selesai dikerjakan di laboratorium?
          </div>

          {/* Date & Time Input */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Pilih Tanggal & Waktu Selesai Pengujian:</span>
            </label>

            <input
              type="datetime-local"
              required
              value={completionDateTime}
              onChange={(e) => setCompletionDateTime(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 font-bold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 text-xs"
            />
            <p className="text-[10px] text-slate-500 font-medium">Secara otomatis terisi tanggal & jam saat ini, atau sesuaikan jika pengujian beres sebelumnya.</p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi Selesai</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
