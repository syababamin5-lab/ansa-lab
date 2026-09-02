import React, { useState } from 'react';
import { 
  UserRole, 
  UserProfile, 
  USER_ROLE_LABELS, 
  USER_ROLE_BADGE 
} from '../types/userTypes';
import { isMenuAllowed } from '../utils/userPermissions';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  FileSignature, 
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  Upload,
  Key
} from 'lucide-react';

interface UserManagementViewProps {
  users: UserProfile[];
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
  onSwitchUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    shortName: '',
    nip: '',
    email: '',
    password: '1234',
    role: 'ANALYST',
    analyistCode: 'AO#1',
    specialization: '',
    digitalSignatureLabel: '',
    digitalSignatureUrl: '',
    signatureUrl: '',
    isActive: true,
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    USER_ROLE_LABELS[u.role].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      name: '',
      shortName: '',
      nip: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      email: '',
      password: '1234',
      role: 'ANALYST',
      analyistCode: 'AO#1',
      specialization: '',
      digitalSignatureLabel: 'Analis / Teknisi Lab',
      digitalSignatureUrl: '',
      signatureUrl: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setShowPassword(false);
    setFormData({ ...user, password: user.password || '1234' });
    setIsModalOpen(true);
  };

  const handleSignatureFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (PNG, JPG, WEBP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setFormData(prev => ({
          ...prev,
          digitalSignatureUrl: dataUrl,
          signatureUrl: dataUrl
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Nama Lengkap dan Email Resmi harus diisi.');
      return;
    }

    const initials = formData.shortName 
      ? formData.shortName.trim().slice(0, 2).toUpperCase()
      : formData.name.trim().slice(0, 2).toUpperCase();

    const sigUrl = formData.digitalSignatureUrl || formData.signatureUrl;

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        ...formData,
        name: formData.name.trim(),
        shortName: formData.shortName?.trim() || formData.name.trim(),
        nip: formData.nip?.trim() || editingUser.nip,
        email: formData.email.trim(),
        password: formData.password?.trim() || editingUser.password || '1234',
        role: (formData.role as UserRole) || editingUser.role,
        analyistCode: formData.analyistCode?.trim(),
        specialization: formData.specialization?.trim(),
        avatarInitials: initials,
        digitalSignatureLabel: formData.digitalSignatureLabel?.trim() || USER_ROLE_LABELS[formData.role as UserRole],
        digitalSignatureUrl: sigUrl,
        signatureUrl: sigUrl,
        isActive: formData.isActive ?? true,
      } as UserProfile);
    } else {
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: formData.name.trim(),
        shortName: formData.shortName?.trim() || formData.name.trim(),
        nip: formData.nip?.trim() || `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        email: formData.email.trim(),
        password: formData.password?.trim() || '1234',
        role: (formData.role as UserRole) || 'ANALYST',
        analyistCode: formData.analyistCode?.trim(),
        specialization: formData.specialization?.trim(),
        avatarInitials: initials,
        digitalSignatureLabel: formData.digitalSignatureLabel?.trim() || USER_ROLE_LABELS[formData.role as UserRole],
        digitalSignatureUrl: sigUrl,
        signatureUrl: sigUrl,
        isActive: formData.isActive ?? true,
      };
      onAddUser(newUser);
    }

    setIsModalOpen(false);
  };

  // Matrix Menu Definitions
  const ALL_MENUS = [
    { id: 'dashboard', label: 'Dashboard LSCP & Monitoring', category: 'Operasional Lab' },
    { id: 'sample_receipt', label: 'Tanda Terima Sampel (BATT)', category: 'Operasional Lab' },
    { id: 'sample_prep', label: 'Preparasi Sampel & BA', category: 'Operasional Lab' },
    { id: 'subcontract_notice', label: 'Subkontrak Lab Rekanan', category: 'Operasional Lab' },
    { id: 'blank_worksheet', label: 'Form Kosong Teknisi', category: 'Operasional Lab' },
    { id: 'waktu_pengujian', label: 'Waktu Pengujian (Standard Lead Time)', category: 'Operasional Lab' },
    { id: 'po_management', label: 'Kelola PO & Sampel', category: 'Operasional Lab' },
    { id: 'pp_worksheet', label: 'Input Data Uji (22 Rumus Kertas Kerja)', category: 'Operasional Lab' },
    { id: 'sandbox_test', label: 'Sandbox Uji Rumus', category: 'Operasional Lab' },
    { id: 'quotation', label: 'Penawaran Harga', category: 'Administrasi & Keuangan' },
    { id: 'client_master', label: 'Master Data Client & Lab', category: 'Administrasi & Keuangan' },
    { id: 'invoice', label: 'Invoice & Tagihan', category: 'Administrasi & Keuangan' },
    { id: 'financial_analytics', label: 'Dashboard Keuangan & Analisis', category: 'Administrasi & Keuangan' },
    { id: 'file_explorer', label: 'Windows File Explorer', category: 'Sistem' },
    { id: 'schema_viewer', label: 'Skema DB Future-Proof', category: 'Sistem' },
    { id: 'settings', label: 'Pengaturan & Master', category: 'Sistem' },
  ];

  const ROLES_LIST: UserRole[] = [
    'SUPER_ADMIN',
    'EXECUTIVE_DIRECTOR',
    'LAB_MANAGER',
    'QA_QC_COORDINATOR',
    'ANALYST',
    'ADMIN_FINANCE'
  ];

  return (
    <div className="w-full max-w-full px-4 sm:px-6 py-4 space-y-4 text-slate-800">
      
      {/* ===== HEADER BANNER ===== */}
      <div className="bg-gradient-to-r from-teal-50/90 via-white to-emerald-50/80 p-4 sm:p-5 rounded-2xl text-slate-900 shadow-sm border border-teal-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-teal-600" />
              TIMES® RBAC SECURITY ENGINE — SUPER ADMIN FULL ACCESS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span>Manajemen User &amp; Hak Akses (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1 max-w-2xl">
            Super Admin memiliki akses mutlak untuk menambah, mengubah role, mengganti password, mengunggah tanda tangan digital, serta menghapus profil pengguna.
          </p>
        </div>

        {/* Action Controls & Sub-Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daftar User ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Matriks Hak Akses</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah User Baru</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DAFTAR USER & PROFIL                                            */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-3.5">
          {/* Search Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nama, NIP, Email, atau Peran..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600 focus:bg-white transition"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              Total Pengguna: <strong className="text-slate-900">{filteredUsers.length} User Terdaftar</strong>
            </span>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 text-[10.5px] uppercase tracking-wider">
                    <th className="py-3 px-4">Pengguna / User</th>
                    <th className="py-3 px-4">NIP &amp; Password</th>
                    <th className="py-3 px-4">Peran (Role)</th>
                    <th className="py-3 px-4">Kode / Spesialisasi</th>
                    <th className="py-3 px-4">Tanda Tangan Digital</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi (Super Admin)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const badge = USER_ROLE_BADGE[user.role];
                    const isCurrent = currentUser.id === user.id;
                    return (
                      <tr key={user.id} className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-teal-50/40' : ''}`}>
                        {/* Avatar & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${badge.bg} ${badge.text} flex items-center justify-center font-black text-xs border-2 ${badge.border} shadow-xs shrink-0`}>
                              {user.avatarInitials}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded bg-teal-600 text-white text-[9px] font-black">LOGIN</span>
                                )}
                              </div>
                              <div className="text-[10.5px] text-slate-500 font-mono">{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* NIP & Password */}
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-800">{user.nip}</div>
                          <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5">
                            <Key className="w-3 h-3 text-emerald-600" />
                            <span>PW: {user.password || '1234'}</span>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${badge.bg} ${badge.text} border ${badge.border}`}>
                            {USER_ROLE_LABELS[user.role]}
                          </span>
                        </td>

                        {/* Code & Specialization */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {user.analyistCode && (
                              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[10px] border border-blue-200">
                                {user.analyistCode}
                              </span>
                            )}
                            <div className="text-[10.5px] text-slate-600 font-medium truncate max-w-xs" title={user.specialization}>
                              {user.specialization || '-'}
                            </div>
                          </div>
                        </td>

                        {/* Digital Signature Label */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {user.digitalSignatureUrl || user.signatureUrl ? (
                              <div className="h-8 w-16 bg-slate-50 border border-slate-200 rounded p-0.5 flex items-center justify-center overflow-hidden">
                                <img src={user.digitalSignatureUrl || user.signatureUrl} alt="TTD" className="max-h-7 max-w-full object-contain" />
                              </div>
                            ) : null}
                            <div className="text-[10.5px] font-mono text-slate-700 font-semibold truncate max-w-[140px]">
                              {user.digitalSignatureLabel || 'Terverifikasi'}
                            </div>
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${user.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                            {user.isActive ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSwitchUser(user)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[10.5px] font-extrabold border border-teal-200 cursor-pointer transition"
                              title="Switch Profile &amp; Simulasi Layar Role Ini"
                            >
                              Switch Profile
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer transition"
                              title="Edit Role, PW &amp; Profil User"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin menghapus user "${user.name}" (${USER_ROLE_LABELS[user.role]}) secara permanen?`)) {
                                  onDeleteUser(user.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer transition"
                              title="Hapus User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MATRIKS HAK AKSES PERAN (PERMISSIONS MATRIX)                  */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <span>Matriks Akses Menu per Peran (Role Access Matrix ISO 17025)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tabel visual izin akses menu web app berdasarkan 6 tingkatan peran resmi laboratorium.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 font-extrabold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-72">Menu &amp; Fitur Sistem</th>
                  {ROLES_LIST.map(role => {
                    const badge = USER_ROLE_BADGE[role];
                    return (
                      <th key={role} className="py-3 px-3 text-center border-l border-slate-200 min-w-[110px]">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black block ${badge.bg} ${badge.text}`}>
                          {USER_ROLE_LABELS[role]}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {ALL_MENUS.map(menu => (
                  <tr key={menu.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-sans font-extrabold text-slate-900">
                      <div className="flex items-center justify-between">
                        <span>{menu.label}</span>
                        <span className="text-[9px] font-mono text-slate-400 font-normal">{menu.category}</span>
                      </div>
                    </td>
                    {ROLES_LIST.map(role => {
                      const allowed = isMenuAllowed(menu.id, role);
                      return (
                        <td key={role} className="py-2.5 px-3 text-center border-l border-slate-200">
                          {allowed ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-300">
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MODAL ADD / EDIT USER ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 text-slate-900 flex items-center justify-between border-b border-teal-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingUser ? `Edit Profil &amp; Akses User: ${editingUser.name}` : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Super Admin Kontrol Penuh: Ubah Peran (Role), Password, Kode Analis, Spesialisasi &amp; TTD Digital.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Nama Lengkap & Nama Panggilan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Nama Lengkap &amp; Gelar *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="misal: Ir. Alan Suherman, M.T."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Nama Panggilan (Short) *</label>
                  <input
                    type="text"
                    required
                    value={formData.shortName || ''}
                    onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                    placeholder="misal: Pak Alan"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* NIP & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">NIP / Kode User *</label>
                  <input
                    type="text"
                    required
                    value={formData.nip || ''}
                    onChange={e => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="misal: MNG-0001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Email Resmi *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alan@ansalab.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Password Input (dengan Eye Toggle) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Password Login User *</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold">Default: 1234</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password || '1234'}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password..."
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-emerald-300 text-xs bg-white focus:outline-none focus:border-emerald-600 font-mono font-bold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role & Kode Analis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Peran (Role) Lab *</label>
                  <select
                    value={formData.role || 'ANALYST'}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-black text-slate-900"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="EXECUTIVE_DIRECTOR">Direktur Operasional (Pak Yustiaji)</option>
                    <option value="LAB_MANAGER">Kepala Lab (Pak Alan)</option>
                    <option value="QA_QC_COORDINATOR">Kepala Teknis / Koordinator (Noval)</option>
                    <option value="ANALYST">Analis / Teknisi Lab (Rafi/Rizki/Rasya)</option>
                    <option value="ADMIN_FINANCE">Admin Finance &amp; Marketing (Syabaab)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Kode Analis (Opsional)</label>
                  <input
                    type="text"
                    value={formData.analyistCode || ''}
                    onChange={e => setFormData({ ...formData, analyistCode: e.target.value })}
                    placeholder="misal: AO#1, AO#2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Spesialisasi */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Spesialisasi Pengujian</label>
                <input
                  type="text"
                  value={formData.specialization || ''}
                  onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="misal: Soil Mechanics, Triaxial CU/CD, Atterberg Limits"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-600 focus:bg-white font-medium text-slate-900"
                />
              </div>

              {/* Label TTD Digital & File Upload TTD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Label Jabatan di LHU</label>
                  <input
                    type="text"
                    value={formData.digitalSignatureLabel || ''}
                    onChange={e => setFormData({ ...formData, digitalSignatureLabel: e.target.value })}
                    placeholder="misal: Kepala Laboratorium"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-teal-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Upload Tanda Tangan (PNG/JPG)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-3 py-2 rounded-lg border border-teal-300 bg-white text-teal-800 text-[11px] font-bold cursor-pointer hover:bg-teal-50 flex items-center justify-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5 text-teal-600" />
                      <span>Pilih Gambar TTD</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleSignatureFileUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Status Akun Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">Status Keaktifan Akun</span>
                  <span className="text-[10px] text-slate-500 font-medium">Jika non-aktif, user tidak dapat melakukan login.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive ?? true}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Submit Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-extrabold cursor-pointer shadow-md transition"
                >
                  {editingUser ? 'Simpan Perubahan User' : 'Tambah User Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
