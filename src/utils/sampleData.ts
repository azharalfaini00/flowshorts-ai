import { StoryboardProject } from '../types';

export const ANIMATION_STYLES = [
  { id: 'anime-shonen', label: 'Shonen Anime Action', desc: 'Gaya anime aksi modern dengan efek aura & speedlines', icon: '⚡' },
  { id: 'pixar-3d', label: '3D Stylized Pixar/Disney', desc: 'Karakter ekspresif 3D dengan pencahayaan lembut', icon: '✨' },
  { id: 'cyberpunk-anime', label: 'Cyberpunk Dark Anime', desc: 'Futuristik neon dengan bayangan kontras tinggi', icon: '🏙️' },
  { id: 'ghibli-fantasy', label: 'Studio Ghibli Aesthetic', desc: 'Cat air lembut, pemandangan alam magis', icon: '🍃' },
  { id: 'dark-fantasy', label: 'Dark Fantasy Gothic', desc: 'Suasana epik dramatis dengan elemen sihir mistis', icon: '🔮' },
  { id: 'chibi-comedy', label: 'Chibi Kawaii Fun', desc: 'Karakter mini imut dengan ekspresi berlebihan', icon: '🐱' },
  { id: 'retro-90s', label: 'Retro 90s Cel Anime', desc: 'Efek film grain retro dengan palet warna vintage', icon: '📼' },
  { id: 'claymation', label: 'Claymation Stop-Motion', desc: 'Tekstur plastisin dengan gerakan frame-by-frame unik', icon: '🎨' },
];

export const CAMERA_PRESETS = [
  'Cinematic Pan & Dynamic Zoom-in',
  'Fast-paced Dynamic Tracking Shot',
  '360-Degree Epic Character Orbit',
  'Dramatic Low-Angle Hero Shot',
  'Smooth FPV Drone Flythrough',
  'Slow-Motion Intense Close-up',
];

export const LIGHTING_PRESETS = [
  'Cinematic Volumetric & Golden Hour',
  'Cyberpunk Neon with Atmospheric Fog',
  'Moody Chiaroscuro & Dark Shadows',
  'Vibrant Studio Lighting & Lens Flare',
  'Ethereal Bioluminescent Moonlight',
];

export const SAMPLE_IDEAS = [
  {
    title: 'Pendekar Pedang Bayangan',
    style: 'Shonen Anime Action',
    premise: 'Seorang prajurit samurai muda di tengah kuil runtuh melepaskan katana hitam misterius. Saat pedang terhunus, bayangan naga hitam raksasa muncul melingkar di sekelilingnya, menatap musuh bersenjata yang siap menyerang.',
  },
  {
    title: 'Robot Kecil & Kucing Hujan',
    style: '3D Stylized Pixar/Disney',
    premise: 'Sebuah robot pengantar paket mini yang kehujanan di lorong kota futuristik menemukan anak kucing basah kuyup di dalam kardus neon. Robot itu membuka payung kecil dari punggungnya dan melindunginya dengan penuh kehangatan.',
  },
  {
    title: 'Detektif Cyberpunk & Kloning Misterius',
    style: 'Cyberpunk Dark Anime',
    premise: 'Di atas gedung pencakar langit berlumur hujan asam dan papan neon berkilau, seorang agen sibernetik mendapati rekaman hologram musuh bebuyutannya—namun wajah di hologram itu adalah wajah dirinya sendiri.',
  },
];

