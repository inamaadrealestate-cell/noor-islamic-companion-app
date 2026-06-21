type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type NoorNotificationStatus =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export type ReminderSlotId = "morning" | "evening" | "sleep" | "fridayKahf";

export interface ReminderSlot {
  enabled: boolean;
  time: string;
}

export interface AfterPrayerReminderSettings {
  enabled: boolean;
  delayMinutes: number;
}

export interface NoorAdhkarReminderSettings {
  enabled: boolean;
  morning: ReminderSlot;
  evening: ReminderSlot;
  sleep: ReminderSlot;
  fridayKahf: ReminderSlot;
  afterPrayer: AfterPrayerReminderSettings;
}

interface PrayerLocationCache {
  lat: number;
  lng: number;
  label: string;
  source?: string;
}

interface PrayerTimingsCache {
  dateKey: string;
  locationKey: string;
  method: number;
  timings: Record<string, string>;
}

const SERVICE_WORKER_PATH = "/sw.js";
const REMINDER_STORAGE_KEY = "noor_adhkar_reminder_settings";
const REMINDER_FIRED_KEY = "noor_adhkar_reminders_fired";
const PRAYER_LOCATION_STORAGE_KEY = "noor_prayer_location";
const PRAYER_TIMINGS_CACHE_KEY = "noor_prayer_timings_cache";

export const DEFAULT_ADHKAR_REMINDER_SETTINGS: NoorAdhkarReminderSettings = {
  enabled: false,
  morning: { enabled: true, time: "06:00" },
  evening: { enabled: true, time: "18:00" },
  sleep: { enabled: false, time: "22:00" },
  fridayKahf: { enabled: false, time: "09:00" },
  afterPrayer: { enabled: false, delayMinutes: 10 },
};

const DEFAULT_PRAYER_LOCATION: PrayerLocationCache = {
  lat: 21.4225,
  lng: 39.8262,
  label: "Makkah, Saudi Arabia",
  source: "default",
};

let serviceWorkerReloading = false;
let reminderIntervalId: number | null = null;
let reminderTickInProgress = false;

declare global {
  interface Window {
    noorDeferredInstallPrompt?: BeforeInstallPromptEvent;
    noorPromptInstall?: () => Promise<void>;
    noorApplyUpdate?: () => Promise<void>;
  }
}

function isStandaloneMode(): boolean {
  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
  return standaloneMedia || navigatorStandalone;
}

