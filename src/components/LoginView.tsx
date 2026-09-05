import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types/userTypes';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  Sparkles,
  Clock,
  X,
  Search,
  Key,
  Loader2,
  Star,
  ShieldCheck,
  ChevronRight
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

// ============================================================================
// GOOGLE ANTIGRAVITY 3D GRAVITATIONAL PARTICLE VORTEX CANVAS
// ============================================================================
const AntigravityCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle field initialization
    // Creates a 3D gravitational spherical / spiral vortex shell
    const PARTICLE_COUNT = 850;
    const particles: {
      x: number;
      y: number;
      z: number;
      baseRadius: number;
      theta: number;
      phi: number;
      speed: number;
      size: number;
      color: string;
      alpha: number;
    }[] = [];

    const colors = [
      '#60a5fa', // Blue 400
      '#38bdf8', // Sky 400
      '#818cf8', // Indigo 400
      '#93c5fd', // Blue 300
      '#ffffff', // White
      '#c7d2fe', // Indigo 200
      '#3b82f6'  // Blue 500
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      // Concentrated radius with subtle wave banding
      const baseRadius = 240 + Math.random() * 220 + Math.sin(theta * 3) * 25;
      const speed = (0.0015 + Math.random() * 0.0025) * (Math.random() > 0.4 ? 1 : -1);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 1.0 + Math.random() * 1.8;

      particles.push({
        x: baseRadius * Math.sin(phi) * Math.cos(theta),
        y: baseRadius * Math.sin(phi) * Math.sin(theta),
        z: baseRadius * Math.cos(phi),
        baseRadius,
        theta,
        phi,
        speed,
        size,
        color,
        alpha: 0.25 + Math.random() * 0.75
      });
    }

    let rotX = 0.25;
    let rotY = 0;
    let targetRotX = 0.25;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / width - 0.5) * 2;
      const ny = (e.clientY / height - 0.5) * 2;
      targetRotY = nx * 0.35;
      targetRotX = 0.25 - ny * 0.35;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const fov = 480;

    const render = () => {
      ctx.fillStyle = '#030712'; // Ultra dark pitch black
      ctx.fillRect(0, 0, width, height);

      // Deep celestial ambient center glow positioned towards center-left
      const centerX = width > 1024 ? width * 0.38 : width * 0.5;
      const centerY = height * 0.5;

      const radialGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        40,
        centerX,
        centerY,
        Math.max(width, height) * 0.75
      );
      radialGrad.addColorStop(0, 'rgba(30, 58, 138, 0.28)'); // Deep sapphire glow
      radialGrad.addColorStop(0.45, 'rgba(15, 23, 42, 0.65)');
      radialGrad.addColorStop(1, 'rgba(3, 7, 18, 1)');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Smooth camera interpolation
      rotX += (targetRotX - rotX) * 0.04;
      rotY += (targetRotY - rotY) * 0.04;

      // Gentle continuous ambient rotation
      rotY += 0.0018;
      rotX += 0.0004;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Perspective projection
      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Orbit update
        p.theta += p.speed;
        p.x = p.baseRadius * Math.sin(p.phi) * Math.cos(p.theta);
        p.y = p.baseRadius * Math.sin(p.phi) * Math.sin(p.theta);
        p.z = p.baseRadius * Math.cos(p.phi);

        // 3D rotation Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        // 3D rotation X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // Perspective projection
        const scale = fov / (fov + z2 + 380);
        const px = x1 * scale + centerX;
        const py = y2 * scale + centerY;

        projected.push({
          px,
          py,
          scale,
          z: z2,
          size: p.size * scale,
          color: p.color,
          alpha: p.alpha * Math.min(1, Math.max(0.15, (z2 + 380) / 760))
        });
      }

      projected.sort((a, b) => b.z - a.z);

      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        if (pt.scale > 0 && pt.px > -50 && pt.px < width + 50 && pt.py > -50 && pt.py < height + 50) {
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, Math.max(0.6, pt.size), 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.alpha;
          ctx.fill();

          if (pt.scale > 0.85) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = pt.color;
          } else {
            ctx.shadowBlur = 0;
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export const LoginView: React.FC<LoginViewProps> = ({ users, onLoginSuccess }) => {
  const [identityInput, setIdentityInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Selected quick helper user card
  const [selectedQuickUser, setSelectedQuickUser] = useState<UserProfile | null>(null);

  // Quick account drawer/modal state
  const [isQuickAccountsModalOpen, setIsQuickAccountsModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeRoleFilter, setActiveRoleFilter] = useState<'all' | 'admin' | 'management' | 'analyst'>('all');

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
    setIsQuickAccountsModalOpen(false);
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
        const matchShort = (u.shortName || '').toLowerCase() === cleanIdentity;
        const matchCode = (u.analyistCode || '').toLowerCase() === cleanIdentity;
        const matchName = u.name.toLowerCase() === cleanIdentity;
        return matchEmail || matchNip || matchShort || matchCode || matchName;
      });

      if (!matchedUser) {
        setIsLoading(false);
        setErrorMessage('Pengguna tidak ditemukan. Pastikan Email, NIP, atau Kode Analis sudah sesuai.');
        return;
      }

      if (matchedUser.status === 'inactive') {
        setIsLoading(false);
        setErrorMessage('Akun ini sedang dinonaktifkan oleh Administrator Laboratorium.');
        return;
      }

      // Password checking
      const expectedPassword = matchedUser.password || '1234';
      if (cleanPassword !== expectedPassword) {
        setIsLoading(false);
        setErrorMessage('Password salah. Silakan coba lagi atau gunakan password default (1234).');
        return;
      }

      setIsLoading(false);
      onLoginSuccess(matchedUser);
    }, 600);
  };

  const filteredQuickUsers = (users || []).filter(u => {
    const q = userSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.nip.toLowerCase().includes(q) ||
      (u.analyistCode || '').toLowerCase().includes(q) ||
      (u.digitalSignatureLabel || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeRoleFilter === 'admin') return u.role === 'admin';
    if (activeRoleFilter === 'management') return ['kepala_lab', 'manajer_teknis', 'penjamin_mutu'].includes(u.role);
    if (activeRoleFilter === 'analyst') return ['analis_sifat_fisik', 'analis_mekanika', 'operator_lab', 'admin_administrasi'].includes(u.role);
    return true;
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Super Admin Lab', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'kepala_lab':
        return { label: 'Kepala Laboratorium', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'manajer_teknis':
        return { label: 'Manajer Teknis ISO', style: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'penjamin_mutu':
        return { label: 'Quality Manager', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'analis_sifat_fisik':
        return { label: 'Analis Sifat Fisik', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'analis_mekanika':
        return { label: 'Analis Mekanika Tanah', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Teknisi / Personel Lab', style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* ── GOOGLE ANTIGRAVITY 3D PARTICLE VORTEX BACKGROUND ────────────────── */}
      <AntigravityCanvas />

      {/* ===================================================================== */}
      {/* TOP NAVBAR BRANDING HEADER                                            */}
      {/* ===================================================================== */}
      <header className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-20 px-6 py-4">
        {/* Left Logo & Org Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 border border-blue-400/40 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30">
            AL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">TIMES® ANSA LIMS</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] font-extrabold border border-blue-400/30">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              PT. Terraforma Geoteknik Indonesia • Laboratorium Mekanika Tanah &amp; Batuan
            </p>
          </div>
        </div>

        {/* Right Header Status & Live Clock */}
        <div className="flex items-center gap-2.5">
          {/* ISO 17025 Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ISO/IEC 17025:2017</span>
          </div>

          {/* Live Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5 backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>{timeString}</span>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN CONTAINER: LEFT HERO BRANDING + RIGHT LOGIN CARD                 */}
      {/* ===================================================================== */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 my-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        {/* ── LEFT COLUMN (lg:col-span-7): HIGH-TECH HERO BRANDING ─────────── */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-mono font-bold tracking-wider backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>ACCREDITED TESTING &amp; CALIBRATION LABORATORY</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
            Laboratorium <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Mekanika Tanah
            </span> <br />
            &amp; Rekayasa Geoteknik
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl font-normal leading-relaxed">
            Sistem terintegrasi pengujian laboratorium SNI &amp; ASTM, otomatisasi worksheet kalkulasi presisi, manajemen personil terisolasi, hingga penerbitan LHU digital ber-QR Code resmi.
          </p>

          {/* Antigravity Feature Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-semibold backdrop-blur-md shadow-xs">
              ✦ 14+ Parameter Uji SNI/ASTM
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-semibold backdrop-blur-md shadow-xs">
              ✦ Smart Auto-Calculation
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-semibold backdrop-blur-md shadow-xs">
              ✦ QR Code Digital Verification
            </span>
          </div>

          {/* Inspirational Quote Frosted Banner */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md max-w-xl flex items-start gap-3 shadow-xl">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shrink-0 mt-0.5">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-200 italic font-medium leading-snug">
                "{currentQuoteObj.quote}"
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap text-[10.5px] font-mono text-slate-400">
                <span className="text-amber-400 font-extrabold uppercase tracking-wide">— {currentQuoteObj.author}</span>
                <span>•</span>
                <span className="text-blue-300">{currentQuoteObj.tag}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (lg:col-span-5): ELEGANT PRISTINE LOGIN CARD ──────── */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl border border-white/40 p-7 sm:p-8 rounded-3xl shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85),0_0_50px_rgba(59,130,246,0.2)] space-y-5 text-slate-900 relative">
            
            {/* Card Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-mono font-extrabold border border-slate-200 inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Autentikasi Sistem</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-mono font-extrabold border border-blue-200 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>ISO 17025 Ready</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Selamat Datang!
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Masuk dengan Email, NIP, atau Kode Analis Anda.
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
                  <span>Ingat di perangkat ini</span>
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
                className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer active:scale-98 disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 text-white animate-spin" />
                    <span>Memverifikasi Otorisasi ISO 17025...</span>
                  </>
                ) : (
                  <>
                    <span>➔ MASUK KE SISTEM</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Account Selector Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsQuickAccountsModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Pilih Akun Cepat</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Sistem Terintegrasi ISO 17025</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                AES-256 TLS Encrypted
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* ===================================================================== */}
      {/* QUICK ACCOUNTS MODAL DIALOG                                           */}
      {/* ===================================================================== */}
      {isQuickAccountsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                    PILIH AKUN PENGGUNA RESMI
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Pilih akun di bawah untuk mengisi identitas secara otomatis (Password: 1234)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAccountsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Filter */}
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

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1">
              {filteredQuickUsers.map(user => {
                const badgeInfo = getRoleBadgeStyle(user.role);

                return (
                  <div
                    key={user.id}
                    onClick={() => handleSelectQuickAccount(user)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md transition-all duration-150 cursor-pointer active:scale-98 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
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

                    <div className="my-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] inline-block border font-bold ${badgeInfo.style}`}>
                        {badgeInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
                      <span className="truncate max-w-[140px]">{user.email}</span>
                      <span className="text-blue-600 font-bold flex items-center gap-0.5 shrink-0">
                        <span>Pilih</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE FOOTER                                                           */}
      {/* ===================================================================== */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400 font-medium py-4 px-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <span className="font-bold">
          © 2026 TIMES® ANSA LIMS • PT. Terraforma Geoteknik Indonesia • <span className="text-slate-300 font-normal">Geotechnical &amp; Rock Mechanics Laboratory System</span>
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-slate-300">
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
