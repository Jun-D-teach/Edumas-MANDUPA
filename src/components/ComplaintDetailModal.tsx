/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Calendar, User, EyeOff, LayoutList, MessageSquare, History, ArrowRight } from 'lucide-react';
import { Complaint, ActivityLog } from '../types.js';
import { StatusBadge } from './RoleBadge.js';

interface ComplaintDetailModalProps {
  complaint: Complaint;
  onClose: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({ complaint, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`/api/complaints/${complaint.id}/logs`);
        if (response.ok) {
          const data = await response.json();
          // Sort logs newest first
          setLogs(data.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [complaint.id]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" id="complaint-detail-dialog">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header section */}
        <div className="p-6 border-b border-slate-150 flex items-start justify-between bg-slate-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                {complaint.ticketNumber}
              </span>
              <StatusBadge status={complaint.status} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-snug">{complaint.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable contents */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs text-slate-600 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Pengirim Pelapor</span>
                {complaint.anonymous ? (
                  <span className="font-semibold text-rose-600 flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Rahasia / Anonim (Identitas Terjaga)
                  </span>
                ) : (
                  <span className="font-semibold text-slate-700">{complaint.pelaporName} ({complaint.pelaporEmail})</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Tanggal Pengajuan</span>
                <span className="font-semibold text-slate-700">{formatDate(complaint.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <LayoutList className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Jenis Pengaduan</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">{complaint.category}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Sub-Kategori / Topik</span>
                <span className="font-semibold text-slate-700">{complaint.subCategory}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uraian / Kronologi Kejadian</h4>
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
              {complaint.description}
            </div>
          </div>

          {/* Department Assignee (if forwarded) */}
          {complaint.assignedDepartment && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Ditugaskan & Ditangani Oleh:</span>
              <span className="font-bold text-indigo-800 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-indigo-200">
                Bidang {complaint.assignedDepartment}
              </span>
            </div>
          )}

          {/* Direct Info Answer */}
          {complaint.status === 'INFO_ANSWERED' && complaint.directInfoAnswer && (
            <div className="space-y-2 border-l-4 border-emerald-500 pl-4 py-1.5 animate-fade-in">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                Penjelasan / Informasi dari Admin
              </h4>
              <div className="text-sm text-slate-700 leading-relaxed bg-emerald-50/40 p-3.5 border border-emerald-100 rounded-r-xl">
                {complaint.directInfoAnswer}
              </div>
            </div>
          )}

          {/* Draft Department Response */}
          {complaint.departmentResponse && (
            <div className="space-y-2 border-l-4 border-indigo-500 pl-4 py-1.5 animate-fade-in">
              <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wider">
                Draf Tanggapan Penyelidikan Bidang {complaint.assignedDepartment}
              </h4>
              <div className="text-sm text-slate-750 leading-relaxed bg-indigo-50/30 p-3.5 border border-indigo-100/60 rounded-r-xl">
                {complaint.departmentResponse}
              </div>
            </div>
          )}

          {/* Final Resolution Answer */}
          {complaint.status === 'RESOLVED' && complaint.finalAnswer && (
            <div className="space-y-2 border-l-4 border-emerald-500 pl-4 py-1.5 animate-fade-in">
              <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                Tanggapan Akhir Pengaduan (Resmi)
              </h4>
              <div className="text-sm text-slate-750 leading-relaxed bg-emerald-50/40 p-3.5 border border-emerald-100 rounded-r-xl">
                {complaint.finalAnswer}
              </div>
            </div>
          )}

          {/* Timeline Tracking / Logs */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riwayat Tindakan (Sesuai SOP Flowchart)</h4>
            
            {loading ? (
              <div className="text-center py-4 text-xs text-slate-400">Memuat log aktivitas...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-405 italic">Belum ada riwayat tercatat.</div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {logs.map((log, index) => (
                    <li key={log.id}>
                      <div className="relative pb-8">
                        {index !== logs.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white border border-slate-200">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5">
                            <p className="text-xs font-semibold text-slate-700">
                              {log.action.replace(/_/g, ' ')}{' '}
                              <span className="font-normal text-slate-500">oleh</span>{' '}
                              <span className="font-medium text-emerald-800">{log.actorName}</span>{' '}
                              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-550 border border-slate-200 ml-1.5 uppercase font-mono">
                                {log.actorRole}
                              </span>
                            </p>
                            {log.notes && (
                              <p className="mt-1 text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                                "{log.notes}"
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-slate-400 font-mono">
                              {formatDate(log.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 justify-end flex bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Tutup Detail
          </button>
        </div>

      </div>
    </div>
  );
};
