import { useEffect, useMemo, useRef, useState } from "react";
import {
  Moon,
  Sun,
  BookOpen,
  Volume2,
  Bell,
  Trash2,
  ShieldCheck,
  Heart,
  Sparkles,
  Check,
  RotateCcw,
  Search,
  Copy,
  Download,
  Upload,
  Info,
  Sliders,
  Share2,
  Link as LinkIcon,
  MessageCircle,
} from "lucide-react";
import { DEFAULT_SETTINGS, UserSettings } from "../../lib/storage";
import { AUDIO_CACHE_NAME, RECITERS_LIST } from "../../lib/audioData";
import {
  getAdhkarReminderSettings,
  getPrayerNotificationStatus,
  requestPrayerNotificationPermission,
  resetAdhkarReminderSettings,
  saveAdhkarReminderSettings,
  showAdhkarReminderTest,
  showPrayerNotificationTest,
  type NoorAdhkarReminderSettings,
  type NoorNotificationStatus,
  type ReminderSlotId,
} from "../../lib/pwa";

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  isLightMode: boolean;
}

type Notice = {
  type: "success" | "warning";
  message: string;
};

const STORAGE_KEYS = {
  settings: "noor_settings",
  progress: "noor_progress",
  bookmarks: "noor_bookmarks",
  prayerLocation: "noor_prayer_location",
  qiblaLocation: "noor_qibla_location",
};

const QURAN_SURAH_CACHE_PREFIX = "noor_quran_surah_cache_v1";

const TRANSLATIONS = [
  {
    id: "en.sahih",
    name: "English — Sahih International",
    note: "Clear modern English",
  },
  {
    id: "en.yusufali",
    name: "English — Yusuf Ali",
    note: "Classic English style",
  },
  {
    id: "en.pickthall",
    name: "English — Marmaduke Pickthall",
    note: "Traditional English style",
  },
  {
    id: "en.asad",
    name: "English — Muhammad Asad",
    note: "Reflective commentary style",
  },
  {
    id: "fr.hamidullah",
    name: "French — Muhammad Hamidullah",
    note: "French translation",
  },
  {
    id: "ur.jalandhry",
    name: "Urdu — Fateh Muhammad Jalandhry",
    note: "Urdu translation",
  },
];

const CALCULATION_METHODS = [
  { id: 4, name: "Umm al-Qura University, Makkah" },
  { id: 2, name: "Islamic Society of North America (ISNA)" },
  { id: 3, name: "Muslim World League (MWL)" },
  { id: 5, name: "Egyptian General Authority of Survey" },
  { id: 7, name: "Institute of Geophysics, University of Tehran" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Majlis Ugama Islam Singapura" },
  { id: 12, name: "Union Organization Islamic de France" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey" },
];

const SOURCE_GROUPS = [
  {
    title: "Quran text",
    body: "Arabic Quran text is available in the reading section and can be saved locally on your device for offline reading after you open or download a Surah.",
  },
  {
    title: "Translations",
    body: "Translations are selectable in Settings, including well-known English, French, and Urdu editions where available.",
  },
  {
    title: "Recitations",
    body: "Verse-by-verse recitation audio is provided through trusted public recitation sources with fallback playback support.",
  },
  {
    title: "Prayer times",
    body: "Prayer times are calculated from your chosen location and calculation method. Timings should always be checked with your local masjid for official schedules.",
  },
  {
    title: "Adhkar and Duas",
    body: "Adhkar and duas are provided for convenience with source labels where included. Please have Arabic texts and references reviewed by a knowledgeable person before wide public promotion.",
  },
];

const PRIVACY_POINTS = [
  "NoorQuran works without an account.",
  "Bookmarks, notes, settings, cached Surahs, adhkar progress, and tasbih history are stored locally on this device.",
  "Location is only used in the browser to calculate Salah times and Qibla direction when you allow it.",
  "Notifications are only shown after you grant browser permission.",
  "Export Backup lets you save your own app data on your device and move it manually.",
];

const REVIEW_CHECKLIST = [
  "Verify Arabic Adhkar and Dua text",
  "Verify source labels and repetitions",
  "Verify prayer method for your country or city",
  "Verify translations fit your audience",
  "Test audio playback for your preferred reciters",
];

const NOORQURAN_PUBLIC_URL = "https://noorquran-eight.vercel.app";

const NOORQURAN_INVITE_TEXT =
  "Assalamu alaykum. I found NoorQuran, a clean Islamic companion app for Quran reading, recitations, Salah times, Adhkar, Duas, Tasbih, Qibla, reminders, and offline reading. You can use it in the browser or install it like an app.";

const SHARE_HIGHLIGHTS = [
  "Quran reading with bookmarks and notes",
  "Recitations with many major reciters",
  "Salah times, monthly timetable, and Qibla",
  "Adhkar, Duas, Tasbih, reminders, and offline reading",
];

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
  } catch {}
}

function safeLocalRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function getNoorStorageKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("noor_") || key.startsWith("download_"))) {
        keys.push(key);
      }
    }
    return keys.sort();
  } catch {
    return [];
  }
}

function bytesToReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimateStorageUsage(): {
  keys: number;
  bytes: number;
  downloads: number;
  adhkarDays: number;
  cachedSurahs: number;
} {
  const keys = getNoorStorageKeys();
  const bytes = keys.reduce(
    (total, key) => total + key.length + (safeLocalGet(key)?.length || 0),
    0,
  );
  return {
    keys: keys.length,
    bytes,
    downloads: keys.filter((key) => key.startsWith("download_")).length,
    adhkarDays: keys.filter((key) => key.startsWith("noor_adhkar_")).length,
    cachedSurahs: keys.filter((key) => key.startsWith(QURAN_SURAH_CACHE_PREFIX))
      .length,
  };
}

export default function SettingsScreen({
  settings,
  onUpdateSettings,
  isLightMode,
}: SettingsScreenProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [storageStats, setStorageStats] = useState(estimateStorageUsage());
  const [notificationStatus, setNotificationStatus] =
    useState<NoorNotificationStatus>(() => getPrayerNotificationStatus());
  const [notificationTesting, setNotificationTesting] = useState(false);
  const [reminderSettings, setReminderSettings] =
    useState<NoorAdhkarReminderSettings>(() => getAdhkarReminderSettings());
  const [reminderTesting, setReminderTesting] = useState(false);
  const [reciterSearch, setReciterSearch] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const selectedTranslation = useMemo(
    () =>
      TRANSLATIONS.find(
        (translation) => translation.id === settings.translation_edition,
      ) || TRANSLATIONS[0],
    [settings.translation_edition],
  );

  const selectedReciter = useMemo(
    () =>
      RECITERS_LIST.find(
        (reciter) => reciter.id === settings.default_reciter,
      ) || RECITERS_LIST[0],
    [settings.default_reciter],
  );

  const filteredReciters = useMemo(() => {
    const query = reciterSearch.trim().toLowerCase();
    if (!query) return RECITERS_LIST;

    return RECITERS_LIST.filter(
      (reciter) =>
        reciter.name.toLowerCase().includes(query) ||
        reciter.arabicName.includes(reciterSearch.trim()) ||
        reciter.description.toLowerCase().includes(query) ||
        reciter.bitrate.toLowerCase().includes(query),
    );
  }, [reciterSearch]);

  const selectedMethod = useMemo(
    () =>
      CALCULATION_METHODS.find(
        (method) => method.id === settings.calculation_method,
      ) || CALCULATION_METHODS[0],
    [settings.calculation_method],
  );

  useEffect(() => {
    setNotificationStatus(getPrayerNotificationStatus());
    setReminderSettings(getAdhkarReminderSettings());

    const handleReminderChange = () => {
      setReminderSettings(getAdhkarReminderSettings());
    };

    window.addEventListener(
      "noor-adhkar-reminders-changed",
      handleReminderChange,
    );
    return () =>
      window.removeEventListener(
        "noor-adhkar-reminders-changed",
        handleReminderChange,
      );
  }, []);

  const pageClasses = isLightMode
    ? "bg-slate-50 text-slate-900"
    : "bg-slate-900 text-white";
  const headerClasses = isLightMode
    ? "bg-slate-100/95 border-slate-200"
    : "bg-slate-900/95 border-slate-800";
  const cardClasses = isLightMode
    ? "bg-white border-slate-200 shadow-sm text-slate-900"
    : "bg-slate-800/60 border-slate-700/80 shadow-md text-white";
  const mutedText = isLightMode ? "text-slate-600" : "text-slate-400";
  const softPanel = isLightMode
    ? "bg-slate-50 border-slate-200"
    : "bg-slate-900/70 border-slate-700";
  const inputClasses = isLightMode
    ? "bg-white border-slate-300 text-slate-900 focus:ring-emerald-500"
    : "bg-slate-950 border-slate-700 text-white focus:ring-emerald-600";

  const showNotice = (message: string, type: Notice["type"] = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const updateSettings = (next: UserSettings, message = "Settings updated") => {
    onUpdateSettings(next);
    window.setTimeout(() => setStorageStats(estimateStorageUsage()), 50);
    showNotice(message);
  };

  const handleClearDownloadCache = async () => {
    getNoorStorageKeys()
      .filter((key) => key.startsWith("download_"))
      .forEach(safeLocalRemove);

    if ("caches" in window) {
      try {
        await caches.delete(AUDIO_CACHE_NAME);
      } catch {}
    }

    setStorageStats(estimateStorageUsage());
    showNotice("Offline audio cache cleared");
  };

  const handleClearQuranTextCache = () => {
    getNoorStorageKeys()
      .filter((key) => key.startsWith(QURAN_SURAH_CACHE_PREFIX))
      .forEach(safeLocalRemove);
    setStorageStats(estimateStorageUsage());
    showNotice("Offline Quran text cache cleared");
  };

  const handleResetSettings = () => {
    updateSettings(DEFAULT_SETTINGS, "Settings restored to default");
  };

  const copyShareText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotice(successMessage);
    } catch {
      showNotice("Could not copy on this browser", "warning");
    }
  };

  const handleShareApp = async () => {
    const shareText = `${NOORQURAN_INVITE_TEXT}\n\n${NOORQURAN_PUBLIC_URL}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "NoorQuran",
          text: NOORQURAN_INVITE_TEXT,
          url: NOORQURAN_PUBLIC_URL,
        });
        showNotice("Share sheet opened");
        return;
      }

      await navigator.clipboard.writeText(shareText);
      showNotice("Share message copied");
    } catch {
      showNotice("Share was cancelled or blocked", "warning");
    }
  };

  const handleCopyAppLink = () => {
    void copyShareText(NOORQURAN_PUBLIC_URL, "NoorQuran link copied");
  };

  const handleCopyInviteMessage = () => {
    void copyShareText(
      `${NOORQURAN_INVITE_TEXT}\n\n${NOORQURAN_PUBLIC_URL}`,
      "Invite message copied",
    );
  };

  const handleWhatsAppShare = () => {
    const text = `${NOORQURAN_INVITE_TEXT}\n\n${NOORQURAN_PUBLIC_URL}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    showNotice("WhatsApp share opened");
  };

  const handleTogglePrayerNotifications = async () => {
    if (settings.prayer_notifications) {
      updateSettings(
        { ...settings, prayer_notifications: false },
        "Prayer notifications turned off",
      );
      return;
    }

    const result = await requestPrayerNotificationPermission();
    setNotificationStatus(result.status);

    if (result.status === "granted") {
      updateSettings(
        { ...settings, prayer_notifications: true },
        result.message,
      );
      return;
    }

    updateSettings(
      { ...settings, prayer_notifications: false },
      result.message,
    );
  };

  const handleTestPrayerNotification = async () => {
    setNotificationTesting(true);
    try {
      const shown = await showPrayerNotificationTest();
      setNotificationStatus(getPrayerNotificationStatus());
      showNotice(
        shown
          ? "Test notification sent"
          : "Allow notifications first before testing",
        shown ? "success" : "warning",
      );
    } catch {
      showNotice(
        "Could not send the test notification on this browser",
        "warning",
      );
    } finally {
      setNotificationTesting(false);
    }
  };

  const saveReminderChanges = (
    nextSettings: NoorAdhkarReminderSettings,
    message = "Reminder schedule saved",
  ) => {
    setReminderSettings(nextSettings);
    saveAdhkarReminderSettings(nextSettings);
    showNotice(message);
  };

  const handleToggleAdhkarReminders = async () => {
    if (reminderSettings.enabled) {
      saveReminderChanges(
        { ...reminderSettings, enabled: false },
        "Adhkar reminders turned off",
      );
      return;
    }

    let status = getPrayerNotificationStatus();
    if (status !== "granted") {
      const result = await requestPrayerNotificationPermission();
      status = result.status;
      setNotificationStatus(status);

      if (status !== "granted") {
        showNotice(result.message, "warning");
        return;
      }
    }

    saveReminderChanges(
      { ...reminderSettings, enabled: true },
      "Adhkar reminders enabled",
    );
  };

  const updateReminderSlot = (
    slotId: ReminderSlotId,
    patch: Partial<NoorAdhkarReminderSettings[ReminderSlotId]>,
  ) => {
    saveReminderChanges({
      ...reminderSettings,
      [slotId]: {
        ...reminderSettings[slotId],
        ...patch,
      },
    });
  };

  const updateAfterPrayerReminder = (
    patch: Partial<NoorAdhkarReminderSettings["afterPrayer"]>,
  ) => {
    saveReminderChanges({
      ...reminderSettings,
      afterPrayer: {
        ...reminderSettings.afterPrayer,
        ...patch,
      },
    });
  };

  const handleTestAdhkarReminder = async () => {
    setReminderTesting(true);
    try {
      let status = getPrayerNotificationStatus();
      if (status !== "granted") {
        const result = await requestPrayerNotificationPermission();
        status = result.status;
        setNotificationStatus(status);
      }

      const shown = await showAdhkarReminderTest();
      showNotice(
        shown
          ? "Adhkar test reminder sent"
          : "Allow notifications before testing reminders",
        shown ? "success" : "warning",
      );
    } catch {
      showNotice("Could not send the adhkar test reminder", "warning");
    } finally {
      setReminderTesting(false);
    }
  };

  const handleResetReminderSchedule = () => {
    const defaults = resetAdhkarReminderSettings();
    setReminderSettings(defaults);
    showNotice("Reminder schedule restored to default");
  };

  const notificationInfo = (() => {
    if (notificationStatus === "unsupported") {
      return {
        tone: "warning" as const,
        title: "Notifications are not supported here",
        body: "This browser does not support web notifications. Try Chrome or Edge, preferably after installing the app.",
      };
    }

    if (notificationStatus === "denied") {
      return {
        tone: "warning" as const,
        title: "Notifications are blocked",
        body: "Open the browser site settings for NoorQuran and change Notifications to Allow, then return here and enable it again.",
      };
    }

    if (notificationStatus === "granted" && settings.prayer_notifications) {
      return {
        tone: "success" as const,
        title: "Notifications are ready",
        body: "NoorQuran has permission to show prayer notifications on this device. For best background reliability, install the app.",
      };
    }

    return {
      tone: "warning" as const,
      title: "Permission needed",
      body: "Turn on prayer notifications to ask your browser for permission.",
    };
  })();

  const handleExportBackup = () => {
    const data: Record<string, string | null> = {};
    getNoorStorageKeys().forEach((key) => {
      data[key] = safeLocalGet(key);
    });

    const backup = {
      app: "NoorQuran",
      exported_at: new Date().toISOString(),
      data,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `noorquran-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice("Backup file exported");
  };

  const handleImportBackup = async (file: File | undefined) => {
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        app?: string;
        data?: Record<string, unknown>;
      };

      if (parsed.app !== "NoorQuran" || !parsed.data) {
        showNotice("Invalid NoorQuran backup file", "warning");
        return;
      }

      Object.entries(parsed.data).forEach(([key, value]) => {
        if (
          (key.startsWith("noor_") || key.startsWith("download_")) &&
          typeof value === "string"
        ) {
          safeLocalSet(key, value);
        }
      });

      const importedSettingsRaw = safeLocalGet(STORAGE_KEYS.settings);
      if (importedSettingsRaw) {
        try {
          onUpdateSettings({
            ...DEFAULT_SETTINGS,
            ...JSON.parse(importedSettingsRaw),
          });
        } catch {}
      }

      setStorageStats(estimateStorageUsage());
      showNotice(
        "Backup imported successfully. Refresh if any screen still shows old data.",
      );
    } catch {
      showNotice(
        "Backup import failed. Please choose a valid NoorQuran backup file.",
        "warning",
      );
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleFactoryReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      showNotice("Tap reset again to confirm", "warning");
      window.setTimeout(() => setConfirmReset(false), 5000);
      return;
    }

    getNoorStorageKeys().forEach(safeLocalRemove);
    onUpdateSettings(DEFAULT_SETTINGS);
    setStorageStats(estimateStorageUsage());
    setConfirmReset(false);
    showNotice(
      "NoorQuran data cleared. Refresh the app for a clean start.",
    );
  };

  return (
    <div className={`max-w-lg mx-auto pb-32 min-h-screen ${pageClasses}`}>
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 ${headerClasses}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">
              App Settings
            </h1>
            <p className={`text-[11px] font-semibold ${mutedText}`}>
              Privacy, reading, audio, prayer, and app controls
            </p>
          </div>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl border ${softPanel}`}
          >
            Public
          </span>
        </div>
      </div>

      {notice && (
        <div className="fixed top-16 left-0 right-0 z-50 px-4 pointer-events-none">
          <div
            className={`max-w-lg mx-auto px-4 py-3 rounded-2xl border shadow-xl text-sm font-bold flex items-center gap-2 ${
              notice.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-amber-500 text-slate-950 border-amber-400"
            }`}
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{notice.message}</span>
          </div>
        </div>
      )}

      <div className="px-4 py-6 space-y-5">
        <section className="p-5 rounded-3xl border bg-gradient-to-br from-emerald-700 to-slate-950 text-white border-emerald-500/30 shadow-xl overflow-hidden relative">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-emerald-100 uppercase tracking-widest">
                  NoorQuran
                </p>
                <h2 className="text-xl font-extrabold leading-tight">
                  Quran • Salah • Adhkar • Qibla
                </h2>
              </div>
            </div>
            <p className="text-sm text-emerald-50/90 leading-relaxed">
              A clean Islamic companion for Quran reading, recitations, Salah times, Adhkar, Duas, Tasbih, Qibla, reminders, and offline reading.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-lg font-extrabold">{storageStats.keys}</p>
                <p className="text-[10px] text-emerald-100 uppercase font-bold">
                  Saved
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-lg font-extrabold">
                  {bytesToReadable(storageStats.bytes)}
                </p>
                <p className="text-[10px] text-emerald-100 uppercase font-bold">
                  Data
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-lg font-extrabold">
                  {storageStats.adhkarDays}
                </p>
                <p className="text-[10px] text-emerald-100 uppercase font-bold">
                  Adhkar Days
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            {isLightMode ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className="font-extrabold text-base">Appearance Theme</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            Choose the display mode that is easiest on your eyes.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["dark", "light"] as const).map((theme) => {
              const active = settings.theme === theme;
              return (
                <button
                  key={theme}
                  onClick={() =>
                    updateSettings(
                      { ...settings, theme },
                      `${theme === "dark" ? "Dark" : "Light"} mode enabled`,
                    )
                  }
                  className={`p-4 rounded-2xl border font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    active
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/30"
                      : `${softPanel} ${mutedText} hover:border-emerald-500/60`
                  }`}
                >
                  {theme === "dark" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </button>
              );
            })}
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Quran Reading</h3>
          </div>

          <div className={`p-3 rounded-2xl border ${softPanel}`}>
            <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              Translation
            </label>
            <select
              value={settings.translation_edition}
              onChange={(event) =>
                updateSettings(
                  { ...settings, translation_edition: event.target.value },
                  "Translation changed",
                )
              }
              className={`mt-2 w-full px-4 py-3 rounded-2xl text-sm font-semibold border focus:outline-none focus:ring-2 ${inputClasses}`}
            >
              {TRANSLATIONS.map((translation) => (
                <option key={translation.id} value={translation.id}>
                  {translation.name}
                </option>
              ))}
            </select>
            <p className={`mt-2 text-[11px] leading-relaxed ${mutedText}`}>
              {selectedTranslation.note}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FontControl
              label="Arabic font"
              value={settings.arabic_font_size}
              min={20}
              max={44}
              isLightMode={isLightMode}
              onChange={(value) =>
                updateSettings(
                  { ...settings, arabic_font_size: value },
                  "Arabic font updated",
                )
              }
            />
            <FontControl
              label="Translation font"
              value={settings.translation_font_size}
              min={12}
              max={24}
              isLightMode={isLightMode}
              onChange={(value) =>
                updateSettings(
                  { ...settings, translation_font_size: value },
                  "Translation font updated",
                )
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ToggleButton
              label="Show translation"
              enabled={settings.show_translation}
              isLightMode={isLightMode}
              onClick={() =>
                updateSettings({
                  ...settings,
                  show_translation: !settings.show_translation,
                })
              }
            />
            <ToggleButton
              label="Show transliteration"
              enabled={settings.show_transliteration}
              isLightMode={isLightMode}
              onClick={() =>
                updateSettings({
                  ...settings,
                  show_transliteration: !settings.show_transliteration,
                })
              }
            />
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Audio Reciter</h3>
          </div>
          <div
            className={`flex items-center gap-3 p-3 rounded-2xl border ${softPanel}`}
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-emerald-900 flex-shrink-0">
              <img
                src={selectedReciter.photoUrl}
                alt={selectedReciter.name}
                className="w-full h-full object-cover opacity-90"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold truncate">
                {selectedReciter.name}
              </p>
              <p className={`text-xs ${mutedText}`}>
                {selectedReciter.arabicName} • {selectedReciter.style} •{" "}
                {selectedReciter.bitrate}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${softPanel}`}>
            <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              Search default reciter
            </label>
            <div
              className={`mt-2 flex items-center gap-2 rounded-2xl border px-3 py-2 ${inputClasses}`}
            >
              <Search className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <input
                type="search"
                value={reciterSearch}
                onChange={(event) => setReciterSearch(event.target.value)}
                placeholder="Ali Jaber, Ayyub, Matroud, Sudais..."
                className="w-full bg-transparent outline-none text-sm font-semibold placeholder:text-slate-500"
              />
            </div>

            <div className="mt-3 max-h-80 overflow-y-auto no-scrollbar space-y-2 pr-1">
              {filteredReciters.length === 0 ? (
                <div
                  className={`rounded-2xl border p-4 text-center ${softPanel}`}
                >
                  <p className="text-sm font-extrabold">No reciter found</p>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Try another name or spelling.
                  </p>
                </div>
              ) : (
                filteredReciters.map((reciter) => {
                  const isSelected = reciter.id === settings.default_reciter;
                  return (
                    <button
                      key={reciter.id}
                      type="button"
                      onClick={() =>
                        updateSettings(
                          { ...settings, default_reciter: reciter.id },
                          `${reciter.name} set as default reciter`,
                        )
                      }
                      className={`w-full p-3 rounded-2xl border flex items-center gap-3 text-left transition-all active:scale-[0.99] ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/30"
                          : isLightMode
                            ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                            : "bg-slate-950 border-slate-700 text-white hover:bg-slate-900"
                      }`}
                    >
                      <img
                        src={reciter.photoUrl}
                        alt={reciter.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold truncate">
                          {reciter.name}
                        </p>
                        <p
                          className={`text-[11px] truncate ${isSelected ? "text-emerald-50/90" : mutedText}`}
                        >
                          {reciter.arabicName} • {reciter.style} •{" "}
                          {reciter.bitrate}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <p className={`mt-2 text-[11px] ${mutedText}`}>
              Showing {filteredReciters.length} of {RECITERS_LIST.length}{" "}
              reciters.
            </p>
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Prayer Settings</h3>
          </div>
          <div className={`p-3 rounded-2xl border ${softPanel}`}>
            <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              Calculation Method
            </label>
            <select
              value={settings.calculation_method}
              onChange={(event) =>
                updateSettings(
                  {
                    ...settings,
                    calculation_method: Number(event.target.value),
                  },
                  "Prayer method changed",
                )
              }
              className={`mt-2 w-full px-4 py-3 rounded-2xl text-sm font-semibold border focus:outline-none focus:ring-2 ${inputClasses}`}
            >
              {CALCULATION_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
            <p className={`mt-2 text-[11px] leading-relaxed ${mutedText}`}>
              Active: {selectedMethod.name}
            </p>
          </div>
          <ToggleButton
            label="Prayer notifications"
            enabled={
              settings.prayer_notifications && notificationStatus === "granted"
            }
            isLightMode={isLightMode}
            onClick={handleTogglePrayerNotifications}
          />
          <div
            className={`flex items-start gap-2 text-xs leading-relaxed rounded-2xl border p-3 ${
              notificationInfo.tone === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-200"
            }`}
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-extrabold">{notificationInfo.title}</p>
              <p>{notificationInfo.body}</p>
              {notificationStatus === "granted" &&
                settings.prayer_notifications && (
                  <button
                    type="button"
                    onClick={handleTestPrayerNotification}
                    disabled={notificationTesting}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-extrabold active:scale-95 disabled:opacity-60"
                  >
                    {notificationTesting
                      ? "Sending..."
                      : "Send test notification"}
                  </button>
                )}
            </div>
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-base">
                Adhkar Reminder Schedule
              </h3>
            </div>
            <span
              className={`rounded-xl px-3 py-1 text-[11px] font-black ${
                reminderSettings.enabled
                  ? "bg-emerald-600 text-white"
                  : isLightMode
                    ? "bg-slate-100 text-slate-500"
                    : "bg-slate-800 text-slate-400"
              }`}
            >
              {reminderSettings.enabled ? "Active" : "Off"}
            </span>
          </div>

          <p className={`text-xs leading-relaxed ${mutedText}`}>
            Schedule reminders for morning adhkar, evening adhkar, before sleep,
            Friday Al-Kahf, and optional after-prayer adhkar reminders. Browser
            reminders work best when the app is installed or recently opened.
          </p>

          <ToggleButton
            label="Enable adhkar reminders"
            enabled={
              reminderSettings.enabled && notificationStatus === "granted"
            }
            isLightMode={isLightMode}
            onClick={handleToggleAdhkarReminders}
          />

          <div className="space-y-3">
            {[
              {
                id: "morning" as ReminderSlotId,
                label: "Morning Adhkar",
                note: "Recommended after Fajr until sunrise",
              },
              {
                id: "evening" as ReminderSlotId,
                label: "Evening Adhkar",
                note: "Recommended after Asr until Maghrib",
              },
              {
                id: "sleep" as ReminderSlotId,
                label: "Before Sleep",
                note: "A quiet reminder before bedtime",
              },
              {
                id: "fridayKahf" as ReminderSlotId,
                label: "Friday Al-Kahf",
                note: "Only rings on Fridays",
              },
            ].map((slot) => (
              <div
                key={slot.id}
                className={`rounded-2xl border p-3 ${softPanel}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">{slot.label}</p>
                    <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                      {slot.note}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateReminderSlot(slot.id, {
                        enabled: !reminderSettings[slot.id].enabled,
                      })
                    }
                    className={`rounded-xl px-3 py-2 text-[11px] font-black active:scale-95 ${
                      reminderSettings[slot.id].enabled
                        ? "bg-emerald-600 text-white"
                        : isLightMode
                          ? "bg-white text-slate-500 border border-slate-200"
                          : "bg-slate-900 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {reminderSettings[slot.id].enabled ? "On" : "Off"}
                  </button>
                </div>
                <input
                  type="time"
                  value={reminderSettings[slot.id].time}
                  onChange={(event) =>
                    updateReminderSlot(slot.id, { time: event.target.value })
                  }
                  disabled={!reminderSettings[slot.id].enabled}
                  className={`mt-3 w-full px-4 py-3 rounded-2xl text-sm font-extrabold border focus:outline-none focus:ring-2 disabled:opacity-50 ${inputClasses}`}
                />
              </div>
            ))}
          </div>

          <div className={`rounded-2xl border p-3 ${softPanel}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold">After-prayer adhkar</p>
                <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                  Uses your saved Salah city and calculation method, then
                  reminds after Fajr, Dhuhr, Asr, Maghrib, and Isha.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateAfterPrayerReminder({
                    enabled: !reminderSettings.afterPrayer.enabled,
                  })
                }
                className={`rounded-xl px-3 py-2 text-[11px] font-black active:scale-95 ${
                  reminderSettings.afterPrayer.enabled
                    ? "bg-emerald-600 text-white"
                    : isLightMode
                      ? "bg-white text-slate-500 border border-slate-200"
                      : "bg-slate-900 text-slate-400 border border-slate-700"
                }`}
              >
                {reminderSettings.afterPrayer.enabled ? "On" : "Off"}
              </button>
            </div>
            <label className="mt-3 block text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
              Reminder delay after prayer
            </label>
            <select
              value={reminderSettings.afterPrayer.delayMinutes}
              onChange={(event) =>
                updateAfterPrayerReminder({
                  delayMinutes: Number(event.target.value),
                })
              }
              disabled={!reminderSettings.afterPrayer.enabled}
              className={`mt-2 w-full px-4 py-3 rounded-2xl text-sm font-semibold border focus:outline-none focus:ring-2 disabled:opacity-50 ${inputClasses}`}
            >
              {[5, 10, 15, 20, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes after prayer
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleTestAdhkarReminder}
              disabled={reminderTesting}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white active:scale-95 disabled:opacity-60"
            >
              {reminderTesting ? "Sending..." : "Send test adhkar reminder"}
            </button>
            <button
              type="button"
              onClick={handleResetReminderSchedule}
              className={`rounded-2xl border px-4 py-3 text-xs font-extrabold active:scale-95 ${softPanel} ${mutedText}`}
            >
              Reset reminder times
            </button>
          </div>

          <div
            className={`rounded-2xl border p-3 text-xs leading-relaxed ${
              isLightMode
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-amber-800/40 bg-amber-950/20 text-amber-200"
            }`}
          >
            For full background reliability, install NoorQuran as an app and
            keep browser notifications allowed. Web browsers may pause reminders
            when the site has been fully closed for a long time.
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">My Data Backup</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            Save or restore your personal NoorQuran settings, bookmarks, notes, and progress. This is optional and does not require an account.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportBackup}
              className="p-3 rounded-2xl border border-emerald-500/40 bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <Download className="w-4 h-4" /> Export Backup
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className={`p-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 ${softPanel}`}
            >
              <Upload className="w-4 h-4" /> Import Backup
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => handleImportBackup(event.target.files?.[0])}
          />
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h3 className="font-extrabold text-base">Saved Offline Data</h3>
          </div>
          <div
            className={`grid grid-cols-3 gap-3 text-center text-xs ${mutedText}`}
          >
            <div className={`p-3 rounded-2xl border ${softPanel}`}>
              <p className="text-lg font-extrabold text-emerald-500">
                {storageStats.downloads}
              </p>
              <p className="font-bold">Audio ayahs</p>
            </div>
            <div className={`p-3 rounded-2xl border ${softPanel}`}>
              <p className="text-lg font-extrabold text-emerald-500">
                {storageStats.cachedSurahs}
              </p>
              <p className="font-bold">Cached Surahs</p>
            </div>
            <div className={`p-3 rounded-2xl border ${softPanel}`}>
              <p className="text-lg font-extrabold text-emerald-500">
                {bytesToReadable(storageStats.bytes)}
              </p>
              <p className="font-bold">Saved data</p>
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            Quran Surahs are cached automatically after you open them. Audio is
            cached only when you tap the save icon in the audio player.
          </p>
          <button
            onClick={handleClearDownloadCache}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${softPanel}`}
          >
            <Trash2 className="w-4 h-4 text-red-400" /> Clear Saved Audio
          </button>
          <button
            onClick={handleClearQuranTextCache}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${softPanel}`}
          >
            <Trash2 className="w-4 h-4 text-red-400" /> Clear Saved Quran Text
          </button>
          <button
            onClick={handleResetSettings}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${softPanel}`}
          >
            <RotateCcw className="w-4 h-4 text-amber-500" /> Restore Default Settings
          </button>
          <button
            onClick={handleFactoryReset}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${
              confirmReset
                ? "bg-red-600 border-red-500 text-white"
                : "bg-red-500/10 border-red-500/30 text-red-500"
            }`}
          >
            <Trash2 className="w-4 h-4" />{" "}
            {confirmReset
              ? "Confirm Reset"
              : "Reset All App Data"}
          </button>
        </section>


        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base">Brand & Public Release</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            NoorQuran is ready for public visitors with a clean app identity, reliable install experience, and professional sharing information.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl border p-3 ${softPanel}`}>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
                App name
              </p>
              <p className="mt-1 text-sm font-extrabold">NoorQuran</p>
              <p className={`mt-1 text-[11px] leading-relaxed ${mutedText}`}>
                Quran, Salah, Adhkar, Tasbih and Qibla in one app.
              </p>
            </div>
            <div className={`rounded-2xl border p-3 ${softPanel}`}>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
                Release tone
              </p>
              <p className="mt-1 text-sm font-extrabold">Private by default</p>
              <p className={`mt-1 text-[11px] leading-relaxed ${mutedText}`}>
                No account required, local-first storage, and clear source notes.
              </p>
            </div>
          </div>
          <div className={`rounded-2xl border p-4 ${softPanel}`}>
            <p className="text-sm font-extrabold">Public description</p>
            <p className={`mt-1 text-xs leading-relaxed ${mutedText}`}>
              NoorQuran is a free Islamic companion app for Quran reading,
              audio recitations, Salah times, Adhkar, Duas, Tasbih, Qibla,
              reminders, and offline reading.
            </p>
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Share & Growth</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            Share NoorQuran with family, friends, students, WhatsApp groups,
            and masjid communities without adding adverts or unnecessary
            tracking.
          </p>

          <div className={`rounded-2xl border p-4 ${softPanel}`}>
            <p className="text-sm font-extrabold">App link</p>
            <p className={`mt-1 break-all text-xs font-semibold ${mutedText}`}>
              {NOORQURAN_PUBLIC_URL}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleShareApp}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow"
            >
              <Share2 className="w-4 h-4" /> Share App
            </button>
            <button
              onClick={handleCopyAppLink}
              className={`py-3 px-4 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${softPanel}`}
            >
              <LinkIcon className="w-4 h-4 text-emerald-500" /> Copy Link
            </button>
            <button
              onClick={handleCopyInviteMessage}
              className={`py-3 px-4 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${softPanel}`}
            >
              <Copy className="w-4 h-4 text-emerald-500" /> Copy Invite
            </button>
            <button
              onClick={handleWhatsAppShare}
              className={`py-3 px-4 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${softPanel}`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp
            </button>
          </div>

          <div className={`rounded-2xl border p-4 ${softPanel}`}>
            <p className="text-sm font-extrabold">Invite message preview</p>
            <p className={`mt-2 text-xs leading-relaxed ${mutedText}`}>
              {NOORQURAN_INVITE_TEXT}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {SHARE_HIGHLIGHTS.map((item) => (
              <div key={item} className={`flex items-center gap-2 rounded-2xl border p-3 ${softPanel}`}>
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-bold leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Trust, Sources & Review</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            NoorQuran keeps source and review notes clear so public visitors understand how to use the app responsibly.
          </p>

          <div className="space-y-2">
            {SOURCE_GROUPS.map((source) => (
              <div key={source.title} className={`rounded-2xl border p-3 ${softPanel}`}>
                <p className="text-sm font-extrabold text-emerald-500">
                  {source.title}
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${mutedText}`}>
                  {source.body}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-extrabold text-amber-600 dark:text-amber-300">
                  Scholarly review recommended
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-700 dark:text-amber-100/90">
                  This app is a helpful Islamic companion, but it should not be
                  presented as an official fatwa, official masjid timetable, or
                  final scholarly reference. Always verify religious content
                  with qualified people.
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${softPanel}`}>
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              Quality Review
            </p>
            <div className="mt-3 space-y-2">
              {REVIEW_CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-bold">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Privacy Policy Summary</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            NoorQuran is designed to be private by default and usable without
            account signup.
          </p>
          <div className="space-y-2">
            {PRIVACY_POINTS.map((point) => (
              <div key={point} className={`flex gap-2 rounded-2xl border p-3 ${softPanel}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`p-5 rounded-3xl border space-y-4 ${cardClasses}`}>
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Support & Feedback</h3>
          </div>
          <p className={`text-xs leading-relaxed ${mutedText}`}>
            Use this section to guide corrections and feedback from public visitors.
          </p>
          <div className={`rounded-2xl border p-4 ${softPanel}`}>
            <p className="text-sm font-extrabold">Report a correction</p>
            <p className={`mt-1 text-xs leading-relaxed ${mutedText}`}>
              If you notice a mistake in Arabic text, translation, source label,
              audio, prayer time, or app behavior, record the page name, Surah or
              dua name, device type, and screenshot before reporting it to the
              support team.
            </p>
          </div>
          <div className={`rounded-2xl border p-4 ${softPanel}`}>
            <p className="text-sm font-extrabold">Data removal</p>
            <p className={`mt-1 text-xs leading-relaxed ${mutedText}`}>
              You can remove local app data anytime from Storage Management by
              clearing offline caches or using Reset All App Data.
            </p>
          </div>
        </section>

        <section className="text-center py-6 space-y-3 border-t border-slate-800/80">
          <div className="inline-flex items-center gap-2 text-amber-500 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-extrabold shadow">
            <Sparkles className="w-4 h-4" /> Sadaqah Jariyah Project
          </div>
          <p
            className={`text-xs max-w-xs mx-auto leading-relaxed ${mutedText}`}
          >
            NoorQuran is a clean Islamic companion with no ads, no
            paywalls, and no unnecessary tracking. Made with{" "}
            <Heart className="w-3.5 h-3.5 inline text-red-500 fill-current" />{" "}
            for beneficial use.
          </p>
        </section>
      </div>
    </div>
  );
}

function FontControl({
  label,
  value,
  min,
  max,
  isLightMode,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  isLightMode: boolean;
  onChange: (value: number) => void;
}) {
  const panelClasses = isLightMode
    ? "bg-slate-50 border-slate-200"
    : "bg-slate-900/70 border-slate-700";

  return (
    <div className={`p-3 rounded-2xl border ${panelClasses}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
          {label}
        </span>
        <span className="text-xs font-extrabold">{value}px</span>
      </div>
      <div className="flex items-center gap-2">
        <Sliders className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-emerald-600"
        />
      </div>
    </div>
  );
}

function ToggleButton({
  label,
  enabled,
  isLightMode,
  onClick,
}: {
  label: string;
  enabled: boolean;
  isLightMode: boolean;
  onClick: () => void;
}) {
  const textColor = isLightMode ? "text-slate-800" : "text-white";
  const mutedText = isLightMode ? "text-slate-500" : "text-slate-400";

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-95 ${
        enabled
          ? "bg-emerald-600 border-emerald-500 text-white"
          : isLightMode
            ? "bg-slate-50 border-slate-200"
            : "bg-slate-900/70 border-slate-700"
      }`}
    >
      <span
        className={`text-xs font-extrabold text-left ${enabled ? "text-white" : textColor}`}
      >
        {label}
      </span>
      <span
        className={`w-12 h-7 rounded-full p-1 flex items-center transition-all ${enabled ? "bg-white/20 justify-end" : "bg-slate-700 justify-start"}`}
      >
        <span className="w-5 h-5 bg-white rounded-full shadow" />
      </span>
      <span className="sr-only">{enabled ? "Enabled" : "Disabled"}</span>
      {!enabled && <span className={`hidden ${mutedText}`}>Off</span>}
    </button>
  );
}
