/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Send, Search, HelpCircle, Eye, EyeOff, ShieldAlert, Key, ClipboardList, Info, Loader2, ListTodo, Paperclip, Trash2, Upload } from 'lucide-react';
import { Complaint, User } from '../types.js';
import { StatusBadge } from './RoleBadge.js';
import { ComplaintDetailModal } from './ComplaintDetailModal.js';

interface PelaporViewProps {
  user: User | null;
  complaints: Complaint[];
  onRefreshComplaints: () => Promise<void>;
}

export const PelaporView: React.FC<PelaporViewProps> = ({ user, complaints, onRefreshComplaints }) => {
  // Local storage to persist anonym tickets so they can track them
  const [savedTicketNumbers, setSavedTicketNumbers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('km_saved_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Informasi' | 'Pengaduan Pelanggaran'>('Pengaduan Pelanggaran');
  const [subCategory, setSubCategory] = useState('Perundungan (Bullying)');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  // File evidence Upload states
  const [evidenceBase64, setEvidenceBase64] = useState<string>('');
  const [evidenceName, setEvidenceName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas bukti dukung melebihi batas maksimal 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setEvidenceBase64(e.target.result as string);
        setEvidenceName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedComplaint, setSearchedComplaint] = useState<Complaint | null>(null);
  const [searchTried, setSearchTried] = useState(false);

  // Detail modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Sub-category options
  const subCategories: Record<'Informasi' | 'Pengaduan Pelanggaran', string[]> = {
    'Informasi': [
      'Pendaftaran & Layanan Akademik',
      'Fasilitas Kelas & Sarpras',
      'Kegiatan Ekstrakurikuler',
      'Kalender Pendidikan & Ujian',
      'Dana BOS & Sumbangan Komite',
      'Lainnya'
    ],
    'Pengaduan Pelanggaran': [
      'Perundungan (Bullying / Cyber-bullying)',
      'Kekerasan Fisik / Verbal oleh Staf/Siswa',
      'Pungutan Liar (Pungli)',
      'Kedisiplinan & Tata Tertib Siswa',
      'Kualitas Makan / Kantin Madrasah',
      'Fasilitas Rusak / Sarpras Tidak Layak',
      'Lainnya (Pelanggaran Kode Etik)'
    ]
  };

  // Sync category choice
  useEffect(() => {
    setSubCategory(subCategories[category][0]);
  }, [category]);

  const saveTicketToLocal = (ticketNum: string) => {
    const updated = [...new Set([ticketNum, ...savedTicketNumbers])];
    setSavedTicketNumbers(updated);
    localStorage.setItem('km_saved_tickets', JSON.stringify(updated));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    setSuccessTicket(null);

    // Prepare sender metadata
    const senderName = user ? user.name : 'Masyarakat Umum';
    const senderEmail = user ? user.email : '';

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pelaporName: senderName,
          pelaporEmail: senderEmail,
          category,
          subCategory,
          title,
          description,
          anonymous,
          supportingEvidence: evidenceBase64 || undefined,
          supportingEvidenceName: evidenceName || undefined
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengirim pengaduan');
      }

      setSuccessTicket(result.complaint.ticketNumber);
      saveTicketToLocal(result.complaint.ticketNumber);
      
      // Clear fields
      setTitle('');
      setDescription('');
      setEvidenceBase64('');
      setEvidenceName('');
      
      // Refresh database
      await onRefreshComplaints();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTried(true);
    const found = complaints.find(
      c => c.ticketNumber.toLowerCase().trim() === searchQuery.toLowerCase().trim()
    );
    setSearchedComplaint(found || null);
  };

  const handleSaveTicketInput = (ticketNum: string) => {
    saveTicketToLocal(ticketNum);
    setSearchQuery(ticketNum);
    const found = complaints.find(c => c.ticketNumber === ticketNum);
    if (found) {
      setSearchedComplaint(found);
    }
  };

  // My filtered active submissions: either matches verified email, or stored locally
  const mySubmissions = complaints.filter(c => {
    if (user && c.pelaporEmail && c.pelaporEmail.toLowerCase() === user.email.toLowerCase()) {
      return true;
    }
    return savedTicketNumbers.includes(c.ticketNumber);
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto" id="pelapor-view-hub">
      
      {/* Informative Security Hero Card */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/50 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-100 border border-emerald-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Keamanan Pelapor Terjamin 100%
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Kanal Pengaduan & Aspirasi Madrasah Aman</h2>
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
            Laporkan setiap pelanggaran kode etik, perundungan (bullying), pungli, maupun kerusakan sarana sekolah dengan aman. Identitas Anda dijaga ketat, dan Anda dapat memilih untuk melapor secara pelapor <b>Anonim</b> tanpa meninggalkan nama.
          </p>
        </div>
        <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 shrink-0 backdrop-blur-sm">
          <Key className="w-8 h-8 text-emerald-400 shrink-0" />
          <div className="text-xs max-w-[180px]">
            <span className="font-bold block text-emerald-200">SOP Resmi BK/Kepsek</span>
            Setiap aduan dikerjakan berjenjang sesuai flowchart instansi madrasah.
          </div>
        </div>
      </div>

      {/* Grid: Complaint Submission vs Ticket Directory Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Pengaduan */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3- border-b border-slate-100 pb-4">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg mr-3">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Buat Pengaduan Baru</h3>
              <p className="text-xs text-slate-500">Sampaikan aspirasi atau bukti pelanggaran Anda</p>
            </div>
          </div>

          {successTicket && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs text-center space-y-2 animate-fade-in">
              <span className="font-bold block text-sm">🎉 Berhasil Mengajukan Pengaduan!</span>
              <span>Nomor tiket rahasia Anda adalah:</span>
              <div className="my-2">
                <span className="font-mono text-base font-extrabold bg-white border border-emerald-300 px-3 py-1 rounded inline-block">
                  {successTicket}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Tiket ini telah disimpan ke buku pelacakan browser Anda. Jaga kerahasiaan nomor tiket ini untuk memonitor progres tanggapan.
              </p>
              <button
                onClick={() => setSuccessTicket(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer"
              >
                Kirim Pengaduan Baru Lainnya
              </button>
            </div>
          )}

          {!successTicket && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Kategori Layanan
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Pengaduan Pelanggaran">Pengaduan Pelanggaran</option>
                    <option value="Informasi">Hanya Informasi / Aspirasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Sub-Kategori / Topik
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {subCategories[category].map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Judul Pokok Pengaduan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lampu toilet kelas VII bocor / Pembullyan setelah jam pulang"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Deskripsi / Kronologi Kejadian Terperinci
                </label>
                <textarea
                  rows={5}
                  placeholder="Tuliskan secara lengkap terkait masalah: Apa, Siapa, Kapan, Dimana, dan Bagaimana kejadiannya. Kami akan melakukan verifikasi menyeluruh."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Optional Supporting Evidence Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Bukti Dukung (Opsional)
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 transition-all flex flex-col items-center justify-center text-center text-xs ${
                    dragActive
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  {evidenceName ? (
                    <div className="space-y-1.5 w-full">
                      <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[250px]">{evidenceName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEvidenceBase64('');
                          setEvidenceName('');
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus Berkas
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-600">
                        Seret & lepas berkas ke sini, atau{' '}
                        <label className="text-emerald-600 hover:text-emerald-850 underline cursor-pointer font-bold">
                          pilih berkas
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(e.target.files[0]);
                              }
                            }}
                            className="hidden"
                            accept="image/*,application/pdf"
                          />
                        </label>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Dukung Gambar atau PDF (Maks. 5MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Anonymous Slider / Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    {anonymous ? <EyeOff className="w-4 h-4 text-rose-500" /> : <Eye className="w-4 h-4 text-indigo-500" />}
                    Laporkan Secara Anonim
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Sembunyikan nama pendaftar Anda dari riwayat aduan publik dan petugas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnonymous(!anonymous)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none flex items-center cursor-pointer ${anonymous ? 'bg-rose-500' : 'bg-slate-300'}`}
                >
                  <span className={`w-4 id-circle h-4 bg-white rounded-full transition-transform absolute shadow-sm ${anonymous ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/10 transition-colors cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim laporan aman...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Pengaduan Ke Sistem</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Pelacakan & Riwayat Tiket */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Search Ticket */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Search className="w-4.5 h-4.5 text-emerald-600" />
              Lacak Satus Tiket Pengaduan
            </h3>
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan Nomor Tiket (KM-...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cari
              </button>
            </form>

            {searchTried && (
              <div className="animate-fade-in border-t border-slate-100 pt-3">
                {searchedComplaint ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold font-mono text-slate-500">{searchedComplaint.ticketNumber}</span>
                      <StatusBadge status={searchedComplaint.status} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-700 clamp-1">{searchedComplaint.title}</h4>
                    <button
                      onClick={() => setSelectedComplaint(searchedComplaint)}
                      className="w-full text-center text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-100 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Buka Kronologi & Progress Tindakan
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-rose-600 p-2 text-center bg-rose-50 border border-rose-100 rounded-lg">
                    ⚠️ Tiket tidak ditemukan atau salah pengetikan.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buku Tiket Saya (LocalStorage list of tickets) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ListTodo className="w-4.5 h-4.5 text-emerald-600" />
              Buku Tiket & Laporan Saya {user && `(${user.name})`}
            </h3>

            {mySubmissions.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Info className="w-5 h-5 mx-auto mb-2 text-slate-300" />
                Belum ada tiket terdaftar di perangkat ini.
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {mySubmissions.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-all flex flex-col gap-2 relative shadow-xs"
                    id={`saved-ticket-card-${c.id}`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-slate-600 select-all">{c.ticketNumber}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{c.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(c.createdAt).toLocaleDateString('id-ID')}</span>
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer"
                      >
                        Detail & Timelines
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Selected detailed logs popup modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

    </div>
  );
};
