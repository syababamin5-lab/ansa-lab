import { PurchaseOrder, SampleTest } from '../types';

export interface TimingInfo {
  elapsedHours: number;
  estimatedHours: number;
  percentageElapsed: number;
  badgeColor: 'red' | 'yellow' | 'green' | 'gray';
  statusText: string;
  isOverdue: boolean;
}

export function getTestTimingInfo(test: SampleTest): TimingInfo {
  if (test.status === 'Belum Diuji') {
    return {
      elapsedHours: 0,
      estimatedHours: test.estimatedDurationHours,
      percentageElapsed: 0,
      badgeColor: 'gray',
      statusText: 'Belum Dimulai',
      isOverdue: false
    };
  }

  if (test.status === 'Dibatalkan') {
    return {
      elapsedHours: 0,
      estimatedHours: test.estimatedDurationHours,
      percentageElapsed: 0,
      badgeColor: 'gray',
      statusText: 'Dibatalkan',
      isOverdue: false
    };
  }

  if (test.status === 'Selesai') {
    let elapsed = 0;
    if (test.startTime && test.endTime) {
      elapsed = (new Date(test.endTime).getTime() - new Date(test.startTime).getTime()) / (1000 * 3600);
    }
    return {
      elapsedHours: Math.round(elapsed * 10) / 10,
      estimatedHours: test.estimatedDurationHours,
      percentageElapsed: 100,
      badgeColor: 'green',
      statusText: `Selesai (${Math.round(elapsed)}j)`,
      isOverdue: false
    };
  }

  // Running ('Sedang Diuji')
  const startTime = test.startTime ? new Date(test.startTime).getTime() : Date.now();
  const elapsed = (Date.now() - startTime) / (1000 * 3600);
  const est = test.estimatedDurationHours;
  const pct = Math.min(100, Math.round((elapsed / est) * 100));

  const isOverdue = elapsed > est;
  let badgeColor: 'red' | 'yellow' | 'green' | 'gray' = 'green';
  let statusText = `${Math.round(elapsed)}j / ${est}j (${pct}%)`;

  if (isOverdue) {
    badgeColor = 'red';
    const overdueBy = Math.round(elapsed - est);
    statusText = `Terlambat +${overdueBy}j!`;
  } else if (pct >= 85 || (est - elapsed) <= 6) {
    badgeColor = 'yellow';
    const remaining = Math.round(est - elapsed);
    statusText = `Sisa ${remaining}j`;
  }

  return {
    elapsedHours: Math.round(elapsed * 10) / 10,
    estimatedHours: est,
    percentageElapsed: pct,
    badgeColor,
    statusText,
    isOverdue
  };
}

export function normalizeTestCode(code: string): string {
  let c = (code || '').toUpperCase().trim();
  if (c.startsWith('TT-')) c = c.slice(3);
  if (c === 'DS-CD-RES' || c === 'DS-RES' || c === 'DSH-CDR' || c === 'DS_CD_RES' || c === 'DS_RES' || c === 'DS_CD_RESIDUAL' || c === 'DS-CDR' || c === 'DS_CDR') return 'DS-CDR';
  if (c === 'DS-CD' || c === 'DSH-CD' || c === 'DSH_CD' || c === 'DS_CD') return 'DS-CD';
  if (c === 'DS-CU' || c === 'DSH-CU' || c === 'DSH_CU' || c === 'DS_CU') return 'DS-CU';
  if (c === 'DSH-UU' || c === 'DS-UU' || c === 'DS' || c === 'DSH' || c === 'DSH_UU' || c === 'DS_UU') return 'DS-UU';
  if (c === 'TRX-CU' || c === 'TRX_CU') return 'TRX-CU';
  if (c === 'TRX-CD' || c === 'TRX_CD') return 'TRX-CD';
  if (c === 'TRX' || c === 'TRX-UU' || c === 'TRX_UU') return 'TRX-UU';
  if (c === 'ATT' || c === 'ATB') return 'ATB';
  if (c === 'S&H' || c === 'SVE' || c === 'SVE-HYD' || c === 'HYD' || c === 'SIEVE-HYDRO' || c === 'SIEVE_HYDRO' || c === 'SIEVE & HYDRO' || c === 'SIEVE&HYDRO') return 'Sieve-Hydro';
  if (c === 'PB' || c === 'PRM' || c === 'PERM' || c === 'PFH' || c === 'PERMEABILITAS') return 'PB';
  if (c === 'CNS' || c === 'CONSOL' || c === 'CONSOLIDATION' || c === 'CT') return 'CT';
  if (c === 'CMP-MOD' || c === 'CMP_MOD') return 'CMP-MOD';
  if (c === 'CMP-STD' || c === 'CMP_STD' || c === 'CMP') return 'CMP-STD';
  if (c === 'CBR-SOK' || c === 'CBR_SOK') return 'CBR-SOK';
  if (c === 'CBR-UNS' || c === 'CBR_UNS' || c === 'CBR') return 'CBR-UNS';
  if (c === 'UCT') return 'UCT';
  if (c === 'SG') return 'SG';
  if (c === 'MC') return 'MC';
  if (c === 'UW') return 'UW';
  return c;
}

