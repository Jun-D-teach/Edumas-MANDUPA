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

export type Department = 'Kesiswaan' | 'Kurikulum' | 'Sarana Prasarana' | 'Humas' | 'Keamanan' | 'Kaur TU';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  password?: string;
  verificationCode?: string;
  resetCode?: string;
  whatsappNumber?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  pelaporName: string;
  pelaporEmail: string;
  category: string;
  subCategory: string;
  title: string;
  description: string;
  anonymous: boolean;
  status: ComplaintStatus;
  assignedDepartment?: Department;
  departmentResponse?: string;
  finalAnswer?: string;
  directInfoAnswer?: string;
  supportingEvidence?: string;
  supportingEvidenceName?: string;
  createdAt: string;
  updatedAt: string;
  
  // ✅ TAMBAHKAN FIELD INI untuk data pelapor lengkap
  pelaporNIK?: string;
  pelaporJenisKelamin?: string;
  pelaporAlamat?: string;
  pelaporASN?: string;
  pelaporNIP?: string;
  pelaporPekerjaan?: string;
  pelaporAlamatKantor?: string;
  pelaporTelp?: string;
  pelaporKTP?: string;
  pelaporKTPName?: string;
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

export interface KMNotification {
  id: string;
  userId?: string;          // Target user ID (optional)
  targetRole?: UserRole;    // Group check (e.g. notify all admin, ketuatim, or bidang)
  targetDept?: Department;  // Direct department targeting
  title: string;
  message: string;
  type: 'info' | 'complaint' | 'status_change';
  complaintId?: string;
  read: boolean;
  createdAt: string;
  sentEmail?: boolean;
  sentWA?: boolean;
}
