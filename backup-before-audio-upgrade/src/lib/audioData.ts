export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: "Murattal" | "Mujawwad";
  server: string;
  photoUrl: string;
}

export const RECITERS_LIST: Reciter[] = [
  {
    id: "ar.alafasy",
    name: "Mishary Rashid Alafasy",
    arabicName: "مشاري راشد العفاسي",
    style: "Murattal",
    server: "https://everyayah.com/data/Alafasy_128kbps/",
    photoUrl: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.abdulbasitmurattal",
    name: "Abdul Basit Abdul Samad",
    arabicName: "عبد الباسط عبد الصمد",
    style: "Murattal",
    server: "https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/",
    photoUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.sudais",
    name: "Abdul Rahman Al-Sudais",
    arabicName: "عبد الرحمن السديس",
    style: "Murattal",
    server: "https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/",
    photoUrl: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.ghamdi",
    name: "Saad Al-Ghamdi",
    arabicName: "سعد الغامدي",
    style: "Murattal",
    server: "https://everyayah.com/data/Saad_Al_Ghamdi_128kbps/",
    photoUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.maher",
    name: "Maher Al Muaiqly",
    arabicName: "ماهر المعيقلي",
    style: "Murattal",
    server: "https://everyayah.com/data/MaherAlMuaiqly128kbps/",
    photoUrl: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.dosari",
    name: "Yasser Al-Dosari",
    arabicName: "ياسر الدوسري",
    style: "Murattal",
    server: "https://everyayah.com/data/Yasiir_Al_Dosari_128kbps/",
    photoUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.idris",
    name: "Idris Abkar",
    arabicName: "إدريس أبكر",
    style: "Murattal",
    server: "https://everyayah.com/data/Idrees_Abkr_192kbps/",
    photoUrl: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "ar.shuraim",
    name: "Saud Al-Shuraim",
    arabicName: "سعود الشريم",
    style: "Murattal",
    server: "https://everyayah.com/data/Saood_ash-Shuraym_64kbps/",
    photoUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&auto=format&fit=crop&q=80"
  }
];

export function getVerseAudioUrl(reciterId: string, surah: number, ayah: number): string {
  const reciter = RECITERS_LIST.find(r => r.id === reciterId) || RECITERS_LIST[0];
  const sStr = surah.toString().padStart(3, '0');
  const aStr = ayah.toString().padStart(3, '0');
  return `${reciter.server}${sStr}${aStr}.mp3`;
}
