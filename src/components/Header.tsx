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
  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'pelapor', label: 'Pelapor (Siswa / Wali)', desc: 'Submit laporan' },
    { role: 'admin', label: 'Admin Madrasah', desc: 'SOP 2 & 3: Klasifikasi' },
    { role: 'bidang', label: 'Bidang Terkait (Waka)', desc: 'SOP 4: Investigasi' },
    { role: 'ketuatim', label: 'Ketua Tim (BK/Kepsek)', desc: 'SOP 5: Verifikasi' }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs" id="app-navigation-header">
      
      {/* Top Simulator Banner - Only visible for sandbox evaluations/testing */}
      <div className="bg-slate-900 text-white px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="bg-emerald-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded animate-pulse">
            Sandbox Simulator Mode
          </span>
          <span className="text-slate-350 font-medium">Beralih peran secara instan untuk menguji SOP Alur Kerja:</span>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {roles.map((r) => (
            <button
              key={r.role}
              onClick={() => onSelectSimulatedRole(r.role)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${simulatedRole === r.role ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              title={r.desc}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-650/15">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-sm md:text-base leading-none flex items-center gap-1.5">
              KAWAL MADRASAH
              <span className={`w-2 h-2 rounded-full ${hasGAS ? 'bg-emerald-500' : 'bg-slate-300'}`} title={hasGAS ? 'Google Sheets Terkoneksi' : 'Menggunakan Local DB File'} />
            </h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Aplikasi Pengaduan Siswa & Masyarakat</p>
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
