import React, { useState } from 'react';
import { parseSoilLabExcel, downloadSampleImportTemplate, ExcelImportResult } from '../utils/excelParser';
import { FileSpreadsheet, Upload, Download, X, CheckCircle2, AlertCircle, Save, HelpCircle } from 'lucide-react';

interface ExcelImportModalProps {
  poNumber: string;
  onClose: () => void;
  onConfirmImport: (importedData: ExcelImportResult) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  poNumber,
  onClose,
  onConfirmImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ExcelImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await parseSoilLabExcel(selectedFile);
      if (res.samples.length === 0) {
        setErrorMsg('Tidak dapat menemukan baris sampel valid di dalam file Excel. Pastikan mengisi kolom Sample Initial.');
      } else {
        setParsedResult(res);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal membaca file Excel. Pastikan file dalam format .xlsx atau .csv yang valid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult || parsedResult.samples.length === 0) return;
    onConfirmImport(parsedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Kode Sampel via Format Angka 1 Excel</h3>
              <p className="text-xs text-slate-400">
                Upload daftar sampel untuk PO <span className="text-emerald-400 font-mono font-bold">{poNumber}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Rule Angka 1 Explanation Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-emerald-300">Aturan Pengisian Excel (Rule Angka 1):</div>
              <p className="text-slate-300 leading-relaxed">
                Isikan <strong className="text-white font-mono bg-emerald-900 px-1 py-0.5 rounded">angka 1</strong> pada kolom pengujian jika sampel tersebut diuji. Kosongkan sel jika tidak diuji. Sistem akan membaca seluruh 19 kolom pengujian (Specific Gravity, Moisture content, Unit weight, Atterberg, Sieve, Proctor, Permeability, Consolidation, UCT, Direct Shear UU/CU/CD/Residual, Triaxial UU/CU/CD, CBR Unsoaked/Soaked).
              </p>
            </div>
          </div>

          {/* Download Template Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-bold text-slate-200">Unduh Template Excel Pengisian Angka 1</div>
              <p className="text-slate-400 text-[11px]">
                Template lengkap 19 kolom pengujian mekanika tanah sesuai format gambar spreadsheet Anda.
              </p>
            </div>

            <button
              onClick={downloadSampleImportTemplate}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold border border-slate-700 flex items-center gap-1.5 shrink-0 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Template (Angka 1)</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-medium">Pilih File Excel (.xlsx / .csv)</label>
            
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl bg-slate-950/60 cursor-pointer transition group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 mb-2 transition-transform group-hover:scale-110" />
              <div className="text-xs font-semibold text-slate-200">
                {file ? file.name : 'Klik untuk pilih file Excel atau Drag & Drop ke sini'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Mendukung file format .xlsx, .xls, atau .csv</p>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Parsed Samples Table */}
          {parsedResult && parsedResult.samples.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pratinjau {parsedResult.samples.length} Sampel Terdeteksi dari Excel (Hasil Deteksi Angka 1)
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Sample Initial</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Depth (m)</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Pengujian Di-assign (Angka 1)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {parsedResult.samples.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-white">{s.sampleCode}</td>
                        <td className="py-2 px-3 text-slate-300">{s.sampleType.split('/')[0]}</td>
                        <td className="py-2 px-3 text-slate-400">{s.depthStart}m - {s.depthEnd}m</td>
                        <td className="py-2 px-3 text-amber-400">{s.soilType}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1">
                            {s.testCodesToAssign.map(code => (
                              <span key={code} className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800">
                                {code}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parsedResult || parsedResult.samples.length === 0}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Import {parsedResult?.samples.length || 0} Sampel Ke PO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
