import React, { useState, useEffect } from 'react';
import { Sample, MoldItem, ContainerItem, CalculationStatus } from '../types';
import {
  CBRSoakedFullData,
  CBRSoakedSpecimenData,
  INITIAL_CBR_SOAKED_DATA,
  calculateCBRSoakedSpecimen,
  calculateCBRSoakedRegression,
  CBR_PENETRATION_DEPTHS,
} from '../utils/cbrSoakedHelpers';
import {
  Droplet,
  Sparkles,
  Save,
  RotateCcw,
  RefreshCw,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';

interface CBRSoakedWorksheetProps {
  activeSample: Sample;
  normalizeTestCode: (code: string) => string;
  markDirty: () => void;
  handleSave: (autoAdvance?: boolean) => void;
  cmpMdd?: number;
  cmpOmc?: number;
  compactionTestType?: string;
  moldCatalogue?: MoldItem[];
  containerCatalogue?: ContainerItem[];
}

export const CBRSoakedWorksheet: React.FC<CBRSoakedWorksheetProps> = ({
  activeSample,
  normalizeTestCode,
  markDirty,
  handleSave,
  cmpMdd = 0,
  cmpOmc = 0,
  compactionTestType = 'CMP-STD',
  moldCatalogue = [],
  containerCatalogue = [],
}) => {
  const [cbrData, setCbrData] = useState<CBRSoakedFullData>(() => {
    const testObj = (activeSample.tests || []).find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'CBR-SOK';
    });
    if (testObj?.calculationData?.cbrSoaked) {
      return testObj.calculationData.cbrSoaked;
    }
    return INITIAL_CBR_SOAKED_DATA;
  });

  // Re-sync state when active sample changes
  useEffect(() => {
    const testObj = (activeSample.tests || []).find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'CBR-SOK';
    });
    if (testObj?.calculationData?.cbrSoaked) {
      setCbrData(testObj.calculationData.cbrSoaked);
    } else {
      setCbrData(INITIAL_CBR_SOAKED_DATA);
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
    setCbrData(prev => {
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
      }) as [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];

      if (changed) {
        return { ...prev, specimens: nextSpecs };
      }
      return prev;
    });
  }, [containerCatalogue]);

  // Helper to look up calculated MDD & OMC for compaction method
  const getCompactionForMethod = (method: string) => {
    if (!method || method.includes('--')) {
      return { mdd: 0, omc: 0, hasData: false };
    }

    const isModifiedTarget = method.toLowerCase().includes('modified') || method.toUpperCase().includes('MOD');

    // Search activeSample.tests for matching Compaction test
    const testObj = (activeSample.tests || []).find(t => {
      const rawCode = (t.testTypeCode || t.testTypeId || '').toUpperCase().trim();
      const norm = normalizeTestCode(rawCode);
      const isMod = norm.includes('MOD') || rawCode.includes('MOD');
      
      if (isModifiedTarget) {
        return isMod && (norm.startsWith('CMP') || norm.includes('COMPACTION') || norm.includes('PROCTOR'));
      } else {
        return !isMod && (norm.startsWith('CMP') || norm.includes('COMPACTION') || norm.includes('STD') || norm.includes('PROCTOR'));
      }
    });

    if (testObj && testObj.calculationData) {
      const cd = testObj.calculationData;
      const inputs = cd.inputValues || cd;
      const savedMdd = parseFloat(
        String(cd.mdd || cd.cmpMdd || cd.dryDensityMax || cd.mddVal || inputs.cmpMdd || inputs.dryDensityMax || 0)
      );
      const savedOmc = parseFloat(
        String(cd.omc || cd.cmpOmc || cd.optimumMoisture || cd.omcVal || inputs.cmpOmc || inputs.optimumMoisture || 0)
      );

      if (savedMdd > 0) {
        return {
          mdd: Number(savedMdd.toFixed(3)),
          omc: Number(savedOmc.toFixed(1)),
          hasData: true,
        };
      }
    }

    return { mdd: 0, omc: 0, hasData: false };
  };

  const selectedCompactionData = getCompactionForMethod(cbrData.compactionMethod);

  const handleSyncFromCompaction = () => {
    if (!cbrData.compactionMethod || cbrData.compactionMethod.includes('--')) return;
    const compRes = getCompactionForMethod(cbrData.compactionMethod);
    setCbrData(prev => ({
      ...prev,
      mdd: compRes.hasData ? compRes.mdd : 0,
      omc: compRes.hasData ? compRes.omc : 0,
    }));
    markDirty();
  };

  // Dynamic calculations for the 3 specimens
  const specResults = cbrData.specimens.map(sp =>
    calculateCBRSoakedSpecimen(sp, cbrData.lrc, cbrData.pistonAreaSqInch)
  );

  const regResult = calculateCBRSoakedRegression(
    specResults,
    cbrData.mdd,
    cbrData.targetPctDensity || 95
  );

  // Field Update Handlers
  const handleUpdateSpecimen = (specIdx: number, field: keyof CBRSoakedSpecimenData, value: any) => {
    setCbrData(prev => {
      const nextSpecs = [...prev.specimens] as [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], [field]: value };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleUpdateMcBefore = (specIdx: number, field: string, value: any) => {
    setCbrData(prev => {
      const nextSpecs = [...prev.specimens] as [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];
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
    setCbrData(prev => {
      const nextSpecs = [...prev.specimens] as [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];
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

  const handleUpdateSwell = (specIdx: number, field: string, value: number) => {
    setCbrData(prev => {
      const nextSpecs = [...prev.specimens] as [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];
      const newSwell = { ...(nextSpecs[specIdx].swellData || { initialHeightMm: 116.43, dial0h: 0, dial24h: 0, dial48h: 0, dial72h: 0, dial96h: 0 }), [field]: value };
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], swellData: newSwell };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleUpdateDialReading = (specIdx: number, dialIdx: number, val: number) => {
    setCbrData(prev => {
      const nextSpecs = [...prev.specimens] as [CBRSoakedSpecimenData, CBRSoakedSpecimenData, CBRSoakedSpecimenData];
      const nextReadings = [...nextSpecs[specIdx].dialReadings];
      nextReadings[dialIdx] = val;
      nextSpecs[specIdx] = { ...nextSpecs[specIdx], dialReadings: nextReadings };
      return { ...prev, specimens: nextSpecs };
    });
    markDirty();
  };

  const handleSaveCbrSoakedData = () => {
    let testObj = activeSample.tests.find(t => {
      const c = normalizeTestCode(t.testTypeCode || t.testTypeId || '');
      return c === 'CBR-SOK';
    });

    if (!testObj) {
      testObj = {
        id: `test-cbr-sok-${Date.now()}`,
        testTypeId: 'CBR-SOK',
        testTypeCode: 'CBR-SOK',
        testTypeName: 'CBR Lab Soaked / Dengan Perendaman (SNI 1744:2012)',
        calculationStatus: 'Calculated' as CalculationStatus,
        calculationData: {},
      };
      activeSample.tests.push(testObj);
    }

    testObj.calculationStatus = 'Calculated' as CalculationStatus;
    testObj.calculationData = {
      ...testObj.calculationData,
      cbrSoaked: cbrData,
      specResults,
      regResult,
      designCbrPct: regResult.designCbrPct,
      roundedDesignCbr: regResult.roundedDesignCbr,
      avgSwellPct: regResult.avgSwellPct,
    };
    handleSave();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4 text-xs font-sans">
      {/* BANNER HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-mono font-bold">
              SNI 1744:2012 / ASTM D1883
            </span>
            <span className="text-[10px] text-slate-500 font-mono font-semibold">3-Point Energy CBR with 4-Day Soaking &amp; Swell</span>
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <Droplet className="w-4 h-4 text-blue-600" />
            <span>Uji CBR Laboratorium Dengan Perendaman 4 Hari (CBR Soaked)</span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveCbrSoakedData}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil CBR Soaked</span>
          </button>
        </div>
      </div>

      {/* TOP CONFIGURATION CARD: ACUAN PEMADATAN & BEBAN PERENDAMAN */}
      <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-3.5 space-y-3">
        <div className="text-[11px] font-black uppercase text-blue-950 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>Parameter Acuan Pemadatan &amp; Perendaman</span>
          </span>
          <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
            Target: {cbrData.targetPctDensity}% MDD
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          {/* Method Dropdown */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Metode Pemadatan Acuan:</label>
            <select
              value={cbrData.compactionMethod || ''}
              onChange={e => {
                const method = e.target.value;
                if (!method || method.includes('--')) {
                  setCbrData(prev => ({
                    ...prev,
                    compactionMethod: '',
                    mdd: 0,
                    omc: 0,
                  }));
                } else {
                  const compRes = getCompactionForMethod(method);
                  setCbrData(prev => ({
                    ...prev,
                    compactionMethod: method,
                    mdd: compRes.hasData ? compRes.mdd : 0,
                    omc: compRes.hasData ? compRes.omc : 0,
                  }));
                }
                markDirty();
              }}
              className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="">-- Pilih Metode Pemadatan --</option>
              <option value="Standard Proctor">Standard Proctor (SNI 1742:2008)</option>
              <option value="Modified Proctor">Modified Proctor (SNI 2828:2008)</option>
            </select>
          </div>

          {/* MDD Input & Auto-Sync */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-bold text-slate-700 font-sans">Kepadatan Kering Maks (MDD):</label>
              {selectedCompactionData.hasData && (
                <button
                  type="button"
                  onClick={handleSyncFromCompaction}
                  className="text-[9.5px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-0.5"
                  title="Ambil nilai MDD & OMC dari pengujian Pemadatan"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Sync</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                value={cbrData.mdd || ''}
                onChange={e => {
                  setCbrData(prev => ({ ...prev, mdd: parseFloat(e.target.value) || 0 }));
                  markDirty();
                }}
                placeholder="mis. 1.240"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-sans">g/cm³</span>
            </div>
          </div>

          {/* OMC Input */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Kadar Air Optimum (OMC):</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={cbrData.omc || ''}
                onChange={e => {
                  setCbrData(prev => ({ ...prev, omc: parseFloat(e.target.value) || 0 }));
                  markDirty();
                }}
                placeholder="mis. 16.5"
                className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
              <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 font-sans">%</span>
            </div>
          </div>

          {/* Surcharge & Soaking Duration */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold text-slate-700 font-sans block">Beban Surcharge &amp; Perendaman:</label>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="bg-white border border-slate-200 p-1 rounded-lg text-center">
                <span className="text-slate-500 block">Surcharge:</span>
                <strong className="text-blue-900">{cbrData.surchargeMassKg || 4.54} kg</strong>
              </div>
              <div className="bg-white border border-slate-200 p-1 rounded-lg text-center">
                <span className="text-slate-500 block">Durasi:</span>
                <strong className="text-blue-900">{cbrData.soakingDurationDays || 4} Hari</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE 1: SPECIMEN MOULD & MOISTURE CONTENT BEFORE SOAKING */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>1. DATA CETAK BENDA UJI &amp; KADAR AIR SEBELUM PERENDAMAN (W_CETAK)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">SNI 1744:2012 / SNI 1965:2008</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Benda Uji</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-blue-100/70 border-l border-slate-200 font-sans">10 TUMBUKAN</th>
                <th className="py-2 px-2 text-center bg-amber-100/70 border-l border-slate-200 font-sans">25 TUMBUKAN</th>
                <th className="py-2 px-2 text-center bg-emerald-100/70 border-l border-slate-200 font-sans">56 TUMBUKAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Mould Code */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Kode Cetakan (Mould Code)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="text"
                      value={sp.moldCode || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'moldCode', e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center font-bold p-1 text-slate-900"
                      placeholder={`Mold ${idx + 1}`}
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Wet Soil + Mould */}
              <tr className="bg-blue-50/30">
                <td className="py-1.5 px-3 font-sans font-bold text-slate-900">Berat Cetakan + Tanah Basah (Sebelum Soaking)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      value={sp.massWetSoilMould || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'massWetSoilMould', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded text-center font-bold p-1 text-blue-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Mould */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Berat Cetakan (Mass of Mould)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      value={sp.massMould || ''}
                      onChange={e => handleUpdateSpecimen(idx, 'massMould', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Volume Mould */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Volume Cetakan (Mould Volume)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">cm³</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      value={sp.volMould || 2124}
                      onChange={e => handleUpdateSpecimen(idx, 'volMould', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center p-1 text-slate-800"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Code Before */}
              <tr className="bg-slate-50">
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Kode Cawan Kadar Air (Cetak)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {cbrData.specimens.map((sp, idx) => (
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
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Basah (Cetak)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcBefore.massWetContainer || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'massWetContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Dry Soil + Container Before */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Kering (Cetak)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcBefore.massDryContainer || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'massDryContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Mass Before */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan Kosong (Cetak)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcBefore.massContainer || ''}
                      onChange={e => handleUpdateMcBefore(idx, 'massContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Calculated MC Before */}
              <tr className="bg-blue-100/60 font-bold text-blue-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kadar Air Cetak (w_cetak)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-blue-900">
                    {sr.mcBeforePct > 0 ? `${sr.mcBeforePct.toFixed(2)} %` : '-'}
                  </td>
                ))}
              </tr>

              {/* Initial Dry Density Before */}
              <tr className="bg-cyan-100/70 font-bold text-cyan-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kepadatan Kering Cetak (γd1)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">g/cm³</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-cyan-950">
                    {sr.dryDensity > 0 ? sr.dryDensity.toFixed(4) : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: SWELL DIAL READINGS OVER 4 DAYS (96 HOURS) - SNI 1744:2012 */}
      <div className="bg-white border border-blue-300 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-blue-100 pb-2">
          <h4 className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-blue-600" />
            <span>2. TABEL PENGUKURAN PENGEMBANGAN (SWELL DIAL READINGS 4 HARI / 96 JAM)</span>
          </h4>
          <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            SNI 1744:2012 Pasal 6.3
          </span>
        </div>

        <div className="overflow-x-auto border border-blue-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-blue-900 text-white font-extrabold border-b border-blue-950 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Waktu Perendaman (Soaking Time)</th>
                <th className="py-2 px-2 text-center w-12 border-l border-blue-800 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-blue-800 border-l border-blue-700 font-sans">10 TUMBUKAN</th>
                <th className="py-2 px-2 text-center bg-amber-800 border-l border-blue-700 font-sans">25 TUMBUKAN</th>
                <th className="py-2 px-2 text-center bg-emerald-800 border-l border-blue-700 font-sans">56 TUMBUKAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-100 text-[11px]">
              {/* Initial Sample Height h0 */}
              <tr className="bg-slate-50">
                <td className="py-1.5 px-3 font-sans font-bold text-slate-800">Tinggi Awal Sampel Tanah (h₀)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.swellData?.initialHeightMm || sp.heightMould || 116.43}
                      onChange={e => handleUpdateSwell(idx, 'initialHeightMm', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-900 font-bold"
                    />
                  </td>
                ))}
              </tr>

              {/* Dial 0 Hours */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Pembacaan Dial 0 Jam (Awal Perendaman)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.swellData?.dial0h || 0}
                      onChange={e => handleUpdateSwell(idx, 'dial0h', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-300 rounded text-center p-1 text-slate-900"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>

              {/* Dial 24 Hours */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Pembacaan Dial 24 Jam (Hari ke-1)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.swellData?.dial24h || 0}
                      onChange={e => handleUpdateSwell(idx, 'dial24h', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>

              {/* Dial 48 Hours */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Pembacaan Dial 48 Jam (Hari ke-2)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.swellData?.dial48h || 0}
                      onChange={e => handleUpdateSwell(idx, 'dial48h', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>

              {/* Dial 72 Hours */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Pembacaan Dial 72 Jam (Hari ke-3)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.swellData?.dial72h || 0}
                      onChange={e => handleUpdateSwell(idx, 'dial72h', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>

              {/* Dial 96 Hours (Akhir Soaking) */}
              <tr className="bg-blue-50/70">
                <td className="py-1.5 px-3 font-sans font-bold text-blue-950">Pembacaan Dial 96 Jam (Akhir Perendaman 4 Hari)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.swellData?.dial96h || 0}
                      onChange={e => handleUpdateSwell(idx, 'dial96h', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-blue-400 rounded text-center font-black p-1 text-blue-900 focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </td>
                ))}
              </tr>

              {/* Delta H Swell */}
              <tr className="bg-blue-100/50">
                <td className="py-2 px-3 font-sans font-bold text-blue-900">Pertambahan Tinggi / Swell (Δh = Dial96 - Dial0)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">mm</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-extrabold text-blue-900">
                    {sr.deltaHSwelledMm.toFixed(2)} mm
                  </td>
                ))}
              </tr>

              {/* PERCENT SWELL (HERO HIGHLIGHTED ROW) */}
              <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black">
                <td className="py-2.5 px-3 font-sans font-black uppercase text-xs">PERSEN PENGEMBANGAN (% SWELL)</td>
                <td className="py-2.5 px-2 text-center border-l border-white/30 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2.5 px-2 text-center border-l border-white/30 text-sm font-mono font-black text-amber-300">
                    {sr.swellPct.toFixed(2)} %
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 3: MOISTURE CONTENT AFTER SOAKING (W_SOAKED) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-cyan-600" />
            <span>3. KADAR AIR SETELAH PERENDAMAN 4 HARI (W_SOAKED)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">SNI 1965:2008 / ASTM D2216</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-left w-56 font-sans">Parameter Kadar Air Setelah Perendaman</th>
                <th className="py-2 px-2 text-center w-12 border-l border-slate-200 font-sans">Sat.</th>
                <th className="py-2 px-2 text-center bg-blue-100/70 border-l border-slate-200 font-sans">10 TUMBUKAN</th>
                <th className="py-2 px-2 text-center bg-amber-100/70 border-l border-slate-200 font-sans">25 TUMBUKAN</th>
                <th className="py-2 px-2 text-center bg-emerald-100/70 border-l border-slate-200 font-sans">56 TUMBUKAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {/* Container Code After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Kode Cawan Kadar Air (Setelah Soaking)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">-</td>
                {cbrData.specimens.map((sp, idx) => (
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
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Basah (Setelah Soaking)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcAfter.massWetContainer || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'massWetContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Mass Dry Soil + Container After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan + Tanah Kering (Setelah Soaking)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcAfter.massDryContainer || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'massDryContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Container Mass After */}
              <tr>
                <td className="py-1.5 px-3 font-sans font-semibold text-slate-700">Berat Cawan Kosong (Setelah Soaking)</td>
                <td className="py-1.5 px-2 text-center border-l border-slate-200 text-slate-500 font-sans">g</td>
                {cbrData.specimens.map((sp, idx) => (
                  <td key={idx} className="py-1.5 px-2 border-l border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={sp.mcAfter.massContainer || ''}
                      onChange={e => handleUpdateMcAfter(idx, 'massContainer', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded text-center p-1 text-slate-800"
                      placeholder="g"
                    />
                  </td>
                ))}
              </tr>

              {/* Calculated MC After */}
              <tr className="bg-cyan-100/60 font-bold text-cyan-950">
                <td className="py-2 px-3 font-sans font-extrabold">Kadar Air Setelah Perendaman (w_soaked)</td>
                <td className="py-2 px-2 text-center border-l border-slate-200 font-sans">%</td>
                {specResults.map((sr, idx) => (
                  <td key={idx} className="py-2 px-2 text-center border-l border-slate-200 font-black text-cyan-900">
                    {sr.mcAfterPct > 0 ? `${sr.mcAfterPct.toFixed(2)} %` : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 4: PENETRATION DIAL READINGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span>4. TABEL UJI PENETRASI PISTON CBR (PENETRATION DIAL READINGS)</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold">LRC = {cbrData.lrc} Lbf/div</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-center border-collapse font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200 text-[10px] uppercase">
                <th className="py-2 px-2 text-left font-sans w-24">Penetrasi (inch)</th>
                <th className="py-2 px-2 text-left font-sans w-24 border-l border-slate-200">Penetrasi (mm)</th>
                <th className="py-2 px-2 bg-blue-100/70 border-l border-slate-200 font-sans" colSpan={3}>10 TUMBUKAN</th>
                <th className="py-2 px-2 bg-amber-100/70 border-l border-slate-200 font-sans" colSpan={3}>25 TUMBUKAN</th>
                <th className="py-2 px-2 bg-emerald-100/70 border-l border-slate-200 font-sans" colSpan={3}>56 TUMBUKAN</th>
              </tr>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[9.5px]">
                <th className="py-1 px-2 text-left">inch</th>
                <th className="py-1 px-2 text-left border-l border-slate-200">mm</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-blue-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">Beban (lbs)</th>
                <th className="py-1 px-1 text-blue-900">Stress (psi)</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-amber-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">Beban (lbs)</th>
                <th className="py-1 px-1 text-amber-900">Stress (psi)</th>

                <th className="py-1 px-1 border-l border-slate-200 bg-emerald-50/50">Dial (div)</th>
                <th className="py-1 px-1 text-slate-500">Beban (lbs)</th>
                <th className="py-1 px-1 text-emerald-900">Stress (psi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {CBR_PENETRATION_DEPTHS.map((depth, dIdx) => {
                const isKey01 = Math.abs(depth.inch - 0.100) < 0.001;
                const isKey02 = Math.abs(depth.inch - 0.200) < 0.001;
                const isKeyRow = isKey01 || isKey02;

                return (
                  <tr key={dIdx} className={isKeyRow ? 'bg-amber-100/60 font-black' : ''}>
                    <td className="py-1.5 px-2 text-left font-bold text-slate-800 font-sans">
                      {depth.inch.toFixed(4)}"
                    </td>
                    <td className="py-1.5 px-2 text-left border-l border-slate-200 text-slate-600 font-mono">
                      {depth.mm.toFixed(2)} mm
                      {isKey01 && <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-black">0.1"</span>}
                      {isKey02 && <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-black">0.2"</span>}
                    </td>

                    {/* Specimen 0 (10x) */}
                    <td className="py-1.5 px-1 border-l border-slate-200">
                      <input
                        type="number"
                        step="0.5"
                        value={cbrData.specimens[0].dialReadings[dIdx] || ''}
                        onChange={e => handleUpdateDialReading(0, dIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">{specResults[0].penetrations[dIdx].loadLbs > 0 ? specResults[0].penetrations[dIdx].loadLbs.toFixed(1) : '0.0'}</td>
                    <td className="py-1.5 px-1 text-blue-900 font-bold">{specResults[0].penetrations[dIdx].stressPsi > 0 ? specResults[0].penetrations[dIdx].stressPsi.toFixed(1) : '0.0'}</td>

                    {/* Specimen 1 (25x) */}
                    <td className="py-1.5 px-1 border-l border-slate-200">
                      <input
                        type="number"
                        step="0.5"
                        value={cbrData.specimens[1].dialReadings[dIdx] || ''}
                        onChange={e => handleUpdateDialReading(1, dIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">{specResults[1].penetrations[dIdx].loadLbs > 0 ? specResults[1].penetrations[dIdx].loadLbs.toFixed(1) : '0.0'}</td>
                    <td className="py-1.5 px-1 text-amber-900 font-bold">{specResults[1].penetrations[dIdx].stressPsi > 0 ? specResults[1].penetrations[dIdx].stressPsi.toFixed(1) : '0.0'}</td>

                    {/* Specimen 2 (56x) */}
                    <td className="py-1.5 px-1 border-l border-slate-200">
                      <input
                        type="number"
                        step="0.5"
                        value={cbrData.specimens[2].dialReadings[dIdx] || ''}
                        onChange={e => handleUpdateDialReading(2, dIdx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-white border border-slate-200 rounded text-center p-0.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-1.5 px-1 text-slate-600">{specResults[2].penetrations[dIdx].loadLbs > 0 ? specResults[2].penetrations[dIdx].loadLbs.toFixed(1) : '0.0'}</td>
                    <td className="py-1.5 px-1 text-emerald-900 font-bold">{specResults[2].penetrations[dIdx].stressPsi > 0 ? specResults[2].penetrations[dIdx].stressPsi.toFixed(1) : '0.0'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULTS SUMMARY CARDS & DESIGN CBR HIGHLIGHT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {specResults.map((sr, idx) => (
          <div key={idx} className="p-3 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-1.5">
            <div className="text-[10.5px] font-black uppercase text-blue-950 flex items-center justify-between">
              <span>Titik {idx + 1} ({sr.blows} Tumbukan)</span>
              <span className="font-mono text-blue-800">{sr.dryDensity.toFixed(4)} g/cm³</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Persen Swell:</span>
              <strong className="text-blue-900 font-bold">{sr.swellPct.toFixed(2)} %</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">CBR @ 0.1":</span>
              <strong className="text-slate-800">{sr.cbr01Pct.toFixed(1)} %</strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">CBR @ 0.2":</span>
              <strong className="text-slate-800">{sr.cbr02Pct.toFixed(1)} %</strong>
            </div>
            <div className="pt-1 border-t border-blue-200 flex items-center justify-between text-xs font-bold text-blue-950">
              <span>CBR Terpilih:</span>
              <span className="text-sm font-black text-blue-700 font-mono">{sr.selectedCbrPct.toFixed(1)} %</span>
            </div>
          </div>
        ))}
      </div>

      {/* DESIGN CBR FINAL RESULT HERO BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg border border-blue-700">
        <div>
          <div className="text-[10.5px] font-mono font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            HASIL UJI KUNCI — DESIGN CBR SOAKED &amp; SWELL (SNI 1744:2012)
          </div>
          <div className="flex items-baseline gap-6 mt-1">
            <div>
              <span className="text-xs text-blue-200 block uppercase font-mono">Design CBR:</span>
              <span className="text-3xl font-black font-mono text-white flex items-baseline gap-1.5">
                <span>{regResult.roundedDesignCbr} %</span>
                <span className="text-xs font-normal text-cyan-200">({regResult.designCbrPct.toFixed(2)}% Exact)</span>
              </span>
            </div>
            <div className="border-l border-blue-700 pl-4">
              <span className="text-xs text-blue-200 block uppercase font-mono">Rata-Rata Swell:</span>
              <span className="text-2xl font-black font-mono text-amber-300">
                {regResult.avgSwellPct.toFixed(2)} %
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-200 font-medium mt-1">
            Ditentukan pada Target Kepadatan {cbrData.targetPctDensity || 95}% MDD ({regResult.targetDensity.toFixed(2)} g/cm³) setelah perendaman 4 hari (96 jam).
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20 text-right shrink-0">
          <div className="text-[10px] font-mono text-cyan-300">Persamaan Kurva Regresi:</div>
          <div className="text-xs font-mono font-bold text-white mt-0.5">
            y = {regResult.a.toFixed(2)}x² + {regResult.b.toFixed(2)}x + {regResult.c.toFixed(2)}
          </div>
        </div>
      </div>

      {/* SECTION TITLE FOR INTERACTIVE CHARTS */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Kurva Uji Penetrasi &amp; Design CBR Soaked (SNI 1744:2012)
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-500">3-Point Energy CBR Charts</span>
      </div>

      {/* GRAFIK 1: 3 SIDE-BY-SIDE PENETRATION CHARTS FOR 10x, 25x, 56x BLOWS */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
          <span>Grafik 1: Kurva Penetrasi Beban &amp; Tegangan (3 Variasi Tumbukan Per Lapis)</span>
          <span className="text-[10px] font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            --- Penetrasi Acuan 0.1" &amp; 0.2"
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {[
            { idx: 0, title: "Titik 1 (10 Tumbukan)", color: "#2563EB", border: "border-blue-200", bg: "bg-blue-50/50", text: "text-blue-800" },
            { idx: 1, title: "Titik 2 (25 Tumbukan)", color: "#D97706", border: "border-amber-200", bg: "bg-amber-50/50", text: "text-amber-800" },
            { idx: 2, title: "Titik 3 (56 Tumbukan)", color: "#059669", border: "border-emerald-200", bg: "bg-emerald-50/50", text: "text-emerald-800" },
          ].map((cfg) => {
            const spec = specResults[cfg.idx];
            const specInfo = cbrData.specimens[cfg.idx];
            const allStresses = specResults.flatMap(s => s.penetrations.map(p => p.stressPsi));
            const maxStressVal = Math.max(...allStresses, 100);
            const yAxisMax = Math.ceil(maxStressVal / 100) * 100 + 50;

            const paddingL = 40, paddingR = 15, paddingT = 25, paddingB = 35;
            const chartW = 320, chartH = 210;
            const plotW = chartW - paddingL - paddingR;
            const plotH = chartH - paddingT - paddingB;

            const getX = (mm: number) => paddingL + (mm / 12.7) * plotW;
            const getY = (stress: number) => paddingT + plotH - (stress / yAxisMax) * plotH;

            const yTicks = [0, yAxisMax * 0.33, yAxisMax * 0.66, yAxisMax];
            const xTicks = [
              { inch: 0.0, mm: 0 },
              { inch: 0.1, mm: 2.54 },
              { inch: 0.2, mm: 5.08 },
              { inch: 0.3, mm: 7.62 },
              { inch: 0.4, mm: 10.16 },
              { inch: 0.5, mm: 12.7 }
            ];

            const points = spec.penetrations.map(p => ({ x: getX(p.mm), y: getY(p.stressPsi), stress: p.stressPsi, inch: p.inch }));
            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            const pt01 = spec.penetrations.find(p => p.inch === 0.1);
            const pt02 = spec.penetrations.find(p => p.inch === 0.2);

            return (
              <div key={cfg.idx} className={`bg-white p-3 rounded-2xl border ${cfg.border} shadow-2xs space-y-2`}>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className={`text-xs font-black ${cfg.text} flex items-center gap-1.5`}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }}></span>
                    {cfg.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Mold {specInfo.moldCode}</span>
                </div>

                {/* MINI STATS BAR */}
                <div className={`grid grid-cols-2 gap-1 text-[9.5px] font-mono p-1.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                  <div>0.1": <strong className={cfg.text}>{pt01 ? pt01.stressPsi.toFixed(0) : 0} psi</strong> ({(spec?.cbr01Pct ?? 0).toFixed(1)}%)</div>
                  <div>0.2": <strong className={cfg.text}>{pt02 ? pt02.stressPsi.toFixed(0) : 0} psi</strong> ({(spec?.cbr02Pct ?? 0).toFixed(1)}%)</div>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-44 bg-slate-50/70 rounded-xl border border-slate-200">
                    {/* Y Grid & Standard Ticks */}
                    {yTicks.map((tickVal, i) => {
                      const yPos = getY(tickVal);
                      return (
                        <g key={i}>
                          <line x1={paddingL} y1={yPos} x2={chartW - paddingR} y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                          <text x={paddingL - 4} y={yPos + 3} fontSize="8" textAnchor="end" fill="#64748B" className="font-mono">
                            {Math.round(tickVal)}
                          </text>
                        </g>
                      );
                    })}

                    {/* X Grid & Standard Ticks */}
                    {xTicks.map((xt, i) => {
                      const xPos = getX(xt.mm);
                      return (
                        <g key={i}>
                          <line
                            x1={xPos}
                            y1={paddingT}
                            x2={xPos}
                            y2={paddingT + plotH}
                            stroke="#E2E8F0"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                          <text x={xPos} y={paddingT + plotH + 12} fontSize="8" textAnchor="middle" fill="#64748B" className="font-mono">
                            {xt.inch.toFixed(1)}"
                          </text>
                        </g>
                      );
                    })}

                    {/* Axis Borders */}
                    <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.2" />
                    <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.2" />

                    {/* Curve Path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={cfg.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* PERPOTONGAN SUMBU X & Y UNTUK PENETRASI 0.1" (2.54 mm) */}
                    {pt01 && (() => {
                      const x01 = getX(2.54);
                      const y01 = getY(pt01.stressPsi);
                      return (
                        <g key="inter-01">
                          <line x1={x01} y1={paddingT + plotH} x2={x01} y2={y01} stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 2" />
                          <line x1={paddingL} y1={y01} x2={x01} y2={y01} stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 2" />
                          <rect x={paddingL - 34} y={y01 - 6} width="30" height="12" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.8" />
                          <text x={paddingL - 19} y={y01 + 3} fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="#92400E" className="font-mono">
                            {pt01.stressPsi.toFixed(0)}
                          </text>
                          <circle cx={x01} cy={y01} r="4.5" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      );
                    })()}

                    {/* PERPOTONGAN SUMBU X & Y UNTUK PENETRASI 0.2" (5.08 mm) */}
                    {pt02 && (() => {
                      const x02 = getX(5.08);
                      const y02 = getY(pt02.stressPsi);
                      return (
                        <g key="inter-02">
                          <line x1={x02} y1={paddingT + plotH} x2={x02} y2={y02} stroke="#EA580C" strokeWidth="1.5" strokeDasharray="3 2" />
                          <line x1={paddingL} y1={y02} x2={x02} y2={y02} stroke="#EA580C" strokeWidth="1.5" strokeDasharray="3 2" />
                          <rect x={paddingL - 34} y={y02 - 6} width="30" height="12" rx="2" fill="#FFEDD5" stroke="#EA580C" strokeWidth="0.8" />
                          <text x={paddingL - 19} y={y02 + 3} fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="#9A3412" className="font-mono">
                            {pt02.stressPsi.toFixed(0)}
                          </text>
                          <circle cx={x02} cy={y02} r="4.5" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                      );
                    })()}

                    {/* Regular Points */}
                    {points.map((pt, pIdx) => {
                      const isKeyPoint = pt.inch === 0.1 || pt.inch === 0.2;
                      if (isKeyPoint) return null;
                      return (
                        <circle
                          key={pIdx}
                          cx={pt.x}
                          cy={pt.y}
                          r="2"
                          fill={cfg.color}
                          stroke="#FFFFFF"
                          strokeWidth="1"
                        />
                      );
                    })}

                    <text x={paddingL + plotW / 2} y={chartH - 3} fontSize="8" textAnchor="middle" fill="#475569" fontWeight="bold">
                      Penetrasi (inch)
                    </text>
                    <text x="10" y={paddingT + plotH / 2} fontSize="8" textAnchor="middle" fill="#475569" fontWeight="bold" transform={`rotate(-90 10 ${paddingT + plotH / 2})`}>
                      Tegangan (psi)
                    </text>
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRAFIK 2 & GRAFIK 3: DESIGN CBR REGRESSION & SWELL CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* GRAFIK 2: DESIGN CBR CURVE WITH POLYNOMIAL FIT */}
        {(() => {
          const allXs = [...regResult.points.map(p => p.x), regResult.targetDensity];
          const allYs = [...regResult.points.map(p => p.y), regResult.designCbrPct];

          const minXVal = Math.min(...allXs);
          const maxXVal = Math.max(...allXs);
          const minYVal = Math.min(...allYs);
          const maxYVal = Math.max(...allYs);

          const marginX = Math.max((maxXVal - minXVal) * 0.25, 0.03);
          const marginY = Math.max((maxYVal - minYVal) * 0.25, 5);

          const minXRaw = minXVal - marginX;
          const maxXRaw = maxXVal + marginX;
          const minYRaw = Math.max(0, minYVal - marginY);
          const maxYRaw = maxYVal + marginY;

          const minX = Math.floor(minXRaw * 50) / 50;
          const maxX = Math.ceil(maxXRaw * 50) / 50;
          const minY = Math.floor(minYRaw / 5) * 5;
          const maxY = Math.ceil(maxYRaw / 5) * 5;

          const paddingL = 48, paddingR = 25, paddingT = 32, paddingB = 38;
          const chartW = 460, chartH = 240;
          const plotW = chartW - paddingL - paddingR;
          const plotH = chartH - paddingT - paddingB;

          const getX = (d: number) => paddingL + ((d - minX) / (maxX - minX)) * plotW;
          const getY = (cbr: number) => paddingT + plotH - ((cbr - minY) / (maxY - minY)) * plotH;

          const curvePathPoints: Array<{ x: number; y: number }> = [];
          const steps = 30;
          for (let step = 0; step <= steps; step++) {
            const curX = minX + (step / steps) * (maxX - minX);
            const curY = regResult.a * Math.pow(curX, 2) + regResult.b * curX + regResult.c;
            if (curY >= minY && curY <= maxY) {
              curvePathPoints.push({ x: getX(curX), y: getY(curY) });
            }
          }
          const curveD = curvePathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

          const targetXPos = getX(regResult.targetDensity);
          const targetYPos = getY(regResult.designCbrPct);

          const yTicks = [0, 1, 2, 3, 4].map(i => minY + (i / 4) * (maxY - minY));
          const xTicks = [0, 1, 2, 3, 4].map(i => minX + (i / 4) * (maxX - minX));

          const pointColors = ['#2563EB', '#D97706', '#059669'];
          const blowLabels = ['10 Tumbukan', '25 Tumbukan', '56 Tumbukan'];

          const isTargetNearRight = targetXPos > chartW - 140;
          const calloutX = isTargetNearRight ? targetXPos - 130 : targetXPos + 10;
          const calloutY = Math.max(paddingT + 2, Math.min(targetYPos - 25, plotH - 35));

          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Grafik 2: Kurva Design CBR vs Kepadatan Kering (γd)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Penentuan Design CBR Soaked pada Target {cbrData.targetPctDensity || 95}% MDD</div>
                </div>
                <span className="text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold border border-blue-200">
                  Target: {regResult.targetDensity.toFixed(3)} g/cm³
                </span>
              </div>

              <div className="flex items-center justify-between text-[9.5px] font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-bold text-blue-800">
                    <span className="w-3 h-0.5 bg-blue-600 rounded"></span> Kurva Regresi CBR
                  </span>
                  <span className="flex items-center gap-1 font-bold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> 10x
                  </span>
                  <span className="flex items-center gap-1 font-bold text-amber-700">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span> 25x
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 56x
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 bg-slate-50/70 rounded-xl border border-slate-200">
                  {yTicks.map((tickVal, i) => {
                    const yPos = getY(tickVal);
                    return (
                      <g key={i}>
                        <line x1={paddingL} y1={yPos} x2={chartW - paddingR} y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={paddingL - 5} y={yPos + 3} fontSize="8" textAnchor="end" fill="#64748B" className="font-mono">
                          {Math.round(tickVal)}%
                        </text>
                      </g>
                    );
                  })}

                  {xTicks.map((tickVal, i) => {
                    const xPos = getX(tickVal);
                    return (
                      <g key={i}>
                        <line x1={xPos} y1={paddingT} x2={xPos} y2={paddingT + plotH} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={xPos} y={paddingT + plotH + 13} fontSize="8" textAnchor="middle" fill="#64748B" className="font-mono">
                          {tickVal.toFixed(3)}
                        </text>
                      </g>
                    );
                  })}

                  <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />

                  {curveD && (
                    <path
                      d={curveD}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {regResult.points.map((pt, i) => {
                    const px = getX(pt.x);
                    const py = getY(pt.y);
                    const color = pointColors[i] || '#2563EB';
                    const textY = i === 1 ? py + 15 : py - 10;

                    return (
                      <g key={i}>
                        <circle cx={px} cy={py} r="5" fill={color} stroke="#FFFFFF" strokeWidth="2" />
                        <text x={px} y={textY} fontSize="7.5" fontWeight="bold" textAnchor="middle" fill={color} className="font-mono">
                          {pt.y.toFixed(1)}%
                        </text>
                      </g>
                    );
                  })}

                  <line x1={targetXPos} y1={paddingT} x2={targetXPos} y2={paddingT + plotH} stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" />
                  <circle cx={targetXPos} cy={targetYPos} r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                  <g transform={`translate(${calloutX}, ${calloutY})`}>
                    <rect x="0" y="0" width="124" height="32" rx="5" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1" />
                    <text x="62" y="13" fontSize="9" fontWeight="900" textAnchor="middle" fill="#DC2626" className="font-mono">
                      DESIGN CBR: {regResult.roundedDesignCbr}%
                    </text>
                    <text x="62" y="25" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="#991B1B" className="font-mono">
                      Exact {regResult.designCbrPct.toFixed(2)}% @ {regResult.targetDensity.toFixed(3)} g/cm³
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          );
        })()}

        {/* GRAFIK 3: SWELL (%) VS KEPADATAN KERING / TUMBUKAN */}
        {(() => {
          const maxSwellVal = Math.max(...specResults.map(s => s.swellPct), 1.0);
          const yMaxSwell = Math.ceil(maxSwellVal * 1.3 * 10) / 10;

          const paddingL = 40, paddingR = 25, paddingT = 32, paddingB = 38;
          const chartW = 460, chartH = 240;
          const plotW = chartW - paddingL - paddingR;
          const plotH = chartH - paddingT - paddingB;

          const getYSwell = (sw: number) => paddingT + plotH - (sw / yMaxSwell) * plotH;
          const swellPoints = specResults.map((sr, idx) => ({
            x: paddingL + (idx + 0.5) * (plotW / 3),
            y: getYSwell(sr.swellPct),
            blows: sr.blows,
            swellPct: sr.swellPct,
          }));

          const swellPathD = swellPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

          return (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">Grafik 3: Kurva Persen Pengembangan (% Swell 4 Hari)</div>
                  <div className="text-[10px] text-slate-500 font-mono">Pengaruh Energi Pemadatan Terhadap % Swell (SNI 1744:2012)</div>
                </div>
                <span className="text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded font-mono font-bold border border-amber-200">
                  Rata-Rata Swell: {regResult.avgSwellPct.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[9.5px] font-mono bg-slate-50 p-1.5 rounded-xl border border-slate-200/80">
                <span className="flex items-center gap-1 font-bold text-amber-800">
                  <span className="w-3 h-0.5 bg-amber-600 rounded"></span> Persen Swell Per Variasi Tumbukan
                </span>
              </div>

              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52 bg-slate-50/70 rounded-xl border border-slate-200">
                  {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
                    const val = yMaxSwell * frac;
                    const yPos = getYSwell(val);
                    return (
                      <g key={i}>
                        <line x1={paddingL} y1={yPos} x2={chartW - paddingR} y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                        <text x={paddingL - 5} y={yPos + 3} fontSize="8" textAnchor="end" fill="#64748B" className="font-mono">
                          {val.toFixed(2)}%
                        </text>
                      </g>
                    );
                  })}

                  <line x1={paddingL} y1={paddingT} x2={paddingL} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />
                  <line x1={paddingL} y1={paddingT + plotH} x2={chartW - paddingR} y2={paddingT + plotH} stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Swell Curve */}
                  <path d={swellPathD} fill="none" stroke="#D97706" strokeWidth="2.5" strokeDasharray="5 3" />

                  {/* Swell Data Points & Bar Visuals */}
                  {swellPoints.map((pt, i) => (
                    <g key={i}>
                      {/* Bar Fill */}
                      <rect
                        x={pt.x - 16}
                        y={pt.y}
                        width="32"
                        height={paddingT + plotH - pt.y}
                        fill="#FEF3C7"
                        stroke="#F59E0B"
                        strokeWidth="1"
                        rx="2"
                        opacity="0.8"
                      />
                      {/* Top Point */}
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
                      {/* Value Badge */}
                      <text x={pt.x} y={pt.y - 8} fontSize="8.5" fontWeight="black" textAnchor="middle" fill="#92400E" className="font-mono">
                        {pt.swellPct.toFixed(2)}%
                      </text>
                      {/* X Label */}
                      <text x={pt.x} y={paddingT + plotH + 13} fontSize="8" textAnchor="middle" fill="#475569" className="font-mono font-bold">
                        {pt.blows} Tumbukan
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
