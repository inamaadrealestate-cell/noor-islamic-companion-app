import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Heart,
  Music,
  Play,
  Repeat,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_PRAYER_LOCATION,
  fetchPrayerTimes,
  calculateNextPrayer,
  PrayerTimesData,
  NextPrayerInfo,
  readSavedPrayerLocation,
} from '../../lib/prayerTimes';
import { Storage, ReadingProgress } from '../../lib/supabase';
import { SURAH_LIST } from '../../lib/surahData';
import { ADHKAR_CATEGORIES, DUAS_LIST } from '../../lib/adhkarData';
import { RECITERS_LIST } from '../../lib/audioData';

interface HomeScreenProps {
  setActiveTab: (tab: string) => void;
  onContinueReading: (surah: number, ayah: number) => void;
  isLightMode: boolean;
}

type SearchResult = {
  id: string;
  type: 'Quran' | 'Dua' | 'Adhkar' | 'Reciter' | 'Tool';
  title: string;
  subtitle: string;
  actionLabel: string;
  action: () => void;
};

const VERSES_OF_DAY = [
  {
    surah: 1,
    ayah: 5,
    arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    translation: 'It is You we worship and You we ask for help.',
    surahName: 'Al-Fatihah',
  },
  {
    surah: 2,
    ayah: 286,
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    translation: 'Allah does not burden a soul beyond that it can bear.',
    surahName: 'Al-Baqarah',
  },
  {
    surah: 3,
    ayah: 139,
    arabic: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ إِنْ كُنْتُمْ مُؤْمِنِينَ',
    translation: 'So do not weaken and do not grieve, and you will be superior if you are true believers.',
    surahName: "Ali 'Imran",
  },
  {
    surah: 13,
    ayah: 28,
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    translation: 'Surely in the remembrance of Allah do hearts find comfort.',
    surahName: "Ar-Ra'd",
  },
  {
    surah: 29,
    ayah: 45,
    arabic: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
    translation: 'Indeed, prayer prohibits immorality and wrongdoing.',
    surahName: "Al-'Ankabut",
  },
  {
    surah: 33,
    ayah: 41,
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا',
    translation: 'O you who believe, remember Allah with much remembrance.',
    surahName: 'Al-Ahzab',
  },
  {
    surah: 39,
    ayah: 53,
    arabic: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
    translation: 'Do not despair of the mercy of Allah.',
    surahName: 'Az-Zumar',
  },
  {
    surah: 55,
    ayah: 60,
    arabic: 'هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ',
    translation: 'Is the reward for good anything but good?',
    surahName: 'Ar-Rahman',
  },
  {
    surah: 65,
    ayah: 3,
    arabic: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
    translation: 'And He will provide for him from where he does not expect.',
    surahName: 'At-Talaq',
  },
  {
    surah: 94,
    ayah: 5,
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'For indeed, with hardship comes ease.',
    surahName: 'Ash-Sharh',
  },
];

const TASBIH_PRESETS = [
  'SubhanAllah',
  'Alhamdulillah',
  'Allahu Akbar',
  'Astaghfirullah',
  'La ilaha illa Allah',
  'Salawat',
  'La hawla wa la quwwata illa billah',
];

const TOTAL_ADHKAR_ITEMS = ADHKAR_CATEGORIES.reduce((sum, category) => sum + category.items.length, 0);
const TOTAL_DUAS = DUAS_LIST.length;
const TOTAL_RECITERS = RECITERS_LIST.length;

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function contains(value: string | undefined, query: string): boolean {
  return normalize(value || '').includes(query);
}

