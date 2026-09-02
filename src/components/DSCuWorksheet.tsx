import React, { useState, useEffect } from 'react';
import { Sample, ContainerItem, CalculationStatus } from '../types';
import {
  DSCuFullData,
  DSCuSpecimenData,
  INITIAL_DS_CU_DATA,
  calculateDSCuSpecimen,
  calculateDSCuRegression,
  STANDARD_DS_SHEAR_DISPLACEMENTS,
} from '../utils/dsCuHelpers';
import {
  Activity,
  Sparkles,
  Save,
  RotateCcw,
  Scale,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

interface DSCuWorksheetProps {
  activeSample: Sample;
  normalizeTestCode: (code: string) => string;
  markDirty: () => void;
  handleSave: (autoAdvance?: boolean) => void;
  containerCatalogue?: ContainerItem[];
}

export const DSCuWorksheet: React.FC<DSCuWorksheetProps> = ({
  activeSample,
  normalizeTestCode,
  markDirty,
  handleSave,
  containerCatalogue = [],
}) => {
  const [dsData, setDsData] = useState<DSCuFullData>(() => {
    const testObj = (activeSample.tests || []).find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'DS-CU';
    });
    if (testObj?.calculationData?.dsCu) {
      return testObj.calculationData.dsCu;
    }
    return INITIAL_DS_CU_DATA;
  });

  // Re-sync state when active sample changes
  useEffect(() => {
    const testObj = (activeSample.tests || []).find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'DS-CU';
    });
    if (testObj?.calculationData?.dsCu) {
      setDsData(testObj.calculationData.dsCu);
    } else {
      setDsData(INITIAL_DS_CU_DATA);
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
    setDsData(prev => {
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
      }) as [DSCuSpecimenData, DSCuSpecimenData, DSCuSpecimenData];

      if (changed) {
        return { ...prev, specimens: nextSpecs };
      }
      return prev;
    });
  }, [containerCatalogue]);

  // Dynamic calculations for the 3 specimens
  const specResults = dsData.specimens.map(sp =>
    calculateDSCuSpecimen(sp, dsData.lrc)
  );

  const regResult = calculateDSCuRegression(specResults);

  // Field Update Handlers
  const handleUpdateSpecimen = (specIdx: number, field: keyof DSCuSpecimenData, value: any) => {
    setDsData(prev => {
      const nextSpecs = [...prev.specimens] as [DSCuSpecimenData, DSCuSpecimenData, DSCuSpecimenData];
      const updatedSpec = { ...nextSpecs[specIdx], [field]: value };

      // Recalculate area and volume if diameter or height changes
      if (field === 'diameterCm' || field === 'heightCm') {
        const d = field === 'diameterCm' ? (parseFloat(value) || 6.0) : updatedSpec.diameterCm;
        const h = field === 'heightCm' ? (parseFloat(value) || 2.0) : updatedSpec.heightCm;
        updatedSpec.areaCm2 = Number(((Math.PI / 4) * Math.pow(d, 2)).toFixed(3));
        updatedSpec.volumeCm3 = Number((updatedSpec.areaCm2 * h).toFixed(3));
      }

      nextSpecs[specIdx] = updatedSpec;
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleUpdateMcBefore = (specIdx: number, field: string, value: any) => {
    setDsData(prev => {
      const nextSpecs = [...prev.specimens] as [DSCuSpecimenData, DSCuSpecimenData, DSCuSpecimenData];
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
    setDsData(prev => {
      const nextSpecs = [...prev.specimens] as [DSCuSpecimenData, DSCuSpecimenData, DSCuSpecimenData];
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

  const handleUpdateProvingRingDiv = (specIdx: number, readingIdx: number, val: number) => {
    setDsData(prev => {
      const nextSpecs = [...prev.specimens] as [DSCuSpecimenData, DSCuSpecimenData, DSCuSpecimenData];
      const nextReadings = [...nextSpecs[specIdx].readings];
      nextReadings[readingIdx] = {
        ...nextReadings[readingIdx],
        provingRingDiv: val,
      };
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], readings: nextReadings };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleSaveDsCuData = () => {
    let testObj = activeSample.tests.find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'DS-CU';
    });

    if (!testObj) {
      testObj = {
        id: `test-ds-cu-${Date.now()}`,
        testTypeId: 'DS-CU',
        testTypeCode: 'DS-CU',
        testTypeName: 'Direct Shear Consolidated Undrained (SNI 2813:2008)',
        calculationStatus: 'Calculated' as CalculationStatus,
        calculationData: {},
      };
      activeSample.tests.push(testObj);
    }

    testObj.calculationStatus = 'Calculated' as CalculationStatus;
    testObj.calculationData = {
      ...testObj.calculationData,
      dsCu: dsData,
      specResults,
      regResult,
      cohesionCcu: regResult.cohesionCcu,
      cohesionCcuKpa: regResult.cohesionCcuKpa,
      frictionAnglePhicu: regResult.frictionAnglePhicu,
    };
    handleSave();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 text-xs font-sans">
      {/* BANNER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-mono font-bold">
              SNI 2813:2008 / ASTM D3080
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">3-Specimen Consolidated Undrained Direct Shear</span>
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Uji Kuat Geser Langsung Terkonsolidasi Tanpa Drainase (DS CU)</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDsCuData}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil DS CU</span>
          </button>
        </div>
      </div>

      {/* TOP CONFIGURATION CARD: LRC PROVING RING */}
      <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-3.5 space-y-3">
        <div className="text-[11px] font-black uppercase text-purple-950 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-purple-600" />
            <span>Parameter Alat &amp; Kalibrasi Proving Ring</span>
          </span>
          <span className="text-[10px] font-mono text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
            Faktor LRC: {dsData.lrc} kg/div
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Konstanta Proving Ring (LRC):</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={dsData.lrc || ''}
                onChange={e => {
                  setDsData(prev => ({ ...prev, lrc: parseFloat(e.target.value) || 0 }));
                  markDirty();
                }}
                placeholder="mis. 0.150"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-purple-950 focus:ring-2 focus:ring-purple-500 shadow-2xs"
              />
              <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-sans">kg/div</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Faktor Dial Pergeseran Horizontal:</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={dsData.horizontalDialFactor || 0.01}
                onChange={e => {
                  setDsData(prev => ({ ...prev, horizontalDialFactor: parseFloat(e.target.value) || 0.01 }));
                  markDirty();
                }}
                placeholder="mis. 0.01"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 shadow-2xs"
              />
              <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-sans">mm/div</span>
            </div>
          </div>

          <div className="space-y-1 bg-white p-2 rounded-xl border border-purple-200 flex flex-col justify-center">
            <span className="text-[10px] text-slate-500 font-sans">Standar Metode Pengujian:</span>
            <strong className="text-purple-900 font-sans text-xs">SNI 2813:2008 (Consolidated Undrained)</strong>
          </div>
        </div>
      </div>

      {/* TABLE 1: SPECIMEN DIMENSIONS & MOISTURE CONTENT BEFORE CONSOLIDATION (W1) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            <span>1. DIMENSI BENDA UJI &amp; KADAR AIR SEBELUM KONSOLIDASI (W_1)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">SNI 2813:2008</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Benda Uji</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-purple-100/70 border-l border-slate-200 font-sans">TITIK 1</th>
                <th className="py-2 px-2 text-center bg-indigo-100/70 border-l border-slate-200 font-sans">TITIK 2</th>
                <th className="py-2 px-2 text-center bg-blue-100/70 border-l border-slate-200 font-sans">TITIK 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Normal Load */}
              <tr className="bg-purple-50/40">
                <td className="py-1.5 px-3 font-sans font-bold text-purple-950">Beban Normal Tegas (σn)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">kg/cm²</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.normalLoadKg || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'normalLoadKg', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-purple-300 rounded text-center font-black p-1 text-purple-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </td>
                ))}
              </tr>

              {/* Ring Code */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Kode Ring Geser</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="text"
                      value={sp.ringCode || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'ringCode', e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center font-bold p-1 text-slate-900"
                    />
                  </td>
                ))}
              </tr>

              {/* Diameter */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Diameter Benda Uji (D)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.diameterCm || 6.0}
                      onChange={e => handleUpdateSpecimen(idx, 'diameterCm', parseFloat(e.target.value) || 6.0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Height */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Tinggi Benda Uji (H₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.heightCm || 2.0}
                      onChange={e => handleUpdateSpecimen(idx, 'heightCm', parseFloat(e.target.value) || 2.0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Area */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Luas Penampang (A₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm²</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 text-center border-l border-slate-200 font-bold text-slate-700">
                    {sp.areaCm2.toFixed(3)}
                  </td>
                ))}
              </tr>

              {/* Volume */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Volume Penampang (V₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm³</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 text-center border-l border-slate-200 font-bold text-slate-700">
                    {sp.volumeCm3.toFixed(3)}
                  </td>
                ))}
              </tr>

              {/* Mass Ring + Wet Soil */}
              <tr className="bg-slate-50">
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Berat Ring + Tanah Basah Awal</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.massWetSoilRingGrams || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'massWetSoilRingGrams', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded text-center font-bold p-1 text-slate-900"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Ring Kosong */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Berat Ring Kosong</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {dsData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.1"
                      value={sp.massRingGrams || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'massRingGrams', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Code Before */}
              <tr className="bg-slate-50">
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Kode Cawan (Kadar Air Awal)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {dsData.specimens.map((sp, idx) => (
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
                {dsData.specimens.map((sp, idx) => (
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
                {dsData.specimens.map((sp, idx) => (
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
                {dsData.specimens.map((sp, idx) => (
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
              <tr className="bg-purple-100/60 font-bold text-purple-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kadar Air Awal (w₁)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-purple-900">
                    {sr.mcBeforePct > 0 ? `${sr.mcBeforePct.toFixed(2)} %` : '-'}
                  </td>
                ))}
              </tr>

              {/* Dry Density */}
              <tr className="bg-indigo-100/70 font-bold text-indigo-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kepadatan Kering Awal (γd₁)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">g/cm³</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-indigo-950">
                    {sr.dryDensity > 0 ? sr.dryDensity.toFixed(4) : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: SHEAR DIAL READINGS TABLE (PROVING RING DIVISION VS HORIZONTAL DISPLACEMENT) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>2. TABEL PEMBACAAN DIAL PENGGESERAN DS CU (PISO PROVING RING DIAL VS ΔX)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">LRC = {dsData.lrc} kg/div</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-center border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase">
                <th className="py-2 px-2 text-left font-sans w-32">Pergeseran (Δx)</th>
                <th className="py-2 px-2 bg-purple-100/70 border-l border-slate-200 font-sans" colSpan={3}>
                  TITIK 1 (σn = {dsData.specimens[0].normalLoadKg} kg/cm²)
                </th>
                <th className="py-2 px-2 bg-indigo-100/70 border-l border-slate-200 font-sans" colSpan={3}>
                  TITIK 2 (σn = {dsData.specimens[1].normalLoadKg} kg/cm²)
                </th>
                <th className="py-2 px-2 bg-blue-100/70 border-l border-slate-200 font-sans" colSpan={3}>
                  TITIK 3 (σn = {dsData.specimens[2].normalLoadKg} kg/cm²)
                </th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[9.5px]">
                <th className="py-1 px-2 text-left">mm</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-purple-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">Beban (kg)</th>
                <th className="py-1 px-1 text-purple-900">Tegangan τ (kg/cm²)</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-indigo-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">Beban (kg)</th>
                <th className="py-1 px-1 text-indigo-900">Tegangan τ (kg/cm²)</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-blue-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">Beban (kg)</th>
                <th className="py-1 px-1 text-blue-900">Tegangan τ (kg/cm²)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {STANDARD_DS_SHEAR_DISPLACEMENTS.map((dispMm, rIdx) => {
                const r0 = specResults[0].readings[rIdx] || { provingRingDiv: 0, loadKg: 0, shearStressKgCm2: 0 };
                const r1 = specResults[1].readings[rIdx] || { provingRingDiv: 0, loadKg: 0, shearStressKgCm2: 0 };
                const r2 = specResults[2].readings[rIdx] || { provingRingDiv: 0, loadKg: 0, shearStressKgCm2: 0 };

                const isPeak0 = specResults[0].peakDisplacementMm === dispMm && specResults[0].peakShearStressKgCm2 > 0;
                const isPeak1 = specResults[1].peakDisplacementMm === dispMm && specResults[1].peakShearStressKgCm2 > 0;
                const isPeak2 = specResults[2].peakDisplacementMm === dispMm && specResults[2].peakShearStressKgCm2 > 0;

                return (
                  <tr key={rIdx}>
                    <td className="py-1.5 px-2 text-left font-bold text-slate-800 font-sans">
                      {dispMm.toFixed(2)} mm
                    </td>

                    {/* Specimen 0 (Titik 1) */}
                    <td className={`py-1.5 px-1 border-l border-slate-200 ${isPeak0 ? 'bg-purple-100/70 font-black' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        value={dsData.specimens[0].readings[rIdx]?.provingRingDiv || ''}
                        onChange={e => handleUpdateProvingRingDiv(0, rIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">{r0.loadKg > 0 ? r0.loadKg.toFixed(2) : '0.00'}</td>
                    <td className={`py-1.5 px-1 font-bold ${isPeak0 ? 'text-purple-950 font-black text-xs' : 'text-purple-900'}`}>
                      {r0.shearStressKgCm2 > 0 ? r0.shearStressKgCm2.toFixed(3) : '0.000'}
                    </td>

                    {/* Specimen 1 (Titik 2) */}
                    <td className={`py-1.5 px-1 border-l border-slate-200 ${isPeak1 ? 'bg-indigo-100/70 font-black' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        value={dsData.specimens[1].readings[rIdx]?.provingRingDiv || ''}
                        onChange={e => handleUpdateProvingRingDiv(1, rIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">{r1.loadKg > 0 ? r1.loadKg.toFixed(2) : '0.00'}</td>
                    <td className={`py-1.5 px-1 font-bold ${isPeak1 ? 'text-indigo-950 font-black text-xs' : 'text-indigo-900'}`}>
                      {r1.shearStressKgCm2 > 0 ? r1.shearStressKgCm2.toFixed(3) : '0.000'}
                    </td>

                    {/* Specimen 2 (Titik 3) */}
                    <td className={`py-1.5 px-1 border-l border-slate-200 ${isPeak2 ? 'bg-blue-100/70 font-black' : ''}`}>
                      <input
                        type="number"
                        step="0.5"
                        value={dsData.specimens[2].readings[rIdx]?.provingRingDiv || ''}
                        onChange={e => handleUpdateProvingRingDiv(2, rIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">{r2.loadKg > 0 ? r2.loadKg.toFixed(2) : '0.00'}</td>
                    <td className={`py-1.5 px-1 font-bold ${isPeak2 ? 'text-blue-950 font-black text-xs' : 'text-blue-900'}`}>
                      {r2.shearStressKgCm2 > 0 ? r2.shearStressKgCm2.toFixed(3) : '0.000'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 3: MOISTURE CONTENT AFTER TEST (W2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. KADAR AIR SETELAH PENGGESERAN (W_2)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">SNI 1965:2008</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Kadar Air Akhir</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-purple-100/70 border-l border-slate-200 font-sans">TITIK 1</th>
                <th className="py-2 px-2 text-center bg-indigo-100/70 border-l border-slate-200 font-sans">TITIK 2</th>
                <th className="py-2 px-2 text-center bg-blue-100/70 border-l border-slate-200 font-sans">TITIK 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Container Code After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Kode Cawan (Kadar Air Akhir)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {dsData.specimens.map((sp, idx) => (
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
                {dsData.specimens.map((sp, idx) => (
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
                {dsData.specimens.map((sp, idx) => (
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
                {dsData.specimens.map((sp, idx) => (
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
              <tr className="bg-indigo-100/60 font-bold text-indigo-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kadar Air Akhir (w₂)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-indigo-900">
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
          <div key={idx} className="p-3 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-1.5">
            <div className="text-[10.5px] font-black uppercase text-purple-950 flex items-center justify-between">
              <span>Titik {idx + 1} (σn = {sr.normalStressKgCm2.toFixed(2)} kg/cm²)</span>
              <span className="font-mono text-purple-800">{sr.dryDensity.toFixed(3)} g/cm³</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Tegangan Normal (σn):</span>
              <strong className="text-slate-800">{sr.normalStressKgCm2.toFixed(3)} kg/cm² ({sr.normalStressKpa.toFixed(1)} kPa)</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Pergeseran Puncak (Δx):</span>
              <strong className="text-slate-800">{sr.peakDisplacementMm.toFixed(2)} mm</strong>
            </div>
            <div className="pt-1 border-t border-purple-200 flex items-center justify-between text-xs font-bold text-purple-950">
              <span>Tegangan Geser Puncak (τf):</span>
              <span className="text-sm font-black text-purple-700 font-mono">{sr.peakShearStressKgCm2.toFixed(3)} kg/cm²</span>
            </div>
          </div>
        ))}
      </div>

      {/* HERO FINAL RESULT BANNER FOR KOHESI & SUDUT GESER DALAM */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-purple-700">
        <div>
          <div className="text-[10.5px] font-mono font-bold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            HASIL UJI KUNCI — PARAMETER KUAT GESER TERKONSOLIDASI (SNI 2813:2008)
          </div>
          <div className="flex items-baseline gap-6 mt-1">
            <div>
              <span className="text-xs text-purple-200 block uppercase font-mono">Kohesi Terkonsolidasi (c_cu):</span>
              <span className="text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span>{regResult.cohesionCcu.toFixed(3)} kg/cm²</span>
                <span className="text-xs font-normal text-purple-200">({regResult.cohesionCcuKpa.toFixed(1)} kPa)</span>
              </span>
            </div>
            <div className="border-l border-purple-700 pl-4">
              <span className="text-xs text-purple-200 block uppercase font-mono">Sudut Geser Dalam (φ_cu):</span>
              <span className="text-3xl font-black font-mono text-amber-300">
                {regResult.frictionAnglePhicu.toFixed(2)} °
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-200 font-medium mt-1">
            Persamaan Keruntuhan Mohr-Coulomb: τ_f = {regResult.cohesionCcu.toFixed(3)} + σ_n · tan({regResult.frictionAnglePhicu.toFixed(2)}°) (R² = {regResult.rSquared.toFixed(4)})
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-right shrink-0">
          <div className="text-[10px] font-mono text-purple-300">Garis Failure Envelope:</div>
          <div className="text-xs font-mono font-bold text-white mt-0.5">
            τ = {regResult.cohesionCcu.toFixed(3)} + {regResult.slope.toFixed(4)} · σn
          </div>
        </div>
      </div>

      {/* SECTION TITLE FOR INTERACTIVE CHARTS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Kurva Uji Kuat Geser DS CU (SNI 2813:2008)
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-500">3-Specimen DS CU Charts</span>
      </div>

      {/* GRAFIK 1 & GRAFIK 2 INTERACTIVE SVG CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAFIK 1: TEGANGAN GESER (τ) VS PERGESERAN HORIZONTAL (ΔX) */}
        {(() => {
          const maxTau = Math.max(...specResults.flatMap(s => s.readings.map(r => r.shearStressKgCm2)), 0.5);
          const yAxisMax = Math.ceil(maxTau * 1.2 * 10) / 10;

          const paddingL = 45, paddingR = 20, paddingT = 30, paddingB = 35;
          const chartW = 460, chartH = 240;
          const plotW = chartW - paddingL - paddingR;
          const plotH = chartH - paddingT - paddingB;

          const getX = (mm: number) => paddingL + (mm / 10.0) * plotW;
          const getY = (tau: number) => paddingT + plotH - (tau / yAxisMax) * plotH;

          const colors = ['#8B5CF6', '#6366F1', '#2563EB'];

          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Grafik 1: Kurva Tegangan Geser (τ) vs Pergeseran Horizontal (Δx)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Hubungan τ (kg/cm²) Terhadap Δx (mm) 3 Benda Uji</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[9.5px] font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                {specResults.map((sr, idx) => (
                  <span key={idx} className="flex items-center gap-1 font-bold" style={{ color: colors[idx] }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx] }}></span>
                    Titik {idx + 1} (σn = {sr.normalStressKgCm2.toFixed(1)})
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
                          {val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X Ticks */}
                  {[0, 2, 4, 6, 8, 10].map((disp, i) => {
                    const xPos = getX(disp);
                    return (
                      <g key={i}>
                        <line x1={xPos} y1={paddingT} x2={xPos} y2={paddingT + plotH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={xPos} y={paddingT + plotH + 13} fontSize="8" textAnchor="middle" fill="#64748B" className="font-mono">
                          {disp} mm
                        </text>
                      </g>
                    );
                  })}

                  <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Specimen Curves */}
                  {specResults.map((sr, idx) => {
                    const points = sr.readings.map(r => ({ x: getX(r.dialHorizontalMm), y: getY(r.shearStressKgCm2) }));
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

        {/* GRAFIK 2: MOHR-COULOMB FAILURE ENVELOPE (τF VS ΣN) */}
        {(() => {
          const maxNorm = Math.max(...specResults.map(s => s.normalStressKgCm2), 2.0);
          const maxPeak = Math.max(...specResults.map(s => s.peakShearStressKgCm2), 1.0);

          const maxX = Math.ceil(maxNorm * 1.2 * 10) / 10;
          const maxY = Math.ceil(maxPeak * 1.2 * 10) / 10;

          const paddingL = 45, paddingR = 25, paddingT = 30, paddingB = 35;
          const chartW = 460, chartH = 240;
          const plotW = chartW - paddingL - paddingR;
          const plotH = chartH - paddingT - paddingB;

          const getX = (sigma: number) => paddingL + (sigma / maxX) * plotW;
          const getY = (tau: number) => paddingT + plotH - (tau / maxY) * plotH;

          // Regression Line Path
          const startX = 0;
          const startY = regResult.cohesionCcu;
          const endX = maxX;
          const endY = regResult.cohesionCcu + regResult.slope * maxX;

          const linePathD = `M ${getX(startX)} ${getY(startY)} L ${getX(endX)} ${getY(endY)}`;

          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Grafik 2: Garis Keruntuhan Mohr-Coulomb (Failure Envelope)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Penentuan c_cu ({regResult.cohesionCcu.toFixed(3)}) &amp; φ_cu ({regResult.frictionAnglePhicu.toFixed(2)}°)</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9.5px] font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                <span className="flex items-center gap-1 font-bold text-purple-900">
                  <span className="w-3 h-0.5 bg-purple-600 rounded"></span> Garis Failure Envelope Mohr-Coulomb
                </span>
                <span className="font-bold text-amber-800">
                  φ_cu = {regResult.frictionAnglePhicu.toFixed(2)}° | c_cu = {regResult.cohesionCcu.toFixed(3)} kg/cm²
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
                          {val.toFixed(2)}
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
                          {val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}

                  <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Regression Line */}
                  <path d={linePathD} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Data Points */}
                  {specResults.map((sr, idx) => {
                    const px = getX(sr.normalStressKgCm2);
                    const py = getY(sr.peakShearStressKgCm2);
                    return (
                      <g key={idx}>
                        <circle cx={px} cy={py} r="5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                        <text x={px} y={py - 9} fontSize="8" fontWeight="black" textAnchor="middle" fill="#5B21B6" className="font-mono">
                          τf = {sr.peakShearStressKgCm2.toFixed(3)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
