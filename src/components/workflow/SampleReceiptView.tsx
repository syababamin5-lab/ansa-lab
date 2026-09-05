import React, { useState, useRef } from 'react';
import { SampleReceipt, SampleReceiptItem, SampleReceiptPhoto, Quotation, Client } from '../../types/workflowTypes';
import { PackageCheck, Plus, Printer, FileText, CheckCircle2, User, Truck, X, Image as ImageIcon, Trash2, Edit3, Search, FileSpreadsheet, Upload, Download, AlertTriangle } from 'lucide-react';
import { getNextDocNo, getNextSampleReceiptNo, getNextCustomerPoNo } from '../../utils/docNumbering';
import { parseSoilLabExcel, downloadSampleImportTemplate } from '../../utils/excelParser';

import { PersonnelItem } from '../../types';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';

interface SampleReceiptViewProps {
  receipts: SampleReceipt[];
  quotations?: Quotation[];
  clients?: Client[];
  personnelCatalogue?: PersonnelItem[];
  companyProfile?: CompanyProfile;
  onSaveReceipt: (receipt: SampleReceipt) => void;
  onDeleteReceipt?: (id: string) => void;
}

const DAYS_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const SampleReceiptView: React.FC<SampleReceiptViewProps> = ({ receipts, quotations = [], clients = [], personnelCatalogue = [], companyProfile = DEFAULT_COMPANY_PROFILE, onSaveReceipt, onDeleteReceipt }) => {
  const [selectedReceipt, setSelectedReceipt] = useState<SampleReceipt | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [selectedQuoId, setSelectedQuoId] = useState<string>('');

  // Form State
  const [formDocCode, setFormDocCode] = useState('COC.SMP');
  const [formNo, setFormNo] = useState('');
  const [formRawDate, setFormRawDate] = useState('2026-09-05');
  const [formDay, setFormDay] = useState('Sabtu');
  const [formDate, setFormDate] = useState('5 September 2026');
  const [formTime, setFormTime] = useState('14:00 WIB');
  const [formClient, setFormClient] = useState('');
  const [formClientCode, setFormClientCode] = useState('');
  const [formProjectCode, setFormProjectCode] = useState('');
  const [formProjectName, setFormProjectName] = useState('');
  const [formReceiver, setFormReceiver] = useState('Syabaab Amin A');

  // Form dirty state & unsaved modal
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const handleDateInputChange = (isoDate: string) => {
    setIsFormDirty(true);
    setFormRawDate(isoDate);
    if (!isoDate) return;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return;

    const dayName = DAYS_INDO[d.getDay()];
    const dayNum = d.getDate();
    const monthName = MONTHS_INDO[d.getMonth()];
    const yearNum = d.getFullYear();

    setFormDay(dayName);
    setFormDate(`${dayNum} ${monthName} ${yearNum}`);

    // Jika form baru, perbarui nomor COC.SMP dan Customer PO sesuai tanggal yang dipilih
    if (!editingReceiptId) {
      setFormNo(getNextSampleReceiptNo(receipts.map(r => r.receiptNo), isoDate));
      setFormProjectCode(getNextCustomerPoNo(receipts.map(r => r.projectCode), formClientCode, isoDate));
    }
  };
  
  // Excel Upload state & ref
  const [isExcelImporting, setIsExcelImporting] = useState(false);
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleReceiptExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExcelImporting(true);
    try {
      const res = await parseSoilLabExcel(file);
      if (res.samples && res.samples.length > 0) {
        setIsFormDirty(true);
        const importedItems: SampleReceiptItem[] = res.samples.map((s, idx) => {
          const f = (s.depthStart !== undefined && !isNaN(s.depthStart)) ? s.depthStart.toFixed(2) : '';
          const t = (s.depthEnd !== undefined && !isNaN(s.depthEnd)) ? s.depthEnd.toFixed(2) : '';
          const depthRange = (f || t) ? `${f || '0.00'} - ${t || '0.00'} m` : (s.rawDepthStr || '');
          return {
            id: `receipt-item-excel-${Date.now()}-${idx}`,
            sampleCode: s.sampleCode,
            depthFrom: f,
            depthTo: t,
            depthRange,
            condition: 'Baik',
            packingType: '-',
            remark: '-'
          };
        });

        setFormItems(importedItems);
      } else {
        alert('Tidak ditemukan baris sampel valid di dalam file Excel. Pastikan mengisi kolom Sample Code / Sample Initial.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file Excel. Pastikan format file .xlsx atau .csv valid.');
    } finally {
      setIsExcelImporting(false);
      e.target.value = '';
    }
  };

  const [formPhotos, setFormPhotos] = useState<SampleReceiptPhoto[]>([]);
  const [formItems, setFormItems] = useState<SampleReceiptItem[]>([]);

  const formatTwoDecimals = (val: string | number | undefined): string => {
    if (val === '' || val === undefined || val === null) return '';
    const num = parseFloat(val.toString());
    if (isNaN(num)) return '';
    return num.toFixed(2);
  };

  const updateDepthItem = (index: number, fromVal: string, toVal: string) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    const fFormatted = formatTwoDecimals(fromVal);
    const tFormatted = formatTwoDecimals(toVal);
    const depthStr = (fromVal !== '' || toVal !== '') ? `${fFormatted || '0.00'} - ${tFormatted || '0.00'} m` : '';

    updated[index] = {
      ...updated[index],
      depthFrom: fromVal,
      depthTo: toVal,
      depthRange: depthStr
    };
    setFormItems(updated);
  };

  const handleDepthBlur = (index: number, fromVal: string, toVal: string) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    const fFormatted = formatTwoDecimals(fromVal);
    const tFormatted = formatTwoDecimals(toVal);
    const depthStr = (fFormatted || tFormatted) ? `${fFormatted || '0.00'} - ${tFormatted || '0.00'} m` : '';

    updated[index] = {
      ...updated[index],
      depthFrom: fFormatted,
      depthTo: tFormatted,
      depthRange: depthStr
    };
    setFormItems(updated);
  };

  const openNewForm = () => {
    setEditingReceiptId(null);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setSelectedQuoId('');
    setFormClientCode('');
    setFormDocCode('COC.SMP');
    const todayIso = new Date().toISOString().split('T')[0];
    const nextNo = getNextSampleReceiptNo(receipts.map(r => r.receiptNo), todayIso);
    setFormNo(nextNo);
    const nextPo = getNextCustomerPoNo(receipts.map(r => r.projectCode), '', todayIso);
    setFormProjectCode(nextPo);
    handleDateInputChange(todayIso);
    setFormTime('14:00 WIB');
    setFormClient('');
    setFormProjectName('');
    setFormReceiver('Syabaab Amin A');
    setFormItems([
      { id: Date.now().toString(), sampleCode: '', depthRange: '', depthFrom: '', depthTo: '', condition: 'Baik', packingType: '-', remark: '-' }
    ]);
    setFormPhotos([]);
    setIsFormModalOpen(true);
    setIsFormDirty(false);
  };

  const openEditForm = (receipt: SampleReceipt) => {
    setEditingReceiptId(receipt.id);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);

    // Deteksi kode client dari projectCode (CPO.[KODE].[YYMMDD]) atau dari data master clients
    const cpoMatch = (receipt.projectCode || '').match(/^CPO\.([A-Z0-9]+)\./i);
    if (cpoMatch && cpoMatch[1]) {
      setFormClientCode(cpoMatch[1]);
    } else {
      const cl = clients.find(c => c.companyName.toLowerCase().trim() === (receipt.clientName || '').toLowerCase().trim());
      setFormClientCode(cl?.clientCode || '');
    }

    setFormDocCode(receipt.docCode || 'SKS-23-002');
    setFormNo(receipt.receiptNo);
    setFormDay(receipt.dayName);
    setFormDate(receipt.date);
    setFormTime(receipt.timeStr);
    setFormClient(receipt.clientName);
    setFormProjectCode(receipt.projectCode);
    setFormProjectName(receipt.projectName);
    setFormReceiver(receipt.labReceiverName);

    const parsedItems = (receipt.items || []).map(item => {
      let f = item.depthFrom;
      let t = item.depthTo;
      if ((f === undefined || t === undefined) && item.depthRange) {
        const cleaned = item.depthRange.replace('m', '').trim();
        const parts = cleaned.split('-');
        if (parts.length === 2) {
          const numF = parseFloat(parts[0].trim());
          const numT = parseFloat(parts[1].trim());
          f = !isNaN(numF) ? numF.toFixed(2) : parts[0].trim();
          t = !isNaN(numT) ? numT.toFixed(2) : parts[1].trim();
        }
      }
      return {
        ...item,
        depthFrom: f || '',
        depthTo: t || ''
      };
    });

    setFormItems(parsedItems);
    setFormPhotos(receipt.photos || []);
    setIsFormModalOpen(true);
    setIsFormDirty(false);
  };

  const handleAddItem = () => {
    setIsFormDirty(true);
    const newItem: SampleReceiptItem = {
      id: Date.now().toString(),
      sampleCode: '',
      depthRange: '',
      depthFrom: '',
      depthTo: '',
      condition: 'Baik',
      packingType: '-',
      remark: '-'
    };
    setFormItems([...formItems, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof SampleReceiptItem, val: any) => {
    setIsFormDirty(true);
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: val };
    setFormItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setIsFormDirty(true);
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleAddPhotoSlot = () => {
    setIsFormDirty(true);
    const newP: SampleReceiptPhoto = {
      id: `photo-${Date.now()}`,
      title: `Foto ${formPhotos.length + 1}: Sampel / Packing`,
      dataUrl: ''
    };
    setFormPhotos([...formPhotos, newP]);
  };

  const handleUpdatePhoto = (index: number, field: keyof SampleReceiptPhoto, val: string) => {
    setIsFormDirty(true);
    const updated = [...formPhotos];
    updated[index] = { ...updated[index], [field]: val };
    setFormPhotos(updated);
  };

  const handleRemovePhoto = (index: number) => {
    setIsFormDirty(true);
    setFormPhotos(formPhotos.filter((_, i) => i !== index));
  };

  const handleAttemptCloseForm = () => {
    if (isFormDirty) {
      setShowUnsavedConfirm(true);
    } else {
      setIsFormModalOpen(false);
    }
  };

  const handleSaveForm = () => {
    // Pastikan nomor tanda terima terisi dan dijamin 100% unik tanpa duplikasi
    let finalReceiptNo = formNo.trim();
    if (!finalReceiptNo) {
      finalReceiptNo = getNextSampleReceiptNo(receipts.map(r => r.receiptNo), formRawDate || new Date());
    } else if (!editingReceiptId) {
      const isDup = receipts.some(r => r.receiptNo.trim().toUpperCase() === finalReceiptNo.toUpperCase());
      if (isDup) {
        finalReceiptNo = getNextSampleReceiptNo(receipts.map(r => r.receiptNo), formRawDate || new Date());
      }
    } else {
      const isDup = receipts.some(r => r.id !== editingReceiptId && r.receiptNo.trim().toUpperCase() === finalReceiptNo.toUpperCase());
      if (isDup) {
        alert(`Nomor Tanda Terima "${finalReceiptNo}" sudah digunakan pada dokumen lain. Nomor disesuaikan otomatis.`);
        finalReceiptNo = getNextSampleReceiptNo(receipts.map(r => r.receiptNo), formRawDate || new Date());
      }
    }

    // Pastikan nomor PO (Customer PO) tidak kosong dan tidak duplikat jika menggunakan format CPO
    let finalPoNo = formProjectCode.trim();
    if (!finalPoNo) {
      finalPoNo = getNextCustomerPoNo(receipts.map(r => r.projectCode), formClientCode, formRawDate || new Date());
    } else if (!editingReceiptId && finalPoNo.toUpperCase().startsWith('CPO.')) {
      const isDup = receipts.some(r => (r.projectCode || '').trim().toUpperCase() === finalPoNo.toUpperCase());
      if (isDup) {
        finalPoNo = getNextCustomerPoNo(receipts.map(r => r.projectCode), formClientCode, formRawDate || new Date());
      }
    }

    const receiptToSave: SampleReceipt = {
      id: editingReceiptId || `batt-${Date.now()}`,
      docCode: formDocCode,
      receiptNo: finalReceiptNo,
      dayName: formDay,
      date: formDate,
      timeStr: formTime,
      clientName: formClient,
      projectCode: finalPoNo,
      projectName: formProjectName,
      labReceiverName: formReceiver,
      items: formItems,
      photos: formPhotos,
      status: 'In_Inspection'
    };
    onSaveReceipt(receiptToSave);
    setIsFormDirty(false);
    setShowUnsavedConfirm(false);
    setIsFormModalOpen(false);
  };

  const handleDelete = (receipt: SampleReceipt) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Tanda Terima Sampel No. "${receipt.receiptNo}"?`)) {
      if (onDeleteReceipt) {
        onDeleteReceipt(receipt.id);
      }
    }
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 w-fit mb-1.5">
            <span>TAHAP 2 OPERASIONAL LAB (ISO 17025)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
             Berita Acara / Surat Tanda Terima Sampel (COC.SMP)
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pencatatan fisik sampel tanah yang baru diterima di lab &amp; penerbitan dokumen Tanda Terima Sampel resmi + Halaman Lampiran Foto (tanpa batasan jumlah foto).
          </p>
        </div>

        <button
          onClick={openNewForm}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tanda Terima Sampel Baru</span>
        </button>
      </div>

      {/* LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-teal-600" />
            <span>Daftar Tanda Terima Sampel Aktif ({receipts.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Nomor Tanda Terima</th>
                <th className="py-3 px-4">Tgl &amp; Waktu Terima</th>
                <th className="py-3 px-4">Klien &amp; Proyek</th>
                <th className="py-3 px-4 text-center">Jumlah Sampel</th>
                <th className="py-3 px-4 text-center">Foto Kedatangan</th>
                <th className="py-3 px-4 text-center">Penerima Lab</th>
                <th className="py-3 px-4 text-center">Aksi &amp; Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold font-mono text-teal-800">{r.receiptNo}</td>
                  <td className="py-3 px-4 text-slate-600">{r.dayName}, {r.date} ({r.timeStr})</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{r.clientName}</div>
                    <div className="text-[11px] text-slate-500">{r.projectName}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{r.items.length} Sampel</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-teal-800">
                    <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-200 text-[11px]">
                       {r.photos?.length || 0} Foto
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{r.labReceiverName}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedReceipt(r);
                          setIsPreviewModalOpen(true);
                        }}
                        className="p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition cursor-pointer shadow-xs"
                        title="Cetak PDF Document"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => openEditForm(r)}
                        className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition cursor-pointer shadow-xs"
                        title="Edit Tanda Terima Sampel ini"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(r)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg transition cursor-pointer shadow-xs"
                        title="Hapus Tanda Terima Sampel ini"
                      >
                        <Trash2 className="w-4 h-4" />
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
                <PackageCheck className="w-4 h-4 text-teal-400" />
                <span>{editingReceiptId ? 'Edit Tanda Terima Sampel' : 'Input Tanda Terima Sampel Baru'}</span>
              </h3>
              <button onClick={handleAttemptCloseForm} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* PULL FROM QUOTATION SELECTOR */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-teal-900 flex items-center gap-2 text-xs">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Pilih Surat Penawaran Harga / Quotation (Tarik Data Klien &amp; PO)</span>
                  </label>
                  {selectedQuoId && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-600 text-white flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Data Terhubung
                    </span>
                  )}
                </div>
                <select
                  value={selectedQuoId}
                  onChange={(e) => {
                    const qId = e.target.value;
                    setSelectedQuoId(qId);
                    const q = quotations.find(item => item.id === qId);
                    if (q) {
                      setFormClient(q.clientName || '');
                      
                      // Dapatkan kode klien dari nomor penawaran (mis: Q-TDK-001-IX-26 -> TDK) atau master clients
                      let clientCode = '';
                      const qMatch = (q.quotationNo || '').match(/^Q-([A-Z0-9]+)-\d{3}-/i);
                      if (qMatch && qMatch[1]) {
                        clientCode = qMatch[1];
                      } else if (clients && clients.length > 0) {
                        const cl = clients.find(c => c.companyName.toLowerCase().trim() === (q.clientName || '').toLowerCase().trim());
                        if (cl && cl.clientCode) clientCode = cl.clientCode;
                      }
                      setFormClientCode(clientCode);

                      // Buat Nomor Customer PO otomatis: CPO.[KODE].[YYMMDD].[001]
                      const autoPoNo = getNextCustomerPoNo(
                        receipts.map(r => r.projectCode),
                        clientCode,
                        formRawDate || new Date()
                      );
                      setFormProjectCode(autoPoNo);

                      if (q.projectName) {
                        setFormProjectName(q.projectLocation ? `${q.projectName} - ${q.projectLocation}` : q.projectName);
                      }
                    } else {
                      setFormClientCode('');
                      if (!editingReceiptId) {
                        setFormProjectCode(getNextCustomerPoNo(receipts.map(r => r.projectCode), '', formRawDate || new Date()));
                      }
                    }
                  }}
                  className="w-full p-2 border border-teal-300 rounded-lg font-bold bg-white text-slate-900 text-xs shadow-xs focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="">-- Buat Tanda Terima Manual (Tanpa Quotation) --</option>
                  {quotations.filter(q => {
                    // Hanya tampilkan Quotation yang BELUM pernah dibuatkan Tanda Terima (receipt)
                    // ATAU Quotation yang sedang dihubungkan pada Tanda Terima ini (selectedQuoId === q.id)
                    const isUsedInOtherReceipt = receipts.some(r => 
                      (r.projectCode === q.quotationNo || (q.poNumber && r.projectCode === q.poNumber)) && 
                      r.id !== editingReceiptId
                    );
                    return !isUsedInOtherReceipt || selectedQuoId === q.id;
                  }).map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quotationNo} — {q.clientName} ({q.items?.length || 0} Parameter Uji{q.projectName ? ` | ${q.projectName}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Tanda Terima</label>
                  <input
                    type="text"
                    value={formNo}
                    readOnly
                    tabIndex={-1}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 bg-slate-100 cursor-not-allowed select-all"
                    placeholder="COC.SMP.260905.001"
                  />
                  {editingReceiptId && (
                    <div className="flex justify-end mt-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          const newFmt = getNextSampleReceiptNo(receipts.filter(r => r.id !== editingReceiptId).map(r => r.receiptNo), formRawDate || new Date());
                          setFormNo(newFmt);
                          setIsFormDirty(true);
                        }}
                        className="text-teal-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        title="Perbarui nomor dokumen ke format standar COC.SMP.YYMMDD.001"
                      >
                        🔄 Terapkan Format Baru
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hari &amp; Tanggal Terima</label>
                  <div className="flex gap-1.5 items-center">
                    <input 
                      type="text" 
                      value={formDay} 
                      readOnly 
                      className="w-24 p-2 border border-slate-300 rounded-lg font-extrabold bg-slate-100/90 text-teal-800 text-center cursor-not-allowed select-none" 
                    />
                    <input 
                      type="date" 
                      value={formRawDate} 
                      onChange={e => handleDateInputChange(e.target.value)} 
                      className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white" 
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Waktu Kedatangan</label>
                  <input type="text" value={formTime} onChange={e => setFormTime(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Klien / Perusahaan</label>
                  <input
                    type="text"
                    value={formClient}
                    onChange={e => {
                      const newClient = e.target.value;
                      setFormClient(newClient);
                      setIsFormDirty(true);
                      if (!editingReceiptId && !selectedQuoId) {
                        const matched = (clients || []).find(c => c.companyName.toLowerCase().trim() === newClient.toLowerCase().trim());
                        const cCode = matched?.clientCode || '';
                        setFormClientCode(cCode);
                        setFormProjectCode(getNextCustomerPoNo(receipts.map(r => r.projectCode), cCode, formRawDate || new Date()));
                      }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor PO (Customer PO)</label>
                  <input
                    type="text"
                    value={formProjectCode}
                    readOnly
                    tabIndex={-1}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 bg-slate-100 cursor-not-allowed select-all"
                    placeholder="CPO.TDK.260905.001"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Penerima Sampel (Lab)</label>
                  <select
                    value={formReceiver}
                    onChange={e => {
                      setIsFormDirty(true);
                      setFormReceiver(e.target.value);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold bg-white text-slate-900 cursor-pointer focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Penerima Sampel (Lab) --</option>
                    {(personnelCatalogue || []).map(p => (
                      <option key={p.id || p.name} value={p.name}>
                        {p.name} {p.title ? `(${p.title})` : `(${p.role})`} {p.signatureUrl || p.digitalSignatureUrl ? '✍' : ''}
                      </option>
                    ))}
                    {formReceiver && !(personnelCatalogue || []).some(p => p.name.toLowerCase().trim() === formReceiver.toLowerCase().trim()) && (
                      <option value={formReceiver}>{formReceiver} (Manual / Kustom)</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Project</label>
                <input type="text" value={formProjectName} onChange={e => setFormProjectName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-semibold" />
              </div>

              {/* ITEMIZED SAMPLE TABLE */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-2">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-teal-600" />
                    <span>Daftar Rincian Sampel Diterima ({formItems.length} Sampel)</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadSampleImportTemplate}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      <Download className="w-3.5 h-3.5 text-teal-600" />
                      <span>Template Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => excelFileInputRef.current?.click()}
                      disabled={isExcelImporting}
                      className="px-3 py-1 bg-teal-700 hover:bg-teal-600 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isExcelImporting ? 'Membaca...' : 'Upload Excel'}</span>
                    </button>
                    <input
                      type="file"
                      ref={excelFileInputRef}
                      accept=".xlsx, .xls, .csv"
                      onChange={handleReceiptExcelUpload}
                      className="hidden"
                    />

                    <button onClick={handleAddItem} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs">
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris Sampel
                    </button>
                  </div>
                </div>

                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200/70 font-bold border-b border-slate-300 text-slate-700">
                      <th className="p-2 text-left">Kode Sampel / Project</th>
                      <th className="p-2 text-center w-52">Kedalaman (m) [From - To]</th>
                      <th className="p-2 text-center w-28">Keadaan Sampel</th>
                      <th className="p-2 text-center w-28">Jenis Packing</th>
                      <th className="p-2 text-left">Keterangan</th>
                      <th className="p-2 text-center w-10">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {formItems.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="Mis: BH-01 / UDS-1"
                            value={item.sampleCode}
                            onChange={e => handleUpdateItem(idx, 'sampleCode', e.target.value)}
                            className="w-full p-1 border border-slate-300 rounded font-mono font-bold bg-white"
                          />
                        </td>
                        <td className="p-1.5">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.depthFrom ?? ''}
                              onChange={e => updateDepthItem(idx, e.target.value, item.depthTo || '')}
                              onBlur={e => handleDepthBlur(idx, item.depthFrom || '', item.depthTo || '')}
                              className="w-20 p-1 border border-slate-300 rounded text-center font-mono text-xs font-bold bg-white"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.50"
                              value={item.depthTo ?? ''}
                              onChange={e => updateDepthItem(idx, item.depthFrom || '', e.target.value)}
                              onBlur={e => handleDepthBlur(idx, item.depthFrom || '', item.depthTo || '')}
                              className="w-20 p-1 border border-slate-300 rounded text-center font-mono text-xs font-bold bg-white"
                            />
                            <span className="text-[10px] text-slate-500 font-bold">m</span>
                          </div>
                        </td>
                        <td className="p-1.5">
                          <input type="text" value={item.condition} onChange={e => handleUpdateItem(idx, 'condition', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-center font-semibold bg-white" />
                        </td>
                        <td className="p-1.5">
                          <input type="text" value={item.packingType} onChange={e => handleUpdateItem(idx, 'packingType', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-center bg-white" />
                        </td>
                        <td className="p-1.5">
                          <input type="text" value={item.remark} onChange={e => handleUpdateItem(idx, 'remark', e.target.value)} className="w-full p-1 border border-slate-300 rounded bg-white" />
                        </td>
                        <td className="p-1.5 text-center">
                          <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer">
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* UNLIMITED MULTI-PHOTO UPLOAD SECTION */}
              <div className="border border-teal-200 rounded-xl p-3.5 bg-teal-50/60 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-extrabold text-teal-900 flex items-center gap-2 text-xs">
                      <ImageIcon className="w-4 h-4 text-teal-600" />
                      <span>Lampiran Foto Kedatangan Sampel ({formPhotos.length} Foto)</span>
                    </h4>
                    <p className="text-[11px] text-teal-700 mt-0.5">Anda dapat mengunggah foto sebanyak mungkin tanpa batasan untuk dokumen tanda terima ini.</p>
                  </div>
                  <button
                    onClick={handleAddPhotoSlot}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Tambah Foto Kedatangan
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {formPhotos.map((photo, idx) => (
                    <div key={photo.id} className="border border-slate-300 rounded-xl p-3 bg-white space-y-2 relative shadow-xs flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-800 text-[11px]">Foto #{idx + 1}</span>
                          <button
                            onClick={() => handleRemovePhoto(idx)}
                            className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer"
                            title="Hapus foto ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={photo.title}
                          onChange={e => handleUpdatePhoto(idx, 'title', e.target.value)}
                          className="w-full p-1 text-[11px] border border-slate-300 rounded font-semibold text-slate-900"
                          placeholder="Judul / Keterangan Foto"
                        />
                      </div>

                      {photo.dataUrl ? (
                        <div className="h-32 border border-slate-200 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center p-1 my-1">
                          <img src={photo.dataUrl} alt={photo.title} className="max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-32 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 font-semibold my-1">
                          Belum ada foto diunggah
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const rawDataUrl = reader.result as string;
                              // Compress image to max 800px & 0.7 JPEG quality to guarantee lightweight storage footprint
                              const img = new Image();
                              img.src = rawDataUrl;
                              img.onload = () => {
                                const maxWidth = 800;
                                const maxHeight = 800;
                                let w = img.width;
                                let h = img.height;
                                if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
                                if (h > maxHeight) { w = Math.round((w * maxHeight) / h); h = maxHeight; }
                                const canvas = document.createElement('canvas');
                                canvas.width = w;
                                canvas.height = h;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, w, h);
                                  handleUpdatePhoto(idx, 'dataUrl', canvas.toDataURL('image/jpeg', 0.7));
                                } else {
                                  handleUpdatePhoto(idx, 'dataUrl', rawDataUrl);
                                }
                              };
                              img.onerror = () => handleUpdatePhoto(idx, 'dataUrl', rawDataUrl);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-slate-600 text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-teal-100 file:text-teal-800 hover:file:bg-teal-200 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={handleAttemptCloseForm} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">Batal</button>
                <button onClick={handleSaveForm} className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl shadow-md cursor-pointer">
                  {editingReceiptId ? 'Simpan Perubahan' : 'Simpan & Terbitkan Tanda Terima'}
                </button>
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
              Terdapat perubahan data pada formulir Tanda Terima Sampel ini. Jika Anda keluar tanpa menyimpan, data baru yang Anda isi akan hilang.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSaveForm}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Terbitkan Tanda Terima</span>
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
      {isPreviewModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-[95vw] max-w-[1050px] max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-white">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span>Cetak Tanda Terima Sampel &amp; Foto - {selectedReceipt.receiptNo}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer">
                  <Printer className="w-4 h-4" /> Cetak / Save PDF
                </button>
                <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 PAPER MULTI-PAGE */}
            <div className="p-6 bg-slate-800 overflow-y-auto flex flex-col items-center gap-6">
              
              {/* HALAMAN 1: METADATA & TABEL SAMPEL */}
              <div className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-xs space-y-4 border border-slate-300 min-h-[297mm] relative">

                <div className="border-b-2 border-blue-900 pb-2 flex items-center gap-3">
                  <img src={companyProfile.logoUrl || '/logo.png'} alt="Logo" className="w-14 h-14 object-contain" />
                  <div>
                    <h1 className="text-base font-black text-blue-900 tracking-wider uppercase">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</h1>
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{companyProfile.labNameEn || companyProfile.labName || 'SOIL TEST LABORATORY'}</h2>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <h3 className="text-sm font-black text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 inline-block px-4 pb-0.5">
                    TANDA TERIMA SAMPEL
                  </h3>
                  <div className="text-xs font-bold text-slate-800 font-mono pt-1">
                    Nomor : {selectedReceipt.receiptNo}
                  </div>
                </div>

                <div className="space-y-1 text-slate-800 text-xs">
                  <p className="leading-relaxed">
                    Telah diterima, sampel pengujian dari <strong>{selectedReceipt.clientName}</strong> Pada:
                  </p>
                  <div className="grid grid-cols-12 gap-1 pt-1">
                    <span className="col-span-3 font-semibold text-slate-700">Hari</span>
                    <span className="col-span-9 font-bold">: {selectedReceipt.dayName}</span>

                    <span className="col-span-3 font-semibold text-slate-700">Tanggal</span>
                    <span className="col-span-9 font-bold">: {selectedReceipt.date}</span>

                    <span className="col-span-3 font-semibold text-slate-700">Waktu</span>
                    <span className="col-span-9 font-bold font-mono">: {selectedReceipt.timeStr}</span>

                    <span className="col-span-3 font-semibold text-slate-700">Jumlah Sampel</span>
                    <span className="col-span-9 font-bold font-mono">: {selectedReceipt.items.length} Sampel</span>

                    <span className="col-span-3 font-semibold text-slate-700">Nomor PO</span>
                    <span className="col-span-9 font-bold font-mono">: {selectedReceipt.projectCode}</span>

                    <span className="col-span-3 font-semibold text-slate-700">Nama Project</span>
                    <span className="col-span-9 font-bold">: {selectedReceipt.projectName}</span>
                  </div>
                </div>

                <p className="text-slate-800 text-xs font-semibold pt-2">
                  Sampel tersebut telah diterima Dengan rincian sebagai berikut :
                </p>

                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-extrabold text-center border-b border-slate-900">
                      <th className="p-1.5 border border-slate-900 w-10">NO</th>
                      <th className="p-1.5 border border-slate-900 text-left">KODE SAMPEL / PROJECT</th>
                      <th className="p-1.5 border border-slate-900 text-center w-36">BERAT SAMPEL</th>
                      <th className="p-1.5 border border-slate-900 text-center w-28">KEADAAN SAMPEL</th>
                      <th className="p-1.5 border border-slate-900 text-center w-28">JENIS PACKING</th>
                      <th className="p-1.5 border border-slate-900 text-center w-28">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {selectedReceipt.items.map((item, i) => (
                      <tr key={item.id} className="text-slate-900 text-[11px]">
                        <td className="p-1.5 border border-slate-900 text-center font-bold">{i + 1}</td>
                        <td className="p-1.5 border border-slate-900 font-mono font-bold">{item.sampleCode}</td>
                        <td className="p-1.5 border border-slate-900 text-center font-mono font-semibold">{item.depthRange}</td>
                        <td className="p-1.5 border border-slate-900 text-center font-semibold">{item.condition}</td>
                        <td className="p-1.5 border border-slate-900 text-center">{item.packingType}</td>
                        <td className="p-1.5 border border-slate-900 text-center">{item.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* FOOTER HALAMAN 1 */}
                <div className="absolute bottom-5 left-8 right-8 border-t border-slate-300 pt-2 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                  <span>No. Dok: <strong className="text-slate-700">{selectedReceipt.receiptNo}</strong></span>
                  <span className="text-center font-semibold text-slate-600">{companyProfile.companyName || 'PT. Terraforma Geoteknik Indonesia'} — {companyProfile.labNameEn || 'Soil Mechanics Laboratory'}</span>
                  <span>Hal. <strong className="text-slate-700">1</strong> / 2</span>
                </div>
              </div>

              {/* HALAMAN 2: LAMPIRAN FOTO SAMPEL MULTI-GRID */}
              <div className="w-[210mm] bg-white text-slate-900 p-8 shadow-2xl font-sans text-xs space-y-6 border border-slate-300 min-h-[297mm] relative page-break-before-always">

                <div className="border-b-2 border-blue-900 pb-2 flex items-center gap-3">
                  <img src={companyProfile.logoUrl || '/logo.png'} alt="Logo" className="w-14 h-14 object-contain" />
                  <div>
                    <h1 className="text-base font-black text-blue-900 tracking-wider uppercase">{companyProfile.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}</h1>
                    <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{companyProfile.labNameEn || companyProfile.labName || 'SOIL TEST LABORATORY'}</h2>
                  </div>
                </div>

                {/* DYNAMIC MULTI-PHOTO GRID */}
                <div className="border border-slate-900 p-4 bg-white rounded-xs space-y-4">
                  <h3 className="font-extrabold text-center text-xs uppercase border-b border-slate-300 pb-2">
                    LAMPIRAN FOTO KEDATANGAN SAMPEL ({selectedReceipt.photos?.length || 0} FOTO)
                  </h3>

                  <div className="grid grid-cols-2 gap-4 items-center justify-center">
                    {selectedReceipt.photos && selectedReceipt.photos.length > 0 ? (
                      selectedReceipt.photos.map((p, idx) => (
                        <div key={p.id || idx} className="border border-slate-400 p-2 bg-slate-50 flex flex-col items-center rounded space-y-1">
                          {p.dataUrl ? (
                            <img src={p.dataUrl} alt={p.title} className="max-h-72 w-full object-contain" />
                          ) : (
                            <div className="h-48 w-full bg-slate-200 flex items-center justify-center text-slate-400 font-mono text-[10px]">
                              Foto #{idx + 1} Tidak Diisi
                            </div>
                          )}
                          <div className="font-bold text-[10px] text-slate-800 text-center font-mono">
                            {p.title || `Foto #${idx + 1}`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 text-slate-400 font-mono border border-dashed border-slate-300">
                        Belum Ada Lampiran Foto Kedatangan Sampel
                      </div>
                    )}
                  </div>
                </div>

                {/* CLOSING TEXT & PARAF PENERIMA (MASTER PERSONIL INTEGRATION) */}
                <div className="pt-4 space-y-4">
                  <div className="font-bold text-slate-900 text-xs">
                    Sampel tersebut telah diterima oleh {companyProfile.companyName || 'PT. Terraforma Geoteknik Indonesia'}
                  </div>

                  {(() => {
                    const receiverName = selectedReceipt.labReceiverName || 'Syabaab Amin A';
                    const receiverPerson = (personnelCatalogue || []).find(p => 
                      p.name.toLowerCase().trim() === receiverName.toLowerCase().trim() ||
                      p.name.toLowerCase().includes(receiverName.toLowerCase()) ||
                      receiverName.toLowerCase().includes(p.name.toLowerCase())
                    );

                    const receiverSignature = receiverPerson?.signatureUrl || receiverPerson?.digitalSignatureUrl;

                    return (
                      <div className="flex justify-end text-center">
                        <div className="w-64 font-sans space-y-1">
                          <div className="font-bold text-slate-900 text-xs">Paraf penerima sampel,</div>
                          
                          <div className="h-16 flex flex-col items-center justify-end pb-1 relative my-1">
                            {/* CAP STEMPEL RESMI (TERPISAH DARI LOGO - MENGGUNAKAN STAMP URL) */}
                            {(companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png') && (
                              <img 
                                src={companyProfile.stampUrl || companyProfile.logoUrl || '/logo.png'} 
                                alt="Cap Stempel Resmi" 
                                className="absolute bottom-0 left-2 w-16 h-16 object-contain mix-blend-multiply opacity-80 rotate-[-6deg] pointer-events-none z-20 select-none" 
                              />
                            )}

                            {receiverSignature ? (
                              <img 
                                src={receiverSignature} 
                                alt={`Paraf ${receiverName}`} 
                                className="max-h-14 max-w-[170px] object-contain mix-blend-multiply mb-0.5 relative z-10" 
                              />
                            ) : (
                              <span className="text-[8.5px] text-slate-400 font-mono mb-2">
                                ( Tanda Tangan / Paraf Digital )
                              </span>
                            )}

                            <div className="border-b border-slate-900 w-48 relative z-0"></div>
                          </div>

                          <div className="font-extrabold text-slate-900 text-xs underline">{receiverName}</div>
                          <div className="text-[8.5px] text-slate-500 font-mono">Penerima Sampel Lab</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* FOOTER HALAMAN 2 */}
                <div className="absolute bottom-5 left-8 right-8 border-t border-slate-300 pt-2 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                  <span>No. Dok: <strong className="text-slate-700">{selectedReceipt.receiptNo}</strong></span>
                  <span className="text-center font-semibold text-slate-600">{companyProfile.companyName || 'PT. Terraforma Geoteknik Indonesia'} — {companyProfile.labNameEn || 'Soil Mechanics Laboratory'}</span>
                  <span>Hal. <strong className="text-slate-700">2</strong> / 2</span>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
