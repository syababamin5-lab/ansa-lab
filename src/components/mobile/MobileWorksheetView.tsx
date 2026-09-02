import React, { useState, useEffect, useRef } from 'react';
import { Sample, SampleTest, PurchaseOrder, ContainerItem, TrxRingItem, RingItem, DsRingItem, DsProvingItem, UctRingItem, PycnometerItem, TestPhoto, SOIL_COLOUR_CATALOGUE } from '../../types';
import { UserProfile } from '../../types/userTypes';
import { cleanIndoNumStr, parseIndoFloat, safeUpper, getArrayOrFlatSync, buildDualKeyPayload, isSieveHydroCode } from '../../utils/mobileSync';
import { getRequiredPhotoCount } from '../../utils/helpers';
import { SIEVE_SPECIFICATIONS, HYDROMETER_TIME_SPECIFICATIONS, ModernSoilColourSelect, getWaterTempProperties, validatePycCode } from '../PhysicalPropertiesView';
import { DEFAULT_UCT_RING_CATALOGUE, DEFAULT_PYCNOMETER_CATALOGUE } from '../../data/initialData';
import { CustomDatePicker } from '../common/CustomDatePicker';
import { SlideToConfirm } from '../common/SlideToConfirm';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Layers,
  Scale,
  Gauge,
  Activity,
  FileSpreadsheet,
  Clock,
  Plus,
  Eye,
  Calendar,
  Lock,
  Unlock,
  X,
  Delete,
  ChevronRight,
  Check,
  AlertTriangle,
  Settings2,
} from 'lucide-react';

interface MobileWorksheetViewProps {
  sample: Sample;
  po: PurchaseOrder;
  initialTestCode?: string;
  currentUser: UserProfile;
  isOnline?: boolean;
  containerCatalogue?: ContainerItem[];
  trxRingCatalogue?: TrxRingItem[];
  ringCatalogue?: RingItem[];
  dsRingCatalogue?: DsRingItem[];
  dsProvingCatalogue?: DsProvingItem[];
  uctRingCatalogue?: UctRingItem[];
  pycnometerCatalogue?: PycnometerItem[];
  onBack: () => void;
  onSaveSample: (updatedSample: Sample) => void;
}

const DEFAULT_UCT_DEFORM_STEPS = [
  '0', '50', '100', '150', '200', '250', '300', '350', '400', '450',
  '500', '550', '600', '650', '700', '750', '800', '850', '900', '950',
  '1000', '1050', '1100', '1150', '1200', '1250', '1300', '1350', '1400', '1450', '1500'
];

const cleanNumStr = (val: any) => {
  if (val === undefined || val === null) return '';
  return String(val).replace(',', '.').trim();
};

