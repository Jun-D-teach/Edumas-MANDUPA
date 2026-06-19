/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Briefcase, RefreshCw, Send, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { Complaint, User, Department } from '../types.js';
import { StatusBadge } from './RoleBadge.js';
import { ComplaintDetailModal } from './ComplaintDetailModal.js';

interface BidangViewProps {
  user: User;
  complaints: Complaint[];
  onRefreshComplaints: () => Promise<void>;
}

export const BidangView: React.FC<BidangViewProps> = ({ user, complaints, onRefreshComplaints }) => {
  // Let the user simulate acting as different departments on-the-fly for rich sandbox checking
  const [actingDept, setActingDept] = useState<Department>('Kesiswaan');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Response form
  const [activeRespondId, setActiveRespondId] = useState<string | null>(null);
  const [departmentResponse, setDepartmentResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const departments: Department[] = ['Kesiswaan', 'Kurikulum', 'Sarana Prasarana', 'Humas', 'Keamanan', 'Kaur TU'];

  // Filter complaints assigned to this department and have status 'FORWARDED' (waiting for department action)
  // We can also show resolved ones for reference!
  const assignedComplaints = complaints.filter(
    (c) => c.assignedDepartment === actingDept
  );

  const pendingAssigned = assignedComplaints.filter(c => c.status === 'FORWARDED');
  const finishedAssigned = assignedComplaints.filter(c => c.status !== 'FORWARDED' && c.status !== 'PENDING' && c.status !== 'INFO_ANSWERED');

  const handleResponseSubmit = async (e: React.FormEvent, complaint: Complaint) => {
    e.preventDefault();
    if (!departmentResponse.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'INPUT_TANGGAPAN_BIDANG',
          actorName: actingDept === 'Kaur TU' ? 'Kaur TU' : `Waka ${actingDept}`,
          actorRole: 'bidang',
          departmentResponse: departmentResponse.trim(),
          notes: `Memberikan laporan tanggapan penyelidikan & langkah taktis dari Bidang ${actingDept}.`
        })
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan tanggapan.');
      }

      setActiveRespondId(null);
      setDepartmentResponse('');
      await onRefreshComplaints();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="department-view-hub">
      
      {/* Simulation Selector of Departments */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2 justify-center md:justify-start">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Meja Kerja Petugas Bidang Terkait
          </h3>
          <p className="text-xs text-slate-400">Pilih Bidang Anda di bawah ini untuk mensimulasikan otorisasi penyelidikan Waka terkait</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-bold text-slate-500">Bertindak Sebagai:</span>
          <select
            value={actingDept}
            onChange={(e: any) => {
              setActingDept(e.target.value);
              setActiveRespondId(null);
            }}
            className="border border-slate-200 bg-white px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept === 'Kaur TU' ? 'Kaur TU' : `Waka ${dept}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Pending Tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">
                Tanggapi Laporan Diserahkan ({pendingAssigned.length})
              </h4>
              <p className="text-xs text-slate-400">Berkas yang dirujuk Admin untuk ditelaah dan diberi penyelesaian taktis</p>
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
            {pendingAssigned.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border text-slate-400 text-xs">
                ☕ Alhamdulillah, tidak ada aduan yang tertunda untuk Bidang {actingDept} saat ini.
              </div>
            ) : (
              pendingAssigned.map((c) => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-350 transition-all space-y-3"
                  id={`department-assigned-card-${c.id}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="font-mono text-slate-500 bg-slate-100 border border-slate-250 px-1 py-0.5 rounded select-all">{c.ticketNumber}</span>
                      <span className="text-slate-400">| {c.subCategory}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <h5 className="font-bold text-slate-800 text-sm leading-snug">{c.title}</h5>
                  <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">"{c.description}"</p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                    >
                      Buka Kronologi Detail
                    </button>

                    <button
                      onClick={() => {
                        setActiveRespondId(activeRespondId === c.id ? null : c.id);
                        setDepartmentResponse('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm cursor-pointer"
                    >
                      {activeRespondId === c.id ? 'Tutup Input' : 'Tanggapi / SOP 4'}
                    </button>
                  </div>

                  {/* SOP Form Box */}
                  {activeRespondId === c.id && (
                    <form
                      onSubmit={(e) => handleResponseSubmit(e, c)}
                      className="mt-4 p-4 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-3.5 animate-fade-in"
                    >
                      <div className="text-[11px] text-indigo-900 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>SOP 4: Form Draf Tanggapan Penyelidikan Bidang</span>
                      </div>

                      <div className="text-xs">
                        <label className="block text-slate-500 font-medium mb-1.5">
                          Tuliskan temuan kroscek lapangan & draf solusi masalah:
                        </label>
                        <textarea
                          rows={4}
                          value={departmentResponse}
                          onChange={(e) => setDepartmentResponse(e.target.value)}
                          placeholder="Contoh: Kami telah menindaklanjuti anak-anak kelas IX yang berulah dan memberi pembinaan BK. Kerusakan atap bocor juga dijadwalkan diperbaiki akhir pekan..."
                          className="w-full text-xs font-normal border border-slate-200 bg-white p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                          required
                        />
                      </div>

                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveRespondId(null)}
                          className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {submitting ? 'Mengirim...' : 'Kirim Ke Ketua Tim'}
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action History references */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">Riwayat Penanganan Bidang</h4>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-sm max-h-[60vh] overflow-y-auto">
            {finishedAssigned.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-10 italic">
                Belum ada berkas tanggapan selesai yang tercatat pada Bidang ini.
              </div>
            ) : (
              finishedAssigned.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-500">{c.ticketNumber}</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold">{c.status}</span>
                  </div>
                  <h6 className="font-bold text-slate-705 clamp-1">{c.title}</h6>
                  <p className="text-slate-500 italic text-[11px] border-t border-slate-100/50 pt-1.5">
                    <b>Tanggapan Kita:</b> "{c.departmentResponse}"
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
