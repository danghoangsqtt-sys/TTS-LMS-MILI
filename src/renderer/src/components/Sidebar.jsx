import {
  Mic,
  BookOpen,
  BookOpenCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  AudioLines,
  FileText,
  FlaskConical
} from 'lucide-react'
import AppLogo from './AppLogo'

const EXPANDED_WIDTH = 224
const COLLAPSED_WIDTH = 56

const menuItems = [
  { id: 'tts', label: 'Console Phát Thanh', icon: Mic },
  { id: 'drafts', label: 'Quản Lý Kịch Bản', icon: FileText },
  { id: 'lexicon', label: 'Từ Điển Viết Tắt', icon: BookOpenCheck },
  { id: 'library', label: 'Thư Viện Kịch Bản', icon: BookOpen },
  { id: 'voices', label: 'Quản Lý Giọng Đọc', icon: AudioLines },
  { id: 'voicelab', label: 'Phòng Thí Nghiệm AI', icon: FlaskConical },
  { id: 'history', label: 'Nhật Ký Hoạt Động', icon: Clock }
]

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const width = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <aside
      style={{ width, minWidth: width }}
      className="relative z-50 h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out"
    >
      {/* Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 z-[60] h-6 w-6 rounded-full bg-white text-gray-500 border border-gray-200 shadow-sm flex items-center justify-center hover:text-[#14452F] hover:border-emerald-300 transition-colors"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand */}
      <div className="h-14 flex items-center border-b border-gray-100 overflow-hidden">
        <div
          className="flex items-center transition-all duration-300 ease-in-out w-full"
          style={{ paddingLeft: isCollapsed ? 0 : 12, gap: isCollapsed ? 0 : 8, justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <AppLogo className="w-8 h-8 text-[#14452F] flex-shrink-0" />
          <div
            className="overflow-hidden whitespace-nowrap transition-all duration-300"
            style={{ width: isCollapsed ? 0 : 130, opacity: isCollapsed ? 0 : 1 }}
          >
            <span className="font-bold text-sm text-gray-800">MB-TTS<span className="text-[#14452F]">.AI</span></span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="space-y-0.5" style={{ padding: isCollapsed ? '0 6px' : '0 8px' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={[
                    'w-full flex items-center rounded-lg transition-all duration-150 group',
                    isCollapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2',
                    isActive
                      ? 'bg-[#14452F] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  ].join(' ')}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <div
                    className="overflow-hidden whitespace-nowrap transition-all duration-300 text-left"
                    style={{ width: isCollapsed ? 0 : 140, opacity: isCollapsed ? 0 : 1 }}
                  >
                    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>{item.label}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 transition-all duration-300" style={{ padding: isCollapsed ? 6 : 10 }}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium">Online</span>
            </div>
            <span className="font-mono">v1.1.0</span>
          </div>
        )}
      </div>
    </aside>
  )
}

export { EXPANDED_WIDTH, COLLAPSED_WIDTH }
