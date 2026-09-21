import { useState } from 'react';
import { Sparkles, Bookmark, HelpCircle, Film, LogOut, User, Wand2, Menu, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Brand identity */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md shadow-rose-500/20">
            <Film className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                FlowShorts <span className="text-rose-600 dark:text-rose-400">AI</span>
              </h1>
              <span className="hidden items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20 sm:inline-flex dark:bg-rose-950/50 dark:text-rose-300">
                Google Flow AI
              </span>
            </div>
            <p className="hidden text-[11px] text-zinc-500 sm:block dark:text-zinc-400">
              Storyboard &amp; Video Prompt Studio
            </p>
          </div>
        </div>

        {/* Desktop action buttons (hidden on mobile) */}
        <div className="hidden items-center gap-2 sm:flex">
          {status === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-xs hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
              title="Admin Dashboard"
            >
              <User className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          <button
            type="button"
            onClick={onOpenImageGenerator}
            id="open-image-generator-btn"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-xs hover:from-violet-100 hover:to-pink-100 transition-all dark:border-violet-800/60 dark:from-violet-950/40 dark:to-pink-950/40 dark:text-violet-300"
            title="Generate Gambar dengan DALL-E 3"
          >
            <Wand2 className="h-3.5 w-3.5 text-violet-500" />
            Generate Gambar
          </button>

          <button
            type="button"
            onClick={onLoadPreset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Muat Contoh Storyboard Anime Siap Pakai"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Contoh Preset
          </button>

          <button
            type="button"
            onClick={onOpenSaved}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Bookmark className="h-3.5 w-3.5 text-indigo-500" />
            Proyek
            {savedCount > 0 && (
              <span className="ml-0.5 rounded-full bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {savedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="Bantuan"
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

          <button
            type="button"
            onClick={signOut}
            title="Keluar"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>

        {/* Mobile: icon buttons (Proyek + hamburger) */}
        <div className="flex items-center gap-1.5 sm:hidden">
          {/* Proyek always visible on mobile */}
          <button
            type="button"
            onClick={onOpenSaved}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <Bookmark className="h-4 w-4 text-indigo-500" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>

          {/* Hamburger menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 sm:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-2">
            {status === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400"
              >
                <User className="h-4 w-4" />
                Admin Dashboard
              </Link>
            )}

            <button
              type="button"
              onClick={() => { onOpenImageGenerator(); setMenuOpen(false); }}
              className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:border-violet-900/50 dark:bg-violet-900/20 dark:text-violet-300"
            >
              <Wand2 className="h-4 w-4 text-violet-500" />
              Generate Gambar (AI)
            </button>

            <button
              type="button"
              onClick={() => { onLoadPreset(); setMenuOpen(false); }}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Contoh Preset
            </button>

            <button
              type="button"
              onClick={() => { onOpenHelp(); setMenuOpen(false); }}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <HelpCircle className="h-4 w-4 text-zinc-500" />
              Panduan Flow AI
            </button>

            <button
              type="button"
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
