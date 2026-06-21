import { useState, useEffect } from 'react';
import { BookOpen, Heart, Compass, Clock, Play, ArrowRight, Sparkles } from 'lucide-react';
import { fetchPrayerTimes, calculateNextPrayer, PrayerTimesData, NextPrayerInfo } from '../../lib/prayerTimes';
import { Storage, ReadingProgress } from '../../lib/supabase';
import { SURAH_LIST } from '../../lib/surahData';

interface HomeScreenProps {
  setActiveTab: (tab: string) => void;
  onContinueReading: (surah: number, ayah: number) => void;
  isLightMode: boolean;
}

// Sample Daily Verses for rotation
const VERSES_OF_DAY = [
  { surah: 2, ayah: 286, arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", translation: "Allah does not burden a soul beyond that it can bear.", surahName: "Al-Baqarah" },
  { surah: 94, ayah: 5, arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "For indeed, with hardship [will be] ease.", surahName: "Ash-Sharh" },
  { surah: 3, ayah: 139, arabic: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ إِنْ كُنْتُمْ مُؤْمِنِينَ", translation: "So do not weaken and do not grieve, and you will be superior if you are [true] believers.", surahName: "Ali 'Imran" },
  { surah: 55, ayah: 60, arabic: "هَلْ جَزَاءُ الْإِحْسَانِ إِلَّا الْإِحْسَانُ", translation: "Is the reward for good [anything] but good?", surahName: "Ar-Rahman" },
  { surah: 65, ayah: 3, arabic: "وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", translation: "And He will provide for him from where he does not expect.", surahName: "At-Talaq" },
];

export default function HomeScreen({ setActiveTab, onContinueReading, isLightMode }: HomeScreenProps) {
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [progress] = useState<ReadingProgress>(Storage.getProgress());
  const [verseOfDay, setVerseOfDay] = useState(VERSES_OF_DAY[0]);
  const [adhkarCompletedCount, setAdhkarCompletedCount] = useState(0);

  // Initialize prayer times
  useEffect(() => {
    // Determine random daily verse based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setVerseOfDay(VERSES_OF_DAY[dayOfYear % VERSES_OF_DAY.length]);

    // Fetch Prayer times (defaulting to Makkah/London if geolocation unavailable)
    fetchPrayerTimes(21.4225, 39.8262).then(data => {
      setPrayerData(data);
      setNextPrayer(calculateNextPrayer(data.timings));
    });

    // Determine Adhkar count for today
    const todayStr = new Date().toISOString().split('T')[0];
    const adhkarProg = Storage.getAdhkarProgress(todayStr);
    const count = Object.values(adhkarProg).reduce((acc, curr) => acc + (curr > 0 ? 1 : 0), 0);
    setAdhkarCompletedCount(count);
  }, []);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerData) {
        setNextPrayer(calculateNextPrayer(prayerData.timings));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [prayerData]);

  const surahMeta = SURAH_LIST.find(s => s.number === progress.surah_number) || SURAH_LIST[0];

  return (
    <div className="max-w-lg mx-auto px-5 pt-8 pb-32 space-y-6">
      {/* Greeting & Date */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">As-salamu alaykum ✨</h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>{prayerData ? prayerData.date.hijri.date : "15 Ramadan 1447"}</span>
          <span>•</span>
          <span>{prayerData ? prayerData.date.gregorian.date : "06 March 2026"}</span>
        </div>
      </div>

      {/* Next Prayer Countdown Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 to-slate-900 p-6 text-white shadow-xl shadow-emerald-950/30 border border-emerald-600/30">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="text-8xl font-serif">🕌</span>
        </div>
        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-300">Upcoming Salah</span>
            <span className="text-xs px-2.5 py-1 bg-emerald-950/60 rounded-full text-emerald-300 font-bold border border-emerald-700/40">
              {nextPrayer?.time || "12:15"}
            </span>
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">{nextPrayer?.name || "Dhuhr"}</h2>
            <p className="text-sm font-medium text-emerald-200/90 mt-1">
              {nextPrayer?.remainingText ? `${nextPrayer.remainingText} remaining` : "Calculating countdown..."}
            </p>
          </div>
          <div className="pt-2 border-t border-emerald-700/50 flex items-center justify-between text-xs text-slate-200">
            <span>Current Location (Auto-detected)</span>
            <button onClick={() => setActiveTab('prayer')} className="font-bold text-white hover:underline flex items-center gap-1">
              View All 5 Timings <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Continue Reading & Adhkar Progress Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Continue Reading Card */}
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
          <div className="mt-4 flex items-center text-xs font-bold text-slate-300 group-hover:text-emerald-500 transition-colors">
            Resume <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Today's Adhkar Progress Card */}
        <button
          onClick={() => setActiveTab('adhkar')}
          className={`p-5 rounded-3xl text-left border transition-all active:scale-95 group flex flex-col justify-between ${
            isLightMode 
              ? 'bg-white border-slate-200 hover:border-emerald-500 shadow-sm' 
              : 'bg-slate-800/80 border-slate-700 hover:border-emerald-500 shadow-lg'
          }`}
        >
          <div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
              <Heart className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Daily Adhkar</p>
            <p className="text-base font-bold mt-1 text-amber-500">{adhkarCompletedCount} / 5 Done</p>
            <p className="text-xs text-slate-400 mt-0.5">Remembrance goals</p>
          </div>
          <div className="mt-4 flex items-center text-xs font-bold text-slate-300 group-hover:text-amber-500 transition-colors">
            Open Tasbih <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Quick Access Tiles */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold text-slate-400 tracking-widest">Quick Access</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { id: 'quran', label: 'Quran', icon: BookOpen, color: 'bg-emerald-600' },
            { id: 'adhkar', label: 'Adhkar', icon: Heart, color: 'bg-amber-500' },
            { id: 'qibla', label: 'Qibla', icon: Compass, color: 'bg-blue-600' },
            { id: 'prayer', label: 'Salah', icon: Clock, color: 'bg-purple-600' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all active:scale-95 hover:border-emerald-500 ${
                  isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg shadow-black/20`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verse of the Day Card */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-800/60 border-slate-700'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-emerald-500 font-extrabold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Verse of the Day</span>
          </div>
          <button
            onClick={() => onContinueReading(verseOfDay.surah, verseOfDay.ayah)}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95"
          >
            <Play className="w-4 h-4 ml-0.5" />
          </button>
        </div>
        <p className="text-2xl text-right font-quran font-bold my-4 leading-loose text-gold">
          {verseOfDay.arabic}
        </p>
        <p className="text-sm text-slate-300 font-medium leading-relaxed italic mb-4">
          "{verseOfDay.translation}"
        </p>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 pt-3 border-t border-slate-700/60">
          <span>{verseOfDay.surahName} ({verseOfDay.surah}:{verseOfDay.ayah})</span>
          <button 
            onClick={() => onContinueReading(verseOfDay.surah, verseOfDay.ayah)} 
            className="text-emerald-500 hover:underline"
          >
            Read Chapter
          </button>
        </div>
      </div>
    </div>
  );
}
