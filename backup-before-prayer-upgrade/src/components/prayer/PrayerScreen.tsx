import { useState, useEffect } from 'react';
import { MapPin, Globe, Volume2 } from 'lucide-react';
import { fetchPrayerTimes, calculateNextPrayer, PrayerTimesData, NextPrayerInfo } from '../../lib/prayerTimes';
import { UserSettings } from '../../lib/supabase';

interface PrayerScreenProps {
  isLightMode: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

export default function PrayerScreen({ isLightMode, settings, onUpdateSettings }: PrayerScreenProps) {
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [city, setCity] = useState<string>('Makkah (Auto-detected)');
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);
  const [audio] = useState(() => new Audio("https://everyayah.com/data/Alafasy_128kbps/001001.mp3")); // Sample Adhan placeholder

  useEffect(() => {
    fetchPrayerTimes(21.4225, 39.8262, settings.calculation_method || 4).then(data => {
      setPrayerData(data);
      setNextPrayer(calculateNextPrayer(data.timings));
    });
  }, [settings.calculation_method]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerData) {
        setNextPrayer(calculateNextPrayer(prayerData.timings));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [prayerData]);

  const toggleAdhan = () => {
    if (isAdhanPlaying) {
      audio.pause();
      setIsAdhanPlaying(false);
    } else {
      audio.play().catch(() => {});
      setIsAdhanPlaying(true);
      audio.onended = () => setIsAdhanPlaying(false);
    }
  };

  const methods = [
    { id: 4, name: "Umm al-Qura University, Makkah" },
    { id: 2, name: "Islamic Society of North America (ISNA)" },
    { id: 3, name: "Muslim World League (MWL)" },
    { id: 5, name: "Egyptian General Authority of Survey" },
    { id: 7, name: "Institute of Geophysics, University of Tehran" },
  ];

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Top Header */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
        isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Salah Timings</h1>
        <button 
          onClick={toggleAdhan}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
            isAdhanPlaying ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{isAdhanPlaying ? 'Playing Adhan...' : 'Play Adhan'}</span>
        </button>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Location Info */}
        <div className="p-4 bg-slate-800/50 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm text-white">{city}</p>
              <p className="text-xs text-slate-400 mt-0.5">{prayerData?.meta.method.name || "Umm al-Qura calculation"}</p>
            </div>
          </div>
          <button 
            onClick={() => setCity("London, UK (Overridden)")}
            className="text-xs font-semibold text-emerald-500 hover:underline flex-shrink-0"
          >
            Change
          </button>
        </div>

        {/* Timings List */}
        <div className="space-y-3">
          {[
            { name: 'Fajr', key: 'Fajr', icon: '🌅', note: 'Dawn prayer' },
            { name: 'Sunrise', key: 'Sunrise', icon: '☀️', note: 'Morning sun' },
            { name: 'Dhuhr / Jumuah', key: 'Dhuhr', icon: '☀️', note: 'Noon prayer' },
            { name: 'Asr', key: 'Asr', icon: '🌤️', note: 'Afternoon prayer' },
            { name: 'Maghrib', key: 'Maghrib', icon: '🌇', note: 'Sunset prayer' },
            { name: 'Isha', key: 'Isha', icon: '🌙', note: 'Night prayer' },
          ].map((item) => {
            const time = prayerData ? prayerData.timings[item.key] : "12:00";
            const isNext = nextPrayer?.name === item.key;

            return (
              <div
                key={item.key}
                className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${
                  isNext 
                    ? 'bg-emerald-950/50 border-emerald-500 shadow-xl shadow-emerald-950/40' 
                    : isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-base tracking-tight ${isNext ? 'text-emerald-400' : 'text-white'}`}>
                        {item.name}
                      </h3>
                      {isNext && <span className="text-[10px] px-2 py-0.5 bg-emerald-500 text-slate-950 font-extrabold rounded-full uppercase tracking-wider">Next</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-2xl font-extrabold font-sans tracking-tight ${isNext ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {time}
                  </span>
                  {isNext && <p className="text-xs font-bold text-emerald-500 mt-0.5">{nextPrayer?.remainingText}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculation Method Selector */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/60 border-slate-700'
        }`}>
          <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs tracking-wider uppercase">
            <Globe className="w-4 h-4" />
            <span>Calculation Method</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Select the appropriate regional jurisdiction or Islamic authority for calculating accurate solar angles for Fajr and Isha.
          </p>
          <select
            value={settings.calculation_method}
            onChange={(e) => onUpdateSettings({ ...settings, calculation_method: Number(e.target.value) })}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
