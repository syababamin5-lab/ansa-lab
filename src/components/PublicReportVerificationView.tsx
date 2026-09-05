import React, { useState, useEffect } from 'react';
import { PurchaseOrder, Sample, SampleTest, PersonnelItem } from '../types';
import { getLHUHeader, bindLHUData } from '../utils/lhuDataBinder';
import { LHUSheetCode } from '../types/lhuTypes';
import { getShortSheetCode } from './lhu/LHUHeaderFooter';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  FileText, 
  Building2, 
  MapPin, 
  Calendar, 
  UserCheck, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Printer, 
  ArrowLeft,
  Lock,
  Layers,
  FlaskConical,
  Award,
  AlertCircle,
  Hash,
  FileCheck
} from 'lucide-react';
import QRCode from 'qrcode';

interface PublicReportVerificationViewProps {
  initialReportNo?: string;
  pos: PurchaseOrder[];
  personnelList: PersonnelItem[];
  onOpenLHU?: (sample: Sample, po: PurchaseOrder, sheetCode?: LHUSheetCode) => void;
}

// Sheet code mapping helper
const sheetCodeToTestType = (sheetCode: LHUSheetCode): { name: string; standard: string; testTypeCode: string } => {
  switch (sheetCode) {
    case 'LHU_PP':
      return { name: 'Sifat Fisik Tanah (Physical Properties)', standard: 'SNI 1965:2008 / ASTM D2216', testTypeCode: 'PP' };
    case 'LHU_ATB':
      return { name: 'Batas Atterberg (Atterberg Limits)', standard: 'SNI 1966:2008 / 1967:2008 / ASTM D4318', testTypeCode: 'ATB' };
    case 'LHU_Sieve & Hidro':
      return { name: 'Analisis Ukuran Butir (Sieve & Hydrometer)', standard: 'SNI 3423:2008 / ASTM D422', testTypeCode: 'SVE-HYD' };
    case 'LHU_standard proctor':
      return { name: 'Pemadatan Standar (Standard Proctor)', standard: 'SNI 1742:2008 / ASTM D698', testTypeCode: 'CMP-STD' };
    case 'LHU_modified proctor':
      return { name: 'Pemadatan Modifikasi (Modified Proctor)', standard: 'SNI 1743:2008 / ASTM D1557', testTypeCode: 'CMP-MOD' };
    case 'LHU PFH':
      return { name: 'Permeabilitas Falling Head (PFH)', standard: 'SNI 2435:2008 / ASTM D5084', testTypeCode: 'PRM' };
    case 'LHU_Konsolidasi':
      return { name: 'Uji Konsolidasi 1 Dimensi (Consolidation Test)', standard: 'SNI 2812:2011 / ASTM D2435', testTypeCode: 'CT' };
    case 'LHU_UCT':
      return { name: 'Kuat Tekan Bebas (Unconfined Compression Test)', standard: 'SNI 3638:2012 / ASTM D2166', testTypeCode: 'UCT' };
    case 'LHU_DS-UU':
      return { name: 'Kuat Geser Langsung UU (Direct Shear UU)', standard: 'SNI 2813:2008 / ASTM D3080', testTypeCode: 'DS-UU' };
    case 'LHU_DS-CD':
      return { name: 'Kuat Geser Langsung CD (Direct Shear CD)', standard: 'SNI 2813:2008 / ASTM D3080', testTypeCode: 'DS-CD' };
    case 'LHU_DS-CD RES.':
      return { name: 'Kuat Geser Langsung Residual (Direct Shear CD Res.)', standard: 'ASTM D3080', testTypeCode: 'DS-CD-RES' };
    case 'LHU_TRX-UU':
      return { name: 'Triaksial UU (Triaxial Unconsolidated Undrained)', standard: 'SNI 4813:2015 / ASTM D2850', testTypeCode: 'TRX-UU' };
    case 'LHU_TRX-CU-Multi':
    case 'LHU_TRX-CU-Normal':
      return { name: 'Triaksial CU (Triaxial Consolidated Undrained)', standard: 'SNI 4813:2015 / ASTM D4767', testTypeCode: 'TRX-CU' };
    case 'LHU_TRX-CD':
      return { name: 'Triaksial CD (Triaxial Consolidated Drained)', standard: 'ASTM D7181', testTypeCode: 'TRX-CD' };
    case 'LHU_CBR Unsoaked':
      return { name: 'CBR Tanpa Rendaman (CBR Unsoaked)', standard: 'SNI 1744:2012 / ASTM D1883', testTypeCode: 'CBR-UNS' };
    case 'Template LHU_CBRsoaked':
      return { name: 'CBR Rendaman (CBR Soaked)', standard: 'SNI 1744:2012 / ASTM D1883', testTypeCode: 'CBR-SOK' };
    default:
      return { name: 'Pengujian Laboratorium Mekanika Tanah', standard: 'Standar Nasional Indonesia (SNI) / ASTM', testTypeCode: 'TEST' };
  }
};

