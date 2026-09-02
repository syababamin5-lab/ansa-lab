import React, { useState, useEffect } from 'react';
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
  Quote,
  Award,
  ChevronRight,
  Flame,
  RefreshCw,
  Clock,
  Volume2,
  HelpCircle,
  Palette,
  Check,
  X,
  Search,
  Key,
  ShieldAlert,
  Loader2,
  ArrowRight,
  Star
} from 'lucide-react';

interface LoginViewProps {
  users: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
}

// Collection of Inspiring Motivational Quotes for Lab Operations
const LAB_MOTIVATIONAL_QUOTES = [
  {
    quote: "Presisi dalam setiap sampel, integritas dalam setiap hasil pengujian. Semangat bertugas & berikan yang terbaik hari ini!",
    author: "STANDAR MUTU ISO/IEC 17025:2017",
    clause: "Klausul 7.7 - Pemastian Keabsahan Hasil",
    tag: "Integritas & Akurasi"
  },
  {
    quote: "Setiap angka di lembar kerja Anda adalah fondasi utama keandalan dan keselamatan struktur geoteknik Indonesia.",
    author: "PRINSIP MEKANIKA TANAH & BATUAN",
    clause: "Klausul 7.2 - Pemilihan, Verifikasi & Validasi Metode",
    tag: "Keandalan Data"
  },
  {
    quote: "Satu sampel yang diuji dengan teliti hari ini menyelamatkan jutaan impian di masa depan. Selamat berkarya!",
    author: "SPIRIT TIM LABORATORIUM ANSA",
    clause: "Klausul 6.2 - Personel & Kompetensi Laboratorium",
    tag: "Dedikasi Mutu"
  },
  {
    quote: "Kedisiplinan pengujian & keakuratan data adalah mahkota profesionalisme seorang Analis Laboratorium.",
    author: "KOMITMEN MUTU ISO 17025",
    clause: "Klausul 4.1 - Ketidakberpihakan & Kerahasiaan Data",
    tag: "Profesionalisme"
  }
];

