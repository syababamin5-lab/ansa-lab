// =====================================================================
// TIMES® ANSA LIMS — CBR UNSOAKED (SNI 1744:2012 / ASTM D1883) HELPERS
// =====================================================================

export interface CBRSpecimenData {
  blows: number;            // 10, 25, 56
  moldCode: string;         // e.g. 'B'
  massWetSoilMould: number; // g
  massMould: number;        // g
  diaMould: number;         // mm
  heightMould: number;      // mm
  volMould: number;         // cm3
  
  // Moisture Content Before
  mcBefore: {
    containerCode: string;
    massWetContainer: number;
    massDryContainer: number;
    massContainer: number;
  };
  
  // Moisture Content After
  mcAfter: {
    containerCode: string;
    massWetContainer: number;
    massDryContainer: number;
    massContainer: number;
  };

  // Penetration Dial Readings (div)
  // Penetrations: [0.00, 0.0125, 0.025, 0.05, 0.075, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5]
  dialReadings: number[];
}

export interface CBRUnsoakedFullData {
  compactionMethod: 'Standard Proctor' | 'Modified Proctor';
  mdd: number;              // Mg/m3 or g/cm3 (e.g., 1.24)
  omc: number;              // % (e.g., 16.5)
  lrc: number;              // Lbf / div (e.g., 28.7926)
  pistonDiameterMm: number; // 49.63 mm
  pistonAreaSqInch: number; // 2.878 sq.in (19.35 cm2)
  targetPctDensity: number; // e.g. 100%
  specimens: [CBRSpecimenData, CBRSpecimenData, CBRSpecimenData];
}

export const CBR_PENETRATION_DEPTHS = [
  { inch: 0.000,  mm: 0.0000, timeMin: 0.00 },
  { inch: 0.0125, mm: 0.3175, timeMin: 0.25 },
  { inch: 0.0250, mm: 0.6350, timeMin: 0.50 },
  { inch: 0.0500, mm: 1.2700, timeMin: 1.00 },
  { inch: 0.0750, mm: 1.9050, timeMin: 1.50 },
  { inch: 0.1000, mm: 2.5400, timeMin: 2.00 }, // Key Point 1
  { inch: 0.1500, mm: 3.8100, timeMin: 3.00 },
  { inch: 0.2000, mm: 5.0800, timeMin: 4.00 }, // Key Point 2
  { inch: 0.3000, mm: 7.6200, timeMin: 6.00 },
  { inch: 0.4000, mm: 10.160, timeMin: 8.00 },
  { inch: 0.5000, mm: 12.700, timeMin: 10.00 },
];

