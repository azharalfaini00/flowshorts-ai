import { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  ImageIcon,
  Download,
  Loader2,
  Wand2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ART_STYLES = [
  { value: '', label: 'Tanpa Style (Default)' },
  { value: 'Modern Anime Aesthetic, cel-shaded', label: 'Anime Modern' },
  { value: 'Shonen Anime Action, dynamic, vibrant', label: 'Shonen Action' },
  { value: 'Cinematic photorealistic, 8K ultra-detailed', label: 'Cinematic Realis' },
  { value: 'Ghibli Studio soft watercolor animation', label: 'Studio Ghibli' },
  { value: 'Dark fantasy epic illustration', label: 'Dark Fantasy' },
  { value: 'Cyberpunk neon-lit futuristic cityscape', label: 'Cyberpunk' },
  { value: 'Cute chibi cartoon kawaii style', label: 'Chibi / Kawaii' },
  { value: 'Oil painting classical impressionist art', label: 'Lukisan Klasik' },
  { value: 'Minimalist flat design vector illustration', label: 'Flat Design' },
  { value: 'Comic book halftone pop art style', label: 'Comic / Pop Art' },
];

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 Square' },
  { value: '16:9', label: '16:9 Landscape' },
  { value: '9:16', label: '9:16 Portrait' },
];

const QUALITY_OPTIONS = [
  { value: 'standard', label: 'Standard', desc: 'Lebih cepat' },
  { value: 'hd', label: 'HD', desc: 'Lebih detail' },
];

export default function ImageGeneratorModal({ isOpen, onClose }: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'dalle3' | 'pollinations' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedStyle = ART_STYLES.find((s) => s.value === style) || ART_STYLES[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) { setErrorMsg('Tulis prompt gambar terlebih dahulu.'); return; }
    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedUrl(null);
    setImageLoaded(false);
    setImageSource(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style, aspectRatio, quality }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setGeneratedUrl(data.image_url);
      setImageSource(data.source);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal membuat gambar. Coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;
    try {
      const res = await fetch(generatedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dalle-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(generatedUrl, '_blank');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate();
  };

  if (!isOpen) return null;

  const aspectClass =
    aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[480px]' :
    aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-square';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-zinc-700/60 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 shadow-lg shadow-violet-500/30">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Generate Gambar AI</h2>
              <p className="text-xs text-zinc-400">DALL-E 3 powered by OpenAI</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
          {/* Prompt */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              Prompt Gambar
              <span className="ml-auto text-zinc-600 font-normal">Ctrl+Enter untuk generate</span>
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Contoh: seorang ninja berlari di atas atap gedung saat matahari terbenam, anime style"
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          {/* Style */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Art Style</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStyleOpen((p) => !p)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 hover:border-zinc-500 transition-colors"
              >
                <span>{selectedStyle.label}</span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
              </button>
              {isStyleOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 py-1 shadow-xl max-h-48 overflow-y-auto">
                  {ART_STYLES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setStyle(s.value); setIsStyleOpen(false); }}
                      className={`flex w-full items-center px-4 py-2 text-sm text-left hover:bg-zinc-800 transition-colors ${style === s.value ? 'text-violet-400 font-semibold' : 'text-zinc-300'}`}
                    >
                      {s.label}
                      {style === s.value && <CheckCircle2 className="ml-auto h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aspect + Quality */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Rasio</label>
              <div className="flex gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    type="button"
                    onClick={() => setAspectRatio(ar.value)}
                    title={ar.label}
                    className={`flex flex-1 items-center justify-center rounded-lg border py-2 text-xs font-semibold transition-all ${aspectRatio === ar.value ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'}`}
                  >
                    {ar.value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">Kualitas</label>
              <div className="flex gap-1.5 h-[calc(100%-22px)]">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setQuality(q.value as 'standard' | 'hd')}
                    className={`flex flex-1 flex-col rounded-lg border px-2 py-1.5 text-left transition-all ${quality === q.value ? 'border-violet-500 bg-violet-500/10 text-violet-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'}`}
                  >
                    <span className="text-xs font-bold">{q.label}</span>
                    <span className="text-[10px] text-zinc-500">{q.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-xs text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            id="dalle-generate-btn"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Sedang Generate...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generate Gambar</>
            )}
          </button>

          {/* Result */}
          {(isGenerating || generatedUrl) && (
            <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-zinc-400" />Hasil Generate
                </span>
                {imageSource && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${imageSource === 'dalle3' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-zinc-700/60 text-zinc-400 border border-zinc-600/30'}`}>
                    {imageSource === 'dalle3' ? 'DALL-E 3' : 'Pollinations'}
                  </span>
                )}
              </div>
              {isGenerating && !generatedUrl ? (
                <div className={`flex ${aspectClass} w-full max-w-sm mx-auto items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700`}>
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-400 mx-auto mb-2" />
                    <p className="text-xs text-zinc-400">{quality === 'hd' ? 'HD - sekitar 20 detik...' : 'Generating sekitar 10 detik...'}</p>
                  </div>
                </div>
              ) : generatedUrl ? (
                <div className="space-y-3">
                  <div className={`relative ${aspectClass} w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-zinc-800`}>
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                      </div>
                    )}
                    <img
                      src={generatedUrl}
                      alt="Generated by AI"
                      className={`h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />Download
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-violet-700/60 bg-violet-500/10 py-2.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition-colors disabled:opacity-40"
                    >
                      <Sparkles className="h-3.5 w-3.5" />Generate Ulang
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
