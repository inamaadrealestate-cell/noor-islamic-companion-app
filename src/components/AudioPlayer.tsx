import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Search,
  Settings2,
  Star,
  SkipBack,
  SkipForward,
  Volume2,
  WifiOff,
} from "lucide-react";
import {
  AUDIO_CACHE_NAME,
  RECITERS_LIST,
  getAudioDownloadKey,
  getReciterById,
  getVerseAudioFallbackUrls,
  getVerseAudioUrl,
} from "../lib/audioData";
import { SURAH_LIST } from "../lib/surahData";

interface AudioPlayerProps {
  currentSurah: number;
  currentAyah: number;
  reciterId: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
  onVerseChange: (surah: number, ayah: number) => void;
  onReciterChange: (reciterId: string) => void;
  isLightMode: boolean;
}

type RepeatMode = "off" | "ayah" | "surah";
type ReciterFilter = "all" | "favorites" | "murattal" | "mujawwad";

const FAVORITE_RECITERS_KEY = "noor_favorite_reciters";

function loadFavoriteReciters(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_RECITERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function saveFavoriteReciters(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITE_RECITERS_KEY, JSON.stringify(ids));
  } catch {}
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

interface LatestPlaybackState {
  currentSurah: number;
  currentAyah: number;
  repeatMode: RepeatMode;
  surahAyahs: number;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function getSurahMeta(surahNumber: number) {
  return (
    SURAH_LIST.find((surah) => surah.number === surahNumber) || SURAH_LIST[0]
  );
}

function getPreviousVerse(
  surah: number,
  ayah: number,
): { surah: number; ayah: number } {
  if (ayah > 1) return { surah, ayah: ayah - 1 };

  const currentIndex = SURAH_LIST.findIndex((item) => item.number === surah);
  const previousSurah =
    currentIndex > 0 ? SURAH_LIST[currentIndex - 1] : SURAH_LIST[0];
  return { surah: previousSurah.number, ayah: previousSurah.numberOfAyahs };
}

function getNextVerse(
  surah: number,
  ayah: number,
): { surah: number; ayah: number } | null {
  const surahMeta = getSurahMeta(surah);
  if (ayah < surahMeta.numberOfAyahs) return { surah, ayah: ayah + 1 };

  const currentIndex = SURAH_LIST.findIndex((item) => item.number === surah);
  const nextSurah = currentIndex >= 0 ? SURAH_LIST[currentIndex + 1] : null;
  return nextSurah ? { surah: nextSurah.number, ayah: 1 } : null;
}

export default function AudioPlayer({
  currentSurah,
  currentAyah,
  reciterId,
  isPlaying,
  onPlayStateChange,
  onVerseChange,
  onReciterChange,
  isLightMode,
}: AudioPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [reciterSearch, setReciterSearch] = useState("");
  const [reciterFilter, setReciterFilter] = useState<ReciterFilter>("all");
  const [favoriteReciterIds, setFavoriteReciterIds] =
    useState<string[]>(loadFavoriteReciters);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playerError, setPlayerError] = useState("");
  const [cacheStatus, setCacheStatus] = useState("");
  const [volume, setVolume] = useState<number>(0.9);
  const [effectiveAudioUrl, setEffectiveAudioUrl] = useState("");
  const [audioRetryNonce, setAudioRetryNonce] = useState(0);
  const [audioSourceIndex, setAudioSourceIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const shouldAutoContinueRef = useRef(false);
  const latestRef = useRef<LatestPlaybackState>({
    currentSurah,
    currentAyah,
    repeatMode,
    surahAyahs: getSurahMeta(currentSurah).numberOfAyahs,
  });

  const surahMeta = useMemo(() => getSurahMeta(currentSurah), [currentSurah]);
  const activeReciter = useMemo(() => getReciterById(reciterId), [reciterId]);
  const favoriteReciterSet = useMemo(
    () => new Set(favoriteReciterIds),
    [favoriteReciterIds],
  );
  const filteredReciters = useMemo(() => {
    const query = normalizeSearch(reciterSearch);

    return RECITERS_LIST.filter((reciter) => {
      const matchesQuery =
        !query ||
        reciter.name.toLowerCase().includes(query) ||
        reciter.arabicName.includes(reciterSearch.trim()) ||
        reciter.description.toLowerCase().includes(query) ||
        reciter.bitrate.toLowerCase().includes(query);

      const matchesFilter =
        reciterFilter === "all" ||
        (reciterFilter === "favorites" && favoriteReciterSet.has(reciter.id)) ||
        (reciterFilter === "murattal" && reciter.style === "Murattal") ||
        (reciterFilter === "mujawwad" && reciter.style === "Mujawwad");

      return matchesQuery && matchesFilter;
    }).sort((a, b) => {
      const aFav = favoriteReciterSet.has(a.id) ? 0 : 1;
      const bFav = favoriteReciterSet.has(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      return a.name.localeCompare(b.name);
    });
  }, [favoriteReciterSet, reciterFilter, reciterSearch]);
  const audioSources = useMemo(
    () => getVerseAudioFallbackUrls(reciterId, currentSurah, currentAyah),
    [reciterId, currentSurah, currentAyah],
  );
  const selectedAudioSource =
    audioSources[Math.min(audioSourceIndex, Math.max(0, audioSources.length - 1))] ||
    audioSources[0];
  const baseAudioUrl = selectedAudioSource?.url || getVerseAudioUrl(reciterId, currentSurah, currentAyah);
  const audioUrl = useMemo(() => {
    if (!audioRetryNonce) return baseAudioUrl;
    return `${baseAudioUrl}${baseAudioUrl.includes("?") ? "&" : "?"}noorRetry=${audioRetryNonce}`;
  }, [audioRetryNonce, baseAudioUrl]);
  const downloadKey = useMemo(
    () => getAudioDownloadKey(reciterId, currentSurah, currentAyah),
    [reciterId, currentSurah, currentAyah],
  );

  const playAudioElement = (
    audio: HTMLAudioElement,
    blockedMessage = "Tap play again. Your browser blocked automatic audio playback.",
  ) => {
    setIsBuffering(true);

    const playPromise = audio.play();

    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          shouldAutoContinueRef.current = false;
          setIsBuffering(false);
          setPlayerError("");
        })
        .catch((error: any) => {
          setIsBuffering(false);

          // Chrome/Edge can throw AbortError when a source is replaced while a play()
          // request is still settling. That is not a real audio failure, so do not
          // stop the player or show the user a scary error.
          if (error?.name === "AbortError") {
            return;
          }

          shouldAutoContinueRef.current = false;
          setPlayerError(
            error?.name === "NotAllowedError"
              ? blockedMessage
              : "Audio playback was interrupted. Tap play once to continue.",
          );
          onPlayStateChange(false);
        });
    }
  };

  const cardBase = isLightMode
    ? "bg-white border-slate-200 text-slate-800 shadow-sm"
    : "bg-slate-800/70 border-slate-700/80 text-white shadow-xl shadow-slate-950/20";
  const mutedText = isLightMode ? "text-slate-500" : "text-slate-400";
  const softButton = isLightMode
    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);


  useEffect(() => {
    setAudioSourceIndex(0);
    setAudioRetryNonce(0);
  }, [reciterId, currentSurah, currentAyah]);

  useEffect(() => {
    latestRef.current = {
      currentSurah,
      currentAyah,
      repeatMode,
      surahAyahs: surahMeta.numberOfAyahs,
    };
  }, [currentSurah, currentAyah, repeatMode, surahMeta.numberOfAyahs]);

  useEffect(() => {
    let cancelled = false;
    setEffectiveAudioUrl(audioUrl);
    setCacheStatus("");
    setDownloaded(localStorage.getItem(downloadKey) === "cached");

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    async function loadCachedAudio() {
      if (!("caches" in window)) return;

      try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const cachedResponse = await cache.match(baseAudioUrl);
        if (!cachedResponse || cancelled) return;

        setDownloaded(true);
        localStorage.setItem(downloadKey, "cached");

        const blob = await cachedResponse.blob();
        if (blob.size > 0 && !cancelled) {
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setEffectiveAudioUrl(objectUrl);
        }
      } catch {
        // Keep online streaming as the fallback.
      }
    }

    loadCachedAudio();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [audioUrl, baseAudioUrl, downloadKey]);

  useEffect(() => {
    if (!effectiveAudioUrl) return;

    const audio = audioRef.current || new Audio();
    audioRef.current = audio;
    audio.preload = "auto";
    audio.src = effectiveAudioUrl;
    audio.playbackRate = playbackSpeed;
    audio.volume = volume;

    const shouldStartForThisSource = isPlaying || shouldAutoContinueRef.current;

    setCurrentTime(0);
    setDuration(0);
    setPlayerError("");
    setIsBuffering(shouldStartForThisSource);

    let startedForThisSource = false;

    const tryStartForThisSource = () => {
      if (startedForThisSource || !shouldStartForThisSource) return;
      startedForThisSource = true;
      audio.currentTime = 0;
      playAudioElement(
        audio,
        "Could not continue automatically. Tap play once to unlock audio, then continuous recitation will continue.",
      );
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      tryStartForThisSource();
    };

    const handleCanPlay = () => {
      setIsBuffering(false);
      tryStartForThisSource();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(audio.duration || 0);
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setPlayerError("");
    };

    const handleEnded = () => {
      const latest = latestRef.current;

      if (latest.repeatMode === "ayah") {
        audio.currentTime = 0;
        shouldAutoContinueRef.current = true;
        onPlayStateChange(true);
        playAudioElement(
          audio,
          "Could not repeat this ayah automatically. Tap play once to continue.",
        );
        return;
      }

      if (
        latest.repeatMode === "surah" &&
        latest.currentAyah >= latest.surahAyahs
      ) {
        shouldAutoContinueRef.current = true;
        onPlayStateChange(true);
        onVerseChange(latest.currentSurah, 1);
        return;
      }

      const nextVerse = getNextVerse(latest.currentSurah, latest.currentAyah);
      if (nextVerse) {
        shouldAutoContinueRef.current = true;
        onPlayStateChange(true);
        onVerseChange(nextVerse.surah, nextVerse.ayah);
        return;
      }

      shouldAutoContinueRef.current = false;
      onPlayStateChange(false);
    };

    const handleError = () => {
      setIsBuffering(false);

      const nextSourceIndex = audioSourceIndex + 1;
      if (navigator.onLine && nextSourceIndex < audioSources.length) {
        const nextSource = audioSources[nextSourceIndex];
        setPlayerError(
          `${activeReciter.name} could not load this ayah. Trying verified backup audio from ${nextSource.reciterName}...`,
        );
        shouldAutoContinueRef.current = true;
        onPlayStateChange(true);
        setAudioSourceIndex(nextSourceIndex);
        return;
      }

      setPlayerError(
        navigator.onLine
          ? "Audio could not load after trying verified backup sources. Try Retry once, then change reciter."
          : "You are offline and this ayah is not saved for offline audio yet. Connect once or choose an ayah you already saved.",
      );
      onPlayStateChange(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audio.load();
    tryStartForThisSource();

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [effectiveAudioUrl, audioSourceIndex, audioSources, activeReciter.name]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      playAudioElement(audio, "Tap play again once to unlock audio playback.");
    } else {
      audio.pause();
      shouldAutoContinueRef.current = false;
      setIsBuffering(false);
    }
  }, [isPlaying]);

  const handleTogglePlayback = () => {
    const audio = audioRef.current;

    if (isPlaying) {
      onPlayStateChange(false);
      return;
    }

    // This runs inside the user's tap/click event. That is important because
    // browsers allow audio most reliably when play() is called directly from a
    // real user gesture, not later inside a React effect.
    onPlayStateChange(true);
    if (audio) {
      playAudioElement(audio, "Tap play again once to unlock audio playback.");
    }
  };

  const goPrevious = () => {
    const previousVerse = getPreviousVerse(currentSurah, currentAyah);
    shouldAutoContinueRef.current = isPlaying;
    onVerseChange(previousVerse.surah, previousVerse.ayah);
  };

  const goNext = () => {
    const nextVerse = getNextVerse(currentSurah, currentAyah);
    if (nextVerse) {
      shouldAutoContinueRef.current = isPlaying;
      onVerseChange(nextVerse.surah, nextVerse.ayah);
    }
  };

  const toggleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    setPlaybackSpeed(speeds[(currentIndex + 1) % speeds.length]);
  };

  const toggleRepeat = () => {
    setRepeatMode((previous) =>
      previous === "off" ? "ayah" : previous === "ayah" ? "surah" : "off",
    );
  };

  const handleSeek = (value: string) => {
    const nextTime = Number(value);
    setCurrentTime(nextTime);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
  };

  const toggleFavoriteReciter = (reciterIdToToggle: string) => {
    setFavoriteReciterIds((current) => {
      const next = current.includes(reciterIdToToggle)
        ? current.filter((id) => id !== reciterIdToToggle)
        : [...current, reciterIdToToggle];
      saveFavoriteReciters(next);
      return next;
    });
  };

  const handleRetryAudio = () => {
    setPlayerError("");
    setCacheStatus("Retrying audio source...");
    setIsBuffering(true);
    shouldAutoContinueRef.current = true;
    onPlayStateChange(true);
    setAudioSourceIndex(0);
    setAudioRetryNonce((value) => value + 1);
    window.setTimeout(() => setCacheStatus(""), 2500);
  };

  const handleCacheCurrentAyah = async () => {
    setCacheStatus("Saving current ayah audio...");

    if (!("caches" in window)) {
      setCacheStatus("This browser does not support audio caching.");
      return;
    }

    try {
      const response = await fetch(baseAudioUrl, { mode: "cors" });
      if (!response.ok)
        throw new Error("Audio server rejected the download request.");

      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.put(baseAudioUrl, response.clone());
      localStorage.setItem(downloadKey, "cached");
      setDownloaded(true);

      const blob = await response.blob();
      if (blob.size > 0) {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setEffectiveAudioUrl(objectUrl);
      }

      setCacheStatus("Saved for offline playback on this browser.");
      setTimeout(() => setCacheStatus(""), 3500);
    } catch {
      setCacheStatus(
        "Could not save this audio. It still works online; try again or use another reciter.",
      );
    }
  };

  const progressPercentage =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;
  const canGoNext = Boolean(getNextVerse(currentSurah, currentAyah));
  const repeatLabel =
    repeatMode === "off"
      ? "Repeat off"
      : repeatMode === "ayah"
        ? "Repeat ayah"
        : "Repeat surah";

  return (
    <>
      <div
        className={`fixed bottom-16 left-0 right-0 z-30 border-t backdrop-blur-md transition-all ${
          isLightMode
            ? "bg-white/95 border-slate-200 text-slate-800"
            : "bg-slate-900/95 border-slate-800 text-white"
        }`}
      >
        <div className="max-w-lg mx-auto px-3 py-2.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 flex-1 text-left group overflow-hidden active:scale-[0.99]"
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-emerald-700 flex-shrink-0 flex items-center justify-center shadow-md">
              <img
                src={activeReciter.photoUrl}
                alt={activeReciter.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {isPlaying && (
                <Volume2 className="w-5 h-5 text-white absolute animate-pulse drop-shadow" />
              )}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-extrabold truncate">
                  {surahMeta.englishName}
                </p>
                <span className="text-xs text-emerald-500 font-bold flex-shrink-0">
                  {currentSurah}:{currentAyah}
                </span>
              </div>
              <p className={`text-xs truncate ${mutedText}`}>
                {activeReciter.name}
              </p>
            </div>
            <ChevronUp className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={goPrevious}
              className={`p-2 rounded-xl border transition-colors active:scale-95 ${softButton}`}
              aria-label="Previous ayah"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleTogglePlayback}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all shadow-md active:scale-95"
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
            >
              {isBuffering ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              className={`p-2 rounded-xl border transition-colors active:scale-95 disabled:opacity-35 ${softButton}`}
              aria-label="Next ayah"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={isLightMode ? "h-1 bg-slate-100" : "h-1 bg-slate-800"}>
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {isExpanded && (
        <div
          className={`fixed inset-0 z-50 flex flex-col transition-colors ${
            isLightMode
              ? "bg-slate-50 text-slate-800"
              : "bg-slate-950 text-white"
          }`}
        >
          <div
            className={`flex items-center justify-between px-5 py-4 border-b ${
              isLightMode
                ? "border-slate-200 bg-white/90"
                : "border-slate-800 bg-slate-950/90"
            }`}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className={`p-2 rounded-full transition-colors ${softButton}`}
              aria-label="Close audio player"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span
              className={`text-xs uppercase tracking-widest font-extrabold ${mutedText}`}
            >
              Quran Audio Player
            </span>
            <button
              type="button"
              onClick={() => setShowReciterPicker(!showReciterPicker)}
              className={`p-2 rounded-full transition-colors border ${
                showReciterPicker
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : softButton
              }`}
              aria-label="Select reciter"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 max-w-md w-full mx-auto px-5 py-5 flex flex-col overflow-y-auto no-scrollbar">
            {showReciterPicker ? (
              <div className="flex flex-col gap-4 pb-10">
                <div>
                  <h3 className="text-xl font-black">Select Reciter</h3>
                  <p className={`text-xs mt-1 ${mutedText}`}>
                    Search, filter, and favorite your main reciters for faster
                    access.
                  </p>
                </div>

                <div className={`rounded-2xl border p-3 ${cardBase}`}>
                  <label
                    className={`text-[11px] font-black uppercase tracking-wider ${mutedText}`}
                  >
                    Search reciters
                  </label>
                  <div
                    className={`mt-2 flex items-center gap-2 rounded-2xl border px-3 py-2 ${isLightMode ? "bg-white border-slate-200" : "bg-slate-950 border-slate-700"}`}
                  >
                    <Search className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <input
                      type="search"
                      value={reciterSearch}
                      onChange={(event) => setReciterSearch(event.target.value)}
                      placeholder="Search Ali Jaber, Ayyub, Matroud..."
                      className="w-full bg-transparent outline-none text-sm font-semibold placeholder:text-slate-500"
                    />
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(
                      [
                        ["all", "All"],
                        [
                          "favorites",
                          `Favorites ${favoriteReciterIds.length ? `(${favoriteReciterIds.length})` : ""}`,
                        ],
                        ["murattal", "Murattal"],
                        ["mujawwad", "Mujawwad"],
                      ] as const
                    ).map(([filter, label]) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setReciterFilter(filter)}
                        className={`px-3 py-2 rounded-xl text-xs font-black border whitespace-nowrap transition-all active:scale-95 ${
                          reciterFilter === filter
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : softButton
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5">
                  {filteredReciters.length === 0 ? (
                    <div
                      className={`p-5 rounded-2xl border text-center ${cardBase}`}
                    >
                      <p className="text-sm font-extrabold">No reciter found</p>
                      <p className={`text-xs mt-1 ${mutedText}`}>
                        Try another spelling or switch the filter back to All.
                      </p>
                    </div>
                  ) : (
                    filteredReciters.map((reciter) => {
                      const isSelected = reciter.id === reciterId;
                      const isFavorite = favoriteReciterSet.has(reciter.id);
                      return (
                        <div
                          key={reciter.id}
                          className={`w-full p-3 rounded-2xl flex items-center gap-3 border text-left transition-all ${
                            isSelected
                              ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/30"
                              : cardBase
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onReciterChange(reciter.id);
                              setShowReciterPicker(false);
                              onPlayStateChange(false);
                            }}
                            className="flex items-center gap-4 flex-1 min-w-0 text-left active:scale-[0.99]"
                          >
                            <img
                              src={reciter.photoUrl}
                              alt={reciter.name}
                              className="w-14 h-14 rounded-xl object-cover shadow flex-shrink-0"
                            />
                            <div className="flex-1 overflow-hidden min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="text-sm font-extrabold truncate">
                                  {reciter.name}
                                </p>
                                {isSelected && (
                                  <Check className="w-4 h-4 flex-shrink-0" />
                                )}
                              </div>
                              <p
                                className={`text-xs font-arabic font-semibold mt-0.5 ${isSelected ? "text-emerald-50" : "text-emerald-500"}`}
                              >
                                {reciter.arabicName}
                              </p>
                              <p
                                className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? "text-emerald-50/85" : mutedText}`}
                              >
                                {reciter.style} • {reciter.bitrate} •{" "}
                                {reciter.description}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleFavoriteReciter(reciter.id)}
                            className={`p-2 rounded-xl border transition-all active:scale-95 ${
                              isFavorite
                                ? "bg-amber-400/20 border-amber-400/40 text-amber-300"
                                : isSelected
                                  ? "border-emerald-300/50 text-emerald-50 hover:bg-white/10"
                                  : softButton
                            }`}
                            title={
                              isFavorite
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }
                            aria-label={
                              isFavorite
                                ? `Remove ${reciter.name} from favorites`
                                : `Add ${reciter.name} to favorites`
                            }
                          >
                            <Star
                              className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                            />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <p className={`text-[11px] text-center ${mutedText}`}>
                  Showing {filteredReciters.length} of {RECITERS_LIST.length}{" "}
                  reciters. Favorite your main reciters so they always appear
                  first.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center py-5">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-[2rem] overflow-hidden relative shadow-2xl mb-7 border border-emerald-500/20 group">
                    <img
                      src={activeReciter.photoUrl}
                      alt={activeReciter.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/15 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <span className="text-xs px-2.5 py-1 bg-emerald-600 text-white font-extrabold rounded-lg backdrop-blur-md">
                        {activeReciter.style} • {activeReciter.bitrate}
                      </span>
                      <button
                        type="button"
                        onClick={handleCacheCurrentAyah}
                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all border ${
                          downloaded
                            ? "bg-emerald-500/25 border-emerald-400/40 text-emerald-100"
                            : "bg-slate-900/80 border-slate-700 text-white hover:bg-slate-800"
                        }`}
                        title="Save current ayah audio"
                      >
                        {downloaded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h2 className="text-2xl font-black mb-1">
                    {surahMeta.englishName}
                  </h2>
                  <p className="text-sm text-emerald-500 font-bold mb-1">
                    Surah {surahMeta.name} • Ayah {currentAyah} of{" "}
                    {surahMeta.numberOfAyahs}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReciterPicker(true)}
                    className={`text-xs underline mt-2 transition-colors ${mutedText}`}
                  >
                    {activeReciter.name}
                  </button>
                  {selectedAudioSource?.isFallback && (
                    <p className="mt-2 text-[11px] font-bold text-amber-500">
                      Backup audio active: {selectedAudioSource.reciterName}
                    </p>
                  )}
                </div>

                {(playerError || cacheStatus || !isOnline) && (
                  <div
                    className={`mb-4 p-3 rounded-2xl border text-xs leading-relaxed flex gap-2 ${
                      playerError || !isOnline
                        ? isLightMode
                          ? "bg-amber-50 border-amber-200 text-amber-800"
                          : "bg-red-950/30 border-red-500/30 text-red-200"
                        : isLightMode
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-emerald-950/30 border-emerald-700/40 text-emerald-200"
                    }`}
                  >
                    {playerError ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : !isOnline ? (
                      <WifiOff className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p>
                        {playerError ||
                          cacheStatus ||
                          "Offline mode: audio will play only if this ayah was saved in this browser."}
                      </p>
                      {playerError && (
                        <button
                          type="button"
                          onClick={handleRetryAudio}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-white font-extrabold active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry audio
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-6 mt-auto pb-4">
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={1}
                      value={Math.min(currentTime, duration || currentTime)}
                      onChange={(event) => handleSeek(event.target.value)}
                      className="w-full accent-emerald-500"
                      aria-label="Audio progress"
                    />
                    <div
                      className={`flex justify-between text-[11px] font-bold ${mutedText}`}
                    >
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={toggleRepeat}
                      className={`relative p-3 rounded-2xl border transition-all active:scale-95 ${
                        repeatMode !== "off"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/30"
                          : softButton
                      }`}
                      title={repeatLabel}
                    >
                      <Repeat className="w-5 h-5" />
                      {repeatMode !== "off" && (
                        <span className="absolute -top-1 -right-1 bg-white text-emerald-700 text-[9px] px-1.5 rounded-full font-black">
                          {repeatMode === "ayah" ? "1" : "S"}
                        </span>
                      )}
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={goPrevious}
                        className={`p-3 rounded-2xl border transition-all active:scale-95 ${softButton}`}
                        aria-label="Previous ayah"
                      >
                        <SkipBack className="w-6 h-6" />
                      </button>
                      <button
                        type="button"
                        onClick={handleTogglePlayback}
                        className="p-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl shadow-xl shadow-emerald-900/40 transition-all active:scale-95"
                        aria-label={isPlaying ? "Pause audio" : "Play audio"}
                      >
                        {isBuffering ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!canGoNext}
                        className={`p-3 rounded-2xl border transition-all active:scale-95 disabled:opacity-35 ${softButton}`}
                        aria-label="Next ayah"
                      >
                        <SkipForward className="w-6 h-6" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={toggleSpeed}
                      className={`px-3 py-2.5 text-xs font-black rounded-2xl transition-all active:scale-95 border ${softButton}`}
                    >
                      {playbackSpeed}x
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl border ${cardBase}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-extrabold uppercase tracking-wider">
                          Volume
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${mutedText}`}>
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(event) =>
                        setVolume(Number(event.target.value))
                      }
                      className="w-full accent-emerald-500"
                      aria-label="Volume"
                    />
                  </div>

                  <p
                    className={`text-[11px] leading-relaxed text-center ${mutedText}`}
                  >
                    Audio streams online. Tap the save icon on an ayah to cache
                    that ayah for offline playback where the browser/server
                    allows it.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
