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
  | 'BA-PP'
  | 'SPK-SUB'
  | 'SJL-SUB'
  | 'WS'
  | 'LHU'
  | 'INV';

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
  // Contoh: Q-TSK-001-IX-26 atau Q-002-IX-2026 atau Q-001-IX-26
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
 * @param existingNos  Daftar seluruh nomor penawaran yang ada di sistem
 * @param clientCode   Kode/singkatan perusahaan klien (opsional, misal: 'TSK', 'TDK')
 * @param dateInput    Tanggal pembuatan penawaran (opsional, default: hari ini)
 */
export function getNextQuotationNo(
  existingNos: string[],
  clientCode?: string,
  dateInput?: string | Date
): string {
  const cleanExistingNos = (existingNos || []).filter(Boolean);
  const existingSet = new Set(cleanExistingNos.map(n => n.trim().toUpperCase()));

  // 1. Temukan nomor urut (seq) tertinggi dari seluruh data yang ada
  let maxSeq = 0;
  for (const no of cleanExistingNos) {
    const seq = extractQuotationSeq(no);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  let candidateSeq = Math.max(1, maxSeq + 1);
  let candidateNo = formatQuotationNo(candidateSeq, clientCode, dateInput);

  // 2. Garansi Mutlak Unik (Anti-Tabrakan / Anti-Duplikat):
  // Jika nomor kandidat ternyata sudah ada di database, naikkan urutan sampai menemukan slot nomor yang belum pernah dipakai
  while (existingSet.has(candidateNo.toUpperCase())) {
    candidateSeq++;
    candidateNo = formatQuotationNo(candidateSeq, clientCode, dateInput);
  }

  return candidateNo;
}

/**
 * Menghasilkan nomor dokumen berikutnya.
 * @param prefix      Prefix jenis dokumen (Q, BATT, BA-PP, dst.)
 * @param existingNos Array string nomor dokumen yang sudah ada
 * @returns           String nomor dokumen baru, mis: "Q-TSK-001-IX-26" atau "BATT-003-VIII-2026"
 */
export function getNextDocNo(prefix: DocPrefix, existingNos: string[]): string {
  if (prefix === 'Q') {
    return getNextQuotationNo(existingNos);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = ROMAN_MONTHS[now.getMonth()];

  // Temukan SEQ tertinggi dari daftar yang ada
  let maxSeq = 0;
  let detectedSubPrefix = '';

  for (const no of existingNos) {
    if (!no) continue;
    
    // Ekstrak angka urut persis sebelum Bulan Romawi & Tahun (misal: -003-VIII-2026)
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

  // Jika nomor yang ada menggunakan subprefix seperti BATT-23-001..., pertahankan pola tersebut jika ada
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
  const d = date || new Date();
  const month = ROMAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${prefix}-${String(seq).padStart(3, '0')}-${month}-${year}`;
}
