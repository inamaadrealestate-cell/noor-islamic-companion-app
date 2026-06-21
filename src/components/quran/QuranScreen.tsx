import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  BookOpen,
  Check,
  Copy,
  Loader2,
  Play,
  Search,
  Share2,
  Sliders,
  Tag,
  Trash2,
  AlertCircle,
  Minus,
  Plus,
} from 'lucide-react';
import { JUZ_LIST, SURAH_LIST } from '../../lib/surahData';
import { Bookmark, Storage, UserSettings } from '../../lib/supabase';

interface QuranScreenProps {
  currentSurah: number;
  currentAyah: number;
  isPlaying: boolean;
  onPlayAyah: (surah: number, ayah: number) => void;
  isLightMode: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

interface QuranApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

interface QuranApiSurahResponse {
  data?: {
    ayahs?: QuranApiAyah[];
  };
}

interface QuranFullApiSurah {
  number: number;
  ayahs: QuranApiAyah[];
}

interface QuranFullApiResponse {
  data?: {
    surahs?: QuranFullApiSurah[];
  };
}

interface AyahData {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
}

interface FullSearchAyah {
  surahNumber: number;
  ayahNumber: number;
  arabic: string;
  translation: string;
  surahEnglishName: string;
  surahArabicName: string;
}

interface DirectAyahJump {
  surahNumber: number;
  ayahNumber: number;
  label: string;
}

type ViewTab = 'surahs' | 'juz' | 'bookmarks' | 'search' | 'reading';
type DisplayMode = 'verse' | 'compact';

function getThemeClasses(isLightMode: boolean) {
  return {
    page: isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white',
    header: isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800',
    card: isLightMode ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-800/70 border-slate-700/80 text-white shadow-md',
    softCard: isLightMode ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300',
    muted: isLightMode ? 'text-slate-500' : 'text-slate-400',
    strongMuted: isLightMode ? 'text-slate-700' : 'text-slate-200',
    input: isLightMode ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500',
    hover: isLightMode ? 'hover:bg-slate-100' : 'hover:bg-slate-700/80',
  };
}

function isSameBookmark(bookmark: Bookmark, surah: number, ayah: number) {
  return bookmark.surah_number === surah && bookmark.ayah_number === ayah;
}

function getProgressPercent(ayah: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.round((ayah / total) * 100)));
}

function getJuzIndexForSurah(surahNumber: number) {
  let foundIndex = 1;
  for (const juz of JUZ_LIST) {
    if (juz.startSurah <= surahNumber) {
      foundIndex = juz.index;
    }
  }
  return foundIndex;
}


const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

function normalizeArabicText(value: string) {
  return value
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .trim();
}

