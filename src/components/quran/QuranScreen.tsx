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

interface AyahData {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
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
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return ayahs.filter((ayah) => {
      return (
        ayah.text.includes(searchQuery.trim()) ||
        ayah.translation.toLowerCase().includes(query) ||
        String(ayah.numberInSurah).includes(query)
      );
    });
  }, [ayahs, searchQuery]);

  useEffect(() => {
    if (isPlaying && currentSurah) {
      setActiveSurah(currentSurah);
      setTargetAyah(currentAyah || 1);
      setSelectedAyah(currentAyah || 1);
      setViewTab('reading');
    }
  }, [currentSurah, currentAyah, isPlaying]);

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
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${theme.muted}`} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search surah name, number, Arabic name, or loaded ayahs"
                className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500/30 ${theme.input}`}
              />
            </div>
            <div className={`p-4 rounded-2xl border ${theme.softCard}`}>
              <p className="text-xs leading-relaxed">
                Search covers surah names immediately. Ayah text search works for the currently loaded surah after you open it once.
              </p>
            </div>
            {filteredCurrentAyahs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Loaded ayah matches</p>
                {filteredCurrentAyahs.map((ayah) => (
                  <button key={ayah.number} onClick={() => openSurah(activeSurah, ayah.numberInSurah)} className={`w-full p-4 rounded-2xl border text-left ${theme.card}`}>
                    <p className="font-extrabold">{activeSurahMeta.englishName} {activeSurah}:{ayah.numberInSurah}</p>
                    <p className={`text-xs line-clamp-2 ${theme.muted}`}>{ayah.translation}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">Surah matches</p>
              {filteredSurahs.map((surah) => (
                <button key={surah.number} onClick={() => openSurah(surah.number, 1)} className={`w-full p-4 rounded-2xl border text-left ${theme.card}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold">{surah.number}. {surah.englishName}</span>
                    <span className="font-quran text-xl text-emerald-500">{surah.name}</span>
                  </div>
                  <p className={`text-xs ${theme.muted}`}>{surah.englishNameTranslation}</p>
                </button>
              ))}
            </div>
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
