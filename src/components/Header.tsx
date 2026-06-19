/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, LogOut, User, Users, HelpCircle, GraduationCap, LayoutList, CheckCircle } from 'lucide-react';
import { User as UserType, UserRole, KMNotification } from '../types.js';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  // Role switcher / simulation props
  simulatedRole: UserRole;
  onSelectSimulatedRole: (role: UserRole) => void;
  hasGAS: boolean;
  onChangePasswordClick: () => void;
  notifications: KMNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  simulatedRole,
  onSelectSimulatedRole,
  hasGAS,
  onChangePasswordClick,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}) => {
  const [showSandbox, setShowSandbox] = React.useState(() => {
    return localStorage.getItem('km_sandbox_show') !== 'false';
  });
  const [clickCount, setClickCount] = React.useState(0);
  const [showNotification, setShowNotification] = React.useState<string | null>(null);
  const [showBellDropdown, setShowBellDropdown] = React.useState(false);

  // Filters notifications relative to current simulated profile context
  const relevantNotifications = React.useMemo(() => {
    return (notifications || []).filter(n => {
      if (!user) {
        // Under mode tamu, filter by simulated role
        return n.targetRole === simulatedRole;
      }
      
      // If user is actually logged in, map to credentials
      if (user.role === 'admin' && n.targetRole === 'admin') return true;
      if (user.role === 'ketuatim' && n.targetRole === 'ketuatim') return true;
      if (user.role === 'bidang' && n.targetRole === 'bidang') {
        if (n.targetDept) {
          // Compare matching departments (e.g., Sarpras or Humas)
          const matchesDept = user.name.toLowerCase().includes(n.targetDept.toLowerCase());
          return matchesDept;
        }
        return true;
      }
      if (user.role === 'pelapor' && n.userId === user.id) return true;
      return false;
    });
  }, [notifications, user, simulatedRole]);

  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  React.useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 3) {
      const current = localStorage.getItem('km_sandbox_show') !== 'false';
      localStorage.setItem('km_sandbox_show', !current ? 'true' : 'false');
      setShowSandbox(!current);
      setClickCount(0);
      setShowNotification(!current ? "Simulator diaktifkan!" : "Simulator dinonaktifkan!");
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    onSelectSimulatedRole(role);
    setShowNotification(`Mode: ${role.toUpperCase()}`);
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'pelapor', label: 'Pelapor (Siswa / Wali / Publik)', desc: 'Submit laporan' },
    { role: 'admin', label: 'Admin Madrasah', desc: 'SOP 2 & 3: Klasifikasi' },
    { role: 'bidang', label: 'Bidang Terkait (Waka)', desc: 'SOP 4: Investigasi' },
    { role: 'ketuatim', label: 'Ketua Tim (BK/Kepsek)', desc: 'SOP 5: Verifikasi' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs" id="app-navigation-header">
      
      {/* Absolute Notification Toast (Replaces clunky browser alerts) */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-slate-900/95 border border-slate-800 text-white rounded-xl shadow-xl px-4 py-3 text-xs flex items-center gap-2.5 animate-bounce z-50 backdrop-blur-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
          <span className="font-bold tracking-wide">{showNotification}</span>
        </div>
      )}

      {/* Top Simulator Banner - Only visible for sandbox evaluations/testing */}
      {showSandbox && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-800 select-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-emerald-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded animate-pulse">
              Sandbox Simulator Mode ⚡
            </span>
            <span className="text-slate-350 font-medium">Beralih peran secara instan untuk menguji SOP Alur Kerja secara langsung:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 justify-center">
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => handleRoleSwitch(r.role)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${simulatedRole === r.role ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title={r.desc}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => {
                localStorage.setItem('km_sandbox_show', 'false');
                setShowSandbox(false);
                setShowNotification("Banner disembunyikan. Klik logo MAN 3x untuk menampilkannya kembali!");
              }}
              className="ml-2 text-rose-400 hover:text-rose-300 hover:underline text-[10px] font-bold cursor-pointer transition-all border border-rose-950 px-1.5 py-0.5 rounded bg-rose-950/20"
              title="Sembunyikan banner simulator untuk pengunjung umum di domain produksi"
            >
              Hapus Banner
            </button>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogoClick}
            className="p-1 px-1.5 bg-emerald-50 border border-emerald-100 rounded-xl shadow-xs flex items-center justify-center cursor-pointer hover:bg-emerald-100 transition-all active:scale-95"
            title="Sembunyikan/Tampilkan Sandbox (Klik 3x)"
          >
            <img 
              src="/api/logo.svg" 
              alt="Logo MAN 2 Palembang" 
              className="w-8 h-8 md:w-9 md:h-9 object-contain"
              referrerPolicy="no-referrer"
            />
          </button>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm md:text-base leading-none flex items-center gap-1.5">
              EDUMAS MAN 2 PALEMBANG
              <span className={`w-2 h-2 rounded-full ${hasGAS ? 'bg-emerald-500' : 'bg-slate-300'}`} title={hasGAS ? 'Google Sheets Terkoneksi' : 'Menggunakan Local DB File'} />
            </h1>
            <p className="text-[9px] md:text-[10px] text-slate-400 font-semibold mt-0.5">Sistem Layanan Manajemen Pengaduan Madrasah Online</p>
          </div>
        </div>

        {/* User context or Join action */}
        <div className="flex items-center gap-3">
          {hasGAS ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Google Sheets Terintegrasi
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Offline Local JSON Store
            </span>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200/60 text-xs">
              {/* Notification Bell Dropdown */}
              <div className="relative z-40" id="notification-bell-dropdown-wrapper">
                <button
                  onClick={() => setShowBellDropdown(!showBellDropdown)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                    showBellDropdown
                      ? 'bg-slate-100 border-slate-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                  title="Pusat Notifikasi Real-Time"
                >
                  <span className="sr-only">Notifikasi</span>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs animate-ping">
                      {unreadCount}
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showBellDropdown && (
                  <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-slate-700 font-sans animate-fade-in text-xs max-h-[460px] flex flex-col">
                    {/* Header popup */}
                    <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        🔔 Notifikasi ({unreadCount} baru)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            onMarkAllNotificationsRead();
                            setShowNotification("Semua notifikasi ditandai dibaca!");
                          }}
                          className="text-[9px] text-emerald-400 hover:text-emerald-300 font-extrabold hover:underline cursor-pointer"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>

                    {/* Body list */}
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[350px]">
                      {relevantNotifications.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-medium">
                          <p className="text-sm">🫙 Kotak Masuk Kosong</p>
                          <p className="text-[10px] text-slate-300 mt-1">Belum ada pemberitahuan sistem saat ini.</p>
                        </div>
                      ) : (
                        relevantNotifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 transition-colors text-left hover:bg-slate-50 relative ${
                              !n.read ? 'bg-emerald-50/30 border-l-2 border-emerald-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`font-bold block text-slate-800 leading-tight ${!n.read ? 'text-slate-950 font-extrabold' : 'text-slate-600 font-semibold'}`}>
                                {n.title}
                              </span>
                              {!n.read && (
                                <button
                                  onClick={() => onMarkNotificationRead(n.id)}
                                  className="text-[9px] text-emerald-700 hover:text-emerald-950 font-extrabold cursor-pointer border border-emerald-100 bg-emerald-50 px-1 py-0.5 rounded leading-none shrink-0"
                                >
                                  Dibaca
                                </button>
                              )}
                            </div>
                            <p className="text-slate-500 text-[11px] mt-1 pr-1 leading-relaxed">
                              {n.message}
                            </p>

                            {/* Delivery receipt status indicators */}
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                              <span className="text-[9px] text-slate-400 font-mono">
                                🕒 {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded-sm leading-tight">
                                📧 Email Tergabung
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded-sm leading-tight">
                                💬 WA Terkirim
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer informational */}
                    <div className="bg-slate-50 p-2 text-center border-t border-slate-100 text-[9px] text-slate-400 font-semibold select-none leading-none">
                      Tampilan khusus untuk {simulatedRole.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right hidden sm:block pl-1">
                <span className="font-bold text-slate-800 block text-[11px] leading-tight select-all">{user.name}</span>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono leading-none">{user.role}</span>
                  <span className="text-slate-300 leading-none">•</span>
                  <button
                    onClick={onChangePasswordClick}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold hover:underline cursor-pointer leading-none"
                    title="Ubah kata sandi akun"
                  >
                    Ganti Sandi
                  </button>
                </div>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 select-none shrink-0 border-l border-slate-200">
                <User className="w-4 h-4" />
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-medium">
              Mode Tamu (Daftar / Masuk Akun via Form di bawah)
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
