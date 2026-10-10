import { useState, useEffect } from 'react';
import Header from './components/Header';
import StoryboardInput from './components/StoryboardInput';
import CustomPromptInput from './components/CustomPromptInput';
import PromptJsonViewer from './components/PromptJsonViewer';
import ViralHookStudio from './components/ViralHookStudio';
import ViralSocialKit from './components/ViralSocialKit';
import SavedProjectsDrawer from './components/SavedProjectsDrawer';
import HelpModal from './components/HelpModal';
import ImageGeneratorModal from './components/ImageGeneratorModal';
import {
  StoryboardProject,
  FlowAiVideoParams,
  ReferenceImageItem,
  ScenePrompt,
  ViralHook,
  ViralMetadata,
} from './types';
import { INITIAL_PRESET_PROJECT } from './utils/sampleData';
import { AlertCircle, Film, Sparkles, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'flowshorts_ai_saved_projects';

export default function App() {
  // Default user custom prompt
  const defaultPromptText = `MASTER PROMPT — GOOGLE FLOW AI PROMPT ENGINEER

MASTERLOCKIDENTITY • MASTERDIALOGUE • MASTERVVOICE • STORYCONTINUITY

BACA DAN ANALISIS SELURUH REFERENCE IMAGE / STORYBOARD SEBELUM MEMBUAT OUTPUT.

REFERENCE IMAGE / STORYBOARD ADALAH SATU-SATUNYA SUMBER KEBENARAN UNTUK CERITA, DIALOG, KARAKTER, DAN VISUAL.

1. PART LOCK

PART YANG DIMINTA: [ISI PART]

- Buat hanya Part yang diminta.
- Jika tidak ada nomor Part yang ditentukan, gunakan Part 1.
- Jika storyboard memiliki beberapa Part, lanjutkan dari akhir Part sebelumnya jika informasinya tersedia.
- Jangan membuat Part tambahan yang tidak diminta.

2. FORMAT DAN DURASI WAJIB

Setiap Part harus menghasilkan tepat 3 prompt video JSON.

- Prompt 1: 0–10 detik.
- Prompt 2: 10–20 detik.
- Prompt 3: 20–30 detik.
- Total durasi: 30 detik.
- Jangan membuat Prompt 4.
- Jangan membuat satu prompt untuk setiap card.

Baca seluruh storyboard, kemudian kelompokkan semua card ke dalam tiga prompt sesuai urutan cerita. Tidak boleh ada card atau informasi cerita yang sengaja dihilangkan.

3. MASTER DIALOGUE LOCK — PRIORITAS TERTINGGI

Sebelum menulis JSON, baca dan catat seluruh teks pada bagian Narasi/Audio setiap card storyboard.

SEMUA DIALOG YANG DIUCAPKAN HARUS SESUAI PERSIS DENGAN TEKS NARASI/AUDIO PADA STORYBOARD.

Aturan wajib:

1. Salin dialog secara lengkap, kata demi kata.
2. Pertahankan urutan kalimat, kata, dan tanda baca sebisa mungkin.
3. Jangan meringkas, menerjemahkan, memparafrase, memperbaiki, atau mengganti kata dalam dialog.
4. Jangan menambahkan kalimat pembuka, penjelasan, reaksi verbal, pertanyaan, jawaban, atau penutup yang tidak ada di storyboard.
5. Jangan menghilangkan kalimat meskipun dialog panjang.
6. Jangan mengulang dialog untuk mengisi durasi.
7. Jangan membuat dialog baru berdasarkan interpretasi visual.
8. Jangan mengubah dialog dari satu card menjadi dialog card lain.
9. Jangan memindahkan dialog ke karakter lain.
10. Jika storyboard tidak memberikan dialog untuk karakter tertentu, karakter tersebut tidak boleh berbicara.
11. Jika satu prompt memuat beberapa card, masukkan seluruh dialog card tersebut dalam urutan aslinya.
12. Jika terdapat teks dialog langsung dan narasi/audio penjelasan, pertahankan jenis dan urutannya sesuai storyboard.

Larangan khusus terhadap perubahan narasi

Google Flow tidak boleh menciptakan narasi alternatif berdasarkan pemahamannya sendiri.

Jangan menggunakan instruksi seperti “jelaskan mengapa”, “ceritakan tentang”, atau “tambahkan penjelasan” jika dapat membuat AI menghasilkan kalimat baru.

Gunakan instruksi tegas:

PLAY ONLY THE EXACT PROVIDED STORYBOARD DIALOGUE. DO NOT GENERATE, IMPROVISE, REWRITE, SUMMARIZE, OR ADD ANY SPOKEN WORDS.

Instruksi ini hanya mengatur ucapan. Deskripsi visual, kamera, dan gerakan tetap boleh dijelaskan untuk membantu menghasilkan video yang sesuai storyboard.

4. MASTER VOICE LOCK — TANPA NARATOR

TIDAK BOLEH ADA SUARA NARATOR ATAU VOICE-OVER NARATOR.

- Semua dialog harus berasal dari karakter yang ditetapkan oleh storyboard.
- Jangan menggunakan suara orang ketiga yang menjelaskan cerita.
- Jangan mengubah teks Narasi/Audio storyboard menjadi narasi di luar karakter.
- Jika teks storyboard merupakan dialog karakter, karakter tersebut yang mengucapkannya.
- Jika storyboard tidak menetapkan siapa yang berbicara, jangan mengarang identitas pembicara atau membuat dialog tambahan.
- Jangan menambahkan suara manusia di luar dialog yang disediakan.
- Jangan membuat karakter lain berbicara di luar giliran dialognya.

Pertahankan identitas suara karakter secara konsisten pada ketiga prompt, termasuk karakteristik suara, usia suara, intonasi, aksen, dan kecepatan bicara yang sesuai dengan karakter.

Jika storyboard tidak memberikan dialog untuk karakter hewan, hewan tidak boleh berbicara menggunakan bahasa manusia.

Suara ambience dan efek suara nonverbal boleh digunakan jika sesuai dengan adegan. Musik latar bersifat opsional, lembut, dan tidak boleh menutupi dialog.

5. DIALOGUE TIMING LOCK

Jangan memotong atau mengubah dialog agar sesuai dengan durasi video.

- Atur waktu pengucapan dan gerakan karakter secara realistis.
- Gunakan jeda seperlunya tanpa menghilangkan kata.
- Jangan mempercepat suara secara ekstrem.
- Jangan menumpuk beberapa suara hingga tidak jelas.
- Jangan mengubah teks demi mengejar durasi.
- Jangan membuat prompt tambahan.

Jika durasi dialog lebih panjang daripada 10 detik, tetap pertahankan teks lengkap dan atur tempo sebaik mungkin. Jangan mengklaim seluruh dialog pasti selesai secara natural jika durasinya memang tidak mencukupi.

6. CHARACTER IDENTITY LOCK

Gunakan reference image sebagai acuan identitas visual utama.

Pertahankan secara konsisten:

- Wajah, mata, hidung, mulut, dan bentuk kepala.
- Rambut, warna kulit, usia visual, dan ekspresi dasar.
- Bentuk tubuh dan proporsi karakter.
- Pakaian, warna pakaian, sepatu, serta aksesori.
- Gaya animasi, tekstur, warna, dan tingkat detail.

Untuk karakter hewan, pertahankan spesies, pola dan warna bulu, bentuk wajah, mata, telinga, ekor, ukuran tubuh, dan aksesori.

Jangan mengganti desain, membuat karakter baru, atau mengubah identitas karakter di antara prompt.

7. BACKGROUND DAN OBJECT LOCK

Pertahankan lokasi, lingkungan, waktu, cuaca, pencahayaan, warna, suasana, dan objek sesuai storyboard.

Semua objek penting harus mempertahankan bentuk, warna, ukuran relatif, fungsi, serta kondisinya.

Jangan membuat objek tiba-tiba muncul atau menghilang. Jika cerita berpindah tempat, tampilkan transisi yang masuk akal dan sesuai storyboard.

Jangan memasukkan objek tambahan yang mengubah makna cerita.

8. STORY CONTINUITY LOCK

Ketiga prompt merupakan satu rangkaian video yang berkesinambungan.

- Prompt 1 dimulai dari keadaan awal cerita.
- Prompt 2 dimulai dari keadaan terakhir Prompt 1.
- Prompt 3 dimulai dari keadaan terakhir Prompt 2.

Pertahankan posisi tubuh, arah pandangan, gerakan yang sedang berlangsung, ekspresi, posisi objek, lokasi, dan pencahayaan.

Dilarang melakukan teleportasi, mengulang adegan dari awal, mengubah posisi tanpa gerakan, atau mengganti lokasi tanpa transisi.

Akhir Prompt 1 harus cocok dengan awal Prompt 2. Akhir Prompt 2 harus cocok dengan awal Prompt 3.

9. LANGUAGE LOCK

Deteksi bahasa utama storyboard sebelum membuat prompt.

- Jika storyboard berbahasa Indonesia, gunakan bahasa Indonesia.
- Jika storyboard berbahasa Inggris, gunakan bahasa Inggris.
- Jika menggunakan bahasa lain, ikuti bahasa utama tersebut.
- Jangan menerjemahkan dialog asli.
- Jangan mencampurkan bahasa tanpa alasan yang terdapat pada storyboard.

Semua instruksi yang akan diproses Google Flow harus jelas dan konsisten dengan bahasa storyboard. Kunci bahasa berlaku untuk dialog dan seluruh deskripsi prompt.

10. VISUAL DAN CAMERA LOCK

Setiap prompt harus menjelaskan:

- Card storyboard yang digunakan.
- Aksi dan ekspresi karakter.
- Lingkungan dan objek penting.
- Framing, angle, pergerakan kamera, dan fokus.
- Dialog karakter yang tepat.
- Efek suara dan ambience jika diperlukan.
- Kondisi akhir yang akan dilanjutkan prompt berikutnya.

Gunakan gerakan yang wajar dan visual yang mengikuti storyboard. Jangan menambahkan kejadian baru hanya untuk membuat video terlihat lebih menarik.

Prompt 1 boleh menggunakan hook visual yang memang sesuai dengan adegan awal storyboard, tetapi tidak boleh menambahkan dialog atau peristiwa baru.

11. NO TEXT LOCK

Jangan menampilkan tulisan tambahan di dalam video.

Dilarang membuat subtitle, caption, judul, speech bubble, watermark, logo tambahan, UI, notifikasi, atau teks overlay.

Tulisan yang terlihat pada gambar referensi tidak otomatis menjadi bagian video. Utamakan adegan visual dan dialog suara.

12. FORMAT OUTPUT — TEPAT 3 JSON

Output hanya tiga objek JSON, tanpa penjelasan tambahan di luar JSON.

PROMPT 1

{
"prompt": 1,
"part": "Part 1",
"duration": "0-10 detik",
"cards": [],
"visual": "",
"action": "",
"dialogue": [
{
"speaker": "Nama karakter sesuai storyboard",
"text": "Salin dialog asli secara lengkap",
"voice": "Suara karakter yang konsisten",
"delivery": "Intonasi dan emosi yang sesuai adegan"
}
],
"camera": "",
"sound": "Hanya efek suara nonverbal dan ambience yang sesuai; tanpa narator",
"transition": ""
}

PROMPT 2

{
"prompt": 2,
"part": "Part 1",
"duration": "10-20 detik",
"cards": [],
"visual": "",
"action": "",
"dialogue": [],
"camera": "",
"sound": "Hanya efek suara nonverbal dan ambience yang sesuai; tanpa narator",
"transition": ""
}

PROMPT 3

{
"prompt": 3,
"part": "Part 1",
"duration": "20-30 detik",
"cards": [],
"visual": "",
"action": "",
"dialogue": [],
"camera": "",
"sound": "Hanya efek suara nonverbal dan ambience yang sesuai; tanpa narator",
"transition": ""
}

Ganti nilai Part sesuai Part yang benar-benar diminta. Isi array dialogue dengan seluruh dialog asli dari card yang dikelompokkan ke prompt tersebut. Jika tidak ada dialog pada suatu card, jangan menciptakan dialog baru.

13. FINAL VALIDATION

Sebelum mengeluarkan hasil, pastikan:

1. Output tepat tiga JSON.
2. Durasi setiap prompt tepat 10 detik.
3. Seluruh card sudah terwakili dalam urutan cerita.
4. Seluruh dialog storyboard disalin lengkap.
5. Tidak ada kata yang ditambahkan, dihilangkan, atau diganti.
6. Pembicara sesuai storyboard.
7. Tidak ada narator atau voice-over narator.
8. Tidak ada dialog improvisasi.
9. Tidak ada suara manusia tambahan.
10. Bahasa sesuai bahasa storyboard.
11. Karakter, pakaian, hewan, dan aksesori konsisten.
12. Background dan objek konsisten.
13. Prompt 2 melanjutkan Prompt 1.
14. Prompt 3 melanjutkan Prompt 2.
15. Tidak ada teks tambahan di dalam video.
16. Tidak ada Prompt 4.

PRIORITAS AKHIR: KESETIAAN PADA STORYBOARD > DIALOG ASLI DAN LENGKAP > IDENTITAS KARAKTER > KONTINUITAS > VISUAL DAN KAMERA.

KELUARKAN HANYA TIGA JSON. JANGAN MENAMBAHKAN NARATOR, DIALOG BARU, ATAU PENJELASAN LISAN YANG TIDAK TERDAPAT DALAM STORYBOARD.`;

  // Input states
  const [customPrompt, setCustomPrompt] = useState<string>(defaultPromptText);
  const [referenceImages, setReferenceImages] = useState<ReferenceImageItem[]>([]);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');

  // Active Project & History states
  const [currentProject, setCurrentProject] = useState<StoryboardProject | null>(INITIAL_PRESET_PROJECT);
  const [savedProjects, setSavedProjects] = useState<StoryboardProject[]>([]);

  // UI state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState<boolean>(false);

  // Load saved projects from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedProjects(parsed);
          return;
        }
      }
      // Seed with initial preset if empty
      setSavedProjects([INITIAL_PRESET_PROJECT]);
    } catch (e) {
      console.error('Failed to load saved projects from localStorage:', e);
    }
  }, []);

  // Save API Key to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gemini_api_key', geminiApiKey);
  }, [geminiApiKey]);

  // Save projects helper
  const persistProjects = (projects: StoryboardProject[]) => {
    setSavedProjects(projects);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not persist to localStorage (quota or disabled):', e);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Generate Storyboard & Google Flow AI Prompts
  const handleGenerate = async () => {
    if (referenceImages.length === 0) {
      setErrorMessage('Silakan unggah gambar storyboard referensi terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Detect output language from custom prompt
      const detectLang = (text: string): 'en' | 'id' => {
        const t = (text || '').toLowerCase();
        const enHits = ['the ', ' is ', ' are ', ' was ', ' were ', ' will ', 'scene', 'character', 'camera', 'background', 'dialogue', 'story', 'visual', 'lock', 'storyboard', 'this ', 'with ', ' and '].filter(s => t.includes(s)).length;
        const idHits = ['baca ', 'buat ', 'gunakan ', 'jangan ', 'karakter', 'dialog', 'bahasa', 'cerita', 'adegan', 'kamera', 'suara', 'deskripsi', 'judul', 'durasi'].filter(s => t.includes(s)).length;
        return enHits > idHits ? 'en' : 'id';
      };
      const outputLanguage = detectLang(customPrompt);

      const payload = {
        customPrompt,
        apiKey: geminiApiKey,
        outputLanguage,
        referenceImages: referenceImages.map((img) => ({
          mimeType: img.mimeType,
          base64: img.base64,
        })),
      };

      const res = await fetch('/api/generate-flow-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Safely parse — server may return plain text on fatal/timeout errors
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || `Server error: ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Server error: ${res.status}`);
      }

      const newProject: StoryboardProject = {
        id: `project-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: data.storyTitle || 'Storyboard Google Flow AI Baru',
        premise: 'Referensi Visual Storyboard',
        animationStyle: 'Custom',
        mode: 'reference',
        parameters: { duration: 10, aspectRatio: '9:16', resolution: '1080p', promptCount: 3, cameraMovement: '', lightingMood: '', fps: '' },
        partNumber: undefined,
        characterDNA: Array.isArray(data.characterDNA) ? data.characterDNA : [],
        visualStyleGuide: data.visualStyleGuide || '',
        storySummary: data.storySummary || '',
        flowAiPrompts: Array.isArray(data.flowAiPrompts) ? data.flowAiPrompts : [],
        hooks: Array.isArray(data.hooks) ? data.hooks : [],
        viralMetadata: {
          viral_titles: Array.isArray(data.viralMetadata?.viral_titles) ? data.viralMetadata.viral_titles : [],
          viral_hashtags: Array.isArray(data.viralMetadata?.viral_hashtags) ? data.viralMetadata.viral_hashtags : [],
          youtube_description: data.viralMetadata?.youtube_description || '',
          supporting_hashtags: Array.isArray(data.viralMetadata?.supporting_hashtags) ? data.viralMetadata.supporting_hashtags : [],
          pinned_comment_suggestion: data.viralMetadata?.pinned_comment_suggestion || '',
        },
        referenceImagesCount: referenceImages.length,
      };

      setCurrentProject(newProject);

      // Add to saved projects
      const updatedList = [newProject, ...savedProjects.filter((p) => p.id !== newProject.id)];
      persistProjects(updatedList);

      showToast('🎉 Berhasil membuat Prompt Google Flow AI, Hook & Metadata Viral!');

      // Smooth scroll to output
      setTimeout(() => {
        const el = document.getElementById('results-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Error generating:', err);
      setErrorMessage(
        err?.message || 'Gagal menghubungi server Gemini API. Pastikan GEMINI_API_KEY terpasang dengan benar.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine a single scene prompt
  const handleRefineScene = async (sceneIndex: number, instruction: string) => {
    if (!currentProject || !currentProject.flowAiPrompts[sceneIndex]) return;

    setIsRefining(true);
    try {
      const currentPrompt = currentProject.flowAiPrompts[sceneIndex];
      const res = await fetch('/api/refine-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrompt,
          refinementInstruction: instruction,
          animationStyle: 'Custom',
          apiKey: geminiApiKey,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal merevisi scene');
      }

      const updatedScene: ScenePrompt = await res.json();

      const updatedPrompts = [...currentProject.flowAiPrompts];
      updatedPrompts[sceneIndex] = updatedScene;

      const updatedProject = {
        ...currentProject,
        flowAiPrompts: updatedPrompts,
      };

      setCurrentProject(updatedProject);

      // Update in saved projects
      const updatedList = savedProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
      persistProjects(updatedList);

      showToast(`Scene #${updatedScene.adegan ?? (updatedScene as any).scene_number ?? ''} berhasil direvisi!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Gagal memperbarui prompt scene.');
    } finally {
      setIsRefining(false);
    }
  };

  // Load preset demo
  const handleLoadPreset = () => {
    setCurrentProject(INITIAL_PRESET_PROJECT);
    showToast('Contoh preset animasi dimuat!');
  };

  // Select project from drawer
  const handleSelectProject = (proj: StoryboardProject) => {
    setCurrentProject(proj);
    showToast(`Memuat proyek: ${proj.title}`);
  };

  // Delete project from drawer
  const handleDeleteProject = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    persistProjects(updated);
    if (currentProject?.id === id) {
      setCurrentProject(updated[0] || null);
    }
  };

  // Clear all projects
  const handleClearAllProjects = () => {
    if (window.confirm('Yakin ingin menghapus semua riwayat storyboard tersimpan?')) {
      persistProjects([]);
      setCurrentProject(null);
    }
  };

  // Update hooks
  const updateHooks = (updater: (prev: ViralHook[]) => ViralHook[]) => {
    if (!currentProject) return;
    const newHooks = updater(currentProject.hooks || []);
    const updated = { ...currentProject, hooks: newHooks };
    setCurrentProject(updated);
    persistProjects(savedProjects.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Update prompts (manual editing)
  const updatePrompts = (newPrompts: any[]) => {
    if (!currentProject) return;
    const updated = { ...currentProject, flowAiPrompts: newPrompts };
    setCurrentProject(updated);
    persistProjects(savedProjects.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Update metadata
  const updateMetadata = (updater: (prev: ViralMetadata) => ViralMetadata) => {
    if (!currentProject) return;
    const newMeta = updater(currentProject.viralMetadata);
    const updated = { ...currentProject, viralMetadata: newMeta };
    setCurrentProject(updated);
    persistProjects(savedProjects.map((p) => (p.id === updated.id ? updated : p)));
  };

  const canGenerate = referenceImages.length > 0 && customPrompt.trim().length > 0;

  return (
    <div className="min-h-screen bg-zinc-100/70 text-zinc-900 selection:bg-rose-500/20 selection:text-rose-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Header */}
      <Header
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        savedCount={savedProjects.length}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onLoadPreset={handleLoadPreset}
        onOpenImageGenerator={() => setIsImageGeneratorOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        {/* Intro banner */}
        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-base font-black uppercase tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
                  FlowShorts AI
                  <span className="ml-2 bg-(--gradient-brand) bg-clip-text text-transparent">
                    Visual Storyboard Generator
                  </span>
                </h1>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Unggah gambar storyboard Anda sebagai referensi visual. AI akan menganalisis karakter, gaya seni, dan komposisi, lalu secara otomatis membuat storyboard baru yang segar dengan cerita berbeda namun gaya visual yang konsisten.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Panduan Flow AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <div className="flex-1">
              <p className="font-semibold">Terjadi Kendala</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold hover:underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Success Toast */}
        {successToast && (
          <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-zinc-900 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Step 1: Reference Upload */}
        <div className="space-y-6">
          <StoryboardInput
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            isGenerating={isGenerating}
          />

          {/* Step 2: Master Prompt Input */}
          <CustomPromptInput
            prompt={customPrompt}
            setPrompt={setCustomPrompt}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            geminiApiKey={geminiApiKey}
            setGeminiApiKey={setGeminiApiKey}
          />

          {/* Results Section */}
          {currentProject && (
            <div id="results-section" className="space-y-6 pt-4">
              {/* Step 3: Google Flow AI JSON Output */}
              <PromptJsonViewer
                project={currentProject}
                onRefineScene={handleRefineScene}
                isRefining={isRefining}
                onUpdatePrompts={updatePrompts}
              />

              {/* Step 4: Hook Penahan Penonton (0-3 Detik) */}
              <ViralHookStudio
                hooks={currentProject.hooks || []}
                setHooks={(updater) => {
                  if (typeof updater === 'function') {
                    updateHooks(updater as any);
                  } else {
                    updateHooks(() => updater);
                  }
                }}
              />

              {/* Step 5: Studio Viralitas (Judul, Hashtag & Deskripsi) */}
              <ViralSocialKit
                metadata={currentProject.viralMetadata}
                setMetadata={(updater) => {
                  if (typeof updater === 'function') {
                    updateMetadata(updater as any);
                  } else {
                    updateMetadata(() => updater);
                  }
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Saved Projects Drawer */}
      <SavedProjectsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedProjects={savedProjects}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onClearAll={handleClearAllProjects}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Image Generator Modal (DALL-E 3) */}
      <ImageGeneratorModal
        isOpen={isImageGeneratorOpen}
        onClose={() => setIsImageGeneratorOpen(false)}
      />
    </div>
  );
}
