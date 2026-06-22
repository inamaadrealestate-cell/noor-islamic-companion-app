import { Component, ReactNode, useEffect, useState } from "react";
import { Download } from "lucide-react";
import Navigation from "./components/Navigation";
import AudioPlayer from "./components/AudioPlayer";
import HomeScreen from "./components/home/HomeScreen";
import QuranScreen from "./components/quran/QuranScreen";
import AdhkarScreen from "./components/adhkar/AdhkarScreen";
import QiblaCompass from "./components/qibla/QiblaCompass";
import PrayerScreen from "./components/prayer/PrayerScreen";
import SettingsScreen from "./components/settings/SettingsScreen";
import TasbihScreen from "./components/tasbih/TasbihScreen";
import { Storage, UserSettings } from "./lib/storage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type AppTab = "home" | "quran" | "prayer" | "adhkar" | "tasbih" | "qibla" | "settings";

const VALID_TABS: AppTab[] = ["home", "quran", "prayer", "adhkar", "tasbih", "qibla", "settings"];
const LAST_TAB_KEY = "noor_active_tab";

function safeLocalGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function safeLocalRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

function safeMatchMedia(query: string): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
}

function onMediaQueryChange(queryList: MediaQueryList | null, callback: () => void): () => void {
  if (!queryList) return () => {};

  const modernList = queryList as MediaQueryList & {
    addEventListener?: (type: "change", listener: () => void) => void;
    removeEventListener?: (type: "change", listener: () => void) => void;
    addListener?: (listener: () => void) => void;
    removeListener?: (listener: () => void) => void;
  };

  if (typeof modernList.addEventListener === "function") {
    modernList.addEventListener("change", callback);
    return () => modernList.removeEventListener?.("change", callback);
  }

  if (typeof modernList.addListener === "function") {
    modernList.addListener(callback);
    return () => modernList.removeListener?.(callback);
  }

  return () => {};
}

function isValidTab(tab: string | null): tab is AppTab {
  return Boolean(tab && VALID_TABS.includes(tab as AppTab));
}

function getInitialTab(): AppTab {
  const savedTab = safeLocalGet(LAST_TAB_KEY);
  return isValidTab(savedTab) ? savedTab : "home";
}

function getInitialOnlineState(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function isRunningAsInstalledApp(): boolean {
  if (typeof window === "undefined") return false;

  const standaloneDisplay = safeMatchMedia("(display-mode: standalone)")?.matches ?? false;
  const fullscreenDisplay = safeMatchMedia("(display-mode: fullscreen)")?.matches ?? false;
  const iosStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );

  return standaloneDisplay || fullscreenDisplay || iosStandalone;
}

function isLikelyIos(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = Number(navigator.maxTouchPoints || 0);

  return /iphone|ipad|ipod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

function isSamsungLikeBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /SamsungBrowser|SAMSUNG|Samsung/i.test(userAgent) ||
    /SM-[A-Z0-9]+/i.test(userAgent) ||
    /Samsung/i.test(platform)
  );
}

declare global {
  interface Window {
    noorDeferredInstallPrompt?: BeforeInstallPromptEvent;
    noorPromptInstall?: () => Promise<boolean>;
    noorApplyUpdate?: () => Promise<void>;
  }
}

