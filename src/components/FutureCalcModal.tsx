import React, { useState } from 'react';
import { SampleTest, Sample, PurchaseOrder, CalculationStatus, SOIL_COLOUR_CATALOGUE } from '../types';
import { 
  Calculator, 
  X, 
  Save, 
  ShieldCheck, 
  Sparkles, 
  FileJson
} from 'lucide-react';

interface FutureCalcModalProps {
  test: SampleTest;
  sample: Sample;
  po: PurchaseOrder;
  onClose: () => void;
  onSaveCalculation: (updatedTest: SampleTest) => void;
}

export const FutureCalcModal: React.FC<FutureCalcModalProps> = ({
  test,
  sample,
  po,
  onClose,
  onSaveCalculation
}) => {
  const [calcStatus, setCalcStatus] = useState<CalculationStatus>(test.calculationStatus || 'Draft Data');
  
  const isAtterberg = test.testTypeCode === 'ATT';
  const isTriaxial = test.testTypeCode === 'TRX-UU';
  const isProctor = test.testTypeCode === 'CMP';

  const [liquidLimit, setLiquidLimit] = useState(test.calculationData?.summaryResults?.LL || 52.4);
  const [plasticLimit, setPlasticLimit] = useState(test.calculationData?.summaryResults?.PL || 24.1);
  
  const [cohesion, setCohesion] = useState(test.calculationData?.summaryResults?.cu || '42.5 kPa');
  const [frictionAngle, setFrictionAngle] = useState(test.calculationData?.summaryResults?.phi || '2.1 deg');

  const [dryDensityMax, setDryDensityMax] = useState(test.calculationData?.summaryResults?.dryDensityMax || '1.745 gr/cm3');
  const [optimumMoisture, setOptimumMoisture] = useState(test.calculationData?.summaryResults?.optimumMoisture || '18.2%');

  const piValue = Math.round((liquidLimit - plasticLimit) * 10) / 10;
  const colourObj = SOIL_COLOUR_CATALOGUE.find(c => c.code === sample.colourCode) || SOIL_COLOUR_CATALOGUE[0];

  const handleSave = () => {
    let summary: Record<string, any> = {};
    if (isAtterberg) {
      summary = { LL: liquidLimit, PL: plasticLimit, PI: piValue, Classification: piValue > 7 ? 'CH' : 'CL' };
    } else if (isTriaxial) {
      summary = { cu: cohesion, phi: frictionAngle };
    } else if (isProctor) {
      summary = { dryDensityMax, optimumMoisture };
    } else {
      summary = { status: 'OK', notes: 'Data hasil pengujian terisi.' };
    }

    const updatedTest: SampleTest = {
      ...test,
      calculationStatus: calcStatus,
      calculationData: {
        ...test.calculationData,
        summaryResults: summary
      },
      verifiedBy: calcStatus === 'Verified' ? (po.checkedBy || 'AS Sumartadji') : test.verifiedBy,
      verifiedAt: calcStatus === 'Verified' ? new Date().toISOString() : test.verifiedAt
    };

    onSaveCalculation(updatedTest);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Lembar Hasil & Perhitungan Rumus Lab</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Formulir Standar PO-GQT-19
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Job Number: <span className="text-white font-mono font-bold">{po.poNumber}</span> | Klien: <span className="text-slate-200 font-bold">{po.clientName}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Header Metadata Grid (Matching Form Image) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-2 flex justify-between">
              <span>Identitas Sampel & Personal In Charge (PIC)</span>
              <span className="text-emerald-400 font-mono">ID Lab: {sample.idLab}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Sample Number:</span>
                <span className="font-bold text-white">{sample.sampleCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Lithology:</span>
                <span className="font-bold text-amber-400">{sample.lithology}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Kedalaman:</span>
                <span className="font-semibold text-slate-200">{sample.depthStart}m - {sample.depthEnd}m</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tipe Sampel:</span>
                <span className="font-semibold text-slate-200">{sample.sampleType}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Warna Tanah (Kode {sample.colourCode}):</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: colourObj.hex }} />
                  {sample.colourName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tested By (Penguji):</span>
                <span className="font-semibold text-emerald-400">{sample.testedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Checked By:</span>
                <span className="font-semibold text-amber-400">{po.checkedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Computed By:</span>
                <span className="font-semibold text-slate-200">{po.computedBy || '-'}</span>
              </div>
            </div>
          </div>

          {/* Test Status Header */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-[10px] mr-2">
                {test.testTypeCode}
              </span>
              <span className="font-bold text-slate-100 text-sm">{test.testTypeName}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">Status Perhitungan:</span>
              <select
                value={calcStatus}
                onChange={(e) => setCalcStatus(e.target.value as CalculationStatus)}
                className="bg-slate-900 text-slate-100 text-xs px-3 py-1.5 rounded-lg border border-slate-700 font-semibold focus:outline-none"
              >
                <option value="Draft Data">Draft Data</option>
                <option value="Calculated">Calculated (Terhitung)</option>
                <option value="Verified">Verified (Terverifikasi Head Lab)</option>
                <option value="Approved">Approved (Final Release)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Calculation Sheet Form */}
          <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <FileJson className="w-4 h-4 text-teal-400" />
              Lembar Input Perhitungan ({test.testTypeCode})
            </h4>

            {isAtterberg && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <label className="block text-slate-400 mb-1">Liquid Limit (LL %)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={liquidLimit}
                      onChange={(e) => setLiquidLimit(Number(e.target.value))}
                      className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-700"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <label className="block text-slate-400 mb-1">Plastic Limit (PL %)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={plasticLimit}
                      onChange={(e) => setPlasticLimit(Number(e.target.value))}
                      className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-700"
                    />
                  </div>

                  <div className="p-3 bg-emerald-950/50 rounded-lg border border-emerald-800">
                    <label className="block text-emerald-300 mb-1 font-semibold">Plasticity Index (PI %)</label>
                    <div className="text-xl font-extrabold text-emerald-400 py-1 font-mono">
                      {piValue}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTriaxial && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <label className="block text-slate-400 mb-1">Kohesi Kuat Geser (cu)</label>
                    <input
                      type="text"
                      value={cohesion}
                      onChange={(e) => setCohesion(e.target.value)}
                      className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-700"
                    />
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <label className="block text-slate-400 mb-1">Sudut Geser Dalam (Phi / φ)</label>
                    <input
                      type="text"
                      value={frictionAngle}
                      onChange={(e) => setFrictionAngle(e.target.value)}
                      className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isAtterberg && !isTriaxial && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <label className="block text-slate-400 mb-1">Kepadatan Kering Maksimum (γd max)</label>
                  <input
                    type="text"
                    value={dryDensityMax}
                    onChange={(e) => setDryDensityMax(e.target.value)}
                    className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-700"
                  />
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <label className="block text-slate-400 mb-1">Kadar Air Optimum (w opt)</label>
                  <input
                    type="text"
                    value={optimumMoisture}
                    onChange={(e) => setOptimumMoisture(e.target.value)}
                    className="w-full bg-slate-800 text-white font-bold p-2 rounded border border-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Verification Status */}
          {test.verifiedBy && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                Telah Diverifikasi Oleh: <span className="font-bold text-white">{test.verifiedBy}</span> (Tempat: {po.place})
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Hasil Perhitungan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
