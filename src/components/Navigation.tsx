import { Home, BookOpen, Heart, Compass, Settings, Clock } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLightMode: boolean;
}

export default function Navigation({ activeTab, setActiveTab, isLightMode }: NavigationProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'quran', label: 'Quran', icon: BookOpen },
    { id: 'prayer', label: 'Salah', icon: Clock },
    { id: 'adhkar', label: 'Adhkar', icon: Heart },
    { id: 'qibla', label: 'Qibla', icon: Compass },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg transition-colors duration-200 ${
      isLightMode 
        ? 'bg-white/90 border-slate-200 text-slate-600' 
        : 'bg-slate-900/90 border-slate-800 text-slate-400'
    }`}>
      <div className="max-w-lg mx-auto px-2 h-16 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 h-full transition-all active:scale-95 ${
                isActive 
                  ? 'text-emerald-500 font-semibold' 
                  : isLightMode ? 'hover:text-slate-900' : 'hover:text-slate-200'
              }`}
              aria-label={`Open ${item.label}`}
              type="button"
            >
              <div className={`p-1 rounded-full transition-all ${
                isActive ? (isLightMode ? 'bg-emerald-100' : 'bg-emerald-950/80') : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-500' : ''}`} />
              </div>
              <span className="text-[10px] mt-1 tracking-wider truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
