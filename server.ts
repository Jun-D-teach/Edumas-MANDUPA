/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { User, Complaint, ActivityLog, UserRole, Department, ComplaintStatus } from './src/types.js';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-store.json');

app.use(express.json());

// Load or seed default storage
interface DataStore {
  users: User[];
  complaints: Complaint[];
  logs: ActivityLog[];
  gasUrl: string;
}

const defaultUsers: User[] = [
  {
    id: 'u-1',
    email: 'admin@madrasah.sch.id',
    name: 'Ustadz Ahmad Fauzi (Admin)',
    role: 'admin',
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-2',
    email: 'ketua@madrasah.sch.id',
    name: 'H. Syarifuddin, M.Pd (Ketua Tim)',
    role: 'ketuatim',
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-3',
    email: 'kesiswaan@madrasah.sch.id',
    name: 'Ustadzah Halimah (Waka Kesiswaan)',
    role: 'bidang',
    isVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-4',
    email: 'budi@siswa.sch.id',
    name: 'Budi Santoso (Siswa VII-A)',
    role: 'pelapor',
    isVerified: true,
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
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
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
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
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
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
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

function initDataStore(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const p = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(p) as DataStore;
      // Merge elements if keys are missing
      if (!loaded.users) loaded.users = defaultUsers;
      if (!loaded.complaints) loaded.complaints = defaultComplaints;
      if (!loaded.logs) loaded.logs = defaultLogs;
      if (loaded.gasUrl === undefined) loaded.gasUrl = process.env.GOOGLE_SCRIPT_URL || '';
      return loaded;
    }
  } catch (error) {
    console.error('Error reading JSON store, resetting to default', error);
  }

  const initialStore: DataStore = {
    users: defaultUsers,
    complaints: defaultComplaints,
    logs: defaultLogs,
    gasUrl: process.env.GOOGLE_SCRIPT_URL || ''
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialStore, null, 2), 'utf-8');
  return initialStore;
}

let store = initDataStore();

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store to file:', err);
  }
}

// REST helper to sync with Google Apps Script
async function syncToGAS(actionName: string, payload: any): Promise<any> {
  const url = store.gasUrl;
  if (!url) return null; // No GAS configured
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName, data: payload })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(`Error syncing to Google Apps Script [${actionName}]:`, e);
  }
  return null;
}

// Load configurations dynamically
app.get('/api/status', (req, res) => {
  res.json({
    hasGAS: !!store.gasUrl,
    gasUrl: store.gasUrl
  });
});

app.post('/api/gas-config', (req, res) => {
  const { url } = req.body;
  store.gasUrl = url || '';
  saveStore();
  res.json({ success: true, gasUrl: store.gasUrl });
});

// Auth Routes

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, Email, dan Password wajib diisi.' });
  }

  // Check if user already exists
  const exists = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email sudah terdaftar di sistem.' });
  }

  // Generate 6 digit OTP Verification
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const newUser: User = {
    id: 'u-' + Math.random().toString(36).substr(2, 9),
    name,
    email: email.toLowerCase(),
    role: (role as UserRole) || 'pelapor',
    isVerified: false,
    verificationCode,
    createdAt: new Date().toISOString()
  };

  store.users.push(newUser);
  saveStore();

  // Try to send actual email via GAS
  let emailSent = false;
  if (store.gasUrl) {
    const response = await syncToGAS('sendVerification', {
      email: newUser.email,
      name: newUser.name,
      code: verificationCode
    });
    if (response && response.success) {
      emailSent = true;
    }
  }

  // In the response, we also send the OTP for sandbox simulation testing (just in case they haven't set up GAS yet!)
  res.json({
    success: true,
    message: 'Registrasi berhasil. Kode verifikasi telah dikirim.',
    email: newUser.email,
    sandboxOTP: verificationCode, // handy for testing without GAS configured!
    emailSent
  });
});

app.post('/api/auth/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email dan Kode Verifikasi wajib diisi' });
  }

  const userIndex = store.users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Email tidak ditemukan.' });
  }

  const user = store.users[userIndex];
  if (user.verificationCode === code.trim()) {
    user.isVerified = true;
    delete user.verificationCode;
    saveStore();

    // Sync to GAS users sheet
    syncToGAS('addUser', user);

    return res.json({ success: true, user });
  } else {
    return res.status(400).json({ error: 'Kode verifikasi salah atau kadaluarsa.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan Password wajib diisi' });
  }

  // Find user (sandbox password is hardcoded matches role or just generic checking)
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Email atau password tidak ditemukan.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ error: 'Email belum diverifikasi. Silakan masukkan kode OTP.', unverified: true, email: user.email });
  }

  // Success login
  res.json({ success: true, user });
});

// Complaints Routes

