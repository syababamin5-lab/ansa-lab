import React, { useState, useEffect } from 'react';
import { SubcontractNotice, SubcontractShippingLetter, SamplePrepReport, SubcontractItem, PersonnelItem } from '../../types/workflowTypes';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';
import { Building2, Plus, Printer, FileText, CheckCircle2, AlertTriangle, Send, X, ShieldCheck, FileCheck } from 'lucide-react';
import { getNextDocNo } from '../../utils/docNumbering';

interface SubcontractNoticeViewProps {
  notices: SubcontractNotice[];
  shippingLetters: SubcontractShippingLetter[];
  prepReports?: SamplePrepReport[];
  personnelCatalogue?: PersonnelItem[];
  companyProfile?: CompanyProfile;
  onSaveNotice: (notice: SubcontractNotice) => void;
  onSaveShippingLetter: (letter: SubcontractShippingLetter) => void;
}

export const SubcontractNoticeView: React.FC<SubcontractNoticeViewProps> = ({
  notices,
  shippingLetters,
  prepReports = [],
  personnelCatalogue = [],
  companyProfile = DEFAULT_COMPANY_PROFILE,
  onSaveNotice,
  onSaveShippingLetter
}) => {
  const [selectedNotice, setSelectedNotice] = useState<SubcontractNotice | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<SubcontractShippingLetter | null>(null);
  const [isPreviewNoticeModalOpen, setIsPreviewNoticeModalOpen] = useState(false);
  const [isPreviewLetterModalOpen, setIsPreviewLetterModalOpen] = useState(false);

  // ─── OTOMATIS SYNC SURAT KONFIRMASI SUBKONTRAK PER PO / BA PREPARASI ───────
  useEffect(() => {
    if (!prepReports || prepReports.length === 0) return;

    const TEST_NAME_MAP: Record<string, string> = {
      UW: 'Unit Weight (UW)',
      MC: 'Moisture Content (MC)',
      SG: 'Specific Gravity (SG)',
      BD: 'Bulk Density',
      ATB: 'Atterberg Limit (ATB)',
      SieveHydro: 'Sieve Analysis & Hydrometer',
      Proctor_Std: 'Compaction Standard Proctor',
      Proctor_Mod: 'Compaction Modified Proctor',
      Permeability: 'Permeability Test',
      Consolidation: 'Consolidation Test (CT)',
      UCT: 'Unconfined Compression Test (UCT)',
      DS_UU: 'Direct Shear UU',
      DS_CU: 'Direct Shear CU',
      DS_CD: 'Direct Shear CD',
      TRX_UU: 'Triaxial UU',
      TRX_CU: 'Triaxial CU',
      TRX_CD: 'Triaxial CD',
    };

    prepReports.forEach(report => {
      const subItems: SubcontractItem[] = [];

      (report.items || []).forEach(item => {
        const subTests: string[] = [];

        // 1. Cek testStatusDetails
        if (item.testStatusDetails) {
          Object.entries(item.testStatusDetails).forEach(([testKey, detail]) => {
            const st = String(detail?.status || '').toUpperCase();
            if (st === 'SUBCONTRACT' || st === 'SUB' || st.includes('SUB')) {
              subTests.push(TEST_NAME_MAP[testKey] || testKey);
            }
          });
        }

        // 2. Cek sampleCondition atau status baris
        if ((item.sampleCondition === 'SUBCONTRACT' || (item as any).status === 'FAIL_SUBCONTRACT') && subTests.length === 0) {
          subTests.push('Pengujian Geoteknik Khusus');
        }

        if (subTests.length > 0) {
          subItems.push({
            sampleCode: item.sampleCode,
            boreholeNo: item.sampleCode.split('_')[0] || item.sampleCode,
            depthStr: item.depthStr || '-',
            testCode: subTests.join(', '),
            testName: subTests.join(', '),
            reason: 'Pengujian dialihkan ke Laboratorium Rekanan Terakreditasi (Subkontrak).'
          });
        }
      });

      if (subItems.length > 0) {
        const existingNotice = notices.find(n => 
          n.prepReportNo === report.prepReportNo || 
          (n as any).poNumber === report.poNumber ||
          n.id === `auto-sub-${report.id}`
        );

        if (!existingNotice) {
          const count = notices.length + 1;
          const noticeNo = `${String(count).padStart(2, '0')}-SUB / VIII / 2026`;
          const newNotice: SubcontractNotice = {
            id: `auto-sub-${report.id}`,
            noticeNo,
            prepReportNo: report.prepReportNo,
            date: report.date || new Date().toLocaleDateString('id-ID'),
            clientName: report.clientName,
            clientContactPerson: 'Pihak Klien / PIC',
            projectName: report.projectName || 'Penyelidikan Geoteknik',
            subcontractItems: subItems,
            partnerLabName: 'Laboratorium Rekanan Terakreditasi KAN',
            status: 'Pending_Client'
          };
          (newNotice as any).poNumber = report.poNumber;
          onSaveNotice(newNotice);
        } else {
          // Update item jika ada perubahan di BA
          const itemsStrExisting = JSON.stringify(existingNotice.subcontractItems);
          const itemsStrNew = JSON.stringify(subItems);
          if (itemsStrExisting !== itemsStrNew) {
            onSaveNotice({
              ...existingNotice,
              subcontractItems: subItems,
              clientName: report.clientName || existingNotice.clientName,
              projectName: report.projectName || existingNotice.projectName
            });
          }
        }
      }
    });
  }, [prepReports, notices]);

  const handleApproveClient = (noticeId: string) => {
    const target = notices.find(n => n.id === noticeId);
    if (target) {
      const updated: SubcontractNotice = {
        ...target,
        status: 'Approved_Client',
        clientApprovalDate: new Date().toISOString().split('T')[0],
        clientApprovalNotes: 'Disetujui oleh Klien untuk disubkontrakkan ke Lab Rekanan.'
      };
      onSaveNotice(updated);

      // Auto generate shipping letter to partner lab
      const newLetter: SubcontractShippingLetter = {
        id: `sur-${Date.now()}`,
        letterNo: getNextDocNo('SJL-SUB', shippingLetters.map(l => l.letterNo)),
        noticeNo: updated.noticeNo,
        date: new Date().toISOString().split('T')[0],
        partnerLabName: updated.partnerLabName,
        partnerLabAddress: 'Jl. Raya Industri Geoteknik No. 45, Bandung',
        partnerLabPhone: '022-7654321',
        courierName: 'Asep Supriatna (Kurir Khusus Lab)',
        subcontractItems: updated.subcontractItems,
        instructions: 'Harap menjaga kelembaban sampel (parafin berlapis) dan melampirkan LHU resmi hasil uji ke PT Terraforma Geoteknik Indonesia.'
      };
      onSaveShippingLetter(newLetter);
    }
  };

  return (
    <div className="p-3.5 sm:p-4 space-y-3.5 max-w-[99%] mx-auto text-slate-800">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 w-fit mb-1.5">
            <span>MODUL OPSIONAL ISO 17025 (KLAUSUL 7.1 &amp; 7.3)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             Subkontrak Lab Rekanan (Surat Konfirmasi Klien &amp; Pengantar Lab)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Otomatis membuat Surat Konfirmasi Per PO dari hasil BA Preparasi Sampel yang memerlukan rujukan ke Lab Rekanan.
          </p>
        </div>
      </div>

      {/* SECTION 1: SURAT PEMBERITAHUAN KONFIRMASI KLIEN (PER PO) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-amber-50/50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>3a. Surat Pemberitahuan Konfirmasi Klien Per PO ({notices.length} Surat)</span>
          </h3>
          <span className="text-xs text-amber-800 font-semibold bg-amber-100/80 px-2.5 py-1 rounded-lg">
            ⚡ Otomatis Dibuat Per PO dari BA Preparasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">No. Surat Konfirmasi</th>
                <th className="py-3 px-4">Ref BA &amp; Number PO</th>
                <th className="py-3 px-4">Klien &amp; Proyek</th>
                <th className="py-3 px-4">Daftar Sampel Subkontrak</th>
                <th className="py-3 px-4">Target Lab Rekanan</th>
                <th className="py-3 px-4 text-center">Status Izin Klien</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono">
                    Belum ada sampel yang disubkontrakkan pada BA Preparasi.
                  </td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold font-mono text-amber-900 whitespace-nowrap">{n.noticeNo}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div className="font-extrabold text-slate-900">{n.prepReportNo}</div>
                      <div className="text-[11px] text-amber-800 font-bold">
                        PO: {(n as any).poNumber || 'PO-SML-003'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{n.clientName}</div>
                      <div className="text-[11px] text-slate-500">{n.projectName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {n.subcontractItems.map((item, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            {item.sampleCode}: {item.testCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{n.partnerLabName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full whitespace-nowrap ${
                        n.status === 'Approved_Client' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {n.status === 'Approved_Client' ? '✓ Disetujui Klien' : 'Menunggu Izin Klien'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedNotice(n);
                            setIsPreviewNoticeModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak PDF</span>
                        </button>
                        {n.status === 'Pending_Client' && (
                          <button
                            onClick={() => handleApproveClient(n.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Setujui (Klien ACC)</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SURAT PENGANTAR SAMPEL KE LAB REKANAN (PER PO) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-emerald-50/50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>3b. Surat Pengantar Sampel ke Lab Rekanan ({shippingLetters.length} Surat Jalan)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">No. Surat Pengantar</th>
                <th className="py-3 px-4">Ref Surat Konfirmasi</th>
                <th className="py-3 px-4">Tanggal Pengiriman</th>
                <th className="py-3 px-4">Tujuan Lab Rekanan</th>
                <th className="py-3 px-4">Kurir Pengantar</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {shippingLetters.map((sl) => (
                <tr key={sl.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold font-mono text-emerald-900">{sl.letterNo}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{sl.noticeNo}</td>
                  <td className="py-3 px-4 text-slate-600">{sl.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{sl.partnerLabName}</div>
                    <div className="text-[11px] text-slate-500">{sl.partnerLabAddress}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{sl.courierName}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedLetter(sl);
                        setIsPreviewLetterModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[11px] font-bold flex items-center gap-1 mx-auto transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Surat Pengantar PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW NOTICE MODAL */}
      {isPreviewNoticeModalOpen && selectedNotice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1000px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Surat Pemberitahuan Konfirmasi Subkontrak - {selectedNotice.noticeNo}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-4 h-4" /> Cetak / Save PDF
                </button>
                <button onClick={() => setIsPreviewNoticeModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-800 overflow-y-auto flex justify-center">
              <div className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-xs space-y-4 border border-slate-300 min-h-[297mm]">
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
                    <div className="text-xs font-black text-blue-900 uppercase">SURAT KONFIRMASI SUBKONTRAK</div>
                    <div className="text-xs font-bold font-mono text-slate-800">{selectedNotice.noticeNo}</div>
                    <div className="text-[10px] text-slate-500">Tanggal: {selectedNotice.date}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>Kepada Yth: <strong>{selectedNotice.clientName}</strong></div>
                  <div>Up: {selectedNotice.clientContactPerson}</div>
                  <div>Proyek: <strong>{selectedNotice.projectName}</strong></div>
                </div>

                <p className="text-slate-700 leading-relaxed font-medium">
                  Berdasarkan hasil inspeksi &amp; preparasi sampel tanah (Ref: {selectedNotice.prepReportNo}), kami beritahukan bahwa terdapat sampel yang memerlukan rujukan pengujian ke Laboratorium Rekanan terakreditasi dengan rincian sebagai berikut:
                </p>

                {(() => {
                  // Extract unique subcontract test labels for header matrix columns
                  const rawTestStrings = selectedNotice.subcontractItems.map(i => i.testCode || i.testName || '');
                  const allSubTestLabels: string[] = [];

                  rawTestStrings.forEach(str => {
                    str.split(',').forEach(part => {
                      const clean = part.trim();
                      if (clean && !allSubTestLabels.includes(clean)) {
                        allSubTestLabels.push(clean);
                      }
                    });
                  });

                  const matrixColumns = allSubTestLabels.length > 0 ? allSubTestLabels : ['Pengujian Dirujuk'];

                  return (
                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-blue-900 text-white font-bold text-center">
                          <th className="p-2 border border-slate-900 w-8" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>No</th>
                          <th className="p-2 border border-slate-900 text-left min-w-[120px]" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>Kode Sampel / BH</th>
                          <th className="p-2 border border-slate-900 text-center w-24" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>Kedalaman</th>
                          <th className="p-1 border border-slate-900 text-center" colSpan={matrixColumns.length}>
                            {allSubTestLabels.length > 0 ? 'Parameter Pengujian Dirujuk (Subkontrak)' : 'Pengujian Dirujuk'}
                          </th>
                          <th className="p-2 border border-slate-900 text-left min-w-[130px]" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>Alasan Rujukan</th>
                        </tr>
                        {allSubTestLabels.length > 0 && (
                          <tr className="bg-blue-800 text-white font-bold text-center text-[10.5px]">
                            {matrixColumns.map(tLabel => (
                              <th key={tLabel} className="p-1.5 border border-slate-900 min-w-[45px]">{tLabel}</th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {selectedNotice.subcontractItems.map((item, i) => {
                          const itemTests = (item.testCode || item.testName || '').split(',').map(s => s.trim().toLowerCase());
                          
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 border border-slate-400 text-center font-bold">{i + 1}</td>
                              <td className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{item.sampleCode}</td>
                              <td className="p-2 border border-slate-400 text-center font-mono">{item.depthStr}</td>
                              {matrixColumns.map((tLabel, tIdx) => {
                                if (allSubTestLabels.length === 0) {
                                  return (
                                    <td key={tIdx} className="p-2 border border-slate-400 font-bold text-amber-900">
                                      {item.testName || item.testCode}
                                    </td>
                                  );
                                }
                                const isMatch = itemTests.some(it => it.includes(tLabel.toLowerCase()) || tLabel.toLowerCase().includes(it));
                                return (
                                  <td key={tLabel} className={`p-1.5 border border-slate-400 text-center font-black ${isMatch ? 'bg-amber-100/90 text-amber-950 font-extrabold' : 'text-slate-400 font-normal'}`}>
                                    {isMatch ? 'Sub' : '-'}
                                  </td>
                                );
                              })}
                              <td className="p-2 border border-slate-400 text-[10px] text-slate-700 italic">{item.reason}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}

                <p className="text-slate-700 leading-relaxed">
                  Target Lab Rekanan Rujukan: <strong>{selectedNotice.partnerLabName}</strong>. Mohon konfirmasi persetujuan dari Bapak/Ibu demi kelancaran penerbitan laporan hasil uji.
                </p>

                {/* TANDA TANGAN & STEMPEL TERRAFORMA LAB */}
                {(() => {
                  const headOfLab = (personnelCatalogue || []).find(p => 
                    p.role === 'Approver' && (p.title?.toLowerCase().includes('kepala') || p.name.toLowerCase().includes('yustiadji'))
                  ) || (personnelCatalogue || []).find(p => p.role === 'Approver') || {
                    name: 'Yustiadji',
                    title: 'Kepala Laboratorium',
                    signatureUrl: undefined
                  };

                  return (
                    <div className="pt-8 grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-12">
                        <div className="font-bold uppercase text-[10px] text-slate-600">MENGETAHUI / MENYETUJUI KLIEN</div>
                        <div className="font-bold text-slate-900 underline">
                          {selectedNotice.clientApprovalDate ? `Disetujui: ${selectedNotice.clientApprovalDate}` : '( Tanda Tangan & Stempel Klien )'}
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="w-60 font-sans space-y-1">
                          <div className="font-bold uppercase text-[10px] text-slate-600">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</div>
                          
                          <div className="h-16 flex flex-col items-center justify-end pb-1 relative my-1">
                            {/* CAP STEMPEL RESMI (TERPISAH DARI LOGO - MENGGUNAKAN STAMP URL) */}
                            {(companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png') && (
                              <img 
                                src={companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png'} 
                                alt="Cap Stempel Resmi" 
                                className="absolute bottom-0 left-2 w-16 h-16 object-contain mix-blend-multiply opacity-80 rotate-[-6deg] pointer-events-none z-20 select-none" 
                              />
                            )}

                            {headOfLab.signatureUrl ? (
                              <img 
                                src={headOfLab.signatureUrl} 
                                alt={`Tanda tangan ${headOfLab.name}`} 
                                className="max-h-14 max-w-[170px] object-contain mix-blend-multiply mb-0.5 relative z-10" 
                              />
                            ) : (
                              <span className="text-[8.5px] text-slate-400 font-mono mb-2">
                                ( Tanda Tangan &amp; Stempel Lab )
                              </span>
                            )}

                            <div className="border-b border-slate-900 w-48 relative z-0"></div>
                          </div>

                          <div className="font-extrabold text-slate-900 text-xs underline">{headOfLab.name}</div>
                          <div className="text-[8.5px] text-slate-500 font-semibold">{headOfLab.title || 'Kepala Laboratorium'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW SHIPPING LETTER MODAL */}
      {isPreviewLetterModalOpen && selectedLetter && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1000px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Surat Pengantar Sampel ke Lab Rekanan - {selectedLetter.letterNo}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-4 h-4" /> Cetak / Save PDF
                </button>
                <button onClick={() => setIsPreviewLetterModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-slate-800 overflow-y-auto flex justify-center">
              <div className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-xs space-y-4 border border-slate-300 min-h-[297mm]">
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
                    <div className="text-xs font-black text-blue-900 uppercase">SURAT PENGANTAR SAMPEL RUJUKAN</div>
                    <div className="text-xs font-bold font-mono text-slate-800">{selectedLetter.letterNo}</div>
                    <div className="text-[10px] text-slate-500">Tanggal: {selectedLetter.date}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div>Kepada Yth: <strong>{selectedLetter.partnerLabName}</strong></div>
                  <div>Alamat: {selectedLetter.partnerLabAddress}</div>
                  <div>Kurir Pengantar: <strong>{selectedLetter.courierName}</strong></div>
                </div>

                <p className="text-slate-700 leading-relaxed font-medium">
                  Bersama surat pengantar ini, kami kirimkan sampel fisik tanah untuk dilakukan pengujian rujukan laboratorium dengan rincian sebagai berikut:
                </p>

                {(() => {
                  const rawTestStrings = selectedLetter.subcontractItems.map(i => i.testCode || i.testName || '');
                  const allSubTestLabels: string[] = [];

                  rawTestStrings.forEach(str => {
                    str.split(',').forEach(part => {
                      const clean = part.trim();
                      if (clean && !allSubTestLabels.includes(clean)) {
                        allSubTestLabels.push(clean);
                      }
                    });
                  });

                  const matrixColumns = allSubTestLabels.length > 0 ? allSubTestLabels : ['Pengujian Minta Dihitung'];

                  return (
                    <table className="w-full border-collapse border border-slate-900 text-xs">
                      <thead>
                        <tr className="bg-blue-900 text-white font-bold text-center">
                          <th className="p-2 border border-slate-900 w-8" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>No</th>
                          <th className="p-2 border border-slate-900 text-left min-w-[120px]" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>Kode Sampel / BH</th>
                          <th className="p-2 border border-slate-900 text-center w-24" rowSpan={allSubTestLabels.length > 0 ? 2 : 1}>Kedalaman</th>
                          <th className="p-1 border border-slate-900 text-center" colSpan={matrixColumns.length}>
                            {allSubTestLabels.length > 0 ? 'Parameter Pengujian Minta Dihitung' : 'Pengujian Minta Dihitung'}
                          </th>
                        </tr>
                        {allSubTestLabels.length > 0 && (
                          <tr className="bg-blue-800 text-white font-bold text-center text-[10.5px]">
                            {matrixColumns.map(tLabel => (
                              <th key={tLabel} className="p-1.5 border border-slate-900 min-w-[45px]">{tLabel}</th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {selectedLetter.subcontractItems.map((item, i) => {
                          const itemTests = (item.testCode || item.testName || '').split(',').map(s => s.trim().toLowerCase());
                          
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 border border-slate-400 text-center font-bold">{i + 1}</td>
                              <td className="p-2 border border-slate-400 font-mono font-bold text-slate-900">{item.sampleCode}</td>
                              <td className="p-2 border border-slate-400 text-center font-mono">{item.depthStr}</td>
                              {matrixColumns.map((tLabel, tIdx) => {
                                if (allSubTestLabels.length === 0) {
                                  return (
                                    <td key={tIdx} className="p-2 border border-slate-400 font-bold text-blue-900">
                                      {item.testName || item.testCode}
                                    </td>
                                  );
                                }
                                const isMatch = itemTests.some(it => it.includes(tLabel.toLowerCase()) || tLabel.toLowerCase().includes(it));
                                return (
                                  <td key={tLabel} className={`p-1.5 border border-slate-400 text-center font-black ${isMatch ? 'bg-blue-100/90 text-blue-950 font-extrabold' : 'text-slate-400 font-normal'}`}>
                                    {isMatch ? '1' : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                      {allSubTestLabels.length > 0 && (
                        <tfoot>
                          <tr className="bg-blue-100/80 text-slate-900 font-extrabold text-center border-t-2 border-slate-900">
                            <td colSpan={3} className="p-1.5 border border-slate-900 text-right pr-3 font-black text-[11px]">Total Sampel Dikirim:</td>
                            {matrixColumns.map(tLabel => {
                              const totalCount = selectedLetter.subcontractItems.filter(item => {
                                const itemTests = (item.testCode || item.testName || '').split(',').map(s => s.trim().toLowerCase());
                                return itemTests.some(it => it.includes(tLabel.toLowerCase()) || tLabel.toLowerCase().includes(it));
                              }).length;
                              return (
                                <td key={tLabel} className="p-1.5 border border-slate-900 font-mono font-black text-blue-950">
                                  {totalCount}
                                </td>
                              );
                            })}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  );
                })()}

                <div className="border border-slate-300 p-2.5 bg-slate-50 rounded-xs text-[11px] text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900">Instruksi Khusus Penanganan:</div>
                  <div>{selectedLetter.instructions}</div>
                </div>

                <div className="pt-10 grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-12">
                    <div className="font-bold uppercase text-[10px] text-slate-600">PENERIMA DI LAB REKANAN</div>
                    <div className="font-bold text-slate-900 underline">(Tanda Tangan &amp; Stempel)</div>
                  </div>
                  <div className="space-y-12">
                    <div className="font-bold uppercase text-[10px] text-slate-600">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</div>
                    <div className="font-bold text-slate-900 underline">Manajer Mutu Lab</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
