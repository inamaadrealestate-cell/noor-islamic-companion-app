import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Compass,
  Info,
  MapPin,
  Navigation,
  RotateCcw,
  Search,
  Smartphone,
  Target,
} from "lucide-react";
import {
  CitySearchResult,
  QiblaLocation,
  clearSavedQiblaLocation,
  formatDistanceKm,
  getCardinalDirection,
  getNeedleRotation,
  getQiblaInfo,
  getSavedQiblaLocation,
  getShortLocationName,
  getUserLocation,
  requestOrientationPermission,
  saveQiblaLocation,
  searchCityCoordinates,
  subscribeToCompass,
} from "../../lib/qibla";

type CompassMode = "idle" | "location-request" | "static" | "tracking" | "error";

const PRESET_LOCATIONS: QiblaLocation[] = [
  { lat: 9.0765, lng: 7.3986, displayName: "Abuja, Nigeria", source: "preset" },
  { lat: 6.5244, lng: 3.3792, displayName: "Lagos, Nigeria", source: "preset" },
  { lat: 21.4225, lng: 39.8262, displayName: "Makkah, Saudi Arabia", source: "preset" },
  { lat: 51.5072, lng: -0.1276, displayName: "London, United Kingdom", source: "preset" },
];

function detectLightMode(): boolean {
  if (typeof document === "undefined") return false;
  return document.body.className.includes("bg-slate-50");
}

