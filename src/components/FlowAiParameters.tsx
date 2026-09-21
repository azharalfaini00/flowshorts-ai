import { Sliders, Clock, Smartphone, Monitor, Layers, Video, Sparkles } from 'lucide-react';
import { FlowAiVideoParams } from '../types';
import { CAMERA_PRESETS, LIGHTING_PRESETS } from '../utils/sampleData';

interface FlowAiParametersProps {
  parameters: FlowAiVideoParams;
  setParameters: React.Dispatch<React.SetStateAction<FlowAiVideoParams>>;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
}

export default function FlowAiParameters({
  parameters,
  setParameters,
  isGenerating,
  onGenerate,
  canGenerate,
}: FlowAiParametersProps) {
  const updateParam = <K extends keyof FlowAiVideoParams>(key: K, value: FlowAiVideoParams[K]) => {
    setParameters((prev) => ({ ...prev, [key]: value }));
  };

  const totalDuration = parameters.promptCount * parameters.duration;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Section Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-rose-500" />
            2. Parameter Video Google Flow AI
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Tentukan durasi, aspek rasio, resolusi, dan jumlah scene JSON yang akan di-generate
          </p>
        </div>

        {/* Live Calculation Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <Clock className="h-3.5 w-3.5" />
          <span>
            {parameters.promptCount} Scene × {parameters.duration}s = {totalDuration}s Shorts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Durasi Per Prompt/Scene */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-500" /> Durasi Tiap Scene
            </span>
            <span className="text-rose-600 font-bold dark:text-rose-400">{parameters.duration}s</span>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[3, 4, 5, 8, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => updateParam('duration', sec)}
                className={`rounded-lg border py-2 text-xs font-semibold transition ${
                  parameters.duration === sec
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">Rekomendasi Shorts: 4s - 5s per scene</p>
        </div>

        {/* 2. Rasio Aspek */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-zinc-500" /> Rasio Aspek
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{parameters.aspectRatio}</span>
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { ratio: '9:16' as const, label: '9:16', desc: 'Shorts' },
              { ratio: '16:9' as const, label: '16:9', desc: 'Lanskap' },
              { ratio: '1:1' as const, label: '1:1', desc: 'Kotak' },
              { ratio: '4:5' as const, label: '4:5', desc: 'Feed' },
            ].map((item) => (
              <button
                key={item.ratio}
                type="button"
                onClick={() => updateParam('aspectRatio', item.ratio)}
                className={`flex flex-col items-center rounded-lg border py-1.5 transition ${
                  parameters.aspectRatio === item.ratio
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[9px] ${parameters.aspectRatio === item.ratio ? 'text-white/80' : 'text-zinc-400'}`}>
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">9:16 optimal untuk YT Shorts & TikTok</p>
        </div>

        {/* 3. Resolusi Video */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-zinc-500" /> Resolusi Flow AI
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{parameters.resolution}</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { res: '1080p' as const, label: '1080p', desc: 'FHD (Best)' },
              { res: '720p' as const, label: '720p', desc: 'HD Cepat' },
              { res: '4k' as const, label: '4K', desc: 'Ultra HD' },
            ].map((item) => (
              <button
                key={item.res}
                type="button"
                onClick={() => updateParam('resolution', item.res)}
                className={`flex flex-col items-center rounded-lg border py-1.5 transition ${
                  parameters.resolution === item.res
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[9px] ${parameters.resolution === item.res ? 'text-white/80' : 'text-zinc-400'}`}>
                  {item.desc}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">1080p adalah standar emas Google Flow AI</p>
        </div>

        {/* 4. Berapa Prompt JSON yang Diinginkan */}
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-zinc-500" /> Jumlah Adegan & Prompt
            </span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {parameters.promptCount} Adegan
            </span>
          </label>
          <div className="grid grid-cols-5 gap-1">
            {[2, 3, 4, 5, 6].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => updateParam('promptCount', count)}
                className={`rounded-lg border py-2 text-xs font-bold transition ${
                  parameters.promptCount === count
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">Jumlah adegan di alur cerita & Prompt JSON</p>
        </div>
      </div>

      {/* Advanced Motion & Atmosphere Settings */}
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-100 pt-3 sm:grid-cols-3 dark:border-zinc-800">
        {/* Part Number */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Part / Episode
          </label>
          <div className="flex flex-wrap gap-1">
            {/* Standalone option */}
            <button
              type="button"
              onClick={() => updateParam('partNumber', undefined)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                parameters.partNumber === undefined
                  ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              Standalone
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => updateParam('partNumber', part)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                  parameters.partNumber === part
                    ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                P{part}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-zinc-400">
            {parameters.partNumber === undefined
              ? '✓ Video standalone — tanpa label Part'
              : `✓ Video ini akan diberi label Part ${parameters.partNumber}`}
          </p>
        </div>

        {/* Camera Movement */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Gerakan Kamera Dominan
          </label>
          <select
            value={parameters.cameraMovement}
            onChange={(e) => updateParam('cameraMovement', e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-rose-500 focus:bg-white focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {CAMERA_PRESETS.map((cam, idx) => (
              <option key={idx} value={cam}>
                {cam}
              </option>
            ))}
          </select>
        </div>

        {/* Lighting & Mood */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Pencahayaan & Atmosfer
          </label>
          <select
            value={parameters.lightingMood}
            onChange={(e) => updateParam('lightingMood', e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 focus:border-rose-500 focus:bg-white focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {LIGHTING_PRESETS.map((light, idx) => (
              <option key={idx} value={light}>
                {light}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Generate Button */}
      <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 pt-4 sm:flex-row dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          ✨ Gemini 3.8 Flash akan membuat: <strong>{parameters.promptCount} gambar storyboard baru</strong> berdasarkan referensi visual Anda + <strong>3 Hook Viral</strong> + <strong>Judul & SEO Hashtags</strong>
        </div>

        <button
          type="button"
          disabled={isGenerating || !canGenerate}
          onClick={onGenerate}
          className={`group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-rose-500 to-indigo-500 px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:shadow-xl sm:w-auto ${
            isGenerating || !canGenerate ? 'cursor-not-allowed opacity-50 grayscale' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Menyusun Storyboard...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-200 transition-transform group-hover:scale-110" />
              <span>✨ Generate Visual Storyboard & Prompt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
