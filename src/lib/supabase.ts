import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

const hasSupabaseConfig =
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20 &&
  !supabaseUrl.includes('xyzcompany') &&
  supabaseAnonKey !== 'public-anon-key';

export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function safeGetLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemoveLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// Helper to get or generate anonymous device ID
export function getDeviceId(): string {
  const key = 'noor_device_id';
  let deviceId = safeGetLocalStorage(key);

  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    safeSetLocalStorage(key, deviceId);

    // Register device in Supabase only when real env keys are configured.
    supabase?.from('devices').insert([{ device_id: deviceId }]).then(() => {}, () => {});
  }

  return deviceId;
}

// Data Types
export interface Bookmark {
  id: string;
  surah_number: number;
  ayah_number: number;
  page_number: number;
  note?: string;
  created_at: string;
}

export interface ReadingProgress {
  surah_number: number;
  ayah_number: number;
  page_number: number;
  juz_number: number;
  updated_at: string;
}

export interface AdhkarProgress {
  category: string;
  dhikr_id: string;
  completed_count: number;
  target_count: number;
  date: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  translation_edition: string;
  default_reciter: string;
  arabic_font_size: number;
  translation_font_size: number;
  show_translation: boolean;
  show_transliteration: boolean;
  prayer_notifications: boolean;
  calculation_method: number;
}

// Default Settings
export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  translation_edition: 'en.sahih',
  default_reciter: 'ar.alafasy',
  arabic_font_size: 28,
  translation_font_size: 16,
  show_translation: true,
  show_transliteration: true,
  prayer_notifications: false,
  calculation_method: 4, // Umm al-Qura
};

// --- Storage Wrappers (LocalStorage first, optional Supabase sync) ---

export const Storage = {
  getSettings(): UserSettings {
    const local = safeGetLocalStorage('noor_settings');
    if (local) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
      } catch {}
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    safeSetLocalStorage('noor_settings', JSON.stringify(settings));
    if (!supabase) return;

    const device_id = getDeviceId();
    try {
      await supabase.from('user_settings').upsert({ device_id, ...settings });
    } catch {}
  },

  getProgress(): ReadingProgress {
    const local = safeGetLocalStorage('noor_progress');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return {
      surah_number: 1,
      ayah_number: 1,
      page_number: 1,
      juz_number: 1,
      updated_at: new Date().toISOString(),
    };
  },

  async saveProgress(progress: ReadingProgress): Promise<void> {
    safeSetLocalStorage('noor_progress', JSON.stringify(progress));
    if (!supabase) return;

    const device_id = getDeviceId();
    try {
      await supabase.from('reading_progress').upsert({ device_id, ...progress });
    } catch {}
  },

  getBookmarks(): Bookmark[] {
    const local = safeGetLocalStorage('noor_bookmarks');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return [];
  },

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'created_at'>): Promise<Bookmark> {
    const newBookmark: Bookmark = {
      id: `bm_${Math.random().toString(36).slice(2, 11)}`,
      created_at: new Date().toISOString(),
      ...bookmark,
    };

    const bookmarks = [newBookmark, ...this.getBookmarks()];
    safeSetLocalStorage('noor_bookmarks', JSON.stringify(bookmarks));

    if (supabase) {
      const device_id = getDeviceId();
      try {
        await supabase.from('bookmarks').insert([{ device_id, ...newBookmark }]);
      } catch {}
    }

    return newBookmark;
  },

  async removeBookmark(id: string): Promise<void> {
    const bookmarks = this.getBookmarks().filter((b) => b.id !== id);
    safeSetLocalStorage('noor_bookmarks', JSON.stringify(bookmarks));

    if (!supabase) return;
    try {
      await supabase.from('bookmarks').delete().eq('id', id);
    } catch {}
  },

  getAdhkarProgress(date: string): Record<string, number> {
    const local = safeGetLocalStorage(`noor_adhkar_${date}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch {}
    }
    return {};
  },

  async saveAdhkarProgress(
    date: string,
    dhikrId: string,
    count: number,
    target: number,
    category: string,
  ): Promise<void> {
    const current = this.getAdhkarProgress(date);
    current[dhikrId] = count;
    safeSetLocalStorage(`noor_adhkar_${date}`, JSON.stringify(current));

    if (!supabase) return;
    const device_id = getDeviceId();

    try {
      await supabase.from('adhkar_progress').upsert({
        device_id,
        category,
        dhikr_id: dhikrId,
        completed_count: count,
        target_count: target,
        date,
      });
    } catch {}
  },

  clearDownloadFlags(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith('download_')) keysToRemove.push(key);
      }
      keysToRemove.forEach(safeRemoveLocalStorage);
    } catch {}
  },
};
