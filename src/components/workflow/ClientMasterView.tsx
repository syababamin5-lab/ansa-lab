import React, { useState } from 'react';
import { Client, LabRekanan, PriceTierKey } from '../../types/workflowTypes';
import {
  Building2, Plus, Edit3, Trash2, X, Users, FlaskConical,
  Phone, Mail, Tag, Search, Hash, AlertTriangle, CheckCircle2
} from 'lucide-react';

interface ClientMasterViewProps {
  clients: Client[];
  labRekanans: LabRekanan[];
  onSaveClient: (c: Client) => void;
  onDeleteClient: (id: string) => void;
  onSaveLabRekanan: (l: LabRekanan) => void;
  onDeleteLabRekanan: (id: string) => void;
}

const TIER_LABELS: Record<PriceTierKey, { label: string; color: string }> = {
  priceGeoland: { label: 'Harga Geoland (Tier 1)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  priceBRS:     { label: 'Harga BRS (Tier 2)',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
  priceUmum:    { label: 'Harga Umum (Tier 3)',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

// ─── CLIENT FORM MODAL ─────────────────────────────────────────────────────────
interface ClientFormProps {
  initial?: Client;
  onSave: (c: Client) => void;
  onClose: () => void;
}
const ClientForm: React.FC<ClientFormProps> = ({ initial, onSave, onClose }) => {
  const [clientCode, setClientCode]         = useState(initial?.clientCode || '');
  const [companyName, setCompanyName]       = useState(initial?.companyName || '');
  const [address, setAddress]               = useState(initial?.address || '');
  const [contactPerson, setContactPerson]   = useState(initial?.contactPerson || '');
  const [phone, setPhone]                   = useState(initial?.phone || '');
  const [email, setEmail]                   = useState(initial?.email || '');
  const [taxId, setTaxId]                   = useState(initial?.taxId || '');
  const [priceTier, setPriceTier]           = useState<PriceTierKey>(initial?.defaultPriceTier || 'priceUmum');
  const [notes, setNotes]                   = useState(initial?.notes || '');

  const [isFormDirty, setIsFormDirty]       = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);

  const handleAttemptClose = () => {
    if (isFormDirty) {
      setShowUnsavedConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (!clientCode.trim()) { alert('Kode Client wajib diisi! (contoh: GQT, MGU)'); return; }
    if (!companyName.trim()) { alert('Nama Perusahaan wajib diisi!'); return; }
    if (!contactPerson.trim()) { alert('Nama PIC/Kontak wajib diisi!'); return; }
    if (!phone.trim()) { alert('No. Telp wajib diisi!'); return; }
    onSave({
      id: initial?.id || `client-${Date.now()}`,
      clientCode: clientCode.trim().toUpperCase(),
      companyName: companyName.trim(),
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      taxId: taxId.trim(),
      defaultPriceTier: priceTier,
      notes: notes.trim(),
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
    setIsFormDirty(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              {initial ? 'Edit Data Client' : 'Tambah Client Baru'}
            </h3>
            <button onClick={handleAttemptClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-3 text-xs">
            {/* Kode & Nama — baris pertama */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-600" /> Kode Client <span className="text-red-500">*</span>
                </label>
                <input
                  value={clientCode}
                  onChange={e => { setClientCode(e.target.value.toUpperCase()); setIsFormDirty(true); }}
                  maxLength={8}
                  className="w-full p-2 border border-emerald-300 rounded-lg font-extrabold text-emerald-800 bg-emerald-50 tracking-widest uppercase"
                  placeholder="GQT"
                />
                <p className="text-[9px] text-slate-400 mt-0.5">Singkatan unik, maks 8 huruf</p>
              </div>
              <div className="col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan / Instansi <span className="text-red-500">*</span></label>
                <input value={companyName} onChange={e => { setCompanyName(e.target.value); setIsFormDirty(true); }} className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900" placeholder="PT. Contoh Perusahaan Tbk" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
              <textarea value={address} onChange={e => { setAddress(e.target.value); setIsFormDirty(true); }} rows={2} className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 resize-none" placeholder="Jl. Contoh No. 1, Kota, Provinsi" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama PIC / Kontak <span className="text-red-500">*</span></label>
                <input value={contactPerson} onChange={e => { setContactPerson(e.target.value); setIsFormDirty(true); }} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Bapak / Ibu ..." />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">No. Telp / HP <span className="text-red-500">*</span></label>
                <input value={phone} onChange={e => { setPhone(e.target.value); setIsFormDirty(true); }} className="w-full p-2 border border-slate-300 rounded-lg font-mono" placeholder="08xxx-xxxx-xxxx" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setIsFormDirty(true); }} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="email@perusahaan.com" />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">NPWP (opsional)</label>
                <input value={taxId} onChange={e => { setTaxId(e.target.value); setIsFormDirty(true); }} className="w-full p-2 border border-slate-300 rounded-lg font-mono" placeholder="xx.xxx.xxx.x-xxx.xxx" />
              </div>
            </div>

            {/* Tarif Default */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Kategori Tarif Default
              </label>
              <div className="flex gap-2">
                {(Object.keys(TIER_LABELS) as PriceTierKey[]).map(tier => (
                  <button
                    key={tier}
                    onClick={() => { setPriceTier(tier); setIsFormDirty(true); }}
                    className={`flex-1 py-2 rounded-xl border font-bold text-[11px] transition cursor-pointer ${priceTier === tier ? TIER_LABELS[tier].color + ' border-2' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {TIER_LABELS[tier].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Catatan</label>
              <input value={notes} onChange={e => { setNotes(e.target.value); setIsFormDirty(true); }} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Catatan tambahan (opsional)" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={handleAttemptClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200">Batal</button>
              <button onClick={handleSave} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow cursor-pointer">
                {initial ? 'Simpan Perubahan' : 'Daftarkan Client'}
              </button>
            </div>
          </div>
        </div>
      </div>

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
              Terdapat perubahan data pada formulir Data Client ini. Jika Anda keluar tanpa menyimpan, data baru yang Anda isi akan hilang.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleSave}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Data Client</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowUnsavedConfirm(false);
                    setIsFormDirty(false);
                    onClose();
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
    </>
  );
};

// ─── LAB REKANAN FORM MODAL ────────────────────────────────────────────────────
interface LabFormProps {
  initial?: LabRekanan;
  onSave: (l: LabRekanan) => void;
  onClose: () => void;
}
const LabForm: React.FC<LabFormProps> = ({ initial, onSave, onClose }) => {
  const [labCode, setLabCode]             = useState(initial?.labCode || '');
  const [labName, setLabName]             = useState(initial?.labName || '');
  const [address, setAddress]             = useState(initial?.address || '');
  const [contactPerson, setContactPerson] = useState(initial?.contactPerson || '');
  const [phone, setPhone]                 = useState(initial?.phone || '');
  const [email, setEmail]                 = useState(initial?.email || '');
  const [specialty, setSpecialty]         = useState(initial?.specialty || '');
  const [notes, setNotes]                 = useState(initial?.notes || '');

  const handleSave = () => {
    if (!labCode.trim()) { alert('Kode Lab wajib diisi! (contoh: PUS, ITB)'); return; }
    if (!labName.trim()) { alert('Nama Lab wajib diisi!'); return; }
    if (!contactPerson.trim()) { alert('Nama PIC wajib diisi!'); return; }
    if (!phone.trim()) { alert('No. Telp wajib diisi!'); return; }
    onSave({
      id: initial?.id || `lab-${Date.now()}`,
      labCode: labCode.trim().toUpperCase(),
      labName: labName.trim(),
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      specialty: specialty.trim(),
      notes: notes.trim(),
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-400" />
            {initial ? 'Edit Data Lab Rekanan' : 'Tambah Lab Rekanan Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-xs">
          {/* Kode & Nama */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-600" /> Kode Lab <span className="text-red-500">*</span>
              </label>
              <input
                value={labCode}
                onChange={e => setLabCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="w-full p-2 border border-blue-300 rounded-lg font-extrabold text-blue-800 bg-blue-50 tracking-widest uppercase"
                placeholder="PUS"
              />
              <p className="text-[9px] text-slate-400 mt-0.5">Singkatan unik, maks 8 huruf</p>
            </div>
            <div className="col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Nama Laboratorium Rekanan <span className="text-red-500">*</span></label>
              <input value={labName} onChange={e => setLabName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-bold text-slate-900" placeholder="Lab Mekanika Batuan Pusjatan" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Alamat Lab</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full p-2 border border-slate-300 rounded-lg resize-none" placeholder="Jl. Contoh No. 1, Kota, Provinsi" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama PIC <span className="text-red-500">*</span></label>
              <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Bapak / Ibu ..." />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">No. Telp / HP <span className="text-red-500">*</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg font-mono" placeholder="08xxx-xxxx-xxxx" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="lab@rekanan.com" />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Spesialisasi Pengujian</label>
              <input value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Mekanika Batuan, Triaxial CD, dll" />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Catatan</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Catatan tambahan (opsional)" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200">Batal</button>
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow cursor-pointer">
              {initial ? 'Simpan Perubahan' : 'Daftarkan Lab Rekanan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN VIEW ─────────────────────────────────────────────────────────────────
export const ClientMasterView: React.FC<ClientMasterViewProps> = ({
  clients, labRekanans, onSaveClient, onDeleteClient, onSaveLabRekanan, onDeleteLabRekanan
}) => {
  const [activeSection, setActiveSection] = useState<'clients' | 'labs'>('clients');
  const [clientForm, setClientForm]       = useState<{ open: boolean; data?: Client }>({ open: false });
  const [labForm, setLabForm]             = useState<{ open: boolean; data?: LabRekanan }>({ open: false });
  const [search, setSearch]               = useState('');

  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    (c.clientCode || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredLabs = labRekanans.filter(l =>
    l.labName.toLowerCase().includes(search.toLowerCase()) ||
    l.specialty.toLowerCase().includes(search.toLowerCase()) ||
    (l.labCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const confirmDelete = (name: string, onConfirm: () => void) => {
    if (confirm(`Hapus "${name}" dari master data? Tindakan ini tidak dapat dibatalkan.`)) onConfirm();
  };

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200 w-fit mb-1.5">
          <span>MASTER DATA</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Master Data Client &amp; Lab Rekanan</h2>
        <p className="text-xs text-slate-500 mt-1">
          Daftarkan client dan lab rekanan beserta <strong>kode uniknya</strong> untuk digunakan di Penawaran Harga, Kode PO, dan Surat Subkontrak.
        </p>
      </div>

      {/* TAB SWITCHER */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setActiveSection('clients'); setSearch(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeSection === 'clients' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" /> Data Client ({clients.length})
        </button>
        <button
          onClick={() => { setActiveSection('labs'); setSearch(''); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${activeSection === 'labs' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FlaskConical className="w-4 h-4" /> Lab Rekanan ({labRekanans.length})
        </button>
      </div>

      {/* ── DATA CLIENT SECTION ── */}
      {activeSection === 'clients' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 className="text-sm font-extrabold text-slate-900">Daftar Client Terdaftar</h3>
              <div className="relative ml-2 flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari kode / nama / PIC..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <button
              onClick={() => setClientForm({ open: true })}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" /> Tambah Client
            </button>
          </div>

          {filteredClients.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Belum ada client terdaftar</p>
              <p className="text-xs mt-1">Klik "Tambah Client" untuk mendaftarkan client pertama Anda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-24">Kode</th>
                    <th className="py-3 px-4">Nama Perusahaan</th>
                    <th className="py-3 px-4">PIC &amp; Kontak</th>
                    <th className="py-3 px-4 text-center">Tarif Default</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-extrabold tracking-widest text-[11px]">
                          {c.clientCode || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.companyName}</div>
                        {c.taxId && <div className="text-[10px] text-slate-400 font-mono">NPWP: {c.taxId}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{c.contactPerson}</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                        {c.email && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Mail className="w-3 h-3" /> {c.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${TIER_LABELS[c.defaultPriceTier].color}`}>
                          {TIER_LABELS[c.defaultPriceTier].label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center space-x-1.5">
                        <button
                          onClick={() => setClientForm({ open: true, data: c })}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg inline-flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(c.companyName, () => onDeleteClient(c.id))}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg inline-flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LAB REKANAN SECTION ── */}
      {activeSection === 'labs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <FlaskConical className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-sm font-extrabold text-slate-900">Daftar Laboratorium Rekanan</h3>
              <div className="relative ml-2 flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari kode / nama / spesialisasi..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <button
              onClick={() => setLabForm({ open: true })}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" /> Tambah Lab Rekanan
            </button>
          </div>

          {filteredLabs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-sm">Belum ada lab rekanan terdaftar</p>
              <p className="text-xs mt-1">Lab rekanan digunakan untuk surat subkontrak sampel yang tidak bisa diuji secara internal.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-24">Kode</th>
                    <th className="py-3 px-4">Nama Laboratorium</th>
                    <th className="py-3 px-4">PIC &amp; Kontak</th>
                    <th className="py-3 px-4">Spesialisasi</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLabs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-extrabold tracking-widest text-[11px]">
                          {l.labCode || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{l.labName}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{l.contactPerson}</div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                          <Phone className="w-3 h-3" /> {l.phone}
                        </div>
                        {l.email && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Mail className="w-3 h-3" /> {l.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-semibold text-[10px]">
                          {l.specialty || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center space-x-1.5">
                        <button
                          onClick={() => setLabForm({ open: true, data: l })}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg inline-flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(l.labName, () => onDeleteLabRekanan(l.id))}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-lg inline-flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {clientForm.open && (
        <ClientForm
          initial={clientForm.data}
          onSave={onSaveClient}
          onClose={() => setClientForm({ open: false })}
        />
      )}
      {labForm.open && (
        <LabForm
          initial={labForm.data}
          onSave={onSaveLabRekanan}
          onClose={() => setLabForm({ open: false })}
        />
      )}
    </div>
  );
};