function dispatchUpdateAvailable(): void {
  window.dispatchEvent(new Event("noor-update-available"));
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeTime(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!/^\d{2}:\d{2}$/.test(value)) return fallback;
  return value;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeDelay(value: unknown): number {
  const numberValue = Number(value);
  if ([5, 10, 15, 20, 30, 45, 60].includes(numberValue)) return numberValue;
  return DEFAULT_ADHKAR_REMINDER_SETTINGS.afterPrayer.delayMinutes;
}

export function getAdhkarReminderSettings(): NoorAdhkarReminderSettings {
  const parsed = safeParse<Partial<NoorAdhkarReminderSettings>>(
    safeGet(REMINDER_STORAGE_KEY),
    {},
  );

  return {
    enabled: normalizeBoolean(parsed.enabled, DEFAULT_ADHKAR_REMINDER_SETTINGS.enabled),
    morning: {
      enabled: normalizeBoolean(
        parsed.morning?.enabled,
        DEFAULT_ADHKAR_REMINDER_SETTINGS.morning.enabled,
      ),
      time: normalizeTime(parsed.morning?.time, DEFAULT_ADHKAR_REMINDER_SETTINGS.morning.time),
    },
    evening: {
      enabled: normalizeBoolean(
        parsed.evening?.enabled,
        DEFAULT_ADHKAR_REMINDER_SETTINGS.evening.enabled,
      ),
      time: normalizeTime(parsed.evening?.time, DEFAULT_ADHKAR_REMINDER_SETTINGS.evening.time),
    },
    sleep: {
      enabled: normalizeBoolean(parsed.sleep?.enabled, DEFAULT_ADHKAR_REMINDER_SETTINGS.sleep.enabled),
      time: normalizeTime(parsed.sleep?.time, DEFAULT_ADHKAR_REMINDER_SETTINGS.sleep.time),
    },
    fridayKahf: {
      enabled: normalizeBoolean(
        parsed.fridayKahf?.enabled,
        DEFAULT_ADHKAR_REMINDER_SETTINGS.fridayKahf.enabled,
      ),
      time: normalizeTime(
        parsed.fridayKahf?.time,
        DEFAULT_ADHKAR_REMINDER_SETTINGS.fridayKahf.time,
      ),
    },
    afterPrayer: {
      enabled: normalizeBoolean(
        parsed.afterPrayer?.enabled,
        DEFAULT_ADHKAR_REMINDER_SETTINGS.afterPrayer.enabled,
      ),
      delayMinutes: normalizeDelay(parsed.afterPrayer?.delayMinutes),
    },
  };
}

export function saveAdhkarReminderSettings(settings: NoorAdhkarReminderSettings): void {
  safeSet(REMINDER_STORAGE_KEY, JSON.stringify(settings));
  restartNoorReminderScheduler();
  window.dispatchEvent(new CustomEvent("noor-adhkar-reminders-changed", { detail: settings }));
}

export function resetAdhkarReminderSettings(): NoorAdhkarReminderSettings {
  saveAdhkarReminderSettings(DEFAULT_ADHKAR_REMINDER_SETTINGS);
  return DEFAULT_ADHKAR_REMINDER_SETTINGS;
}

export function getPrayerNotificationStatus(): NoorNotificationStatus {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NoorNotificationStatus;
}

export async function registerNoorServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);

    if (registration.waiting && navigator.serviceWorker.controller) {
      dispatchUpdateAvailable();
    }

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          dispatchUpdateAvailable();
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (serviceWorkerReloading) return;
      serviceWorkerReloading = true;
      window.location.reload();
    });

    registration.update().catch(() => undefined);
    return registration;
  } catch {
    return null;
  }
}

export async function requestPrayerNotificationPermission(): Promise<{
  status: NoorNotificationStatus;
  serviceWorkerReady: boolean;
  message: string;
}> {
  if (!("Notification" in window)) {
    return {
      status: "unsupported",
      serviceWorkerReady: false,
      message: "This browser does not support web notifications.",
    };
  }

  const registration = await registerNoorServiceWorker();
  const permission = await Notification.requestPermission();
  const status = permission as NoorNotificationStatus;

  if (status === "granted") {
    startNoorReminderScheduler();
    return {
      status,
      serviceWorkerReady: Boolean(registration),
      message: registration
        ? "Notifications enabled. NoorQuran can now show reminders on this device."
        : "Notification permission granted, but the service worker is not ready yet. Refresh once and try again.",
    };
  }

  if (status === "denied") {
    return {
      status,
      serviceWorkerReady: Boolean(registration),
      message:
        "Notifications are blocked. Open this site's browser settings and allow notifications for NoorQuran.",
    };
  }

  return {
    status,
    serviceWorkerReady: Boolean(registration),
    message: "Notification permission was not granted yet.",
  };
}

async function showNoorNotification(options: {
  title: string;
  body: string;
  tag: string;
  url?: string;
}): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const registration = await registerNoorServiceWorker();
  const payload: NotificationOptions = {
    body: options.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: options.tag,
    data: { url: options.url || "/" },
  };

  if (registration?.showNotification) {
    await registration.showNotification(options.title, payload);
    return true;
  }

  new Notification(options.title, payload);
  return true;
}

export async function showPrayerNotificationTest(): Promise<boolean> {
  return showNoorNotification({
    title: "NoorQuran notifications are ready",
    body: "Prayer and adhkar reminder notifications are enabled on this device.",
    tag: "noorquran-notification-test",
    url: "/",
  });
}

