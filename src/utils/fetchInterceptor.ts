/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Complaint, ActivityLog, UserRole, Department, ComplaintStatus } from '../types.js';

// Default mock data to seed localStorage if empty
const defaultUsers: User[] = [
  {
    id: 'u-1',
    email: 'admin@madrasah.sch.id',
    name: 'Ustadz Ahmad Fauzi (Admin)',
    role: 'admin',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-2',
    email: 'ketua@madrasah.sch.id',
    name: 'H. Syarifuddin, M.Pd (Ketua Tim)',
    role: 'ketuatim',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-3',
    email: 'kesiswaan@madrasah.sch.id',
    name: 'Ustadzah Halimah (Waka Kesiswaan)',
    role: 'bidang',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-4',
    email: 'budi@siswa.sch.id',
    name: 'Budi Santoso (Siswa VII-A)',
    role: 'pelapor',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  }
];

const defaultComplaints: Complaint[] = [
  {
    id: 'c-1',
    ticketNumber: 'KM-20260615-001',
    pelaporName: 'Budi Santoso (Siswa VII-A)',
    pelaporEmail: 'budi@siswa.sch.id',
    category: 'Pengaduan Pelanggaran',
    subCategory: 'Perundungan (Bullying)',
    title: 'Pemalakan di Belakang Kelas IX-C',
    description: 'Saya melihat beberapa siswa kelas IX melakukan pemalakan uang jajan kepada adik kelas VII selepas jam istirahat kedua di lorong sempit belakang kelas IX-C. Mohon ditindaklanjuti demi keamanan siswa.',
    anonymous: false,
    status: 'FORWARDED',
    assignedDepartment: 'Kesiswaan',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'c-2',
    ticketNumber: 'KM-20260615-002',
    pelaporName: 'Anonim',
    pelaporEmail: '',
    category: 'Informasi',
    subCategory: 'Fasilitas Kelas',
    title: 'Pertanyaan Jadwal Perbaikan AC Mushola',
    description: 'Bismillah, ustadz/ustadzah. Mohon informasi kapan pendingin ruangan (AC) di Mushola Putra diperbaiki? Kondisinya sekarang mati dan cukup panas saat sholat berjamaah dzuhur. Terima kasih.',
    anonymous: true,
    status: 'INFO_ANSWERED',
    directInfoAnswer: 'Jazakumullah khairan atas laporannya. AC mushola putra dijadwalkan akan diperbaiki oleh teknisi eksternal pada hari Rabu besok lusa. Sementara waktu, jendela mushola kami buka lebar dan kipas angin tambahan telah disediakan.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 11).toISOString()
  },
  {
    id: 'c-3',
    ticketNumber: 'KM-20260615-003',
    pelaporName: 'Siti Rahma (Siswi VIII-B)',
    pelaporEmail: 'siti@siswa.sch.id',
    category: 'Pengaduan Pelanggaran',
    subCategory: 'Sarana & Prasarana',
    title: 'Atap Bocor di Laboratorium IPA',
    description: 'Permisi, ingin mengadukan bahwa atap di bagian pojok kiri Laboratorium IPA bocor cukup parah saat hujan deras kemarin siang, airnya mengenai beberapa meja praktikum dan dikhawatirkan merusak peralatan laboratorium.',
    anonymous: false,
    status: 'DEPT_RESPONDED',
    assignedDepartment: 'Sarana Prasarana',
    departmentResponse: 'Lokasi bocor sudah kami survei. Genteng yang bergeser telah dirapikan sementara oleh staf Sarpras sekolah. Perbaikan plafon yang lapuk akibat air direncanakan akhir pekan ini agar tidak mengganggu kegiatan belajar mengajar.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const defaultLogs: ActivityLog[] = [
  {
    id: 'l-1',
    complaintId: 'c-1',
    actorName: 'Budi Santoso',
    actorRole: 'pelapor',
    action: 'MEMBUAT_ADUAN',
    notes: 'Aduan pertama kali dikirimkan oleh siswa ke sistem.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'l-2',
    complaintId: 'c-1',
    actorName: 'Ustadz Ahmad Fauzi (Admin)',
    actorRole: 'admin',
    action: 'KLASIFIKASI_DAN_TERUSKAN',
    notes: 'Diverifikasi sebagai Pengaduan Pelanggaran dan diteruskan ke Bidang Kesiswaan untuk evaluasi.',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'l-3',
    complaintId: 'c-2',
    actorName: 'Sistem',
    actorRole: 'pelapor',
    action: 'MEMBUAT_ADUAN',
    notes: 'Aduan anonim berhasil diajukan.',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'l-4',
    complaintId: 'c-2',
    actorName: 'Ustadz Ahmad Fauzi (Admin)',
    actorRole: 'admin',
    action: 'JAWAB_INFORMASI_LANGSUNG',
    notes: 'Aduan berkategori Informasi, dijawab langsung dan diselesaikan oleh Admin.',
    timestamp: new Date(Date.now() - 3600000 * 11).toISOString()
  },
  {
    id: 'l-5',
    complaintId: 'c-3',
    actorName: 'Siti Rahma',
    actorRole: 'pelapor',
    action: 'MEMBUAT_ADUAN',
    notes: 'Aduan dikirim oleh Siswi.',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'l-6',
    complaintId: 'c-3',
    actorName: 'Ustadz Ahmad Fauzi (Admin)',
    actorRole: 'admin',
    action: 'KLASIFIKASI_DAN_TERUSKAN',
    notes: 'Diteruskan ke Bidang Sarana & Prasarana.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'l-7',
    complaintId: 'c-3',
    actorName: 'Waka Sarana Prasarana',
    actorRole: 'bidang',
    action: 'INPUT_TANGGAPAN_BIDANG',
    notes: 'Memberikan tanggapan draf mengenai hasil survei genteng bocor dan rencana perbaikan.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

class StorageManager {
  static getUsers(): User[] {
    const raw = localStorage.getItem('km_users');
    if (!raw) {
      localStorage.setItem('km_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(raw);
  }

  static setUsers(users: User[]) {
    localStorage.setItem('km_users', JSON.stringify(users));
  }

  static getComplaints(): Complaint[] {
    const raw = localStorage.getItem('km_complaints');
    if (!raw) {
      localStorage.setItem('km_complaints', JSON.stringify(defaultComplaints));
      return defaultComplaints;
    }
    return JSON.parse(raw);
  }

  static setComplaints(complaints: Complaint[]) {
    localStorage.setItem('km_complaints', JSON.stringify(complaints));
  }

  static getLogs(): ActivityLog[] {
    const raw = localStorage.getItem('km_logs');
    if (!raw) {
      localStorage.setItem('km_logs', JSON.stringify(defaultLogs));
      return defaultLogs;
    }
    return JSON.parse(raw);
  }

  static setLogs(logs: ActivityLog[]) {
    localStorage.setItem('km_logs', JSON.stringify(logs));
  }

  static getGasUrl(): string {
    return localStorage.getItem('km_gas_url') || '';
  }

  static setGasUrl(url: string) {
    localStorage.setItem('km_gas_url', url);
  }
}

// REST helper to sync with Google Apps Script from custom CLIENT code
async function syncToGASDirect(gasUrl: string, actionName: string, payload: any): Promise<any> {
  if (!gasUrl) return null;
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Avoid CORS Preflight check from browser on Google Apps Script
      body: JSON.stringify({ action: actionName, data: payload })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(`Error direct client syncing to Google Apps Script [${actionName}]:`, e);
  }
  return null;
}

export function interceptFetch() {
  const originalFetch = window.fetch;
  let isStaticMode: boolean | null = null;

  async function checkStaticMode(): Promise<boolean> {
    if (isStaticMode !== null) return isStaticMode;
    try {
      const resp = await originalFetch('/api/status');
      if (resp.status === 404 || !resp.ok) {
        isStaticMode = true;
      } else {
        isStaticMode = false;
      }
    } catch {
      isStaticMode = true;
    }
    return isStaticMode;
  }

  const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.15"/>
    </filter>
    <radialGradient id="greenGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#15803d" />
      <stop offset="100%" stop-color="#166534" />
    </radialGradient>
  </defs>
  <path d="M 250 20 L 460 180 L 380 440 L 120 440 L 40 180 Z" fill="url(#greenGrad)" stroke="#15803d" stroke-width="4" filter="url(#shadow)" />
  <path d="M 250 35 L 440 190 L 365 425 L 135 425 L 60 190 Z" fill="none" stroke="#facc15" stroke-width="3" />
  <path d="M 250 42 L 430 195 L 358 418 L 142 418 L 70 195 Z" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.8" />
  <polygon points="105,250 110,265 125,265 113,275 117,290 105,280 93,290 97,275 85,265 100,265" fill="#ffffff" />
  <polygon points="395,250 400,265 415,265 403,275 407,290 395,280 383,290 387,275 375,265 390,265" fill="#ffffff" />
  <path id="archUpper" d="M 85 210 A 180 180 0 0 1 415 210" fill="none" stroke="none" />
  <text font-family="'Inter', sans-serif" font-weight="900" font-size="21" fill="#ffffff" letter-spacing="1">
    <textPath href="#archUpper" startOffset="50%" text-anchor="middle">
      MADRASAH ALIYAH NEGERI 2
    </textPath>
  </text>
  <path id="archLower" d="M 110 370 A 170 170 0 0 0 390 370" fill="none" stroke="none" />
  <text font-family="'Inter', sans-serif" font-weight="900" font-size="24" fill="#ffffff" letter-spacing="2">
    <textPath href="#archLower" startOffset="50%" text-anchor="middle">
      KOTA PALEMBANG
    </textPath>
  </text>
  <polygon points="250,115 256,133 275,133 260,145 265,163 250,152 235,163 240,145 225,133 244,133" fill="#facc15" stroke="#eab308" stroke-width="1" />
  <path d="M 245 260 C 210 230, 200 240, 185 190 C 205 180, 225 180, 245 200 Z" fill="#facc15" stroke="#ffffff" stroke-width="2" />
  <path d="M 255 260 C 290 230, 300 240, 315 190 C 295 180, 275 180, 255 200 Z" fill="#facc15" stroke="#ffffff" stroke-width="2" />
  <path d="M 195 205 L 235 215 M 195 215 L 235 225 M 195 225 L 235 235" stroke="#52525b" stroke-width="1.5" stroke-dasharray="3,3" />
  <path d="M 305 205 L 265 215 M 305 215 L 265 225 M 305 225 L 265 235" stroke="#52525b" stroke-width="1.5" stroke-dasharray="3,3" />
  <polygon points="210,245 290,245 305,270 270,285 250,265 230,285 195,270" fill="#1e293b" stroke="#0f172a" stroke-width="2" />
  <path d="M 180 320 C 140 280, 130 220, 160 160" fill="none" stroke="#facc15" stroke-width="4" stroke-linecap="round" />
  <circle cx="160" cy="165" r="3.5" fill="#facc15" />
  <circle cx="151" cy="180" r="3.5" fill="#facc15" />
  <circle cx="145" cy="200" r="3.5" fill="#facc15" />
  <circle cx="140" cy="220" r="3.5" fill="#facc15" />
  <circle cx="140" cy="240" r="3.5" fill="#facc15" />
  <circle cx="145" cy="260" r="3.5" fill="#facc15" />
  <circle cx="152" cy="280" r="3.5" fill="#facc15" />
  <circle cx="165" cy="300" r="3.5" fill="#facc15" />
  <path d="M 320 320 C 360 280, 370 220, 340 160" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
  <circle cx="340" cy="165" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="349" cy="180" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="355" cy="200" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="360" cy="220" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="360" cy="240" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="355" cy="260" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="348" cy="280" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <circle cx="335" cy="300" r="5" fill="#ffffff" stroke="#e4e4e7" stroke-width="1" />
  <path d="M 170 315 L 330 315 L 340 340 L 300 330 L 250 340 L 200 330 L 160 340 Z" fill="#ffffff" stroke="#1e293b" stroke-width="2" />
  <text x="250" y="331" font-family="'Inter', sans-serif" font-weight="900" font-size="11" fill="#0f172a" text-anchor="middle" letter-spacing="1">
    IKHLAS BERAMAL
  </text>
  <circle cx="250" cy="28" r="4" fill="#facc15" />
</svg>`;

  // Overwrite window.fetch globally using Object.defineProperty to bypass getter-only property restrictions
  try {
    Object.defineProperty(window, 'fetch', {
      value: async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        // Immediately return our custom logo SVG for any logo paths to avoid CORS issues
        if (urlStr.includes('/api/logo.svg') || urlStr.includes('/api/logo.png')) {
          return new Response(LOGO_SVG, {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }

        // We only intercept requests starting with /api/ or containing /api/
        if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
          const staticActive = await checkStaticMode();
          if (staticActive) {
            return handleStaticAPI(urlStr, init);
          }
        }

        return originalFetch(input, init);
      },
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {
    console.warn('Object.defineProperty fetch failed, rolling back to direct assignment.', err);
    try {
      (window as any).fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        if (urlStr.includes('/api/logo.svg') || urlStr.includes('/api/logo.png')) {
          return new Response(LOGO_SVG, {
            status: 200,
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }

        if (urlStr.startsWith('/api/') || urlStr.includes('/api/')) {
          const staticActive = await checkStaticMode();
          if (staticActive) {
            return handleStaticAPI(urlStr, init);
          }
        }

        return originalFetch(input, init);
      };
    } catch (e) {
      console.error('Could not globally override window.fetch securely:', e);
    }
  }

  async function handleStaticAPI(urlStr: string, init?: RequestInit): Promise<Response> {
    const parsedUrl = new URL(urlStr, window.location.origin);
    const path = parsedUrl.pathname;
    const method = init?.method?.toUpperCase() || 'GET';
    const bodyData = init?.body ? JSON.parse(init.body as string) : null;
    const gasUrl = StorageManager.getGasUrl();

    // 1. GET /api/status
    if (path === '/api/status' && method === 'GET') {
      return new Response(JSON.stringify({
        hasGAS: !!gasUrl,
        gasUrl: gasUrl
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. POST /api/gas-config
    if (path === '/api/gas-config' && method === 'POST') {
      const { url } = bodyData || {};
      StorageManager.setGasUrl(url || '');
      // Try to read existing data from GAS sheets on connection to initialize browser state
      if (url) {
        try {
          const respComp = await syncToGASDirect(url, 'getComplaints', {});
          if (respComp && Array.isArray(respComp)) {
            StorageManager.setComplaints(respComp);
          }
          const respUsers = await syncToGASDirect(url, 'getUsers', {});
          if (respUsers && Array.isArray(respUsers)) {
            StorageManager.setUsers(respUsers);
          }
          const respLogs = await syncToGASDirect(url, 'getLogs', {});
          if (respLogs && Array.isArray(respLogs)) {
            StorageManager.setLogs(respLogs);
          }
        } catch (e) {
          console.error('Failed to sync master data during GAS initialize:', e);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        gasUrl: url || ''
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. GET /api/complaints
    if (path === '/api/complaints' && method === 'GET') {
      // Trigger background sync if GAS is configured
      let complaints = StorageManager.getComplaints();
      if (gasUrl) {
        try {
          // Sync read from GAS sheets
          const gasCompList = await syncToGASDirect(gasUrl, 'getComplaints', {});
          if (gasCompList && Array.isArray(gasCompList) && gasCompList.length > 0) {
            StorageManager.setComplaints(gasCompList);
            complaints = gasCompList;
          }
        } catch (e) {
          console.warn('Sync complaints from GAS failed, using localStorage:', e);
        }
      }
      return new Response(JSON.stringify(complaints), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3b. GET /api/logs
    if (path === '/api/logs' && method === 'GET') {
      let logs = StorageManager.getLogs();
      if (gasUrl) {
        try {
          const gasLogs = await syncToGASDirect(gasUrl, 'getLogs', {});
          if (gasLogs && Array.isArray(gasLogs)) {
            StorageManager.setLogs(gasLogs);
            logs = gasLogs;
          }
        } catch (e) {
          console.warn('Sync logs from GAS failed:', e);
        }
      }
      return new Response(JSON.stringify(logs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3c. DELETE /api/complaints/:id
    if (path.startsWith('/api/complaints/') && method === 'DELETE') {
      const segments = path.split('/');
      const complaintId = segments[3];
      const complaints = StorageManager.getComplaints();
      const complaintIndex = complaints.findIndex(c => c.id === complaintId);
      if (complaintIndex !== -1) {
        complaints.splice(complaintIndex, 1);
        StorageManager.setComplaints(complaints);
        
        // Filter associated logs
        let logs = StorageManager.getLogs();
        logs = logs.filter(l => l.complaintId !== complaintId);
        StorageManager.setLogs(logs);

        // Filter associated notifications
        let notifications = [];
        try {
          const rawNotifs = localStorage.getItem('km_notifications');
          if (rawNotifs) {
            notifications = JSON.parse(rawNotifs).filter((n: any) => n.complaintId !== complaintId);
            localStorage.setItem('km_notifications', JSON.stringify(notifications));
          }
        } catch(e) {}
      }
      return new Response(JSON.stringify({ success: true, message: 'Pengaduan sukses dihapus.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3d. GET /api/admin/users
    if (path === '/api/admin/users' && method === 'GET') {
      const users = StorageManager.getUsers();
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3e. POST /api/admin/change-user-password
    if (path === '/api/admin/change-user-password' && method === 'POST') {
      const { userId, newPassword } = bodyData || {};
      const users = StorageManager.getUsers();
      const targetUser = users.find(u => u.id === userId);
      if (targetUser) {
        targetUser.password = newPassword;
        StorageManager.setUsers(users);
        return new Response(JSON.stringify({ success: true, message: `Kata sandi akun ${targetUser.name} berhasil diperbarui.` }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3f. POST /api/admin/update-user
    if (path === '/api/admin/update-user' && method === 'POST') {
      const { userId, name, email, password } = bodyData || {};
      const users = StorageManager.getUsers();
      const targetUser = users.find(u => u.id === userId);
      if (targetUser) {
        if (name) targetUser.name = name;
        if (email) targetUser.email = email.toLowerCase().trim();
        if (password) targetUser.password = password;
        StorageManager.setUsers(users);
        return new Response(JSON.stringify({ success: true, message: `Data akun ${targetUser.name} berhasil diperbarui.` }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'Akun tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. GET /api/complaints/:id/logs
    if (path.startsWith('/api/complaints/') && path.endsWith('/logs') && method === 'GET') {
      const segments = path.split('/');
      const complaintId = segments[3];
      let logs = StorageManager.getLogs();
      
      if (gasUrl) {
        try {
          const gasLogs = await syncToGASDirect(gasUrl, 'getLogs', {});
          if (gasLogs && Array.isArray(gasLogs)) {
            StorageManager.setLogs(gasLogs);
            logs = gasLogs;
          }
        } catch (e) {
          console.warn('Sync logs from GAS failed, using local:', e);
        }
      }

      const filteredLogs = logs.filter(l => l.complaintId === complaintId);
      return new Response(JSON.stringify(filteredLogs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. POST /api/complaints
    if (path === '/api/complaints' && method === 'POST') {
      const { pelaporName, pelaporEmail, category, subCategory, title, description, anonymous, supportingEvidence, supportingEvidenceName } = bodyData || {};
      
      const ticketNumber = 'KM-' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '-' + Math.floor(100+Math.random()*900);
      const newComplaint: Complaint = {
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        ticketNumber,
        pelaporName: anonymous ? 'Anonim' : pelaporName || 'Masyarakat',
        pelaporEmail: anonymous ? '' : pelaporEmail || '',
        category: category || 'Pengaduan Pelanggaran',
        subCategory: subCategory || '',
        title: title || '',
        description: description || '',
        anonymous: !!anonymous,
        status: 'PENDING',
        supportingEvidence,
        supportingEvidenceName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const complaints = StorageManager.getComplaints();
      complaints.push(newComplaint);
      try {
        StorageManager.setComplaints(complaints);
      } catch (err) {
        console.warn('Gagal menyimpan bukti foto ke localstorage. Hubungi admin atau gunakan file lebih kecil.');
        newComplaint.supportingEvidence = undefined;
        newComplaint.supportingEvidenceName = undefined;
        try {
          StorageManager.setComplaints(complaints);
        } catch (innerErr) {
          console.error('Sama sekali gagal menyimpan aduan ke localstorage', innerErr);
        }
      }

      const newLog: ActivityLog = {
        id: 'l-' + Math.random().toString(36).substr(2, 9),
        complaintId: newComplaint.id,
        actorName: anonymous ? 'Masyarakat' : pelaporName || 'Masyarakat',
        actorRole: 'pelapor',
        action: 'MEMBUAT_ADUAN',
        notes: 'Pengaduan berhasil didaftarkan dengan Nomor Tiket: ' + ticketNumber + (supportingEvidence ? ' dengan lampiran bukti foto.' : ''),
        timestamp: new Date().toISOString()
      };

      const logs = StorageManager.getLogs();
      logs.push(newLog);
      try {
        StorageManager.setLogs(logs);
      } catch (e) {
        console.error('Gagal mencatat log ke localstorage:', e);
      }

      // Sync to GAS sheets
      if (gasUrl) {
        const gasResult = await syncToGASDirect(gasUrl, 'addComplaint', { complaint: newComplaint, log: newLog });
        if (gasResult && gasResult.success && gasResult.complaint && gasResult.complaint.supportingEvidence) {
          newComplaint.supportingEvidence = gasResult.complaint.supportingEvidence;
          
          // Re-retrieve and save to clean our localStorage!
          const cleanComplaints = StorageManager.getComplaints();
          const targetIdx = cleanComplaints.findIndex(c => c.id === newComplaint.id);
          if (targetIdx !== -1) {
            cleanComplaints[targetIdx].supportingEvidence = gasResult.complaint.supportingEvidence;
            StorageManager.setComplaints(cleanComplaints);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, complaint: newComplaint }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. POST /api/complaints/:id/action
    if (path.startsWith('/api/complaints/') && path.endsWith('/action') && method === 'POST') {
      const segments = path.split('/');
      const complaintId = segments[3];
      const { action, actorName, actorRole, notes, directInfoAnswer, assignedDepartment, departmentResponse, finalAnswer } = bodyData || {};

      const complaints = StorageManager.getComplaints();
      const complaintIndex = complaints.findIndex(c => c.id === complaintId);
      if (complaintIndex === -1) {
        return new Response(JSON.stringify({ error: 'Pengaduan tidak ditemukan.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const complaint = complaints[complaintIndex];
      const oldStatus = complaint.status;
      let newStatus: ComplaintStatus = oldStatus;

      switch (action) {
        case 'KLASIFIKASI_JAWAB_INFO':
          complaint.directInfoAnswer = directInfoAnswer;
          complaint.finalAnswer = directInfoAnswer;
          newStatus = 'INFO_ANSWERED';
          break;
        case 'KLASIFIKASI_TERUSKAN':
          complaint.assignedDepartment = assignedDepartment as Department;
          newStatus = 'FORWARDED';
          break;
        case 'REASSIGN_DEPARTMENT':
          complaint.assignedDepartment = assignedDepartment as Department;
          complaint.departmentResponse = ''; // clear any outdated response
          newStatus = 'FORWARDED';
          break;
        case 'INPUT_TANGGAPAN_BIDANG':
          complaint.departmentResponse = departmentResponse;
          newStatus = 'DEPT_RESPONDED';
          break;
        case 'SETUJUI_KETUA_TIM':
          complaint.finalAnswer = complaint.departmentResponse;
          newStatus = 'APPROVED';
          break;
        case 'TOLAK_KETUA_TIM':
          complaint.departmentResponse = '';
          newStatus = 'FORWARDED';
          break;
        case 'FINALISASI_ADMIN':
          complaint.finalAnswer = finalAnswer || complaint.finalAnswer;
          newStatus = 'RESOLVED';
          break;
        default:
          return new Response(JSON.stringify({ error: 'Aksi tindakan tidak valid.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
      }

      complaint.status = newStatus;
      complaint.updatedAt = new Date().toISOString();
      StorageManager.setComplaints(complaints);

      const newLog: ActivityLog = {
        id: 'l-' + Math.random().toString(36).substr(2, 9),
        complaintId: complaint.id,
        actorName: actorName || 'Staf Madrasah',
        actorRole: (actorRole as UserRole) || 'admin',
        action,
        notes: notes || `Mengubah status dari ${oldStatus} ke ${newStatus}`,
        timestamp: new Date().toISOString()
      };

      const logs = StorageManager.getLogs();
      logs.push(newLog);
      StorageManager.setLogs(logs);

      // Sync to GAS sheets
      if (gasUrl) {
        const gasUpdateResult = await syncToGASDirect(gasUrl, 'updateComplaint', { complaint, log: newLog });
        if (gasUpdateResult && gasUpdateResult.success && gasUpdateResult.complaint && gasUpdateResult.complaint.supportingEvidence) {
          complaint.supportingEvidence = gasUpdateResult.complaint.supportingEvidence;
          
          // Re-retrieve and save to clean our localStorage!
          const cleanComplaints = StorageManager.getComplaints();
          const targetIdx = cleanComplaints.findIndex(c => c.id === complaint.id);
          if (targetIdx !== -1) {
            cleanComplaints[targetIdx].supportingEvidence = gasUpdateResult.complaint.supportingEvidence;
            StorageManager.setComplaints(cleanComplaints);
          }
        }
      }

      return new Response(JSON.stringify({ success: true, complaint }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. POST /api/auth/register
    if (path === '/api/auth/register' && method === 'POST') {
      const { name, email, password, role } = bodyData || {};
      const users = StorageManager.getUsers();
      
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (exists) {
        return new Response(JSON.stringify({ error: 'Email sudah terdaftar.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newUser: User = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        name,
        email: email.toLowerCase().trim(),
        role: role || 'pelapor',
        isVerified: false,
        password: password,
        verificationCode,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      StorageManager.setUsers(users);

      // Trigger verification email via GAS directly if available!
      let emailSent = false;
      if (gasUrl) {
        try {
          const resp = await syncToGASDirect(gasUrl, 'sendVerification', {
            email: newUser.email,
            name: newUser.name,
            code: verificationCode
          });
          if (resp?.success) {
            emailSent = true;
          }
        } catch (e) {
          console.error(e);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Registrasi berhasil. Kode verifikasi telah dikirim.',
        email: newUser.email,
        sandboxOTP: verificationCode,
        emailSent
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 8. POST /api/auth/verify
    if (path === '/api/auth/verify' && method === 'POST') {
      const { email, code } = bodyData || {};
      const users = StorageManager.getUsers();

      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (userIndex === -1) {
        return new Response(JSON.stringify({ error: 'Email tidak ditemukan.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const user = users[userIndex];
      if (user.verificationCode === code.trim()) {
        user.isVerified = true;
        delete user.verificationCode;
        StorageManager.setUsers(users);

        // Sync user to Google Sheet
        if (gasUrl) {
          await syncToGASDirect(gasUrl, 'addUser', user);
        }

        return new Response(JSON.stringify({ success: true, user }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ error: 'Kode verifikasi salah atau kadaluarsa.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 9. POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = bodyData || {};
      const users = StorageManager.getUsers();

      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        return new Response(JSON.stringify({ error: 'Email tidak terdaftar.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!user.isVerified) {
        return new Response(JSON.stringify({
          error: 'Email belum diverifikasi.',
          unverified: true,
          email: user.email
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Enforce authentic password check (defaults to man2plg123 for default accounts)
      const expectedPassword = user.password || 'man2plg123';
      if (password !== expectedPassword) {
        return new Response(JSON.stringify({ error: 'Kata sandi tidak sesuai. Silakan coba lagi.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true, user }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
