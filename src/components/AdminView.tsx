/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, Settings, FileSpreadsheet, Check, Send, AlertCircle, RefreshCw, MessageSquare, HelpCircle, ArrowRight, CornerDownRight } from 'lucide-react';
import { Complaint, User, Department } from '../types.js';
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
  const [activeTab, setActiveTab] = useState<'triage' | 'database'>('triage');
  const [editingUrl, setEditingUrl] = useState(gasUrl);
  const [savingUrl, setSavingUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const departments: Department[] = ['Kesiswaan', 'Kurikulum', 'Sarana Prasarana', 'Humas', 'Keamanan'];

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
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs md:text-sm font-bold tracking-wide border-b-2 transition-all cursor-pointer ${activeTab === 'database' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Settings className="w-4 h-4" />
          Koneksi Google Sheets
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
                    className={`bg-white border rounded-xl p-4 shadow-xs transition-all hover:shadow-sm ${selectedActionRecord?.id === c.id || activePublishRecord?.id === c.id ? 'ring-2 ring-emerald-500 border-transparent bg-emerald-50/10' : 'border-slate-200'}`}
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

                    <h4 className="font-bold text-slate-850 text-sm mb-1.5 line-clamp-1">{c.title}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">{c.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
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
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-[11px] text-slate-700 cursor-pointer"
                        >
                          Kronologi
                        </button>

                        {/* Step 3 Action: Klasifikasi */}
                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedActionRecord(c);
                              setActivePublishRecord(null);
                              setNotes('');
                            }}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                          >
                            Klasifikasi / SOP 3
                          </button>
                        )}

                        {/* Step 6 Action: Finalize approved department responses */}
                        {c.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setActivePublishRecord(c);
                              setSelectedActionRecord(null);
                              setFinalPublishAnswer(c.departmentResponse || '');
                            }}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                          >
                            Rilis Tanggapan / SOP 6
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Actions Forms Panels */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Show Welcome Instructions when no records is selected */}
            {!selectedActionRecord && !activePublishRecord && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3.5">
                <HelpCircle className="w-8 h-8 text-slate-350 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Menunggu Tindakan Alur Kerja</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih tombol tindakan <b>"Klasifikasi"</b> untuk aduan berstatus pending, atau pilih <b>"Rilis Tanggapan"</b> untuk aduan yang sudah disetujui Ketua Tim untuk mempublikasikan penyelesaian dari aduan ke pihak pelapor.
                </p>
              </div>
            )}

            {/* SOP Step 3: Klasifikasi Aduan Form */}
            {selectedActionRecord && (
              <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in" id="classify-workspace">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                  <MessageSquare className="w-4.5 h-4.5 text-emerald-600" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    Tindakan SOP 3: Klasifikasi Tiket
                  </h4>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                  <div className="font-semibold text-slate-600">Terpilih: {selectedActionRecord.ticketNumber}</div>
                  <div className="text-slate-500 line-clamp-2">"{selectedActionRecord.title}"</div>
                </div>

                <form onSubmit={handleClassifySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-2">
                      Hasil Klasifikasi Menentukan Alur Kerja:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setClassificationType('Pengaduan Pelanggaran')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${classificationType === 'Pengaduan Pelanggaran' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                      >
                        Pengaduan Pelanggaran
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassificationType('Informasi')}
                        className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${classificationType === 'Informasi' ? 'border-sky-600 bg-sky-50 text-sky-800' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                      >
                        Hanya Informasi / Tanya
                      </button>
                    </div>
                  </div>

                  {classificationType === 'Informasi' ? (
                    <div className="space-y-3 p-3 bg-sky-50/50 border border-sky-100 rounded-xl animate-fade-in">
                      <div className="text-slate-500 text-[11px] leading-relaxed mb-1">
                        <b>💡 Alur Informasi:</b> Karena ini hanya berupa kebutuhan penjelas/informasi dasar, Anda selaku Admin langsung memberikan tanggapan jawaban, dan tidak perlu meneruskan ke Guru/Bidang Terkait.
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1.5">
                          Tulis Informasi Jawaban Anda
                        </label>
                        <textarea
                          rows={4}
                          value={directInfoAnswer}
                          onChange={(e) => setDirectInfoAnswer(e.target.value)}
                          placeholder="Tuliskan petunjuk / jawaban formal langsung kepada masyarakat..."
                          className="w-full text-xs border border-slate-200 bg-white p-2.5 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-fade-in">
                      <div className="text-slate-500 text-[11px] leading-relaxed mb-1">
                        <b>💡 Alur Pengaduan:</b> Ini mengandung unsur aduan pelanggaran, sarana rusak, atau bullying. Anda harus menunjuk Bidang Terkait agar Bidang tersebut menginvestigasi secara mendalam.
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1.5">
                          Tunjuk Bidang Terkait (Petugas SOP)
                        </label>
                        <select
                          value={assignedDepartment}
                          onChange={(e: any) => setAssignedDepartment(e.target.value)}
                          className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>Bidang {dept}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">
                      Catatan Log Riwayat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Lampiran sudah dicek / bukti valid..."
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedActionRecord(null)}
                      className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                    >
                      Batalkan
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer"
                    >
                      {submittingAction ? 'Menyimpan...' : 'Rilis Klasifikasi'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SOP Step 6: Finalize and Publish answers */}
            {activePublishRecord && (
              <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in" id="publish-workspace">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                    <Check className="w-5 h-5 text-indigo-700" />
                    SOP 6: Rilis & Publikasikan Jawaban
                  </h4>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-xl text-xs space-y-1 text-indigo-950 border border-indigo-100">
                  <div className="font-bold">Aduan: {activePublishRecord.ticketNumber}</div>
                  <div className="italic">"{activePublishRecord.title}"</div>
                  <div className="mt-2 text-[11px] font-medium text-slate-500 bg-white p-2 rounded border border-indigo-100">
                    <b>Draf Bidang:</b> "{activePublishRecord.departmentResponse}"
                  </div>
                </div>

                <form onSubmit={handleFinalizePublishSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1.5">
                      Pratinjau / Sesuaikan Jawaban Akhir demi Kerahasiaan
                    </label>
                    <textarea
                      rows={5}
                      value={finalPublishAnswer}
                      onChange={(e) => setFinalPublishAnswer(e.target.value)}
                      placeholder="Konfirmasi rumusan penyelesaian yang diserahkan guru penanggung jawab..."
                      className="w-full text-xs border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none leading-relaxed"
                      required
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded">
                    💡 <b>Ketentuan Keamanan:</b> Mempublikasikan tanggapan akhir berarti menutup penanganan tiket dan memberikan jawaban agar pelapor dapat melihat penyelesaiannya melalui pencarian nomor tiket.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePublishRecord(null)}
                      className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                    >
                      {submittingAction ? 'Rilis...' : 'Rilis Jawaban Akhir'}
                    </button>
                  </div>
                </form>
              </div>
            )}

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
