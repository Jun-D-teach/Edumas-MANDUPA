/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';
import { User, Complaint, ActivityLog, UserRole, Department, ComplaintStatus, KMNotification } from './src/types.js';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data-store.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Load or seed default storage
interface DataStore {
  users: User[];
  complaints: Complaint[];
  logs: ActivityLog[];
  notifications?: KMNotification[];
  gasUrl: string;
}

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
    id: 'u-3b',
    email: 'kurikulum@madrasah.sch.id',
    name: 'Ustadz Mansur (Waka Kurikulum)',
    role: 'bidang',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-3c',
    email: 'sarpras@madrasah.sch.id',
    name: 'H. Sobirin, M.Si (Waka Sarana Prasarana)',
    role: 'bidang',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-3d',
    email: 'humas@madrasah.sch.id',
    name: 'Dra. Hj. Nurjanah (Waka Humas)',
    role: 'bidang',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-3e',
    email: 'keamanan@madrasah.sch.id',
    name: 'Pak Satrio (Waka Keamanan)',
    role: 'bidang',
    isVerified: true,
    password: 'man2plg123',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u-3f',
    email: 'tu@madrasah.sch.id',
    name: 'Hj. Aminah, S.Sos (Kaur TU)',
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
      if (!loaded.users) {
        loaded.users = defaultUsers;
      } else {
        // Ensure all default waka / ketua/ admin are present even in old saves
        defaultUsers.forEach(du => {
          if (!loaded.users.some(u => u.email.toLowerCase() === du.email.toLowerCase())) {
            loaded.users.push(du);
          }
        });
      }
      if (!loaded.complaints) loaded.complaints = defaultComplaints;
      if (!loaded.logs) loaded.logs = defaultLogs;
      if (!loaded.notifications) loaded.notifications = [];
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
    notifications: [],
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

// Helper to send email via SMTP or fallback
async function sendNotificationEmail(toEmail: string, subject: string, htmlContent: string): Promise<boolean> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      await transporter.sendMail({
        from: `"EDUMAS MAN 2 Palembang" <${user}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`Email successfully sent to ${toEmail} via Nodemailer SMTP!`);
      return true;
    } catch (e) {
      console.error(`Failed to send email to ${toEmail} via SMTP:`, e);
    }
  }

  console.log(`[Notification Sim] Email to ${toEmail}: Subject: [${subject}]. Content: ${htmlContent.substring(0, 100)}...`);
  return false;
}

async function sendNotificationWhatsApp(number: string, text: string): Promise<boolean> {
  const url = process.env.WHATSAPP_WEBHOOK_URL;
  if (url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: number, message: text }),
      });
      if (response.ok) {
        console.log(`WhatsApp notification successfully dispatched to ${number}`);
        return true;
      }
    } catch (e) {
      console.error(`WhatsApp webhook delivery failed to ${number}:`, e);
    }
  }
  console.log(`[Notification Sim] WhatsApp to ${number}: "${text}"`);
  return false;
}

async function createNotification(params: {
  userId?: string;
  targetRole?: UserRole;
  targetDept?: Department;
  title: string;
  message: string;
  type: 'info' | 'complaint' | 'status_change';
  complaintId?: string;
}) {
  const notification: KMNotification = {
    id: 'n-' + Math.random().toString(36).substr(2, 9),
    ...params,
    read: false,
    createdAt: new Date().toISOString(),
  };

  if (!store.notifications) {
    store.notifications = [];
  }
  store.notifications.push(notification);

  // Determine who to notify
  const targetUsers = store.users.filter((u) => {
    if (params.userId && u.id === params.userId) return true;
    if (params.targetRole && u.role === params.targetRole) {
      if (params.targetRole === 'bidang' && params.targetDept) {
        return u.name.toLowerCase().includes(params.targetDept.toLowerCase());
      }
      return true;
    }
    return false;
  });

  const emailPromises = targetUsers.map(async (u) => {
    if (!u.email) return;
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
        <h2 style="color: #047857; margin-top: 0; font-weight: 800;">EDUMAS MAN 2 Kota Palembang</h2>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: bold; margin-bottom: 12px;">Sistem Informasi Layanan Pengaduan Resmi</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <h3 style="color: #0f172a; font-size: 17px; margin-bottom: 8px; font-weight: 800;">${params.title}</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">${params.message}</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 13px;">
          <strong style="color: #047857; text-transform: uppercase; font-size: 11px; display: block; margin-bottom: 6px;">Detail Sistem / Pelacakan:</strong>
          • <b>Tanggal Event:</b> ${new Date().toLocaleString('id-ID')} WIB<br/>
          • <b>Kanal Informasi:</b> EDUMAS Online Real-Time<br/>
          • <b>Jenis:</b> ${params.type.toUpperCase()}
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          Ini adalah surel otomatis dari EDUMAS Kawal Madrasah MAN 2 Palembang. Harap tidak membalas email ini secara langsung. Untuk melakukan investigasi / tanggapan, silakan login ke portal resmi.
        </p>
      </div>
    `;
    const sent = await sendNotificationEmail(u.email, `[EDUMAS MAN 2] ${params.title}`, bodyHtml);
    if (sent) notification.sentEmail = true;
  });

  const waPromises = targetUsers.map(async (u) => {
    const phone = u.whatsappNumber || (u.role === 'admin' ? '081234567890' : u.role === 'bidang' ? '085388889999' : '089876543210');
    const waText = `*[EDUMAS MAN 2 PALEMBANG]*\n\n📢 *${params.title}*\n\n${params.message}\n\n_Waktu: ${new Date().toLocaleString('id-ID')} WIB_\n\n_Silakan akses dashboard EDUMAS untuk respons penanganan._`;
    const sent = await sendNotificationWhatsApp(phone, waText);
    if (sent) notification.sentWA = true;
  });

  await Promise.all([...emailPromises, ...waPromises]);
  saveStore();
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