export async function showAdhkarReminderTest(): Promise<boolean> {
  return showNoorNotification({
    title: "Time for remembrance",
    body: "This is how your NoorQuran adhkar reminders will appear.",
    tag: "noorquran-adhkar-reminder-test",
    url: "/?tab=adhkar",
  });
}

function getTodayKey(date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function getMinuteKey(date = new Date()): string {
  return `${getTodayKey(date)}-${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function cleanTimingValue(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\d{1,2}:\d{2}/);
  return match ? match[0].padStart(5, "0") : null;
}

function timePlusMinutes(time: string, minutesToAdd: number): string | null {
  const clean = cleanTimingValue(time);
  if (!clean) return null;
  const [hours, minutes] = clean.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const total = hours * 60 + minutes + minutesToAdd;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function readFiredReminderKeys(): string[] {
  return safeParse<string[]>(safeGet(REMINDER_FIRED_KEY), []);
}

function hasReminderFired(key: string): boolean {
  return readFiredReminderKeys().includes(key);
}

function markReminderFired(key: string): void {
  const todayPrefix = getTodayKey();
  const existing = readFiredReminderKeys().filter((item) => item.startsWith(todayPrefix));
  if (!existing.includes(key)) existing.push(key);
  safeSet(REMINDER_FIRED_KEY, JSON.stringify(existing));
}

async function fireReminderOnce(options: {
  reminderId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  const key = `${getMinuteKey()}-${options.reminderId}`;
  if (hasReminderFired(key)) return;

  const shown = await showNoorNotification({
    title: options.title,
    body: options.body,
    tag: `noorquran-${options.reminderId}`,
    url: options.url || "/?tab=adhkar",
  });

  if (shown) markReminderFired(key);
}

function readPrayerLocation(): PrayerLocationCache {
  const parsed = safeParse<PrayerLocationCache | null>(safeGet(PRAYER_LOCATION_STORAGE_KEY), null);
  if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
    return parsed;
  }
  return DEFAULT_PRAYER_LOCATION;
}

function readCalculationMethod(): number {
  const parsed = safeParse<{ calculation_method?: number }>(safeGet("noor_settings"), {});
  return Number(parsed.calculation_method || 4);
}

function getPrayerLocationKey(location: PrayerLocationCache): string {
  return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;
}

async function getTodayPrayerTimings(): Promise<Record<string, string> | null> {
  const location = readPrayerLocation();
  const method = readCalculationMethod();
  const dateKey = getTodayKey();
  const locationKey = getPrayerLocationKey(location);
  const cached = safeParse<PrayerTimingsCache | null>(safeGet(PRAYER_TIMINGS_CACHE_KEY), null);

  if (
    cached &&
    cached.dateKey === dateKey &&
    cached.locationKey === locationKey &&
    cached.method === method &&
    cached.timings
  ) {
    return cached.timings;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lng),
      method: String(method),
    });
    const response = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?${params.toString()}`);
    if (!response.ok) return null;
    const json = await response.json();
    const timings = json?.data?.timings as Record<string, string> | undefined;
    if (!timings) return null;

    const cleaned: Record<string, string> = {};
    ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].forEach((name) => {
      const clean = cleanTimingValue(timings[name]);
      if (clean) cleaned[name] = clean;
    });

    safeSet(
      PRAYER_TIMINGS_CACHE_KEY,
      JSON.stringify({ dateKey, locationKey, method, timings: cleaned } satisfies PrayerTimingsCache),
    );
    return cleaned;
  } catch {
    return null;
  }
}

