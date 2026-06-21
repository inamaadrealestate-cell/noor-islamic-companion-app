type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const APP_INSTALL_DISMISSED_KEY = "noor_install_prompt_dismissed";
const SERVICE_WORKER_PATH = "/sw.js";

function isStandaloneMode(): boolean {
  const standaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const navigatorStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneMedia || navigatorStandalone;
}

function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_PATH)
      .then((registration) => {
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);
  });
}

function createInstallBanner(event: BeforeInstallPromptEvent): void {
  if (isStandaloneMode()) return;
  if (localStorage.getItem(APP_INSTALL_DISMISSED_KEY) === "true") return;
  if (document.getElementById("noor-install-banner")) return;

  const banner = document.createElement("div");
  banner.id = "noor-install-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-live", "polite");
  banner.style.cssText = [
    "position:fixed",
    "left:12px",
    "right:12px",
    "bottom:84px",
    "z-index:9999",
    "max-width:520px",
    "margin:0 auto",
    "padding:14px",
    "border-radius:22px",
    "border:1px solid rgba(16,185,129,.35)",
    "background:linear-gradient(135deg, rgba(15,23,42,.98), rgba(6,78,59,.96))",
    "box-shadow:0 24px 70px rgba(0,0,0,.4)",
    "color:white",
    "font-family:Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    "display:flex",
    "gap:12px",
    "align-items:center",
  ].join(";");

  const text = document.createElement("div");
  text.style.cssText = "flex:1;min-width:0";
  text.innerHTML = `<div style="font-weight:900;font-size:14px;letter-spacing:.04em">Install NoorQuran</div><div style="font-size:12px;line-height:1.45;color:rgba(226,232,240,.9);margin-top:3px">Add it to your phone or desktop for a cleaner app experience.</div>`;

  const installButton = document.createElement("button");
  installButton.type = "button";
  installButton.textContent = "Install";
  installButton.style.cssText = "border:0;border-radius:14px;background:#10b981;color:#fff;font-weight:900;padding:11px 14px;cursor:pointer";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "Dismiss install prompt");
  closeButton.style.cssText = "border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(15,23,42,.72);color:#fff;font-size:20px;line-height:1;padding:8px 12px;cursor:pointer";

  closeButton.addEventListener("click", () => {
    localStorage.setItem(APP_INSTALL_DISMISSED_KEY, "true");
    banner.remove();
  });

  installButton.addEventListener("click", async () => {
    banner.remove();
    await event.prompt();
    await event.userChoice.catch(() => undefined);
  });

  banner.append(text, installButton, closeButton);
  document.body.appendChild(banner);
}

function setupInstallPrompt(): void {
  window.addEventListener("beforeinstallprompt", (rawEvent) => {
    rawEvent.preventDefault();
    createInstallBanner(rawEvent as BeforeInstallPromptEvent);
  });

  window.addEventListener("appinstalled", () => {
    localStorage.setItem(APP_INSTALL_DISMISSED_KEY, "true");
    document.getElementById("noor-install-banner")?.remove();
  });
}

registerServiceWorker();
setupInstallPrompt();
