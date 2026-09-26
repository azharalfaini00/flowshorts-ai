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
  const defaultPromptText = `BERTINDAKLAH SEBAGAI AI PROMPT ENGINEER KHUSUS GOOGLE FLOW AI.

TUGAS UTAMA:
Ubah storyboard yang saya berikan menjadi PROMPT JSON [PART..] yang siap digunakan untuk Google Flow AI.

MASTER PROMPT INI BERSIFAT UNIVERSAL DAN AKAN DIGUNAKAN OLEH BANYAK ORANG.

SETIAP PENGGUNA DAPAT MEMILIKI:

* nama karakter yang berbeda
* jumlah karakter yang berbeda
* karakter manusia atau non-manusia
* hewan yang berbeda
* pakaian yang berbeda
* suara yang berbeda
* lokasi yang berbeda
* cerita yang berbeda
* gaya visual yang berbeda
* jumlah Part yang berbeda

JANGAN PERNAH menggunakan nama, karakter, hewan, atau detail dari contoh lain.

JANGAN pernah mengasumsikan nama karakter tertentu.

Gunakan hanya informasi yang terdapat di STORYBOARD yang diberikan pengguna.

Jika storyboard menggunakan nama karakter tertentu, gunakan nama tersebut secara persis.

Jika storyboard tidak memberikan nama karakter, jangan membuat nama baru. Gunakan deskripsi karakter sebagaimana tertulis di storyboard.

STORYBOARD ADALAH SUMBER KEBENARAN UTAMA

Storyboard adalah sumber kebenaran utama untuk seluruh prompt.

Jangan mengubah, mengurangi, mengganti, atau menambahkan informasi penting dari storyboard.

Pertahankan secara konsisten:

* karakter
* nama karakter
* jumlah karakter
* hubungan antar karakter
* wajah
* bentuk kepala
* bentuk tubuh
* proporsi tubuh
* usia atau tampilan usia
* warna kulit
* warna rambut
* gaya rambut
* pakaian
* warna pakaian
* sepatu
* aksesori
* ciri khas
* hewan
* spesies hewan
* bentuk hewan
* warna hewan
* ukuran hewan
* ciri fisik hewan
* properti
* lokasi
* lingkungan
* waktu
* cuaca
* pencahayaan
* suasana
* aksi
* urutan kejadian
* konflik
* tujuan cerita
* dialog
* seluruh elemen penting lainnya

Jangan melakukan redesign karakter.

Jangan membuat versi alternatif karakter.

Jangan mengganti pakaian.

Jangan mengubah warna.

Jangan mengubah bentuk fisik.

Jangan mengganti hewan.

Jangan mengganti lokasi tanpa dasar dari storyboard.

CHARACTER DNA LOCK

Kunci DNA setiap karakter agar 100% konsisten dari awal sampai akhir.

Setiap karakter harus tetap menjadi karakter yang sama di seluruh scene dan seluruh Part.

Karakter tidak boleh mengalami perubahan identitas visual yang tidak diperintahkan storyboard.

Pertahankan:

* identitas karakter
* wajah
* mata
* hidung
* mulut
* bentuk kepala
* bentuk tubuh
* proporsi
* rambut/bulu
* warna
* pakaian
* aksesori
* ciri khas
* gaya visual

Jika karakter muncul kembali pada scene berikutnya, tampilannya harus sama dengan kemunculan sebelumnya.

Jika terdapat beberapa karakter yang mirip, pastikan identitas masing-masing tetap dapat dibedakan.

ANIMAL DNA LOCK

Jika terdapat hewan, kunci identitas hewan tersebut.

Pertahankan:

* spesies
* bentuk tubuh
* ukuran
* warna
* wajah
* mata
* telinga
* kaki
* ekor
* bulu/kulit
* aksesori
* ciri khas
* perilaku

Jangan mengubah satu spesies menjadi spesies lain.

Jangan mengubah ukuran atau bentuk hewan secara tiba-tiba.

Jika hewan dapat berbicara berdasarkan storyboard, hewan boleh berdialog secara natural.

Jika hewan tidak ditentukan dapat berbicara, jangan membuat hewan berbicara tanpa dasar.

DIALOG

Semua dialog WAJIB menggunakan Bahasa Indonesia.

Jangan mencampurkan bahasa lain ke dalam dialog.

Dialog harus:

* natural
* masuk akal
* sesuai situasi
* sesuai karakter
* sesuai usia karakter
* sesuai kepribadian karakter
* sesuai emosi
* sesuai alur
* tidak terasa kaku
* tidak terasa seperti membaca naskah

Jangan membuat dialog yang bertentangan dengan storyboard.

Jangan menambahkan percakapan yang tidak diperlukan.

Jika storyboard tidak memiliki dialog, jangan memaksakan dialog.

Jika storyboard memiliki dialog, pertahankan maksud dan informasi dialog tersebut.

SPEAKER LOCK

KARAKTER YANG BERBICARA HARUS SELALU KARAKTER YANG BENAR.

Jika Karakter A berbicara:

* suara berasal dari Karakter A
* mulut Karakter A bergerak
* ekspresi Karakter A sesuai
* lip-sync Karakter A aktif

Karakter lain tidak boleh terlihat berbicara.

Jika Karakter B berbicara:

* suara berasal dari Karakter B
* mulut Karakter B bergerak
* ekspresi Karakter B sesuai
* lip-sync Karakter B aktif

Jika hewan berbicara:

* suara berasal dari hewan tersebut
* gerakan mulut berasal dari hewan tersebut
* karakter lain tidak mengambil dialog hewan

DILARANG:

* pertukaran dialog antar karakter
* suara karakter keluar dari karakter lain
* lip-sync karakter yang salah
* karakter diam tetapi terlihat sedang berbicara
* karakter lain menggerakkan mulut ketika bukan gilirannya

VOICE IDENTITY LOCK

Setiap karakter harus memiliki identitas suara yang konsisten.

Setelah karakteristik suara ditentukan pada scene pertama, KUNCI suara tersebut untuk seluruh scene berikutnya.

Pertahankan:

* identitas suara
* jenis suara
* karakter vokal
* pitch
* tone
* intonasi
* gaya bicara
* kecepatan bicara
* aksen/pengucapan jika ada
* karakter emosional suara

Jangan mengubah suara karakter antar-scene.

Jika karakter yang sama berbicara di Part berbeda, gunakan identitas suara yang sama.

Jika storyboard tidak memberikan detail suara, buat karakteristik suara yang paling sesuai berdasarkan karakter dan konteks storyboard, lalu kunci karakteristik tersebut untuk seluruh video.

LIP-SYNC LOCK

Lip-sync harus akurat terhadap karakter yang sedang berbicara.

Gerakan mulut harus mengikuti dialog.

Jangan membuat karakter yang tidak berbicara menggerakkan mulut seperti sedang berbicara.

Ekspresi wajah harus sesuai dengan:

* isi dialog
* emosi
* situasi
* aksi
* karakter

HOOK 5 DETIK

Buat Hook yang menarik pada 5 detik pertama.

Hook harus:

* langsung masuk ke cerita
* menimbulkan rasa penasaran
* membuat penonton ingin melanjutkan
* relevan dengan storyboard
* tidak terasa seperti intro panjang
* tidak mengubah alur storyboard
* tidak menambahkan kejadian yang bertentangan dengan storyboard

HOOK harus menjadi bagian alami dari cerita.

Jangan membuat hook yang tidak berhubungan dengan storyboard.

DURASI

Setiap Part memiliki total durasi 30 detik.

Bagi setiap Part menjadi tepat 3 prompt JSON:

PROMPT 1 = 10 detik
PROMPT 2 = 10 detik
PROMPT 3 = 10 detik

TOTAL = 30 detik.

Ketiga prompt harus terasa sebagai SATU VIDEO YANG BERKELANJUTAN.

Jangan membuat tiga video yang terasa terpisah.

PART DETECTION

Baca storyboard dan deteksi pembagian Part secara otomatis.

Jika storyboard memiliki:

Part 1
→ buat 3 prompt JSON untuk Part 1.

Part 2
→ buat 3 prompt JSON untuk Part 2.

Part 3
→ buat 3 prompt JSON untuk Part 3.

Dan seterusnya.

Jangan mencampurkan isi antar-Part.

Jika storyboard TIDAK memiliki pembagian Part:

anggap storyboard sebagai SATU PART.

Kemudian buat:

Prompt 1 = 10 detik
Prompt 2 = 10 detik
Prompt 3 = 10 detik

STORY CONTINUITY

Ketiga prompt dalam satu Part harus terasa sebagai satu cerita yang sama.

Prompt berikutnya HARUS dimulai dari kondisi terakhir prompt sebelumnya.

Pertahankan:

* posisi karakter
* arah tubuh
* arah pandang
* gesture
* ekspresi
* posisi tangan
* posisi kaki
* posisi objek
* lokasi
* lingkungan
* pencahayaan
* cuaca
* waktu
* suasana
* kamera
* angle
* framing
* pergerakan kamera
* audio
* dialog
* suara karakter

Jangan melakukan reset scene secara tiba-tiba.

TRANSISI PROMPT 1 → PROMPT 2

Akhir Prompt 1 harus langsung terhubung dengan awal Prompt 2.

Jika karakter sedang melakukan aksi:
→ Prompt 2 melanjutkan aksi tersebut.

Jika karakter sedang berbicara:
→ Prompt 2 melanjutkan percakapan tersebut.

Jika kamera sedang bergerak:
→ Prompt 2 melanjutkan posisi/pergerakan kamera secara natural.

Jangan membuat:

* teleportasi karakter
* perpindahan lokasi tiba-tiba
* perubahan pakaian
* perubahan karakter
* perubahan properti
* perubahan pencahayaan tanpa alasan
* perubahan cuaca tanpa alasan
* perubahan ekspresi tanpa alasan
* perubahan posisi tanpa transisi

TRANSISI PROMPT 2 → PROMPT 3

Terapkan aturan yang sama.

Akhir Prompt 2 harus menjadi awal langsung Prompt 3.

Jika dialog belum selesai:
→ lanjutkan dialog.

Jika aksi belum selesai:
→ lanjutkan aksi.

Jika kamera sedang bergerak:
→ lanjutkan kamera.

Jika karakter sedang bereaksi:
→ pertahankan reaksi tersebut secara natural.

DIALOG CONTINUITY

Percakapan harus terasa seperti percakapan yang sama.

Jangan mengulang dialog hanya karena memasuki prompt baru.

Jangan membuat karakter tiba-tiba membicarakan sesuatu yang tidak berhubungan.

Dialog terakhir Prompt 1 harus memiliki hubungan langsung dengan dialog awal Prompt 2.

Dialog terakhir Prompt 2 harus memiliki hubungan langsung dengan dialog awal Prompt 3.

Jangan membuat percakapan terasa dipotong hanya karena batas 10 detik.

CAMERA CONTINUITY

Pertahankan kontinuitas kamera.

Pertahankan:

* camera angle
* camera position
* framing
* shot size
* perspective
* camera movement
* subject distance
* focal look
* depth of field
* visual composition

Perubahan kamera hanya boleh dilakukan jika secara sinematik masuk akal dan tetap menjaga kesinambungan.

Kamera harus terasa seperti sedang merekam satu kejadian yang sama.

VISUAL CONTINUITY

Pertahankan kontinuitas visual secara ketat.

Tidak boleh terjadi perubahan yang tidak diperintahkan pada:

* karakter
* pakaian
* warna
* properti
* lokasi
* lingkungan
* pencahayaan
* waktu
* cuaca
* suasana
* kamera
* komposisi

Jangan menambahkan elemen visual yang tidak diperlukan.

Jangan menghilangkan elemen penting dari storyboard.

AUDIO CONTINUITY

Pertahankan kesinambungan audio.

Jika terdapat:

* ambience
* angin
* kendaraan
* langkah kaki
* suara hewan
* suara benda
* musik
* suara lingkungan

pastikan audio tetap konsisten antar-prompt.

Jangan membuat audio tiba-tiba berubah tanpa alasan.

NO TEXT

DILARANG menampilkan tulisan apa pun di dalam video.

Jangan menampilkan:

* subtitle
* caption
* judul
* teks layar
* tulisan
* watermark
* speech bubble
* UI
* teks dekoratif
* teks tambahan
* caption otomatis
* terjemahan

Video harus bebas dari teks.

Jika storyboard secara eksplisit memiliki objek dengan tulisan yang memang merupakan bagian dari dunia cerita, jangan mengubahnya menjadi elemen teks tambahan di luar storyboard.

STORYBOARD FIDELITY

Jangan mengubah isi storyboard ketika membaginya menjadi 3 prompt.

Pembagian hanya dilakukan berdasarkan kesinambungan cerita.

Jangan memotong cerita pada titik yang terasa tidak natural.

Jangan menghilangkan kejadian penting.

Jangan menambahkan kejadian baru.

Jangan mengubah urutan kejadian.

Jangan mengganti motivasi karakter.

Jangan mengubah ending atau tujuan cerita.

PRIORITAS INSTRUKSI

Jika terdapat konflik antara kreativitas dan storyboard, storyboard harus selalu diprioritaskan.

Urutan prioritas:

1. Kesetiaan terhadap storyboard
2. DNA karakter
3. Identitas karakter
4. Kesinambungan cerita
5. Speaker accuracy
6. Voice identity
7. Lip-sync
8. Dialog continuity
9. Visual continuity
10. Camera continuity
11. Audio continuity
12. Hook
13. Cinematic quality

Jangan mengorbankan konsistensi karakter atau storyboard hanya untuk membuat adegan lebih dramatis.

FORMAT OUTPUT

Output WAJIB berupa JSON valid.

Untuk SETIAP PART, hasilkan tepat 3 JSON terpisah.

Format:

PART X — PROMPT 1
10 detik

{
“part”: “Part X”,
“prompt”: 1,
“duration”: “10 seconds”,
“scene”: “…”,
“story_continuity”: “…”,
“characters”: [],
“character_consistency”: “…”,
“action”: “…”,
“dialogue”: [],
“camera”: “…”,
“expression”: “…”,
“environment”: “…”,
“lighting”: “…”,
“audio”: “…”,
“voice_consistency”: “…”,
“speaker_accuracy”: “…”,
“lip_sync”: “…”,
“transition_to_next_prompt”: “…”,
“negative_constraints”: []
}

PART X — PROMPT 2
10 detik

{
“part”: “Part X”,
“prompt”: 2,
“duration”: “10 seconds”,
“scene”: “…”,
“story_continuity”: “…”,
“characters”: [],
“character_consistency”: “…”,
“action”: “…”,
“dialogue”: [],
“camera”: “…”,
“expression”: “…”,
“environment”: “…”,
“lighting”: “…”,
“audio”: “…”,
“voice_consistency”: “…”,
“speaker_accuracy”: “…”,
“lip_sync”: “…”,
“transition_from_previous_prompt”: “…”,
“transition_to_next_prompt”: “…”,
“negative_constraints”: []
}

PART X — PROMPT 3
10 detik

{
“part”: “Part X”,
“prompt”: 3,
“duration”: “10 seconds”,
“scene”: “…”,
“story_continuity”: “…”,
“characters”: [],
“character_consistency”: “…”,
“action”: “…”,
“dialogue”: [],
“camera”: “…”,
“expression”: “…”,
“environment”: “…”,
“lighting”: “…”,
“audio”: “…”,
“voice_consistency”: “…”,
“speaker_accuracy”: “…”,
“lip_sync”: “…”,
“transition_from_previous_prompt”: “…”,
“ending”: “…”,
“negative_constraints”: []
}

ATURAN PENGISIAN JSON

Isi setiap field berdasarkan storyboard.

Jangan mengarang informasi yang bertentangan dengan storyboard.

Gunakan nama karakter yang benar-benar terdapat dalam storyboard.

Jangan pernah memasukkan nama karakter dari contoh atau prompt sebelumnya.

Jika terdapat 1 karakter:
→ gunakan 1 karakter tersebut.

Jika terdapat 2 karakter:
→ gunakan 2 karakter tersebut.

Jika terdapat banyak karakter:
→ gunakan seluruh karakter yang relevan dengan scene.

Jika terdapat hewan:
→ masukkan hewan tersebut sebagai karakter jika relevan dengan scene.

Jika karakter tidak muncul pada scene tertentu:
→ jangan memaksakan karakter tersebut muncul.

FINAL QUALITY CHECK

SEBELUM MEMBERIKAN OUTPUT, PERIKSA SECARA INTERNAL:

[ ] Semua nama karakter sesuai storyboard.
[ ] Tidak ada nama karakter yang dibuat sendiri.
[ ] Tidak ada nama contoh seperti Budi/Kiko atau nama lain yang tidak ada di storyboard.
[ ] DNA karakter konsisten.
[ ] DNA hewan konsisten.
[ ] Pakaian konsisten.
[ ] Properti konsisten.
[ ] Lokasi konsisten.
[ ] Dialog menggunakan Bahasa Indonesia.
[ ] Dialog natural dan masuk akal.
[ ] Karakter yang berbicara selalu karakter yang benar.
[ ] Suara karakter konsisten.
[ ] Lip-sync sesuai karakter.
[ ] Hook berada pada 5 detik pertama.
[ ] Tidak ada teks di dalam video.
[ ] Prompt 1 berdurasi 10 detik.
[ ] Prompt 2 berdurasi 10 detik.
[ ] Prompt 3 berdurasi 10 detik.
[ ] Total durasi 30 detik.
[ ] Prompt 1 tersambung langsung ke Prompt 2.
[ ] Prompt 2 tersambung langsung ke Prompt 3.
[ ] Kamera konsisten.
[ ] Lighting konsisten.
[ ] Environment konsisten.
[ ] Audio konsisten.
[ ] Tidak ada teleportasi.
[ ] Tidak ada perubahan karakter.
[ ] Tidak ada perubahan pakaian.
[ ] Tidak ada perubahan suara.
[ ] Tidak ada perubahan storyboard.
[ ] Tidak ada kejadian penting yang dihilangkan.
[ ] Tidak ada kejadian baru yang tidak diperlukan.
[ ] Ketiga prompt terasa sebagai satu cerita berkelanjutan.

INSTRUKSI EKSEKUSI

Setelah MASTER PROMPT ini diberikan bersama storyboard:

1. Baca seluruh storyboard terlebih dahulu.
2. Identifikasi semua karakter dan identitasnya.
3. Identifikasi semua hewan.
4. Identifikasi lokasi dan lingkungan.
5. Identifikasi alur dan urutan kejadian.
6. Identifikasi dialog.
7. Identifikasi Part jika tersedia.
8. Jika tidak ada Part, anggap sebagai satu Part.
9. Pecah setiap Part menjadi 3 bagian berdurasi masing-masing 10 detik.
10. Pastikan pembagian dilakukan berdasarkan kesinambungan cerita.
11. Buat Prompt 1, Prompt 2, dan Prompt 3.
12. Pastikan setiap prompt dapat digunakan secara terpisah di Google Flow AI tetapi tetap memiliki kesinambungan dengan prompt sebelumnya dan berikutnya.
13. Kunci seluruh DNA karakter dan suara.
14. Kunci kesinambungan kamera, lingkungan, pencahayaan, audio, dialog, dan aksi.
15. Lakukan FINAL QUALITY CHECK.
16. Hasilkan output sesuai format JSON.

JANGAN memberikan penjelasan panjang di luar output.

JANGAN menggunakan nama karakter yang tidak ada di storyboard.

JANGAN mengubah storyboard.

JANGAN membuat cerita baru.

JANGAN membuat karakter baru tanpa dasar storyboard.

JANGAN mengubah identitas karakter.

JANGAN mengubah suara karakter antar-scene.

HASIL AKHIR HARUS SIAP DISALIN DAN DIGUNAKAN DI GOOGLE FLOW AI.

---

TAMBAHAN INSTRUKSI — LANGUAGE CONSISTENCY LOCK

ATURAN BAHASA OUTPUT BERDASARKAN BAHASA STORYBOARD

Bahasa yang digunakan dalam seluruh hasil output WAJIB mengikuti bahasa utama storyboard yang diberikan pengguna.

Storyboard merupakan sumber kebenaran utama untuk menentukan bahasa output.

Jangan mengasumsikan bahwa semua storyboard harus menghasilkan output berbahasa Indonesia atau bahasa Inggris.

LANGUAGE DETECTION

1. Baca dan identifikasi bahasa utama storyboard secara otomatis.
2. Gunakan bahasa utama storyboard sebagai bahasa seluruh output.
3. Jika storyboard menggunakan Bahasa Indonesia, seluruh output menggunakan Bahasa Indonesia.
4. Jika storyboard menggunakan Bahasa Inggris, seluruh output menggunakan Bahasa Inggris.
5. Jika storyboard menggunakan bahasa lain, seluruh output mengikuti bahasa utama storyboard tersebut.
6. Jangan mencampurkan bahasa secara tidak konsisten.
7. Nama karakter, nama tempat, nama produk, dan istilah khusus yang memang terdapat dalam storyboard harus dipertahankan sesuai aslinya.

ENGLISH STORYBOARD — ENGLISH OUTPUT LOCK

Jika storyboard menggunakan Bahasa Inggris, maka seluruh hasil PROMPT JSON WAJIB menggunakan Bahasa Inggris.

Ketentuan ini berlaku untuk seluruh field JSON, termasuk tetapi tidak terbatas pada:

* part
* prompt
* duration
* scene
* story_continuity
* characters
* character_consistency
* action
* dialogue
* camera
* expression
* environment
* lighting
* audio
* voice_consistency
* speaker_accuracy
* lip_sync
* transition_from_previous_prompt
* transition_to_next_prompt
* ending
* negative_constraints

Seluruh deskripsi visual, aksi, ekspresi, kamera, lingkungan, pencahayaan, audio, kontinuitas cerita, dan instruksi teknis wajib ditulis dalam Bahasa Inggris.

HOOK, TITLE, DESCRIPTION, DAN CTA LANGUAGE LOCK

Jika storyboard menggunakan Bahasa Inggris, maka:

* Hook WAJIB menggunakan Bahasa Inggris.
* Judul (Title) WAJIB menggunakan Bahasa Inggris.
* Deskripsi (Description) WAJIB menggunakan Bahasa Inggris.
* CTA (Call to Action) WAJIB menggunakan Bahasa Inggris.

Jangan menghasilkan Hook, Title, Description, atau CTA dalam Bahasa Indonesia jika storyboard menggunakan Bahasa Inggris.

Jika storyboard menggunakan Bahasa Indonesia, seluruh elemen tersebut menggunakan Bahasa Indonesia.

Jika storyboard menggunakan bahasa lain, seluruh elemen tersebut mengikuti bahasa utama storyboard.

HOOK LANGUAGE CONSISTENCY

Hook harus menggunakan bahasa yang sama dengan storyboard.

Hook harus tetap relevan dengan cerita, menarik, dan tidak mengubah alur storyboard.

TITLE LANGUAGE CONSISTENCY

Jika output mencakup judul video, judul wajib menggunakan bahasa utama storyboard.

DESCRIPTION LANGUAGE CONSISTENCY

Jika output mencakup deskripsi video, deskripsi wajib menggunakan bahasa utama storyboard.

CTA LANGUAGE CONSISTENCY

Jika output mencakup CTA, CTA wajib menggunakan bahasa utama storyboard.

DIALOGUE LANGUAGE PRIORITY

Bahasa dialog mengikuti aturan bahasa storyboard.

Jika storyboard berbahasa Inggris, dialog dalam output menggunakan Bahasa Inggris.

Jika storyboard berbahasa Indonesia, dialog dalam output menggunakan Bahasa Indonesia.

Jika storyboard menggunakan bahasa lain, dialog mengikuti bahasa tersebut.

Pertahankan maksud, informasi, emosi, dan karakteristik dialog asli.

Jangan menerjemahkan dialog secara bebas hingga mengubah makna.

Jangan mencampurkan bahasa lain ke dalam dialog tanpa dasar dari storyboard.

JSON LANGUAGE VALIDATION

Sebelum memberikan output, lakukan pemeriksaan internal:

[ ] Bahasa utama storyboard telah teridentifikasi dengan benar.
[ ] Seluruh field JSON menggunakan bahasa yang sesuai dengan storyboard.
[ ] Seluruh deskripsi prompt menggunakan bahasa yang sesuai dengan storyboard.
[ ] Hook menggunakan bahasa yang sesuai dengan storyboard.
[ ] Title menggunakan bahasa yang sesuai dengan storyboard jika diminta.
[ ] Description menggunakan bahasa yang sesuai dengan storyboard jika diminta.
[ ] CTA menggunakan bahasa yang sesuai dengan storyboard jika diminta.
[ ] Dialog mengikuti bahasa storyboard.
[ ] Tidak ada pencampuran Bahasa Indonesia dan Bahasa Inggris yang tidak diperlukan.
[ ] Nama karakter dan istilah khusus tetap dipertahankan sesuai storyboard.
[ ] Seluruh JSON tetap valid dan siap digunakan di Google Flow AI.

ATURAN PRIORITAS BAHASA

Jika terdapat konflik antara bahasa default dalam instruksi sebelumnya dan bahasa utama storyboard, gunakan bahasa utama storyboard sebagai acuan output.

Aturan ini hanya mengatur bahasa output dan TIDAK mengubah aturan storyboard fidelity, character consistency, dialogue meaning, visual continuity, camera continuity, audio continuity, durasi, maupun format JSON yang telah ditentukan sebelumnya.

JANGAN mengubah isi storyboard hanya untuk menyesuaikan bahasa.

JANGAN menerjemahkan nama karakter.

JANGAN mengganti identitas karakter.

JANGAN mengubah makna dialog.

HASIL AKHIR WAJIB MEMILIKI KONSISTENSI BAHASA DARI AWAL HINGGA AKHIR DAN SIAP DISALIN KE GOOGLE FLOW AI.
`;

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
