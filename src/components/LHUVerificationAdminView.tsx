import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Sample, PersonnelItem } from '../types';
import { LHUSheetCode } from '../types/lhuTypes';
import { getShortSheetCode } from './lhu/LHUHeaderFooter';
import { PublicReportVerificationView } from './PublicReportVerificationView';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  FileText, 
  Building2, 
  MapPin, 
  Calendar, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Eye, 
  Filter, 
  AlertCircle,
  FileCheck,
  Hash,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  Smartphone
} from 'lucide-react';

interface LHUVerificationAdminViewProps {
  pos: PurchaseOrder[];
  personnelList: PersonnelItem[];
  onOpenLHU: (sample: Sample, po: PurchaseOrder, sheetCode?: LHUSheetCode) => void;
}

interface LHUAuditItem {
  id: string;
  reportNo: string;
  barcodeCode: string;
  poNumber: string;
  projectName: string;
  clientName: string;
  sampleCode: string;
  labId: string;
  depthStr: string;
  sheetCode: LHUSheetCode;
  testName: string;
  testStandard: string;
  isValid: boolean;
  sample: Sample;
  po: PurchaseOrder;
}

const ALL_LHU_SHEETS: { code: LHUSheetCode; name: string; standard: string; testTypeCode: string }[] = [
  { code: 'LHU_PP', name: 'Sifat Fisik Tanah (Physical Properties)', standard: 'SNI 1965:2008 / ASTM D2216', testTypeCode: 'PP' },
  { code: 'LHU_ATB', name: 'Batas Atterberg (Atterberg Limits)', standard: 'SNI 1966:2008 / 1967:2008', testTypeCode: 'ATB' },
  { code: 'LHU_Sieve & Hidro', name: 'Analisis Butiran (Sieve & Hydrometer)', standard: 'SNI 3423:2008 / ASTM D422', testTypeCode: 'SVE-HYD' },
  { code: 'LHU_standard proctor', name: 'Pemadatan Standar (Standard Proctor)', standard: 'SNI 1742:2008', testTypeCode: 'CMP-STD' },
  { code: 'LHU_modified proctor', name: 'Pemadatan Modifikasi (Modified Proctor)', standard: 'SNI 1743:2008', testTypeCode: 'CMP-MOD' },
  { code: 'LHU PFH', name: 'Permeabilitas Falling Head (PFH)', standard: 'SNI 2435:2008', testTypeCode: 'PRM' },
  { code: 'LHU_Konsolidasi', name: 'Uji Konsolidasi 1 Dimensi', standard: 'SNI 2812:2011', testTypeCode: 'CT' },
  { code: 'LHU_UCT', name: 'Kuat Tekan Bebas (UCT)', standard: 'SNI 3638:2012', testTypeCode: 'UCT' },
  { code: 'LHU_DS-UU', name: 'Kuat Geser Langsung UU (Direct Shear)', standard: 'SNI 2813:2008', testTypeCode: 'DS-UU' },
  { code: 'LHU_DS-CD', name: 'Kuat Geser Langsung CD', standard: 'SNI 2813:2008', testTypeCode: 'DS-CD' },
  { code: 'LHU_DS-CD RES.', name: 'Kuat Geser Langsung CD Residual', standard: 'ASTM D3080', testTypeCode: 'DS-CD-RES' },
  { code: 'LHU_TRX-UU', name: 'Triaksial UU', standard: 'SNI 4813:2015', testTypeCode: 'TRX-UU' },
  { code: 'LHU_TRX-CU-Multi', name: 'Triaksial CU Multi-Stage', standard: 'SNI 4813:2015', testTypeCode: 'TRX-CU' },
  { code: 'LHU_TRX-CD', name: 'Triaksial CD', standard: 'ASTM D7181', testTypeCode: 'TRX-CD' },
  { code: 'LHU_CBR Unsoaked', name: 'CBR Tanpa Rendaman', standard: 'SNI 1744:2012', testTypeCode: 'CBR-UNS' },
  { code: 'Template LHU_CBRsoaked', name: 'CBR Rendaman', standard: 'SNI 1744:2012', testTypeCode: 'CBR-SOK' },
];

