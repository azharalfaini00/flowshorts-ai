import { useState, useEffect } from 'react';
import Header from './components/Header';
import StoryboardInput from './components/StoryboardInput';
import StoryPlanner from './components/StoryPlanner';
import FlowAiParameters from './components/FlowAiParameters';
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
  StoryOutline,
} from './types';
import { INITIAL_PRESET_PROJECT } from './utils/sampleData';
import { AlertCircle, Film, Sparkles, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'flowshorts_ai_saved_projects';

export default function App() {
  // Input states
  const [storyOutline, setStoryOutline] = useState<StoryOutline | null>(null);
  const [animationStyle, setAnimationStyle] = useState<string>('Shonen Anime Action');
  const [referenceImages, setReferenceImages] = useState<ReferenceImageItem[]>([]);
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [parameters, setParameters] = useState<FlowAiVideoParams>({
    duration: 5,
    aspectRatio: '9:16',
    resolution: '1080p',
    promptCount: 4,
    cameraMovement: 'Cinematic Pan & Dynamic Zoom-in',
    lightingMood: 'Cinematic Volumetric & Golden Hour',
    fps: '24fps Cinematic Animation',
    partNumber: undefined,
  });

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
    if (referenceImages.length === 0 && !storyOutline) {
      setErrorMessage('Silakan buat alur cerita atau unggah gambar referensi terlebih dahulu.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const payload = {
        storyOutline,
        animationStyle,
        referenceImages: referenceImages.map((img) => ({
          mimeType: img.mimeType,
          base64: img.base64,
        })),
        parameters,
        language,
      };

      const res = await fetch('/api/generate-flow-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();

      const newProject: StoryboardProject = {
        id: `project-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: data.storyTitle || storyOutline?.judul || 'Storyboard Google Flow AI Baru',
        premise: storyOutline?.ringkasan || 'Referensi Visual Storyboard',
        animationStyle,
        mode: referenceImages.length > 0 ? 'reference' : 'new',
        parameters: { ...parameters },
        partNumber: parameters.partNumber ?? undefined,
        characterDNA: data.characterDNA || [],
        visualStyleGuide: data.visualStyleGuide || '',
        storySummary: data.storySummary || '',
        flowAiPrompts: data.flowAiPrompts || [],
        hooks: data.hooks || [],
        viralMetadata: data.viralMetadata || {
          viral_titles: [],
          viral_hashtags: [],
          youtube_description: '',
          supporting_hashtags: [],
          pinned_comment_suggestion: '',
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
          animationStyle: currentProject.animationStyle,
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
    setStoryOutline(null);
    setAnimationStyle(INITIAL_PRESET_PROJECT.animationStyle);
    setParameters({ ...INITIAL_PRESET_PROJECT.parameters });
    showToast('Contoh preset animasi Shonen dimuat!');
  };

  // Select project from drawer
  const handleSelectProject = (proj: StoryboardProject) => {
    setCurrentProject(proj);
    setStoryOutline(null);
    setAnimationStyle(proj.animationStyle);
    if (proj.parameters) {
      setParameters({ ...proj.parameters });
    }
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

  // Update metadata
  const updateMetadata = (updater: (prev: ViralMetadata) => ViralMetadata) => {
    if (!currentProject) return;
    const newMeta = updater(currentProject.viralMetadata);
    const updated = { ...currentProject, viralMetadata: newMeta };
    setCurrentProject(updated);
    persistProjects(savedProjects.map((p) => (p.id === updated.id ? updated : p)));
  };

  const canGenerate = referenceImages.length > 0 || Boolean(storyOutline);

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

        {/* Step 1: Reference Upload & Story Planning */}
        <div className="space-y-6">
          <StoryboardInput
            animationStyle={animationStyle}
            setAnimationStyle={setAnimationStyle}
            referenceImages={referenceImages}
            setReferenceImages={setReferenceImages}
            isGenerating={isGenerating}
          />
          <StoryPlanner
            storyOutline={storyOutline}
            setStoryOutline={setStoryOutline}
            sceneCount={parameters.promptCount}
            isGenerating={isGenerating}
            referenceImages={referenceImages}
            language={language}
            setLanguage={setLanguage}
          />

          {/* Step 2: Flow AI Video Parameters */}
          <FlowAiParameters
            parameters={parameters}
            setParameters={setParameters}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
          />

          {/* Results Section */}
          {currentProject && (
            <div id="results-section" className="space-y-6 pt-4">
              {/* Step 3: Google Flow AI JSON Output */}
              <PromptJsonViewer
                project={currentProject}
                onRefineScene={handleRefineScene}
                isRefining={isRefining}
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
