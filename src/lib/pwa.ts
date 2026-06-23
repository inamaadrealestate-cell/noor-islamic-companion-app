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

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function hasNavigator(): boolean {
  return typeof navigator !== "undefined";
}

const REMINDER_STORAGE_KEY = "noor_adhkar_reminder_settings";
const REMINDER_FIRED_KEY = "noor_adhkar_reminders_fired";
const PRAYER_LOCATION_STORAGE_KEY = "noor_prayer_location";
const PRAYER_TIMINGS_CACHE_KEY = "noor_prayer_timings_cache";
const AYYAMUL_BID_ENABLED_KEY = "noor_ayyamul_bid_reminders_enabled";
const AYYAMUL_BID_FIRED_KEY = "noor_ayyamul_bid_reminders_fired";
const TASUA_ASHURA_ENABLED_KEY = "noor_tasua_ashura_reminders_enabled";
const TASUA_ASHURA_FIRED_KEY = "noor_tasua_ashura_reminders_fired";

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
let serviceWorkerControllerListenerAttached = false;
let reminderIntervalId: number | null = null;
let reminderTickInProgress = false;

declare global {
  interface Window {
    noorDeferredInstallPrompt?: BeforeInstallPromptEvent;
    noorPromptInstall?: () => Promise<boolean>;
    noorApplyUpdate?: () => Promise<void>;
  }
}

function safeDisplayModeMatches(mode: "standalone" | "fullscreen"): boolean {
  if (!hasWindow() || typeof window.matchMedia !== "function") return false;

  try {
    return Boolean(window.matchMedia(`(display-mode: ${mode})`).matches);
  } catch {
    return false;
  }
}

function isStandaloneMode(): boolean {
  if (!hasWindow()) return false;

  let navigatorStandalone = false;
  try {
    navigatorStandalone = Boolean(
      (window.navigator as Navigator & { standalone?: boolean }).standalone,
    );
  } catch {
    navigatorStandalone = false;
  }

  return safeDisplayModeMatches("standalone") || safeDisplayModeMatches("fullscreen") || navigatorStandalone;
}

function safeDispatchEvent(eventName: string, detail?: unknown): void {
  if (!hasWindow()) return;

  try {
    if (typeof detail === "undefined") {
      window.dispatchEvent(new Event(eventName));
      return;
    }

    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    return;
  } catch {}

  try {
    const event = document.createEvent("Event");
    event.initEvent(eventName, false, false);
    window.dispatchEvent(event);
  } catch {}
}

function dispatchUpdateAvailable(): void {
  safeDispatchEvent("noor-update-available");
}

function safeGet(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T | null | undefined;
    return parsed === null || typeof parsed === "undefined" ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}


const ISLAMIC_MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhul Qadah",
  "Dhul Hijjah",
];

interface IslamicDateParts {
  day: number;
  month: number;
  year: number;
}

export interface AyyamulBidReminderInfo {
  islamicDay: number;
  islamicMonth: number;
  islamicYear: number;
  monthName: string;
  isAyyamulBidDay: boolean;
  isPreparationDay: boolean;
  label: string;
}

export interface TasuaAshuraReminderInfo {
  islamicDay: number;
  islamicMonth: number;
  islamicYear: number;
  monthName: string;
  isMuharram: boolean;
  isTasuaDay: boolean;
  isAshuraDay: boolean;
  isTasuaPreparationDay: boolean;
  isAshuraPreparationDay: boolean;
  label: string;
}

