import { useState } from 'react';
import { Flame, Copy, Check, Eye, Volume2, Sparkles, Plus, Trash2 } from 'lucide-react';
import { ViralHook } from '../types';

interface ViralHookStudioProps {
  hooks: ViralHook[];
  setHooks: React.Dispatch<React.SetStateAction<ViralHook[]>>;
}

export default function ViralHookStudio({ hooks, setHooks }: ViralHookStudioProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newHook, setNewHook] = useState<ViralHook>({
    type: 'Custom Hook',
    hook_text: '',
    visual_cue: '',
    audio_cue: '',
  });

  const handleCopyHook = async (hook: ViralHook, index: number) => {
    const textToCopy = `[${hook.type}]\nKalimat Hook: "${hook.hook_text}"\nVisual (0-3s): ${hook.visual_cue}\nAudio Cue: ${hook.audio_cue}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyAllHooks = async () => {
    const text = hooks
      .map(
        (h, i) =>
          `🔥 Hook #${i + 1} (${h.type}):\n"${h.hook_text}"\nVisual: ${h.visual_cue}\nAudio: ${h.audio_cue}\n`
      )
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const addCustomHook = () => {
    if (!newHook.hook_text.trim()) return;
    setHooks((prev) => [...prev, newHook]);
    setNewHook({
      type: 'Custom Hook',
      hook_text: '',
      visual_cue: '',
      audio_cue: '',
    });
    setShowAddCustom(false);
  };

  const deleteHook = (index: number) => {
    setHooks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            <Flame className="h-4 w-4 text-amber-500" />
            4. Hook Penahan Penonton (0-3 Detik Shorts Retention)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hook visual dan suara dirancang khusus sesuai storyboard untuk mencegah penonton swipe away di 3 detik pertama
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAllHooks}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedAll ? 'Tersalin Semua!' : 'Salin Semua Hook'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddCustom(!showAddCustom)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-rose-300 bg-rose-50/50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Hook</span>
          </button>
        </div>
      </div>

      {/* Add Custom Hook Inline Form */}
      {showAddCustom && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/30 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/20">
          <h4 className="mb-2 text-xs font-bold text-rose-900 dark:text-rose-200">
            Tambah Hook Manual Baru
          </h4>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                Teks / Kalimat Hook (Ucapkan di detik 0):
              </label>
              <input
                type="text"
                value={newHook.hook_text}
                onChange={(e) => setNewHook({ ...newHook, hook_text: e.target.value })}
                placeholder="Cth: Jangan pernah nonton video ini sendirian..."
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Visual Cue (Aksi di layar detik 0-2):
                </label>
                <input
                  type="text"
                  value={newHook.visual_cue}
                  onChange={(e) => setNewHook({ ...newHook, visual_cue: e.target.value })}
                  placeholder="Cth: Zoom in cepat ke mata karakter yang menyala merah"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Audio Cue (Sound effect / Beat):
                </label>
                <input
                  type="text"
                  value={newHook.audio_cue}
                  onChange={(e) => setNewHook({ ...newHook, audio_cue: e.target.value })}
                  placeholder="Cth: Suara petir keras + bass drop"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="rounded-lg px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={addCustomHook}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
              >
                Simpan Hook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hook Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {hooks.map((hook, idx) => {
          const isCopied = copiedIndex === idx;

          return (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5 transition-all hover:border-amber-400 hover:bg-white hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-amber-500/50"
            >
              <div>
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2 dark:border-zinc-800">
                  <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                    {hook.type}
                  </span>
                  {hooks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteHook(idx)}
                      className="text-zinc-400 hover:text-rose-500"
                      title="Hapus hook"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Spoken Hook Text */}
                <div className="my-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                    Teks / Dialog Hook:
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    "{hook.hook_text}"
                  </p>
                </div>

                {/* Visual Cue */}
                <div className="mb-2 flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                  <div>
                    <strong className="text-zinc-800 dark:text-zinc-200">Visual (0-3s):</strong>{' '}
                    <span>{hook.visual_cue}</span>
                  </div>
                </div>

                {/* Audio Cue */}
                <div className="flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <Volume2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                  <div>
                    <strong className="text-zinc-800 dark:text-zinc-200">Audio:</strong>{' '}
                    <span>{hook.audio_cue}</span>
                  </div>
                </div>
              </div>

              {/* Copy button */}
              <button
                type="button"
                onClick={() => handleCopyHook(hook, idx)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-semibold">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Hook</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
