import React, { useState, useMemo } from 'react';
import { Timer, Clock, FlaskConical, CheckCircle, ChevronDown, ChevronUp, Calendar, User, AlertTriangle, Search } from 'lucide-react';
import { PurchaseOrder, PersonnelItem } from '../types';
import { normalizeTestCode } from '../utils/helpers';

// ─── TYPES ─────────────────────────────────────────────────────────────────────

interface WaktuPengujianProps {
  pos: PurchaseOrder[];
  personnelCatalogue: PersonnelItem[];
}

interface UjiTeknisi {
  kodeUji: string;
  namaUji: string;
  kodeSampel: string;
  noPO: string;
  poId: string;
  sampleId: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  durasiHari: number;
  status: 'berjalan' | 'selesai' | 'belum-mulai';
  progressPersen: number;
}

interface TeknisiData {
  nama: string;
  pengujian: UjiTeknisi[];
}

// ─── HELPER ────────────────────────────────────────────────────────────────────

function getTestDisplayName(code: string): string {
  const norm = normalizeTestCode(code);
  const map: Record<string, string> = {
    'SG': 'Specific Gravity', 'MC': 'Moisture Content', 'UW': 'Unit Weight',
    'ATB': 'Atterberg Limit', 'SVE-HYD': 'Sieve & Hydrometer',
    'CMP-STD': 'Compaction Std', 'CMP-MOD': 'Compaction Mod',
    'PRM': 'Permeability', 'CT': 'Consolidation', 'UCT': 'Unconfined Compression',
    'DS-UU': 'Direct Shear UU', 'DS-CU': 'Direct Shear CU', 'DS-CD': 'Direct Shear CD',
    'DS-RES': 'Direct Shear Residual',
    'TRX-UU': 'Triaxial UU', 'TRX-CU': 'Triaxial CU', 'TRX-CD': 'Triaxial CD',
    'CBR-UNS': 'CBR Unsoaked', 'CBR-SOK': 'CBR Soaked',
  };
  return map[norm] || code;
}

