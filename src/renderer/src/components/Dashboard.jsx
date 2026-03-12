/* eslint-disable react/prop-types */
import { 
    BarChart3, 
    Clock3, 
    Database,
    ChevronUp
  } from 'lucide-react'
  
  export default function Dashboard({ history = [] }) {
    const totalChars = history.reduce((acc, curr) => acc + (curr.rawText?.length || 0), 0)
    
    const stats = [
      {
        label: 'TỔNG KÝ TỰ',
        value: totalChars.toLocaleString(),
        subtext: '+12% hiệu suất',
        icon: BarChart3,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-50',
      },
      {
        label: 'THỜI LƯỢNG (GIÂY)',
        value: (history.length * 2.5).toFixed(1), // Giả lập thời lượng
        subtext: 'Đã xử lý',
        icon: Clock3,
        iconColor: 'text-emerald-500',
        iconBg: 'bg-emerald-50',
      },
      {
        label: 'LƯU TRỮ CỤC BỘ',
        value: `${(totalChars * 0.001).toFixed(2)} MB`,
        subtext: 'IndexedDB Secure',
        icon: Database,
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-50',
      }
    ]
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="pro-card-xl p-5 flex flex-col relative group transition-all duration-300 hover:translate-y-[-2px]"
          >
            {/* Realtime Badge */}
            <div className="absolute top-5 right-6 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100/50">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">REALTIME</span>
            </div>

            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              
              <div className="flex flex-col pt-0.5 min-w-0">
                <span className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
                    {stat.value}
                </span>
                
                <div className="flex flex-col mt-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </span>
                  
                  <div className="flex items-center gap-1 mt-0.5">
                        {stat.subtext.includes('+') && <ChevronUp size={10} className="text-blue-500" />}
                        <span className="text-[9px] font-bold text-gray-400">
                            {stat.subtext}
                        </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
