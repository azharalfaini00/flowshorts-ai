import { useState } from 'react';
import { BookOpen, Sparkles, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { StoryOutline, StoryScene } from '../types';

const GENRE_OPTIONS = [
  { value: 'Komedi', label: '😂 Komedi' },
  { value: 'Dramatis', label: '🎭 Dramatis' },
  { value: 'Komedi Dramatis', label: '😂🎭 Komedi Dramatis' },
  { value: 'Horor', label: '👻 Horor' },
  { value: 'Romance', label: '💕 Romance' },
  { value: 'Aksi & Petualangan', label: '⚔️ Aksi & Petualangan' },
  { value: 'Fantasi', label: '🧙 Fantasi' },
  { value: 'Misteri & Thriller', label: '🔍 Misteri & Thriller' },
  { value: 'Motivasi & Inspirasi', label: '🔥 Motivasi & Inspirasi' },
  { value: 'Slice of Life', label: '☕ Slice of Life' },
];

const EMOTION_COLORS: Record<string, string> = {
  lucu: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  kocak: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  komedi: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  dramatis: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  sedih: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  mengejutkan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  epik: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  romantis: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  menegangkan: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  horor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function getEmotionColor(emosi: string): string {
  const key = emosi.toLowerCase();
  for (const k of Object.keys(EMOTION_COLORS)) {
    if (key.includes(k)) return EMOTION_COLORS[k];
  }
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
}

interface StoryPlannerProps {
  storyOutline: StoryOutline | null;
  setStoryOutline: (outline: StoryOutline | null) => void;
  sceneCount: number;
  isGenerating: boolean;
  referenceImages: any[]; // Or properly import ReferenceImageItem
}

export default function StoryPlanner({ storyOutline, setStoryOutline, sceneCount, isGenerating, referenceImages = [] }: StoryPlannerProps) {
  const [premise, setPremise] = useState('');
  const [genre, setGenre] = useState('Komedi Dramatis');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<StoryScene | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleGenerateStory = async () => {
    if (!premise.trim()) return;
    setIsGeneratingStory(true);
    setErrorMsg('');
    try {
      const payload = { 
        premise: premise.trim(), 
        genre, 
        sceneCount,
        referenceImages: referenceImages.map(img => ({
          mimeType: img.mimeType,
          base64: img.base64,
        }))
      };

      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat alur cerita.');
      setStoryOutline(data);
      setExpandedIndex(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const startEdit = (idx: number, scene: StoryScene) => {
    setEditingIndex(idx);
    setEditDraft({ ...scene });
  };

  const saveEdit = () => {
    if (!storyOutline || !editDraft || editingIndex === null) return;
    const updated = { ...storyOutline };
    updated.adegan = [...updated.adegan];
    updated.adegan[editingIndex] = editDraft;
    setStoryOutline(updated);
    setEditingIndex(null);
    setEditDraft(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditDraft(null);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-rose-500" />
          2. Buat Alur Cerita (Tahap 2)
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Tulis perintah seperti "buatkan alur dari referensi gambar" atau ide cerita lainnya, pilih genre, lalu generate.
        </p>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Ide / Premis Cerita
          </label>
          <textarea
            disabled={isGeneratingStory || isGenerating}
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            placeholder='Contoh: "Buatkan alur dari referensi gambar di atas yang lucu dan kocak..."'
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-hidden disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Genre / Mood
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map((g) => (
              <button
                key={g.value}
                type="button"
                disabled={isGeneratingStory || isGenerating}
                onClick={() => setGenre(g.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  genre === g.value
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={(!premise.trim() && referenceImages.length === 0) || isGeneratingStory || isGenerating}
          onClick={handleGenerateStory}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-950/50"
        >
          {isGeneratingStory ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              <span>Menyusun Alur Cerita...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-rose-500" />
              <span>🎭 Generate Alur Cerita</span>
            </>
          )}
        </button>

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>

      {/* Story Outline Result */}
      {storyOutline && (
        <div className="mt-5">
          <div className="mb-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">✅ Alur Berhasil Dibuat</p>
                <h3 className="mt-0.5 text-sm font-bold text-indigo-900 dark:text-indigo-200 truncate">{storyOutline.judul}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {storyOutline.genre}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    {storyOutline.adegan.length} Adegan
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-indigo-800 dark:text-indigo-300">
                  {storyOutline.ringkasan}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStoryOutline(null)}
                className="shrink-0 rounded-full p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/60"
                title="Hapus alur cerita ini"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {storyOutline.adegan.map((scene, idx) => {
              const isExpanded = expandedIndex === idx;
              const isEditing = editingIndex === idx;

              return (
                <div key={scene.no} className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between p-3 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-white dark:bg-zinc-200 dark:text-zinc-900">
                        {scene.no}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{scene.judul}</p>
                        <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${getEmotionColor(scene.emosi)}`}>
                          {scene.emosi}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); startEdit(idx, scene); }}
                        className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title="Edit adegan ini"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-zinc-100 px-3 pb-3 pt-2 dark:border-zinc-800">
                      {isEditing && editDraft ? (
                        <div className="space-y-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold text-zinc-500">Judul Adegan</label>
                            <input
                              type="text"
                              value={editDraft.judul}
                              onChange={(e) => setEditDraft({ ...editDraft, judul: e.target.value })}
                              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-bold text-zinc-500">Deskripsi</label>
                            <textarea
                              rows={3}
                              value={editDraft.deskripsi}
                              onChange={(e) => setEditDraft({ ...editDraft, deskripsi: e.target.value })}
                              className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-bold text-zinc-500">Emosi</label>
                              <input
                                type="text"
                                value={editDraft.emosi}
                                onChange={(e) => setEditDraft({ ...editDraft, emosi: e.target.value })}
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold text-zinc-500">Aksi Kunci</label>
                              <input
                                type="text"
                                value={editDraft.aksi_kunci}
                                onChange={(e) => setEditDraft({ ...editDraft, aksi_kunci: e.target.value })}
                                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-rose-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <Check className="h-3.5 w-3.5" /> Simpan
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              <X className="h-3.5 w-3.5" /> Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">{scene.deskripsi}</p>
                          <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-2.5 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                            <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">⚡ Aksi Kunci</p>
                            <p className="mt-0.5 text-xs italic text-amber-800 dark:text-amber-300">"{scene.aksi_kunci}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center gap-2">
            <span className="text-base">✅</span>
            <span>Alur siap! Lanjutkan ke bawah untuk mengatur parameter dan klik <strong>Generate Visual Storyboard & Prompt</strong>.</span>
          </div>
        </div>
      )}
    </div>
  );
}
