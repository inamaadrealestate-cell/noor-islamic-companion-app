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

function makeLocalId(prefix: string): string {
  const randomValue =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${randomValue}`;
}

export function getDeviceId(): string {
  const key = 'noor_device_id';
  let deviceId = safeGetLocalStorage(key);

  if (!deviceId) {
    deviceId = makeLocalId('noor');
    safeSetLocalStorage(key, deviceId);
  }

  return deviceId;
}

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

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  translation_edition: 'en.sahih',
  default_reciter: 'ar.alafasy',
  arabic_font_size: 28,
  translation_font_size: 16,
  show_translation: true,
  show_transliteration: true,
  prayer_notifications: false,
  calculation_method: 4,
};

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
      id: makeLocalId('bm'),
      created_at: new Date().toISOString(),
      ...bookmark,
    };

    const bookmarks = [newBookmark, ...this.getBookmarks()];
    safeSetLocalStorage('noor_bookmarks', JSON.stringify(bookmarks));
    return newBookmark;
  },

  async removeBookmark(id: string): Promise<void> {
    const bookmarks = this.getBookmarks().filter((bookmark) => bookmark.id !== id);
    safeSetLocalStorage('noor_bookmarks', JSON.stringify(bookmarks));
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
    _target: number,
    _category: string,
  ): Promise<void> {
    const current = this.getAdhkarProgress(date);
    current[dhikrId] = count;
    safeSetLocalStorage(`noor_adhkar_${date}`, JSON.stringify(current));
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
