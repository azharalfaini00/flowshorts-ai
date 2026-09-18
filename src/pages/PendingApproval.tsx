import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { user, status, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (status === 'approved' || status === 'admin') return <Navigate to="/app" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="mb-2 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          Menunggu Persetujuan
        </h1>
        <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
          Halo <strong>{user.email}</strong>, akun Anda sedang menunggu persetujuan dari Admin. Silakan hubungi pembuat modul jika Anda sudah melakukan pembelian.
        </p>
        
        <button
          onClick={signOut}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
