import { TextareaHTMLAttributes } from 'react';
import { PencilLine, Sparkles } from 'lucide-react';

interface CustomPromptInputProps {
  prompt: string;
  setPrompt: (val: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
  aiProvider: 'gemini' | 'openai' | 'groq';
  setAiProvider: (val: 'gemini' | 'openai' | 'groq') => void;
}

export default function CustomPromptInput({
  prompt,
  setPrompt,
  isGenerating,
  onGenerate,
  canGenerate,
  aiProvider,
  setAiProvider,
}: CustomPromptInputProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <PencilLine className="h-4 w-4 text-rose-500" />
          2. Masukkan Master Prompt JSON
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Ubah atau sesuaikan prompt di bawah ini. AI akan mengikuti arahan ini untuk menghasilkan Prompt Google Flow AI, Hook, dan Metadata.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Pilih AI Engine:</label>
        <select
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value as 'gemini' | 'openai' | 'groq')}
          disabled={isGenerating}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-900 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="groq">Groq (Llama 3.3 70B & Vision)</option>
          <option value="openai">OpenAI (GPT-4o-mini)</option>
          <option value="gemini">Google (Gemini 3.6 Flash)</option>
        </select>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 sm:ml-2">
          (Pastikan API Key untuk AI yang dipilih sudah terpasang di Vercel Settings &gt; Secrets)
        </p>
      </div>

      <textarea
        disabled={isGenerating}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-hidden disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 min-h-[300px]"
      />

      <div className="mt-5 flex items-center justify-end border-t border-zinc-100 pt-4 dark:border-zinc-800">
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
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-200 transition-transform group-hover:scale-110" />
              <span>✨ Generate JSON Prompt & Metadata</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
