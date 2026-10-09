'use client'

import { FiClock } from 'react-icons/fi'

interface TimeInput12Props {
  /** Valor en 24 h, "HH:mm" (lo que se guarda y se envía al API). */
  value: string
  onChange: (value: string) => void
  /** Paso de los minutos en el selector. */
  minuteStep?: number
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)

function parse(value: string) {
  const [h, m] = String(value || '').split(':').map(Number)
  const hour24 = Number.isFinite(h) ? Math.min(Math.max(h, 0), 23) : 0
  const minute = Number.isFinite(m) ? Math.min(Math.max(m, 0), 59) : 0
  return { hour12: hour24 % 12 || 12, minute, period: hour24 >= 12 ? 'PM' : 'AM' as 'AM' | 'PM' }
}

function toValue(hour12: number, minute: number, period: 'AM' | 'PM') {
  const hour24 = (hour12 % 12) + (period === 'PM' ? 12 : 0)
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const selectClass =
  'h-full cursor-pointer appearance-none bg-transparent px-1 text-center font-semibold text-gray-900 outline-none'

/**
 * Selector de hora en formato de 12 horas. Sustituye a `<input type="time">`,
 * que muestra 24 h según el idioma del navegador.
 */
export default function TimeInput12({
  value,
  onChange,
  minuteStep = 5,
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Hora',
}: TimeInput12Props) {
  const { hour12, minute, period } = parse(value)
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep)
  if (!minutes.includes(minute)) minutes.push(minute)
  minutes.sort((a, b) => a - b)

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-1.5 text-sm transition focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100 ${
        size === 'sm' ? 'h-10' : 'h-11'
      } ${className}`}
    >
      <FiClock className="mr-1 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
      <select
        aria-label="Hora"
        value={hour12}
        onChange={e => onChange(toValue(Number(e.target.value), minute, period))}
        className={selectClass}
      >
        {HOURS.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="font-semibold text-gray-400">:</span>
      <select
        aria-label="Minutos"
        value={minute}
        onChange={e => onChange(toValue(hour12, Number(e.target.value), period))}
        className={selectClass}
      >
        {minutes.map(m => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      <div className="ml-auto flex rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-gray-200">
        {(['AM', 'PM'] as const).map(p => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => onChange(toValue(hour12, minute, p))}
            className={`rounded-md px-2 py-1 text-xs font-bold transition ${
              period === p ? 'bg-brand-500 text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
