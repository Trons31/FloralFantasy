# 011 — Tareas

- [x] T1 `tailwind.config.ts`: animación `fade-in` (opacity 0→1, 150 ms).
- [x] T2 `ScrollArrows` al estilo de `ScrollableTabs` de CliqCut (prop
      `fadeFrom` para el color del fondo).
- [x] T3 `CartDrawer` sin framer-motion: capa + panel con `animate-fade-in`.
- [x] T4 Menú móvil sin framer-motion: capa + panel con `animate-fade-in`.
- [x] T5 Prueba CDP (abrir/cerrar, Escape, clic fuera, scroll bloqueado,
      flechas) + capturas 390 / 1280, `tsc`, lint, build.

## Verificación
- Flechas (CDP): solo derecha al inicio, ambas al avanzar, solo izquierda al final; ninguna en escritorio.
- Carrito (CDP): abre en /seguimiento, bloquea el fondo, Escape cierra y libera el scroll, isOpen no se persiste, /checkout retoma el pendiente en el paso de pago.
- No se pudo repetir “recargar y seguir en el pago” ni el aviso del carrito: el pedido de prueba FLR-P9R3K7 fue CANCELADO durante la sesión (el sistema lo dejó de ofrecer, que es lo correcto, spec 005 CA-7) y no hay otro sin comprobante. No se crearon pedidos en producción.
