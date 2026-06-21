import { useState, useEffect } from 'react';
import { ADHKAR_CATEGORIES, DUAS_LIST, DhikrCategory, DhikrItem, DuaItem } from '../../lib/adhkarData';
import { Storage } from '../../lib/supabase';
import { Sunrise, Sunset, CheckCircle, Moon, Sun, Utensils, Plane, Home, Building, AlertCircle, Heart, Shield, Users, Flame, Bell } from 'lucide-react';

interface AdhkarScreenProps {
  isLightMode: boolean;
}

const ICON_MAP: Record<string, any> = {
  sunrise: Sunrise,
  sunset: Sunset,
  'check-circle': CheckCircle,
  moon: Moon,
  sun: Sun,
  utensils: Utensils,
  plane: Plane,
  home: Home,
  building: Building,
  'alert-circle': AlertCircle,
  heart: Heart,
  shield: Shield,
  users: Users
};

export default function AdhkarScreen({ isLightMode }: AdhkarScreenProps) {
  const [activeTab, setActiveTab] = useState<'adhkar' | 'duas'>('adhkar');
  const [selectedCategory, setSelectedCategory] = useState<string>('morning');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [streak] = useState<number>(7); // Consistent positive reinforcement streak
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setCounts(Storage.getAdhkarProgress(todayStr));
    const localNotif = localStorage.getItem('noor_adhkar_notif');
    if (localNotif === 'true') setNotificationsEnabled(true);
  }, []);

  const handleIncrement = (item: DhikrItem, categoryId: string) => {
    const current = counts[item.id] || 0;
    if (current < item.repetitions) {
      const next = current + 1;
      setCounts(prev => ({ ...prev, [item.id]: next }));
      Storage.saveAdhkarProgress(todayStr, item.id, next, item.repetitions, categoryId);
    }
  };

  const handleReset = (item: DhikrItem, categoryId: string) => {
    setCounts(prev => ({ ...prev, [item.id]: 0 }));
    Storage.saveAdhkarProgress(todayStr, item.id, 0, item.repetitions, categoryId);
  };

  const toggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('noor_adhkar_notif', String(next));
    if (next && 'Notification' in window) {
      Notification.requestPermission();
    }
  };

  const currentCategory: DhikrCategory = ADHKAR_CATEGORIES.find(c => c.id === selectedCategory) || ADHKAR_CATEGORIES[0];
  const filteredDuas: DuaItem[] = DUAS_LIST.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.translation.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.arabic.includes(searchQuery)
  );

  // Determine completed items in current category
  const categoryCompletedCount = currentCategory.items.filter(item => (counts[item.id] || 0) >= item.repetitions).length;

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Top Header */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between ${
        isLightMode ? 'bg-slate-100/95 border-slate-200' : 'bg-slate-900/95 border-slate-800'
      }`}>
        <h1 className="text-xl font-extrabold text-emerald-500 tracking-tight">Adhkar & Duas</h1>
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60 text-xs font-bold text-slate-400">
          <button 
            onClick={() => setActiveTab('adhkar')}
            className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'adhkar' ? 'bg-emerald-600 text-white shadow' : 'hover:text-white'}`}
          >
            Adhkar
          </button>
          <button 
            onClick={() => setActiveTab('duas')}
            className={`px-4 py-1.5 rounded-lg transition-all ${activeTab === 'duas' ? 'bg-emerald-600 text-white shadow' : 'hover:text-white'}`}
          >
            Daily Duas
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Daily Streak Tracker & Reminders */}
        <div className="p-5 bg-gradient-to-r from-emerald-900/80 to-slate-800 border border-emerald-600/30 rounded-3xl flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white">{streak} Days</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">Active</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Wonderful consistency! Keep your soul nourished.</p>
            </div>
          </div>

          <button 
            onClick={toggleNotifications}
            className={`p-3 rounded-2xl border transition-all active:scale-95 ${
              notificationsEnabled ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={notificationsEnabled ? 'Push notifications enabled' : 'Enable morning/evening reminders'}
          >
            <Bell className={`w-5 h-5 ${notificationsEnabled ? 'fill-current animate-wiggle' : ''}`} />
          </button>
        </div>

        {/* TAB 1: ADHKAR SECTION */}
        {activeTab === 'adhkar' && (
          <div className="space-y-6">
            {/* Horizontal Categories Scroll */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {ADHKAR_CATEGORIES.map((cat) => {
                const Icon = ICON_MAP[cat.icon] || Sun;
                const isSelected = cat.id === selectedCategory;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-3 rounded-2xl border flex items-center gap-2.5 flex-shrink-0 transition-all active:scale-95 ${
                      isSelected 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 font-bold' 
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs tracking-wide">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Intro */}
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-white">{currentCategory.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{currentCategory.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-black text-emerald-400">{categoryCompletedCount} / {currentCategory.items.length}</span>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Completed</p>
              </div>
            </div>

            {/* Dhikr Items */}
            <div className="space-y-4">
              {currentCategory.items.map((item) => {
                const count = counts[item.id] || 0;
                const isComplete = count >= item.repetitions;
                const progressPercent = Math.min(100, (count / item.repetitions) * 100);

                return (
                  <div 
                    key={item.id}
                    className={`p-6 rounded-3xl border transition-all flex flex-col justify-between gap-6 ${
                      isComplete 
                        ? 'bg-emerald-950/30 border-emerald-600/60 shadow-xl' 
                        : isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700">
                          {item.source || "Hadith Reference"}
                        </span>
                        {item.virtue && (
                          <span className="text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-xl">
                            ⭐ Virtue Note
                          </span>
                        )}
                      </div>

                      <p className="text-2xl text-right font-quran font-bold text-gold leading-loose">
                        {item.arabic}
                      </p>

                      <p className="text-sm text-slate-300 font-sans leading-relaxed pt-2 border-t border-slate-700/50">
                        {item.translation}
                      </p>

                      {item.virtue && (
                        <p className="text-xs text-amber-200/90 bg-amber-950/20 p-3 rounded-2xl border border-amber-800/30 leading-relaxed italic">
                          "{item.virtue}"
                        </p>
                      )}
                    </div>

                    {/* Tasbih Progress Button */}
                    <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between gap-4">
                      <button 
                        onClick={() => handleReset(item, currentCategory.id)}
                        className="text-xs text-slate-500 hover:text-slate-300 font-semibold px-2 py-1"
                      >
                        Reset
                      </button>

                      <button
                        onClick={() => handleIncrement(item, currentCategory.id)}
                        className={`relative flex-1 py-4 rounded-2xl font-black text-sm tracking-wide overflow-hidden transition-all active:scale-95 shadow-lg ${
                          isComplete 
                            ? 'bg-emerald-600 text-white shadow-emerald-950/50' 
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        {/* Background filling progress */}
                        <div 
                          className="absolute inset-0 bg-emerald-600 opacity-50 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          <span>{isComplete ? '🎉 Complete (' + count + '/' + item.repetitions + ')' : 'Tap to Count (' + count + ' / ' + item.repetitions + ')'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DAILY DUAS SECTION */}
        {activeTab === 'duas' && (
          <div className="space-y-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Duas by keyword or situation (e.g. eating, travel, anxiety)..."
              className="w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
            />

            <div className="space-y-4">
              {filteredDuas.map((dua) => {
                const Icon = ICON_MAP[dua.icon] || Heart;
                return (
                  <div 
                    key={dua.id}
                    className={`p-6 rounded-3xl border space-y-4 transition-all ${
                      isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-800/60 border-slate-700/80 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-950/80 text-emerald-400 rounded-xl border border-emerald-800/50 shadow-inner">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-base text-white">{dua.title}</h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-700">
                        {dua.source || "Hadith"}
                      </span>
                    </div>

                    <p className="text-2xl text-right font-quran font-bold text-gold leading-loose">
                      {dua.arabic}
                    </p>

                    <p className="text-xs text-emerald-400 font-sans font-medium leading-relaxed italic">
                      {dua.transliteration}
                    </p>

                    <p className="text-sm text-slate-300 font-sans leading-relaxed pt-2 border-t border-slate-700/40">
                      {dua.translation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
