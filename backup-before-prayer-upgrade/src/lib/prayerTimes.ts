export interface PrayerTimesData {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  };
  date: {
    readable: string;
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: { en: string; ar: string };
      month: { en: string; ar: string };
      year: string;
    };
    gregorian: {
      date: string;
      weekday: { en: string };
      month: { en: string };
      year: string;
    };
  };
  meta: {
    method: {
      name: string;
    };
  };
}

export interface NextPrayerInfo {
  name: string;
  time: string;
  remainingMs: number;
  remainingText: string;
}

// Fallback static timing if API fails or offline
export const FALLBACK_PRAYER_DATA: PrayerTimesData = {
  timings: {
    Fajr: "05:12",
    Sunrise: "06:35",
    Dhuhr: "12:15",
    Asr: "15:35",
    Maghrib: "17:55",
    Isha: "19:15",
    Jumuah: "12:15",
  },
  date: {
    readable: "Today",
    hijri: {
      date: "15 Ramadan 1447",
      format: "DD-MM-YYYY",
      day: "15",
      weekday: { en: "Friday", ar: "الجمعة" },
      month: { en: "Ramadan", ar: "رمضان" },
      year: "1447",
    },
    gregorian: {
      date: "06-03-2026",
      weekday: { en: "Friday" },
      month: { en: "March" },
      year: "2026",
    },
  },
  meta: {
    method: { name: "Umm al-Qura University, Makkah" },
  },
};

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  method: number = 4
): Promise<PrayerTimesData> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=${method}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_PRAYER_DATA;
    const json = await res.json();
    if (json.data) {
      json.data.timings.Jumuah = json.data.timings.Dhuhr;
      return json.data as PrayerTimesData;
    }
    return FALLBACK_PRAYER_DATA;
  } catch {
    return FALLBACK_PRAYER_DATA;
  }
}

export function calculateNextPrayer(timings: Record<string, string>): NextPrayerInfo {
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  const prayerSequence = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Sunrise", time: timings.Sunrise },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha },
  ];

  for (const prayer of prayerSequence) {
    if (!prayer.time) continue;
    const [h, m] = prayer.time.split(":").map(Number);
    const prayerMinutes = h * 60 + m;

    if (prayerMinutes > currentTotalMinutes || (prayerMinutes === currentTotalMinutes && currentSeconds === 0)) {
      const diffMinutes = prayerMinutes - currentTotalMinutes;
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return {
        name: prayer.name,
        time: prayer.time,
        remainingMs: diffMinutes * 60000,
        remainingText: `${hours}h ${mins}m left`,
      };
    }
  }

  // If after Isha, next is Fajr tomorrow
  const [fajrH, fajrM] = (timings.Fajr || "05:00").split(":").map(Number);
  const fajrMinutesTomorrow = fajrH * 60 + fajrM + 24 * 60;
  const diffMinutesTomorrow = fajrMinutesTomorrow - currentTotalMinutes;
  const hoursTomorrow = Math.floor(diffMinutesTomorrow / 60);
  const minsTomorrow = diffMinutesTomorrow % 60;

  return {
    name: "Fajr",
    time: timings.Fajr || "05:00",
    remainingMs: diffMinutesTomorrow * 60000,
    remainingText: `${hoursTomorrow}h ${minsTomorrow}m left`,
  };
}