// Serve Local High-Fidelity SVG logo to bypass external CORS/hotlink restrictions
const EMBEDDED_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
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

app.get('/api/logo.svg', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(EMBEDDED_LOGO_SVG);
});

app.get('/api/logo.png', (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(EMBEDDED_LOGO_SVG);
});

// Auth Routes

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, Email, dan Password wajib diisi.' });
  }
  
  const emailLower = email.toLowerCase().trim();
  
  // 1. Cek di local store
  const existsLocal = store.users.find(u => u.email.toLowerCase() === emailLower);
  
  // 2. Cek juga di Google Sheets (jika GAS configured)
  let existsInSheets = false;
  if (store.gasUrl) {
    try {
      const response = await fetch(store.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'checkEmailExists', 
          email: emailLower 
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        existsInSheets = result.exists || false;
        console.log('[Register] Email check GAS result:', result);
      }
    } catch (err) {
      console.error('[Register] Failed to check email in GAS:', err);
    }
  }
  
  // Reject jika email sudah ada di mana saja
  if (existsLocal || existsInSheets) {
    console.log('[Register] Email sudah terdaftar:', emailLower);
    return res.status(400).json({ 
      error: 'Email sudah terdaftar di sistem. Silakan login atau gunakan email lain.' 
    });
  }
  
  // Generate 6 digit OTP Verification
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newUser: User = {
    id: 'u-' + Math.random().toString(36).substr(2, 9),
    name,
    email: emailLower,
    role: (role as UserRole) || 'pelapor',
    isVerified: false,
    password,
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
  
  res.json({
    success: true,
    message: 'Registrasi berhasil. Kode verifikasi telah dikirim.',
    email: newUser.email,
    sandboxOTP: verificationCode,
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

  // Enforce authentic password matchcheck (fallback to man2plg123 for legacy seeded accounts)
  const expectedPassword = user.password || 'man2plg123';
  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Kata sandi tidak sesuai. Silakan coba lagi.' });
  }

  // Success login
  res.json({ success: true, user });
});

// Password & Notification Routes

app.post('/api/auth/change-password', (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Kredensial tidak lengkap.' });
  }
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  const expectedPassword = user.password || 'man2plg123';
  if (oldPassword !== expectedPassword) {
    return res.status(400).json({ error: 'Kata sandi lama salah.' });
  }
  user.password = newPassword;
  saveStore();
  return res.json({ success: true, message: 'Kata sandi berhasil diubah.' });
});

