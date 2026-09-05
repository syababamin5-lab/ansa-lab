import React, { useState } from 'react';
import { BlankWorksheetConfig, SamplePrepReport } from '../../types/workflowTypes';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';
import { FileSpreadsheet, Printer, CheckCircle2, X } from 'lucide-react';

interface BlankWorksheetViewProps {
  prepReports: SamplePrepReport[];
  companyProfile?: CompanyProfile;
}

export const BlankWorksheetView: React.FC<BlankWorksheetViewProps> = ({ prepReports, companyProfile = DEFAULT_COMPANY_PROFILE }) => {
  const [selectedConfig, setSelectedConfig] = useState<BlankWorksheetConfig>({
    sampleCode: 'BH-1 (2.00-2.50m)',
    boreholeNo: 'BH-1',
    depthStr: '2.00 - 2.50 m',
    projectName: 'Penyelidikan Geoteknik & Mekanika Tanah',
    clientName: 'PT. GEOLAND QUATRO TECHNOLAB',
    testCodes: ['PP', 'ATB', 'SVE-HYD', 'DS-UU', 'CT'],
    datePrinted: new Date().toISOString().split('T')[0]
  });

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  return (
    <div className="p-3.5 sm:p-4 space-y-3.5 max-w-[99%] mx-auto text-slate-800">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-fit mb-1.5">
            <span>TAHAP 4 OPERASIONAL LAB</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             Form Kosong Otomatis Kertas Kerja Teknisi (Blank Worksheets)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Otomatis mencetak lembar kerja fisik kosong terisi Header Sampel &amp; Tabel Dial Kosong untuk diisi pen di meja laboratorium.
          </p>
        </div>
      </div>

      {/* PREPARED SAMPLES SELECTOR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Pilih Sampel Hasil Preparasi Lolos Pengujian</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prepReports.flatMap(r => r.items).map((item) => (
            <div 
              key={item.id}
              className={`p-4 rounded-xl border-2 transition text-xs space-y-2 cursor-pointer ${
                selectedConfig.sampleCode === item.sampleCode 
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => {
                setSelectedConfig({
                  sampleCode: item.sampleCode,
                  boreholeNo: item.boreholeNo,
                  depthStr: item.depthStr,
                  projectName: 'Penyelidikan Geoteknik & Mekanika Tanah',
                  clientName: 'PT. GEOLAND QUATRO TECHNOLAB',
                  testCodes: item.approvedTestCodes,
                  datePrinted: new Date().toISOString().split('T')[0]
                });
              }}
            >
              <div className="flex justify-between items-start">
                <div className="font-extrabold text-slate-900 text-sm font-mono">{item.sampleCode}</div>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                  item.status === 'PASS_FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}>
                  {item.status === 'PASS_FULL' ? 'Lolos Uji Penuh' : 'Sebagian Uji'}
                </span>
              </div>
              <div className="text-slate-600">Kedalaman: <strong className="font-mono text-slate-800">{item.depthStr}</strong></div>
              <div className="text-slate-600">Panjang Aktual: <strong className="font-mono text-blue-900">{item.actualLengthCm} cm</strong></div>
              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                {item.approvedTestCodes.map(tc => (
                  <span key={tc} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono font-bold text-[10px] rounded border border-slate-200">
                    {tc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Form Kosong Teknisi (A4)</span>
          </button>
        </div>
      </div>

      {/* PRINT PREVIEW MODAL FOR BLANK WORKSHEET */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1000px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Form Kosong Teknisi - {selectedConfig.sampleCode}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-4 h-4" /> Cetak Form (Printer Lab)
                </button>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-800 overflow-y-auto flex justify-center">
              <div className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-xs space-y-4 border border-slate-300 min-h-[297mm]">
                {/* KOP SURAT */}
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img src={companyProfile.logoUrl || '/logo.png'} alt="Logo" className="w-14 h-14 object-contain" />
                    <div>
                      <h1 className="text-base font-black text-blue-900 tracking-wider">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</h1>
                      <p className="text-[10px] text-slate-600 font-bold uppercase">{companyProfile.labNameEn || 'Geotechnical Engineering & Soil Mechanics Laboratory'}</p>
                      <p className="text-[9px] text-slate-500">{companyProfile.officeAddress || companyProfile.labAddress || 'Jl. Terusan Al Fathu Ruko Linggahara 2 No.2, Soreang, Bandung'} · Telp: {companyProfile.mobile || companyProfile.phone || '081214914641'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-blue-900 uppercase">LEMBAR KERJA PEMBACAAN DIAL</div>
                    <div className="text-xs font-bold font-mono text-slate-800">FORM KOSONG TEKNISI</div>
                    <div className="text-[10px] text-slate-500">Tgl Cetak: {selectedConfig.datePrinted}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-slate-900 p-2.5 bg-slate-50">
                  <div>
                    <div>Kode Sampel: <strong className="font-mono text-sm font-black">{selectedConfig.sampleCode}</strong></div>
                    <div>Kedalaman: <strong className="font-mono">{selectedConfig.depthStr}</strong></div>
                    <div>Klien: {selectedConfig.clientName}</div>
                  </div>
                  <div>
                    <div>Proyek: {selectedConfig.projectName}</div>
                    <div>Daftar Uji: <strong className="font-mono font-bold text-blue-900">{selectedConfig.testCodes.join(', ')}</strong></div>
                    <div>Teknisi Penguji: ________________________</div>
                  </div>
                </div>

                {/* BLANK DIAL TABLE FOR DIRECT SHEAR / PHYSICAL PROPERTIES */}
                <div className="space-y-2 pt-2">
                  <div className="font-bold text-blue-900 text-xs border-b border-slate-400 pb-1">
                    1. PEMBACAAN DIAL KUAT GESER LANGSUNG (DIRECT SHEAR UU)
                  </div>
                  <table className="w-full border-collapse border border-slate-900 text-[10px] text-center font-mono">
                    <thead>
                      <tr className="bg-slate-200 font-bold text-slate-900 border-b border-slate-900">
                        <th className="p-1 border border-slate-900" rowSpan={2}>Pergeseran (mm)</th>
                        <th className="p-1 border border-slate-900" colSpan={2}>Benda Uji 1 (Normal 10kg)</th>
                        <th className="p-1 border border-slate-900" colSpan={2}>Benda Uji 2 (Normal 20kg)</th>
                        <th className="p-1 border border-slate-900" colSpan={2}>Benda Uji 3 (Normal 40kg)</th>
                      </tr>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-900">
                        <th className="p-1 border border-slate-900">Dial Proving</th>
                        <th className="p-1 border border-slate-900">Dial Vert.</th>
                        <th className="p-1 border border-slate-900">Dial Proving</th>
                        <th className="p-1 border border-slate-900">Dial Vert.</th>
                        <th className="p-1 border border-slate-900">Dial Proving</th>
                        <th className="p-1 border border-slate-900">Dial Vert.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.5, 3.0, 4.0, 5.0].map((disp) => (
                        <tr key={disp} className="h-6">
                          <td className="p-1 border border-slate-400 font-bold bg-slate-50">{disp.toFixed(1)}</td>
                          <td className="p-1 border border-slate-400"></td>
                          <td className="p-1 border border-slate-400"></td>
                          <td className="p-1 border border-slate-400"></td>
                          <td className="p-1 border border-slate-400"></td>
                          <td className="p-1 border border-slate-400"></td>
                          <td className="p-1 border border-slate-400"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-8 flex justify-between text-slate-700 text-[10px]">
                  <div>Tanggal Pengujian: ___ / ___ / 2026</div>
                  <div>Paraf Teknisi: ____________</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