export default function QiblaCompass() {
  const [isLightMode, setIsLightMode] = useState<boolean>(detectLightMode);
  const [mode, setMode] = useState<CompassMode>("idle");
  const [location, setLocation] = useState<QiblaLocation | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const saved = getSavedQiblaLocation();
    if (saved) {
      setLocation(saved);
      setMode("static");
      setMessage("Saved location loaded. Enable live compass if you are on a phone with motion sensors.");
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => setIsLightMode(detectLightMode()));
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== "tracking") return;

    const unsubscribe = subscribeToCompass((heading) => {
      setDeviceHeading(heading);
    });

    return unsubscribe;
  }, [mode]);

  const qiblaInfo = useMemo(() => {
    if (!location) return null;
    return getQiblaInfo(location.lat, location.lng);
  }, [location]);

  const needleRotation = useMemo(() => {
    if (!qiblaInfo) return 0;
    return mode === "tracking" ? getNeedleRotation(qiblaInfo.bearing, deviceHeading) : qiblaInfo.bearing;
  }, [deviceHeading, mode, qiblaInfo]);

  const bearingDirection = qiblaInfo ? getCardinalDirection(qiblaInfo.bearing) : "—";
  const displayLocation = location ? getShortLocationName(location.displayName) : "No location selected";

  const cardClass = isLightMode
    ? "bg-white border-slate-200 text-slate-800 shadow-sm"
    : "bg-slate-800/80 border-slate-700/80 text-white shadow-xl";

  const mutedText = isLightMode ? "text-slate-500" : "text-slate-400";
  const strongText = isLightMode ? "text-slate-900" : "text-white";
  const inputClass = isLightMode
    ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-emerald-500"
    : "bg-slate-900/80 border-slate-700 text-white placeholder-slate-500 focus:ring-emerald-600";

  const applyLocation = useCallback((nextLocation: QiblaLocation, nextMessage: string) => {
    const savedLocation = { ...nextLocation, savedAt: new Date().toISOString() };
    setLocation(savedLocation);
    saveQiblaLocation(savedLocation);
    setMode("static");
    setMessage(nextMessage);
    setShowSearch(false);
    setSearchResults([]);
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    setMode("location-request");
    setMessage("");

    try {
      const detectedLocation = await getUserLocation();
      applyLocation(detectedLocation, "Location detected. Your Qibla bearing is ready.");
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      setMode("error");
      setShowSearch(true);
      setMessage(
        geoError?.code === 1
          ? "Location permission was denied. Search your city manually instead."
          : "Could not detect your location. Search your city manually instead."
      );
    }
  }, [applyLocation]);

  const handleEnableCompass = useCallback(async () => {
    if (!qiblaInfo) {
      setMessage("Choose your location first, then enable the live compass.");
      setShowSearch(true);
      return;
    }

    setMessage("Requesting compass permission...");
    const granted = await requestOrientationPermission();

    if (!granted) {
      setMode("static");
      setMessage("Compass permission is unavailable or denied. Static Qibla bearing is still shown below.");
      return;
    }

    setMode("tracking");
    setMessage("Live compass enabled. Hold your phone flat and rotate slowly for best accuracy.");
  }, [qiblaInfo]);

  const handleCitySearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setMessage("");

    try {
      const results = await searchCityCoordinates(query);
      setSearchResults(results);
      if (results.length === 0) {
        setMessage("No city found. Try adding the country name, for example: Abuja Nigeria.");
      }
    } catch {
      setMessage("City search failed. Check your internet connection and try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectCity = useCallback(
    (result: CitySearchResult) => {
      applyLocation(
        { lat: result.lat, lng: result.lng, displayName: result.displayName, source: "city" },
        "City selected and saved for Qibla direction."
      );
    },
    [applyLocation]
  );

  const handleClearLocation = () => {
    clearSavedQiblaLocation();
    setLocation(null);
    setMode("idle");
    setMessage("");
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-32 space-y-5">
      <div className={`rounded-3xl border p-5 ${cardClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-extrabold mb-3">
              <Target className="w-3.5 h-3.5" />
              Kaaba Direction
            </div>
            <h2 className={`text-2xl font-extrabold tracking-tight ${strongText}`}>Find Qibla accurately</h2>
            <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
              Use your current location or search a city. On phones, enable live compass for a rotating Qibla needle.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20 flex-shrink-0">
            <Compass className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            onClick={handleUseCurrentLocation}
            disabled={mode === "location-request"}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold transition-all active:scale-95 disabled:opacity-60"
          >
            <Navigation className="w-4 h-4" />
            {mode === "location-request" ? "Detecting..." : "Use My Location"}
          </button>
          <button
            onClick={() => setShowSearch((value) => !value)}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-extrabold transition-all active:scale-95 ${
              isLightMode
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                : "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Search className="w-4 h-4" />
            Search City
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-4 flex items-start gap-3 ${
            mode === "error"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
              : "bg-emerald-500/10 border-emerald-500/25 text-emerald-500"
          }`}
        >
          {mode === "error" ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <p className="text-xs font-semibold leading-relaxed">{message}</p>
        </div>
      )}

      {showSearch && (
        <div className={`rounded-3xl border p-4 space-y-4 ${cardClass}`}>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleCitySearch()}
              placeholder="Search city, e.g. Abuja Nigeria"
              className={`flex-1 min-w-0 px-4 py-3 rounded-2xl border text-sm font-semibold outline-none ring-0 focus:ring-2 ${inputClass}`}
            />
            <button
              onClick={handleCitySearch}
              disabled={isSearching}
              className="px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 disabled:opacity-60"
              aria-label="Search city"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.displayName}
                onClick={() => applyLocation(preset, `${preset.displayName} selected and saved.`)}
                className={`text-left p-3 rounded-2xl border transition-all active:scale-95 ${
                  isLightMode
                    ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    : "bg-slate-900/70 border-slate-700 hover:bg-slate-800"
                }`}
              >
                <p className={`text-xs font-extrabold truncate ${strongText}`}>{preset.displayName}</p>
                <p className={`text-[11px] mt-0.5 ${mutedText}`}>Quick select</p>
              </button>
            ))}
          </div>

          {searchResults.length > 0 && (
            <div className={`rounded-2xl border overflow-hidden ${isLightMode ? "border-slate-200" : "border-slate-700"}`}>
              {searchResults.map((result) => (
                <button
                  key={`${result.lat}-${result.lng}-${result.displayName}`}
                  onClick={() => handleSelectCity(result)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 border-b last:border-b-0 transition-colors ${
                    isLightMode
                      ? "border-slate-200 hover:bg-slate-50"
                      : "border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <span className={`text-xs font-semibold leading-relaxed ${strongText}`}>{result.displayName}</span>
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {qiblaInfo && location && (
        <>
          <div className={`rounded-3xl border p-5 ${cardClass}`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-widest ${mutedText}`}>Current Qibla location</p>
                <h3 className={`text-base font-extrabold truncate mt-1 ${strongText}`}>{displayLocation}</h3>
              </div>
              <button
                onClick={handleClearLocation}
                className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                  isLightMode
                    ? "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    : "border-slate-700 bg-slate-900 hover:bg-slate-800"
                }`}
                title="Clear saved Qibla location"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto my-4 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full border-4 overflow-hidden ${
                  isLightMode
                    ? "border-slate-200 bg-gradient-to-b from-white to-slate-100"
                    : "border-slate-700 bg-gradient-to-b from-slate-800 to-slate-950"
                }`}
              >
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-black text-amber-500 tracking-widest">N</span>
                <span className={`absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-black tracking-widest ${mutedText}`}>S</span>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black tracking-widest ${mutedText}`}>W</span>
                <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black tracking-widest ${mutedText}`}>E</span>

                {Array.from({ length: 72 }).map((_, index) => {
                  const isMajor = index % 6 === 0;
                  return (
                    <div
                      key={index}
                      className={`absolute top-1/2 left-1/2 origin-bottom ${
                        isMajor ? "w-[2px] h-4 bg-emerald-500/70" : "w-[1px] h-2 bg-slate-500/40"
                      }`}
                      style={{
                        transform: `translate(-50%, -136px) rotate(${index * 5}deg)`,
                        transformOrigin: "50% 136px",
                      }}
                    />
                  );
                })}
              </div>

              <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${needleRotation}deg)` }}
              >
                <div className="relative w-5 h-56 flex flex-col items-center">
                  <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/30 border border-emerald-300/40 z-10">
                    <span className="text-2xl leading-none">🕋</span>
                  </div>
                  <div className="w-1.5 h-40 bg-gradient-to-b from-emerald-500 via-emerald-600 to-transparent rounded-full shadow-lg" />
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-amber-400 rounded-full border-2 border-slate-900 shadow-xl z-20" />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className={`rounded-2xl p-4 text-center ${isLightMode ? "bg-slate-50" : "bg-slate-900/70"}`}>
                <p className="text-2xl font-black text-emerald-500">{Math.round(qiblaInfo.bearing)}°</p>
                <p className={`text-[11px] font-bold mt-1 ${mutedText}`}>Bearing</p>
              </div>
              <div className={`rounded-2xl p-4 text-center ${isLightMode ? "bg-slate-50" : "bg-slate-900/70"}`}>
                <p className={`text-2xl font-black ${strongText}`}>{bearingDirection}</p>
                <p className={`text-[11px] font-bold mt-1 ${mutedText}`}>Direction</p>
              </div>
              <div className={`rounded-2xl p-4 text-center ${isLightMode ? "bg-slate-50" : "bg-slate-900/70"}`}>
                <p className={`text-lg font-black ${strongText}`}>{formatDistanceKm(qiblaInfo.distance)}</p>
                <p className={`text-[11px] font-bold mt-1 ${mutedText}`}>Distance</p>
              </div>
            </div>

            <button
              onClick={handleEnableCompass}
              className={`w-full mt-5 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-extrabold text-sm transition-all active:scale-95 ${
                mode === "tracking"
                  ? "bg-emerald-600 text-white"
                  : isLightMode
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-white text-slate-950 hover:bg-slate-100"
              }`}
            >
              {mode === "tracking" ? <CheckCircle className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
              {mode === "tracking" ? "Live Compass Active" : "Enable Live Phone Compass"}
            </button>
          </div>

          <div
            className={`rounded-2xl border p-4 text-xs leading-relaxed ${
              isLightMode
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-amber-500/10 border-amber-500/25 text-amber-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>
                Compass sensors can be affected by metal, magnets, laptops, cars, and phone cases. For prayer, use this as a helpful guide and re-check in an open place when possible.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
