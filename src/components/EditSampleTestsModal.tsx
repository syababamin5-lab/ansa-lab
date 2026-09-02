import React, { useState } from 'react';
import { Sample, PurchaseOrder, MatrixTestInfo } from '../types';
import { X, Check, CheckSquare, Save, AlertCircle, BookOpen } from 'lucide-react';

interface EditSampleTestsModalProps {
  sample: Sample;
  po: PurchaseOrder;
  testCatalogue: MatrixTestInfo[];
  onClose: () => void;
  onSaveAssignedTests: (selectedCodes: string[]) => void;
}

export const EditSampleTestsModal: React.FC<EditSampleTestsModalProps> = ({
  sample,
  po,
  testCatalogue,
  onClose,
  onSaveAssignedTests
}) => {
  // Current active test codes assigned to this sample (normalizing ATT to ATB)
  const currentAssignedCodes = sample.tests.map(t => {
    const raw = (t.testTypeCode || t.testTypeId || '').toUpperCase();
    if (raw === 'ATT' || raw === 'TT-ATT') return 'ATB';
    return t.testTypeCode || t.testTypeId;
  });

  const [selectedCodes, setSelectedCodes] = useState<string[]>(currentAssignedCodes);

  const toggleCode = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    setSelectedCodes(testCatalogue.map(c => c.code));
  };

  const handleDeselectAll = () => {
    setSelectedCodes([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAssignedTests(selectedCodes);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-teal-600" />
              Edit / Koreksi Penugasan Jenis Uji Sampel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Sampel: <strong className="text-slate-900 font-sans">{sample.sampleCode}</strong> ({sample.idLab}) — {po.poNumber}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch Selection */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="text-slate-600 font-semibold">
            Total Uji Dipilih: <strong className="text-teal-700 font-extrabold">{selectedCodes.length} / {testCatalogue.length} Jenis Uji</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold border border-teal-200 transition"
            >
              Pilih Semua (19 Uji)
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition"
            >
              Kosongkan Semua
            </button>
          </div>
        </div>

        {/* 19 Test Selection Grid */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto p-1">
            {testCatalogue.map(col => {
              const isChecked = selectedCodes.includes(col.code);

              return (
                <div
                  key={col.code}
                  onClick={() => toggleCode(col.code)}
                  className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 select-none ${
                    isChecked
                      ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-mono font-extrabold text-xs text-slate-900">{col.code}</span>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                      {col.sniStandard}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-800 leading-snug line-clamp-1">
                      {col.fullNameIndo}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium truncate" title={col.sniTitle}>
                      "{col.sniTitle}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Menghapus centang pada jenis uji yang sudah selesai tidak akan menghapus riwayat data lama, namun uji tersebut tidak akan ditampilkan di matriks aktif PO ini.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Penugasan Uji</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
