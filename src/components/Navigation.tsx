import { BookOpen, Clock, Compass, Heart, Home, Repeat, Settings } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLightMode: boolean;
}

export default function Navigation({ activeTab, setActiveTab, isLightMode }: NavigationProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "quran", label: "Quran", icon: BookOpen },
    { id: "prayer", label: "Salah", icon: Clock },
    { id: "adhkar", label: "Adhkar", icon: Heart },
    { id: "tasbih", label: "Tasbih", icon: Repeat },
    { id: "qibla", label: "Qibla", icon: Compass },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors duration-200 noor-safe-bottom ${
        isLightMode
          ? "bg-white/95 border-slate-200 text-slate-600 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
          : "bg-slate-950/95 border-slate-800 text-slate-400 shadow-[0_-8px_24px_rgba(0,0,0,0.28)]"
      }`}
    >
      <div className="mx-auto grid h-16 w-full max-w-lg grid-cols-7 items-stretch px-1 min-[390px]:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 transition-all active:scale-95 ${
                isActive
                  ? "text-emerald-500 font-semibold"
                  : isLightMode
                    ? "hover:text-slate-900"
                    : "hover:text-slate-200"
              }`}
              aria-label={`Open ${item.label}`}
              aria-current={isActive ? "page" : undefined}
              type="button"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-2xl transition-all ${
                  isActive
                    ? isLightMode
                      ? "bg-emerald-100 shadow-sm"
                      : "bg-emerald-950/90 shadow-sm shadow-emerald-950/40"
                    : "group-active:bg-slate-500/10"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 xs-compact-nav-icon ${isActive ? "text-emerald-500" : ""}`} />
              </div>
              <span className="xs-hide-label max-w-full truncate text-[8.5px] font-bold leading-none tracking-wide min-[390px]:text-[9.5px] sm:text-[10px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
