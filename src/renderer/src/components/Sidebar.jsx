/* eslint-disable react/prop-types */
import { 
  Mic2, 
  FileText, 
  BookOpen, 
  Library, 
  Users2, 
  History, 
  FlaskConical,
  Activity,
  Shield,
  Settings,
  ChevronRight
} from 'lucide-react'

const navigationSegments = [
  {
    title: 'CHỨC NĂNG CHÍNH',
    items: [
      { id: 'tts', label: 'Console Phát Thanh', sublabel: 'Chuyển đổi văn bản', icon: Mic2 },
      { id: 'voicelab', label: 'Phòng Thu Giọng', sublabel: 'Huấn luyện & Clone AI', icon: FlaskConical },
      { id: 'library', label: 'Thư Viện Kịch Bản', sublabel: 'Mẫu bài giảng', icon: Library },
      { id: 'history', label: 'Nhật Ký Hoạt Động', sublabel: 'Lịch sử phát thanh', icon: History },
    ]
  },
  {
    title: 'DỮ LIỆU & CẤU HÌNH',
    items: [
      { id: 'drafts', label: 'Bản Nháp Hệ Thống', icon: FileText },
      { id: 'lexicon', label: 'Từ Điển Quân Sự', icon: BookOpen },
      { id: 'voices', label: 'Quản Lý Giọng Nói', icon: Users2 },
    ]
  }
]

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed
}) {
  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white border-r border-gray-100 flex flex-col transition-all duration-300 relative z-20 overflow-hidden h-screen`}
    >
      {/* Brand Header */}
      <div className="p-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0D6241] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 relative flex-shrink-0">
            <Shield className="text-white h-5 w-5" />
            <div className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-[#10b981] rounded-full" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-bold text-gray-900 tracking-tight leading-none">SQTT.AI</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">DESKTOP PRO</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Segments */}
      <nav className="flex-1 px-3 space-y-8 overflow-y-auto custom-scrollbar">
        {navigationSegments.map((segment, idx) => (
          <div key={idx} className="space-y-3">
            {!isCollapsed && (
              <h3 className="px-3 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                {segment.title}
              </h3>
            )}
            <div className="space-y-1">
              {segment.items.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all group relative ${
                      isActive
                        ? 'bg-[#0B4D33] text-white shadow-lg shadow-emerald-900/20'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      size={isCollapsed ? 20 : 18}
                      className={`flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#0D6241]'
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="flex flex-col items-start text-left overflow-hidden">
                        <span className={`text-sm font-semibold tracking-tight leading-none ${isActive ? 'text-white' : 'text-gray-800'}`}>
                          {item.label}
                        </span>
                        {item.sublabel && (
                          <span className={`text-xs leading-none mt-1 ${isActive ? 'text-white/60' : 'text-gray-400 font-medium'}`}>
                            {item.sublabel}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {isActive && !isCollapsed && (
                      <div className="absolute right-3.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_cyan]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Card (Bottom) */}
      {!isCollapsed && (
        <div className="p-4 mt-auto">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hệ thống</span>
              <Activity className="h-2.5 w-2.5 text-emerald-500" />
            </div>
            
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0D6241] rounded-full w-[94%]" />
              </div>
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Online</span>
                </div>
                <span className="text-[9px] font-bold text-gray-400">98%</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200/50 flex items-center justify-between">
              <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">v1.2.5 [Pro]</span>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <Settings size={10} />
              </button>
            </div>
          </div>
          <p className="text-center text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-4 pb-1">
            © 2026 SQTT MILITARY
          </p>
        </div>
      )}
    </aside>
  )
}
