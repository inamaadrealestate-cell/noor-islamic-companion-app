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
  Database,
  Sliders,
  Smartphone,
} from "lucide-react";
import {
  DEFAULT_SETTINGS,
  UserSettings,
  getDeviceId,
} from "../../lib/supabase";
import { RECITERS_LIST } from "../../lib/audioData";
import {
  getPrayerNotificationStatus,
  requestPrayerNotificationPermission,
  showPrayerNotificationTest,
  type NoorNotificationStatus,
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
  device: "noor_device_id",
  prayerLocation: "noor_prayer_location",
  qiblaLocation: "noor_qibla_location",
};

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
  const [reciterSearch, setReciterSearch] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const deviceId = getDeviceId();

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

  const handleClearDownloadCache = () => {
    getNoorStorageKeys()
      .filter((key) => key.startsWith("download_"))
      .forEach(safeLocalRemove);
    setStorageStats(estimateStorageUsage());
    showNotice("Audio download cache flags cleared");
  };

  const handleResetSettings = () => {
    updateSettings(DEFAULT_SETTINGS, "Settings restored to default");
  };

  const handleCopyDeviceId = async () => {
    try {
      await navigator.clipboard.writeText(deviceId);
      showNotice("Anonymous device ID copied");
    } catch {
      showNotice("Could not copy device ID on this browser", "warning");
    }
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
        body: "The service worker is active and NoorQuran has permission to show prayer notifications on this device. For best background reliability, install the app.",
      };
    }

    return {
      tone: "warning" as const,
      title: "Permission needed",
      body: "Turn on prayer notifications to ask your browser for permission. The service worker is already included in the app.",
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
        "Backup import failed. Please choose a valid JSON backup.",
        "warning",
      );
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleFactoryReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      showNotice("Tap factory reset again to confirm", "warning");
      window.setTimeout(() => setConfirmReset(false), 5000);
      return;
    }

    getNoorStorageKeys().forEach(safeLocalRemove);
    onUpdateSettings(DEFAULT_SETTINGS);
    setStorageStats(estimateStorageUsage());
    setConfirmReset(false);
    showNotice(
      "Local NoorQuran data cleared. Refresh the app for a clean start.",
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
              Privacy, reading, audio, prayer, and device backup
            </p>
          </div>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl border ${softPanel}`}
          >
            v1.1
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
                  Complete Islamic Companion
                </h2>
              </div>
            </div>
            <p className="text-sm text-emerald-50/90 leading-relaxed">
              Your settings are saved on this device first. Supabase sync can
              work later when real environment keys and tables are configured.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-lg font-extrabold">{storageStats.keys}</p>
                <p className="text-[10px] text-emerald-100 uppercase font-bold">
                  Items
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-3">
                <p className="text-lg font-extrabold">
                  {bytesToReadable(storageStats.bytes)}
                </p>
                <p className="text-[10px] text-emerald-100 uppercase font-bold">
                  Storage
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
                {selectedReciter.arabicName} • {selectedReciter.style} • {selectedReciter.bitrate}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${softPanel}`}>
            <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
              Search default reciter
            </label>
            <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-3 py-2 ${inputClasses}`}>
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
                <div className={`rounded-2xl border p-4 text-center ${softPanel}`}>
                  <p className="text-sm font-extrabold">No reciter found</p>
                  <p className={`text-xs mt-1 ${mutedText}`}>Try another name or spelling.</p>
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
                        <p className="text-sm font-extrabold truncate">{reciter.name}</p>
                        <p className={`text-[11px] truncate ${isSelected ? "text-emerald-50/90" : mutedText}`}>
                          {reciter.arabicName} • {reciter.style} • {reciter.bitrate}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <p className={`mt-2 text-[11px] ${mutedText}`}>
              Showing {filteredReciters.length} of {RECITERS_LIST.length} reciters.
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
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-base">Backup & Device Data</h3>
          </div>
          <div className={`p-3 rounded-2xl border ${softPanel}`}>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                Anonymous Device ID
              </span>
            </div>
            <div className="flex items-center gap-2">
              <code
                className={`min-w-0 flex-1 truncate text-[11px] px-3 py-2 rounded-xl border ${softPanel}`}
              >
                {deviceId}
              </code>
              <button
                onClick={handleCopyDeviceId}
                className="p-2 rounded-xl bg-emerald-600 text-white active:scale-95"
                title="Copy device ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

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
            <h3 className="font-extrabold text-base">Storage Management</h3>
          </div>
          <div
            className={`grid grid-cols-2 gap-3 text-center text-xs ${mutedText}`}
          >
            <div className={`p-3 rounded-2xl border ${softPanel}`}>
              <p className="text-lg font-extrabold text-emerald-500">
                {storageStats.downloads}
              </p>
              <p className="font-bold">Download flags</p>
            </div>
            <div className={`p-3 rounded-2xl border ${softPanel}`}>
              <p className="text-lg font-extrabold text-emerald-500">
                {bytesToReadable(storageStats.bytes)}
              </p>
              <p className="font-bold">Estimated usage</p>
            </div>
          </div>
          <button
            onClick={handleClearDownloadCache}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${softPanel}`}
          >
            <Trash2 className="w-4 h-4 text-red-400" /> Clear Audio Cache Flags
          </button>
          <button
            onClick={handleResetSettings}
            className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${softPanel}`}
          >
            <RotateCcw className="w-4 h-4 text-amber-500" /> Restore Default
            Settings Only
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
              ? "Confirm Factory Reset"
              : "Factory Reset Local App Data"}
          </button>
        </section>

        <section className="p-6 bg-emerald-950/40 border border-emerald-800/50 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">
              Private by Default
            </h3>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
            NoorQuran does not need an account for reading, adhkar, prayer
            times, qibla, bookmarks, or settings. Data stays local unless you
            configure cloud sync.
          </p>
        </section>

        <section className="text-center py-6 space-y-3 border-t border-slate-800/80">
          <div className="inline-flex items-center gap-2 text-amber-500 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-extrabold shadow">
            <Sparkles className="w-4 h-4" /> Sadaqah Jariyah Project
          </div>
          <p
            className={`text-xs max-w-xs mx-auto leading-relaxed ${mutedText}`}
          >
            Built to serve the Ummah with no ads, no paywalls, and no
            unnecessary tracking. Made with{" "}
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
