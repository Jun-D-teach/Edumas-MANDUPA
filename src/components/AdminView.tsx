/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Layers, Settings, FileSpreadsheet, Check, Send, AlertCircle, RefreshCw, MessageSquare, HelpCircle, ArrowRight, CornerDownRight, Printer, Calendar, Filter, FileText, Users, Key, Eye, Trash2, Edit3, History } from 'lucide-react';
import { Complaint, User, Department, ActivityLog } from '../types.js';
import { StatusBadge } from './RoleBadge.js';
import { ComplaintDetailModal } from './ComplaintDetailModal.js';
import { GASInstructions } from './GASInstructions.js';

interface AdminViewProps {
  user: User;
  complaints: Complaint[];
  onRefreshComplaints: () => Promise<void>;
  gasUrl: string;
  onUpdateGasUrl: (url: string) => Promise<boolean>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  user,
  complaints,
  onRefreshComplaints,
  gasUrl,
  onUpdateGasUrl
}) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'database' | 'report' | 'users'>('triage');
  const [editingUrl, setEditingUrl] = useState(gasUrl);
  const [savingUrl, setSavingUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Report configurations state
  const [reportStatus, setReportStatus] = useState<'ALL' | 'PENDING' | 'PROSES' | 'SELESAI'>('ALL');
  const [reportFilterType, setReportFilterType] = useState<'MONTH' | 'RANGE'>('MONTH');
  const [reportLayout, setReportLayout] = useState<'DETAIL' | 'TABLE'>('DETAIL');
  
  const currentDate = new Date();
  const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(currentDate.getFullYear());
  
  const [reportMonth, setReportMonth] = useState<string>(currentMonthStr);
  const [reportYear, setReportYear] = useState<string>(currentYearStr);
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // States for Waka & Ketua Tim account monitoring and password management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [usersNewPassword, setUsersNewPassword] = useState<string>('');
  const [usersNewName, setUsersNewName] = useState<string>('');
  const [usersNewEmail, setUsersNewEmail] = useState<string>('');
  const [updatingUsersPassword, setUpdatingUsersPassword] = useState<boolean>(false);
  const [usersMessage, setUsersMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // States for delete action & reassigning department/bidang
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingDeptComplaintId, setEditingDeptComplaintId] = useState<string | null>(null);
  const [selectedNewDept, setSelectedNewDept] = useState<Department>('Kesiswaan');
  const [reassigningDept, setReassigningDept] = useState<boolean>(false);

  // Classify fields
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedActionRecord, setSelectedActionRecord] = useState<Complaint | null>(null);
  const [classificationType, setClassificationType] = useState<'Informasi' | 'Pengaduan Pelanggaran'>('Pengaduan Pelanggaran');
  
  // Custom action inputs
  const [directInfoAnswer, setDirectInfoAnswer] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState<Department>('Kesiswaan');
  const [notes, setNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Final Publish fields
  const [activePublishRecord, setActivePublishRecord] = useState<Complaint | null>(null);
  const [finalPublishAnswer, setFinalPublishAnswer] = useState('');

  const departments: Department[] = ['Kesiswaan', 'Kurikulum', 'Sarana Prasarana', 'Humas', 'Keamanan', 'Kaur TU'];
  const MONTHS_LABEL_MAP: Record<string, string> = {
    'ALL': 'Semua Bulan',
    '01': 'Januari',
    '02': 'Februari',
    '03': 'Maret',
    '04': 'April',
    '05': 'Mei',
    '06': 'Juni',
    '07': 'Juli',
    '08': 'Agustus',
    '09': 'September',
    '10': 'Oktober',
    '11': 'November',
    '12': 'Desember'
  };

  const handleSaveGasUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUrl(true);
    setSaveSuccess(false);

    const success = await onUpdateGasUrl(editingUrl);
    setSavingUrl(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleClassifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActionRecord) return;
    setSubmittingAction(true);

    try {
      const payload: any = {
        actorName: user.name,
        actorRole: user.role,
        notes: notes || `Mengklarifikasi aduan ke jenis ${classificationType}.`
      };

      if (classificationType === 'Informasi') {
        payload.action = 'KLASIFIKASI_JAWAT_INFO'; // Wait, let's look at what server implements: KLASIFIKASI_JAWAB_INFO
        payload.action = 'KLASIFIKASI_JAWAB_INFO';
        payload.directInfoAnswer = directInfoAnswer;
        if (!directInfoAnswer) {
          alert('Berikan tanggapan informasi langsung terlebih dahulu.');
          setSubmittingAction(false);
          return;
        }
      } else {
        payload.action = 'KLASIFIKASI_TERUSKAN';
        payload.assignedDepartment = assignedDepartment;
      }

      const response = await fetch(`/api/complaints/${selectedActionRecord.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan klasifikasi.');
      }

      // Reset
      setSelectedActionRecord(null);
      setDirectInfoAnswer('');
      setNotes('');
      // Refresh
      await onRefreshComplaints();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFinalizePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePublishRecord) return;
    setSubmittingAction(true);

    try {
      const response = await fetch(`/api/complaints/${activePublishRecord.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FINALISASI_ADMIN',
          actorName: user.name,
          actorRole: user.role,
          finalAnswer: finalPublishAnswer || activePublishRecord.departmentResponse,
          notes: 'Mempublikasikan tanggapan pengaduan agar bisa dibaca oleh pelapor secara publik/transparan.'
        })
      });

      if (!response.ok) {
        throw new Error('Gagal merilis tanggapan.');
      }

      setActivePublishRecord(null);
      setFinalPublishAnswer('');
      await onRefreshComplaints();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Log batch fetcher for report compile
  const fetchAllLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/logs');
      if (response.ok) {
        const data = await response.json();
        setAllLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'report') {
      fetchAllLogs();
    }
  }, [activeTab, complaints]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUser = async (userId: string) => {
    if (!usersNewName.trim() || !usersNewEmail.trim() || !usersNewPassword.trim()) {
      alert('Semua data wajib diisi.');
      return;
    }
    setUpdatingUsersPassword(true);
    setUsersMessage(null);
    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId, 
          name: usersNewName.trim(), 
          email: usersNewEmail.trim().toLowerCase(), 
          password: usersNewPassword.trim() 
        })
      });
      const data = await response.json();
      if (response.ok) {
        setUsersMessage({ text: data.message || 'Profil akun sukses diperbarui!', type: 'success' });
        setEditingUserId(null);
        setUsersNewPassword('');
        setUsersNewName('');
        setUsersNewEmail('');
        await fetchUsers();
      } else {
        throw new Error(data.error || 'Gagal memperbarui data akun.');
      }
    } catch (err: any) {
      setUsersMessage({ text: err.message, type: 'error' });
    } finally {
      setUpdatingUsersPassword(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Pengaduan berhasil dihapus.');
        setConfirmDeleteId(null);
        await onRefreshComplaints();
      } else {
        throw new Error(data.error || 'Gagal menghapus pengaduan.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateComplaintDept = async (complaintId: string) => {
    setReassigningDept(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'REASSIGN_DEPARTMENT',
          actorName: user.name,
          actorRole: user.role,
          assignedDepartment: selectedNewDept,
          notes: `Admin dialihkan/didisposisikan ulang penugasan dari bidang lama ke Waka ${selectedNewDept === 'Kaur TU' ? 'Kaur TU' : selectedNewDept}`
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Berhasil mengalihkan disposisi bidang ke Waka ${selectedNewDept === 'Kaur TU' ? 'Kaur TU' : selectedNewDept}`);
        setEditingDeptComplaintId(null);
        await onRefreshComplaints();
      } else {
        throw new Error(data.error || 'Gagal mengalihkan bidang.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setReassigningDept(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'logs') {
      fetchAllLogs();
    }
  }, [activeTab]);

  const getFilteredComplaintsForReport = () => {
    return sortedComplaints.filter(c => {
      // 1. Status Filter
      if (reportStatus !== 'ALL') {
        const statusVal = c.status;
        if (reportStatus === 'PENDING') {
          if (statusVal !== 'PENDING') return false;
        } else if (reportStatus === 'PROSES') {
          if (statusVal !== 'FORWARDED' && statusVal !== 'DEPT_RESPONDED' && statusVal !== 'APPROVED') return false;
        } else if (reportStatus === 'SELESAI') {
          if (statusVal !== 'RESOLVED' && statusVal !== 'INFO_ANSWERED') return false;
        }
      }

      // 2. Date/Period Filter
      const compDate = new Date(c.createdAt);
      if (reportFilterType === 'MONTH') {
        if (reportYear !== 'ALL') {
          if (compDate.getFullYear().toString() !== reportYear) return false;
        }
        if (reportMonth !== 'ALL') {
          const compMonth = String(compDate.getMonth() + 1).padStart(2, '0');
          if (compMonth !== reportMonth) return false;
        }
      } else {
        if (reportStartDate) {
          const start = new Date(reportStartDate);
          start.setHours(0, 0, 0, 0);
          if (compDate < start) return false;
        }
        if (reportEndDate) {
          const end = new Date(reportEndDate);
          end.setHours(23, 59, 59, 999);
          if (compDate > end) return false;
        }
      }

      return true;
    });
  };

  // Sort complaints newest first
  const sortedComplaints = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6" id="admin-view-hub">
      
      {/* Sub menu tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('triage')}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs md:text-sm font-bold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === 'triage' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Layers className="w-4 h-4" />
          Triage Laporan ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs md:text-sm font-bold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === 'report' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Printer className="w-4 h-4" />
          Cetak Laporan & Rekapitulasi
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs md:text-sm font-bold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === 'database' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Settings className="w-4 h-4" />
          Koneksi Google Sheets
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs md:text-sm font-bold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === 'users' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Users className="w-4 h-4" />
          Manajemen Petugas
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs md:text-sm font-bold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === 'logs' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <History className="w-4 h-4" />
          Riwayat Kegiatan
        </button>
      </div>

      {activeTab === 'triage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 align-start">
          
          {/* Complaints list */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Meja Kerja Admisi Pengaduan</h3>
                <p className="text-xs text-slate-400">Pilah, klasifikasi, kaitkan, dan respon aduan baru</p>
              </div>
              <button
                onClick={onRefreshComplaints}
                className="p-1 px-3 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Segarkan
              </button>
            </div>

            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              {sortedComplaints.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border text-slate-400">
                  Belum ada laporan masuk saat ini.
                </div>
              ) : (
                sortedComplaints.map((c) => (
                  <div
                    key={c.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow ${selectedActionRecord?.id === c.id || activePublishRecord?.id === c.id ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/10' : 'border-slate-200'}`}
                    id={`triage-complaint-card-${c.id}`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-black text-slate-600 select-all">
                          {c.ticketNumber}
                        </span>
                        <span className="text-slate-400 font-medium">| {new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm mb-1.5">{c.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4">{c.description}</p>

                    {/* Department / Bidang Info and Reassignment */}
                    {c.assignedDepartment && (
                      <div className="mb-4 text-xs bg-indigo-50/40 p-2.5 border border-indigo-100 rounded-xl flex flex-col gap-2 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium font-sans">Bidang Penyelidikan:</span>
                            <span className="font-extrabold text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150">
                              Waka {c.assignedDepartment === 'Kaur TU' ? 'Kaur TU' : c.assignedDepartment}
                            </span>
                          </div>
                          {c.status !== 'RESOLVED' && c.status !== 'INFO_ANSWERED' && (
                            <button
                              onClick={() => {
                                setEditingDeptComplaintId(editingDeptComplaintId === c.id ? null : c.id);
                                setSelectedNewDept(c.assignedDepartment || 'Kesiswaan');
                              }}
                              className="text-[10px] text-indigo-650 hover:text-indigo-800 font-bold bg-white border border-slate-250 px-2 py-1 rounded-md transition cursor-pointer"
                            >
                              {editingDeptComplaintId === c.id ? 'Batal' : 'Ubah Bidang'}
                            </button>
                          )}
                        </div>

                        {editingDeptComplaintId === c.id && (
                          <div className="bg-white p-2.5 rounded-lg border border-indigo-100/80 space-y-2 animate-fade-in text-[11px]">
                            <span className="font-bold text-slate-700 block">Alihkan Bidang Terkait:</span>
                            <div className="flex gap-2">
                              <select
                                value={selectedNewDept}
                                onChange={(e) => setSelectedNewDept(e.target.value as Department)}
                                className="flex-1 text-[11px] font-medium border border-slate-200 bg-white rounded p-1 text-slate-800 focus:outline-none"
                              >
                                {departments.map((dept) => (
                                  <option key={dept} value={dept}>
                                    Waka {dept === 'Kaur TU' ? 'Kaur TU' : dept}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleUpdateComplaintDept(c.id)}
                                disabled={reassigningDept}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer disabled:opacity-50"
                              >
                                {reassigningDept ? 'Menyimpan...' : 'Simpan'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-250/50 text-xs">
                      <div className="text-slate-400 font-medium">
                        Pengirim:{' '}
                        {c.anonymous ? (
                          <span className="text-rose-500 font-bold">Anonim</span>
                        ) : (
                          <span className="text-slate-600">{c.pelaporName}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 font-bold text-[11px] text-slate-700 cursor-pointer"
                        >
                          Kronologi
                        </button>

                        {/* Hapus Pengaduan Action with Confirmation */}
                        {confirmDeleteId === c.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-lg p-1 animate-fade-in text-[10px]">
                            <span className="font-bold text-rose-800 px-1 font-sans">Hapus?</span>
                            <button
                              onClick={() => handleDeleteComplaint(c.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="px-2.5 py-1.5 rounded bg-rose-50 hover:bg-rose-100 font-bold text-[11px] text-rose-700 cursor-pointer flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}

                        {/* Step 3 Action: Klasifikasi */}
                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              if (selectedActionRecord?.id === c.id) {
                                setSelectedActionRecord(null);
                              } else {
                                setSelectedActionRecord(c);
                                setActivePublishRecord(null);
                                setNotes('');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm cursor-pointer transition-all"
                          >
                            {selectedActionRecord?.id === c.id ? 'Tutup Form' : 'Klasifikasi / SOP 3'}
                          </button>
                        )}

                        {/* Step 6 Action: Finalize approved department responses */}
                        {c.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              if (activePublishRecord?.id === c.id) {
                                setActivePublishRecord(null);
                              } else {
                                setActivePublishRecord(c);
                                setSelectedActionRecord(null);
                                setFinalPublishAnswer(c.departmentResponse || '');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm cursor-pointer transition-all"
                          >
                            {activePublishRecord?.id === c.id ? 'Tutup Form' : 'Rilis Tanggapan / SOP 6'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline SOP 3: Klasifikasi Aduan Block */}
                    {selectedActionRecord?.id === c.id && (
                      <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50/5 rounded-xl space-y-4 animate-fade-in text-xs">
                        <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <h5 className="font-bold text-slate-800 text-xs">
                            SOP 3: Formulir Klasifikasi Tiket ({c.ticketNumber})
                          </h5>
                        </div>

                        <form onSubmit={handleClassifySubmit} className="space-y-4">
                          <div>
                            <label className="block font-bold text-slate-600 mb-2">
                              Tentukan Hasil Klasifikasi Tiket:
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setClassificationType('Pengaduan Pelanggaran')}
                                className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${classificationType === 'Pengaduan Pelanggaran' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                              >
                                Pengaduan Pelanggaran
                              </button>
                              <button
                                type="button"
                                onClick={() => setClassificationType('Informasi')}
                                className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${classificationType === 'Informasi' ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                              >
                                Hanya Informasi / Tanya
                              </button>
                            </div>
                          </div>

                          {classificationType === 'Informasi' ? (
                            <div className="space-y-3 p-3 bg-sky-50/50 border border-sky-100 rounded-xl animate-fade-in">
                              <div className="text-slate-500 text-[11px] leading-relaxed">
                                <b>💡 Solusi Cepat (Informasi):</b> Anda (Admin) dapat langsung menjawab & merilis jawaban kepada pelapor tanpa perlu melibatkan Waka/Bidang Terkait.
                              </div>
                              <div>
                                <label className="block font-bold text-slate-600 mb-1.5">
                                  Tulis Jawaban Informasi Resmi:
                                </label>
                                <textarea
                                  rows={4}
                                  value={directInfoAnswer}
                                  onChange={(e) => setDirectInfoAnswer(e.target.value)}
                                  placeholder="Tuliskan petunjuk / jawaban resmi sejelas mungkin..."
                                  className="w-full text-xs border border-slate-200 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                                  required
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-fade-in">
                              <div className="text-slate-500 text-[11px] leading-relaxed">
                                <b>💡 Penyeledikan Disposisi (Pengaduan):</b> Laporan ini akan dipindahkan secara rahasia ke dashboard Bidang Terkait untuk divalidasi dan ditanggapi.
                              </div>
                              <div>
                                <label className="block font-bold text-slate-700 mb-1.5">
                                  Tunjuk Bidang Utama Penanggung Jawab:
                                </label>
                                <select
                                  value={assignedDepartment}
                                  onChange={(e: any) => setAssignedDepartment(e.target.value)}
                                  className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                  {departments.map((dept) => (
                                    <option key={dept} value={dept}>{dept === 'Kaur TU' ? 'Kaur TU' : `Waka Bidang ${dept}`}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">
                              Catatan Riwayat Log Tambahan (Opsional):
                            </label>
                            <input
                              type="text"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Dokumen pelengkap valid / sanksi disposisi awal..."
                              className="w-full border border-slate-200 p-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedActionRecord(null)}
                              className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer"
                            >
                              Batalkan
                            </button>
                            <button
                              type="submit"
                              disabled={submittingAction}
                              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                            >
                              {submittingAction ? 'Menyimpan...' : 'Kirim Klasifikasi'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Inline SOP 6: Finalize/Publish Response Block */}
                    {activePublishRecord?.id === c.id && (
                      <div className="mt-4 p-4 border border-indigo-200 bg-indigo-50/5 rounded-xl space-y-4 animate-fade-in text-xs">
                        <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                          <Check className="w-4 h-4 text-indigo-700" />
                          <h5 className="font-bold text-slate-800 text-xs">
                            SOP 6: Form Rilis Jawaban Resmi ({c.ticketNumber})
                          </h5>
                        </div>

                        <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-1">
                          <div className="font-bold text-indigo-900 text-[11px]">Draf Hasil Investigasi Bidang ({c.assignedDepartment}):</div>
                          <p className="italic text-slate-600 font-medium">"{c.departmentResponse}"</p>
                        </div>

                        <form onSubmit={handleFinalizePublishSubmit} className="space-y-4">
                          <div>
                            <label className="block font-bold text-slate-600 mb-1.5">
                              Tinjau / Sesuaikan Redaksi Jawaban yang Dikirim ke Pelapor:
                            </label>
                            <textarea
                              rows={4}
                              value={finalPublishAnswer}
                              onChange={(e) => setFinalPublishAnswer(e.target.value)}
                              placeholder="Konfirmasi rumusan penyelesaian..."
                              className="w-full text-xs border border-slate-200 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                              required
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setActivePublishRecord(null)}
                              className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={submittingAction}
                              className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all cursor-pointer"
                            >
                              {submittingAction ? 'Merilis...' : 'Rilis & Tutup Pengaduan'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Live Statistics & EDUMAS SOP Steps */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  Statistik Penanganan Real-Time
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Pemantauan distribusi laporan terdaftar di database</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="bg-slate-50 border p-3 rounded-xl text-center">
                  <div className="text-xl font-black text-slate-800">{complaints.length}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Aduan</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                  <div className="text-xl font-black text-amber-700">
                    {complaints.filter(c => c.status === 'PENDING').length}
                  </div>
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wide">Baru / Pending</div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center">
                  <div className="text-xl font-black text-indigo-700">
                    {complaints.filter(c => c.status === 'FORWARDED' || c.status === 'DEPT_RESPONDED').length}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Penyelidikan</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                  <div className="text-xl font-black text-emerald-850">
                    {complaints.filter(c => c.status === 'RESOLVED' || c.status === 'INFO_ANSWERED').length}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Selesai</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-xs font-bold text-slate-700">Skema Prosedur Operasional (SOP):</div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">3</span>
                    <span className="font-medium"><b>SOP 3 (Admin):</b> Mengklasifikasi aduan baru atau langsung menjawabnya jika sekedar info.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px]">4</span>
                    <span className="font-medium"><b>SOP 4 (Bidang/Waka):</b> Melakukan kroscek lapangan, mediasi sanksi/pembinaan & input draf penyelesaian.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-amber-100 text-amber-800 font-black text-[10px]">5</span>
                    <span className="font-medium"><b>SOP 5 (Ketua Tim/Kepsek):</b> Mengesahkan kelayakan draf perbaikan atau merujuk revisi.</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 font-black text-[10px]">6</span>
                    <span className="font-medium"><b>SOP 6 (Admin):</b> Mempublikasikan tanggapan final agar terbaca secara publik.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-xs space-y-2 leading-relaxed">
              <span className="font-bold text-slate-700 block">Keterangan Penanganan Laporan:</span>
              <p className="text-slate-500 text-[11px]">
                Untuk merespons pengaduan, klik tombol <span className="text-emerald-700 font-bold">"Klasifikasi / SOP 3"</span> pada daftar laporan pending. Form tindakan interaktif akan mengembang langsung di dalam kartu laporan Anda agar penanganan lebih cepat dan bebas bug visual di layar sempit.
              </p>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="space-y-6" id="report-view-hub">
          {/* Injecting CSS print rule directly for full page takeover during browser print */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-report-area, #printable-report-area * {
                visibility: visible !important;
                color: black !important;
                background-color: transparent !important;
              }
              #printable-report-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
              }
              .no-print-break {
                page-break-inside: avoid !important;
              }
            }
          `}} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start align-start">
            
            {/* COLUMN 1: CONTROLS & FILTERING PANEL */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 print:hidden">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  Konfigurasi Penyaringan Laporan
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Saring data sesuai status aduan & tanggal/bulan masuk</p>
              </div>

              {/* Format Tampilan Selector */}
              <div className="space-y-2 bg-emerald-50/45 border border-emerald-100 p-3.5 rounded-xl">
                <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  Format Tata Letak Cetak:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportLayout('DETAIL')}
                    className={`p-2 rounded-lg border text-[11px] text-center font-bold transition-all cursor-pointer ${reportLayout === 'DETAIL' ? 'border-emerald-600 bg-white text-emerald-800 shadow-xs' : 'border-slate-200 bg-white/40 hover:bg-white text-slate-600'}`}
                  >
                    Detail Rinci Laporan
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportLayout('TABLE')}
                    className={`p-2 rounded-lg border text-[11px] text-center font-bold transition-all cursor-pointer ${reportLayout === 'TABLE' ? 'border-emerald-600 bg-white text-emerald-800 shadow-xs' : 'border-slate-200 bg-white/40 hover:bg-white text-slate-600'}`}
                  >
                    Tabel Rekapitulasi
                  </button>
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Filter Status Aduan:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'ALL', label: 'Semua Status' },
                    { val: 'PENDING', label: 'Baru / Pending' },
                    { val: 'PROSES', label: 'Penyelidikan' },
                    { val: 'SELESAI', label: 'Selesai / Terjawab' }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setReportStatus(btn.val as any)}
                      className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${reportStatus === btn.val ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Type Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Jenis Filter Waktu:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportFilterType('MONTH')}
                    className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${reportFilterType === 'MONTH' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    Bulan & Tahun
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFilterType('RANGE')}
                    className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${reportFilterType === 'RANGE' ? 'border-indigo-600 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    Rentang Tanggal
                  </button>
                </div>
              </div>

              {/* Month/Year input */}
              {reportFilterType === 'MONTH' ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Pilih Bulan:</label>
                    <select
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 bg-white p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ALL">Semua Bulan</option>
                      <option value="01">Januari</option>
                      <option value="02">Februari</option>
                      <option value="03">Maret</option>
                      <option value="04">April</option>
                      <option value="05">Mei</option>
                      <option value="06">Juni</option>
                      <option value="07">Juli</option>
                      <option value="08">Agustus</option>
                      <option value="09">September</option>
                      <option value="10">Oktober</option>
                      <option value="11">November</option>
                      <option value="12">Desember</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Pilih Tahun:</label>
                    <select
                      value={reportYear}
                      onChange={(e) => setReportYear(e.target.value)}
                      className="w-full text-xs font-bold border border-slate-200 bg-white p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ALL">Semua Tahun</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Tanggal Mulai:</label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 bg-white p-1.5 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-slate-500">Tanggal Selesai:</label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 bg-white p-1.5 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* ACTION: TRIGGER PRINT */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-heavy transition-all rounded-xl py-3 text-xs font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen Sekarang (PDF)
              </button>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px] text-slate-500 leading-relaxed">
                <div className="font-bold text-slate-700">💡 Petunjuk Percetakan Sukses:</div>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Saring data via kontrol di atas; preview cetakan ter-update otomatis.</li>
                  <li>Pastikan opsi <b>"Cetak Grafik Latar Belakang / Background Graphics"</b> tercentang pada dialog cetak browser Anda.</li>
                  <li>Disarankan mematikan **"Header dan Kaki / Headers and Footers"** di setelan cetak agar tata letak Kop Surat resmi tampak selaras.</li>
                </ul>
              </div>

            </div>

            {/* COLUMN 2: REAL-TIME DOCUMENT PREVIEW */}
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between px-1 print:hidden">
                <span>Dokumen Lembaran Hasil Filter (Siap Cetak):</span>
                <span>Terfilter: {getFilteredComplaintsForReport().length} Aduan</span>
              </div>

              {/* Paper Layout */}
              <div
                id="printable-report-area"
                className="bg-white border text-black border-slate-200 rounded-2xl p-8 shadow-md font-sans space-y-6 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible"
              >
                
                {/* 1. KOP SURAT MADRASAH ALIYAH NEGERI 2 PALEMBANG */}
                <div className="flex items-center gap-5 border-b-0 pb-1">
                  <img
                    src="/api/logo.svg"
                    className="w-20 h-20 object-contain shrink-0"
                    alt="Logo MAN 2 Palembang"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-center md:text-left flex-1 space-y-0.5">
                    <h4 className="text-xs font-bold tracking-wider text-slate-800 uppercase">Kementerian Agama Republik Indonesia</h4>
                    <h4 className="text-[10px] font-bold tracking-tight text-slate-600 uppercase">Kantor Kementerian Agama Kota Palembang</h4>
                    <h3 className="text-base font-black tracking-tight text-emerald-800 uppercase">Madrasah Aliyah Negeri 2 Kota Palembang</h3>
                    <p className="text-[10px] font-semibold text-slate-500 italic">Akreditasi A Plus Unggulan Akademik, Keagamaan & Karakter Mulia</p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Jl. Lapangan Hatta No. 80, Palembang, Sumatera Selatan 30121 | Telp: (0711) 351182 | Web: www.man2palembang.sch.id
                    </p>
                  </div>
                </div>

                {/* DOUBLE LINE SEPARATOR */}
                <div className="space-y-[2px] select-none">
                  <div className="border-t-[3px] border-black w-full"></div>
                  <div className="border-t-[1px] border-black w-full"></div>
                </div>

                {/* DOCUMENT TITLE */}
                <div className="text-center space-y-1 py-1">
                  <h2 className="text-sm font-black tracking-wide text-slate-850 uppercase">
                    Laporan Rekapitulasi Penanganan Pengaduan Layanan Masyarakat (EDUMAS)
                  </h2>
                  <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                    Portal Penyelidikan, Tindakan Disposisi & Rilis Keputusan Terpusat
                  </p>
                </div>

                {/* CRITERIA METADATA GRID */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-[11px] border border-slate-200/60 leading-normal">
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-400 font-medium">Kriteria Status Aduan:</span>{' '}
                      <span className="font-bold text-slate-850 block">
                        {reportStatus === 'ALL' && 'Semua Status Laporan (Triage, Penyelidikan, Selesai)'}
                        {reportStatus === 'PENDING' && 'Baru Masuk / Pending (Menunggu Triage Admin)'}
                        {reportStatus === 'PROSES' && 'Sedang Diinvestigasi / Penyelidikan Bidang & Direview'}
                        {reportStatus === 'SELESAI' && 'Selesai Ditangani / Terjawab & Publik'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Petugas Pembuat Rekap:</span>{' '}
                      <span className="font-bold text-slate-850 block">{user.name} (Administrator MAN 2)</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <div>
                      <span className="text-slate-400 font-medium">Periode Filter Laporan:</span>{' '}
                      <span className="font-bold text-slate-850 block">
                        {reportFilterType === 'MONTH' ? (
                          <>
                            {reportMonth === 'ALL' ? 'Semua Bulan' : MONTHS_LABEL_MAP[reportMonth] || reportMonth} {reportYear === 'ALL' ? 'Semua Tahun' : reportYear}
                          </>
                        ) : (
                          <>
                            {reportStartDate ? new Date(reportStartDate).toLocaleDateString('id-ID') : 'Awal'} s.d. {reportEndDate ? new Date(reportEndDate).toLocaleDateString('id-ID') : 'Akhir'}
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Waktu Unduh / Cetak:</span>{' '}
                      <span className="font-bold text-slate-850 block font-mono text-[10px]">
                        {new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* QUANTITATIVE STATISTICAL TABLE */}
                <div className="grid grid-cols-4 gap-3 text-center text-[10px] font-semibold leading-none">
                  <div className="border border-slate-200 p-2 rounded-lg bg-slate-50">
                    <div className="text-xs font-black text-slate-800">{getFilteredComplaintsForReport().length}</div>
                    <div className="text-[9px] text-slate-550 uppercase tracking-wide mt-1">Total Cocok</div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-lg bg-amber-50/40">
                    <div className="text-xs font-black text-amber-700">
                      {getFilteredComplaintsForReport().filter(c => c.status === 'PENDING').length}
                    </div>
                    <div className="text-[9px] text-amber-600 uppercase tracking-wide mt-1">Pending</div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-lg bg-indigo-50/40">
                    <div className="text-xs font-black text-indigo-700">
                      {getFilteredComplaintsForReport().filter(c => c.status === 'FORWARDED' || c.status === 'DEPT_RESPONDED' || c.status === 'APPROVED').length}
                    </div>
                    <div className="text-[9px] text-indigo-600 uppercase tracking-wide mt-1">Penyelidikan</div>
                  </div>
                  <div className="border border-slate-200 p-2 rounded-lg bg-emerald-50/40">
                    <div className="text-xs font-black text-emerald-800">
                      {getFilteredComplaintsForReport().filter(c => c.status === 'RESOLVED' || c.status === 'INFO_ANSWERED').length}
                    </div>
                    <div className="text-[9px] text-emerald-600 uppercase tracking-wide mt-1">Selesai</div>
                  </div>
                </div>

                 {/* THE COMPLETE LIST OF PRINTABLE DOSSIERS OR SUMMARY TABLE */}
                <div className="space-y-6">
                  {getFilteredComplaintsForReport().length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 text-slate-400 text-xs rounded-xl font-medium">
                      Negasi Hasil: Tidak ada data aduan yang cocok dengan variabel filter di samping.
                    </div>
                  ) : reportLayout === 'TABLE' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse border border-slate-350 bg-white">
                        <thead>
                          <tr className="bg-slate-100/80 border-b-2 border-slate-350">
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800 text-center w-10">No</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800">Kode Lapor</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800">Pelapor</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800">Metodologi Laporan</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800">Topik & Judul Rekap</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800 text-center">Bidang Terkait</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800 text-center">Status Laporan</th>
                            <th className="p-3 border border-slate-350 font-extrabold text-slate-800 text-center">Tanggal Masuk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredComplaintsForReport().map((c, idx) => (
                            <tr key={c.id} className="hover:bg-slate-50/40 border-b border-slate-250 page-break-inside-avoid">
                              <td className="p-3 border border-slate-350 text-center font-bold text-slate-650">{idx + 1}</td>
                              <td className="p-3 border border-slate-350 font-mono font-bold text-slate-900 select-all">{c.ticketNumber}</td>
                              <td className="p-3 border border-slate-350 font-semibold text-slate-800">
                                {c.anonymous ? (
                                  <span className="text-slate-450 italic font-medium">Sengaja Rahasia (Anonim)</span>
                                ) : (
                                  c.pelaporName
                                )}
                              </td>
                              <td className="p-3 border border-slate-350 font-medium text-slate-700">{c.category}</td>
                              <td className="p-3 border border-slate-350">
                                <div className="font-extrabold text-slate-850">{c.subCategory}</div>
                                <div className="text-[10px] text-slate-550 leading-relaxed mt-1 whitespace-pre-wrap">{c.title}</div>
                              </td>
                              <td className="p-3 border border-slate-350 text-center">
                                {c.assignedDepartment ? (
                                  <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-[10px]">
                                    {c.assignedDepartment === 'Kaur TU' ? 'Kaur TU' : `Waka ${c.assignedDepartment}`}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">-</span>
                                )}
                              </td>
                              <td className="p-3 border border-slate-350 text-center">
                                <span className={`font-mono font-bold uppercase text-[9px] px-2.5 py-1 rounded border inline-block whitespace-nowrap ${c.status === 'RESOLVED' || c.status === 'INFO_ANSWERED' ? 'bg-emerald-100 text-emerald-800 border-emerald-250' : c.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-250' : 'bg-indigo-100 text-indigo-850 border-indigo-250'}`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3 border border-slate-350 text-center font-medium text-slate-600 whitespace-nowrap">
                                {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    getFilteredComplaintsForReport().map((c, idx) => {
                      const cLogs = allLogs
                        .filter(l => l.complaintId === c.id)
                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                      return (
                        <div key={c.id} className="border border-slate-200 rounded-xl p-4.5 space-y-3.5 no-print-break text-xs bg-white text-black relative">
                          
                          {/* Title Header with status */}
                          <div className="flex items-start justify-between border-b pb-2 text-[10px]">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-500 uppercase">NO. {idx + 1} | NOMOR TIKET: </span>
                              <span className="font-mono font-black bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-800 select-all">{c.ticketNumber}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 font-bold">{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                              <span className="mx-1 border-r h-2.5 inline-block border-slate-300"></span>
                              <span className={`font-mono font-bold uppercase text-[9px] px-2 py-0.5 rounded border ${c.status === 'RESOLVED' || c.status === 'INFO_ANSWERED' ? 'bg-emerald-100 text-emerald-800 border-emerald-250' : c.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-250' : 'bg-indigo-100 text-indigo-850 border-indigo-250'}`}>
                                {c.status}
                              </span>
                            </div>
                          </div>

                          {/* Complaint Identity Grid */}
                          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-[10px] border border-slate-100">
                            <div>
                              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[8px]">Melaporkan Nama:</span>
                              <span className="font-bold text-slate-800 text-[10.5px]">
                                {c.anonymous ? 'Rahasia / Terjaga (Anonim)' : c.pelaporName}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[8px]">Metodologi Aduan:</span>
                              <span className="font-bold text-slate-800 text-[10.5px]">{c.category}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[8px]">Topik / Sub-Kategori:</span>
                              <span className="font-bold text-slate-800 text-[10.5px]">{c.subCategory}</span>
                            </div>
                          </div>

                          {/* Complaint description */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Konteks Laporan:</span>
                            <h5 className="font-black text-slate-800 text-xs">{c.title}</h5>
                            <p className="text-slate-600 leading-relaxed text-[11px] bg-slate-50/20 p-3 rounded border border-slate-100 select-all whitespace-pre-wrap">
                              {c.description}
                            </p>
                          </div>

                          {/* WORKFLOW TRACK / HISTORY STEPS (The critical requested element!) */}
                          <div className="space-y-2 border-t border-slate-100 pt-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/50 leading-relaxed">
                            <span className="font-extrabold text-slate-700 block uppercase text-[10.5px] tracking-wider mb-2">
                              Alur Penyelidikan Laporan & Keputusan Jawaban:
                            </span>
                            
                            {cLogs.length === 0 ? (
                              <p className="text-slate-400 italic text-[11px]">Belum ada riwayat aktivitas penanganan terekam.</p>
                            ) : (
                              <div className="space-y-2 pb-1">
                                {cLogs.map((log, index) => (
                                  <div key={log.id} className="text-[11px] leading-relaxed flex items-start gap-2 border-b border-dashed border-slate-105 pb-1.5 last:border-b-0 last:pb-0">
                                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5 select-none">{index + 1}</span>
                                    <div className="text-slate-650 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-500 font-mono">[{new Date(log.timestamp).toLocaleDateString('id-ID')} {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}]</span>
                                        <span className="text-indigo-800 font-black uppercase text-[8.5px] bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
                                          {log.actorRole === 'admin' ? 'KABAG ADMIN' : log.actorRole === 'ketuatim' ? 'KETUA TIM' : log.actorRole === 'bidang' ? (c.assignedDepartment === 'Kaur TU' ? 'PETUGAS KAUR TU' : `GURU WAKA ${c.assignedDepartment || ''}`) : 'PELAPOR'}
                                        </span>
                                        <span className="font-bold text-slate-800 text-[10.5px]">{log.actorName}</span>
                                      </div>
                                      <p className="text-slate-700 font-medium text-[11px] mt-0.5 leading-relaxed">{log.notes}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Direct Info Answer */}
                            {c.status === 'INFO_ANSWERED' && c.directInfoAnswer && (
                              <div className="mt-3 bg-teal-50 border border-teal-200 p-3 rounded-lg text-[11px] animate-fade-in text-teal-950">
                                <span className="font-extrabold text-teal-900 block uppercase text-[9px] tracking-wider mb-0.5">Solusi Selesai: Jawaban Informasi Resmi Dirilis Admin:</span>
                                <p className="text-slate-750 italic font-medium leading-relaxed">"{c.directInfoAnswer}"</p>
                              </div>
                            )}

                            {/* Finished Finalized Answer */}
                            {c.finalAnswer && (
                              <div className="mt-3 bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-[11px] animate-fade-in text-indigo-950">
                                <span className="font-extrabold text-indigo-900 block uppercase text-[9px] tracking-wider mb-0.5">Solusi Selesai: Jawaban Resmi Ditetapkan & rilis Publik:</span>
                                <p className="text-slate-800 italic font-semibold leading-relaxed">"{c.finalAnswer}"</p>
                                {c.departmentResponse && c.departmentResponse !== c.finalAnswer && (
                                  <div className="border-t border-indigo-100/80 mt-1.5 pt-1.5 text-[10px] text-slate-500 italic font-medium leading-normal">
                                    * Draf Kajian {c.assignedDepartment === 'Kaur TU' ? 'Kaur TU' : `Waka ${c.assignedDepartment}`}: "{c.departmentResponse}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* SIGNATURE SECTION (Validation Lembar) */}
                <div className="pt-8 border-t border-slate-100 flex justify-end no-print-break text-xs mt-8">
                  <div className="text-center space-y-12 pr-6">
                    <div className="space-y-0.5">
                      <p className="text-slate-700 font-semibold">
                        Palembang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-slate-500 font-medium leading-none mb-1">Mengesahkan,</p>
                      <p className="font-bold text-slate-850">Ketua Tim Pengendalian & Mutu Keluhan</p>
                      <p className="text-[10px] text-slate-400 font-medium">MAN 2 Kota Palembang</p>
                    </div>

                    <div className="space-y-1">
                      <div className="border-b border-black w-48 mx-auto"></div>
                      <p className="text-[11px] font-bold uppercase text-slate-800 tracking-wider">NIP. 197508102005011003</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Connection URL Config */}
          <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Alamat Web App Google Sheets</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tautkan ke web app Apps Script untuk merubah status database ke Google Spreadsheet.</p>
            </div>

            <form onSubmit={handleSaveGasUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  URL Google Apps Script Web App
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={editingUrl}
                  onChange={(e) => setEditingUrl(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 text-xs flex items-center gap-1.5 animate-bounce">
                  <Check className="w-4 h-4" />
                  <span>Koneksi & URL integrasi berhasil diperbarui!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingUrl}
                className="w-full bg-slate-850 hover:bg-slate-900 text-white py-2 px-4 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingUrl ? 'Menghubungkan...' : 'Simpan URL Integrasi'}
              </button>
            </form>

            <div className="p-4 bg-indigo-50 rounded-xl text-xs space-y-2 border border-indigo-100">
              <span className="font-bold text-indigo-900 block my-0.5">Dual-System Datastore Activist:</span>
              <p className="text-slate-600 leading-relaxed">
                Kawal Madrasah secara cerdas memakai <b>Local JSON File Database</b> jika Apps Script belum terpasang. Begitu Anda menempelkan URL Apps Script di atas, sistem akan mengalirkan data secara real-time langsung ke Google Sheets Anda!
              </p>
            </div>
          </div>

          {/* Interactive Installers instructions */}
          <div className="md:col-span-8">
            <GASInstructions />
          </div>

        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Manajemen & Monitoring Akun Petugas
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pantau kredensial aktif untuk petugas Waka (Bidang Terkait) serta Ketua Tim Komite Madrasah, lakukan penyesuaian sandi berkala secara langsung.
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-all rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              Segarkan Data
            </button>
          </div>

          {usersMessage && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${usersMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
              {usersMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{usersMessage.text}</span>
            </div>
          )}

          {editingUserId && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 animate-fade-in max-w-md space-y-4">
              <div>
                <span className="font-extrabold text-[10px] uppercase text-emerald-800 tracking-wider block mb-1">Modifikasi Detail Petugas</span>
                <h4 className="text-xs font-bold text-slate-800">
                  Perbarui Akun: <span className="font-mono text-indigo-700">{usersList.find(u => u.id === editingUserId)?.name}</span>
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap Petugas:</label>
                  <input
                    type="text"
                    value={usersNewName}
                    onChange={(e) => setUsersNewName(e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alamat Email Kredensial:</label>
                  <input
                    type="email"
                    value={usersNewEmail}
                    onChange={(e) => setUsersNewEmail(e.target.value)}
                    placeholder="Masukkan email..."
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sandi Baru Yang Diinginkan:</label>
                  <input
                    type="text"
                    value={usersNewPassword}
                    onChange={(e) => setUsersNewPassword(e.target.value)}
                    placeholder="Masukkan sandi..."
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => handleUpdateUser(editingUserId)}
                    disabled={updatingUsersPassword || !usersNewPassword.trim() || !usersNewName.trim() || !usersNewEmail.trim()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                  >
                    {updatingUsersPassword ? 'Menyimpan...' : 'Perbarui Kredensial'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingUserId(null);
                      setUsersNewPassword('');
                      setUsersNewName('');
                      setUsersNewEmail('');
                    }}
                    className="bg-slate-200 text-slate-700 hover:bg-slate-250 font-bold text-xs py-2 px-3 rounded-lg transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full border-collapse text-left text-xs bg-white">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-extrabold border-b border-slate-200 select-none">
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Otoritas Peran / Bidang</th>
                  <th className="p-3">Alamat Email</th>
                  <th className="p-3">Kata Sandi Sistem</th>
                  <th className="p-3 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingUsers && usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-600" />
                      Memuat daftar petugas madrasah...
                    </td>
                  </tr>
                ) : usersList.filter(u => u.role === 'bidang' || u.role === 'ketuatim' || u.role === 'admin').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      Belum ada data petugas aktif terekam dalam sistem database.
                    </td>
                  </tr>
                ) : (
                  usersList
                    .filter(u => u.role === 'bidang' || u.role === 'ketuatim' || u.role === 'admin')
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">
                          {item.name}
                          {item.id === user.id && (
                            <span className="ml-1.5 text-[8.5px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-1 border border-slate-200 rounded shrink-0">Saya</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block text-[9px] font-black uppercase text-center tracking-wide px-2 py-0.5 rounded border ${
                            item.role === 'admin' 
                              ? 'bg-rose-50 text-rose-700 border-rose-250' 
                              : item.role === 'ketuatim'
                              ? 'bg-amber-50 text-amber-700 border-amber-250'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-250'
                          }`}>
                            {item.role === 'admin' 
                              ? 'ADMIN MADRASAH' 
                              : item.role === 'ketuatim'
                              ? 'KETUA TIM VERIFIKASI'
                              : item.name.includes('TU') 
                              ? 'KAUR TATA USAHA' 
                              : 'WAKIL KEPALA SEKOLAH'}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-medium text-slate-600">{item.email}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-slate-400" />
                            <code className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-150 animate-pulse">
                              {item.password || 'man2plg123'}
                            </code>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setEditingUserId(item.id);
                              setUsersNewName(item.name);
                              setUsersNewEmail(item.email);
                              setUsersNewPassword(item.password || 'man2plg123');
                              setUsersMessage(null);
                            }}
                            className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-indigo-900 rounded-lg text-xs font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                            Ubah Detail & Sandi
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Daftar Riwayat Kegiatan & Audit Trail Petugas
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Lacak seluruh aktivitas tindakan dari Administrator/Admisi, Ketua Tim Verifikasi, serta Wakil Kepala Sekolah (Waka Bidang) di madrasah secara real-time.
              </p>
            </div>
            <button
              onClick={fetchAllLogs}
              disabled={loadingLogs}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-all rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              Segarkan Log
            </button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {loadingLogs && allLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-600" />
                Memuat riwayat kegiatan...
              </div>
            ) : allLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                Belum ada rekaman riwayat kegiatan saat ini.
              </div>
            ) : (
              [...allLogs]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((log) => {
                  // Find related ticket number for context helper
                  const relComp = complaints.find(c => c.id === log.complaintId);
                  
                  return (
                    <div 
                      key={log.id} 
                      className="border border-slate-150 p-4 rounded-xl hover:bg-slate-50/50 transition-all text-xs flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-block text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded border ${
                            log.actorRole === 'admin' 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : log.actorRole === 'ketuatim'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {log.actorRole === 'admin' 
                              ? 'ADMINISTRATOR' 
                              : log.actorRole === 'ketuatim'
                              ? 'KETUA TIM VERIFIKASI'
                              : 'WAKA / BIDANG'}
                          </span>
                          <span className="font-extrabold text-slate-800">{log.actorName}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {new Date(log.timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })} WIB
                          </span>
                        </div>
                        
                        <p className="text-slate-650 leading-relaxed font-semibold bg-slate-50 p-2.5 rounded border border-slate-100 font-sans">
                          {log.notes}
                        </p>

                        {relComp && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="font-bold uppercase text-[9px] text-slate-400">Tautan Tiket:</span>
                            <span className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.2 rounded font-black text-slate-600">
                              {relComp.ticketNumber}
                            </span>
                            <span className="text-slate-600 truncate max-w-xs block font-bold">
                              "{relComp.title}"
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono text-[9px] text-slate-400 bg-slate-100/60 px-1.5 py-0.5 rounded border border-slate-200">
                          ID: {log.id}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Detail logs popup modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

    </div>
  );
};
