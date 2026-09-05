/**
 * ─── SISTEM PENOMORAN DOKUMEN TERPUSAT ─────────────────────────────────────
 *
 * Format Baku: [PREFIX]-[SEQ]-[BULAN_ROMAWI]-[TAHUN]
 *   Contoh: Q-001-VIII-2026
 *
 * Daftar Prefix Resmi:
 *   Q       — Surat Penawaran Harga (Quotation)
 *   BATT    — Berita Acara Tanda Terima Sampel (Sample Receipt)
 *   BA-PP   — Berita Acara Preparasi Sampel (Sample Prep)
 *   SPK-SUB — Surat Pemberitahuan Subkontrak (Subcontract Notice)
 *   SJL-SUB — Surat Jalan Subkontrak (Subcontract Shipping Letter)
 *   WS      — Lembar Kerja / Worksheet
 *   LHU     — Laporan Hasil Uji (Test Report / Certificate)
 *   INV     — Invoice / Tagihan Pembayaran
 *
 * Aturan:
 *   - SEQ 3 digit, dimulai dari 001
 *   - Reset setiap tahun baru (optional, saat ini per-bulan running number)
 *   - Nomor baru = SEQ tertinggi dari data yang ada + 1
 *   - Jika tidak ada data → SEQ = 001
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ROMAN_MONTHS = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
];

export type DocPrefix =
  | 'Q'
  | 'BATT'
  | 'COC.SMP'
  | 'BA-PP'
  | 'ACT.MSP'
  | 'SPK-SUB'
  | 'SJL-SUB'
  | 'WS'
  | 'LHU'
  | 'INV';

/**
 * Format tanggal menjadi 6 digit YYMMDD (contoh: 2026-09-05 -> '260905')
 */
