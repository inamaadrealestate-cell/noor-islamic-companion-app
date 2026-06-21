// lib/qibla.ts

// ================================
// KAABA COORDINATES (fixed, never changes)
// ================================
export const KAABA_LAT = 21.4225;
export const KAABA_LNG = 39.8262;

// ================================
// TYPES
// ================================

export interface QiblaResult {
  bearing: number;        // degrees from true north (0-360)
  distance: number;       // distance to Kaaba in km
}

export interface DeviceOrientation {
  alpha: number | null;   // compass heading from device
  absolute: boolean;
}

// ================================
// CALCULATE QIBLA BEARING (Great Circle Formula)
// ================================
// This is the standard formula used by all Islamic prayer apps

export function calculateQiblaBearing(
  userLat: number,
  userLng: number
): number {
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(KAABA_LAT);
  const deltaLng = toRadians(KAABA_LNG - userLng);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  let bearing = toDegrees(Math.atan2(y, x));

  // Normalize to 0-360
  bearing = (bearing + 360) % 360;

  return bearing;
}

// ================================
// CALCULATE DISTANCE TO KAABA (Haversine Formula)
// ================================

export function calculateDistanceToKaaba(
  userLat: number,
  userLng: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(KAABA_LAT - userLat);
  const dLng = toRadians(KAABA_LNG - userLng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(KAABA_LAT)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ================================
// COMBINED HELPER
// ================================

export function getQiblaInfo(
  userLat: number,
  userLng: number
): QiblaResult {
  return {
    bearing: calculateQiblaBearing(userLat, userLng),
    distance: calculateDistanceToKaaba(userLat, userLng),
  };
}

// ================================
// GET USER'S CURRENT LOCATION (Browser Geolocation API)
// ================================

export function getUserLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// ================================
// REQUEST DEVICE ORIENTATION PERMISSION (iOS 13+ requires this)
// ================================

export async function requestOrientationPermission(): Promise<boolean> {
  // iOS 13+ requires explicit permission request
  if (
    typeof (window as any).DeviceOrientationEvent !== "undefined" &&
    typeof (window as any).DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const permission = await (window as any).DeviceOrientationEvent.requestPermission();
      return permission === "granted";
    } catch {
      return false;
    }
  }
  // Android and older iOS don't need explicit permission
  return true;
}

// ================================
// SUBSCRIBE TO DEVICE COMPASS HEADING
// ================================

export function subscribeToCompass(
  callback: (heading: number) => void
): () => void {
  function handleOrientation(event: DeviceOrientationEvent) {
    let heading: number | null = null;

    // iOS provides webkitCompassHeading (more accurate, already true north)
    if ((event as any).webkitCompassHeading !== undefined) {
      heading = (event as any).webkitCompassHeading;
    }
    // Android/standard: alpha is relative to device's initial orientation
    else if (event.alpha !== null) {
      heading = 360 - event.alpha; // convert to compass heading
    }

    if (heading !== null) {
      callback(heading);
    }
  }

  window.addEventListener("deviceorientationabsolute", handleOrientation as any, true);
  window.addEventListener("deviceorientation", handleOrientation as any, true);

  // Return cleanup function
  return () => {
    window.removeEventListener("deviceorientationabsolute", handleOrientation as any, true);
    window.removeEventListener("deviceorientation", handleOrientation as any, true);
  };
}

// ================================
// CALCULATE NEEDLE ROTATION FOR UI
// ================================
// This gives you the exact rotation angle to apply to the compass needle
// accounting for both Qibla bearing AND current device heading

export function getNeedleRotation(
  qiblaBearing: number,
  deviceHeading: number
): number {
  return (qiblaBearing - deviceHeading + 360) % 360;
}

// ================================
// HELPERS
// ================================

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

// ================================
// FALLBACK: SEARCH CITY → COORDINATES
// ================================
// For when geolocation permission is denied
// Uses free OpenStreetMap Nominatim API (no key required)

export async function searchCityCoordinates(
  cityName: string
): Promise<{ lat: number; lng: number; displayName: string }[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cityName
    )}&format=json&limit=5`,
    {
      headers: {
        "Accept-Language": "en",
      },
    }
  );

  if (!response.ok) {
    throw new Error("City search failed");
  }

  const data = await response.json();

  return data.map((item: any) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
  }));
}