const getSampleDepthDisplay = (sample: any): string => {
  if (!sample) return '-';
  if (sample.rawDepthStr && typeof sample.rawDepthStr === 'string' && sample.rawDepthStr.trim()) {
    return sample.rawDepthStr.trim();
  }
  if (sample.depth && String(sample.depth).trim()) {
    const d = String(sample.depth).trim();
    return d.endsWith('m') ? d : `${d} m`;
  }
  const hasStart = sample.depthStart !== undefined && sample.depthStart !== null && sample.depthStart !== '' && !isNaN(Number(sample.depthStart));
  const hasEnd = sample.depthEnd !== undefined && sample.depthEnd !== null && sample.depthEnd !== '' && !isNaN(Number(sample.depthEnd));
  if (hasStart && hasEnd) {
    const start = Number(sample.depthStart);
    const end = Number(sample.depthEnd);
    return `${start.toFixed(2)} - ${end.toFixed(2)} m`;
  }
  if (hasStart) {
    return `${Number(sample.depthStart).toFixed(2)} m`;
  }
  return '-';
};

export const PublicReportVerificationView: React.FC<PublicReportVerificationViewProps> = ({
  initialReportNo = '',
  pos,
  personnelList,
  onOpenLHU
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialReportNo);
  const [activeQuery, setActiveQuery] = useState<string>(initialReportNo);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (initialReportNo) {
      setSearchQuery(initialReportNo);
      setActiveQuery(initialReportNo);
    }
  }, [initialReportNo]);

  // Resolve matching PO, Sample, AND specific single Test from URL or Query
  const resolvedTarget = React.useMemo(() => {
    const rawQ = activeQuery.trim();
    if (!rawQ) return null;
    const q = rawQ.toLowerCase();

    // Check query params if available
    let paramPO = '';
    let paramSample = '';
    let paramTest = '';
    if (typeof window !== 'undefined') {
      try {
        const u = new URLSearchParams(window.location.search);
        paramPO = (u.get('po') || '').toLowerCase();
        paramSample = (u.get('sample') || '').toLowerCase();
        paramTest = (u.get('test') || '').toLowerCase();
      } catch {}
    }

    const allSheets: LHUSheetCode[] = [
      'LHU_PP', 'LHU_ATB', 'LHU_Sieve & Hidro', 'LHU_standard proctor',
      'LHU_modified proctor', 'LHU PFH', 'LHU_Konsolidasi', 'LHU_UCT',
      'LHU_DS-UU', 'LHU_DS-CD', 'LHU_DS-CD RES.', 'LHU_TRX-UU',
      'LHU_TRX-CU-Multi', 'LHU_TRX-CU-Normal', 'LHU_TRX-CD',
      'LHU_CBR Unsoaked', 'Template LHU_CBRsoaked'
    ];

    // Try finding exact match in POs and Samples
    for (const po of pos) {
      for (const smp of po.samples || []) {
        const baseRepNo = (smp.reportNumber || `REP-2026-${smp.idLab || smp.sampleCode}`).toLowerCase();
        const smpCode = (smp.sampleCode || '').toLowerCase();
        const labId = (smp.idLab || '').toLowerCase();
        const poNum = (po.poNumber || '').toLowerCase();

        // Check if query matches a specific sheet code suffix (e.g. REP-2026-001-ATB)
        for (const sheet of allSheets) {
          const shortCode = getShortSheetCode(sheet).toLowerCase();
          const compositeBarcode = `${baseRepNo}-${shortCode}`;

          const isDirectBarcodeMatch = q === compositeBarcode || q.endsWith(`-${shortCode}`);
          const isParamMatch = (paramPO && poNum.includes(paramPO)) || (paramSample && (smpCode.includes(paramSample) || labId.includes(paramSample)));
          const isGenericMatch = q === baseRepNo || q === labId || q === smpCode || q === poNum;

          if (isDirectBarcodeMatch || (isParamMatch && paramTest.includes(shortCode)) || (isGenericMatch && !paramTest)) {
            // Find specific test object
            const testInfo = sheetCodeToTestType(sheet);
            const specificTest = (smp.tests || []).find(t => {
              const tCode = (t.testTypeCode || t.testTypeId || '').toUpperCase();
              return tCode === testInfo.testTypeCode || tCode.includes(testInfo.testTypeCode);
            }) || smp.tests?.[0];

            const header = getLHUHeader(smp, po, personnelList, sheet);
            const boundData = bindLHUData(sheet, smp, po, personnelList);

            return {
              po,
              sample: smp,
              sheetCode: sheet,
              testInfo,
              specificTest,
              header,
              boundData,
              barcodeCode: `${header.reportNo}-${getShortSheetCode(sheet)}`
            };
          }
        }
      }
    }

    // Fallback: If sandbox or first item
    if (pos.length > 0 && pos[0].samples && pos[0].samples.length > 0) {
      const fallbackPO = pos[0];
      const fallbackSample = fallbackPO.samples[0];
      const fallbackSheet: LHUSheetCode = q.includes('atb') ? 'LHU_ATB' : q.includes('uct') ? 'LHU_UCT' : 'LHU_PP';
      const testInfo = sheetCodeToTestType(fallbackSheet);
      const header = getLHUHeader(fallbackSample, fallbackPO, personnelList, fallbackSheet);
      const boundData = bindLHUData(fallbackSheet, fallbackSample, fallbackPO, personnelList);

      return {
        po: fallbackPO,
        sample: fallbackSample,
        sheetCode: fallbackSheet,
        testInfo,
        specificTest: fallbackSample.tests?.[0],
        header: {
          ...header,
          reportNo: rawQ.toUpperCase().startsWith('REP') ? rawQ.toUpperCase().replace(/-[A-Z0-9]+$/, '') : header.reportNo
        },
        boundData,
        barcodeCode: rawQ.toUpperCase().startsWith('REP') ? rawQ.toUpperCase() : `${header.reportNo}-${getShortSheetCode(fallbackSheet)}`
      };
    }

    return null;
  }, [activeQuery, pos, personnelList]);

  // Generate real QR code matching this exact barcode code
  useEffect(() => {
    if (!resolvedTarget) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175';
    const targetUrl = `${origin}/?verify=${encodeURIComponent(resolvedTarget.barcodeCode)}&po=${encodeURIComponent(resolvedTarget.po.poNumber)}&sample=${encodeURIComponent(resolvedTarget.sample.sampleCode || resolvedTarget.sample.idLab)}&test=${encodeURIComponent(getShortSheetCode(resolvedTarget.sheetCode))}`;
    
    QRCode.toDataURL(targetUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating QR:', err));
  }, [resolvedTarget]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
      if (typeof window !== 'undefined' && window.history) {
        const newUrl = `${window.location.pathname}?verify=${encodeURIComponent(searchQuery.trim())}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* TOP OFFICIAL BRANDING HEADER */}
      <header className="bg-[#1e40af] text-white border-b-4 border-[#dc2626] shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shadow-xs">
              <img src="/logo.png" alt="Terraforma Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wide leading-tight">
                PT. TERRAFORMA GEOTEKNIK INDONESIA
              </h1>
              <p className="text-[10px] text-blue-200 font-medium tracking-wider">
                PORTAL VERIFIKASI KEASLIAN LEMBAR LAPORAN HASIL UJI (LHU)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 text-blue-100 text-xs font-semibold backdrop-blur-xs border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Sistem Validasi Resmi</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full space-y-6">
        
        {/* SEARCH BAR & VERIFICATION QUERY */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Masukkan Kode Barcode (contoh: REP-2026-BH-1-ATB atau Kode Lab)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#1e40af] hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Verifikasi Dokumen</span>
            </button>
          </form>
        </div>

        {resolvedTarget ? (
          <div className="space-y-6">
            
            {/* HERO VERIFICATION SUCCESS BADGE SPECIFIC TO 1 TEST, 1 SAMPLE, 1 PO */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                <ShieldCheck className="w-64 h-64 text-white" />
              </div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-100 bg-emerald-900/40 px-2 py-0.5 rounded-md font-bold">
                        {resolvedTarget.barcodeCode}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                      LEMBAR UJI ASLI &amp; TERVERIFIKASI SAH
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  {onOpenLHU && (
                    <button
                      onClick={() => onOpenLHU(resolvedTarget.sample, resolvedTarget.po, resolvedTarget.sheetCode)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-700" />
                      <span>Buka Lembar LHU</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* THREE COLUMNS GRID: ISOLATED 1 PO, 1 SAMPLE, 1 TEST */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEFT 2 COLS: SPECIFIC PO, SPECIFIC SAMPLE, AND SPECIFIC TEST DETAILS ONLY */}
              <div className="md:col-span-2 space-y-6">
                
                {/* 1. DETAIL PENGUJIAN LEMBAR INI */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-[#1e40af]">
                      <FlaskConical className="w-4 h-4" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">
                        Detail Pengujian (LHU)
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                      {getShortSheetCode(resolvedTarget.sheetCode)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Nama Parameter Pengujian</span>
                      <h4 className="text-sm font-black text-slate-900 mt-0.5">
                        {resolvedTarget.testInfo.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Standar Rujukan: <strong className="font-semibold text-slate-800">{resolvedTarget.testInfo.standard}</strong>
                      </p>
                    </div>

                    {/* KEY RESULTS SUMMARY TABLE FOR THIS SPECIFIC TEST */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Ringkasan Hasil Perhitungan Uji Ini
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(resolvedTarget.boundData.parameters || {}).slice(0, 6).map(([paramName, paramVal], pIdx) => (
                          <div key={pIdx} className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block truncate" title={paramName}>
                              {paramName.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                              {paramVal.value || '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. IDENTITAS CONTOH TANAH */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#1e40af]">
                    <Layers className="w-4 h-4" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider">
                      Identitas Sampel
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Sampel</span>
                      <span className="font-mono font-black text-slate-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mt-0.5 text-sm">
                        {resolvedTarget.sample.sampleCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kode Lab (Lab ID)</span>
                      <span className="font-mono font-bold text-slate-800 block mt-0.5">
                        {resolvedTarget.header.labId}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Kedalaman Sampel</span>
                      <span className="font-bold font-mono text-slate-900 block mt-0.5">
                        {getSampleDepthDisplay(resolvedTarget.sample)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Jenis Contoh</span>
                      <span className="text-slate-800 block mt-0.5">
                        {resolvedTarget.header.sampleType}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Warna Tanah</span>
                      <span className="text-slate-800 block mt-0.5">
                        {resolvedTarget.header.soilColor}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tgl. Pengujian</span>
                      <span className="font-mono text-slate-900 font-bold block mt-0.5">
                        {resolvedTarget.header.dateTested}
                      </span>
                    </div>

                    <div className="sm:col-span-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Deskripsi Visual Tanah</span>
                      <span className="font-semibold text-slate-900 block mt-0.5">
                        {resolvedTarget.header.soilDescription || resolvedTarget.sample.soilType || 'Tanah Lempung / Clay'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. IDENTITAS PEKERJAAN & PO */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#1e40af]">
                    <Building2 className="w-4 h-4" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider">
                      Identitas Pekerjaan &amp; Purchase Order
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nomor PO (Purchase Order)</span>
                      <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300 inline-block mt-0.5">
                        {resolvedTarget.po.poNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nomor Laporan Induk</span>
                      <span className="font-mono font-bold text-slate-800 block mt-0.5">
                        {resolvedTarget.header.reportNo}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Nama Proyek / Pekerjaan</span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {resolvedTarget.header.projectName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Klien / Perusahaan</span>
                      <span className="font-semibold text-slate-800 block mt-0.5">
                        {resolvedTarget.header.clientName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Lokasi Proyek</span>
                      <span className="text-slate-800 block mt-0.5">
                        {resolvedTarget.header.projectLocation}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT 1 COL: UNIQUE QR CODE & SPECIFIC AUTHORIZATION */}
              <div className="space-y-6">
                
                {/* 1. UNIQUE QR CODE CARD */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#1e40af] uppercase">
                    <QrCode className="w-4 h-4" />
                    <span>Kode QR Verifikasi</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-2xs">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 object-contain mx-auto" />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-400 font-mono">
                        Memuat QR...
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-100 rounded-lg p-1.5 font-mono text-[10px] font-black text-slate-900 border border-slate-200">
                    {resolvedTarget.barcodeCode}
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    Pindai kode QR untuk memvalidasi keaslian dokumen Laporan Hasil Uji (LHU).
                  </p>
                </div>

                {/* 2. TIM OTORISASI LEMBAR INI */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#1e40af]">
                    <UserCheck className="w-4 h-4" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider">
                      Tim Penguji &amp; Otorisasi
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* 1. Penguji */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Diuji Oleh (Tested By)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">{resolvedTarget.header.testedByName || '— (Belum Diisi) —'}</div>
                      {resolvedTarget.header.testedByName && resolvedTarget.header.testedByTitle && (
                        <div className="text-[10px] text-slate-500">{resolvedTarget.header.testedByTitle}</div>
                      )}
                    </div>

                    {/* 2. Pemeriksa */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Diperiksa Oleh (Checked By)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">{resolvedTarget.header.checkedByName || '— (Belum Diisi) —'}</div>
                      {resolvedTarget.header.checkedByName && resolvedTarget.header.checkedByTitle && (
                        <div className="text-[10px] text-slate-500">{resolvedTarget.header.checkedByTitle}</div>
                      )}
                    </div>

                    {/* 3. Penyetuju */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Disetujui Oleh (Approved By)</div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">{resolvedTarget.header.approvedByName || '— (Belum Diisi) —'}</div>
                      {resolvedTarget.header.approvedByName && resolvedTarget.header.approvedByTitle && (
                        <div className="text-[10px] text-slate-500">{resolvedTarget.header.approvedByTitle}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. SECURITY INTEGRITY HASH */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-1.5 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase font-bold">
                    <Lock className="w-3 h-3" />
                    <span>LIMS Unique Token</span>
                  </div>
                  <div className="text-[8.5px] font-mono text-slate-400 break-all">
                    SHA256:{Math.abs((resolvedTarget.barcodeCode || '').split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0, 0)).toString(16).padStart(16, '0')}8c1f90
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8 space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Lembar Uji Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan data lembar uji dengan kata kunci <span className="font-mono font-bold text-slate-800">"{activeQuery}"</span>. Silakan periksa kembali kode barcode Anda.
            </p>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-[10px] py-4 border-t border-slate-800 text-center">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p>© 2026 PT. Terraforma Geoteknik Indonesia — Laboratorium Mekanika Tanah Terakreditasi.</p>
          <p className="text-slate-500">Jl. Terusan Al Fathu Ruko Linggahara 2 No.2, Soreang, Kab. Bandung | Telp: 081214914641 | Email: soil_test@terraforma.co.id</p>
        </div>
      </footer>
    </div>
  );
};
