"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCloseLine,
  RiShieldStarLine,
  RiFlowerLine,
  RiSparklingLine,
  RiMailLine,
} from "react-icons/ri";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (res?.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setError("Email o contraseña incorrectos");
    } catch {
      setError("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c0a22] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.20),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.20),transparent_28%),linear-gradient(135deg,#120c2f_0%,#0f1230_38%,#1f2f77_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_.95fr] xl:gap-10">
          <section className="hidden flex-col justify-center lg:flex">
            <div className="mb-5 inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs text-white/85 backdrop-blur sm:text-sm">
              <RiSparklingLine size={16} className="text-fuchsia-300" />
              Acceso seguro para el panel administrativo
            </div>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Gestiona tu floristeria
              <span className="block text-fuchsia-300">con una experiencia mas limpia</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/72 sm:text-base sm:leading-7">
              Entra con tu correo y contrasena para revisar pedidos, validar pagos y mover todo el flujo del negocio sin friccion.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/72">
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">Pedidos claros</span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">Acceso protegido</span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur">Flujo rapido</span>
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white p-5 text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:max-w-lg sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white shadow-lg shadow-fuchsia-500/20">
                    <RiFlowerLine size={22} />
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Iniciar sesion</h2>
                  <p className="mt-1.5 max-w-sm text-sm leading-5 text-slate-500">
                    Usa tu correo y contrasena para acceder al panel.
                  </p>
                </div>
                <div className="hidden rounded-2xl bg-fuchsia-50 p-2.5 text-fuchsia-500 sm:block">
                  <RiShieldStarLine size={18} />
                </div>
              </div>

              <div className="my-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Acceso por correo</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Correo</label>
                  <div className="relative">
                    <RiMailLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      required
                      autoComplete="email"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-400 focus:bg-white focus:ring-4 focus:ring-fuchsia-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Contrasena</label>
                  <div className="relative">
                    <RiLockLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-fuchsia-400 focus:bg-white focus:ring-4 focus:ring-fuchsia-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      {showPwd ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <RiCloseLine size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Entrando...
                    </span>
                  ) : (
                    <>
                      <RiLockLine size={18} />
                      Iniciar sesion
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
