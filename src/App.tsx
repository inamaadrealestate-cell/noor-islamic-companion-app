import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import AudioPlayer from './components/AudioPlayer';
import HomeScreen from './components/home/HomeScreen';
import QuranScreen from './components/quran/QuranScreen';
import AdhkarScreen from './components/adhkar/AdhkarScreen';
import QiblaCompass from './components/qibla/QiblaCompass';
import PrayerScreen from './components/prayer/PrayerScreen';
import SettingsScreen from './components/settings/SettingsScreen';
import { Storage, UserSettings } from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSurah, setCurrentSurah] = useState<number>(1);
  const [currentAyah, setCurrentAyah] = useState<number>(1);
  const [reciterId, setReciterId] = useState<string>(settings.default_reciter || 'ar.alafasy');

  // Apply body background colors according to theme
  const isLightMode = settings.theme === 'light';

  useEffect(() => {
    document.body.className = isLightMode ? 'bg-slate-50 text-slate-800' : 'bg-slate-900 text-white';
  }, [isLightMode]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
    if (newSettings.default_reciter !== reciterId) {
      setReciterId(newSettings.default_reciter);
    }
  };

  const handleContinueReading = (surah: number, ayah: number) => {
    setCurrentSurah(surah);
    setCurrentAyah(ayah);
    setActiveTab('quran');
  };

  const handlePlayVerse = (surah: number, ayah: number) => {
    setCurrentSurah(surah);
    setCurrentAyah(ayah);
    setIsPlaying(true);
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isLightMode ? 'bg-slate-50 text-slate-800' : 'bg-slate-900 text-white'}`}>
      {/* Dynamic Screen Content */}
      <main className="w-full">
        {activeTab === 'home' && (
          <HomeScreen 
            setActiveTab={setActiveTab} 
            onContinueReading={handleContinueReading}
            isLightMode={isLightMode}
          />
        )}
        {activeTab === 'quran' && (
          <QuranScreen 
            currentSurah={currentSurah}
            currentAyah={currentAyah}
            isPlaying={isPlaying}
            onPlayAyah={handlePlayVerse}
            isLightMode={isLightMode}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
        {activeTab === 'adhkar' && (
          <AdhkarScreen 
            isLightMode={isLightMode}
          />
        )}
        {activeTab === 'qibla' && (
          <div className="max-w-lg mx-auto pb-32">
            <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
              isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
            }`}>
              <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Qibla Compass</h1>
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60">Mecca • 21.42°N, 39.82°E</span>
            </div>
            <QiblaCompass />
          </div>
        )}
        {activeTab === 'prayer' && (
          <PrayerScreen 
            isLightMode={isLightMode}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isLightMode={isLightMode}
          />
        )}
      </main>

      {/* Persistent Mini-Player */}
      <AudioPlayer 
        currentSurah={currentSurah}
        currentAyah={currentAyah}
        reciterId={reciterId}
        isPlaying={isPlaying}
        onPlayStateChange={setIsPlaying}
        onVerseChange={(s, a) => { setCurrentSurah(s); setCurrentAyah(a); }}
        onReciterChange={setReciterId}
        isLightMode={isLightMode}
      />

      {/* Persistent Bottom Navigation */}
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isLightMode={isLightMode}
      />
    </div>
  );
}
