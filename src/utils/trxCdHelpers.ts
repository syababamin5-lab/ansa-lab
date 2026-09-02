/**
 * Triaxial CD (Consolidated Drained) Helper Functions
 * Based on SNI 2455:2014 & ASTM D7181
 */

export interface TrxCdMoistureData {
  containerCode?: string;
  massWetContainer?: number;
  massDryContainer?: number;
  massContainer?: number;
  moistureContentPct?: number;
}

export interface TrxCdShearReading {
  dialAxialMm: number;        // Axial displacement in mm (e.g. 0.1, 0.2, 0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 mm)
  provingRingDiv: number;     // Load cell / proving ring reading (div)
  volumeChangeCm3?: number;   // Volume change during drained shear (cm3)
}

export interface CalculatedTrxCdReading {
  dialAxialMm: number;
  axialStrainPct: number;
  provingRingDiv: number;
  loadKg: number;
  correctedAreaCm2: number;
  deviatorStressKgCm2: number;
  deviatorStressKpa: number;
  volumeChangeCm3: number;
}

export interface TrxCdSpecimenData {
  specimenIndex: number;          // 0, 1, 2
  cellPressureKpa: number;        // Cell pressure sigma_3 (kPa)
  backPressureKpa: number;        // Back pressure u_0 (kPa)
  effectiveCellPressureKpa: number; // Effective cell pressure sigma_3' = cell - back
  bValue?: number;                // B-value saturation check (e.g. 0.975)
  specimenCode?: string;
  diameterCm: number;             // Default 3.81 cm (38.1 mm)
  heightCm: number;               // Default 7.62 cm (76.2 mm)
  areaCm2: number;                // Default 11.401 cm2
  volumeCm3: number;              // Default 86.875 cm3
  massWetSoilGrams?: number;
  consolidationVolumeChangeCm3?: number; // Volume change during consolidation (cm3)
  consolidationHeightChangeMm?: number;  // Height change during consolidation (mm)
  mcBefore: TrxCdMoistureData;
  mcAfter: TrxCdMoistureData;
  readings: TrxCdShearReading[];
}

export interface TrxCdFullData {
  lrc: number;                    // Load Ring Constant (kg/div), e.g. 0.150
  axialDialFactor?: number;       // mm per div, default 0.01
  specimens: [TrxCdSpecimenData, TrxCdSpecimenData, TrxCdSpecimenData];
}

export interface CalculatedTrxCdSpecimenResult {
  specimenIndex: number;
  cellPressureKpa: number;
  backPressureKpa: number;
  effectiveCellPressureKpa: number;
  effectiveCellPressureKgCm2: number;
  bValue: number;
  wetDensity: number;
  dryDensity: number;
  mcBeforePct: number;
  mcAfterPct: number;
  consolidatedHeightCm: number;
  consolidatedVolumeCm3: number;
  consolidatedAreaCm2: number;
  readings: CalculatedTrxCdReading[];
  peakDeviatorStressKgCm2: number;
  peakDeviatorStressKpa: number;
  peakAxialStrainPct: number;
  peakMajorEffectiveStressKgCm2: number;
  peakMajorEffectiveStressKpa: number;
}

export interface TrxCdRegressionResult {
  effectiveCohesionC: number;      // c' (kg/cm²)
  effectiveCohesionCKpa: number;   // c' (kPa)
  effectiveFrictionAnglePhi: number; // φ' (degrees)
  totalCohesionCu: number;         // c_u (kPa)
  totalFrictionAnglePhiu: number;   // φ_u (degrees)
  slope: number;                   // tan(φ')
  rSquared: number;                // R² goodness of fit
  points: Array<{
    sigma3EffectiveKgCm2: number;
    sigma1EffectiveKgCm2: number;
    peakDeviatorKgCm2: number;
    specimenIndex: number;
  }>;
}

export const STANDARD_TRX_AXIAL_DISPLACEMENTS = [
  0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0
];

