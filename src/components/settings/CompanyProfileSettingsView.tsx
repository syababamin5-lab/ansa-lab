import React, { useState, useRef } from 'react';
import { CompanyProfile, DEFAULT_COMPANY_PROFILE } from '../../types/companyProfileTypes';
import {
  Building2,
  Image as ImageIcon,
  Stamp,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Globe,
  UserCheck,
  FileText,
  Save,
  RotateCcw,
  Upload,
  CheckCircle2,
  Eye,
  AlertCircle
} from 'lucide-react';

interface CompanyProfileSettingsViewProps {
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
}

export const CompanyProfileSettingsView: React.FC<CompanyProfileSettingsViewProps> = ({
  companyProfile,
  onSaveCompanyProfile
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(() => ({
    ...DEFAULT_COMPANY_PROFILE,
    ...companyProfile
  }));

  const [activeSection, setActiveSection] = useState<'visual' | 'identity' | 'address' | 'bank' | 'signees' | 'lhu_notes'>('visual');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFieldChange = (field: keyof CompanyProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'stampUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData(prev => ({ ...prev, [field]: dataUrl }));
        showToast(`Gambar ${field === 'logoUrl' ? 'Logo Perusahaan' : 'Cap / Stempel Resmi'} berhasil diunggah!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = {
        ...formData,
        updatedAt: new Date().toISOString()
      };
      await onSaveCompanyProfile(updated);
      showToast('Profil Perusahaan & Kop Surat berhasil disimpan permanen ke Cloud Database!');
    } catch (e) {
      alert('Gagal menyimpan profil perusahaan ke Cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan profil perusahaan, logo, cap, dan kop surat ke pengaturan default awal?')) {
      setFormData(DEFAULT_COMPANY_PROFILE);
      onSaveCompanyProfile(DEFAULT_COMPANY_PROFILE);
      showToast('Profil perusahaan berhasil dikembalikan ke pengaturan default!');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Kop Surat, Logo, Cap &amp; Profil Perusahaan
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Multi-Form Dynamic
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ubah logo perusahaan, cap stempel resmi, alamat, kontak, rekening bank, dan penandatangan secara mandiri tanpa menyentuh kode program.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleResetToDefault}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Reset ke pengaturan default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Bawaan</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {[
          { id: 'visual', label: '1. Logo & Cap Stempel', icon: ImageIcon },
          { id: 'identity', label: '2. Identitas Perusahaan', icon: Building2 },
          { id: 'address', label: '3. Alamat & Kontak', icon: MapPin },
          { id: 'bank', label: '4. Rekening Bank & Pajak', icon: CreditCard },
          { id: 'signees', label: '5. Pejabat Penandatangan', icon: UserCheck },
          { id: 'lhu_notes', label: '6. Catatan Kaki LHU & Legal', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: EDIT FORM */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          
          {/* TAB 1: LOGO & CAP RESMI (SEPARATED AS REQUESTED) */}
          {activeSection === 'visual' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Pengaturan Logo Perusahaan &amp; Cap Stempel Resmi
                </h3>
                <p className="text-xs text-slate-500">
                  Logo dan Cap stempel resmi dipisahkan secara khusus agar Anda leluasa mengganti masing-masing gambar secara mandiri.
                </p>
              </div>

              {/* 1. LOGO PERUSAHAAN */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    Logo Utama Perusahaan (Kop Surat)
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">Format: PNG / JPG / SVG (Maks. 2MB)</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white border border-slate-300 rounded-xl p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-slate-400 text-center font-mono">Tanpa Logo</span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'logoUrl')}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Logo Baru</span>
                      </button>
                      {formData.logoUrl !== '/logo.png' && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('logoUrl', '/logo.png')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Pakai /logo.png
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Atau masukkan URL / Path gambar logo:</label>
                      <input
                        type="text"
                        value={formData.logoUrl}
                        onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                        placeholder="Contoh: /logo.png atau https://..."
                        className="w-full mt-0.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CAP / STEMPEL PERUSAHAAN (DEDICATED SEPARATE SLOT) */}
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-2">
                    <Stamp className="w-4 h-4 text-amber-700" />
                    Cap / Stempel Resmi Laboratorium (Untuk Tanda Tangan &amp; Surat)
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Rekomendasi: PNG Transparan
                  </span>
                </div>

                <p className="text-[11px] text-amber-900/80 leading-relaxed">
                  Cap ini akan otomatis ditempelkan secara realistis (transparan &amp; sedikit miring) di samping tanda tangan pada Surat Penawaran, Tanda Terima Sampel, dan Berita Acara.
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white border border-amber-300 rounded-xl p-2 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden relative">
                    {formData.stampUrl ? (
                      <img src={formData.stampUrl} alt="Cap Stempel Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Stamp className="w-6 h-6 mx-auto text-amber-400" />
                        <span className="text-[8px] text-amber-600 font-bold block mt-1">Belum Ada Cap</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={stampInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'stampUrl')}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => stampInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Unggah Cap Stempel (PNG)</span>
                      </button>
                      {formData.stampUrl && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('stampUrl', '')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Hapus Cap
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Atau masukkan URL gambar cap stempel:</label>
                      <input
                        type="text"
                        value={formData.stampUrl}
                        onChange={(e) => handleFieldChange('stampUrl', e.target.value)}
                        placeholder="Contoh: /stamp.png atau data:image/png;base64,..."
                        className="w-full mt-0.5 bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: IDENTITAS PERUSAHAAN */}
          {activeSection === 'identity' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Identitas &amp; Nama Resmi Perusahaan
                </h3>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan Resmi (Full Legal Name)</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    placeholder="Contoh: PT. TERRAFORMA GEOTEKNIK INDONESIA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Singkat / Inisial</label>
                    <input
                      type="text"
                      value={formData.companyShortName}
                      onChange={(e) => handleFieldChange('companyShortName', e.target.value)}
                      placeholder="Contoh: PT. TGI"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Unit / Laboratorium (Bahasa Indonesia)</label>
                    <input
                      type="text"
                      value={formData.labName}
                      onChange={(e) => handleFieldChange('labName', e.target.value)}
                      placeholder="Contoh: LABORATORIUM MEKANIKA TANAH"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Laboratorium (Bahasa Inggris)</label>
                    <input
                      type="text"
                      value={formData.labNameEn}
                      onChange={(e) => handleFieldChange('labNameEn', e.target.value)}
                      placeholder="Contoh: Soil Mechanics Laboratory"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Subjudul / Tagline Laporan LHU</label>
                    <input
                      type="text"
                      value={formData.taglineEn}
                      onChange={(e) => handleFieldChange('taglineEn', e.target.value)}
                      placeholder="Contoh: LABORATORY TEST REPORT"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALAMAT & KONTAK */}
          {activeSection === 'address' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Alamat &amp; Kontak Resmi Perusahaan
                </h3>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat Laboratorium (Muncul di Kop LHU, Penawaran &amp; Invoice)</label>
                  <textarea
                    rows={2}
                    value={formData.labAddress}
                    onChange={(e) => handleFieldChange('labAddress', e.target.value)}
                    placeholder="Alamat lengkap lokasi pengujian lab..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alamat Kantor Pusat (Opsional)</label>
                  <textarea
                    rows={2}
                    value={formData.officeAddress}
                    onChange={(e) => handleFieldChange('officeAddress', e.target.value)}
                    placeholder="Alamat kantor administrasi pusat..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Telepon Kantor / Lab</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="Contoh: 022-4572-5093"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">No. Handphone / WhatsApp Lab</label>
                    <input
                      type="text"
                      value={formData.mobile}
                      onChange={(e) => handleFieldChange('mobile', e.target.value)}
                      placeholder="Contoh: 0812-1491-4641"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Resmi Laboratorium</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="Contoh: soil_test@terraforma.co.id"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Website Resmi Perusahaan</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      placeholder="Contoh: www.terraforma.co.id"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REKENING BANK & PAJAK */}
          {activeSection === 'bank' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Data Rekening Bank &amp; Instruksi Pembayaran (Invoice)
                </h3>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => handleFieldChange('bankName', e.target.value)}
                      placeholder="Contoh: Bank Mandiri / BCA / BNI"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => handleFieldChange('bankAccountNumber', e.target.value)}
                      placeholder="Contoh: 133 - 00 - 99 - 00 - 8823"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-blue-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Pemilik Rekening (Atas Nama / A.N)</label>
                  <input
                    type="text"
                    value={formData.bankAccountName}
                    onChange={(e) => handleFieldChange('bankAccountName', e.target.value)}
                    placeholder="Contoh: PT. TERRAFORMA GEOTEKNIK INDONESIA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp Konfirmasi Pembayaran</label>
                  <input
                    type="text"
                    value={formData.waConfirmationNo}
                    onChange={(e) => handleFieldChange('waConfirmationNo', e.target.value)}
                    placeholder="Contoh: 0811-2183-223"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catatan Pajak PPh 23 di Invoice</label>
                  <input
                    type="text"
                    value={formData.taxNote}
                    onChange={(e) => handleFieldChange('taxNote', e.target.value)}
                    placeholder="Contoh: Bukti potong pajak pph 23 (2%) untuk dapat dikirim ke PT. Terraforma Geoteknik Indonesia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PEJABAT PENANDATANGAN */}
          {activeSection === 'signees' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  Pejabat Penandatangan Resmi Dokumen &amp; Surat
                </h3>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase text-blue-900">1. Penandatangan Invoice &amp; Keuangan (Direktur)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nama &amp; Gelar Direktur</label>
                      <input
                        type="text"
                        value={formData.directorName}
                        onChange={(e) => handleFieldChange('directorName', e.target.value)}
                        placeholder="Contoh: Ir. Hartawi Riskha, S.T"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Jabatan Resmi</label>
                      <input
                        type="text"
                        value={formData.directorTitle}
                        onChange={(e) => handleFieldChange('directorTitle', e.target.value)}
                        placeholder="Contoh: Interim Operations Director"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase text-emerald-900">2. Penandatangan Penawaran &amp; Teknis (Kepala Laboratorium)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Nama &amp; Gelar Kepala Lab</label>
                      <input
                        type="text"
                        value={formData.headOfLabName}
                        onChange={(e) => handleFieldChange('headOfLabName', e.target.value)}
                        placeholder="Contoh: Yustiadji"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Jabatan Resmi</label>
                      <input
                        type="text"
                        value={formData.headOfLabTitle}
                        onChange={(e) => handleFieldChange('headOfLabTitle', e.target.value)}
                        placeholder="Contoh: Kepala Laboratorium"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CATATAN KAKI LHU & KLAUSUL */}
          {activeSection === 'lhu_notes' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Keterangan &amp; Klausul Catatan Kaki LHU (ISO/IEC 17025)
                </h3>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">Klausul 1 (Hanya berlaku untuk contoh yang diuji)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.notesLHU1Indo}
                      onChange={(e) => handleFieldChange('notesLHU1Indo', e.target.value)}
                      placeholder="Versi Bahasa Indonesia..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px]"
                    />
                    <input
                      type="text"
                      value={formData.notesLHU1En}
                      onChange={(e) => handleFieldChange('notesLHU1En', e.target.value)}
                      placeholder="Versi English (Italic)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] italic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">Klausul 2 (Hak Cipta / Izin Penggandaan Laporan)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.notesLHU2Indo}
                      onChange={(e) => handleFieldChange('notesLHU2Indo', e.target.value)}
                      placeholder="Versi Bahasa Indonesia..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px]"
                    />
                    <input
                      type="text"
                      value={formData.notesLHU2En}
                      onChange={(e) => handleFieldChange('notesLHU2En', e.target.value)}
                      placeholder="Versi English (Italic)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] italic"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-800 block">Klausul 3 (Batasan Tanggung Jawab Sampling &amp; Transportasi)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.notesLHU3Indo}
                      onChange={(e) => handleFieldChange('notesLHU3Indo', e.target.value)}
                      placeholder="Versi Bahasa Indonesia..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px]"
                    />
                    <input
                      type="text"
                      value={formData.notesLHU3En}
                      onChange={(e) => handleFieldChange('notesLHU3En', e.target.value)}
                      placeholder="Versi English (Italic)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-[11px] italic"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW OF KOP SURAT, STAMP & FOOTER */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-black tracking-wide uppercase">Live Pratinjau Kop &amp; Cap</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Real-time Render</span>
          </div>

          {/* 1. KOP SURAT PREVIEW */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
              Pratinjau Kop Surat (Header LHU &amp; Penawaran)
            </span>

            <div className="relative border-b-2 border-slate-900 pb-3 pt-1">
              <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <img
                  src={formData.logoUrl || '/logo.png'}
                  alt="Logo Preview"
                  className="w-12 h-12 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                />
              </div>

              <div className="text-center space-y-0.5 px-14">
                <h1 className="text-xs font-black uppercase tracking-wider leading-none text-[#1e40af]">
                  {formData.labName || 'LABORATORIUM MEKANIKA TANAH'}
                </h1>
                <h2 className="text-[11px] font-black text-[#1e40af] uppercase leading-tight mt-0.5">
                  {formData.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}
                </h2>
                <p className="text-[8px] font-extrabold tracking-widest text-[#64748b] uppercase">
                  {formData.taglineEn || 'LABORATORY TEST REPORT'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[7.5px] font-semibold bg-[#1e40af] text-white px-2 py-1 rounded-xs">
              <span className="truncate max-w-[200px]">{formData.labAddress}</span>
              <span className="shrink-0">Telp: {formData.mobile || formData.phone}</span>
            </div>
          </div>

          {/* 2. SIGNATURE & STAMP PREVIEW */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
              Pratinjau Tanda Tangan &amp; Cap Stempel Resmi
            </span>

            <div className="flex justify-end pt-2">
              <div className="text-center w-56 font-sans space-y-1">
                <div className="text-[10px] text-slate-600 font-semibold">Hormat Kami,</div>
                <div className="text-[10px] font-black text-blue-900 uppercase">
                  {formData.companyName || 'PT. TERRAFORMA GEOTEKNIK INDONESIA'}
                </div>

                <div className="h-16 flex flex-col items-center justify-end pb-1 relative my-1">
                  {/* CAP STEMPEL RESMI */}
                  {formData.stampUrl ? (
                    <img
                      src={formData.stampUrl}
                      alt="Cap Stempel Resmi"
                      className="absolute bottom-0 left-4 w-16 h-16 object-contain mix-blend-multiply opacity-85 rotate-[-6deg] pointer-events-none select-none z-20"
                    />
                  ) : (
                    <div className="absolute bottom-1 left-4 border border-dashed border-amber-400 bg-amber-50/70 rounded-full w-14 h-14 flex items-center justify-center text-[7px] text-amber-700 font-bold text-center leading-none p-1 rotate-[-6deg]">
                      (Slot Cap Stempel)
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 font-mono italic mb-2 relative z-10">
                    [Tanda Tangan Digital]
                  </div>

                  <div className="border-b border-slate-900 w-40 relative z-0"></div>
                </div>

                <div className="font-extrabold text-slate-900 text-xs underline">
                  {formData.headOfLabName || 'Kepala Laboratorium'}
                </div>
                <div className="text-[9px] text-slate-500 font-medium">
                  {formData.headOfLabTitle || 'Head of Laboratory'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. BANK TRANSFER PREVIEW */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-100 pb-1">
              Pratinjau Kotak Pembayaran (Invoice)
            </span>

            <div className="border border-blue-900 p-2.5 rounded-xs text-[9.5px] space-y-1 bg-slate-50">
              <div className="font-bold text-blue-900 text-[10px] border-b border-blue-200 pb-0.5">
                Pembayaran ditujukan Kepada :
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-slate-700">Nama Bank</span>
                <span className="col-span-8 font-bold text-slate-900">: {formData.bankName}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-slate-700">Atas Nama</span>
                <span className="col-span-8 font-bold text-slate-900">: {formData.bankAccountName}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-slate-700">No Rekening</span>
                <span className="col-span-8 font-bold font-mono text-blue-900">: {formData.bankAccountNumber}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-4 font-semibold text-slate-700">Konfirmasi WA</span>
                <span className="col-span-8 font-semibold text-slate-900">: {formData.waConfirmationNo}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
