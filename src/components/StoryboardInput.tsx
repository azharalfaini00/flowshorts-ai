import { useState, useRef } from 'react';
import { Upload, X, Eye, ImageIcon } from 'lucide-react';
import { ReferenceImageItem } from '../types';

interface StoryboardInputProps {
  premise: string;
  setPremise: (val: string) => void;
  animationStyle: string;
  setAnimationStyle: (val: string) => void;
  referenceImages: ReferenceImageItem[];
  setReferenceImages: React.Dispatch<React.SetStateAction<ReferenceImageItem[]>>;
  isGenerating: boolean;
}

export default function StoryboardInput({
  animationStyle,
  setAnimationStyle,
  referenceImages,
  setReferenceImages,
  isGenerating,
}: Omit<StoryboardInputProps, 'premise' | 'setPremise'>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newItem: ReferenceImageItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          mimeType: file.type,
          base64,
          previewUrl: base64,
        };
        setReferenceImages((prev) => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== id));
  };

  const hasImages = referenceImages.length > 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-rose-500" />
              1. Input Gambar Sketsa (Tahap 1)
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Unggah gambar sketsa atau referensi (dari ChatGPT/Midjourney). Gambar ini akan dibaca AI untuk membantu menyusun alur cerita dan prompt JSON Anda.
            </p>
          </div>
          {hasImages && (
            <span className="ml-3 shrink-0 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              {referenceImages.length} Gambar
            </span>
          )}
        </div>
      </div>



      {/* Animation Style Dropdown */}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          Gaya Animasi (Art Style)
        </label>
        <select
          disabled={isGenerating}
          value={animationStyle || 'Modern Anime Aesthetic'}
          onChange={(e) => setAnimationStyle(e.target.value)}
          className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:border-rose-500 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-hidden disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="Modern Anime Aesthetic (Studio Ghibli / Makoto Shinkai style)">2D Anime (Studio Ghibli / Makoto Shinkai)</option>
          <option value="3D Pixar/Disney Animation Style">3D Animasi (Pixar / Disney)</option>
          <option value="Cartoon Network Comic Style, vibrant colors">Kartun 2D (Comic Style)</option>
          <option value="Cinematic Realistic, hyper-detailed, Unreal Engine 5">Cinematic Realistis (Unreal Engine 5)</option>
          <option value="Flat Vector Illustration, minimal corporate style">Flat Vector (Minimalis)</option>
          <option value="Claymation / Stop Motion Animation">Stop Motion / Claymation</option>
        </select>
      </div>

      {/* Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isGenerating && fileInputRef.current?.click()}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 text-center transition ${
          isGenerating
            ? 'pointer-events-none opacity-50'
            : dragActive
            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
            : 'border-zinc-200 bg-zinc-50/50 hover:border-rose-400 hover:bg-rose-50/30 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-rose-600 dark:hover:bg-rose-950/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isGenerating}
        />
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs transition-transform group-hover:scale-110 ${dragActive ? 'bg-rose-100 dark:bg-rose-900/40' : 'bg-white dark:bg-zinc-800'}`}>
          {dragActive ? (
            <ImageIcon className="h-7 w-7 text-rose-500" />
          ) : (
            <Upload className="h-7 w-7 text-rose-500" />
          )}
        </div>
        <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {dragActive ? 'Lepaskan untuk mengunggah' : 'Klik atau seret gambar ke sini'}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          Mendukung sketsa, concept art, frame komik — PNG, JPG, WEBP
        </p>
        {!hasImages && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            💡 Semakin banyak gambar referensi = hasil storyboard semakin akurat
          </p>
        )}
      </div>

      {/* Preview of uploaded reference images */}
      {hasImages && (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {referenceImages.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <img
                src={img.previewUrl}
                alt={img.name}
                className="h-28 w-full object-cover"
              />
              <div className="p-1.5">
                <p className="truncate text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                  {img.name}
                </p>
              </div>

              {/* Hover overlay actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewModalImg(img.previewUrl);
                  }}
                  className="rounded-full bg-white/90 p-1.5 text-zinc-800 hover:bg-white"
                  title="Lihat Lebih Jelas"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  className="rounded-full bg-rose-600 p-1.5 text-white hover:bg-rose-700"
                  title="Hapus"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="flex h-full min-h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 text-zinc-400 transition hover:border-rose-400 hover:text-rose-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:hover:border-rose-600"
          >
            <Upload className="h-5 w-5" />
            <span className="mt-1 text-[10px] font-medium">Tambah lagi</span>
          </button>
        </div>
      )}

      {/* Lightbox modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalImg(null)}
        >
          <div className="relative max-h-[85vh] max-w-2xl overflow-hidden rounded-2xl bg-zinc-900 p-2 shadow-2xl">
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute top-4 right-4 rounded-full bg-zinc-800/80 p-1.5 text-white hover:bg-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewModalImg}
              alt="Reference Preview"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
