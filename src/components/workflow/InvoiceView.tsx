import React, { useState } from 'react';
import { Invoice, InvoiceItem } from '../../types/workflowTypes';
import { terbilang } from '../../utils/terbilang';
import { getStoredMasterPrices, PriceCategoryKey } from '../../data/masterPriceCatalog';
import { getNextDocNo } from '../../utils/docNumbering';
import { CreditCard, Plus, Printer, FileText, CheckCircle2, DollarSign, Building, Calendar, Edit3, Trash2, X, Download, Tag } from 'lucide-react';

import { PersonnelItem } from '../../types';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';

interface InvoiceViewProps {
  invoices: Invoice[];
  companyProfile?: CompanyProfile;
  onSaveInvoice: (inv: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ invoices, companyProfile = DEFAULT_COMPANY_PROFILE, onSaveInvoice, onDeleteInvoice }) => {
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingInvId, setEditingInvId] = useState<string | null>(null);

  // Form State
  const [formNo, setFormNo] = useState('');
  const [formPoNo, setFormPoNo] = useState('PO-GQT-017');
  const [formReportNo, setFormReportNo] = useState('REP-2026-017');
  const [formTerms, setFormTerms] = useState('7 Hari');
  const [formDueDate, setFormDueDate] = useState('2026-07-20');
  const [formClient, setFormClient] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProject, setFormProject] = useState('');
  const [priceTier, setPriceTier] = useState<PriceCategoryKey>('priceGeoland');
  const [formDiscountPct, setFormDiscountPct] = useState<number>(5);
  const [formPph23Pct, setFormPph23Pct] = useState<number>(2);

  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Preparasi', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 50000, subtotal: 150000 },
    { id: '2', description: 'Moisture Content', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 50000, subtotal: 150000 },
    { id: '3', description: 'Unit Weight', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 60000, subtotal: 180000 },
    { id: '4', description: 'Specific Gravity', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 75000, subtotal: 225000 },
    { id: '5', description: 'Atterberg Limit', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 90000, subtotal: 270000 },
    { id: '6', description: 'Sieve Analysis & Hydrometer', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 135000, subtotal: 405000 },
    { id: '7', description: 'Bulk Density & Dry Density', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 60000, subtotal: 180000 },
    { id: '8', description: 'Direct Shear CD', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 1000000, subtotal: 3000000 },
    { id: '9', description: 'Unconfined Compression Test (UCT)', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 150000, subtotal: 450000 },
    { id: '10', description: 'Triaxial CU', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 500000, subtotal: 1500000 },
    { id: '11', description: 'Consolidation', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 250000, subtotal: 750000 },
    { id: '12', description: 'Permeability', unit: 'Sampel', quantity: 3, freq: 1, unitPrice: 100000, subtotal: 300000 }
  ]);

  const openNewForm = () => {
    setEditingInvId(null);
    const nextNo = getNextDocNo('INV', invoices.map(inv => inv.invoiceNo));
    setFormNo(nextNo);
    setFormPoNo('');
    setFormReportNo('');
    setFormTerms('14 Hari');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    setFormDueDate(dueDate.toISOString().split('T')[0]);
    setFormClient('');
    setFormAddress('');
    setFormProject('');
    setPriceTier('priceGeoland');
    setFormDiscountPct(0);
    setFormPph23Pct(2);
    setFormItems([]);
    setIsFormModalOpen(true);
  };

  const openEditForm = (inv: Invoice) => {
    setEditingInvId(inv.id);
    setFormNo(inv.invoiceNo);
    setFormPoNo(inv.poNumber || '');
    setFormReportNo(inv.reportNo || '');
    setFormTerms(inv.terms || '14 Hari');
    setFormDueDate(inv.dueDate || '');
    setFormClient(inv.clientName || '');
    setFormAddress(inv.clientAddress || '');
    setFormProject(inv.projectName || '');
    setFormDiscountPct(inv.discountPct || 0);
    setFormPph23Pct(inv.pph23Pct !== undefined ? inv.pph23Pct : 2);
    setFormItems(inv.items ? [...inv.items] : []);
    setIsFormModalOpen(true);
  };

  const handleDeleteInv = (inv: Invoice) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Invoice "${inv.invoiceNo}" (${inv.clientName})?`)) {
      if (onDeleteInvoice) {
        onDeleteInvoice(inv.id);
      }
    }
  };

  const handleSelectMasterTest = (index: number, masterId: string) => {
    const masterList = getStoredMasterPrices();
    const master = masterList.find(m => m.id === masterId);
    if (!master) return;

    const unitPrice = master[priceTier] || 0;
    const updated = [...formItems];
    const qty = updated[index]?.quantity || 1;
    const freq = updated[index]?.freq || 1;

    updated[index] = {
      ...updated[index],
      description: master.name,
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
      const master = masterList.find(m => m.name === item.description);
      const newUnitPrice = master ? (master[newTier] || 0) : item.unitPrice;
      return {
        ...item,
        unitPrice: newUnitPrice,
        subtotal: item.quantity * (item.freq || 1) * newUnitPrice
      };
    });
    setFormItems(updated);
  };

  const handleAddItem = () => {
    const masterList = getStoredMasterPrices();
    const defaultMaster = masterList[0];
    const unitPrice = defaultMaster ? (defaultMaster[priceTier] || 50000) : 50000;
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: defaultMaster ? defaultMaster.name : 'Preparasi',
      unit: 'Sampel',
      quantity: 1,
      freq: 1,
      unitPrice,
      subtotal: unitPrice
    };
    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...formItems];
    const item = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice' || field === 'freq') {
      item.subtotal = (Number(item.quantity) || 0) * (Number(item.freq) || 1) * (Number(item.unitPrice) || 0);
    }
    updated[index] = item;
    setFormItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleSaveForm = () => {
    const subtotal = formItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = Math.round(subtotal * (formDiscountPct / 100));
    const subtotalAfterDiscount = subtotal - discountAmount;
    const pph23Amount = Math.round(subtotalAfterDiscount * (formPph23Pct / 100));
    const grandTotal = subtotalAfterDiscount - pph23Amount;

    const existingInv = editingInvId ? invoices.find(i => i.id === editingInvId) : null;

    const newInv: Invoice = {
      id: editingInvId || `inv-${Date.now()}`,
      invoiceNo: formNo,
      date: existingInv?.date || new Date().toISOString().split('T')[0],
      terms: formTerms,
      dueDate: formDueDate,
      poNumber: formPoNo,
      reportNo: formReportNo,
      clientName: formClient,
      clientAddress: formAddress,
      projectName: formProject,
      items: formItems,
      subtotal,
      discountPct: formDiscountPct,
      discountAmount,
      subtotalAfterDiscount,
      pph23Pct: formPph23Pct,
      pph23Amount,
      grandTotal,
      bankAccountName: existingInv?.bankAccountName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA',
      bankName: existingInv?.bankName || 'Bank Mandiri',
      bankAccountNumber: existingInv?.bankAccountNumber || '133 - 00 - 99 - 00 - 8823',
      waConfirmationNo: existingInv?.waConfirmationNo || '0811-2183-223',
      taxNote: existingInv?.taxNote || 'Bukti potong pajak pph 23 (2%) untuk dapat dikirim ke PT. Terraforma Geoteknik Indonesia',
      status: existingInv?.status || 'Unpaid',
      notes: existingInv?.notes || 'Terima kasih atas kepercayaan dan kerja samanya, semoga kolaborasi baik ini dapat terus berlanjut secara berkelanjutan.'
    };

    onSaveInvoice(newInv);
    setIsFormModalOpen(false);
  };

  const handleTogglePaidStatus = (inv: Invoice) => {
    const nextStatus = inv.status === 'Paid' ? 'Unpaid' : 'Paid';
    onSaveInvoice({ ...inv, status: nextStatus });
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-fit mb-1.5">
            <span>TAHAP 6 OPERASIONAL LAB (ISO 17025)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             Penerbitan Invoice Tagihan &amp; Billing (Invoice Management)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Penerbitan tagihan pembayaran resmi berdasarkan pengujian yang aktual sukses diuji (termasuk diskon &amp; potongan PPh 23).
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Invoice Tagihan Baru</span>
        </button>
      </div>

      {/* INVOICE LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Daftar Tagihan Invoice ({invoices.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Ref ORDER NO &amp; Terms</th>
                <th className="py-3 px-4">Tgl &amp; Due Date</th>
                <th className="py-3 px-4">Klien &amp; Proyek</th>
                <th className="py-3 px-4 text-right">Total Invoice</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold font-mono text-emerald-800">{inv.invoiceNo}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    <div>PO: {inv.poNumber || '-'}</div>
                    <div className="text-[11px] text-slate-400">Terms: {inv.terms || '7 Hari'}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{inv.date}</div>
                    <div className="text-[11px] text-red-600 font-semibold">JT: {inv.dueDate}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{inv.clientName}</div>
                    <div className="text-[11px] text-slate-500">{inv.projectName}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold font-mono text-slate-900">
                    Rp {inv.grandTotal.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleTogglePaidStatus(inv)}
                      className={`px-3 py-1 text-[10px] font-extrabold rounded-full border transition cursor-pointer ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                      title="Klik untuk mengubah status pembayaran"
                    >
                      {inv.status === 'Paid' ? ' LUNAS (PAID)' : '⏳ BELUM BAYAR (UNPAID)'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedInv(inv);
                          setIsPreviewModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Cetak Invoice PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </button>

                      <button
                        onClick={() => openEditForm(inv)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Edit Invoice ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteInv(inv)}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Hapus Invoice ini"
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

      {/* FORM CREATE / EDIT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>{editingInvId ? `Edit Invoice Tagihan — ${formNo}` : 'Input Invoice Tagihan Baru (Auto Lookup Price)'}</span>
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              
              {/* TIER SELECTOR BANNER */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>Kategori Tarif Harga Uji:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePriceTierChange('priceGeoland')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      priceTier === 'priceGeoland'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Harga Geoland (Tier 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceTierChange('priceBRS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      priceTier === 'priceBRS'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Harga BRS (Tier 2)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePriceTierChange('priceUmum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      priceTier === 'priceUmum'
                        ? 'bg-blue-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Harga Umum (Tier 3)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Invoice</label>
                  <input type="text" value={formNo} onChange={e => setFormNo(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ORDER NO (No. PO)</label>
                  <input type="text" value={formPoNo} onChange={e => setFormPoNo(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">TERMS</label>
                  <input type="text" value={formTerms} onChange={e => setFormTerms(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">DUE DATE</label>
                  <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tagihan Kepada Yth. (Nama Klien)</label>
                  <input type="text" value={formClient} onChange={e => setFormClient(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-bold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Project</label>
                  <input type="text" value={formProject} onChange={e => setFormProject(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-semibold" />
                </div>
              </div>

              {/* ITEMIZED TABLE */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800">Rincian Jenis Uji Aktual (Auto Price Lookup)</h4>
                  <button onClick={handleAddItem} className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Tambah Item Uji
                  </button>
                </div>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200/70 font-bold border-b border-slate-300 text-slate-700">
                      <th className="p-2 text-left">Pilih Jenis Uji (Master Catalog)</th>
                      <th className="p-2 text-center w-24">Jumlah Sampel</th>
                      <th className="p-2 text-center w-16">Freq</th>
                      <th className="p-2 text-right w-28">Harga Uji (Rp)</th>
                      <th className="p-2 text-right w-32">Amount</th>
                      <th className="p-2 text-center w-10">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formItems.map((item, idx) => {
                      const masterList = getStoredMasterPrices();
                      const matchedMaster = masterList.find(m => m.name === item.description || m.code === item.description);
                      return (
                        <tr key={item.id}>
                          <td className="p-1.5">
                            <select
                              value={matchedMaster?.id || ''}
                              onChange={(e) => {
                                const master = masterList.find(m => m.id === e.target.value);
                                if (!master) return;
                                const unitPrice = master[priceTier] || 0;
                                const updated = [...formItems];
                                const qty = updated[idx]?.quantity || 1;
                                const freq = updated[idx]?.freq || 1;
                                updated[idx] = {
                                  ...updated[idx],
                                  description: master.name,
                                  unit: master.unit === 'Sample' ? 'Sampel' : master.unit,
                                  unitPrice,
                                  subtotal: qty * freq * unitPrice
                                };
                                setFormItems(updated);
                              }}
                              className="w-full p-1 border border-slate-300 rounded font-semibold bg-white text-slate-900"
                            >
                              <option value="">-- Pilih Jenis Pengujian --</option>
                              {masterList.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.code})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1.5">
                            <input type="number" value={item.quantity} onChange={e => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value))} className="w-full p-1 border border-slate-300 rounded text-center font-mono font-bold" />
                          </td>
                          <td className="p-1.5">
                            <input type="number" value={item.freq} onChange={e => handleUpdateItem(idx, 'freq', parseFloat(e.target.value))} className="w-full p-1 border border-slate-300 rounded text-center font-mono" />
                          </td>
                          <td className="p-1.5">
                            <div className="relative flex items-center" title="🔒 Harga Satuan dikunci secara otomatis dari Master Tarif. Anda dapat memilih Kategori Tarif (Geoland, BRS, Umum) atau mengedit Master Tarif di menu Pengaturan.">
                              <input 
                                type="number" 
                                value={item.unitPrice} 
                                readOnly 
                                className="w-full p-1 border border-slate-300 rounded text-right font-mono font-bold bg-slate-100/90 text-slate-800 cursor-not-allowed select-none" 
                              />
                            </div>
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-slate-900">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </td>
                          <td className="p-1.5 text-center">
                            <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer">
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsFormModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Batal</button>
                <button onClick={handleSaveForm} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer">Simpan &amp; Terbitkan Invoice</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL - EXACT REPLICATION OF IMAGE 2 INVOICE REFERENCE */}
      {isPreviewModalOpen && selectedInv && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1000px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Invoice Tagihan - {selectedInv.invoiceNo}</span>
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

            {/* A4 PAPER - EXACT MATCH TO IMAGE 2 INVOICE REFERENCE */}
            <div className="p-6 bg-slate-800 overflow-y-auto flex justify-center">
              <div className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-[11px] space-y-3 border border-slate-300 min-h-[297mm] relative">
                
                {/* KOP SURAT INVOICE */}
                <div className="border-b-2 border-blue-900 pb-2 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={companyProfile.logoUrl || '/logo.png'} alt="Logo" className="w-16 h-16 object-contain" />
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</div>
                      <h1 className="text-xl font-black text-blue-900 tracking-tight leading-none">{companyProfile.labNameEn || companyProfile.labName || 'Soil Mechanics Laboratory'}</h1>
                      <p className="text-[9px] text-slate-600 font-semibold mt-1">
                        {companyProfile.officeAddress || companyProfile.labAddress || 'Jl. Terusan Al Fathu Ruko Linggahara 2 No.2 - Soreang, Bandung - Jawa Barat 40911'}
                      </p>
                      <p className="text-[9px] text-slate-600 font-semibold">Phone {companyProfile.phone || '022-4572-5093'} / {companyProfile.mobile || '0812-1491-4641'}</p>
                    </div>
                  </div>

                  <div className="text-right pt-1">
                    <h2 className="text-xl font-black text-blue-900 uppercase tracking-wider">INVOICE</h2>
                    <div className="text-xs font-bold font-mono text-slate-800">{selectedInv.invoiceNo}</div>
                  </div>
                </div>

                {/* METADATA GRID BOXES */}
                <div className="grid grid-cols-12 gap-3 text-xs font-sans pt-1">
                  <div className="col-span-7 border border-blue-900 p-2.5 rounded-xs space-y-0.5">
                    <div className="font-bold text-slate-700 text-[10px]">Tagihan Kepada Yth.</div>
                    <div className="font-extrabold text-slate-900 text-xs">{selectedInv.clientName}</div>
                    <div className="text-slate-800 leading-tight text-[11px]">{selectedInv.clientAddress}</div>
                  </div>

                  <div className="col-span-5 border-b border-blue-900 pb-1 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">ORDER NO</span>
                      <span className="font-bold text-slate-900 font-mono">: {selectedInv.poNumber || 'PO-GQT-017'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">DATE</span>
                      <span className="font-semibold text-slate-900 font-mono">: {selectedInv.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">TERMS</span>
                      <span className="font-bold text-slate-900">: {selectedInv.terms || '7 Hari'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">DUE DATE</span>
                      <span className="font-bold text-red-600 font-mono">: {selectedInv.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* NAMA PROJECT LINE */}
                <div className="text-xs pt-1">
                  <div className="font-semibold text-slate-700">Nama Project :</div>
                  <div className="font-bold text-slate-900">{selectedInv.projectName}</div>
                </div>

                {/* ITEM TABLE */}
                <table className="w-full border-collapse border border-blue-900 text-xs">
                  <thead>
                    <tr className="bg-[#2563eb] text-white font-bold text-center">
                      <th className="p-2 border border-blue-900 w-10">No</th>
                      <th className="p-2 border border-blue-900 text-left">Jenis Uji</th>
                      <th className="p-2 border border-blue-900 w-20">Jumlah Sampel</th>
                      <th className="p-2 border border-blue-900 w-14">Freq</th>
                      <th className="p-2 border border-blue-900 text-right w-28">Harga Uji</th>
                      <th className="p-2 border border-blue-900 text-right w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {selectedInv.items.map((item, i) => (
                      <tr key={item.id} className="text-slate-900 text-[11px]">
                        <td className="p-1.5 border border-slate-400 text-center font-bold">{i + 1}</td>
                        <td className="p-1.5 border border-slate-400 font-semibold">{item.description}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-mono font-bold">{item.quantity}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-mono">{item.freq || 1}</td>
                        <td className="p-1.5 border border-slate-400 text-right font-mono">Rp {item.unitPrice.toLocaleString('id-ID')}</td>
                        <td className="p-1.5 border border-slate-400 text-right font-mono font-bold">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* SUMMARY & TERBILANG SECTION */}
                <div className="grid grid-cols-12 gap-3 pt-1">
                  <div className="col-span-7">
                    <div className="border border-blue-900 p-3 bg-slate-50 font-serif italic text-xs font-bold text-slate-900 leading-normal tracking-wide h-full flex items-center justify-center text-center">
                      {terbilang(selectedInv.grandTotal)}
                    </div>
                  </div>

                  <div className="col-span-5 border border-blue-900 divide-y divide-blue-900 text-xs font-sans">
                    <div className="flex justify-between p-1.5 bg-slate-50 font-semibold">
                      <span>Sub Total Pengujian</span>
                      <span className="font-mono font-bold">Rp {selectedInv.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                    {selectedInv.discountAmount > 0 && (
                      <div className="flex justify-between p-1.5 bg-slate-50 text-slate-800">
                        <span>Discount ({selectedInv.discountPct}%)</span>
                        <span className="font-mono font-bold text-red-600">-Rp {selectedInv.discountAmount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-1.5 bg-slate-50 font-semibold">
                      <span>Sub Total Setelah Discount</span>
                      <span className="font-mono font-bold">Rp {(selectedInv.subtotalAfterDiscount || selectedInv.subtotal).toLocaleString('id-ID')}</span>
                    </div>
                    {selectedInv.pph23Amount > 0 && (
                      <div className="flex justify-between p-1.5 bg-slate-50 text-slate-800">
                        <span>PPh 23 ({selectedInv.pph23Pct || 2}%)</span>
                        <span className="font-mono font-bold text-red-600">-Rp {selectedInv.pph23Amount.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-1.5 bg-blue-900 text-white font-extrabold text-sm">
                      <span>TOTAL</span>
                      <span className="font-mono">Rp {selectedInv.grandTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* BANK TRANSFER & INSTRUCTION BOX */}
                <div className="grid grid-cols-12 gap-3 pt-2">
                  <div className="col-span-7 border border-blue-900 p-2.5 rounded-xs text-[10px] space-y-1 bg-slate-50">
                    <div className="font-bold text-blue-900 text-xs border-b border-blue-200 pb-0.5">Pembayaran ditujukan Kepada :</div>
                    <div className="grid grid-cols-12 pt-0.5">
                      <span className="col-span-4 font-semibold text-slate-700">Nama Bank</span>
                      <span className="col-span-8 font-bold text-slate-900">: {selectedInv.bankName || companyProfile.bankName || 'Bank Mandiri'}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 font-semibold text-slate-700">Atas Nama</span>
                      <span className="col-span-8 font-bold text-slate-900">: {selectedInv.bankAccountName || companyProfile.bankAccountName || companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 font-semibold text-slate-700">No Rekening</span>
                      <span className="col-span-8 font-bold font-mono text-blue-900 text-xs">: {selectedInv.bankAccountNumber || companyProfile.bankAccountNumber || '133 - 00 - 99 - 00 - 8823'}</span>
                    </div>
                    <div className="grid grid-cols-12">
                      <span className="col-span-4 font-semibold text-slate-700">Konfirmasi Pembayaran</span>
                      <span className="col-span-8 font-semibold text-slate-900">: Melalui No WA <strong className="font-mono text-blue-900">{selectedInv.waConfirmationNo || companyProfile.waConfirmationNo || '0811-2183-223'}</strong></span>
                    </div>
                    <div className="pt-1 text-[9.5px] italic text-slate-700 border-t border-slate-300">
                      <strong>Catatan :</strong> {selectedInv.taxNote || companyProfile.taxNote || 'Bukti potong pajak pph 23 (2%) untuk dapat dikirim ke PT. Terraforma Geoteknik Indonesia'}
                    </div>
                  </div>

                  <div className="col-span-5 text-center flex flex-col justify-between pt-2">
                    <div className="font-bold text-slate-900 text-xs uppercase">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</div>
                    <div className="relative pt-6 border-b border-slate-900 w-48 mx-auto flex flex-col items-center">
                      {/* CAP STEMPEL RESMI (TERPISAH DARI LOGO - MENGGUNAKAN STAMP URL) */}
                      {(companyProfile.stampUrl || companyProfile.logoUrl) && (
                        <img 
                          src={companyProfile.stampUrl || companyProfile.logoUrl} 
                          alt="Cap Stempel Resmi" 
                          className="absolute -top-3 left-1 w-16 h-16 object-contain mix-blend-multiply opacity-80 rotate-[-6deg] pointer-events-none select-none z-10" 
                        />
                      )}
                      <div className="font-bold text-slate-900 text-xs underline relative z-20">{companyProfile.directorName || 'Ir. Hartawi Riskha, S.T'}</div>
                    </div>
                    <div className="text-[10px] text-slate-700 font-semibold -mt-2">{companyProfile.directorTitle || 'Interim Operations Director'}</div>
                  </div>
                </div>

                {/* CLOSING REMARKS & FOOTER BAR */}
                <div className="pt-4 border-t border-slate-300 text-center space-y-1 text-[10px]">
                  <p className="italic text-slate-700 font-medium">
                    "Terima kasih atas kepercayaan dan kerja samanya, semoga kolaborasi baik ini dapat terus berlanjut secara berkelanjutan."
                  </p>
                  <div className="flex justify-between items-center text-[9px] font-semibold text-slate-600 bg-slate-100 p-1.5 rounded-xs border border-slate-200">
                    <div><strong>{companyProfile.labNameEn || 'SOIL MECHANICS LAB'} :</strong> {companyProfile.labAddress || companyProfile.officeAddress || 'Jl. Terusan Al Fathu Ruko Linggahara 2 No.2 - Soreang, Bandung - Jawa Barat 40911'}</div>
                    <div>Phone: {companyProfile.phone || '022-4572-5093'} · Mobile: {companyProfile.mobile || '0812-1491-4641'}</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
