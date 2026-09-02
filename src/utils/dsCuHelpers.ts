/**
 * DS CU (Direct Shear Consolidated Undrained) Helper Functions
 * Based on SNI 2813:2008 & ASTM D3080 (Modified for Consolidated Undrained Direct Shear)
 */

export interface DSCuMoistureData {
  containerCode?: string;
  massWetContainer?: number;
  massDryContainer?: number;
  massContainer?: number;
  moistureContentPct?: number;
}

export interface DSCuShearReading {
  dialHorizontalMm: number; // e.g. 0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0
  dialVerticalMm?: number;
  provingRingDiv: number;  // Proving ring reading (div)
}

export interface CalculatedDSCuReading {
  dialHorizontalMm: number;
  dialVerticalMm: number;
  provingRingDiv: number;
  loadKg: number;
  shearStressKgCm2: number;
  shearStressKpa: number;
}

export interface DSCuSpecimenData {
  specimenIndex: number; // 0, 1, 2
  normalLoadKg: number;  // Normal load applied (e.g. 0.5, 1.0, 2.0 kg/cm2)
  specimenCode?: string;
  ringCode?: string;
  diameterCm: number;    // Default 6.0 cm
  heightCm: number;      // Default 2.0 cm
  areaCm2: number;       // Default 28.274 cm2
  volumeCm3: number;     // Default 56.549 cm3
  massRingGrams?: number;
  massWetSoilRingGrams?: number;
  mcBefore: DSCuMoistureData;
  mcAfter: DSCuMoistureData;
  readings: DSCuShearReading[];
}

export interface DSCuFullData {
  lrc: number; // Load Ring Constant (kg/div), e.g. 0.150
  horizontalDialFactor?: number; // mm per div, default 0.01
  specimens: [DSCuSpecimenData, DSCuSpecimenData, DSCuSpecimenData];
}

export interface CalculatedDSCuSpecimenResult {
  specimenIndex: number;
  normalStressKgCm2: number;
  normalStressKpa: number;
  wetDensity: number;
  dryDensity: number;
  mcBeforePct: number;
  mcAfterPct: number;
  readings: CalculatedDSCuReading[];
  peakShearStressKgCm2: number;
  peakShearStressKpa: number;
  peakDisplacementMm: number;
}

export interface DSCuRegressionResult {
  cohesionCcu: number;     // c_cu (kg/cm²)
  cohesionCcuKpa: number;  // c_cu (kPa)
  frictionAnglePhicu: number; // φ_cu (degrees)
  slope: number;           // tan(φ_cu)
  rSquared: number;        // R² goodness of fit
  points: Array<{ normalStress: number; peakShearStress: number; specimenIndex: number }>;
}

export const STANDARD_DS_SHEAR_DISPLACEMENTS = [
  0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0
];

export const INITIAL_DS_CU_DATA: DSCuFullData = {
  lrc: 0.150,
  horizontalDialFactor: 0.01,
  specimens: [
    {
      specimenIndex: 0,
      normalLoadKg: 0.50,
      specimenCode: "Titik 1",
      ringCode: "R-01",
      diameterCm: 6.0,
      heightCm: 2.0,
      areaCm2: 28.274,
      volumeCm3: 56.549,
      massRingGrams: 110.5,
      massWetSoilRingGrams: 205.2,
      mcBefore: { containerCode: "C-01", massWetContainer: 45.2, massDryContainer: 40.1, massContainer: 12.5 },
      mcAfter: { containerCode: "C-04", massWetContainer: 48.5, massDryContainer: 42.0, massContainer: 12.5 },
      readings: STANDARD_DS_SHEAR_DISPLACEMENTS.map(disp => ({ dialHorizontalMm: disp, dialVerticalMm: 0, provingRingDiv: 0 })),
    },
    {
      specimenIndex: 1,
      normalLoadKg: 1.00,
      specimenCode: "Titik 2",
      ringCode: "R-02",
      diameterCm: 6.0,
      heightCm: 2.0,
      areaCm2: 28.274,
      volumeCm3: 56.549,
      massRingGrams: 111.0,
      massWetSoilRingGrams: 206.8,
      mcBefore: { containerCode: "C-02", massWetContainer: 46.0, massDryContainer: 40.8, massContainer: 12.6 },
      mcAfter: { containerCode: "C-05", massWetContainer: 49.0, massDryContainer: 42.5, massContainer: 12.6 },
      readings: STANDARD_DS_SHEAR_DISPLACEMENTS.map(disp => ({ dialHorizontalMm: disp, dialVerticalMm: 0, provingRingDiv: 0 })),
    },
    {
      specimenIndex: 2,
      normalLoadKg: 2.00,
      specimenCode: "Titik 3",
      ringCode: "R-03",
      diameterCm: 6.0,
      heightCm: 2.0,
      areaCm2: 28.274,
      volumeCm3: 56.549,
      massRingGrams: 110.8,
      massWetSoilRingGrams: 208.5,
      mcBefore: { containerCode: "C-03", massWetContainer: 47.1, massDryContainer: 41.5, massContainer: 12.4 },
      mcAfter: { containerCode: "C-06", massWetContainer: 50.2, massDryContainer: 43.1, massContainer: 12.4 },
      readings: STANDARD_DS_SHEAR_DISPLACEMENTS.map(disp => ({ dialHorizontalMm: disp, dialVerticalMm: 0, provingRingDiv: 0 })),
    },
  ],
};

