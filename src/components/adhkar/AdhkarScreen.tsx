import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  AlertCircle,
  Bell,
  BookOpen,
  Building,
  Check,
  CheckCircle,
  Copy,
  Flame,
  Heart,
  Home,
  Moon,
  Plane,
  RotateCcw,
  Search,
  Share2,
  Shield,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Users,
  Utensils,
} from 'lucide-react';
import { ADHKAR_CATEGORIES, DUAS_LIST, type DhikrCategory, type DhikrItem, type DuaItem } from '../../lib/adhkarData';
import { Storage } from '../../lib/supabase';
import { getAdhkarReminderSettings, requestPrayerNotificationPermission, saveAdhkarReminderSettings, type NoorAdhkarReminderSettings } from '../../lib/pwa';

interface AdhkarScreenProps {
  isLightMode: boolean;
}

type IconComponent = ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, IconComponent> = {
  sunrise: Sunrise,
  sunset: Sunset,
  'check-circle': CheckCircle,
  moon: Moon,
  sun: Sun,
  utensils: Utensils,
  plane: Plane,
  home: Home,
  building: Building,
  'alert-circle': AlertCircle,
  heart: Heart,
  shield: Shield,
  users: Users,
};

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateKey(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function hasAdhkarProgress(dateKey: string): boolean {
  const raw = localStorage.getItem(`noor_adhkar_${dateKey}`);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.values(parsed).some((value) => Number(value) > 0);
  } catch {
    return false;
  }
}

