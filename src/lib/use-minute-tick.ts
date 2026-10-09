"use client";

import { useEffect, useState } from "react";

/**
 * Re-renderiza el componente cada minuto y devuelve la hora actual. Sirve
 * para que los textos que dependen de la hora límite (“entrega hoy” →
 * “entrega mañana”) cambien solos si la página queda abierta.
 */
export function useMinuteTick() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
