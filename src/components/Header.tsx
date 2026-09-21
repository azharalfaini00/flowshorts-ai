import { Sparkles, Video, Bookmark, HelpCircle, Film, LogOut, User, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenSaved: () => void;
  savedCount: number;
  onOpenHelp: () => void;
  onLoadPreset: () => void;
  onOpenImageGenerator: () => void;
}

export default function Header({
  onOpenSaved,
  savedCount,
  onOpenHelp,
  onLoadPreset,
  onOpenImageGenerator,
}: HeaderProps) {
  const { user, status, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Brand identity */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md shadow-rose-500/20">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-900 sm:text-lg dark:text-zinc-50">
                FlowShorts <span className="text-rose-600 dark:text-rose-400">AI</span>
              </h1>
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/50 dark:text-rose-300">
                Google Flow AI
              </span>
            </div>
            <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
              Storyboard & Video Prompt Studio • YT Shorts Animasi
            </p>
          </div>
        </div>

        {/* Action buttons — icon-only on mobile, labeled on sm+ */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {status === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
              title="Admin Dashboard"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onOpenImageGenerator}
            id="open-image-generator-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-xs hover:from-violet-100 hover:to-pink-100 dark:border-violet-800/60 dark:from-violet-950/40 dark:to-pink-950/40 dark:text-violet-300 dark:hover:from-violet-900/40 dark:hover:to-pink-900/40 transition-all"
            title="Generate Gambar dengan DALL-E 3"
          >
            <Wand2 className="h-3.5 w-3.5 text-violet-500" />
            <span className="hidden sm:inline">Generate Gambar</span>
          </button>

          <button
            type="button"
            onClick={onLoadPreset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Muat Contoh Storyboard Anime Siap Pakai"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Contoh Preset</span>
          </button>

          <button
            type="button"
            onClick={onOpenSaved}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Bookmark className="h-3.5 w-3.5 text-indigo-500" />
            <span>Proyek</span>
            {savedCount > 0 && (
              <span className="ml-0.5 rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {savedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="Bantuan Panduan"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700"></div>

          <button
            type="button"
            onClick={signOut}
            title="Keluar"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
