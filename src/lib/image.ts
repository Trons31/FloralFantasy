/**
 * `next/image` solo acepta los hosts de `remotePatterns` (next.config.mjs) y
 * rutas locales. Con cualquier otro host hay que usar <img>, o la página falla.
 */
export const canOptimizeImage = (url: string) =>
  url.startsWith("/") || url.startsWith("https://res.cloudinary.com/");