function normalizeSearchText(value: string) {
  return normalizeArabicText(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function getSurahByNumber(number: number) {
  return SURAH_LIST.find((surah) => surah.number === number) || null;
}

function isValidAyahReference(surahNumber: number, ayahNumber: number) {
  const surah = getSurahByNumber(surahNumber);
  return Boolean(surah && ayahNumber >= 1 && ayahNumber <= surah.numberOfAyahs);
}

function parseDirectAyahJump(rawQuery: string): DirectAyahJump | null {
  const query = normalizeSearchText(rawQuery);
  if (!query) return null;

  const numericMatch = query.match(/^(\d{1,3})\s*[:.\-/, ]\s*(\d{1,3})$/);
  if (numericMatch) {
    const surahNumber = Number(numericMatch[1]);
    const ayahNumber = Number(numericMatch[2]);
    const surah = getSurahByNumber(surahNumber);
    if (surah && isValidAyahReference(surahNumber, ayahNumber)) {
      return { surahNumber, ayahNumber, label: `${surah.englishName} ${surahNumber}:${ayahNumber}` };
    }
  }

  const trailingAyahMatch = query.match(/(.+?)\s+(\d{1,3})$/);
  if (trailingAyahMatch) {
    const surahQuery = trailingAyahMatch[1].trim();
    const ayahNumber = Number(trailingAyahMatch[2]);
    const surah = SURAH_LIST.find((item) => {
      const englishName = normalizeSearchText(item.englishName);
      const translation = normalizeSearchText(item.englishNameTranslation);
      const arabicName = normalizeSearchText(item.name);
      return englishName.includes(surahQuery) || surahQuery.includes(englishName) || translation.includes(surahQuery) || arabicName.includes(surahQuery);
    });
    if (surah && isValidAyahReference(surah.number, ayahNumber)) {
      return { surahNumber: surah.number, ayahNumber, label: `${surah.englishName} ${surah.number}:${ayahNumber}` };
    }
  }

  return null;
}

function searchFullQuran(ayahs: FullSearchAyah[], rawQuery: string) {
  const query = normalizeSearchText(rawQuery);
  if (query.length < 2) return [];

  const words = query.split(' ').filter(Boolean);

  return ayahs
    .map((ayah) => {
      const arabic = normalizeSearchText(ayah.arabic);
      const translation = normalizeSearchText(ayah.translation);
      const surahEnglish = normalizeSearchText(ayah.surahEnglishName);
      const surahArabic = normalizeSearchText(ayah.surahArabicName);
      const reference = `${ayah.surahNumber}:${ayah.ayahNumber}`;
      const searchable = `${arabic} ${translation} ${surahEnglish} ${surahArabic} ${reference}`;

      let score = 0;
      if (reference === query) score += 100;
      if (arabic.includes(query)) score += 70;
      if (translation.includes(query)) score += 55;
      if (surahEnglish.includes(query) || surahArabic.includes(query)) score += 25;
      score += words.every((word) => searchable.includes(word)) ? 15 : 0;
      score += words.reduce((total, word) => total + (searchable.includes(word) ? 2 : 0), 0);

      return { ayah, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.ayah.surahNumber - b.ayah.surahNumber || a.ayah.ayahNumber - b.ayah.ayahNumber)
    .slice(0, 80)
    .map((item) => item.ayah);
}

export default function QuranScreen({
  currentSurah,
  currentAyah,
  isPlaying,
  onPlayAyah,
  isLightMode,
  settings,
  onUpdateSettings,
}: QuranScreenProps) {
  const theme = getThemeClasses(isLightMode);
  const [viewTab, setViewTab] = useState<ViewTab>('surahs');
  const [activeSurah, setActiveSurah] = useState<number>(currentSurah || 1);
  const [targetAyah, setTargetAyah] = useState<number>(currentAyah || 1);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('verse');
  const [searchQuery, setSearchQuery] = useState('');
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAyah, setSelectedAyah] = useState<number | null>(currentAyah || null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(Storage.getBookmarks());
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [studyAyah, setStudyAyah] = useState<AyahData | null>(null);
  const [fullQuranAyahs, setFullQuranAyahs] = useState<FullSearchAyah[]>([]);
  const [fullQuranEdition, setFullQuranEdition] = useState(settings.translation_edition || 'en.sahih');
  const [fullSearchEnabled, setFullSearchEnabled] = useState(false);
  const [fullSearchLoading, setFullSearchLoading] = useState(false);
  const [fullSearchError, setFullSearchError] = useState('');
  const selectedAyahRef = useRef<HTMLDivElement | null>(null);

  const activeSurahMeta = SURAH_LIST.find((surah) => surah.number === activeSurah) || SURAH_LIST[0];
  const activeAyahTotal = activeSurahMeta.numberOfAyahs;

  const filteredSurahs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return SURAH_LIST;
    return SURAH_LIST.filter((surah) => {
      return (
        surah.englishName.toLowerCase().includes(query) ||
        surah.englishNameTranslation.toLowerCase().includes(query) ||
        surah.name.includes(searchQuery.trim()) ||
        String(surah.number).includes(query)
      );
    });
  }, [searchQuery]);

  const filteredCurrentAyahs = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return [];
    return ayahs.filter((ayah) => {
      const arabic = normalizeSearchText(ayah.text);
      const translation = normalizeSearchText(ayah.translation);
      return (
        arabic.includes(query) ||
        translation.includes(query) ||
        String(ayah.numberInSurah).includes(query) ||
        `${activeSurah}:${ayah.numberInSurah}`.includes(query)
      );
    });
  }, [activeSurah, ayahs, searchQuery]);

  const filteredJuz = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return JUZ_LIST;
    return JUZ_LIST.filter((juz) => {
      const startSurah = getSurahByNumber(juz.startSurah);
      return (
        String(juz.index).includes(query) ||
        normalizeSearchText(juz.name).includes(query) ||
        normalizeSearchText(startSurah?.englishName || '').includes(query) ||
        normalizeSearchText(startSurah?.name || '').includes(query)
      );
    });
  }, [searchQuery]);

  const directJump = useMemo(() => parseDirectAyahJump(searchQuery), [searchQuery]);

  const fullSearchResults = useMemo(() => {
    if (!fullSearchEnabled || fullQuranEdition !== (settings.translation_edition || 'en.sahih')) return [];
    return searchFullQuran(fullQuranAyahs, searchQuery);
  }, [fullQuranAyahs, fullQuranEdition, fullSearchEnabled, searchQuery, settings.translation_edition]);

  useEffect(() => {
    if (isPlaying && currentSurah) {
      setActiveSurah(currentSurah);
      setTargetAyah(currentAyah || 1);
      setSelectedAyah(currentAyah || 1);
      setViewTab('reading');
    }
  }, [currentSurah, currentAyah, isPlaying]);

  useEffect(() => {
    setFullSearchEnabled(false);
    setFullSearchError('');
  }, [settings.translation_edition]);

  useEffect(() => {
    if (viewTab !== 'reading') return;

    const controller = new AbortController();
    const loadSurah = async () => {
      setLoading(true);
      setError('');
      const translationEdition = settings.translation_edition || 'en.sahih';

      try {
        const [arabicResponse, translationResponse] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${activeSurah}`, { signal: controller.signal }),
          fetch(`https://api.alquran.cloud/v1/surah/${activeSurah}/${translationEdition}`, { signal: controller.signal }),
        ]);

        if (!arabicResponse.ok || !translationResponse.ok) {
          throw new Error('The Quran service did not respond correctly.');
        }

        const [arabicJson, translationJson] = (await Promise.all([
          arabicResponse.json(),
          translationResponse.json(),
        ])) as [QuranApiSurahResponse, QuranApiSurahResponse];

        const arabicAyahs = arabicJson.data?.ayahs || [];
        const translationAyahs = translationJson.data?.ayahs || [];

        if (!arabicAyahs.length) {
          throw new Error('No ayahs were returned for this surah.');
        }

        const nextAyahs: AyahData[] = arabicAyahs.map((ayah, index) => ({
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: ayah.text,
          translation: translationAyahs[index]?.text || 'Translation unavailable for this ayah.',
        }));

        setAyahs(nextAyahs);
        setSelectedAyah(targetAyah || 1);

        Storage.saveProgress({
          surah_number: activeSurah,
          ayah_number: targetAyah || 1,
          page_number: activeSurahMeta.startPage,
          juz_number: getJuzIndexForSurah(activeSurah),
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setAyahs([]);
        setError(err instanceof Error ? err.message : 'Unable to load this surah. Check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadSurah();

    return () => controller.abort();
  }, [activeSurah, activeSurahMeta.startPage, settings.translation_edition, targetAyah, viewTab]);

  useEffect(() => {
    if (viewTab !== 'reading' || !selectedAyah) return;
    const scrollTimer = window.setTimeout(() => {
      selectedAyahRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => window.clearTimeout(scrollTimer);
  }, [selectedAyah, viewTab, ayahs.length]);

  const openSurah = (surah: number, ayah: number = 1) => {
    setActiveSurah(surah);
    setTargetAyah(ayah);
    setSelectedAyah(ayah);
    setViewTab('reading');
  };

  const handleSearchEntireQuran = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setFullSearchError('Type at least 2 letters or an ayah reference first.');
      return;
    }

    const edition = settings.translation_edition || 'en.sahih';
    setFullSearchError('');
    setFullSearchEnabled(true);

    if (fullQuranAyahs.length > 0 && fullQuranEdition === edition) return;

    setFullSearchLoading(true);
    try {
      const [arabicResponse, translationResponse] = await Promise.all([
        fetch('https://api.alquran.cloud/v1/quran/quran-uthmani'),
        fetch(`https://api.alquran.cloud/v1/quran/${edition}`),
      ]);

      if (!arabicResponse.ok || !translationResponse.ok) {
        throw new Error('The Quran search service did not respond correctly.');
      }

      const [arabicJson, translationJson] = (await Promise.all([
        arabicResponse.json(),
        translationResponse.json(),
      ])) as [QuranFullApiResponse, QuranFullApiResponse];

      const arabicSurahs = arabicJson.data?.surahs || [];
      const translationSurahs = translationJson.data?.surahs || [];

      if (!arabicSurahs.length) {
        throw new Error('Full Quran search data could not be loaded.');
      }

      const translationBySurah = new Map<number, QuranApiAyah[]>();
      translationSurahs.forEach((surah) => translationBySurah.set(surah.number, surah.ayahs || []));

      const nextFullAyahs: FullSearchAyah[] = arabicSurahs.flatMap((surah) => {
        const meta = getSurahByNumber(surah.number);
        const translations = translationBySurah.get(surah.number) || [];
        return (surah.ayahs || []).map((ayah, index) => ({
          surahNumber: surah.number,
          ayahNumber: ayah.numberInSurah,
          arabic: ayah.text,
          translation: translations[index]?.text || '',
          surahEnglishName: meta?.englishName || `Surah ${surah.number}`,
          surahArabicName: meta?.name || '',
        }));
      });

      setFullQuranAyahs(nextFullAyahs);
      setFullQuranEdition(edition);
    } catch (err) {
      setFullSearchError(err instanceof Error ? err.message : 'Unable to search the full Quran right now.');
    } finally {
      setFullSearchLoading(false);
    }
  };

  const handleSelectAyah = (ayahNumber: number) => {
    setSelectedAyah(ayahNumber);
    setTargetAyah(ayahNumber);
    Storage.saveProgress({
      surah_number: activeSurah,
      ayah_number: ayahNumber,
      page_number: activeSurahMeta.startPage,
      juz_number: getJuzIndexForSurah(activeSurah),
      updated_at: new Date().toISOString(),
    });
  };

  const handleAddBookmark = async (ayahNum: number) => {
    if (bookmarks.some((bookmark) => isSameBookmark(bookmark, activeSurah, ayahNum))) return;
    await Storage.addBookmark({
      surah_number: activeSurah,
      ayah_number: ayahNum,
      page_number: activeSurahMeta.startPage,
      note: `${activeSurahMeta.englishName} ${activeSurah}:${ayahNum}`,
    });
    setBookmarks(Storage.getBookmarks());
  };

  const handleRemoveBookmark = async (id: string) => {
    await Storage.removeBookmark(id);
    setBookmarks(Storage.getBookmarks());
  };

  const handleCopy = async (ayah: AyahData) => {
    const text = `${ayah.text}\n\n${ayah.translation}\n— Quran ${activeSurah}:${ayah.numberInSurah}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyah(ayah.numberInSurah);
      window.setTimeout(() => setCopiedAyah(null), 1800);
    } catch {
      setCopiedAyah(null);
    }
  };

  const handleShare = async (ayah: AyahData) => {
    const text = `${ayah.text}\n\n${ayah.translation}\n— Quran ${activeSurah}:${ayah.numberInSurah}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Quran ${activeSurah}:${ayah.numberInSurah}`, text });
        return;
      } catch {
        // Fall back to copy when sharing is cancelled or unsupported.
      }
    }
    await handleCopy(ayah);
  };

  const updateFontSize = (field: 'arabic_font_size' | 'translation_font_size', delta: number) => {
    const currentValue = settings[field];
    const nextValue = Math.min(field === 'arabic_font_size' ? 44 : 24, Math.max(field === 'arabic_font_size' ? 20 : 12, currentValue + delta));
    onUpdateSettings({ ...settings, [field]: nextValue });
  };

  const progressPercent = getProgressPercent(targetAyah || 1, activeAyahTotal);

  return (
    <div className={`max-w-lg mx-auto pb-32 min-h-screen ${theme.page}`}>
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 ${theme.header}`}>
        {viewTab === 'reading' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setViewTab('surahs')}
                className="flex items-center gap-2 min-w-0 font-bold text-sm active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{activeSurahMeta.englishName}</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDisplayMode((mode) => (mode === 'verse' ? 'compact' : 'verse'))}
                  className={`px-3 py-2 rounded-xl border text-xs font-extrabold transition-all ${displayMode === 'compact' ? 'bg-emerald-600 border-emerald-500 text-white' : theme.softCard}`}
                >
                  {displayMode === 'compact' ? 'Compact' : 'Verse'}
                </button>
                <button
                  onClick={() => setShowFontSettings((value) => !value)}
                  className={`p-2 rounded-xl border transition-all ${showFontSettings ? 'bg-emerald-600 border-emerald-500 text-white' : theme.softCard}`}
                  aria-label="Font settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Mushaf</h1>
              <p className={`text-[11px] font-semibold ${theme.muted}`}>Read, listen, bookmark, and continue safely</p>
            </div>
            <button
              onClick={() => setViewTab('search')}
              className={`p-2.5 rounded-xl border transition-all ${theme.softCard}`}
              aria-label="Search Quran"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}

        {viewTab !== 'reading' && (
          <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar text-xs font-bold">
            {(['surahs', 'juz', 'bookmarks', 'search'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setViewTab(tab)}
                className={`px-4 py-2 rounded-xl capitalize whitespace-nowrap transition-all ${viewTab === tab ? 'bg-emerald-600 text-white shadow' : theme.softCard}`}
              >
                {tab === 'juz' ? "Juz'" : tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {showFontSettings && viewTab === 'reading' && (
        <div className={`mx-4 mt-4 p-4 rounded-2xl border ${theme.card}`}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-extrabold">Reading controls</p>
              <p className={`text-xs ${theme.muted}`}>Your choices are saved in settings.</p>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, show_translation: !settings.show_translation })}
              className={`px-3 py-2 rounded-xl text-xs font-bold ${settings.show_translation ? 'bg-emerald-600 text-white' : theme.softCard}`}
            >
              Translation {settings.show_translation ? 'On' : 'Off'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-3 border ${theme.softCard}`}>
              <p className="text-xs font-bold mb-2">Arabic size</p>
              <div className="flex items-center justify-between">
                <button onClick={() => updateFontSize('arabic_font_size', -2)} className="p-2 rounded-lg bg-slate-700 text-white"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-extrabold">{settings.arabic_font_size}px</span>
                <button onClick={() => updateFontSize('arabic_font_size', 2)} className="p-2 rounded-lg bg-emerald-600 text-white"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div className={`rounded-2xl p-3 border ${theme.softCard}`}>
              <p className="text-xs font-bold mb-2">Translation size</p>
              <div className="flex items-center justify-between">
                <button onClick={() => updateFontSize('translation_font_size', -1)} className="p-2 rounded-lg bg-slate-700 text-white"><Minus className="w-4 h-4" /></button>
                <span className="text-sm font-extrabold">{settings.translation_font_size}px</span>
                <button onClick={() => updateFontSize('translation_font_size', 1)} className="p-2 rounded-lg bg-emerald-600 text-white"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-4">
        {viewTab === 'surahs' && (
          <div className="space-y-3">
            <div className={`p-5 rounded-3xl border bg-gradient-to-br ${isLightMode ? 'from-emerald-50 to-white border-emerald-100' : 'from-emerald-950/70 to-slate-800 border-emerald-800/50'}`}>
              <p className="text-xs uppercase tracking-widest font-extrabold text-emerald-500 mb-2">Continue Reading</p>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold truncate">{activeSurahMeta.englishName}</h2>
                  <p className={`text-sm ${theme.muted}`}>Ayah {targetAyah || 1} • Page {activeSurahMeta.startPage}</p>
                </div>
                <button
                  onClick={() => openSurah(activeSurah, targetAyah || 1)}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow active:scale-95"
                >
                  Open
                </button>
              </div>
            </div>

            {filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => openSurah(surah.number, 1)}
                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.99] ${theme.card} ${theme.hover}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-600/15 text-emerald-500 flex items-center justify-center font-extrabold text-sm">
                      {surah.number}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold truncate">{surah.englishName}</p>
                      <p className={`text-xs truncate ${theme.muted}`}>{surah.englishNameTranslation} • {surah.numberOfAyahs} ayahs</p>
                    </div>
                  </div>
                  <p className="text-2xl font-quran text-emerald-500 text-right">{surah.name}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {viewTab === 'juz' && (
          <div className="space-y-3">
            {JUZ_LIST.map((juz) => (
              <button
                key={juz.index}
                onClick={() => openSurah(juz.startSurah, juz.startAyah)}
                className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.99] ${theme.card} ${theme.hover}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold">Juz' {juz.index}</p>
                    <p className={`text-xs ${theme.muted}`}>{juz.name}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl">Page {juz.startPage}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {viewTab === 'bookmarks' && (
          <div className="space-y-3">
            {bookmarks.length === 0 ? (
              <div className={`p-8 rounded-3xl border text-center ${theme.card}`}>
                <BookmarkIcon className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                <p className="font-extrabold">No bookmarks yet</p>
                <p className={`text-sm mt-1 ${theme.muted}`}>Open any surah and save ayahs you want to return to.</p>
              </div>
            ) : (
              bookmarks.map((bookmark) => {
                const surah = SURAH_LIST.find((item) => item.number === bookmark.surah_number) || SURAH_LIST[0];
                return (
                  <div key={bookmark.id} className={`p-4 rounded-2xl border ${theme.card}`}>
                    <div className="flex items-center justify-between gap-3">
                      <button onClick={() => openSurah(bookmark.surah_number, bookmark.ayah_number)} className="text-left min-w-0 flex-1">
                        <p className="font-extrabold truncate">{surah.englishName} {bookmark.surah_number}:{bookmark.ayah_number}</p>
                        <p className={`text-xs truncate ${theme.muted}`}>{bookmark.note || 'Saved ayah'} • Page {bookmark.page_number}</p>
                      </button>
                      <button onClick={() => handleRemoveBookmark(bookmark.id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-500 active:scale-95" aria-label="Remove bookmark">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {viewTab === 'search' && (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border ${theme.card}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-extrabold text-emerald-500">Quran Smart Search</p>
                  <h2 className="text-2xl font-extrabold mt-1">Find Surah, Juz, or Ayah</h2>
                  <p className={`text-sm mt-1 ${theme.muted}`}>Try “2:255”, “Al-Kahf 10”, “الكرسي”, “mercy”, or “Juz 30”.</p>
                </div>
                <Search className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              </div>
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${theme.muted}`} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search Arabic, translation, surah, juz, or 2:255"
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500/30 ${theme.input}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={handleSearchEntireQuran}
                  disabled={fullSearchLoading || searchQuery.trim().length < 2}
                  className="py-3 rounded-2xl bg-emerald-600 disabled:opacity-50 text-white text-xs font-extrabold active:scale-95"
                >
                  {fullSearchLoading ? 'Searching...' : 'Search Full Quran'}
                </button>
                <button
                  onClick={() => { setSearchQuery(''); setFullSearchEnabled(false); setFullSearchError(''); }}
                  className={`py-3 rounded-2xl border text-xs font-extrabold active:scale-95 ${theme.softCard}`}
                >
                  Clear Search
                </button>
              </div>
            </div>

            {directJump && (
              <button
                onClick={() => openSurah(directJump.surahNumber, directJump.ayahNumber)}
                className="w-full p-4 rounded-2xl bg-emerald-600 text-white text-left shadow-lg active:scale-[0.99]"
              >
                <p className="text-xs uppercase tracking-widest font-extrabold text-emerald-100">Direct ayah jump</p>
                <p className="text-lg font-extrabold mt-1">Open {directJump.label}</p>
              </button>
            )}

            {fullSearchError && (
              <div className={`p-4 rounded-2xl border ${isLightMode ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/30 border-amber-700/50 text-amber-200'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{fullSearchError}</p>
                </div>
              </div>
            )}

            {fullSearchLoading && (
              <div className={`p-6 rounded-3xl border text-center ${theme.card}`}>
                <Loader2 className="w-9 h-9 mx-auto text-emerald-500 animate-spin mb-3" />
                <p className="font-extrabold">Loading full Quran search index...</p>
                <p className={`text-sm mt-1 ${theme.muted}`}>This may take a moment the first time.</p>
              </div>
            )}

            {fullSearchEnabled && !fullSearchLoading && fullSearchResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Full Quran ayah matches</p>
                  <span className={`text-[11px] font-bold ${theme.muted}`}>{fullSearchResults.length} shown</span>
                </div>
                {fullSearchResults.map((ayah) => (
                  <button
                    key={`${ayah.surahNumber}:${ayah.ayahNumber}`}
                    onClick={() => openSurah(ayah.surahNumber, ayah.ayahNumber)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all active:scale-[0.99] ${theme.card} ${theme.hover}`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="font-extrabold truncate">{ayah.surahEnglishName} {ayah.surahNumber}:{ayah.ayahNumber}</p>
                        <p className={`text-xs truncate ${theme.muted}`}>Tap to open directly</p>
                      </div>
                      <span className="font-quran text-xl text-emerald-500">{ayah.surahArabicName}</span>
                    </div>
                    <p className="font-quran text-right text-gold leading-loose line-clamp-2" dir="rtl">{ayah.arabic}</p>
                    {ayah.translation && <p className={`text-xs mt-2 leading-relaxed line-clamp-2 ${theme.muted}`}>{ayah.translation}</p>}
                  </button>
                ))}
              </div>
            )}

            {fullSearchEnabled && !fullSearchLoading && searchQuery.trim().length >= 2 && fullQuranAyahs.length > 0 && fullSearchResults.length === 0 && (
              <div className={`p-6 rounded-3xl border text-center ${theme.card}`}>
                <p className="font-extrabold">No full Quran matches found</p>
                <p className={`text-sm mt-1 ${theme.muted}`}>Try a different spelling, Arabic without harakat, or a reference like 2:255.</p>
              </div>
            )}

            {filteredCurrentAyahs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Current loaded surah matches</p>
                {filteredCurrentAyahs.map((ayah) => (
                  <button key={ayah.number} onClick={() => openSurah(activeSurah, ayah.numberInSurah)} className={`w-full p-4 rounded-2xl border text-left ${theme.card} ${theme.hover}`}>
                    <p className="font-extrabold">{activeSurahMeta.englishName} {activeSurah}:{ayah.numberInSurah}</p>
                    <p className="font-quran text-right text-gold leading-loose line-clamp-2 mt-2" dir="rtl">{ayah.text}</p>
                    <p className={`text-xs line-clamp-2 mt-2 ${theme.muted}`}>{ayah.translation}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Surah matches</p>
              {filteredSurahs.length === 0 ? (
                <div className={`p-4 rounded-2xl border ${theme.softCard}`}>
                  <p className="text-sm">No surah name matches.</p>
                </div>
              ) : filteredSurahs.slice(0, searchQuery.trim() ? 25 : 114).map((surah) => (
                <button key={surah.number} onClick={() => openSurah(surah.number, 1)} className={`w-full p-4 rounded-2xl border text-left ${theme.card} ${theme.hover}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold">{surah.number}. {surah.englishName}</span>
                    <span className="font-quran text-xl text-emerald-500">{surah.name}</span>
                  </div>
                  <p className={`text-xs ${theme.muted}`}>{surah.englishNameTranslation} • {surah.numberOfAyahs} ayahs</p>
                </button>
              ))}
            </div>

            {searchQuery.trim() && (
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Juz matches</p>
                {filteredJuz.length === 0 ? (
                  <div className={`p-4 rounded-2xl border ${theme.softCard}`}>
                    <p className="text-sm">No Juz matches.</p>
                  </div>
                ) : filteredJuz.slice(0, 10).map((juz) => {
                  const startSurah = getSurahByNumber(juz.startSurah) || SURAH_LIST[0];
                  return (
                    <button key={juz.index} onClick={() => openSurah(juz.startSurah, juz.startAyah)} className={`w-full p-4 rounded-2xl border text-left ${theme.card} ${theme.hover}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-extrabold">Juz' {juz.index}</p>
                          <p className={`text-xs ${theme.muted}`}>{juz.name} • starts at {startSurah.englishName} {juz.startSurah}:{juz.startAyah}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl">Page {juz.startPage}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {viewTab === 'reading' && (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border ${theme.card}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-extrabold text-emerald-500">Surah {activeSurah}</p>
                  <h2 className="text-2xl font-extrabold">{activeSurahMeta.englishName}</h2>
                  <p className={`text-sm ${theme.muted}`}>{activeSurahMeta.englishNameTranslation} • {activeSurahMeta.revelationType}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-quran text-emerald-500">{activeSurahMeta.name}</p>
                  <p className={`text-xs font-bold ${theme.muted}`}>{activeAyahTotal} ayahs</p>
                </div>
              </div>
            </div>

            {loading && (
              <div className={`p-8 rounded-3xl border text-center ${theme.card}`}>
                <Loader2 className="w-9 h-9 mx-auto text-emerald-500 animate-spin mb-3" />
                <p className="font-bold">Loading Quran text and translation...</p>
              </div>
            )}

            {!loading && error && (
              <div className={`p-6 rounded-3xl border ${theme.card}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Unable to load this surah</p>
                    <p className={`text-sm mt-1 leading-relaxed ${theme.muted}`}>{error}</p>
                    <button onClick={() => openSurah(activeSurah, targetAyah)} className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm">Retry</button>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && ayahs.map((ayah) => {
              const isSelected = selectedAyah === ayah.numberInSurah;
              const isBookmarked = bookmarks.some((bookmark) => isSameBookmark(bookmark, activeSurah, ayah.numberInSurah));
              return (
                <div
                  key={ayah.number}
                  ref={isSelected ? selectedAyahRef : null}
                  onClick={() => handleSelectAyah(ayah.numberInSurah)}
                  className={`rounded-3xl border transition-all cursor-pointer ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''} ${theme.card}`}
                >
                  <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold">
                        {activeSurah}:{ayah.numberInSurah}
                      </span>
                      {isPlaying && currentSurah === activeSurah && currentAyah === ayah.numberInSurah && (
                        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">Playing</span>
                      )}
                    </div>
                    {isBookmarked && <BookmarkIcon className="w-5 h-5 text-emerald-500 fill-current" />}
                  </div>

                  <div className={displayMode === 'compact' ? 'p-4 space-y-3' : 'p-5 space-y-5'}>
                    <p
                      className="font-quran text-right text-gold leading-loose"
                      dir="rtl"
                      style={{ fontSize: `${settings.arabic_font_size}px` }}
                    >
                      {ayah.text}
                    </p>
                    {settings.show_translation && (
                      <p className={`leading-relaxed ${theme.strongMuted}`} style={{ fontSize: `${settings.translation_font_size}px` }}>
                        {ayah.translation}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      <button onClick={(event) => { event.stopPropagation(); onPlayAyah(activeSurah, ayah.numberInSurah); }} className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold active:scale-95">
                        <Play className="w-4 h-4 fill-current" /> Play
                      </button>
                      <button onClick={(event) => { event.stopPropagation(); handleAddBookmark(ayah.numberInSurah); }} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${isBookmarked ? 'bg-emerald-600/20 text-emerald-500' : theme.softCard}`}>
                        <BookmarkIcon className="w-4 h-4" /> {isBookmarked ? 'Saved' : 'Bookmark'}
                      </button>
                      <button onClick={(event) => { event.stopPropagation(); handleCopy(ayah); }} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${theme.softCard}`}>
                        {copiedAyah === ayah.numberInSurah ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />} {copiedAyah === ayah.numberInSurah ? 'Copied' : 'Copy'}
                      </button>
                      <button onClick={(event) => { event.stopPropagation(); handleShare(ayah); }} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${theme.softCard}`}>
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button onClick={(event) => { event.stopPropagation(); setStudyAyah(ayah); }} className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold active:scale-95 ${theme.softCard}`}>
                        <BookOpen className="w-4 h-4 text-amber-500" /> Study
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {studyAyah && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border ${isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'}`}>
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <span className="font-extrabold">Study note</span>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl">{activeSurah}:{studyAyah.numberInSurah}</span>
            </div>
            <p className="font-quran text-right text-gold leading-loose" dir="rtl" style={{ fontSize: `${Math.max(settings.arabic_font_size, 30)}px` }}>
              {studyAyah.text}
            </p>
            <p className={`text-sm leading-relaxed ${theme.muted}`}>
              A verified tafsir source is not bundled in this version yet. To avoid showing incorrect religious explanation, this app currently displays only the Quran text and selected translation here.
            </p>
            <p className={`text-sm leading-relaxed ${theme.strongMuted}`}>{studyAyah.translation}</p>
            <button onClick={() => setStudyAyah(null)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all active:scale-95">
              Close
            </button>
          </div>
        </div>
      )}

      {viewTab === 'reading' && (
        <div className="fixed bottom-32 right-4 z-40">
          <button
            onClick={() => setStudyAyah(ayahs.find((ayah) => ayah.numberInSurah === selectedAyah) || null)}
            disabled={!selectedAyah || ayahs.length === 0}
            className="w-12 h-12 rounded-2xl bg-emerald-600 text-white shadow-lg flex items-center justify-center disabled:opacity-50 active:scale-95"
            aria-label="Open selected ayah study note"
          >
            <Tag className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
