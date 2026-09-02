import React, { useState, useEffect } from 'react';
import { 
  SampleTest, 
  Sample, 
  PurchaseOrder, 
  CalculationStatus, 
  ContainerItem, 
  RingItem, 
  PycnometerItem,
  MoldItem,
  ReamerItem
} from '../types';
import {
  Calculator,
  X,
  Save,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Layers,
  Thermometer,
  Box,
  CircleDot,
  Pipette,
  Printer,
  RotateCcw
} from 'lucide-react';

interface PhysicalPropertiesModalProps {
  sample: Sample;
  po: PurchaseOrder;
  containerCatalogue: ContainerItem[];
  ringCatalogue: RingItem[];
  pycCatalogue: PycnometerItem[];
  moldCatalogue?: MoldItem[];
  reamerCatalogue?: ReamerItem[];
  onClose: () => void;
  onSaveCalculation: (updatedSample: Sample) => void;
}

const WATER_DENSITY_TABLE: { [temp: number]: { density: number; kFactor: number } } = {
  18: { density: 0.9986244, kFactor: 1.0004 },
  19: { density: 0.9984347, kFactor: 1.0002 },
  20: { density: 0.9982343, kFactor: 1.0000 },
  21: { density: 0.9980233, kFactor: 0.9998 },
  22: { density: 0.9978019, kFactor: 0.9996 },
  23: { density: 0.9975702, kFactor: 0.9993 },
  24: { density: 0.9973286, kFactor: 0.9991 },
  25: { density: 0.9970770, kFactor: 0.9989 },
  26: { density: 0.9968156, kFactor: 0.9986 },
  27: { density: 0.9965451, kFactor: 0.9983 },
  28: { density: 0.9962652, kFactor: 0.9980 },
  29: { density: 0.9959761, kFactor: 0.9977 },
  30: { density: 0.9956780, kFactor: 0.9974 }
};

