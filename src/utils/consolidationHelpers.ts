/**
 * consolidationHelpers.ts
 * Utilitas dan Algoritma Perhitungan Konsolidasi Tanah (Consolidation Test / Oedometer - CT)
 * Mengikuti Standar ASTM D2435 / SNI 2812:2011
 */

export const CONSOL_TIMES = [0.1, 0.25, 0.5, 1, 2, 4, 8, 15, 30, 60, 120, 240, 480, 1440];
export const CONSOL_SQRT_TIMES = CONSOL_TIMES.map(t => Math.sqrt(t));

export interface TaylorT90Result {
  t90: number;        // Waktu t90 dalam menit
  cv: number;         // Koefisien konsolidasi dalam cm²/detik
  d0: number;         // Titik nol terkoreksi (deformasi awal) dalam mm / dial units
  d90: number;        // Deformasi pada 90% konsolidasi primer
  sqrtT90: number;    // Akar waktu √t90 dalam √menit
  m1: number;         // Kemiringan Garis 1 (Linier Awal)
  m2: number;         // Kemiringan Garis 2 (Taylor 1.15x)
  isTaylorFound: boolean; // Menandakan apakah perpotongan Garis 2 dengan kurva berhasil ditemukan
}

/**
 * Menghitung nilai t90 dan Cv menggunakan Metode Taylor Akar Waktu (Square Root of Time 1.15x)
 * 
 * Tahapan Algoritma:
 * 1. Menyusun titik-titik pengamatan (√t, d) yang valid.
 * 2. Mencari zona linier awal (antara √t = 0.5 s/d 2.0 atau t = 0.25 s/d 4.0 menit) dengan regresi Least Squares.
 *    Menghasilkan kemiringan Garis 1 (m1) dan titik potong sumbu vertikal terkoreksi (d0).
 * 3. Menghitung Garis Taylor 1.15x (Garis 2) dengan kemiringan m2 = m1 / 1.15 yang bertumpu di d0.
 * 4. Mencari perpotongan segmen kurva laboratorium dengan Garis 2 untuk mendapatkan √t90 dan d90.
 * 5. Menghitung t90 = (√t90)² dan Cv = (0.848 * Hdr²) / (t90 * 60).
 */
