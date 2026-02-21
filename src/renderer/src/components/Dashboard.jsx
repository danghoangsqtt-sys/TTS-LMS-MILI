import { BarChart3, Clock, Server } from 'lucide-react'

export default function Dashboard({ history = [] }) {
  const totalChars = history.reduce((acc, h) => acc + (h.textLength || 0), 0)
  const totalItems = history.length
  const totalDuration = history.reduce((acc, h) => acc + (h.duration || 0), 0)

  const cards = [
    { label: 'Ký tự', value: totalChars.toLocaleString(), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Thời lượng', value: `${totalDuration.toFixed(1)}s`, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Phiên', value: `${totalItems} lần`, icon: Server, color: 'text-purple-600', bg: 'bg-purple-50' }
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800 leading-tight">{card.value}</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{card.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