function parseIslamicDateWithCalendar(calendar: string, date: Date): IslamicDateParts | null {
  if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") return null;

  try {
    const parts = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}-nu-latn`, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      numberingSystem: "latn",
    }).formatToParts(date);

    const day = Number(parts.find((part) => part.type === "day")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    const year = Number(parts.find((part) => part.type === "year")?.value);

    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
    if (day < 1 || day > 30 || month < 1 || month > 12) return null;

    return { day, month, year };
  } catch {
    return null;
  }
}

function getIslamicDateParts(date = new Date()): IslamicDateParts | null {
  return (
    parseIslamicDateWithCalendar("islamic-umalqura", date) ||
    parseIslamicDateWithCalendar("islamic", date) ||
    parseIslamicDateWithCalendar("islamic-civil", date)
  );
}

function getIslamicMonthName(month: number): string {
  return ISLAMIC_MONTH_NAMES[month - 1] || `Islamic month ${month}`;
}

function localMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function hasReachedLocalTime(date: Date, time: string): boolean {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
  return localMinutes(date) >= hours * 60 + minutes;
}

export function getAyyamulBidReminderEnabled(): boolean {
  return safeGet(AYYAMUL_BID_ENABLED_KEY) !== "false";
}

export function saveAyyamulBidReminderEnabled(enabled: boolean): void {
  safeSet(AYYAMUL_BID_ENABLED_KEY, enabled ? "true" : "false");
  safeDispatchEvent("noor-ayyamul-bid-reminders-changed", { enabled });
  restartNoorReminderScheduler();
}

export function getCurrentAyyamulBidInfo(date = new Date()): AyyamulBidReminderInfo | null {
  const islamicDate = getIslamicDateParts(date);
  if (!islamicDate) return null;

  const monthName = getIslamicMonthName(islamicDate.month);
  const isAyyamulBidDay = [13, 14, 15].includes(islamicDate.day);
  const isPreparationDay = [12, 13, 14].includes(islamicDate.day);

  return {
    islamicDay: islamicDate.day,
    islamicMonth: islamicDate.month,
    islamicYear: islamicDate.year,
    monthName,
    isAyyamulBidDay,
    isPreparationDay,
    label: `${islamicDate.day} ${monthName} ${islamicDate.year} AH`,
  };
}

export function getTasuaAshuraReminderEnabled(): boolean {
  return safeGet(TASUA_ASHURA_ENABLED_KEY) !== "false";
}

export function saveTasuaAshuraReminderEnabled(enabled: boolean): void {
  safeSet(TASUA_ASHURA_ENABLED_KEY, enabled ? "true" : "false");
  safeDispatchEvent("noor-tasua-ashura-reminders-changed", { enabled });
  restartNoorReminderScheduler();
}

export function getCurrentTasuaAshuraInfo(date = new Date()): TasuaAshuraReminderInfo | null {
  const islamicDate = getIslamicDateParts(date);
  if (!islamicDate) return null;

  const monthName = getIslamicMonthName(islamicDate.month);
  const isMuharram = islamicDate.month === 1;

  return {
    islamicDay: islamicDate.day,
    islamicMonth: islamicDate.month,
    islamicYear: islamicDate.year,
    monthName,
    isMuharram,
    isTasuaDay: isMuharram && islamicDate.day === 9,
    isAshuraDay: isMuharram && islamicDate.day === 10,
    isTasuaPreparationDay: isMuharram && islamicDate.day === 8,
    isAshuraPreparationDay: isMuharram && islamicDate.day === 9,
    label: `${islamicDate.day} ${monthName} ${islamicDate.year} AH`,
  };
}

function readTasuaAshuraFiredKeys(): string[] {
  return asStringArray(safeParse<unknown>(safeGet(TASUA_ASHURA_FIRED_KEY), []));
}

function hasTasuaAshuraReminderFired(key: string): boolean {
  return readTasuaAshuraFiredKeys().includes(key);
}

function markTasuaAshuraReminderFired(key: string): void {
  const current = readTasuaAshuraFiredKeys();
  const [datePrefix] = key.split(":");
  const [yearPrefix] = datePrefix.split("-");
  const cleaned = current.filter((item) => item.startsWith(`${yearPrefix}-`)).slice(-30);

  if (!cleaned.includes(key)) cleaned.push(key);
  safeSet(TASUA_ASHURA_FIRED_KEY, JSON.stringify(cleaned));
}

async function checkTasuaAshuraReminders(now: Date): Promise<void> {
  if (!getTasuaAshuraReminderEnabled()) return;

  const info = getCurrentTasuaAshuraInfo(now);
  if (!info || !info.isMuharram) return;

  const datePrefix = `${info.islamicYear}-${info.islamicMonth}-${info.islamicDay}`;

  if (info.isTasuaDay && hasReachedLocalTime(now, "03:30")) {
    const key = `${datePrefix}:tasua-day`;
    if (!hasTasuaAshuraReminderFired(key)) {
      const shown = await showNoorNotification({
        title: "Fast Tasu'a today",
        body: "Today is 9 Muharram, the day of Tasu'a. Fast today if you are able and prepare for Ashura tomorrow. Please confirm local moon-sighting if needed.",
        tag: `noorquran-tasua-day-${info.islamicYear}`,
        url: "/?tab=adhkar",
      });
      if (shown) markTasuaAshuraReminderFired(key);
    }
  }

  if (info.isAshuraDay && hasReachedLocalTime(now, "03:30")) {
    const key = `${datePrefix}:ashura-day`;
    if (!hasTasuaAshuraReminderFired(key)) {
      const shown = await showNoorNotification({
        title: "Fast Ashura today",
        body: "Today is 10 Muharram, the day of Ashura. Fast today if you are able. Please confirm local moon-sighting if needed.",
        tag: `noorquran-ashura-day-${info.islamicYear}`,
        url: "/?tab=adhkar",
      });
      if (shown) markTasuaAshuraReminderFired(key);
    }
  }

  if (info.isTasuaPreparationDay && hasReachedLocalTime(now, "18:00")) {
    const key = `${datePrefix}:tasua-night-before`;
    if (!hasTasuaAshuraReminderFired(key)) {
      const shown = await showNoorNotification({
        title: "Tasu'a fasting reminder",
        body: "Tomorrow is 9 Muharram, the day of Tasu'a. Prepare to fast if you are able. Please confirm local moon-sighting if needed.",
        tag: `noorquran-tasua-night-${info.islamicYear}`,
        url: "/?tab=adhkar",
      });
      if (shown) markTasuaAshuraReminderFired(key);
    }
  }

  if (info.isAshuraPreparationDay && hasReachedLocalTime(now, "18:00")) {
    const key = `${datePrefix}:ashura-night-before`;
    if (!hasTasuaAshuraReminderFired(key)) {
      const shown = await showNoorNotification({
        title: "Ashura fasting reminder",
        body: "Tomorrow is 10 Muharram, the day of Ashura. Prepare to fast if you are able. Please confirm local moon-sighting if needed.",
        tag: `noorquran-ashura-night-${info.islamicYear}`,
        url: "/?tab=adhkar",
      });
      if (shown) markTasuaAshuraReminderFired(key);
    }
  }
}

function readAyyamulBidFiredKeys(): string[] {
  return asStringArray(safeParse<unknown>(safeGet(AYYAMUL_BID_FIRED_KEY), []));
}

function hasAyyamulBidReminderFired(key: string): boolean {
  return readAyyamulBidFiredKeys().includes(key);
}

function markAyyamulBidReminderFired(key: string): void {
  const current = readAyyamulBidFiredKeys();
  const [datePrefix] = key.split(":");
  const [year, month] = datePrefix.split("-");
  const monthPrefix = `${year}-${month}-`;
  const cleaned = current.filter((item) => item.startsWith(monthPrefix)).slice(-40);

  if (!cleaned.includes(key)) cleaned.push(key);
  safeSet(AYYAMUL_BID_FIRED_KEY, JSON.stringify(cleaned));
}

async function checkAyyamulBidReminders(now: Date): Promise<void> {
  if (!getAyyamulBidReminderEnabled()) return;

  const info = getCurrentAyyamulBidInfo(now);
  if (!info) return;

  const datePrefix = `${info.islamicYear}-${info.islamicMonth}-${info.islamicDay}`;

  if (info.isAyyamulBidDay && hasReachedLocalTime(now, "03:30")) {
    const key = `${datePrefix}:ayyamul-bid-day-${info.islamicDay}`;
    if (!hasAyyamulBidReminderFired(key)) {
      const shown = await showNoorNotification({
        title: "Fast Ayyamul Bid today",
        body: `Today is ${info.label}, one of the white days. Fast today if you are able. Please confirm local moon-sighting if needed.`,
        tag: `noorquran-ayyamul-bid-day-${info.islamicYear}-${info.islamicMonth}-${info.islamicDay}`,
        url: "/?tab=adhkar",
      });
      if (shown) markAyyamulBidReminderFired(key);
    }
  }

  if (info.isPreparationDay && hasReachedLocalTime(now, "18:00")) {
    const nextDay = info.islamicDay + 1;
    const key = `${datePrefix}:ayyamul-bid-night-before-${nextDay}`;
    if (!hasAyyamulBidReminderFired(key)) {
      const shown = await showNoorNotification({
        title: "Ayyamul Bid fasting reminder",
        body: `Tomorrow is the ${nextDay}th day of ${info.monthName}. Prepare to fast if you are able. Please confirm local moon-sighting if needed.`,
        tag: `noorquran-ayyamul-bid-night-${info.islamicYear}-${info.islamicMonth}-${nextDay}`,
        url: "/?tab=adhkar",
      });
      if (shown) markAyyamulBidReminderFired(key);
    }
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
  const parsedRaw = safeParse<unknown>(safeGet(REMINDER_STORAGE_KEY), {});
  const parsed = isRecord(parsedRaw) ? (parsedRaw as Partial<NoorAdhkarReminderSettings>) : {};

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
  safeDispatchEvent("noor-adhkar-reminders-changed", settings);
}

export function resetAdhkarReminderSettings(): NoorAdhkarReminderSettings {
  saveAdhkarReminderSettings(DEFAULT_ADHKAR_REMINDER_SETTINGS);
  return DEFAULT_ADHKAR_REMINDER_SETTINGS;
}

export function getPrayerNotificationStatus(): NoorNotificationStatus {
  if (!hasWindow() || !("Notification" in window)) return "unsupported";
  return Notification.permission as NoorNotificationStatus;
}

export async function registerNoorServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!hasNavigator() || !("serviceWorker" in navigator)) return null;

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

    if (!serviceWorkerControllerListenerAttached) {
      serviceWorkerControllerListenerAttached = true;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (serviceWorkerReloading) return;
        serviceWorkerReloading = true;
        try {
          window.location.reload();
        } catch {
          // If reload is blocked by the browser, keep the current app session alive.
        }
      });
    }

    registration.update().catch(() => undefined);
    return registration;
  } catch {
    return null;
  }
}

async function requestNotificationPermissionCompat(): Promise<NoorNotificationStatus> {
  if (!hasWindow() || !("Notification" in window)) return "unsupported";

  try {
    const requestPermission = Notification.requestPermission.bind(Notification) as (
      callback?: (permission: NotificationPermission) => void,
    ) => Promise<NotificationPermission> | void;

    const permission = await new Promise<NotificationPermission>((resolve) => {
      let settled = false;
      const finish = (nextPermission: NotificationPermission) => {
        if (settled) return;
        settled = true;
        resolve(nextPermission);
      };

      const timeoutId = window.setTimeout(() => finish(Notification.permission), 7000);
      const finishAndClear = (nextPermission: NotificationPermission) => {
        window.clearTimeout(timeoutId);
        finish(nextPermission);
      };

      const maybePromise = requestPermission((callbackPermission) => finishAndClear(callbackPermission));
      if (maybePromise && typeof (maybePromise as Promise<NotificationPermission>).then === "function") {
        (maybePromise as Promise<NotificationPermission>)
          .then(finishAndClear)
          .catch(() => finishAndClear(Notification.permission));
      }
    });

    return permission as NoorNotificationStatus;
  } catch {
    return Notification.permission as NoorNotificationStatus;
  }
}

export async function requestPrayerNotificationPermission(): Promise<{
  status: NoorNotificationStatus;
  serviceWorkerReady: boolean;
  message: string;
}> {
  if (!hasWindow() || !("Notification" in window)) {
    return {
      status: "unsupported",
      serviceWorkerReady: false,
      message: "This browser does not support web notifications.",
    };
  }

  const registration = await registerNoorServiceWorker();
  const status = await requestNotificationPermissionCompat();

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
  if (!hasWindow() || !("Notification" in window) || Notification.permission !== "granted") return false;

  const registration = await registerNoorServiceWorker();
  const payload: NotificationOptions = {
    body: options.body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: options.tag,
    data: { url: options.url || "/" },
  };

  try {
    if (registration && typeof registration.showNotification === "function") {
      await registration.showNotification(options.title, payload);
      return true;
    }
  } catch {}

  try {
    new Notification(options.title, payload);
    return true;
  } catch {
    return false;
  }
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  return asStringArray(safeParse<unknown>(safeGet(REMINDER_FIRED_KEY), []));
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
  const parsed = safeParse<unknown>(safeGet("noor_settings"), {});
  if (!isRecord(parsed)) return 4;

  const method = Number(parsed.calculation_method || 4);
  return Number.isFinite(method) && method > 0 ? method : 4;
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
    if (!hasWindow() || !("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    await checkTasuaAshuraReminders(now);
    await checkAyyamulBidReminders(now);

    const settings = getAdhkarReminderSettings();
    if (!settings.enabled) return;

    await checkFixedTimeReminders(settings, currentTime, now);
    await checkAfterPrayerReminders(settings, currentTime);
  } finally {
    reminderTickInProgress = false;
  }
}

export function startNoorReminderScheduler(): void {
  if (!hasWindow() || reminderIntervalId !== null) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

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
  if (!hasWindow() || isStandaloneMode()) return;

  window.addEventListener("beforeinstallprompt", (rawEvent) => {
    rawEvent.preventDefault();
    window.noorDeferredInstallPrompt = rawEvent as BeforeInstallPromptEvent;
    safeDispatchEvent("noor-install-ready");
  });

  window.noorPromptInstall = async () => {
    const event = window.noorDeferredInstallPrompt;
    if (!event) return false;

    try {
      await event.prompt();
      const choice = await event.userChoice.catch(() => null);
      window.noorDeferredInstallPrompt = undefined;
      return choice?.outcome === "accepted" || isStandaloneMode();
    } catch {
      window.noorDeferredInstallPrompt = undefined;
      return false;
    }
  };

  window.addEventListener("appinstalled", () => {
    window.noorDeferredInstallPrompt = undefined;
  });
}

if (hasWindow()) {
  window.noorApplyUpdate = async () => {
    let registration: ServiceWorkerRegistration | null = null;

    try {
      registration = hasNavigator() && "serviceWorker" in navigator
        ? (await navigator.serviceWorker.getRegistration()) || null
        : null;
    } catch {
      registration = null;
    }

    if (registration?.waiting) {
      try {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        return;
      } catch {
        // If update activation is blocked, fall through to a normal reload.
      }
    }

    try {
      window.location.reload();
    } catch {
      // Keep the current session alive if a restricted browser blocks reload.
    }
  };

  const startNoorPwaRuntime = () => {
    registerNoorServiceWorker().catch(() => undefined);
    startNoorReminderScheduler();
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    window.setTimeout(startNoorPwaRuntime, 0);
  } else {
    window.addEventListener("load", startNoorPwaRuntime, { once: true });
  }

  window.addEventListener("storage", (event) => {
    if (
      event.key === REMINDER_STORAGE_KEY ||
      event.key === AYYAMUL_BID_ENABLED_KEY ||
      event.key === TASUA_ASHURA_ENABLED_KEY ||
      event.key === "noor_settings" ||
      event.key === PRAYER_LOCATION_STORAGE_KEY
    ) {
      restartNoorReminderScheduler();
    }
  });

  window.addEventListener("noor-ayyamul-bid-reminders-changed", () => {
    restartNoorReminderScheduler();
  });

  window.addEventListener("noor-tasua-ashura-reminders-changed", () => {
    restartNoorReminderScheduler();
  });

  setupInstallPrompt();
}
