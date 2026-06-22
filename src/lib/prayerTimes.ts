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

export interface PrayerLocation {
  lat: number;
  lng: number;
  label: string;
  source: 'default' | 'gps' | 'search';
}

export interface CitySearchResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface MonthlyPrayerDay {
  dayNumber: number;
  gregorianDate: string;
  gregorianWeekday: string;
  hijriDate: string;
  hijriWeekdayAr: string;
  timings: PrayerTimesData['timings'];
}

export const DEFAULT_PRAYER_LOCATION: PrayerLocation = {
  lat: 21.4225,
  lng: 39.8262,
  label: 'Makkah, Saudi Arabia',
  source: 'default',
};

export const ADHAN_AUDIO_URL = 'https://www.islamcan.com/audio/adhan/azan1.mp3';
export const PRAYER_LOCATION_STORAGE_KEY = 'noor_prayer_location';

function safeLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage can fail in private browsing or restricted embedded browsers.
  }
}

export const FALLBACK_PRAYER_DATA: PrayerTimesData = {
  timings: {
    Fajr: '05:12',
    Sunrise: '06:35',
    Dhuhr: '12:15',
    Asr: '15:35',
    Maghrib: '17:55',
    Isha: '19:15',
    Jumuah: '12:15',
  },
  date: {
    readable: 'Today',
    hijri: {
      date: 'Today',
      format: 'DD-MM-YYYY',
      day: '',
      weekday: { en: 'Today', ar: 'اليوم' },
      month: { en: '', ar: '' },
      year: '',
    },
    gregorian: {
      date: new Date().toLocaleDateString(),
      weekday: { en: new Date().toLocaleDateString(undefined, { weekday: 'long' }) },
      month: { en: new Date().toLocaleDateString(undefined, { month: 'long' }) },
      year: String(new Date().getFullYear()),
    },
  },
  meta: {
    method: { name: 'Offline fallback timing' },
  },
};

function cleanTimingValue(value: string | undefined): string {
  if (!value) return '--:--';
  const match = value.match(/\d{1,2}:\d{2}/);
  return match ? match[0].padStart(5, '0') : value;
}

function cleanPrayerTimings(timings: Record<string, string>): PrayerTimesData['timings'] {
  const cleanedTimings = { ...timings } as PrayerTimesData['timings'];
  Object.keys(cleanedTimings).forEach((key) => {
    cleanedTimings[key] = cleanTimingValue(cleanedTimings[key]);
  });
  cleanedTimings.Jumuah = cleanedTimings.Dhuhr;
  return cleanedTimings;
}

function cleanPrayerTimesData(data: PrayerTimesData): PrayerTimesData {
  return {
    ...data,
    timings: cleanPrayerTimings(data.timings),
  };
}

export function readSavedPrayerLocation(): PrayerLocation | null {
  try {
    const saved = safeLocalGet(PRAYER_LOCATION_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as PrayerLocation;
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number' || !parsed.label) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function savePrayerLocation(location: PrayerLocation): void {
  try {
    safeLocalSet(PRAYER_LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // localStorage can fail in private browsing or restricted embedded browsers.
  }
}

export function getBrowserPrayerLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}

export async function reverseGeocodePrayerLocation(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return 'Current GPS location';

    const data = await res.json();
    const address = data?.address || {};
    const city = address.city || address.town || address.village || address.county || address.state;
    const country = address.country;

    if (city && country) return `${city}, ${country}`;
    if (data?.display_name) return String(data.display_name).split(',').slice(0, 3).join(',');
    return 'Current GPS location';
  } catch {
    return 'Current GPS location';
  }
}

export async function searchPrayerCityCoordinates(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=6&addressdetails=1`,
    {
      headers: {
        'Accept-Language': 'en',
      },
    }
  );

  if (!response.ok) {
    throw new Error('City search failed.');
  }

  const data = await response.json();

  return data.map((item: any) => {
    const address = item?.address || {};
    const city = address.city || address.town || address.village || address.county || address.state;
    const country = address.country;
    const displayName = city && country ? `${city}, ${country}` : item.display_name;

    return {
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      displayName,
    };
  });
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  method: number = 4
): Promise<PrayerTimesData> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      method: String(method),
    });
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) return cleanPrayerTimesData(FALLBACK_PRAYER_DATA);

    const json = await res.json();
    if (json.data) {
      return cleanPrayerTimesData(json.data as PrayerTimesData);
    }

    return cleanPrayerTimesData(FALLBACK_PRAYER_DATA);
  } catch {
    return cleanPrayerTimesData(FALLBACK_PRAYER_DATA);
  }
}

export async function fetchMonthlyPrayerTimes(
  lat: number,
  lng: number,
  method: number = 4,
  month: number = new Date().getMonth() + 1,
  year: number = new Date().getFullYear()
): Promise<MonthlyPrayerDay[]> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      method: String(method),
    });
    const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('Monthly prayer timetable failed.');

    const json = await res.json();
    const days = Array.isArray(json.data) ? json.data : [];

    return days.map((item: any, index: number) => ({
      dayNumber: Number(item?.date?.gregorian?.day || index + 1),
      gregorianDate: item?.date?.gregorian?.date || `${String(index + 1).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
      gregorianWeekday: item?.date?.gregorian?.weekday?.en || '',
      hijriDate: item?.date?.hijri?.date || '',
      hijriWeekdayAr: item?.date?.hijri?.weekday?.ar || '',
      timings: cleanPrayerTimings(item?.timings || {}),
    }));
  } catch {
    return [];
  }
}

function parseTimingToMinutes(time: string | undefined): number | null {
  const clean = cleanTimingValue(time);
  const [hours, minutes] = clean.split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function formatRemainingText(diffMinutes: number): string {
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hours <= 0) return `${mins}m left`;
  if (mins === 0) return `${hours}h left`;
  return `${hours}h ${mins}m left`;
}

export function calculateNextPrayer(timings: Record<string, string>): NextPrayerInfo {
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  const prayerSequence = [
    { name: 'Fajr', time: cleanTimingValue(timings.Fajr) },
    { name: 'Sunrise', time: cleanTimingValue(timings.Sunrise) },
    { name: 'Dhuhr', time: cleanTimingValue(timings.Dhuhr) },
    { name: 'Asr', time: cleanTimingValue(timings.Asr) },
    { name: 'Maghrib', time: cleanTimingValue(timings.Maghrib) },
    { name: 'Isha', time: cleanTimingValue(timings.Isha) },
  ];

  for (const prayer of prayerSequence) {
    const prayerMinutes = parseTimingToMinutes(prayer.time);
    if (prayerMinutes === null) continue;

    if (prayerMinutes > currentTotalMinutes) {
      const diffMinutes = prayerMinutes - currentTotalMinutes;
      return {
        name: prayer.name,
        time: prayer.time,
        remainingMs: diffMinutes * 60000,
        remainingText: formatRemainingText(diffMinutes),
      };
    }
  }

  const fajrTime = cleanTimingValue(timings.Fajr || '05:00');
  const fajrMinutes = parseTimingToMinutes(fajrTime) ?? 300;
  const diffMinutesTomorrow = fajrMinutes + 24 * 60 - currentTotalMinutes;

  return {
    name: 'Fajr',
    time: fajrTime,
    remainingMs: diffMinutesTomorrow * 60000,
    remainingText: formatRemainingText(diffMinutesTomorrow),
  };
}
