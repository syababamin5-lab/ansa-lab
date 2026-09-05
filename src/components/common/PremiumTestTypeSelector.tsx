import React, { useState, useRef, useEffect } from 'react';
import { MatrixTestInfo } from '../../types';
import { Search, ChevronDown, Check, FlaskConical, X } from 'lucide-react';

export interface PremiumTestTypeOption {
  code: string;
  name: string;
  category: string;
  standard?: string;
}

interface PremiumTestTypeSelectorProps {
  options?: PremiumTestTypeOption[];
  testCatalogue?: MatrixTestInfo[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  disabledCodes?: string[];
}

const DEFAULT_CATEGORIZED_TESTS: PremiumTestTypeOption[] = [
  // Sifat Fisik Tanah (Physical Properties)
  { code: 'PREP', name: 'Preparasi Sampel & BA', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D421 / SNI 1972:2008' },
  { code: 'SVE-HYD', name: 'Sieve Analysis & Hydrometer (SVE-HYD)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D422 / SNI 3423:2008' },
  { code: 'SG', name: 'Specific Gravity (SG) - Berat Jenis', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D854 / SNI 1965:2008' },
  { code: 'UW', name: 'Unit Weight (UW) - Berat Volume', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D7263 / SNI 1964:2008' },
  { code: 'ATB', name: 'Atterberg Limits (ATB / LL-PL-PI)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D4318 / SNI 1967:2008' },
  { code: 'MC', name: 'Moisture Content (MC) - Kadar Air', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D2216 / SNI 1965:2008' },
  { code: 'BD-DD', name: 'Bulk Density & Dry Density (BD-DD)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D7263' },
  { code: 'SND-CONE', name: 'Sand Cone Density Test (SND-CONE)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D1556' },
  { code: 'SWELLING', name: 'Free Swelling Test (SWELLING)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D4546' },
  { code: 'SHRINKAGE', name: 'Shrinkage Limit Test (SHRINKAGE)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D427' },
  { code: 'PH', name: 'pH Value Test Tanah (PH)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM D4972' },
  { code: 'CHLORID', name: 'Chlorid Content Test (CHLORID)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'BS 1377' },
  { code: 'SULFAT', name: 'Sulfat Content Test (SULFAT)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'BS 1377' },
  { code: 'CARBONAT', name: 'Carbonat Content Test (CARBONAT)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'BS 1377' },
  { code: 'RESISTIVITY', name: 'Soil Resistivity Test (RESISTIVITY)', category: 'Sifat Fisik Tanah (Physical Properties)', standard: 'ASTM G57' },

  // Pemadatan (Compaction)
  { code: 'CMP-STD', name: 'Compaction Standard Proctor (CMP-STD)', category: 'Pemadatan (Compaction)', standard: 'ASTM D698 / SNI 1742:2008' },
  { code: 'CMP-MOD', name: 'Compaction Modified Proctor (CMP-MOD)', category: 'Pemadatan (Compaction)', standard: 'ASTM D1557 / SNI 1743:2008' },
  { code: 'CBR-UNS', name: 'CBR Laboratory Unsoaked (CBR-UNS)', category: 'Pemadatan (Compaction)', standard: 'ASTM D1883 / SNI 1744:2012' },
  { code: 'CBR-SOK', name: 'CBR Laboratory Soaked (CBR-SOK)', category: 'Pemadatan (Compaction)', standard: 'ASTM D1883 / SNI 1744:2012' },

  // Konsolidasi & Permeabilitas
  { code: 'PB', name: 'Permeability Falling Head (PB)', category: 'Permeabilitas & Konsolidasi', standard: 'ASTM D2434 / SNI 2435:2008' },
  { code: 'CT', name: 'Consolidation Oedometer Test (CT)', category: 'Permeabilitas & Konsolidasi', standard: 'ASTM D2435 / SNI 2812:2011' },

  // Kuat Geser & Triaxial (Shear Strength)
  { code: 'UCT', name: 'Unconfined Compression Test (UCT)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D2166 / SNI 3638:2012' },
  { code: 'DS-UU', name: 'Direct Shear Unconsolidated Undrained (DS-UU)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D3080 / SNI 2813:2008' },
  { code: 'DS-CU', name: 'Direct Shear Consolidated Undrained (DS-CU)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D3080 / SNI 2813:2008' },
  { code: 'DS-CD', name: 'Direct Shear Consolidated Drained (DS-CD)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D3080 / SNI 2813:2008' },
  { code: 'DS-CDR', name: 'Direct Shear Residual (DS-CDR)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D3080 / SNI 2813:2008' },
  { code: 'TRX-UU', name: 'Triaxial Compression Test (TRX-UU)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D2850 / SNI 2815:2011' },
  { code: 'TRX-CU', name: 'Triaxial Compression Test (TRX-CU)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D4767 / SNI 4813:2015' },
  { code: 'TRX-CD', name: 'Triaxial Compression Test (TRX-CD)', category: 'Kuat Geser & Triaxial (Shear Strength)', standard: 'ASTM D7181 / SNI 4814:2015' },

  // Mekanika Batuan (Rock Mechanics)
  { code: 'PointLoad', name: 'Point Load Strength Index (PointLoad)', category: 'Mekanika Batuan (Rock Mechanics)', standard: 'ASTM D5731' },
  { code: 'UCS-Rock', name: 'Uniaxial Compressive Strength Rock (UCS-Rock)', category: 'Mekanika Batuan (Rock Mechanics)', standard: 'ASTM D7012' }
];

export const getTestTypeBadgeProps = (code: string) => {
  const norm = (code || '').toUpperCase().trim();
  if (norm === 'SG') return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700' };
  if (norm === 'MC') return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-700' };
  if (norm === 'UW') return { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-700' };
  if (norm === 'ATB' || norm === 'ATT') return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-700' };
  if (norm === 'SIEVE-HYDRO' || norm === 'SVE-HYD' || norm === 'S&H' || norm === 'SVE') return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-700' };
  if (norm === 'PB' || norm === 'PRM' || norm === 'PERM') return { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-700' };
  if (norm === 'CT' || norm === 'CNS') return { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-700' };
  if (norm === 'UCT') return { bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-700' };
  if (norm.startsWith('CMP')) return { bg: 'bg-orange-600', text: 'text-white', border: 'border-orange-700' };
  if (norm.startsWith('TRX')) return { bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-700' };
  if (norm.startsWith('DS')) return { bg: 'bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-700' };
  if (norm.startsWith('CBR')) return { bg: 'bg-amber-700', text: 'text-white', border: 'border-amber-800' };
  return { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800' };
};

export const PremiumTestTypeSelector: React.FC<PremiumTestTypeSelectorProps> = ({
  options = DEFAULT_CATEGORIZED_TESTS,
  testCatalogue,
  value,
  onChange,
  placeholder = '-- Pilih Jenis Pengujian --',
  label,
  disabled = false,
  disabledCodes = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Combine provided options or testCatalogue
  const allOptions: PremiumTestTypeOption[] = testCatalogue
    ? testCatalogue.map(t => {
        const matchedDefault = DEFAULT_CATEGORIZED_TESTS.find(d => d.code.toUpperCase() === t.code.toUpperCase());
        return {
          code: t.code,
          name: `${t.name} (${t.code})`,
          category: matchedDefault ? matchedDefault.category : (t.category || 'Lain-lain'),
          standard: t.standard || matchedDefault?.standard
        };
      })
    : options;

  // Selected Option Object
  const selectedOption = allOptions.find(o => o.code.toUpperCase() === (value || '').toUpperCase());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options by search query
  const filteredOptions = allOptions.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.category.toLowerCase().includes(q);
  });

  // Group options by category
  const groupedCategories = Array.from(new Set(filteredOptions.map(o => o.category)));

  return (
    <div ref={containerRef} className="relative w-full text-xs font-sans">
      {label && (
        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
          {label}
        </label>
      )}

      {/* TRIGGER BUTTON (CLEAN EXECUTIVE SELECTOR) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-1.5 min-h-[36px] rounded-lg border transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
          isOpen
            ? 'bg-white border-slate-500 ring-2 ring-slate-500/10 shadow-xs'
            : selectedOption
            ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <>
              <span className="px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                {selectedOption.code}
              </span>
              <span className="font-medium text-slate-800 text-xs truncate">
                {selectedOption.name.replace(new RegExp(`\\s*\\(${selectedOption.code}\\)$`, 'i'), '')}
              </span>
            </>
          ) : (
            <span className="text-slate-400 font-normal text-xs flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{placeholder}</span>
            </span>
          )}
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${isOpen ? 'rotate-180 text-slate-700' : ''}`} />
      </button>

      {/* CENTERED POPUP MODAL DIALOG */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150">
            
            {/* MODAL HEADER */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Pilih Parameter Pengujian</h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">Katalog Resmi TIMES® ANSA LIMS ({allOptions.length} Parameter)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* SEARCH INPUT HEADER */}
            <div className="p-3 bg-slate-50/70 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari kode (mis. SG, MC) atau nama pengujian..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 font-medium transition shadow-2xs"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* OPTIONS LIST BY CATEGORY GROUPS */}
            <div className="overflow-y-auto p-3 space-y-3 flex-1 text-xs">
              {filteredOptions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Tidak ada jenis pengujian yang cocok dengan "{searchQuery}"
                </div>
              ) : (
                groupedCategories.map(category => {
                  const items = filteredOptions.filter(o => o.category === category);
                  if (items.length === 0) return null;

                  return (
                    <div key={category} className="space-y-1">
                      {/* Category Group Title */}
                      <div className="px-2 pt-2 pb-1 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{items.length} uji</span>
                      </div>

                      {/* Group Items */}
                      <div className="space-y-0.5">
                        {items.map(option => {
                          const isSelected = option.code.toUpperCase() === (value || '').toUpperCase();
                          const isAlreadyUsed = disabledCodes.some(dc => dc.toUpperCase() === option.code.toUpperCase()) && !isSelected;

                          return (
                            <div
                              key={option.code}
                              onClick={() => {
                                if (isAlreadyUsed) return;
                                onChange(option.code);
                                setIsOpen(false);
                              }}
                              className={`px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-3 text-left ${
                                isAlreadyUsed
                                  ? 'opacity-40 cursor-not-allowed bg-slate-50 select-none'
                                  : isSelected
                                  ? 'bg-slate-900 text-white cursor-pointer shadow-xs'
                                  : 'hover:bg-slate-100 text-slate-800 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold tracking-tight shrink-0 ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {option.code}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                    {option.name}
                                  </div>
                                  {option.standard && (
                                    <div className={`text-[10.5px] font-mono truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                      {option.standard}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isAlreadyUsed && (
                                <span className="text-[10px] font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded shrink-0">
                                  Sudah Dipilih
                                </span>
                              )}

                              {isSelected && !isAlreadyUsed && (
                                <Check className="w-4 h-4 text-white shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* FOOTER TOTAL COUNT & CLOSE */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
              <span className="text-slate-500 font-mono text-[10.5px]">
                {filteredOptions.length} Parameter Uji Tersedia
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
