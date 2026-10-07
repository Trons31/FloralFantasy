"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { LuEye, LuEyeOff, LuLock, LuMail, LuShieldCheck, LuShoppingBag, LuTruck } from "react-icons/lu";
import { PiFlowerTulip } from "react-icons/pi";
import BrandLogo, { BRAND_NAME } from "@/components/ui/BrandLogo";
import LoadingButton from "@/components/ui/LoadingButton";
import { fontInter } from "@/config/fonts";

const inputClass =
  "h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 px-11 text-sm font-medium text-gray-900 transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 lg:h-11 lg:rounded-xl";

const features = [
  { icon: LuShoppingBag, title: "Pedidos", text: "Tablero al día" },
  { icon: LuTruck, title: "Entregas", text: "Equipo conectado" },
  { icon: LuShieldCheck, title: "Seguro", text: "Acceso protegido" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (res?.ok && !res.error) {
        // `replace` y no `push`: el login no debe quedar en el historial, y la
        // navegacion completa evita repintar esta pantalla antes del panel.
        window.location.replace("/dashboard");
        return;
      }

      setError("Correo o contraseña incorrectos");
      setLoading(false);
    } catch {
      setError("No pudimos conectar con el servicio de acceso. Intenta nuevamente.");
      setLoading(false);
    }
  };

  return (
    <main className={`${fontInter.className} relative min-h-[100svh] overflow-hidden bg-gray-950 text-white lg:h-[100svh] lg:min-h-0`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-brand-950/40 to-gray-950" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(247, 45, 114, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(247, 45, 114, 0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <PiFlowerTulip className="absolute right-8 top-20 h-24 w-24 rotate-12 text-brand-400/10 md:right-20 md:top-28 md:h-32 md:w-32" />
      <PiFlowerTulip className="absolute bottom-20 left-8 h-16 w-16 -rotate-12 text-brand-400/10 md:left-20" />

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-6xl items-center gap-10 px-4 py-8 lg:h-full lg:min-h-0 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-6 lg:py-5">
        <section className="hidden lg:block">
          <div className="mb-10 inline-flex items-center gap-2.5">
            <BrandLogo size={32} variant="dark" />
            <span className="text-xl font-black tracking-tight">{BRAND_NAME}</span>
          </div>

          <div className="max-w-xl">
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight">
              Gestiona tu floristería con una experiencia más{" "}
              <span className="bg-gradient-to-r from-brand-300 to-pink-200 bg-clip-text text-transparent">simple</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-gray-300">
              Entra a tu panel, revisa pedidos, valida pagos y coordina a tu equipo desde un inicio de sesión limpio y seguro.
            </p>

            <div className="mt-7 grid max-w-lg grid-cols-3 gap-3">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
                  <Icon className="mb-2 h-5 w-5 text-brand-300" />
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-gray-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 text-center lg:hidden">
            <BrandLogo size={56} variant="dark" priority className="mx-auto mb-4 rounded-2xl" />
            <h1 className="text-3xl font-black">{BRAND_NAME}</h1>
            <p className="mt-1 text-sm text-gray-400">Panel de gestión de la floristería</p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white p-6 text-gray-950 shadow-lg shadow-brand-950/20 md:p-8 md:shadow-2xl md:shadow-brand-950/30 lg:p-6">
            <div className="mb-6 lg:mb-4">
              <h2 className="text-2xl font-black tracking-tight lg:text-xl">Iniciar sesión</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500 lg:leading-5">
                Entra con el correo y la contraseña de tu cuenta.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-bold text-gray-700">Correo</label>
                <div className="relative">
                  <LuMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-bold text-gray-700">Contraseña</label>
                <div className="relative">
                  <LuLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <LoadingButton type="submit" loading={loading} className="h-12 w-full rounded-2xl lg:h-11 lg:rounded-xl">
                {loading ? "Entrando..." : "Entrar a mi panel"}
              </LoadingButton>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-gray-400 lg:mt-5">
              ¿Eres del equipo de operaciones?{" "}
              <a href="/operaciones" className="font-bold text-brand-600 hover:underline">
                Entra aquí
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
