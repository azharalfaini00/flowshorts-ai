export interface StoryScene {
  no: number;
  judul: string;
  deskripsi: string;
  emosi: string;
  aksi_kunci: string;
}

export interface StoryOutline {
  judul: string;
  genre: string;
  ringkasan: string;
  adegan: StoryScene[];
}

export interface FlowAiVideoParams {
  duration: number; // e.g. 5, 8, 10
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  resolution: '1080p' | '720p' | '4k';
  promptCount: number; // 3 to 8
  cameraMovement: string;
  lightingMood: string;
  fps: string;
  partNumber?: number; // e.g. 1, 2, 3 — undefined = no part (standalone)
}

export interface CharacterDNA {
  name: string;                      // Nama karakter
  age_appearance: string;            // Estimasi usia visual
  species_race: string;              // Jenis spesies / ras
  skin_tone: string;                 // Warna kulit
  hair: string;                      // Deskripsi rambut (warna, gaya, panjang)
  eyes: string;                      // Warna & bentuk mata
  outfit_main: string;               // Kostum utama
  outfit_accessories: string;        // Aksesoris
  distinctive_features: string;      // Fitur unik (skar, tanda lahir, dll)
  art_style: string;                 // Gaya seni (anime, chibi, dll)
  color_palette: string;             // Palet warna dominan karakter
  full_prompt_dna: string;           // String DNA lengkap siap embed ke prompt
}

export interface AlurAction {
  waktu: string;
  aksi: string;
}

export interface DialogAction {
  karakter: string;
  waktu: string;
  ucapan: string;
}

export interface CharacterSceneDNA {
  identity: string;
  appearance: string;
  clothing: string;
  body: string;
  voice: string;
}

export interface SceneEnvironment {
  location: string;
  time: string;
  weather: string;
  visual_style: string;
  continuity: string;
}

export interface SceneCamera {
  // Legacy fields
  opening_shot: string;
  movement: string;
  framing: string;
  ending_position: string;
  // New schema fields
  shot?: string;
  angle?: string;
  focus?: string;
  composition?: string;
}

export interface SceneStory {
  action: string;
  dialogue: Array<{ speaker: string; line: string }>;
  ending_action: string;
}

export interface SceneAudio {
  music: string;
  sound_effects: string;
  dialogue_rule: string;
}

export interface ScenePrompt {
  project: string;
  scene: string;
  adegan: number; // For internal indexing
  judul: string;  // Scene title
  title_internal?: string;
  prompt: string; // The text-to-image prompt OR prompt number (new schema)
  duration: string;
  continuity_priority: string;
  reference_storyboard: string;
  character_dna_lock: Record<string, CharacterSceneDNA>;
  environment: SceneEnvironment;
  camera: SceneCamera;
  story: SceneStory;
  audio: SceneAudio;
  strict_continuity_instruction: string;
  negative_prompt: string;
  image_url?: string | null;
  image_source?: string | null;
  image_error?: string;
  // ===== New schema fields (optional for backward compat) =====
  part?: string;                         // e.g. "Part 3"
  scene_label?: string;                  // Short scene description
  reference_priority?: string;
  continuity_start?: string;
  characters?: Record<string, string>;
  background?: string;
  object?: string | Record<string, string>;
  voice_lock?: Record<string, string>;
  video_prompt?: string;
  dialogue?: Array<{ speaker: string; text: string }>;
  sound?: {
    ambience?: string;
    sfx?: string;
    music?: string;
    dialogue_rule?: string;
  };
  no_text?: string;
  ending?: string;
  next_prompt?: string;
  next_part_hook?: string;
}

export interface ViralHook {
  type: string;
  hook_text: string;
  visual_cue: string;
  audio_cue: string;
}

export interface SupportingHashtagCategory {
  category: string;
  tags: string[];
}

export interface ViralMetadata {
  viral_titles: string[];
  viral_hashtags: string[];
  youtube_description: string;
  supporting_hashtags: SupportingHashtagCategory[];
  pinned_comment_suggestion: string;
}

export interface StoryboardProject {
  id: string;
  createdAt: string;
  title: string;
  premise: string;
  animationStyle: string;
  mode: 'new' | 'reference';
  parameters: FlowAiVideoParams;
  partNumber?: number;
  characterDNA: CharacterDNA[];      // Array DNA per karakter
  visualStyleGuide: string;
  storySummary: string;
  flowAiPrompts: ScenePrompt[];
  hooks: ViralHook[];
  viralMetadata: ViralMetadata;
  referenceImagesCount?: number;
}

export interface ReferenceImageItem {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  previewUrl: string;
}

// ====== NEW SCHEMA: JSON per Adegan (Flow Scene Prompt) ======
// Digunakan untuk output prompt per adegan sesuai format baru.

export interface FlowDialogueLine {
  speaker: string;
  text: string;
}

export interface FlowCameraSpec {
  shot: string;
  angle: string;
  movement: string;
  focus: string;
  composition: string;
}

export interface FlowSoundSpec {
  ambience: string;
  sfx: string;
  music: string;
  dialogue_rule: string;
}

export interface FlowVoiceLock {
  [character: string]: string; // e.g. "Budi": "Suara anak laki-laki ceria..."
  rule: string;
}

/**
 * Schema JSON per adegan baru — sesuai format contoh user.
 * Setiap elemen array `flowAiPrompts` menggunakan tipe ini.
 */
export interface FlowScenePrompt {
  part: string;                          // e.g. "Part 3"
  prompt: string;                        // Nomor prompt e.g. "1", "2", "3"
  duration: string;                      // e.g. "10 detik"
  scene: string;                         // Deskripsi singkat scene
  reference_priority: string;            // Instruksi prioritas reference image
  continuity_start: string;             // Dari mana scene ini dimulai
  characters: Record<string, string>;   // { "Budi": "Deskripsi visual Budi...", ... }
  background: string;                    // Deskripsi background/environment
  object?: string | Record<string, string>; // Object penting (opsional, bisa string atau record)
  voice_lock: FlowVoiceLock;            // Kunci suara per karakter + rule
  video_prompt: string;                  // Prompt video utama (full detail)
  dialogue: FlowDialogueLine[];         // Array dialog per speaker
  camera: FlowCameraSpec;               // Spesifikasi kamera
  sound: FlowSoundSpec;                 // Spesifikasi audio
  no_text: string;                       // Instruksi tidak ada teks di layar
  ending: string;                        // Kondisi akhir scene ini
  next_prompt?: string;                  // Petunjuk prompt berikutnya (opsional)
  next_part_hook?: string;               // Hook ke Part berikutnya (opsional, hanya pada prompt terakhir)
  // Legacy/fallback fields agar backward compatible
  adegan?: number;
  judul?: string;
  prompt_text?: string;
  [key: string]: any;                    // Allow extra fields dari AI
}
