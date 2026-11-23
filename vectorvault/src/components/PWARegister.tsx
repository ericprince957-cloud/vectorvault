"use client";
import { useEffect, useState } from "react";
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };
export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }
  if (installed || !installPrompt) return null;
  return <button type="button" onClick={installApp} aria-label="Install VectorVault on your device" className="fixed bottom-5 right-5 z-50 rounded-full border border-[#E5C76B]/40 bg-[#C9A227] px-5 py-3 text-sm font-semibold text-black shadow-xl shadow-black/40 transition hover:bg-[#E5C76B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5C76B]">Install VectorVault</button>;
}
