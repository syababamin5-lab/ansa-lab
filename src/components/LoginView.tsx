import React, { useState } from 'react';
import { UserProfile } from '../types/userTypes';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Building2,
  UserCheck,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  User
} from 'lucide-react';

interface LoginViewProps {
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [identityInput, setIdentityInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Selected quick helper user card
  const [selectedQuickUser, setSelectedQuickUser] = useState<UserProfile | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentity = identityInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanIdentity) {
      setErrorMessage('Silakan masukkan Email, NIP, atau Nama Pengguna.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Silakan masukkan Password.');
      return;
    }

    // Find matching user by email, NIP, shortName, or name
    const matchedUser = (users || []).find(u => {
      const matchEmail = u.email.toLowerCase() === cleanIdentity;
      const matchNip = u.nip.toLowerCase() === cleanIdentity;
      const matchName = u.name.toLowerCase().includes(cleanIdentity) || u.shortName.toLowerCase() === cleanIdentity;
      const matchAo = u.analyistCode && u.analyistCode.toLowerCase() === cleanIdentity;
      return (matchEmail || matchNip || matchName || matchAo) && u.isActive;
    });

    if (!matchedUser) {
      setErrorMessage('Pengguna tidak ditemukan atau akun tidak aktif.');
      return;
    }

    // Check password (default '1234' or saved password)
    const expectedPassword = matchedUser.password || '1234';
    if (cleanPassword !== expectedPassword) {
      setErrorMessage('Password salah! Password default adalah 1234.');
      return;
    }

    // Save remember me preference
    if (rememberMe) {
      localStorage.setItem('ansa_lab_saved_identity', matchedUser.email);
    } else {
      localStorage.removeItem('ansa_lab_saved_identity');
    }

    // Authenticate
    onLoginSuccess(matchedUser);
  };

  // Quick fill user credentials
  const handleSelectQuickAccount = (user: UserProfile) => {
    setSelectedQuickUser(user);
    setIdentityInput(user.email);
    setPasswordInput(user.password || '1234');
    setErrorMessage(null);
  };

  // Harmonious Executive Badge Styling (No Harsh Neon Clashing Colors)
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', style: 'bg-slate-900 text-white border-slate-800' };
      case 'DIRECTOR':
        return { label: 'Direktur Operasional', style: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
      case 'HEAD_OF_LAB':
        return { label: 'Kepala Lab', style: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
      case 'COORDINATOR':
        return { label: 'Kepala Teknis', style: 'bg-teal-50 text-teal-900 border-teal-200' };
      case 'FINANCE':
        return { label: 'Admin Finance', style: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'ANALYST':
      default:
        return { label: 'Analis / Teknisi Lab', style: 'bg-blue-50 text-blue-900 border-blue-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-slate-800 flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-teal-500 selection:text-white relative overflow-hidden">
      {/* BACKGROUND DECORATIVE GLOWS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BRANDING BAR */}
      <header className="flex items-center justify-between max-w-6xl mx-auto w-full z-10 py-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-800 via-teal-700 to-slate-900 flex items-center justify-center text-white font-black text-base shadow-lg border border-white/20">
            AL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">TIMES® ANSA LIMS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-300 font-mono text-[10px] font-extrabold border border-white/20 backdrop-blur-md">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">PT. Transka Dharma Konsultan — Laboratorium Mekanika Tanah</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 font-medium bg-white/10 px-4 py-2 rounded-2xl border border-white/15 backdrop-blur-md shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ISO/IEC 17025 Certified System</span>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6 z-10 items-stretch">
        
        {/* LEFT COLUMN: EXECUTIVE FORM LOGIN (PRISTINE GLASS CONTAINER) */}
        <div className="lg:col-span-5 bg-white/95 border border-slate-200/90 p-7 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-6 flex flex-col justify-between">
          <div>
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-black border border-emerald-200/80 inline-flex items-center gap-1.5 mb-3">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Gerbang Autentikasi Sistem</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Gunakan Email, NIP, atau Kode Analis Anda untuk masuk.
            </p>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-fade-in">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORM LOGIN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identity Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">Email / NIP / Kode Analis:</label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={identityInput}
                  onChange={e => setIdentityInput(e.target.value)}
                  placeholder="mis. admin@ansalab.com atau SA-0001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono shadow-xs"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black text-slate-700">
                <label>Password:</label>
                <span className="text-[11px] font-mono text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Default: 1234</span>
              </div>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 text-xs cursor-pointer transition"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Ingat akun di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 hover:from-emerald-900 hover:to-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition cursor-pointer active:scale-98"
            >
              <LogIn className="w-4.5 h-4.5 text-emerald-300" />
              <span>Masuk ke Sistem</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
            Sistem Terintegrasi ISO 17025 • PT. Transka Dharma Konsultan
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK SELECT USER HELPER CARDS FOR 8 ROLES */}
        <div className="lg:col-span-7 bg-white/90 border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Pilih Akun Cepat Pengguna Resmi
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">Klik salah satu akun di bawah untuk pengisian otomatis (Password: <b className="text-emerald-700 font-mono">1234</b>)</p>
              </div>
            </div>
            <span className="text-[10.5px] font-mono font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              8 Akun Terdaftar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {users.map(user => {
              const badgeInfo = getRoleBadgeStyle(user.role);
              const isSelected = selectedQuickUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectQuickAccount(user)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-98 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/90 border-slate-200/90 hover:bg-white hover:border-emerald-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs border border-slate-700">
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs font-black text-slate-900 truncate block">{user.name}</strong>
                          {user.analyistCode && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 font-black text-[9px] font-mono shrink-0">
                              {user.analyistCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">NIP: {user.nip}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${badgeInfo.style}`}>
                      {badgeInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-200/60 mt-2">
                    <span className="truncate max-w-[160px] text-slate-600 font-semibold">{user.email}</span>
                    <span className="text-emerald-700 font-black flex items-center gap-1 shrink-0">
                      <span>Pilih</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10.5px] text-slate-400 font-mono text-center pt-2 border-t border-slate-100">
            Klik akun di atas untuk memuat identitas &amp; password secara otomatis.
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-400 font-medium py-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <span>© 2026 TIMES® ANSA LIMS • PT. Transka Dharma Konsultan</span>
        <span>Standard Operating Procedure SNI &amp; ASTM Compliant</span>
      </footer>
    </div>
  );
};
