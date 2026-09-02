import React from 'react';
import { Sample, PurchaseOrder, SOIL_COLOUR_CATALOGUE } from '../types';
import { formatDate } from '../utils/helpers';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface SampleReportSheetModalProps {
  sample: Sample;
  po: PurchaseOrder;
  onClose: () => void;
}

export const SampleReportSheetModal: React.FC<SampleReportSheetModalProps> = ({
  sample,
  po,
  onClose
}) => {
  const colourObj = SOIL_COLOUR_CATALOGUE.find(c => c.code === sample.colourCode) || SOIL_COLOUR_CATALOGUE[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-4 print:max-w-none print:w-full print:h-auto print:bg-white print:text-black print:p-0 print:m-0 print:border-none print:shadow-none">
        
        {/* Modal Top Bar (Hidden during Print) */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Formulir Lembar Laporan Lab (Acuan Form Standard)</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Form</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE LAB REPORT FORM SHEET */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 print:bg-white print:text-black text-xs text-slate-200">
          <div className="bg-white text-black p-6 rounded-xl border border-slate-300 space-y-4 font-sans text-[11px] leading-relaxed shadow-lg print:shadow-none print:border-none print:p-0">
            
            {/* Form Title Header */}
            <div className="border-b-2 border-black pb-2 text-center">
              <h2 className="text-base font-extrabold tracking-wider uppercase">LABORATORIUM MEKANIKA TANAH & GEOTEKNIK</h2>
              <p className="text-[10px] text-gray-700">Formulir Pendaftaran & Monitoring Pengujian Sampel</p>
            </div>

            {/* Main Form Table Grid */}
            <div className="grid grid-cols-12 gap-3 border border-gray-400 p-3 bg-yellow-50/20">
              
              {/* Left Column (Job & Client Meta) */}
              <div className="col-span-12 md:col-span-7 space-y-1.5 border-r md:border-gray-300 pr-2">
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Sample Number</span>
                  <span className="col-span-2 font-bold font-mono text-blue-900 bg-yellow-100/80 px-1">{sample.sampleCode}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Report Number</span>
                  <span className="col-span-2 font-mono text-gray-800">{sample.reportNumber || 'REP-2026-GQT-01'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Job Number</span>
                  <span className="col-span-2 font-bold font-mono text-gray-900">{po.poNumber}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Client</span>
                  <span className="col-span-2 font-bold text-gray-900">{po.clientName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Address</span>
                  <span className="col-span-2 text-gray-800">{po.clientAddress || 'Ganda Ganda, Petasia, Morowali'}</span>
                </div>

                <div className="grid grid-cols-3 pt-1">
                  <span className="font-semibold text-gray-700">Id Lab</span>
                  <span className="col-span-2 font-bold font-mono text-blue-800 bg-blue-100 px-1">{sample.idLab}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Project</span>
                  <span className="col-span-2 text-gray-900">{po.projectName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Location</span>
                  <span className="col-span-2 text-gray-900 font-semibold">{po.projectLocation || 'Morowali Utara'}</span>
                </div>
              </div>

              {/* Middle Top Column (Technicians & Sample Types) */}
              <div className="col-span-12 md:col-span-5 space-y-2">
                <table className="w-full text-left text-[10px] border border-gray-400">
                  <thead className="bg-gray-200 text-gray-800 font-bold border-b border-gray-400">
                    <tr>
                      <th className="p-1 border-r border-gray-400">Penguji</th>
                      <th className="p-1">Type of Sample</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr>
                      <td className="p-1 font-bold text-red-600 border-r border-gray-400">{sample.testedBy || 'Rizki'}</td>
                      <td className="p-1">{sample.sampleType}</td>
                    </tr>
                    <tr>
                      <td className="p-1 font-bold text-red-600 border-r border-gray-400">M Noval</td>
                      <td className="p-1">Disturbed Sample / DS</td>
                    </tr>
                    <tr>
                      <td className="p-1 font-bold text-red-600 border-r border-gray-400">Rafly</td>
                      <td className="p-1">Bulk Sample / DS</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Test Details & Timestamps Grid */}
            <div className="grid grid-cols-12 gap-3 border border-gray-400 p-3 bg-white">
              
              {/* Lithology, Soil Type, Colour Box */}
              <div className="col-span-12 md:col-span-7 space-y-1.5 border-r md:border-gray-300 pr-2">
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Test Type</span>
                  <span className="col-span-2 font-bold text-blue-900">
                    {(sample?.tests || []).map(t => t.testTypeCode).join(', ') || 'ATT, TRX-UU'}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Lithology</span>
                  <span className="col-span-2 font-bold text-blue-800">{sample.lithology}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Depth / Kedalaman</span>
                  <span className="col-span-2 font-bold">{sample.depthStart}m - {sample.depthEnd}m</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Soil Type / Tipe Tanah</span>
                  <span className="col-span-2 font-bold text-gray-900">{sample.soilType}</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span className="font-semibold text-gray-700">Colour / Warna</span>
                  <span className="col-span-2 font-bold flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-gray-500 inline-block" style={{ backgroundColor: colourObj.hex }} />
                    Kode {sample.colourCode}: {sample.colourName}
                  </span>
                </div>

                <div className="grid grid-cols-3 pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Tanggal Sampel Datang</span>
                  <span className="col-span-2 font-bold text-gray-900">{formatDate(po.sampleArrivalDate)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Diterima List Uji Tanggal</span>
                  <span className="col-span-2 font-bold text-red-600">{formatDate(po.listReceivedDate)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">PREPARASI DI MULAI</span>
                  <span className="col-span-2 font-bold text-gray-900">{formatDate(po.preparationStartDate)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Awal Pengujian</span>
                  <span className="col-span-2 font-bold text-gray-900">{formatDate(po.testingStartDate)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="font-semibold text-gray-700">Checked By</span>
                  <span className="col-span-2 font-bold text-gray-900">{po.checkedBy} (Tempat: {po.place})</span>
                </div>
              </div>

              {/* Right Column: 1 - 20 Colour Table Reference */}
              <div className="col-span-12 md:col-span-5">
                <div className="text-[10px] font-bold text-gray-800 mb-1 border-b border-gray-400 pb-0.5">
                  Katalog Warna Standar (No 1 - 19)
                </div>
                <div className="max-h-56 overflow-y-auto border border-gray-400 text-[9.5px]">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 font-bold border-b border-gray-300">
                      <tr>
                        <th className="p-0.5 border-r border-gray-300 text-center w-6">No</th>
                        <th className="p-0.5">Colour / Warna</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {SOIL_COLOUR_CATALOGUE.map((c) => (
                        <tr key={c.code} className={c.code === sample.colourCode ? 'bg-yellow-200 font-bold' : ''}>
                          <td className="p-0.5 border-r border-gray-300 text-center font-mono">{c.code}</td>
                          <td className="p-0.5 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full border border-gray-400 inline-block shrink-0" style={{ backgroundColor: c.hex }} />
                            <span>{c.name}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Disclaimer & Footer */}
            <div className="p-2 border border-gray-400 text-[9.5px] italic text-red-600 bg-gray-50">
              Disclaimer: The samples were received as {sample.sampleType} and the validity of testing applies to the provided specimens.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end print:hidden">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
