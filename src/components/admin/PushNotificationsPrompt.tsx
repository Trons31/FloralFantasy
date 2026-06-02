"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiCloseLine, RiNotification3Line, RiSmartphoneLine, RiShieldCheckLine } from "react-icons/ri";

function base64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationsPrompt() {
const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const canUsePush =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setSupported(canUsePush);

    if (!canUsePush) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setInstalled(standalone);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) return;
        if (Notification.permission !== "denied") {
          setVisible(true);
        }
      })
      .catch(() => {
        if (Notification.permission !== "denied") {
          setVisible(true);
        }
      });
  }, []);

  const handleEnable = async () => {
    if (!supported) {
      toast.error("Este navegador no soporta notificaciones");
      return;
    }

    setBusy(true);
    try {
      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Debes permitir las notificaciones");
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const res = await fetch("/api/push-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(existing.toJSON()),
        });
        if (!res.ok) {
          throw new Error("No se pudo registrar la suscripción");
        }
        setVisible(false);
        toast.success("Notificaciones activadas");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("Falta la clave pública VAPID");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar la suscripción");
      }

      setVisible(false);
      toast.success("Notificaciones activadas");
    } catch (error: any) {
      toast.error(error?.message || "No se pudieron activar las notificaciones");
    } finally {
      setBusy(false);
    }
  };

  if (!supported || !visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(92vw,380px)] rounded-3xl border border-pink-100 bg-white/95 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
          <RiNotification3Line className="text-xl" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Activa notificaciones</h3>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <RiCloseLine />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            Recibe avisos de nuevos pedidos y recordatorios de comprobantes pendientes.
            {installed ? "" : " En iPhone, primero instala la app en la pantalla de inicio."}
          </p>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500">
            <RiSmartphoneLine className="text-sm text-pink-500" />
            <span>PWA lista para instalar</span>
            <RiShieldCheckLine className="text-sm text-emerald-500" />
            <span>Sin duplicados</span>
          </div>

          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Activando..." : "Activar notificaciones"}
          </button>
        </div>
      </div>
    </div>
  );
}
