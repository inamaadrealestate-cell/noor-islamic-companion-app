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

type AppTab = "home" | "quran" | "prayer" | "adhkar" | "tasbih" | "qibla" | "settings";

const VALID_TABS: AppTab[] = ["home", "quran", "prayer", "adhkar", "tasbih", "qibla", "settings"];
const LAST_TAB_KEY = "noor_active_tab";

function isValidTab(tab: string | null): tab is AppTab {
  return Boolean(tab && VALID_TABS.includes(tab as AppTab));
}

function getInitialTab(): AppTab {
  if (typeof window === "undefined") return "home";
  const savedTab = window.localStorage.getItem(LAST_TAB_KEY);
  return isValidTab(savedTab) ? savedTab : "home";
}

function getInitialOnlineState(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

function isRunningAsInstalledApp(): boolean {
  if (typeof window === "undefined") return false;

  const standaloneDisplay = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const fullscreenDisplay = window.matchMedia?.("(display-mode: fullscreen)").matches ?? false;
  const iosStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );

  return standaloneDisplay || fullscreenDisplay || iosStandalone;
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
    window.localStorage.removeItem(LAST_TAB_KEY);
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

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSurah, setCurrentSurah] = useState<number>(1);
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [reciterId, setReciterId] = useState<string>(settings.default_reciter || "ar.alafasy");

  const isLightMode = settings.theme === "light";

  useEffect(() => {
    document.body.className = isLightMode
      ? "bg-slate-50 text-slate-800"
      : "bg-slate-900 text-white";
    document.documentElement.style.colorScheme = isLightMode ? "light" : "dark";
  }, [isLightMode]);

  useEffect(() => {
    window.localStorage.setItem(LAST_TAB_KEY, activeTab);
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

    const handleInstallPromptReady = () => updateInstallButtonVisibility();
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setInstallHint("");
    };

    updateInstallButtonVisibility();

    window.addEventListener("beforeinstallprompt", handleInstallPromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const setActiveTab = (tab: string) => {
    if (isValidTab(tab)) {
      setActiveTabState(tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    setInstallHint("");

    if (window.noorPromptInstall && window.noorDeferredInstallPrompt) {
      await window.noorPromptInstall();

      window.setTimeout(() => {
        if (isRunningAsInstalledApp()) {
          setShowInstallButton(false);
          return;
        }

        setInstallHint("Tap menu, then Install app");
        window.setTimeout(() => setInstallHint(""), 4200);
      }, 800);
      return;
    }

    setInstallHint("Tap menu, then Install app");
    window.setTimeout(() => setInstallHint(""), 4200);
  };

  return (
    <AppErrorBoundary isLightMode={isLightMode}>
      <div
        className={`min-h-dvh w-full overflow-x-hidden transition-colors duration-200 ${
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
          <div className="fixed right-2 top-1/2 z-[65] -translate-y-1/2 sm:right-4">
            <button
              type="button"
              onClick={handleInstallApp}
              aria-label="Download NoorQuran app"
              title="Download NoorQuran app"
              className={`group relative flex h-11 w-11 items-center justify-center overflow-visible rounded-2xl border shadow-2xl active:scale-95 ${
                isLightMode
                  ? "border-emerald-200 bg-white text-emerald-700 shadow-emerald-900/15"
                  : "border-emerald-500/40 bg-slate-900 text-emerald-300 shadow-emerald-950/40"
              }`}
            >
              <span className="absolute -inset-1 rounded-[1.15rem] bg-emerald-400/25 blur-md transition-opacity group-hover:opacity-100" />
              <span className="relative flex h-full w-full animate-bounce items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Download className="h-5 w-5" strokeWidth={2.7} />
              </span>
            </button>

            {installHint && (
              <div
                className={`absolute right-12 top-1/2 w-max max-w-[11rem] -translate-y-1/2 rounded-2xl border px-3 py-2 text-[10px] font-extrabold shadow-xl ${
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

        <main className="w-full overflow-x-hidden">
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