export const INITIAL_CBR_UNSOAKED_DATA: CBRUnsoakedFullData = {
  compactionMethod: '',
  mdd: 0,
  omc: 0,
  lrc: 28.7926,
  pistonDiameterMm: 49.63,
  pistonAreaSqInch: 2.878,
  targetPctDensity: 100,
  specimens: [
    {
      blows: 10,
      moldCode: '',
      massWetSoilMould: 0,
      massMould: 0,
      diaMould: 0,
      heightMould: 0,
      volMould: 0,
      mcBefore: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      mcAfter: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      dialReadings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      blows: 25,
      moldCode: '',
      massWetSoilMould: 0,
      massMould: 0,
      diaMould: 0,
      heightMould: 0,
      volMould: 0,
      mcBefore: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      mcAfter: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      dialReadings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      blows: 56,
      moldCode: '',
      massWetSoilMould: 0,
      massMould: 0,
      diaMould: 0,
      heightMould: 0,
      volMould: 0,
      mcBefore: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      mcAfter: { containerCode: '', massWetContainer: 0, massDryContainer: 0, massContainer: 0 },
      dialReadings: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  ],
};

// ─── CALCULATION HELPERS ─────────────────────────────────────────────

export interface CalculatedSpecimenResult {
  blows: number;
  massWetSoil: number;         // g (Before)
  massWetSoilAfter: number;    // g (After)
  bulkDensity: number;         // g/cm3 (Before)
  bulkDensityAfter: number;    // g/cm3 (After)
  massWaterBefore: number;     // g
  massDrySoilBefore: number;   // g
  mcBeforePct: number;         // %
  massWaterAfter: number;      // g
  massDrySoilAfter: number;    // g
  mcAfterPct: number;          // %
  dryDensity: number;          // g/cm3 (Before)
  dryDensityAfter: number;     // g/cm3 (After)
  penetrations: {
    inch: number;
    mm: number;
    dial: number;
    loadLbs: number;
    stressPsi: number;
    stressMpa: number;
  }[];
  cbr01Pct: number;        // CBR @ 0.1" (2.54 mm)
  cbr02Pct: number;        // CBR @ 0.2" (5.08 mm)
  selectedCbrPct: number;  // Selected CBR
}

export function calculateCBRSpecimen(
  spec: CBRSpecimenData,
  lrc: number,
  areaSqInch: number
): CalculatedSpecimenResult {
  const massWetSoil = Math.max(0, spec.massWetSoilMould - spec.massMould);
  const bulkDensity = spec.volMould > 0 ? massWetSoil / spec.volMould : 0;

  const massWetSoilAfter = Math.max(0, (spec.massWetSoilMouldAfter || spec.massWetSoilMould) - spec.massMould);
  const bulkDensityAfter = spec.volMould > 0 ? massWetSoilAfter / spec.volMould : 0;

  // MC Before
  const massWaterBefore = Math.max(0, spec.mcBefore.massWetContainer - spec.mcBefore.massDryContainer);
  const massDrySoilBefore = Math.max(0, spec.mcBefore.massDryContainer - spec.mcBefore.massContainer);
  const mcBeforePct = massDrySoilBefore > 0 ? (massWaterBefore / massDrySoilBefore) * 100 : 0;

  // MC After
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
export interface CBRRegressionResult {
  a: number; // x^2 coefficient
  b: number; // x coefficient
  c: number; // constant
  targetDensity: number; // e.g. 1.24
  designCbrPct: number;  // e.g. 30.68 -> 31%
  roundedDesignCbr: number; // 31
  points: { x: number; y: number }[];
}

export function calculateCBRRegression(
  specResults: CalculatedSpecimenResult[],
  mdd: number,
  targetPct: number = 100
): CBRRegressionResult {
  const points = specResults.map(s => ({
    x: s.dryDensity,
    y: s.selectedCbrPct,
  }));

  // Quadratic regression: y = a*x^2 + b*x + c
  // Solve normal equations [N, Σx, Σx2; Σx, Σx2, Σx3; Σx2, Σx3, Σx4] * [c, b, a]^T = [Σy, Σxy, Σx2y]^T
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
      points,
    };
  }

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

  // 3x3 System Matrix
  const A = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4],
  ];
  const B = [sumY, sumXY, sumX2Y];

  // Matrix Inversion 3x3 (Cramer's rule or Gaussian elimination)
  const detA =
    A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
    A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
    A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

  let a = 0, b = 0, c = 0;

  if (Math.abs(detA) > 1e-9) {
    const detC =
      B[0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (B[1] * A[2][2] - A[1][2] * B[2]) +
      A[0][2] * (B[1] * A[2][1] - A[1][1] * B[2]);

    const detB =
      A[0][0] * (B[1] * A[2][2] - A[1][2] * B[2]) -
      B[0] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * B[2] - B[1] * A[2][0]);

    const detA_coef =
      A[0][0] * (A[1][1] * B[2] - B[1] * A[2][1]) -
      A[0][1] * (A[1][0] * B[2] - B[1] * A[2][0]) +
      B[0] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

    c = detC / detA;
    b = detB / detA;
    a = detA_coef / detA;
  } else {
    // Fallback Linear
    const slope = (points[2].y - points[0].y) / (points[2].x - points[0].x || 1);
    b = slope;
    c = points[0].y - slope * points[0].x;
    a = 0;
  }

  const targetDensity = mdd * (targetPct / 100);
  const designCbrPct = a * targetDensity * targetDensity + b * targetDensity + c;
  const roundedDesignCbr = Math.round(designCbrPct);

  return {
    a,
    b,
    c,
    targetDensity,
    designCbrPct,
    roundedDesignCbr,
    points,
  };
}
