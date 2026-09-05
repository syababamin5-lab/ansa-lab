import React, { useState, useEffect, useCallback } from 'react';
import {
  GuestEntry,
  GUEST_PURPOSE_OPTIONS,
  DEFAULT_LAB_HOSTS,
  getDynamicLabHosts,
  INITIAL_GUEST_ENTRIES
} from '../../types/guestBookTypes';
import {
  saveGuestEntryDirectToCloud,
  updateGuestEntryInCloud,
  loadGuestEntriesFromCloud
} from '../../services/cloudSyncService';
import { SignatureCanvas } from '../common/SignatureCanvas';
import {
  UserCheck,
  QrCode,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  User,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  LogOut,
  Calendar,
  Eye,
  FileSpreadsheet,
  PlusCircle,
  X,
  MapPin,
  FileText,
  Share2,
  Users,
  ChevronDown,
  PackageCheck,
  MessageSquare,
  Check,
  RefreshCw
} from 'lucide-react';

interface GuestBookViewProps {
  initialMode?: 'checkin' | 'admin';
  isPublicMode?: boolean;
  onSwitchToLims?: () => void;
  entries?: GuestEntry[];
  onSaveEntries?: (entries: GuestEntry[]) => void;
}

export const GuestBookView: React.FC<GuestBookViewProps> = ({
  initialMode = 'checkin',
  isPublicMode = false,
  onSwitchToLims,
  entries: propEntries,
  onSaveEntries
}) => {
  const [mode, setMode] = useState<'checkin' | 'admin' | 'poster'>(initialMode);
  
  // Guest Entries State (100% Cloud-First)
  const [entries, setEntries] = useState<GuestEntry[]>(() => propEntries || []);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Sync with propEntries if provided
  useEffect(() => {
    if (propEntries) {
      setEntries(propEntries);
    }
  }, [propEntries]);

  // Load latest entries directly from Cloud Redis on mount & on interval
  const fetchCloudEntries = useCallback(async (showLoading = false) => {
    if (showLoading) setIsCloudLoading(true);
    try {
      const cloudData = await loadGuestEntriesFromCloud();
      setEntries(cloudData);
      onSaveEntries?.(cloudData);
    } catch (e) {
      console.warn('Failed to load guest entries from cloud:', e);
    } finally {
      if (showLoading) setIsCloudLoading(false);
    }
  }, [onSaveEntries]);

  useEffect(() => {
    fetchCloudEntries(true);
    // Polling setiap 8 detik agar tamu yang check in di HP langsung muncul di PC secara real-time
    const interval = setInterval(() => {
      fetchCloudEntries(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchCloudEntries]);

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [purpose, setPurpose] = useState<string>('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [hostName, setHostName] = useState<string>('');
  const [customHost, setCustomHost] = useState('');
  const [notes, setNotes] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  // Custom Dropdown Open States
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false);
  const [isHostDropdownOpen, setIsHostDropdownOpen] = useState(false);

  // Icon & Badge Helpers for Custom Selects
  const getPurposeIcon = (opt: string) => {
    if (opt.includes('Pengiriman') || opt.includes('Sampel')) return PackageCheck;
    if (opt.includes('Laporan') || opt.includes('LHU')) return FileText;
    if (opt.includes('Konsultasi') || opt.includes('Diskusi')) return MessageSquare;
    if (opt.includes('Meeting') || opt.includes('Rapat')) return Users;
    if (opt.includes('Audit')) return ShieldCheck;
    if (opt.includes('Inspeksi') || opt.includes('Kunjungan')) return Eye;
    return Sparkles;
  };

  const getHostBadge = (host: string) => {
    if (host.includes('Rafi')) return { label: 'ANALIS', color: 'bg-teal-100 text-teal-900 border-teal-300' };
    if (host.includes('Nouval')) return { label: 'QC LAB', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    if (host.includes('Yustiaji')) return { label: 'HEAD', color: 'bg-emerald-100 text-emerald-950 border-emerald-300 font-black' };
    if (host.includes('Admin')) return { label: 'ADMIN', color: 'bg-purple-100 text-purple-900 border-purple-300' };
    return { label: 'STAFF', color: 'bg-slate-100 text-slate-700 border-slate-300' };
  };

  // Submit Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<GuestEntry | null>(null);

  // Admin Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Checked In' | 'Checked Out'>('ALL');
  const [selectedEntryModal, setSelectedEntryModal] = useState<GuestEntry | null>(null);

  // Admin Security PIN Lock
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(!isPublicMode);
  const [pinError, setPinError] = useState('');

  const currentCheckInUrl = window.location.href.split('?')[0] + '?mode=guest-checkin';

  // Live Clock State for Form (Auto Date & Time Display)
  const [currentFormTime, setCurrentFormTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ` • ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
      setCurrentFormTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Form Submission
  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !institution.trim() || !phone.trim() || !purpose || !hostName || !signatureUrl) {
      alert('Mohon lengkapi Nama, Instansi, Nomor WhatsApp, Keperluan Kunjungan, Staf Dituju, dan Tanda Tangan Digital Anda.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + `, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    const finalPurpose = purpose === 'Lainnya' ? customPurpose || 'Lainnya' : purpose;
    const finalHost = hostName === 'Lainnya / Tidak Tahu' ? customHost || 'Staf Lab' : hostName;

    const newEntry: GuestEntry = {
      id: `gst-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
      fullName: fullName.trim(),
      institution: institution.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      guestCount: Math.max(1, Number(guestCount) || 1),
      purpose: finalPurpose,
      hostName: finalHost,
      signatureUrl,
      timestamp: now.toISOString(),
      checkInTime: formattedDate,
      status: 'Checked In',
      notes: notes.trim() || undefined
    };

    (async () => {
      try {
        const updatedList = await saveGuestEntryDirectToCloud(newEntry);
        setEntries(updatedList);
        onSaveEntries?.(updatedList);
      } catch (err) {
        setEntries(prev => [newEntry, ...prev]);
      }
      setLastCheckIn(newEntry);
      setIsSubmitting(false);
      // Reset form
      setFullName('');
      setInstitution('');
      setPhone('');
      setEmail('');
      setGuestCount(1);
      setPurpose('');
      setCustomPurpose('');
      setHostName('');
      setCustomHost('');
      setNotes('');
      setSignatureUrl('');
    })();
  };

  // Handle Guest Check Out
  const handleCheckOutGuest = async (entryId: string) => {
    const now = new Date();
    const formattedOutDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + `, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    try {
      const updatedList = await updateGuestEntryInCloud(entryId, {
        status: 'Checked Out',
        checkOutTime: formattedOutDate
      });
      if (updatedList && updatedList.length > 0) {
        setEntries(updatedList);
        onSaveEntries?.(updatedList);
        return;
      }
    } catch (e) {
      console.warn('Failed to update checkout in cloud:', e);
    }

    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          status: 'Checked Out',
          checkOutTime: formattedOutDate
        };
      }
      return entry;
    }));
  };


  // Handle Export to Native Formatted Excel (.xls)
  const handleExportExcel = () => {
    const totalHeadcount = filteredEntries.reduce((acc, e) => acc + (e.guestCount || 1), 0);
    const checkedInHeadcount = filteredEntries.filter(e => e.status === 'Checked In').reduce((acc, e) => acc + (e.guestCount || 1), 0);

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap Buku Tamu ANSA Lab</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; }
          .title { font-size: 14pt; font-weight: bold; color: #065f46; }
          .subtitle { font-size: 11pt; font-weight: bold; color: #334155; }
          .meta { font-size: 9.5pt; color: #475569; }
          th { background-color: #065f46; color: #ffffff; font-weight: bold; border: 1px solid #047857; text-align: left; padding: 8px; vertical-align: middle; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10pt; vertical-align: top; }
          .badge-in { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }
          .badge-out { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="11" class="title">PT. TERRAFORMA GEOTEKNIK INDONESIA — LABORATORIUM MEKANIKA TANAH & BATUAN</td></tr>
          <tr><td colspan="11" class="subtitle">LAPORAN REKAPITULASI BUKU TAMU DIGITAL (ANSA LAB)</td></tr>
          <tr><td colspan="11" class="meta">Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • Total Registrasi: ${filteredEntries.length} (${totalHeadcount} Orang) • Aktif di Lab: ${checkedInHeadcount} Orang</td></tr>
          <tr></tr>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">No</th>
              <th style="width: 140px;">ID Registrasi</th>
              <th style="width: 180px;">Nama Tamu</th>
              <th style="width: 210px;">Instansi / Perusahaan</th>
              <th style="width: 130px;">No WhatsApp</th>
              <th style="width: 100px; text-align: center;">Jumlah Tamu</th>
              <th style="width: 220px;">Host / Staf Dituju</th>
              <th style="width: 220px;">Keperluan Kunjungan</th>
              <th style="width: 160px;">Waktu Check In</th>
              <th style="width: 110px; text-align: center;">Status</th>
              <th style="width: 160px;">Waktu Check Out</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEntries.map((e, idx) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                <td style="mso-number-format:'\\@';">${e.id}</td>
                <td><b>${e.fullName}</b></td>
                <td>${e.institution}</td>
                <td style="mso-number-format:'\\@';">'${e.phone}</td>
                <td style="text-align: center; font-weight: bold;">${e.guestCount || 1} Orang</td>
                <td>${e.hostName}</td>
                <td>${e.purpose}</td>
                <td>${e.checkInTime}</td>
                <td class="${e.status === 'Checked In' ? 'badge-in' : 'badge-out'}">${e.status}</td>
                <td>${e.checkOutTime || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Buku_Tamu_ANSA_Lab_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export to PDF Report
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Gagal membuka jendela PDF. Mohon izinkan popup di browser Anda.');
      return;
    }

    const totalHeadcount = filteredEntries.reduce((acc, e) => acc + (e.guestCount || 1), 0);
    const checkedInHeadcount = filteredEntries.filter(e => e.status === 'Checked In').reduce((acc, e) => acc + (e.guestCount || 1), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Rekapitulasi Buku Tamu - ANSA Lab</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 14px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 16pt; color: #065f46; font-weight: 800; letter-spacing: -0.01em; }
          .header h2 { margin: 4px 0 0 0; font-size: 11pt; color: #334155; font-weight: 600; }
          .header p { margin: 4px 0 0 0; font-size: 8.5pt; color: #64748b; }
          .stats-bar { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 9.5pt; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8.5pt; }
          th { background: #065f46; color: white; padding: 8px 10px; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.05em; }
          td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: top; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7.5pt; font-weight: bold; }
          .badge-in { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .badge-out { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
          .footer { margin-top: 28px; text-align: right; font-size: 8pt; color: #64748b; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PT. TERRAFORMA GEOTEKNIK INDONESIA</h1>
          <h2>LABORATORIUM MEKANIKA TANAH & BATUAN (ANSA LAB)</h2>
          <p>LAPORAN REKAPITULASI BUKU TAMU DIGITAL • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="stats-bar">
          <div>TOTAL TAMU TERCATAT: <strong>${filteredEntries.length} Registrasi (${totalHeadcount} Orang)</strong></div>
          <div>AKTIF DI LAB: <strong>${checkedInHeadcount} Orang</strong></div>
          <div>SELESAI: <strong>${totalHeadcount - checkedInHeadcount} Orang</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">No</th>
              <th style="width: 14%;">Waktu Check In</th>
              <th style="width: 22%;">Nama Tamu & Instansi</th>
              <th style="width: 11%;">No. WA</th>
              <th style="width: 7%; text-align: center;">Jumlah</th>
              <th style="width: 18%;">Host / Staf Dituju</th>
              <th style="width: 14%;">Keperluan</th>
              <th style="width: 10%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEntries.map((e, i) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${i + 1}</td>
                <td>${e.checkInTime}</td>
                <td><strong>${e.fullName}</strong><br/><span style="color:#64748b; font-size:8pt;">${e.institution}</span></td>
                <td>${e.phone}</td>
                <td style="text-align: center; font-weight: bold;">${e.guestCount || 1} Orgs</td>
                <td>${e.hostName}</td>
                <td>${e.purpose}</td>
                <td>
                  <span class="badge ${e.status === 'Checked In' ? 'badge-in' : 'badge-out'}">
                    ${e.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Dicetak secara otomatis dari Sistem TIMES® ANSA LIMS pada ${new Date().toLocaleString('id-ID')}</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Admin PIN Unlock
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '229308') {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('PIN salah! Mohon masukkan PIN Admin: 229308');
    }
  };

  // Filtered Entries for Admin Log
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPeopleCount = entries.reduce((acc, e) => acc + (e.guestCount || 1), 0);
  const checkedInPeopleCount = entries.filter(e => e.status === 'Checked In').reduce((acc, e) => acc + (e.guestCount || 1), 0);
  const checkedInCount = entries.filter(e => e.status === 'Checked In').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-16">
      {/* BRANDING TOP NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
              <UserCheck className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  BUKU TAMU DIGITAL
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                PT. Terraforma Geoteknik Indonesia — Laboratorium Mekanika Tanah &amp; Batuan
              </p>
            </div>
          </div>

          {!isPublicMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('checkin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'checkin'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Form Tamu</span>
              </button>

              <button
                onClick={() => setMode('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'admin'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Rekap Admin</span>
                {checkedInCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                    {checkedInCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMode('poster')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  mode === 'poster'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Cetak Poster QR</span>
              </button>

              {onSwitchToLims && (
                <button
                  onClick={onSwitchToLims}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-2 border border-slate-700"
                >
                  <span>Masuk Sistem LIMS</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 mt-6">
        {/* ================================================================= */}
        {/* VIEW 1: PUBLIC GUEST CHECK-IN FORM (QR SCAN TARGET)               */}
        {/* ================================================================= */}
        {mode === 'checkin' && (
          <div className="max-w-md mx-auto space-y-4">
            {/* SUCCESS CONFIRMATION SCREEN */}
            {lastCheckIn ? (
              <div className="bg-white rounded-3xl border border-emerald-300 shadow-xl p-5 sm:p-6 space-y-5 animate-fade-in text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9 animate-bounce" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200">
                    REGISTRASI BERHASIL
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1.5">
                    Selamat Datang di ANSA Lab!
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Terima kasih telah mengisi buku tamu online. Data Anda telah tercatat pada sistem penerimaan laboratorium.
                  </p>
                </div>

                {/* TICKET DETAILS CARD */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-left space-y-2.5 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-mono text-slate-500 font-bold">ID TAMU</span>
                    <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {lastCheckIn.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10.5px] text-slate-500 font-semibold block">Nama Tamu</span>
                      <span className="font-bold text-slate-900">{lastCheckIn.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-500 font-semibold block">Instansi / Perusahaan</span>
                      <span className="font-bold text-slate-900">{lastCheckIn.institution}</span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-500 font-semibold block">Jumlah Tamu</span>
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-200">
                        {lastCheckIn.guestCount || 1} Orang
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-slate-500 font-semibold block">Waktu Check In</span>
                      <span className="font-bold text-slate-900">{lastCheckIn.checkInTime}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10.5px] text-slate-500 font-semibold block">Host / Dituju</span>
                      <span className="font-bold text-slate-900">{lastCheckIn.hostName}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <span className="text-[10.5px] text-slate-500 font-semibold block">Keperluan</span>
                    <span className="text-xs font-bold text-slate-800">{lastCheckIn.purpose}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2.5 flex items-start gap-2 text-[10.5px] text-slate-500 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-tight text-left">
                      Data pribadi Anda dilindungi sesuai peraturan perundang-undangan (UU PDP). Pihak laboratorium hanya berkepentingan untuk verifikasi identitas dan administrasi kunjungan saja.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* FORM CHECK-IN TAMU (OPTIMIZED FOR MOBILE HP VIEWPORT) */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shrink-0 shadow-xs">
                      <UserCheck className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[9.5px] font-mono font-extrabold uppercase border border-white/30 tracking-wider">
                        ANSA Lab Guest Portal
                      </span>
                      <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1 text-white">
                        Form Kehadiran Tamu Lab
                      </h2>
                      <p className="text-[11px] text-emerald-50 font-medium mt-0.5">
                        Silakan isi data kunjungan Anda.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmitCheckIn} className="p-5 sm:p-6 space-y-4">
                  {/* WAKTU & TANGGAL KUNJUNGAN */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">Waktu Kunjungan</span>
                        <span className="text-xs font-black text-slate-900 font-mono truncate block mt-0.5">{currentFormTime || 'Memuat waktu...'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Tamu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Contoh: Ir. Budi Santoso"
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Asal Instansi / Perusahaan */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Asal Instansi / Perusahaan / PT <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={institution}
                        onChange={e => setInstitution(e.target.value)}
                        placeholder="Contoh: PT. Wijaya Karya (Persero) Tbk"
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* WhatsApp & Email */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                        Nomor HP / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                        Alamat Email <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="budi@perusahaan.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* JUMLAH TAMU / ROMBONGAN */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Jumlah Tamu / Rombongan <span className="text-red-500">*</span></span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {guestCount} Orang
                      </span>
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl p-1.5">
                      <button
                        type="button"
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-800 font-black text-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 cursor-pointer shadow-2xs shrink-0 select-none"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center font-mono font-black text-slate-900 text-sm flex items-center justify-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>{guestCount} Orang</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGuestCount(guestCount + 1)}
                        className="w-10 h-10 rounded-xl bg-emerald-600 border border-emerald-700 text-white font-black text-lg flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer shadow-2xs shrink-0 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Keperluan / Tujuan Kunjungan (CUSTOM DROPDOWN) */}
                  <div className="relative">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Keperluan / Tujuan Kunjungan <span className="text-red-500">*</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsPurposeDropdownOpen(!isPurposeDropdownOpen);
                        setIsHostDropdownOpen(false);
                      }}
                      className={`w-full bg-slate-50 border ${
                        isPurposeDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white' : 'border-slate-300 hover:border-slate-400'
                      } rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs flex items-center justify-between transition cursor-pointer text-left`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {purpose ? (
                          React.createElement(getPurposeIcon(purpose), { className: 'w-4 h-4 text-emerald-600 shrink-0' })
                        ) : (
                          <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={`truncate ${purpose ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                          {purpose || '-- Pilih Keperluan / Tujuan Kunjungan --'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isPurposeDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                    </button>

                    {isPurposeDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-scale-in max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                        {GUEST_PURPOSE_OPTIONS.map((opt, idx) => {
                          const IconComp = getPurposeIcon(opt);
                          const isSelected = purpose === opt;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setPurpose(opt);
                                setIsPurposeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-950 font-black border border-emerald-200'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                                <span className="truncate">{opt}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {purpose === 'Lainnya' && (
                      <input
                        type="text"
                        required
                        value={customPurpose}
                        onChange={e => setCustomPurpose(e.target.value)}
                        placeholder="Tuliskan keperluan Anda..."
                        className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                      />
                    )}
                  </div>

                  {/* Personil / Staf Lab yang Dituju (CUSTOM DROPDOWN) */}
                  <div className="relative">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Personil / Staf Lab yang Dituju <span className="text-red-500">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHostDropdownOpen(!isHostDropdownOpen);
                        setIsPurposeDropdownOpen(false);
                      }}
                      className={`w-full bg-slate-50 border ${
                        isHostDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-white' : 'border-slate-300 hover:border-slate-400'
                      } rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs flex items-center justify-between transition cursor-pointer text-left`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <UserCheck className={`w-4 h-4 shrink-0 ${hostName ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className={`truncate ${hostName ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                          {hostName || '-- Pilih Staf / Personil Lab --'}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isHostDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                    </button>

                    {isHostDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-scale-in max-h-64 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                        {getDynamicLabHosts().map((host, idx) => {
                          const badge = getHostBadge(host);
                          const isSelected = hostName === host;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setHostName(host);
                                setIsHostDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-950 font-black border border-emerald-200'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-extrabold border shrink-0 ${badge.color}`}>
                                  {badge.label}
                                </span>
                                <span className="truncate">{host}</span>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {hostName === 'Lainnya / Tidak Tahu' && (
                      <input
                        type="text"
                        value={customHost}
                        onChange={e => setCustomHost(e.target.value)}
                        placeholder="Tulis nama staf atau jabatan..."
                        className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                      />
                    )}
                  </div>

                  {/* TANDA TANGAN DIGITAL */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Tanda Tangan Digital Tamu <span className="text-red-500">*</span></span>
                      <span className="text-[10.5px] text-slate-500 font-normal">Wajib diisi</span>
                    </label>
                    <SignatureCanvas
                      onSaveSignature={url => setSignatureUrl(url)}
                      height={150}
                    />
                  </div>

                  {/* Catatan Kunjungan */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      Catatan Tambahan <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Contoh: Membawa 3 box contoh tanah bor1..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm uppercase tracking-wider shadow-lg transition active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Menyimpan Registrasi...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Simpan &amp; Check-In Tamu</span>
                      </>
                    )}
                  </button>

                  {/* PERNYATAAN KERAHASIAAN & PERLINDUNGAN DATA PRIBADI */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-1 text-left">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Jaminan Perlindungan Data Pribadi</span>
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-slate-600 font-medium">
                      Seluruh data pribadi Anda dijamin kerahasiaannya dan dilindungi sesuai peraturan perundang-undangan (UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi). Pihak laboratorium <strong>hanya menggunakan data ini khusus untuk kepentingan verifikasi identitas, keamanan internal, dan administrasi kunjungan laboratorium</strong> saja.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: REKAPITULASI LOG TAMU & ADMIN DASHBOARD                   */}
        {/* ================================================================= */}
        {mode === 'admin' && (
          <div className="space-y-6">
            {!isAdminUnlocked ? (
              /* PIN LOCK SCREEN */
              <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7 text-slate-700" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">Akses Log Tamu Dilindungi</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Masukkan PIN Admin Staf Lab untuk melihat daftar tamu dan mengeksport data.
                  </p>
                </div>

                <form onSubmit={handleUnlockAdmin} className="space-y-4">
                  <div>
                    <input
                      type="password"
                      maxLength={6}
                      value={adminPin}
                      onChange={e => setAdminPin(e.target.value)}
                      placeholder="Masukkan PIN Admin (229308)"
                      className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-center text-lg font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    {pinError && <p className="text-xs text-red-600 font-bold mt-1.5">{pinError}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Buka Akses Rekap Admin</span>
                  </button>
                </form>
              </div>
            ) : (
              /* UNLOCKED ADMIN LOG */
              <div className="space-y-6">
                {/* SUMMARY STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Registrasi</span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block">{entries.length} Rombongan</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Total transaksi masuk</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                      <UserCheck className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between border-l-4 border-l-emerald-500">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tamu Aktif (Di Lab)</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">{checkedInPeopleCount} Orang</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">{checkedInCount} Rombongan sedang berkunjung</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Selesai Kunjungan</span>
                      <span className="text-2xl font-black text-slate-700 mt-1 block">{totalPeopleCount - checkedInPeopleCount} Orang</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{entries.length - checkedInCount} Rombongan telah checkout</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                      <LogOut className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Headcount</span>
                      <span className="text-2xl font-black text-teal-700 mt-1 block">{totalPeopleCount} Orang</span>
                      <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">Akumulasi seluruh personil tamu</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50 text-teal-600">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* FILTER BAR & ACTION BUTTONS */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari nama tamu, instansi, host..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="ALL">Semua Status</option>
                      <option value="Checked In">Masih di Lab (Checked In)</option>
                      <option value="Checked Out">Sudah Pulang (Checked Out)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchCloudEntries(true)}
                      disabled={isCloudLoading}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      title="Sinkronisasi & Ambil Data Tamu Terbaru dari Cloud Redis"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCloudLoading ? 'animate-spin' : ''}`} />
                      <span>{isCloudLoading ? 'Sinkron...' : 'Refresh Cloud'}</span>
                    </button>

                    <button
                      onClick={handleExportExcel}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                      title="Unduh Rekap Laporan Format Excel (.xls)"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export Excel</span>
                    </button>

                    <button
                      onClick={handleExportPDF}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                      title="Cetak & Simpan Laporan Format PDF"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Export PDF</span>
                    </button>

                    <button
                      onClick={() => setIsAdminUnlocked(false)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                      title="Kunci Akses Admin"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* LOG ENTRIES TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                          <th className="px-4 py-3">Waktu Check In</th>
                          <th className="px-4 py-3">Nama Tamu &amp; Instansi</th>
                          <th className="px-4 py-3">Kontak WhatsApp</th>
                          <th className="px-4 py-3">Host / Personil Dituju</th>
                          <th className="px-4 py-3">Keperluan Kunjungan</th>
                          <th className="px-4 py-3">Tanda Tangan</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                        {filteredEntries.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-semibold">
                              Belum ada data kunjungan tamu yang sesuai pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredEntries.map(entry => (
                            <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3 font-mono text-[11px]">
                                <span className="font-bold text-slate-900 block">{entry.checkInTime}</span>
                                <span className="text-[10px] text-slate-400">{entry.id}</span>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-slate-900">{entry.fullName}</span>
                                  <span className="text-[9.5px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                    {entry.guestCount || 1} Orang
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3" />
                                  {entry.institution}
                                </span>
                              </td>

                              <td className="px-4 py-3 font-mono">
                                <span className="font-bold text-slate-800">{entry.phone}</span>
                                {entry.email && <span className="text-[10.5px] text-slate-400 block">{entry.email}</span>}
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {entry.hostName}
                              </td>

                              <td className="px-4 py-3">
                                <span className="font-bold text-slate-900 block">{entry.purpose}</span>
                                {entry.notes && <span className="text-[10.5px] text-slate-500 italic">"{entry.notes}"</span>}
                              </td>

                              <td className="px-4 py-3">
                                <button
                                  onClick={() => setSelectedEntryModal(entry)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-bold border border-slate-200 flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat TTD</span>
                                </button>
                              </td>

                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase border flex items-center gap-1 w-max ${
                                  entry.status === 'Checked In'
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${entry.status === 'Checked In' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                  <span>{entry.status}</span>
                                </span>
                                {entry.checkOutTime && (
                                  <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">Out: {entry.checkOutTime}</span>
                                )}
                              </td>

                              <td className="px-4 py-3 text-right">
                                {entry.status === 'Checked In' && (
                                  <button
                                    onClick={() => handleCheckOutGuest(entry.id)}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-extrabold transition cursor-pointer"
                                  >
                                    Check Out
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: PRINTABLE QR CODE POSTER GENERATOR                       */}
        {/* ================================================================= */}
        {mode === 'poster' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 space-y-6 text-center print:shadow-none print:border-none print:p-0">
              {/* PRINTABLE POSTER CONTENT */}
              <div className="border-4 border-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="flex items-center justify-center gap-3 border-b-2 border-slate-900 pb-4">
                  <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-none">
                      BUKU TAMU DIGITAL
                    </h2>
                    <p className="text-xs text-slate-600 font-extrabold tracking-wide uppercase mt-1">
                      PT. Terraforma Geoteknik Indonesia — ANSA Lab
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-mono font-black text-xs border border-amber-300 uppercase">
                    SCAN UNTUK FORM KEHADIRAN
                  </span>
                  <p className="text-sm font-bold text-slate-700">
                    Bapak / Ibu Tamu Yth, mohon melakukan scan QR Code di bawah menggunakan Kamera Smartphone / WhatsApp untuk mengisi Form Kunjungan.
                  </p>
                </div>

                {/* REAL QR CODE DISPLAY */}
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md inline-block mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentCheckInUrl)}`}
                    alt="QR Code Buku Tamu Online ANSA Lab"
                    className="w-56 h-56 object-contain mx-auto"
                  />
                  <span className="text-[10px] font-mono text-slate-500 font-bold block mt-2">
                    ANSA-LAB-GUEST-QR-PORTAL
                  </span>
                </div>

                <div className="bg-slate-100 rounded-xl p-3 text-xs font-mono text-slate-600 font-bold break-all border border-slate-200">
                  {currentCheckInUrl}
                </div>

                <div className="pt-2 text-slate-500 text-xs font-semibold">
                  Laboratorium Mekanika Tanah &amp; Batuan ISO 17025 Compliant
                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex flex-wrap gap-3 justify-center print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Poster QR</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentCheckInUrl);
                    alert('Link Form Buku Tamu telah disalin ke clipboard!');
                  }}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Salin Link Form</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* SIGNATURE PREVIEW MODAL                                           */}
      {/* ================================================================= */}
      {selectedEntryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Detail &amp; Tanda Tangan Tamu</h3>
              <button
                onClick={() => setSelectedEntryModal(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">Nama Tamu</span>
                <span className="font-bold text-slate-900 text-sm">{selectedEntryModal.fullName}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">Instansi / Perusahaan</span>
                <span className="font-bold text-slate-900">{selectedEntryModal.institution}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">No WhatsApp</span>
                <span className="font-bold text-slate-900 font-mono">{selectedEntryModal.phone}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 text-center">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Tanda Tangan Digital</span>
              <img
                src={selectedEntryModal.signatureUrl}
                alt="Tanda Tangan Digital Tamu"
                className="max-h-36 object-contain mx-auto border border-slate-200 rounded-xl bg-white p-2"
              />
            </div>

            <button
              onClick={() => setSelectedEntryModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
