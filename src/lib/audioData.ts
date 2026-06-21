export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: "Murattal" | "Mujawwad";
  server: string;
  photoUrl: string;
  bitrate: string;
  description: string;
}

function createReciterAvatar(label: string, arabicLabel: string, accent: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="50%" stop-color="#064e3b" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="r" cx="30%" cy="24%" r="75%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#g)" />
      <rect width="160" height="160" rx="36" fill="url(#r)" />
      <circle cx="126" cy="34" r="22" fill="#ffffff" opacity="0.10" />
      <circle cx="34" cy="128" r="34" fill="#ffffff" opacity="0.08" />
      <path d="M38 84c18-31 66-31 84 0" fill="none" stroke="#f8fafc" stroke-width="6" opacity="0.30" stroke-linecap="round" />
      <text x="80" y="78" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="800" text-anchor="middle" fill="#ffffff">${label}</text>
      <text x="80" y="108" font-family="Arial, sans-serif" font-size="17" font-weight="700" text-anchor="middle" fill="#d1fae5">${arabicLabel}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// EveryAyah uses exact folder names. Do not rename the server strings.
// Wrong folder names cause "Audio could not load" even when the internet connection is strong.
export const RECITERS_LIST: Reciter[] = [
  {
    id: "ar.alafasy",
    name: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    style: "Murattal",
    server: "https://everyayah.com/data/Alafasy_128kbps/",
    bitrate: "128 kbps",
    description: "Clear, balanced recitation suitable for daily listening.",
    photoUrl: createReciterAvatar("MA", "العفاسي", "#10b981"),
  },
  {
    id: "ar.ali-jaber",
    name: "Ali Jaber",
    arabicName: "علي جابر",
    style: "Murattal",
    server: "https://everyayah.com/data/Ali_Jaber_64kbps/",
    bitrate: "64 kbps",
    description: "Beloved Haram recitation with calm, emotional delivery.",
    photoUrl: createReciterAvatar("AJ", "علي جابر", "#22c55e"),
  },
  {
    id: "ar.muhammad-ayyub",
    name: "Muhammad Ayyub",
    arabicName: "محمد أيوب",
    style: "Murattal",
    server: "https://everyayah.com/data/Muhammad_Ayyoub_128kbps/",
    bitrate: "128 kbps",
    description: "Strong, famous Madinah-style recitation.",
    photoUrl: createReciterAvatar("MY", "محمد أيوب", "#16a34a"),
  },
  {
    id: "ar.abdullah-matroud",
    name: "Abdullah Matroud",
    arabicName: "عبد الله مطرود",
    style: "Murattal",
    server: "https://everyayah.com/data/Abdullah_Matroud_128kbps/",
    bitrate: "128 kbps",
    description: "Soft, reflective recitation popular for daily listening.",
    photoUrl: createReciterAvatar("AM", "مطرود", "#059669"),
  },
  {
    id: "ar.sudais",
    name: "Abdul Rahman Al-Sudais",
    arabicName: "عبد الرحمن السديس",
    style: "Murattal",
    server: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/",
    bitrate: "192 kbps",
    description: "Well-known Haram recitation with strong clarity.",
    photoUrl: createReciterAvatar("AS", "السديس", "#22c55e"),
  },
  {
    id: "ar.shuraim",
    name: "Saud Al-Shuraim",
    arabicName: "سعود الشريم",
    style: "Murattal",
    server: "https://everyayah.com/data/Saood_ash-Shuraym_64kbps/",
    bitrate: "64 kbps",
    description: "Recognizable Haram recitation with efficient file size.",
    photoUrl: createReciterAvatar("SS", "الشريم", "#047857"),
  },
  {
    id: "ar.maher",
    name: "Maher Al Muaiqly",
    arabicName: "ماهر المعيقلي",
    style: "Murattal",
    server: "https://everyayah.com/data/Maher_AlMuaiqly_64kbps/",
    bitrate: "64 kbps",
    description: "Soft recitation commonly used for daily Quran listening.",
    photoUrl: createReciterAvatar("MM", "المعيقلي", "#059669"),
  },
  {
    id: "ar.abdullah-juhany",
    name: "Abdullah Al-Juhany",
    arabicName: "عبد الله عواد الجهني",
    style: "Murattal",
    server: "https://everyayah.com/data/Abdullaah_3awwaad_Al-Juhaynee_128kbps/",
    bitrate: "128 kbps",
    description: "Haram reciter with a smooth, measured tone.",
    photoUrl: createReciterAvatar("JH", "الجهني", "#0d9488"),
  },
  {
    id: "ar.basfar",
    name: "Abdullah Basfar",
    arabicName: "عبد الله بصفر",
    style: "Murattal",
    server: "https://everyayah.com/data/Abdullah_Basfar_192kbps/",
    bitrate: "192 kbps",
    description: "Clean and steady recitation, good for memorization.",
    photoUrl: createReciterAvatar("BF", "بصفر", "#0284c7"),
  },
  {
    id: "ar.abdulbasitmurattal",
    name: "Abdul Basit Abdul Samad",
    arabicName: "عبد الباسط عبد الصمد",
    style: "Murattal",
    server: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/",
    bitrate: "64 kbps",
    description: "Classic Egyptian recitation with a calm murattal style.",
    photoUrl: createReciterAvatar("AB", "عبد الباسط", "#14b8a6"),
  },
  {
    id: "ar.abdulbasit-mujawwad",
    name: "Abdul Basit Mujawwad",
    arabicName: "عبد الباسط مجود",
    style: "Mujawwad",
    server: "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/",
    bitrate: "128 kbps",
    description: "Classic mujawwad style for deep listening.",
    photoUrl: createReciterAvatar("AB", "مجود", "#0ea5e9"),
  },
  {
    id: "ar.husary",
    name: "Mahmoud Khalil Al-Husary",
    arabicName: "محمود خليل الحصري",
    style: "Murattal",
    server: "https://everyayah.com/data/Husary_64kbps/",
    bitrate: "64 kbps",
    description: "Precise, teaching-friendly recitation.",
    photoUrl: createReciterAvatar("MH", "الحصري", "#0f766e"),
  },
  {
    id: "ar.husary-muallim",
    name: "Al-Husary Muallim",
    arabicName: "الحصري المعلم",
    style: "Murattal",
    server: "https://everyayah.com/data/Husary_Muallim_128kbps/",
    bitrate: "128 kbps",
    description: "Teacher-style recitation for learning and repetition.",
    photoUrl: createReciterAvatar("HM", "المعلم", "#0891b2"),
  },
  {
    id: "ar.minshawi",
    name: "Muhammad Siddiq Al-Minshawi",
    arabicName: "محمد صديق المنشاوي",
    style: "Murattal",
    server: "https://everyayah.com/data/Minshawy_Murattal_128kbps/",
    bitrate: "128 kbps",
    description: "Beautiful classic murattal recitation.",
    photoUrl: createReciterAvatar("MS", "المنشاوي", "#16a34a"),
  },
  {
    id: "ar.minshawi-mujawwad",
    name: "Al-Minshawi Mujawwad",
    arabicName: "المنشاوي مجود",
    style: "Mujawwad",
    server: "https://everyayah.com/data/Minshawy_Mujawwad_192kbps/",
    bitrate: "192 kbps",
    description: "Powerful classic mujawwad recitation.",
    photoUrl: createReciterAvatar("MS", "مجود", "#2563eb"),
  },
  {
    id: "ar.ghamdi",
    name: "Saad Al-Ghamdi",
    arabicName: "سعد الغامدي",
    style: "Murattal",
    server: "https://everyayah.com/data/Ghamadi_40kbps/",
    bitrate: "40 kbps",
    description: "Smooth and steady recitation for memorization.",
    photoUrl: createReciterAvatar("SG", "الغامدي", "#0d9488"),
  },
  {
    id: "ar.shaatree",
    name: "Abu Bakr Ash-Shatri",
    arabicName: "أبو بكر الشاطري",
    style: "Murattal",
    server: "https://everyayah.com/data/Abu_Bakr_Ash-Shaatree_128kbps/",
    bitrate: "128 kbps",
    description: "Popular recitation with strong rhythm and clarity.",
    photoUrl: createReciterAvatar("BS", "الشاطري", "#84cc16"),
  },
  {
    id: "ar.ajamy",
    name: "Ahmed Al-Ajamy",
    arabicName: "أحمد العجمي",
    style: "Murattal",
    server: "https://everyayah.com/data/ahmed_ibn_ali_al_ajamy_128kbps/",
    bitrate: "128 kbps",
    description: "Emotional and widely recognized recitation.",
    photoUrl: createReciterAvatar("AA", "العجمي", "#65a30d"),
  },
  {
    id: "ar.fares-abbad",
    name: "Fares Abbad",
    arabicName: "فارس عباد",
    style: "Murattal",
    server: "https://everyayah.com/data/Fares_Abbad_64kbps/",
    bitrate: "64 kbps",
    description: "Calm Yemeni recitation with excellent flow.",
    photoUrl: createReciterAvatar("FA", "فارس عباد", "#15803d"),
  },
  {
    id: "ar.hani-rifai",
    name: "Hani Ar-Rifai",
    arabicName: "هاني الرفاعي",
    style: "Murattal",
    server: "https://everyayah.com/data/Hani_Rifai_192kbps/",
    bitrate: "192 kbps",
    description: "Deep, emotional recitation for reflection.",
    photoUrl: createReciterAvatar("HR", "الرفاعي", "#dc2626"),
  },
  {
    id: "ar.hudhaify",
    name: "Ali Al-Hudhaify",
    arabicName: "علي الحذيفي",
    style: "Murattal",
    server: "https://everyayah.com/data/Hudhaify_128kbps/",
    bitrate: "128 kbps",
    description: "Madinah recitation known for precision and dignity.",
    photoUrl: createReciterAvatar("AH", "الحذيفي", "#7c3aed"),
  },
  {
    id: "ar.khalid-qahtani",
    name: "Khalid Al-Qahtani",
    arabicName: "خالد القحطاني",
    style: "Murattal",
    server: "https://everyayah.com/data/Khaalid_Abdullaah_al-Qahtaanee_192kbps/",
    bitrate: "192 kbps",
    description: "Beautiful emotional recitation with high-quality audio.",
    photoUrl: createReciterAvatar("KQ", "القحطاني", "#9333ea"),
  },
  {
    id: "ar.muhammad-jibreel",
    name: "Muhammad Jibreel",
    arabicName: "محمد جبريل",
    style: "Murattal",
    server: "https://everyayah.com/data/Muhammad_Jibreel_128kbps/",
    bitrate: "128 kbps",
    description: "Well-known Egyptian reciter with a distinct tone.",
    photoUrl: createReciterAvatar("MJ", "جبريل", "#7c2d12"),
  },
  {
    id: "ar.muhsin-qasim",
    name: "Muhsin Al-Qasim",
    arabicName: "محسن القاسم",
    style: "Murattal",
    server: "https://everyayah.com/data/Muhsin_Al_Qasim_192kbps/",
    bitrate: "192 kbps",
    description: "Madinah-style recitation, clear and steady.",
    photoUrl: createReciterAvatar("MQ", "القاسم", "#0369a1"),
  },
  {
    id: "ar.nasser-qatami",
    name: "Nasser Al-Qatami",
    arabicName: "ناصر القطامي",
    style: "Murattal",
    server: "https://everyayah.com/data/Nasser_Alqatami_128kbps/",
    bitrate: "128 kbps",
    description: "Modern recitation style with emotional delivery.",
    photoUrl: createReciterAvatar("NQ", "القطامي", "#be123c"),
  },
  {
    id: "ar.yasser-dossari",
    name: "Yasser Al-Dossari",
    arabicName: "ياسر الدوسري",
    style: "Murattal",
    server: "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/",
    bitrate: "128 kbps",
    description: "Powerful modern Haram recitation.",
    photoUrl: createReciterAvatar("YD", "الدوسري", "#c026d3"),
  },
  {
    id: "ar.salah-bukhatir",
    name: "Salah Bukhatir",
    arabicName: "صلاح بو خاطر",
    style: "Murattal",
    server: "https://everyayah.com/data/Salaah_AbdulRahman_Bukhatir_128kbps/",
    bitrate: "128 kbps",
    description: "Soft, relaxing recitation with clear pacing.",
    photoUrl: createReciterAvatar("SB", "بو خاطر", "#0f766e"),
  },
  {
    id: "ar.salah-budair",
    name: "Salah Al-Budair",
    arabicName: "صلاح البدير",
    style: "Murattal",
    server: "https://everyayah.com/data/Salah_Al_Budair_128kbps/",
    bitrate: "128 kbps",
    description: "Madinah Haram recitation, firm and beautiful.",
    photoUrl: createReciterAvatar("BD", "البدير", "#115e59"),
  },
  {
    id: "ar.ayman-sowaid",
    name: "Ayman Sowaid",
    arabicName: "أيمن سويد",
    style: "Murattal",
    server: "https://everyayah.com/data/Ayman_Sowaid_64kbps/",
    bitrate: "64 kbps",
    description: "Teaching-friendly recitation by a tajweed scholar.",
    photoUrl: createReciterAvatar("AW", "أيمن سويد", "#1d4ed8"),
  },
  {
    id: "ar.ibrahim-akhdar",
    name: "Ibrahim Al-Akhdar",
    arabicName: "إبراهيم الأخضر",
    style: "Murattal",
    server: "https://everyayah.com/data/Ibrahim_Akhdar_32kbps/",
    bitrate: "32 kbps",
    description: "Classic Madinah recitation with compact audio size.",
    photoUrl: createReciterAvatar("IA", "الأخضر", "#047857"),
  },
  {
    id: "ar.mahmoud-ali-banna",
    name: "Mahmoud Ali Al-Banna",
    arabicName: "محمود علي البنا",
    style: "Murattal",
    server: "https://everyayah.com/data/mahmoud_ali_al_banna_32kbps/",
    bitrate: "32 kbps",
    description: "Classic Egyptian reciter with warm tone.",
    photoUrl: createReciterAvatar("MB", "البنا", "#b45309"),
  },
  {
    id: "ar.tablaway",
    name: "Mohammad Al-Tablaway",
    arabicName: "محمد الطبلاوي",
    style: "Murattal",
    server: "https://everyayah.com/data/Mohammad_al_Tablaway_128kbps/",
    bitrate: "128 kbps",
    description: "Famous Egyptian recitation with strong character.",
    photoUrl: createReciterAvatar("MT", "الطبلاوي", "#9a3412"),
  },
];

export const AUDIO_CACHE_NAME = "noor-quran-audio-v1";

export function getReciterById(reciterId: string): Reciter {
  return RECITERS_LIST.find((reciter) => reciter.id === reciterId) || RECITERS_LIST[0];
}

export function getVerseAudioUrl(reciterId: string, surah: number, ayah: number): string {
  const reciter = getReciterById(reciterId);
  const safeSurah = Math.max(1, Math.min(114, Math.trunc(surah || 1)));
  const safeAyah = Math.max(1, Math.trunc(ayah || 1));
  const sStr = safeSurah.toString().padStart(3, "0");
  const aStr = safeAyah.toString().padStart(3, "0");
  return `${reciter.server}${sStr}${aStr}.mp3`;
}

export function getAudioDownloadKey(reciterId: string, surah: number, ayah: number): string {
  return `download_${reciterId}_${surah}_${ayah}`;
}