export function formatDateYYMMDD(dateInput?: string | Date): string {
  if (!dateInput) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yy}${mm}${dd}`;
  }

  if (typeof dateInput === 'string') {
    const isoMatch = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const yy = isoMatch[1].slice(-2);
      const mm = isoMatch[2];
      const dd = isoMatch[3];
      return `${yy}${mm}${dd}`;
    }
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const yy = String(validDate.getFullYear()).slice(-2);
  const mm = String(validDate.getMonth() + 1).padStart(2, '0');
  const dd = String(validDate.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * Format nomor penawaran baku: Q-[KODE_KLIEN]-[SEQ]-[MM]-[YY]
 * Contoh: Q-TSK-001-IX-26 atau Q-001-IX-26 (jika tanpa kode klien)
 */
export function formatQuotationNo(
  seq: number,
  clientCode?: string,
  dateInput?: string | Date
): string {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const monthRomawi = ROMAN_MONTHS[validDate.getMonth()] || 'IX';
  const year2 = String(validDate.getFullYear()).slice(-2); // 2 digit: '26'
  const seqStr = String(Math.max(1, seq)).padStart(3, '0'); // 3 digit: '001'

  const cleanClientCode = (clientCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (cleanClientCode) {
    return `Q-${cleanClientCode}-${seqStr}-${monthRomawi}-${year2}`;
  }
  return `Q-${seqStr}-${monthRomawi}-${year2}`;
}

/**
 * Ekstrak sequence number numerik dari string nomor penawaran apa pun (format lama maupun baru).
 */
export function extractQuotationSeq(quotationNo: string): number {
  if (!quotationNo) return 0;
  const clean = quotationNo.trim().toUpperCase();

  // 1. Pola standar: -[SEQ]-[BULAN_ROMAWI]-[TAHUN 2/4 DIGIT]
  const stdMatch = clean.match(/-(\d+)-(?:I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)-(?:\d{2}|\d{4})$/i);
  if (stdMatch && stdMatch[1]) {
    const n = parseInt(stdMatch[1], 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // 2. Pola dengan awalan Q- dan angka 3 digit di dalamnya
  const qMatch = clean.match(/^Q-(?:[A-Z0-9]+-)?(\d+)/i);
  if (qMatch && qMatch[1]) {
    const n = parseInt(qMatch[1], 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // 3. Fallback: ambil bilangan integer tertinggi sebelum bagian tanggal
  const parts = clean.split('-');
  for (const part of parts) {
    if (/^\d{3}$/.test(part)) {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }

  return 0;
}

/**
 * Menghasilkan nomor penawaran baru otomatis berurutan dan dijamin 100% unik tanpa duplikasi.
 */
export function getNextQuotationNo(
  existingNos: string[],
  clientCode?: string,
  dateInput?: string | Date
): string {
  const cleanExistingNos = (existingNos || []).filter(Boolean);
  const existingSet = new Set(cleanExistingNos.map(n => n.trim().toUpperCase()));

  let maxSeq = 0;
  for (const no of cleanExistingNos) {
    const seq = extractQuotationSeq(no);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  let candidateSeq = Math.max(1, maxSeq + 1);
  let candidateNo = formatQuotationNo(candidateSeq, clientCode, dateInput);

  while (existingSet.has(candidateNo.toUpperCase())) {
    candidateSeq++;
    candidateNo = formatQuotationNo(candidateSeq, clientCode, dateInput);
  }

  return candidateNo;
}

/**
 * Format nomor Tanda Terima Sampel resmi: COC.SMP.[YYMMDD].[001]
 * Contoh: COC.SMP.260905.001
 */
export function formatSampleReceiptNo(seq: number, dateInput?: string | Date): string {
  const yymmdd = formatDateYYMMDD(dateInput);
  const seqStr = String(Math.max(1, seq)).padStart(3, '0');
  return `COC.SMP.${yymmdd}.${seqStr}`;
}

/**
 * Ekstrak nomor urut Tanda Terima Sampel (format COC.SMP.260905.001 atau legacy BATT)
 */
export function extractSampleReceiptSeq(receiptNo: string, targetDateYYMMDD?: string): number {
  if (!receiptNo) return 0;
  const clean = receiptNo.trim().toUpperCase();

  // 1. Format baru: COC.SMP.YYMMDD.001
  if (targetDateYYMMDD) {
    const match = clean.match(new RegExp(`^COC\\.SMP\\.${targetDateYYMMDD}\\.(\\d+)`, 'i'));
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }
  } else {
    const match = clean.match(/^COC\.SMP\.\d{6}\.(\d+)/i);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }

  return 0;
}

/**
 * Menghasilkan nomor Tanda Terima Sampel berikutnya (COC.SMP.YYMMDD.001)
 * Dijamin 100% unik tanpa duplikasi
 */
export function getNextSampleReceiptNo(existingNos: string[], dateInput?: string | Date): string {
  const yymmdd = formatDateYYMMDD(dateInput);
  const cleanExistingNos = (existingNos || []).filter(Boolean);
  const existingSet = new Set(cleanExistingNos.map(n => n.trim().toUpperCase()));

  let maxSeq = 0;
  for (const no of cleanExistingNos) {
    const seq = extractSampleReceiptSeq(no, yymmdd);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  let candidateSeq = Math.max(1, maxSeq + 1);
  let candidateNo = formatSampleReceiptNo(candidateSeq, dateInput);

  while (existingSet.has(candidateNo.toUpperCase())) {
    candidateSeq++;
    candidateNo = formatSampleReceiptNo(candidateSeq, dateInput);
  }

  return candidateNo;
}

/**
 * Format nomor Berita Acara Preparasi resmi: ACT.MSP.[YYMMDD].[001]
 * Contoh: ACT.MSP.260905.001
 */
export function formatSamplePrepNo(seq: number, dateInput?: string | Date): string {
  const yymmdd = formatDateYYMMDD(dateInput);
  const seqStr = String(Math.max(1, seq)).padStart(3, '0');
  return `ACT.MSP.${yymmdd}.${seqStr}`;
}

/**
 * Ekstrak nomor urut Berita Acara Preparasi (format ACT.MSP.260905.001 atau legacy BA-PP)
 */
export function extractSamplePrepSeq(reportNo: string, targetDateYYMMDD?: string): number {
  if (!reportNo) return 0;
  const clean = reportNo.trim().toUpperCase();

  // 1. Format baru: ACT.MSP.YYMMDD.001
  if (targetDateYYMMDD) {
    const match = clean.match(new RegExp(`^ACT\\.MSP\\.${targetDateYYMMDD}\\.(\\d+)`, 'i'));
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }
  } else {
    const match = clean.match(/^ACT\.MSP\.\d{6}\.(\d+)/i);
    if (match && match[1]) {
      const n = parseInt(match[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }

  return 0;
}

/**
 * Menghasilkan nomor Berita Acara Preparasi berikutnya (ACT.MSP.YYMMDD.001)
 * Dijamin 100% unik tanpa duplikasi
 */
export function getNextSamplePrepNo(existingNos: string[], dateInput?: string | Date): string {
  const yymmdd = formatDateYYMMDD(dateInput);
  const cleanExistingNos = (existingNos || []).filter(Boolean);
  const existingSet = new Set(cleanExistingNos.map(n => n.trim().toUpperCase()));

  let maxSeq = 0;
  for (const no of cleanExistingNos) {
    const seq = extractSamplePrepSeq(no, yymmdd);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  let candidateSeq = Math.max(1, maxSeq + 1);
  let candidateNo = formatSamplePrepNo(candidateSeq, dateInput);

  while (existingSet.has(candidateNo.toUpperCase())) {
    candidateSeq++;
    candidateNo = formatSamplePrepNo(candidateSeq, dateInput);
  }

  return candidateNo;
}

/**
 * Menghasilkan nomor dokumen berikutnya.
 * @param prefix      Prefix jenis dokumen (Q, BATT / COC.SMP, BA-PP / ACT.MSP, dst.)
 * @param existingNos Array string nomor dokumen yang sudah ada
 */
export function getNextDocNo(prefix: DocPrefix, existingNos: string[]): string {
  if (prefix === 'Q') {
    return getNextQuotationNo(existingNos);
  }
  if (prefix === 'BATT' || prefix === 'COC.SMP') {
    return getNextSampleReceiptNo(existingNos);
  }
  if (prefix === 'BA-PP' || prefix === 'ACT.MSP') {
    return getNextSamplePrepNo(existingNos);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = ROMAN_MONTHS[now.getMonth()];

  let maxSeq = 0;
  let detectedSubPrefix = '';

  for (const no of existingNos) {
    if (!no) continue;
    
    const seqMatch = no.match(/-(\d+)-[IVXLCDM]+-\d{4}$/i);
    if (seqMatch) {
      const seq = parseInt(seqMatch[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(3, '0');

  let has2DigitSubPrefix = false;
  for (const no of existingNos) {
    const escaped = prefix.replace(/-/g, '\\-');
    const match = no.match(new RegExp(`^${escaped}-(\\d{2,3})-(\\d{3})-${month}-${year}`, 'i'));
    if (match) {
      has2DigitSubPrefix = true;
      detectedSubPrefix = match[1];
      break;
    }
  }

  if (has2DigitSubPrefix && detectedSubPrefix) {
    return `${prefix}-${detectedSubPrefix}-${seqStr}-${month}-${year}`;
  }

  return `${prefix}-${seqStr}-${month}-${year}`;
}

/**
 * Format tampilan nomor dokumen yang lebih rapi untuk dicetak di kop dokumen.
 */
export function formatDocNo(prefix: DocPrefix, seq: number, date?: Date): string {
  if (prefix === 'Q') {
    return formatQuotationNo(seq, undefined, date);
  }
  if (prefix === 'BATT' || prefix === 'COC.SMP') {
    return formatSampleReceiptNo(seq, date);
  }
  if (prefix === 'BA-PP' || prefix === 'ACT.MSP') {
    return formatSamplePrepNo(seq, date);
  }
  const d = date || new Date();
  const month = ROMAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${prefix}-${String(seq).padStart(3, '0')}-${month}-${year}`;
}
