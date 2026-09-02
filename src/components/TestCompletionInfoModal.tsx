import React, { useState } from 'react';
import { PurchaseOrder, Sample, SampleTest } from '../types';
import { CheckCircle2, Calendar, Clock, UserCheck, X, Edit2, RotateCcw, Calculator } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface TestCompletionInfoModalProps {
  test: SampleTest;
  sample: Sample;
  po: PurchaseOrder;
  onClose: () => void;
  onUpdateCompletionDate: (newDateIso: string) => void;
  onRevertToUncompleted: () => void;
  onOpenCalcModal: () => void;
}

export const TestCompletionInfoModal: React.FC<TestCompletionInfoModalProps> = ({
  test,
  sample,
  po,
  onClose,
  onUpdateCompletionDate,
  onRevertToUncompleted,
  onOpenCalcModal
}) => {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const existingIso = test.endTime || new Date().toISOString();
  const [editDateStr, setEditDateStr] = useState<string>(existingIso.slice(0, 16));

  const handleSaveDate = (e: React.FormEvent) => {
    e.preventDefault();
    const newIso = new Date(editDateStr).toISOString();
    onUpdateCompletionDate(newIso);
    setIsEditingDate(false);
  };

  const formattedDateString = test.endTime 
    ? new Date(test.endTime).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB'
    : 'Tanggal Selesai Terdaftar';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 shadow-2xl text-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">STATUS: SELESAI / BERES</span>
              <h3 className="text-sm font-bold text-slate-900 font-mono">{test.testTypeCode}</h3>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Details */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-xs">{test.testTypeName}</div>
            <div className="text-slate-500 text-[11px]">Sampel: <strong className="text-slate-800">{sample.sampleCode}</strong> ({sample.idLab})</div>
            <div className="text-slate-500 text-[11px]">PO: <strong className="text-slate-800">{po.poNumber}</strong> — {po.clientName}</div>
          </div>

          {/* Date Info Box */}
          {!isEditingDate ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Keterangan Waktu Selesai:</span>
                </span>

                <button
                  onClick={() => setIsEditingDate(true)}
                  className="text-[10px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ubah</span>
                </button>
              </div>

              <div className="text-sm font-extrabold text-slate-900 font-sans">
                {formattedDateString}
              </div>

              <div className="text-[11px] text-slate-600 flex items-center gap-1.5 pt-1 border-t border-emerald-200/60 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Penguji Lab: <strong className="text-slate-900">{test.technicianName || sample.testedBy}</strong></span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveDate} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">Ubah Waktu Selesai Pengujian:</label>
              <input
                type="datetime-local"
                required
                value={editDateStr}
                onChange={(e) => setEditDateStr(e.target.value)}
                className="w-full bg-white text-slate-900 font-bold p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600 text-xs"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingDate(false)}
                  className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded bg-teal-600 text-white text-[11px] font-bold"
                >
                  Simpan Waktu
                </button>
              </div>
            </form>
          )}

          {/* Action Buttons */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenCalcModal();
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-slate-200"
            >
              <Calculator className="w-3.5 h-3.5 text-teal-600" />
              <span>Buka Lembar Hasil Perhitungan</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Apakah Anda yakin ingin membatalkan status selesai untuk pengujian ${test.testTypeCode}?`)) {
                  onRevertToUncompleted();
                  onClose();
                }
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition border border-amber-200"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>Kembalikan Ke Status Belum Selesai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
