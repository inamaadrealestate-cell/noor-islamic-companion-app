import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  History,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

interface TasbihScreenProps {
  isLightMode: boolean;
}

interface TasbihPreset {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  target: number;
  virtue: string;
}

interface TasbihState {
  presetId: string;
  count: number;
  target: number;
  customTitle: string;
}

interface TasbihHistoryItem {
  id: string;
  title: string;
  count: number;
  target: number;
  completedAt: string;
}

const TASBIH_STATE_KEY = "noor_tasbih_state";
const TASBIH_HISTORY_KEY = "noor_tasbih_history";

const TASBIH_PRESETS: TasbihPreset[] = [
  {
    id: "subhanallah",
    title: "SubhanAllah",
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "SubhanAllah",
    translation: "Glory be to Allah.",
    target: 33,
    virtue: "Commonly recited after Salah as part of the daily tasbih.",
  },
  {
    id: "alhamdulillah",
    title: "Alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    transliteration: "Alhamdulillah",
    translation: "All praise is for Allah.",
    target: 33,
    virtue: "A daily reminder of gratitude and contentment.",
  },
  {
    id: "allahuakbar",
    title: "Allahu Akbar",
    arabic: "اللَّهُ أَكْبَرُ",
    transliteration: "Allahu Akbar",
    translation: "Allah is the Greatest.",
    target: 34,
    virtue: "Often completed with 33 SubhanAllah and 33 Alhamdulillah after Salah.",
  },
  {
    id: "istighfar",
    title: "Astaghfirullah",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Astaghfirullah",
    translation: "I seek forgiveness from Allah.",
    target: 100,
    virtue: "A powerful daily dhikr for repentance and renewal.",
  },
  {
    id: "tahleel",
    title: "La ilaha illa Allah",
    arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
    transliteration: "La ilaha illa Allah",
    translation: "There is no deity worthy of worship except Allah.",
    target: 100,
    virtue: "The greatest statement of tawheed and remembrance.",
  },
  {
    id: "salawat",
    title: "Salawat",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ",
    transliteration: "Allahumma salli ala Muhammad",
    translation: "O Allah, send blessings upon Muhammad.",
    target: 100,
    virtue: "Send blessings upon the Prophet ﷺ throughout the day.",
  },
  {
    id: "hawla",
    title: "La hawla wa la quwwata illa billah",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
    transliteration: "La hawla wa la quwwata illa billah",
    translation: "There is no power nor strength except through Allah.",
    target: 100,
    virtue: "A reminder to rely on Allah in every difficulty.",
  },
  {
    id: "custom",
    title: "Custom Dhikr",
    arabic: "ذِكْرٌ مُخَصَّصٌ",
    transliteration: "Choose your own remembrance",
    translation: "Use this for any dhikr target you want to track.",
    target: 100,
    virtue: "Set your own target and keep your personal dhikr count.",
  },
];

function safeReadState(): TasbihState {
  try {
    const saved = localStorage.getItem(TASBIH_STATE_KEY);
    if (!saved) throw new Error("No saved tasbih state");
    const parsed = JSON.parse(saved) as Partial<TasbihState>;
    return {
      presetId: parsed.presetId || "subhanallah",
      count: Number.isFinite(parsed.count) ? Number(parsed.count) : 0,
      target: Number.isFinite(parsed.target) ? Number(parsed.target) : 33,
      customTitle: parsed.customTitle || "Custom Dhikr",
    };
  } catch {
    return {
      presetId: "subhanallah",
      count: 0,
      target: 33,
      customTitle: "Custom Dhikr",
    };
  }
}