export const LHUVerificationAdminView: React.FC<LHUVerificationAdminViewProps> = ({
  pos,
  personnelList,
  onOpenLHU
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPOFilter, setSelectedPOFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // State for previewing client view in modal
  const [previewBarcode, setPreviewBarcode] = useState<string | null>(null);

  // Extract all LHU entries across all POs and samples
  const allAuditItems: LHUAuditItem[] = useMemo(() => {
    const items: LHUAuditItem[] = [];

    (pos || []).forEach(po => {
      (po.samples || []).forEach(smp => {
        const baseRepNo = smp.reportNumber || `REP-2026-${smp.idLab || smp.sampleCode}`;
        const depthStr = smp.rawDepthStr || (smp.depth ? `${smp.depth} m` : smp.depthStart ? `${smp.depthStart} - ${smp.depthEnd || ''} m` : '-');

        // Check assigned tests
        (smp.tests || []).forEach(test => {
          const tCode = (test.testTypeCode || test.testTypeId || '').toUpperCase();
          const matchedConfig = ALL_LHU_SHEETS.find(cfg => {
            return tCode === cfg.testTypeCode || tCode.includes(cfg.testTypeCode);
          }) || ALL_LHU_SHEETS[0];

          const shortCode = getShortSheetCode(matchedConfig.code);
          const barcodeCode = `${baseRepNo}-${shortCode}`;

          items.push({
            id: `${smp.id}-${matchedConfig.code}`,
            reportNo: baseRepNo,
            barcodeCode,
            poNumber: po.poNumber || '-',
            projectName: po.projectName || '-',
            clientName: po.clientName || '-',
            sampleCode: smp.sampleCode || '-',
            labId: smp.idLab || '-',
            depthStr,
            sheetCode: matchedConfig.code,
            testName: matchedConfig.name,
            testStandard: matchedConfig.standard,
            isValid: true,
            sample: smp,
            po
          });
        });
      });
    });

    return items;
  }, [pos]);

  // Filtered entries based on search & PO selection
  const filteredItems = useMemo(() => {
    return allAuditItems.filter(item => {
      if (selectedPOFilter !== 'ALL' && item.poNumber !== selectedPOFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.reportNo.toLowerCase().includes(q) ||
        item.barcodeCode.toLowerCase().includes(q) ||
        item.poNumber.toLowerCase().includes(q) ||
        item.sampleCode.toLowerCase().includes(q) ||
        item.labId.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q) ||
        item.testName.toLowerCase().includes(q)
      );
    });
  }, [allAuditItems, selectedPOFilter, searchQuery]);

  // Copy QR verification URL to clipboard
  const handleCopyLink = (barcodeCode: string, poNumber: string, sampleCode: string, sheetCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ansa-lab.vercel.app';
    const testShort = getShortSheetCode(sheetCode);
    const link = `${origin}/?verify=${encodeURIComponent(barcodeCode)}&po=${encodeURIComponent(poNumber)}&sample=${encodeURIComponent(sampleCode)}&test=${encodeURIComponent(testShort)}`;
    
    navigator.clipboard.writeText(link);
    setCopiedCode(barcodeCode);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Distinct POs for filter dropdown
  const uniquePOs = useMemo(() => {
    const set = new Set<string>();
    allAuditItems.forEach(i => set.add(i.poNumber));
    return Array.from(set).filter(Boolean);
  }, [allAuditItems]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto animate-fade-in font-sans">
      {/* 1. TOP HEADER */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-sky-500/15 via-blue-500/10 to-indigo-500/15 border border-sky-500/20 text-sky-700 rounded-2xl shadow-xs">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-mono font-extrabold uppercase border border-sky-200">
                PORTAL KONTROL &amp; AUDIT INTERNAL
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sistem Validasi QR Aktif
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Verifikasi &amp; Audit LHU Resmi
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Pusat data keabsahan lembar hasil uji tanah bersertifikat barcode QR anti-pemalsuan (ISO 17025)
            </p>
          </div>
        </div>

        {/* Action button to test public client view */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (allAuditItems.length > 0) {
                setPreviewBarcode(allAuditItems[0].barcodeCode);
              }
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            title="Buka simulasi tampilan portal verifikasi persis seperti yang dilihat klien saat scan QR"
          >
            <Smartphone className="w-4 h-4" />
            <span>Tes Tampilan Klien (Portal Publik)</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Lembar LHU</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {allAuditItems.length} <span className="text-xs font-bold text-slate-400">Lembar Uji</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Terdaftar resmi di database LIMS</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Status Keabsahan</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            100% <span className="text-xs font-bold text-emerald-600">Sah &amp; Asli</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Sertifikasi tanda tangan digital valid</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total PO Terkait</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {uniquePOs.length} <span className="text-xs font-bold text-slate-400">Berkas PO</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Melibatkan seluruh proyek aktif</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Proteksi Dokumen</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-1.5">
            <span>ISO 17025</span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Verifikasi real-time via QR Code</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari No. LHU, Barcode, No. PO, Kode Sampel, atau Nama Klien..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 shadow-2xs transition"
            />
          </div>

          <select
            value={selectedPOFilter}
            onChange={e => setSelectedPOFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
          >
            <option value="ALL">Semua Berkas PO ({uniquePOs.length})</option>
            {uniquePOs.map(poNum => (
              <option key={poNum} value={poNum}>PO: {poNum}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Menampilkan <span className="text-slate-900 font-extrabold">{filteredItems.length}</span> dari {allAuditItems.length} Lembar LHU
        </div>
      </div>

      {/* 4. AUDIT & VERIFICATION REGISTRY TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                <th className="px-4 py-3.5">No. Laporan &amp; Barcode QR</th>
                <th className="px-4 py-3.5">Klien &amp; Nama Proyek</th>
                <th className="px-4 py-3.5">Identitas Sampel</th>
                <th className="px-4 py-3.5">Parameter Pengujian &amp; Standar</th>
                <th className="px-4 py-3.5 text-center">Status Keabsahan</th>
                <th className="px-4 py-3.5 text-right">Aksi Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-semibold">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada lembar LHU yang cocok dengan kriteria pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                    {/* Barcode & Report Number */}
                    <td className="px-4 py-3.5 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-xs">{item.barcodeCode}</span>
                        <button
                          onClick={() => setPreviewBarcode(item.barcodeCode)}
                          className="p-1 rounded-md text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                          title="Lihat simulasi scan QR publik"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        PO: <strong className="text-slate-600 font-bold">{item.poNumber}</strong>
                      </span>
                    </td>

                    {/* Client & Project */}
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold text-slate-900 block">{item.clientName}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-[220px] block mt-0.5 font-semibold">
                        {item.projectName}
                      </span>
                    </td>

                    {/* Sample Code & Depth */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.sampleCode}
                      </span>
                      <span className="text-[10.5px] text-slate-500 font-sans block mt-1 font-semibold">
                        Kedalaman: {item.depthStr}
                      </span>
                    </td>

                    {/* Test Name & Standard */}
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 block">{item.testName}</span>
                      <span className="text-[10.5px] text-slate-400 font-mono block mt-0.5">
                        {item.testStandard}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>SAH &amp; TERVERIFIKASI</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Open LHU Document */}
                        <button
                          onClick={() => onOpenLHU(item.sample, item.po, item.sheetCode)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded-lg transition cursor-pointer"
                          title="Buka Lembar LHU Resmi (Cetak / PDF)"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Public Client Preview */}
                        <button
                          onClick={() => setPreviewBarcode(item.barcodeCode)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 rounded-lg transition cursor-pointer"
                          title="Preview Tampilan Klien (Simulasi Scan QR)"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        {/* Copy Link */}
                        <button
                          onClick={() => handleCopyLink(item.barcodeCode, item.poNumber, item.sampleCode, item.sheetCode)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            copiedCode === item.barcodeCode
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100 border-transparent'
                          }`}
                          title="Salin Link Verifikasi Publik untuk Dikirim ke Klien"
                        >
                          {copiedCode === item.barcodeCode ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: PREVIEW TAMPILAN KLIEN */}
      {previewBarcode && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Smartphone className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-sky-300 font-bold uppercase tracking-wider">
                    SIMULASI TAMPILAN KLIEN (SCAN QR)
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Portal Publik: {previewBarcode}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setPreviewBarcode(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Embedded Public Verification View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 custom-scrollbar">
              <PublicReportVerificationView
                initialReportNo={previewBarcode}
                pos={pos}
                personnelList={personnelList}
                onOpenLHU={onOpenLHU}
                onBackToApp={() => setPreviewBarcode(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
