import React, { useState } from 'react';
import { Quotation, QuotationItem, Client } from '../../types/workflowTypes';
import { terbilang } from '../../utils/terbilang';
import { getStoredMasterPrices, PriceCategoryKey } from '../../data/masterPriceCatalog';
import { getNextDocNo, getNextQuotationNo } from '../../utils/docNumbering';
import { Plus, Printer, FileText, CheckCircle2, DollarSign, Building, Calendar, Edit3, Trash2, X, Download, Tag, Users, ChevronDown, AlertTriangle } from 'lucide-react';

import { PersonnelItem } from '../../types';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';
import { PremiumTestTypeSelector } from '../common/PremiumTestTypeSelector';

interface QuotationViewProps {
  quotations: Quotation[];
  clients: Client[];              // Master data client untuk dropdown
  personnelCatalogue?: PersonnelItem[];
  companyProfile?: CompanyProfile;
  onSaveQuotation: (quo: Quotation) => void;
  onDeleteQuotation?: (id: string) => void;
}

export const QuotationView: React.FC<QuotationViewProps> = ({ quotations, clients, personnelCatalogue = [], companyProfile = DEFAULT_COMPANY_PROFILE, onSaveQuotation, onDeleteQuotation }) => {
  const [selectedQuo, setSelectedQuo] = useState<Quotation | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuoId, setEditingQuoId] = useState<string | null>(null);

  // Form State
  const [formNo, setFormNo]               = useState('');
  const [formClientCode, setFormClientCode] = useState<string>('');
  const [formClient, setFormClient]       = useState('');
  const [formAddress, setFormAddress]     = useState('');
  const [formContact, setFormContact]     = useState('');
  const [formPhone, setFormPhone]         = useState('');
  const [formEmail, setFormEmail]         = useState('');
  const [formPoNo, setFormPoNo]           = useState('');
  const [formProject, setFormProject]     = useState('');
  const [formLocation, setFormLocation]   = useState('');
  const [priceTier, setPriceTier]         = useState<PriceCategoryKey>('priceGeoland');
  const [formDiscountPct, setFormDiscountPct] = useState<number>(0);
  const [formItems, setFormItems]         = useState<QuotationItem[]>([]);
  // Client selector state
  const [selectedClientId, setSelectedClientId] = useState<string>('');  // '' = manual input

  // Form dirty state & unsaved modal
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  // Auto-fill all client fields when a registered client is selected
  const handleSelectClient = (clientId: string) => {
    setIsFormDirty(true);
    setSelectedClientId(clientId);
    if (!clientId) {
      setFormClientCode('');
      if (!editingQuoId) {
        setFormNo(getNextQuotationNo(quotations.map(q => q.quotationNo), '', new Date()));
      }
      return; // manual input, don't overwrite
    }
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    setFormClient(client.companyName);
    setFormAddress(client.address);
    setFormContact(client.contactPerson);
    setFormPhone(client.phone);
    setFormEmail(client.email || '');
    const clientCode = client.clientCode || '';
    setFormClientCode(clientCode);

    // Otomatis sinkronkan nomor penawaran baru dengan singkatan/kode client
    if (!editingQuoId) {
      setFormNo(getNextQuotationNo(quotations.map(q => q.quotationNo), clientCode, new Date()));
    }

    // Apply the client's default price tier
    setPriceTier(client.defaultPriceTier as PriceCategoryKey);
    // Re-price all existing items with new tier
    if (formItems.length > 0) {
      const masterList = getStoredMasterPrices();
      setFormItems(formItems.map(item => {
        const master = masterList.find(m => m.code === item.testCode || m.name === item.testName);
        if (!master) return item;
        const unitPrice = master[client.defaultPriceTier as PriceCategoryKey] || 0;
        return { ...item, unitPrice, totalPrice: unitPrice * item.quantity * item.freq };
      }));
    }
  };

  const openNewForm = () => {
    setEditingQuoId(null);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setSelectedClientId('');
    setFormClientCode('');
    // Format baru: Q-[KODE]-[000]-[MM]-[YY], auto nomor urut aman tanpa duplikasi
    const nextNo = getNextQuotationNo(quotations.map(q => q.quotationNo), '', new Date());
    setFormNo(nextNo);
    setFormClient('');
    setFormAddress('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormPoNo('');
    setFormProject('');
    setFormLocation('');
    setPriceTier('priceGeoland');
    setFormDiscountPct(0);
    setFormItems([]);
    setIsFormModalOpen(true);
    setIsFormDirty(false);
  };

  const openEditForm = (q: Quotation) => {
    setEditingQuoId(q.id);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    
    // Sinkronkan data client jika terdaftar
    const matchedClient = clients.find(c => c.companyName.toLowerCase().trim() === (q.clientName || '').toLowerCase().trim());
    if (matchedClient) {
      setSelectedClientId(matchedClient.id);
      setFormClientCode(matchedClient.clientCode || '');
    } else {
      setSelectedClientId('');
      // Ekstrak kode client dari nomor penawaran jika berformat Q-[KODE]-[000]...
      const m = q.quotationNo.match(/^Q-([A-Z0-9]+)-\d{3}-/i);
      setFormClientCode(m && m[1] ? m[1] : '');
    }

    setFormNo(q.quotationNo);
    setFormClient(q.clientName || '');
    setFormAddress(q.clientAddress || '');
    setFormContact(q.clientContactPerson || '');
    setFormPhone(q.clientPhone || '');
    setFormEmail(q.clientEmail || '');
    setFormPoNo(q.poNumber || '');
    setFormProject(q.projectName || '');
    setFormLocation(q.projectLocation || '');
    setFormDiscountPct(q.discountPct || 0);
    setFormItems(q.items ? q.items.map(item => ({ ...item })) : []);
    setIsFormModalOpen(true);
    setIsFormDirty(false);
  };

  const handleSelectMasterTest = (index: number, masterId: string) => {
    const master = MASTER_PRICE_CATALOG.find(m => m.id === masterId);
    if (!master) return;

    const unitPrice = master[priceTier] || 0;
    const updated = [...formItems];
    const qty = updated[index]?.quantity || 1;
    const freq = updated[index]?.freq || 1;

    updated[index] = {
      ...updated[index],
      testCode: master.code,
      testName: master.name,
      standardStr: master.standard,
      unit: master.unit === 'Sample' ? 'Sampel' : master.unit,
      unitPrice,
      subtotal: qty * freq * unitPrice
    };
    setFormItems(updated);
  };

  const handlePriceTierChange = (newTier: PriceCategoryKey) => {
    setPriceTier(newTier);
    const masterList = getStoredMasterPrices();
    const updated = formItems.map(item => {
      const master = masterList.find(m => m.code === item.testCode || m.name === item.testName);
      const newUnitPrice = master ? (master[newTier] || 0) : item.unitPrice;
      return {
        ...item,
        unitPrice: newUnitPrice,
        subtotal: item.quantity * (item.freq || 1) * newUnitPrice
      };
    });
    setFormItems(updated);
    setIsFormDirty(true);
  };

  const handleAddItem = () => {
    setIsFormDirty(true);
    // Tambah baris kosong — parameter, qty diisi user, freq default 1
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      testCode: '',
      testName: '',
      standardStr: '',
      unit: 'Sampel',
      quantity: 0,
      freq: 1, // Default Freq adalah 1
      unitPrice: 0,
      subtotal: 0
    };
    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof QuotationItem, val: any) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice' || field === 'freq') {
      const q = Number(item.quantity) || 0;
      const f = Number(item.freq) > 0 ? Number(item.freq) : 1;
      const p = Number(item.unitPrice) || 0;
      item.subtotal = q * f * p;
    }
    updated[index] = item;
    setFormItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setIsFormDirty(true);
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleAttemptCloseForm = () => {
    if (isFormDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsFormModalOpen(false);
    }
  };

  const handleSaveForm = () => {
    // Validasi tidak boleh ada jenis pengujian yang sama dalam 1 penawaran
    const filledCodes = formItems.map(item => item.testCode.toUpperCase().trim()).filter(Boolean);
    const duplicates = filledCodes.filter((code, index) => filledCodes.indexOf(code) !== index);
    if (duplicates.length > 0) {
      alert(`Terdapat jenis pengujian ganda dalam penawaran ini (${Array.from(new Set(duplicates)).join(', ')}).\n\nSilakan hapus baris duplikat atau gabungkan jumlah sampelnya.`);
      return;
    }

    const subtotal = formItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = Math.round(subtotal * (formDiscountPct / 100));
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = Math.round(afterDiscount * (formDiscountPct > 0 ? 0.11 : 0));
    const grandTotal = afterDiscount + vatAmount;

    // Pastikan nomor penawaran terisi dan dijamin 100% unik tanpa duplikasi
    let finalQuotationNo = formNo.trim();
    if (!finalQuotationNo) {
      finalQuotationNo = getNextQuotationNo(quotations.map(q => q.quotationNo), formClientCode, new Date());
    } else if (!editingQuoId) {
      const isDuplicate = quotations.some(q => q.quotationNo.trim().toUpperCase() === finalQuotationNo.toUpperCase());
      if (isDuplicate) {
        finalQuotationNo = getNextQuotationNo(quotations.map(q => q.quotationNo), formClientCode, new Date());
      }
    } else {
      const isDuplicate = quotations.some(q => q.id !== editingQuoId && q.quotationNo.trim().toUpperCase() === finalQuotationNo.toUpperCase());
      if (isDuplicate) {
        alert(`Nomor penawaran "${finalQuotationNo}" sudah digunakan pada penawaran lain. Nomor urut akan disesuaikan otomatis agar tidak terjadi duplikasi.`);
        finalQuotationNo = getNextQuotationNo(quotations.map(q => q.quotationNo), formClientCode, new Date());
      }
    }

    const existingQuo = editingQuoId ? quotations.find(q => q.id === editingQuoId) : null;

    const newQuo: Quotation = {
      id: editingQuoId || `quo-${Date.now()}`,
      quotationNo: finalQuotationNo,
      date: existingQuo ? existingQuo.date : new Date().toISOString().split('T')[0],
      validUntil: existingQuo ? existingQuo.validUntil : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientName: formClient,
      clientAddress: formAddress,
      clientContactPerson: formContact,
      clientPhone: formPhone,
      clientEmail: formEmail,
      poNumber: formPoNo,
      projectName: formProject,
      projectLocation: formLocation,
      items: formItems,
      subtotal,
      discountPct: formDiscountPct,
      discountAmount,
      vatPct: 0,
      vatAmount: 0,
      grandTotal: subtotal,
      status: existingQuo ? existingQuo.status : 'Approved',
      createdByName: existingQuo ? existingQuo.createdByName : 'Ir. Hartawi Riskha, S.T',
      createdAt: existingQuo ? existingQuo.createdAt : new Date().toISOString()
    };

    onSaveQuotation(newQuo);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setIsFormModalOpen(false);
    setEditingQuoId(null);
  };

  const handleDeleteQuo = (q: Quotation) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Surat Penawaran No. "${q.quotationNo}"?`)) {
      if (onDeleteQuotation) {
        onDeleteQuotation(q.id);
      }
    }
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-fit mb-1.5">
            <span>TAHAP 1 OPERASIONAL LAB (ISO 17025)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             Surat Penawaran Harga (Quotation Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Otomatisasi daftar harga per pengujian (Harga Geoland, Harga BRS, &amp; Harga Umum). Pilih pengujian &amp; jumlah sampel untuk mengisi harga &amp; standar secara otomatis!
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Penawaran Baru</span>
        </button>
      </div>

      {/* QUOTATION LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Daftar Penawaran Harga Aktif ({quotations.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">No. Penawaran</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Klien &amp; Proyek</th>
                <th className="py-3 px-4 text-center">Jumlah Uji</th>
                <th className="py-3 px-4 text-right">Total Penawaran</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi &amp; Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {quotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold font-mono text-emerald-800">{q.quotationNo}</td>
                  <td className="py-3 px-4 text-slate-600">{q.date}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{q.clientName}</div>
                    <div className="text-[11px] text-slate-500">{q.projectName}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{q.items.length} Parameter</td>
                  <td className="py-3 px-4 text-right font-extrabold font-mono text-slate-900">
                    Rp {q.grandTotal.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedQuo(q);
                          setIsPreviewModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Cetak Surat Penawaran PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </button>

                      <button
                        onClick={() => openEditForm(q)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Edit Penawaran Ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteQuo(q)}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Hapus Penawaran Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM CREATE MODAL WITH AUTO PRICE LOOKUP & TIER SELECTOR */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{editingQuoId ? `Edit Surat Penawaran Harga — ${formNo}` : 'Input Surat Penawaran Harga Baru (Otomatis Master Tarif)'}</span>
              </h3>
              <button onClick={handleAttemptCloseForm} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              
              {/* TIER INFO — tersembunyi dari UI, otomatis dari data client */}
              {/* Tier aktif: {priceTier} — diisi otomatis saat client dipilih */}

              {/* ── CLIENT SELECTOR ─────────────────────────────────────────────── */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-[11px]">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Pilih dari Master Data Client (Opsional)</span>
                  </div>
                  {/* Tarif aktif — otomatis dari client */}
                  {selectedClientId && (() => {
                    const sel = clients.find(c => c.id === selectedClientId);
                    const tierMap: Record<string,string> = { priceGeoland:'Tier 1 · Geoland', priceBRS:'Tier 2 · BRS', priceUmum:'Tier 3 · Umum' };
                    const colorMap: Record<string,string> = { priceGeoland:'bg-emerald-100 text-emerald-800 border-emerald-300', priceBRS:'bg-blue-100 text-blue-800 border-blue-300', priceUmum:'bg-orange-100 text-orange-800 border-orange-300' };
                    return sel ? (
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${colorMap[sel.defaultPriceTier]}`}>
                        🏷 {tierMap[sel.defaultPriceTier]}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="flex gap-3 items-center">
                  <select
                    value={selectedClientId}
                    onChange={e => handleSelectClient(e.target.value)}
                    className="flex-1 p-2 border border-blue-300 rounded-lg text-xs font-semibold bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="">— Isi manual / Client belum terdaftar —</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.clientCode || '??'}] {c.companyName} — {c.contactPerson}
                      </option>
                    ))}
                  </select>
                  {selectedClientId && (
                    <button
                      type="button"
                      onClick={() => { setSelectedClientId(''); }}
                      className="text-[10px] font-bold text-blue-600 hover:text-red-500 flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      title="Kosongkan pilihan dan isi manual"
                    >
                      <X className="w-3 h-3" /> Reset ke manual
                    </button>
                  )}
                </div>
                {clients.length === 0 && (
                  <p className="text-[10px] text-blue-500">
                    💡 Belum ada client terdaftar. Daftarkan terlebih dahulu di menu <strong>"Master Data Client &amp; Lab Rekanan"</strong> di sidebar.
                  </p>
                )}
              </div>

              {/* ── MANUAL FIELDS (auto-filled when client selected) ─────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">No. Penawaran</label>
                  <input
                    type="text"
                    value={formNo}
                    readOnly
                    tabIndex={-1}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold bg-slate-100 text-slate-700 select-all cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Singkatan / Kode Klien</label>
                    <span className="text-[10px] text-slate-500 font-mono">e.g. TDK, TSK</span>
                  </div>
                  <input
                    type="text"
                    value={formClientCode}
                    onChange={e => {
                      const cleanCode = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormClientCode(cleanCode);
                      setIsFormDirty(true);
                      if (!editingQuoId) {
                        setFormNo(getNextQuotationNo(quotations.map(q => q.quotationNo), cleanCode, new Date()));
                      }
                    }}
                    placeholder="TDK / TSK (opsional)"
                    className="w-full p-2 border border-blue-300 rounded-lg font-mono font-bold uppercase bg-white text-blue-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                  <div className="text-[10px] text-blue-600 mt-1">Kosongkan jika tanpa kode singkatan</div>
                </div>

                <div className="md:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">PIC Klien (Bapak/Ibu)</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={e => { setFormContact(e.target.value); setIsFormDirty(true); }}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    placeholder="Nama PIC klien"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">No. Telp / HP PIC</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => { setFormPhone(e.target.value); setIsFormDirty(true); }}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                    placeholder="08xxx-xxxx-xxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan Klien</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={e => { setFormClient(e.target.value); setIsFormDirty(true); }}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                    placeholder="PT. Nama Perusahaan"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat Klien</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={e => { setFormAddress(e.target.value); setIsFormDirty(true); }}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                    placeholder="Jl. Alamat lengkap..."
                  />
                </div>
              </div>

              {/* ITEMIZED TABLE WITH AUTO LOOKUP */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800">Parameter Uji, Standar SNI &amp; Harga (Auto Lookup)</h4>
                  <button onClick={handleAddItem} className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Tambah Parameter Uji
                  </button>
                </div>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200/70 font-bold border-b border-slate-300 text-slate-700">
                      <th className="p-2 text-left">Pilih Parameter Uji (Master Catalog)</th>
                      <th className="p-2 text-left">Standar Pengujian (SNI)</th>
                      <th className="p-2 text-center w-20">Jumlah Sampel</th>
                      <th className="p-2 text-center w-14">Freq</th>
                      <th className="p-2 text-right w-32">Harga Satuan (Rp)</th>
                      <th className="p-2 text-right w-32">Total (Rp)</th>
                      <th className="p-2 text-center w-10">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formItems.map((item, idx) => {
                      return (
                        <tr key={item.id}>
                          <td className="p-1.5 min-w-[220px]">
                            <PremiumTestTypeSelector
                              value={item.testCode}
                              disabledCodes={formItems.filter((_, i) => i !== idx && !!_.testCode).map(i => i.testCode)}
                              onChange={(selectedCode) => {
                                setIsFormDirty(true);
                                // Validasi jika jenis pengujian sudah dipilih pada baris lain
                                const isDuplicate = formItems.some((other, oIdx) => oIdx !== idx && other.testCode.toUpperCase() === selectedCode.toUpperCase());
                                if (isDuplicate) {
                                  alert(`Jenis pengujian "${selectedCode}" sudah dipilih pada baris lain di penawaran ini!\n\nUntuk menambah jumlah pengujian, silakan sesuaikan pada kolom "Jumlah Sampel" atau "Freq" di baris yang sudah ada.`);
                                  return;
                                }

                                const masterList = getStoredMasterPrices();
                                const master = masterList.find(m => m.code.toUpperCase() === selectedCode.toUpperCase() || m.id === selectedCode);
                                if (!master) return;
                                const unitPrice = master[priceTier] || 0;
                                const updated = [...formItems];
                                const qty  = updated[idx]?.quantity ?? 0;
                                const currentFreq = updated[idx]?.freq;
                                const freq = currentFreq !== undefined && currentFreq > 0 ? currentFreq : 1;
                                updated[idx] = {
                                  ...updated[idx],
                                  testCode: master.code,
                                  testName: master.name,
                                  standardStr: master.standard,
                                  unit: master.unit === 'Sample' ? 'Sampel' : master.unit,
                                  unitPrice,
                                  freq,
                                  subtotal: qty * freq * unitPrice
                                };
                                setFormItems(updated);
                              }}
                            />
                          </td>

                          {/* Standar — LOCKED */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.standardStr || ''}
                              readOnly
                              tabIndex={-1}
                              className="w-full p-1 border border-slate-200 rounded font-mono text-[11px] bg-slate-50 text-slate-500 cursor-not-allowed select-none"
                            />
                          </td>

                          {/* Jumlah Sampel — editable, Tab→Freq, Enter→baris bawah */}
                          <td className="p-1.5">
                            <input
                              id={`qty-${idx}`}
                              type="number"
                              min={0}
                              value={item.quantity === 0 ? '' : item.quantity}
                              placeholder="0"
                              onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  document.getElementById(`freq-${idx}`)?.focus();
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  document.getElementById(`qty-${idx + 1}`)?.focus();
                                }
                              }}
                              className="w-full p-1 border border-emerald-300 rounded text-center font-mono font-bold bg-white focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                            />
                          </td>

                          {/* Freq — editable, default 1, Tab→qty baris bawah, Enter→freq baris bawah */}
                          <td className="p-1.5">
                            <input
                              id={`freq-${idx}`}
                              type="number"
                              min={1}
                              value={item.freq === undefined || item.freq === 0 ? 1 : item.freq}
                              placeholder="1"
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                handleUpdateItem(idx, 'freq', isNaN(val) ? 1 : Math.max(1, val));
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  document.getElementById(`qty-${idx + 1}`)?.focus();
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  document.getElementById(`freq-${idx + 1}`)?.focus();
                                }
                              }}
                              className="w-full p-1 border border-blue-300 rounded text-center font-mono font-bold focus:ring-2 focus:ring-blue-400 focus:outline-none"
                            />
                          </td>

                          {/* Harga Satuan — LOCKED, formatted Rp */}
                          <td className="p-1.5">
                            <div
                              title="Harga dikunci dari Master Tarif sesuai kategori client"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded bg-slate-100 text-right font-mono font-bold text-slate-700 text-[11px] cursor-not-allowed select-none whitespace-nowrap"
                            >
                              Rp {(item.unitPrice || 0).toLocaleString('id-ID')}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </td>

                          {/* Hapus */}
                          <td className="p-1.5 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200/80 font-extrabold text-slate-900">
                      <td colSpan={5} className="p-2 text-right">TOTAL PENAWARAN:</td>
                      <td className="p-2 text-right font-mono text-sm text-emerald-800">
                        Rp {formItems.reduce((s, i) => s + i.subtotal, 0).toLocaleString('id-ID')}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleAttemptCloseForm} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Batal</button>
                <button onClick={handleSaveForm} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer">Simpan &amp; Terbitkan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl border border-amber-200 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">Perubahan Belum Disimpan</h4>
                <p className="text-xs text-slate-500 font-medium">Apakah Anda ingin menyimpan data sebelum keluar?</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              Terdapat perubahan data pada formulir Surat Penawaran Harga ini. Jika Anda keluar tanpa menyimpan, data baru yang Anda isi akan hilang.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSaveForm}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Terbitkan Penawaran</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    setIsFormModalOpen(false);
                    setIsFormDirty(false);
                  }}
                  className="py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl border border-red-300 cursor-pointer transition"
                >
                  Keluar Tanpa Menyimpan
                </button>
                <button
                  onClick={() => setShowUnsavedConfirm(false)}
                  className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition"
                >
                  Kembali ke Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL */}
      {isPreviewModalOpen && selectedQuo && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1000px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Surat Penawaran Harga — {selectedQuo.quotationNo}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-4 h-4" /> Cetak / Save PDF
                </button>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 PAPER CANVAS */}
            <div className="p-6 bg-slate-700 overflow-y-auto flex justify-center">
              <div
                className="bg-white text-slate-900 shadow-2xl print:shadow-none"
                style={{ width: '210mm', minHeight: '297mm', padding: '14mm 16mm 12mm 16mm', fontFamily: "'Arial', sans-serif", fontSize: '10pt', lineHeight: '1.45', color: '#0f172a', display: 'flex', flexDirection: 'column' }}
              >

                {/* ══ KOP SURAT ══════════════════════════════════════════════════ */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '8px', borderBottom: '3px solid #1d4ed8', marginBottom: '10px' }}>
                  <img 
                    src={companyProfile.logoUrl || '/logo.png'} 
                    alt="Logo Perusahaan" 
                    style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14pt', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: 1.1 }}>
                      {companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}
                    </div>
                    <div style={{ fontSize: '9pt', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>
                      {companyProfile.labNameEn || companyProfile.labName || 'Soil Mechanics Laboratory'}
                    </div>
                    <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '3px' }}>
                      {companyProfile.officeAddress || companyProfile.labAddress || 'Jl. Terusan Al Fathu Ruko Linggahara 2 No.2, Soreang, Kab. Bandung, Jawa Barat 40911'}
                    </div>
                    <div style={{ fontSize: '7.5pt', color: '#64748b' }}>
                      Telp: {companyProfile.phone || '022-4572-5093'} &nbsp;·&nbsp; Mobile: {companyProfile.mobile || '0812-1491-4641'} &nbsp;·&nbsp;
                      <span style={{ color: '#1d4ed8' }}>{companyProfile.email || 'soil_test@terraforma.co.id'}</span> &nbsp;·&nbsp; {companyProfile.website || 'www.terraforma.co.id'}
                    </div>
                  </div>
                </div>

                {/* ══ JUDUL ══════════════════════════════════════════════════════ */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11pt', fontWeight: 900, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '2.5px solid #1d4ed8', paddingBottom: '2px' }}>
                    SURAT PENAWARAN HARGA
                  </span>
                </div>

                {/* ══ HEADER INFO (2 kolom) ═══════════════════════════════════════ */}
                <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '0 12px', marginBottom: '10px', fontSize: '9pt' }}>
                  <div>
                    {([
                      ['Kepada', selectedQuo.clientName],
                      ['Alamat', selectedQuo.clientAddress || '-'],
                      ['U.p / PIC', selectedQuo.clientContactPerson || '-'],
                      ['Telp', selectedQuo.clientPhone || '-'],
                      ['E-mail', selectedQuo.clientEmail || '-'],
                    ] as [string,string][]).map(([lbl, val]) => (
                      <div key={lbl} style={{ display: 'flex', marginBottom: '2px' }}>
                        <span style={{ width: '96px', color: '#475569', fontWeight: 600, flexShrink: 0 }}>{lbl}</span>
                        <span style={{ width: '10px', fontWeight: 700 }}>:</span>
                        <span style={{ fontWeight: lbl === 'Kepada' ? 700 : 400, color: '#0f172a', wordBreak: 'break-word' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    {([
                      ['No. Surat', selectedQuo.quotationNo],
                      ['Tanggal', selectedQuo.date],
                    ] as [string,string][]).map(([lbl, val]) => (
                      <div key={lbl} style={{ display: 'flex', marginBottom: '2px' }}>
                        <span style={{ width: '80px', color: '#475569', fontWeight: 600, flexShrink: 0 }}>{lbl}</span>
                        <span style={{ width: '10px', fontWeight: 700 }}>:</span>
                        <span style={{ fontWeight: lbl === 'No. Surat' ? 800 : 600, color: lbl === 'No. Surat' ? '#1d4ed8' : '#0f172a', fontFamily: 'monospace' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ══ KALIMAT PEMBUKA ════════════════════════════════════════════ */}
                <div style={{ fontSize: '9pt', marginBottom: '10px', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '3px' }}>Dengan Hormat,</p>
                  <p>
                    Berdasarkan permintaan pengujian sampel dari <strong>{selectedQuo.clientName}</strong>,
                    kami <strong>Soil Mechanics Laboratory PT. Terraforma Geoteknik Indonesia</strong> dengan
                    ini mengajukan penawaran harga pengujian geoteknik sebagai berikut:
                  </p>
                </div>

                {/* ══ TABEL ITEM ═════════════════════════════════════════════════ */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '8px' }}>
                  <thead>
                    <tr style={{ background: '#1d4ed8', color: 'white', textAlign: 'center' }}>
                      <th style={{ border: '1px solid #1e3a8a', padding: '5px 3px', width: '24px' }} rowSpan={2}>No</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '5px 6px', textAlign: 'left' }} rowSpan={2}>Parameter Uji</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '5px 4px' }} rowSpan={2}>Standar</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '4px', width: '68px' }} colSpan={2}>Sampel</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '4px' }} colSpan={2}>Harga (Rp)</th>
                    </tr>
                    <tr style={{ background: '#1e40af', color: 'white', textAlign: 'center', fontSize: '8pt' }}>
                      <th style={{ border: '1px solid #1e3a8a', padding: '3px', width: '30px' }}>Jml</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '3px', width: '30px' }}>Freq</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '3px 5px', width: '95px', textAlign: 'center' }}>Satuan</th>
                      <th style={{ border: '1px solid #1e3a8a', padding: '3px 5px', width: '125px', textAlign: 'center' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const PHYS_CODES = ['PREP','SVE-HYD','SG','UW','ATB','MC','BD-DD','CMP-STD','CMP-MOD','SND-CONE','PERM','SWELLING','SHRINKAGE','PH','CHLORID','SULFAT','CARBONAT','RESISTIVITY'];
                      const isPhys = (item: QuotationItem) => {
                        if (item.category === 'physical') return true;
                        if (item.category === 'mechanical') return false;
                        return PHYS_CODES.includes((item.testCode || '').toUpperCase());
                      };

                      const physGroup = selectedQuo.items.filter(isPhys);
                      const mechGroup = selectedQuo.items.filter(item => !isPhys(item));
                      let rowNo = 0;

                      return (
                        <>
                          {/* SIFAT FISIK TANAH HEADER & ITEMS */}
                          {physGroup.length > 0 && (
                            <>
                              <tr style={{ background: '#eff6ff', color: '#1d4ed8', fontWeight: 800 }}>
                                <td colSpan={7} style={{ border: '1px solid #bfdbfe', padding: '4px 8px', fontSize: '8.5pt', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                                  A. SIFAT FISIK TANAH (PHYSICAL PROPERTIES)
                                </td>
                              </tr>
                              {physGroup.map((item) => {
                                rowNo++;
                                return (
                                  <tr key={item.id} style={{ background: rowNo % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 3px', textAlign: 'center', fontWeight: 700 }}>{rowNo}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontWeight: 600 }}>{item.testName}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '7.5pt', color: '#374151' }}>{item.standardStr || '-'}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontFamily: 'monospace' }}>{item.freq || 1}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontFamily: 'monospace' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        <span style={{ color: '#64748b' }}>Rp</span>
                                        <span>{item.unitPrice.toLocaleString('id-ID')}</span>
                                      </div>
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        <span>Rp</span>
                                        <span>{item.subtotal.toLocaleString('id-ID')}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          )}

                          {/* SIFAT MEKANIS TANAH HEADER & ITEMS */}
                          {mechGroup.length > 0 && (
                            <>
                              <tr style={{ background: '#faf5ff', color: '#7e22ce', fontWeight: 800 }}>
                                <td colSpan={7} style={{ border: '1px solid #e9d5ff', padding: '4px 8px', fontSize: '8.5pt', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                                  B. SIFAT MEKANIS TANAH (MECHANICAL PROPERTIES)
                                </td>
                              </tr>
                              {mechGroup.map((item) => {
                                rowNo++;
                                return (
                                  <tr key={item.id} style={{ background: rowNo % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 3px', textAlign: 'center', fontWeight: 700 }}>{rowNo}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontWeight: 600 }}>{item.testName}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '7.5pt', color: '#374151' }}>{item.standardStr || '-'}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px', textAlign: 'center', fontFamily: 'monospace' }}>{item.freq || 1}</td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontFamily: 'monospace' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        <span style={{ color: '#64748b' }}>Rp</span>
                                        <span>{item.unitPrice.toLocaleString('id-ID')}</span>
                                      </div>
                                    </td>
                                    <td style={{ border: '1px solid #cbd5e1', padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                                        <span>Rp</span>
                                        <span>{item.subtotal.toLocaleString('id-ID')}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} rowSpan={selectedQuo.discountPct > 0 || selectedQuo.vatAmount > 0 ? 4 : 2}
                        style={{ border: '1px solid #94a3b8', padding: '6px', verticalAlign: 'middle' }}>
                        <div style={{ border: '1px solid #1d4ed8', padding: '6px 8px', background: '#eff6ff', fontStyle: 'italic', fontWeight: 700, fontSize: '8.5pt', color: '#1e293b', textAlign: 'center', borderRadius: '3px' }}>
                          {terbilang(selectedQuo.grandTotal)}
                        </div>
                      </td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '4px 6px', background: '#2563eb', color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>Sub Total</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '4px 6px', background: '#2563eb', color: 'white', fontFamily: 'monospace', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>Rp</span>
                          <span>{selectedQuo.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                    </tr>
                    {selectedQuo.discountPct > 0 && (
                      <tr>
                        <td style={{ border: '1px solid #1e3a8a', padding: '4px 6px', background: '#2563eb', color: 'white', fontWeight: 600, fontSize: '8.5pt', whiteSpace: 'nowrap' }}>Diskon ({selectedQuo.discountPct}%)</td>
                        <td style={{ border: '1px solid #1e3a8a', padding: '4px 6px', background: '#2563eb', color: 'white', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>(Rp</span>
                            <span>{selectedQuo.discountAmount.toLocaleString('id-ID')})</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    {selectedQuo.vatAmount > 0 && (
                      <tr>
                        <td style={{ border: '1px solid #1e3a8a', padding: '4px 6px', background: '#2563eb', color: 'white', fontWeight: 600, fontSize: '8.5pt', whiteSpace: 'nowrap' }}>PPN 11%</td>
                        <td style={{ border: '1px solid #1e3a8a', padding: '4px 6px', background: '#2563eb', color: 'white', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>Rp</span>
                            <span>{selectedQuo.vatAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ border: '1px solid #1e3a8a', padding: '5px 6px', background: '#1e40af', color: 'white', fontWeight: 900, fontSize: '9pt', whiteSpace: 'nowrap' }}>TOTAL</td>
                      <td style={{ border: '1px solid #1e3a8a', padding: '5px 6px', background: '#1e40af', color: 'white', fontFamily: 'monospace', fontWeight: 900, fontSize: '9.5pt', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>Rp</span>
                          <span>{selectedQuo.grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* ══ TANDA TANGAN (MASTER PERSONIL INTEGRATION) ════════════ */}
                {(() => {
                  const headOfLab = (personnelCatalogue || []).find(p => 
                    p.role === 'Approver' && (p.title?.toLowerCase().includes('kepala') || p.name.toLowerCase().includes('yustiadji'))
                  ) || (personnelCatalogue || []).find(p => p.role === 'Approver') || {
                    name: 'Yustiadji',
                    title: 'Kepala Laboratorium',
                    signatureUrl: undefined
                  };

                  const signerName = headOfLab.name || 'Yustiadji';
                  const signerTitle = headOfLab.title || 'Kepala Laboratorium';
                  const signerSignature = headOfLab.signatureUrl;

                  return (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '9pt', marginTop: '16px' }}>
                      <div style={{ textAlign: 'center', width: '240px' }}>
                        <div>Hormat Kami,</div>
                        <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{companyProfile.labNameEn || companyProfile.labName || 'Soil Mechanics Laboratory'}</div>
                        <div style={{ fontWeight: 900, color: '#1d4ed8', fontSize: '8.5pt', textTransform: 'uppercase' }}>{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</div>
                        
                        <div style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0', position: 'relative' }}>
                          {/* CAP STEMPEL RESMI (TERPISAH DARI LOGO - MENGGUNAKAN STAMP URL) */}
                          {(companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png') && (
                            <img 
                              src={companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png'} 
                              alt="Cap Stempel Resmi" 
                              style={{ position: 'absolute', bottom: '-4px', left: '10px', width: '64px', height: '64px', objectFit: 'contain', mixBlendMode: 'multiply', opacity: 0.82, transform: 'rotate(-6deg)', pointerEvents: 'none', zIndex: 20 }} 
                            />
                          )}

                          {signerSignature ? (
                            <img 
                              src={signerSignature} 
                              alt={`Tanda tangan ${signerName}`} 
                              style={{ maxHeight: '52px', maxWidth: '170px', objectFit: 'contain', mixBlendMode: 'multiply', position: 'relative', zIndex: 10 }} 
                            />
                          ) : (
                            <div style={{ fontSize: '8pt', color: '#94a3b8', fontFamily: 'monospace' }}>
                              ( Tanda Tangan &amp; Stempel Lab )
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: '1.5px solid #0f172a', paddingTop: '4px', width: '90%', margin: '0 auto' }}>
                          <div style={{ fontWeight: 700, textDecoration: 'underline' }}>{signerName}</div>
                          <div style={{ fontSize: '8pt', color: '#475569', fontWeight: 600 }}>{signerTitle}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ══ FOOTER ════════════════════════════════════════════════════ */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', color: '#94a3b8' }}>
                  <span>No. Dok: {selectedQuo.quotationNo}</span>
                  <span>{companyProfile.companyName || 'PT. Terraforma Geoteknik Indonesia'} — {companyProfile.labNameEn || 'Soil Mechanics Laboratory'}</span>
                  <span>Hal. 1 / {Math.ceil(selectedQuo.items.length / 15) || 1}</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