function safeReadHistory(): TasbihHistoryItem[] {
  try {
    const saved = localStorage.getItem(TASBIH_HISTORY_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as TasbihHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function todayKey(dateString: string): string {
  return new Date(dateString).toISOString().split("T")[0];
}

function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default function TasbihScreen({ isLightMode }: TasbihScreenProps) {
  const [state, setState] = useState<TasbihState>(safeReadState);
  const [history, setHistory] = useState<TasbihHistoryItem[]>(safeReadHistory);
  const [showHistory, setShowHistory] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const [pulse, setPulse] = useState(false);

  const activePreset = useMemo(
    () => TASBIH_PRESETS.find((preset) => preset.id === state.presetId) || TASBIH_PRESETS[0],
    [state.presetId],
  );

  const displayTitle = state.presetId === "custom" ? state.customTitle || "Custom Dhikr" : activePreset.title;
  const progress = Math.min(100, Math.round((state.count / Math.max(state.target, 1)) * 100));
  const today = new Date().toISOString().split("T")[0];
  const todayCompleted = history.filter((item) => todayKey(item.completedAt) === today);
  const todayTotal = todayCompleted.reduce((sum, item) => sum + item.count, 0) + state.count;

  useEffect(() => {
    localStorage.setItem(TASBIH_STATE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(TASBIH_HISTORY_KEY, JSON.stringify(history.slice(0, 80)));
  }, [history]);

  const increment = () => {
    setState((current) => ({ ...current, count: current.count + 1 }));
    setPulse(true);
    window.setTimeout(() => setPulse(false), 180);
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const decrement = () => {
    setState((current) => ({ ...current, count: Math.max(0, current.count - 1) }));
  };

  const resetCounter = () => {
    setState((current) => ({ ...current, count: 0 }));
  };

  const completeSession = () => {
    if (state.count <= 0) return;
    const item: TasbihHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      title: displayTitle,
      count: state.count,
      target: state.target,
      completedAt: new Date().toISOString(),
    };
    setHistory((current) => [item, ...current].slice(0, 80));
    setState((current) => ({ ...current, count: 0 }));
  };

  const selectPreset = (preset: TasbihPreset) => {
    setState({
      presetId: preset.id,
      count: 0,
      target: preset.target,
      customTitle: preset.id === "custom" ? state.customTitle : "Custom Dhikr",
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="max-w-lg mx-auto pb-32">
      <div
        className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
          isLightMode ? "bg-slate-100/95 border-slate-200" : "bg-slate-900/95 border-slate-800"
        }`}
      >
        <div>
          <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Tasbih Counter</h1>
          <p className={`text-[11px] font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
            Digital dhikr counter with saved progress
          </p>
        </div>
        <button
          onClick={() => setShowHistory((current) => !current)}
          type="button"
          className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-extrabold active:scale-95 transition-all ${
            isLightMode
              ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        <div
          className={`rounded-[2rem] border p-5 shadow-xl overflow-hidden relative ${
            isLightMode
              ? "bg-white border-slate-200 shadow-slate-200/50"
              : "bg-slate-800/70 border-slate-700/80 shadow-black/20"
          }`}
        >
          <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-500">Now counting</p>
                <h2 className="text-2xl font-black tracking-tight">{displayTitle}</h2>
              </div>
              <div
                className={`rounded-2xl border px-3 py-2 text-center ${
                  isLightMode ? "bg-emerald-50 border-emerald-100" : "bg-emerald-950/40 border-emerald-900/70"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Target</p>
                <p className="text-lg font-black">{state.target}</p>
              </div>
            </div>

            <div className="text-center py-2">
              <p className="font-arabic text-4xl leading-relaxed text-emerald-500">{activePreset.arabic}</p>
              <p className={`text-sm font-bold mt-2 ${isLightMode ? "text-slate-700" : "text-slate-200"}`}>
                {activePreset.transliteration}
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                {activePreset.translation}
              </p>
            </div>

            {state.presetId === "custom" && (
              <div className="grid grid-cols-1 gap-3">
                <input
                  value={state.customTitle}
                  onChange={(event) => setState((current) => ({ ...current, customTitle: event.target.value }))}
                  className={`rounded-2xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isLightMode
                      ? "bg-white border-slate-200 text-slate-900"
                      : "bg-slate-900 border-slate-700 text-white"
                  }`}
                  placeholder="Custom dhikr name"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className={isLightMode ? "text-slate-500" : "text-slate-400"}>Progress</span>
                <span className="text-emerald-500">{progress}%</span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${isLightMode ? "bg-slate-100" : "bg-slate-700"}`}>
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <button
              onClick={increment}
              type="button"
              className={`w-full aspect-square max-h-72 rounded-full border-[10px] flex flex-col items-center justify-center transition-all active:scale-95 ${
                pulse ? "scale-[1.03]" : ""
              } ${
                isLightMode
                  ? "bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-100 text-slate-900"
                  : "bg-emerald-950/30 border-emerald-900/80 shadow-xl shadow-black/30 text-white"
              }`}
              aria-label="Increase tasbih count"
            >
              <span className="text-7xl font-black tracking-tighter">{state.count}</span>
              <span className={`mt-2 text-xs font-black uppercase tracking-[0.24em] ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                Tap to count
              </span>
            </button>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={decrement}
                type="button"
                className={`rounded-2xl border p-3 flex items-center justify-center gap-2 text-sm font-extrabold active:scale-95 transition-all ${
                  isLightMode
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Minus className="w-4 h-4" />
                -1
              </button>
              <button
                onClick={resetCounter}
                type="button"
                className={`rounded-2xl border p-3 flex items-center justify-center gap-2 text-sm font-extrabold active:scale-95 transition-all ${
                  isLightMode
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={completeSession}
                type="button"
                className="rounded-2xl bg-emerald-600 p-3 flex items-center justify-center gap-2 text-sm font-extrabold text-white active:scale-95 transition-all hover:bg-emerald-500"
              >
                <CheckCircle className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-3xl border p-4 ${
              isLightMode ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/80"
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-500">
              <Target className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-widest">Today</p>
            </div>
            <p className="text-3xl font-black mt-2">{todayTotal}</p>
            <p className={`text-xs font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>total counts</p>
          </div>
          <div
            className={`rounded-3xl border p-4 ${
              isLightMode ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/80"
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-500">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-widest">Saved</p>
            </div>
            <p className="text-3xl font-black mt-2">{history.length}</p>
            <p className={`text-xs font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>sessions</p>
          </div>
        </div>

        <div
          className={`rounded-[2rem] border overflow-hidden ${
            isLightMode ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/80"
          }`}
        >
          <button
            onClick={() => setShowPresets((current) => !current)}
            type="button"
            className="w-full px-5 py-4 flex items-center justify-between text-left active:scale-[0.99] transition-all"
          >
            <div>
              <h3 className="font-black">Dhikr presets</h3>
              <p className={`text-xs font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>Choose a common target</p>
            </div>
            {showPresets ? <ChevronUp className="w-5 h-5 text-emerald-500" /> : <ChevronDown className="w-5 h-5 text-emerald-500" />}
          </button>

          {showPresets && (
            <div className="px-4 pb-4 grid grid-cols-1 gap-3">
              {TASBIH_PRESETS.map((preset) => {
                const isActive = preset.id === state.presetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    type="button"
                    className={`rounded-2xl border p-4 text-left active:scale-[0.99] transition-all ${
                      isActive
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/30"
                        : isLightMode
                          ? "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                          : "bg-slate-900/70 border-slate-700 text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{preset.title}</p>
                        <p className={`font-arabic text-2xl mt-1 ${isActive ? "text-white" : "text-emerald-500"}`}>{preset.arabic}</p>
                        <p className={`text-xs mt-2 leading-relaxed ${isActive ? "text-emerald-50" : isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                          {preset.virtue}
                        </p>
                      </div>
                      <span className={`rounded-xl px-2.5 py-1 text-xs font-black ${isActive ? "bg-white/15 text-white" : "bg-emerald-500/10 text-emerald-500"}`}>
                        {preset.target}x
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {showHistory && (
          <div
            className={`rounded-[2rem] border overflow-hidden ${
              isLightMode ? "bg-white border-slate-200" : "bg-slate-800/60 border-slate-700/80"
            }`}
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-700/20">
              <div>
                <h3 className="font-black">Saved sessions</h3>
                <p className={`text-xs font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>Last {history.length} dhikr sessions</p>
              </div>
              <button
                onClick={clearHistory}
                type="button"
                className="rounded-xl bg-red-500/10 text-red-500 p-2 active:scale-95 transition-all"
                aria-label="Clear tasbih history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-700/20">
              {history.length === 0 ? (
                <p className={`px-5 py-6 text-sm font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>
                  No saved sessions yet. Count dhikr, then tap Save.
                </p>
              ) : (
                history.slice(0, 12).map((item) => (
                  <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-sm">{item.title}</p>
                      <p className={`text-xs font-bold ${isLightMode ? "text-slate-500" : "text-slate-400"}`}>{formatTime(item.completedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-500">{item.count}x</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isLightMode ? "text-slate-400" : "text-slate-500"}`}>target {item.target}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <button
          onClick={increment}
          type="button"
          className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-950/40 flex items-center justify-center active:scale-95 transition-all hover:bg-emerald-500"
          aria-label="Quick increase tasbih count"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
