// lib/qibla.ts

export const KAABA_LAT = 21.4225;
export const KAABA_LNG = 39.8262;

const QIBLA_LOCATION_STORAGE_KEY = "noor_qibla_location";

export interface QiblaResult {
  bearing: number;
  distance: number;
}

export interface QiblaLocation {
  lat: number;
  lng: number;
  displayName: string;
  source: "device" | "city" | "saved" | "preset";
  savedAt?: string;
}

export interface CitySearchResult {
  lat: number;
  lng: number;
  displayName: string;
  type?: string;
}

export function calculateQiblaBearing(userLat: number, userLng: number): number {
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(KAABA_LAT);
  const deltaLng = toRadians(KAABA_LNG - userLng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

export function calculateDistanceToKaaba(userLat: number, userLng: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(KAABA_LAT - userLat);
  const dLng = toRadians(KAABA_LNG - userLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(KAABA_LAT)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function getQiblaInfo(userLat: number, userLng: number): QiblaResult {
  return {
    bearing: calculateQiblaBearing(userLat, userLng),
    distance: calculateDistanceToKaaba(userLat, userLng),
  };
}

export function getUserLocation(): Promise<QiblaLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          displayName: "Current device location",
          source: "device",
        });
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  });
}

export async function requestOrientationPermission(): Promise<boolean> {
  const orientationEvent = (window as unknown as {
    DeviceOrientationEvent?: {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
  }).DeviceOrientationEvent;

  if (orientationEvent?.requestPermission) {
    try {
      const permission = await orientationEvent.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }

  return typeof window !== "undefined" && "DeviceOrientationEvent" in window;
}

export function subscribeToCompass(callback: (heading: number) => void): () => void {
  function handleOrientation(event: DeviceOrientationEvent) {
    let heading: number | null = null;

    const iosHeading = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
    if (typeof iosHeading === "number") {
      heading = iosHeading;
    } else if (typeof event.alpha === "number") {
      heading = 360 - event.alpha;
    }

    if (heading !== null && Number.isFinite(heading)) {
      callback(normalizeDegrees(heading));
    }
  }

  window.addEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
  window.addEventListener("deviceorientation", handleOrientation as EventListener, true);

  return () => {
    window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
    window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
  };
}

export function getNeedleRotation(qiblaBearing: number, deviceHeading: number): number {
  return normalizeDegrees(qiblaBearing - deviceHeading);
}

export function saveQiblaLocation(location: QiblaLocation): void {
  try {
    localStorage.setItem(QIBLA_LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Local storage can be blocked in private browsing. Qibla can still work for the current session.
  }
}

export function getSavedQiblaLocation(): QiblaLocation | null {
  try {
    const raw = localStorage.getItem(QIBLA_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QiblaLocation;

    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng) || !parsed.displayName) {
      return null;
    }

    return { ...parsed, source: "saved" };
  } catch {
    return null;
  }
}

export function clearSavedQiblaLocation(): void {
  try {
    localStorage.removeItem(QIBLA_LOCATION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

export async function searchCityCoordinates(cityName: string): Promise<CitySearchResult[]> {
  const query = cityName.trim();
  if (!query) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "7");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "en",
    },
  });

  if (!response.ok) {
    throw new Error("City search failed.");
  }

  const data = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    type?: string;
  }>;

  const seen = new Set<string>();

  return data
    .map((item) => {
      const lat = Number.parseFloat(item.lat || "");
      const lng = Number.parseFloat(item.lon || "");
      const displayName = item.display_name || "Unknown location";
      return { lat, lng, displayName, type: item.type };
    })
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .filter((item) => {
      const key = `${item.lat.toFixed(4)},${item.lng.toFixed(4)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function formatDistanceKm(distance: number): string {
  if (distance >= 1000) {
    return `${Math.round(distance).toLocaleString()} km`;
  }

  return `${distance.toFixed(1)} km`;
}

export function getShortLocationName(displayName: string): string {
  const parts = displayName
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 2) return displayName;
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}

export function getCardinalDirection(bearing: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(normalizeDegrees(bearing) / 22.5) % directions.length;
  return directions[index];
}

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