async function checkFixedTimeReminders(settings: NoorAdhkarReminderSettings, currentTime: string, now: Date): Promise<void> {
  const reminderCopy: Record<ReminderSlotId, { label: string; title: string; body: string; url: string }> = {
    morning: {
      label: "Morning Adhkar",
      title: "Morning Adhkar",
      body: "Start your day with protection, gratitude, and remembrance of Allah.",
      url: "/?tab=adhkar",
    },
    evening: {
      label: "Evening Adhkar",
      title: "Evening Adhkar",
      body: "Complete your evening remembrance and protection adhkar.",
      url: "/?tab=adhkar",
    },
    sleep: {
      label: "Before Sleep Adhkar",
      title: "Before Sleep Adhkar",
      body: "Read your sleep adhkar before resting for the night.",
      url: "/?tab=adhkar",
    },
    fridayKahf: {
      label: "Surah Al-Kahf Reminder",
      title: "Friday Reminder",
      body: "Read Surah Al-Kahf and increase salawat today.",
      url: "/?tab=quran",
    },
  };

  const slotIds: ReminderSlotId[] = ["morning", "evening", "sleep", "fridayKahf"];
  for (const slotId of slotIds) {
    const slot = settings[slotId];
    if (!slot.enabled || slot.time !== currentTime) continue;
    if (slotId === "fridayKahf" && now.getDay() !== 5) continue;

    await fireReminderOnce({
      reminderId: slotId,
      title: reminderCopy[slotId].title,
      body: reminderCopy[slotId].body,
      url: reminderCopy[slotId].url,
    });
  }
}

async function checkAfterPrayerReminders(settings: NoorAdhkarReminderSettings, currentTime: string): Promise<void> {
  if (!settings.afterPrayer.enabled) return;

  const timings = await getTodayPrayerTimings();
  if (!timings) return;

  const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  for (const prayerName of prayerNames) {
    const dueTime = timePlusMinutes(timings[prayerName], settings.afterPrayer.delayMinutes);
    if (dueTime !== currentTime) continue;

    await fireReminderOnce({
      reminderId: `after-${prayerName.toLowerCase()}`,
      title: `After ${prayerName} Adhkar`,
      body: `Complete your after-${prayerName} remembrance while it is fresh.`,
      url: "/?tab=adhkar",
    });
  }
}

async function runReminderTick(): Promise<void> {
  if (reminderTickInProgress) return;
  reminderTickInProgress = true;

  try {
    const settings = getAdhkarReminderSettings();
    if (!settings.enabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    await checkFixedTimeReminders(settings, currentTime, now);
    await checkAfterPrayerReminders(settings, currentTime);
  } finally {
    reminderTickInProgress = false;
  }
}

export function startNoorReminderScheduler(): void {
  if (reminderIntervalId !== null) return;

  runReminderTick().catch(() => undefined);
  reminderIntervalId = window.setInterval(() => {
    runReminderTick().catch(() => undefined);
  }, 30 * 1000);
}

export function stopNoorReminderScheduler(): void {
  if (reminderIntervalId === null) return;
  window.clearInterval(reminderIntervalId);
  reminderIntervalId = null;
}

export function restartNoorReminderScheduler(): void {
  stopNoorReminderScheduler();
  startNoorReminderScheduler();
}

function setupInstallPrompt(): void {
  if (isStandaloneMode()) return;

  window.addEventListener("beforeinstallprompt", (rawEvent) => {
    rawEvent.preventDefault();
    window.noorDeferredInstallPrompt = rawEvent as BeforeInstallPromptEvent;
  });

  window.noorPromptInstall = async () => {
    const event = window.noorDeferredInstallPrompt;
    if (!event) return;

    window.noorDeferredInstallPrompt = undefined;
    await event.prompt();
    await event.userChoice.catch(() => undefined);
  };

  window.addEventListener("appinstalled", () => {
    window.noorDeferredInstallPrompt = undefined;
  });
}

window.noorApplyUpdate = async () => {
  const registration = await navigator.serviceWorker?.getRegistration(SERVICE_WORKER_PATH);
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return;
  }
  window.location.reload();
};

window.addEventListener("load", () => {
  registerNoorServiceWorker().catch(() => undefined);
  startNoorReminderScheduler();
});

window.addEventListener("storage", (event) => {
  if (event.key === REMINDER_STORAGE_KEY || event.key === "noor_settings" || event.key === PRAYER_LOCATION_STORAGE_KEY) {
    restartNoorReminderScheduler();
  }
});

setupInstallPrompt();