export function getRequiredPhotoCount(testCode?: string, method?: string): number {
  if (!testCode) return 1;
  const norm = normalizeTestCode(testCode);
  if (norm === 'MC' || norm === 'UW' || norm === 'SG' || norm === 'ATB' || norm === 'ATT') return 1;
  if (norm === 'SVE-HYD' || norm === 'Sieve-Hydro' || norm === 'S&H' || norm === 'SVE') return 2;
  if (norm === 'UCT') return 2;
  if (norm.startsWith('DS')) return 3; // DS-UU, DS-CU, DS-CD, DS-CDR (Wajib 3 Foto)
  if (norm === 'CT' || norm === 'CNS') return 3; // Consolidation (Wajib 3 Foto)
  if (norm.startsWith('TRX')) {
    if (method === 'multistage' || method === 'multi') return 2; // TRX-UU Multi (Wajib 2 Foto)
    return 3; // TRX-UU Normal / 3-specimen (Wajib 3 Foto)
  }
  return 1;
}

export type TestState3 = 'completed' | 'draft' | 'unstarted';

export function getTestStatus3State(testObj: SampleTest | undefined, activeState?: any, targetCodeOverride?: string): {
  state: TestState3;
  label: string;
  bgClass: string;
  iconType: 'check' | 'clock' | 'dash';
} {
  const calcData = testObj?.calculationData;
  const inputs = calcData?.inputValues || calcData || {};
  const results = calcData?.summaryResults || {};
  const code = normalizeTestCode(targetCodeOverride || activeState?.testCode || testObj?.testTypeCode || testObj?.testTypeId || '');

  if (!testObj && !activeState && !inputs.sgA1 && !inputs.mcWet1 && !inputs.ringWetWeight && !inputs.gsAvg && !inputs.mcAvg && !inputs.bulkDensity) {
    return {
      state: 'unstarted',
      label: 'Belum Diinput',
      bgClass: 'bg-slate-100 text-slate-400 border-slate-200',
      iconType: 'dash'
    };
  }

  // EXPLICIT DRAFT GUARD:
  // If the test has calculationStatus === 'Draft Data' or status === 'Sedang Diuji' / 'Draft Data',
  // and is NOT explicitly finalized with status === 'Selesai' or 'Completed',
  // it is unequivocally in DRAFT (Dalam Proses) state!
  const isExplicitDraft = (testObj?.calculationStatus === 'Draft Data' || testObj?.status === 'Sedang Diuji' || testObj?.status === 'Draft Data') &&
                          testObj?.status !== 'Selesai' && testObj?.status !== 'Completed';

  if (isExplicitDraft) {
    return {
      state: 'draft',
      label: 'Dalam Proses',
      bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
      iconType: 'clock'
    };
  }

  const testPhotos = Array.isArray(testObj?.photos) ? testObj.photos : [];
  const activePhotos = Array.isArray(activeState?.photos) ? activeState.photos : [];
  const calcPhotos = Array.isArray((calcData as any)?.photos) ? (calcData as any).photos : [];
  const inputPhotos = Array.isArray(inputs?.photos) ? inputs.photos : [];
  const totalPhotosCount = testPhotos.length + activePhotos.length + calcPhotos.length + inputPhotos.length;

  const trxMethod = activeState?.trxUuMethod || inputs?.trxUuMethod || (testObj?.calculationData as any)?.inputValues?.trxUuMethod;
  const minRequiredPhotos = getRequiredPhotoCount(code, trxMethod);

  let isComplete = false;
  let isDraft = false;

  // SPECIAL CHECK FOR SVE-HYD (Sieve Analysis & Hydrometer):
  // Must require actual non-zero sieve retained (at least 3 sieves) or hydro readings data
  if (code === 'SVE-HYD' || code === 'Sieve-Hydro' || code === 'S&H' || code === 'SVE') {
    const sieveArr = activeState?.shSieveRetained || inputs.shSieveRetained || [];
    const hydroArr = activeState?.shHydroReadings || inputs.shHydroReadings || [];
    const validSieveCount = Array.isArray(sieveArr) ? sieveArr.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    const validHydroCount = Array.isArray(hydroArr) ? hydroArr.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    
    const hasValidData = validSieveCount >= 3 || validHydroCount >= 3;
    if (hasValidData) {
      if (totalPhotosCount < minRequiredPhotos && testObj?.status !== 'Selesai' && testObj?.status !== 'Completed') {
        return {
          state: 'draft',
          label: `Dalam Proses (${totalPhotosCount}/${minRequiredPhotos} Foto)`,
          bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
          iconType: 'clock'
        };
      }
      return {
        state: 'completed',
        label: 'Selesai',
        bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        iconType: 'check'
      };
    }

    const hasAnyDraft = validSieveCount > 0 || validHydroCount > 0 || testObj?.calculationStatus === 'Draft Data';
    if (hasAnyDraft) {
      return {
        state: 'draft',
        label: 'Dalam Proses',
        bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
        iconType: 'clock'
      };
    }

    return {
      state: 'unstarted',
      label: 'Belum Diinput',
      bgClass: 'bg-slate-100 text-slate-400 border-slate-200',
      iconType: 'dash'
    };
  }

  if (code === 'SG') {
    const val = (activeState?.gsAvg > 0) ? activeState.gsAvg : (inputs.gsAvg || results.gsAvg || 0);
    const hasA1 = parseFloat(activeState?.sgA1 || inputs.sgA1 || 0) > 0;
    const hasB1 = parseFloat(activeState?.sgB1 || inputs.sgB1 || 0) > 0;
    const hasA2 = parseFloat(activeState?.sgA2 || inputs.sgA2 || 0) > 0;
    const hasB2 = parseFloat(activeState?.sgB2 || inputs.sgB2 || 0) > 0;
    isComplete = (val > 0 || (hasA1 && hasB1)) && (hasA2 ? hasB2 : true);
    isDraft = !isComplete && (hasA1 || hasB1 || hasA2 || hasB2 || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'MC') {
    const val = (activeState?.mcAvg > 0) ? activeState.mcAvg : (inputs.mcAvg || results.mcAvg || 0);
    const hasWet1 = parseFloat(activeState?.mcWet1 || inputs.mcWet1 || 0) > 0;
    const hasDry1 = parseFloat(activeState?.mcDry1 || inputs.mcDry1 || 0) > 0;
    const hasWet2 = parseFloat(activeState?.mcWet2 || inputs.mcWet2 || 0) > 0;
    const hasDry2 = parseFloat(activeState?.mcDry2 || inputs.mcDry2 || 0) > 0;
    isComplete = (val > 0 || (hasWet1 && hasDry1)) && (hasWet2 ? hasDry2 : true);
    isDraft = !isComplete && (hasWet1 || hasDry1 || hasWet2 || hasDry2 || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'UW') {
    const val = (activeState?.bulkDensity > 0) ? activeState.bulkDensity : (inputs.bulkDensity || results.bulkDensity || 0);
    const hasWetSoil = parseFloat(activeState?.ringWetWeight || inputs.ringWetWeight || 0) > 0;
    isComplete = val > 0 && hasWetSoil;
    isDraft = !isComplete && (hasWetSoil || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'ATB') {
    const ll = (activeState?.computedLL > 0) ? activeState.computedLL : (inputs.computedLL || results.ll || 0);
    const pl = (activeState?.computedPL > 0) ? activeState.computedPL : (inputs.computedPL || results.pl || 0);
    const blows = activeState?.atbBlows || inputs.atbBlows || [];
    const plWet = activeState?.atbPlWet || inputs.atbPlWet || [];
    const validBlowsCount = Array.isArray(blows) ? blows.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    const validPlCount = Array.isArray(plWet) ? plWet.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    isComplete = ll > 0 && pl > 0 && validBlowsCount >= 3 && validPlCount >= 2;
    isDraft = !isComplete && (ll > 0 || pl > 0 || validBlowsCount > 0 || validPlCount > 0 || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'SVE-HYD') {
    const sieveArr = activeState?.shSieveRetained || inputs.shSieveRetained || [];
    const hydroArr = activeState?.shHydroReadings || inputs.shHydroReadings || [];
    const validSieveCount = Array.isArray(sieveArr) ? sieveArr.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    const validHydroCount = Array.isArray(hydroArr) ? hydroArr.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    isComplete = validSieveCount >= 3 || validHydroCount >= 3;
    isDraft = !isComplete && (validSieveCount > 0 || validHydroCount > 0 || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'PRM') {
    const k = (activeState?.prmKAvg > 0) ? activeState.prmKAvg : (inputs.prmKAvg || results.kAvg || 0);
    const prmH2Arr = activeState?.prmH2 || inputs.prmH2 || [];
    const hasH2 = Array.isArray(prmH2Arr) && prmH2Arr.some((v: string) => v !== '' && parseFloat(v) > 0);
    isComplete = k > 0 && hasH2;
    isDraft = !isComplete && (hasH2 || (Array.isArray(inputs.prmTime) && inputs.prmTime.some((v: string) => v !== '')) || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'DS-UU') {
    const normalLoads = (Array.isArray(activeState?.dsNormalLoads) && activeState.dsNormalLoads.some((v: any) => parseFloat(v) > 0)) ? activeState.dsNormalLoads : (inputs.dsUuNormalLoads || inputs.dsNormalLoads || []);
    const wetSoil = (Array.isArray(activeState?.dsWetSoilPlusRing) && activeState.dsWetSoilPlusRing.some((v: any) => parseFloat(v) > 0)) ? activeState.dsWetSoilPlusRing : (inputs.dsUuWetSoilPlusRing || inputs.dsWetSoilPlusRing || []);
    const dialA = (Array.isArray(activeState?.dsDialReadingsA) && activeState.dsDialReadingsA.some((v: any) => parseFloat(v) > 0)) ? activeState.dsDialReadingsA : (inputs.dsUuDialReadingsA || inputs.dsDialReadingsA || []);
    const dialB = (Array.isArray(activeState?.dsDialReadingsB) && activeState.dsDialReadingsB.some((v: any) => parseFloat(v) > 0)) ? activeState.dsDialReadingsB : (inputs.dsUuDialReadingsB || inputs.dsDialReadingsB || []);
    const dialC = (Array.isArray(activeState?.dsDialReadingsC) && activeState.dsDialReadingsC.some((v: any) => parseFloat(v) > 0)) ? activeState.dsDialReadingsC : (inputs.dsUuDialReadingsC || inputs.dsDialReadingsC || []);

    const hasLoadsAll = Array.isArray(normalLoads) && normalLoads.length >= 3 && normalLoads.slice(0, 3).every((v: any) => parseFloat(v) > 0);
    const hasWetSoilAll = Array.isArray(wetSoil) && wetSoil.length >= 3 && wetSoil.slice(0, 3).every((v: any) => parseFloat(v) > 0);
    const hasDialsAll = (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) &&
                        (Array.isArray(dialB) && dialB.some((v: any) => parseFloat(v) > 0)) &&
                        (Array.isArray(dialC) && dialC.some((v: any) => parseFloat(v) > 0));

    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed' || testObj?.calculationStatus === 'Calculated';

    isComplete = (hasLoadsAll && hasWetSoilAll && hasDialsAll) || (isMarkedDone && hasLoadsAll && hasDialsAll);
    const hasAnyPartial = (Array.isArray(normalLoads) && normalLoads.some((v: any) => parseFloat(v) > 0)) ||
                          (Array.isArray(wetSoil) && wetSoil.some((v: any) => parseFloat(v) > 0)) ||
                          (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) ||
                          testObj?.calculationStatus === 'Draft Data';
    isDraft = !isComplete && hasAnyPartial;
  } else if (code === 'DS-CD' || code === 'DS-CU') {
    const normalLoads = activeState?.dsCdNormalLoads || inputs.dsCdNormalLoads || inputs.dsNormalLoads || [];
    const dialA = activeState?.dsCdDialReadingsA || inputs.dsCdDialReadingsA || inputs.dsDialReadingsA || [];
    const dialB = activeState?.dsCdDialReadingsB || inputs.dsCdDialReadingsB || inputs.dsDialReadingsB || [];
    const dialC = activeState?.dsCdDialReadingsC || inputs.dsCdDialReadingsC || inputs.dsDialReadingsC || [];

    const hasLoadsAll = Array.isArray(normalLoads) && normalLoads.length >= 3 && normalLoads.slice(0, 3).every((v: any) => parseFloat(v) > 0);
    const hasDialsAll = (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) &&
                        (Array.isArray(dialB) && dialB.some((v: any) => parseFloat(v) > 0)) &&
                        (Array.isArray(dialC) && dialC.some((v: any) => parseFloat(v) > 0));

    isComplete = hasLoadsAll && hasDialsAll;
    const hasAnyPartial = (Array.isArray(normalLoads) && normalLoads.some((v: any) => parseFloat(v) > 0)) ||
                          (Array.isArray(dialA) && dialA.some((v: any) => parseFloat(v) > 0)) ||
                          testObj?.calculationStatus === 'Draft Data';
    isDraft = !isComplete && hasAnyPartial;
  } else if (code === 'DS-CD-RES') {
    const normalLoads = activeState?.dsCdResNormalLoads || inputs.dsCdResNormalLoads || inputs.dsNormalLoads || [];
    const resA = activeState?.dsResResidualReadingsA || inputs.dsResResidualReadingsA || [];
    const resB = activeState?.dsResResidualReadingsB || inputs.dsResResidualReadingsB || [];
    const resC = activeState?.dsResResidualReadingsC || inputs.dsResResidualReadingsC || [];

    const hasLoadsAll = Array.isArray(normalLoads) && normalLoads.length >= 3 && normalLoads.slice(0, 3).every((v: any) => parseFloat(v) > 0);
    const hasResAll = (Array.isArray(resA) && resA.some((v: any) => parseFloat(v) > 0)) &&
                      (Array.isArray(resB) && resB.some((v: any) => parseFloat(v) > 0)) &&
                      (Array.isArray(resC) && resC.some((v: any) => parseFloat(v) > 0));

    isComplete = hasLoadsAll && hasResAll;
    const hasAnyPartial = (Array.isArray(normalLoads) && normalLoads.some((v: any) => parseFloat(v) > 0)) ||
                          (Array.isArray(resA) && resA.some((v: any) => parseFloat(v) > 0)) ||
                          testObj?.calculationStatus === 'Draft Data';
    isDraft = !isComplete && hasAnyPartial;
  } else if (code === 'TRX-UU' || code === 'TRX') {
    const devA = activeState?.trxSpec1?.maxDevStress > 0 ? activeState.trxSpec1.maxDevStress : parseFloat(inputs.trxMaxDevStressA || results.trxMaxDevStressA || 0);
    const devB = activeState?.trxSpec2?.maxDevStress > 0 ? activeState.trxSpec2.maxDevStress : parseFloat(inputs.trxMaxDevStressB || results.trxMaxDevStressB || 0);
    const devC = activeState?.trxSpec3?.maxDevStress > 0 ? activeState.trxSpec3.maxDevStress : parseFloat(inputs.trxMaxDevStressC || results.trxMaxDevStressC || 0);
    const loadA = activeState?.trxLoadReadingsA || inputs.trxLoadReadingsA || [];
    const loadB = activeState?.trxLoadReadingsB || inputs.trxLoadReadingsB || [];
    const loadC = activeState?.trxLoadReadingsC || inputs.trxLoadReadingsC || [];

    const isMultiStage = (activeState?.trxUuMethod || inputs.trxUuMethod) === 'multistage';
    const hasLoadsDone = isMultiStage
      ? (Array.isArray(loadA) && loadA.some((v: any) => parseFloat(v) > 0)) &&
        (Array.isArray(loadB) && loadB.some((v: any) => parseFloat(v) > 0))
      : (Array.isArray(loadA) && loadA.some((v: any) => parseFloat(v) > 0)) &&
        (Array.isArray(loadB) && loadB.some((v: any) => parseFloat(v) > 0)) &&
        (Array.isArray(loadC) && loadC.some((v: any) => parseFloat(v) > 0));

    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed';
    isComplete = isMultiStage
      ? ((hasLoadsDone && devA > 0 && devB > 0) || (isMarkedDone && hasLoadsDone))
      : ((hasLoadsDone && devA > 0 && devB > 0 && devC > 0) || (isMarkedDone && hasLoadsDone));
    const hasAny = (Array.isArray(loadA) && loadA.some((v: any) => parseFloat(v) > 0)) || devA > 0;
    const hasAnyPartial = hasAny || (inputs.dateStarted && inputs.dateStarted !== '') || (inputs.trxDia && inputs.trxDia !== '3.80');
    isDraft = !isComplete && hasAnyPartial;
  } else if (code === 'TRX-CU') {
    const rows1 = activeState?.trxCuShearRows1 || inputs.trxCuShearRows1 || [];
    const rows2 = activeState?.trxCuShearRows2 || inputs.trxCuShearRows2 || [];
    const rows3 = activeState?.trxCuShearRows3 || inputs.trxCuShearRows3 || [];
    const hasCuRows = Array.isArray(rows1) && rows1.some((r: any) => r.prForce && parseFloat(r.prForce) > 0);
    const hasAll = hasCuRows && Array.isArray(rows2) && rows2.some((r: any) => r.prForce && parseFloat(r.prForce) > 0);
    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed';
    isComplete = hasAll || (isMarkedDone && hasCuRows);
    isDraft = !isComplete && hasCuRows;
  } else if (code === 'TRX-CD') {
    const rows1 = activeState?.trxCdShearRows1 || inputs.trxCdShearRows1 || [];
    const rows2 = activeState?.trxCdShearRows2 || inputs.trxCdShearRows2 || [];
    const hasCdRows = Array.isArray(rows1) && rows1.some((r: any) => r.prForce && parseFloat(r.prForce) > 0);
    const hasAll = hasCdRows && Array.isArray(rows2) && rows2.some((r: any) => r.prForce && parseFloat(r.prForce) > 0);
    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed';
    isComplete = hasAll || (isMarkedDone && hasCdRows);
    isDraft = !isComplete && hasCdRows;
  } else if (code === 'CNS') {
    const matrix = activeState?.consolMatrix || inputs.consolMatrix || [];
    const dial24 = activeState?.consolDial24h || inputs.consolDial24h || [];
    const hasDialAll = Array.isArray(dial24) && dial24.filter((v: any) => parseFloat(v) > 0).length >= 5;
    const pc = (activeState?.consolPc > 0) ? activeState.consolPc : (inputs.consolPc || results.pc || results.preconsolidationPressure || 0);
    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed' || testObj?.calculationStatus === 'Calculated';
    isComplete = (pc > 0 && hasDialAll) || (isMarkedDone && hasDialAll);
    const hasAny = (Array.isArray(dial24) && dial24.some((v: any) => parseFloat(v) > 0)) || (Array.isArray(matrix) && matrix.some((col: any) => Array.isArray(col) && col.some((v: any) => parseFloat(v) > 0)));
    isDraft = !isComplete && (hasAny || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'CMP' || code === 'CMP-STD' || code === 'CMP-MOD') {
    const mdd = (activeState?.cmpMdd > 0) ? activeState.cmpMdd : (inputs.cmpMdd || inputs.dryDensityMax || results.cmpMdd || 0);
    const omc = (activeState?.cmpOmc > 0) ? activeState.cmpOmc : (inputs.cmpOmc || inputs.optimumMoisture || results.cmpOmc || 0);
    const cans = activeState?.cmpCanWetSoil || inputs.cmpCanWetSoil || [];
    const validCans = Array.isArray(cans) ? cans.filter((v: string) => v !== '' && parseFloat(v) > 0).length : 0;
    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed' || testObj?.calculationStatus === 'Calculated';
    isComplete = (mdd > 0 && omc > 0 && validCans >= 4) || (isMarkedDone && validCans >= 4);
    isDraft = !isComplete && (validCans > 0 || (Array.isArray(inputs.cmpMoldWetSoil) && inputs.cmpMoldWetSoil.some((v: string) => v !== '')) || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'UCT') {
    const qu = (activeState?.uctQuUds > 0) ? activeState.uctQuUds : (inputs.uctQuUds || results.qu || 0);
    const forceUds = activeState?.uctDialForceUds || inputs.uctDialForceUds || inputs.uctDialForce || [];
    const forceRem = activeState?.uctDialForceRem || inputs.uctDialForceRem || [];
    const hasForceUds = Array.isArray(forceUds) && forceUds.some((v: any) => parseFloat(v) > 0);
    const hasForceRem = Array.isArray(forceRem) && forceRem.some((v: any) => parseFloat(v) > 0);
    const isMarkedDone = testObj?.status === 'Selesai' || testObj?.status === 'Completed' || testObj?.calculationStatus === 'Calculated';
    isComplete = qu > 0 || (isMarkedDone && hasForceUds) || (hasForceUds && hasForceRem);
    isDraft = !isComplete && (hasForceUds || hasForceRem || testObj?.calculationStatus === 'Draft Data');
  } else if (code === 'CBR' || code === 'CBR-UNS' || code === 'CBR-SOK') {
    const cbrVal = (activeState?.cbrVal > 0) ? activeState.cbrVal : (inputs.cbrVal || results.cbrVal || 0);
    isComplete = cbrVal > 0;
    isDraft = !isComplete && (cbrVal > 0 || testObj?.calculationStatus === 'Draft Data');
  } else {
    isComplete = (results && Object.keys(results).length > 0 && Object.values(results).some((v: any) => parseFloat(v) > 0));
    isDraft = !isComplete && testObj?.calculationStatus === 'Draft Data';
  }

  if (isComplete) {
    // MANDATORY PHOTO DOCUMENTATION GUARD (ISO 17025 with test-specific quotas):
    // If photo documentation count is below the minimum required, it MUST REMAIN in 'draft' (Dalam Proses) state!
    if (totalPhotosCount < minRequiredPhotos && testObj?.status !== 'Selesai' && testObj?.status !== 'Completed') {
      return {
        state: 'draft',
        label: `Dalam Proses (${totalPhotosCount}/${minRequiredPhotos} Foto)`,
        bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
        iconType: 'clock'
      };
    }

    return {
      state: 'completed',
      label: 'Selesai',
      bgClass: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      iconType: 'check'
    };
  }

  if (isDraft) {
    return {
      state: 'draft',
      label: 'Dalam Proses',
      bgClass: 'bg-amber-100 text-amber-800 border-amber-300',
      iconType: 'clock'
    };
  }

  return {
    state: 'unstarted',
    label: 'Belum Diinput',
    bgClass: 'bg-slate-100 text-slate-400 border-slate-200',
    iconType: 'dash'
  };
}

export function isTestRealtimeComplete(testObj: SampleTest | undefined, activeState?: any): boolean {
  return getTestStatus3State(testObj, activeState).state === 'completed';
}

export function getPOProgress(po: PurchaseOrder, testCatalogue?: any[]): { completed: number; total: number; percentage: number } {
  let totalTests = 0;
  let completedTests = 0;

  po.samples.forEach(sample => {
    sample.tests.forEach(test => {
      if (test.status !== 'Dibatalkan') {
        totalTests++;
        if (isTestRealtimeComplete(test)) {
          completedTests++;
        }
      }
    });
  });

  const percentage = totalTests === 0 ? 0 : Math.round((completedTests / totalTests) * 100);
  return { completed: completedTests, total: totalTests, percentage };
}

export function getPODeadlineStatus(deadlineIso: string): { badgeColor: 'red' | 'yellow' | 'green'; text: string; hoursLeft: number } {
  const deadlineTime = new Date(deadlineIso).getTime();
  const diffMs = deadlineTime - Date.now();
  const hoursLeft = Math.round(diffMs / (1000 * 3600));

  if (diffMs <= 0) {
    return { badgeColor: 'red', text: `Lewat Deadline (${Math.abs(hoursLeft)}j lalu)`, hoursLeft };
  } else if (hoursLeft <= 48) {
    return { badgeColor: 'yellow', text: `Mendesak (${hoursLeft}j lagi)`, hoursLeft };
  } else {
    const daysLeft = Math.round(hoursLeft / 24);
    return { badgeColor: 'green', text: `${daysLeft} Hari Lagi`, hoursLeft };
  }
}

export function formatBytes(bytes?: number, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

export function getSampleUscs(sample: { tests?: SampleTest[]; lithology?: string }): string {
  if (!sample || !sample.tests) {
    if (sample?.lithology && !['UDS', 'DS', 'BULK', 'SAMPEL'].includes(sample.lithology.toUpperCase())) {
      return sample.lithology;
    }
    return '-';
  }

  // Check if ATB / ATT test is assigned to this sample
  const atbTest = sample.tests.find(t => {
    const c = (t.testTypeCode || t.testTypeId || '').toUpperCase();
    return c === 'ATB' || c === 'ATT';
  });

  if (!atbTest) {
    // If ATB test is not assigned to this sample, display '-'
    return '-';
  }

  const calcData = atbTest.calculationData;
  const inputs = calcData?.inputValues;

  // Check if marked Non-Plastic (NP)
  if (inputs?.isNP || inputs?.isNonPlastic || calcData?.summaryResults?.uscs === 'NP') {
    return 'NP';
  }

  const computedLL = inputs?.computedLL || calcData?.summaryResults?.ll || 0;
  const computedPL = inputs?.computedPL || calcData?.summaryResults?.pl || 0;

  // If both LL and PL are calculated
  if (computedLL > 0 && computedPL > 0) {
    const computedPI = computedLL - computedPL;
    if (computedPI <= 0 || inputs?.isNP) {
      return 'NP';
    }
    // Casagrande A-line formula: PI = 0.73 * (LL - 20)
    const aLinePI = 0.73 * (computedLL - 20);
    if (computedLL < 50) {
      return (computedPI > aLinePI && computedPI > 4) ? 'CL' : 'ML';
    } else {
      return (computedPI > aLinePI) ? 'CH' : 'MH';
    }
  }

  // If ATB is assigned but not yet tested / incomplete
  return '-';
}

// Automatically scrub legacy default dummy fallbacks from all PO data
export function migrateRemoveSumartadji(posList: any[]): any[] {
  if (!Array.isArray(posList)) return [];
  const isDummy = (val: any) => typeof val === 'string' && (val.includes('Sumartadji') || val.includes('Teknisi Sandbox') || val.includes('Teknisi Lab') || val === 'Rizki' || val === 'Rizki, A.Md.' || val === 'Rizki, A.Md. (AO#2)');

  const cleanFlatDsKeys = (obj: any) => {
    if (!obj || typeof obj !== 'object') return obj;
    const next = { ...obj };
    const prefixes = [
      'dsNormalLoads', 'dsWetSoilPlusRing', 'dsContainerNo', 'dsWetCanWeight', 'dsDryCanWeight',
      'dsUuNormalLoads', 'dsUuWetSoilPlusRing', 'dsUuContainerNo', 'dsUuWetCanWeight', 'dsUuDryCanWeight',
      'dsCdNormalLoads', 'dsCdWetSoilPlusRing', 'dsCdContainerNo', 'dsCdWetCanWeight', 'dsCdDryCanWeight',
      'dsCdResNormalLoads', 'dsCdResWetSoilPlusRing', 'dsCdResContainerNo', 'dsCdResWetCanWeight', 'dsCdResDryCanWeight'
    ];
    Object.keys(next).forEach(k => {
      prefixes.forEach(p => {
        if (k.startsWith(p) && /\d+$/.test(k)) {
          delete next[k];
        }
      });
    });
    return next;
  };

  return posList.map(po => {
    return {
      ...po,
      checkedBy: isDummy(po.checkedBy) ? '' : po.checkedBy,
      samples: (po.samples || []).map((s: any) => ({
        ...s,
        testedBy: isDummy(s.testedBy) ? '' : s.testedBy,
        assignedTechnician: isDummy(s.assignedTechnician) ? '' : s.assignedTechnician,
        tests: (s.tests || []).map((t: any) => ({
          ...t,
          technicianName: isDummy(t.technicianName) ? '' : t.technicianName,
          assignedTechnician: isDummy(t.assignedTechnician) ? '' : t.assignedTechnician,
          calculationData: t.calculationData ? {
            ...t.calculationData,
            inputValues: t.calculationData.inputValues ? {
              ...cleanFlatDsKeys(t.calculationData.inputValues),
              testedBy: isDummy(t.calculationData.inputValues.testedBy) ? '' : t.calculationData.inputValues.testedBy,
              checkedBy: isDummy(t.calculationData.inputValues.checkedBy) ? '' : t.calculationData.inputValues.checkedBy,
            } : cleanFlatDsKeys(t.calculationData)
          } : t.calculationData
        }))
      }))
    };
  });
}

export function migrateCanonicalTestCodes(posList: any[]): any[] {
  if (!Array.isArray(posList)) return [];
  return posList.map(po => {
    if (!po || !po.samples) return po;
    return {
      ...po,
      samples: (po.samples || []).map((s: any) => ({
        ...s,
        tests: (s.tests || []).map((t: any) => {
          const rawCode = t.testTypeCode || t.testTypeId || '';
          const normCode = normalizeTestCode(rawCode);
          let newName = t.testTypeName;
          if (normCode === 'PB') newName = 'Permeability Falling Head Test';
          else if (normCode === 'Sieve-Hydro') newName = 'Sieve Analysis & Hydrometer Test';
          else if (normCode === 'CT') newName = 'Consolidation Oedometer Test';
          else if (normCode === 'DS-CU') newName = 'Direct Shear CU';
          else if (normCode === 'DS-CD') newName = 'Direct Shear CD';
          else if (normCode === 'DS-CDR') newName = 'Direct Shear CD Residual';
          return {
            ...t,
            testTypeCode: normCode,
            testTypeName: newName
          };
        })
      }))
    };
  });
}

export function migrateSumartadjiToAlansyah(posList: any[]): any[] {
  return migrateRemoveSumartadji(posList);
}

// Automatically ensure status matches actual data for all tests across all POs
export function migrateEnsureAllSampleTestStatuses(posList: any[]): any[] {
  if (!Array.isArray(posList)) return [];
  return posList.map(po => {
    return {
      ...po,
      samples: (po.samples || []).map((s: any) => {
        const tests = s.tests || [];
        const updatedTests = tests.map((t: any) => {
          const statusObj = getTestStatus3State(t);
          if (statusObj.state === 'completed') {
            return {
              ...t,
              status: 'Selesai',
              calculationStatus: 'Calculated'
            };
          } else if (statusObj.state === 'draft') {
            return {
              ...t,
              status: 'Sedang Diuji',
              calculationStatus: 'Draft Data',
              lockedByTechnician: false
            };
          } else {
            return {
              ...t,
              status: 'Belum Diuji',
              calculationStatus: 'Not Started',
              lockedByTechnician: false
            };
          }
        });

        return {
          ...s,
          tests: updatedTests
        };
      })
    };
  });
}

// Automatically standardize DSH-UU / DS / DSH test codes to 'DS-UU', merge duplicates, and remove empty auto-injected DS-CD/DS-CD-RES entries
export function migrateStandardizeDsUu(posList: any[]): any[] {
  if (!Array.isArray(posList)) return [];

  return posList.map(po => {
    if (!po || !po.samples || !Array.isArray(po.samples)) return po;

    const cleanedSamples = po.samples.map((s: any) => {
      const tests = s.tests || [];
      if (!Array.isArray(tests) || tests.length === 0) return s;

      const deduplicatedTests: any[] = [];

      tests.forEach((t: any) => {
        let code = (t.testTypeCode || t.testTypeId || '').toUpperCase().trim();
        if (code.startsWith('TT-')) code = code.slice(3);

        // Map any legacy variation (DSH-UU, DSH_UU, DSH, DS, DS_UU, DSH-COR, DSH_COR) to DS-UU
        let normCode = code;
        if (['DSH-UU', 'DSH_UU', 'DSH', 'DS', 'DS_UU', 'DSH-COR', 'DSH_COR', 'DS-COR', 'DSCOR'].includes(code)) {
          normCode = 'DS-UU';
        } else {
          normCode = normalizeTestCode(code);
        }

        const sanitizedTest = {
          ...t,
          testTypeCode: normCode,
          testTypeName: normCode === 'DS-UU' ? 'Direct Shear UU' : t.testTypeName,
        };

        const existingIdx = deduplicatedTests.findIndex(existing => {
          const exNorm = normalizeTestCode(existing.testTypeCode || existing.testTypeId || '');
          return exNorm === normCode;
        });

        if (existingIdx >= 0) {
          // Merge calculationData and photos into the existing test object
          const existing = deduplicatedTests[existingIdx];
          const mergedInputs = {
            ...(existing.calculationData?.inputValues || {}),
            ...(sanitizedTest.calculationData?.inputValues || {}),
          };
          const mergedPhotos = [
            ...(existing.photos || []),
            ...(sanitizedTest.photos || []),
          ];

          const uniquePhotos = mergedPhotos.filter((p: any, index: number, self: any[]) =>
            index === self.findIndex((tp: any) => (tp.id && tp.id === p.id) || (tp.url && tp.url === p.url))
          );

          deduplicatedTests[existingIdx] = {
            ...existing,
            testTypeCode: normCode,
            testTypeName: normCode === 'DS-UU' ? 'Direct Shear UU' : existing.testTypeName,
            status: (existing.status === 'Selesai' || sanitizedTest.status === 'Selesai') ? 'Selesai' : (existing.status === 'Sedang Diuji' || sanitizedTest.status === 'Sedang Diuji') ? 'Sedang Diuji' : existing.status,
            calculationStatus: (existing.calculationStatus === 'Calculated' || sanitizedTest.calculationStatus === 'Calculated') ? 'Calculated' : existing.calculationStatus,
            calculationData: {
              ...(existing.calculationData || {}),
              ...(sanitizedTest.calculationData || {}),
              inputValues: mergedInputs,
            },
            photos: uniquePhotos,
          };
        } else {
          // Exclude auto-injected DS-CD / DS-CD-RES entries if they lack DS-CD/DS-RES specific input data
          if (['DS-CD', 'DS-CD-RES'].includes(normCode)) {
            const calc = sanitizedTest.calculationData || {};
            const inputs = calc.inputValues || calc || {};
            const hasDsCdSpecificData = Object.keys(inputs).some(k => {
              const kLow = k.toLowerCase();
              if (kLow.startsWith('dscd') || kLow.startsWith('dsres') || kLow.startsWith('dscdres')) {
                const val = inputs[k];
                if (Array.isArray(val)) return val.some((v: any) => v !== undefined && v !== null && String(v).trim() !== '');
                return val !== undefined && val !== null && String(val).trim() !== '';
              }
              return false;
            });
            
            if (!hasDsCdSpecificData) {
              return; // Remove auto-injected copy of DS-CD / DS-CD-RES!
            }
          }

          deduplicatedTests.push(sanitizedTest);
        }
      });

      return {
        ...s,
        tests: deduplicatedTests,
      };
    });

    return {
      ...po,
      samples: cleanedSamples,
    };
  });
}

// Automatically ensure every PO in pos has a corresponding SamplePrepReport in SamplePrepView
export function ensurePrepReportsForPOs(prepReports: any[], posList: any[]): any[] {
  if (!Array.isArray(posList)) return Array.isArray(prepReports) ? prepReports : [];
  const currentReports = Array.isArray(prepReports) ? [...prepReports] : [];
  const norm = (str: string) => (str || '').toUpperCase().trim().replace(/^PO-/, '');

  posList.forEach(po => {
    if (!po || !po.poNumber) return;
    const exists = currentReports.some(r => norm(r.poNumber) === norm(po.poNumber) || (r.syncedToPoId && r.syncedToPoId === po.id));
    if (!exists) {
      const cleanPoNo = po.poNumber.replace(/[^A-Z0-9-]/gi, '');
      const newReport = {
        id: `prep-${po.id || Date.now()}`,
        prepReportNo: `BA-PP-${cleanPoNo.replace(/^PO-/, '')}-2026`,
        poNumber: po.poNumber,
        clientName: po.clientName || 'Klien Lab',
        projectName: po.projectName || 'Proyek Lab',
        projectLocation: po.projectLocation || 'Bandung',
        date: po.preparationStartDate ? po.preparationStartDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        inspectorName: po.checkedBy || 'Rizki, A.Md.',
        numSampleReceived: po.samples ? po.samples.length : 0,
        numSamplePrep: po.samples ? po.samples.length : 0,
        syncedToPoId: po.id,
        syncedAt: po.createdAt || new Date().toISOString(),
        overallCondition: 'NORMAL',
        items: (po.samples || []).map((s: any, idx: number) => {
          const sampleTestCodes = (s.tests || []).map((t: any) => (t.testTypeCode || t.testTypeId || '').toUpperCase());
          const hasTest = (kw: string) => sampleTestCodes.some((tc: string) => tc.includes(kw));

          const hasAnyTests = sampleTestCodes.length > 0;
          return {
            id: `item-${s.id || idx}`,
            sampleCode: s.sampleCode || `SMP-${idx + 1}`,
            idLab: s.idLab || `LAB-${idx + 1}`,
            depthStr: `${(s.depthStart || 0).toFixed(2)}-${(s.depthEnd || 0.5).toFixed(2)}m`,
            sampleCondition: 'NORMAL',
            thicknessCm: Math.round(Math.abs((s.depthEnd || 0.5) - (s.depthStart || 0)) * 100),
            tubeLengthCm: 50,
            tubeDiameterCm: 7.5,
            topDisturbCm: 0,
            bottomDisturbCm: 0,
            testEligible: {
              UW: hasTest('UW') || hasTest('PP'),
              MC: hasTest('MC') || hasTest('PP'),
              SG: hasTest('SG') || hasTest('PP'),
              BD: hasTest('BD'),
              ATB: hasTest('ATB') || hasTest('ATT'),
              SieveHydro: hasTest('SVE') || hasTest('HYD') || hasTest('S&H') || hasTest('SVE-HYD'),
              DS_UU: hasTest('DS-UU') || hasTest('DSH-UU'),
              DS_CU: hasTest('DS-CU') || hasTest('DSH-CU'),
              DS_CD: hasTest('DS-CD') || hasTest('DSH-CD'),
              DS_Res: hasTest('DS-RES') || hasTest('DSH-CDR'),
              TRX_UU: hasTest('TRX-UU'),
              TRX_CU: hasTest('TRX-CU'),
              TRX_CD: hasTest('TRX-CD'),
              Permeability: hasTest('PRM') || hasTest('PERM'),
              Consolidation: hasTest('CT') || hasTest('CNS'),
              UCT: hasTest('UCT'),
              CBR_Unsoaked: hasTest('CBR-UNS'),
              CBR_Soaked: hasTest('CBR-SOK')
            }
          };
        })
      };
      currentReports.push(newReport);
    }
  });

  return currentReports;
}
