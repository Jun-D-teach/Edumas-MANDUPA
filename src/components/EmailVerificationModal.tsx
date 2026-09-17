/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

interface EmailVerificationModalProps {
  email: string;
  onSuccess: (verifiedUser: any) => void;
  onClose: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  onSuccess,
  onClose
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.length < 6) {
      setError('Kode PIN harus berisi 6 digit angka.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal melakukan verifikasi.');
      }
      setSuccess(true);
      setTimeout(() => {
        onSuccess(result.user);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Koneksi gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
        <div className="h-2 bg-emerald-600 w-full" />
        <div className="p-6 md:p-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              {success ? (
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              ) : (
                <Mail className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800">Verifikasi Email Anda</h3>
            <p className="text-xs text-slate-500 mt-2">
              Sistem telah mendistribusikan kode verifikasi pendaftaran akun Anda ke email:
            </p>
            <p className="text-sm font-semibold text-emerald-700 mt-1 select-all break-all bg-emerald-50 px-3 py-1 rounded inline-block">
              {email}
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center">
              ️ {error}
            </div>
          )}

          {success ? (
            <div className="mt-6 text-center animate-pulse">
              <p className="text-sm font-semibold text-emerald-700">Akun Berhasil Diverifikasi!</p>
              <p className="text-xs text-slate-500 mt-1">Mengalihkan Anda ke halaman utama...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
                  Masukkan 6-Digit PIN Verifikasi
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center font-mono text-2xl tracking-[0.5em] pl-[0.5em] py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Aktifkan Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              onClick={onClose}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
            >
              Batal & Kembali ke Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};