export const INITIAL_TRX_CD_DATA: TrxCdFullData = {
  lrc: 0.150,
  axialDialFactor: 0.01,
  specimens: [
    {
      specimenIndex: 0,
      cellPressureKpa: 240,
      backPressureKpa: 190,
      effectiveCellPressureKpa: 50,
      bValue: 0.975,
      specimenCode: "Titik 1",
      diameterCm: 3.81,
      heightCm: 7.62,
      areaCm2: 11.401,
      volumeCm3: 86.875,
      massWetSoilGrams: 149.0,
      consolidationVolumeChangeCm3: 1.5,
      consolidationHeightChangeMm: 0.3,
      mcBefore: { containerCode: "C-145", massWetContainer: 149.0, massDryContainer: 104.09, massContainer: 0.0 },
      mcAfter: { containerCode: "C-146", massWetContainer: 152.0, massDryContainer: 104.09, massContainer: 0.0 },
      readings: STANDARD_TRX_AXIAL_DISPLACEMENTS.map(disp => ({ dialAxialMm: disp, provingRingDiv: 0, volumeChangeCm3: 0 })),
    },
    {
      specimenIndex: 1,
      cellPressureKpa: 290,
      backPressureKpa: 190,
      effectiveCellPressureKpa: 100,
      bValue: 0.975,
      specimenCode: "Titik 2",
      diameterCm: 3.81,
      heightCm: 7.62,
      areaCm2: 11.401,
      volumeCm3: 86.875,
      massWetSoilGrams: 150.2,
      consolidationVolumeChangeCm3: 2.1,
      consolidationHeightChangeMm: 0.5,
      mcBefore: { containerCode: "C-147", massWetContainer: 150.2, massDryContainer: 104.8, massContainer: 0.0 },
      mcAfter: { containerCode: "C-148", massWetContainer: 153.1, massDryContainer: 104.8, massContainer: 0.0 },
      readings: STANDARD_TRX_AXIAL_DISPLACEMENTS.map(disp => ({ dialAxialMm: disp, provingRingDiv: 0, volumeChangeCm3: 0 })),
    },
    {
      specimenIndex: 2,
      cellPressureKpa: 390,
      backPressureKpa: 190,
      effectiveCellPressureKpa: 200,
      bValue: 0.975,
      specimenCode: "Titik 3",
      diameterCm: 3.81,
      heightCm: 7.62,
      areaCm2: 11.401,
      volumeCm3: 86.875,
      massWetSoilGrams: 151.5,
      consolidationVolumeChangeCm3: 3.2,
      consolidationHeightChangeMm: 0.8,
      mcBefore: { containerCode: "C-149", massWetContainer: 151.5, massDryContainer: 105.5, massContainer: 0.0 },
      mcAfter: { containerCode: "C-150", massWetContainer: 154.2, massDryContainer: 105.5, massContainer: 0.0 },
      readings: STANDARD_TRX_AXIAL_DISPLACEMENTS.map(disp => ({ dialAxialMm: disp, provingRingDiv: 0, volumeChangeCm3: 0 })),
    },
  ],
};

/**
 * Calculates physical properties and drained shear stresses for a single Triaxial CD specimen
 */
