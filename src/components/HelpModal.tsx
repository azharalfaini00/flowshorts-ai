import { X, CheckCircle, Video, Flame, Sparkles, Layers } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Panduan Kreator YouTube Shorts Animasi AI
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-950 dark:bg-rose-950/30">
            <h4 className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-rose-600" />
              1. Cara Memakai Prompt di Google Flow AI
            </h4>
            <p className="mt-1">
              Google Flow AI dan model video diffusion memerlukan deskripsi subjek, pergerakan kamera, dan pencahayaan yang sangat spesifik. Setiap prompt yang dihasilkan di FlowShorts AI sudah diformat dengan struktur: <em>[Subjek & Tindakan] + [Gaya Animasi] + [Gerakan Kamera] + [Pencahayaan Atmosfer] + [Keywords Kualitas 8K]</em>.
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-950 dark:bg-amber-950/30">
            <h4 className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-600" />
              2. Mengapa Hook 0-3 Detik Sangat Penting?
            </h4>
            <p className="mt-1">
              Algoritma YouTube Shorts mengukur retensi penonton di 3 detik pertama (<em>Viewed vs Swiped Away</em> rasio harus di atas 75% untuk viral). Hook yang dibuat di tab Studio Hook memberikan petunjuk visual instan dan ucapan pembuka bertegangan tinggi.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-950 dark:bg-indigo-950/30">
            <h4 className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-600" />
              3. Menggunakan Referensi Gambar Device
            </h4>
            <p className="mt-1">
              Jika Anda memiliki sketsa karakter, concept art dari Midjourney/Stable Diffusion, atau foto referensi storyboard dari perangkat Anda, unggah di Bagian 1. Gemini akan memindai fitur wajah, kostum, dan warna agar semua prompt scene tetap konsisten di Google Flow AI.
            </p>
          </div>

          <div className="pt-2">
            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
              Tips Optimasi Metadata Viral YouTube Shorts:
            </h4>
            <ul className="space-y-1 list-disc pl-4">
              <li>Gunakan huruf kapital pada 1-2 kata emosional di judul (cth: JANGAN, TERBONGKAR, AKHIRNYA).</li>
              <li>Pasang 3-5 hashtag utama langsung di kolom deskripsi atau akhir judul.</li>
              <li>Sematkan (Pin) pertanyaan di komentar pertama untuk menstimulasi penonton berdiskusi.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Mengerti & Mulai Berkarya
          </button>
        </div>
      </div>
    </div>
  );
}