type ThemeOption = 'executive' | 'obsidian' | 'sapphire';

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [identityInput, setIdentityInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Selected quick helper user card
  const [selectedQuickUser, setSelectedQuickUser] = useState<UserProfile | null>(null);

  // Search & Role Filter for Quick User Selector
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<'all' | 'admin' | 'management' | 'analyst'>('all');

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>('obsidian');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  // Live Time Clock
  const [timeString, setTimeString] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${hrs}.${mins}.${secs} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Motivational Quote Index State & Auto Rotate
  const [quoteIndex, setQuoteIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % LAB_MOTIVATIONAL_QUOTES.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const currentQuoteObj = LAB_MOTIVATIONAL_QUOTES[quoteIndex];

  // Quick fill user credentials
  const handleSelectQuickAccount = (user: UserProfile) => {
    setSelectedQuickUser(user);
    setIdentityInput(user.email);
    setPasswordInput(user.password || '1234');
    setErrorMessage(null);
  };

  const handleClearSelectedUser = () => {
    setSelectedQuickUser(null);
    setIdentityInput('');
    setPasswordInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanIdentity = identityInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanIdentity) {
      setErrorMessage('Silakan masukkan Email, NIP, atau Kode Analis Anda.');
      return;
    }

    if (!cleanPassword) {
      setErrorMessage('Silakan masukkan Password akun Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by email, NIP, shortName, name, or analyst code
      const matchedUser = (users || []).find(u => {
        const matchEmail = u.email.toLowerCase() === cleanIdentity;
        const matchNip = u.nip.toLowerCase() === cleanIdentity;
        const matchName = u.name.toLowerCase().includes(cleanIdentity) || u.shortName.toLowerCase() === cleanIdentity;
        const matchAo = u.analyistCode && u.analyistCode.toLowerCase() === cleanIdentity;
        return (matchEmail || matchNip || matchName || matchAo) && u.isActive;
      });

      if (!matchedUser) {
        setIsLoading(false);
        setErrorMessage('Pengguna tidak ditemukan atau akun dalam status non-aktif.');
        return;
      }

      // Check password (default '1234' or custom password)
      const expectedPassword = matchedUser.password || '1234';
      if (cleanPassword !== expectedPassword) {
        setIsLoading(false);
        setErrorMessage('Password salah! Password bawaan akun adalah 1234.');
        return;
      }

      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('ansa_lab_saved_identity', matchedUser.email);
      } else {
        localStorage.removeItem('ansa_lab_saved_identity');
      }

      setIsLoading(false);
      onLoginSuccess(matchedUser);
    }, 700);
  };

  // Filter users list based on Search and Role Filter
  const filteredQuickUsers = (users || []).filter(u => {
    const q = userSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.nip.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.analyistCode && u.analyistCode.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeRoleFilter === 'admin') {
      return u.role === 'SUPER_ADMIN' || u.role === 'ADMIN_FINANCE';
    }
    if (activeRoleFilter === 'management') {
      return u.role === 'EXECUTIVE_DIRECTOR' || u.role === 'LAB_MANAGER' || u.role === 'QA_QC_COORDINATOR';
    }
    if (activeRoleFilter === 'analyst') {
      return u.role === 'ANALYST';
    }
    return true;
  });

  // Role Badge Styling
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', style: 'bg-slate-900 text-white font-extrabold' };
      case 'EXECUTIVE_DIRECTOR':
        return { label: 'Direktur & Kepala Lab', style: 'bg-blue-700 text-white font-extrabold' };
      case 'LAB_MANAGER':
        return { label: 'Manajer Operasional Lab', style: 'bg-indigo-700 text-white font-extrabold' };
      case 'QA_QC_COORDINATOR':
        return { label: 'Koordinator Analis Lab', style: 'bg-slate-100 text-slate-700 font-extrabold border border-slate-300' };
      case 'ADMIN_FINANCE':
        return { label: 'Administrasi & Logistik Lab', style: 'bg-slate-900 text-white font-extrabold' };
      case 'ANALYST':
      default:
        return { label: 'Analis / Teknisi Lab', style: 'bg-slate-100 text-slate-700 font-extrabold border border-slate-300' };
    }
  };

  const getThemeBgClass = () => {
    if (currentTheme === 'executive') return 'from-slate-900 via-slate-800 to-slate-950';
    if (currentTheme === 'sapphire') return 'from-slate-950 via-blue-950 to-slate-900';
    return 'from-slate-950 via-slate-900 to-slate-950';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeBgClass()} text-slate-200 flex flex-col justify-between p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-600 selection:text-white relative overflow-x-hidden`}>
      
      {/* ========================================================================= */}
      {/* TOP NAVBAR BRANDING HEADER                                               */}
      {/* ========================================================================= */}
      <header className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-4 z-20 py-2">
        {/* Left Logo & Org Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-900 border border-slate-700 flex items-center justify-center text-white font-black text-sm shadow-md">
            AL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">TIMES® ANSA LIMS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 font-mono text-[10px] font-extrabold border border-blue-500/40">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              PT. Transka Dharma Konsultan • Laboratorium Mekanika Tanah &amp; Batuan
            </p>
          </div>
        </div>

        {/* Right Utility Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Tema: {currentTheme === 'executive' ? 'Studio White' : currentTheme === 'sapphire' ? 'Royal Sapphire' : 'Obsidian Stealth'}</span>
            </button>

            {isThemeMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 space-y-2 animate-in fade-in duration-150">
                <div className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider px-2">
                  PILIH NUANSA DESAIN
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { setCurrentTheme('executive'); setIsThemeMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      currentTheme === 'executive' ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Executive Crisp (Studio White)</span>
                    {currentTheme === 'executive' && <span className="px-1.5 py-0.2 bg-white/20 rounded text-[9px]">Aktif</span>}
                  </button>

                  <button
                    onClick={() => { setCurrentTheme('obsidian'); setIsThemeMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      currentTheme === 'obsidian' ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Obsidian Stealth (Midnight Glass)
                    </span>
                    {currentTheme === 'obsidian' && <span className="px-1.5 py-0.2 bg-white/20 rounded text-[9px]">Aktif</span>}
                  </button>

                  <button
                    onClick={() => { setCurrentTheme('sapphire'); setIsThemeMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      currentTheme === 'sapphire' ? 'bg-blue-600 text-white font-extrabold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      Royal Sapphire (Navy Titanium)
                    </span>
                    {currentTheme === 'sapphire' && <span className="px-1.5 py-0.2 bg-white/20 rounded text-[9px]">Aktif</span>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ISO 17025 Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ISO/IEC 17025</span>
          </div>

          {/* Live Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>{timeString}</span>
          </div>

          {/* Sound & Help */}
          <button className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white transition cursor-pointer">
            <Volume2 className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:text-white transition cursor-pointer">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOTIVATIONAL BANNER FOR LAB TEAM                                         */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto w-full z-10 my-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white italic leading-snug">
                "{currentQuoteObj.quote}"
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[10.5px]">
                <span className="font-extrabold text-amber-400 uppercase tracking-wider font-mono">
                  — {currentQuoteObj.author}
                </span>
                <span className="text-slate-500">•</span>
                <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                  {currentQuoteObj.clause}
                </span>
                <span className="px-2 py-0.2 rounded bg-blue-950 text-blue-300 font-mono font-extrabold border border-blue-800">
                  {currentQuoteObj.tag}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setQuoteIndex(prev => (prev + 1) % LAB_MOTIVATIONAL_QUOTES.length)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition shadow-xs self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Inspirasi Lain</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN CONTAINER                                                */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-2 z-10 items-stretch">
        
        {/* ── LEFT COLUMN: FORM LOGIN (PRISTINE WHITE CARD) ────────────────────── */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 p-7 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl space-y-5 flex flex-col justify-between text-slate-900">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-mono font-extrabold border border-slate-200 inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Gerbang Autentikasi Sistem</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-mono font-extrabold border border-blue-200 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Smart Card / Bio</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Gunakan Email, NIP, atau Kode Analis Anda untuk masuk ke sistem LIMS.
            </p>
          </div>

          {/* Selected Quick User Chip */}
          {selectedQuickUser && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center font-mono shrink-0">
                  {selectedQuickUser.avatarInitials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-black text-slate-900 truncate">{selectedQuickUser.name}</strong>
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-mono font-bold text-[9px]">
                      {selectedQuickUser.nip}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{selectedQuickUser.digitalSignatureLabel || selectedQuickUser.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedUser}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                title="Batal Pilih Akun Ini"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shadow-sm animate-in fade-in">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FORM LOGIN */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identity Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider block">
                EMAIL / NIP / KODE ANALIS:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={identityInput}
                  onChange={e => setIdentityInput(e.target.value)}
                  placeholder="mis. admin@ansalab.com atau SA-0001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-9 py-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-2xs"
                />
                {identityInput && (
                  <button
                    type="button"
                    onClick={() => setIdentityInput('')}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-700 tracking-wider">
                <label>PASSWORD:</label>
                <span className="text-[10px] font-mono text-amber-900 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-700" />
                  <span>Default: 1234</span>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 text-xs cursor-pointer transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Lupa Sandi */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Ingat akun di perangkat ini</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Untuk mereset password, silakan hubungi Super Admin (admin@ansalab.com).')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                Lupa Sandi?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer active:scale-98 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                  <span>Validasi Kredensial &amp; Otorisasi ISO 17025...</span>
                </>
              ) : (
                <>
                  <span>➔ MASUK KE SISTEM</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Sistem Terintegrasi ISO 17025 • PT. Transka Dharma</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              AES-256 TLS Encrypted
            </span>
          </div>
        </div>

        {/* ── RIGHT COLUMN: QUICK USER SELECTOR (PRISTINE WHITE CARD) ─────────── */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 p-6 sm:p-7 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4 text-slate-900">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                  PILIH AKUN CEPAT PENGGUNA RESMI
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Klik akun di bawah untuk memuat identitas (<b className="text-blue-700 font-mono font-bold">Password : 1234</b>)
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-mono text-[10.5px] font-black border border-blue-200 shrink-0 self-start sm:self-auto">
              8 Akun Tersedia
            </span>
          </div>

          {/* Search Bar & Role Filter Pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                placeholder="Cari nama, NIP, email, atau divisi..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => setActiveRoleFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  activeRoleFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({users.length})
              </button>
              <button
                onClick={() => setActiveRoleFilter('admin')}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  activeRoleFilter === 'admin' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Admin (2)
              </button>
              <button
                onClick={() => setActiveRoleFilter('management')}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  activeRoleFilter === 'management' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Manajemen (2)
              </button>
              <button
                onClick={() => setActiveRoleFilter('analyst')}
                className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  activeRoleFilter === 'analyst' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Analis (4)
              </button>
            </div>
          </div>

          {/* Quick User Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredQuickUsers.map(user => {
              const badgeInfo = getRoleBadgeStyle(user.role);
              const isSelected = selectedQuickUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectQuickAccount(user)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-98 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200/90 hover:bg-slate-50/90 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono border border-slate-800 shadow-2xs">
                        {user.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs font-black text-slate-900 truncate block">{user.name}</strong>
                          {user.analyistCode && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200 font-mono font-bold text-[9px] shrink-0">
                              {user.analyistCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">NIP: {user.nip}</p>
                      </div>
                    </div>
                  </div>

                  <div className="my-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] inline-block ${badgeInfo.style}`}>
                      {badgeInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-[150px] text-slate-500 font-medium">{user.email}</span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5 shrink-0">
                      <span>Pilih</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10.5px] text-slate-400 font-mono text-center pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Klik salah satu akun di atas untuk memuat identitas &amp; password secara instan.</span>
          </div>
        </div>

      </main>

      {/* ========================================================================= */}
      {/* PAGE FOOTER                                                              */}
      {/* ========================================================================= */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400 font-medium py-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <span className="font-bold">
          © 2026 TIMES® ANSA LIMS • PT. Transka Dharma Konsultan • <span className="text-slate-300 font-normal">Geotechnical &amp; Rock Mechanics Laboratory System</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Standard SNI &amp; ASTM Certified
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-bold">
            KAN LP-847-IDN
          </span>
        </div>
      </footer>
    </div>
  );
};
