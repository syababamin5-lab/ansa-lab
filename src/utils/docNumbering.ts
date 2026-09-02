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
 * Menghasilkan nomor dokumen berikutnya.
 * @param prefix      Prefix jenis dokumen (Q, BATT, BA-PP, dst.)
 * @param existingNos Array string nomor dokumen yang sudah ada
 * @returns           String nomor dokumen baru, mis: "BATT-003-VIII-2026"
 */
export function getNextDocNo(prefix: DocPrefix, existingNos: string[]): string {
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

    // Cek jika ada sub-prefix tambahan seperti "23" pada "Q-23-003..."
    const escaped = prefix.replace(/-/g, '\\-');
    const subPrefixMatch = no.match(new RegExp(`^${escaped}-([A-Za-z0-9]+)-\\d+-[IVXLCDM]+-\\d{4}$`, 'i'));
    if (subPrefixMatch && subPrefixMatch[1] && !detectedSubPrefix && isNaN(Number(subPrefixMatch[1])) === false) {
      // Jika bagian setelah prefix bukan sequence utama
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(3, '0');

  // Jika nomor yang ada menggunakan subprefix seperti Q-23-001..., pertahankan pola tersebut jika ada
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
 * Sama persis dengan getNextDocNo — alias untuk keterbacaan.
 */
export function formatDocNo(prefix: DocPrefix, seq: number, date?: Date): string {
  const d = date || new Date();
  const month = ROMAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${prefix}-${String(seq).padStart(3, '0')}-${month}-${year}`;
}