export const INITIAL_PRESET_PROJECT: StoryboardProject = {
  id: 'preset-demo-1',
  createdAt: new Date().toISOString(),
  title: 'Kebangkitan Naga Bayangan (Shadow Blade Awakening)',
  premise: 'Seorang prajurit muda dengan katana terkutuk berhadapan dengan gerombolan monster bayangan di kuil kuno yang terapung di langit.',
  animationStyle: 'Shonen Anime Action',
  mode: 'new',
  parameters: {
    duration: 5,
    aspectRatio: '9:16',
    resolution: '1080p',
    promptCount: 4,
    cameraMovement: 'Cinematic Pan & Dynamic Zoom-in',
    lightingMood: 'Cinematic Volumetric & Golden Hour',
    fps: '24fps Cinematic Animation',
  },
  visualStyleGuide: 'Japanese modern anime animation, high contrast dark charcoal and glowing violet spiritual aura, crisp line art, dynamic particle embers, floating celestial temple ruins with cherry blossom petals drifting.',
  storySummary: 'Kisah pembuka intens berdurasi 20 detik yang menangkap momen tegang prajurit samurai mengaktifkan kekuatan terlarang untuk menyelamatkan kuil langit.',
  flowAiPrompts: [
    {
      scene_number: 1,
      scene_title: 'Scene 1: Tatapan Sunyi di Kuil Langit',
      prompt: 'Cinematic vertical 9:16 anime video of a determined young anime samurai warrior standing atop floating ancient Japanese temple ruins, stormy sunset sky with violet clouds, hand slowly resting on the hilt of a glowing dark katana, wind rustling his torn indigo haori, dramatic low-angle camera slowly tilting upward, fluid 24fps anime motion, ethereal volumetric lighting, masterpiece quality, no jitter.',
      negative_prompt: 'live action, photorealistic human, low quality, blurry, duplicate limbs, distorted face, watermark, subtitles, stuttering frames',
      duration_seconds: 5,
      aspect_ratio: '9:16',
      resolution: '1080p',
      camera_motion: 'Dramatic slow low-angle tilt upward focusing on warrior stance',
      sound_fx: 'Desir angin kencang, denting lonceng kuil samar, dengungan aura pedang bergetar',
      voiceover_or_dialogue: '"Mereka bilang pedang ini terkutuk... tapi hanya ini satu-satunya jalan."',
      keyframe_visual_description: 'Prajurit berdiri tegap membelakangi matahari terbenam dengan bayangan siluet dramatis.',
    },
    {
      scene_number: 2,
      scene_title: 'Scene 2: Detik Terhunusnya Pedang',
      prompt: 'Ultra-dynamic macro close-up of a decorated obsidian katana hilt sliding 3 inches out of its scabbard, intense purple lightning sparks crackling along the exposed steel, extreme depth of field, rapid zoom-in camera punch, high kinetic energy, fluid anime sakuga animation style, particle embers flying toward viewer, 1080p vertical shorts.',
      negative_prompt: 'deformed hands, bad anatomy, extra fingers, cartoonish 3D, blurry motion artifacts, low resolution',
      duration_seconds: 5,
      aspect_ratio: '9:16',
      resolution: '1080p',
      camera_motion: 'Rapid dynamic macro zoom-in punching toward the sword blade',
      sound_fx: 'Suara gesekan logam katana tajam "SHING!", ledakan percikan listrik ungu',
      voiceover_or_dialogue: '"Bangunlah... Naga Bayangan!"',
      keyframe_visual_description: 'Kilau bilah pedang memantulkan mata sang pendekar yang menyala ungu keemasan.',
    },
    {
      scene_number: 3,
      scene_title: 'Scene 3: Kemunculan Naga Bayangan Raksasa',
      prompt: 'Spectacular wide anime shot of an enormous mythical shadow dragon manifesting behind the samurai, ethereal smoky dark purple scales, piercing golden luminous eyes, dragon coiling protectively around the floating temple stone pillars, dynamic 180-degree orbit camera flying around the character, intense atmospheric shockwaves, fluid sakuga animation, 24fps, masterpiece.',
      negative_prompt: 'static image, poor lighting, extra heads, distorted body, grainy, watermark, text',
      duration_seconds: 5,
      aspect_ratio: '9:16',
      resolution: '1080p',
      camera_motion: 'Fast sweeping 180-degree orbit around the samurai and towering dragon',
      sound_fx: 'Raungan naga menggelegar dengan bass sub-drop berat, desis sihir hitam',
      voiceover_or_dialogue: '(Efek suara nafas naga dan raungan getaran bumi)',
      keyframe_visual_description: 'Naga raksasa meliuk memenuhi latar belakang vertikal 9:16 menatap tajam ke arah kamera.',
    },
    {
      scene_number: 4,
      scene_title: 'Scene 4: Tebasan Pembuka ke Arah Musuh (Cliffhanger)',
      prompt: 'High-octane action anime frame, the samurai lunging directly forward toward the camera with katana swinging in a full glowing arc of dark purple energy, speedlines stretching the perspective, shadow dragon diving alongside him, camera shaking with kinetic impact, sudden blackout transition cut, fluid anime movement, 9:16 vertical action.',
      negative_prompt: 'choppy movement, blurry frames, missing katana, deformed face, low contrast',
      duration_seconds: 5,
      aspect_ratio: '9:16',
      resolution: '1080p',
      camera_motion: 'Aggressive tracking rush forward with slight camera vibration impact',
      sound_fx: 'Ledakan tebasan sonik "KABOOM!", suara tebasan menyayat udara diakhiri dengungan senyap mendadak',
      voiceover_or_dialogue: '"Lanjut part 2? Klik subscribe sekarang!"',
      keyframe_visual_description: 'Bilah pedang membelah layar dengan kilatan cahaya ungu pekat tepat sebelum fade-to-black.',
    },
  ] as any[],
  hooks: [
    {
      type: 'Visual Shock Hook (0-3 Detik)',
      hook_text: 'JANGAN PERNAH cabut pedang ini kalau kamu belum siap mati!',
      visual_cue: 'Detik 0 langsung tampil kilatan listrik ungu di mata samurai dan pedang yang tiba-tiba bergetar liar!',
      audio_cue: 'Bass drop mendadak + efek suara detak jantung keras berhenti.',
    },
    {
      type: 'Curiosity Gap Hook (0-3 Detik)',
      hook_text: 'Kenapa pedang terlarang di kuil ini nggak pernah disentuh selama 1000 tahun?',
      visual_cue: 'Kamera zoom cepat ke segel kuil kuno yang tiba-tiba retak mengeluarkan asap hitam.',
      audio_cue: 'Suara retakan batu kuil "KREK!" diikuti bisikan mistis menyeramkan.',
    },
    {
      type: 'High-Stakes Action Hook (0-3 Detik)',
      hook_text: 'Dia mengorbankan jiwanya cuma untuk 1 tebasan naga ini...',
      visual_cue: 'Siluet naga raksasa langsung membuka mata emasnya tepat di hadapan penonton.',
      audio_cue: 'Raungan monster bawah tanah bergaung dengan tempo instrumen taiko cepat.',
    },
  ],
  viralMetadata: {
    viral_titles: [
      'JANGAN CABUT PEDANG INI! 😱 Naga Bayangan Terlarang Bangkit #Shorts',
      'Detik-Detik Pedang 1000 Tahun Terbuka! Animasi AI Bikin Merinding 🔥',
      'Dia Menukar Jiwanya Demi 1 Tebasan Naga Ini?! ⚔️🐉 #Anime',
      'Plot Twist Animasi: Ternyata Pedang Terkutuk Itu Menyimpan... 🤯',
    ],
    viral_hashtags: [
      '#Shorts',
      '#Animasi',
      '#AnimeShorts',
      '#AIAnimation',
      '#GoogleFlowAI',
      '#AnimeIndonesia',
      '#ViralVideo',
    ],
    youtube_description: `Siapakah prajurit yang berani mencabut pedang terkutuk ini? Tonton sampai habis untuk melihat wujud asli Naga Bayangan! ⚔️🐉

🔥 Dibuat khusus untuk animasi YouTube Shorts menggunakan Google Flow AI & Gemini AI Studio.
💬 Menurut kamu, apakah dia bakal selamat di Part 2? Tulis teori gilamu di komentar!
👉 SUBSCRIBE & nyalakan lonceng agar tidak ketinggalan kelanjutan ceritanya!

#Shorts #Animasi #AnimeShorts #AIAnimation #GoogleFlowAI #Sakuga #ActionAnime`,
    supporting_hashtags: [
      {
        category: 'Jangkauan Luas (Broad Reach)',
        tags: ['#Shorts', '#ViralShorts', '#TrendingShorts', '#FYP', '#YouTubeShorts'],
      },
      {
        category: 'Niche Animasi & AI (Animation Creators)',
        tags: ['#Animasi', '#AIAnimation', '#AnimeShorts', '#GoogleFlowAI', '#AnimeEdit', '#Sakuga', '#2DAnimation'],
      },
      {
        category: 'Algoritma & Engagement (Social Boost)',
        tags: ['#ShortsFeed', '#StoryShorts', '#Creators', '#PlotTwist', '#AnimeReels'],
      },
    ],
    pinned_comment_suggestion: '🐉 Menurut kamu, musuh apa yang pantas menghadapi naga ini di Part 2? Tulis di bawah, ide paling keren bakal dibikin animasinya! 👇',
  },
};
