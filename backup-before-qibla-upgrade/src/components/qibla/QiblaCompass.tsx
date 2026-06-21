// components/qibla/QiblaCompass.tsx
import { useEffect, useState, useCallback } from "react";
import {
  getQiblaInfo,
  getUserLocation,
  requestOrientationPermission,
  subscribeToCompass,
  getNeedleRotation,
  searchCityCoordinates,
} from "../../lib/qibla";
import { Compass, MapPin, Search, AlertCircle, Navigation } from "lucide-react";

export default function QiblaCompass() {
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [permissionState, setPermissionState] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<
    { lat: number; lng: number; displayName: string }[]
  >([]);

  // ================================
  // INITIALIZE: get location + compass permission
  // ================================

  const initializeCompass = useCallback(async () => {
    setPermissionState("requesting");
    setError("");

    try {
      // 1. Get user's location
      const location = await getUserLocation();
      const qiblaInfo = getQiblaInfo(location.lat, location.lng);
      setQiblaBearing(qiblaInfo.bearing);
      setDistance(qiblaInfo.distance);

      // 2. Request device orientation permission (iOS 13+)
      const orientationGranted = await requestOrientationPermission();

      if (orientationGranted) {
        setPermissionState("granted");
      } else {
        setError(
          "Compass permission denied. You can still see the Qibla direction in degrees."
        );
        setPermissionState("denied");
      }
    } catch (err: any) {
      setError(
        err?.code === 1
          ? "Location permission denied. Please search for your city instead."
          : "Could not get your location. Please search for your city instead."
      );
      setPermissionState("denied");
      setShowSearch(true);
    }
  }, []);

  // ================================
  // SUBSCRIBE TO COMPASS HEADING
  // ================================

  useEffect(() => {
    if (permissionState !== "granted") return;

    const unsubscribe = subscribeToCompass((heading) => {
      setDeviceHeading(heading);
    });

    return unsubscribe;
  }, [permissionState]);

  // ================================
  // MANUAL CITY SEARCH (fallback)
  // ================================

  async function handleCitySearch() {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchCityCoordinates(searchQuery);
      setSearchResults(results);
    } catch {
      setError("Could not search for that city. Please try again.");
    }
  }

  function selectCity(lat: number, lng: number) {
    const qiblaInfo = getQiblaInfo(lat, lng);
    setQiblaBearing(qiblaInfo.bearing);
    setDistance(qiblaInfo.distance);
    setShowSearch(false);
    setSearchResults([]);
    setError("");
  }

  // ================================
  // CALCULATE NEEDLE ROTATION
  // ================================

  const needleRotation =
    qiblaBearing !== null
      ? permissionState === "granted"
        ? getNeedleRotation(qiblaBearing, deviceHeading)
        : qiblaBearing
      : 0;

  // ================================
  // RENDER
  // ================================

  if (permissionState === "idle" || permissionState === "requesting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-900/20">
          <Compass className="w-10 h-10 text-emerald-400 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Find the Qibla Direction
        </h2>
        <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
          We need your location to calculate the exact direction to the Kaaba in Makkah.
        </p>
        <button
          onClick={initializeCompass}
          disabled={permissionState === "requesting"}
          className="flex items-center gap-2 px-8 py-3.5 bg-emerald-700 text-white font-semibold rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-900/30 disabled:opacity-50 active:scale-95"
        >
          <Navigation className="w-5 h-5 animate-bounce" />
          {permissionState === "requesting" ? "Detecting Location..." : "Enable Location & Compass"}
        </button>
        <button
          onClick={() => { setPermissionState("denied"); setShowSearch(true); }}
          className="mt-6 text-sm text-slate-400 hover:text-slate-200 underline transition-colors"
        >
          Or search for your city manually
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-lg mx-auto">
      {/* Error banner */}
      {error && (
        <div className="w-full mb-6 p-4 bg-amber-950/40 border border-amber-800/50 rounded-2xl flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">{error}</p>
        </div>
      )}

      {/* City search */}
      {showSearch && (
        <div className="w-full mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
              placeholder="Search your city (e.g. London, Cairo, New York)..."
              className="flex-1 px-4 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-inner"
            />
            <button
              onClick={handleCitySearch}
              className="px-5 bg-emerald-700 rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 bg-slate-800/90 border border-slate-700 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md divide-y divide-slate-700/60">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectCity(result.lat, result.lng)}
                  className="w-full text-left px-4 py-3.5 text-sm text-slate-200 hover:bg-slate-700/80 transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium">{result.displayName}</span>
                  <MapPin className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compass */}
      {qiblaBearing !== null && (
        <>
          <div className="relative w-80 h-80 mb-10 flex items-center justify-center">
            {/* Outer compass ring */}
            <div className="absolute inset-0 rounded-full border-4 border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl overflow-hidden">
              {/* Cardinal direction labels */}
              <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-amber-400/90 tracking-wider">N</span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500 tracking-wider">S</span>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 tracking-wider">W</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 tracking-wider">E</span>

              {/* Degree tick marks */}
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-[2px] h-3 bg-slate-600/60 origin-bottom"
                  style={{
                    transform: `translate(-50%, -150px) rotate(${i * 10}deg)`,
                    transformOrigin: "50% 150px",
                  }}
                />
              ))}
            </div>

            {/* Rotating needle pointing to Qibla */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <div className="relative w-4 h-64 flex flex-col items-center">
                {/* Kaaba icon at the tip */}
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/40 border border-emerald-400/30 mb-2 z-10 animate-pulse">
                  <span className="text-2xl">🕋</span>
                </div>
                {/* Needle line */}
                <div className="w-1.5 h-44 bg-gradient-to-b from-emerald-500 via-emerald-600 to-transparent rounded-full shadow-lg" />
              </div>
            </div>

            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-400 rounded-full shadow-xl border-2 border-slate-900 z-20" />
          </div>

          {/* Info card */}
          <div className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 text-center shadow-xl backdrop-blur-sm">
            <p className="text-4xl font-extrabold text-white mb-2 tracking-tight">
              {Math.round(qiblaBearing)}°
            </p>
            <p className="text-sm font-medium text-slate-300 mb-4">
              Direction to Qibla from True North
            </p>
            {distance !== null && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-900/40 border border-emerald-500/30 rounded-full">
                <span className="text-sm font-bold text-emerald-400">
                  {Math.round(distance).toLocaleString()} km
                </span>
                <span className="text-xs text-slate-400">to Makkah</span>
              </div>
            )}
          </div>

          {permissionState === "granted" ? (
            <p className="mt-6 text-xs text-slate-400 text-center max-w-xs leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              💡 Hold your phone flat and rotate until the Kaaba icon points straight up towards the top of your phone.
            </p>
          ) : (
            <p className="mt-6 text-xs text-amber-400/90 text-center max-w-xs leading-relaxed bg-amber-950/20 p-3 rounded-xl border border-amber-800/30">
              🧭 Static compass bearing shown. Use a physical compass or map app with the degree bearing above for exact alignment.
            </p>
          )}

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            <MapPin className="w-4 h-4 text-emerald-500" />
            {showSearch ? "Hide search" : "Change location"}
          </button>
        </>
      )}
    </div>
  );
}
