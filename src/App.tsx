/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Complaint, UserRole } from './types.js';
import { Header } from './components/Header.js';
import { PelaporView } from './components/PelaporView.js';
import { AdminView } from './components/AdminView.js';
import { BidangView } from './components/BidangView.js';
import { KetuaView } from './components/KetuaView.js';
import { EmailVerificationModal } from './components/EmailVerificationModal.js';
import { ShieldCheck, LogIn, UserPlus, Info, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';

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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('pelapor');

  // Verification overlay
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [sandboxOTP, setSandboxOTP] = useState<string | undefined>(undefined);
  const [authError, setAuthError] = useState('');

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
      await Promise.all([fetchComplaints(), fetchStatus()]);
      setLoading(false);
    };
    initialize();
  }, []);

  // Update simulator view whenever user logs in or registers successfully
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
        // Handle unverified user redirecting to OTP insertion block
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
      if (!response.ok) {
        throw new Error(result.error || 'Pendaftaran gagal.');
      }

      // Triggers OTP insert modal with sandbox code bypass
      setVerifyEmail(regEmail);
      setSandboxOTP(result.sandboxOTP);
    } catch (err: any) {
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

  const clearAuthForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegRole('pelapor');
    setAuthError('');
  };

  const handleLogout = () => {
    setUser(null);
    setSimulatedRole('pelapor');
    clearAuthForms();
  };

  // Fallbacks for simulated actors when testing without being logged in
  const getSimulatedUser = (): User => {
    if (user && user.role === simulatedRole) {
      return user;
    }
    // Fallback static testing user roles
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
      
      {/* Top Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        simulatedRole={simulatedRole}
        onSelectSimulatedRole={setSimulatedRole}
        hasGAS={hasGAS}
      />

      {/* Primary Container App */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            <span className="text-xs font-semibold">Memuat data Kawal Madrasah...</span>
          </div>
        ) : (
          <>
            {/* View Switching Router */}
            <div className="animate-fade-in">
              {simulatedRole === 'pelapor' && (
                <PelaporView
                  user={user}
                  complaints={complaints}
                  onRefreshComplaints={fetchComplaints}
                />
              )}

              {simulatedRole === 'admin' && (
                <AdminView
                  user={getSimulatedUser()}
                  complaints={complaints}
                  onRefreshComplaints={fetchComplaints}
                  gasUrl={gasUrl}
                  onUpdateGasUrl={updateGasUrl}
                />
              )}

              {simulatedRole === 'bidang' && (
                <BidangView
                  user={getSimulatedUser()}
                  complaints={complaints}
                  onRefreshComplaints={fetchComplaints}
                />
              )}

              {simulatedRole === 'ketuatim' && (
                <KetuaView
                  user={getSimulatedUser()}
                  complaints={complaints}
                  onRefreshComplaints={fetchComplaints}
                />
              )}
            </div>

            {/* Account Panel / Join Block (Only shown when not logged in to guide them for Registrasi/Verifikasi) */}
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
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthCard(true);
                      setAuthError('');
                    }}
                    className="px-4 py-2 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Masuk Akun
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthCard(true);
                      setAuthError('');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Mulai Registrasi
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Authentication & Verification Sandbox Card */}
            {showAuthCard && (
              <div className="bg-white border-2 border-slate-250 rounded-2xl p-6 shadow-sm max-w-md mx-auto relative animate-fade-in" id="auth-panel">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                    {authMode === 'login' ? <LogIn className="w-4.5 h-4.5 text-emerald-600" /> : <UserPlus className="w-4.5 h-4.5 text-emerald-600" />}
                    {authMode === 'login' ? 'Masuk ke Akun' : 'Registrasi Akun Baru'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAuthCard(false);
                      clearAuthForms();
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Tutup form
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs text-center mb-4">
                    ⚠️ {authError}
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
                      <label className="block text-slate-500 font-bold mb-1.5">Sandi Masuk (Gunakan Sandi Keamanan Akun)</label>
                      <input
                        type="password"
                        placeholder="Sandi keamanan Anda..."
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-200">
                      <b>💡 Akun Bawaan (Default):</b>
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                        <li><b>Admin:</b> Email: <code className="bg-white px-1 py-0.5 rounded text-rose-600">admin@madrasah.sch.id</code></li>
                        <li><b>Ketua Tim:</b> Email: <code className="bg-white px-1 py-0.5 rounded text-rose-600">ketua@madrasah.sch.id</code></li>
                        <li><b>Waka Bidang:</b> Email: <code className="bg-white px-1 py-0.5 rounded text-rose-600">kesiswaan@madrasah.sch.id</code></li>
                        <li><b>Siswa Budi:</b> Email: <code className="bg-white px-1 py-0.5 rounded text-rose-600">budi@siswa.sch.id</code></li>
                        <li><i>Gunakan password default: <code className="bg-white px-1 py-0.5 rounded text-emerald-700 font-bold">man2plg123</code> untuk otentikasi.</i></li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Masuk Akun
                    </button>

                    <div className="text-center pt-2">
                      <span className="text-slate-400">Belum punya akun? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthError('');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      >
                        Daftar disini
                      </button>
                    </div>
                  </form>
                ) : (
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
                        <select
                          value={regRole}
                          onChange={(e: any) => setRegRole(e.target.value)}
                          className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-xs font-semibold focus:outline-none"
                        >
                          <option value="pelapor">Pelapor (Siswa / Wali)</option>
                          <option value="admin">Admin Instansi</option>
                          <option value="bidang">Staf Bidang (Humas/Sarpras)</option>
                          <option value="ketuatim">Ketua Tim Penilai</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Daftar & Minta Kode Verifikasi Email
                    </button>

                    <div className="text-center pt-2">
                      <span className="text-slate-400">Sudah punya akun? </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError('');
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                      >
                        Masuk disini
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* OTP email verification modal popup (SOP Verifikasi) */}
      {verifyEmail && (
        <EmailVerificationModal
          email={verifyEmail}
          sandboxOTP={sandboxOTP}
          onSuccess={handleVerificationSuccess}
          onClose={() => setVerifyEmail(null)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-16 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p className="font-semibold text-slate-650">© 2026 Kawal Madrasah - Layanan Aspirasi dan Satuan Pengaduan Terpadu</p>
          <p className="text-[10px]">Menegakkan Integritas, Ketertiban, serta Keamanan Civitas Akademika Madrasah Aliyah & Tsanawiyah</p>
        </div>
      </footer>

    </div>
  );
}