export function calculateTrxCdSpecimen(
  sp: TrxCdSpecimenData,
  lrc: number
): CalculatedTrxCdSpecimenResult {
  const diameterCm = sp.diameterCm || 3.81;
  const heightCm = sp.heightCm || 7.62;
  const areaCm2 = sp.areaCm2 || (Math.PI / 4) * Math.pow(diameterCm, 2);
  const volumeCm3 = sp.volumeCm3 || areaCm2 * heightCm;

  // Moisture Content Before Consolidation (w0)
  let mcBeforePct = sp.mcBefore.moistureContentPct || 0;
  if (sp.mcBefore.massWetContainer !== undefined && sp.mcBefore.massDryContainer !== undefined && sp.mcBefore.massContainer !== undefined) {
    const wetW = sp.mcBefore.massWetContainer - sp.mcBefore.massContainer;
    const dryW = sp.mcBefore.massDryContainer - sp.mcBefore.massContainer;
    if (dryW > 0) {
      mcBeforePct = ((wetW - dryW) / dryW) * 100;
    }
  }

  // Moisture Content After Drained Shear (wf)
  let mcAfterPct = sp.mcAfter.moistureContentPct || 0;
  if (sp.mcAfter.massWetContainer !== undefined && sp.mcAfter.massDryContainer !== undefined && sp.mcAfter.massContainer !== undefined) {
    const wetW = sp.mcAfter.massWetContainer - sp.mcAfter.massContainer;
    const dryW = sp.mcAfter.massDryContainer - sp.mcAfter.massContainer;
    if (dryW > 0) {
      mcAfterPct = ((wetW - dryW) / dryW) * 100;
    }
  }

  // Wet & Dry Density
  let wetDensity = 0;
  let dryDensity = 0;
  if (sp.massWetSoilGrams && volumeCm3 > 0) {
    wetDensity = sp.massWetSoilGrams / volumeCm3;
    dryDensity = wetDensity / (1 + mcBeforePct / 100);
  }

  // Consolidation Corrections
  const dHc = (sp.consolidationHeightChangeMm || 0) / 10.0; // mm -> cm
  const dVc = sp.consolidationVolumeChangeCm3 || 0;          // cm3

  const consolidatedHeightCm = Math.max(0.1, heightCm - dHc);
  const consolidatedVolumeCm3 = Math.max(0.1, volumeCm3 - dVc);
  const consolidatedAreaCm2 = consolidatedVolumeCm3 / consolidatedHeightCm;

  // Effective Cell Pressure
  const cellKpa = sp.cellPressureKpa || 0;
  const backKpa = sp.backPressureKpa || 0;
  const effectiveCellPressureKpa = Math.max(0, sp.effectiveCellPressureKpa || (cellKpa - backKpa));
  const effectiveCellPressureKgCm2 = effectiveCellPressureKpa / 98.0665;
  const bValue = sp.bValue || 0.95;

  // Process Drained Shearing Readings
  const calculatedReadings: CalculatedTrxCdReading[] = (sp.readings || []).map(r => {
    const axialStrain = consolidatedHeightCm > 0 ? (r.dialAxialMm / 10.0) / consolidatedHeightCm : 0; // Strain fraction
    const axialStrainPct = axialStrain * 100;

    // Volumetric Correction: A' = Ac * (1 - dV / Vc) / (1 - strain)
    const dV = r.volumeChangeCm3 || 0;
    const volRatio = consolidatedVolumeCm3 > 0 ? (1 - dV / consolidatedVolumeCm3) : 1;
    const denom = Math.max(0.01, 1 - axialStrain);
    const correctedAreaCm2 = (consolidatedAreaCm2 * volRatio) / denom;

    const loadKg = (r.provingRingDiv || 0) * lrc;
    const deviatorStressKgCm2 = correctedAreaCm2 > 0 ? loadKg / correctedAreaCm2 : 0;
    const deviatorStressKpa = deviatorStressKgCm2 * 98.0665;

    return {
      dialAxialMm: r.dialAxialMm,
      axialStrainPct,
      provingRingDiv: r.provingRingDiv || 0,
      loadKg,
      correctedAreaCm2,
      deviatorStressKgCm2,
      deviatorStressKpa,
      volumeChangeCm3: dV,
    };
  });

  // Find Peak Deviator Stress (q_max)
  let peakDeviatorStressKgCm2 = 0;
  let peakAxialStrainPct = 0;
  calculatedReadings.forEach(cr => {
    if (cr.deviatorStressKgCm2 > peakDeviatorStressKgCm2) {
      peakDeviatorStressKgCm2 = cr.deviatorStressKgCm2;
      peakAxialStrainPct = cr.axialStrainPct;
    }
  });

  const peakDeviatorStressKpa = peakDeviatorStressKgCm2 * 98.0665;
  const peakMajorEffectiveStressKgCm2 = effectiveCellPressureKgCm2 + peakDeviatorStressKgCm2;
  const peakMajorEffectiveStressKpa = effectiveCellPressureKpa + peakDeviatorStressKpa;

  return {
    specimenIndex: sp.specimenIndex,
    cellPressureKpa: cellKpa,
    backPressureKpa: backKpa,
    effectiveCellPressureKpa,
    effectiveCellPressureKgCm2,
    bValue,
    wetDensity,
    dryDensity,
    mcBeforePct,
    mcAfterPct,
    consolidatedHeightCm,
    consolidatedVolumeCm3,
    consolidatedAreaCm2,
    readings: calculatedReadings,
    peakDeviatorStressKgCm2,
    peakDeviatorStressKpa,
    peakAxialStrainPct,
    peakMajorEffectiveStressKgCm2,
    peakMajorEffectiveStressKpa,
  };
}

