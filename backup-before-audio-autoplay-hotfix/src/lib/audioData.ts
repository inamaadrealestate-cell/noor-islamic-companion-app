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
          <stop offset="55%" stop-color="#064e3b" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="r" cx="32%" cy="26%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#g)" />
      <rect width="160" height="160" rx="36" fill="url(#r)" />
      <circle cx="124" cy="34" r="22" fill="#ffffff" opacity="0.10" />
      <circle cx="34" cy="128" r="34" fill="#ffffff" opacity="0.08" />
      <path d="M40 82c18-30 62-30 80 0" fill="none" stroke="#f8fafc" stroke-width="6" opacity="0.28" stroke-linecap="round" />
      <text x="80" y="78" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="800" text-anchor="middle" fill="#ffffff">${label}</text>
      <text x="80" y="108" font-family="Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="#d1fae5">${arabicLabel}</text>
    </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// These servers use EveryAyah's exact folder names. Do not rename the folder strings.
// Wrong folder names cause the browser to show "Audio could not load" even when the user's internet is strong.
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
    id: "ar.minshawi",
    name: "Muhammad Siddiq Al-Minshawi",
    arabicName: "محمد صديق المنشاوي",
    style: "Murattal",
    server: "https://everyayah.com/data/Minshawy_Murattal_128kbps/",
    bitrate: "128 kbps",
    description: "Beautiful classic murattal recitation.",
    photoUrl: createReciterAvatar("MS", "المنشاوي", "#16a34a"),
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
