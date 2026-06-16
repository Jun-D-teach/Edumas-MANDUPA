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

  // Overwrite window.fetch globally using Object.defineProperty to bypass getter-only property restrictions
  try {
    Object.defineProperty(window, 'fetch', {
      value: async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

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
      const { pelaporName, pelaporEmail, category, subCategory, title, description, anonymous } = bodyData || {};
      
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const complaints = StorageManager.getComplaints();
      complaints.push(newComplaint);
      StorageManager.setComplaints(complaints);

      const newLog: ActivityLog = {
        id: 'l-' + Math.random().toString(36).substr(2, 9),
        complaintId: newComplaint.id,
        actorName: anonymous ? 'Masyarakat' : pelaporName || 'Masyarakat',
        actorRole: 'pelapor',
        action: 'MEMBUAT_ADUAN',
        notes: 'Pengaduan berhasil didaftarkan dengan Nomor Tiket: ' + ticketNumber,
        timestamp: new Date().toISOString()
      };

      const logs = StorageManager.getLogs();
      logs.push(newLog);
      StorageManager.setLogs(logs);

      // Sync to GAS sheets
      if (gasUrl) {
        await syncToGASDirect(gasUrl, 'addComplaint', { complaint: newComplaint, log: newLog });
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
        await syncToGASDirect(gasUrl, 'updateComplaint', { complaint, log: newLog });
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
