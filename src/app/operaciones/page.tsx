"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RiEyeLine, RiEyeOffLine, RiFlowerLine, RiLockLine, RiMailLine, RiLoader4Line } from "react-icons/ri";
import PreparadorView from "./PreparadorView";
import RepartidorView from "./RepartidorView";
import CorredorView from "./CorredorView";
import PushNotificationsPrompt from "@/components/admin/PushNotificationsPrompt";

type OperationsUser = {
  id: string;
  name: string;
  email: string;
  role: "PREPARADOR" | "REPARTIDOR" | "CORREDOR";
};

export default function OperacionesPage() {
  const router = useRouter();
  const [user, setUser] = useState<OperationsUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await fetch("/api/operaciones");
        const data = await res.json().catch(() => null);
        if (res.ok && data?.user) {
          setUser(data.user);
        }
      } finally {
        setLoadingSession(false);
      }
    };
    void restoreSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/operaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No fue posible iniciar sesión");
      }

      if (data?.user?.role) {
        setUser(data.user);
        setPassword("");
        router.refresh();
        return;
      }

      throw new Error("No fue posible iniciar sesión");
    } catch (err: any) {
      setError(err?.message || "No fue posible iniciar sesión");
      toast.error(err?.message || "No fue posible iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/operaciones/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setEmail("");
    setPassword("");
    setError("");
    router.refresh();
  };

  if (loadingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-primary-50 to-rose-50">
        <RiLoader4Line className="animate-spin text-primary-500" size={34} />
      </div>
    );
  }

  if (user?.role === "PREPARADOR") {
    return (
      <>
        <PreparadorView user={user} onLogout={handleLogout} />
        <PushNotificationsPrompt />
      </>
    );
  }

  if (user?.role === "REPARTIDOR") {
    return (
      <>
        <RepartidorView user={user} onLogout={handleLogout} />
        <PushNotificationsPrompt />
      </>
    );
  }

  if (user?.role === "CORREDOR") {
    return (
      <>
        <CorredorView user={user} onLogout={handleLogout} />
        <PushNotificationsPrompt />
      </>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f172a] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.16),transparent_28%),linear-gradient(135deg,#0f172a_0%,#111827_38%,#1f2937_100%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <section className="hidden flex-col justify-center lg:flex">
            <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs text-white/85 backdrop-blur">
              <RiFlowerLine size={16} className="text-rose-300" />
              Acceso seguro para operaciones
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight xl:text-6xl">
              Entra con tu correo y contraseña
              <span className="block text-rose-300">y mantén la sesión activa</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
              Cuando ingreses, el sistema te pedirá permiso para notificaciones y así podrás recibir pedidos nuevos, cambios de estado y avisos de entrega.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/72">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">Sesión persistente</span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">Alertas en tiempo real</span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">Flujo operativo</span>
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/20">
                    <RiFlowerLine size={22} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesión</h2>
                  <p className="mt-1.5 max-w-sm text-sm leading-5 text-slate-500">
                    Usa tu correo y contraseña de equipo para entrar.
                  </p>
                </div>
                <div className="hidden rounded-2xl bg-rose-50 p-2.5 text-rose-500 sm:block">
                  <RiLockLine size={18} />
                </div>
              </div>

              <div className="space-y-3.5">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Correo</span>
                  <div className="relative">
                    <RiMailLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Contraseña</span>
                  <div className="relative">
                    <RiLockLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <RiLoader4Line className="animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <RiLockLine size={18} />
                      Iniciar sesión
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
