/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { User, Complaint, UserRole, KMNotification } from './types.js';
import { Header } from './components/Header.js';
import { PelaporView } from './components/PelaporView.js';
import { AdminView } from './components/AdminView.js';
import { BidangView } from './components/BidangView.js';
import { KetuaView } from './components/KetuaView.js';
import { EmailVerificationModal } from './components/EmailVerificationModal.js';
import { ShieldCheck, LogIn, UserPlus, Info, CheckCircle2, ChevronRight, GraduationCap, Lock, ShieldAlert, Key } from 'lucide-react';

export default function App() {
  // Session & UI States
  const [user, setUser] = useState<User | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<UserRole>('pelapor');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [gasUrl, setGasUrl] = useState('');
  const [hasGAS, setHasGAS] = useState(false);
  const [loading, setLoading] = useState(true);

  // Authentication Switcher States
  const [showAuthCard, setShowAuthCard] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Auth Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedBidangEmail, setSelectedBidangEmail] = useState('kesiswaan@madrasah.sch.id');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('pelapor'); // Default sudah pelapor

  // Forgot password form fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  // Change Password state (for logged-in profiles)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState<KMNotification[]>([]);

  // Verification overlay
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [sandboxOTP, setSandboxOTP] = useState<string | undefined>(undefined);
  const [authError, setAuthError] = useState('');

  // Debugging State Changes
  useEffect(() => {
    if (verifyEmail) {
      console.log("👁️ [DEBUG] Modal OTP seharusnya TERBUKA untuk:", verifyEmail);
      console.log("👁️ [DEBUG] Sandbox OTP:", sandboxOTP);
    } else {
      console.log("👁️ [DEBUG] Modal OTP TUTUP (verifyEmail null)");
    }
  }, [verifyEmail, sandboxOTP]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Fetch complaints and GAS configurations
  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints');
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Error loading complaints:', err);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const data = await response.json();
        setGasUrl(data.gasUrl);
        setHasGAS(data.hasGAS);
      }
    } catch (err) {
      console.error('Error loading status:', err);
    }
  };

  const updateGasUrl = async (newUrl: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/gas-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      });
      if (response.ok) {
        const data = await response.json();
        setGasUrl(data.gasUrl);
        setHasGAS(!!data.gasUrl);
        return true;
      }
    } catch (err) {
      console.error('Error updating GAS URL:', err);
    }
    return false;
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchComplaints(), fetchStatus(), fetchNotifications()]);
      setLoading(false);
    };
    initialize();

    const interval = setInterval(() => {
      fetchComplaints();
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      setSimulatedRole(user.role);
    }
  }, [user]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const result = await response.json();
      if (!response.ok) {
        if (result.unverified && result.email) {
          setVerifyEmail(result.email);
          setAuthError('');
          return;
        }
        throw new Error(result.error || 'Autentikasi gagal.');
      }

      setUser(result.user);
      setShowAuthCard(false);
      clearAuthForms();
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    console.log("🚀 [DEBUG] Mencoba registrasi dengan email:", regEmail);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole
        })
      });

      const result = await response.json();
      console.log("📡 [DEBUG] Response dari server:", result);

      if (!response.ok) {
        throw new Error(result.error || 'Pendaftaran gagal.');
      }

      console.log("✅ [DEBUG] Registrasi berhasil! Menampilkan modal OTP...");
      
      // PENTING: Set state modal DAN tutup form registrasi agar tidak bentrok
      setVerifyEmail(regEmail);
      setSandboxOTP(result.sandboxOTP);
      setShowAuthCard(false); 
      
    } catch (err: any) {
      console.error("❌ [DEBUG] Error registrasi:", err);
      setAuthError(err.message);
    }
  };

  const handleVerificationSuccess = (verifiedUser: User) => {
    setUser(verifiedUser);
    setVerifyEmail(null);
    setSandboxOTP(undefined);
    setShowAuthCard(false);
    clearAuthForms();
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotStep(2);
        if (data.sandboxOTP) {
          setSandboxOTP(data.sandboxOTP);
        }
        setForgotSuccessMessage('Kode OTP pemulihan kata sandi Anda berhasil disalurkan ke kotak masuk email Anda!');
      } else {
        setAuthError(data.error || 'Email tidak terdaftar atau gagal mengirim OTP.');
      }
    } catch (err) {
      setAuthError('Gagal terkoneksi ke server.');
    }
  };

  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setForgotSuccessMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: forgotOTP, newPassword: forgotNewPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setForgotStep(1);
        setAuthMode('login');
        setForgotSuccessMessage('Sandi Baru berhasil disetel! Silakan masuk kembali memakai kata sandi baru Anda.');
        setForgotOTP('');
        setForgotNewPassword('');
        setForgotEmail('');
      } else {
        setAuthError(data.error || 'Gagal mengubah kata sandi.');
      }
    } catch (err) {
      setAuthError('Gagal melakukan setel ulang kata sandi.');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError('Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }

    if (!user) return;

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, oldPassword: currentPassword, newPassword: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setChangePasswordSuccess('Sandi Anda sukses diperbarui! Gunakan sandi baru Anda untuk autentikasi selanjutnya.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setChangePasswordSuccess('');
        }, 3000);
      } else {
        setChangePasswordError(data.error || 'Gagal merubah kata sandi.');
      }
    } catch (err) {
      setChangePasswordError('Terjadi kegagalan transmisi.');
    }
  };

  const clearAuthForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegRole('pelapor');
    setForgotEmail('');
    setForgotOTP('');
    setForgotNewPassword('');
    setForgotStep(1);
    setForgotSuccessMessage('');
    setAuthError('');
  };

  const handleInstantLogin = async (email: string) => {
    setAuthError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'man2plg123' })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Autentikasi gagal.');
      }

      setUser(result.user);
      setShowAuthCard(false);
      clearAuthForms();
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLockedView = (targetRole: UserRole) => {
    const roleDetails = {
      admin: {
        label: 'Admin Madrasah',
        email: 'admin@madrasah.sch.id',
        desc: 'SOP Hub Klasifikasi (Menilai kategori, menyusun disposisi awal, sanksi/bimbingan)'
      },
      bidang: {
        label: 'Bidang Terkait (Waka & Kaur TU)',
        email: 'kesiswaan@madrasah.sch.id',
        desc: 'Investigasi Lapangan (Melakukan wawancara, mencatat bukti, menyusun tanggapan dan draf laporan akhir)'
      },
      ketuatim: {
        label: 'Ketua Tim (Komite BK/Kepsek)',
        email: 'ketua@madrasah.sch.id',
        desc: 'Verifikasi & Rekomendasi Akhir (Menerbitkan keputusan final sanksi/tindakan, penutupan status kasus)'
      },
      pelapor: {
        label: 'Pelapor',
        email: '',
        desc: ''
      }
    };

    const bidangOptions = [
      { name: 'Ustadzah Halimah (Waka Kesiswaan)', email: 'kesiswaan@madrasah.sch.id' },
      { name: 'Ustadz Mansur (Waka Kurikulum)', email: 'kurikulum@madrasah.sch.id' },
      { name: 'H. Sobirin, M.Si (Waka Sarana Prasarana)', email: 'sarpras@madrasah.sch.id' },
      { name: 'Dra. Hj. Nurjanah (Waka Humas)', email: 'humas@madrasah.sch.id' },
      { name: 'Pak Satrio (Waka Keamanan)', email: 'keamanan@madrasah.sch.id' },
      { name: 'Hj. Aminah, S.Sos (Kaur TU)', email: 'tu@madrasah.sch.id' }
    ];

    const details = roleDetails[targetRole] || roleDetails.admin;
    const activeEmail = targetRole === 'bidang' ? selectedBidangEmail : details.email;

    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-2xl mx-auto shadow-xl text-center space-y-6 md:p-12 animate-fade-in border-t-amber-500 border-t-4">
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 border border-amber-200">
            Akses Terkunci • Diperlukan Autentikasi
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Masuk Ke Dashboard {details.label}
          </h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-md mx-auto">
            Halaman ini dilindungi oleh otentikasi digital EDUMAS MAN 2 Palembang guna menjaga kerahasiaan identitas saksi/pelapor dan detail investigasi murni.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left space-y-3.5 max-w-md mx-auto">
          {targetRole === 'bidang' && (
            <div className="mb-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Akun Bidang (Waka) & Kaur TU:</label>
              <select
                value={selectedBidangEmail}
                onChange={(e) => setSelectedBidangEmail(e.target.value)}
                className="w-full border border-slate-200 bg-white p-2 text-xs font-bold rounded-lg text-indigo-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {bidangOptions.map(opt => (
                  <option key={opt.email} value={opt.email}>{opt.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Wewenang {details.label}:</span>
              <p className="text-slate-500 leading-normal font-medium">{details.desc}</p>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-3 flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between flex-wrap gap-2">
              <span className="text-slate-400">ID Email Resmi:</span>
              <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-800">{activeEmail}</code>
            </div>
            <div className="flex justify-between flex-wrap gap-2">
              <span className="text-slate-400">Sandi Bawaan:</span>
              <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-emerald-700">man2plg123</code>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
          <button
            onClick={() => handleInstantLogin(activeEmail)}
            className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/15 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            Autentikasi Instan
          </button>
          <button
            onClick={() => {
              setLoginEmail(activeEmail);
              setLoginPassword('man2plg123');
              setAuthMode('login');
              setShowAuthCard(true);
              setAuthError('');
              setTimeout(() => {
                document.getElementById('auth-section-trigger')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="flex-1 px-5 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Formulir Masuk
          </button>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    setUser(null);
    setSimulatedRole('pelapor');
    clearAuthForms();
  };

  const getSimulatedUser = (): User => {
    if (user && user.role === simulatedRole) {
      return user;
    }
    const fallbackUsers: Record<UserRole, User> = {
      pelapor: { id: 'u-anon', email: '', name: 'Masyarakat', role: 'pelapor', isVerified: true, createdAt: '' },
      admin: { id: 'u-1', email: 'admin@madrasah.sch.id', name: 'Ustadz Ahmad Fauzi (Admin)', role: 'admin', isVerified: true, createdAt: '' },
      bidang: { id: 'u-3', email: 'kesiswaan@madrasah.sch.id', name: 'Ustadzah Halimah (Waka Kesiswaan)', role: 'bidang', isVerified: true, createdAt: '' },
      ketuatim: { id: 'u-2', email: 'ketua@madrasah.sch.id', name: 'H. Syarifuddin, M.Pd (Ketua Tim)', role: 'ketuatim', isVerified: true, createdAt: '' }
    };
    return fallbackUsers[simulatedRole];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white" id="main-application-frame">
      
      <Header
        user={user}
        onLogout={handleLogout}
        simulatedRole={simulatedRole}
        onSelectSimulatedRole={setSimulatedRole}
        hasGAS={hasGAS}
        onChangePasswordClick={() => setShowChangePasswordModal(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            <span className="text-xs font-semibold">Memuat data Kawal Madrasah...</span>
          </div>
        ) : (
          <>
            <div className="animate-fade-in">
              {simulatedRole === 'pelapor' && (
                <PelaporView user={user} complaints={complaints} onRefreshComplaints={fetchComplaints} />
              )}
              {simulatedRole === 'admin' && (
                user && user.role === 'admin' ? (
                  <AdminView user={user} complaints={complaints} onRefreshComplaints={fetchComplaints} gasUrl={gasUrl} onUpdateGasUrl={updateGasUrl} />
                ) : renderLockedView('admin')
              )}
              {simulatedRole === 'bidang' && (
                user && user.role === 'bidang' ? (
                  <BidangView user={user} complaints={complaints} onRefreshComplaints={fetchComplaints} />
                ) : renderLockedView('bidang')
              )}
              {simulatedRole === 'ketuatim' && (
                user && user.role === 'ketuatim' ? (
                  <KetuaView user={user} complaints={complaints} onRefreshComplaints={fetchComplaints} />
                ) : renderLockedView('ketuatim')
              )}
            </div>

            {!user && !showAuthCard && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mt-12">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">Mendaftar Akun Resmi?</h4>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Masyarakat, wali, siswa, maupun tenaga pengajar dipersilakan mendaftar secara online. Aktivasi akun melewati proses verifikasi OTP email sebagai standard keabsahan pelapor.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthCard(true); setAuthError(''); }}
                    className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Masuk Akun
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setShowAuthCard(true); setAuthError(''); }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Mulai Registrasi
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {showAuthCard && (
              <div className="bg-white border-2 border-slate-250 rounded-2xl p-6 shadow-sm max-w-md mx-auto relative animate-fade-in" id="auth-panel">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    {authMode === 'login' ? <LogIn className="w-4.5 h-4.5 text-emerald-600" /> : authMode === 'register' ? <UserPlus className="w-4.5 h-4.5 text-emerald-600" /> : <Key className="w-4.5 h-4.5 text-emerald-600" />}
                    {authMode === 'login' ? 'Masuk ke Akun' : authMode === 'register' ? 'Registrasi Akun Baru' : 'Atur Ulang Kata Sandi'}
                  </h3>
                  <button
                    onClick={() => { setShowAuthCard(false); clearAuthForms(); }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Tutup form
                  </button>
                </div>

                {forgotSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center mb-4 font-bold">
                    ✔️ {forgotSuccessMessage}
                  </div>
                )}

                {authMode === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Alamat Email</label>
                      <input
                        type="email"
                        placeholder="contoh: budi@siswa.sch.id / warga@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-slate-500 font-bold mb-0">Sandi Masuk</label>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('forgot'); setForgotStep(1); setForgotEmail(loginEmail); setAuthError(''); setForgotSuccessMessage(''); }}
                          className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
                        >
                          Lupa Sandi?
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="Sandi keamanan Anda..."
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer">
                      Masuk Akun
                    </button>
                    <div className="text-center pt-2">
                      <span className="text-slate-400">Belum punya akun? </span>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setAuthError(''); setForgotSuccessMessage(''); }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      >
                        Daftar disini
                      </button>
                    </div>
                  </form>
                ) : authMode === 'register' ? (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Nama Lengkap Anda</label>
                      <input
                        type="text"
                        placeholder="Contoh: Muhammad Akhyar"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Alamat Email Aktif</label>
                      <input
                        type="email"
                        placeholder="Gunakan email asli atau sandbox"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        required
                      />
                      <p className="text-[10px] text-slate-400 mt-1">OTP verifikasi pendaftaran akan di-distribusikan ke alamat email ini.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5">Sandi Baru</label>
                        <input
                          type="password"
                          placeholder="Buat sandi..."
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5">Peran / Otoritas Akun</label>
                        {/* Tampilan Role yang sudah di-fix (Statis & Rapi) */}
                        <div className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Pelapor (Siswa / Wali)
                        </div>
                        <input type="hidden" name="role" value="pelapor" />
                      </div>
                    </div>

                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer">
                      Daftar & Minta Kode Verifikasi Email
                    </button>

                    <div className="text-center pt-2">
                      <span className="text-slate-400">Sudah punya akun? </span>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setAuthError(''); }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      >
                        Masuk disini
                      </button>
                    </div>
                  </form>
                ) : (
                  forgotStep === 1 ? (
                    <form onSubmit={handleForgotRequest} className="space-y-4 text-xs font-semibold">
                      <p className="text-slate-500 mb-2 leading-relaxed">
                        Masukkan email Anda. Kami akan mendistribusikan kode 6 digit OTP pemulihan sandi secara otomatis.
                      </p>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5">Email Terdaftar</label>
                        <input
                          type="email"
                          placeholder="contoh: budi@siswa.sch.id / warga@gmail.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer">
                        Kirim Kode Pemulihan
                      </button>
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setAuthError(''); setForgotSuccessMessage(''); }}
                          className="text-emerald-750 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
                        >
                          Kembali Ke Halaman Login
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotResetSubmit} className="space-y-4 text-xs font-semibold">
                      <p className="text-slate-500 mb-2 leading-relaxed font-medium">
                        Masukkan kode OTP pelindung beserta Kata Sandi Baru Anda di bawah ini:
                      </p>
                      {sandboxOTP && (
                        <div className="p-3.5 bg-amber-50 border border-amber-250 rounded-2xl text-amber-800 text-xs text-left shadow-xs">
                          <p className="font-bold flex items-center gap-1 text-[11px] text-amber-900">⚡ Kode OTP Pemulihan (Sandbox):</p>
                          <p className="font-mono text-center text-lg font-black tracking-widest text-amber-950 my-1 select-all">{sandboxOTP}</p>
                          <p className="text-[10px] text-amber-600">Gunakan kode ini jika SMTP / Apps Script tidak diaktifkan.</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5 font-mono text-[10px]">6 DIGIT OTP VERIFIKASI PEMULIHAN</label>
                        <input
                          type="text"
                          placeholder="______"
                          value={forgotOTP}
                          onChange={(e) => setForgotOTP(e.target.value)}
                          maxLength={6}
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-center font-extrabold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5">Kata Sandi Baru</label>
                        <input
                          type="password"
                          placeholder="Minimal 6 karakter sandi baru..."
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer">
                        Perbarui Kata Sandi Akun
                      </button>
                      <div className="flex items-center justify-between text-center pt-2 font-bold text-[11px]">
                        <button
                          type="button"
                          onClick={() => { setForgotStep(1); setForgotSuccessMessage(''); setAuthError(''); }}
                          className="text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                        >
                          Minta Code Baru?
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode('login'); setForgotStep(1); setForgotSuccessMessage(''); setAuthError(''); }}
                          className="text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                        >
                          Masuk Portal
                        </button>
                      </div>
                    </form>
                  )
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* OTP email verification modal popup */}
      {verifyEmail && (
        <EmailVerificationModal
          email={verifyEmail}
          sandboxOTP={sandboxOTP}
          onSuccess={handleVerificationSuccess}
          onClose={() => {
            console.log("👁️ [DEBUG] Tombol Batal diklik, menutup modal");
            setVerifyEmail(null);
            setSandboxOTP(undefined);
            setShowAuthCard(false);
          }}
        />
      )}

      {/* Change Password Modal Dashboard popup */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="change-password-modal-container">
          <div className="bg-white border text-left border-slate-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-up" id="change-password-modal-body">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-xs tracking-wide flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                GANTI KATA SANDI AKUN
              </h3>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                }}
                className="text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4 text-xs font-medium">
              {changePasswordError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] text-center">
                  ⚠️ {changePasswordError}
                </div>
              )}
              {changePasswordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[11px] text-center font-bold">
                  ✔️ {changePasswordSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Kata Sandi Lama</label>
                <input
                  type="password"
                  placeholder="Masukkan sandi saat ini..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="Password baru (Min. 6 huruf)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="Ulangi password baru..."
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-lg text-center transition-colors cursor-pointer border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-center transition-colors cursor-pointer shadow-md"
                >
                  Perbarui Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-6 mt-16 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-650">© 2026 Kawal Madrasah - Layanan Aspirasi dan Satuan Pengaduan Terpadu</p>
          <p className="text-[10px]">Menegakkan Integritas, Ketertiban, serta Keamanan Civitas Akademika Madrasah Aliyah & Tsanawiyah</p>
        </div>
      </footer>
    </div>
  );
}