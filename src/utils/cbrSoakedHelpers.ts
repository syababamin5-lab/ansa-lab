// =====================================================================
// TIMES® ANSA LIMS — CBR SOAKED (PERENDAMAN 4 HARI) (SNI 1744:2012 / ASTM D1883) HELPERS
// =====================================================================

export interface CBRSoakedSpecimenData {
  blows: number;            // 10, 25, 56
  moldCode: string;         // e.g. 'A', 'B', 'C'
  massWetSoilMould: number; // g (Sebelum perendaman)
  massWetSoilMouldAfter?: number; // g (Setelah perendaman 4 hari)
  massMould: number;        // g
  diaMould: number;         // mm
  heightMould: number;      // mm (Tinggi sampel awal h0, misal 116.43 mm)
  volMould: number;         // cm3 (misal 2124 cm3)
  
  // Moisture Content Before Soaking (Kadar Air Cetak)
  mcBefore: {
    containerCode: string;
    massWetContainer: number;
    massDryContainer: number;
    massContainer: number;
  };

  // Swell Readings Over 4 Days (96 Hours)
  swellData: {
    initialHeightMm: number; // 116.43 mm
    dial0h: number;   // Dial 0 Jam (Awal perendaman, mm)
    dial24h: number;  // Dial 24 Jam (Hari ke-1, mm)
    dial48h: number;  // Dial 48 Jam (Hari ke-2, mm)
    dial72h: number;  // Dial 72 Jam (Hari ke-3, mm)
    dial96h: number;  // Dial 96 Jam (Hari ke-4 / Akhir, mm)
  };
  
  // Moisture Content After Soaking (Kadar Air Setelah Perendaman 4 Hari)
  mcAfter: {
    containerCode: string;
    massWetContainer: number;
    massDryContainer: number;
    massContainer: number;
  };

  // Penetration Dial Readings (div)
  // Penetrations: [0.00, 0.0125, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5] inch
  dialReadings: number[];
}

export interface CBRSoakedFullData {
  compactionMethod: 'Standard Proctor' | 'Modified Proctor' | string;
  mdd: number;              // Mg/m3 or g/cm3 (misal 1.24)
  omc: number;              // % (misal 16.5)
  lrc: number;              // Lbf / div (misal 28.7926)
  pistonDiameterMm: number; // 49.63 mm
  pistonAreaSqInch: number; // 2.878 sq.in (19.35 cm2)
  targetPctDensity: number; // 95% atau 100%
  surchargeMassKg: number;  // Beban Surcharge (misal 4.54 kg / 10 lbs)
  soakingDurationDays: number; // 4 Hari (96 Jam)
  specimens: [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];
}

export const CBR_PENETRATION_DEPTHS = [
  { inch: 0.000,  mm: 0.0000, timeMin: 0.00 },
  { inch: 0.0125, mm: 0.3175, timeMin: 0.25 },
  { inch: 0.0250, mm: 0.6350, timeMin: 0.50 },
  { inch: 0.0500, mm: 1.2700, timeMin: 1.00 },
  { inch: 0.0750, mm: 1.9050, timeMin: 1.50 },
  { inch: 0.1000, mm: 2.5400, timeMin: 2.00 }, // Key Point 1 (0.1")
  { inch: 0.1500, mm: 3.8100, timeMin: 3.00 },
  { inch: 0.2000, mm: 5.0800, timeMin: 4.00 }, // Key Point 2 (0.2")
  { inch: 0.3000, mm: 7.6200, timeMin: 6.00 },
  { inch: 0.4000, mm: 10.160, timeMin: 8.00 },
  { inch: 0.5000, mm: 12.700, timeMin: 10.00 },
];