export default function HomeScreen({ setActiveTab, onContinueReading, isLightMode }: HomeScreenProps) {
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [progress] = useState<ReadingProgress>(Storage.getProgress());
  const [verseOfDay, setVerseOfDay] = useState(VERSES_OF_DAY[0]);
  const [adhkarCompletedCount, setAdhkarCompletedCount] = useState(0);
  const [prayerLocationLabel, setPrayerLocationLabel] = useState<string>(DEFAULT_PRAYER_LOCATION.label);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
    const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
    setVerseOfDay(VERSES_OF_DAY[dayOfYear % VERSES_OF_DAY.length]);

    const savedLocation = readSavedPrayerLocation() || DEFAULT_PRAYER_LOCATION;
    setPrayerLocationLabel(savedLocation.label);

    fetchPrayerTimes(savedLocation.lat, savedLocation.lng).then(data => {
      setPrayerData(data);
      setNextPrayer(calculateNextPrayer(data.timings));
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const adhkarProg = Storage.getAdhkarProgress(todayStr);
    const completed = Object.values(adhkarProg).filter(count => count > 0).length;
    setAdhkarCompletedCount(completed);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerData) {
        setNextPrayer(calculateNextPrayer(prayerData.timings));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [prayerData]);

  const surahMeta = SURAH_LIST.find(s => s.number === progress.surah_number) || SURAH_LIST[0];
  const adhkarGoalText = `${adhkarCompletedCount} / ${TOTAL_ADHKAR_ITEMS}`;
  const arabicWeekday = prayerData?.date.hijri.weekday?.ar || '';
  const englishWeekday = prayerData?.date.gregorian.weekday?.en || '';
  const dateText = prayerData
    ? `${prayerData.date.hijri.date} • ${arabicWeekday} • ${englishWeekday}, ${prayerData.date.gregorian.date}`
    : 'Preparing today’s Islamic dashboard...';

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = normalize(searchQuery);
    if (query.length < 2) return [];

    const results: SearchResult[] = [];

    SURAH_LIST.forEach((surah) => {
      if (
        contains(surah.englishName, query) ||
        contains(surah.englishNameTranslation, query) ||
        contains(surah.name, query) ||
        String(surah.number) === query
      ) {
        results.push({
          id: `surah-${surah.number}`,
          type: 'Quran',
          title: `${surah.number}. ${surah.englishName}`,
          subtitle: `${surah.englishNameTranslation} • ${surah.numberOfAyahs} ayahs`,
          actionLabel: 'Read',
          action: () => onContinueReading(surah.number, 1),
        });
      }
    });

    ADHKAR_CATEGORIES.forEach((category) => {
      if (contains(category.name, query) || contains(category.arabic_name, query) || contains(category.description, query)) {
        results.push({
          id: `adhkar-category-${category.id}`,
          type: 'Adhkar',
          title: category.name,
          subtitle: `${category.items.length} items • ${category.description}`,
          actionLabel: 'Open',
          action: () => setActiveTab('adhkar'),
        });
      }

      category.items.slice(0, 6).forEach((item) => {
        if (
          contains(item.translation, query) ||
          contains(item.transliteration, query) ||
          contains(item.source, query) ||
          contains(item.arabic, query)
        ) {
          results.push({
            id: `adhkar-${item.id}`,
            type: 'Adhkar',
            title: category.name,
            subtitle: item.translation.length > 92 ? `${item.translation.slice(0, 92)}...` : item.translation,
            actionLabel: 'Open',
            action: () => setActiveTab('adhkar'),
          });
        }
      });
    });

    DUAS_LIST.forEach((dua) => {
      if (
        contains(dua.title, query) ||
        contains(dua.category, query) ||
        contains(dua.translation, query) ||
        contains(dua.transliteration, query) ||
        contains(dua.arabic, query)
      ) {
        results.push({
          id: `dua-${dua.id}`,
          type: 'Dua',
          title: dua.title,
          subtitle: `${dua.category} • ${dua.translation.length > 82 ? `${dua.translation.slice(0, 82)}...` : dua.translation}`,
          actionLabel: 'Open',
          action: () => setActiveTab('adhkar'),
        });
      }
    });

    RECITERS_LIST.forEach((reciter) => {
      if (contains(reciter.name, query) || contains(reciter.arabicName, query) || contains(reciter.style, query)) {
        results.push({
          id: `reciter-${reciter.id}`,
          type: 'Reciter',
          title: reciter.name,
          subtitle: `${reciter.arabicName} • ${reciter.style}`,
          actionLabel: 'Audio',
          action: () => setActiveTab('quran'),
        });
      }
    });

    TASBIH_PRESETS.forEach((preset) => {
      if (contains(preset, query)) {
        results.push({
          id: `tasbih-${preset}`,
          type: 'Tool',
          title: preset,
          subtitle: 'Open the Tasbih counter and start counting this dhikr.',
          actionLabel: 'Count',
          action: () => setActiveTab('tasbih'),
        });
      }
    });

    if (contains('salah prayer qibla compass settings tasbih quran adhkar duas reciters audio', query)) {
      [
        { id: 'tool-prayer', type: 'Tool' as const, title: 'Salah timings', subtitle: 'Open prayer times and adhan controls.', tab: 'prayer', actionLabel: 'Salah' },
        { id: 'tool-qibla', type: 'Tool' as const, title: 'Qibla compass', subtitle: 'Find direction to the Kaaba.', tab: 'qibla', actionLabel: 'Qibla' },
        { id: 'tool-tasbih', type: 'Tool' as const, title: 'Tasbih counter', subtitle: 'Open saved dhikr counter and session history.', tab: 'tasbih', actionLabel: 'Count' },
      ].forEach((tool) => {
        if (contains(`${tool.title} ${tool.subtitle}`, query)) {
          results.push({
            id: tool.id,
            type: tool.type,
            title: tool.title,
            subtitle: tool.subtitle,
            actionLabel: tool.actionLabel,
            action: () => setActiveTab(tool.tab),
          });
        }
      });
    }

    return results.slice(0, 14);
  }, [onContinueReading, searchQuery, setActiveTab]);

  const quickAccessItems = [
    { id: 'quran', label: 'Quran', icon: BookOpen, color: 'bg-emerald-600' },
    { id: 'prayer', label: 'Salah', icon: Clock, color: 'bg-purple-600' },
    { id: 'adhkar', label: 'Adhkar', icon: Heart, color: 'bg-amber-500' },
    { id: 'tasbih', label: 'Tasbih', icon: Repeat, color: 'bg-teal-600' },
    { id: 'qibla', label: 'Qibla', icon: Compass, color: 'bg-blue-600' },
  ];

  const libraryStats = [
    { label: 'Surahs', value: SURAH_LIST.length, tab: 'quran' },
    { label: 'Adhkar', value: TOTAL_ADHKAR_ITEMS, tab: 'adhkar' },
    { label: 'Duas', value: TOTAL_DUAS, tab: 'adhkar' },
    { label: 'Reciters', value: TOTAL_RECITERS, tab: 'quran' },
  ];

  const cardBg = isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md';
  const mutedText = isLightMode ? 'text-slate-600' : 'text-slate-400';
  const strongText = isLightMode ? 'text-slate-900' : 'text-white';
  const inputBg = isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white';

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-32 space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-black tracking-tight">As-salamu alaykum ✨</h1>
        <p className="text-xs font-semibold text-slate-400 leading-relaxed">{dateText}</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-950 p-6 text-white shadow-xl shadow-emerald-950/30 border border-emerald-600/30">
        <div className="absolute -top-6 -right-4 opacity-10 pointer-events-none">
          <span className="text-9xl font-serif">🕌</span>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-300">Upcoming Salah</span>
            <span className="text-xs px-2.5 py-1 bg-emerald-950/60 rounded-full text-emerald-300 font-bold border border-emerald-700/40">
              {nextPrayer?.time || '--:--'}
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">{nextPrayer?.name || 'Loading'}</h2>
            <p className="text-sm font-medium text-emerald-200/90 mt-1">
              {nextPrayer?.remainingText ? `${nextPrayer.remainingText} remaining` : 'Calculating your next prayer time...'}
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-700/50 flex items-center justify-between gap-3 text-xs text-slate-200">
            <span className="truncate">{prayerLocationLabel}</span>
            <button onClick={() => setActiveTab('prayer')} className="font-bold text-white hover:underline flex items-center gap-1 flex-shrink-0">
              View timings <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <section className={`rounded-3xl border p-4 ${cardBg}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className={`text-base font-black ${strongText}`}>Smart Search</h2>
            <p className={`text-xs ${mutedText}`}>Search Surahs, duas, adhkar, reciters, and tools.</p>
          </div>
          <Search className="h-5 w-5 text-emerald-500" />
        </div>

        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${inputBg}`}>
          <Search className="h-5 w-5 text-emerald-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Try Al-Kahf, travel, Ali Jaber, rizq, tasbih..."
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-700/20 hover:text-emerald-500"
              aria-label="Clear search"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {['Al-Kahf', 'travel', 'parents', 'Ali Jaber', 'tasbih'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setSearchQuery(suggestion)}
              className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                isLightMode ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-300' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-600'
              }`}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {searchQuery.trim().length >= 2 && (
          <div className="mt-4 space-y-2">
            {searchResults.length === 0 ? (
              <div className={`rounded-2xl border p-4 text-center ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-900/60'}`}>
                <p className={`text-sm font-black ${strongText}`}>No result found</p>
                <p className={`mt-1 text-xs ${mutedText}`}>Try a Surah name, dua topic, reciter name, or tool name.</p>
              </div>
            ) : (
              searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={result.action}
                  className={`w-full rounded-2xl border p-3 text-left transition-all active:scale-[0.99] ${
                    isLightMode ? 'border-slate-200 bg-slate-50 hover:border-emerald-300' : 'border-slate-700 bg-slate-900/60 hover:border-emerald-600'
                  }`}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                          {result.type}
                        </span>
                        <h3 className={`truncate text-sm font-black ${strongText}`}>{result.title}</h3>
                      </div>
                      <p className={`mt-1 line-clamp-2 text-xs leading-relaxed ${mutedText}`}>{result.subtitle}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white">
                      {result.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onContinueReading(progress.surah_number, progress.ayah_number)}
          className={`p-5 rounded-3xl text-left border transition-all active:scale-95 group flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm'
              : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 shadow-lg'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Continue Reading</p>
            <p className="text-base font-bold mt-1 text-emerald-500">{surahMeta.englishName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Ayah {progress.ayah_number} • Page {progress.page_number}</p>
          </div>
          <div className={`mt-4 flex items-center text-xs font-bold transition-colors ${isLightMode ? 'text-slate-500 group-hover:text-emerald-600' : 'text-slate-300 group-hover:text-emerald-500'}`}>
            Resume <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab('adhkar')}
          className={`p-5 rounded-3xl text-left border transition-all active:scale-95 group flex flex-col justify-between ${
            isLightMode
              ? 'bg-white border-slate-200 hover:border-amber-500 shadow-sm'
              : 'bg-slate-800/80 border-slate-700 hover:border-amber-500 shadow-lg'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Today’s Adhkar</p>
            <p className="text-base font-bold mt-1 text-amber-500">{adhkarGoalText}</p>
            <p className="text-xs text-slate-400 mt-0.5">Started today</p>
          </div>
          <div className={`mt-4 flex items-center text-xs font-bold transition-colors ${isLightMode ? 'text-slate-500 group-hover:text-amber-600' : 'text-slate-300 group-hover:text-amber-500'}`}>
            Open Adhkar <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      <div className={`rounded-3xl border p-4 ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase font-bold text-slate-400 tracking-widest">NoorQuran Library</h3>
          <span className="text-[11px] font-bold text-emerald-500">Expanded content</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {libraryStats.map(stat => (
            <button
              key={stat.label}
              onClick={() => setActiveTab(stat.tab)}
              className={`rounded-2xl p-3 text-center border active:scale-95 transition-all ${
                isLightMode ? 'bg-slate-50 border-slate-200 hover:border-emerald-400' : 'bg-slate-900/50 border-slate-700 hover:border-emerald-600'
              }`}
            >
              <p className="text-lg font-black text-emerald-500">{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold text-slate-400 tracking-widest">Quick Access</h3>
        <div className="grid grid-cols-5 gap-2">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all active:scale-95 hover:border-emerald-500 ${
                  isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg shadow-black/20`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`p-6 rounded-3xl border transition-all ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Verse of the Day</span>
          </div>
          <button
            onClick={() => onContinueReading(verseOfDay.surah, verseOfDay.ayah)}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95"
            aria-label="Read verse of the day"
          >
            <Play className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <p className="text-2xl text-right font-quran font-bold my-4 leading-loose text-gold">
          {verseOfDay.arabic}
        </p>
        <p className={`text-sm font-medium leading-relaxed italic mb-4 ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
          “{verseOfDay.translation}”
        </p>
        <div className={`flex items-center justify-between text-xs font-bold pt-3 border-t ${isLightMode ? 'border-slate-200 text-slate-500' : 'border-slate-700/60 text-slate-400'}`}>
          <span>{verseOfDay.surahName} ({verseOfDay.surah}:{verseOfDay.ayah})</span>
          <button
            onClick={() => onContinueReading(verseOfDay.surah, verseOfDay.ayah)}
            className="text-emerald-500 hover:underline"
          >
            Read Chapter
          </button>
        </div>
      </div>

      <div className={`rounded-3xl border p-4 ${isLightMode ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200'}`}>
        <div className="flex items-start gap-3">
          <Music className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-black">Large reciter library is ready</p>
            <p className="mt-1 text-xs leading-relaxed opacity-80">
              Use Smart Search for names like Ali Jaber, Ayyub, Matroud, Sudais, Husary, Minshawi, Shuraim, or Alafasy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
