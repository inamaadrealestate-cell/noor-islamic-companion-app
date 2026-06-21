type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type NoorNotificationStatus =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

const SERVICE_WORKER_PATH = "/sw.js";

let serviceWorkerReloading = false;

declare global {
  interface Window {
    noorDeferredInstallPrompt?: BeforeInstallPromptEvent;
    noorPromptInstall?: () => Promise<void>;
    noorApplyUpdate?: () => Promise<void>;
  }
}

function isStandaloneMode(): boolean {
  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone,
  );
  return standaloneMedia || navigatorStandalone;
}

function dispatchUpdateAvailable(): void {
  window.dispatchEvent(new Event("noor-update-available"));
}

export function getPrayerNotificationStatus(): NoorNotificationStatus {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NoorNotificationStatus;
}

export async function registerNoorServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH);

    if (registration.waiting && navigator.serviceWorker.controller) {
      dispatchUpdateAvailable();
    }

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          dispatchUpdateAvailable();
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (serviceWorkerReloading) return;
      serviceWorkerReloading = true;
      window.location.reload();
    });

    registration.update().catch(() => undefined);
    return registration;
  } catch {
    return null;
  }
}

export async function requestPrayerNotificationPermission(): Promise<{
  status: NoorNotificationStatus;
  serviceWorkerReady: boolean;
  message: string;
}> {
  if (!("Notification" in window)) {
    return {
      status: "unsupported",
      serviceWorkerReady: false,
      message: "This browser does not support web notifications.",
    };
  }

  const registration = await registerNoorServiceWorker();
  const permission = await Notification.requestPermission();
  const status = permission as NoorNotificationStatus;

  if (status === "granted") {
    return {
      status,
      serviceWorkerReady: Boolean(registration),
      message: registration
        ? "Prayer notifications enabled. NoorQuran can now show browser notifications on this device."
        : "Notification permission granted, but the service worker is not ready yet. Refresh once and try again.",
    };
  }

  if (status === "denied") {
    return {
      status,
      serviceWorkerReady: Boolean(registration),
      message:
        "Notifications are blocked. Open this site's browser settings and allow notifications for NoorQuran.",
    };
  }

  return {
    status,
    serviceWorkerReady: Boolean(registration),
    message: "Notification permission was not granted yet.",
  };
}

export async function showPrayerNotificationTest(): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const registration = await registerNoorServiceWorker();
  if (registration?.showNotification) {
    await registration.showNotification("NoorQuran notifications are ready", {
      body: "Prayer reminder notifications are enabled on this device.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "noorquran-notification-test",
      data: { url: "/" },
    });
    return true;
  }

  new Notification("NoorQuran notifications are ready", {
    body: "Prayer reminder notifications are enabled on this device.",
    icon: "/icons/icon-192.png",
    tag: "noorquran-notification-test",
  });
  return true;
}

function setupInstallPrompt(): void {
  if (isStandaloneMode()) return;

  window.addEventListener("beforeinstallprompt", (rawEvent) => {
    rawEvent.preventDefault();
    window.noorDeferredInstallPrompt = rawEvent as BeforeInstallPromptEvent;
  });

  window.noorPromptInstall = async () => {
    const event = window.noorDeferredInstallPrompt;
    if (!event) return;

    window.noorDeferredInstallPrompt = undefined;
    await event.prompt();
    await event.userChoice.catch(() => undefined);
  };

  window.addEventListener("appinstalled", () => {
    window.noorDeferredInstallPrompt = undefined;
  });
}

window.noorApplyUpdate = async () => {
  const registration = await navigator.serviceWorker?.getRegistration(SERVICE_WORKER_PATH);
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    return;
  }
  window.location.reload();
};

window.addEventListener("load", () => {
  registerNoorServiceWorker().catch(() => undefined);
});
setupInstallPrompt();