interface AppErrorBoundaryProps {
  children: ReactNode;
  isLightMode: boolean;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "An unexpected app error occurred.",
    };
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetView = () => {
    safeLocalRemove(LAST_TAB_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isLightMode = this.props.isLightMode;

    return (
      <div
        className={`min-h-screen flex items-center justify-center px-5 py-10 ${
          isLightMode ? "bg-slate-50 text-slate-900" : "bg-slate-950 text-white"
        }`}
      >
        <div
          className={`max-w-md w-full rounded-[2rem] border p-6 text-center shadow-xl ${
            isLightMode ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}
        >
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Something needs a refresh</h1>
          <p className={`mt-3 text-sm leading-relaxed ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
            NoorQuran protected your session. Refresh the app, or reset the current view if it keeps happening.
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={this.handleReload}
              type="button"
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white active:scale-95 transition-all hover:bg-emerald-500"
            >
              Refresh app
            </button>
            <button
              onClick={this.handleResetView}
              type="button"
              className={`rounded-2xl border px-4 py-3 text-sm font-extrabold active:scale-95 transition-all ${
                isLightMode
                  ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              Reset view
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<AppTab>(getInitialTab);
  const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
  const [isOnline, setIsOnline] = useState<boolean>(getInitialOnlineState);
  const [showOnlineRestored, setShowOnlineRestored] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [showInstallButton, setShowInstallButton] = useState<boolean>(false);
  const [installHint, setInstallHint] = useState<string>("");
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [isInstallPromptRunning, setIsInstallPromptRunning] = useState<boolean>(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSurah, setCurrentSurah] = useState<number>(1);
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [reciterId, setReciterId] = useState<string>(settings.default_reciter || "ar.alafasy");

  const isLightMode = settings.theme === "light";

  useEffect(() => {
    const baseThemeClass = isLightMode
      ? "bg-slate-50 text-slate-800"
      : "bg-slate-900 text-white";

    document.body.className = baseThemeClass;

    if (isSamsungLikeBrowser()) {
      document.body.classList.add("noor-samsung-scroll-safe");
    }

    document.documentElement.style.colorScheme = isLightMode ? "light" : "dark";

    // Keep document scrolling stable on normal browsers. Samsung Internet gets
    // an extra CSS-only root scroll container below because body scrolling with
    // fixed blurred controls can crash or freeze on some devices.
    document.documentElement.style.height = "auto";
    document.documentElement.style.minHeight = "100%";
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.overflowY = "auto";

    document.body.style.height = "auto";
    const supportsSmallViewport =
      typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("height", "100svh");

    document.body.style.minHeight = supportsSmallViewport ? "100svh" : "100vh";
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "auto";
    document.body.style.touchAction = "pan-y pinch-zoom";
    (document.body.style as CSSStyleDeclaration & { webkitOverflowScrolling?: string }).webkitOverflowScrolling = "touch";
  }, [isLightMode]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // Samsung Internet can crash when a page does DOM class changes on every
    // touchmove/scroll while fixed controls are visible. Avoid scroll listeners
    // completely on Samsung and let the CSS reduce animations there.
    if (isSamsungLikeBrowser()) return undefined;

    let scrollTimer: number | undefined;

    const markScrolling = () => {
      document.body.classList.add("noor-user-scrolling");
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        document.body.classList.remove("noor-user-scrolling");
        scrollTimer = undefined;
      }, 180);
    };

    window.addEventListener("scroll", markScrolling, { passive: true });

    return () => {
      window.removeEventListener("scroll", markScrolling);
      if (scrollTimer) window.clearTimeout(scrollTimer);
      document.body.classList.remove("noor-user-scrolling");
    };
  }, []);

  useEffect(() => {
    safeLocalSet(LAST_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineRestored(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineRestored(true);
      window.setTimeout(() => setShowOnlineRestored(false), 3500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const handleUpdateAvailable = () => setUpdateAvailable(true);
    window.addEventListener("noor-update-available", handleUpdateAvailable);
    return () => window.removeEventListener("noor-update-available", handleUpdateAvailable);
  }, []);

  useEffect(() => {
    const updateInstallButtonVisibility = () => {
      setShowInstallButton(!isRunningAsInstalledApp());
    };

    const rememberInstallPrompt = (installEvent: BeforeInstallPromptEvent | undefined) => {
      if (!installEvent) return;
      window.noorDeferredInstallPrompt = installEvent;
      setDeferredInstallPrompt(installEvent);
      setShowInstallButton(!isRunningAsInstalledApp());
      setShowInstallGuide(false);
      setInstallHint("");
    };

    const handleInstallPromptReady = (event: Event) => {
      event.preventDefault();
      rememberInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleStoredInstallPromptReady = () => {
      rememberInstallPrompt(window.noorDeferredInstallPrompt);
    };

    const handleAppInstalled = () => {
      window.noorDeferredInstallPrompt = undefined;
      setDeferredInstallPrompt(null);
      setShowInstallButton(false);
      setShowInstallGuide(false);
      setInstallHint("");
      setIsInstallPromptRunning(false);
    };

    updateInstallButtonVisibility();
    rememberInstallPrompt(window.noorDeferredInstallPrompt);

    const unsubscribeStandalone = onMediaQueryChange(
      safeMatchMedia("(display-mode: standalone)"),
      updateInstallButtonVisibility,
    );
    const unsubscribeFullscreen = onMediaQueryChange(
      safeMatchMedia("(display-mode: fullscreen)"),
      updateInstallButtonVisibility,
    );

    window.addEventListener("beforeinstallprompt", handleInstallPromptReady);
    window.addEventListener("noor-install-ready", handleStoredInstallPromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pageshow", updateInstallButtonVisibility);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPromptReady);
      window.removeEventListener("noor-install-ready", handleStoredInstallPromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pageshow", updateInstallButtonVisibility);
      unsubscribeStandalone();
      unsubscribeFullscreen();
    };
  }, []);

  const setActiveTab = (tab: string) => {
    if (isValidTab(tab)) {
      setActiveTabState(tab);
      // Instant scroll avoids Samsung Internet crashes linked to smooth scrolling
      // while fixed PWA controls are mounted.
      window.scrollTo(0, 0);
    }
  };

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
    if (newSettings.default_reciter !== reciterId) {
      setReciterId(newSettings.default_reciter);
    }
  };

  const handleContinueReading = (surah: number, ayah: number) => {
    setCurrentSurah(surah);
    setCurrentAyah(ayah);
    setActiveTab("quran");
  };

  const handlePlayVerse = (surah: number, ayah: number) => {
    setCurrentSurah(surah);
    setCurrentAyah(ayah);
    setIsPlaying(true);
  };

  const handleApplyUpdate = async () => {
    if (window.noorApplyUpdate) {
      await window.noorApplyUpdate();
      return;
    }
    window.location.reload();
  };

  const handleInstallApp = async () => {
    if (isInstallPromptRunning) return;

    setInstallHint("");

    if (isRunningAsInstalledApp()) {
      setShowInstallButton(false);
      setShowInstallGuide(false);
      return;
    }

    const installEvent = deferredInstallPrompt || window.noorDeferredInstallPrompt || null;

    if (installEvent) {
      setIsInstallPromptRunning(true);
      const fallbackTimer = window.setTimeout(() => {
        setIsInstallPromptRunning(false);
        setInstallHint("");
      }, 9000);

      try {
        setShowInstallGuide(false);
        setInstallHint("Opening install...");
        await installEvent.prompt();
        const choice = await installEvent.userChoice.catch(() => null);

        window.noorDeferredInstallPrompt = undefined;
        setDeferredInstallPrompt(null);

        if (choice?.outcome === "accepted" || isRunningAsInstalledApp()) {
          setShowInstallButton(false);
          setShowInstallGuide(false);
          setInstallHint("");
          return;
        }

        setInstallHint("Install cancelled");
        setShowInstallGuide(true);
        window.setTimeout(() => setInstallHint(""), 3000);
        return;
      } catch {
        window.noorDeferredInstallPrompt = undefined;
        setDeferredInstallPrompt(null);
      } finally {
        window.clearTimeout(fallbackTimer);
        setIsInstallPromptRunning(false);
      }
    }

    if (typeof window.noorPromptInstall === "function") {
      setIsInstallPromptRunning(true);
      const fallbackTimer = window.setTimeout(() => {
        setIsInstallPromptRunning(false);
        setInstallHint("");
      }, 9000);

      try {
        setShowInstallGuide(false);
        setInstallHint("Opening install...");
        const opened = await window.noorPromptInstall();

        if (opened || isRunningAsInstalledApp()) {
          setShowInstallButton(false);
          setShowInstallGuide(false);
          setInstallHint("");
          return;
        }
      } catch {
        // Fall through to same-page install instructions.
      } finally {
        window.clearTimeout(fallbackTimer);
        setIsInstallPromptRunning(false);
      }
    }

    // Browsers do not allow websites to silently install a PWA. If the native
    // beforeinstallprompt event is unavailable, there is no safe direct install
    // API, so keep the user on the same page and show the browser install steps.
    setInstallHint(isLikelyIos() ? "Use Share, then Add to Home Screen" : "Tap menu, then Install app");
    setShowInstallGuide(true);
    window.setTimeout(() => setInstallHint(""), 4200);
  };

  return (
    <AppErrorBoundary isLightMode={isLightMode}>
      <div
        className={`noor-scroll-root min-h-screen min-h-[100svh] w-full overflow-x-hidden transition-colors duration-200 ${
          isLightMode ? "bg-slate-50 text-slate-800" : "bg-slate-900 text-white"
        }`}
      >
        {!isOnline && (
          <div className="fixed top-3 left-0 right-0 z-[60] px-4 pointer-events-none">
            <div
              className={`max-w-lg mx-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md text-xs font-extrabold flex items-center justify-between gap-3 ${
                isLightMode
                  ? "border-amber-300 bg-amber-50/95 text-amber-900"
                  : "border-amber-500/30 bg-amber-500/15 text-amber-200"
              }`}
            >
              <span>Offline mode. Cached Quran, notes, bookmarks, and saved data can still work.</span>
              <span className="flex-shrink-0">Offline</span>
            </div>
          </div>
        )}

        {showOnlineRestored && (
          <div className="fixed top-3 left-0 right-0 z-[60] px-4 pointer-events-none">
            <div className="max-w-lg mx-auto rounded-2xl border border-emerald-500/30 bg-emerald-600/90 text-white px-4 py-3 shadow-xl backdrop-blur-md text-xs font-extrabold">
              Back online. NoorQuran can load fresh content again.
            </div>
          </div>
        )}

        {updateAvailable && (
          <div className="fixed top-3 left-0 right-0 z-[70] px-4">
            <div
              className={`max-w-lg mx-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 ${
                isLightMode
                  ? "bg-white/95 border-slate-200 text-slate-800"
                  : "bg-slate-900/95 border-slate-700 text-white"
              }`}
            >
              <div>
                <p className="text-sm font-extrabold">A NoorQuran update is ready</p>
                <p className={`text-xs ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>Refresh once to use the latest version.</p>
              </div>
              <button
                onClick={handleApplyUpdate}
                type="button"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white active:scale-95 transition-all hover:bg-emerald-500"
              >
                Update
              </button>
            </div>
          </div>
        )}

        {showInstallButton && (
          <div className="pointer-events-none fixed right-2 top-1/2 z-[65] -translate-y-1/2 sm:right-4">
            <button
              type="button"
              onClick={handleInstallApp}
              disabled={isInstallPromptRunning}
              aria-label="Install NoorQuran app"
              title="Install NoorQuran app"
              className={`pointer-events-auto noor-floating-install group relative flex h-11 w-11 items-center justify-center overflow-visible rounded-2xl border shadow-2xl active:scale-95 disabled:opacity-70 ${
                isLightMode
                  ? "border-emerald-200 bg-white text-emerald-700 shadow-emerald-900/15"
                  : "border-emerald-500/40 bg-slate-900 text-emerald-300 shadow-emerald-950/40"
              }`}
            >
              <span className="noor-install-glow absolute -inset-1 rounded-[1.15rem] bg-emerald-400/25 blur-md transition-opacity group-hover:opacity-100" />
              <span className={`relative flex h-full w-full items-center justify-center rounded-2xl bg-emerald-600 text-white ${isInstallPromptRunning ? "" : "animate-bounce"}`}>
                <Download className="h-5 w-5" strokeWidth={2.7} />
              </span>
            </button>

            {installHint && (
              <div
                className={`pointer-events-auto absolute right-12 top-1/2 w-max max-w-[12rem] -translate-y-1/2 rounded-2xl border px-3 py-2 text-[10px] font-extrabold shadow-xl ${
                  isLightMode
                    ? "border-slate-200 bg-white text-slate-700"
                    : "border-slate-700 bg-slate-900 text-slate-100"
                }`}
              >
                {installHint}
              </div>
            )}
          </div>
        )}

        {showInstallGuide && showInstallButton && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
            <div
              className={`w-full max-w-sm rounded-[1.75rem] border p-5 shadow-2xl ${
                isLightMode
                  ? "border-slate-200 bg-white text-slate-900"
                  : "border-slate-700 bg-slate-900 text-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-black tracking-tight">Install NoorQuran</p>
                  <p className={`mt-1 text-xs font-semibold leading-relaxed ${isLightMode ? "text-slate-600" : "text-slate-400"}`}>
                    Your browser did not open the install prompt automatically. Use the quick steps below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  className={`rounded-xl border px-3 py-2 text-xs font-black active:scale-95 ${
                    isLightMode
                      ? "border-slate-200 bg-slate-50 text-slate-700"
                      : "border-slate-700 bg-slate-800 text-slate-200"
                  }`}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs font-bold leading-relaxed">
                <div className={`rounded-2xl border p-3 ${isLightMode ? "border-emerald-100 bg-emerald-50 text-emerald-900" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"}`}>
                  <p className="font-black">Android Chrome / Edge</p>
                  <p className="mt-1">Tap the browser menu ⋮, then tap Install app or Add to Home screen.</p>
                </div>
                <div className={`rounded-2xl border p-3 ${isLightMode ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-700 bg-slate-800 text-slate-200"}`}>
                  <p className="font-black">iPhone Safari</p>
                  <p className="mt-1">Tap Share, then Add to Home Screen.</p>
                </div>
                <p className={`${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                  If you opened this link inside WhatsApp, Facebook, or another in-app browser, open it again in Chrome or Safari first.
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="noor-page-scroll w-full overflow-x-hidden pb-28">
          {activeTab === "home" && (
            <HomeScreen
              setActiveTab={setActiveTab}
              onContinueReading={handleContinueReading}
              isLightMode={isLightMode}
            />
          )}

          {activeTab === "quran" && (
            <QuranScreen
              currentSurah={currentSurah}
              currentAyah={currentAyah}
              isPlaying={isPlaying}
              onPlayAyah={handlePlayVerse}
              isLightMode={isLightMode}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeTab === "prayer" && (
            <PrayerScreen
              isLightMode={isLightMode}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}

          {activeTab === "adhkar" && <AdhkarScreen isLightMode={isLightMode} />}

          {activeTab === "tasbih" && <TasbihScreen isLightMode={isLightMode} />}

          {activeTab === "qibla" && <QiblaCompass />}

          {activeTab === "settings" && (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              isLightMode={isLightMode}
            />
          )}
        </main>

        <AudioPlayer
          currentSurah={currentSurah}
          currentAyah={currentAyah}
          reciterId={reciterId}
          isPlaying={isPlaying}
          onPlayStateChange={setIsPlaying}
          onVerseChange={(surah, ayah) => {
            setCurrentSurah(surah);
            setCurrentAyah(ayah);
          }}
          onReciterChange={setReciterId}
          isLightMode={isLightMode}
        />

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} isLightMode={isLightMode} />
      </div>
    </AppErrorBoundary>
  );
}
