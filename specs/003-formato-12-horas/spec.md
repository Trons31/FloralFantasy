# 003 — Formato de 12 horas en todo el sistema

## Problema
Varias partes del sistema muestran horas en formato de 24 horas (“Después de
las 16:00”, “Actualizado 16:05”, el selector de hora límite en Ajustes, el CSV
de contabilidad). Otras usan 12 horas pero con formatos distintos (“p. m.”,
“PM”, con o sin cero inicial). Para el usuario final el formato de 24 horas es
menos claro.

## Objetivo
Toda hora visible para un usuario (tienda, panel, operaciones, PDF, CSV,
notificaciones/toasts) se muestra en formato de 12 horas con AM/PM, de forma
idéntica en todas partes y en hora de Colombia.

## Alcance
**Dentro**: tienda pública, panel, operaciones, reporte PDF, exportación CSV,
toasts, selectores de hora.
**Fuera**: el valor almacenado. La hora límite se sigue guardando como
`"HH:mm"` (24 h) en `AppSetting` y el contrato de `/api/settings` no cambia.
Los temporizadores (cuenta regresiva `mm:ss`) no son horas del día.

## Criterios de aceptación
- [x] CA-1 Existe un único formateador en `src/lib/utils.ts`
  (`formatTime`, `formatTime12`, `formatDateTime`) que produce `4:00 PM`,
  `12:00 AM`, `12:30 PM`.
- [x] CA-2 Se formatea siempre en `America/Bogota`, también en servidor (PDF).
- [x] CA-3 Ningún texto visible usa `HH:mm`, `toLocaleTimeString` sin el
  helper, ni interpola la hora límite cruda (`{sameDayCutoffTime}`).
- [x] CA-4 Los selectores de hora (`<input type="time">`) se reemplazan por
  `TimeInput12` (hora 1–12, minutos, AM/PM) que emite `"HH:mm"`.
- [x] CA-5 La hora límite “16:00” se lee “4:00 PM” en catálogo, detalle de
  producto, carrito, checkout y Ajustes.

## Riesgos
- Convertir 12 AM / 12 PM mal (00 ↔ 12). Cubierto por la función pura
  `formatTime12` y su inversa en `TimeInput12`.