app.get('/api/complaints', (req, res) => {
  // Let's retrieve lists
  res.json(store.complaints);
});

app.get('/api/complaints/:id/logs', (req, res) => {
  const complaintId = req.params.id;
  const filteredLogs = store.logs.filter(l => l.complaintId === complaintId);
  res.json(filteredLogs);
});

app.post('/api/complaints', async (req, res) => {
  const { pelaporName, pelaporEmail, category, subCategory, title, description, anonymous } = req.body;

  if (!title || !description || !category || !subCategory) {
    return res.status(400).json({ error: 'Kelengkapan aduan (Kategori, Sub Kategori, Judul, Keterangan) harus diisi.' });
  }

  const ticketNumber = 'KM-' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '-' + Math.floor(100+Math.random()*900);

  const newComplaint: Complaint = {
    id: 'c-' + Math.random().toString(36).substr(2, 9),
    ticketNumber,
    pelaporName: anonymous ? 'Anonim' : pelaporName,
    pelaporEmail: anonymous ? '' : pelaporEmail,
    category,
    subCategory,
    title,
    description,
    anonymous: !!anonymous,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  store.complaints.push(newComplaint);

  const newLog: ActivityLog = {
    id: 'l-' + Math.random().toString(36).substr(2, 9),
    complaintId: newComplaint.id,
    actorName: anonymous ? 'Masyarakat' : pelaporName,
    actorRole: 'pelapor',
    action: 'MEMBUAT_ADUAN',
    notes: 'Pengaduan berhasil didaftarkan dengan Nomor Tiket: ' + ticketNumber,
    timestamp: new Date().toISOString()
  };

  store.logs.push(newLog);
  saveStore();

  // Sync to GAS sheets
  await syncToGAS('addComplaint', { complaint: newComplaint, log: newLog });

  res.json({ success: true, complaint: newComplaint });
});

// State Machine Actions matching the 7 Flowchart Steps

app.post('/api/complaints/:id/action', async (req, res) => {
  const complaintId = req.params.id;
  const { action, actorName, actorRole, notes, directInfoAnswer, assignedDepartment, departmentResponse, finalAnswer } = req.body;

  const complaintIndex = store.complaints.findIndex(c => c.id === complaintId);
  if (complaintIndex === -1) {
    return res.status(404).json({ error: 'Pengaduan tidak ditemukan.' });
  }

  const complaint = store.complaints[complaintIndex];
  const oldStatus = complaint.status;
  let newStatus: ComplaintStatus = oldStatus;

  // Process flowchart transition logic
  switch (action) {
    case 'KLASIFIKASI_JAWAB_INFO': // Step 3: Admin classifies as "Informasi" and answers immediately
      complaint.directInfoAnswer = directInfoAnswer;
      complaint.finalAnswer = directInfoAnswer;
      newStatus = 'INFO_ANSWERED';
      break;

    case 'KLASIFIKASI_TERUSKAN': // Step 3: Admin classifies as "Pengaduan" and forwards to related department
      complaint.assignedDepartment = assignedDepartment as Department;
      newStatus = 'FORWARDED';
      break;

    case 'INPUT_TANGGAPAN_BIDANG': // Step 4: Related department processes & inputs draf respons
      complaint.departmentResponse = departmentResponse;
      newStatus = 'DEPT_RESPONDED';
      break;

    case 'SETUJUI_KETUA_TIM': // Step 5: Chairperson reviews and approves the department's response
      complaint.finalAnswer = complaint.departmentResponse; // Copy draft to final draft
      newStatus = 'APPROVED';
      break;

    case 'TOLAK_KETUA_TIM': // Reject back to department
      complaint.departmentResponse = '';
      newStatus = 'FORWARDED';
      break;

    case 'FINALISASI_ADMIN': // Step 6: Admin inputs or confirms and publishes the final answer
      complaint.finalAnswer = finalAnswer || complaint.finalAnswer;
      newStatus = 'RESOLVED';
      break;

    default:
      return res.status(400).json({ error: 'Aksi tindakan tidak valid.' });
  }

  complaint.status = newStatus;
  complaint.updatedAt = new Date().toISOString();

  const newLog: ActivityLog = {
    id: 'l-' + Math.random().toString(36).substr(2, 9),
    complaintId: complaint.id,
    actorName: actorName || 'Staf Madrasah',
    actorRole: (actorRole as UserRole) || 'admin',
    action,
    notes: notes || `Mengubah status dari ${oldStatus} ke ${newStatus}`,
    timestamp: new Date().toISOString()
  };

  store.logs.push(newLog);
  saveStore();

  // Sync to GAS sheets
  await syncToGAS('updateComplaint', { complaint, log: newLog });

  res.json({ success: true, complaint });
});

// Full-Stack Server Start & Dev Routing Setup
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kawal Madrasah Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
