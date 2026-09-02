import React, { useState } from 'react';
import {
  ContainerItem,
  RingItem,
  ConsolRingItem,
  DsProvingItem,
  DsRingItem,
  TrxRingItem,
  UctRingItem,
  PycnometerItem,
  MoldItem,
} from '../../types';
import {
  Scale,
  Search,
  Layers,
  Sparkles,
  Calculator,
  Check,
  Disc,
  Info,
} from 'lucide-react';

interface MobileToolLookupViewProps {
  containerCatalogue?: ContainerItem[];
  ringCatalogue?: RingItem[];
  consolRingCatalogue?: ConsolRingItem[];
  dsProvingCatalogue?: DsProvingItem[];
  dsRingCatalogue?: DsRingItem[];
  trxRingCatalogue?: TrxRingItem[];
  uctRingCatalogue?: UctRingItem[];
  pycnometerCatalogue?: PycnometerItem[];
  moldCatalogue?: MoldItem[];
}

export const MobileToolLookupView: React.FC<MobileToolLookupViewProps> = ({
  containerCatalogue = [],
  ringCatalogue = [],
  consolRingCatalogue = [],
  dsProvingCatalogue = [],
  dsRingCatalogue = [],
  trxRingCatalogue = [],
  uctRingCatalogue = [],
  pycnometerCatalogue = [],
  moldCatalogue = [],
}) => {
  const [activeCategory, setActiveCategory] = useState<'cawan' | 'ring' | 'proving' | 'pyc' | 'mold'>('cawan');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Quick Net Weight Pocket Calculator
  const [calcContainerCode, setCalcContainerCode] = useState('');
  const [calcGrossWeight, setCalcGrossWeight] = useState<string>('');

  // Selected container tare weight lookup
  const matchedContainer = (containerCatalogue || []).find(c => 
    String(c.id || '').trim().toLowerCase() === calcContainerCode.trim().toLowerCase() ||
    String((c as any).kode || '').trim().toLowerCase() === calcContainerCode.trim().toLowerCase()
  );
  const containerTare = matchedContainer ? (matchedContainer.weight ?? (matchedContainer as any).weightGrams ?? 0) : 0;
  const grossNum = parseFloat(calcGrossWeight) || 0;
  const calculatedNetWeight = grossNum > containerTare ? (grossNum - containerTare).toFixed(3) : null;

  // Filtered lists
  const query = searchQuery.trim().toLowerCase();

  const filteredCawan = (containerCatalogue || []).filter(c =>
    String(c.id || '').toLowerCase().includes(query) ||
    String(c.weight || '').includes(query) ||
    String((c as any).kode || '').toLowerCase().includes(query)
  );

  const filteredRing = (ringCatalogue || []).filter(r =>
    String(r.id || r.ringNo || '').toLowerCase().includes(query)
  );

  const filteredProving = [
    ...(trxRingCatalogue || []).map(r => ({ type: 'Triaxial', code: r.ringNo, lrc: (r as any).provingCalibration ?? (r as any).lrc, cap: r.capacityKg })),
    ...(uctRingCatalogue || []).map(r => ({ type: 'UCT', code: r.ringNo, lrc: (r as any).provingCalibration ?? (r as any).lrc, cap: r.capacityKg })),
    ...(dsProvingCatalogue || []).map(r => ({ type: 'Direct Shear', code: r.machineCode, lrc: (r as any).provingCalibration ?? (r as any).lrc, cap: r.capacityKg })),
  ].filter(p =>
    p.code.toLowerCase().includes(query) || p.type.toLowerCase().includes(query)
  );

  const filteredPyc = (pycnometerCatalogue || []).filter(p =>
    String(p.pycNo || '').toLowerCase().includes(query)
  );

  const filteredMold = (moldCatalogue || []).filter(m =>
    String(m.id || (m as any).code || (m as any).moldNo || '').toLowerCase().includes(query)
  );

  return (
    <div className="space-y-4 pb-20 font-sans">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
            <Scale className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">Katalog Cawan &amp; Alat Saku</h2>
            <p className="text-xs text-emerald-100/90 font-medium">Lookup Cepat Berat Tara di Meja Timbangan Lab</p>
          </div>
        </div>
      </div>

      {/* QUICK POCKET TARE CALCULATOR */}
      <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kalkulator Berat Bersih Cepat</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
            Auto-Tare
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Kode Cawan:</label>
            <input
              type="text"
              value={calcContainerCode}
              onChange={e => setCalcContainerCode(e.target.value.toUpperCase())}
              placeholder="mis. C-145 atau 1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Berat Bruto (Cawan + Tanah):</label>
            <input
              type="number"
              step="0.001"
              inputMode="decimal"
              value={calcGrossWeight}
              onChange={e => setCalcGrossWeight(e.target.value)}
              placeholder="0.000 g"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {matchedContainer && (
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[10px] text-emerald-800 block">Tara Cawan ({matchedContainer.id}):</span>
              <strong className="text-emerald-950 font-black">{containerTare.toFixed(4)} g</strong>
            </div>
            {calculatedNetWeight !== null && (
              <div className="text-right">
                <span className="text-[10px] text-emerald-800 block">Berat Bersih Tanah (W):</span>
                <strong className="text-sm font-black text-emerald-700">{calculatedNetWeight} g</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CATEGORY SELECTOR CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'cawan', label: `Cawan (${containerCatalogue.length})`, icon: Scale },
          { id: 'ring', label: `Ring (${ringCatalogue.length + dsRingCatalogue.length + consolRingCatalogue.length})`, icon: Disc },
          { id: 'proving', label: `Proving Ring (${filteredProving.length})`, icon: Layers },
          { id: 'pyc', label: `Piknometer (${pycnometerCatalogue.length})`, icon: Info },
          { id: 'mold', label: `Mold (${moldCatalogue.length})`, icon: Sparkles },
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm scale-[1.02]'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Cari nomor / kode ${activeCategory}...`}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* CONTENT LIST */}
      <div className="space-y-2">
        {/* 1. CAWAN */}
        {activeCategory === 'cawan' && (
          <div className="grid grid-cols-2 gap-2">
            {filteredCawan.map((item, idx) => {
              const weight = item.weight ?? (item as any).weightGrams ?? 0;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCalcContainerCode(String(item.id || ''));
                  }}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition cursor-pointer active:scale-95 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {item.id}
                    </span>
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Cawan
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-700 font-mono">
                    {weight.toFixed(4)} <span className="text-[10px] font-normal text-slate-500">g</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-mono">
                    Volume: {item.volume || '-'} ml
                  </div>
                </div>
              );
            })}
            {filteredCawan.length === 0 && (
              <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                Tidak ada cawan yang cocok dengan kata kunci.
              </div>
            )}
          </div>
        )}

        {/* 2. RINGS */}
        {activeCategory === 'ring' && (
          <div className="space-y-2">
            {[...filteredRing, ...(dsRingCatalogue || []), ...(consolRingCatalogue || [])].map((item: any, idx) => (
              <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 font-black">{item.id || item.ringNo}</span>
                  <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                    Ring Cetak / Consol
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[10.5px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Diameter:</span>
                    <strong>{item.diameterMm || item.diameter || '-'} mm</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Tinggi:</span>
                    <strong>{item.heightMm || item.height || '-'} mm</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Berat:</span>
                    <strong className="text-emerald-700">{item.weightGrams || item.weight || '-'} g</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. PROVING RINGS */}
        {activeCategory === 'proving' && (
          <div className="space-y-2">
            {filteredProving.map((item, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{item.code}</span>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {item.type}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono pt-1">
                  <div>
                    <span className="text-slate-400 block text-[9.5px]">Faktor Kalibrasi (LRC):</span>
                    <span className="text-sm font-black text-emerald-700">{item.lrc} kgf/div</span>
                  </div>
                  {item.cap && (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9.5px]">Kapasitas:</span>
                      <strong className="text-slate-700">{item.cap} kgf</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 4. PIKNOMETER */}
        {activeCategory === 'pyc' && (
          <div className="grid grid-cols-2 gap-2">
            {filteredPyc.map((item, idx) => (
              <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    Pyc #{item.pycNo}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-400 block text-[9px]">Berat Kosong (W₁):</span>
                  <strong className="text-slate-800">{item.weightTare?.toFixed(4)} g</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Berat + Air 25°C (W₂):</span>
                  <strong className="text-teal-700">{item.weightWater25?.toFixed(4)} g</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5. MOLD */}
        {activeCategory === 'mold' && (
          <div className="space-y-2">
            {filteredMold.map((item: any, idx) => (
              <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 font-black">{item.id || item.code || item.moldNo}</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Mold Pemadatan / CBR
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10.5px] pt-1">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Diameter:</span>
                    <strong>{item.diameter || item.diameterMm || '-'} cm</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Tinggi:</span>
                    <strong>{item.height || item.heightMm || '-'} cm</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Volume:</span>
                    <strong className="text-emerald-700">{item.volume || '-'} cm³</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
