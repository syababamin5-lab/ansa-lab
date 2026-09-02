import React, { useState, useEffect } from 'react';
import { Sample, ContainerItem, CalculationStatus } from '../types';
import {
  TrxCdFullData,
  TrxCdSpecimenData,
  INITIAL_TRX_CD_DATA,
  calculateTrxCdSpecimen,
  calculateTrxCdRegression,
  STANDARD_TRX_AXIAL_DISPLACEMENTS,
} from '../utils/trxCdHelpers';
import {
  Activity,
  Sparkles,
  Save,
  Scale,
  FileSpreadsheet,
  Layers,
  Gauge,
} from 'lucide-react';

interface TrxCdWorksheetProps {
  activeSample: Sample;
  normalizeTestCode: (code: string) => string;
  markDirty: () => void;
  handleSave: (autoAdvance?: boolean) => void;
  containerCatalogue?: ContainerItem[];
  trxRingCatalogue?: any[];
}

export const TrxCdWorksheet: React.FC<TrxCdWorksheetProps> = ({
  activeSample,
  normalizeTestCode,
  markDirty,
  handleSave,
  containerCatalogue = [],
  trxRingCatalogue = [],
}) => {
  const [trxData, setTrxData] = useState<TrxCdFullData>(() => {
    const testObj = (activeSample.tests || []).find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'TRX-CD';
    });
    if (testObj?.calculationData?.trxCd) {
      return testObj.calculationData.trxCd;
    }
    return INITIAL_TRX_CD_DATA;
  });

  // Re-sync state when active sample changes
  useEffect(() => {
    const testObj = (activeSample.tests || []).find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'TRX-CD';
    });
    if (testObj?.calculationData?.trxCd) {
      setTrxData(testObj.calculationData.trxCd);
    } else {
      setTrxData(INITIAL_TRX_CD_DATA);
    }
  }, [activeSample.id]);

  // Helper to find container item from master container catalogue
  const findContainerItem = (code: string) => {
    if (!code) return null;
    const clean = String(code).trim().toLowerCase();
    return (containerCatalogue || []).find(c => 
      String(c.id || '').trim().toLowerCase() === clean ||
      String((c as any).kode || '').trim().toLowerCase() === clean
    );
  };

  const getContainerWeight = (cont: any) => {
    if (!cont) return 0;
    return cont.weight ?? cont.weightGrams ?? cont.berat ?? 0;
  };

  // Auto-fill container weights from master catalogue
  useEffect(() => {
    if (!containerCatalogue || containerCatalogue.length === 0) return;
    setTrxData(prev => {
      let changed = false;
      const nextSpecs = prev.specimens.map(sp => {
        let newMcBefore = { ...sp.mcBefore };
        let newMcAfter = { ...sp.mcAfter };

        if (sp.mcBefore.containerCode) {
          const matchB = findContainerItem(sp.mcBefore.containerCode);
          if (matchB) {
            const wB = getContainerWeight(matchB);
            if (wB > 0 && sp.mcBefore.massContainer !== wB) {
              newMcBefore.massContainer = wB;
              changed = true;
            }
          }
        }

        if (sp.mcAfter.containerCode) {
          const matchA = findContainerItem(sp.mcAfter.containerCode);
          if (matchA) {
            const wA = getContainerWeight(matchA);
            if (wA > 0 && sp.mcAfter.massContainer !== wA) {
              newMcAfter.massContainer = wA;
              changed = true;
            }
          }
        }

        return { ...sp, mcBefore: newMcBefore, mcAfter: newMcAfter };
      }) as [TrxCdSpecimenData, TrxCdSpecimenData, TrxCdSpecimenData];

      if (changed) {
        return { ...prev, specimens: nextSpecs };
      }
      return prev;
    });
  }, [containerCatalogue]);

  // Dynamic calculations for 3 specimens
  const specResults = trxData.specimens.map(sp =>
    calculateTrxCdSpecimen(sp, trxData.lrc)
  );

  const regResult = calculateTrxCdRegression(specResults);

  // Field Update Handlers
  const handleUpdateSpecimen = (specIdx: number, field: keyof TrxCdSpecimenData, value: any) => {
    setTrxData(prev => {
      const nextSpecs = [...prev.specimens] as [TrxCdSpecimenData, TrxCdSpecimenData, TrxCdSpecimenData];
      const updatedSpec = { ...nextSpecs[specIdx], [field]: value };

      if (field === 'diameterCm' || field === 'heightCm') {
        const d = field === 'diameterCm' ? (parseFloat(value) || 3.81) : updatedSpec.diameterCm;
        const h = field === 'heightCm' ? (parseFloat(value) || 7.62) : updatedSpec.heightCm;
        updatedSpec.areaCm2 = Number(((Math.PI / 4) * Math.pow(d, 2)).toFixed(3));
        updatedSpec.volumeCm3 = Number((updatedSpec.areaCm2 * h).toFixed(3));
      }

      if (field === 'cellPressureKpa' || field === 'backPressureKpa') {
        const cell = field === 'cellPressureKpa' ? (parseFloat(value) || 0) : updatedSpec.cellPressureKpa;
        const back = field === 'backPressureKpa' ? (parseFloat(value) || 0) : updatedSpec.backPressureKpa;
        updatedSpec.effectiveCellPressureKpa = Math.max(0, cell - back);
      }

      nextSpecs[specIdx] = updatedSpec;
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleUpdateMcBefore = (specIdx: number, field: string, value: any) => {
    setTrxData(prev => {
      const nextSpecs = [...prev.specimens] as [TrxCdSpecimenData, TrxCdSpecimenData, TrxCdSpecimenData];
      const newMc = { ...nextSpecs[specIdx].mcBefore, [field]: value };
      if (field === 'containerCode' && value) {
        const item = findContainerItem(String(value));
        if (item) newMc.massContainer = getContainerWeight(item);
      }
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], mcBefore: newMc };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleUpdateMcAfter = (specIdx: number, field: string, value: any) => {
    setTrxData(prev => {
      const nextSpecs = [...prev.specimens] as [TrxCdSpecimenData, TrxCdSpecimenData, TrxCdSpecimenData];
      const newMc = { ...nextSpecs[specIdx].mcAfter, [field]: value };
      if (field === 'containerCode' && value) {
        const item = findContainerItem(String(value));
        if (item) newMc.massContainer = getContainerWeight(item);
      }
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], mcAfter: newMc };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleUpdateReading = (specIdx: number, readingIdx: number, field: string, val: number) => {
    setTrxData(prev => {
      const nextSpecs = [...prev.specimens] as [TrxCdSpecimenData, TrxCdSpecimenData, TrxCdSpecimenData];
      const nextReadings = [...nextSpecs[specIdx].readings];
      nextReadings[readingIdx] = {
        ...nextReadings[readingIdx],
        [field]: val,
      };
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], readings: nextReadings };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleSaveTrxCdData = () => {
    let testObj = activeSample.tests.find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'TRX-CD';
    });

    if (!testObj) {
      testObj = {
        id: `test-trx-cd-${Date.now()}`,
        testTypeId: 'TRX-CD',
        testTypeCode: 'TRX-CD',
        testTypeName: 'Triaxial Consolidated Drained (SNI 2455:2014)',
        calculationStatus: 'Calculated' as CalculationStatus,
        calculationData: {},
      };
      activeSample.tests.push(testObj);
    }

    testObj.calculationStatus = 'Calculated' as CalculationStatus;
    testObj.calculationData = {
      ...testObj.calculationData,
      trxCd: trxData,
      specResults,
      regResult,
      effectiveCohesionC: regResult.effectiveCohesionC,
      effectiveCohesionCKpa: regResult.effectiveCohesionCKpa,
      effectiveFrictionAnglePhi: regResult.effectiveFrictionAnglePhi,
    };
    handleSave();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 text-xs font-sans">
      {/* BANNER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-bold">
              SNI 2455:2014 / ASTM D7181
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">3-Specimen Consolidated Drained Triaxial Test</span>
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Uji Triaksial Terkonsolidasi Terdrainase (Triaxial CD)</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveTrxCdData}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil TRX CD</span>
          </button>
        </div>
      </div>

      {/* TOP CONFIGURATION CARD: LRC PROVING RING */}
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-3">
        <div className="text-[11px] font-black uppercase text-emerald-950 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Parameter Alat &amp; Kalibrasi Proving Ring (LRC)</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
            Faktor LRC: {trxData.lrc} kg/div
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {/* Master TRX Ring Dropdown Selector */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Ring Proving Mesin TRX:</label>
            <select
              onChange={e => {
                const selectedCode = e.target.value;
                if (!selectedCode) return;
                const match = (trxRingCatalogue || []).find((r: any) => r.ringNo === selectedCode || String(r.ringNo).includes(selectedCode));
                const lrcVal = match ? (match.provingCalibration ?? match.lrc ?? match.calibrationFactor) : undefined;
                if (lrcVal !== undefined && lrcVal > 0) {
                  setTrxData(prev => ({ ...prev, lrc: lrcVal }));
                  markDirty();
                }
              }}
              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="">-- Pilih Proving Ring TRX --</option>
              {(trxRingCatalogue && trxRingCatalogue.length > 0 ? trxRingCatalogue : [
                { ringNo: 'GT-105 (S/N: 235669)', provingCalibration: 0.12064 },
                { ringNo: 'TRX-2 (Master)', provingCalibration: 0.12100 }
              ]).map((ring: any, idx: number) => {
                const calVal = ring.provingCalibration ?? ring.lrc ?? 0.12064;
                return (
                  <option key={idx} value={ring.ringNo}>
                    {ring.ringNo} ({calVal} kgf/div)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Konstanta Proving Ring (LRC):</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={trxData.lrc || ''}
                onChange={e => {
                  setTrxData(prev => ({ ...prev, lrc: parseFloat(e.target.value) || 0 }));
                  markDirty();
                }}
                placeholder="mis. 0.150"
                className="w-full bg-white border border-slate-300 rounded-xl pl-2.5 pr-14 py-1.5 font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-500 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-sans font-bold pointer-events-none">kg/div</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Faktor Dial Deformasi Aksial:</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={trxData.axialDialFactor || 0.01}
                onChange={e => {
                  setTrxData(prev => ({ ...prev, axialDialFactor: parseFloat(e.target.value) || 0.01 }));
                  markDirty();
                }}
                placeholder="mis. 0.01"
                className="w-full bg-white border border-slate-300 rounded-xl pl-2.5 pr-16 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-sans font-bold pointer-events-none">mm/div</span>
            </div>
          </div>

          <div className="space-y-1 bg-white p-2 rounded-xl border border-emerald-200 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-sans">Standar Metode Pengujian:</span>
            <strong className="text-emerald-900 font-sans text-xs">SNI 2455:2014 (Consolidated Drained)</strong>
          </div>
        </div>
      </div>

      {/* TABLE 1: SPECIMEN DIMENSIONS & INITIAL MOISTURE CONTENT (W0) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. DIMENSI BENDA UJI &amp; KADAR AIR AWAL (W_0)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">SNI 2455:2014</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Benda Uji</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-emerald-100/70 border-l border-slate-200 font-sans">TITIK 1</th>
                <th className="py-2 px-2 text-center bg-teal-100/70 border-l border-slate-200 font-sans">TITIK 2</th>
                <th className="py-2 px-2 text-center bg-cyan-100/70 border-l border-slate-200 font-sans">TITIK 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Diameter */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Diameter Benda Uji (D₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.diameterCm || 3.81}
                      onChange={e => handleUpdateSpecimen(idx, 'diameterCm', parseFloat(e.target.value) || 3.81)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 font-bold text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Height */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Tinggi Benda Uji (H₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.heightCm || 7.62}
                      onChange={e => handleUpdateSpecimen(idx, 'heightCm', parseFloat(e.target.value) || 7.62)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 font-bold text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Area */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Luas Penampang (A₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm²</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 text-center border-l border-slate-200 font-bold text-slate-700">
                    {sp.areaCm2.toFixed(3)}
                  </td>
                ))}
              </tr>

              {/* Volume */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Volume Penampang (V₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm³</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 text-center border-l border-slate-200 font-bold text-slate-700">
                    {sp.volumeCm3.toFixed(3)}
                  </td>
                ))}
              </tr>

              {/* Mass Wet Soil */}
              <tr className="bg-slate-50">
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Berat Tanah Basah Awal</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.massWetSoilGrams || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'massWetSoilGrams', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded text-center font-bold p-1 text-slate-900"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Code Before */}
              <tr className="bg-slate-50">
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Kode Cawan (Kadar Air Awal)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="text"
                      value={sp.mcBefore.containerCode || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'containerCode', e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 font-bold text-slate-800"
                      placeholder="Cawan"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Wet Soil + Container Before */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Basah (Awal)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcBefore.massWetContainer || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'massWetContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Dry Soil + Container Before */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Kering (Awal)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcBefore.massDryContainer || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'massDryContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Mass Before */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan Kosong (Awal)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcBefore.massContainer || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'massContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Calculated MC Before */}
              <tr className="bg-emerald-100/60 font-bold text-emerald-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kadar Air Awal (w₀)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-emerald-900">
                    {sr.mcBeforePct > 0 ? `${sr.mcBeforePct.toFixed(2)} %` : '-'}
                  </td>
                ))}
              </tr>

              {/* Dry Density */}
              <tr className="bg-teal-100/70 font-bold text-teal-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kepadatan Kering Awal (γd₀)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">g/cm³</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-teal-950">
                    {sr.dryDensity > 0 ? sr.dryDensity.toFixed(4) : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: SATURATION (B-VALUE) & CONSOLIDATION PRESSURES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-teal-600" />
            <span>2. PENJENUHAN (B-VALUE) &amp; TEKANAN KONSOLIDASI (σ₃')</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">ASTM D7181</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Konsolidasi</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-emerald-100/70 border-l border-slate-200 font-sans">TITIK 1</th>
                <th className="py-2 px-2 text-center bg-teal-100/70 border-l border-slate-200 font-sans">TITIK 2</th>
                <th className="py-2 px-2 text-center bg-cyan-100/70 border-l border-slate-200 font-sans">TITIK 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Cell Pressure */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Tekanan Sel (Cell Pressure, σ₃)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">kPa</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="10"
                      value={sp.cellPressureKpa || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'cellPressureKpa', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 font-bold text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Back Pressure */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Tekanan Balik (Back Pressure, u₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">kPa</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="10"
                      value={sp.backPressureKpa || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'backPressureKpa', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 font-bold text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Effective Cell Pressure */}
              <tr className="bg-emerald-50/50 font-bold">
                <td className="py-1.5 px-3 font-sans font-extrabold text-emerald-950">Tekanan Sel Efektif (σ₃')</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">kPa</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-1.5 px-2 text-center border-l border-slate-200 font-black text-emerald-900">
                    {sr.effectiveCellPressureKpa.toFixed(1)} kPa ({sr.effectiveCellPressureKgCm2.toFixed(3)} kg/cm²)
                  </td>
                ))}
              </tr>

              {/* B Value */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Nilai Parameter Penjenuhan (B-Value)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.005"
                      value={sp.bValue || 0.975}
                      onChange={e => handleUpdateSpecimen(idx, 'bValue', parseFloat(e.target.value) || 0.95)}
                      className="w-full bg-emerald-50 border border-emerald-300 rounded text-center p-1 font-extrabold text-emerald-900"
                    />
                  </td>
                ))}
              </tr>

              {/* Volume Change Consolidation */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Perubahan Volume Konsolidasi (ΔVc)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm³</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.consolidationVolumeChangeCm3 || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'consolidationVolumeChangeCm3', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 3: DRAINED SHEARING DIAL READINGS TABLE (PROVING RING DIAL VS AXIAL DEFORMATION VS VOLUME CHANGE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. TABEL PEMBACAAN DIAL PENGGESERAN TRIAXIAL CD (PROVING RING DIAL &amp; ΔV VS ΔH)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">LRC = {trxData.lrc} kg/div</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-center border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase">
                <th className="py-2 px-2 text-left font-sans w-28">Deformasi (ΔH)</th>
                <th className="py-2 px-2 bg-emerald-100/70 border-l border-slate-200 font-sans" colSpan={3}>
                  TITIK 1 (σ₃' = {specResults[0].effectiveCellPressureKpa.toFixed(0)} kPa)
                </th>
                <th className="py-2 px-2 bg-teal-100/70 border-l border-slate-200 font-sans" colSpan={3}>
                  TITIK 2 (σ₃' = {specResults[1].effectiveCellPressureKpa.toFixed(0)} kPa)
                </th>
                <th className="py-2 px-2 bg-cyan-100/70 border-l border-slate-200 font-sans" colSpan={3}>
                  TITIK 3 (σ₃' = {specResults[2].effectiveCellPressureKpa.toFixed(0)} kPa)
                </th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[9.5px]">
                <th className="py-1 px-2 text-left">mm</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-emerald-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">ΔV (cm³)</th>
                <th className="py-1 px-1 text-emerald-900">Deviator (kPa)</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-teal-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">ΔV (cm³)</th>
                <th className="py-1 px-1 text-teal-900">Deviator (kPa)</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-cyan-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">ΔV (cm³)</th>
                <th className="py-1 px-1 text-cyan-900">Deviator (kPa)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {STANDARD_TRX_AXIAL_DISPLACEMENTS.map((dispMm, rIdx) => {
                const r0 = specResults[0].readings[rIdx] || { provingRingDiv: 0, volumeChangeCm3: 0, deviatorStressKpa: 0 };
                const r1 = specResults[1].readings[rIdx] || { provingRingDiv: 0, volumeChangeCm3: 0, deviatorStressKpa: 0 };
                const r2 = specResults[2].readings[rIdx] || { provingRingDiv: 0, volumeChangeCm3: 0, deviatorStressKpa: 0 };

                const isPeak0 = Math.abs(r0.deviatorStressKpa - specResults[0].peakDeviatorStressKpa) < 0.1 && r0.deviatorStressKpa > 0;
                const isPeak1 = Math.abs(r1.deviatorStressKpa - specResults[1].peakDeviatorStressKpa) < 0.1 && r1.deviatorStressKpa > 0;
                const isPeak2 = Math.abs(r2.deviatorStressKpa - specResults[2].peakDeviatorStressKpa) < 0.1 && r2.deviatorStressKpa > 0;

                return (
                  <tr key={rIdx}>
                    <td className="py-1.5 px-2 text-left font-bold text-slate-800 font-sans">
                      {dispMm.toFixed(2)} mm
                    </td>

                    {/* Specimen 0 (Titik 1) */}
                    <td className={`py-1.5 px-1 border-l border-slate-200 ${isPeak0 ? 'bg-emerald-100/70 font-black' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        value={trxData.specimens[0].readings[rIdx]?.provingRingDiv || ''}
                        onChange={e => handleUpdateReading(0, rIdx, 'provingRingDiv', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">
                      <input
                        type="number"
                        step="0.1"
                        value={trxData.specimens[0].readings[rIdx]?.volumeChangeCm3 || ''}
                        onChange={e => handleUpdateReading(0, rIdx, 'volumeChangeCm3', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-white border border-slate-100 rounded text-center p-0.5 text-slate-700"
                      />
                    </td>
                    <td className={`py-1.5 px-1 font-bold ${isPeak0 ? 'text-emerald-950 font-black text-xs' : 'text-emerald-900'}`}>
                      {r0.deviatorStressKpa > 0 ? r0.deviatorStressKpa.toFixed(1) : '0.0'}
                    </td>

                    {/* Specimen 1 (Titik 2) */}
                    <td className={`py-1.5 px-1 border-l border-slate-200 ${isPeak1 ? 'bg-teal-100/70 font-black' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        value={trxData.specimens[1].readings[rIdx]?.provingRingDiv || ''}
                        onChange={e => handleUpdateReading(1, rIdx, 'provingRingDiv', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">
                      <input
                        type="number"
                        step="0.1"
                        value={trxData.specimens[1].readings[rIdx]?.volumeChangeCm3 || ''}
                        onChange={e => handleUpdateReading(1, rIdx, 'volumeChangeCm3', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-white border border-slate-100 rounded text-center p-0.5 text-slate-700"
                      />
                    </td>
                    <td className={`py-1.5 px-1 font-bold ${isPeak1 ? 'text-teal-950 font-black text-xs' : 'text-teal-900'}`}>
                      {r1.deviatorStressKpa > 0 ? r1.deviatorStressKpa.toFixed(1) : '0.0'}
                    </td>

                    {/* Specimen 2 (Titik 3) */}
                    <td className={`py-1.5 px-1 border-l border-slate-200 ${isPeak2 ? 'bg-cyan-100/70 font-black' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        value={trxData.specimens[2].readings[rIdx]?.provingRingDiv || ''}
                        onChange={e => handleUpdateReading(2, rIdx, 'provingRingDiv', parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">
                      <input
                        type="number"
                        step="0.1"
                        value={trxData.specimens[2].readings[rIdx]?.volumeChangeCm3 || ''}
                        onChange={e => handleUpdateReading(2, rIdx, 'volumeChangeCm3', parseFloat(e.target.value) || 0)}
                        className="w-12 bg-white border border-slate-100 rounded text-center p-0.5 text-slate-700"
                      />
                    </td>
                    <td className={`py-1.5 px-1 font-bold ${isPeak2 ? 'text-cyan-950 font-black text-xs' : 'text-cyan-900'}`}>
                      {r2.deviatorStressKpa > 0 ? r2.deviatorStressKpa.toFixed(1) : '0.0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 4: MOISTURE CONTENT AFTER TEST (WF) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>4. KADAR AIR SETELAH PENGGESERAN TERDRAINASE (W_F)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">SNI 1965:2008</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Kadar Air Akhir</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-emerald-100/70 border-l border-slate-200 font-sans">TITIK 1</th>
                <th className="py-2 px-2 text-center bg-teal-100/70 border-l border-slate-200 font-sans">TITIK 2</th>
                <th className="py-2 px-2 text-center bg-cyan-100/70 border-l border-slate-200 font-sans">TITIK 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Container Code After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Kode Cawan (Kadar Air Akhir)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="text"
                      value={sp.mcAfter.containerCode || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'containerCode', e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 font-bold text-slate-800"
                      placeholder="Cawan"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Wet Soil + Container After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Basah (Akhir)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcAfter.massWetContainer || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'massWetContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Dry Soil + Container After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Kering (Akhir)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcAfter.massDryContainer || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'massDryContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Mass After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan Kosong (Akhir)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {trxData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcAfter.massContainer || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'massContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Calculated MC After */}
              <tr className="bg-teal-100/60 font-bold text-teal-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kadar Air Akhir (w_f)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-teal-900">
                    {sr.mcAfterPct > 0 ? `${sr.mcAfterPct.toFixed(2)} %` : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULTS SUMMARY CARDS FOR THE 3 SPECIMENS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {specResults.map((sr, idx) => (
          <div key={idx} className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-1.5">
            <div className="text-[10.5px] font-black uppercase text-emerald-950 flex items-center justify-between">
              <span>Titik {idx + 1} (σ₃' = {sr.effectiveCellPressureKpa.toFixed(0)} kPa)</span>
              <span className="font-mono text-emerald-800">{sr.dryDensity.toFixed(3)} g/cm³</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Tegangan Kekangan (σ₃'):</span>
              <strong className="text-slate-800">{sr.effectiveCellPressureKpa.toFixed(1)} kPa ({sr.effectiveCellPressureKgCm2.toFixed(3)} kg/cm²)</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Regangan Aksial Puncak (εaf):</span>
              <strong className="text-slate-800">{sr.peakAxialStrainPct.toFixed(2)} %</strong>
            </div>
            <div className="pt-1 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-950">
              <span>Tegangan Deviasi Puncak (q_max):</span>
              <span className="text-sm font-black text-emerald-700 font-mono">{sr.peakDeviatorStressKpa.toFixed(1)} kPa</span>
            </div>
          </div>
        ))}
      </div>

      {/* HERO FINAL RESULT BANNER FOR EFFECTIVE COHESION & FRICTION ANGLE */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-emerald-700">
        <div>
          <div className="text-[10.5px] font-mono font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            HASIL UJI KUNCI — PARAMETER KUAT GESER EFEKTIF (SNI 2455:2014)
          </div>
          <div className="flex items-baseline gap-6 mt-1">
            <div>
              <span className="text-xs text-emerald-200 block uppercase font-mono">Kohesi Efektif (c'):</span>
              <span className="text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span>{regResult.effectiveCohesionCKpa.toFixed(2)} kPa</span>
                <span className="text-xs font-normal text-emerald-200">({regResult.effectiveCohesionC.toFixed(3)} kg/cm²)</span>
              </span>
            </div>
            <div className="border-l border-emerald-700 pl-4">
              <span className="text-xs text-emerald-200 block uppercase font-mono">Sudut Geser Efektif (φ'):</span>
              <span className="text-3xl font-black font-mono text-amber-300">
                {regResult.effectiveFrictionAnglePhi.toFixed(2)} °
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-200 font-medium mt-1">
            Garis Keruntuhan Mohr-Coulomb Efektif: τ_f = {regResult.effectiveCohesionCKpa.toFixed(1)} + σ' · tan({regResult.effectiveFrictionAnglePhi.toFixed(2)}°) (R² = {regResult.rSquared.toFixed(4)})
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-right shrink-0">
          <div className="text-[10px] font-mono text-emerald-300">Persamaan Failure Envelope:</div>
          <div className="text-xs font-mono font-bold text-white mt-0.5">
            τ = {regResult.effectiveCohesionC.toFixed(3)} + {regResult.slope.toFixed(4)} · σ'
          </div>
        </div>
      </div>

      {/* SECTION TITLE FOR INTERACTIVE CHARTS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Kurva Uji Triaksial CD (SNI 2455:2014 / ASTM D7181)
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-500">3-Specimen TRX CD Charts</span>
      </div>

      {/* GRAFIK 1 & GRAFIK 2 INTERACTIVE SVG CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAFIK 1: TEGANGAN DEVIASI (Q) VS REGANGAN AKSIAL (ΕA) */}
        {(() => {
          const maxDev = Math.max(...specResults.flatMap(s => s.readings.map(r => r.deviatorStressKpa)), 100);
          const yAxisMax = Math.ceil(maxDev * 1.2 / 50) * 50;

          const paddingL = 45, paddingR = 20, paddingT = 30, paddingB = 35;
          const chartW = 460, chartH = 240;
          const plotW = chartW - paddingL - paddingR;
          const plotH = chartH - paddingT - paddingB;

          const getX = (strain: number) => paddingL + (strain / 15.0) * plotW;
          const getY = (q: number) => paddingT + plotH - (q / yAxisMax) * plotH;

          const colors = ['#059669', '#0D9488', '#0284C7'];

          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Grafik 1: Kurva Tegangan Deviasi (q) vs Regangan Aksial (εa)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Hubungan (σ₁ - σ₃) [kPa] Terhadap Regangan Aksial [%]</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[9.5px] font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                {specResults.map((sr, idx) => (
                  <span key={idx} className="flex items-center gap-1 font-bold" style={{ color: colors[idx] }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx] }}></span>
                    Titik {idx + 1} (σ₃' = {sr.effectiveCellPressureKpa.toFixed(0)} kPa)
                  </span>
                ))}
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 bg-slate-50/70 rounded-xl border border-slate-200">
                  {/* Y Ticks */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                    const val = yAxisMax * frac;
                    const yPos = getY(val);
                    return (
                      <g key={i}>
                        <line x1={paddingL} y1={yPos} x2={chartW - paddingR} y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={paddingL - 5} y={yPos + 3} fontSize="8" textAnchor="end" fill="#64748B" className="font-mono">
                          {Math.round(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Ticks */}
                  {[0, 3, 6, 9, 12, 15].map((strain, i) => {
                    const xPos = getX(strain);
                    return (
                      <g key={i}>
                        <line x1={xPos} y1={paddingT} x2={xPos} y2={paddingT + plotH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={xPos} y={paddingT + plotH + 13} fontSize="8" textAnchor="middle" fill="#64748B" className="font-mono">
                          {strain}%
                        </text>
                      </g>
                    );
                  })}

                  <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Specimen Curves */}
                  {specResults.map((sr, idx) => {
                    const points = sr.readings.map(r => ({ x: getX(r.axialStrainPct), y: getY(r.deviatorStressKpa) }));
                    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const color = colors[idx];

                    return (
                      <g key={idx}>
                        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
                        {points.map((pt, pIdx) => (
                          <circle key={pIdx} cx={pt.x} cy={pt.y} r="2" fill={color} stroke="#FFFFFF" strokeWidth="0.8" />
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })()}

        {/* GRAFIK 2: MOHR CIRCLES & EFFECTIVE FAILURE ENVELOPE (C', Φ') */}
        {(() => {
          const maxSigma1 = Math.max(...specResults.map(s => s.peakMajorEffectiveStressKpa), 300);
          const maxX = Math.ceil(maxSigma1 * 1.2 / 50) * 50;
          const maxY = Math.ceil(maxX * 0.6 / 50) * 50;

          const paddingL = 45, paddingR = 25, paddingT = 30, paddingB = 35;
          const chartW = 460, chartH = 240;
          const plotW = chartW - paddingL - paddingR;
          const plotH = chartH - paddingT - paddingB;

          const getX = (sigma: number) => paddingL + (sigma / maxX) * plotW;
          const getY = (tau: number) => paddingT + plotH - (tau / maxY) * plotH;

          // Tangent Regression Line Path
          const startX = 0;
          const startY = regResult.effectiveCohesionCKpa;
          const endX = maxX;
          const endY = regResult.effectiveCohesionCKpa + regResult.slope * maxX;

          const linePathD = `M ${getX(startX)} ${getY(startY)} L ${getX(endX)} ${getY(endY)}`;

          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Grafik 2: Lingkaran Mohr Efektif &amp; Garis Keruntuhan (Failure Envelope)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Penentuan c' ({regResult.effectiveCohesionCKpa.toFixed(1)} kPa) &amp; φ' ({regResult.effectiveFrictionAnglePhi.toFixed(2)}°)</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9.5px] font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                <span className="flex items-center gap-1 font-bold text-emerald-900">
                  <span className="w-3 h-0.5 bg-emerald-600 rounded"></span> Garis Failure Envelope Mohr Efektif
                </span>
                <span className="font-bold text-amber-800">
                  φ' = {regResult.effectiveFrictionAnglePhi.toFixed(2)}° | c' = {regResult.effectiveCohesionCKpa.toFixed(1)} kPa
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 bg-slate-50/70 rounded-xl border border-slate-200">
                  {/* Y Ticks */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                    const val = maxY * frac;
                    const yPos = getY(val);
                    return (
                      <g key={i}>
                        <line x1={paddingL} y1={yPos} x2={chartW - paddingR} y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={paddingL - 5} y={yPos + 3} fontSize="8" textAnchor="end" fill="#64748B" className="font-mono">
                          {Math.round(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Ticks */}
                  {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                    const val = maxX * frac;
                    const xPos = getX(val);
                    return (
                      <g key={i}>
                        <line x1={xPos} y1={paddingT} x2={xPos} y2={paddingT + plotH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={xPos} y={paddingT + plotH + 13} fontSize="8" textAnchor="middle" fill="#64748B" className="font-mono">
                          {Math.round(val)}
                        </text>
                      </g>
                    );
                  })}

                  <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Mohr Circles */}
                  {specResults.map((sr, idx) => {
                    const s3 = sr.effectiveCellPressureKpa;
                    const s1 = sr.peakMajorEffectiveStressKpa;
                    const center = (s1 + s3) / 2;
                    const radius = (s1 - s3) / 2;

                    const cx = getX(center);
                    const cy = getY(0);
                    const rx = (radius / maxX) * plotW;
                    const ry = (radius / maxY) * plotH;

                    return (
                      <g key={idx}>
                        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#059669" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
                        <circle cx={getX(s3)} cy={cy} r="3" fill="#059669" />
                        <circle cx={getX(s1)} cy={cy} r="3" fill="#059669" />
                      </g>
                    );
                  })}

                  {/* Regression Line */}
                  <path d={linePathD} fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
