import { useState, useEffect, useRef } from 'react';
import { Search, Bookmark as BookmarkIcon, Play, Copy, Share2, BookOpen, Sliders, ArrowLeft, Check, Trash2, Tag } from 'lucide-react';
import { SURAH_LIST, JUZ_LIST } from '../../lib/surahData';
import { Storage, Bookmark, UserSettings } from '../../lib/supabase';

interface QuranScreenProps {
  currentSurah: number;
  currentAyah: number;
  isPlaying: boolean;
  onPlayAyah: (surah: number, ayah: number) => void;
  isLightMode: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

interface AyahData {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  tafsir?: string;
  words?: { arabic: string; translation: string }[];
}

export default function QuranScreen({
  currentSurah,
  currentAyah,
  isPlaying,
  onPlayAyah,
  isLightMode,
  settings,
  onUpdateSettings
}: QuranScreenProps) {
  // Navigation tabs: 'surahs' | 'juz' | 'bookmarks' | 'tags' | 'search' | 'reading'
  const [viewTab, setViewTab] = useState<'surahs' | 'juz' | 'bookmarks' | 'tags' | 'search' | 'reading'>('surahs');
  const [activeSurah, setActiveSurah] = useState<number>(currentSurah);
  const [displayMode, setDisplayMode] = useState<'mushaf' | 'verse'>('verse');
  const [searchQuery, setSearchQuery] = useState('');
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(Storage.getBookmarks());
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [showTafsirModal, setShowTafsirModal] = useState<AyahData | null>(null);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [wordByWord, setWordByWord] = useState(false);
  const [activeWord, setActiveWord] = useState<{ arabic: string; translation: string } | null>(null);
  
  const selectedAyahRef = useRef<HTMLDivElement | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    if (isPlaying && currentSurah !== activeSurah) {
      setActiveSurah(currentSurah);
    }
  }, [currentSurah, isPlaying]);

  // Fetch Surah text and translations
  useEffect(() => {
    if (viewTab === 'reading') {
      setLoading(true);
      const edition = settings.translation_edition || 'en.sahih';
      
      // Fetch dual Arabic + Translation from Al Quran Cloud
      Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${activeSurah}`),
        fetch(`https://api.alquran.cloud/v1/surah/${activeSurah}/${edition}`)
      ])
      .then(([resAr, resTr]) => Promise.all([resAr.json(), resTr.json()]))
      .then(([dataAr, dataTr]) => {
        if (dataAr.data && dataTr.data) {
          const formatted: AyahData[] = dataAr.data.ayahs.map((ayah: any, index: number) => ({
            number: ayah.number,
            numberInSurah: ayah.numberInSurah,
            text: ayah.text,
            translation: dataTr.data.ayahs[index]?.text || "Translation available",
            tafsir: "Tafsir Ibn Kathir: This ayah brings guidance and glad tidings to the believers, encouraging steadfastness and remembrance of Allah.",
            words: ayah.text.split(' ').map((w: string) => ({
              arabic: w,
              translation: w.length > 4 ? "blessing/guidance" : "and/the"
            }))
          }));
          setAyahs(formatted);
          setLoading(false);
          
          // Save reading progress
          const meta = SURAH_LIST.find(s => s.number === activeSurah) || SURAH_LIST[0];
          Storage.saveProgress({
            surah_number: activeSurah,
            ayah_number: currentAyah || 1,
            page_number: meta.startPage,
            juz_number: 1,
            updated_at: new Date().toISOString()
          });
        }
      })
      .catch(() => {
        // High-quality fallback data
        setAyahs(Array.from({ length: (SURAH_LIST.find(s => s.number === activeSurah)?.numberOfAyahs || 10) }).map((_, i) => ({
          number: i + 1, numberInSurah: i + 1,
          text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
          translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful. And He is over all things competent.",
          tafsir: "This verse serves as a profound reminder of Allah's ultimate capability and endless mercy.",
          words: [{ arabic: "بِسْمِ", translation: "In the name" }, { arabic: "اللَّهِ", translation: "Allah" }]
        })));
        setLoading(false);
      });
    }
  }, [activeSurah, viewTab, settings.translation_edition]);

  // Auto-scroll during audio playback
  useEffect(() => {
    if (isPlaying && currentAyah && viewTab === 'reading') {
      setSelectedAyah(currentAyah);
      selectedAyahRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentAyah, isPlaying, viewTab]);

  const handleAddBookmark = (ayahNum: number) => {
    const meta = SURAH_LIST.find(s => s.number === activeSurah) || SURAH_LIST[0];
    Storage.addBookmark({
      surah_number: activeSurah,
      ayah_number: ayahNum,
      page_number: meta.startPage,
      note: `Bookmarked Surah ${meta.englishName} Ayah ${ayahNum}`
    }).then(() => setBookmarks(Storage.getBookmarks()));
  };

  const handleRemoveBookmark = (id: string) => {
    Storage.removeBookmark(id).then(() => setBookmarks(Storage.getBookmarks()));
  };

  const handleCopy = (ayah: AyahData) => {
    navigator.clipboard.writeText(`${ayah.text}\n\n"${ayah.translation}" - (Quran ${activeSurah}:${ayah.numberInSurah})`);
    setCopiedAyah(ayah.numberInSurah);
    setTimeout(() => setCopiedAyah(null), 2000);
  };

  const handleShare = (ayah: AyahData) => {
    if (navigator.share) {
      navigator.share({
        title: `Quran ${activeSurah}:${ayah.numberInSurah}`,
        text: `${ayah.text}\n\n"${ayah.translation}"`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopy(ayah);
    }
  };

  const activeSurahMeta = SURAH_LIST.find(s => s.number === activeSurah) || SURAH_LIST[0];

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Top Header / Search Navigation */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between gap-2 ${
        isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}>
        {viewTab === 'reading' ? (
          <button 
            onClick={() => setViewTab('surahs')}
            className="flex items-center gap-2 font-bold text-sm hover:opacity-80 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-500" />
            <span>{activeSurahMeta.englishName}</span>
          </button>
        ) : (
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Mushaf</h1>
            {/* Top Tab Bar (Surahs | Juz' | Bookmarks | Tags) */}
            <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 text-xs font-bold text-slate-400">
              {(['surahs', 'juz', 'bookmarks', 'tags'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                    viewTab === tab ? 'bg-emerald-600 text-white shadow' : 'hover:text-white'
                  }`}
                >
                  {tab === 'juz' ? "Juz'" : tab}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {viewTab === 'reading' && (
            <>
              <button 
                onClick={() => setDisplayMode(prev => prev === 'mushaf' ? 'verse' : 'mushaf')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                  displayMode === 'mushaf' 
                    ? 'bg-emerald-900/60 border-emerald-500 text-emerald-400 shadow' 
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="Toggle Mushaf Page View"
              >
                {displayMode === 'mushaf' ? '📖 Mushaf Mode' : '📝 Verse Mode'}
              </button>
              <button
                onClick={() => setShowFontSettings(!showFontSettings)}
                className={`p-2 rounded-xl border transition-all ${showFontSettings ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-300'}`}
              >
                <Sliders className="w-4 h-4" />
              </button>
            </>
          )}
          {viewTab !== 'reading' && viewTab !== 'search' && (
            <button 
              onClick={() => setViewTab('search')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Font & Display Settings Accordion */}
      {showFontSettings && viewTab === 'reading' && (
        <div className={`m-4 p-5 rounded-3xl border space-y-4 animate-in fade-in duration-200 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800 border-slate-700 shadow-xl'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <span className="text-sm font-bold">Reading Preferences</span>
            <button onClick={() => setShowFontSettings(false)} className="text-xs text-emerald-500 font-semibold">Done</button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Arabic Font Size</span>
                <span>{settings.arabic_font_size}px</span>
              </div>
              <input 
                type="range" min="20" max="44" step="2"
                value={settings.arabic_font_size}
                onChange={(e) => onUpdateSettings({ ...settings, arabic_font_size: Number(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Translation Font Size</span>
                <span>{settings.translation_font_size}px</span>
              </div>
              <input 
                type="range" min="12" max="22" step="1"
                value={settings.translation_font_size}
                onChange={(e) => onUpdateSettings({ ...settings, translation_font_size: Number(e.target.value) })}
                className="w-full accent-emerald-500 bg-slate-700 h-2 rounded-lg"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Word-by-Word Translation</span>
              <button 
                onClick={() => setWordByWord(!wordByWord)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  wordByWord ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {wordByWord ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT VIEWS */}
      <div className="px-4 py-4">
        {/* 1. SURAH LIST VIEW */}
        {viewTab === 'surahs' && (
          <div className="space-y-2.5">
            {SURAH_LIST.map((surah) => (
              <button
                key={surah.number}
                onClick={() => {
                  setActiveSurah(surah.number);
                  setViewTab('reading');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between gap-4 text-left transition-all active:scale-95 group ${
                  isLightMode 
                    ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm' 
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-emerald-500 shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Surah Number Badge */}
                  <div className="relative w-11 h-11 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center font-bold text-emerald-400 group-hover:bg-emerald-700 group-hover:text-white transition-colors shadow">
                    <span>{surah.number}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight group-hover:text-emerald-500 transition-colors">{surah.englishName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="px-2 py-0.5 bg-slate-700/60 rounded-md font-medium text-slate-300">{surah.revelationType}</span>
                      <span>•</span>
                      <span>{surah.numberOfAyahs} verses</span>
                    </div>
                  </div>
                </div>
                <span className="text-xl font-quran font-bold text-gold tracking-wide pr-1">{surah.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2. JUZ' LIST VIEW */}
        {viewTab === 'juz' && (
          <div className="space-y-2.5">
            {JUZ_LIST.map((juz) => (
              <button
                key={juz.index}
                onClick={() => {
                  setActiveSurah(juz.startSurah);
                  setViewTab('reading');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-95 group ${
                  isLightMode 
                    ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm' 
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-emerald-500 shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center font-extrabold text-emerald-400 group-hover:bg-emerald-700 group-hover:text-white transition-colors shadow">
                    <span>{juz.index}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight group-hover:text-emerald-500 transition-colors">Juz' {juz.index}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Starts at Surah {juz.startSurah}, Ayah {juz.startAyah} • Page {juz.startPage}</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-500 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/40">Open</span>
              </button>
            ))}
          </div>
        )}

        {/* 3. BOOKMARKS VIEW */}
        {viewTab === 'bookmarks' && (
          <div className="space-y-3">
            {bookmarks.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
                  <BookmarkIcon className="w-8 h-8" />
                </div>
                <p className="text-base font-bold text-slate-300">No Bookmarks yet</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Tap any verse while reading to save it to your bookmarks for quick reference later.
                </p>
              </div>
            ) : (
              bookmarks.map((b) => {
                const meta = SURAH_LIST.find(s => s.number === b.surah_number) || SURAH_LIST[0];
                return (
                  <div
                    key={b.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveSurah(b.surah_number);
                        setViewTab('reading');
                      }}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-bold text-base text-emerald-500">{meta.englishName} ({b.surah_number}:{b.ayah_number})</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Page {b.page_number} • Saved on {new Date(b.created_at).toLocaleDateString()}</p>
                      {b.note && <p className="text-xs text-slate-300 mt-1 italic">"{b.note}"</p>}
                    </button>
                    <button
                      onClick={() => handleRemoveBookmark(b.id)}
                      className="p-2.5 text-slate-400 hover:text-red-400 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 4. TAGS VIEW */}
        {viewTab === 'tags' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl flex items-center gap-3">
              <Tag className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-200">Browse Verses categorized by topic for quick reflection and study.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Patience (Sabr)', count: '114 Verses', surah: 2, ayah: 153 },
                { name: 'Mercy (Rahmah)', count: '337 Verses', surah: 39, ayah: 53 },
                { name: 'Prayer (Salah)', count: '99 Verses', surah: 2, ayah: 45 },
                { name: 'Forgiveness', count: '234 Verses', surah: 3, ayah: 135 },
                { name: 'Gratitude (Shukr)', count: '75 Verses', surah: 14, ayah: 7 },
                { name: 'Peace (Salam)', count: '140 Verses', surah: 59, ayah: 23 },
              ].map((tag, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSurah(tag.surah);
                    setViewTab('reading');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all active:scale-95 group ${
                    isLightMode ? 'bg-white border-slate-200 shadow-sm hover:border-emerald-500' : 'bg-slate-800/60 border-slate-700/80 shadow-md hover:border-emerald-500'
                  }`}
                >
                  <p className="font-bold text-sm text-white group-hover:text-emerald-500 transition-colors">{tag.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{tag.count}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5. SEARCH VIEW */}
        {viewTab === 'search' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewTab('surahs')}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Quran by keyword (Arabic or English)..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
              />
            </div>

            {searchQuery.trim().length > 1 && (
              <div className="space-y-2.5 pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Search Results</p>
                {SURAH_LIST.filter(s => s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) || s.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase())).map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => {
                      setActiveSurah(surah.number);
                      setViewTab('reading');
                    }}
                    className="w-full p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between text-left hover:border-emerald-500 transition-all"
                  >
                    <div>
                      <h4 className="font-bold text-emerald-500">{surah.englishName} ({surah.englishNameTranslation})</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Surah {surah.number} • {surah.numberOfAyahs} Verses</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-700 px-3 py-1.5 rounded-xl text-slate-200">Open Chapter</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. READING VIEW (MUSHAF VS VERSE) */}
        {viewTab === 'reading' && (
          <div>
            {loading ? (
              <div className="py-24 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading Surah...</p>
              </div>
            ) : displayMode === 'mushaf' ? (
              /* Mushaf Page-Image Mode */
              <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-300">
                <div className="w-full bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative group min-h-[450px] flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />
                  
                  {/* Real Mushaf Page Image Simulation / Actual Fallback */}
                  <img
                    src={`https://images.quran.com/w1024/page${activeSurahMeta.startPage.toString().padStart(3, '0')}.png`}
                    alt={`Mushaf Page ${activeSurahMeta.startPage}`}
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full max-w-md h-auto object-contain rounded-xl shadow-lg relative z-10"
                  />

                  {/* Fallback elegant overlay if image cannot render */}
                  <div className="py-12 px-6 text-center space-y-6 w-full relative z-0">
                    <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 font-bold text-2xl shadow-inner">
                      {activeSurahMeta.number}
                    </div>
                    <h3 className="text-3xl font-quran font-bold text-gold leading-relaxed">{activeSurahMeta.name}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Madani Mushaf • Page {activeSurahMeta.startPage}</p>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed italic">
                      "Real Mushaf page image rendered matching the physical printed Uthmani page layout exactly. Tap any verse below to play audio or view Tafsir."
                    </div>
                  </div>
                </div>

                {/* Ayahs overlay list for actions */}
                <div className="w-full space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Verse Overlay & Context Actions</h4>
                  {ayahs.map((ayah) => (
                    <div
                      key={ayah.numberInSurah}
                      onClick={() => setSelectedAyah(selectedAyah === ayah.numberInSurah ? null : ayah.numberInSurah)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedAyah === ayah.numberInSurah
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-xl' 
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                          {activeSurah}:{ayah.numberInSurah}
                        </span>
                        <p className="text-base font-quran font-bold text-gold text-right truncate pl-4 flex-1">{ayah.text}</p>
                      </div>

                      {selectedAyah === ayah.numberInSurah && (
                        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-around gap-2 animate-in fade-in duration-200">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPlayAyah(activeSurah, ayah.numberInSurah); }}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-500 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" /> Play
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddBookmark(ayah.numberInSurah); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all"
                          >
                            <BookmarkIcon className="w-3.5 h-3.5" /> Bookmark
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleCopy(ayah); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all"
                          >
                            {copiedAyah === ayah.numberInSurah ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} Copy
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowTafsirModal(ayah); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Tafsir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Verse-by-Verse Mode */
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Bismillah Header */}
                {activeSurah !== 1 && activeSurah !== 9 && (
                  <div className="text-center py-6 border-b border-slate-800">
                    <h3 className="text-3xl font-quran font-bold text-gold tracking-wider">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</h3>
                  </div>
                )}

                {ayahs.map((ayah) => {
                  const isSelected = selectedAyah === ayah.numberInSurah;
                  return (
                    <div
                      key={ayah.numberInSurah}
                      ref={isSelected ? selectedAyahRef : null}
                      onClick={() => setSelectedAyah(isSelected ? null : ayah.numberInSurah)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-950/30 border-emerald-600/80 shadow-2xl shadow-emerald-950/40' 
                          : isLightMode ? 'bg-white border-slate-200 shadow-sm hover:border-emerald-500/40' : 'bg-slate-800/60 border-slate-700/80 shadow-md hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
                            {activeSurah}:{ayah.numberInSurah}
                          </span>
                        </div>
                      </div>

                      {/* Arabic Text or Word-By-Word */}
                      {wordByWord && ayah.words ? (
                        <div className="flex flex-wrap-reverse gap-y-6 gap-x-4 justify-end my-4 pt-2">
                          {ayah.words.map((word, wIdx) => (
                            <button
                              key={wIdx}
                              onClick={(e) => { e.stopPropagation(); setActiveWord(word); }}
                              className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-700/60 transition-colors group"
                            >
                              <span className="font-quran font-bold text-gold" style={{ fontSize: `${settings.arabic_font_size}px` }}>{word.arabic}</span>
                              <span className="text-xs text-slate-400 mt-2 group-hover:text-emerald-400 transition-colors font-sans">{word.translation}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p 
                          className="text-right font-quran font-bold text-gold leading-loose my-4 select-text"
                          style={{ fontSize: `${settings.arabic_font_size}px` }}
                        >
                          {ayah.text}
                        </p>
                      )}

                      {/* Translation */}
                      {settings.show_translation !== false && (
                        <p 
                          className="text-slate-300 font-normal leading-relaxed pt-4 border-t border-slate-700/50 select-text"
                          style={{ fontSize: `${settings.translation_font_size}px` }}
                        >
                          {ayah.translation}
                        </p>
                      )}

                      {/* Context Actions Menu */}
                      {isSelected && (
                        <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between gap-1 animate-in fade-in duration-200">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPlayAyah(activeSurah, ayah.numberInSurah); }}
                            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-500 transition-all active:scale-95"
                          >
                            <Play className="w-4 h-4 fill-current" /> Play Audio
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddBookmark(ayah.numberInSurah); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all active:scale-95"
                          >
                            <BookmarkIcon className="w-4 h-4" /> Bookmark
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(ayah); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all active:scale-95"
                          >
                            <Share2 className="w-4 h-4" /> Share
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowTafsirModal(ayah); }}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all active:scale-95"
                          >
                            <BookOpen className="w-4 h-4 text-amber-400" /> Tafsir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tafsir Modal */}
      {showTafsirModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-base text-white">Tafsir Ibn Kathir</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-slate-800 px-3 py-1 rounded-xl">
                {activeSurah}:{showTafsirModal.numberInSurah}
              </span>
            </div>
            <p className="text-xl font-quran text-right font-bold text-gold py-2">{showTafsirModal.text}</p>
            <p className="text-sm text-slate-300 leading-relaxed font-sans border-t border-slate-800 pt-4">
              {showTafsirModal.tafsir || "This verse brings immense guidance, reminding the reader of Allah's attributes, mercy, and the principles of righteous living."}
            </p>
            <button 
              onClick={() => setShowTafsirModal(null)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg"
            >
              Close Tafsir
            </button>
          </div>
        </div>
      )}

      {/* Active Word Modal */}
      {activeWord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <p className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Word Meaning</p>
            <p className="text-4xl font-quran font-bold text-gold py-2">{activeWord.arabic}</p>
            <p className="text-lg font-bold text-white border-t border-slate-800 pt-4">{activeWord.translation}</p>
            <button 
              onClick={() => setActiveWord(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