function calculateLocalStreak(): number {
  let streak = 0;

  for (let daysAgo = 0; daysAgo < 365; daysAgo += 1) {
    if (hasAdhkarProgress(getDateKey(daysAgo))) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getProgressPercent(count: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((count / target) * 100));
}

function getItemText(item: DhikrItem): string {
  return `${item.arabic}\n\n${item.transliteration}\n\n${item.translation}${item.source ? `\n\nSource: ${item.source}` : ''}`;
}

function getDuaText(dua: DuaItem): string {
  return `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}${dua.source ? `\n\nSource: ${dua.source}` : ''}`;
}

export default function AdhkarScreen({ isLightMode }: AdhkarScreenProps) {
  const [activeTab, setActiveTab] = useState<'adhkar' | 'duas'>('adhkar');
  const [selectedCategory, setSelectedCategory] = useState<string>('morning');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [reminderSettings, setReminderSettings] = useState<NoorAdhkarReminderSettings>(() => getAdhkarReminderSettings());
  const [streak, setStreak] = useState<number>(0);
  const [toast, setToast] = useState<string>('');

  const todayKey = getTodayKey();

  useEffect(() => {
    setCounts(Storage.getAdhkarProgress(todayKey));
    const savedReminderSettings = getAdhkarReminderSettings();
    setReminderSettings(savedReminderSettings);
    setNotificationsEnabled(savedReminderSettings.enabled || localStorage.getItem('noor_adhkar_notif') === 'true');
    setStreak(calculateLocalStreak());

    const handleReminderChange = () => {
      const nextReminderSettings = getAdhkarReminderSettings();
      setReminderSettings(nextReminderSettings);
      setNotificationsEnabled(nextReminderSettings.enabled);
    };

    window.addEventListener('noor-adhkar-reminders-changed', handleReminderChange);
    return () => window.removeEventListener('noor-adhkar-reminders-changed', handleReminderChange);
  }, [todayKey]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const currentCategory: DhikrCategory = useMemo(() => {
    return ADHKAR_CATEGORIES.find((category) => category.id === selectedCategory) || ADHKAR_CATEGORIES[0];
  }, [selectedCategory]);

  const filteredDuas: DuaItem[] = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return DUAS_LIST;

    return DUAS_LIST.filter((dua) => {
      return (
        dua.title.toLowerCase().includes(query) ||
        dua.category.toLowerCase().includes(query) ||
        dua.translation.toLowerCase().includes(query) ||
        dua.transliteration.toLowerCase().includes(query) ||
        dua.arabic.includes(searchQuery)
      );
    });
  }, [searchQuery]);

  const categoryStats = useMemo(() => {
    const completed = currentCategory.items.filter((item) => (counts[item.id] || 0) >= item.repetitions).length;
    const total = currentCategory.items.length;
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [counts, currentCategory]);

  const dailyStats = useMemo(() => {
    const allItems = ADHKAR_CATEGORIES.flatMap((category) => category.items);
    const completed = allItems.filter((item) => (counts[item.id] || 0) >= item.repetitions).length;
    return {
      completed,
      total: allItems.length,
      touched: Object.values(counts).filter((value) => value > 0).length,
    };
  }, [counts]);

  const handleIncrement = (item: DhikrItem, categoryId: string) => {
    const current = counts[item.id] || 0;
    if (current >= item.repetitions) {
      showToast('Already completed for today');
      return;
    }

    const next = current + 1;
    setCounts((previous) => ({ ...previous, [item.id]: next }));
    Storage.saveAdhkarProgress(todayKey, item.id, next, item.repetitions, categoryId);

    if (next >= item.repetitions) {
      setStreak(calculateLocalStreak());
      showToast('Dhikr completed');
    }
  };

  const handleCompleteItem = (item: DhikrItem, categoryId: string) => {
    setCounts((previous) => ({ ...previous, [item.id]: item.repetitions }));
    Storage.saveAdhkarProgress(todayKey, item.id, item.repetitions, item.repetitions, categoryId);
    setStreak(calculateLocalStreak());
    showToast('Marked as complete');
  };

  const handleResetItem = (item: DhikrItem, categoryId: string) => {
    setCounts((previous) => ({ ...previous, [item.id]: 0 }));
    Storage.saveAdhkarProgress(todayKey, item.id, 0, item.repetitions, categoryId);
    showToast('Counter reset');
  };

  const handleResetCategory = () => {
    const nextCounts = { ...counts };
    currentCategory.items.forEach((item) => {
      nextCounts[item.id] = 0;
      Storage.saveAdhkarProgress(todayKey, item.id, 0, item.repetitions, currentCategory.id);
    });
    setCounts(nextCounts);
    showToast('Category reset');
  };

  const handleCompleteCategory = () => {
    const nextCounts = { ...counts };
    currentCategory.items.forEach((item) => {
      nextCounts[item.id] = item.repetitions;
      Storage.saveAdhkarProgress(todayKey, item.id, item.repetitions, item.repetitions, currentCategory.id);
    });
    setCounts(nextCounts);
    setStreak(calculateLocalStreak());
    showToast('Category completed');
  };

  const toggleNotifications = async () => {
    const next = !reminderSettings.enabled;

    if (next) {
      const result = await requestPrayerNotificationPermission();
      if (result.status !== 'granted') {
        showToast(result.message);
        return;
      }
    }

    const updatedSettings = { ...reminderSettings, enabled: next };
    setReminderSettings(updatedSettings);
    saveAdhkarReminderSettings(updatedSettings);
    setNotificationsEnabled(next);
    localStorage.setItem('noor_adhkar_notif', String(next));
    showToast(next ? 'Adhkar reminders enabled' : 'Adhkar reminders turned off');
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied');
    } catch {
      showToast('Copy not available on this device');
    }
  };

  const shareText = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        return;
      }
    }

    await copyText(text);
  };

  const pageBg = isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white';
  const stickyBg = isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800';
  const cardBg = isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md';
  const mutedText = isLightMode ? 'text-slate-600' : 'text-slate-400';
  const strongText = isLightMode ? 'text-slate-900' : 'text-white';
  const softPanel = isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/60 border-slate-700/80';
  const inputBg = isLightMode ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500';

  return (
    <div className={`max-w-lg mx-auto pb-32 min-h-screen ${pageBg}`}>
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 ${stickyBg}`}>
        <div>
          <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Adhkar & Duas</h1>
          <p className={`text-[11px] font-semibold ${mutedText}`}>Daily remembrance tracker</p>
        </div>

        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-bold ${softPanel}`}>
          <button
            onClick={() => setActiveTab('adhkar')}
            className={`px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
              activeTab === 'adhkar' ? 'bg-emerald-600 text-white shadow' : `${mutedText} hover:text-emerald-500`
            }`}
          >
            Adhkar
          </button>
          <button
            onClick={() => setActiveTab('duas')}
            className={`px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
              activeTab === 'duas' ? 'bg-emerald-600 text-white shadow' : `${mutedText} hover:text-emerald-500`
            }`}
          >
            Duas
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="px-4 py-5 space-y-6">
        <div className={`overflow-hidden rounded-3xl border shadow-xl ${isLightMode ? 'bg-white border-emerald-100' : 'bg-slate-800 border-emerald-900/40'}`}>
          <div className="bg-gradient-to-r from-emerald-700 to-slate-900 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg">
                  <Flame className="h-6 w-6 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Today&apos;s progress</p>
                  <h2 className="text-2xl font-black">{dailyStats.completed}/{dailyStats.total}</h2>
                </div>
              </div>

              <button
                onClick={toggleNotifications}
                className={`rounded-2xl border p-3 transition-all active:scale-95 ${
                  notificationsEnabled
                    ? 'border-emerald-300 bg-emerald-500 text-white shadow-lg'
                    : 'border-white/20 bg-white/10 text-emerald-100 hover:bg-white/15'
                }`}
                title={notificationsEnabled ? 'Adhkar reminders enabled' : 'Enable adhkar reminders'}
              >
                <Bell className={`h-5 w-5 ${notificationsEnabled ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <Sparkles className="mx-auto mb-1 h-4 w-4 text-amber-300" />
                <p className="text-lg font-black">{streak}</p>
                <p className="text-[10px] font-bold uppercase text-emerald-100">Day streak</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <Target className="mx-auto mb-1 h-4 w-4 text-emerald-200" />
                <p className="text-lg font-black">{dailyStats.touched}</p>
                <p className="text-[10px] font-bold uppercase text-emerald-100">Started</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <BookOpen className="mx-auto mb-1 h-4 w-4 text-emerald-200" />
                <p className="text-lg font-black">{ADHKAR_CATEGORIES.length}</p>
                <p className="text-[10px] font-bold uppercase text-emerald-100">Categories</p>
              </div>
            </div>
          </div>

          <div className={`px-5 py-4 text-xs leading-relaxed ${mutedText}`}>
            Track your daily adhkar locally on this device. Reminders are {reminderSettings.enabled ? 'active' : 'off'} — morning {reminderSettings.morning.time}, evening {reminderSettings.evening.time}, and more times can be adjusted in Settings.
          </div>
        </div>

        {activeTab === 'adhkar' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {ADHKAR_CATEGORIES.map((category) => {
                const Icon = ICON_MAP[category.icon] || Sun;
                const isSelected = category.id === selectedCategory;
                const completedCount = category.items.filter((item) => (counts[item.id] || 0) >= item.repetitions).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex flex-shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all active:scale-95 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-950/30'
                        : `${softPanel} ${mutedText} hover:text-emerald-500`
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-extrabold tracking-wide">{category.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {completedCount}/{category.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`rounded-3xl border p-5 ${cardBg}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-arabic text-lg font-bold text-emerald-500">{currentCategory.arabic_name}</p>
                  <h2 className={`mt-1 text-lg font-black ${strongText}`}>{currentCategory.name}</h2>
                  <p className={`mt-1 text-xs leading-relaxed ${mutedText}`}>{currentCategory.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-500">{categoryStats.percent}%</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${mutedText}`}>Complete</p>
                </div>
              </div>

              <div className={`mt-4 h-2 overflow-hidden rounded-full ${isLightMode ? 'bg-slate-100' : 'bg-slate-700'}`}>
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${categoryStats.percent}%` }} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={handleCompleteCategory}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-lg shadow-emerald-950/20 active:scale-95"
                >
                  <Check className="h-4 w-4" /> Complete all
                </button>
                <button
                  onClick={handleResetCategory}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black active:scale-95 ${softPanel} ${mutedText}`}
                >
                  <RotateCcw className="h-4 w-4" /> Reset category
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {currentCategory.items.map((item) => {
                const count = counts[item.id] || 0;
                const isComplete = count >= item.repetitions;
                const progressPercent = getProgressPercent(count, item.repetitions);

                return (
                  <article
                    key={item.id}
                    className={`rounded-3xl border p-5 transition-all ${
                      isComplete
                        ? isLightMode
                          ? 'border-emerald-200 bg-emerald-50 shadow-sm'
                          : 'border-emerald-600/60 bg-emerald-950/30 shadow-xl'
                        : cardBg
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-xl border px-3 py-1 text-[11px] font-bold ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                        {item.source || 'Reference'}
                      </span>
                      <span className={`rounded-xl px-3 py-1 text-[11px] font-black ${isComplete ? 'bg-emerald-600 text-white' : 'bg-amber-500/10 text-amber-500'}`}>
                        {count}/{item.repetitions}
                      </span>
                    </div>

                    <p className="mt-5 text-right font-quran text-2xl font-bold leading-loose text-gold">
                      {item.arabic}
                    </p>

                    <p className={`mt-4 rounded-2xl border p-3 text-xs font-semibold italic leading-relaxed ${isLightMode ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-emerald-900/40 bg-emerald-950/30 text-emerald-300'}`}>
                      {item.transliteration}
                    </p>

                    <p className={`mt-4 text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      {item.translation}
                    </p>

                    {item.virtue && (
                      <p className={`mt-4 rounded-2xl border p-3 text-xs leading-relaxed ${isLightMode ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-amber-800/40 bg-amber-950/20 text-amber-200'}`}>
                        ⭐ {item.virtue}
                      </p>
                    )}

                    <div className={`mt-5 h-2 overflow-hidden rounded-full ${isLightMode ? 'bg-slate-100' : 'bg-slate-700'}`}>
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">
                      <button
                        onClick={() => handleIncrement(item, currentCategory.id)}
                        className={`rounded-2xl px-4 py-3 text-sm font-black transition-all active:scale-95 ${
                          isComplete ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        {isComplete ? 'Completed' : 'Tap to count'}
                      </button>
                      <button
                        onClick={() => handleResetItem(item, currentCategory.id)}
                        className={`rounded-2xl border p-3 transition-all active:scale-95 ${softPanel} ${mutedText}`}
                        title="Reset this dhikr"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCompleteItem(item, currentCategory.id)}
                        className="rounded-2xl bg-emerald-600 p-3 text-white transition-all active:scale-95"
                        title="Mark complete"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => copyText(getItemText(item))}
                        className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${softPanel} ${mutedText}`}
                      >
                        <Copy className="h-4 w-4" /> Copy
                      </button>
                      <button
                        onClick={() => shareText(item.translation, getItemText(item))}
                        className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 ${softPanel} ${mutedText}`}
                      >
                        <Share2 className="h-4 w-4" /> Share
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'duas' && (
          <div className="space-y-5">
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${inputBg}`}>
              <Search className="h-5 w-5 text-emerald-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search duas by title, situation, translation, or Arabic..."
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            </div>

            <div className={`rounded-3xl border p-4 ${cardBg}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className={`font-black ${strongText}`}>Daily Duas Library</h2>
                  <p className={`text-xs ${mutedText}`}>Search and share authentic daily supplications.</p>
                </div>
                <span className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-black text-white">
                  {filteredDuas.length}/{DUAS_LIST.length}
                </span>
              </div>
            </div>

            {filteredDuas.length === 0 ? (
              <div className={`rounded-3xl border p-8 text-center ${cardBg}`}>
                <Search className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                <h3 className={`font-black ${strongText}`}>No dua found</h3>
                <p className={`mt-1 text-sm ${mutedText}`}>Try searching words like travel, food, parents, forgiveness, anxiety, or rizq.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDuas.map((dua) => {
                  const Icon = ICON_MAP[dua.icon] || Heart;

                  return (
                    <article key={dua.id} className={`rounded-3xl border p-5 ${cardBg}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-2xl border p-3 ${isLightMode ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-emerald-900/50 bg-emerald-950/40 text-emerald-400'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className={`text-sm font-black ${strongText}`}>{dua.title}</h3>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${mutedText}`}>{dua.category}</p>
                          </div>
                        </div>
                        <span className={`rounded-xl border px-3 py-1 text-[11px] font-bold ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                          {dua.source || 'Reference'}
                        </span>
                      </div>

                      <p className="mt-5 text-right font-quran text-2xl font-bold leading-loose text-gold">
                        {dua.arabic}
                      </p>

                      <p className={`mt-4 rounded-2xl border p-3 text-xs font-semibold italic leading-relaxed ${isLightMode ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-emerald-900/40 bg-emerald-950/30 text-emerald-300'}`}>
                        {dua.transliteration}
                      </p>

                      <p className={`mt-4 text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                        {dua.translation}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => copyText(getDuaText(dua))}
                          className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition-all active:scale-95 ${softPanel} ${mutedText}`}
                        >
                          <Copy className="h-4 w-4" /> Copy
                        </button>
                        <button
                          onClick={() => shareText(dua.title, getDuaText(dua))}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-all active:scale-95"
                        >
                          <Share2 className="h-4 w-4" /> Share
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