/**
 * Calculates physical properties and shear stresses for a single DS CU specimen
 */
export function calculateDSCuSpecimen(
  sp: DSCuSpecimenData,
  lrc: number
): CalculatedDSCuSpecimenResult {
  const diameterCm = sp.diameterCm || 6.0;
  const heightCm = sp.heightCm || 2.0;
  const areaCm2 = sp.areaCm2 || (Math.PI / 4) * Math.pow(diameterCm, 2);
  const volumeCm3 = sp.volumeCm3 || areaCm2 * heightCm;

  // Moisture Content Before Consolidation (w1)
  let mcBeforePct = sp.mcBefore.moistureContentPct || 0;
  if (sp.mcBefore.massWetContainer && sp.mcBefore.massDryContainer && sp.mcBefore.massContainer) {
    const wetW = sp.mcBefore.massWetContainer - sp.mcBefore.massContainer;
    const dryW = sp.mcBefore.massDryContainer - sp.mcBefore.massContainer;
    if (dryW > 0) {
      mcBeforePct = ((wetW - dryW) / dryW) * 100;
    }
  }

  // Moisture Content After Consolidation & Shear (w2)
  let mcAfterPct = sp.mcAfter.moistureContentPct || 0;
  if (sp.mcAfter.massWetContainer && sp.mcAfter.massDryContainer && sp.mcAfter.massContainer) {
    const wetW = sp.mcAfter.massWetContainer - sp.mcAfter.massContainer;
    const dryW = sp.mcAfter.massDryContainer - sp.mcAfter.massContainer;
    if (dryW > 0) {
      mcAfterPct = ((wetW - dryW) / dryW) * 100;
    }
  }

  // Wet & Dry Density
  let wetDensity = 0;
  let dryDensity = 0;
  if (sp.massWetSoilRingGrams && sp.massRingGrams && volumeCm3 > 0) {
    const wetSoilGrams = sp.massWetSoilRingGrams - sp.massRingGrams;
    if (wetSoilGrams > 0) {
      wetDensity = wetSoilGrams / volumeCm3;
      dryDensity = wetDensity / (1 + mcBeforePct / 100);
    }
  }

  // Normal Stress
  const normalStressKgCm2 = sp.normalLoadKg > 0 && areaCm2 > 0 ? sp.normalLoadKg / areaCm2 : sp.normalLoadKg;
  const normalStressKpa = normalStressKgCm2 * 98.0665;

  // Process Shear Readings
  const calculatedReadings: CalculatedDSCuReading[] = (sp.readings || []).map(r => {
    const loadKg = (r.provingRingDiv || 0) * lrc;
    const shearStressKgCm2 = areaCm2 > 0 ? loadKg / areaCm2 : 0;
    const shearStressKpa = shearStressKgCm2 * 98.0665;

    return {
      dialHorizontalMm: r.dialHorizontalMm,
      dialVerticalMm: r.dialVerticalMm || 0,
      provingRingDiv: r.provingRingDiv || 0,
      loadKg,
      shearStressKgCm2,
      shearStressKpa,
    };
  });

  // Find Peak Shear Stress (tau_f)
  let peakShearStressKgCm2 = 0;
  let peakDisplacementMm = 0;
  calculatedReadings.forEach(cr => {
    if (cr.shearStressKgCm2 > peakShearStressKgCm2) {
      peakShearStressKgCm2 = cr.shearStressKgCm2;
      peakDisplacementMm = cr.dialHorizontalMm;
    }
  });

  const peakShearStressKpa = peakShearStressKgCm2 * 98.0665;

  return {
    specimenIndex: sp.specimenIndex,
    normalStressKgCm2,
    normalStressKpa,
    wetDensity,
    dryDensity,
    mcBeforePct,
    mcAfterPct,
    readings: calculatedReadings,
    peakShearStressKgCm2,
    peakShearStressKpa,
    peakDisplacementMm,
  };
}

