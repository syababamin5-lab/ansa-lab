import React, { useRef, useState } from 'react';
import { Sample, PurchaseOrder, PersonnelItem } from '../types';
import { LHUSheetCode } from '../types/lhuTypes';
import { bindLHUData } from '../utils/lhuDataBinder';
import { LHUViewRenderer } from './lhu/LHUViewRenderer';
import { Printer, X, FileText, CheckCircle2, Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

interface LHUReportModalProps {
  sample: Sample;
  po: PurchaseOrder;
  personnelList: PersonnelItem[];
  initialSelectedCodes?: LHUSheetCode[];
  onClose: () => void;
}

const ALL_LHU_CATALOGUE: { code: LHUSheetCode; label: string; testCode: string; category: string }[] = [
  { code: 'LHU_PP', label: '1. Physical Properties (SG/MC/UW)', testCode: 'PP', category: 'Fisik' },
  { code: 'LHU_ATB', label: '2. Atterberg Limits (ATB)', testCode: 'ATB', category: 'Fisik' },
  { code: 'LHU_Sieve & Hidro', label: '3. Sieve & Hydrometer (SVE-HYD)', testCode: 'SVE-HYD', category: 'Fisik' },
  { code: 'LHU_standard proctor', label: '4. Standard Proctor Compaction', testCode: 'CMP-STD', category: 'Pemadatan' },
  { code: 'LHU_modified proctor', label: '5. Modified Proctor Compaction', testCode: 'CMP-MOD', category: 'Pemadatan' },
  { code: 'LHU PFH', label: '6. Permeability Falling Head (PB)', testCode: 'PB', category: 'Permeabilitas' },
  { code: 'LHU_Konsolidasi', label: '7. Consolidation Oedometer (CT)', testCode: 'CT', category: 'Konsolidasi' },
  { code: 'LHU_UCT', label: '8. Unconfined Compression (UCT)', testCode: 'UCT', category: 'Mekanis' },
  { code: 'LHU_DS-UU', label: '9. Direct Shear UU (DS-UU)', testCode: 'DS-UU', category: 'Mekanis' },
  { code: 'LHU_DS-CD', label: '10. Direct Shear CD (DS-CD)', testCode: 'DS-CD', category: 'Mekanis' },
  { code: 'LHU_DS-CD RES.', label: '11. Direct Shear CD Residual', testCode: 'DS-CD-RES', category: 'Mekanis' },
  { code: 'LHU_TRX-UU', label: '12. Triaxial Compression UU', testCode: 'TRX-UU', category: 'Mekanis' },
  { code: 'LHU_TRX-CU-Multi', label: '13. Triaxial CU Multi Specimen', testCode: 'TRX-CU', category: 'Mekanis' },
  { code: 'LHU_TRX-CU-Normal', label: '14. Triaxial CU Normal Specimen', testCode: 'TRX-CU', category: 'Mekanis' },
  { code: 'LHU_TRX-CD', label: '15. Triaxial CD (TRX-CD)', testCode: 'TRX-CD', category: 'Mekanis' },
  { code: 'LHU_CBR Unsoaked', label: '16. CBR Lab Unsoaked', testCode: 'CBR-UNS', category: 'Pemadatan' },
  { code: 'Template LHU_CBRsoaked', label: '17. CBR Lab Soaked', testCode: 'CBR-SOK', category: 'Pemadatan' }
];

export function getAssignedLHUSheets(sample: Sample): { code: LHUSheetCode; label: string; testCode: string; category: string }[] {
  const assignedCodes = (sample.tests || []).map(t => {
    const raw = t.testTypeCode || t.testTypeId || '';
    if (raw.toUpperCase().startsWith('TT-')) return raw.toUpperCase().slice(3);
    if (raw.toUpperCase() === 'ATT') return 'ATB';
    if (raw.toUpperCase() === 'S&H' || raw.toUpperCase() === 'SVE') return 'SVE-HYD';
    if (raw.toUpperCase() === 'PRM' || raw.toUpperCase() === 'PERM') return 'PB';
    if (raw.toUpperCase() === 'CNS' || raw.toUpperCase() === 'CONSOL') return 'CT';
    if (raw.toUpperCase() === 'DSH' || raw.toUpperCase() === 'DS') return 'DS-UU';
    return raw.toUpperCase();
  });

  const matched = ALL_LHU_CATALOGUE.filter(item => {
    if (item.code === 'LHU_PP') return true;
    if (item.code === 'LHU_ATB') return assignedCodes.includes('ATB');
    if (item.code === 'LHU_Sieve & Hidro') return assignedCodes.includes('SVE-HYD');
    if (item.code === 'LHU_standard proctor') return assignedCodes.includes('CMP-STD') || assignedCodes.includes('CMP');
    if (item.code === 'LHU_modified proctor') return assignedCodes.includes('CMP-MOD');
    if (item.code === 'LHU PFH') return assignedCodes.includes('PB') || assignedCodes.includes('PRM');
    if (item.code === 'LHU_Konsolidasi') return assignedCodes.includes('CT');
    if (item.code === 'LHU_UCT') return assignedCodes.includes('UCT');
    if (item.code === 'LHU_DS-UU') return assignedCodes.includes('DS-UU');
    if (item.code === 'LHU_DS-CD') return assignedCodes.includes('DS-CD');
    if (item.code === 'LHU_DS-CD RES.') return assignedCodes.includes('DS-CD-RES');
    if (item.code === 'LHU_TRX-UU') return assignedCodes.includes('TRX-UU');
    if (item.code === 'LHU_TRX-CU-Multi' || item.code === 'LHU_TRX-CU-Normal') return assignedCodes.includes('TRX-CU');
    if (item.code === 'LHU_TRX-CD') return assignedCodes.includes('TRX-CD');
    if (item.code === 'LHU_CBR Unsoaked') return assignedCodes.includes('CBR-UNS') || assignedCodes.includes('CBR');
    if (item.code === 'Template LHU_CBRsoaked') return assignedCodes.includes('CBR-SOK');
    return false;
  });

  return matched;
}

export const LHUReportModal: React.FC<LHUReportModalProps> = ({
  sample,
  po,
  personnelList,
  initialSelectedCodes,
  onClose
}) => {
  const availableSheets = getAssignedLHUSheets(sample);
  
  const [selectedCodes, setSelectedCodes] = useState<LHUSheetCode[]>(() => {
    if (initialSelectedCodes && initialSelectedCodes.length > 0) {
      return initialSelectedCodes;
    }
    return availableSheets.map(s => s.code);
  });

  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState<number>(po.decimalPlaces ?? 3);
  const [zoomLevel, setZoomLevel] = useState<number>(1.30);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1.30);

  const handleToggleDecimal = (digits: 2 | 3) => {
    po.decimalPlaces = digits;
    setDecimalPlaces(digits);
  };

  const handleToggleSheetCode = (code: LHUSheetCode) => {
    setSelectedCodes(prev => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleSelectAll = () => {
    setSelectedCodes(availableSheets.map(s => s.code));
  };

  const handleSelectOnly = (code: LHUSheetCode) => {
    setSelectedCodes([code]);
  };

  const activeSheets = availableSheets.filter(s => selectedCodes.includes(s.code));

  const handlePrintPDF = () => {
    if (!printRef.current) return;
    setIsPrinting(true);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      setIsPrinting(false);
      return;
    }

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const rawContentHtml = printRef.current.innerHTML;
    // Strip any screen zoom inline styles that scale up the paper size!
    const cleanContentHtml = rawContentHtml
      .replace(/zoom:\s*[^;"]+;?/gi, '')
      .replace(/transform:\s*scale\([^)]+\);?/gi, '');

    const sampleLabel = `${sample.sampleCode || 'LHU'}_${sample.idLab || ''}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>LHU - ${sampleLabel}</title>
  ${stylesheets}
  <style>
    * { box-sizing: border-box !important; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      color: black !important;
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100% !important;
    }
    .print\\:hidden { display: none !important; }
    .lhu-sheet-wrapper {
      display: block !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      zoom: 1 !important;
      transform: none !important;
    }
    .lhu-a4-page-outer {
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
      width: 100% !important;
      display: block !important;
    }
    .lhu-a4-page {
      width: 200mm !important;
      max-width: 200mm !important;
      height: 287mm !important;
      max-height: 287mm !important;
      padding: 4mm 5mm !important;
      margin: 0 auto !important;
      background: white !important;
      color: black !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      zoom: 1 !important;
      transform: none !important;
    }
    @page {
      size: A4 portrait;
      margin: 0.5cm;
    }
  </style>
</head>
<body>
  ${cleanContentHtml}
</body>
</html>`);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe error:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
          setIsPrinting(false);
        }, 1000);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-slate-600/40 backdrop-blur-md z-50 overflow-y-auto p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="relative flex justify-center items-start gap-4 max-w-full mx-auto print:block">
        
        {/* PURE A4 SHEET PAPER CONTAINER */}
        <div ref={printRef} className="space-y-6 print:space-y-0 print:bg-white print:p-0 print:overflow-visible">
          {activeSheets.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-2 bg-white/90 p-8 rounded-2xl border border-slate-200 shadow-xl">
              <FileText className="w-12 h-12 mx-auto text-slate-400" />
              <p className="font-bold text-sm">Tidak ada lembar LHU yang dipilih.</p>
              <p className="text-xs text-slate-400">Silakan centang pengujian untuk menampilkan lembar LHU.</p>
            </div>
          ) : (
            activeSheets.map((item, idx) => {
              const boundData = bindLHUData(item.code, sample, po, personnelList);
              boundData.header.currentPage = idx + 1;
              boundData.header.totalPages = activeSheets.length;

              return (
                <div
                  key={item.code}
                  className="lhu-sheet-wrapper origin-top mb-16 print:scale-100 print:m-0 print:page-break-after-always transition-transform duration-150"
                  style={{ zoom: zoomLevel }}
                >
                  <LHUViewRenderer sheetCode={item.code} boundData={boundData} />
                </div>
              );
            })
          )}
        </div>

        {/* VERTICAL CONTROL DOCK PINNED DIRECTLY NEXT TO THE PAPER */}
        <div className="sticky top-6 z-50 flex flex-col items-center gap-3 bg-white/95 backdrop-blur-xl border border-slate-200/90 text-slate-800 p-3 rounded-2xl shadow-xl print:hidden w-20 shrink-0">
          
          {/* CLOSE BUTTON */}
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Tutup Modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-px bg-slate-200" />

          {/* PRINT / DOWNLOAD PDF BUTTON */}
          <button
            onClick={handlePrintPDF}
            disabled={isPrinting}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer group"
            title="Cetak / Download PDF"
          >
            {isPrinting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
          </button>

          <div className="w-12 h-px bg-slate-200" />

          {/* ZOOM CONTROLLER (VERTICAL) */}
          <div className="flex flex-col items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/90 w-full">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Zoom In (+15%)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="text-[10.5px] font-black text-slate-700 hover:text-emerald-700 py-1 font-mono cursor-pointer select-none"
              title="Reset Zoom (130%)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition cursor-pointer"
              title="Zoom Out (-15%)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <div className="w-12 h-px bg-slate-200" />

          {/* PRECISION TOGGLE (VERTICAL) */}
          <div className="flex flex-col items-center gap-1.5 bg-slate-100/90 p-2 rounded-xl border border-slate-200/90 w-full text-center">
            <span className="text-[9.5px] font-black text-slate-500 tracking-wide select-none">Desimal</span>
            <button
              onClick={() => handleToggleDecimal(2)}
              className={`w-full h-7 rounded-lg text-[10.5px] font-mono font-black transition cursor-pointer flex items-center justify-center ${
                (po.decimalPlaces ?? 3) === 2
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80'
              }`}
              title="Presisi 2 Desimal (.00)"
            >
              .00
            </button>
            <button
              onClick={() => handleToggleDecimal(3)}
              className={`w-full h-7 rounded-lg text-[10.5px] font-mono font-black transition cursor-pointer flex items-center justify-center ${
                (po.decimalPlaces ?? 3) === 3
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80'
              }`}
              title="Presisi 3 Desimal (.000)"
            >
              .000
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
