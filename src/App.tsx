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
  const defaultPromptText = `/promptengineer, /masterlockidentity, /mastervoice, /masterbackground, /masterobject, /storycontinuity, /dialoguelock, /languagelock, /nottxt, /nochange,

buatkan master prompt json [PART], baca seluruh reference image atau storyboard terlebih dahulu sebelum membuat prompt, jadikan reference image sebagai sumber kebenaran visual utama, pertahankan identitas visual seluruh karakter secara konsisten, pertahankan wajah, rambut, warna kulit, warna bulu, bentuk tubuh, proporsi tubuh, usia visual, pakaian, warna pakaian, sepatu, aksesori, ciri khas, dan semua detail visual yang terlihat pada reference image, jangan mengubah karakter, jangan mengganti pakaian, jangan mengganti warna pakaian, jangan mengubah wajah, jangan mengubah bentuk tubuh, jangan mengubah usia visual, jangan mengubah jenis hewan, jangan mengubah warna atau pola hewan, jangan membuat karakter terlihat seperti karakter lain,

jika terdapat hewan, kunci spesies, warna, pola bulu, bentuk tubuh, ukuran, wajah, mata, telinga, ekor, aksesori, dan seluruh ciri visual hewan, hewan harus tetap menjadi hewan yang sama sepanjang cerita, hewan boleh berdialog jika sesuai dengan cerita atau reference, suara hewan harus memiliki identitas tersendiri, dialog hewan tidak boleh berpindah kepada karakter lain,

kunci identitas suara setiap karakter, setiap karakter harus memiliki suara yang konsisten dari scene ke scene dan dari part ke part, karakter a hanya mengucapkan dialog karakter a, karakter b hanya mengucapkan dialog karakter b, karakter lain hanya mengucapkan dialog yang diberikan kepadanya, hewan hanya mengucapkan dialog hewan, jangan menukar suara antar karakter, jangan memberikan dialog karakter a kepada karakter b, jangan memberikan dialog karakter b kepada karakter a, jangan membuat karakter yang sedang diam tiba tiba berbicara,

gunakan bahasa secara konsisten, jika bahasa yang digunakan adalah bahasa indonesia maka seluruh dialog, voice over, dan ucapan karakter harus menggunakan bahasa indonesia, jangan mencampurkan bahasa inggris atau bahasa asing lainnya, jika bahasa yang digunakan adalah bahasa inggris maka seluruh dialog, voice over, dan ucapan karakter harus menggunakan bahasa inggris, jangan mencampurkan bahasa indonesia atau bahasa asing lainnya, jika bahasa tidak disebutkan dan reference menggunakan bahasa indonesia maka gunakan bahasa indonesia secara konsisten,

kunci background berdasarkan reference image, pertahankan lokasi, lingkungan, waktu, cuaca, pencahayaan, suasana, warna lingkungan, kondisi tanah, pepohonan, bangunan, jalan, dan objek lingkungan yang terlihat, jangan memindahkan lokasi secara tiba tiba, jangan mengubah waktu secara tiba tiba, jangan mengubah cuaca tanpa alasan cerita, jangan menghilangkan elemen lingkungan penting, jika karakter berpindah lokasi maka perpindahan harus terjadi melalui alur yang masuk akal,

kunci seluruh object penting, pertahankan bentuk, warna, ukuran relatif, fungsi, dan identitas setiap object dari scene sebelumnya ke scene berikutnya, jangan mengganti object dengan object lain yang terlihat mirip, jangan membuat object berpindah secara tiba tiba, jika sebuah karakter sedang memegang atau menggunakan sebuah object maka scene berikutnya harus memperhitungkan keadaan object tersebut,

baca hubungan antara karakter, hewan, object, dan background, pahami siapa berada di mana, siapa melakukan apa, siapa melihat siapa, siapa memegang object apa, kondisi setiap karakter, ekspresi karakter, posisi karakter, arah gerakan, kondisi lingkungan, dan kejadian yang sedang berlangsung, gunakan semua informasi tersebut untuk membuat alur cerita yang jelas,

jika storyboard memiliki part maka ikuti urutan part secara konsisten, part berikutnya wajib melanjutkan keadaan terakhir dari part sebelumnya, jika pengguna meminta part satu maka buat part satu, jika pengguna meminta part dua maka lanjutkan dari part satu, jika pengguna meminta part tiga maka lanjutkan dari part dua, lanjutkan dengan pola yang sama untuk part berikutnya, jika pengguna tidak memberikan part maka buat pembagian part secara otomatis berdasarkan kebutuhan cerita, buat pembagian cerita yang masuk akal, jangan memotong cerita secara acak, setiap part harus memiliki awal, perkembangan, konflik atau tujuan, penyelesaian sementara, dan hubungan yang jelas menuju part berikutnya,

jika gambar tidak mempunyai alur cerita yang jelas, bangun alur berdasarkan informasi visual yang tersedia, prioritaskan karakter yang terlihat, object yang terlihat, lingkungan yang terlihat, ekspresi, posisi, arah gerakan, dan hubungan antar karakter, gunakan kejadian yang paling logis untuk menghubungkan setiap scene, jangan membuat kejadian yang bertentangan dengan reference image, jangan menambahkan twist yang tidak memiliki dasar visual, jangan membuat karakter atau object baru tanpa alasan yang jelas,

scene berikutnya harus selalu menjadi kelanjutan langsung dari scene sebelumnya, kondisi akhir scene sebelumnya menjadi kondisi awal scene berikutnya, jika karakter sedang berdiri maka jangan tiba tiba duduk tanpa aksi yang menjelaskan perubahan tersebut, jika karakter sedang berjalan maka jangan tiba tiba berada di tempat lain tanpa perpindahan, jika karakter sedang memegang object maka jangan tiba tiba object menghilang, jika karakter sedang berbicara maka speaker harus tetap sesuai dengan karakter yang berbicara, jika hewan sedang berada di samping karakter maka keberadaannya harus tetap diperhitungkan pada scene berikutnya,

buat dialog yang masuk akal berdasarkan situasi, dialog harus berhubungan dengan kejadian yang sedang terjadi, dialog harus natural, singkat, mudah dipahami, sesuai emosi karakter, sesuai kepribadian karakter, dan membantu cerita bergerak maju, jangan membuat dialog yang tidak berhubungan dengan visual, jangan membuat karakter berbicara tanpa alasan, jangan membuat dua karakter berbicara secara bersamaan kecuali memang diperlukan oleh cerita, setiap dialog harus memiliki speaker yang jelas,

jika karakter a berbicara maka hanya suara karakter a yang terdengar, jika karakter b berbicara maka hanya suara karakter b yang terdengar, jika hewan berbicara maka hanya suara hewan yang terdengar, jangan menukar speaker, jangan mencampurkan dialog antar karakter, jangan memberikan dialog karakter kepada karakter lain,

jangan memasukkan tulisan apapun ke dalam video, jangan membuat subtitle, jangan membuat caption, jangan membuat text overlay, jangan membuat judul di dalam video, jangan membuat tulisan pada layar, jangan membuat speech bubble, jangan membuat watermark, jangan membuat logo, jangan membuat ui, jangan membuat notification, semua informasi cerita harus disampaikan melalui visual, ekspresi, gerakan, suara, dialog, ambience, sound effect, dan musik jika diperlukan,

buat hook pada awal video menggunakan aksi visual, situasi menarik, ekspresi, konflik, kejadian misterius, kejadian lucu, kejadian emosional, atau rasa penasaran, hook tidak boleh menggunakan tulisan apapun di dalam video,

gunakan camera shot, camera angle, framing, camera movement, focus, dan komposisi yang mendukung cerita, kamera harus menjaga kontinuitas posisi karakter dan object, jangan membuat perpindahan kamera menyebabkan karakter atau object berubah secara tidak masuk akal,

buat audio yang sesuai dengan visual, gunakan dialog jika memang diperlukan, gunakan voice over jika memang diperlukan, gunakan ambience, sound effect, dan musik jika diperlukan, audio harus mengikuti kejadian visual dan tidak boleh bertentangan dengan cerita,

buat transisi antar scene secara alami, akhir sebuah prompt harus menyediakan kondisi yang dapat langsung dilanjutkan oleh prompt berikutnya, prompt berikutnya harus dimulai dari kondisi terakhir prompt sebelumnya, jangan membuat lompatan cerita tanpa penjelasan,

untuk setiap part buat tiga prompt video, setiap prompt berdurasi sepuluh detik, total durasi part adalah tiga puluh detik, prompt pertama berlangsung dari awal sampai sepuluh detik, prompt kedua melanjutkan langsung dari prompt pertama, prompt ketiga melanjutkan langsung dari prompt kedua, jangan mengubah karakter, pakaian, hewan, object, background, voice, atau style di antara ketiga prompt,

buat output dalam format json, sertakan informasi project, part, bahasa, total durasi, visual identity lock, character lock, animal lock, clothing lock, background lock, object lock, voice lock, story continuity, prompt video, dialogue, camera, sound, transition, next part hook, youtube hook, youtube title, youtube description, dan youtube hashtags,

jika tidak terdapat dialog pada reference image maka jangan memaksakan dialog, jika dialog diperlukan untuk membuat cerita lebih jelas maka buat dialog yang sederhana dan sesuai dengan aksi visual, jika hewan perlu berbicara dan konteks cerita mendukung maka hewan dapat diberikan dialog, tetapi tetap pertahankan identitas visual hewan,

sebelum menghasilkan hasil akhir lakukan pemeriksaan kontinuitas secara internal, pastikan karakter tetap sama, pastikan pakaian tetap sama, pastikan hewan tetap sama, pastikan background tetap konsisten, pastikan object tetap konsisten, pastikan voice tidak tertukar, pastikan dialog tidak tertukar, pastikan bahasa konsisten, pastikan tidak ada bahasa campuran, pastikan scene berikutnya melanjutkan scene sebelumnya, pastikan part berikutnya dapat melanjutkan part sebelumnya, pastikan tidak ada teleportasi, pastikan tidak ada perubahan karakter secara tiba tiba, pastikan tidak ada perubahan pakaian secara tiba tiba, pastikan tidak ada perubahan hewan secara tiba tiba, pastikan tidak ada perubahan object secara tiba tiba, pastikan tidak ada karakter tambahan tanpa alasan, pastikan tidak ada tulisan apapun di dalam video, pastikan hook tidak menggunakan tulisan, pastikan setiap prompt berdurasi sepuluh detik, pastikan total durasi part tiga puluh detik, pastikan ending setiap prompt dapat disambungkan dengan prompt berikutnya,

jika terdapat konflik antara kreativitas dan reference image prioritaskan reference image, jika terdapat konflik antara cerita dan identitas karakter prioritaskan identitas karakter, jika terdapat konflik antara dialog dan speaker prioritaskan speaker lock, jika terdapat konflik antar scene prioritaskan story continuity, jika terdapat informasi yang tidak jelas gunakan interpretasi yang paling sederhana, logis, konsisten, dan tidak mengubah identitas visual,

hasil akhir harus langsung mengikuti part yang diminta dan harus menghasilkan prompt video yang jelas, tidak ambigu, konsisten, memiliki alur cerita yang masuk akal, memiliki dialog yang masuk akal, memiliki voice yang tidak tertukar, memiliki bahasa yang konsisten, mempertahankan karakter dan object dari reference image, tidak mengubah background secara ngawur, tidak membuat tulisan apapun di dalam video, dan dapat dilanjutkan ke part berikutnya tanpa kehilangan kesinambungan cerita,`;

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
      const payload = {
        customPrompt,
        apiKey: geminiApiKey,
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
