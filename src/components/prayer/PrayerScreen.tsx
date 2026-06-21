import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Globe, MapPin, Navigation, Search, Volume2 } from 'lucide-react';
import {
  ADHAN_AUDIO_URL,
  DEFAULT_PRAYER_LOCATION,
  PrayerLocation,
  PrayerTimesData,
  NextPrayerInfo,
  calculateNextPrayer,
  fetchPrayerTimes,
  getBrowserPrayerLocation,
  readSavedPrayerLocation,
  reverseGeocodePrayerLocation,
  savePrayerLocation,
  searchPrayerCityCoordinates,
} from '../../lib/prayerTimes';
import { UserSettings } from '../../lib/supabase';

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
];

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const textMain = isLightMode ? 'text-slate-900' : 'text-white';
  const textMuted = isLightMode ? 'text-slate-500' : 'text-slate-400';
  const panelClass = isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md';
  const inputClass = isLightMode
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
    : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500';

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

  useEffect(() => {
    loadTimings(location);
  }, [location, loadTimings]);

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

  return (
    <div className="max-w-lg mx-auto pb-32">
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
        isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <div>
          <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Salah Timings</h1>
          <p className={`text-[11px] font-semibold mt-0.5 ${textMuted}`}>Accurate times by location</p>
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
            {loadingTimes && <span className="text-[11px] font-bold text-emerald-500 animate-pulse">Loading...</span>}
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
                {prayerData?.date.hijri.date || 'Hijri date loading'} • {prayerData?.date.gregorian.date || 'Gregorian date loading'}
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

        <div className={`p-6 rounded-3xl border space-y-4 ${panelClass}`}>
          <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs tracking-wider uppercase">
            <Globe className="w-4 h-4" />
            <span>Calculation Method</span>
          </div>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            Choose the Islamic authority used for Fajr and Isha angles. Changing this immediately reloads the timings for your saved location.
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
            Tip: use “Use My Location” for best accuracy. If permission is denied, search your city and the app will remember it for next time.
          </p>
        </div>
      </div>
    </div>
  );
}
