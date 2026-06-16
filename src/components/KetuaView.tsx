/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserCheck2, RefreshCw, CheckCircle, AlertTriangle, MessageSquare, Info, ShieldCheck } from 'lucide-react';
import { Complaint, User } from '../types.js';
import { StatusBadge } from './RoleBadge.js';
import { ComplaintDetailModal } from './ComplaintDetailModal.js';

interface KetuaViewProps {
  user: User;
  complaints: Complaint[];
  onRefreshComplaints: () => Promise<void>;
}

export const KetuaView: React.FC<KetuaViewProps> = ({ user, complaints, onRefreshComplaints }) => {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Otorisasi states
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Complaints that have status 'DEPT_RESPONDED' (waiting for Chairperson review)
  const pendingReviews = complaints.filter((c) => c.status === 'DEPT_RESPONDED');
  
  // All other processed/resolved complaints for record history
  const reviewedComplaints = complaints.filter(
    (c) => c.status === 'APPROVED' || c.status === 'RESOLVED'
  );

  const handleReviewAction = async (complaintId: string, isApprove: boolean) => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/complaints/${complaintId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isApprove ? 'SETUJUI_KETUA_TIM' : 'TOLAK_KETUA_TIM',
          actorName: user.name,
          actorRole: user.role,
          notes: reviewNotes.trim() || (isApprove ? 'Draf tanggapan disetujui tanpa revisi.' : 'Tanggapan ditolak karena perlu penyelidikan ulang lebih detail.')
        })
      });

      if (!response.ok) {
        throw new Error('Gagal melakukan otorisasi.');
      }

      setActiveReviewId(null);
      setReviewNotes('');
      await onRefreshComplaints();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="chairperson-view-hub">
      
      {/* Ketua Tim Header Banner */}
      <div className="bg-slate-800 text-white p-5 rounded-2xl flex items-center justify-between shadow-md border border-slate-700">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-600/35 rounded text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
            Kewenangan Verifikator Akhir
          </div>
          <h3 className="font-bold text-sm md:text-base flex items-center gap-2">
            <UserCheck2 className="w-5 h-5 text-emerald-400" />
            Otorisasi Tanggapan Pengaduan (SOP 5)
          </h3>
          <p className="text-xs text-slate-350 leading-relaxed max-w-xl">
            Sesuai Standard Operating Procedure (SOP) Madrasah, selaku Ketua Tim Anda berwenang melakukan verifikasi, penyelarasan, penyetujuan, atau penolakan laporan draf investigasi yang dikeluarkan oleh Waka Bidang Terkait sebelum dirilis ke publik.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Pending Reviews */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Draf Tanggapan Menunggu Persetujuan ({pendingReviews.length})
              </h4>
              <p className="text-xs text-slate-400">Berkas pengerjaan investigasi dari guru/bidang penanggung jawab</p>
            </div>
            <button
              onClick={onRefreshComplaints}
              className="p-1 px-2.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Segarkan
            </button>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {pendingReviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border text-slate-400 text-xs">
                ☕ Alhamdulillah, seluruh draf investigasi bidang telah tuntas direview.
              </div>
            ) : (
              pendingReviews.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3.5 hover:border-slate-300 transition-all"
                  id={`review-target-card-${c.id}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{c.ticketNumber}</span>
                      <span className="text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Bidang: {c.assignedDepartment}
                      </span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-sm mb-1">{c.title}</h5>
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed italic bg-slate-50 p-2.5 border border-slate-150 rounded-lg">
                      <b>Uraian Aduan:</b> "{c.description}"
                    </p>
                  </div>

                  <div className="bg-amber-50/50 p-3.5 border border-amber-250/60 rounded-xl space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-amber-900 block">Draf Tanggapan / Hasil Solusi Bidang:</span>
                    <p className="select-all">"{c.departmentResponse}"</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      Buka Kronologi Detail
                    </button>

                    <button
                      onClick={() => {
                        setActiveReviewId(activeReviewId === c.id ? null : c.id);
                        setReviewNotes('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                    >
                      {activeReviewId === c.id ? 'Tutup Review' : 'Beri Keputusan Persetujuan / SOP 5'}
                    </button>
                  </div>

                  {/* Approve/Reject SOP Form Box */}
                  {activeReviewId === c.id && (
                    <div className="mt-4 p-4 border border-emerald-100 bg-emerald-50/15 rounded-xl space-y-4 animate-fade-in">
                      <div className="text-[11px] text-emerald-900 font-bold flex items-center gap-1 border-b border-emerald-100/40 pb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span>SOP 5: Verifikasi & Otorisasi Ketua Tim</span>
                      </div>

                      <div className="text-xs">
                        <label className="block text-slate-500 font-bold mb-1.5">
                          Catatan / Instruksi Tambahan (Opsional)
                        </label>
                        <input
                          type="text"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Contoh: Sangat baik langkah taktisnya, silakan dilanjutkan ke rilis..."
                          className="w-full text-xs border border-slate-200 bg-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="flex justify-end gap-2 text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => handleReviewAction(c.id, false)}
                          disabled={submitting}
                          className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Tolak & Kembalikan (Revisi)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewAction(c.id, true)}
                          disabled={submitting}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer animate-pulse"
                        >
                          Setujui & Teruskan Rilis
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reviewed History */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Riwayat Keputusan Kita</h4>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-sm max-h-[60vh] overflow-y-auto">
            {reviewedComplaints.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-10 italic">
                Belum ada rincian riwayat review yang terdaftar.
              </div>
            ) : (
              reviewedComplaints.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-500">{c.ticketNumber}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold uppercase">{c.status}</span>
                  </div>
                  <h6 className="font-bold text-slate-750 line-clamp-1">{c.title}</h6>
                  <p className="text-[11px] text-slate-500 border-t border-slate-200/50 pt-1.5">
                    <b>Penyelesaian:</b> "{c.finalAnswer || c.departmentResponse}"
                  </p>
                  <button
                    onClick={() => setSelectedComplaint(c)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold underline text-[10px] block text-right mt-1 cursor-pointer"
                  >
                    Buka Log Alur Kerja
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

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