/**
 * Calculates Mohr-Coulomb Linear Regression (y = mx + c) for DS CU (c_cu and φ_cu)
 */
export function calculateDSCuRegression(
  specResults: CalculatedDSCuSpecimenResult[]
): DSCuRegressionResult {
  const validPoints = specResults
    .filter(s => s.normalStressKgCm2 > 0 && s.peakShearStressKgCm2 > 0)
    .map(s => ({
      normalStress: s.normalStressKgCm2,
      peakShearStress: s.peakShearStressKgCm2,
      specimenIndex: s.specimenIndex,
    }));

  if (validPoints.length < 2) {
    // Default fallback if insufficient data
    return {
      cohesionCcu: 0,
      cohesionCcuKpa: 0,
      frictionAnglePhicu: 0,
      slope: 0,
      rSquared: 0,
      points: validPoints,
    };
  }

  const N = validPoints.length;
  const sumX = validPoints.reduce((acc, p) => acc + p.normalStress, 0);
  const sumY = validPoints.reduce((acc, p) => acc + p.peakShearStress, 0);
  const sumXY = validPoints.reduce((acc, p) => acc + p.normalStress * p.peakShearStress, 0);
  const sumX2 = validPoints.reduce((acc, p) => acc + Math.pow(p.normalStress, 2), 0);
  const sumY2 = validPoints.reduce((acc, p) => acc + Math.pow(p.peakShearStress, 2), 0);

  const denom = N * sumX2 - Math.pow(sumX, 2);
  let slope = 0;
  let intercept = 0;

  if (Math.abs(denom) > 1e-9) {
    slope = (N * sumXY - sumX * sumY) / denom;
    intercept = (sumY - slope * sumX) / N;
  } else {
    slope = 0;
    intercept = sumY / N;
  }

  // Cohesion must be non-negative in soil mechanics practice
  const cohesionCcu = Math.max(0, intercept);
  const cohesionCcuKpa = cohesionCcu * 98.0665;

  // Friction angle φ_cu = arctan(slope) in degrees
  const angleRad = Math.atan(Math.max(0, slope));
  const frictionAnglePhicu = (angleRad * 180) / Math.PI;

  // R² Goodness of Fit
  let rSquared = 0;
  const totalSS = sumY2 - Math.pow(sumY, 2) / N;
  if (totalSS > 1e-9) {
    const resSS = validPoints.reduce((acc, p) => {
      const predY = slope * p.normalStress + intercept;
      return acc + Math.pow(p.peakShearStress - predY, 2);
    }, 0);
    rSquared = Math.max(0, Math.min(1, 1 - resSS / totalSS));
  }

  return {
    cohesionCcu: Number(cohesionCcu.toFixed(4)),
    cohesionCcuKpa: Number(cohesionCcuKpa.toFixed(2)),
    frictionAnglePhicu: Number(frictionAnglePhicu.toFixed(2)),
    slope: Number(slope.toFixed(4)),
    rSquared: Number(rSquared.toFixed(4)),
    points: validPoints,
  };
}