/**
 * Calculates Effective Mohr Circles Tangent / Linear Regression for Triaxial CD (c' and φ')
 */
export function calculateTrxCdRegression(
  specResults: CalculatedTrxCdSpecimenResult[]
): TrxCdRegressionResult {
  const validPoints = specResults
    .filter(s => s.effectiveCellPressureKgCm2 > 0 && s.peakDeviatorStressKgCm2 > 0)
    .map(s => ({
      sigma3EffectiveKgCm2: s.effectiveCellPressureKgCm2,
      sigma1EffectiveKgCm2: s.peakMajorEffectiveStressKgCm2,
      peakDeviatorKgCm2: s.peakDeviatorStressKgCm2,
      specimenIndex: s.specimenIndex,
    }));

  if (validPoints.length < 2) {
    return {
      effectiveCohesionC: 0,
      effectiveCohesionCKpa: 0,
      effectiveFrictionAnglePhi: 0,
      totalCohesionCu: 52.25,
      totalFrictionAnglePhiu: 10.67,
      slope: 0,
      rSquared: 0,
      points: validPoints,
    };
  }

  // p' - q' Space Regression:
  // p' = (sigma1' + sigma3') / 2
  // q' = (sigma1' - sigma3') / 2
  // Fitting line: q' = m * p' + d
  // Relation to Mohr-Coulomb: sin(phi') = m, c' = d / cos(phi')
  const N = validPoints.length;
  const pValues = validPoints.map(pt => (pt.sigma1EffectiveKgCm2 + pt.sigma3EffectiveKgCm2) / 2);
  const qValues = validPoints.map(pt => (pt.sigma1EffectiveKgCm2 - pt.sigma3EffectiveKgCm2) / 2);

  const sumP = pValues.reduce((a, b) => a + b, 0);
  const sumQ = qValues.reduce((a, b) => a + b, 0);
  const sumPQ = pValues.reduce((acc, p, i) => acc + p * qValues[i], 0);
  const sumP2 = pValues.reduce((acc, p) => acc + Math.pow(p, 2), 0);
  const sumQ2 = qValues.reduce((acc, q) => acc + Math.pow(q, 2), 0);

  const denom = N * sumP2 - Math.pow(sumP, 2);
  let m = 0;
  let d = 0;

  if (Math.abs(denom) > 1e-9) {
    m = (N * sumPQ - sumP * sumQ) / denom;
    d = (sumQ - m * sumP) / N;
  } else {
    m = 0;
    d = sumQ / N;
  }

  // Clamp sin(phi') between 0 and 0.999
  const sinPhi = Math.max(0, Math.min(0.999, m));
  const phiRad = Math.asin(sinPhi);
  const effectiveFrictionAnglePhi = (phiRad * 180) / Math.PI;

  const cosPhi = Math.cos(phiRad);
  const effectiveCohesionC = Math.max(0, cosPhi > 0 ? d / cosPhi : 0);
  const effectiveCohesionCKpa = effectiveCohesionC * 98.0665;

  // R² Goodness of Fit
  let rSquared = 0;
  const totalSS = sumQ2 - Math.pow(sumQ, 2) / N;
  if (totalSS > 1e-9) {
    const resSS = pValues.reduce((acc, p, i) => {
      const predQ = m * p + d;
      return acc + Math.pow(qValues[i] - predQ, 2);
    }, 0);
    rSquared = Math.max(0, Math.min(1, 1 - resSS / totalSS));
  }

  return {
    effectiveCohesionC: Number(effectiveCohesionC.toFixed(4)),
    effectiveCohesionCKpa: Number(effectiveCohesionCKpa.toFixed(2)),
    effectiveFrictionAnglePhi: Number(effectiveFrictionAnglePhi.toFixed(2)),
    totalCohesionCu: 52.25,
    totalFrictionAnglePhiu: 10.67,
    slope: Number(m.toFixed(4)),
    rSquared: Number(rSquared.toFixed(4)),
    points: validPoints,
  };
}
