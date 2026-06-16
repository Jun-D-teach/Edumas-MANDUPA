/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'ketuatim' | 'bidang' | 'pelapor';

export type ComplaintStatus = 
  | 'PENDING'            // Baru masuk, menunggu klasifikasi Admin
  | 'INFO_ANSWERED'     // Langsung dijawab Admin (Kategori Informasi)
  | 'FORWARDED'         // Diteruskan ke Bidang Terkait oleh Admin
  | 'DEPT_RESPONDED'    // Ditanggapi oleh Bidang Terkait, menunggu persetujuan Ketua Tim
  | 'APPROVED'          // Disetujui oleh Ketua Tim, menunggu rilis final Admin
  | 'RESOLVED';         // Selesai ditanggapi dan dirilis ke pelapor (Pengaduan Terjawab)

export type Department = 'Kesiswaan' | 'Kurikulum' | 'Sarana Prasarana' | 'Humas' | 'Keamanan';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  verificationCode?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  pelaporName: string;
  pelaporEmail: string;
  category: 'Informasi' | 'Pengaduan Pelanggaran';
  subCategory: string; // e.g., Perundungan, Fasilitas, Kedisiplinan, Pungutan, dll.
  title: string;
  description: string;
  anonymous: boolean;
  status: ComplaintStatus;
  directInfoAnswer?: string; // Tanggapan langsung jika hanya berupa informasi
  departmentResponse?: string; // Tanggapan draf dari Bidang Terkait
  finalAnswer?: string; // Tanggapan akhir yang dikonfirmasi Admin dan dirilis
  assignedDepartment?: Department; // Bidang Terkait yang ditunjuk
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  complaintId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  notes: string;
  timestamp: string;
}

export interface GASConfig {
  url: string;
}