app.post('/api/auth/forgot-password-request', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi.' });
  }
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'Alamat email tidak terdaftar di sistem.' });
  }

  // Generate 6 digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  saveStore();

  // Send email if configured, or fallback
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
      <h2 style="color: #047857; margin-top: 0; font-weight: 800;">Pemulihan Kata Sandi Akun - EDUMAS MAN 2</h2>
      <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: bold; margin-bottom: 12px;">Dinas Layanan Pengaduan Madrasah Unggulan</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="font-size: 14px; color: #475569;">Yth. Bapak/Ibu/Sdr/i <b>${user.name}</b>,</p>
      <p style="font-size: 14px; color: #475569;">Kami menerima permintaan pengaturan ulang kata sandi. Silakan gunakan Kode OTP pemulihan di bawah ini untuk mengisi formulir reset sandi Anda:</p>
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; text-align: center; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.3em; color: #166534; font-family: monospace;">${resetCode}</span>
      </div>
      <p style="font-size: 12px; color: #ef4444; font-weight: bold; margin-bottom: 4px;">Penting:</p>
      <p style="font-size: 12px; color: #64748b; margin-top: 0; line-height: 1.5;">Jangan bagikan kode OTP ini ke siapapun termasuk staf EDUMAS. Kode Anda berlaku selama 30 menit. Jika ini bukan tindakan Anda, silakan ubah kata sandi lama atau abaikan pesan ini.</p>
    </div>
  `;
  await sendNotificationEmail(user.email, '[EDUMAS MAN 2] Atur Ulang Kata Sandi Akun', htmlContent);

  return res.json({
    success: true,
    message: 'Kode OTP pemulihan kata sandi telah dikirim ke email.',
    sandboxOTP: resetCode
  });
});

app.post('/api/auth/forgot-password-reset', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Kredensial reset tidak lengkap.' });
  }
  const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return res.status(404).json({ error: 'User tidak terdaftar.' });
  }
  if (!user.resetCode || user.resetCode !== code.trim()) {
    return res.status(400).json({ error: 'Kode OTP pemulihan salah / kadaluarsa.' });
  }

  user.password = newPassword;
  delete user.resetCode;
  saveStore();
  return res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
});

// Admin Account Monitoring and Management
app.get('/api/admin/users', (req, res) => {
  // Return waka and ketua tim accounts, plus any other registered users if wanted, for oversight
  res.json(store.users);
});

app.post('/api/admin/change-user-password', (req, res) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Data tidak lengkap.' });
  }
  const targetUser = store.users.find(u => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Akun petugas tidak ditemukan.' });
  }
  targetUser.password = newPassword;
  saveStore();
  return res.json({ success: true, message: `Kata sandi akun ${targetUser.name} berhasil diperbarui.` });
});

app.post('/api/admin/update-user', (req, res) => {
  const { userId, name, email, password } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID wajib diisi.' });
  }
  const targetUser = store.users.find(u => u.id === userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Akun petugas tidak ditemukan.' });
  }
  if (name) targetUser.name = name;
  if (email) targetUser.email = email.toLowerCase().trim();
  if (password) targetUser.password = password;
  saveStore();
  return res.json({ success: true, message: `Data akun ${targetUser.name} berhasil diperbarui.` });
});

app.get('/api/notifications', (req, res) => {
  res.json(store.notifications || []);
});

app.post('/api/notifications/mark-read', (req, res) => {
  const { id } = req.body;
  if (store.notifications) {
    const ni = store.notifications.find(n => n.id === id);
    if (ni) {
      ni.read = true;
      saveStore();
    }
  }
  res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  if (store.notifications) {
    store.notifications.forEach(n => { n.read = true; });
    saveStore();
  }
  res.json({ success: true });
});

// Complaints Routes

app.get('/api/complaints', (req, res) => {
  // Let's retrieve lists
  res.json(store.complaints);
});

app.delete('/api/complaints/:id', (req, res) => {
  const complaintId = req.params.id;
  const complaintIndex = store.complaints.findIndex(c => c.id === complaintId);
  if (complaintIndex === -1) {
    return res.status(404).json({ error: 'Pengaduan tidak ditemukan.' });
  }
  store.complaints.splice(complaintIndex, 1);
  store.logs = store.logs.filter(l => l.complaintId !== complaintId);
  if (store.notifications) {
    store.notifications = store.notifications.filter(n => n.complaintId !== complaintId);
  }
  saveStore();
  return res.json({ success: true, message: 'Laporan pengaduan berhasil dihapus beserta log kegiatannya.' });
});

app.get('/api/complaints/:id/logs', (req, res) => {
  const complaintId = req.params.id;
  const filteredLogs = store.logs.filter(l => l.complaintId === complaintId);
  res.json(filteredLogs);
});

app.get('/api/logs', (req, res) => {
  res.json(store.logs || []);
});

function getDepartmentFromSubCategory(subCategory: string): Department {
  switch (subCategory) {
    case 'Proses Belajar Mengajar':
    case 'Pendaftaran & Layanan Akademik':
    case 'Kalender Pendidikan & Ujian':
      return 'Kurikulum';
    case 'Fasilitas Kelas & Sarpras':
    case 'Fasilitas Rusak / Sarpras Tidak Layak':
    case 'Kualitas Makan / Kantin Madrasah':
      return 'Sarana Prasarana';
    case 'Kegiatan Ekstrakurikuler':
    case 'Perundungan (Bullying / Cyber-bullying)':
    case 'Kedisiplinan & Tata Tertib Siswa':
      return 'Kesiswaan';
    case 'Dana BOS & Sumbangan Komite':
    case 'Pungutan Liar (Pungli)':
      return 'Kaur TU';
    case 'Kekerasan Fisik / Verbal oleh Staf/Siswa':
    case 'Lainnya (Pelanggaran Kode Etik)':
      return 'Keamanan';
    case 'Lainnya':
    default:
      return 'Humas';
  }
}

app.post('/api/complaints', async (req, res) => {
  const { pelaporName, pelaporEmail, category, subCategory, title, description, anonymous, supportingEvidence, supportingEvidenceName } = req.body;

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
    supportingEvidence,
    supportingEvidenceName,
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

  // Trigger Notifications for Admin
  await createNotification({
    targetRole: 'admin',
    title: 'Ada Pengaduan Baru Masuk',
    message: `Pengaduan baru "${newComplaint.title}" (${newComplaint.category} - ${newComplaint.subCategory}) dengan No. Tiket ${newComplaint.ticketNumber} telah dikirimkan oleh pelapor ${newComplaint.pelaporName}. Silakan beralih ke panel untuk meninjau detail.`,
    type: 'complaint',
    complaintId: newComplaint.id
  });

  // Auto detect related department (Waka Bidang) based on subcategory
  const estimatedDept = getDepartmentFromSubCategory(newComplaint.subCategory);

  // Trigger Notifications for the related Department (Bidang)
  await createNotification({
    targetRole: 'bidang',
    targetDept: estimatedDept,
    title: `Notifikasi Laporan Masuk Terkait Bidang ${estimatedDept}`,
    message: `Laporan baru bertema "${newComplaint.title}" (${newComplaint.category} - ${newComplaint.subCategory}) dengan No. Tiket ${newComplaint.ticketNumber} telah diterima. Laporan ini dideteksi relevan dengan bidang tugas Anda. Harap bersiap menunggu penelaahan dan disposisi tugas investigasi resmi dari Admin.`,
    type: 'complaint',
    complaintId: newComplaint.id
  });

  // Sync to GAS sheets
  const gasResult = await syncToGAS('addComplaint', { complaint: newComplaint, log: newLog });
  if (gasResult && gasResult.success && gasResult.complaint && gasResult.complaint.supportingEvidence) {
    // If GAS uploaded base64 to Google Drive and returned the URL,
    // update local state and file store to keep things tiny and fast!
    newComplaint.supportingEvidence = gasResult.complaint.supportingEvidence;
    const compInStore = store.complaints.find(c => c.id === newComplaint.id);
    if (compInStore) {
      compInStore.supportingEvidence = gasResult.complaint.supportingEvidence;
    }
    saveStore();
  }

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

    case 'REASSIGN_DEPARTMENT': // Admin modifies/adjusts the assigned department
      complaint.assignedDepartment = assignedDepartment as Department;
      complaint.departmentResponse = ''; // clear any existing outdated response draft
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

  // Dispatch Role & Pelapor-specific Notifications
  try {
    switch (action) {
      case 'KLASIFIKASI_JAWAB_INFO':
        if (complaint.pelaporEmail) {
          await createNotification({
            title: 'Jawaban Langsung Informasi Dirilis',
            message: `Halo ${complaint.pelaporName || 'Pelapor'}, pengaduan informasi Anda dengan No. Tiket: ${complaint.ticketNumber} ("${complaint.title}") telah dijawab oleh Admin: "${complaint.directInfoAnswer}"`,
            type: 'status_change',
            complaintId: complaint.id,
            userId: store.users.find((u) => u.email.toLowerCase() === complaint.pelaporEmail.toLowerCase())?.id,
          });
        }
        break;

      case 'KLASIFIKASI_TERUSKAN':
        await createNotification({
          targetRole: 'bidang',
          targetDept: complaint.assignedDepartment,
          title: `Disposisi Pengaduan Baru: Bidang ${complaint.assignedDepartment}`,
          message: `Pengaduan baru No. Tiket ${complaint.ticketNumber} ("${complaint.title}") telah didisposisikan ke Bidang ${complaint.assignedDepartment}. Silakan lakukan investigasi lapangan dan berikan draf respons tanggapan.`,
          type: 'complaint',
          complaintId: complaint.id,
        });
        break;

      case 'INPUT_TANGGAPAN_BIDANG':
        await createNotification({
          targetRole: 'ketuatim',
          title: `Draf Tanggapan Bidang ${complaint.assignedDepartment} Masuk`,
          message: `Bidang ${complaint.assignedDepartment} selesai merespons Pengaduan No. Tiket ${complaint.ticketNumber} (${complaint.title}). Harap Ketua Tim segera meninjau dan menyetujui tanggapan ini.`,
          type: 'status_change',
          complaintId: complaint.id,
        });
        await createNotification({
          targetRole: 'admin',
          title: `Draf Tanggapan Bidang ${complaint.assignedDepartment} Masuk`,
          message: `Bidang ${complaint.assignedDepartment} telah merespons Pengaduan No. Tiket ${complaint.ticketNumber}. Status menunggu evaluasi Ketua Tim.`,
          type: 'status_change',
          complaintId: complaint.id,
        });
        break;

      case 'SETUJUI_KETUA_TIM':
        await createNotification({
          targetRole: 'admin',
          title: 'Format Tanggapan Disetujui Ketua Tim',
          message: `Ketua Tim telah menyetujui draf investigasi untuk No. Tiket ${complaint.ticketNumber} ("${complaint.title}"). Silakan Admin rilis tanggapan resmi.`,
          type: 'status_change',
          complaintId: complaint.id,
        });
        break;

      case 'TOLAK_KETUA_TIM':
        await createNotification({
          targetRole: 'bidang',
          targetDept: complaint.assignedDepartment,
          title: 'Draf Tanggapan Ditolak / Direvisi',
          message: `Draf tanggapan Bidang ${complaint.assignedDepartment} untuk No. Tiket ${complaint.ticketNumber} ("${complaint.title}") ditolak Ketua Tim dengan catatan: "${notes || 'Memerlukan investigasi lebih lanjut.'}". Harap direvisi secepatnya.`,
          type: 'status_change',
          complaintId: complaint.id,
        });
        break;

      case 'FINALISASI_ADMIN':
        if (complaint.pelaporEmail) {
          await createNotification({
            title: 'Tanggapan Resmi Pengaduan Dirilis!',
            message: `Yth. ${complaint.pelaporName || 'Pelapor'}, pengaduan Anda No. Tiket ${complaint.ticketNumber} ("${complaint.title}") telah selesai ditangani. Jawaban resmi: "${complaint.finalAnswer}". Terima kasih telah turut mengawal lingkungan madrasah kami.`,
            type: 'status_change',
            complaintId: complaint.id,
            userId: store.users.find((u) => u.email.toLowerCase() === complaint.pelaporEmail.toLowerCase())?.id,
          });
        }
        break;
    }
  } catch (err) {
    console.error('Failed to trigger state action notifications:', err);
  }

  // Sync to GAS sheets
  const gasUpdateResult = await syncToGAS('updateComplaint', { complaint, log: newLog });
  if (gasUpdateResult && gasUpdateResult.success && gasUpdateResult.complaint && gasUpdateResult.complaint.supportingEvidence) {
    complaint.supportingEvidence = gasUpdateResult.complaint.supportingEvidence;
    saveStore();
  }

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