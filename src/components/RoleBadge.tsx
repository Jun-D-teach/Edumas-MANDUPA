/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComplaintStatus, UserRole } from '../types.js';

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const styles: Record<UserRole, { bg: string; text: string; label: string }> = {
    admin: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-800 dark:text-emerald-200', label: 'Admin (Petugas)' },
    ketuatim: { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-800 dark:text-amber-200', label: 'Ketua Tim' },
    bidang: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-800 dark:text-blue-200', label: 'Bidang Terkait' },
    pelapor: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', label: 'Siswa / Masyarakat' }
  };

  const current = styles[role] || styles.pelapor;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${current.bg} ${current.text}`}>
      {current.label}
    </span>
  );
};

interface StatusBadgeProps {
  status: ComplaintStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<ComplaintStatus, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Menunggu Klasifikasi' },
    INFO_ANSWERED: { bg: 'bg-sky-100', text: 'text-sky-800', label: 'Informasi Terjawab' },
    FORWARDED: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Diteruskan ke Bidang' },
    DEPT_RESPONDED: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Menunggu Review Ketua' },
    APPROVED: { bg: 'bg-violet-100', text: 'text-violet-800', label: 'Selesai Direview Ketua' },
    RESOLVED: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Pengaduan Terjawab' }
  };

  const current = styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Tidak Diketahui' };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-current bg-opacity-30 ${current.bg} ${current.text}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse"></span>
      {current.label}
    </span>
  );
};