function hitungDurasiHari(mulai: string, selesai: string): number {
  if (!mulai) return 0;
  const start = new Date(mulai);
  const end = selesai ? new Date(selesai) : new Date();
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

function hitungStatus(mulai: string, selesai: string, calcStatus?: string): UjiTeknisi['status'] {
  if (!mulai) return 'belum-mulai';
  if (calcStatus === 'Calculated' || calcStatus === 'Verified' || calcStatus === 'Approved') return 'selesai';
  const today = new Date().toISOString().slice(0, 10);
  if (selesai && selesai < today) return 'selesai';
  return 'berjalan';
}

function hitungProgress(status: UjiTeknisi['status'], mulai: string, selesai: string): number {
  if (status === 'selesai') return 100;
  if (status === 'belum-mulai' || !mulai) return 0;
  const start = new Date(mulai).getTime();
  const end = selesai ? new Date(selesai).getTime() : start + (3 * 24 * 60 * 60 * 1000);
  const now = Date.now();
  if (now >= end) return 95;
  const total = end - start;
  if (total <= 0) return 50;
  return Math.min(95, Math.max(5, Math.round(((now - start) / total) * 100)));
}

function getStatusBadge(status: UjiTeknisi['status']) {
  switch (status) {
    case 'berjalan': return { label: 'Berjalan', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'belum-mulai': return { label: 'Belum Mulai', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'selesai': return { label: 'Selesai', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
}

function getBebanLevel(aktif: number, total: number) {
  if (total === 0) return { level: 'Kosong', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', barColor: 'bg-slate-300', persen: 0 };
  const persen = Math.round((aktif / Math.max(total, 1)) * 100);
  if (aktif >= 6) return { level: 'Penuh', color: 'text-red-600', bg: 'bg-red-50 border-red-200', barColor: 'bg-red-500', persen: Math.min(persen, 100) };
  if (aktif >= 4) return { level: 'Sibuk', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', barColor: 'bg-amber-500', persen };
  if (aktif > 0) return { level: 'Normal', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', barColor: 'bg-teal-500', persen };
  return { level: 'Kosong', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', barColor: 'bg-slate-300', persen: 0 };
}

// ─── KOMPONEN UTAMA ────────────────────────────────────────────────────────────

export const WaktuPengujianView: React.FC<WaktuPengujianProps> = ({ pos, personnelCatalogue }) => {
  const [expandedTeknisi, setExpandedTeknisi] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'berjalan' | 'selesai' | 'belum-mulai'>('semua');

  const toggleExpand = (nama: string) => {
    setExpandedTeknisi(prev =>
      prev.includes(nama) ? prev.filter(x => x !== nama) : [...prev, nama]
    );
  };

  // ─── SCAN SEMUA PO → SAMPLE → TEST → EXTRACT TEKNISI DATA ───────────────
  const teknisiMap = useMemo(() => {
    const map = new Map<string, TeknisiData>();

    (pos || []).forEach(po => {
      if (!po.samples) return;
      po.samples.forEach(sample => {
        if (!sample.tests) return;
        sample.tests.forEach(test => {
          const inputs = test.calculationData?.inputValues || {};
          const testedBy = (inputs.testedBy || '').trim();
          if (!testedBy) return; // skip jika tidak ada nama teknisi

          const kode = normalizeTestCode(test.testTypeCode || test.testTypeId || '');
          const mulai = inputs.dateTested || '';
          const selesai = inputs.dateTestedEnd || '';
          const status = hitungStatus(mulai, selesai, test.calculationStatus);
          const progress = hitungProgress(status, mulai, selesai);
          const durasi = hitungDurasiHari(mulai, selesai);

          const sampleCode = sample.sampleCode || sample.id;

          const uji: UjiTeknisi = {
            kodeUji: kode,
            namaUji: getTestDisplayName(kode),
            kodeSampel: sampleCode,
            noPO: po.poNumber || po.id,
            poId: po.id,
            sampleId: sample.id,
            tanggalMulai: mulai,
            tanggalSelesai: selesai,
            durasiHari: durasi,
            status,
            progressPersen: progress,
          };

          if (!map.has(testedBy)) {
            map.set(testedBy, { nama: testedBy, pengujian: [] });
          }
          map.get(testedBy)!.pengujian.push(uji);
        });
      });
    });

    return map;
  }, [pos]);

  // Tambahkan teknisi dari personnelCatalogue yang belum punya data uji (agar tampil sebagai "Kosong")
  const allTeknisiData = useMemo(() => {
    const result = new Map(teknisiMap);
    const pengujiList = personnelCatalogue.filter(p => p.role === 'Penguji' || !p.role);
    pengujiList.forEach(p => {
      if (!result.has(p.name)) {
        result.set(p.name, { nama: p.name, pengujian: [] });
      }
    });
    return Array.from(result.values()).sort((a, b) => {
      const aAktif = a.pengujian.filter(u => u.status === 'berjalan').length;
      const bAktif = b.pengujian.filter(u => u.status === 'berjalan').length;
      return bAktif - aAktif; // Yang paling sibuk di atas
    });
  }, [teknisiMap, personnelCatalogue]);

  // Filter
  const filteredTeknisi = useMemo(() => {
    return allTeknisiData.filter(t => {
      if (searchFilter && !t.nama.toLowerCase().includes(searchFilter.toLowerCase())) return false;
      if (statusFilter === 'semua') return true;
      if (statusFilter === 'berjalan') return t.pengujian.some(u => u.status === 'berjalan');
      if (statusFilter === 'selesai') return t.pengujian.length > 0 && t.pengujian.every(u => u.status === 'selesai');
      if (statusFilter === 'belum-mulai') return t.pengujian.length === 0;
      return true;
    });
  }, [allTeknisiData, searchFilter, statusFilter]);

  // Summary stats
  const totalTeknisi = allTeknisiData.length;
  const totalUjiBerjalan = allTeknisiData.reduce((s, t) => s + t.pengujian.filter(u => u.status === 'berjalan').length, 0);
  const totalUjiSelesai = allTeknisiData.reduce((s, t) => s + t.pengujian.filter(u => u.status === 'selesai').length, 0);
  const teknisiKosong = allTeknisiData.filter(t => t.pengujian.filter(u => u.status !== 'selesai').length === 0).length;
  const teknisiSibuk = allTeknisiData.filter(t => t.pengujian.filter(u => u.status === 'berjalan').length >= 4).length;

  return (
    <div className="flex-1 p-3.5 sm:p-4 space-y-3.5 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-teal-100 border border-teal-200">
            <Timer className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Waktu Pengujian</h1>
            <p className="text-sm text-slate-500">Kapasitas & Beban Kerja Teknisi — data otomatis dari Kertas Kerja</p>
          </div>
        </div>
      </div>

      {/* Ringkasan Kapasitas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Teknisi</div>
          <div className="text-2xl font-extrabold text-slate-800">{totalTeknisi}</div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Uji Berjalan</div>
          <div className="text-2xl font-extrabold text-blue-600">{totalUjiBerjalan}</div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Uji Selesai</div>
          <div className="text-2xl font-extrabold text-emerald-600">{totalUjiSelesai}</div>
        </div>
        <div className="bg-white rounded-xl border border-teal-200 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-1">Tersedia</div>
          <div className="text-2xl font-extrabold text-teal-600">{teknisiKosong}</div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Sibuk (≥4 uji)</div>
          <div className="text-2xl font-extrabold text-red-600">{teknisiSibuk}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 flex flex-wrap items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari nama teknisi..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(['semua', 'berjalan', 'selesai', 'belum-mulai'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s === 'semua' ? 'Semua' : s === 'berjalan' ? 'Berjalan' : s === 'selesai' ? 'Selesai' : 'Kosong'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredTeknisi.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-500 mb-1">Belum Ada Data Teknisi</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Data teknisi otomatis muncul saat Anda mengisi kolom <strong>"Tested By (Penguji)"</strong> dan <strong>"Tanggal Mulai Uji"</strong> di halaman <strong>Input Data Uji (Kertas Kerja)</strong>.
          </p>
          <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg inline-block">
            <p className="text-[11px] text-teal-700 font-semibold">
              Kertas Kerja → Isi "Tested By" + "Tanggal Mulai" → Otomatis tampil di sini
            </p>
          </div>
        </div>
      )}

      {/* Daftar Teknisi */}
      <div className="space-y-3">
        {filteredTeknisi.map((teknisi) => {
          const aktifCount = teknisi.pengujian.filter(u => u.status === 'berjalan').length;
          const totalCount = teknisi.pengujian.length;
          const beban = getBebanLevel(aktifCount, 6);
          const isExpanded = expandedTeknisi.includes(teknisi.nama);

          return (
            <div key={teknisi.nama} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Teknisi Header */}
              <button
                onClick={() => toggleExpand(teknisi.nama)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {teknisi.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800">{teknisi.nama}</div>
                    <div className="text-[11px] text-slate-500">
                      {aktifCount > 0 ? `${aktifCount} uji aktif` : 'Tidak ada uji aktif'}
                      {totalCount > aktifCount ? ` · ${totalCount - aktifCount} selesai` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Kapasitas Bar */}
                  <div className="hidden md:flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Beban</div>
                      <div className={`text-xs font-bold ${beban.color}`}>
                        {aktifCount} uji aktif
                      </div>
                    </div>
                    <div className="w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${beban.barColor}`}
                        style={{ width: `${Math.min(beban.persen, 100)}%` }}
                      />
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${beban.bg} ${beban.color}`}>
                    {beban.level}
                  </span>

                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Detail Pengujian */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-slate-100">
                  {teknisi.pengujian.length === 0 ? (
                    <div className="py-6 text-center">
                      <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-400 font-medium">Tidak ada pengujian</p>
                      <p className="text-xs text-slate-400">Teknisi ini tersedia untuk menerima sampel baru</p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {/* Header tabel */}
                      <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                        <div className="col-span-2">Kode Uji</div>
                        <div className="col-span-3">Sampel</div>
                        <div className="col-span-2">No. PO</div>
                        <div className="col-span-2">Periode</div>
                        <div className="col-span-2">Progress</div>
                        <div className="col-span-1 text-center">Status</div>
                      </div>

                      {teknisi.pengujian
                        .sort((a, b) => {
                          // Berjalan dulu, lalu belum-mulai, lalu selesai
                          const order = { 'berjalan': 0, 'belum-mulai': 1, 'selesai': 2 };
                          return order[a.status] - order[b.status];
                        })
                        .map((uji, idx) => {
                        const badge = getStatusBadge(uji.status);
                        return (
                          <div
                            key={`${uji.kodeUji}-${uji.kodeSampel}-${idx}`}
                            className={`grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg border ${
                              uji.status === 'selesai' ? 'bg-emerald-50/50 border-emerald-100' :
                              uji.status === 'belum-mulai' ? 'bg-amber-50/50 border-amber-100' :
                              'bg-slate-50 border-slate-100'
                            }`}
                          >
                            {/* Kode Uji */}
                            <div className="col-span-2 flex items-center gap-2">
                              <FlaskConical className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                              <div>
                                <div className="text-xs font-bold text-slate-800">{uji.kodeUji}</div>
                                <div className="text-[10px] text-slate-400 truncate">{uji.namaUji}</div>
                              </div>
                            </div>

                            {/* Sampel */}
                            <div className="col-span-3">
                              <div className="text-xs text-slate-700 font-medium truncate" title={uji.kodeSampel}>{uji.kodeSampel}</div>
                            </div>

                            {/* PO */}
                            <div className="col-span-2">
                              <div className="text-[11px] text-slate-500 font-mono truncate" title={uji.noPO}>{uji.noPO}</div>
                            </div>

                            {/* Periode */}
                            <div className="col-span-2">
                              {uji.tanggalMulai ? (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>{uji.tanggalMulai.slice(5)}{uji.tanggalSelesai ? ` — ${uji.tanggalSelesai.slice(5)}` : ''}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">Belum diisi</div>
                              )}
                              {uji.durasiHari > 0 && (
                                <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-2.5 h-2.5" /> {uji.durasiHari} hari
                                </div>
                              )}
                            </div>

                            {/* Progress */}
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      uji.progressPersen >= 100 ? 'bg-emerald-500' :
                                      uji.progressPersen >= 50 ? 'bg-blue-500' :
                                      uji.progressPersen > 0 ? 'bg-amber-500' :
                                      'bg-slate-300'
                                    }`}
                                    style={{ width: `${uji.progressPersen}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{uji.progressPersen}%</span>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-1 flex justify-center">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-slate-100 rounded-xl border border-slate-200">
        <p className="text-[11px] text-slate-500 text-center">
          Data diambil otomatis dari kolom <strong>"Tested By"</strong> dan <strong>"Tanggal Mulai/Selesai Uji"</strong> di halaman Input Data Uji (Kertas Kerja). 
          Tambahkan nama teknisi di <strong>Pengaturan → Master Personil</strong> agar muncul sebagai opsi dropdown.
        </p>
      </div>
    </div>
  );
};