export const MobileWorksheetView: React.FC<MobileWorksheetViewProps> = ({
  sample,
  po,
  initialTestCode,
  currentUser,
  isOnline = true,
  containerCatalogue = [],
  trxRingCatalogue = [],
  ringCatalogue = [],
  dsRingCatalogue = [],
  dsProvingCatalogue = [],
  uctRingCatalogue = DEFAULT_UCT_RING_CATALOGUE,
  pycnometerCatalogue = [],
  onBack,
  onSaveSample,
}) => {
  // Current active sub-test code
  const assignedTests = sample.tests || [];
  const defaultTestCode = initialTestCode || (assignedTests.length > 0 ? (assignedTests[0].testTypeCode || assignedTests[0].testTypeId || 'PP') : 'PP');
  const initialSubTab = ['PP', 'PHYSICAL', 'SOIL-PP'].includes((defaultTestCode || '').toUpperCase()) ? 'MC' : defaultTestCode;
  const [activeTestCode, setActiveTestCode] = useState<string>(initialSubTab);

  useEffect(() => {
    if (initialTestCode) {
      const norm = (initialTestCode || '').toUpperCase();
      setActiveTestCode(['PP', 'PHYSICAL', 'SOIL-PP'].includes(norm) ? 'MC' : initialTestCode);
    }
  }, [initialTestCode]);

  // Local sample state
  const [currentSample, setCurrentSample] = useState<Sample>(sample);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Sync currentSample whenever sample prop updates from parent
  useEffect(() => {
    if (sample) {
      setCurrentSample(sample);
    }
  }, [sample]);

  // Prevent accidental tab close or page navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleRequestExit = (action: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => action);
      setShowExitConfirmModal(true);
    } else {
      action();
    }
  };

  // File input refs for camera and gallery
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Get active test object
  const activeNorm = (activeTestCode || '').toUpperCase().trim();
  const activeTest = currentSample.tests.find(t => {
    const code = (t.testTypeCode || t.testTypeId || '').toUpperCase().trim();
    if (code === activeNorm) return true;
    if (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && code === 'PP') return true;
    if (isSieveHydroCode(activeNorm) && isSieveHydroCode(code)) return true;
    if (['PB', 'PRM'].includes(activeNorm) && ['PB', 'PRM'].includes(code)) return true;
    if (['CT', 'CNS'].includes(activeNorm) && ['CT', 'CNS'].includes(code)) return true;
    return code.includes(activeNorm) || activeNorm.includes(code);
  }) || currentSample.tests[0];

  // Helper to find container tare weight (returns 0 if not found in master catalogue)
  const findContainerTare = (code: string) => {
    if (!code) return 0;
    const clean = code.trim().toUpperCase();
    const match = (containerCatalogue || []).find(c => {
      const cId = String(c.id || (c as any).kode || (c as any).noCawan || '').trim().toUpperCase();
      return cId === clean;
    });
    if (match) return match.weight ?? (match as any).weightGrams ?? 0;
    return 0;
  };

  // Local Soil Colour State per-test
  const [soilColourCode, setSoilColourCode] = useState<number>(
    activeTest?.calculationData?.inputValues?.soilColourCode ?? activeTest?.soilColourCode ?? sample.colourCode ?? 0
  );

  useEffect(() => {
    const currentSubTabInputs = activeTest?.calculationData?.inputValues || activeTest?.calculationData || {};
    setSoilColourCode(currentSubTabInputs.soilColourCode ?? activeTest?.soilColourCode ?? sample.colourCode ?? 0);
  }, [activeTestCode, activeTest, sample]);

  // ????????? LOCAL TEST INPUT STATES (ALL LAB SOIL TEST TYPES) ???????????????????????????????????????\
  // 1. Physical Properties & Moisture Content (MC - Trial 1 & Trial 2)
  const [mcContainer, setMcContainer] = useState(activeTest?.calculationData?.inputValues?.mcContainer ?? '');
  const [mcWet, setMcWet] = useState(activeTest?.calculationData?.inputValues?.mcWet || '');
  const [mcDry, setMcDry] = useState(activeTest?.calculationData?.inputValues?.mcDry || '');
  const [mcTare, setMcTare] = useState(activeTest?.calculationData?.inputValues?.mcTare || '');

  const [mcContainer1, setMcContainer1] = useState(activeTest?.calculationData?.inputValues?.mcContainer1 ?? activeTest?.calculationData?.inputValues?.mcContainer ?? '');
  const [mcContainer2, setMcContainer2] = useState(activeTest?.calculationData?.inputValues?.mcContainer2 ?? '');
  const [mcWet1, setMcWet1] = useState(activeTest?.calculationData?.inputValues?.mcWet1 || activeTest?.calculationData?.inputValues?.mcWet || '');
  const [mcWet2, setMcWet2] = useState(activeTest?.calculationData?.inputValues?.mcWet2 || '');
  const [mcDry1, setMcDry1] = useState(activeTest?.calculationData?.inputValues?.mcDry1 || activeTest?.calculationData?.inputValues?.mcDry || '');
  const [mcDry2, setMcDry2] = useState(activeTest?.calculationData?.inputValues?.mcDry2 || '');
  const [mcTare1, setMcTare1] = useState(activeTest?.calculationData?.inputValues?.mcTare1 || activeTest?.calculationData?.inputValues?.mcTare || '');
  const [mcTare2, setMcTare2] = useState(activeTest?.calculationData?.inputValues?.mcTare2 || '');

  // FIX: Re-sync MC state setiap kali activeTest berubah (mencegah stale state setelah Simpan Draft & buka ulang)
  useEffect(() => {
    const iv = activeTest?.calculationData?.inputValues || activeTest?.calculationData || {};
    setMcContainer(iv.mcContainer ?? '');
    setMcWet(iv.mcWet || '');
    setMcDry(iv.mcDry || '');
    setMcTare(iv.mcTare || '');
    setMcContainer1(iv.mcContainer1 ?? iv.mcContainer ?? '');
    setMcContainer2(iv.mcContainer2 ?? '');
    setMcWet1(iv.mcWet1 || iv.mcWet || '');
    setMcWet2(iv.mcWet2 || '');
    setMcDry1(iv.mcDry1 || iv.mcDry || '');
    setMcDry2(iv.mcDry2 || '');
    setMcTare1(iv.mcTare1 || iv.mcTare || '');
    setMcTare2(iv.mcTare2 || '');
  }, [activeTest?.id, activeTestCode]);

  // Auto-fill tare when container changes
  useEffect(() => {
    const tare = findContainerTare(mcContainer1 || mcContainer);
    if (tare > 0 && !mcTare1) setMcTare1(tare.toFixed(4));
    const tare2 = findContainerTare(mcContainer2);
    if (tare2 > 0 && !mcTare2) setMcTare2(tare2.toFixed(4));
  }, [mcContainer1, mcContainer2, mcContainer]);

  // Calculations for Moisture Content
  const wetVal = parseFloat(mcWet1 || mcWet) || 0;
  const dryVal = parseFloat(mcDry1 || mcDry) || 0;
  const tareVal = parseFloat(mcTare1 || mcTare) || 0;
  const waterWeight = wetVal > dryVal ? wetVal - dryVal : 0;
  const drySoilWeight = dryVal > tareVal ? dryVal - tareVal : 0;
  const computedMcPct = drySoilWeight > 0 ? (waterWeight / drySoilWeight) * 100 : 0;

  // 2. Specific Gravity (SG) - Trial 1 & Trial 2
  const [pycNo, setPycNo] = useState(activeTest?.calculationData?.inputValues?.pycNo || '');
  const [pycWaterTemp, setPycWaterTemp] = useState(activeTest?.calculationData?.inputValues?.pycWaterTemp || '');
  const [pycGsVal, setPycGsVal] = useState(activeTest?.calculationData?.inputValues?.pycGsVal || '');

  const [pycNo1, setPycNo1] = useState(activeTest?.calculationData?.inputValues?.pycNo1 || activeTest?.calculationData?.inputValues?.pycNo || '');
  const [pycNo2, setPycNo2] = useState(activeTest?.calculationData?.inputValues?.pycNo2 || '');
  const [wtDrySoil1, setWtDrySoil1] = useState(activeTest?.calculationData?.inputValues?.wtDrySoil1 || (activeTest?.calculationData?.inputValues?.sgA1 !== undefined ? String(activeTest?.calculationData?.inputValues?.sgA1) : ''));
  const [wtDrySoil2, setWtDrySoil2] = useState(activeTest?.calculationData?.inputValues?.wtDrySoil2 || (activeTest?.calculationData?.inputValues?.sgA2 !== undefined ? String(activeTest?.calculationData?.inputValues?.sgA2) : ''));
  const [temp1, setTemp1] = useState(activeTest?.calculationData?.inputValues?.temp1 || (activeTest?.calculationData?.inputValues?.sgT1 !== undefined ? String(activeTest?.calculationData?.inputValues?.sgT1) : ''));
  const [temp2, setTemp2] = useState(activeTest?.calculationData?.inputValues?.temp2 || (activeTest?.calculationData?.inputValues?.sgT2 !== undefined ? String(activeTest?.calculationData?.inputValues?.sgT2) : ''));
  const [wtPycWaterSoil1, setWtPycWaterSoil1] = useState(activeTest?.calculationData?.inputValues?.wtPycWaterSoil1 || (activeTest?.calculationData?.inputValues?.sgB1 !== undefined ? String(activeTest?.calculationData?.inputValues?.sgB1) : ''));
  const [wtPycWaterSoil2, setWtPycWaterSoil2] = useState(activeTest?.calculationData?.inputValues?.wtPycWaterSoil2 || (activeTest?.calculationData?.inputValues?.sgB2 !== undefined ? String(activeTest?.calculationData?.inputValues?.sgB2) : ''));

  // Specific Gravity Live Calculations (SNI 1964:2008 / ASTM D854)
  const effectivePycCatalogue = (pycnometerCatalogue && pycnometerCatalogue.length > 0) ? pycnometerCatalogue : DEFAULT_PYCNOMETER_CATALOGUE;
  const pycVal1 = validatePycCode(effectivePycCatalogue, pycNo1);
  const pycVal2 = validatePycCode(effectivePycCatalogue, pycNo2);
  const pycObj1 = pycVal1.isValid ? pycVal1.found : null;
  const pycObj2 = pycVal2.isValid ? pycVal2.found : null;

  const tempObj1 = getWaterTempProperties(temp1);
  const tempObj2 = getWaterTempProperties(temp2);

  const numSgA1 = parseIndoFloat(wtDrySoil1) || 0;
  const numSgA2 = parseIndoFloat(wtDrySoil2) || 0;
  const numSgB1 = parseIndoFloat(wtPycWaterSoil1) || 0;
  const numSgB2 = parseIndoFloat(wtPycWaterSoil2) || 0;

  const sgC1 = (pycNo1.trim() && pycObj1) ? ((tempObj1.density / 0.997077) * (pycObj1.weightWater25 - pycObj1.weightTare)) + pycObj1.weightTare : 0;
  const sgC2 = (pycNo2.trim() && pycObj2) ? ((tempObj2.density / 0.997077) * (pycObj2.weightWater25 - pycObj2.weightTare)) + pycObj2.weightTare : 0;

  const sgDenom1 = (numSgA1 > 0 && numSgB1 > 0 && sgC1 > 0) ? numSgA1 + (sgC1 - numSgB1) : 0;
  const sgDenom2 = (numSgA2 > 0 && numSgB2 > 0 && sgC2 > 0) ? numSgA2 + (sgC2 - numSgB2) : 0;

  const computedGs1 = (pycVal1.isValid && sgDenom1 > 0) ? (numSgA1 / sgDenom1) * tempObj1.kFactor : 0;
  const computedGs2 = (pycVal2.isValid && sgDenom2 > 0) ? (numSgA2 / sgDenom2) * tempObj2.kFactor : 0;
  const computedGsAvg = (computedGs1 > 0 && computedGs2 > 0) ? (computedGs1 + computedGs2) / 2 : (computedGs1 || computedGs2 || 0);

  // 3. Atterberg Limits (ATB)
  const [llBlows, setLlBlows] = useState<string>(activeTest?.calculationData?.inputValues?.llBlows || '25');
  const [llWet, setLlWet] = useState<string>(activeTest?.calculationData?.inputValues?.llWet || '');
  const [llDry, setLlDry] = useState<string>(activeTest?.calculationData?.inputValues?.llDry || '');
  const [plWet, setPlWet] = useState<string>(activeTest?.calculationData?.inputValues?.plWet || '');
  const [plDry, setPlDry] = useState<string>(activeTest?.calculationData?.inputValues?.plDry || '');
  const [computedLl, setComputedLl] = useState<string>(
    activeTest?.calculationData?.inputValues?.computedLL !== undefined
      ? String(activeTest?.calculationData?.inputValues?.computedLL)
      : activeTest?.calculationData?.inputValues?.ll !== undefined
        ? String(activeTest?.calculationData?.inputValues?.ll)
        : ''
  );
  const [computedPl, setComputedPl] = useState<string>(
    activeTest?.calculationData?.inputValues?.computedPL !== undefined
      ? String(activeTest?.calculationData?.inputValues?.computedPL)
      : activeTest?.calculationData?.inputValues?.pl !== undefined
        ? String(activeTest?.calculationData?.inputValues?.pl)
        : ''
  );
  const [computedPi, setComputedPi] = useState<string>(
    activeTest?.calculationData?.inputValues?.computedPI !== undefined
      ? String(activeTest?.calculationData?.inputValues?.computedPI)
      : activeTest?.calculationData?.inputValues?.pi !== undefined
        ? String(activeTest?.calculationData?.inputValues?.pi)
        : ''
  );

  // ATB 4 Titik LL & 2 Titik PL Tables
  const [atbBlows, setAtbBlows] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbBlows || ['', '', '', '']
  );
  const [atbContainer, setAtbContainer] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbContainer || ['', '', '', '']
  );
  const [atbWet, setAtbWet] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbWet || ['', '', '', '']
  );
  const [atbDry, setAtbDry] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbDry || ['', '', '', '']
  );

  const [atbPlContainer, setAtbPlContainer] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbPlContainer || ['', '']
  );
  const [atbPlWet, setAtbPlWet] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbPlWet || ['', '']
  );
  const [atbPlDry, setAtbPlDry] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.atbPlDry || ['', '']
  );

  // Auto Calculations for ATB Trials
  const atbLlTrialResults = [0, 1, 2, 3].map(i => {
    const blows = parseFloat(atbBlows[i]) || 0;
    const cawanNo = (atbContainer[i] || '').trim();
    const emptyCan = findContainerTare(cawanNo);
    const wetCan = parseFloat(atbWet[i]) || 0;
    const dryCan = parseFloat(atbDry[i]) || 0;

    const drySoil = (dryCan > 0 && emptyCan > 0) ? Math.max(0, dryCan - emptyCan) : (dryCan > 0 ? dryCan : 0);
    const water = (wetCan > 0 && dryCan > 0) ? Math.max(0, wetCan - dryCan) : 0;
    const mc = (drySoil > 0 && water > 0) ? (water / drySoil) * 100 : 0;
    return { blows, cawanNo, emptyCan, wetCan, dryCan, drySoil, water, mc };
  });

  const validLlTrials = atbLlTrialResults.filter(t => t.blows > 0 && t.mc > 0);
  let autoCalcLL = 0;
  if (validLlTrials.length > 1) {
    const n = validLlTrials.length;
    const sumX = validLlTrials.reduce((acc, t) => acc + Math.log10(t.blows), 0);
    const sumY = validLlTrials.reduce((acc, t) => acc + t.mc, 0);
    const sumXY = validLlTrials.reduce((acc, t) => acc + (Math.log10(t.blows) * t.mc), 0);
    const sumX2 = validLlTrials.reduce((acc, t) => acc + Math.pow(Math.log10(t.blows), 2), 0);
    const denom = (n * sumX2) - (sumX * sumX);
    if (Math.abs(denom) > 1e-6) {
      const slopeM = ((n * sumXY) - (sumX * sumY)) / denom;
      const interceptC = (sumY - (slopeM * sumX)) / n;
      autoCalcLL = (slopeM * Math.log10(25)) + interceptC;
    }
  } else if (validLlTrials.length === 1) {
    const t = validLlTrials[0];
    autoCalcLL = t.mc * Math.pow(t.blows / 25, 0.121);
  }

  const atbPlTrialResults = [0, 1].map(i => {
    const cawanNo = (atbPlContainer[i] || '').trim();
    const emptyCan = findContainerTare(cawanNo);
    const wetCan = parseFloat(atbPlWet[i]) || 0;
    const dryCan = parseFloat(atbPlDry[i]) || 0;

    const drySoil = (dryCan > 0 && emptyCan > 0) ? Math.max(0, dryCan - emptyCan) : (dryCan > 0 ? dryCan : 0);
    const water = (wetCan > 0 && dryCan > 0) ? Math.max(0, wetCan - dryCan) : 0;
    const mc = (drySoil > 0 && water > 0) ? (water / drySoil) * 100 : 0;
    return { cawanNo, emptyCan, wetCan, dryCan, drySoil, water, mc };
  });

  const validPlTrials = atbPlTrialResults.filter(t => t.mc > 0);
  const autoCalcPL = validPlTrials.length > 0 ? validPlTrials.reduce((acc, t) => acc + t.mc, 0) / validPlTrials.length : 0;

  // Auto update LL and PL from trial calculations if LL / PL not manually set
  useEffect(() => {
    if (autoCalcLL > 0) {
      setComputedLl(autoCalcLL.toFixed(2));
    }
  }, [atbBlows.join(','), atbWet.join(','), atbDry.join(','), atbContainer.join(',')]);

  useEffect(() => {
    if (autoCalcPL > 0) {
      setComputedPl(autoCalcPL.toFixed(2));
    }
  }, [atbPlWet.join(','), atbPlDry.join(','), atbPlContainer.join(',')]);

  useEffect(() => {
    const ll = parseFloat(computedLl) || 0;
    const pl = parseFloat(computedPl) || 0;
    if (ll > 0 && pl > 0) {
      setComputedPi(Math.max(0, ll - pl).toFixed(2));
    }
  }, [computedLl, computedPl]);

  // 4. Sieve Analysis & Hydrometer (SVE-HYD)
  const [shSieveRetained, setShSieveRetained] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.shSieveRetained || Array(15).fill('')
  );
  const [shHydroSoilWeight, setShHydroSoilWeight] = useState<string>(
    activeTest?.calculationData?.inputValues?.shHydroSoilWeight || activeTest?.calculationData?.inputValues?.hydroSoilWt || ''
  );
  const [shHydroTemp, setShHydroTemp] = useState<string>(
    activeTest?.calculationData?.inputValues?.shHydroTemp || activeTest?.calculationData?.inputValues?.hydroTemp || ''
  );
  const [shHydroMeniscus, setShHydroMeniscus] = useState<string>(
    activeTest?.calculationData?.inputValues?.shHydroMeniscus || activeTest?.calculationData?.inputValues?.hydroMeniscus || ''
  );
  const [shHydroDispersant, setShHydroDispersant] = useState<string>(
    activeTest?.calculationData?.inputValues?.shHydroDispersant || activeTest?.calculationData?.inputValues?.hydroDispersant || ''
  );
  const [shHydroReadings, setShHydroReadings] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.shHydroReadings || Array(9).fill('')
  );

  const [sieve4, setSieve4] = useState(activeTest?.calculationData?.inputValues?.sieve4 || '');
  const [sieve10, setSieve10] = useState(activeTest?.calculationData?.inputValues?.sieve10 || '');
  const [sieve40, setSieve40] = useState(activeTest?.calculationData?.inputValues?.sieve40 || '');
  const [sieve200, setSieve200] = useState(activeTest?.calculationData?.inputValues?.sieve200 || '');

  // --- DS-UU STATES FOR MOBILE ---
  const [dsUuRingNo, setDsUuRingNo] = useState<string>(
    activeTest?.calculationData?.inputValues?.dsUuRingNo || activeTest?.calculationData?.inputValues?.dsRingNo || ''
  );
  const [dsUuRingDia, setDsUuRingDia] = useState<string>(
    activeTest?.calculationData?.inputValues?.dsUuRingDia || activeTest?.calculationData?.inputValues?.dsRingDia || ''
  );
  const [dsUuRingHeight, setDsUuRingHeight] = useState<string>(
    activeTest?.calculationData?.inputValues?.dsUuRingHeight || activeTest?.calculationData?.inputValues?.dsRingHeight || ''
  );
  const [dsUuProvingCalibration, setDsUuProvingCalibration] = useState<string>(
    activeTest?.calculationData?.inputValues?.dsUuProvingCalibration || activeTest?.calculationData?.inputValues?.dsProvingCalibration || '0.12064'
  );
  const [dsUuNormalLoads, setDsUuNormalLoads] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuNormalLoads', 'dsUuNormalLoads', 3)
  );
  const [dsUuWetSoilPlusRing, setDsUuWetSoilPlusRing] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuWetSoilPlusRing', 'dsUuWetSoilPlusRing', 3)
  );
  const [dsUuContainerNo, setDsUuContainerNo] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuContainerNo', 'dsUuContainerNo', 3)
  );
  const [dsUuWetCanWeight, setDsUuWetCanWeight] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuWetCanWeight', 'dsUuWetCanWeight', 3)
  );
  const [dsUuDryCanWeight, setDsUuDryCanWeight] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuDryCanWeight', 'dsUuDryCanWeight', 3)
  );
  const [dsUuDialReadingsA, setDsUuDialReadingsA] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuDialReadingsA', 'dsUuDialReadingsA', 10)
  );
  const [dsUuDialReadingsB, setDsUuDialReadingsB] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuDialReadingsB', 'dsUuDialReadingsB', 10)
  );
  const [dsUuDialReadingsC, setDsUuDialReadingsC] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'dsUuDialReadingsC', 'dsUuDialReadingsC', 10)
  );

  const numDsDia = parseIndoFloat(dsUuRingDia);
  const numDsHeight = parseIndoFloat(dsUuRingHeight);
  const dsAreaCm2 = numDsDia > 0 ? (Math.PI / 4) * Math.pow(numDsDia, 2) : 0;
  const dsVolumeCm3 = (dsAreaCm2 > 0 && numDsHeight > 0) ? dsAreaCm2 * numDsHeight : 0;

  // FIX: Re-sync ALL test form states setiap kali activeTest berubah (mencegah stale state setelah Simpan Draft & buka ulang)
  useEffect(() => {
    const origSnapshot = activeTest?.originalTechnicianInput;
    const isLocked = Boolean(activeTest?.lockedByTechnician || activeTest?.status === 'Selesai');
    const iv = (isLocked && origSnapshot?.inputValues)
      ? origSnapshot.inputValues
      : (activeTest?.calculationData?.inputValues || activeTest?.calculationData || {});

    // SG
    setPycNo(iv.pycNo || '');
    setPycWaterTemp(iv.pycWaterTemp || '');
    setPycGsVal(iv.pycGsVal || iv.gsAvg || '');
    setPycNo1(iv.pycNo1 || iv.pycNo || '');
    setPycNo2(iv.pycNo2 || '');
    setWtDrySoil1(iv.wtDrySoil1 || (iv.sgA1 !== undefined ? String(iv.sgA1) : ''));
    setWtDrySoil2(iv.wtDrySoil2 || (iv.sgA2 !== undefined ? String(iv.sgA2) : ''));
    setTemp1(iv.temp1 || (iv.sgT1 !== undefined ? String(iv.sgT1) : ''));
    setTemp2(iv.temp2 || (iv.sgT2 !== undefined ? String(iv.sgT2) : ''));
    setWtPycWaterSoil1(iv.wtPycWaterSoil1 || (iv.sgB1 !== undefined ? String(iv.sgB1) : ''));
    setWtPycWaterSoil2(iv.wtPycWaterSoil2 || (iv.sgB2 !== undefined ? String(iv.sgB2) : ''));

    // ATB
    setAtbBlows(iv.atbBlows || ['', '', '', '']);
    setAtbContainer(iv.atbContainer || ['', '', '', '']);
    setAtbWet(iv.atbWet || ['', '', '', '']);
    setAtbDry(iv.atbDry || ['', '', '', '']);
    setAtbPlContainer(iv.atbPlContainer || ['', '']);
    setAtbPlWet(iv.atbPlWet || ['', '']);
    setAtbPlDry(iv.atbPlDry || ['', '']);

    // SVE-HYD
    setShSieveRetained(iv.shSieveRetained || Array(15).fill(''));
    setShHydroSoilWeight(iv.shHydroSoilWeight || iv.hydroSoilWt || '');
    setShHydroTemp(iv.shHydroTemp || iv.hydroTemp || '');
    setShHydroMeniscus(iv.shHydroMeniscus || iv.hydroMeniscus || '');
    setShHydroDispersant(iv.shHydroDispersant || iv.hydroDispersant || '');
    setShHydroReadings(iv.shHydroReadings || Array(9).fill(''));

    // DS-UU
    setDsUuRingNo(iv.dsUuRingNo || iv.dsRingNo || '');
    setDsUuRingDia(iv.dsUuRingDia || iv.dsRingDia || '');
    setDsUuRingHeight(iv.dsUuRingHeight || iv.dsRingHeight || '');
    setDsUuProvingCalibration(iv.dsUuProvingCalibration || iv.dsProvingCalibration || '0.12064');
    setDsUuNormalLoads(getArrayOrFlatSync(iv, 'dsUuNormalLoads', 'dsUuNormalLoads', 3));
    setDsUuWetSoilPlusRing(getArrayOrFlatSync(iv, 'dsUuWetSoilPlusRing', 'dsUuWetSoilPlusRing', 3));
    setDsUuContainerNo(getArrayOrFlatSync(iv, 'dsUuContainerNo', 'dsUuContainerNo', 3));
    setDsUuWetCanWeight(getArrayOrFlatSync(iv, 'dsUuWetCanWeight', 'dsUuWetCanWeight', 3));
    setDsUuDryCanWeight(getArrayOrFlatSync(iv, 'dsUuDryCanWeight', 'dsUuDryCanWeight', 3));
    setDsUuDialReadingsA(getArrayOrFlatSync(iv, 'dsUuDialReadingsA', 'dsUuDialReadingsA', 10));
    setDsUuDialReadingsB(getArrayOrFlatSync(iv, 'dsUuDialReadingsB', 'dsUuDialReadingsB', 10));
    setDsUuDialReadingsC(getArrayOrFlatSync(iv, 'dsUuDialReadingsC', 'dsUuDialReadingsC', 10));
  }, [activeTest?.id, activeTestCode]);

  // --- SVE-HYD COMPUTATIONS FOR MOBILE ---
  const updateSieveRetained = (idx: number, val: string) => {
    setShSieveRetained(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const updateHydroReading = (idx: number, val: string) => {
    setShHydroReadings(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const hydroSoilWt = parseIndoFloat(shHydroSoilWeight);
  const sieveRetainedNums = shSieveRetained.map(parseIndoFloat);
  const wSieveRetained = sieveRetainedNums.reduce((a, b) => a + b, 0);

  const hasSieveInput = shSieveRetained.some(v => v !== '' && parseIndoFloat(v) > 0);
  const hasHydroInput = shHydroReadings.some(v => v !== '' && parseIndoFloat(v) > 0);
  const hasSveData = hasSieveInput || hasHydroInput;

  let cumulativeRetainedAcc = 0;
  const sieveResultsHP = SIEVE_SPECIFICATIONS.map((spec, i) => {
    const retained = sieveRetainedNums[i];
    const pctRetained = (hydroSoilWt > 0 && hasSveData) ? (retained / hydroSoilWt) * 100 : 0;
    cumulativeRetainedAcc += pctRetained;
    const pctPassing = hasSveData ? Math.max(0, 100 - cumulativeRetainedAcc) : 0;
    return {
      ...spec,
      retained,
      pctRetained,
      cumPctRetained: cumulativeRetainedAcc,
      pctPassing
    };
  });

  const hydroTemp = parseIndoFloat(shHydroTemp);
  const hydroMeniscus = parseIndoFloat(shHydroMeniscus);
  const hydroDispersant = parseIndoFloat(shHydroDispersant);

  const TEMP_CORRECTION_TABLE: { [key: number]: number } = {
    15: -1.1, 16: -0.9, 17: -0.7, 18: -0.5, 19: -0.3,
    20: 0.0, 21: 0.2, 22: 0.4, 23: 0.7, 24: 0.8,
    25: 1.0, 26: 1.26, 27: 1.52, 28: 1.78, 29: 2.04, 30: 2.30
  };
  const tempCorrectionMt = TEMP_CORRECTION_TABLE[Math.round(hydroTemp)] ?? 0.8;
  const etaWater = 0.01 / (1 + 0.0337 * hydroTemp + 0.000221 * Math.pow(hydroTemp, 2));
  const gsForHydro = parseIndoFloat(pycGsVal) > 0 ? parseIndoFloat(pycGsVal) : 2.65;

  const hydroResultsHP = HYDROMETER_TIME_SPECIFICATIONS.map((spec, i) => {
    const rawR = parseIndoFloat(shHydroReadings[i]);
    const t = spec.timeMin;
    const rh = rawR > 0 ? rawR + hydroMeniscus : 0;
    const hrCm = rh > 0 ? Math.max(0.5, 16.29 - (rh * 0.1641)) : 0;
    const hrMm = hrCm * 10;
    const diamD = (t > 0 && gsForHydro > 1 && hrCm > 0)
      ? Math.sqrt((30 * etaWater * hrCm) / (980 * (gsForHydro - 1) * t))
      : 0;

    const correctedR = rawR > 0 ? rawR + tempCorrectionMt - hydroDispersant : 0;
    const pctFiner = (hydroSoilWt > 0 && correctedR > 0 && gsForHydro > 1)
      ? Math.min(100, Math.max(0, ((100000 / hydroSoilWt) * (gsForHydro / (gsForHydro - 1))) * (correctedR / 1000)))
      : 0;

    return {
      timeMin: t,
      rawR,
      rh,
      correctedR,
      hrMm,
      diamD,
      pctFiner
    };
  });

  // --- REFS FOR FRESH NUMPAD NEXT NAVIGATION ---
  const shSieveRetainedRef = useRef(shSieveRetained);
  shSieveRetainedRef.current = shSieveRetained;

  const shHydroReadingsRef = useRef(shHydroReadings);
  shHydroReadingsRef.current = shHydroReadings;

  const atbBlowsRef = useRef(atbBlows);
  atbBlowsRef.current = atbBlows;

  const atbContainerRef = useRef(atbContainer);
  atbContainerRef.current = atbContainer;

  const atbWetRef = useRef(atbWet);
  atbWetRef.current = atbWet;

  const atbDryRef = useRef(atbDry);
  atbDryRef.current = atbDry;

  const atbPlContainerRef = useRef(atbPlContainer);
  atbPlContainerRef.current = atbPlContainer;

  const atbPlWetRef = useRef(atbPlWet);
  atbPlWetRef.current = atbPlWet;

  const atbPlDryRef = useRef(atbPlDry);
  atbPlDryRef.current = atbPlDry;

  // --- REFS FOR DS-UU NUMPAD NAVIGATION ---
  const dsUuNormalLoadsRef = useRef(dsUuNormalLoads);
  dsUuNormalLoadsRef.current = dsUuNormalLoads;

  const dsUuWetSoilPlusRingRef = useRef(dsUuWetSoilPlusRing);
  dsUuWetSoilPlusRingRef.current = dsUuWetSoilPlusRing;

  const dsUuContainerNoRef = useRef(dsUuContainerNo);
  dsUuContainerNoRef.current = dsUuContainerNo;

  const dsUuWetCanWeightRef = useRef(dsUuWetCanWeight);
  dsUuWetCanWeightRef.current = dsUuWetCanWeight;

  const dsUuDryCanWeightRef = useRef(dsUuDryCanWeight);
  dsUuDryCanWeightRef.current = dsUuDryCanWeight;

  const dsUuDialReadingsARef = useRef(dsUuDialReadingsA);
  dsUuDialReadingsARef.current = dsUuDialReadingsA;

  const dsUuDialReadingsBRef = useRef(dsUuDialReadingsB);
  dsUuDialReadingsBRef.current = dsUuDialReadingsB;

  const dsUuDialReadingsCRef = useRef(dsUuDialReadingsC);
  dsUuDialReadingsCRef.current = dsUuDialReadingsC;

  // --- REFS & TOUCH NUMPAD TRIGGERS FOR SG (SPECIFIC GRAVITY) ---
  const pycNo1Ref = useRef(pycNo1); pycNo1Ref.current = pycNo1;
  const pycNo2Ref = useRef(pycNo2); pycNo2Ref.current = pycNo2;
  const wtDrySoil1Ref = useRef(wtDrySoil1); wtDrySoil1Ref.current = wtDrySoil1;
  const wtDrySoil2Ref = useRef(wtDrySoil2); wtDrySoil2Ref.current = wtDrySoil2;
  const temp1Ref = useRef(temp1); temp1Ref.current = temp1;
  const temp2Ref = useRef(temp2); temp2Ref.current = temp2;
  const wtPycWaterSoil1Ref = useRef(wtPycWaterSoil1); wtPycWaterSoil1Ref.current = wtPycWaterSoil1;
  const wtPycWaterSoil2Ref = useRef(wtPycWaterSoil2); wtPycWaterSoil2Ref.current = wtPycWaterSoil2;

  const openSgNumpad = (field: 'pyc1' | 'pyc2' | 'dry1' | 'dry2' | 'temp1' | 'temp2' | 'wet1' | 'wet2') => {
    if (field === 'pyc1') {
      setActiveNumpad({
        fieldId: 'pycNo1',
        label: 'Pycnometer No. (Trial 1)',
        value: pycNo1Ref.current,
        onChange: v => setPycNo1(v.toUpperCase()),
        allowDecimal: false,
        nextLabel: 'Lanjut ke Pyc No. 2 ➔',
        onNext: () => openSgNumpad('pyc2'),
      });
    } else if (field === 'pyc2') {
      setActiveNumpad({
        fieldId: 'pycNo2',
        label: 'Pycnometer No. (Trial 2)',
        value: pycNo2Ref.current,
        onChange: v => setPycNo2(v.toUpperCase()),
        allowDecimal: false,
        nextLabel: 'Lanjut ke Wt. Dry Soil 1 ➔',
        onNext: () => openSgNumpad('dry1'),
      });
    } else if (field === 'dry1') {
      setActiveNumpad({
        fieldId: 'wtDrySoil1',
        label: 'Wt. Dry Soil (A) Trial 1 [g]',
        value: wtDrySoil1Ref.current,
        onChange: v => setWtDrySoil1(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Wt. Dry Soil 2 ➔',
        onNext: () => openSgNumpad('dry2'),
      });
    } else if (field === 'dry2') {
      setActiveNumpad({
        fieldId: 'wtDrySoil2',
        label: 'Wt. Dry Soil (A) Trial 2 [g]',
        value: wtDrySoil2Ref.current,
        onChange: v => setWtDrySoil2(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Suhu T1 (°C) ➔',
        onNext: () => openSgNumpad('temp1'),
      });
    } else if (field === 'temp1') {
      setActiveNumpad({
        fieldId: 'temp1',
        label: 'Temperature Trial 1 [°C]',
        value: temp1Ref.current,
        onChange: v => setTemp1(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Suhu T2 (°C) ➔',
        onNext: () => openSgNumpad('temp2'),
      });
    } else if (field === 'temp2') {
      setActiveNumpad({
        fieldId: 'temp2',
        label: 'Temperature Trial 2 [°C]',
        value: temp2Ref.current,
        onChange: v => setTemp2(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Wt. Pyc+Air+Tanah 1 ➔',
        onNext: () => openSgNumpad('wet1'),
      });
    } else if (field === 'wet1') {
      setActiveNumpad({
        fieldId: 'wtPycWaterSoil1',
        label: 'Wt. Pyc + Water + Soil (B) Trial 1 [g]',
        value: wtPycWaterSoil1Ref.current,
        onChange: v => setWtPycWaterSoil1(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Trial 2 (B) ➔',
        onNext: () => openSgNumpad('wet2'),
      });
    } else if (field === 'wet2') {
      setActiveNumpad({
        fieldId: 'wtPycWaterSoil2',
        label: 'Wt. Pyc + Water + Soil (B) Trial 2 [g]',
        value: wtPycWaterSoil2Ref.current,
        onChange: v => setWtPycWaterSoil2(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Selesai Input SG ✓',
        onNext: () => setActiveNumpad(null),
      });
    }
  };

  // --- TOUCH NUMPAD TRIGGERS FOR DS-UU ---
  const openDsUuHeaderNumpad = (field: 'dia' | 'height' | 'calib') => {
    if (field === 'dia') {
      setActiveNumpad({
        fieldId: 'dsUuRingDia',
        label: 'Diameter Do [cm]',
        value: dsUuRingDia,
        onChange: v => setDsUuRingDia(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Tinggi Ho ➔',
        onNext: () => openDsUuHeaderNumpad('height'),
      });
    } else if (field === 'height') {
      setActiveNumpad({
        fieldId: 'dsUuRingHeight',
        label: 'Tinggi Ho [cm]',
        value: dsUuRingHeight,
        onChange: v => setDsUuRingHeight(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Calib Ring ➔',
        onNext: () => openDsUuHeaderNumpad('calib'),
      });
    } else if (field === 'calib') {
      setActiveNumpad({
        fieldId: 'dsUuProvingCalibration',
        label: 'Calib Ring [kgf/div]',
        value: dsUuProvingCalibration,
        onChange: v => setDsUuProvingCalibration(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Beban Normal Spec 1 ➔',
        onNext: () => openDsUuTable1Numpad('load', 0),
      });
    }
  };

  const openDsUuTable1Numpad = (field: 'load' | 'wetRing' | 'can' | 'wetCan' | 'dryCan', specIdx: number) => {
    const specName = specIdx === 0 ? 'Specimen 1 (A)' : specIdx === 1 ? 'Specimen 2 (B)' : 'Specimen 3 (C)';
    if (field === 'load') {
      setActiveNumpad({
        fieldId: `dsUuNormalLoads_${specIdx}`,
        label: `Beban Normal (${specName}) [kgf]`,
        value: dsUuNormalLoadsRef.current[specIdx] || '',
        onChange: v => setDsUuNormalLoads(prev => { const n = [...prev]; n[specIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: specIdx < 2 ? `Lanjut ke Beban Normal Spec ${specIdx + 2} ➔` : 'Lanjut ke Massa Tanah Basah + Ring ➔',
        onNext: specIdx < 2 ? () => openDsUuTable1Numpad('load', specIdx + 1) : () => openDsUuTable1Numpad('wetRing', 0),
      });
    } else if (field === 'wetRing') {
      setActiveNumpad({
        fieldId: `dsUuWetSoilPlusRing_${specIdx}`,
        label: `Massa tanah basah + ring (${specName}) [g]`,
        value: dsUuWetSoilPlusRingRef.current[specIdx] || '',
        onChange: v => setDsUuWetSoilPlusRing(prev => { const n = [...prev]; n[specIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: specIdx < 2 ? `Lanjut ke Spec ${specIdx + 2} ➔` : 'Lanjut ke No. Cawan ➔',
        onNext: specIdx < 2 ? () => openDsUuTable1Numpad('wetRing', specIdx + 1) : () => openDsUuTable1Numpad('can', 0),
      });
    } else if (field === 'can') {
      const curVal = dsUuContainerNoRef.current[specIdx] || '';
      setActiveContainerPicker({
        specIdx,
        label: `No. Cawan (${specName})`,
        value: curVal,
        isDsTest: true,
        onSelect: code => {
          const cleanCode = code.replace(/[^A-Za-z_-]/g, '').toUpperCase();
          setDsUuContainerNo(prev => { const n = [...prev]; n[specIdx] = cleanCode; return n; });
        },
        onNext: specIdx < 2 ? () => openDsUuTable1Numpad('can', specIdx + 1) : () => openDsUuTable1Numpad('wetCan', 0),
      });
    } else if (field === 'wetCan') {
      setActiveNumpad({
        fieldId: `dsUuWetCanWeight_${specIdx}`,
        label: `Wt. wet sample + container (${specName}) [g]`,
        value: dsUuWetCanWeightRef.current[specIdx] || '',
        onChange: v => setDsUuWetCanWeight(prev => { const n = [...prev]; n[specIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: specIdx < 2 ? `Lanjut ke Spec ${specIdx + 2} ➔` : 'Lanjut ke Wt Dry + Container ➔',
        onNext: specIdx < 2 ? () => openDsUuTable1Numpad('wetCan', specIdx + 1) : () => openDsUuTable1Numpad('dryCan', 0),
      });
    } else if (field === 'dryCan') {
      setActiveNumpad({
        fieldId: `dsUuDryCanWeight_${specIdx}`,
        label: `Wt. dry sample + container (${specName}) [g]`,
        value: dsUuDryCanWeightRef.current[specIdx] || '',
        onChange: v => setDsUuDryCanWeight(prev => { const n = [...prev]; n[specIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: specIdx < 2 ? `Lanjut ke Spec ${specIdx + 2} ➔` : 'Lanjut ke Dial Reading ➔',
        onNext: specIdx < 2 ? () => openDsUuTable1Numpad('dryCan', specIdx + 1) : () => openDsUuDialNumpad(0, 0),
      });
    }
  };

  // --- DYNAMIC ROW & SPECIMEN COLUMN HANDLERS FOR DS-UU ---
  const handleAddDsRow = () => {
    setDsUuDialReadingsA(prev => [...prev, '']);
    setDsUuDialReadingsB(prev => [...prev, '']);
    setDsUuDialReadingsC(prev => [...prev, '']);
  };

  const handleDeleteDsRow = (rowIdx: number) => {
    if (dsUuDialReadingsA.length <= 1) return;
    setDsUuDialReadingsA(prev => prev.filter((_, i) => i !== rowIdx));
    setDsUuDialReadingsB(prev => prev.filter((_, i) => i !== rowIdx));
    setDsUuDialReadingsC(prev => prev.filter((_, i) => i !== rowIdx));
  };

  const handleAddDsSpecimen = () => {
    setDsUuNormalLoads(prev => prev.length < 6 ? [...prev, ''] : prev);
    setDsUuWetSoilPlusRing(prev => prev.length < 6 ? [...prev, ''] : prev);
    setDsUuContainerNo(prev => prev.length < 6 ? [...prev, ''] : prev);
    setDsUuWetCanWeight(prev => prev.length < 6 ? [...prev, ''] : prev);
    setDsUuDryCanWeight(prev => prev.length < 6 ? [...prev, ''] : prev);
  };

  const openDsUuDialNumpad = (specIdx: number, rowIdx: number) => {
    const totalRows = dsUuDialReadingsARef.current.length;
    const dispMm = rowIdx * 0.30;
    const specName = `Specimen ${specIdx + 1}`;
    const refArray = specIdx === 0 ? dsUuDialReadingsARef.current : specIdx === 1 ? dsUuDialReadingsBRef.current : dsUuDialReadingsCRef.current;
    const curVal = refArray[rowIdx] || '';

    const updateDial = (val: string) => {
      const setter = specIdx === 0 ? setDsUuDialReadingsA : specIdx === 1 ? setDsUuDialReadingsB : setDsUuDialReadingsC;
      setter(prev => { const n = [...prev]; n[rowIdx] = cleanIndoNumStr(val); return n; });
    };

    const isLastRow = rowIdx === totalRows - 1;
    const isLastSpec = specIdx === 2;
    const nextDispMm = (rowIdx + 1) * 0.30;

    setActiveNumpad({
      fieldId: `dsUuDial_${specIdx}_${rowIdx}`,
      label: `Load Dial div (${specName} - ${dispMm.toFixed(2)} mm)`,
      value: curVal,
      onChange: updateDial,
      allowDecimal: true,
      nextLabel: !isLastRow ? `Lanjut ke ${nextDispMm.toFixed(2)} mm ➔` : (!isLastSpec ? `Lanjut ke Specimen ${specIdx + 2} ➔` : 'Selesai ➔'),
      onNext: !isLastRow ? () => openDsUuDialNumpad(specIdx, rowIdx + 1) : (!isLastSpec ? () => openDsUuDialNumpad(specIdx + 1, 0) : () => setActiveNumpad(null)),
    });
  };

  // --- TOUCH NUMPAD TRIGGERS FOR SVE-HYD & ATB ---
  const openSieveNumpad = (i: number) => {
    const spec = SIEVE_SPECIFICATIONS[i];
    if (!spec) return;
    const curVal = shSieveRetainedRef.current[i] || '';
    setActiveNumpad({
      fieldId: `shSieveRetained_${i}`,
      label: `Berat Retained ${spec.name} [g]`,
      value: curVal,
      onChange: v => updateSieveRetained(i, cleanIndoNumStr(v)),
      allowDecimal: true,
      nextLabel: i < SIEVE_SPECIFICATIONS.length - 1 ? `Lanjut ke ${SIEVE_SPECIFICATIONS[i + 1].name} ➔` : 'Selesai ➔',
      onNext: i < SIEVE_SPECIFICATIONS.length - 1 ? () => openSieveNumpad(i + 1) : () => setActiveNumpad(null),
    });
  };

  const openHydroReadingNumpad = (i: number) => {
    const spec = HYDROMETER_TIME_SPECIFICATIONS[i];
    if (!spec) return;
    const curVal = shHydroReadingsRef.current[i] || '';
    setActiveNumpad({
      fieldId: `shHydroReadings_${i}`,
      label: `Reading R'h (${spec.timeMin} min)`,
      value: curVal,
      onChange: v => updateHydroReading(i, cleanIndoNumStr(v)),
      allowDecimal: true,
      nextLabel: i < HYDROMETER_TIME_SPECIFICATIONS.length - 1 ? `Lanjut ke ${HYDROMETER_TIME_SPECIFICATIONS[i + 1].timeMin} min ➔` : 'Selesai ➔',
      onNext: i < HYDROMETER_TIME_SPECIFICATIONS.length - 1 ? () => openHydroReadingNumpad(i + 1) : () => setActiveNumpad(null),
    });
  };

  const openHydroHeaderNumpad = (field: 'ws' | 'temp' | 'meniscus' | 'dispersant') => {
    if (field === 'ws') {
      setActiveNumpad({
        fieldId: 'shHydroSoilWeight',
        label: 'Ws — Berat Kering Sampel [g]',
        value: shHydroSoilWeight,
        onChange: v => setShHydroSoilWeight(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Suhu Uji ➔',
        onNext: () => openHydroHeaderNumpad('temp'),
      });
    } else if (field === 'temp') {
      setActiveNumpad({
        fieldId: 'shHydroTemp',
        label: 'Suhu Uji T [°C]',
        value: shHydroTemp,
        onChange: v => setShHydroTemp(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Koreksi Meniscus ➔',
        onNext: () => openHydroHeaderNumpad('meniscus'),
      });
    } else if (field === 'meniscus') {
      setActiveNumpad({
        fieldId: 'shHydroMeniscus',
        label: 'Koreksi Meniscus c',
        value: shHydroMeniscus,
        onChange: v => setShHydroMeniscus(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Koreksi Dispersan ➔',
        onNext: () => openHydroHeaderNumpad('dispersant'),
      });
    } else if (field === 'dispersant') {
      setActiveNumpad({
        fieldId: 'shHydroDispersant',
        label: 'Koreksi Dispersan mt',
        value: shHydroDispersant,
        onChange: v => setShHydroDispersant(cleanIndoNumStr(v)),
        allowDecimal: true,
        nextLabel: 'Lanjut ke Reading 0.5 min ➔',
        onNext: () => openHydroReadingNumpad(0),
      });
    }
  };

  const openAtbLlNumpad = (rowType: 'container' | 'wet' | 'dry' | 'blows', colIdx: number) => {
    const trialNo = colIdx + 1;
    if (rowType === 'container') {
      setActiveNumpad({
        fieldId: `atbContainer_${colIdx}`,
        label: `No. Cawan (LL Trial ${trialNo})`,
        value: atbContainerRef.current[colIdx] || '',
        onChange: v => {
          const code = v.toUpperCase();
          setAtbContainer(prev => { const n = [...prev]; n[colIdx] = code; return n; });
        },
        allowDecimal: false,
        nextLabel: `Lanjut ke Wet LL ${trialNo} ➔`,
        onNext: () => openAtbLlNumpad('wet', colIdx),
      });
    } else if (rowType === 'wet') {
      setActiveNumpad({
        fieldId: `atbWet_${colIdx}`,
        label: `Berat Cawan + Tanah Basah (LL Trial ${trialNo}) [g]`,
        value: atbWetRef.current[colIdx] || '',
        onChange: v => setAtbWet(prev => { const n = [...prev]; n[colIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: `Lanjut ke Dry LL ${trialNo} ➔`,
        onNext: () => openAtbLlNumpad('dry', colIdx),
      });
    } else if (rowType === 'dry') {
      setActiveNumpad({
        fieldId: `atbDry_${colIdx}`,
        label: `Berat Cawan + Tanah Kering (LL Trial ${trialNo}) [g]`,
        value: atbDryRef.current[colIdx] || '',
        onChange: v => setAtbDry(prev => { const n = [...prev]; n[colIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: `Lanjut ke Pukulan LL ${trialNo} ➔`,
        onNext: () => openAtbLlNumpad('blows', colIdx),
      });
    } else if (rowType === 'blows') {
      setActiveNumpad({
        fieldId: `atbBlows_${colIdx}`,
        label: `Banyak Pukulan (LL Trial ${trialNo})`,
        value: atbBlowsRef.current[colIdx] || '',
        onChange: v => setAtbBlows(prev => { const n = [...prev]; n[colIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: false,
        nextLabel: colIdx < 3 ? `Lanjut ke LL Trial ${trialNo + 1} ➔` : 'Lanjut ke Plastic Limit ➔',
        onNext: colIdx < 3 ? () => openAtbLlNumpad('container', colIdx + 1) : () => openAtbPlNumpad('container', 0),
      });
    }
  };

  const openAtbPlNumpad = (rowType: 'container' | 'wet' | 'dry', colIdx: number) => {
    const trialNo = colIdx + 1;
    if (rowType === 'container') {
      setActiveNumpad({
        fieldId: `atbPlContainer_${colIdx}`,
        label: `No. Cawan PL ${trialNo}`,
        value: atbPlContainerRef.current[colIdx] || '',
        onChange: v => {
          const code = v.toUpperCase();
          setAtbPlContainer(prev => { const n = [...prev]; n[colIdx] = code; return n; });
        },
        allowDecimal: false,
        nextLabel: `Lanjut ke Wet PL ${trialNo} ➔`,
        onNext: () => openAtbPlNumpad('wet', colIdx),
      });
    } else if (rowType === 'wet') {
      setActiveNumpad({
        fieldId: `atbPlWet_${colIdx}`,
        label: `Berat Cawan + Tanah Basah PL ${trialNo} [g]`,
        value: atbPlWetRef.current[colIdx] || '',
        onChange: v => setAtbPlWet(prev => { const n = [...prev]; n[colIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: `Lanjut ke Dry PL ${trialNo} ➔`,
        onNext: () => openAtbPlNumpad('dry', colIdx),
      });
    } else if (rowType === 'dry') {
      setActiveNumpad({
        fieldId: `atbPlDry_${colIdx}`,
        label: `Berat Cawan + Tanah Kering PL ${trialNo} [g]`,
        value: atbPlDryRef.current[colIdx] || '',
        onChange: v => setAtbPlDry(prev => { const n = [...prev]; n[colIdx] = cleanIndoNumStr(v); return n; }),
        allowDecimal: true,
        nextLabel: colIdx < 1 ? `Lanjut ke PL Trial ${trialNo + 1} ➔` : 'Selesai ➔',
        onNext: colIdx < 1 ? () => openAtbPlNumpad('container', colIdx + 1) : () => setActiveNumpad(null),
      });
    }
  };

  // 5. Direct Shear / Triaxial inputs
  const [cohesionInput, setCohesionInput] = useState(activeTest?.calculationData?.inputValues?.cohesion || '');
  const [frictionAngleInput, setFrictionAngleInput] = useState(activeTest?.calculationData?.inputValues?.frictionAngle || '');
  const [selectedRingNo, setSelectedRingNo] = useState(activeTest?.calculationData?.inputValues?.ringNo ?? '');
  const [lrcInput, setLrcInput] = useState(activeTest?.calculationData?.inputValues?.lrc || '0.12064');

  // ─── 5.1 TRIAXIAL UU (TRX-UU) STATE — SNI 4813:2015 / ASTM D2850 ───
  const [trxUuMethod, setTrxUuMethod] = useState<'normal' | 'multistage'>(
    activeTest?.calculationData?.inputValues?.trxUuMethod || 'normal'
  );
  const [trxDia, setTrxDia] = useState<string>(activeTest?.calculationData?.inputValues?.trxDia || '3.80');
  const [trxHeight, setTrxHeight] = useState<string>(activeTest?.calculationData?.inputValues?.trxHeight || '7.60');
  const [trxDialDiv, setTrxDialDiv] = useState<string>(activeTest?.calculationData?.inputValues?.trxDialDiv || '0.002');
  const [trxLoadRate, setTrxLoadRate] = useState<string>(activeTest?.calculationData?.inputValues?.trxLoadRate || '0.140');
  const [trxRingNo, setTrxRingNo] = useState<string>(activeTest?.calculationData?.inputValues?.trxRingNo || 'GT-105 (S/N: 235669)');
  const [trxLrc, setTrxLrc] = useState<string>(activeTest?.calculationData?.inputValues?.trxLrc || '0.12064');
  const [trxCellPressures, setTrxCellPressures] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.trxCellPressures || ['0.500', '1.000', '2.000']
  );
  const [trxActiveSpecimenTab, setTrxActiveSpecimenTab] = useState<'all' | 'spec1' | 'spec2' | 'spec3'>('all');

  const [trxLoadReadingsA, setTrxLoadReadingsA] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'trxLoadReadingsA', 'trxLoadA', 20)
  );
  const [trxLoadReadingsB, setTrxLoadReadingsB] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'trxLoadReadingsB', 'trxLoadB', 20)
  );
  const [trxLoadReadingsC, setTrxLoadReadingsC] = useState<string[]>(() =>
    getArrayOrFlatSync(activeTest?.calculationData?.inputValues, 'trxLoadReadingsC', 'trxLoadC', 20)
  );

  const trxNumDia = parseIndoFloat(trxDia) || 3.8;
  const trxArea0 = (Math.PI / 4) * Math.pow(trxNumDia, 2);

  // 5.5 UCT (Unconfined Compression Test - SNI 3638:2012 / ASTM D2166) State
  const [uctDeformRate, setUctDeformRate] = useState<string>(activeTest?.calculationData?.inputValues?.uctDeformRate || '1.000');
  const [uctRingNo, setUctRingNo] = useState<string>(activeTest?.calculationData?.inputValues?.uctRingNo || 'GT-102 (100.CKAF09.25)');
  const [uctPrCalib, setUctPrCalib] = useState<string>(activeTest?.calculationData?.inputValues?.uctPrCalib || '0.5778');
  const [uctActiveSubTabSpec, setUctActiveSubTabSpec] = useState<'uds' | 'rem'>('uds');

  // UDS Specimen
  const [uctDiaUds, setUctDiaUds] = useState<string>(activeTest?.calculationData?.inputValues?.uctDiaUds || '38.000');
  const [uctLengthUds, setUctLengthUds] = useState<string>(activeTest?.calculationData?.inputValues?.uctLengthUds || '76.000');
  const [uctWetMassUds, setUctWetMassUds] = useState<string>(activeTest?.calculationData?.inputValues?.uctWetMassUds || '');
  const [uctDryMassUds, setUctDryMassUds] = useState<string>(activeTest?.calculationData?.inputValues?.uctDryMassUds || '');
  const [uctDialDeformUds, setUctDialDeformUds] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.uctDialDeformUds || DEFAULT_UCT_DEFORM_STEPS
  );
  const [uctDialForceUds, setUctDialForceUds] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.uctDialForceUds || Array(DEFAULT_UCT_DEFORM_STEPS.length).fill('')
  );

  // REM Specimen
  const [uctDiaRem, setUctDiaRem] = useState<string>(activeTest?.calculationData?.inputValues?.uctDiaRem || '38.000');
  const [uctLengthRem, setUctLengthRem] = useState<string>(activeTest?.calculationData?.inputValues?.uctLengthRem || '76.000');
  const [uctWetMassRem, setUctWetMassRem] = useState<string>(activeTest?.calculationData?.inputValues?.uctWetMassRem || '');
  const [uctDryMassRem, setUctDryMassRem] = useState<string>(activeTest?.calculationData?.inputValues?.uctDryMassRem || '');
  const [uctDialDeformRem, setUctDialDeformRem] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.uctDialDeformRem || DEFAULT_UCT_DEFORM_STEPS
  );
  const [uctDialForceRem, setUctDialForceRem] = useState<string[]>(
    activeTest?.calculationData?.inputValues?.uctDialForceRem || Array(DEFAULT_UCT_DEFORM_STEPS.length).fill('')
  );

  // UCT Live Computations
  const uctCalibVal = parseIndoFloat(uctPrCalib) || 0.5778;

  // UDS Specs
  const d0Uds = parseIndoFloat(uctDiaUds) || 38.0; // mm
  const l0Uds = parseIndoFloat(uctLengthUds) || 76.0; // mm
  const a0Uds = (Math.PI / 4) * Math.pow(d0Uds / 10, 2); // cm2
  const vUds = a0Uds * (l0Uds / 10); // cm3
  const wetMassUds = parseIndoFloat(uctWetMassUds);
  const dryMassUds = parseIndoFloat(uctDryMassUds);
  const mcUds = dryMassUds > 0 ? ((wetMassUds - dryMassUds) / dryMassUds) * 100 : 0;
  const bulkDensityUds = vUds > 0 && wetMassUds > 0 ? wetMassUds / vUds : 0;
  const dryDensityUds = vUds > 0 && dryMassUds > 0 ? dryMassUds / vUds : 0;

  const uctRowsUds = uctDialForceUds.map((fStr, idx) => {
    const dialDef = parseIndoFloat(uctDialDeformUds[idx]) || (idx * 50);
    const deltaL = dialDef * 0.01; // mm
    const strainPct = l0Uds > 0 ? (deltaL / l0Uds) * 100 : 0;
    const forceDiv = parseIndoFloat(fStr);
    const forceKgf = forceDiv * uctCalibVal;
    const corrArea = strainPct < 100 ? a0Uds / (1 - strainPct / 100) : a0Uds;
    const stressKg = corrArea > 0 ? forceKgf / corrArea : 0;
    const stressKpa = stressKg * 98.0665;
    return {
      step: idx + 1,
      dialDef,
      deltaL,
      strainPct,
      forceDiv,
      forceKgf,
      corrArea,
      stressKg,
      stressKpa
    };
  });
  const uctQuUds = uctRowsUds.length > 0 ? Math.max(0, ...uctRowsUds.map(r => r.stressKpa)) : 0;
  const uctSuUds = uctQuUds / 2;
  const uctRowPeakUds = uctRowsUds.find(r => Math.abs(r.stressKpa - uctQuUds) < 0.001);
  const uctStrainFailUds = uctRowPeakUds ? uctRowPeakUds.strainPct : 0;

  // REM Specs
  const d0Rem = parseIndoFloat(uctDiaRem) || 38.0; // mm
  const l0Rem = parseIndoFloat(uctLengthRem) || 76.0; // mm
  const a0Rem = (Math.PI / 4) * Math.pow(d0Rem / 10, 2); // cm2
  const vRem = a0Rem * (l0Rem / 10); // cm3
  const wetMassRem = parseIndoFloat(uctWetMassRem);
  const dryMassRem = parseIndoFloat(uctDryMassRem);
  const mcRem = dryMassRem > 0 ? ((wetMassRem - dryMassRem) / dryMassRem) * 100 : 0;
  const bulkDensityRem = vRem > 0 && wetMassRem > 0 ? wetMassRem / vRem : 0;
  const dryDensityRem = vRem > 0 && dryMassRem > 0 ? dryMassRem / vRem : 0;

  const uctRowsRem = uctDialForceRem.map((fStr, idx) => {
    const dialDef = parseIndoFloat(uctDialDeformRem[idx]) || (idx * 50);
    const deltaL = dialDef * 0.01; // mm
    const strainPct = l0Rem > 0 ? (deltaL / l0Rem) * 100 : 0;
    const forceDiv = parseIndoFloat(fStr);
    const forceKgf = forceDiv * uctCalibVal;
    const corrArea = strainPct < 100 ? a0Rem / (1 - strainPct / 100) : a0Rem;
    const stressKg = corrArea > 0 ? forceKgf / corrArea : 0;
    const stressKpa = stressKg * 98.0665;
    return {
      step: idx + 1,
      dialDef,
      deltaL,
      strainPct,
      forceDiv,
      forceKgf,
      corrArea,
      stressKg,
      stressKpa
    };
  });
  const uctQuRem = uctRowsRem.length > 0 ? Math.max(0, ...uctRowsRem.map(r => r.stressKpa)) : 0;
  const uctSuRem = uctQuRem / 2;
  const uctRowPeakRem = uctRowsRem.find(r => Math.abs(r.stressKpa - uctQuRem) < 0.001);
  const uctStrainFailRem = uctRowPeakRem ? uctRowPeakRem.strainPct : 0;
  const uctSensitivity = uctQuRem > 0 ? uctQuUds / uctQuRem : 0;

  // UCT Row Manipulation Helpers
  const handleAddUctRow = (spec: 'uds' | 'rem') => {
    if (spec === 'uds') {
      const lastDef = uctDialDeformUds.length > 0 ? (parseIndoFloat(uctDialDeformUds[uctDialDeformUds.length - 1]) || 0) : 0;
      setUctDialDeformUds(prev => [...prev, String(lastDef + 50)]);
      setUctDialForceUds(prev => [...prev, '']);
    } else {
      const lastDef = uctDialDeformRem.length > 0 ? (parseIndoFloat(uctDialDeformRem[uctDialDeformRem.length - 1]) || 0) : 0;
      setUctDialDeformRem(prev => [...prev, String(lastDef + 50)]);
      setUctDialForceRem(prev => [...prev, '']);
    }
  };

  const handleRemoveUctRow = (spec: 'uds' | 'rem', idx: number) => {
    if (spec === 'uds') {
      if (uctDialForceUds.length <= 1) return;
      setUctDialDeformUds(prev => prev.filter((_, i) => i !== idx));
      setUctDialForceUds(prev => prev.filter((_, i) => i !== idx));
    } else {
      if (uctDialForceRem.length <= 1) return;
      setUctDialDeformRem(prev => prev.filter((_, i) => i !== idx));
      setUctDialForceRem(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleTrimEmptyUctRows = (spec: 'uds' | 'rem') => {
    if (spec === 'uds') {
      let lastIdx = uctDialForceUds.length - 1;
      while (lastIdx > 0 && (!uctDialForceUds[lastIdx] || parseIndoFloat(uctDialForceUds[lastIdx]) === 0)) {
        lastIdx--;
      }
      const newLen = lastIdx + 1;
      if (newLen < uctDialForceUds.length && newLen >= 1) {
        setUctDialDeformUds(prev => prev.slice(0, newLen));
        setUctDialForceUds(prev => prev.slice(0, newLen));
      }
    } else {
      let lastIdx = uctDialForceRem.length - 1;
      while (lastIdx > 0 && (!uctDialForceRem[lastIdx] || parseIndoFloat(uctDialForceRem[lastIdx]) === 0)) {
        lastIdx--;
      }
      const newLen = lastIdx + 1;
      if (newLen < uctDialForceRem.length && newLen >= 1) {
        setUctDialDeformRem(prev => prev.slice(0, newLen));
        setUctDialForceRem(prev => prev.slice(0, newLen));
      }
    }
  };

  const handleResetUctRows = (spec: 'uds' | 'rem') => {
    if (spec === 'uds') {
      setUctDialDeformUds(DEFAULT_UCT_DEFORM_STEPS);
      setUctDialForceUds(Array(DEFAULT_UCT_DEFORM_STEPS.length).fill(''));
    } else {
      setUctDialDeformRem(DEFAULT_UCT_DEFORM_STEPS);
      setUctDialForceRem(Array(DEFAULT_UCT_DEFORM_STEPS.length).fill(''));
    }
  };

  // ─── TRX-UU Row Manipulation Helpers ───
  const handleAddTrxRow = () => {
    setIsDirty(true);
    setTrxLoadReadingsA(p => [...p, '']);
    setTrxLoadReadingsB(p => [...p, '']);
    setTrxLoadReadingsC(p => [...p, '']);
  };

  const handleRemoveTrxRow = (rIdx: number) => {
    setIsDirty(true);
    setTrxLoadReadingsA(p => p.filter((_, i) => i !== rIdx));
    setTrxLoadReadingsB(p => p.filter((_, i) => i !== rIdx));
    setTrxLoadReadingsC(p => p.filter((_, i) => i !== rIdx));
  };

  const handleTrimEmptyTrxRows = () => {
    setIsDirty(true);
    const maxLen = Math.max(trxLoadReadingsA.length, trxLoadReadingsB.length, trxLoadReadingsC.length);
    let lastIdx = maxLen - 1;
    while (
      lastIdx > 0 &&
      (!trxLoadReadingsA[lastIdx] || parseIndoFloat(trxLoadReadingsA[lastIdx]) === 0) &&
      (!trxLoadReadingsB[lastIdx] || parseIndoFloat(trxLoadReadingsB[lastIdx]) === 0) &&
      (!trxLoadReadingsC[lastIdx] || parseIndoFloat(trxLoadReadingsC[lastIdx]) === 0)
    ) {
      lastIdx--;
    }
    const newLen = lastIdx + 1;
    if (newLen < maxLen && newLen >= 1) {
      setTrxLoadReadingsA(p => p.slice(0, newLen));
      setTrxLoadReadingsB(p => p.slice(0, newLen));
      setTrxLoadReadingsC(p => p.slice(0, newLen));
    }
  };

  const handleResetTrxRows = () => {
    setIsDirty(true);
    setTrxLoadReadingsA(Array(20).fill(''));
    setTrxLoadReadingsB(Array(20).fill(''));
    setTrxLoadReadingsC(Array(20).fill(''));
  };

  // 6. Consolidation Test (CT)
  const [consolCc, setConsolCc] = useState(activeTest?.calculationData?.inputValues?.cc || '');
  const [consolCs, setConsolCs] = useState(activeTest?.calculationData?.inputValues?.cs || '');
  const [consolPc, setConsolPc] = useState(activeTest?.calculationData?.inputValues?.pc || '');

  // 7. Compaction & CBR Test (CMP / CBR-SOK / CBR-UNS)
  const [cbrMoldNo, setCbrMoldNo] = useState(activeTest?.calculationData?.inputValues?.cbrMoldNo || 'MLD-01');
  const [cbrSwelling, setCbrSwelling] = useState(activeTest?.calculationData?.inputValues?.cbrSwelling || '0.15');
  const [cbrPctVal, setCbrPctVal] = useState(activeTest?.calculationData?.inputValues?.cbrPctVal || '');

  // 8. Permeability Falling Head Test (PB)
  const [prmKVal, setPrmKVal] = useState(activeTest?.calculationData?.inputValues?.prmKVal || '');

  // 9. Unit Weight / Density (UW)
  const [uwRingNo, setUwRingNo] = useState(activeTest?.calculationData?.inputValues?.ringNo ?? '');
  const [uwRingWetWeight, setUwRingWetWeight] = useState(activeTest?.calculationData?.inputValues?.ringWetWeight || '');

  // FIX: Re-sync UW, TRX, UCT, CT, CBR, PB states setiap kali activeTest berubah (mencegah stale state setelah Simpan Draft)
  useEffect(() => {
    const iv = activeTest?.calculationData?.inputValues || activeTest?.calculationData || {};

    // UW
    setUwRingNo(iv.ringNo ?? '');
    setUwRingWetWeight(iv.ringWetWeight || '');

    // Direct Shear / Ring shared
    setCohesionInput(iv.cohesion || '');
    setFrictionAngleInput(iv.frictionAngle || '');
    setSelectedRingNo(iv.ringNo ?? '');
    setLrcInput(iv.lrc || '0.12064');

    // TRX
    setTrxUuMethod(iv.trxUuMethod || 'normal');
    setTrxDia(iv.trxDia || '3.80');
    setTrxHeight(iv.trxHeight || '7.60');
    setTrxDialDiv(iv.trxDialDiv || '0.002');
    setTrxLoadRate(iv.trxLoadRate || '0.140');
    setTrxRingNo(iv.trxRingNo || 'GT-105 (S/N: 235669)');
    setTrxLrc(iv.trxLrc || '0.12064');
    setTrxCellPressures(iv.trxCellPressures || ['0.500', '1.000', '2.000']);
    setTrxLoadReadingsA(getArrayOrFlatSync(iv, 'trxLoadReadingsA', 'trxLoadA', 20));
    setTrxLoadReadingsB(getArrayOrFlatSync(iv, 'trxLoadReadingsB', 'trxLoadB', 20));
    setTrxLoadReadingsC(getArrayOrFlatSync(iv, 'trxLoadReadingsC', 'trxLoadC', 20));

    // UCT
    setUctDeformRate(iv.uctDeformRate || '1.000');
    setUctRingNo(iv.uctRingNo || 'GT-102 (100.CKAF09.25)');
    setUctPrCalib(iv.uctPrCalib || '0.5778');
    setUctDiaUds(iv.uctDiaUds || '38.000');
    setUctLengthUds(iv.uctLengthUds || '76.000');
    setUctWetMassUds(iv.uctWetMassUds || '');
    setUctDryMassUds(iv.uctDryMassUds || '');
    setUctDialDeformUds(iv.uctDialDeformUds || DEFAULT_UCT_DEFORM_STEPS);
    setUctDialForceUds(iv.uctDialForceUds || Array(DEFAULT_UCT_DEFORM_STEPS.length).fill(''));
    setUctDiaRem(iv.uctDiaRem || '38.000');
    setUctLengthRem(iv.uctLengthRem || '76.000');
    setUctWetMassRem(iv.uctWetMassRem || '');
    setUctDryMassRem(iv.uctDryMassRem || '');
    setUctDialDeformRem(iv.uctDialDeformRem || DEFAULT_UCT_DEFORM_STEPS);
    setUctDialForceRem(iv.uctDialForceRem || Array(DEFAULT_UCT_DEFORM_STEPS.length).fill(''));

    // CT
    setConsolCc(iv.cc || '');
    setConsolCs(iv.cs || '');
    setConsolPc(iv.pc || '');

    // CBR
    setCbrMoldNo(iv.cbrMoldNo || 'MLD-01');
    setCbrSwelling(iv.cbrSwelling || '0.15');
    setCbrPctVal(iv.cbrPctVal || '');

    // PRM
    setPrmKVal(iv.prmKVal || '');
  }, [activeTest?.id, activeTestCode]);

  // Unit Weight calculations
  const cleanUwRingCode = (uwRingNo || '').trim().toUpperCase();
  const matchedUwRing = (ringCatalogue || []).find(r => {
    const rNo = String(r.ringNo || (r as any).id || '').trim().toUpperCase();
    return rNo === cleanUwRingCode || `RING ${rNo}` === cleanUwRingCode || rNo === cleanUwRingCode.replace(/^RING\s*/i, '');
  });
  const uwRingWeightGrams = matchedUwRing ? matchedUwRing.weightGrams : 0;
  const uwRingVolumeCm3 = matchedUwRing ? matchedUwRing.volumeCm3 : 0;
  const numUwRingWet = parseFloat(String(uwRingWetWeight).replace(',', '.')) || 0;
  const computedBulkDensity = (matchedUwRing && uwRingWeightGrams > 0 && uwRingVolumeCm3 > 0 && numUwRingWet > 0)
    ? (numUwRingWet - uwRingWeightGrams) / uwRingVolumeCm3
    : 0;

  // 10. Custom Professional Numeric Keypad (Realtime Numpad for Mobile)
  const [activeNumpad, setActiveNumpad] = useState<{
    fieldId: string;
    label: string;
    value: string;
    onChange: (val: string) => void;
    allowDecimal?: boolean;
    onNext?: () => void;
    nextLabel?: string;
  } | null>(null);

  // 10.5 Custom Touch Container Picker Modal (Alphabet Cawan Selector for DS & MC)
  const [activeContainerPicker, setActiveContainerPicker] = useState<{
    specIdx?: number;
    label: string;
    value: string;
    isDsTest?: boolean;
    onSelect: (code: string) => void;
    onNext?: () => void;
  } | null>(null);

  const handleNumpadPress = (key: string) => {
    if (!activeNumpad) return;
    setIsDirty(true);
    let current = activeNumpad.value;

    if (key === 'BACKSPACE') {
      const nextVal = current.slice(0, -1);
      activeNumpad.onChange(nextVal);
      setActiveNumpad(prev => prev ? { ...prev, value: nextVal } : null);
      return;
    }

    if (key === 'CLEAR') {
      activeNumpad.onChange('');
      setActiveNumpad(prev => prev ? { ...prev, value: '' } : null);
      return;
    }

    if (key === 'TOGGLE_MINUS' || key === '-') {
      let nextVal = current;
      if (current.startsWith('-')) {
        nextVal = current.substring(1);
      } else {
        nextVal = '-' + current;
      }
      activeNumpad.onChange(nextVal);
      setActiveNumpad(prev => prev ? { ...prev, value: nextVal } : null);
      return;
    }

    if (key === '.') {
      if (activeNumpad.allowDecimal === false) return;
      if (current.includes('.')) return; // Strictly only 1 decimal point allowed!
      const nextVal = current === '' ? '0.' : current + '.';
      activeNumpad.onChange(nextVal);
      setActiveNumpad(prev => prev ? { ...prev, value: nextVal } : null);
      return;
    }

    // Numbers 0-9
    const nextVal = current + key;
    activeNumpad.onChange(nextVal);
    setActiveNumpad(prev => prev ? { ...prev, value: nextVal } : null);
  };

  // 🎹 Physical Keyboard Integration (Allows typing on PC / Laptop with on-screen Numpad active)
  useEffect(() => {
    if (!activeNumpad) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow browser shortcuts like Ctrl+R, F12, etc.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;

      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(key)) {
        e.preventDefault();
        handleNumpadPress(key);
      } else if (key === '.' || key === ',') {
        e.preventDefault();
        handleNumpadPress('.');
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleNumpadPress('BACKSPACE');
      } else if (key === 'Delete') {
        e.preventDefault();
        handleNumpadPress('CLEAR');
      } else if (key === '-' || key === '_') {
        e.preventDefault();
        handleNumpadPress('TOGGLE_MINUS');
      } else if (key === 'Enter' || key === 'Tab' || key === 'ArrowDown' || key === 'ArrowRight') {
        e.preventDefault();
        if (activeNumpad.onNext) {
          activeNumpad.onNext();
        } else {
          setActiveNumpad(null);
        }
      } else if (key === 'Escape') {
        e.preventDefault();
        setActiveNumpad(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNumpad]);

  // 🔤 Physical Keyboard Integration for Container Picker (A-Z or 0-9)
  useEffect(() => {
    if (!activeContainerPicker) return;

    const handleContainerKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setActiveContainerPicker(null);
        return;
      }

      const pressedChar = e.key.toUpperCase();
      if (/^[A-Z0-9]$/.test(pressedChar)) {
        e.preventDefault();
        activeContainerPicker.onSelect(pressedChar);
        if (activeContainerPicker.onNext) {
          activeContainerPicker.onNext();
        } else {
          setActiveContainerPicker(null);
        }
      }
    };

    window.addEventListener('keydown', handleContainerKeyDown);
    return () => window.removeEventListener('keydown', handleContainerKeyDown);
  }, [activeContainerPicker]);

  // Helper to open UCT numeric keypad with continuous recursive auto-next across all dial steps
  const openUctNumpad = (spec: 'uds' | 'rem', idx: number) => {
    const isUds = spec === 'uds';
    const forceArr = isUds ? uctDialForceUds : uctDialForceRem;
    const deformArr = isUds ? uctDialDeformUds : uctDialDeformRem;
    const maxLen = forceArr.length;

    if (idx < 0 || idx >= maxLen) return;

    const currentVal = forceArr[idx] || '';
    const deformVal = deformArr[idx] !== undefined ? deformArr[idx] : (idx * 50);

    setActiveNumpad({
      fieldId: `uct_${spec}_${idx}`,
      label: `Force Gauge (${isUds ? 'UDS' : 'REM'}) @ Dial ${deformVal} [div]`,
      value: currentVal,
      onChange: v => {
        const cleanVal = cleanIndoNumStr(v);
        if (isUds) {
          setUctDialForceUds(prev => {
            const next = [...prev];
            next[idx] = cleanVal;
            return next;
          });
        } else {
          setUctDialForceRem(prev => {
            const next = [...prev];
            next[idx] = cleanVal;
            return next;
          });
        }
      },
      allowDecimal: true,
      nextLabel: idx < maxLen - 1 ? `Lanjut ke Titik ${idx + 2} ➔` : 'Selesai ➔',
      onNext: () => {
        if (idx < maxLen - 1) {
          openUctNumpad(spec, idx + 1);
        } else {
          setActiveNumpad(null);
        }
      },
    });
  };

  // Helper to open TRX-UU numeric keypad with continuous recursive auto-next across all rows and specimens
  const openTrxUuNumpad = (spec: 'A' | 'B' | 'C', rIdx: number) => {
    const isA = spec === 'A';
    const isB = spec === 'B';
    const isC = spec === 'C';
    const readings = isA ? trxLoadReadingsA : isB ? trxLoadReadingsB : trxLoadReadingsC;
    const maxLen = Math.max(trxLoadReadingsA.length, trxLoadReadingsB.length, trxLoadReadingsC.length);

    if (rIdx < 0 || rIdx >= maxLen) return;

    const currentVal = readings[rIdx] || '';
    const defoVal = rIdx * 20;
    const specLabel = isA ? 'Specimen 1 (σ3 = 0.500)' : isB ? 'Specimen 2 (σ3 = 1.000)' : 'Specimen 3 (σ3 = 2.000)';

    let nextLabelText = '';
    let nextCallback: (() => void) | undefined;

    if (rIdx < maxLen - 1) {
      nextLabelText = `Lanjut ke Titik ${rIdx + 2} ➔`;
      nextCallback = () => openTrxUuNumpad(spec, rIdx + 1);
    } else {
      if (isA && trxUuMethod === 'normal') {
        nextLabelText = 'Lanjut ke Specimen 2 ➔';
        nextCallback = () => openTrxUuNumpad('B', 0);
      } else if (isB && trxUuMethod === 'normal') {
        nextLabelText = 'Lanjut ke Specimen 3 ➔';
        nextCallback = () => openTrxUuNumpad('C', 0);
      } else if (isA && trxUuMethod === 'multistage') {
        nextLabelText = 'Lanjut ke Tahap 2 ➔';
        nextCallback = () => openTrxUuNumpad('B', 0);
      } else {
        nextLabelText = 'Selesai ➔';
        nextCallback = () => setActiveNumpad(null);
      }
    }

    setActiveNumpad({
      fieldId: `trx_uu_${spec}_${rIdx}`,
      label: `Dial Beban (${specLabel}) @ Dial Def ${defoVal}`,
      value: currentVal,
      onChange: v => {
        const cleanVal = cleanIndoNumStr(v);
        if (isA) {
          setTrxLoadReadingsA(p => { const n = [...p]; n[rIdx] = cleanVal; return n; });
        } else if (isB) {
          setTrxLoadReadingsB(p => { const n = [...p]; n[rIdx] = cleanVal; return n; });
        } else {
          setTrxLoadReadingsC(p => { const n = [...p]; n[rIdx] = cleanVal; return n; });
        }
      },
      allowDecimal: true,
      nextLabel: nextLabelText,
      onNext: nextCallback,
    });
  };

  // 11. Tanggal Pengujian (Date Started & Date Completed)
  const [dateStarted, setDateStarted] = useState<string>(() => {
    return activeTest?.calculationData?.inputValues?.dateStarted || '';
  });
  const [dateCompleted, setDateCompleted] = useState<string>(() => {
    return activeTest?.calculationData?.inputValues?.dateCompleted || '';
  });

  // Photo list for active test or sample
  const [photos, setPhotos] = useState<TestPhoto[]>(() => {
    const activeNorm = (activeTestCode || '').toUpperCase().trim();
    // Only use photos that explicitly belong to this test type
    const testSpecificPhotos = (activeTest?.photos || []).filter(p =>
      !p.testTypeCode || (p.testTypeCode || '').toUpperCase() === activeNorm ||
      (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && ['PP', activeNorm].includes((p.testTypeCode || '').toUpperCase()))
    );
    if (testSpecificPhotos.length > 0) return testSpecificPhotos;

    const calcPhotos = (activeTest?.calculationData as any)?.photos || [];
    if (Array.isArray(calcPhotos) && calcPhotos.length > 0) return calcPhotos;

    const inputPhotos = (activeTest?.calculationData?.inputValues as any)?.photos || [];
    if (Array.isArray(inputPhotos) && inputPhotos.length > 0) return inputPhotos;

    const origPhotos = activeTest?.originalTechnicianInput?.photos || [];
    if (Array.isArray(origPhotos) && origPhotos.length > 0) return origPhotos;

    // Last resort: only use sample-level photos that explicitly match this test
    const samplePhotos = (currentSample.photos || []).filter(p => {
      if (!p.testTypeCode) return false; // Never include untagged sample photos — these are likely old auto-set
      const pNorm = (p.testTypeCode || '').toUpperCase();
      if (pNorm === activeNorm) return true;
      if (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && (pNorm === 'PP' || pNorm === activeNorm)) return true;
      return false;
    });
    return samplePhotos;
  });

  // Re-sync photos and test states when active test changes
  useEffect(() => {
    const activeNorm = (activeTestCode || '').toUpperCase().trim();
    const test = currentSample.tests.find(t => {
      const code = (t.testTypeCode || t.testTypeId || '').toUpperCase().trim();
      if (code === activeNorm) return true;
      if (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && code === 'PP') return true;
      if (isSieveHydroCode(activeNorm) && isSieveHydroCode(code)) return true;
      if (['PB', 'PRM'].includes(activeNorm) && ['PB', 'PRM'].includes(code)) return true;
      if (['CT', 'CNS'].includes(activeNorm) && ['CT', 'CNS'].includes(code)) return true;
      return code.includes(activeNorm) || activeNorm.includes(code);
    }) || currentSample.tests[0];

    if (test) {
      const origSnapshot = test.originalTechnicianInput;
      const isLocked = Boolean(test.lockedByTechnician || test.status === 'Selesai');
      const inputs = isLocked && origSnapshot?.inputValues
        ? origSnapshot.inputValues
        : (test.calculationData?.inputValues || test.calculationData || {});

      // Strictly prefer test.photos (most authoritative — what was explicitly saved for this test)
      // Fall through only when test.photos is genuinely empty (never uploaded yet)
      const testPhotos = (test.photos || []).filter(p =>
        !p.testTypeCode || (p.testTypeCode || '').toUpperCase() === activeNorm ||
        (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && ['PP', activeNorm].includes((p.testTypeCode || '').toUpperCase()))
      );

      let loadedPhotos: any[] = [];
      if (testPhotos.length > 0) {
        loadedPhotos = testPhotos;
      } else if ((test.calculationData as any)?.photos?.length > 0) {
        loadedPhotos = (test.calculationData as any).photos;
      } else if (inputs.photos?.length > 0) {
        loadedPhotos = inputs.photos;
      } else if (origSnapshot?.photos?.length > 0) {
        loadedPhotos = origSnapshot.photos;
      } else {
        // Last resort: sample-level photos that are explicitly tagged for this test
        loadedPhotos = (currentSample.photos || []).filter(p => {
          if (!p.testTypeCode) return false; // Don't include untagged — prevents old auto-set photos bleeding in
          const pNorm = (p.testTypeCode || '').toUpperCase();
          if (pNorm === activeNorm) return true;
          if (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && (pNorm === 'PP' || pNorm === activeNorm)) return true;
          return false;
        });
      }

      setPhotos(Array.isArray(loadedPhotos) ? loadedPhotos : []);
      setDateStarted(inputs.dateStarted || '');
      setDateCompleted(inputs.dateCompleted || '');
      if (inputs.mcContainer1 !== undefined) setMcContainer1(inputs.mcContainer1);
      else if (inputs.mcContainer !== undefined) setMcContainer1(inputs.mcContainer);

      if (inputs.mcContainer2 !== undefined) setMcContainer2(inputs.mcContainer2);

      if (inputs.mcWet1 !== undefined && inputs.mcWet1 !== '') setMcWet1(inputs.mcWet1);
      else if (inputs.mcWet !== undefined) setMcWet1(inputs.mcWet);

      if (inputs.mcWet2 !== undefined) setMcWet2(inputs.mcWet2);

      if (inputs.mcDry1 !== undefined && inputs.mcDry1 !== '') setMcDry1(inputs.mcDry1);
      else if (inputs.mcDry !== undefined) setMcDry1(inputs.mcDry);

      if (inputs.mcDry2 !== undefined) setMcDry2(inputs.mcDry2);

      if (inputs.mcTare1 !== undefined && inputs.mcTare1 !== '') setMcTare1(inputs.mcTare1);
      else if (inputs.mcTare !== undefined) setMcTare1(inputs.mcTare);

      if (inputs.mcTare2 !== undefined) setMcTare2(inputs.mcTare2);

      // Specific Gravity SG 8 fields re-sync
      if (inputs.pycNo1 !== undefined && inputs.pycNo1 !== '') setPycNo1(inputs.pycNo1);
      else if (inputs.pycNo !== undefined) setPycNo1(inputs.pycNo);

      if (inputs.pycNo2 !== undefined && inputs.pycNo2 !== '') setPycNo2(inputs.pycNo2);
      else if (inputs.pycNo !== undefined) setPycNo2(inputs.pycNo);
      if (inputs.wtDrySoil1 !== undefined) setWtDrySoil1(inputs.wtDrySoil1);
      else if (inputs.sgA1 !== undefined) setWtDrySoil1(String(inputs.sgA1));

      if (inputs.wtDrySoil2 !== undefined) setWtDrySoil2(inputs.wtDrySoil2);
      else if (inputs.sgA2 !== undefined) setWtDrySoil2(String(inputs.sgA2));

      if (inputs.temp1 !== undefined) setTemp1(inputs.temp1);
      else if (inputs.sgT1 !== undefined) setTemp1(String(inputs.sgT1));

      if (inputs.temp2 !== undefined) setTemp2(inputs.temp2);
      else if (inputs.sgT2 !== undefined) setTemp2(String(inputs.sgT2));

      if (inputs.wtPycWaterSoil1 !== undefined) setWtPycWaterSoil1(inputs.wtPycWaterSoil1);
      else if (inputs.sgB1 !== undefined) setWtPycWaterSoil1(String(inputs.sgB1));

      if (inputs.wtPycWaterSoil2 !== undefined) setWtPycWaterSoil2(inputs.wtPycWaterSoil2);
      else if (inputs.sgB2 !== undefined) setWtPycWaterSoil2(String(inputs.sgB2));

      if (inputs.cohesion) setCohesionInput(String(inputs.cohesion));
      if (inputs.frictionAngle) setFrictionAngleInput(String(inputs.frictionAngle));
      if (inputs.pycGsVal) setPycGsVal(String(inputs.pycGsVal));
      if (inputs.cbrPctVal) setCbrPctVal(String(inputs.cbrPctVal));
      if (inputs.prmKVal) setPrmKVal(String(inputs.prmKVal));
      if (inputs.cc) setConsolCc(String(inputs.cc));
      if (inputs.cs) setConsolCs(String(inputs.cs));
      if (inputs.ringNo !== undefined) setUwRingNo(String(inputs.ringNo));
      if (inputs.ringWetWeight !== undefined) setUwRingWetWeight(String(inputs.ringWetWeight));

      // ATB fields re-sync - Standardized Dual-Key Sync
      const blowsSync = getArrayOrFlatSync(inputs, 'atbBlows', 'atbBlows', 4);
      if (blowsSync.some(v => v !== '')) setAtbBlows(blowsSync);

      const containerSync = getArrayOrFlatSync(inputs, 'atbContainer', 'atbContainer', 4);
      if (containerSync.some(v => v !== '')) setAtbContainer(containerSync);

      const wetSync = getArrayOrFlatSync(inputs, 'atbWet', 'atbWet', 4);
      if (wetSync.some(v => v !== '')) setAtbWet(wetSync);

      const drySync = getArrayOrFlatSync(inputs, 'atbDry', 'atbDry', 4);
      if (drySync.some(v => v !== '')) setAtbDry(drySync);

      const plContainerSync = getArrayOrFlatSync(inputs, 'atbPlContainer', 'atbPlContainer', 2);
      if (plContainerSync.some(v => v !== '')) setAtbPlContainer(plContainerSync);

      const plWetSync = getArrayOrFlatSync(inputs, 'atbPlWet', 'atbPlWet', 2);
      if (plWetSync.some(v => v !== '')) setAtbPlWet(plWetSync);

      const plDrySync = getArrayOrFlatSync(inputs, 'atbPlDry', 'atbPlDry', 2);
      if (plDrySync.some(v => v !== '')) setAtbPlDry(plDrySync);

      // SVE-HYD fields re-sync - Standardized Dual-Key Sync
      const sieveSync = getArrayOrFlatSync(inputs, 'shSieveRetained', 'shSieveRetained', 15);
      if (sieveSync.some(v => v !== '')) setShSieveRetained(sieveSync);

      if (inputs.shHydroSoilWeight !== undefined) setShHydroSoilWeight(cleanIndoNumStr(inputs.shHydroSoilWeight));
      else if (inputs.hydroSoilWt !== undefined) setShHydroSoilWeight(cleanIndoNumStr(inputs.hydroSoilWt));

      if (inputs.shHydroTemp !== undefined) setShHydroTemp(cleanIndoNumStr(inputs.shHydroTemp));
      else if (inputs.hydroTemp !== undefined) setShHydroTemp(cleanIndoNumStr(inputs.hydroTemp));

      if (inputs.shHydroMeniscus !== undefined) setShHydroMeniscus(cleanIndoNumStr(inputs.shHydroMeniscus));
      else if (inputs.hydroMeniscus !== undefined) setShHydroMeniscus(cleanIndoNumStr(inputs.hydroMeniscus));

      if (inputs.shHydroDispersant !== undefined) setShHydroDispersant(cleanIndoNumStr(inputs.shHydroDispersant));
      else if (inputs.hydroDispersant !== undefined) setShHydroDispersant(cleanIndoNumStr(inputs.hydroDispersant));

      const hydroSync = getArrayOrFlatSync(inputs, 'shHydroReadings', 'shHydroReadings', 9);
      if (hydroSync.some(v => v !== '')) setShHydroReadings(hydroSync);

      // DS-UU fields re-sync - Standardized Dual-Key Sync
      if (inputs.dsUuRingNo !== undefined) setDsUuRingNo(inputs.dsUuRingNo);
      else if (inputs.dsRingNo !== undefined) setDsUuRingNo(inputs.dsRingNo);

      if (inputs.dsUuRingDia !== undefined) setDsUuRingDia(inputs.dsUuRingDia);
      else if (inputs.dsRingDia !== undefined) setDsUuRingDia(inputs.dsRingDia);

      if (inputs.dsUuRingHeight !== undefined) setDsUuRingHeight(inputs.dsUuRingHeight);
      else if (inputs.dsRingHeight !== undefined) setDsUuRingHeight(inputs.dsRingHeight);

      if (inputs.dsUuProvingCalibration !== undefined) setDsUuProvingCalibration(inputs.dsUuProvingCalibration);
      else if (inputs.dsProvingCalibration !== undefined) setDsUuProvingCalibration(inputs.dsProvingCalibration);

      const dsNormLoadsSync = getArrayOrFlatSync(inputs, 'dsUuNormalLoads', 'dsNormalLoads', 3);
      if (inputs.dsUuNormalLoads !== undefined || inputs.dsNormalLoads !== undefined || dsNormLoadsSync.some(v => v !== '')) setDsUuNormalLoads(dsNormLoadsSync);

      const dsWetRingSync = getArrayOrFlatSync(inputs, 'dsUuWetSoilPlusRing', 'dsWetSoilPlusRing', 3);
      if (inputs.dsUuWetSoilPlusRing !== undefined || inputs.dsWetSoilPlusRing !== undefined || dsWetRingSync.some(v => v !== '')) setDsUuWetSoilPlusRing(dsWetRingSync);

      const dsCanNoSync = getArrayOrFlatSync(inputs, 'dsUuContainerNo', 'dsContainerNo', 3);
      if (inputs.dsUuContainerNo !== undefined || inputs.dsContainerNo !== undefined || dsCanNoSync.some(v => v !== '')) setDsUuContainerNo(dsCanNoSync);

      const dsWetCanSync = getArrayOrFlatSync(inputs, 'dsUuWetCanWeight', 'dsWetCanWeight', 3);
      if (inputs.dsUuWetCanWeight !== undefined || inputs.dsWetCanWeight !== undefined || dsWetCanSync.some(v => v !== '')) setDsUuWetCanWeight(dsWetCanSync);

      const dsDryCanSync = getArrayOrFlatSync(inputs, 'dsUuDryCanWeight', 'dsDryCanWeight', 3);
      if (inputs.dsUuDryCanWeight !== undefined || inputs.dsDryCanWeight !== undefined || dsDryCanSync.some(v => v !== '')) setDsUuDryCanWeight(dsDryCanSync);

      const dsDialASync = getArrayOrFlatSync(inputs, 'dsUuDialReadingsA', 'dsDialReadingsA', 10);
      if (inputs.dsUuDialReadingsA !== undefined || inputs.dsDialReadingsA !== undefined || dsDialASync.some(v => v !== '')) setDsUuDialReadingsA(dsDialASync);
      const dsDialBSync = getArrayOrFlatSync(inputs, 'dsUuDialReadingsB', 'dsDialReadingsB', 10);
      if (inputs.dsUuDialReadingsB !== undefined || inputs.dsDialReadingsB !== undefined || dsDialBSync.some(v => v !== '')) setDsUuDialReadingsB(dsDialBSync);

      const dsDialCSync = getArrayOrFlatSync(inputs, 'dsUuDialReadingsC', 'dsDialReadingsC', 10);
      if (inputs.dsUuDialReadingsC !== undefined || inputs.dsDialReadingsC !== undefined || dsDialCSync.some(v => v !== '')) setDsUuDialReadingsC(dsDialCSync);

      if (inputs.llBlows !== undefined) setLlBlows(String(inputs.llBlows));
      if (inputs.computedLL !== undefined) setComputedLl(String(inputs.computedLL));
      else if (inputs.ll !== undefined) setComputedLl(String(inputs.ll));
      else if (inputs.liquidLimit !== undefined) setComputedLl(String(inputs.liquidLimit));

      if (inputs.computedPL !== undefined) setComputedPl(String(inputs.computedPL));
      else if (inputs.pl !== undefined) setComputedPl(String(inputs.pl));
      else if (inputs.plasticLimit !== undefined) setComputedPl(String(inputs.plasticLimit));

      if (inputs.computedPI !== undefined) setComputedPi(String(inputs.computedPI));
      else if (inputs.pi !== undefined) setComputedPi(String(inputs.pi));
      else if (inputs.plasticityIndex !== undefined) setComputedPi(String(inputs.plasticityIndex));

      // UCT fields re-sync - Standardized Dual-Key Sync
      if (inputs.uctDeformRate !== undefined) setUctDeformRate(cleanIndoNumStr(inputs.uctDeformRate));
      if (inputs.uctRingNo !== undefined) setUctRingNo(String(inputs.uctRingNo));
      if (inputs.uctPrCalib !== undefined) setUctPrCalib(cleanIndoNumStr(inputs.uctPrCalib));

      if (inputs.uctDiaUds !== undefined) setUctDiaUds(cleanIndoNumStr(inputs.uctDiaUds));
      if (inputs.uctLengthUds !== undefined) setUctLengthUds(cleanIndoNumStr(inputs.uctLengthUds));
      if (inputs.uctWetMassUds !== undefined) setUctWetMassUds(cleanIndoNumStr(inputs.uctWetMassUds));
      if (inputs.uctDryMassUds !== undefined) setUctDryMassUds(cleanIndoNumStr(inputs.uctDryMassUds));

      if (inputs.uctDiaRem !== undefined) setUctDiaRem(cleanIndoNumStr(inputs.uctDiaRem));
      if (inputs.uctLengthRem !== undefined) setUctLengthRem(cleanIndoNumStr(inputs.uctLengthRem));
      if (inputs.uctWetMassRem !== undefined) setUctWetMassRem(cleanIndoNumStr(inputs.uctWetMassRem));
      if (inputs.uctDryMassRem !== undefined) setUctDryMassRem(cleanIndoNumStr(inputs.uctDryMassRem));

      if (inputs.uctDialDeformUds && Array.isArray(inputs.uctDialDeformUds)) {
        setUctDialDeformUds(inputs.uctDialDeformUds.map(v => cleanIndoNumStr(v)));
      }
      if (inputs.uctDialForceUds && Array.isArray(inputs.uctDialForceUds)) {
        setUctDialForceUds(inputs.uctDialForceUds.map(v => cleanIndoNumStr(v)));
      }

      if (inputs.uctDialDeformRem && Array.isArray(inputs.uctDialDeformRem)) {
        setUctDialDeformRem(inputs.uctDialDeformRem.map(v => cleanIndoNumStr(v)));
      }
      if (inputs.uctDialForceRem && Array.isArray(inputs.uctDialForceRem)) {
        setUctDialForceRem(inputs.uctDialForceRem.map(v => cleanIndoNumStr(v)));
      }

      // TRX-UU fields re-sync - Standardized Dual-Key Sync
      if (inputs.trxUuMethod !== undefined) setTrxUuMethod(inputs.trxUuMethod as 'normal' | 'multistage');
      if (inputs.trxDia !== undefined) setTrxDia(cleanIndoNumStr(inputs.trxDia));
      if (inputs.trxHeight !== undefined) setTrxHeight(cleanIndoNumStr(inputs.trxHeight));
      if (inputs.trxDialDiv !== undefined) setTrxDialDiv(cleanIndoNumStr(inputs.trxDialDiv));
      if (inputs.trxLoadRate !== undefined) setTrxLoadRate(cleanIndoNumStr(inputs.trxLoadRate));
      if (inputs.trxRingNo !== undefined) setTrxRingNo(String(inputs.trxRingNo));
      if (inputs.trxLrc !== undefined) setTrxLrc(cleanIndoNumStr(inputs.trxLrc));
      if (inputs.trxCellPressures && Array.isArray(inputs.trxCellPressures)) {
        setTrxCellPressures(inputs.trxCellPressures.map(v => cleanIndoNumStr(v)));
      }
      const trxSyncA = getArrayOrFlatSync(inputs, 'trxLoadReadingsA', 'trxLoadA', 20);
      setTrxLoadReadingsA(trxSyncA);
      const trxSyncB = getArrayOrFlatSync(inputs, 'trxLoadReadingsB', 'trxLoadB', 20);
      setTrxLoadReadingsB(trxSyncB);
      const trxSyncC = getArrayOrFlatSync(inputs, 'trxLoadReadingsC', 'trxLoadC', 20);
      setTrxLoadReadingsC(trxSyncC);
    }
  }, [activeTestCode, currentSample]);

  // 📷 CLIENT-SIDE IMAGE COMPRESSION HELPER (Max 1280px, ~150KB JPEG) 📷
  const compressImageFile = (file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // 📷 PHOTO CAPTURE & UPLOAD HANDLER (OPTIMIZED FOR MOBILE) 📷
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>, defaultPhase: 'before' | 'during' | 'after' | 'failure' = 'during') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      try {
        const compressedBase64Url = await compressImageFile(file);
        if (!compressedBase64Url) continue;

        // Determine caption based on test type and photo sequence
        const photoIndex = photos.length + fIdx; // 0-based index
        let caption = 'Dokumentasi Pengujian';

        const normCode = (activeTestCode || '').toUpperCase().trim();

        if (['MC'].includes(normCode)) {
          caption = 'Foto Pengujian MC (Kadar Air)';
        } else if (['UW'].includes(normCode)) {
          caption = 'Foto Pengujian UW (Berat Isi)';
        } else if (['SG'].includes(normCode)) {
          caption = 'Foto Pengujian SG (Berat Jenis)';
        } else if (['ATB'].includes(normCode)) {
          caption = 'Foto Pengujian ATB (Atterberg Limits)';
        } else if (isSieveHydroCode(normCode)) {
          if (photoIndex === 0) caption = 'Foto Pengujian Sieve & Hydro - Analisis Saringan';
          else if (photoIndex === 1) caption = 'Foto Pengujian Sieve & Hydro - Analisis Hidrometer';
          else caption = `Foto Sieve & Hydro ${photoIndex + 1}`;
        } else if (['DS-UU', 'DS', 'DSH-UU', 'DS-CU', 'DS-CD', 'DS-CDR'].some(c => normCode === c || normCode.includes(c))) {
          if (photoIndex === 0) caption = 'Foto Specimen 1 (DS)';
          else if (photoIndex === 1) caption = 'Foto Specimen 2 (DS)';
          else if (photoIndex === 2) caption = 'Foto Specimen 3 (DS)';
          else caption = `Foto Specimen ${photoIndex + 1} (DS)`;
        } else if (['CT', 'CNS', 'CONSOLIDATION'].includes(normCode)) {
          if (photoIndex === 0) caption = 'Foto Pengujian Konsolidasi 1';
          else if (photoIndex === 1) caption = 'Foto Pengujian Konsolidasi 2';
          else if (photoIndex === 2) caption = 'Foto Pengujian Konsolidasi 3';
          else caption = `Foto Konsolidasi ${photoIndex + 1}`;
        } else if (['UCT', 'UCS'].includes(normCode)) {
          if (photoIndex === 0) caption = 'Foto Benda Uji Undisturbed (UCT)';
          else if (photoIndex === 1) caption = 'Foto Benda Uji Remolded (UCT)';
          else caption = `Foto UCT ${photoIndex + 1}`;
        } else if (['TRX-UU', 'TRX', 'TRX-CU', 'TRX-CD'].some(c => normCode === c || normCode.startsWith(c))) {
          if (trxUuMethod === 'multistage') {
            if (photoIndex === 0) caption = 'Foto Pengujian TRX Multi Stage 1';
            else if (photoIndex === 1) caption = 'Foto Pengujian TRX Multi Stage 2';
            else caption = `Foto TRX Multi Stage ${photoIndex + 1}`;
          } else {
            if (photoIndex === 0) caption = 'Foto Pengujian TRX Specimen 1';
            else if (photoIndex === 1) caption = 'Foto Pengujian TRX Specimen 2';
            else if (photoIndex === 2) caption = 'Foto Pengujian TRX Specimen 3';
            else caption = `Foto TRX Specimen ${photoIndex + 1}`;
          }
        } else if (defaultPhase === 'before') {
          caption = 'Kondisi Awal Benda Uji';
        } else if (defaultPhase === 'failure') {
          caption = 'Pola Keruntuhan';
        } else {
          caption = `Dokumentasi Pengujian ${normCode}`;
        }


        const newPhoto: TestPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          url: compressedBase64Url,
          caption,
          phase: defaultPhase,
          timestamp: new Date().toISOString(),
          testTypeCode: activeTestCode,
        };

        setPhotos(prev => [newPhoto, ...prev]);
        setIsDirty(true);
      } catch (err) {
        console.error('Failed to compress photo:', err);
      }
    }

    e.target.value = '';
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleUpdatePhotoCaption = (photoId: string, newCaption: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption: newCaption } : p));
  };


  const minRequiredPhotos = getRequiredPhotoCount(activeTestCode, trxUuMethod);

  // 📋 VALIDATE TEST COMPLETENESS FOR FINAL SAVE 📋
  const isFormFullyCompleted = (() => {
    if (!dateStarted || !dateCompleted) return false;
    if (!photos || photos.length < minRequiredPhotos) return false;

    const normCode = (activeTestCode || '').toUpperCase().trim();

    if (['DS-UU', 'DS', 'DSH-UU', 'DS-CU', 'DS-CD', 'DS-CDR'].some(c => normCode.includes(c) || normCode === c)) {
      const hasLoads = dsUuNormalLoads.slice(0, 3).every(v => parseIndoFloat(v) > 0);
      const hasWetSoil = dsUuWetSoilPlusRing.slice(0, 3).every(v => parseIndoFloat(v) > 0);
      const hasContainers = dsUuContainerNo.slice(0, 3).every(v => (v || '').trim() !== '');
      const hasWetCan = dsUuWetCanWeight.slice(0, 3).every(v => parseIndoFloat(v) > 0);
      const hasDryCan = dsUuDryCanWeight.slice(0, 3).every(v => parseIndoFloat(v) > 0);
      const hasDialA = dsUuDialReadingsA.some(v => parseIndoFloat(v) > 0);
      const hasDialB = dsUuDialReadingsB.some(v => parseIndoFloat(v) > 0);
      const hasDialC = dsUuDialReadingsC.some(v => parseIndoFloat(v) > 0);
      const hasRing = (dsUuRingNo || '').trim() !== '' && parseIndoFloat(dsUuRingDia) > 0 && parseIndoFloat(dsUuRingHeight) > 0;
      return Boolean(hasLoads && hasWetSoil && hasContainers && hasWetCan && hasDryCan && hasDialA && hasDialB && hasDialC && hasRing);
    } else if (normCode === 'SG') {
      const hasTrial1 = Boolean((pycNo1 || pycNo) && parseIndoFloat(wtDrySoil1) > 0 && parseIndoFloat(temp1) > 0 && parseIndoFloat(wtPycWaterSoil1) > 0);
      const hasTrial2 = pycNo2 ? Boolean(parseIndoFloat(wtDrySoil2) > 0 && parseIndoFloat(temp2) > 0 && parseIndoFloat(wtPycWaterSoil2) > 0) : true;
      return Boolean(hasTrial1 && hasTrial2);
    } else if (normCode === 'MC') {
      const hasTrial1 = Boolean((mcContainer1 || mcContainer) && parseIndoFloat(mcWet1 || mcWet) > 0 && parseIndoFloat(mcDry1 || mcDry) > 0);
      const hasTrial2 = mcContainer2 ? Boolean(parseIndoFloat(mcWet2) > 0 && parseIndoFloat(mcDry2) > 0) : true;
      return Boolean(hasTrial1 && hasTrial2);
    } else if (normCode === 'UW') {
      return Boolean(uwRingNo.trim() !== '' && parseIndoFloat(uwRingWetWeight) > 0);
    } else if (normCode === 'ATB') {
      const hasBlows = atbWet.filter(v => parseIndoFloat(v) > 0).length >= 3;
      const hasPl = atbPlWet.filter(v => parseIndoFloat(v) > 0).length >= 2;
      return Boolean(hasBlows && hasPl);
    } else if (isSieveHydroCode(normCode)) {
      const sieveCount = shSieveRetained.filter(v => parseIndoFloat(v) > 0).length;
      return sieveCount >= 3;
    } else if (['TRX-UU', 'TRX', 'TRX-CU', 'TRX-CD'].some(c => normCode.includes(c) || normCode === c)) {
      const hasA = trxLoadReadingsA.filter(v => parseIndoFloat(v) > 0).length >= 3;
      const hasB = trxLoadReadingsB.filter(v => parseIndoFloat(v) > 0).length >= 3;
      const hasC = trxLoadReadingsC.filter(v => parseIndoFloat(v) > 0).length >= 3;
      if (trxUuMethod === 'multistage') {
        return Boolean(hasA && hasB);
      } else {
        return Boolean(hasA && hasB && hasC);
      }
    } else if (normCode === 'UCT') {
      const hasUdsMass = parseIndoFloat(uctWetMassUds) > 0 && parseIndoFloat(uctDryMassUds) > 0;
      const hasRemMass = parseIndoFloat(uctWetMassRem) > 0 && parseIndoFloat(uctDryMassRem) > 0;
      const hasUdsDials = uctDialForceUds.filter(v => parseIndoFloat(v) > 0).length >= 3;
      const hasRemDials = uctDialForceRem.filter(v => parseIndoFloat(v) > 0).length >= 3;
      return Boolean(hasUdsMass && hasRemMass && hasUdsDials && hasRemDials);
    } else if (['CT', 'CNS'].includes(normCode)) {
      return consolDial24h.filter(v => parseIndoFloat(v) > 0).length >= 5;
    }
    return true;
  })();

  // ─── SAVE TEST WORKSHEET DATA ────────────────────────────────────
  const handleSaveData = (markAsCompleted = false) => {
    const cleanNumStr = (val: any) => {
      if (val === undefined || val === null) return '';
      return String(val).replace(',', '.').trim();
    };

    const targetTestId = activeTest?.id;

    let saveAtbBlows = [...atbBlows];
    let saveAtbContainer = [...atbContainer];
    let saveAtbWet = [...atbWet];
    let saveAtbDry = [...atbDry];
    let saveAtbPlContainer = [...atbPlContainer];
    let saveAtbPlWet = [...atbPlWet];
    let saveAtbPlDry = [...atbPlDry];

    let saveShSieveRetained = [...shSieveRetained].map(cleanNumStr);
    let saveShHydroReadings = [...shHydroReadings].map(cleanNumStr);

    let saveDsUuNormalLoads = [...dsUuNormalLoads].map(cleanNumStr);
    let saveDsUuWetSoilPlusRing = [...dsUuWetSoilPlusRing].map(cleanNumStr);
    let saveDsUuContainerNo = [...dsUuContainerNo].map(v => (v || '').toUpperCase());
    let saveDsUuWetCanWeight = [...dsUuWetCanWeight].map(cleanNumStr);
    let saveDsUuDryCanWeight = [...dsUuDryCanWeight].map(cleanNumStr);
    let saveDsUuDialReadingsA = [...dsUuDialReadingsA].map(cleanNumStr);
    let saveDsUuDialReadingsB = [...dsUuDialReadingsB].map(cleanNumStr);
    let saveDsUuDialReadingsC = [...dsUuDialReadingsC].map(cleanNumStr);

    let saveUctDialDeformUds = [...uctDialDeformUds].map(cleanNumStr);
    let saveUctDialForceUds = [...uctDialForceUds].map(cleanNumStr);
    let saveUctDialDeformRem = [...uctDialDeformRem].map(cleanNumStr);
    let saveUctDialForceRem = [...uctDialForceRem].map(cleanNumStr);

    let saveTrxLoadA = [...trxLoadReadingsA].map(cleanNumStr);
    let saveTrxLoadB = [...trxLoadReadingsB].map(cleanNumStr);
    let saveTrxLoadC = [...trxLoadReadingsC].map(cleanNumStr);
    let saveTrxDefoA = saveTrxLoadA.map((_, i) => String(i * 20));
    let saveTrxDefoB = saveTrxLoadB.map((_, i) => String(i * 20));
    let saveTrxDefoC = saveTrxLoadC.map((_, i) => String(i * 20));

    const updatedTests = currentSample.tests.map(t => {
      const codeNorm = (t.testTypeCode || t.testTypeId || '').toUpperCase();
      const activeNorm = (activeTestCode || '').toUpperCase();

      let isTargetTest = false;
      if (targetTestId && t.id === targetTestId) {
        isTargetTest = true;
      } else if (codeNorm === activeNorm) {
        isTargetTest = true;
      } else if (['MC', 'UW', 'SG', 'ATB'].includes(activeNorm) && (codeNorm === 'PP' || codeNorm === activeNorm)) {
        isTargetTest = true;
      } else if (isSieveHydroCode(activeNorm) && isSieveHydroCode(codeNorm)) {
        isTargetTest = true;
      } else if (['PB', 'PRM'].includes(activeNorm) && ['PB', 'PRM'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['CT', 'CNS'].includes(activeNorm) && ['CT', 'CNS'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['TRX-UU', 'TRX_UU', 'TRX', 'TRIAXIAL', 'TRIAXIAL-UU'].includes(activeNorm) && ['TRX-UU', 'TRX_UU', 'TRX', 'TRIAXIAL', 'TRIAXIAL-UU'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['TRX-CU', 'TRX_CU'].includes(activeNorm) && ['TRX-CU', 'TRX_CU'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['TRX-CD', 'TRX_CD'].includes(activeNorm) && ['TRX-CD', 'TRX_CD'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['DS-UU', 'DS_UU', 'DS', 'DSH-UU', 'DIRECT_SHEAR', 'DIRECT SHEAR'].includes(activeNorm) && ['DS-UU', 'DS_UU', 'DS', 'DSH-UU', 'DIRECT_SHEAR', 'DIRECT SHEAR'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['DS-CD', 'DS_CD', 'DSH-CD'].includes(activeNorm) && ['DS-CD', 'DS_CD', 'DSH-CD'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (['DS-CDR', 'DS_CDR', 'DS-CD-RES', 'DS_CD_RES', 'DS-RES'].includes(activeNorm) && ['DS-CDR', 'DS_CDR', 'DS-CD-RES', 'DS_CD_RES', 'DS-RES'].includes(codeNorm)) {
        isTargetTest = true;
      } else if (activeNorm === 'UCT' && codeNorm === 'UCT') {
        isTargetTest = true;
      } else if (currentSample.tests.length === 1) {
        isTargetTest = true;
      }
      if (!isTargetTest) return t;

      const prevInputs = t.calculationData?.inputValues || t.calculationData || {};

      // 1. Base input values preserving all previously entered data
      const mergedInputValues: Record<string, any> = {
        ...prevInputs,
        dateStarted: dateStarted || prevInputs.dateStarted || '',
        dateCompleted: dateCompleted || prevInputs.dateCompleted || '',
        dateTested: dateStarted || prevInputs.dateTested || dateStarted || '',
        dateTestedEnd: dateCompleted || prevInputs.dateTestedEnd || dateCompleted || '',
        soilColourCode: soilColourCode !== undefined ? soilColourCode : (prevInputs.soilColourCode || 0),
        soilColourName: SOIL_COLOUR_CATALOGUE.find(c => c.code === soilColourCode)?.name || prevInputs.soilColourName || '',
        soilColourNameEn: SOIL_COLOUR_CATALOGUE.find(c => c.code === soilColourCode)?.nameEn || prevInputs.soilColourNameEn || '',
        testedBy: currentUser.name,
      };

      // 2. Moisture Content (MC) - only update if on MC or PP, or if values entered
      if (['MC', 'PP'].includes(activeNorm)) {
        if (mcContainer1 !== undefined && mcContainer1 !== '') {
          mergedInputValues.mcContainer1 = mcContainer1;
          mergedInputValues.mcContainer = mcContainer1;
        }
        if (mcContainer2 !== undefined && mcContainer2 !== '') mergedInputValues.mcContainer2 = mcContainer2;
        if (mcTare1 !== undefined && mcTare1 !== '') mergedInputValues.mcTare1 = cleanNumStr(mcTare1 || mcTare);
        if (mcTare2 !== undefined && mcTare2 !== '') mergedInputValues.mcTare2 = cleanNumStr(mcTare2);
        if (mcWet1 !== undefined && mcWet1 !== '') {
          mergedInputValues.mcWet1 = cleanNumStr(mcWet1);
          mergedInputValues.mcWet = cleanNumStr(mcWet1);
        }
        if (mcWet2 !== undefined && mcWet2 !== '') mergedInputValues.mcWet2 = cleanNumStr(mcWet2);
        if (mcDry1 !== undefined && mcDry1 !== '') {
          mergedInputValues.mcDry1 = cleanNumStr(mcDry1);
          mergedInputValues.mcDry = cleanNumStr(mcDry1);
        }
        if (mcDry2 !== undefined && mcDry2 !== '') mergedInputValues.mcDry2 = cleanNumStr(mcDry2);
        if (computedMcPct > 0) mergedInputValues.computedMcPct = Number(computedMcPct.toFixed(2));
      }

      // 3. Specific Gravity (SG) - only update if on SG or PP, or if values entered
      if (['SG', 'PP'].includes(activeNorm)) {
        if (pycNo1 !== undefined && pycNo1 !== '') {
          mergedInputValues.pycNo1 = pycNo1;
          mergedInputValues.pycNo = pycNo1;
        }
        if (pycNo2 !== undefined && pycNo2 !== '') mergedInputValues.pycNo2 = pycNo2;
        if (temp1 !== undefined && temp1 !== '') {
          mergedInputValues.temp1 = cleanNumStr(temp1);
          mergedInputValues.sgT1 = cleanNumStr(temp1);
          mergedInputValues.pycWaterTemp = parseFloat(cleanNumStr(temp1)) || 25;
        }
        if (temp2 !== undefined && temp2 !== '') {
          mergedInputValues.temp2 = cleanNumStr(temp2);
          mergedInputValues.sgT2 = cleanNumStr(temp2);
        }
        if (wtDrySoil1 !== undefined && wtDrySoil1 !== '') {
          mergedInputValues.wtDrySoil1 = cleanNumStr(wtDrySoil1);
          mergedInputValues.sgA1 = cleanNumStr(wtDrySoil1);
        }
        if (wtDrySoil2 !== undefined && wtDrySoil2 !== '') {
          mergedInputValues.wtDrySoil2 = cleanNumStr(wtDrySoil2);
          mergedInputValues.sgA2 = cleanNumStr(wtDrySoil2);
        }
        if (wtPycWaterSoil1 !== undefined && wtPycWaterSoil1 !== '') {
          mergedInputValues.wtPycWaterSoil1 = cleanNumStr(wtPycWaterSoil1);
          mergedInputValues.sgB1 = cleanNumStr(wtPycWaterSoil1);
        }
        if (wtPycWaterSoil2 !== undefined && wtPycWaterSoil2 !== '') {
          mergedInputValues.wtPycWaterSoil2 = cleanNumStr(wtPycWaterSoil2);
          mergedInputValues.sgB2 = cleanNumStr(wtPycWaterSoil2);
        }
        if (computedGsAvg > 0) {
          mergedInputValues.gsAvg = Number(computedGsAvg.toFixed(3));
          mergedInputValues.specificGravity = Number(computedGsAvg.toFixed(3));
          mergedInputValues.pycGsVal = Number(computedGsAvg.toFixed(3));
        } else if (pycGsVal) {
          mergedInputValues.pycGsVal = parseFloat(cleanNumStr(pycGsVal)) || 2.65;
          mergedInputValues.gsAvg = parseFloat(cleanNumStr(pycGsVal)) || 2.65;
          mergedInputValues.specificGravity = parseFloat(cleanNumStr(pycGsVal)) || 2.65;
        }
      }

      // 4. Unit Weight (UW) - only update if on UW or PP, or if values entered
      if (['UW', 'PP'].includes(activeNorm)) {
        if (uwRingNo !== undefined && uwRingNo !== '') mergedInputValues.ringNo = uwRingNo;
        if (uwRingWetWeight !== undefined && uwRingWetWeight !== '') mergedInputValues.ringWetWeight = cleanNumStr(uwRingWetWeight);
        if (computedBulkDensity > 0) mergedInputValues.bulkDensity = Number(computedBulkDensity.toFixed(3));
      }

      // 5. ATB, S&H, DS, TRX, UCT, etc.
      if (['ATB'].includes(activeNorm)) {
        mergedInputValues.atbBlows = saveAtbBlows.map(cleanNumStr);
        mergedInputValues.atbContainer = saveAtbContainer;
        mergedInputValues.atbWet = saveAtbWet.map(cleanNumStr);
        mergedInputValues.atbDry = saveAtbDry.map(cleanNumStr);
        mergedInputValues.atbPlContainer = saveAtbPlContainer;
        mergedInputValues.atbPlWet = saveAtbPlWet.map(cleanNumStr);
        mergedInputValues.atbPlDry = saveAtbPlDry.map(cleanNumStr);
        Object.assign(mergedInputValues, buildDualKeyPayload('atbBlows', 'atbBlows', saveAtbBlows));
        Object.assign(mergedInputValues, buildDualKeyPayload('atbContainer', 'atbContainer', saveAtbContainer));
        Object.assign(mergedInputValues, buildDualKeyPayload('atbWet', 'atbWet', saveAtbWet));
        Object.assign(mergedInputValues, buildDualKeyPayload('atbDry', 'atbDry', saveAtbDry));
        Object.assign(mergedInputValues, buildDualKeyPayload('atbPlContainer', 'atbPlContainer', saveAtbPlContainer));
        Object.assign(mergedInputValues, buildDualKeyPayload('atbPlWet', 'atbPlWet', saveAtbPlWet));
        Object.assign(mergedInputValues, buildDualKeyPayload('atbPlDry', 'atbPlDry', saveAtbPlDry));
      }

      if (isSieveHydroCode(activeNorm)) {
        mergedInputValues.shSieveRetained = saveShSieveRetained;
        mergedInputValues.shHydroReadings = saveShHydroReadings;
        mergedInputValues.sieve4 = saveShSieveRetained[7] || prevInputs.sieve4;
        mergedInputValues.sieve10 = saveShSieveRetained[8] || prevInputs.sieve10;
        mergedInputValues.sieve40 = saveShSieveRetained[10] || prevInputs.sieve40;
        mergedInputValues.sieve200 = saveShSieveRetained[13] || prevInputs.sieve200;
      }

      const finalGs = computedGsAvg > 0 ? Number(computedGsAvg.toFixed(3)) : (parseFloat(cleanNumStr(pycGsVal)) || undefined);

      const calcData = {
        ...(t.calculationData || {}),
        summaryResults: {
          ...(t.calculationData?.summaryResults || {}),
          ...(finalGs !== undefined ? {
            specificGravity: finalGs,
            gsAvg: finalGs,
            status: 'Calculated'
          } : {}),
          ...(computedMcPct > 0 ? {
            avgMoistureContent: Number(computedMcPct.toFixed(2)),
            moistureContent: Number(computedMcPct.toFixed(2)),
          } : {}),
          ...(computedBulkDensity > 0 ? {
            bulkDensity: Number(computedBulkDensity.toFixed(3)),
          } : {}),
        },
        inputValues: {
          ...mergedInputValues,
          ...buildDualKeyPayload('atbPlWet', 'atbPlWet', saveAtbPlWet),
          ...buildDualKeyPayload('atbPlDry', 'atbPlDry', saveAtbPlDry),
          atbTare1: cleanNumStr(saveAtbContainer[0]),
          atbTare2: cleanNumStr(saveAtbContainer[1]),
          atbTare3: cleanNumStr(saveAtbContainer[2]),
          atbTare4: cleanNumStr(saveAtbContainer[3]),
          atbWet1: cleanNumStr(saveAtbWet[0]),
          atbWet2: cleanNumStr(saveAtbWet[1]),
          atbWet3: cleanNumStr(saveAtbWet[2]),
          atbWet4: cleanNumStr(saveAtbWet[3]),
          atbDry1: cleanNumStr(saveAtbDry[0]),
          atbDry2: cleanNumStr(saveAtbDry[1]),
          atbDry3: cleanNumStr(saveAtbDry[2]),
          atbDry4: cleanNumStr(saveAtbDry[3]),
          atbPlTare1: cleanNumStr(saveAtbPlContainer[0]),
          atbPlTare2: cleanNumStr(saveAtbPlContainer[1]),
          atbPlWet1: cleanNumStr(saveAtbPlWet[0]),
          atbPlWet2: cleanNumStr(saveAtbPlWet[1]),
          atbPlDry1: cleanNumStr(saveAtbPlDry[0]),
          atbPlDry2: cleanNumStr(saveAtbPlDry[1]),
          llBlows,
          llWet,
          llDry,
          plWet,
          plDry,
          ll: computedLl ? parseFloat(cleanNumStr(computedLl)) : undefined,
          pl: computedPl ? parseFloat(cleanNumStr(computedPl)) : undefined,
          pi: computedPi ? parseFloat(cleanNumStr(computedPi)) : undefined,
          computedLL: computedLl ? parseFloat(cleanNumStr(computedLl)) : undefined,
          computedPL: computedPl ? parseFloat(cleanNumStr(computedPl)) : undefined,
          computedPI: computedPi ? parseFloat(cleanNumStr(computedPi)) : undefined,
          liquidLimit: computedLl ? parseFloat(cleanNumStr(computedLl)) : undefined,
          plasticLimit: computedPl ? parseFloat(cleanNumStr(computedPl)) : undefined,
          plasticityIndex: computedPi ? parseFloat(cleanNumStr(computedPi)) : undefined,
          summaryResults: {
            LL: computedLl ? parseFloat(cleanNumStr(computedLl)) : undefined,
            PL: computedPl ? parseFloat(cleanNumStr(computedPl)) : undefined,
            PI: computedPi ? parseFloat(cleanNumStr(computedPi)) : undefined,
          },
          // SVE-HYD fields persistence & Web App compatibility (Dual-Key)
          shSieveRetained: saveShSieveRetained,
          shHydroSoilWeight: cleanNumStr(shHydroSoilWeight),
          shHydroTemp: cleanNumStr(shHydroTemp),
          shHydroMeniscus: cleanNumStr(shHydroMeniscus),
          shHydroDispersant: cleanNumStr(shHydroDispersant),
          shHydroReadings: saveShHydroReadings,
          ...buildDualKeyPayload('shSieveRetained', 'shSieveRetained', saveShSieveRetained),
          ...buildDualKeyPayload('shHydroReadings', 'shHydroReadings', saveShHydroReadings),
          // DS-UU fields persistence & Web App compatibility (Dual-Key)
          dsUuRingNo,
          dsRingNo: dsUuRingNo,
          dsUuRingDia: cleanNumStr(dsUuRingDia),
          dsRingDia: cleanNumStr(dsUuRingDia),
          dsUuRingHeight: cleanNumStr(dsUuRingHeight),
          dsRingHeight: cleanNumStr(dsUuRingHeight),
          dsUuProvingCalibration: cleanNumStr(dsUuProvingCalibration),
          dsProvingCalibration: cleanNumStr(dsUuProvingCalibration),
          dsUuNormalLoads: saveDsUuNormalLoads,
          dsNormalLoads: saveDsUuNormalLoads,
          dsUuWetSoilPlusRing: saveDsUuWetSoilPlusRing,
          dsWetSoilPlusRing: saveDsUuWetSoilPlusRing,
          dsUuContainerNo: saveDsUuContainerNo,
          dsContainerNo: saveDsUuContainerNo,
          dsUuWetCanWeight: saveDsUuWetCanWeight,
          dsWetCanWeight: saveDsUuWetCanWeight,
          dsUuDryCanWeight: saveDsUuDryCanWeight,
          dsDryCanWeight: saveDsUuDryCanWeight,
          dsUuDialReadingsA: saveDsUuDialReadingsA,
          dsDialReadingsA: saveDsUuDialReadingsA,
          dsUuDialReadingsB: saveDsUuDialReadingsB,
          dsDialReadingsB: saveDsUuDialReadingsB,
          dsUuDialReadingsC: saveDsUuDialReadingsC,
          dsDialReadingsC: saveDsUuDialReadingsC,
          ...buildDualKeyPayload('dsUuNormalLoads', 'dsUuNormalLoads', saveDsUuNormalLoads),
          ...buildDualKeyPayload('dsUuWetSoilPlusRing', 'dsUuWetSoilPlusRing', saveDsUuWetSoilPlusRing),
          ...buildDualKeyPayload('dsUuContainerNo', 'dsUuContainerNo', saveDsUuContainerNo),
          ...buildDualKeyPayload('dsUuWetCanWeight', 'dsUuWetCanWeight', saveDsUuWetCanWeight),
          ...buildDualKeyPayload('dsUuDryCanWeight', 'dsUuDryCanWeight', saveDsUuDryCanWeight),
          ...buildDualKeyPayload('dsUuDialReadingsA', 'dsUuDialReadingsA', saveDsUuDialReadingsA, 30),
          ...buildDualKeyPayload('dsUuDialReadingsB', 'dsUuDialReadingsB', saveDsUuDialReadingsB, 30),
          ...buildDualKeyPayload('dsUuDialReadingsC', 'dsUuDialReadingsC', saveDsUuDialReadingsC, 30),
          ...buildDualKeyPayload('dsNormalLoads', 'dsNormalLoads', saveDsUuNormalLoads, 3),
          ...buildDualKeyPayload('dsWetSoilPlusRing', 'dsWetSoilPlusRing', saveDsUuWetSoilPlusRing, 3),
          ...buildDualKeyPayload('dsContainerNo', 'dsContainerNo', saveDsUuContainerNo, 3),
          ...buildDualKeyPayload('dsWetCanWeight', 'dsWetCanWeight', saveDsUuWetCanWeight, 3),
          ...buildDualKeyPayload('dsDryCanWeight', 'dsDryCanWeight', saveDsUuDryCanWeight, 3),
          ...buildDualKeyPayload('dsDialReadingsA', 'dsDialReadingsA', saveDsUuDialReadingsA, 30),
          ...buildDualKeyPayload('dsDialReadingsB', 'dsDialReadingsB', saveDsUuDialReadingsB, 30),
          ...buildDualKeyPayload('dsDialReadingsC', 'dsDialReadingsC', saveDsUuDialReadingsC, 30),
          sieve4: saveShSieveRetained[7] || sieve4,
          sieve8: saveShSieveRetained[8] || '',
          sieve10: saveShSieveRetained[8] || sieve10,
          sieve40: saveShSieveRetained[10] || sieve40,
          sieve200: saveShSieveRetained[13] || sieve200,
          // UCT (Unconfined Compression Test) fields persistence & Web App compatibility
          uctDeformRate: cleanNumStr(uctDeformRate),
          uctRingNo: String(uctRingNo),
          uctPrCalib: cleanNumStr(uctPrCalib),
          uctDiaUds: cleanNumStr(uctDiaUds),
          uctLengthUds: cleanNumStr(uctLengthUds),
          uctWetMassUds: cleanNumStr(uctWetMassUds),
          uctDryMassUds: cleanNumStr(uctDryMassUds),
          uctDialDeformUds: saveUctDialDeformUds,
          uctDialForceUds: saveUctDialForceUds,
          uctDiaRem: cleanNumStr(uctDiaRem),
          uctLengthRem: cleanNumStr(uctLengthRem),
          uctWetMassRem: cleanNumStr(uctWetMassRem),
          uctDryMassRem: cleanNumStr(uctDryMassRem),
          uctDialDeformRem: saveUctDialDeformRem,
          uctDialForceRem: saveUctDialForceRem,
          uctQuUds: uctQuUds > 0 ? parseFloat(uctQuUds.toFixed(3)) : undefined,
          uctSuUds: uctSuUds > 0 ? parseFloat(uctSuUds.toFixed(3)) : undefined,
          uctQuRem: uctQuRem > 0 ? parseFloat(uctQuRem.toFixed(3)) : undefined,
          uctSuRem: uctSuRem > 0 ? parseFloat(uctSuRem.toFixed(3)) : undefined,
          uctSensitivity: uctSensitivity > 0 ? parseFloat(uctSensitivity.toFixed(3)) : undefined,
          qu: uctQuUds > 0 ? parseFloat(uctQuUds.toFixed(3)) : undefined,
          cu: uctSuUds > 0 ? parseFloat(uctSuUds.toFixed(3)) : undefined,
          ...buildDualKeyPayload('uctDialDeformUds', 'uctDialDeformUds', saveUctDialDeformUds),
          ...buildDualKeyPayload('uctDialForceUds', 'uctDialForceUds', saveUctDialForceUds),
          ...buildDualKeyPayload('uctDialDeformRem', 'uctDialDeformRem', saveUctDialDeformRem),
          ...buildDualKeyPayload('uctDialForceRem', 'uctDialForceRem', saveUctDialForceRem),
          // TRX-UU (Triaxial Unconsolidated Undrained) fields persistence & Web App compatibility
          trxUuMethod,
          trxDia: cleanNumStr(trxDia),
          trxHeight: cleanNumStr(trxHeight),
          trxArea0: trxArea0.toFixed(3),
          trxDialDiv: cleanNumStr(trxDialDiv),
          trxLoadRate: cleanNumStr(trxLoadRate),
          trxRingNo,
          trxLrc: cleanNumStr(trxLrc),
          trxCellPressures: trxCellPressures.map(cleanNumStr),
          trxLoadReadingsA: saveTrxLoadA,
          trxLoadReadingsB: saveTrxLoadB,
          trxLoadReadingsC: saveTrxLoadC,
          trxDefoReadingsA: saveTrxDefoA,
          trxDefoReadingsB: saveTrxDefoB,
          trxDefoReadingsC: saveTrxDefoC,
          ...buildDualKeyPayload('trxLoadReadingsA', 'trxLoadA', saveTrxLoadA),
          ...buildDualKeyPayload('trxLoadReadingsB', 'trxLoadB', saveTrxLoadB),
          ...buildDualKeyPayload('trxLoadReadingsC', 'trxLoadC', saveTrxLoadC),
          ...buildDualKeyPayload('trxDefoReadingsA', 'trxDefoA', saveTrxDefoA),
          ...buildDualKeyPayload('trxDefoReadingsB', 'trxDefoB', saveTrxDefoB),
          ...buildDualKeyPayload('trxDefoReadingsC', 'trxDefoC', saveTrxDefoC),
          cc: consolCc ? parseFloat(cleanNumStr(consolCc)) : undefined,
          cs: consolCs ? parseFloat(cleanNumStr(consolCs)) : undefined,
          pc: consolPc ? parseFloat(cleanNumStr(consolPc)) : undefined,
          cbrMoldNo,
          cbrSwelling: cbrSwelling ? parseFloat(cleanNumStr(cbrSwelling)) : undefined,
          cbrPctVal: cbrPctVal ? parseFloat(cleanNumStr(cbrPctVal)) : undefined,
          prmKVal: prmKVal ? parseFloat(cleanNumStr(prmKVal)) : undefined,
        },
        photos,
      };

      const hasDataEntered = (
        computedMcPct > 0 ||
        computedGsAvg > 0 ||
        (parseIndoFloat(wtDrySoil1) > 0 && parseIndoFloat(wtPycWaterSoil1) > 0) ||
        (parseIndoFloat(wtDrySoil2) > 0 && parseIndoFloat(wtPycWaterSoil2) > 0) ||
        (parseIndoFloat(uwRingWetWeight) > 0 && uwRingNo.trim() !== '') ||
        (parseIndoFloat(computedLl) > 0 || parseIndoFloat(computedPl) > 0 || atbWet.some(v => parseIndoFloat(v) > 0) || atbPlWet.some(v => parseIndoFloat(v) > 0)) ||
        saveDsUuWetSoilPlusRing.some(v => parseIndoFloat(v) > 0) ||
        saveDsUuContainerNo.some(v => v.trim() !== '') ||
        saveDsUuDialReadingsA.some(v => parseIndoFloat(v) > 0) ||
        saveDsUuDialReadingsB.some(v => parseIndoFloat(v) > 0) ||
        saveDsUuDialReadingsC.some(v => parseIndoFloat(v) > 0) ||
        saveUctDialForceUds.some(v => parseIndoFloat(v) > 0) ||
        saveUctDialForceRem.some(v => parseIndoFloat(v) > 0) ||
        saveTrxLoadA.some(v => parseIndoFloat(v) > 0) ||
        saveTrxLoadB.some(v => parseIndoFloat(v) > 0) ||
        saveTrxLoadC.some(v => parseIndoFloat(v) > 0) ||
        cohesionInput !== '' ||
        markAsCompleted
      );

      const origSnapshot = {
        dateStarted,
        dateCompleted,
        inputValues: JSON.parse(JSON.stringify(calcData.inputValues)),
        photos: JSON.parse(JSON.stringify(photos)),
        completedAt: t.originalTechnicianInput?.completedAt || new Date().toISOString(),
        technicianName: t.originalTechnicianInput?.technicianName || currentUser.name,
      };

      const isAlreadyLocked = Boolean(t.lockedByTechnician || t.status === 'Selesai' || t.status === 'Completed');

      return {
        ...t,
        status: markAsCompleted ? ('Selesai' as const) : (hasDataEntered ? ('Sedang Diuji' as const) : t.status),
        lockedByTechnician: markAsCompleted ? true : isAlreadyLocked,
        originalTechnicianInput: markAsCompleted || isAlreadyLocked ? origSnapshot : (t.originalTechnicianInput || undefined),
        calculationStatus: markAsCompleted ? ('Calculated' as const) : ('Draft Data' as const),
        technicianName: t.technicianName || currentUser.name,
        testedBy: t.testedBy || currentUser.name,
        startTime: dateStarted ? `${dateStarted}T08:00:00.000Z` : (t.startTime || new Date().toISOString()),
        endTime: markAsCompleted ? (dateCompleted ? `${dateCompleted}T17:00:00.000Z` : new Date().toISOString()) : t.endTime,
        completedAt: markAsCompleted ? (dateCompleted ? `${dateCompleted}T17:00:00.000Z` : new Date().toISOString()) : (isAlreadyLocked ? t.completedAt : undefined),
        photos, // always save photos at test level
        calculationData: {
          ...calcData,
          photos,
          inputValues: {
            ...(calcData.inputValues || {}),
            photos,
          }
        },
      };
    });

    // Tag all saved photos with the active test code so they're identifiable on reload
    const taggedPhotos = photos.map(p => ({
      ...p,
      testTypeCode: p.testTypeCode || activeTestCode,
    }));

    const isAllTestsDone = updatedTests.every(t => t.status === 'Selesai' || t.status === 'Completed');
    const updatedSample: Sample = {
      ...currentSample,
      status: isAllTestsDone ? 'Completed' : 'In Progress',
      testedBy: currentSample.testedBy || currentUser.name,
      assignedTechnician: currentSample.assignedTechnician || currentUser.name,
      tests: updatedTests,
      // Replace photos for this test (remove old ones tagged to same test), keep others
      photos: [
        ...(currentSample.photos || []).filter(p => {
          const pNorm = (p.testTypeCode || '').toUpperCase();
          const aNorm = activeTestCode.toUpperCase();
          // Remove untagged photos (old auto-set) and photos for this exact test
          if (!p.testTypeCode) return false;
          if (pNorm === aNorm) return false;
          if (['MC', 'UW', 'SG', 'ATB'].includes(aNorm) && (pNorm === 'PP' || pNorm === aNorm)) return false;
          return true;
        }),
        ...taggedPhotos,
      ],
      updatedAt: new Date().toISOString(),
    };

    setCurrentSample(updatedSample);
    onSaveSample(updatedSample);
    setIsDirty(false);

    const successTitle = markAsCompleted ? 'Uji Selesai & Tersimpan!' : 'Draft Berhasil Disimpan!';
    setSaveSuccessMsg(successTitle);
    setTimeout(() => {
      setSaveSuccessMsg(null);
      if (onBack) onBack();
    }, 1100);
  };

  const handleUnlockTest = () => {
    const updatedTests = currentSample.tests.map(t => {
      const codeNorm = (t.testTypeCode || t.testTypeId || '').toUpperCase();
      const activeNorm = (activeTestCode || '').toUpperCase();
      const isTargetTest = (
        codeNorm === activeNorm ||
        codeNorm.includes(activeNorm) ||
        (activeNorm === 'MC' && codeNorm.includes('MC')) ||
        (activeNorm === 'SG' && codeNorm.includes('SG')) ||
        (activeNorm === 'UW' && codeNorm.includes('UW')) ||
        (activeNorm === 'ATB' && codeNorm.includes('ATB')) ||
        (activeNorm === 'PP' && codeNorm.includes('PP')) ||
        currentSample.tests.length === 1
      );
      if (!isTargetTest) return t;

      return {
        ...t,
        status: 'Sedang Diuji' as const,
        lockedByTechnician: false,
        calculationStatus: 'Draft Data' as const,
      };
    });

    const updatedSample: Sample = {
      ...currentSample,
      status: 'In Progress',
      tests: updatedTests,
      updatedAt: new Date().toISOString(),
    };

    setCurrentSample(updatedSample);
    onSaveSample(updatedSample);
    setIsDirty(true);
  };

  const handleResetForm = () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus/kosongkan seluruh isi data pada formulir uji ini?')) return;
    setIsDirty(true);

    // Clear MC fields
    if (['MC', 'PP'].includes(activeTestCode)) {
      setMcContainer1(''); setMcContainer2('');
      setMcWet1(''); setMcWet2('');
      setMcDry1(''); setMcDry2('');
      setMcTare1(''); setMcTare2('');
      setMcContainer(''); setMcWet(''); setMcDry(''); setMcTare('');
    }
    // Clear UW fields
    if (['UW', 'PP'].includes(activeTestCode)) {
      setUwRingNo('');
      setUwRingWetWeight('');
    }
    // Clear SG fields
    if (['SG', 'PP'].includes(activeTestCode)) {
      setPycNo1(''); setPycNo2(''); setPycNo('');
      setWtDrySoil1(''); setWtDrySoil2('');
      setTemp1(''); setTemp2('');
      setWtPycWaterSoil1(''); setWtPycWaterSoil2('');
    }
    // Clear ATB fields
    if (['ATB'].includes(activeTestCode)) {
      setAtbBlows(['', '', '', '']);
      setAtbContainer(['', '', '', '']);
      setAtbWet(['', '', '', '']);
      setAtbDry(['', '', '', '']);
      setAtbPlContainer(['', '']);
      setAtbPlWet(['', '']);
      setAtbPlDry(['', '']);
      setLlBlows('25');
      setComputedLl(''); setComputedPl(''); setComputedPi('');
    }
    setDateStarted('');
    setDateCompleted('');
    setPhotos([]);
    // Immediately persist the cleared state so on re-open it shows empty
    handleSaveData(false);
  };

  const activeTestObj = currentSample.tests.find(t => {
    const code = t.testTypeCode || t.testTypeId || '';
    if (code === activeTestCode) return true;
    if (isSieveHydroCode(code) && isSieveHydroCode(activeTestCode)) return true;
    return false;
  });
  const isCurrentTestLocked = Boolean(activeTestObj?.lockedByTechnician || activeTestObj?.status === 'Selesai');

  return (
    <div className="space-y-4 pb-24 font-sans max-w-lg mx-auto">
      {/* TOP APP BAR - CLEAN MODERN THEME */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md text-slate-900 p-3 -mx-2 px-3 border-b border-slate-200 shadow-2xs flex items-center justify-between rounded-b-2xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => handleRequestExit(onBack)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer active:scale-95 border border-slate-200 shrink-0"
            title="Kembali ke Antrean"
          >
            <ArrowLeft className="w-4 h-4 text-slate-800" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono font-black text-[10px] border border-amber-300/80 shadow-2xs">
                PO: {po.poNumber}
              </span>
              <h2 className="text-sm font-black tracking-tight text-slate-900">{currentSample.sampleCode}</h2>
              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-bold">
                Depth: {currentSample.depthStart.toFixed(1)}-{currentSample.depthEnd.toFixed(1)}m
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium truncate max-w-[240px] mt-0.5">{po.clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
            isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </span>

          <button
            type="button"
            onClick={() => handleSaveData(false)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Simpan Draft Pengujian"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Draft</span>
          </button>
        </div>
      </div>



      {/* ACTIVE TEST HEADER CARD & TANGGAL PENGUJIAN */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <span className="text-xs font-black uppercase text-slate-900 tracking-wide flex items-center gap-1.5">
              <span>PENGUJIAN {(['MC', 'UW', 'SG', 'ATB'].includes(activeTestCode) || isSieveHydroCode(activeTestCode)) ? 'PHYSICAL PROPERTIES (PP)' : activeTestCode}</span>
            </span>
            <p className="text-[10.5px] text-slate-500 font-mono mt-0.5">
              Penguji: <strong className="text-slate-800">{currentUser.name}</strong> ??? SNI Terkait
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-xs shadow-xs">
            {activeTestCode}
          </span>
        </div>



        {/* TANGGAL MULAI & SELESAI PENGUJIAN & DURASI UJI */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* TANGGAL MULAI UJI (DATE STARTED) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold text-blue-950">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>TANGGAL MULAI UJI (DATE STARTED)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setDateStarted(today);
                    if (!dateCompleted || dateCompleted === dateStarted) {
                      setDateCompleted(today);
                    }
                  }}
                  className="text-[9.5px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 cursor-pointer font-bold border border-blue-200"
                >
                  Hari Ini
                </button>
              </div>
              <CustomDatePicker
                value={dateStarted}
                onChange={val => {
                  setDateStarted(val);
                  if (val && (!dateCompleted || dateCompleted === dateStarted)) {
                    setDateCompleted(val);
                  }
                }}
                placeholder="Pilih tanggal..."
                themeColor="blue"
              />
            </div>

            {/* TANGGAL SELESAI PENGUJIAN (DATE COMPLETED) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-extrabold text-emerald-950">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>TANGGAL SELESAI PENGUJIAN</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDateCompleted(new Date().toISOString().split('T')[0])}
                  className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 cursor-pointer font-bold border border-emerald-200"
                >
                  Hari Ini
                </button>
              </div>
              <CustomDatePicker
                value={dateCompleted}
                onChange={val => setDateCompleted(val)}
                placeholder="Pilih tanggal..."
                themeColor="emerald"
              />
            </div>
          </div>

          {/* DURASI UJI AUTOMATIC BOX OR EMPTY NOTICE */}
          {dateStarted && dateCompleted ? (
            (() => {
              const d1 = new Date(dateStarted);
              const d2 = new Date(dateCompleted);
              const diffMs = d2.getTime() - d1.getTime();
              const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 3600 * 24)) + 1);
              const wordMap: Record<number, string> = {
                1: 'Satu', 2: 'Dua', 3: 'Tiga', 4: 'Empat', 5: 'Lima',
                6: 'Enam', 7: 'Tujuh', 8: 'Delapan', 9: 'Sembilan', 10: 'Sepuluh',
                14: 'Empat Belas', 21: 'Dua Puluh Satu', 28: 'Dua Puluh Delapan'
              };
              const word = wordMap[diffDays] || `${diffDays}`;
              const text = diffDays === 1 ? '1 Hari (Satu Hari Selesai)' : `${diffDays} Hari (${word} Hari Selesai)`;

              return (
                <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between text-xs font-mono animate-fade-in">
                  <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>DURASI UJI:</span>
                  </span>
                  <span className="font-black text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                    {text}
                  </span>
                </div>
              );
            })()
          ) : (
            <div className="text-[10px] italic text-slate-400 font-mono text-right pr-1">
              *Isi tanggal mulai &amp; selesai pengujian.
            </div>
          )}

          {/* WARNA TANAH USCS (BILINGUAL) PER-TEST */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="flex items-center justify-between text-[10.5px] font-extrabold text-teal-950">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-slate-300 shadow-xs shrink-0"
                  style={{ backgroundColor: SOIL_COLOUR_CATALOGUE.find(c => c.code === soilColourCode)?.hex || '#E2E8F0' }}
                />
                <span>WARNA TANAH USCS (KHUSUS UJI INI)</span>
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">Bilingual</span>
            </div>
            <ModernSoilColourSelect
              value={soilColourCode}
              onChange={(code, name) => {
                setSoilColourCode(code);
                setIsDirty(true);
              }}
              activeTestSubTab={activeTestCode}
            />
          </div>
        </div>
      </div>

      {/* ????????? FORM UJI 1A: MOISTURE CONTENT (MC) ????????? */}
      {['MC'].includes(activeTestCode) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Scale className="w-4 h-4" />
              </div>
              <span className="tracking-tight text-sm">Moisture Content (w) - SNI 1965:2008</span>
            </h4>
          </div>

          {/* PARAMETER TABLE GRID FOR TRIAL 1 & TRIAL 2 */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 font-bold text-left">
                  <th className="py-2 px-1 text-slate-700 font-bold">Parameter</th>
                  <th className="py-2 px-1 text-center text-slate-700 font-bold w-28">Trial 1</th>
                  <th className="py-2 px-1 text-center text-slate-700 font-bold w-28">Trial 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Container No. */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Container No.</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={mcContainer1}
                      onClick={() => setActiveNumpad({
                        fieldId: 'mcContainer1',
                        label: 'Container No. (Trial 1)',
                        value: mcContainer1,
                        onChange: v => {
                          const code = v.toUpperCase();
                          setMcContainer1(code);
                          setMcContainer(code);
                          const tare = findContainerTare(code);
                          if (tare > 0) setMcTare1(tare.toFixed(4));
                        },
                        allowDecimal: false,
                        nextLabel: 'Lanjut ke Container 2 ???',
                        onNext: () => setActiveNumpad({
                          fieldId: 'mcContainer2',
                          label: 'Container No. (Trial 2)',
                          value: mcContainer2,
                          onChange: v => {
                            const code = v.toUpperCase();
                            setMcContainer2(code);
                            const tare = findContainerTare(code);
                            if (tare > 0) setMcTare2(tare.toFixed(4));
                          },
                          allowDecimal: false,
                          nextLabel: 'Lanjut ke Wt. Wet 1 ???',
                          onNext: () => setActiveNumpad({
                            fieldId: 'mcWet1',
                            label: 'Wt. Wet Soil + Cont (Trial 1) [g]',
                            value: mcWet1,
                            onChange: v => { setMcWet1(v); setMcWet(v); },
                            allowDecimal: true,
                            nextLabel: 'Lanjut ke Wt. Wet 2 ???',
                            onNext: () => setActiveNumpad({
                              fieldId: 'mcWet2',
                              label: 'Wt. Wet Soil + Cont (Trial 2) [g]',
                              value: mcWet2,
                              onChange: setMcWet2,
                              allowDecimal: true,
                              nextLabel: 'Lanjut ke Wt. Dry 1 ???',
                              onNext: () => setActiveNumpad({
                                fieldId: 'mcDry1',
                                label: 'Wt. Dry Soil + Cont (Trial 1) [g]',
                                value: mcDry1,
                                onChange: v => { setMcDry1(v); setMcDry(v); },
                                allowDecimal: true,
                                nextLabel: 'Lanjut ke Wt. Dry 2 ???',
                                onNext: () => setActiveNumpad({
                                  fieldId: 'mcDry2',
                                  label: 'Wt. Dry Soil + Cont (Trial 2) [g]',
                                  value: mcDry2,
                                  onChange: setMcDry2,
                                  allowDecimal: true,
                                  nextLabel: 'Selesai ???',
                                  onNext: () => setActiveNumpad(null),
                                }),
                              }),
                            }),
                          }),
                        }),
                      })}
                      placeholder="Nomor Cawan"
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-slate-800 placeholder-slate-400 normal-case placeholder:normal-case focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={mcContainer2}
                      onClick={() => setActiveNumpad({
                        fieldId: 'mcContainer2',
                        label: 'Container No. (Trial 2)',
                        value: mcContainer2,
                        onChange: v => {
                          const code = v.toUpperCase();
                          setMcContainer2(code);
                          const tare = findContainerTare(code);
                          if (tare > 0) setMcTare2(tare.toFixed(4));
                        },
                        allowDecimal: false,
                        nextLabel: 'Lanjut ke Wt. Wet 1 ???',
                        onNext: () => setActiveNumpad({
                          fieldId: 'mcWet1',
                          label: 'Wt. Wet Soil + Cont (Trial 1) [g]',
                          value: mcWet1,
                          onChange: v => { setMcWet1(v); setMcWet(v); },
                          allowDecimal: true,
                          nextLabel: 'Lanjut ke Wt. Wet 2 ???',
                          onNext: () => setActiveNumpad({
                            fieldId: 'mcWet2',
                            label: 'Wt. Wet Soil + Cont (Trial 2) [g]',
                            value: mcWet2,
                            onChange: setMcWet2,
                            allowDecimal: true,
                            nextLabel: 'Lanjut ke Wt. Dry 1 ???',
                            onNext: () => setActiveNumpad({
                              fieldId: 'mcDry1',
                              label: 'Wt. Dry Soil + Cont (Trial 1) [g]',
                              value: mcDry1,
                              onChange: v => { setMcDry1(v); setMcDry(v); },
                              allowDecimal: true,
                              nextLabel: 'Lanjut ke Wt. Dry 2 ???',
                              onNext: () => setActiveNumpad({
                                fieldId: 'mcDry2',
                                label: 'Wt. Dry Soil + Cont (Trial 2) [g]',
                                value: mcDry2,
                                onChange: setMcDry2,
                                allowDecimal: true,
                                nextLabel: 'Selesai ???',
                                onNext: () => setActiveNumpad(null),
                              }),
                            }),
                          }),
                        }),
                      })}
                      placeholder="Nomor Cawan"
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-slate-800 placeholder-slate-400 normal-case placeholder:normal-case focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>

                {/* 2. Wt. Wet Soil + Cont [g] */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Wt. Wet Soil + Cont [g]</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={mcWet1}
                      onClick={() => setActiveNumpad({
                        fieldId: 'mcWet1',
                        label: 'Wt. Wet Soil + Cont (Trial 1) [g]',
                        value: mcWet1,
                        onChange: v => { setMcWet1(v); setMcWet(v); },
                        allowDecimal: true,
                        nextLabel: 'Lanjut ke Wt. Wet 2 ???',
                        onNext: () => setActiveNumpad({
                          fieldId: 'mcWet2',
                          label: 'Wt. Wet Soil + Cont (Trial 2) [g]',
                          value: mcWet2,
                          onChange: setMcWet2,
                          allowDecimal: true,
                          nextLabel: 'Lanjut ke Wt. Dry 1 ???',
                          onNext: () => setActiveNumpad({
                            fieldId: 'mcDry1',
                            label: 'Wt. Dry Soil + Cont (Trial 1) [g]',
                            value: mcDry1,
                            onChange: v => { setMcDry1(v); setMcDry(v); },
                            allowDecimal: true,
                            nextLabel: 'Lanjut ke Wt. Dry 2 ???',
                            onNext: () => setActiveNumpad({
                              fieldId: 'mcDry2',
                              label: 'Wt. Dry Soil + Cont (Trial 2) [g]',
                              value: mcDry2,
                              onChange: setMcDry2,
                              allowDecimal: true,
                              nextLabel: 'Selesai ???',
                              onNext: () => setActiveNumpad(null),
                            }),
                          }),
                        }),
                      })}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={mcWet2}
                      onClick={() => setActiveNumpad({
                        fieldId: 'mcWet2',
                        label: 'Wt. Wet Soil + Cont (Trial 2) [g]',
                        value: mcWet2,
                        onChange: setMcWet2,
                        allowDecimal: true,
                        nextLabel: 'Lanjut ke Wt. Dry 1 ???',
                        onNext: () => setActiveNumpad({
                          fieldId: 'mcDry1',
                          label: 'Wt. Dry Soil + Cont (Trial 1) [g]',
                          value: mcDry1,
                          onChange: v => { setMcDry1(v); setMcDry(v); },
                          allowDecimal: true,
                          nextLabel: 'Lanjut ke Wt. Dry 2 ???',
                          onNext: () => setActiveNumpad({
                            fieldId: 'mcDry2',
                            label: 'Wt. Dry Soil + Cont (Trial 2) [g]',
                            value: mcDry2,
                            onChange: setMcDry2,
                            allowDecimal: true,
                            nextLabel: 'Selesai ???',
                            onNext: () => setActiveNumpad(null),
                          }),
                        }),
                      })}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>

                {/* 3. Wt. Dry Soil + Cont [g] */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Wt. Dry Soil + Cont [g]</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={mcDry1}
                      onClick={() => setActiveNumpad({
                        fieldId: 'mcDry1',
                        label: 'Wt. Dry Soil + Cont (Trial 1) [g]',
                        value: mcDry1,
                        onChange: v => { setMcDry1(v); setMcDry(v); },
                        allowDecimal: true,
                        nextLabel: 'Lanjut ke Wt. Dry 2 ???',
                        onNext: () => setActiveNumpad({
                          fieldId: 'mcDry2',
                          label: 'Wt. Dry Soil + Cont (Trial 2) [g]',
                          value: mcDry2,
                          onChange: setMcDry2,
                          allowDecimal: true,
                          nextLabel: 'Selesai ???',
                          onNext: () => setActiveNumpad(null),
                        }),
                      })}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={mcDry2}
                      onClick={() => setActiveNumpad({
                        fieldId: 'mcDry2',
                        label: 'Wt. Dry Soil + Cont (Trial 2) [g]',
                        value: mcDry2,
                        onChange: setMcDry2,
                        allowDecimal: true,
                        nextLabel: 'Selesai ???',
                        onNext: () => setActiveNumpad(null),
                      })}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-emerald-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ????????? FORM UJI 1B: UNIT WEIGHT (UW) ????????? */}
      {['UW', 'PP'].includes(activeTestCode) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Unit Weight / Density - SNI 2813:2008</span>
            </h4>
            <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              SNI 2813:2008
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 h-9">
                  <th className="px-3 h-9 align-middle">Parameter</th>
                  <th className="px-2 text-center w-36 h-9 align-middle">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {/* Ring No. */}
                <tr className="h-10">
                  <td className="px-3 h-10 align-middle text-slate-700 font-sans font-normal">
                    Ring No.
                  </td>
                  <td className="px-2 h-10 align-middle">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      placeholder="Nomor Ring"
                      value={uwRingNo}
                      onClick={() => setActiveNumpad({
                        fieldId: 'uwRingNo',
                        label: 'Ring No. (Nomor Ring)',
                        value: uwRingNo,
                        onChange: setUwRingNo,
                        allowDecimal: false,
                        nextLabel: 'Lanjut ke Wt. Soil ???',
                        onNext: () => setActiveNumpad({
                          fieldId: 'uwRingWetWeight',
                          label: 'Wt. Ring + Wet Soil [g]',
                          value: uwRingWetWeight,
                          onChange: setUwRingWetWeight,
                          allowDecimal: true,
                          nextLabel: 'Selesai ???',
                          onNext: () => setActiveNumpad(null),
                        }),
                      })}
                      className="w-full h-8 bg-slate-50 border border-blue-300 rounded-lg px-2 text-center font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>

                {/* Wt. Ring + Wet Soil [g] */}
                <tr className="h-10">
                  <td className="px-3 h-10 align-middle text-slate-700 font-sans font-normal">
                    Wt. Ring + Wet Soil [g]
                  </td>
                  <td className="px-2 h-10 align-middle">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      placeholder="0.000"
                      value={uwRingWetWeight}
                      onClick={() => setActiveNumpad({
                        fieldId: 'uwRingWetWeight',
                        label: 'Wt. Ring + Wet Soil [g]',
                        value: uwRingWetWeight,
                        onChange: setUwRingWetWeight,
                        allowDecimal: true,
                        nextLabel: 'Selesai ???',
                        onNext: () => setActiveNumpad(null),
                      })}
                      className="w-full h-8 bg-slate-50 border border-blue-300 rounded-lg px-2 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>

                {/* Wt. Ring [g] */}
                <tr className="h-9 bg-slate-50/50">
                  <td className="px-3 h-9 align-middle font-sans font-normal text-slate-600">
                    Wt. Ring [g]
                  </td>
                  <td className="px-2 h-9 align-middle text-center font-bold text-slate-800">
                    {matchedUwRing && uwRingWeightGrams > 0
                      ? uwRingWeightGrams.toFixed(3)
                      : '-'}
                  </td>
                </tr>

                {/* Volume Ring [cm??] */}
                <tr className="h-9 bg-slate-50/50">
                  <td className="px-3 h-9 align-middle font-sans font-normal text-slate-600">
                    Volume Ring [cm??]
                  </td>
                  <td className="px-2 h-9 align-middle text-center font-bold text-slate-800">
                    {matchedUwRing && uwRingVolumeCm3 > 0
                      ? uwRingVolumeCm3.toFixed(3)
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2: SHEAR / TRIAXIAL CALIBRATION & PARAMETERS (TRX CU/CD ONLY) 🚀 */}
      {['TRX-CU', 'TRX-CD'].includes(activeTestCode) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>2. Parameter Uji Geser &amp; Proving Ring</span>
            </h4>
            <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
              Kuat Geser
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Pilih Proving Ring Mesin:</label>
              <select
                value={selectedRingNo}
                onChange={e => {
                  const code = e.target.value;
                  setSelectedRingNo(code);
                  const match = (trxRingCatalogue || []).find((r: any) => r.ringNo === code || r.ringNo?.includes(code));
                  if (match) {
                    const lrc = (match as any).provingCalibration ?? (match as any).lrc;
                    if (lrc) setLrcInput(String(lrc));
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
              >
                {(trxRingCatalogue && trxRingCatalogue.length > 0 ? trxRingCatalogue : [
                  { ringNo: 'GT-105 (S/N: 235669)', provingCalibration: 0.12064 },
                  { ringNo: 'TRX-2 (Master)', provingCalibration: 0.12100 }
                ]).map((r: any, idx: number) => (
                  <option key={idx} value={r.ringNo}>
                    {r.ringNo} ({(r.provingCalibration || r.lrc || 0.12064)} kgf/div)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Kohesi (c) [kg/cm??]:</label>
                <input
                  type="number"
                  step="0.001"
                  inputMode="decimal"
                  value={cohesionInput}
                  onChange={e => setCohesionInput(e.target.value)}
                  placeholder="mis. 0.185"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Sudut Geser (??) [??]:</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={frictionAngleInput}
                  onChange={e => setFrictionAngleInput(e.target.value)}
                  placeholder="mis. 24.50"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ????????? SECTION 2B: SPECIFIC GRAVITY FORM (SG - SNI 1964:2008) ????????? */}
      {['SG'].includes(activeTestCode) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <Layers className="w-4 h-4" />
              </div>
              <span className="tracking-tight text-sm">Specific Gravity (Gs) - SNI 1964:2008</span>
            </h4>
          </div>

          {/* PARAMETER TABLE GRID */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700 font-bold text-left">
                  <th className="py-2 px-1 text-slate-700 font-bold">Parameter</th>
                  <th className="py-2 px-1 text-center text-slate-700 font-bold w-28">Trial 1</th>
                  <th className="py-2 px-1 text-center text-slate-700 font-bold w-28">Trial 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* 1. Pycnometer No. */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Pycnometer No.</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={pycNo1}
                      onClick={() => openSgNumpad('pyc1')}
                      placeholder="No."
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                    {!pycVal1.isValid && pycNo1.trim() !== '' && (
                      <span className="text-[9.5px] text-red-500 font-bold block text-center mt-0.5">Pikno Tidak Ada</span>
                    )}
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={pycNo2}
                      onClick={() => openSgNumpad('pyc2')}
                      placeholder="No."
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                    {!pycVal2.isValid && pycNo2.trim() !== '' && (
                      <span className="text-[9.5px] text-red-500 font-bold block text-center mt-0.5">Pikno Tidak Ada</span>
                    )}
                  </td>
                </tr>

                {/* 2. Wt. Dry Soil (A) [g] */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Wt. Dry Soil (A) [g]</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={wtDrySoil1}
                      onClick={() => openSgNumpad('dry1')}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={wtDrySoil2}
                      onClick={() => openSgNumpad('dry2')}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>

                {/* 3. Temperature (°C) */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Temperature (°C)</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={temp1}
                      onClick={() => openSgNumpad('temp1')}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={temp2}
                      onClick={() => openSgNumpad('temp2')}
                      placeholder="0"
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>

                {/* 4. Wt. Pyc + Water + Soil (B) [g] */}
                <tr>
                  <td className="py-2 px-1 text-slate-700 font-medium">Wt. Pyc + Water + Soil (B) [g]</td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={wtPycWaterSoil1}
                      onClick={() => openSgNumpad('wet1')}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="text"
                      readOnly
                      inputMode="none"
                      value={wtPycWaterSoil2}
                      onClick={() => openSgNumpad('wet2')}
                      placeholder="0.000"
                      className="w-full bg-slate-50 border border-blue-300 rounded-xl px-2 py-1.5 text-xs text-center font-bold font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ????????? SECTION 2C: ATTERBERG LIMITS FORM (ATB) ????????? */}
      {['ATB'].includes(activeTestCode) && (
        <div className="space-y-4">

          {/* TABLE 1: UJI BATAS CAIR (LIQUID LIMIT TEST - 4 TRIALS) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                <span>1. Uji Batas Cair / Liquid Limit Test</span>
              </h5>
              <span className="text-[10px] text-slate-400 font-mono">4 Titik Pukulan (10???40 Ketukan)</span>
            </div>

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-2 border-r border-slate-200 text-left min-w-[120px]">PARAMETER</th>
                    {[1, 2, 3, 4].map(num => (
                      <th key={num} className="py-2 px-1 text-center border-r border-slate-200 w-20 bg-amber-50/80 text-amber-900 font-extrabold">
                        {num}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {/* Banyak Pukulan / No. of blows */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Banyak Pukulan / No. of blows
                    </td>
                    {[0, 1, 2, 3].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbBlows[i]}
                          onClick={() => openAtbLlNumpad('blows', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setAtbBlows(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="pukulan"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* No. Cawan */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      No. Cawan
                    </td>
                    {[0, 1, 2, 3].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbContainer[i]}
                          onClick={() => openAtbLlNumpad('container', i)}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            setAtbContainer(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="no cawan"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Berat cawan kosong (gr) */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-500 border-r border-slate-200 text-[11px]">
                      Berat cawan kosong <span className="text-[9px]">(gr)</span>
                    </td>
                    {[0, 1, 2, 3].map(i => (
                      <td key={i} className="py-1.5 px-1 text-center border-r border-slate-200 font-mono text-slate-600 text-[11px] font-bold">
                        {atbLlTrialResults[i].emptyCan > 0 ? atbLlTrialResults[i].emptyCan.toFixed(3) : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Berat cawan + Tanah basah (gr) */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Berat cawan + Tanah basah <span className="text-[9px] text-slate-400">(gr)</span>
                    </td>
                    {[0, 1, 2, 3].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbWet[i]}
                          onClick={() => openAtbLlNumpad('wet', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setAtbWet(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Berat cawan + Tanah Kering (gr) */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Berat cawan + Tanah Kering <span className="text-[9px] text-slate-400">(gr)</span>
                    </td>
                    {[0, 1, 2, 3].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbDry[i]}
                          onClick={() => openAtbLlNumpad('dry', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setAtbDry(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>


                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: UJI BATAS PLASTIS (PLASTIC LIMIT TEST - 2 TRIALS) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                <span>2. Uji Batas Plastis / Plastic Limit Test</span>
              </h5>
            </div>

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-2 border-r border-slate-200 text-left min-w-[140px]">PARAMETER</th>
                    {[0, 1].map(i => (
                      <th key={i} className="py-2 px-1 text-center border-r border-slate-200 bg-amber-50/80 text-amber-900">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbPlContainer[i]}
                          onClick={() => openAtbPlNumpad('container', i)}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            setAtbPlContainer(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="no cawan"
                          className="w-full bg-white border border-slate-300 rounded px-1 py-0.5 text-center font-extrabold text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {/* Berat cawan kosong (gr) */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-500 border-r border-slate-200 text-[11px]">
                      Berat cawan kosong <span className="text-[9px]">(gr)</span>
                    </td>
                    {[0, 1].map(i => (
                      <td key={i} className="py-1.5 px-1 text-center border-r border-slate-200 font-mono text-slate-600 text-[11px] font-bold">
                        {atbPlTrialResults[i].emptyCan > 0 ? atbPlTrialResults[i].emptyCan.toFixed(3) : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Berat cawan + Tanah basah (gr) */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Berat cawan + Tanah basah <span className="text-[9px] text-slate-400">(gr)</span>
                    </td>
                    {[0, 1].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbPlWet[i]}
                          onClick={() => openAtbPlNumpad('wet', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setAtbPlWet(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Berat cawan + Tanah Kering (gr) */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Berat cawan + Tanah Kering <span className="text-[9px] text-slate-400">(gr)</span>
                    </td>
                    {[0, 1].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={atbPlDry[i]}
                          onClick={() => openAtbPlNumpad('dry', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setAtbPlDry(prev => { const next = [...prev]; next[i] = val; return next; });
                          }}
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>


                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2D: SIEVE ANALYSIS & HYDROMETER FORM (Sieve-Hydro) 🚀 */}
      {isSieveHydroCode(activeTestCode) && (
        <div className="space-y-4">
          {/* CARD 1: ANALISIS SARINGAN / SIEVE ANALYSIS (14 SARINGAN + PAN) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>1. Analisis Saringan / Sieve Analysis</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">14 Saringan + Pan (SNI 3423:2008)</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold border border-indigo-200">
                SNI 3423:2008
              </span>
            </div>

            {/* Sieve Table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-2.5 border-r border-slate-200 text-left">No. Saringan</th>
                    <th className="py-2 px-2 border-r border-slate-200 text-center w-[100px]">Opening (mm)</th>
                    <th className="py-2 px-2 text-center bg-amber-50/80 text-amber-900 w-[140px]">Berat Retained (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {sieveResultsHP.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                      <td className="py-1.5 px-2.5 font-bold text-slate-800 border-r border-slate-200 text-xs">
                        {row.name}
                      </td>
                      <td className="py-1.5 px-2 text-center text-slate-600 font-mono border-r border-slate-200 text-xs">
                        {row.openingMm > 0 ? row.openingMm : '—'}
                      </td>
                      <td className="py-1 px-1.5 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={shSieveRetained[i]}
                          onClick={() => openSieveNumpad(i)}
                          onChange={e => updateSieveRetained(i, cleanIndoNumStr(e.target.value))}
                          placeholder="0.00"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/90 font-extrabold border-t-2 border-slate-300">
                    <td colSpan={2} className="py-2 px-2.5 text-slate-800 uppercase text-[11px] border-r border-slate-300">
                      TOTAL BERAT KERING (g)
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-900 text-xs">
                      {wSieveRetained > 0 ? wSieveRetained.toFixed(2) : '—'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* CARD 2: ANALISIS HIDROMETER / HYDROMETER ANALYSIS (10 TITIK WAKTU) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>2. Analisis Hidrometer / Hydrometer Analysis</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">10 Titik Waktu (0–1440 Menit)</p>
              </div>
            </div>

            {/* Header Parameters Cards Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Ws — Berat Kering (g):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={shHydroSoilWeight}
                  onClick={() => openHydroHeaderNumpad('ws')}
                  onChange={e => setShHydroSoilWeight(cleanIndoNumStr(e.target.value))}
                  placeholder="Isi Berat Kering"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer active:scale-95 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Suhu Uji T (°C):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={shHydroTemp}
                  onClick={() => openHydroHeaderNumpad('temp')}
                  onChange={e => setShHydroTemp(cleanIndoNumStr(e.target.value))}
                  placeholder="Isi Suhu T"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer active:scale-95 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Koreksi Meniscus c:</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={shHydroMeniscus}
                  onClick={() => openHydroHeaderNumpad('meniscus')}
                  onChange={e => setShHydroMeniscus(cleanIndoNumStr(e.target.value))}
                  placeholder="Isi Koreksi Meniscus"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer active:scale-95 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Koreksi Dispersan mt:</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={shHydroDispersant}
                  onClick={() => openHydroHeaderNumpad('dispersant')}
                  onChange={e => setShHydroDispersant(cleanIndoNumStr(e.target.value))}
                  placeholder="Isi Koreksi Dispersan"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer active:scale-95 transition"
                />
              </div>
            </div>

            {/* Hydrometer Reading Table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-2.5 border-r border-slate-200 text-left">Waktu (min)</th>
                    <th className="py-2 px-2 text-center bg-amber-50/80 text-amber-900 w-[150px]">Reading R'h</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {hydroResultsHP.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                      <td className="py-1.5 px-2.5 font-bold text-slate-800 border-r border-slate-200 text-xs">
                        {row.timeMin} min
                      </td>
                      <td className="py-1 px-1.5 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={shHydroReadings[i]}
                          onClick={() => openHydroReadingNumpad(i)}
                          onChange={e => updateHydroReading(i, cleanIndoNumStr(e.target.value))}
                          placeholder="0.0"
                          className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2E: DIRECT SHEAR UU FORM (DS-UU) 🚀 */}
      {['DS-UU', 'DS', 'DSH-UU'].includes(activeTestCode) && (
        <div className="space-y-4">
          {/* CARD 1: PROPERTI SPECIMEN & DIMENSI (3 SPECIMEN) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>1. Properti Specimen &amp; Data Kadar Air (3 Specimen)</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Direct Shear UU (SNI 3420:2016)</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-mono text-[10px] font-bold border border-purple-200">
                SNI 3420:2016
              </span>
            </div>

            {/* Specimen Header Parameters Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Ring No.:</label>
                <select
                  value={dsUuRingNo}
                  onChange={e => {
                    const code = e.target.value;
                    setDsUuRingNo(code);
                    const match = (dsRingCatalogue && dsRingCatalogue.length > 0 ? dsRingCatalogue : [
                      { ringNo: 'DS-1', diameterMm: 59.4, heightMm: 24.9, weightGrams: 63.16 }
                    ]).find(r => r.ringNo === code || r.ringNo?.includes(code));
                    if (match) {
                      if (match.diameterMm) setDsUuRingDia((match.diameterMm / 10).toFixed(2));
                      if (match.heightMm) setDsUuRingHeight((match.heightMm / 10).toFixed(2));
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="">-- Pilih Ring Cetak DS --</option>
                  {(dsRingCatalogue && dsRingCatalogue.length > 0 ? dsRingCatalogue : [
                    { ringNo: 'DS-1', diameterMm: 59.4, heightMm: 24.9, weightGrams: 63.16 }
                  ]).map((r: any, idx: number) => {
                    const diaCm = r.diameterCm || (r.diameterMm ? r.diameterMm / 10 : 6.35);
                    return (
                      <option key={idx} value={r.ringNo}>
                        {r.ringNo} (Do: {diaCm.toFixed(2)} cm)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Calib Ring (kgf/div):</label>
                <select
                  value={dsUuProvingCalibration}
                  onChange={e => setDsUuProvingCalibration(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer"
                >
                  <option value="">-- Pilih Mesin DS / Proving Ring --</option>
                  {(dsProvingCatalogue && dsProvingCatalogue.length > 0 ? dsProvingCatalogue : [
                    { machineCode: 'Mesin DS-01 (Standard)', provingCalibration: 0.4067 }
                  ]).map((m: any, idx: number) => {
                    const lrc = m.provingCalibration ?? m.lrc ?? 0.4067;
                    return (
                      <option key={idx} value={String(lrc)}>
                        {m.machineCode || m.kode || 'Mesin DS-01'} ({lrc} kgf/div)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Diameter Do (cm):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={dsUuRingDia}
                  onClick={() => openDsUuHeaderNumpad('dia')}
                  placeholder="misal: 6.35"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer active:scale-95 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-700 block mb-1">Tinggi Ho (cm):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={dsUuRingHeight}
                  onClick={() => openDsUuHeaderNumpad('height')}
                  placeholder="misal: 2.00"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer active:scale-95 transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Luas Area A (cm²):</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-700">
                  {dsAreaCm2 > 0 ? dsAreaCm2.toFixed(3) : '—'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Volume V (cm³):</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold font-mono text-slate-700">
                  {dsVolumeCm3 > 0 ? dsVolumeCm3.toFixed(3) : '—'}
                </div>
              </div>
            </div>

            {/* Table 1: Parameter Specimen (3 Specimen) */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-2 border-r border-slate-200 text-left min-w-[130px]">Parameter Specimen</th>
                    <th className="py-2 px-1 border-r border-slate-200 text-center w-[45px]">Satuan</th>
                    <th className="py-2 px-1 text-center border-r border-slate-200 bg-purple-50/80 text-purple-900 font-extrabold w-[80px]">Spec 1 (A)</th>
                    <th className="py-2 px-1 text-center border-r border-slate-200 bg-blue-50/80 text-blue-900 font-extrabold w-[80px]">Spec 2 (B)</th>
                    <th className="py-2 px-1 text-center bg-emerald-50/80 text-emerald-900 font-extrabold w-[80px]">Spec 3 (C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {/* Beban Normal (Normal load) [kgf] */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Beban Normal (Normal load)
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-slate-500 border-r border-slate-200 text-[10px]">
                      kgf
                    </td>
                    {[0, 1, 2].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={dsUuNormalLoads[i]}
                          onClick={() => openDsUuTable1Numpad('load', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setDsUuNormalLoads(prev => { const n = [...prev]; n[i] = val; return n; });
                          }}
                          placeholder="misal: 5"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Massa tanah basah + ring (gr) */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-purple-900 border-r border-slate-200 text-[11px]">
                      Massa tanah basah + ring
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-purple-600 font-bold border-r border-slate-200 text-[10px]">
                      gram
                    </td>
                    {[0, 1, 2].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={dsUuWetSoilPlusRing[i]}
                          onClick={() => openDsUuTable1Numpad('wetRing', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setDsUuWetSoilPlusRing(prev => { const n = [...prev]; n[i] = val; return n; });
                          }}
                          placeholder="188.849"
                          className="w-full bg-white border border-purple-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-purple-900 text-xs focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Tegangan Normal (Normal stress) [kPa] */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-600 border-r border-slate-200 text-[11px]">
                      Tegangan Normal (Normal stress)
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-slate-500 border-r border-slate-200 text-[9px]">
                      kPa
                    </td>
                    {[0, 1, 2].map(i => {
                      const load = parseIndoFloat(dsUuNormalLoads[i]);
                      const stress = (load > 0 && dsAreaCm2 > 0) ? (load / dsAreaCm2) * 98.0665 : 0;
                      return (
                        <td key={i} className="py-1.5 px-1 text-center border-r border-slate-200 font-mono text-slate-700 text-xs font-bold">
                          {stress > 0 ? stress.toFixed(2) : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* No. Cawan / Container No. */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      No. Cawan / Container No.
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-slate-400 border-r border-slate-200 text-[10px]">
                      —
                    </td>
                    {[0, 1, 2].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={dsUuContainerNo[i]}
                          onClick={() => openDsUuTable1Numpad('can', i)}
                          onChange={e => {
                            const val = e.target.value.toUpperCase();
                            setDsUuContainerNo(prev => { const n = [...prev]; n[i] = val; return n; });
                          }}
                          placeholder="no cawan"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Massa Cawan (Wt. of container) [gram] */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-500 border-r border-slate-200 text-[11px]">
                      Massa Cawan (Wt. of container)
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-slate-400 border-r border-slate-200 text-[10px]">
                      gram
                    </td>
                    {[0, 1, 2].map(i => {
                      const tare = findContainerTare((dsUuContainerNo[i] || '').toUpperCase());
                      return (
                        <td key={i} className="py-1.5 px-1 text-center border-r border-slate-200 font-mono text-slate-600 text-xs font-semibold">
                          {tare > 0 ? tare.toFixed(3) : '—'}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Wt. of wet sample + container [gram] */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Wt. of wet sample + container
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-slate-400 border-r border-slate-200 text-[10px]">
                      gram
                    </td>
                    {[0, 1, 2].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={dsUuWetCanWeight[i]}
                          onClick={() => openDsUuTable1Numpad('wetCan', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setDsUuWetCanWeight(prev => { const n = [...prev]; n[i] = val; return n; });
                          }}
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>

                  {/* Wt. of dry sample + container [gram] */}
                  <tr>
                    <td className="py-1.5 px-2 font-semibold text-slate-800 border-r border-slate-200 text-[11px]">
                      Wt. of dry sample + container
                    </td>
                    <td className="py-1.5 px-1 text-center font-mono text-slate-400 border-r border-slate-200 text-[10px]">
                      gram
                    </td>
                    {[0, 1, 2].map(i => (
                      <td key={i} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          readOnly
                          inputMode="none"
                          value={dsUuDryCanWeight[i]}
                          onClick={() => openDsUuTable1Numpad('dryCan', i)}
                          onChange={e => {
                            const val = e.target.value;
                            setDsUuDryCanWeight(prev => { const n = [...prev]; n[i] = val; return n; });
                          }}
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 2: TABEL DIAL BEBAN (LOAD DIAL div - DYNAMIC ROWS) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span>2. Data Deformasi &amp; Dial Beban (Load Dial div)</span>
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {dsUuDialReadingsA.length} Titik Displacement (0.00 – {((dsUuDialReadingsA.length - 1) * 0.30).toFixed(2)} mm)
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddDsRow}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>+ Tambah Baris</span>
                </button>
              </div>
            </div>

            {/* Load Dial Table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs text-left border-collapse min-w-[320px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2 px-2 border-r border-slate-200 text-center w-[90px]">Displacement (mm)</th>
                    <th className="py-2 px-1 text-center border-r border-slate-200 bg-purple-50/80 text-purple-900 font-extrabold w-[80px]">Spec 1 Dial (div)</th>
                    <th className="py-2 px-1 text-center border-r border-slate-200 bg-blue-50/80 text-blue-900 font-extrabold w-[80px]">Spec 2 Dial (div)</th>
                    <th className="py-2 px-1 text-center border-r border-slate-200 bg-emerald-50/80 text-emerald-900 font-extrabold w-[80px]">Spec 3 Dial (div)</th>
                    <th className="py-2 px-1 text-center w-[36px] text-slate-500 font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {dsUuDialReadingsA.map((_, rowIdx) => {
                    const disp = rowIdx * 0.30;
                    return (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="py-1.5 px-2 text-center font-bold font-mono text-slate-800 border-r border-slate-200 text-xs">
                          {disp.toFixed(2)}
                        </td>
                        {[0, 1, 2].map(specIdx => {
                          const vals = specIdx === 0 ? dsUuDialReadingsA : specIdx === 1 ? dsUuDialReadingsB : dsUuDialReadingsC;
                          return (
                            <td key={specIdx} className="py-1 px-1 border-r border-slate-200 bg-amber-50/30">
                              <input
                                type="text"
                                readOnly
                                inputMode="none"
                                value={vals[rowIdx] || ''}
                                onClick={() => openDsUuDialNumpad(specIdx, rowIdx)}
                                placeholder="0"
                                className="w-full bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer active:scale-95 transition"
                              />
                            </td>
                          );
                        })}
                        <td className="py-1 px-1 text-center">
                          {dsUuDialReadingsA.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDsRow(rowIdx)}
                              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Hapus Baris Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2F: UNCONFINED COMPRESSION TEST (UCT - SNI 3638:2012 / ASTM D2166) 🚀 */}
      {activeTestCode === 'UCT' && (
        <div className="space-y-3">
          {/* 1. PARAMETER ALAT & PROVING RING */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-purple-600" />
                <span>1. Parameter Alat &amp; Proving Ring UCT</span>
              </h4>
              <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                SNI 3638:2012
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Pilih Proving Ring UCT:</label>
                <select
                  value={uctRingNo}
                  onChange={e => {
                    const code = e.target.value;
                    setUctRingNo(code);
                    const match = (uctRingCatalogue || []).find(r => r.ringNo === code || r.ringNo?.startsWith(code));
                    if (match && match.provingCalibration) {
                      setUctPrCalib(String(match.provingCalibration));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Pilih Ring UCT --</option>
                  {(uctRingCatalogue && uctRingCatalogue.length > 0 ? uctRingCatalogue : DEFAULT_UCT_RING_CATALOGUE).map((r, idx) => (
                    <option key={idx} value={r.ringNo}>
                      {r.ringNo} ({r.provingCalibration} kgf/div)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Kalibrasi Proving Ring (kgf/div):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={uctPrCalib}
                  onClick={() => setActiveNumpad({
                    fieldId: 'uctPrCalib',
                    label: 'Faktor Kalibrasi Proving Ring UCT [kgf/div]',
                    value: uctPrCalib,
                    onChange: setUctPrCalib,
                    allowDecimal: true,
                    nextLabel: 'Selesai ➔',
                    onNext: () => setActiveNumpad(null)
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 font-mono text-center cursor-pointer select-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">Kecepatan Regangan (mm/min):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={uctDeformRate}
                  onClick={() => setActiveNumpad({
                    fieldId: 'uctDeformRate',
                    label: 'Kecepatan Deformasi Mesin UCT [mm/menit]',
                    value: uctDeformRate,
                    onChange: setUctDeformRate,
                    allowDecimal: true,
                    nextLabel: 'Selesai ➔',
                    onNext: () => setActiveNumpad(null)
                  })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 font-mono text-center cursor-pointer select-none"
                />
              </div>
            </div>
          </div>

          {/* 2. DIMENSI & PROPERTI FISIK BENDA UJI (UDS vs REM) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>2. Dimensi &amp; Properti Fisik Benda Uji</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                UDS vs REM
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 text-center">
                    <th className="py-2 px-2 text-left w-2/5">Parameter Benda Uji</th>
                    <th className="py-2 px-1 w-1/6 text-slate-500">Satuan</th>
                    <th className="py-2 px-2 text-blue-700 bg-blue-50/60 w-1/4">Undisturbed</th>
                    <th className="py-2 px-2 text-purple-700 bg-purple-50/60 w-1/4">Remolded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {/* Diameter Awal */}
                  <tr>
                    <td className="py-2 px-2 text-left font-sans font-medium text-slate-800">Diameter Awal (D₀)</td>
                    <td className="py-2 px-1 text-center text-slate-400 text-[11px]">mm</td>
                    <td className="py-1.5 px-1 bg-blue-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctDiaUds}
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctDiaUds',
                          label: 'Diameter Awal Specimen UDS [mm]',
                          value: uctDiaUds,
                          onChange: setUctDiaUds,
                          allowDecimal: true,
                          nextLabel: 'Tinggi UDS ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctLengthUds',
                            label: 'Tinggi Awal Specimen UDS [mm]',
                            value: uctLengthUds,
                            onChange: setUctLengthUds,
                            allowDecimal: true,
                            nextLabel: 'Massa Basah UDS ➔',
                            onNext: () => setActiveNumpad({
                              fieldId: 'uctWetMassUds',
                              label: 'Massa Basah Awal UDS [gram]',
                              value: uctWetMassUds,
                              onChange: setUctWetMassUds,
                              allowDecimal: true,
                              nextLabel: 'Massa Kering UDS ➔',
                              onNext: () => setActiveNumpad({
                                fieldId: 'uctDryMassUds',
                                label: 'Massa Kering UDS [gram]',
                                value: uctDryMassUds,
                                onChange: setUctDryMassUds,
                                allowDecimal: true,
                                nextLabel: 'Selesai ➔',
                                onNext: () => setActiveNumpad(null)
                              })
                            })
                          })
                        })}
                        className="w-full bg-white border border-blue-200 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs"
                      />
                    </td>
                    <td className="py-1.5 px-1 bg-purple-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctDiaRem}
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctDiaRem',
                          label: 'Diameter Awal Specimen REM [mm]',
                          value: uctDiaRem,
                          onChange: setUctDiaRem,
                          allowDecimal: true,
                          nextLabel: 'Tinggi REM ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctLengthRem',
                            label: 'Tinggi Awal Specimen REM [mm]',
                            value: uctLengthRem,
                            onChange: setUctLengthRem,
                            allowDecimal: true,
                            nextLabel: 'Massa Basah REM ➔',
                            onNext: () => setActiveNumpad({
                              fieldId: 'uctWetMassRem',
                              label: 'Massa Basah Awal REM [gram]',
                              value: uctWetMassRem,
                              onChange: setUctWetMassRem,
                              allowDecimal: true,
                              nextLabel: 'Massa Kering REM ➔',
                              onNext: () => setActiveNumpad({
                                fieldId: 'uctDryMassRem',
                                label: 'Massa Kering REM [gram]',
                                value: uctDryMassRem,
                                onChange: setUctDryMassRem,
                                allowDecimal: true,
                                nextLabel: 'Selesai ➔',
                                onNext: () => setActiveNumpad(null)
                              })
                            })
                          })
                        })}
                        className="w-full bg-white border border-purple-200 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs"
                      />
                    </td>
                  </tr>

                  {/* Tinggi Awal */}
                  <tr>
                    <td className="py-2 px-2 text-left font-sans font-medium text-slate-800">Tinggi Awal (L₀)</td>
                    <td className="py-2 px-1 text-center text-slate-400 text-[11px]">mm</td>
                    <td className="py-1.5 px-1 bg-blue-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctLengthUds}
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctLengthUds',
                          label: 'Tinggi Awal Specimen UDS [mm]',
                          value: uctLengthUds,
                          onChange: setUctLengthUds,
                          allowDecimal: true,
                          nextLabel: 'Massa Basah UDS ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctWetMassUds',
                            label: 'Massa Basah Awal UDS [gram]',
                            value: uctWetMassUds,
                            onChange: setUctWetMassUds,
                            allowDecimal: true,
                            nextLabel: 'Massa Kering UDS ➔',
                            onNext: () => setActiveNumpad({
                              fieldId: 'uctDryMassUds',
                              label: 'Massa Kering UDS [gram]',
                              value: uctDryMassUds,
                              onChange: setUctDryMassUds,
                              allowDecimal: true,
                              nextLabel: 'Selesai ➔',
                              onNext: () => setActiveNumpad(null)
                            })
                          })
                        })}
                        className="w-full bg-white border border-blue-200 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs"
                      />
                    </td>
                    <td className="py-1.5 px-1 bg-purple-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctLengthRem}
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctLengthRem',
                          label: 'Tinggi Awal Specimen REM [mm]',
                          value: uctLengthRem,
                          onChange: setUctLengthRem,
                          allowDecimal: true,
                          nextLabel: 'Massa Basah REM ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctWetMassRem',
                            label: 'Massa Basah Awal REM [gram]',
                            value: uctWetMassRem,
                            onChange: setUctWetMassRem,
                            allowDecimal: true,
                            nextLabel: 'Massa Kering REM ➔',
                            onNext: () => setActiveNumpad({
                              fieldId: 'uctDryMassRem',
                              label: 'Massa Kering REM [gram]',
                              value: uctDryMassRem,
                              onChange: setUctDryMassRem,
                              allowDecimal: true,
                              nextLabel: 'Selesai ➔',
                              onNext: () => setActiveNumpad(null)
                            })
                          })
                        })}
                        className="w-full bg-white border border-purple-200 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs"
                      />
                    </td>
                  </tr>

                  {/* Luas Penampang Awal */}
                  <tr className="bg-slate-50/60">
                    <td className="py-2 px-2 text-left font-sans font-medium text-slate-600">Luas Penampang Awal (A₀)</td>
                    <td className="py-2 px-1 text-center text-slate-400 text-[11px]">mm²</td>
                    <td className="py-2 px-2 text-center font-bold text-blue-900 bg-blue-50/30">
                      {(a0Uds * 100).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-purple-900 bg-purple-50/30">
                      {(a0Rem * 100).toFixed(2)}
                    </td>
                  </tr>

                  {/* Volume Sampel */}
                  <tr className="bg-slate-50/60">
                    <td className="py-2 px-2 text-left font-sans font-medium text-slate-600">Volume Sampel (V)</td>
                    <td className="py-2 px-1 text-center text-slate-400 text-[11px]">cm³</td>
                    <td className="py-2 px-2 text-center font-bold text-blue-900 bg-blue-50/30">
                      {vUds.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center font-bold text-purple-900 bg-purple-50/30">
                      {vRem.toFixed(2)}
                    </td>
                  </tr>

                  {/* Massa Basah Awal */}
                  <tr>
                    <td className="py-2 px-2 text-left font-sans font-medium text-slate-800">Massa Basah Awal (m)</td>
                    <td className="py-2 px-1 text-center text-slate-400 text-[11px]">gram</td>
                    <td className="py-1.5 px-1 bg-blue-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctWetMassUds}
                        placeholder="0.000"
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctWetMassUds',
                          label: 'Massa Basah Awal UDS [gram]',
                          value: uctWetMassUds,
                          onChange: setUctWetMassUds,
                          allowDecimal: true,
                          nextLabel: 'Massa Kering UDS ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctDryMassUds',
                            label: 'Massa Kering UDS [gram]',
                            value: uctDryMassUds,
                            onChange: setUctDryMassUds,
                            allowDecimal: true,
                            nextLabel: 'Massa Basah REM ➔',
                            onNext: () => setActiveNumpad({
                              fieldId: 'uctWetMassRem',
                              label: 'Massa Basah Awal REM [gram]',
                              value: uctWetMassRem,
                              onChange: setUctWetMassRem,
                              allowDecimal: true,
                              nextLabel: 'Massa Kering REM ➔',
                              onNext: () => setActiveNumpad({
                                fieldId: 'uctDryMassRem',
                                label: 'Massa Kering REM [gram]',
                                value: uctDryMassRem,
                                onChange: setUctDryMassRem,
                                allowDecimal: true,
                                nextLabel: 'Selesai ➔',
                                onNext: () => setActiveNumpad(null)
                              })
                            })
                          })
                        })}
                        className="w-full bg-white border border-blue-300 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 bg-purple-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctWetMassRem}
                        placeholder="0.000"
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctWetMassRem',
                          label: 'Massa Basah Awal REM [gram]',
                          value: uctWetMassRem,
                          onChange: setUctWetMassRem,
                          allowDecimal: true,
                          nextLabel: 'Massa Kering REM ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctDryMassRem',
                            label: 'Massa Kering REM [gram]',
                            value: uctDryMassRem,
                            onChange: setUctDryMassRem,
                            allowDecimal: true,
                            nextLabel: 'Selesai ➔',
                            onNext: () => setActiveNumpad(null)
                          })
                        })}
                        className="w-full bg-white border border-purple-300 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                  </tr>

                  {/* Massa Kering */}
                  <tr>
                    <td className="py-2 px-2 text-left font-sans font-medium text-slate-800">Massa Kering (md)</td>
                    <td className="py-2 px-1 text-center text-slate-400 text-[11px]">gram</td>
                    <td className="py-1.5 px-1 bg-blue-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctDryMassUds}
                        placeholder="0.000"
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctDryMassUds',
                          label: 'Massa Kering UDS [gram]',
                          value: uctDryMassUds,
                          onChange: setUctDryMassUds,
                          allowDecimal: true,
                          nextLabel: 'Massa Basah REM ➔',
                          onNext: () => setActiveNumpad({
                            fieldId: 'uctWetMassRem',
                            label: 'Massa Basah Awal REM [gram]',
                            value: uctWetMassRem,
                            onChange: setUctWetMassRem,
                            allowDecimal: true,
                            nextLabel: 'Massa Kering REM ➔',
                            onNext: () => setActiveNumpad({
                              fieldId: 'uctDryMassRem',
                              label: 'Massa Kering REM [gram]',
                              value: uctDryMassRem,
                              onChange: setUctDryMassRem,
                              allowDecimal: true,
                              nextLabel: 'Selesai ➔',
                              onNext: () => setActiveNumpad(null)
                            })
                          })
                        })}
                        className="w-full bg-white border border-blue-300 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 bg-purple-50/20">
                      <input
                        type="text"
                        readOnly
                        inputMode="none"
                        value={uctDryMassRem}
                        placeholder="0.000"
                        onClick={() => setActiveNumpad({
                          fieldId: 'uctDryMassRem',
                          label: 'Massa Kering REM [gram]',
                          value: uctDryMassRem,
                          onChange: setUctDryMassRem,
                          allowDecimal: true,
                          nextLabel: 'Selesai ➔',
                          onNext: () => setActiveNumpad(null)
                        })}
                        className="w-full bg-white border border-purple-300 rounded-lg py-1 px-1.5 text-center font-bold text-slate-900 cursor-pointer shadow-2xs focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. TABEL PEMBACAAN DIAL & FORCE GAUGE (UDS vs REM) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>3. Tabel Pembacaan Dial Deformasi &amp; Force Gauge</span>
              </h4>

              {/* Toggle Specimen Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setUctActiveSubTabSpec('uds')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    uctActiveSubTabSpec === 'uds'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Undisturbed (UDS)
                </button>
                <button
                  type="button"
                  onClick={() => setUctActiveSubTabSpec('rem')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    uctActiveSubTabSpec === 'rem'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Remolded (REM)
                </button>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="text-[11px] text-slate-500 font-medium">
                Spesimen: <strong className={uctActiveSubTabSpec === 'uds' ? 'text-blue-700' : 'text-purple-700'}>
                  {uctActiveSubTabSpec === 'uds' ? 'Undisturbed (UDS)' : 'Remolded (REM)'}
                </strong> ({uctActiveSubTabSpec === 'uds' ? uctDialForceUds.length : uctDialForceRem.length} titik dial)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddUctRow(uctActiveSubTabSpec)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10.5px] flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Titik</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTrimEmptyUctRows(uctActiveSubTabSpec)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold text-[10.5px] cursor-pointer transition active:scale-95"
                >
                  Pangkas Kosong
                </button>
                <button
                  type="button"
                  onClick={() => handleResetUctRows(uctActiveSubTabSpec)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-[10.5px] cursor-pointer transition active:scale-95"
                >
                  Reset 31
                </button>
              </div>
            </div>

            {/* Table Container - Pure Input Table (No Results Shown) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 shadow-2xs z-10">
                  <tr>
                    <th className="py-2.5 px-2 w-12 text-slate-500">No</th>
                    <th className="py-2.5 px-3 text-left">
                      Deformasi Dial <span className="text-[10px] font-normal text-slate-400 font-mono">(x0.01 mm)</span>
                    </th>
                    <th className="py-2.5 px-3 bg-amber-100/80 text-amber-950 font-black border-x border-amber-300 w-2/5">
                      Force Gauge <span className="text-[10px] font-bold text-amber-800 font-mono">(div)</span>
                    </th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {(uctActiveSubTabSpec === 'uds' ? uctRowsUds : uctRowsRem).map((row, rIdx) => {
                    const isUds = uctActiveSubTabSpec === 'uds';
                    const forceArr = isUds ? uctDialForceUds : uctDialForceRem;
                    const deformArr = isUds ? uctDialDeformUds : uctDialDeformRem;

                    return (
                      <tr
                        key={rIdx}
                        className={`transition ${rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                      >
                        <td className="py-1.5 px-2 font-bold text-slate-400">{row.step}</td>
                        <td className="py-1.5 px-3 text-left font-bold text-slate-800">
                          {row.dialDef} <span className="text-[10px] text-slate-400 font-normal">({(row.dialDef * 0.01).toFixed(2)} mm)</span>
                        </td>
                        
                        {/* Interactive Force Gauge Numpad Input */}
                        <td className="py-1 px-2 bg-amber-50/60 border-x border-amber-200">
                          <input
                            type="text"
                            readOnly
                            inputMode="none"
                            value={forceArr[rIdx] || ''}
                            placeholder="0.0"
                            onClick={() => openUctNumpad(uctActiveSubTabSpec, rIdx)}
                            className="w-full bg-white border border-amber-300 rounded-lg py-1.5 px-2 text-center font-extrabold text-amber-950 text-sm cursor-pointer shadow-2xs hover:border-amber-500 focus:ring-2 focus:ring-amber-400"
                          />
                        </td>

                        <td className="py-1 px-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveUctRow(uctActiveSubTabSpec, rIdx)}
                            className="p-1 text-slate-300 hover:text-red-600 transition cursor-pointer"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2E: TRIAXIAL UU FORM (TRX-UU - SNI 4813:2015) 🚀 */}
      {['TRX-UU', 'TRX'].includes(activeTestCode) && (
        <div className="space-y-4">
          {/* CARD 0: PILIHAN METODE PENGUJIAN TRX-UU */}
          <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <h4 className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-purple-600" />
                <span>Pilihan Metode Pengujian Triaxial UU</span>
              </h4>
              <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                SNI 4813:2015
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDirty(true);
                  setTrxUuMethod('normal');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  trxUuMethod === 'normal'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                    : 'bg-purple-50/40 text-purple-900 border-purple-200 hover:bg-purple-100/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${trxUuMethod === 'normal' ? 'bg-white' : 'bg-purple-400'}`} />
                  Pengujian Normal
                </span>
                <span className={`text-[10px] font-medium ${trxUuMethod === 'normal' ? 'text-purple-100' : 'text-purple-600'}`}>
                  (3 Benda Uji • Wajib 3 Foto)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDirty(true);
                  setTrxUuMethod('multistage');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                  trxUuMethod === 'multistage'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-md ring-2 ring-purple-300'
                    : 'bg-purple-50/40 text-purple-900 border-purple-200 hover:bg-purple-100/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${trxUuMethod === 'multistage' ? 'bg-white' : 'bg-purple-400'}`} />
                  Pengujian Multi Stage
                </span>
                <span className={`text-[10px] font-medium ${trxUuMethod === 'multistage' ? 'text-purple-100' : 'text-purple-600'}`}>
                  (1 Benda Uji • Wajib 2 Foto)
                </span>
              </button>
            </div>

            <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/80 text-[11px] text-purple-900 font-medium leading-relaxed">
              {trxUuMethod === 'normal' ? (
                <span>
                  📌 <strong>Metode Normal:</strong> Pengujian menggunakan 3 benda uji silinder terpisah dengan variasi tekanan sel σ3 (0.5, 1.0, 2.0 kg/cm²). <strong>Wajib mengambil 3 Foto Dokumentasi</strong> (1 foto per benda uji).
                </span>
              ) : (
                <span>
                  📌 <strong>Metode Multi Stage:</strong> Pengujian bertingkat menggunakan 1 benda uji silinder yang sama pada beberapa level tekanan sel. <strong>Wajib mengambil 2 Foto Dokumentasi</strong> (Foto Tahap Awal &amp; Foto Pola Keruntuhan).
                </span>
              )}
            </div>
          </div>

          {/* CARD 1: PARAMETER BENDA UJI & TEKANAN SEL (SNI 4813:2015) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>1. Parameter Benda Uji &amp; Tekanan Sel</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">SNI 4813:2015</span>
            </div>

            {/* Grid 6 Parameter Benda Uji */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              {/* Diameter D0 */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="text-[9.5px] font-bold text-slate-500 block mb-1">Diameter D₀ (cm):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={trxDia}
                  onClick={() => setActiveNumpad({
                    fieldId: 'trxDia',
                    label: 'Diameter D₀ Specimen [cm]',
                    value: trxDia,
                    onChange: v => { setIsDirty(true); setTrxDia(v); },
                    allowDecimal: true,
                    nextLabel: 'Tinggi H₀ ➔',
                    onNext: () => setActiveNumpad({
                      fieldId: 'trxHeight',
                      label: 'Tinggi H₀ Specimen [cm]',
                      value: trxHeight,
                      onChange: v => { setIsDirty(true); setTrxHeight(v); },
                      allowDecimal: true,
                      nextLabel: 'Dial Div ➔',
                      onNext: () => setActiveNumpad({
                        fieldId: 'trxDialDiv',
                        label: 'Dial Div [mm/div]',
                        value: trxDialDiv,
                        onChange: v => { setIsDirty(true); setTrxDialDiv(v); },
                        allowDecimal: true,
                        nextLabel: 'Load Rate ➔',
                        onNext: () => setActiveNumpad({
                          fieldId: 'trxLoadRate',
                          label: 'Load Rate [kg/min]',
                          value: trxLoadRate,
                          onChange: v => { setIsDirty(true); setTrxLoadRate(v); },
                          allowDecimal: true,
                          nextLabel: 'Selesai ➔',
                          onNext: () => setActiveNumpad(null)
                        })
                      })
                    })
                  })}
                  className="w-full h-8 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 text-xs shadow-2xs cursor-pointer select-none"
                />
              </div>

              {/* Tinggi H0 */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="text-[9.5px] font-bold text-slate-500 block mb-1">Tinggi H₀ (cm):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={trxHeight}
                  onClick={() => setActiveNumpad({
                    fieldId: 'trxHeight',
                    label: 'Tinggi H₀ Specimen [cm]',
                    value: trxHeight,
                    onChange: v => { setIsDirty(true); setTrxHeight(v); },
                    allowDecimal: true,
                    nextLabel: 'Dial Div ➔',
                    onNext: () => setActiveNumpad({
                      fieldId: 'trxDialDiv',
                      label: 'Dial Div [mm/div]',
                      value: trxDialDiv,
                      onChange: v => { setIsDirty(true); setTrxDialDiv(v); },
                      allowDecimal: true,
                      nextLabel: 'Load Rate ➔',
                      onNext: () => setActiveNumpad({
                        fieldId: 'trxLoadRate',
                        label: 'Load Rate [kg/min]',
                        value: trxLoadRate,
                        onChange: v => { setIsDirty(true); setTrxLoadRate(v); },
                        allowDecimal: true,
                        nextLabel: 'Selesai ➔',
                        onNext: () => setActiveNumpad(null)
                      })
                    })
                  })}
                  className="w-full h-8 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 text-xs shadow-2xs cursor-pointer select-none"
                />
              </div>

              {/* Luas A0 */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="text-[9.5px] font-bold text-slate-500 block mb-1">Luas A₀ (cm²):</label>
                <div className="w-full h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center font-extrabold text-slate-700 text-xs select-none">
                  {trxArea0.toFixed(3)}
                </div>
              </div>

              {/* Dial Div */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="text-[9.5px] font-bold text-slate-500 block mb-1">Dial Div (mm/div):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={trxDialDiv}
                  onClick={() => setActiveNumpad({
                    fieldId: 'trxDialDiv',
                    label: 'Dial Div [mm/div]',
                    value: trxDialDiv,
                    onChange: v => { setIsDirty(true); setTrxDialDiv(v); },
                    allowDecimal: true,
                    nextLabel: 'Load Rate ➔',
                    onNext: () => setActiveNumpad({
                      fieldId: 'trxLoadRate',
                      label: 'Load Rate [kg/min]',
                      value: trxLoadRate,
                      onChange: v => { setIsDirty(true); setTrxLoadRate(v); },
                      allowDecimal: true,
                      nextLabel: 'Selesai ➔',
                      onNext: () => setActiveNumpad(null)
                    })
                  })}
                  className="w-full h-8 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 text-xs shadow-2xs cursor-pointer select-none"
                />
              </div>

              {/* Load Rate */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <label className="text-[9.5px] font-bold text-slate-500 block mb-1">Load Rate (kg/min):</label>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={trxLoadRate}
                  onClick={() => setActiveNumpad({
                    fieldId: 'trxLoadRate',
                    label: 'Load Rate [kg/min]',
                    value: trxLoadRate,
                    onChange: v => { setIsDirty(true); setTrxLoadRate(v); },
                    allowDecimal: true,
                    nextLabel: 'LRC Ring ➔',
                    onNext: () => setActiveNumpad({
                      fieldId: 'trxLrc',
                      label: 'Kalibrasi Ring TRX (LRC) [kgf/div]',
                      value: trxLrc,
                      onChange: v => { setIsDirty(true); setTrxLrc(v); },
                      allowDecimal: true,
                      nextLabel: 'Selesai ➔',
                      onNext: () => setActiveNumpad(null)
                    })
                  })}
                  className="w-full h-8 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 text-xs shadow-2xs cursor-pointer select-none"
                />
              </div>

              {/* Proving Ring TRX + LRC */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                <label className="text-[9.5px] font-bold text-slate-500 block mb-1">Proving Ring TRX (LRC):</label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={trxRingNo}
                    onChange={e => {
                      setIsDirty(true);
                      const code = e.target.value;
                      setTrxRingNo(code);
                      if (!code || code === 'custom') {
                        setTrxLrc('');
                      } else {
                        const match = (trxRingCatalogue && trxRingCatalogue.length > 0 ? trxRingCatalogue : DEFAULT_TRX_RING_CATALOGUE).find(r => r.ringNo === code || r.ringNo.startsWith(code));
                        if (match) {
                          setTrxLrc(String(match.provingCalibration));
                        }
                      }
                    }}
                    className="w-full h-8 bg-purple-50 border border-purple-300 rounded-lg px-1 font-bold text-purple-950 text-[10px] cursor-pointer"
                  >
                    <option value="">-- Pilih Ring --</option>
                    {(trxRingCatalogue && trxRingCatalogue.length > 0 ? trxRingCatalogue : DEFAULT_TRX_RING_CATALOGUE).map(r => (
                      <option key={r.ringNo} value={r.ringNo}>
                        {r.ringNo}
                      </option>
                    ))}
                    <option value="custom">Kustom</option>
                  </select>
                  <input
                    type="text"
                    readOnly
                    inputMode="none"
                    value={trxLrc}
                    onClick={() => setActiveNumpad({
                      fieldId: 'trxLrc',
                      label: 'Kalibrasi Proving Ring TRX (LRC) [kgf/div]',
                      value: trxLrc,
                      onChange: v => { setIsDirty(true); setTrxLrc(v); },
                      allowDecimal: true,
                      nextLabel: 'Selesai ➔',
                      onNext: () => setActiveNumpad(null)
                    })}
                    className="w-20 h-8 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 text-xs shadow-2xs cursor-pointer select-none"
                    title="Faktor Kalibrasi Proving Ring (kgf/div)"
                  />
                </div>
              </div>
            </div>

            {/* Tekanan Sel σ3 */}
            <div className="grid grid-cols-3 gap-2 bg-purple-50/60 p-2.5 rounded-xl border border-purple-200 font-mono text-xs">
              {[
                { label: 'Specimen 1', idx: 0, defaultVal: '0.500' },
                { label: 'Specimen 2', idx: 1, defaultVal: '1.000' },
                { label: 'Specimen 3', idx: 2, defaultVal: '2.000' }
              ].map(spec => (
                <div key={spec.idx}>
                  <label className="text-[9.5px] font-bold text-purple-900 block mb-1">
                    σ3 ({spec.label}) [kg/cm²]:
                  </label>
                  <input
                    type="text"
                    readOnly
                    inputMode="none"
                    value={trxCellPressures[spec.idx] || ''}
                    onClick={() => setActiveNumpad({
                      fieldId: `trxCell_${spec.idx}`,
                      label: `Tekanan Sel σ3 (${spec.label}) [kg/cm²]`,
                      value: trxCellPressures[spec.idx] || spec.defaultVal,
                      onChange: v => {
                        setIsDirty(true);
                        setTrxCellPressures(p => { const n = [...p]; n[spec.idx] = v; return n; });
                      },
                      allowDecimal: true,
                      nextLabel: spec.idx < 2 ? `Tekanan Sel Specimen ${spec.idx + 2} ➔` : 'Selesai ➔',
                      onNext: spec.idx < 2 ? () => setActiveNumpad({
                        fieldId: `trxCell_${spec.idx + 1}`,
                        label: `Tekanan Sel σ3 (Specimen ${spec.idx + 2}) [kg/cm²]`,
                        value: trxCellPressures[spec.idx + 1] || (spec.idx === 0 ? '1.000' : '2.000'),
                        onChange: v => {
                          setIsDirty(true);
                          setTrxCellPressures(p => { const n = [...p]; n[spec.idx + 1] = v; return n; });
                        },
                        allowDecimal: true,
                        nextLabel: 'Selesai ➔',
                        onNext: () => setActiveNumpad(null)
                      }) : () => setActiveNumpad(null)
                    })}
                    className="w-full h-8 bg-white border border-purple-300 rounded-lg text-center font-extrabold text-purple-900 text-xs shadow-2xs cursor-pointer select-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: TABEL PEMBACAAN DIAL DEFORMASI & BEBAN AKSIAL (MATCHING SCREENSHOT) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>2. Pembacaan Dial Deformasi &amp; Beban Aksial</span>
              </h4>

              {/* Toggle Specimen Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setTrxActiveSpecimenTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shrink-0 ${
                    trxActiveSpecimenTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Spesimen
                </button>
                <button
                  type="button"
                  onClick={() => setTrxActiveSpecimenTab('spec1')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shrink-0 ${
                    trxActiveSpecimenTab === 'spec1'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  Spec 1 ({trxCellPressures[0] || '0.500'} kg)
                </button>
                <button
                  type="button"
                  onClick={() => setTrxActiveSpecimenTab('spec2')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shrink-0 ${
                    trxActiveSpecimenTab === 'spec2'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  Spec 2 ({trxCellPressures[1] || '1.000'} kg)
                </button>
                <button
                  type="button"
                  onClick={() => setTrxActiveSpecimenTab('spec3')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer shrink-0 ${
                    trxActiveSpecimenTab === 'spec3'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-emerald-900 hover:bg-emerald-50'
                  }`}
                >
                  Spec 3 ({trxCellPressures[2] || '2.000'} kg)
                </button>
              </div>
            </div>

            {/* Action Bar: Tambah Baris, Pangkas Kosong, Reset 20 Titik */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddTrxRow}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold border border-purple-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Titik Dial</span>
                </button>
                <button
                  type="button"
                  onClick={handleTrimEmptyTrxRows}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer"
                  title="Pangkas baris kosong di bagian akhir tabel"
                >
                  Pangkas Kosong
                </button>
                <button
                  type="button"
                  onClick={handleResetTrxRows}
                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition active:scale-95 cursor-pointer"
                  title="Kembalikan ke 20 titik kosong"
                >
                  Reset 20 Titik
                </button>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Total: {Math.max(trxLoadReadingsA.length, trxLoadReadingsB.length, trxLoadReadingsC.length)} Titik
              </span>
            </div>

            {/* Dial Readings Table (Pure Raw Data Entry — Blind Testing ISO 17025) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center">
                    <th className="py-2 px-1 border-r border-slate-200 w-8">No</th>
                    {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec1') && (
                      <th colSpan={2} className="py-2 px-2 border-r border-slate-200 bg-purple-50 text-purple-900">
                        Specimen 1 (σ3={trxCellPressures[0] || '0.500'} kg/cm²)
                      </th>
                    )}
                    {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec2') && (
                      <th colSpan={2} className="py-2 px-2 border-r border-slate-200 bg-blue-50 text-blue-900">
                        Specimen 2 (σ3={trxCellPressures[1] || '1.000'} kg/cm²)
                      </th>
                    )}
                    {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec3') && (
                      <th colSpan={2} className="py-2 px-2 border-r border-slate-200 bg-emerald-50 text-emerald-900">
                        Specimen 3 (σ3={trxCellPressures[2] || '2.000'} kg/cm²)
                      </th>
                    )}
                  </tr>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-center text-[10px]">
                    <th className="py-1 px-1 border-r border-slate-200">#</th>
                    {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec1') && (
                      <>
                        <th className="py-1 px-1 border-r border-slate-200 bg-purple-50/50 w-16">Dial Def.</th>
                        <th className="py-1 px-1 border-r border-slate-200 bg-purple-50/50">Dial Beban</th>
                      </>
                    )}
                    {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec2') && (
                      <>
                        <th className="py-1 px-1 border-r border-slate-200 bg-blue-50/50 w-16">Dial Def.</th>
                        <th className="py-1 px-1 border-r border-slate-200 bg-blue-50/50">Dial Beban</th>
                      </>
                    )}
                    {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec3') && (
                      <>
                        <th className="py-1 px-1 border-r border-slate-200 bg-emerald-50/50 w-16">Dial Def.</th>
                        <th className="py-1 px-1 border-r border-slate-200 bg-emerald-50/50">Dial Beban</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(() => {
                    const rowCount = Math.max(trxLoadReadingsA.length, trxLoadReadingsB.length, trxLoadReadingsC.length, 1);
                    return Array.from({ length: rowCount }, (_, rIdx) => {
                      const defoVal = rIdx * 20;
                      return (
                        <tr key={rIdx} className="h-9 hover:bg-purple-50/20 group">
                          {/* Row Number + Delete Action */}
                          <td className="py-0.5 px-1 text-center font-bold text-slate-400 border-r border-slate-200 text-[10px] relative">
                            <span className="group-hover:hidden">{rIdx + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTrxRow(rIdx)}
                              title={`Hapus titik ${rIdx + 1}`}
                              className="hidden group-hover:inline-flex items-center justify-center w-4 h-4 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>

                          {/* Specimen 1 */}
                          {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec1') && (
                            <>
                              <td className="py-0.5 px-1 border-r border-slate-200 bg-purple-50/20 text-center">
                                <span className="font-bold text-slate-700 text-xs">{defoVal}</span>
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200 bg-purple-50/20">
                                <input
                                  type="text"
                                  readOnly
                                  inputMode="none"
                                  placeholder="0.0"
                                  value={trxLoadReadingsA[rIdx] || ''}
                                  onClick={() => openTrxUuNumpad('A', rIdx)}
                                  className="w-full h-7 bg-white border border-purple-200 rounded px-1 text-center font-bold text-purple-950 text-xs focus:ring-2 focus:ring-purple-500 shadow-2xs cursor-pointer select-none"
                                />
                              </td>
                            </>
                          )}

                          {/* Specimen 2 */}
                          {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec2') && (
                            <>
                              <td className="py-0.5 px-1 border-r border-slate-200 bg-blue-50/20 text-center">
                                <span className="font-bold text-slate-700 text-xs">{defoVal}</span>
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200 bg-blue-50/20">
                                <input
                                  type="text"
                                  readOnly
                                  inputMode="none"
                                  placeholder="0.0"
                                  value={trxLoadReadingsB[rIdx] || ''}
                                  onClick={() => openTrxUuNumpad('B', rIdx)}
                                  className="w-full h-7 bg-white border border-blue-200 rounded px-1 text-center font-bold text-blue-950 text-xs focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer select-none"
                                />
                              </td>
                            </>
                          )}

                          {/* Specimen 3 */}
                          {(trxActiveSpecimenTab === 'all' || trxActiveSpecimenTab === 'spec3') && (
                            <>
                              <td className="py-0.5 px-1 border-r border-slate-200 bg-emerald-50/20 text-center">
                                <span className="font-bold text-slate-700 text-xs">{defoVal}</span>
                              </td>
                              <td className="py-0.5 px-1 border-r border-slate-200 bg-emerald-50/20">
                                <input
                                  type="text"
                                  readOnly
                                  inputMode="none"
                                  placeholder="0.0"
                                  value={trxLoadReadingsC[rIdx] || ''}
                                  onClick={() => openTrxUuNumpad('C', rIdx)}
                                  className="w-full h-7 bg-white border border-emerald-200 rounded px-1 text-center font-bold text-emerald-950 text-xs focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer select-none"
                                />
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 3: FOTO DOKUMENTASI UJI TRIAXIAL UU (MANDATORY PHOTO GUIDES) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-600" />
                <span>3. Dokumentasi Foto Uji Triaxial UU</span>
              </h4>
              <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {trxUuMethod === 'normal' ? 'Wajib 3 Foto' : 'Wajib 2 Foto'}
              </span>
            </div>

            {/* Guided Photo Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {trxUuMethod === 'normal' ? (
                <>
                  <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-900 font-extrabold text-xs cursor-pointer active:scale-95 transition shadow-2xs">
                    <Camera className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Foto Specimen 1 (0.5 kg)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoCapture(e, 'during')}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-900 font-extrabold text-xs cursor-pointer active:scale-95 transition shadow-2xs">
                    <Camera className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Foto Specimen 2 (1.0 kg)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoCapture(e, 'during')}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-900 font-extrabold text-xs cursor-pointer active:scale-95 transition shadow-2xs">
                    <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Foto Specimen 3 (2.0 kg)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoCapture(e, 'during')}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-900 font-extrabold text-xs cursor-pointer active:scale-95 transition shadow-2xs col-span-1 sm:col-span-1">
                    <Camera className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Foto Benda Uji (Tahap Awal)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoCapture(e, 'before')}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-rose-900 font-extrabold text-xs cursor-pointer active:scale-95 transition shadow-2xs col-span-1 sm:col-span-2">
                    <Camera className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Foto Pola Keruntuhan Multi Stage</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => handlePhotoCapture(e, 'failure')}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2G: CONSOLIDATION OEDOMETER FORM (CT) 🚀 */}
      {['CT', 'CNS'].includes(activeTestCode) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Form Uji Konsolidasi (Oedometer CT)</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">SNI 2812:2011</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Indeks Pemampatan (Cc):</label>
              <input
                type="number"
                step="0.001"
                value={consolCc}
                onChange={e => setConsolCc(e.target.value)}
                placeholder="0.250"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Indeks Pengembangan (Cs):</label>
              <input
                type="number"
                step="0.001"
                value={consolCs}
                onChange={e => setConsolCs(e.target.value)}
                placeholder="0.035"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Tegangan Pra-Konsolidasi (Pc'):</label>
              <input
                type="number"
                step="0.01"
                value={consolPc}
                onChange={e => setConsolPc(e.target.value)}
                placeholder="1.20"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ????????? SECTION 2F: CBR & COMPACTION FORM (CBR-SOK / CBR-UNS / CMP) ????????? */}
      {['CBR-SOK', 'CBR-UNS', 'CMP-STD', 'CMP-MOD'].includes(activeTestCode) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-orange-600" />
              <span>Form Uji CBR &amp; Pemadatan Lab</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">SNI 1744:2012</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Kode Mold:</label>
              <input
                type="text"
                value={cbrMoldNo}
                onChange={e => setCbrMoldNo(e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Pengembangan Swelling (%):</label>
              <input
                type="number"
                step="0.01"
                value={cbrSwelling}
                onChange={e => setCbrSwelling(e.target.value)}
                placeholder="0.10"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nilai CBR Hasil (%):</label>
              <input
                type="number"
                step="0.1"
                value={cbrPctVal}
                onChange={e => setCbrPctVal(e.target.value)}
                placeholder="mis. 8.5"
                className="w-full bg-orange-50 border border-orange-300 rounded-xl px-2 py-1.5 text-xs font-extrabold text-orange-950 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🚀 SECTION 2G: PERMEABILITY FORM (PB) 🚀 */}
      {['PB', 'PRM', 'PERM'].includes(activeTestCode) && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-teal-600" />
              <span>Form Uji Permeabilitas Tanah (PB)</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">SNI 2435:2008</span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Koefisien Permeabilitas $k$ (cm/s):</label>
            <input
              type="text"
              value={prmKVal}
              onChange={e => setPrmKVal(e.target.value)}
              placeholder="mis. 1.25e-5"
              className="w-full bg-teal-50 border border-teal-300 rounded-xl px-3 py-2 text-sm font-black text-teal-950 font-mono"
            />
          </div>
        </div>
      )}

      {/* ????????? SECTION 3: FOTO DOKUMENTASI PENGUJIAN (CAMERA CAPTURE) ????????? */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>3. Foto Dokumentasi Pengujian ({photos.length} / Wajib Min. {minRequiredPhotos} Foto)</span>
            </h4>
            <p className="text-[10px] text-slate-400">Ambil foto kondisi tanah, mesin, atau pola keruntuhan</p>
          </div>

          <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold border border-blue-200">
            Min. {minRequiredPhotos} Foto (ISO 17025)
          </span>
        </div>

        {/* HIDDEN FILE INPUTS */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => handlePhotoCapture(e, 'during')}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={e => handlePhotoCapture(e, 'during')}
          className="hidden"
        />

        {/* PHOTO CAPTURE ACTION BUTTONS */}
        {activeTestCode === 'UCT' && (
          <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-2.5 space-y-2">
            <div className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Wajib 2 Foto Dokumentasi UCT (ISO 17025):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`py-2 px-2.5 rounded-lg border font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  photos.some(p => p.caption?.toLowerCase().includes('undist'))
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-blue-600 text-white border-blue-700 shadow-xs'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Undisturbed {photos.some(p => p.caption?.toLowerCase().includes('undist')) ? '✓' : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`py-2 px-2.5 rounded-lg border font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer ${
                  photos.some(p => p.caption?.toLowerCase().includes('remold'))
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-purple-600 text-white border-purple-700 shadow-xs'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Remolded {photos.some(p => p.caption?.toLowerCase().includes('remold')) ? '✓' : ''}</span>
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>Kamera HP</span>
          </button>

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-200 transition active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>Pilih Galeri</span>
          </button>
        </div>

        {/* PHOTO THUMBNAILS GRID */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {photos.map((p, idx) => (
              <div
                key={p.id || idx}
                className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group shadow-2xs"
              >
                <img
                  src={p.url}
                  alt={p.caption || `Foto Uji ${idx + 1}`}
                  onClick={() => setPreviewPhotoUrl(p.url)}
                  className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition"
                />

                <button
                  onClick={() => handleDeletePhoto(p.id)}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full shadow hover:bg-red-700 cursor-pointer"
                  title="Hapus Foto"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

                <div className="p-2 bg-white space-y-1">
                  <select
                    value={p.caption || (activeTestCode === 'UCT' ? (idx === 0 ? 'Foto Uji Undisturbed' : 'Foto Uji Remolded') : 'Dokumentasi Specimen 1')}
                    onChange={e => handleUpdatePhotoCaption(p.id, e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[9.5px] font-bold text-slate-800 p-1 cursor-pointer"
                  >
                    <option value="Foto Uji Undisturbed">Foto Uji Undisturbed</option>
                    <option value="Foto Uji Remolded">Foto Uji Remolded</option>
                    <option value="Dokumentasi Specimen 1">Dokumentasi Specimen 1</option>
                    <option value="Dokumentasi Specimen 2">Dokumentasi Specimen 2</option>
                    <option value="Dokumentasi Specimen 3">Dokumentasi Specimen 3</option>
                    <option value="Kondisi Awal Benda Uji">Kondisi Awal Benda Uji</option>
                    <option value="Benda Uji Terpasang di Mesin">Benda Uji di Mesin</option>
                    <option value="Pola Keruntuhan Geser">Pola Keruntuhan Geser</option>
                    <option value="Kondisi Pasca Oven">Kondisi Pasca Oven</option>
                    <option value="Dokumentasi Saat Pengujian">Dokumentasi Uji</option>
                  </select>
                  <div className="text-[8.5px] text-slate-400 font-mono">
                    {new Date(p.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-4 space-y-1">
            <Camera className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-[10.5px] text-slate-400 font-medium">Belum ada foto dokumentasi. Tap tombol di atas untuk memotret.</p>
          </div>
        )}
      </div>

      {/* ─── BOTTOM ACTION BAR ─── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl z-20 flex flex-col gap-2 max-w-lg mx-auto">
        {!isFormFullyCompleted && (
          <div className="text-[10px] text-center font-mono font-bold text-amber-800 bg-amber-50/90 py-1.5 px-2.5 rounded-lg border border-amber-200 animate-fade-in">
            *Lengkapi Tanggal, Data Pengujian, &amp; Minimal {minRequiredPhotos} Foto untuk membuka slide "Selesai Uji"
          </div>
        )}

        {isFormFullyCompleted ? (
          <div className="flex flex-col gap-2 w-full animate-fade-in">
            {/* 🌟 SLIDE TO COMPLETE (GESER UNTUK SELESAI UJI) 🌟 */}
            <SlideToConfirm
              onConfirm={() => handleSaveData(true)}
              label="Geser untuk Selesai Uji"
              completedLabel="Menyimpan Hasil Pengujian..."
            />

            {/* Opsi Simpan Draft (Secondary Action) */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => handleSaveData(false)}
                className="py-1 px-2.5 rounded-lg text-slate-600 hover:text-slate-900 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer hover:bg-slate-100"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan sebagai Draft Saja</span>
              </button>
              <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Form Lengkap</span>
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleSaveData(false)}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Draft</span>
          </button>
        )}
      </div>

      {/* ????????? PROFESSIONAL SAVE SUCCESS OVERLAY MODAL ????????? */}
      {saveSuccessMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center justify-center max-w-xs w-full text-center space-y-3.5 animate-scale-up">
            {/* Animated Success Icon Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500 flex items-center justify-center shadow-lg relative">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {saveSuccessMsg}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Data &amp; foto pengujian telah tersimpan ke server.
              </p>
            </div>

            {/* Loading / Progress indicator bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO ZOOM PREVIEW MODAL */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={previewPhotoUrl}
              alt="Preview Zoom"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-2 right-2 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 backdrop-blur-xs text-xs font-bold"
            >
              ???
            </button>
          </div>
        </div>
      )}

      {/* 🚀 CUSTOM PROFESSIONAL NUMERIC KEYPAD (MODERN MINIMALIST SLATE DESIGN) 🚀 */}
      {activeNumpad && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
          {/* Backdrop Overlay (Clicking anywhere outside closes the keyboard, 100% clear background without blur) */}
          <div
            onClick={() => setActiveNumpad(null)}
            className="fixed inset-0 bg-transparent cursor-pointer"
          />

          {/* Keypad Container (Light Minimalist Slate Sheet) */}
          <div className="relative z-10 bg-slate-50 text-slate-900 rounded-t-[32px] border-t border-slate-200 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] p-4 space-y-3 max-w-lg mx-auto w-full animate-slide-up">
            {/* Drawer Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

            {/* Top Bar: Field Label & Clear */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0"></span>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate max-w-[240px]">
                  {activeNumpad.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNumpadPress('TOGGLE_MINUS')}
                  className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition active:scale-95 border cursor-pointer ${
                    activeNumpad.value.startsWith('-')
                      ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                  title="Tambah / Hapus Tanda Minus (-)"
                >
                  ± Minus (-)
                </button>
                {activeNumpad.value && (
                  <button
                    type="button"
                    onClick={() => handleNumpadPress('CLEAR')}
                    className="px-2.5 py-1 text-[10px] font-extrabold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition active:scale-95 border border-slate-300/60"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveNumpad(null)}
                  className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Value Display Box */}
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-1 font-mono text-2xl font-black text-slate-900 tracking-wider overflow-x-auto min-h-[36px]">
                <span>{activeNumpad.value}</span>
                <span className="w-0.5 h-6 bg-blue-600 animate-pulse rounded-full shrink-0"></span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {activeNumpad.allowDecimal === false ? 'Nomor Bulat' : 'Desimal Max 1 Titik'}
              </span>
            </div>

            {/* Keyboard shortcut helper for PC / Laptop */}
            <div className="text-[10px] text-slate-600 bg-blue-50/80 border border-blue-200/60 rounded-xl px-3 py-1.5 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1 text-blue-700 font-bold shrink-0">
                ⌨️ Keyboard PC:
              </span>
              <span className="text-[9.5px] text-slate-600 truncate ml-2">
                Ketik <b>0-9</b>, <b>.</b> • <b>Enter / Tab</b> (Lanjut) • <b>Esc</b> (Tutup)
              </span>
            </div>

            {/* Keypad Grid (3 Columns) */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadPress(num)}
                  className="py-3.5 bg-white hover:bg-slate-100/80 active:bg-blue-600 active:text-white border border-slate-200/90 rounded-2xl text-2xl font-extrabold text-slate-800 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  {num}
                </button>
              ))}

              {/* Row 4: [ . ] [ 0 ] [ Backspace ] */}
              <button
                type="button"
                onClick={() => handleNumpadPress('.')}
                disabled={activeNumpad.allowDecimal === false || activeNumpad.value.includes('.')}
                className={`py-3.5 rounded-2xl text-2xl font-extrabold shadow-2xs transition active:scale-95 cursor-pointer border ${
                  activeNumpad.allowDecimal === false || activeNumpad.value.includes('.')
                    ? 'bg-slate-100 text-slate-300 border-slate-200/50 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-100/80 active:bg-blue-600 text-slate-800 border-slate-200/90'
                }`}
              >
                .
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                className="py-3.5 bg-white hover:bg-slate-100/80 active:bg-blue-600 active:text-white border border-slate-200/90 rounded-2xl text-2xl font-extrabold text-slate-800 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={() => handleNumpadPress('BACKSPACE')}
                className="py-3.5 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-700 rounded-2xl flex items-center justify-center shadow-2xs transition active:scale-95 cursor-pointer border border-amber-200"
                title="Hapus 1 Digit"
              >
                <Delete className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Action Bar: [ Tutup ] [ OK ] [ Selanjutnya ➔ ] */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveNumpad(null)}
                className="py-3 px-3.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-2xl font-bold text-xs transition cursor-pointer active:scale-95 border border-slate-300/60 shrink-0"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => setActiveNumpad(null)}
                className="py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>OK</span>
              </button>

              {activeNumpad.onNext && (
                <button
                  type="button"
                  onClick={() => activeNumpad.onNext?.()}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <span>{activeNumpad.nextLabel || 'Selanjutnya'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📦 ALPHABET CONTAINER PICKER MODAL (FOR DS & MOISTURE CONTENT CAWAN) 📦 */}
      {activeContainerPicker && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end select-none">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setActiveContainerPicker(null)}
            className="fixed inset-0 bg-transparent cursor-pointer"
          />

          {/* Container Picker Drawer */}
          <div className="relative z-10 bg-slate-50 text-slate-900 rounded-t-[32px] border-t border-slate-200 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] p-4 space-y-3 max-w-lg mx-auto w-full animate-slide-up">
            {/* Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse shrink-0"></span>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate max-w-[240px]">
                  {activeContainerPicker.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveContainerPicker(null)}
                className="p-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Selection Grid for Alphabet Containers A-Z */}
            {(() => {
              const isDs = activeContainerPicker.isDsTest || ['DS-UU', 'DS', 'DSH-UU', 'DS-CU', 'DS-CD'].includes(activeTestCode);
              const allList = (containerCatalogue && containerCatalogue.length > 0 ? containerCatalogue : [
                { id: 'A', weight: 9.633 },
                { id: 'B', weight: 9.693 },
                { id: 'C', weight: 9.800 },
                { id: 'D', weight: 9.757 },
                { id: 'E', weight: 9.668 },
                { id: 'F', weight: 9.575 },
                { id: 'G', weight: 9.748 },
                { id: 'H', weight: 9.431 },
                { id: 'I', weight: 9.446 },
                { id: 'J', weight: 9.578 },
                { id: 'K', weight: 9.558 },
                { id: 'L', weight: 9.704 },
              ]);

              const displayContainers = allList.filter(c => {
                const idStr = String(c.id || '').trim().toUpperCase();
                if (isDs) {
                  return isNaN(Number(idStr)) || /^[A-Z]$/.test(idStr);
                } else {
                  return !isNaN(Number(idStr));
                }
              });

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider">
                      {isDs ? 'Pilih Cawan DS (Huruf Alfabeta):' : 'Pilih Cawan Kadar Air:'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {displayContainers.length} Cawan Tersedia
                    </span>
                  </div>

                  {/* Grid of Cawan */}
                  <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xs scrollbar-thin">
                    {displayContainers.map((cItem, cIdx) => {
                      const isSelected = activeContainerPicker.value.toUpperCase() === String(cItem.id).toUpperCase();
                      const wtGrams = cItem.weight ?? (cItem as any).weightGrams ?? 0;
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => {
                            activeContainerPicker.onSelect(String(cItem.id));
                            if (activeContainerPicker.onNext) {
                              activeContainerPicker.onNext();
                            } else {
                              setActiveContainerPicker(null);
                            }
                          }}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center transition active:scale-95 cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400'
                              : 'bg-slate-50 hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <span className="text-sm font-black font-mono">{cItem.id}</span>
                          <span className={`text-[9px] font-mono font-semibold ${isSelected ? 'text-purple-100' : 'text-slate-500'}`}>
                            {wtGrams > 0 ? wtGrams.toFixed(3) : '—'} g
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Custom Input fallback for manual codes */}
            <div className="pt-1">
              <label className="text-[10px] font-bold text-slate-600 block mb-1">Atau Ketik Kode Cawan Manual:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeContainerPicker.value}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    activeContainerPicker.onSelect(val);
                    setActiveContainerPicker(prev => prev ? { ...prev, value: val } : null);
                  }}
                  placeholder="Contoh: A, B, C"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (activeContainerPicker.onNext) {
                      activeContainerPicker.onNext();
                    } else {
                      setActiveContainerPicker(null);
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  OK ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛑 CONFIRMATION MODAL: UNSAVED CHANGES GUARD 🛑 */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs select-none p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col items-center max-w-sm w-full text-center space-y-4 animate-scale-up">
            {/* Warning Icon Badge */}
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-400 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Simpan Perubahan Data?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
                Ada isian data pengujian yang baru diubah. Apakah Anda ingin menyimpan perubahan ini sebagai <strong className="text-slate-800">Draft</strong> sebelum keluar?
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full pt-1">
              {/* Option 1: Save & Continue */}
              <button
                type="button"
                onClick={() => {
                  handleSaveData(false);
                  setIsDirty(false);
                  setShowExitConfirmModal(false);
                  if (pendingNavigation) {
                    pendingNavigation();
                    setPendingNavigation(null);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan &amp; Lanjut</span>
              </button>

              {/* Option 2: Discard & Continue */}
              <button
                type="button"
                onClick={() => {
                  setIsDirty(false);
                  setShowExitConfirmModal(false);
                  if (pendingNavigation) {
                    pendingNavigation();
                    setPendingNavigation(null);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Abaikan / Buang Perubahan</span>
              </button>

              {/* Option 3: Cancel & Stay */}
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmModal(false);
                  setPendingNavigation(null);
                }}
                className="w-full py-2 px-3 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs transition active:scale-95 cursor-pointer"
              >
                Batal (Tetap di Formulir Ini)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
