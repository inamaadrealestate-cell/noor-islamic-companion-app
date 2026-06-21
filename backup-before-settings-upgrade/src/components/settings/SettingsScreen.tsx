import { useState } from 'react';
import { Moon, Sun, BookOpen, Volume2, Bell, Trash2, ShieldCheck, Heart, Sparkles, Check } from 'lucide-react';
import { UserSettings, getDeviceId } from '../../lib/supabase';
import { RECITERS_LIST } from '../../lib/audioData';

interface SettingsScreenProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  isLightMode: boolean;
}

export default function SettingsScreen({ settings, onUpdateSettings, isLightMode }: SettingsScreenProps) {
  const [clearedCache, setClearedCache] = useState(false);
  const deviceId = getDeviceId();

  const handleClearCache = () => {
    // Clear download flags in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('download_')) {
        localStorage.removeItem(key);
      }
    }
    setClearedCache(true);
    setTimeout(() => setClearedCache(false), 3000);
  };

  const translations = [
    { id: 'en.sahih', name: 'English — Sahih International' },
    { id: 'en.yusufali', name: 'English — Yusuf Ali' },
    { id: 'en.pickthall', name: 'English — Marmaduke Pickthall' },
    { id: 'en.asad', name: 'English — Muhammad Asad' },
    { id: 'fr.hamidullah', name: 'French — Muhammad Hamidullah' },
    { id: 'ur.jalandhry', name: 'Urdu — Fateh Muhammad Jalandhry' }
  ];

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Top Header */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
        isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">App Settings</h1>
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60">
          v1.0
        </span>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Theme Setting */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
        }`}>
          <div className="flex items-center gap-2.5 text-white">
            {isLightMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-emerald-400" />}
            <h3 className="font-bold text-base">Appearance Theme</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Choose between the deep charcoal dark theme (designed for low eye strain) or the light cream theme.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
              className={`p-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                settings.theme === 'dark' 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/40' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Moon className="w-4 h-4" /> Dark Mode
            </button>
            <button
              onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
              className={`p-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                settings.theme === 'light' 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/40' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sun className="w-4 h-4" /> Light Mode
            </button>
          </div>
        </div>

        {/* Translation Edition */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
        }`}>
          <div className="flex items-center gap-2.5 text-white">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Quran Translation Edition</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Select your preferred translation to appear beneath the Arabic text in verse mode.
          </p>
          <select
            value={settings.translation_edition}
            onChange={(e) => onUpdateSettings({ ...settings, translation_edition: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
          >
            {translations.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Default Reciter */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
        }`}>
          <div className="flex items-center gap-2.5 text-white">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Default Audio Reciter</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Set the primary Sheikh for continuous streaming and verse audio playback.
          </p>
          <select
            value={settings.default_reciter}
            onChange={(e) => onUpdateSettings({ ...settings, default_reciter: e.target.value })}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
          >
            {RECITERS_LIST.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.style})</option>
            ))}
          </select>
        </div>

        {/* Push Notifications */}
        <div className={`p-6 rounded-3xl border flex items-center justify-between gap-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base">Prayer Notifications</h3>
            </div>
            <p className="text-xs text-slate-400">Browser push alerts when Salah time arrives</p>
          </div>
          <button
            onClick={() => onUpdateSettings({ ...settings, prayer_notifications: !settings.prayer_notifications })}
            className={`w-14 h-8 rounded-full transition-colors p-1 flex items-center ${
              settings.prayer_notifications ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-6 h-6 bg-white rounded-full shadow-md" />
          </button>
        </div>

        {/* Offline Cache Management */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
        }`}>
          <div className="flex items-center gap-2.5 text-white">
            <Trash2 className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-base">Offline Download Cache</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Free up storage space by clearing all cached surah audio and downloaded assets from this device.
          </p>
          <button
            onClick={handleClearCache}
            disabled={clearedCache}
            className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${
              clearedCache 
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' 
                : 'bg-slate-900 border-slate-700 text-red-400 hover:bg-slate-800'
            }`}
          >
            {clearedCache ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            <span>{clearedCache ? 'Offline Cache Cleared Successfully' : 'Clear Offline Cache'}</span>
          </button>
        </div>

        {/* Anonymous Sync Info Card */}
        <div className="p-6 bg-emerald-950/40 border border-emerald-800/50 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-sm uppercase tracking-wider">No Login Required</h3>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
            Everything works instantly for any visitor. Your bookmarks, reading progress, adhkar streaks, and settings are saved automatically to this device and backed up securely via an anonymous sync key.
          </p>
          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 truncate">{deviceId}</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-extrabold rounded-full border border-emerald-500/30">Synced</span>
          </div>
        </div>

        {/* Sadaqah Jariyah Project Notice */}
        <div className="text-center py-6 space-y-3 border-t border-slate-800/80">
          <div className="inline-flex items-center gap-2 text-gold px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold shadow">
            <Sparkles className="w-4 h-4" /> Sadaqah Jariyah Project
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Built with pure intention. Absolutely no ads, no paywalls, no tracking, and no monetization ever. Made with <Heart className="w-3.5 h-3.5 inline text-red-500 fill-current" /> for the Ummah.
          </p>
        </div>
      </div>
    </div>
  );
}