export const PhysicalPropertiesModal: React.FC<PhysicalPropertiesModalProps> = ({
  sample,
  po,
  containerCatalogue,
  ringCatalogue,
  pycCatalogue,
  moldCatalogue = [],
  reamerCatalogue = [],
  onClose,
  onSaveCalculation
}) => {
  // Try restoring saved calculation data if available
  const existingCalcData = sample.tests.find(t => t.testTypeCode === 'SG' || t.testTypeCode === 'MC' || t.testTypeCode === 'UW')?.calculationData;
  const savedInputs = existingCalcData?.inputValues || {};

  // 1. SPECIFIC GRAVITY STATE (2 Trials)
  const [pycNo1, setPycNo1] = useState<string>(savedInputs.pycNo1 || '1');
  const [pycNo2, setPycNo2] = useState<string>(savedInputs.pycNo2 || '2');

  const [sgA1, setSgA1] = useState<string>(savedInputs.sgA1 !== undefined ? String(savedInputs.sgA1) : '10.454');
  const [sgA2, setSgA2] = useState<string>(savedInputs.sgA2 !== undefined ? String(savedInputs.sgA2) : '10.299');

  const [sgT1, setSgT1] = useState<number>(savedInputs.sgT1 !== undefined ? Number(savedInputs.sgT1) : 23);
  const [sgT2, setSgT2] = useState<number>(savedInputs.sgT2 !== undefined ? Number(savedInputs.sgT2) : 23);

  const [sgB1, setSgB1] = useState<string>(savedInputs.sgB1 !== undefined ? String(savedInputs.sgB1) : '158.708');
  const [sgB2, setSgB2] = useState<string>(savedInputs.sgB2 !== undefined ? String(savedInputs.sgB2) : '159.346');

  // 2. MOISTURE CONTENT STATE (2 Trials)
  const [mcContainer1, setMcContainer1] = useState<string>(savedInputs.mcContainer1 || '66');
  const [mcContainer2, setMcContainer2] = useState<string>(savedInputs.mcContainer2 || '142');

  const [mcWet1, setMcWet1] = useState<string>(savedInputs.mcWet1 !== undefined ? String(savedInputs.mcWet1) : '115.633');
  const [mcWet2, setMcWet2] = useState<string>(savedInputs.mcWet2 !== undefined ? String(savedInputs.mcWet2) : '123.201');

  const [mcDry1, setMcDry1] = useState<string>(savedInputs.mcDry1 !== undefined ? String(savedInputs.mcDry1) : '78.058');
  const [mcDry2, setMcDry2] = useState<string>(savedInputs.mcDry2 !== undefined ? String(savedInputs.mcDry2) : '83.187');

  // 3. DENSITY / UNIT WEIGHT STATE
  const [ringNo, setRingNo] = useState<string>(savedInputs.ringNo || '1');
  const [ringWetWeight, setRingWetWeight] = useState<string>(savedInputs.ringWetWeight !== undefined ? String(savedInputs.ringWetWeight) : '94.803');

  // Status & Notes
  const [calcStatus, setCalcStatus] = useState<CalculationStatus>(savedInputs.status || 'Calculated');

  // --- CALCULATION LOGIC ---
  // Specific Gravity
  const pycObj1 = pycCatalogue.find(p => p.pycNo === pycNo1) || pycCatalogue[0] || { weightWater25: 152.1022, weightTare: 52.9908 };
  const pycObj2 = pycCatalogue.find(p => p.pycNo === pycNo2) || pycCatalogue[1] || pycObj1;

  const tempObj1 = WATER_DENSITY_TABLE[sgT1] || WATER_DENSITY_TABLE[23];
  const tempObj2 = WATER_DENSITY_TABLE[sgT2] || WATER_DENSITY_TABLE[23];

  const numA1 = parseFloat(sgA1) || 0;
  const numA2 = parseFloat(sgA2) || 0;
  const numB1 = parseFloat(sgB1) || 0;
  const numB2 = parseFloat(sgB2) || 0;

  // C = ((rho_w(T) / 0.997077) * (W_pyc_water25 - W_pyc)) + W_pyc
  const sgC1 = ((tempObj1.density / 0.997077) * (pycObj1.weightWater25 - pycObj1.weightTare)) + pycObj1.weightTare;
  const sgC2 = ((tempObj2.density / 0.997077) * (pycObj2.weightWater25 - pycObj2.weightTare)) + pycObj2.weightTare;

  // A + (C - B)
  const sgDenom1 = numA1 + (sgC1 - numB1);
  const sgDenom2 = numA2 + (sgC2 - numB2);

  // Gs trial
  const gs1 = sgDenom1 > 0 ? (numA1 / sgDenom1) * tempObj1.kFactor : 0;
  const gs2 = sgDenom2 > 0 ? (numA2 / sgDenom2) * tempObj2.kFactor : 0;

  const gsAvg = (gs1 > 0 && gs2 > 0) ? (gs1 + gs2) / 2 : (gs1 || gs2 || 0);

  // Moisture Content
  const containerObj1 = containerCatalogue.find(c => c.id === mcContainer1) || { weight: 8.923 };
  const containerObj2 = containerCatalogue.find(c => c.id === mcContainer2) || { weight: 8.895 };

  const numWet1 = parseFloat(mcWet1) || 0;
  const numWet2 = parseFloat(mcWet2) || 0;
  const numDry1 = parseFloat(mcDry1) || 0;
  const numDry2 = parseFloat(mcDry2) || 0;

  const water1 = numWet1 > 0 && numDry1 > 0 ? numWet1 - numDry1 : 0;
  const water2 = numWet2 > 0 && numDry2 > 0 ? numWet2 - numDry2 : 0;

  const drySoil1 = numDry1 > 0 ? numDry1 - containerObj1.weight : 0;
  const drySoil2 = numDry2 > 0 ? numDry2 - containerObj2.weight : 0;

  const mc1 = drySoil1 > 0 ? (water1 / drySoil1) * 100 : 0;
  const mc2 = drySoil2 > 0 ? (water2 / drySoil2) * 100 : 0;

  const mcAvg = (mc1 > 0 && mc2 > 0) ? (mc1 + mc2) / 2 : (mc1 || mc2 || 0);

  // Density / Unit Weight
  const ringObj = ringCatalogue.find(r => r.ringNo === ringNo) || ringCatalogue[0] || null;
  const numRingWet = parseFloat(ringWetWeight) || 0;

  const bulkDensity = (numRingWet > 0 && ringObj && ringObj.volumeCm3 > 0) ? (numRingWet - ringObj.weightGrams) / ringObj.volumeCm3 : 0;

  // Summary Derived Parameters
  const dryDensity = mcAvg > 0 ? bulkDensity / (1 + (mcAvg / 100)) : 0;
  const voidRatio = (gsAvg > 0 && dryDensity > 0) ? ((gsAvg * 1.0) / dryDensity) - 1 : 0;
  const porosity = voidRatio > 0 ? voidRatio / (1 + voidRatio) : 0;
  const degreeOfSaturation = (voidRatio > 0 && mcAvg > 0 && gsAvg > 0) ? Math.min(100, (mcAvg * gsAvg) / voidRatio) : 0;

  // Pre-fill seed from Excel Sheet PP (BH-05_UDS-01)
  const handleLoadExcelSeedData = () => {
    setPycNo1('1'); setPycNo2('2');
    setSgA1('10.454'); setSgA2('10.299');
    setSgT1(23); setSgT2(23);
    setSgB1('158.708'); setSgB2('159.346');

    setMcContainer1('66'); setMcContainer2('142');
    setMcWet1('115.633'); setMcWet2('123.201');
    setMcDry1('78.058'); setMcDry2('83.187');

    setRingNo('1'); setRingWetWeight('94.803');
    setCalcStatus('Verified');
  };

  const handleResetData = () => {
    setSgA1(''); setSgA2(''); setSgB1(''); setSgB2('');
    setMcWet1(''); setMcWet2(''); setMcDry1(''); setMcDry2('');
    setRingWetWeight('');
    setCalcStatus('Draft Data');
  };

  const handleSave = () => {
    const summaryData = {
      gsAvg: parseFloat(gsAvg.toFixed(3)),
      mcAvg: parseFloat(mcAvg.toFixed(3)),
      bulkDensity: parseFloat(bulkDensity.toFixed(3)),
      dryDensity: parseFloat(dryDensity.toFixed(3)),
      voidRatio: parseFloat(voidRatio.toFixed(3)),
      porosity: parseFloat(porosity.toFixed(3)),
      degreeOfSaturation: parseFloat(degreeOfSaturation.toFixed(3)),

      // Raw Inputs
      pycNo1, pycNo2, sgA1, sgA2, sgT1, sgT2, sgB1, sgB2,
      mcContainer1, mcContainer2, mcWet1, mcWet2, mcDry1, mcDry2,
      ringNo, ringWetWeight, status: calcStatus
    };

    const updatedTests = sample.tests.map(t => {
      if (t.testTypeCode === 'SG' || t.testTypeCode === 'MC' || t.testTypeCode === 'UW') {
        return {
          ...t,
          status: 'Selesai' as const,
          calculationStatus: calcStatus,
          calculationData: {
            inputValues: summaryData,
            summaryResults: summaryData
          }
        };
      }
      return t;
    });

    const updatedSample: Sample = {
      ...sample,
      tests: updatedTests
    };

    onSaveCalculation(updatedSample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between border-b border-teal-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-700/80 text-white shadow-inner">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-teal-600 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                  Kertas Kerja Physical Properties (PP)
                </span>
                <span className="text-xs text-teal-200 font-mono">SNI 1964 / 1965 / 03-3637</span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2 mt-0.5">
                <span>{sample.sampleCode}</span>
                <span className="text-teal-300 font-normal">({sample.idLab})</span>
                <span className="text-xs text-teal-200 font-semibold">— Depth: {sample.depthStart.toFixed(2)} - {sample.depthEnd.toFixed(2)} m</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadExcelSeedData}
              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-teal-100 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Isi otomatis dengan data pengujian dari Excel (BH-05_UDS-01)"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              Load Sample Excel Seed
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-teal-700 text-teal-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-700 shrink-0">
          <div className="flex items-center gap-4">
            <div><span className="text-slate-400 font-medium">Job No: </span><span className="font-mono font-bold text-slate-900">{po.poNumber}</span></div>
            <div><span className="text-slate-400 font-medium">Client: </span><span className="font-semibold text-slate-900">{po.clientName}</span></div>
            <div><span className="text-slate-400 font-medium">Penguji: </span><span className="font-semibold text-slate-900">{sample.testedBy || 'Rizki'}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status Verifikasi:</span>
            <select
              value={calcStatus}
              onChange={e => setCalcStatus(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs focus:outline-none focus:border-teal-600"
            >
              <option value="Draft Data">Draft Data</option>
              <option value="Calculated">Calculated (Terkalkulasi)</option>
              <option value="Verified">Verified (Terverifikasi)</option>
              <option value="Approved">Approved (Disetujui Head Lab)</option>
            </select>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* NOTICE BADGE */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Petunjuk:</strong> Kolom berlatar belakang <span className="bg-amber-200 px-1.5 py-0.5 rounded font-bold">Kuning</span> adalah parameter input manual. Hasil kalkulasi non-kuning terhitung otomatis secara presisi.
              </span>
            </div>
            <button onClick={handleResetData} className="text-amber-700 hover:text-amber-900 font-bold underline flex items-center gap-1 cursor-pointer">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Form
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. SPECIFIC GRAVITY (SG) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Pipette className="w-4 h-4 text-teal-600" />
                  1. SPECIFIC GRAVITY ($G_s$)
                </h4>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">SNI 1964:2008</span>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-1.5 px-2">Parameter</th>
                    <th className="py-1.5 px-1 text-center w-20">Trial 1</th>
                    <th className="py-1.5 px-1 text-center w-20">Trial 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                  {/* Pycnometer No */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">Pycnometer No.</td>
                    <td className="py-1.5 px-1 text-center">
                      <select
                        value={pycNo1}
                        onChange={e => setPycNo1(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      >
                        {pycCatalogue.map(p => <option key={p.pycNo} value={p.pycNo}>No. {p.pycNo}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <select
                        value={pycNo2}
                        onChange={e => setPycNo2(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      >
                        {pycCatalogue.map(p => <option key={p.pycNo} value={p.pycNo}>No. {p.pycNo}</option>)}
                      </select>
                    </td>
                  </tr>

                  {/* Dry Soil A */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">Wt. Dry Soil ($A$) (g)</td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={sgA1} onChange={e => setSgA1(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={sgA2} onChange={e => setSgA2(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                  </tr>

                  {/* Temperature T */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">Temp ($T$) (°C)</td>
                    <td className="py-1.5 px-1">
                      <select
                        value={sgT1} onChange={e => setSgT1(parseInt(e.target.value))}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      >
                        {Object.keys(WATER_DENSITY_TABLE).map(t => <option key={t} value={t}>{t} °C</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 px-1">
                      <select
                        value={sgT2} onChange={e => setSgT2(parseInt(e.target.value))}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      >
                        {Object.keys(WATER_DENSITY_TABLE).map(t => <option key={t} value={t}>{t} °C</option>)}
                      </select>
                    </td>
                  </tr>

                  {/* Pyc + Water + Soil B */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">Wt. Pyc+Water+Soil ($B$) (g)</td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={sgB1} onChange={e => setSgB1(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={sgB2} onChange={e => setSgB2(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                  </tr>

                  {/* Wt Pyc + Water at T (C) - AUTO */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-600 font-sans">Wt. Pyc+Water @$T$ ($C$) (g)</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{sgC1.toFixed(3)}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{sgC2.toFixed(3)}</td>
                  </tr>

                  {/* A + (C - B) - AUTO */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-600 font-sans">$A + (C - B)$ (g)</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{sgDenom1.toFixed(3)}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{sgDenom2.toFixed(3)}</td>
                  </tr>

                  {/* Gs Per Trial - AUTO */}
                  <tr className="bg-teal-50/60 font-extrabold text-teal-900">
                    <td className="py-1.5 px-2 font-sans">Specific Gravity ($G_s$)</td>
                    <td className="py-1.5 px-1 text-center">{gs1.toFixed(3)}</td>
                    <td className="py-1.5 px-1 text-center">{gs2.toFixed(3)}</td>
                  </tr>
                </tbody>
              </table>

              {/* AVERAGE GS RESULT */}
              <div className="p-3 rounded-xl bg-teal-800 text-white flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold font-sans">AVERAGE $G_s$:</span>
                <span className="text-base font-extrabold font-mono text-amber-300">{gsAvg.toFixed(3)}</span>
              </div>
            </div>

            {/* 2. MOISTURE CONTENT (MC) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Box className="w-4 h-4 text-teal-600" />
                  2. MOISTURE CONTENT ($w$)
                </h4>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">SNI 1965:2008</span>
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-1.5 px-2">Parameter</th>
                    <th className="py-1.5 px-1 text-center w-20">Trial 1</th>
                    <th className="py-1.5 px-1 text-center w-20">Trial 2</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                  {/* Container No */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">No. Container</td>
                    <td className="py-1.5 px-1 text-center">
                      <select
                        value={mcContainer1} onChange={e => setMcContainer1(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      >
                        {containerCatalogue.map(c => <option key={c.id} value={c.id}>No. {c.id}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <select
                        value={mcContainer2} onChange={e => setMcContainer2(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      >
                        {containerCatalogue.map(c => <option key={c.id} value={c.id}>No. {c.id}</option>)}
                      </select>
                    </td>
                  </tr>

                  {/* Container + Wet Soil */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">Wt. Container+Wet (g)</td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={mcWet1} onChange={e => setMcWet1(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={mcWet2} onChange={e => setMcWet2(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                  </tr>

                  {/* Container + Dry Soil */}
                  <tr>
                    <td className="py-1.5 px-2 text-slate-700 font-sans font-medium">Wt. Container+Dry (g)</td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={mcDry1} onChange={e => setMcDry1(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                    <td className="py-1.5 px-1">
                      <input
                        type="number" step="0.001" value={mcDry2} onChange={e => setMcDry2(e.target.value)}
                        className="w-full bg-amber-100 border border-amber-300 rounded px-1 py-0.5 font-bold text-center"
                      />
                    </td>
                  </tr>

                  {/* Wt Container - AUTO */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-600 font-sans">Wt. Container Tare (g)</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{containerObj1.weight.toFixed(3)}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{containerObj2.weight.toFixed(3)}</td>
                  </tr>

                  {/* Wt Water - AUTO */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-600 font-sans">Wt. Water ($W_w$) (g)</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{water1.toFixed(3)}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{water2.toFixed(3)}</td>
                  </tr>

                  {/* Wt Dry Soil - AUTO */}
                  <tr className="bg-slate-50/70">
                    <td className="py-1.5 px-2 text-slate-600 font-sans">Wt. Dry Soil ($W_s$) (g)</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{drySoil1.toFixed(3)}</td>
                    <td className="py-1.5 px-1 text-center font-bold text-slate-800">{drySoil2.toFixed(3)}</td>
                  </tr>

                  {/* MC Per Trial - AUTO */}
                  <tr className="bg-teal-50/60 font-extrabold text-teal-900">
                    <td className="py-1.5 px-2 font-sans">Moisture Content ($w$) (%)</td>
                    <td className="py-1.5 px-1 text-center">{mc1.toFixed(2)}%</td>
                    <td className="py-1.5 px-1 text-center">{mc2.toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>

              {/* AVERAGE MC RESULT */}
              <div className="p-3 rounded-xl bg-teal-800 text-white flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold font-sans">AVERAGE $w$:</span>
                <span className="text-base font-extrabold font-mono text-amber-300">{mcAvg.toFixed(2)}%</span>
              </div>
            </div>

            {/* 3. DENSITY / UNIT WEIGHT (UW) & SUMMARY PARAMETERS */}
            <div className="space-y-6">
              {/* UNIT WEIGHT */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-teal-600" />
                    3. DENSITY / UNIT WEIGHT ($\gamma_m$)
                  </h4>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">SNI 03-3637</span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Ring Select */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="font-sans font-bold text-slate-700">No. Ring:</span>
                    <select
                      value={ringNo} onChange={e => setRingNo(e.target.value)}
                      className="px-2 py-1 rounded bg-white border border-amber-300 font-bold text-xs text-center"
                    >
                      {ringCatalogue.map(r => <option key={r.ringNo} value={r.ringNo}>Ring {r.ringNo}</option>)}
                    </select>
                  </div>

                  {/* Ring Wet Soil Wt */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="font-sans font-bold text-slate-700">Wt. Ring + Wet Soil (g):</span>
                    <input
                      type="number" step="0.001" value={ringWetWeight} onChange={e => setRingWetWeight(e.target.value)}
                      className="w-24 px-2 py-1 rounded bg-white border border-amber-300 font-bold text-xs text-center"
                    />
                  </div>

                  {/* Auto Ring Tare Wt */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-sans text-slate-600">Wt. Ring Tare (g):</span>
                    <span className="font-bold text-slate-900">{ringObj && ringObj.weightGrams > 0 ? ringObj.weightGrams.toFixed(3) : '-'} g</span>
                  </div>

                  {/* Auto Ring Volume */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="font-sans text-slate-600">Vol. Ring / Wet Soil (cm³):</span>
                    <span className="font-bold text-slate-900">{ringObj && ringObj.volumeCm3 > 0 ? ringObj.volumeCm3.toFixed(3) : '-'} cm³</span>
                  </div>

                  {/* BULK DENSITY RESULT */}
                  <div className="p-3 rounded-xl bg-teal-800 text-white flex items-center justify-between shadow-sm mt-3">
                    <span className="text-xs font-bold font-sans">BULK DENSITY ($\gamma_m$):</span>
                    <span className="text-base font-extrabold text-amber-300">{bulkDensity.toFixed(3)} Mg/m³</span>
                  </div>
                </div>
              </div>

              {/* SUMMARY DERIVED PARAMETERS CARD */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-lg border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="font-extrabold text-xs text-teal-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-400" />
                    RINGKASAN PARAMETER INDEKS
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <div className="text-[10px] text-slate-400 font-sans font-medium">DRY DENSITY ($\gamma_d$)</div>
                    <div className="text-sm font-bold text-white mt-0.5">{dryDensity.toFixed(3)} Mg/m³</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <div className="text-[10px] text-slate-400 font-sans font-medium">VOID RATIO ($e$)</div>
                    <div className="text-sm font-bold text-teal-300 mt-0.5">{voidRatio.toFixed(3)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <div className="text-[10px] text-slate-400 font-sans font-medium">POROSITY ($n$)</div>
                    <div className="text-sm font-bold text-teal-300 mt-0.5">{porosity.toFixed(3)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <div className="text-[10px] text-slate-400 font-sans font-medium">SATURATION ($S_r$)</div>
                    <div className="text-sm font-bold text-amber-300 mt-0.5">{degreeOfSaturation.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Kalkulasi otomatis sesuai standar SNI Mekanika Tanah.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Kertas Kerja PP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
