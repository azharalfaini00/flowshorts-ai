import { useState } from 'react';
import { TrendingUp, Hash, Copy, Check, MessageSquare, FileText, Share2, Tag } from 'lucide-react';
import { ViralMetadata } from '../types';

interface ViralSocialKitProps {
  metadata: ViralMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<ViralMetadata>>;
}

export default function ViralSocialKit({ metadata, setMetadata }: ViralSocialKitProps) {
  const [copiedTitleIndex, setCopiedTitleIndex] = useState<number | null>(null);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedViralTags, setCopiedViralTags] = useState(false);
  const [copiedCategoryIndex, setCopiedCategoryIndex] = useState<number | null>(null);
  const [copiedPinned, setCopiedPinned] = useState(false);

  const copyToClipboard = async (text: string, onSuccess: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyTitle = (title: string, index: number) => {
    copyToClipboard(title, () => {
      setCopiedTitleIndex(index);
      setTimeout(() => setCopiedTitleIndex(null), 2000);
    });
  };

  const handleCopyDesc = () => {
    copyToClipboard(metadata.youtube_description, () => {
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2000);
    });
  };

  const handleCopyViralTags = () => {
    copyToClipboard(metadata.viral_hashtags.join(' '), () => {
      setCopiedViralTags(true);
      setTimeout(() => setCopiedViralTags(false), 2000);
    });
  };

  const handleCopyCategoryTags = (tags: string[], index: number) => {
    copyToClipboard(tags.join(' '), () => {
      setCopiedCategoryIndex(index);
      setTimeout(() => setCopiedCategoryIndex(null), 2000);
    });
  };

  const handleCopyPinned = () => {
    copyToClipboard(metadata.pinned_comment_suggestion, () => {
      setCopiedPinned(true);
      setTimeout(() => setCopiedPinned(false), 2000);
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            5. Studio Viralitas (Judul, Deskripsi & Hashtag SEO)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Formula metadata optimal untuk menjangkau audiens YouTube Shorts, TikTok, dan Instagram Reels secara luas
          </p>
        </div>

        {/* Copy All Kit */}
        <button
          type="button"
          onClick={() => {
            const allText = `🔥 JUDUL REKOMENDASI:\n${metadata.viral_titles.join('\n')}\n\n🏷️ HASHTAG UTAMA:\n${metadata.viral_hashtags.join(' ')}\n\n📝 DESKRIPSI LENGKAP:\n${metadata.youtube_description}\n\n💬 PINNED COMMENT:\n${metadata.pinned_comment_suggestion}`;
            copyToClipboard(allText, () => {
              setCopiedDesc(true);
              setTimeout(() => setCopiedDesc(false), 2000);
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Salin Paket Lengkap</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* 1. Judul Viral Berdaya Klik Tinggi (High-CTR) */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span>Pilihan Judul Shorts Viral (CTR Booster)</span>
            <span className="text-[11px] font-normal text-zinc-400">Klik untuk menyalin judul favoritmu</span>
          </label>
          <div className="space-y-1.5">
            {metadata.viral_titles.map((title, idx) => {
              const isCopied = copiedTitleIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleCopyTitle(title, idx)}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-2.5 transition hover:border-emerald-400 hover:bg-emerald-50/20 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-emerald-500/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {title}
                    </span>
                  </div>
                  <div className="ml-2 shrink-0 text-xs font-medium text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {isCopied ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <Check className="h-3.5 w-3.5" /> Tersalin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" /> Salin
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Hashtag Utama Viral */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-rose-500" />
              Hashtag Viral Utama (Wajib Pasang di Judul/Deskripsi)
            </label>
            <button
              type="button"
              onClick={handleCopyViralTags}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
            >
              {copiedViralTags ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedViralTags ? 'Tersalin!' : 'Salin Semua Tag'}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {metadata.viral_hashtags.map((tag, idx) => (
              <span
                key={idx}
                onClick={() => copyToClipboard(tag, () => {})}
                className="inline-flex cursor-pointer items-center rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900"
                title="Klik untuk salin tag ini"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 3. Deskripsi Lengkap YouTube Shorts */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              Deskripsi YouTube Shorts Siap Pakai (SEO & Call to Action)
            </label>
            <button
              type="button"
              onClick={handleCopyDesc}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              {copiedDesc ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedDesc ? 'Tersalin!' : 'Salin Deskripsi'}</span>
            </button>
          </div>
          <textarea
            rows={5}
            value={metadata.youtube_description}
            onChange={(e) =>
              setMetadata({ ...metadata, youtube_description: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 font-sans text-xs leading-relaxed text-zinc-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
          />
        </div>

        {/* 4. Hashtag Pendukung (Categorized SEO Reach) */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-amber-500" />
            Hashtag Pendukung untuk Jangkauan Algoritma Luas
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {metadata.supporting_hashtags.map((cat, idx) => {
              const isCopied = copiedCategoryIndex === idx;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-800/30"
                >
                  <div>
                    <div className="mb-1.5 flex items-center justify-between border-b border-zinc-200/50 pb-1.5 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                        {cat.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCategoryTags(cat.tags, idx)}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        {isCopied ? 'Tersalin!' : 'Salin'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.tags.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Pinned Comment Suggestion */}
        {metadata.pinned_comment_suggestion && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 dark:border-indigo-950 dark:bg-indigo-950/30">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                Ide Komentar Disematkan (Pinned Comment Booster)
              </span>
              <button
                type="button"
                onClick={handleCopyPinned}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                {copiedPinned ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPinned ? 'Tersalin!' : 'Salin Komentar'}</span>
              </button>
            </div>
            <p className="text-xs text-indigo-950 dark:text-indigo-300">
              "{metadata.pinned_comment_suggestion}"
            </p>
            <p className="mt-1 text-[10px] text-indigo-700/70 dark:text-indigo-400/70">
              💡 Pasang dan pin komentar ini segera setelah video diunggah untuk memancing interaksi penonton & memicu rekomendasi YouTube Shorts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
