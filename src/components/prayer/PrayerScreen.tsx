import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Copy, Globe, MapPin, Navigation, Search, Volume2 } from 'lucide-react';
import {
  ADHAN_AUDIO_URL,
  DEFAULT_PRAYER_LOCATION,
  MonthlyPrayerDay,
  PrayerLocation,
  PrayerTimesData,
  NextPrayerInfo,
  calculateNextPrayer,
  fetchMonthlyPrayerTimes,
  fetchPrayerTimes,
  getBrowserPrayerLocation,
  readSavedPrayerLocation,
  reverseGeocodePrayerLocation,
  savePrayerLocation,
  searchPrayerCityCoordinates,
} from '../../lib/prayerTimes';
import { UserSettings } from '../../lib/storage';

interface PrayerScreenProps {
  isLightMode: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

const METHODS = [
  { id: 4, name: 'Umm al-Qura University, Makkah' },
  { id: 3, name: 'Muslim World League (MWL)' },
  { id: 2, name: 'Islamic Society of North America (ISNA)' },
  { id: 5, name: 'Egyptian General Authority of Survey' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran' },
];

const PRAYER_ROWS = [
  { name: 'Fajr', key: 'Fajr', icon: '🌅', note: 'Dawn prayer' },
  { name: 'Sunrise', key: 'Sunrise', icon: '☀️', note: 'Sunrise time' },
  { name: 'Dhuhr / Jumuah', key: 'Dhuhr', icon: '🕌', note: 'Noon prayer' },
  { name: 'Asr', key: 'Asr', icon: '🌤️', note: 'Afternoon prayer' },
  { name: 'Maghrib', key: 'Maghrib', icon: '🌇', note: 'Sunset prayer' },
  { name: 'Isha', key: 'Isha', icon: '🌙', note: 'Night prayer' },
] as const;

const QUICK_LOCATIONS: PrayerLocation[] = [
  { lat: 9.0765, lng: 7.3986, label: 'Abuja, Nigeria', source: 'search' },
  { lat: 6.5244, lng: 3.3792, label: 'Lagos, Nigeria', source: 'search' },
  { lat: 11.9964, lng: 8.5167, label: 'Kano, Nigeria', source: 'search' },
  { lat: 10.5105, lng: 7.4165, label: 'Kaduna, Nigeria', source: 'search' },
  { lat: 11.8311, lng: 13.1510, label: 'Maiduguri, Nigeria', source: 'search' },
  { lat: 21.4225, lng: 39.8262, label: 'Makkah, Saudi Arabia', source: 'search' },
];

function getMonthTitle(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function isToday(day: MonthlyPrayerDay, monthCursor: Date): boolean {
  const now = new Date();
  return (
    now.getFullYear() === monthCursor.getFullYear() &&
    now.getMonth() === monthCursor.getMonth() &&
    now.getDate() === day.dayNumber
  );
}

export default function PrayerScreen({ isLightMode, settings, onUpdateSettings }: PrayerScreenProps) {
  const [location, setLocation] = useState<PrayerLocation>(() => readSavedPrayerLocation() || DEFAULT_PRAYER_LOCATION);
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [loadingTimes, setLoadingTimes] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<PrayerLocation[]>([]);
  const [error, setError] = useState<string>('');
  const [isAdhanPlaying, setIsAdhanPlaying] = useState<boolean>(false);
  const [adhanError, setAdhanError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'today' | 'month'>('today');
  const [monthCursor, setMonthCursor] = useState<Date>(() => new Date());
  const [monthlyDays, setMonthlyDays] = useState<MonthlyPrayerDay[]>([]);
  const [loadingMonth, setLoadingMonth] = useState<boolean>(false);
  const [monthCopied, setMonthCopied] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const textMain = isLightMode ? 'text-slate-900' : 'text-white';
  const textMuted = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const panelClass = isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md';
  const inputClass = isLightMode
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
    : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500';

  const monthTitle = useMemo(() => getMonthTitle(monthCursor), [monthCursor]);

  const loadTimings = useCallback(
    async (targetLocation: PrayerLocation) => {
      setLoadingTimes(true);
      setError('');

      try {
        const data = await fetchPrayerTimes(
          targetLocation.lat,
          targetLocation.lng,
          settings.calculation_method || 4
        );
        setPrayerData(data);
        setNextPrayer(calculateNextPrayer(data.timings));
      } catch {
        setError('Could not load fresh prayer times. Showing fallback timing instead.');
      } finally {
        setLoadingTimes(false);
      }
    },
    [settings.calculation_method]
  );

  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    setError('');

    const days = await fetchMonthlyPrayerTimes(
      location.lat,
      location.lng,
      settings.calculation_method || 4,
      monthCursor.getMonth() + 1,
      monthCursor.getFullYear()
    );

    if (days.length === 0) {
      setError('Monthly timetable could not load right now. Try again when online.');
    }

    setMonthlyDays(days);
    setLoadingMonth(false);
  }, [location.lat, location.lng, monthCursor, settings.calculation_method]);

  useEffect(() => {
    loadTimings(location);
  }, [location, loadTimings]);

  useEffect(() => {
    if (viewMode === 'month') {
      loadMonth();
    }
  }, [viewMode, loadMonth]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (prayerData) {
        setNextPrayer(calculateNextPrayer(prayerData.timings));
      }
    }, 30000);

    return () => window.clearInterval(interval);
  }, [prayerData]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const applyLocation = (nextLocation: PrayerLocation) => {
    savePrayerLocation(nextLocation);
    setLocation(nextLocation);
    setSearchOpen(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    setError('');

    try {
      const gps = await getBrowserPrayerLocation();
      const label = await reverseGeocodePrayerLocation(gps.lat, gps.lng);
      applyLocation({
        lat: gps.lat,
        lng: gps.lng,
        label,
        source: 'gps',
      });
    } catch {
      setSearchOpen(true);
      setError('Location permission was not available. Search your city below instead.');
    } finally {
      setLocating(false);
    }
  };

  const handleCitySearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError('');

    try {
      const results = await searchPrayerCityCoordinates(searchQuery);
      setSearchResults(
        results.map((result) => ({
          lat: result.lat,
          lng: result.lng,
          label: result.displayName,
          source: 'search',
        }))
      );

      if (results.length === 0) {
        setError('No city was found. Try adding the country name, for example: Abuja Nigeria.');
      }
    } catch {
      setError('City search failed. Check your internet connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const toggleAdhan = async () => {
    setAdhanError('');

    if (!audioRef.current) {
      audioRef.current = new Audio(ADHAN_AUDIO_URL);
      audioRef.current.onended = () => setIsAdhanPlaying(false);
      audioRef.current.onerror = () => {
        setIsAdhanPlaying(false);
        setAdhanError('Adhan audio could not load. Check your internet connection.');
      };
    }

    if (isAdhanPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAdhanPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsAdhanPlaying(true);
    } catch {
      setAdhanError('Browser blocked audio playback. Tap the Adhan button again.');
      setIsAdhanPlaying(false);
    }
  };

  const shiftMonth = (amount: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const copyMonthlyTimetable = async () => {
    if (monthlyDays.length === 0) return;

    const header = `NoorQuran Prayer Timetable - ${location.label} - ${monthTitle}`;
    const lines = monthlyDays.map((day) => {
      return `${day.gregorianDate} (${day.hijriWeekdayAr || day.gregorianWeekday}) | Fajr ${day.timings.Fajr} | Sunrise ${day.timings.Sunrise} | Dhuhr ${day.timings.Dhuhr} | Asr ${day.timings.Asr} | Maghrib ${day.timings.Maghrib} | Isha ${day.timings.Isha}`;
    });

    try {
      await navigator.clipboard.writeText([header, ...lines].join('\n'));
      setMonthCopied(true);
      window.setTimeout(() => setMonthCopied(false), 2000);
    } catch {
      setError('Could not copy timetable on this browser.');
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-32">
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
        isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <div>
          <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Salah Timings</h1>
          <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>Daily and monthly prayer timetable</p>
        </div>
        <button
          onClick={toggleAdhan}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            isAdhanPlaying
              ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse'
              : isLightMode
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{isAdhanPlaying ? 'Stop Adhan' : 'Play Adhan'}</span>
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {(error || adhanError) && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-950/40 border-amber-700/60 text-amber-100'
          }`}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">{error || adhanError}</p>
          </div>
        )}

        <div className={`p-1 rounded-2xl border grid grid-cols-2 gap-1 ${isLightMode ? 'bg-white border-slate-200' : 'bg-slate-800/70 border-slate-700'}`}>
          <button
            onClick={() => setViewMode('today')}
            className={`py-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${viewMode === 'today' ? 'bg-emerald-600 text-white shadow' : textMuted}`}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`py-3 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${viewMode === 'month' ? 'bg-emerald-600 text-white shadow' : textMuted}`}
          >
            Monthly Timetable
          </button>
        </div>

        <div className={`p-5 rounded-3xl border space-y-4 ${panelClass}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className={`font-extrabold text-sm ${textMain}`}>{location.label}</p>
                <p className={`text-xs mt-1 leading-relaxed ${textMuted}`}>
                  {location.source === 'gps' ? 'Using your device location' : location.source === 'search' ? 'Saved city location' : 'Default location until you choose yours'}
                </p>
              </div>
            </div>
            {(loadingTimes || loadingMonth) && <span className="text-[11px] font-bold text-emerald-500 animate-pulse">Loading...</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUseMyLocation}
              disabled={locating}
              className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Navigation className="w-4 h-4" />
              {locating ? 'Detecting...' : 'Use My Location'}
            </button>
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              className={`px-4 py-3 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              Search City
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_LOCATIONS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyLocation(preset)}
                className={`px-3 py-2 rounded-full border text-[11px] font-extrabold whitespace-nowrap transition-all active:scale-95 ${
                  location.label === preset.label
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-400'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500'
                }`}
              >
                {preset.label.split(',')[0]}
              </button>
            ))}
          </div>

          {searchOpen && (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-700'
            }`}>
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleCitySearch();
                  }}
                  placeholder="Search city, e.g. Abuja Nigeria"
                  className={`flex-1 px-4 py-3 rounded-2xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-600 ${inputClass}`}
                />
                <button
                  onClick={handleCitySearch}
                  disabled={searching}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-extrabold transition-all active:scale-95"
                >
                  {searching ? '...' : 'Go'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.lat}-${result.lng}-${result.label}`}
                      onClick={() => applyLocation(result)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all active:scale-95 ${
                        isLightMode ? 'bg-white border-slate-200 hover:border-emerald-500' : 'bg-slate-800 border-slate-700 hover:border-emerald-500'
                      }`}
                    >
                      <p className={`text-xs font-extrabold leading-relaxed ${textMain}`}>{result.label}</p>
                      <p className={`text-[11px] mt-1 ${textMuted}`}>{result.lat.toFixed(3)}, {result.lng.toFixed(3)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {viewMode === 'today' && (
          <>
            {nextPrayer && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-slate-950 p-6 text-white shadow-xl shadow-emerald-950/30 border border-emerald-600/30">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <span className="text-8xl font-serif">🕌</span>
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-300">Next Prayer</span>
                    <span className="text-xs px-2.5 py-1 bg-emerald-950/70 rounded-full text-emerald-200 font-bold border border-emerald-700/40">
                      {nextPrayer.time}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tight">{nextPrayer.name}</h2>
                    <p className="text-sm font-medium text-emerald-200/90 mt-1">{nextPrayer.remainingText}</p>
                  </div>
                  <p className="text-xs text-slate-300 border-t border-emerald-700/50 pt-3">
                    {prayerData?.date.hijri.date || 'Hijri date loading'} • {prayerData?.date.hijri.weekday.ar || 'اليوم'} • {prayerData?.date.gregorian.date || 'Gregorian date loading'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {PRAYER_ROWS.map((item) => {
                const time = prayerData ? prayerData.timings[item.key] : '--:--';
                const isNext = nextPrayer?.name === item.key;

                return (
                  <div
                    key={item.key}
                    className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
                      isNext
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-xl shadow-emerald-950/40'
                        : panelClass
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-base tracking-tight ${isNext ? 'text-emerald-400' : textMain}`}>
                            {item.name}
                          </h3>
                          {isNext && <span className="text-[10px] px-2 py-0.5 bg-emerald-500 text-slate-950 font-extrabold rounded-full uppercase tracking-wider">Next</span>}
                        </div>
                        <p className={`text-xs mt-0.5 ${textMuted}`}>{item.note}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-2xl font-extrabold font-sans tracking-tight ${isNext ? 'text-emerald-400' : textMain}`}>
                        {time}
                      </span>
                      {isNext && <p className="text-xs font-bold text-emerald-500 mt-0.5">{nextPrayer?.remainingText}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'month' && (
          <div className={`rounded-3xl border overflow-hidden ${panelClass}`}>
            <div className={`p-4 border-b flex items-center justify-between gap-3 ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
              <button
                onClick={() => shiftMonth(-1)}
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className={`text-sm font-black ${textMain}`}>{monthTitle}</h2>
                <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>{location.label}</p>
              </div>
              <button
                onClick={() => shiftMonth(1)}
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <button
                onClick={copyMonthlyTimetable}
                disabled={monthlyDays.length === 0}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Copy className="w-4 h-4" />
                {monthCopied ? 'Copied Timetable' : 'Copy Monthly Timetable'}
              </button>

              <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[620px] space-y-2">
                  <div className={`grid grid-cols-[70px_repeat(6,1fr)] gap-2 px-3 text-[10px] font-black uppercase tracking-wider ${textMuted}`}>
                    <span>Date</span>
                    <span>Fajr</span>
                    <span>Sunrise</span>
                    <span>Dhuhr</span>
                    <span>Asr</span>
                    <span>Maghrib</span>
                    <span>Isha</span>
                  </div>

                  {loadingMonth && <p className={`p-4 text-xs font-bold ${textMuted}`}>Loading monthly timetable...</p>}

                  {!loadingMonth && monthlyDays.map((day) => (
                    <div
                      key={day.gregorianDate}
                      className={`grid grid-cols-[70px_repeat(6,1fr)] gap-2 items-center px-3 py-3 rounded-2xl border text-xs font-bold ${
                        isToday(day, monthCursor)
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                          : isLightMode
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-slate-900/70 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <p className="font-black">{day.dayNumber}</p>
                        <p className="text-[10px] opacity-80">{day.hijriWeekdayAr || day.gregorianWeekday.slice(0, 3)}</p>
                      </div>
                      <span>{day.timings.Fajr}</span>
                      <span>{day.timings.Sunrise}</span>
                      <span>{day.timings.Dhuhr}</span>
                      <span>{day.timings.Asr}</span>
                      <span>{day.timings.Maghrib}</span>
                      <span>{day.timings.Isha}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`p-6 rounded-3xl border space-y-4 ${panelClass}`}>
          <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs tracking-wider uppercase">
            <Globe className="w-4 h-4" />
            <span>Calculation Method</span>
          </div>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            Choose the Islamic authority used for Fajr and Isha angles. Changing this immediately reloads today and the monthly timetable.
          </p>
          <select
            value={settings.calculation_method}
            onChange={(event) => onUpdateSettings({ ...settings, calculation_method: Number(event.target.value) })}
            className={`w-full px-4 py-3 border rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner ${inputClass}`}
          >
            {METHODS.map((method) => (
              <option key={method.id} value={method.id}>{method.name}</option>
            ))}
          </select>
        </div>

        <div className={`p-4 rounded-2xl border ${
          isLightMode ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-100'
        }`}>
          <p className="text-xs font-semibold leading-relaxed">
            Tip: use the monthly timetable to plan Ramadan, school, work, or mosque activities. Times may vary slightly by local masjid, so follow your local authority when needed.
          </p>
        </div>
      </div>
    </div>
  );
}
