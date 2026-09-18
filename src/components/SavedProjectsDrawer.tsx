import { X, Trash2, Calendar, Film, ArrowRight, Download } from 'lucide-react';
import { StoryboardProject } from '../types';

interface SavedProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: StoryboardProject[];
  onSelectProject: (proj: StoryboardProject) => void;
  onDeleteProject: (id: string) => void;
  onClearAll: () => void;
}

export default function SavedProjectsDrawer({
  isOpen,
  onClose,
  savedProjects,
  onSelectProject,
  onDeleteProject,
  onClearAll,
}: SavedProjectsDrawerProps) {
  if (!isOpen) return null;

  const exportAllAsBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedProjects, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `flowshorts-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-900">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Riwayat Storyboard Tersimpan
            </h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {savedProjects.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedProjects.length === 0 ? (
            <div className="py-16 text-center">
              <Film className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Belum ada storyboard tersimpan.
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Storyboard baru yang Anda generate akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            savedProjects.map((proj) => (
              <div
                key={proj.id}
                className="group relative rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 transition hover:border-rose-400 hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-rose-500/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="inline-block rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                      {proj.animationStyle}
                    </span>
                    <h4 className="mt-1 line-clamp-1 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {proj.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {proj.premise}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(proj.createdAt).toLocaleDateString('id-ID')}
                      </span>
                      <span>•</span>
                      <span>{proj.flowAiPrompts?.length || 0} Scene JSON</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <span>Buka Storyboard Ini</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {savedProjects.length > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 p-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={exportAllAsBackup}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Backup Semua (.json)</span>
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              Hapus Semua Riwayat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