export const INITIAL_CBR_SOAKED_DATA: CBRSoakedFullData = {
  compactionMethod: '',
  mdd: 0,
  omc: 0,
  lrc: 28.7926,
  pistonDiameterMm: 49.63,
  pistonAreaSqInch: 2.878,
  targetPctDensity: 95,
  surchargeMassKg: 4.54,
  soakingDurationDays: 4,
  specimens: [
    {
      blows: 10,
      moldCode: 'A',
      massWetSoilMould: 0,
      massWetSoilMouldAfter: 0,
      massMould: 0,
      diaMould: 152.4,
      heightMould: 116.43,
      volMould: 2124,
      mcBefore: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      swellData: { initialHeightMm: 116.43, dial0h: 0, dial24h: 0, dial48h: 0, dial72h: 0, dial96h: 0 },
      mcAfter: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      dialReadings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      blows: 25,
      moldCode: 'B',
      massWetSoilMould: 0,
      massWetSoilMouldAfter: 0,
      massMould: 0,
      diaMould: 152.4,
      heightMould: 116.43,
      volMould: 2124,
      mcBefore: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      swellData: { initialHeightMm: 116.43, dial0h: 0, dial24h: 0, dial48h: 0, dial72h: 0, dial96h: 0 },
      mcAfter: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      dialReadings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      blows: 56,
      moldCode: 'C',
      massWetSoilMould: 0,
      massWetSoilMouldAfter: 0,
      massMould: 0,
      diaMould: 152.4,
      heightMould: 116.43,
      volMould: 2124,
      mcBefore: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      swellData: { initialHeightMm: 116.43, dial0h: 0, dial24h: 0, dial48h: 0, dial72h: 0, dial96h: 0 },
      mcAfter: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      dialReadings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
};

// ─── CALCULATION HELPERS FOR CBR SOAKED (SNI 1744:2012) ─────────────

export interface CalculatedCBRSoakedSpecimenResult {
  blows: number;
  massWetSoil: number;            // g (Sebelum Perendaman)
  massWetSoilAfter: number;       // g (Setelah Perendaman)
  bulkDensity: number;            // g/cm3 (Sebelum)
  bulkDensityAfter: number;       // g/cm3 (Setelah)
  massWaterBefore: number;        // g
  massDrySoilBefore: number;      // g
  mcBeforePct: number;            // % (Kadar Air Cetak)
  
  // Swell Results (SNI 1744:2012)
  deltaHSwelledMm: number;        // mm (dial96h - dial0h)
  swellPct: number;               // % (deltaH / h0 * 100)

  // MC After Soaking
  massWaterAfter: number;         // g
  massDrySoilAfter: number;       // g
  mcAfterPct: number;             // % (Kadar Air Setelah Soaking)
  
  dryDensity: number;             // g/cm3 (Sebelum Soaking)
  dryDensityAfter: number;        // g/cm3 (Setelah Soaking)
  
  penetrations: {
    inch: number;
    mm: number;
    dial: number;
    loadLbs: number;
    stressPsi: number;
    stressMpa: number;
  }[];
  
  cbr01Pct: number;               // CBR @ 0.1" (2.54 mm)
  cbr02Pct: number;               // CBR @ 0.2" (5.08 mm)
  selectedCbrPct: number;         // Selected CBR
}

export function calculateCBRSoakedSpecimen(
  spec: CBRSoakedSpecimenData,
  lrc: number,
  areaSqInch: number
): CalculatedCBRSoakedSpecimenResult {
  const massWetSoil = Math.max(0, spec.massWetSoilMould - spec.massMould);
  const bulkDensity = spec.volMould > 0 ? massWetSoil / spec.volMould : 0;

  const massWetSoilAfter = Math.max(0, (spec.massWetSoilMouldAfter || spec.massWetSoilMould) - spec.massMould);
  const bulkDensityAfter = spec.volMould > 0 ? massWetSoilAfter / spec.volMould : 0;

  // MC Before Soaking
  const massWaterBefore = Math.max(0, spec.mcBefore.massWetContainer - spec.mcBefore.massDryContainer);
  const massDrySoilBefore = Math.max(0, spec.mcBefore.massDryContainer - spec.mcBefore.massContainer);
  const mcBeforePct = massDrySoilBefore > 0 ? (massWaterBefore / massDrySoilBefore) * 100 : 0;

  // Swell Calculation (SNI 1744:2012)
  const initialH = spec.swellData?.initialHeightMm || spec.heightMould || 116.43;
  const dial0 = spec.swellData?.dial0h || 0;
  const dial96 = spec.swellData?.dial96h || 0;
  const deltaHSwelledMm = Math.max(0, dial96 - dial0);
  const swellPct = initialH > 0 ? (deltaHSwelledMm / initialH) * 100 : 0;

  // MC After Soaking
  const massWaterAfter = Math.max(0, spec.mcAfter.massWetContainer - spec.mcAfter.massDryContainer);
  const massDrySoilAfter = Math.max(0, spec.mcAfter.massDryContainer - spec.mcAfter.massContainer);
  const mcAfterPct = massDrySoilAfter > 0 ? (massWaterAfter / massDrySoilAfter) * 100 : 0;

  // Dry Density
  const dryDensity = bulkDensity / (1 + mcBeforePct / 100);
  const dryDensityAfter = bulkDensityAfter / (1 + (mcAfterPct > 0 ? mcAfterPct : mcBeforePct) / 100);

  // Penetrations
  let stressAt01 = 0;
  let stressAt02 = 0;

  const penetrations = CBR_PENETRATION_DEPTHS.map((depth, idx) => {
    const dial = spec.dialReadings[idx] || 0;
    const loadLbs = dial * lrc;
    const stressPsi = areaSqInch > 0 ? loadLbs / areaSqInch : 0;
    const stressMpa = stressPsi * 0.00689476;

    if (Math.abs(depth.inch - 0.100) < 0.001) {
      stressAt01 = stressPsi;
    }
    if (Math.abs(depth.inch - 0.200) < 0.001) {
      stressAt02 = stressPsi;
    }

    return {
      inch: depth.inch,
      mm: depth.mm,
      dial,
      loadLbs,
      stressPsi,
      stressMpa,
    };
  });

  // Standard loads in psi: 0.1" = 1000 psi, 0.2" = 1500 psi
  const cbr01Pct = (stressAt01 / 1000) * 100;
  const cbr02Pct = (stressAt02 / 1500) * 100;

  // According to SNI 1744:2012: Generally CBR 0.1" is used unless CBR 0.2" is higher
  const selectedCbrPct = cbr02Pct > cbr01Pct ? cbr02Pct : cbr01Pct;

  return {
    blows: spec.blows,
    massWetSoil,
    massWetSoilAfter,
    bulkDensity,
    bulkDensityAfter,
    massWaterBefore,
    massDrySoilBefore,
    mcBeforePct,
    deltaHSwelledMm,
    swellPct,
    massWaterAfter,
    massDrySoilAfter,
    mcAfterPct,
    dryDensity,
    dryDensityAfter,
    penetrations,
    cbr01Pct,
    cbr02Pct,
    selectedCbrPct,
  };
}

/** 2nd Order Polynomial Regression for Design CBR at Target Density */
export interface CBRSoakedRegressionResult {
  a: number; // x^2 coefficient
  b: number; // x coefficient
  c: number; // constant
  targetDensity: number; // e.g. 1.24
  designCbrPct: number;  // e.g. 14.85 -> 15%
  roundedDesignCbr: number; // 15
  avgSwellPct: number;      // Rata-rata % Swell dari 3 specimen
  points: { x: number; y: number }[];
}

export function calculateCBRSoakedRegression(
  specResults: CalculatedCBRSoakedSpecimenResult[],
  mdd: number,
  targetPct: number = 95
): CBRSoakedRegressionResult {
  const points = specResults.map(s => ({
    x: s.dryDensity,
    y: s.selectedCbrPct,
  }));

  const swells = specResults.map(s => s.swellPct);
  const avgSwellPct = swells.length > 0 ? swells.reduce((acc, v) => acc + v, 0) / swells.length : 0;

  const n = points.length;
  if (n < 3) {
    const avgY = points.reduce((acc, p) => acc + p.y, 0) / (n || 1);
    return {
      a: 0,
      b: 0,
      c: avgY,
      targetDensity: mdd * (targetPct / 100),
      designCbrPct: avgY,
      roundedDesignCbr: Math.round(avgY),
      avgSwellPct,
      points,
    };
  }

  // Linear / Quadratic regression for 3 points
  let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
  let sumY = 0, sumXY = 0, sumX2Y = 0;

  for (const p of points) {
    const x = p.x;
    const y = p.y;
    const x2 = x * x;
    sumX += x;
    sumX2 += x2;
    sumX3 += x2 * x;
    sumX4 += x2 * x2;
    sumY += y;
    sumXY += x * y;
    sumX2Y += x2 * y;
  }

  // 3x3 System of Linear Equations for a*x^2 + b*x + c = y
  // [sumX4 sumX3 sumX2] [a]   [sumX2Y]
  // [sumX3 sumX2 sumX ] [b] = [sumXY ]
  // [sumX2 sumX  n    ] [c]   [sumY  ]

  const det =
    sumX4 * (sumX2 * n - sumX * sumX) -
    sumX3 * (sumX3 * n - sumX * sumX2) +
    sumX2 * (sumX3 * sumX - sumX2 * sumX2);

  let a = 0, b = 0, c = 0;

  if (Math.abs(det) > 1e-12) {
    const detA =
      sumX2Y * (sumX2 * n - sumX * sumX) -
      sumX3 * (sumXY * n - sumX * sumY) +
      sumX2 * (sumXY * sumX - sumX2 * sumY);

    const detB =
      sumX4 * (sumXY * n - sumX * sumY) -
      sumX2Y * (sumX3 * n - sumX * sumX2) +
      sumX2 * (sumX3 * sumY - sumXY * sumX2);

    const detC =
      sumX4 * (sumX2 * sumY - sumXY * sumX) -
      sumX3 * (sumX3 * sumY - sumXY * sumX2) +
      sumX2Y * (sumX3 * sumX - sumX2 * sumX2);

    a = detA / det;
    b = detB / det;
    c = detC / det;
  } else {
    // Fallback to Linear regression: y = b*x + c
    const denom = n * sumX2 - sumX * sumX;
    b = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    c = (sumY - b * sumX) / n;
  }

  const targetDensity = mdd > 0 ? mdd * (targetPct / 100) : (points[1]?.x || 1.25);
  const designCbrPct = Math.max(0, a * targetDensity * targetDensity + b * targetDensity + c);

  return {
    a,
    b,
    c,
    targetDensity,
    designCbrPct,
    roundedDesignCbr: Math.round(designCbrPct),
    avgSwellPct,
    points,
  };
}
