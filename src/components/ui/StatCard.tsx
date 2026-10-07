interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color?: 'brand' | 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'amber'
}

const colors = {
  brand:  'bg-brand-50 text-brand-600',
  green:  'bg-green-50 text-green-600',
  blue:   'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  red:    'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
  amber:  'bg-amber-50 text-amber-600',
}

export default function StatCard({ title, value, subtitle, icon, color = 'brand' }: StatCardProps) {
  return (
    <div className="min-w-0 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex min-w-0 items-center justify-between mb-3">
        <span className="min-w-0 break-words text-sm text-gray-500 font-medium">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      {/* `text-xl` en movil: a 24px un importe como "$ 202.000" no cabia en la
          tarjeta y `break-words` lo partia a mitad de numero, dejando "$ 202.00"
          en una linea y el "0" en la siguiente. */}
      <p className="break-words text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{value}</p>
      {subtitle && <p className="break-words text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
