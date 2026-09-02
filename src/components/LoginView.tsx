import React, { useState } from 'react';
import { UserProfile, USER_ROLE_LABELS, USER_ROLE_BADGE } from '../types/userTypes';
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-teal-500 selection:text-white relative overflow-hidden">
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BRANDING BAR */}
      <header className="flex items-center justify-between max-w-6xl mx-auto w-full z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-teal-900/40 border border-teal-400/30">
            AL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">TIMES® ANSA LIMS</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[9.5px] font-bold border border-teal-500/30">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono">PT. Terraforma Geoteknik Indonesia</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 backdrop-blur-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>ISO/IEC 17025 Certified System</span>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-6 z-10 items-center">
        {/* LEFT COLUMN: FORM LOGIN */}
        <div className="lg:col-span-5 bg-slate-800/90 border border-slate-700/90 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-md space-y-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono font-bold border border-teal-500/20 inline-flex items-center gap-1.5 mb-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Gerbang Autentikasi Sistem</span>
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
              Masuk ke Akun Laboratorium
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan Email / NIP dan Password Anda untuk masuk ke sistem.
            </p>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold flex items-start gap-2.5 shadow-md animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORM LOGIN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identity Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block">Email / NIP / Kode Analis:</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={identityInput}
                  onChange={e => setIdentityInput(e.target.value)}
                  placeholder="mis. admin@ansalab.com atau SA-0001"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <label>Password:</label>
                <span className="text-[10.5px] font-mono text-teal-400 font-normal">Default: 1234</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-600 focus:ring-teal-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <span>Ingat akun di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-900/50 transition cursor-pointer active:scale-98"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Sistem</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: QUICK SELECT USER HELPER CARDS FOR 8 ROLES */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>Pilih Akun Cepat Pengguna Resmi (Password: 1234)</span>
            </h2>
            <span className="text-[10.5px] font-mono text-slate-400">8 Akun Terdaftar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {users.map(user => {
              const badgeObj = USER_ROLE_BADGE[user.role];
              const isSelected = selectedQuickUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectQuickAccount(user)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 space-y-1.5 ${
                    isSelected
                      ? 'bg-teal-950/80 border-teal-400 shadow-md ring-2 ring-teal-500/30'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center font-black text-xs text-white shrink-0">
                        {user.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <strong className="text-xs font-extrabold text-white leading-tight">{user.name}</strong>
                          {user.analyistCode && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 font-black text-[9px] font-mono">
                              {user.analyistCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">NIP: {user.nip}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border shrink-0 ${badgeObj.bg} ${badgeObj.text} ${badgeObj.border}`}>
                      {USER_ROLE_LABELS[user.role]}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 pt-1 border-t border-slate-700/50">
                    <span className="truncate max-w-[170px]">{user.email}</span>
                    <span className="text-teal-400 font-bold flex items-center gap-1">
                      <span>Tap untuk Login</span>
                      <span>➔</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto w-full text-center text-[10.5px] text-slate-500 font-mono py-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <span>© 2026 TIMES® ANSA LIMS • PT. Terraforma Geoteknik Indonesia</span>
        <span>Standard Operating Procedure SNI &amp; ASTM Compliant</span>
      </footer>
    </div>
  );
};
