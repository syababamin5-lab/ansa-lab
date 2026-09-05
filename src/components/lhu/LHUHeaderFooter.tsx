import React from 'react';
import { LHUHeaderInfo } from '../../types/lhuTypes';

interface LHUHeaderProps {
  header: LHUHeaderInfo;
  titleIndo: string;
  titleEn: string;
  standardStr: string;
}

export const LHUHeader: React.FC<LHUHeaderProps> = ({
  header,
  titleIndo,
  titleEn,
  standardStr
}) => {
  return (
    <div className="space-y-1.5 text-[9.5px] text-slate-900 border-b border-black pb-1.5 font-sans">
      {/* KOP SURAT ATAS (LOGO LEFT + CENTERED TITLE) */}
      <div className="relative border-b border-slate-900 pb-2 pt-1">
        {/* Logo at Left */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2">
          <img src="/logo.png" alt="Logo Terraforma Geoteknik Indonesia" className="w-14 h-14 object-contain" />
        </div>

        {/* Centered Title */}
        <div className="text-center space-y-0.5">
          <h1 className="text-[15px] font-black uppercase tracking-wider leading-none text-[#1e40af]">
            LABORATORIUM MEKANIKA TANAH
          </h1>
          <h2 className="text-[13px] font-black text-[#1e40af] uppercase leading-tight">
            PT. TERRA<span className="text-[#dc2626]">FORMA</span> GEOTEKNIK INDONESIA
          </h2>
          <p className="text-[9.5px] font-extrabold tracking-widest text-[#64748b] uppercase">
            LABORATORY TEST REPORT
          </p>
        </div>
      </div>

      {/* METADATA LAPORAN HORIZONTAL BAR (EXACT EXCEL MATCH) */}
      <div className="text-[8.5px] font-sans py-1 space-y-1 border-b-2 border-slate-900 px-0.5">
        {/* Baris 1: No. Laporan */}
        <div className="flex items-center">
          <span className="font-semibold text-slate-700">No. Laporan / <span className="italic">Report No.</span></span>
          <span className="mx-1 font-bold text-slate-800">:</span>
          <span className="font-extrabold text-black font-mono">{header.reportNo}</span>
        </div>

        {/* Baris 2: Revisi (Kiri), Tgl Laporan (Tengah), Halaman (Kanan) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-[180px]">
            <span className="font-semibold text-slate-700">Revisi / <span className="italic">Revision</span></span>
            <span className="mx-1 font-bold text-slate-800">:</span>
            <span className="font-extrabold text-black font-mono">{header.revision}</span>
          </div>

          <div className="flex items-center">
            <span className="font-semibold text-slate-700">Tgl. Laporan / <span className="italic">Report Date</span></span>
            <span className="mx-1 font-bold text-slate-800">:</span>
            <span className="font-semibold text-black font-mono">{header.reportDate}</span>
          </div>

          <div className="flex items-center">
            <span className="font-semibold text-slate-700">Halaman/Pages</span>
            <span className="mx-1 font-bold text-slate-800">:</span>
            <span className="font-semibold text-black font-mono">{header.currentPage} dari {header.totalPages}</span>
          </div>
        </div>
      </div>

      {/* INFORMASI PROYEK & KLIEN METADATA GRID WITH BLUE HEADERS */}
      <div className="grid grid-cols-2 gap-1 text-[8.5px] border border-slate-900 bg-white p-0.5 font-sans">
        {/* Kolom Kiri: Informasi Proyek & Klien */}
        <div className="space-y-1 p-0.5 border-r border-slate-300 pr-1.5">
          <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
            INFORMASI PROYEK &amp; PEKERJAAN / PROJECT INFORMATION
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[125px] font-semibold text-slate-600 shrink-0">Nama Proyek / Project Name</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-bold text-slate-900">{header.projectName}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[125px] font-semibold text-slate-600 shrink-0">Lokasi Proyek / Location</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-semibold text-slate-900">{header.projectLocation}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[125px] font-semibold text-slate-600 shrink-0">No. PO / PO Number</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-bold font-mono text-slate-900">{header.poNumber}</div>
          </div>

          <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide mt-1.5">
            IDENTITAS KLIEN / CLIENT INFORMATION
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[125px] font-semibold text-slate-600 shrink-0">Klien / Client</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-bold text-slate-900">{header.clientName}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[125px] font-semibold text-slate-600 shrink-0">Alamat / Address</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 text-slate-800">{header.clientAddress}</div>
          </div>
        </div>

        {/* Kolom Kanan: Informasi Contoh / Sampel */}
        <div className="space-y-1 p-0.5 pl-1.5">
          <div className="bg-[#1e40af] text-white px-1.5 py-0.5 font-bold uppercase text-[8px] tracking-wide">
            INFORMASI CONTOH / SAMPLE INFORMATION
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Kode Laboratorium / Laboratory Id.</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-bold font-mono text-slate-900 bg-yellow-100 px-1 inline-block">{header.labId}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Sumber Contoh / Sample Source</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-extrabold text-slate-900">{header.sampleSource}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Jenis Contoh / Sample Type</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 text-slate-900">{header.sampleType}</div>
          </div>
          {header.soilDescription && (
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Deskripsi Tanah / Soil Description</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-semibold text-slate-900">{header.soilDescription}</div>
          </div>
          )}
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Warna Tanah / Soil Color</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 text-slate-900">{header.soilColor}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Tgl. Diterima / Date Received</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-mono text-slate-900">{header.dateReceived}</div>
          </div>
          <div className="flex items-start text-[8.5px] leading-tight">
            <div className="w-[130px] font-semibold text-slate-600 shrink-0">Tgl Pengujian / Date Tested</div>
            <div className="w-3 text-center font-bold text-slate-800 shrink-0">:</div>
            <div className="flex-1 font-mono text-slate-900">{header.dateTested}</div>
          </div>
        </div>
      </div>

      {/* NAMA JUDUL PENGUJIAN & BADGE SNI BLUE BOX */}
      <div className="flex border border-slate-900 bg-[#1e40af] text-white">
        <div className="flex-1 p-1 text-center flex flex-col justify-center">
          <h3 className="text-[11px] font-black uppercase tracking-wide">
            {titleIndo}
          </h3>
          <h4 className="text-[9px] font-semibold italic text-slate-100">
            {titleEn}
          </h4>
        </div>
        <div className="bg-[#1e3a8a] px-3 py-1 text-[8px] font-mono flex flex-col justify-center border-l border-white/30 text-right">
          <div className="font-bold text-amber-300">{standardStr}</div>
        </div>
      </div>
    </div>
  );
};

interface LHUFooterProps {
  header: LHUHeaderInfo;
  onlyApprovedBy?: boolean;
  hideSignatures?: boolean;
  sheetCode?: LHUSheetCode;
}

import QRCode from 'qrcode';

export const getShortSheetCode = (code?: string): string => {
  if (!code) return 'DOC';
  if (code === 'LHU_PP') return 'PP';
  if (code === 'LHU_ATB') return 'ATB';
  if (code === 'LHU_Sieve & Hidro') return 'SIEVE';
  if (code === 'LHU_standard proctor') return 'CMP-STD';
  if (code === 'LHU_modified proctor') return 'CMP-MOD';
  if (code === 'LHU PFH') return 'PFH';
  if (code === 'LHU_Konsolidasi') return 'CONSOL';
  if (code === 'LHU_UCT') return 'UCT';
  if (code === 'LHU_DS-UU') return 'DS-UU';
  if (code === 'LHU_DS-CD') return 'DS-CD';
  if (code === 'LHU_DS-CD RES.') return 'DS-RES';
  if (code === 'LHU_TRX-UU') return 'TRX-UU';
  if (code === 'LHU_TRX-CU-Multi') return 'TRX-CU-M';
  if (code === 'LHU_TRX-CU-Normal') return 'TRX-CU';
  if (code === 'LHU_TRX-CD') return 'TRX-CD';
  if (code === 'LHU_CBR Unsoaked') return 'CBR-UNS';
  if (code === 'Template LHU_CBRsoaked') return 'CBR-SOK';
  return code.replace(/^LHU[_\s]*/i, '').replace(/[^a-zA-Z0-9-]/g, '_').toUpperCase();
};

// Helper component for authentic scannable 1:1 square Verification QR Code specific to 1 Test, 1 Sample, 1 PO
const LHUVerificationQRCode: React.FC<{ 
  reportNo: string; 
  labId?: string; 
  sheetCode?: LHUSheetCode;
  poNumber?: string;
  sampleSource?: string;
}> = ({ reportNo, labId, sheetCode, poNumber, sampleSource }) => {
  const [qrSrc, setQrSrc] = React.useState<string>('');
  
  const testKey = getShortSheetCode(sheetCode);
  const baseRepNo = reportNo || `REP-2026-${labId || 'DOC'}`;
  // Unique Barcode Code for 1 Test, 1 Sample, 1 PO
  const uniqueCode = `${baseRepNo}-${testKey}`;

  React.useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(uniqueCode)}&po=${encodeURIComponent(poNumber || '')}&sample=${encodeURIComponent(sampleSource || labId || '')}&test=${encodeURIComponent(testKey)}`;

    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrSrc(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [uniqueCode, poNumber, sampleSource, labId, testKey]);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-0.5 select-none overflow-hidden">
      <div className="text-[6px] font-extrabold text-[#1e40af] uppercase tracking-tighter leading-none text-center">
        QR VERIFIKASI
      </div>
      <div className="w-full flex-1 flex items-center justify-center p-0.5 min-h-0">
        {qrSrc ? (
          <img
            src={qrSrc}
            alt={`QR ${uniqueCode}`}
            className="w-full h-full max-h-12 max-w-12 aspect-square object-contain"
          />
        ) : (
          <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-[5px] text-slate-400 font-mono">
            QR...
          </div>
        )}
      </div>
      <div className="w-full text-center">
        <div className="text-[5px] font-mono font-black text-slate-900 leading-none tracking-tighter truncate max-w-full">
          {uniqueCode}
        </div>
      </div>
    </div>
  );
};

export const LHUFooter: React.FC<LHUFooterProps> = ({
  header,
  onlyApprovedBy = false,
  hideSignatures = false,
  sheetCode
}) => {
  return (
    <div className="space-y-1 text-[8.5px] border-t border-black pt-1 font-sans mt-auto break-inside-avoid print:break-inside-avoid">
      {/* TANDA TANGAN PERSONEL GRID */}
      {!hideSignatures && (
        onlyApprovedBy ? (
          <div className="flex justify-end items-center border border-black p-1 bg-white break-inside-avoid print:break-inside-avoid gap-1">
            <div className="flex flex-col justify-between w-64 text-center h-18 border-l border-slate-200 pl-3">
              <div>
                <div className="font-bold uppercase text-[7.5px] text-slate-700">DISETUJUI OLEH / APPROVED BY</div>
                <div className="text-[7px] text-slate-500 min-h-[9px]">{header.approvedByName ? header.approvedByTitle : '\u00A0'}</div>
              </div>

              <div className="my-0.5 h-8 flex items-center justify-center">
                {header.approvedByName ? (
                  header.approvedBySignatureUrl ? (
                    <img src={header.approvedBySignatureUrl} alt="TTD Kepala Lab" className="max-h-8 max-w-full object-contain" />
                  ) : (
                    <div className="w-20 border-b border-dashed border-slate-400 text-[7px] text-slate-400 italic">
                      (Tanda Tangan)
                    </div>
                  )
                ) : (
                  <div className="w-20 border-b border-dashed border-slate-300 h-4"></div>
                )}
              </div>

              <div>
                <div className="font-bold text-[8px] text-slate-900 uppercase underline decoration-slate-400 min-h-[11px]">
                  {header.approvedByName || '\u00A0'}
                </div>
                <div className="text-[7px] text-slate-500 font-mono min-h-[10px]">
                  {header.approvedByName ? `Tgl: ${header.reportDate || header.dateTested || ''}` : '\u00A0'}
                </div>
              </div>
            </div>

            {/* Kolom Barcode / QR Code 1:1 */}
            <div className="h-18 w-18 aspect-square flex items-center justify-center border-l border-slate-300 pl-1 shrink-0">
              <LHUVerificationQRCode 
                reportNo={header.reportNo} 
                labId={header.labId} 
                sheetCode={sheetCode}
                poNumber={header.poNumber}
                sampleSource={header.sampleSource}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 text-center border border-black p-1 bg-white items-stretch">
            {/* 1. Tested By */}
            <div className="flex flex-col justify-between border-r border-slate-300 pr-1 h-18">
              <div>
                <div className="font-bold uppercase text-[7.5px] text-slate-700">DIUJI OLEH / TESTED BY</div>
                <div className="text-[7px] text-slate-500 min-h-[9px]">{header.testedByName ? header.testedByTitle : '\u00A0'}</div>
              </div>

              <div className="my-0.5 h-8 flex items-center justify-center">
                {header.testedByName ? (
                  header.testedBySignatureUrl ? (
                    <img src={header.testedBySignatureUrl} alt="TTD Penguji" className="max-h-8 max-w-full object-contain" />
                  ) : (
                    <div className="w-20 border-b border-dashed border-slate-400 text-[7px] text-slate-400 italic">
                      (Tanda Tangan)
                    </div>
                  )
                ) : (
                  <div className="w-20 border-b border-dashed border-slate-300 h-4"></div>
                )}
              </div>

              <div>
                <div className="font-bold text-[8px] text-slate-900 uppercase underline decoration-slate-400 min-h-[11px]">
                  {header.testedByName || '\u00A0'}
                </div>
                <div className="text-[7px] text-slate-500 font-mono min-h-[10px]">
                  {header.testedByName && header.dateTested ? `Tgl: ${header.dateTested}` : '\u00A0'}
                </div>
              </div>
            </div>

            {/* 2. Checked By */}
            <div className="flex flex-col justify-between border-r border-slate-300 px-1 h-18">
              <div>
                <div className="font-bold uppercase text-[7.5px] text-slate-700">DIPERIKSA OLEH / CHECKED BY</div>
                <div className="text-[7px] text-slate-500 min-h-[9px]">{header.checkedByName ? header.checkedByTitle : '\u00A0'}</div>
              </div>

              <div className="my-0.5 h-8 flex items-center justify-center">
                {header.checkedByName ? (
                  header.checkedBySignatureUrl ? (
                    <img src={header.checkedBySignatureUrl} alt="TTD Checker" className="max-h-8 max-w-full object-contain" />
                  ) : (
                    <div className="w-20 border-b border-dashed border-slate-400 text-[7px] text-slate-400 italic">
                      (Tanda Tangan)
                    </div>
                  )
                ) : (
                  <div className="w-20 border-b border-dashed border-slate-300 h-4"></div>
                )}
              </div>

              <div>
                <div className="font-bold text-[8px] text-slate-900 uppercase underline decoration-slate-400 min-h-[11px]">
                  {header.checkedByName || '\u00A0'}
                </div>
                <div className="text-[7px] text-slate-500 font-mono min-h-[10px]">
                  {header.checkedByName ? `Tgl: ${header.reportDate || header.dateTested || ''}` : '\u00A0'}
                </div>
              </div>
            </div>

            {/* 3. Approved By */}
            <div className="flex flex-col justify-between pl-1 h-18">
              <div>
                <div className="font-bold uppercase text-[7.5px] text-slate-700">DISETUJUI OLEH / APPROVED BY</div>
                <div className="text-[7px] text-slate-500 min-h-[9px]">{header.approvedByName ? header.approvedByTitle : '\u00A0'}</div>
              </div>

              <div className="my-0.5 h-8 flex items-center justify-center">
                {header.approvedByName ? (
                  header.approvedBySignatureUrl ? (
                    <img src={header.approvedBySignatureUrl} alt="TTD Kepala Lab" className="max-h-8 max-w-full object-contain" />
                  ) : (
                    <div className="w-20 border-b border-dashed border-slate-400 text-[7px] text-slate-400 italic">
                      (Tanda Tangan)
                    </div>
                  )
                ) : (
                  <div className="w-20 border-b border-dashed border-slate-300 h-4"></div>
                )}
              </div>

              <div>
                <div className="font-bold text-[8px] text-slate-900 uppercase underline decoration-slate-400 min-h-[11px]">
                  {header.approvedByName || '\u00A0'}
                </div>
                <div className="text-[7px] text-slate-500 font-mono min-h-[10px]">
                  {header.approvedByName ? `Tgl: ${header.reportDate || header.dateTested || ''}` : '\u00A0'}
                </div>
              </div>
            </div>

            {/* 4. Barcode / QR Code Kolom Kotak 1:1 sesuai tinggi container */}
            <div className="h-18 w-18 aspect-square flex items-center justify-center border-l border-slate-300 pl-1 shrink-0">
              <LHUVerificationQRCode 
                reportNo={header.reportNo} 
                labId={header.labId} 
                sheetCode={sheetCode}
                poNumber={header.poNumber}
                sampleSource={header.sampleSource}
              />
            </div>
          </div>
        )
      )}

      {/* CATATAN & FOOTER ALAMAT DENGAN TAMPILAN PERSIS EXCEL */}
      <div className="text-[7.5px] text-slate-700 leading-tight bg-slate-50 p-1.5 border border-slate-900 font-sans space-y-1">
        <div className="font-bold text-[#1e40af] uppercase tracking-wide">
          KETERANGAN / NOTES:
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {/* Baris 1 */}
          <div className="flex items-start gap-1">
            <span className="shrink-0 font-bold text-slate-700">-</span>
            <span className="flex-1">Laporan Hasil Uji ini hanya berlaku untuk contoh yang diuji.</span>
          </div>
          <div className="flex items-start gap-1 text-slate-600 italic">
            <span className="shrink-0 font-bold text-slate-500 not-italic">-</span>
            <span className="flex-1">This test report applies only to the tested sample.</span>
          </div>

          {/* Baris 2 */}
          <div className="flex items-start gap-1">
            <span className="shrink-0 font-bold text-slate-700">-</span>
            <span className="flex-1">Dilarang memperbanyak laporan tanpa ijin tertulis dari Laboratorium Mekanika Tanah PT. TERRAFORMA GEOTEKNIK INDONESIA.</span>
          </div>
          <div className="flex items-start gap-1 text-slate-600 italic">
            <span className="shrink-0 font-bold text-slate-500 not-italic">-</span>
            <span className="flex-1">This report shall not be reproduced except in full without written approval from PT. TERRAFORMA GEOTEKNIK INDONESIA Soil Mechanics Laboratory.</span>
          </div>

          {/* Baris 3 */}
          <div className="flex items-start gap-1">
            <span className="shrink-0 font-bold text-slate-700">-</span>
            <span className="flex-1">Laboratorium tidak bertanggung jawab atas kegiatan pengambilan dan transportasi contoh yang dilakukan oleh pihak lain.</span>
          </div>
          <div className="flex items-start gap-1 text-slate-600 italic">
            <span className="shrink-0 font-bold text-slate-500 not-italic">-</span>
            <span className="flex-1">The laboratory is not responsible for sampling, handling and sample transportation conducted by others.</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[7.5px] font-semibold bg-[#1e40af] text-white px-2 py-1 rounded-xs shadow-xs">
        <span>Jl. Terusan Al Fathu Ruko Linggahara 2 No.2, Soreang, Kec. Soreang, Kabupaten Bandung, Jawa Barat 40911</span>
        <span>Telp: 081214914641</span>
        <span>Email: soil_test@terraforma.co.id</span>
      </div>
    </div>
  );
};
