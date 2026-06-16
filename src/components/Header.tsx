/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, LogOut, User, Users, HelpCircle, GraduationCap, LayoutList, CheckCircle } from 'lucide-react';
import { User as UserType, UserRole } from '../types.js';

interface HeaderProps {
  user: UserType | null;
  onLogout: () => void;
  // Role switcher / simulation props
  simulatedRole: UserRole;
  onSelectSimulatedRole: (role: UserRole) => void;
  hasGAS: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  simulatedRole,
  onSelectSimulatedRole,
  hasGAS
}) => {
  const [isUnlocked, setIsUnlocked] = React.useState(() => {
    return sessionStorage.getItem('km_sandbox_unlocked') === 'true';
  });
  const [showSandbox, setShowSandbox] = React.useState(() => {
    return localStorage.getItem('km_sandbox_show') !== 'false';
  });
  const [clickCount, setClickCount] = React.useState(0);

  const handleLogoClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 3) {
      const current = localStorage.getItem('km_sandbox_show') !== 'false';
      localStorage.setItem('km_sandbox_show', !current ? 'true' : 'false');
      setShowSandbox(!current);
      setClickCount(0);
      alert(!current ? "✅ Developer Mode: Sandbox Simulator diaktifkan di bar atas!" : "🔒 Developer Mode: Sandbox Simulator ditiadakan dari tampilan!");
    }
  };

  const handleRoleSwitch = (role: UserRole) => {
    if (role === 'pelapor') {
      onSelectSimulatedRole(role);
      return;
    }

    // Authorized check
    if (user && user.role === role) {
      onSelectSimulatedRole(role);
      return;
    }

    if (isUnlocked) {
      onSelectSimulatedRole(role);
      return;
    }

    const pin = window.prompt("⚠️ PENGAMANAN KEAMANAN EDUMAS:\n\nUntuk mensimulasikan peran sebagai Admin, Bidang (Waka), atau Ketua Tim secara cepat tanpa login, silakan masukkan PIN Sandbox:\n(PIN Default: 123456 atau gunakan formulir Login resmi di bawah)");
    if (pin === '123456' || pin === 'man2plg') {
      sessionStorage.setItem('km_sandbox_unlocked', 'true');
      setIsUnlocked(true);
      onSelectSimulatedRole(role);
    } else if (pin !== null) {
      alert("❌ PIN Sandbox tidak cocok! Silakan login melalui formulir Masuk Akun resmi di bawah.");
    }
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'pelapor', label: 'Pelapor (Siswa / Wali / Publik)', desc: 'Submit laporan' },
    { role: 'admin', label: 'Admin Madrasah', desc: 'SOP 2 & 3: Klasifikasi' },
    { role: 'bidang', label: 'Bidang Terkait (Waka)', desc: 'SOP 4: Investigasi' },
    { role: 'ketuatim', label: 'Ketua Tim (BK/Kepsek)', desc: 'SOP 5: Verifikasi' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs" id="app-navigation-header">
      
      {/* Top Simulator Banner - Only visible for sandbox evaluations/testing */}
      {showSandbox && (
        <div className="bg-slate-900 text-white px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-800 select-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-emerald-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded animate-pulse">
              Sandbox Simulator Mode {isUnlocked ? '🔓' : '🔒'}
            </span>
            <span className="text-slate-350 font-medium">Beralih peran secara instan untuk menguji SOP Alur Kerja (PIN Terkunci):</span>
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
              src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Kementerian_Agama.png" 
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
              <div className="text-right hidden sm:block">
                <span className="font-bold text-slate-800 block text-[11px] leading-tight select-all">{user.name}</span>
                <span className="text-[10px] text-slate-400 block uppercase font-mono">{user.role}</span>
              </div>
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
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