export function calculateTaylorT90(
  timeReadings: (string | number)[],
  initialDialMm: number,
  currentHeightCm: number = 2.0
): TaylorT90Result {
  const pts: { t: number; x: number; y: number }[] = [];

  // Masukkan titik t = 0 jika tersedia
  if (initialDialMm !== undefined && initialDialMm !== null && !isNaN(initialDialMm)) {
    pts.push({ t: 0, x: 0, y: Number(initialDialMm) });
  }

  // Masukkan semua pembacaan waktu yang terisi
  for (let i = 0; i < CONSOL_TIMES.length; i++) {
    const raw = timeReadings[i];
    if (raw !== '' && raw !== null && raw !== undefined) {
      const v = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
      if (!isNaN(v)) {
        pts.push({
          t: CONSOL_TIMES[i],
          x: CONSOL_SQRT_TIMES[i],
          y: v
        });
      }
    }
  }

  // Jika data kurang dari 3 titik, kembalikan nilai default aman
  if (pts.length < 3) {
    const defaultD0 = initialDialMm || (pts[0]?.y ?? 0);
    return {
      t90: 0,
      cv: 0,
      d0: defaultD0,
      d90: defaultD0,
      sqrtT90: 0,
      m1: 0,
      m2: 0,
      isTaylorFound: false
    };
  }

  const finalDial = pts[pts.length - 1].y;
  const initDial = pts[0].y;
  const totalDialDiff = Math.abs(finalDial - initDial);

  // Jika tidak ada perubahan penurunan sama sekali
  if (totalDialDiff < 0.00001) {
    return {
      t90: 0,
      cv: 0,
      d0: initDial,
      d90: initDial,
      sqrtT90: 0,
      m1: 0,
      m2: 0,
      isTaylorFound: false
    };
  }

  // 1. ZONA LINIER AWAL (GARIS 1)
  // Ambil titik-titik pada rentang awal konsolidasi primer: t = 0.25 s/d 4 menit (√t = 0.5 s/d 2.0)
  const linearPts = pts.filter(p => p.x >= 0.45 && p.x <= 2.1);
  const usePts = linearPts.length >= 3 
    ? linearPts 
    : (pts.length >= 4 ? pts.slice(1, 5) : pts.slice(0, 3));

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const N = usePts.length;
  for (const p of usePts) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }
  const denom = N * sumX2 - sumX * sumX;
  
  let m1 = 0;
  let d0 = initDial;

  if (Math.abs(denom) > 1e-9) {
    m1 = (N * sumXY - sumX * sumY) / denom;
    d0 = (sumY - m1 * sumX) / N;
  } else if (usePts.length >= 2) {
    const pFirst = usePts[0];
    const pLast = usePts[usePts.length - 1];
    m1 = (pLast.y - pFirst.y) / (pLast.x - pFirst.x || 1);
    d0 = pFirst.y - m1 * pFirst.x;
  }

  // 2. GARIS TAYLOR 1.15x (GARIS 2)
  // Kemiringan Garis 2 adalah m1 / 1.15
  const m2 = Math.abs(m1) > 1e-9 ? (m1 / 1.15) : m1;

  // 3. CARI PERPOTONGAN GARIS 2 DENGAN KURVA LABORATORIUM
  // Sesuai kaidah Taylor: titik potong terjadi saat kurva mulai melandai menjauhi Garis 1 (U ≈ 90%)
  let sqrtT90 = 0;
  let d90 = 0;
  let isTaylorFound = false;

  const minLinearX = usePts[0]?.x || 0.5;
  const maxLinearX = usePts[usePts.length - 1]?.x || 2.0;
  const midLinearX = (minLinearX + maxLinearX) / 2;

  const candidates: { xStar: number; isFlattening: boolean; isAfterLinear: boolean }[] = [];

  for (let i = 0; i < pts.length - 1; i++) {
    const pA = pts[i];
    const pB = pts[i + 1];

    const dx = pB.x - pA.x;
    if (Math.abs(dx) < 1e-9) continue;

    const mSeg = (pB.y - pA.y) / dx;

    // Periksa apakah Garis 2 berpotongan dengan segmen (pA -> pB)
    if (Math.abs(m2 - mSeg) > 1e-9) {
      const xStar = (pA.y - mSeg * pA.x - d0) / (m2 - mSeg);

      // Pastikan titik potong berada di dalam rentang segmen ini
      if (xStar >= pA.x - 1e-4 && xStar <= pB.x + 1e-4 && xStar > 0) {
        const isFlattening = Math.abs(mSeg) <= Math.abs(m2) * 1.05;
        const isAfterLinear = xStar >= midLinearX;
        candidates.push({ xStar, isFlattening, isAfterLinear });
      }
    }
  }

  // Pilih kandidat perpotongan yang berada setelah zona linier di mana kurva melandai
  const postLinear = candidates.filter(c => c.isAfterLinear);
  if (postLinear.length > 0) {
    const flattening = postLinear.filter(c => c.isFlattening);
    sqrtT90 = flattening.length > 0 ? flattening[0].xStar : postLinear[0].xStar;
    d90 = d0 + m2 * sqrtT90;
    isTaylorFound = true;
  } else if (candidates.length > 0) {
    // Jika kurva sangat pendek, ambil kandidat terakhir
    const best = candidates[candidates.length - 1];
    sqrtT90 = best.xStar;
    d90 = d0 + m2 * sqrtT90;
    isTaylorFound = true;
  }

  // 4. FALLBACK JIKA KURVA BELUM BERPOTONGAN DENGAN GARIS 1.15x
  // (Misal pengujian baru sampai 15 menit, atau kurva belum melandai)
  if (!isTaylorFound || sqrtT90 <= 0 || isNaN(sqrtT90)) {
    const isDecreasing = finalDial < initDial;
    const targetD90 = d0 + 0.90 * (finalDial - d0);

    for (let i = 0; i < pts.length - 1; i++) {
      const pA = pts[i];
      const pB = pts[i + 1];
      const matches = isDecreasing
        ? (pA.y >= targetD90 && pB.y <= targetD90 && pA.y !== pB.y)
        : (pA.y <= targetD90 && pB.y >= targetD90 && pA.y !== pB.y);

      if (matches) {
        const frac = Math.abs(targetD90 - pA.y) / Math.abs(pB.y - pA.y);
        sqrtT90 = pA.x + frac * (pB.x - pA.x);
        d90 = targetD90;
        break;
      }
    }

    // Secondary fallback: rasio perpindahan kumulatif
    if (sqrtT90 <= 0 || isNaN(sqrtT90)) {
      const targetDisp = 0.90 * totalDialDiff;
      for (let i = 0; i < pts.length - 1; i++) {
        const pA = pts[i];
        const pB = pts[i + 1];
        const dispA = Math.abs(pA.y - initDial);
        const dispB = Math.abs(pB.y - initDial);
        if (dispA <= targetDisp && dispB >= targetDisp && dispB > dispA) {
          const frac = (targetDisp - dispA) / (dispB - dispA);
          sqrtT90 = pA.x + frac * (pB.x - pA.x);
          d90 = initDial + (finalDial > initDial ? targetDisp : -targetDisp);
          break;
        }
      }
    }

    // Default aman terakhir
    if (sqrtT90 <= 0 || isNaN(sqrtT90)) {
      sqrtT90 = Math.sqrt(90.0);
      d90 = initDial + 0.90 * (finalDial - initDial);
    }
  }

  // 5. HITUNG t90 DAN Cv
  const t90 = Math.pow(sqrtT90, 2);
  const Hdr = Math.max(0.1, (currentHeightCm || 2.0) / 2); // cm (double drainage)
  const cv = (t90 > 0 && !isNaN(t90)) ? (0.848 * Math.pow(Hdr, 2)) / (t90 * 60) : 0; // cm²/detik

  return {
    t90,
    cv,
    d0,
    d90,
    sqrtT90,
    m1,
    m2,
    isTaylorFound
  };
}
