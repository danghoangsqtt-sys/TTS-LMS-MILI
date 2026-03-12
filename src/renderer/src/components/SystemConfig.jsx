/* eslint-disable react/prop-types */
import { useState } from 'react'
import { 
  Settings, 
  Brain, 
  Folder, 
  Save, 
  RotateCcw, 
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Cpu,
  Database,
  Music4,
  Info,
  BookOpen
} from 'lucide-react'
import About from './About'
import UserGuide from './UserGuide'

// --- Reusable UI Sub-components ---

const Toggle = ({ active, onChange }) => (
  <button 
    onClick={() => onChange(!active)}
    className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}
  >
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
)

const SettingsRow = ({ icon: Icon, title, description, children }) => (
  <div className="flex items-center justify-between py-6 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-2">
    <div className="flex items-start gap-4 pr-8">
      <div className="mt-1 w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h4>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-md">{description}</p>
      </div>
    </div>
    <div className="flex-shrink-0">
      {children}
    </div>
  </div>
)

export default function SystemConfig({ 
  onClose, 
  workspacePath, 
  setWorkspacePath,
  prosodyConfig,
  setProsodyConfig
}) {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Local state for settings not yet persistent in App.jsx
  const [localSettings, setLocalSettings] = useState({
    autoMix: localStorage.getItem('mb_auto_mix') === 'true',
    ramLimit: parseInt(localStorage.getItem('mb_ram_limit')) || 4,
    cpuThreads: parseInt(localStorage.getItem('mb_cpu_threads')) || 4,
    autoNormalize: true,
    engineMode: 'cpu_optimized'
  })

  const [localProsody, setLocalProsody] = useState({...prosodyConfig})

  const handleSave = () => {
    setIsSaving(true)
    // Simulate saving
    setTimeout(() => {
      localStorage.setItem('mb_auto_mix', localSettings.autoMix)
      localStorage.setItem('mb_ram_limit', localSettings.ramLimit)
      localStorage.setItem('mb_cpu_threads', localSettings.cpuThreads)
      
      setProsodyConfig(localProsody)
      
      setIsSaving(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    }, 800)
  }

  const handleSelectWorkspace = async () => {
    const path = await window.api.selectWorkspace()
    if (path) {
      setWorkspacePath(path)
      localStorage.setItem('mb_workspace', path)
    }
  }

  const handleRestoreDefaults = () => {
    if (confirm('Khôi phục toàn bộ cài đặt về mặc định?')) {
      setLocalSettings({
        autoMix: false,
        ramLimit: 4,
        cpuThreads: 4,
        autoNormalize: true,
        engineMode: 'cpu_optimized'
      })
      setLocalProsody({
        dot: 0.5,
        comma: 0.2,
        semicolon: 0.3,
        newline: 0.8
      })
    }
  }

  const tabs = [
    { id: 'general', label: 'Tham mưu Chung', icon: Settings, color: 'text-blue-500' },
    { id: 'ai', label: 'Lõi Tham mưu (Sigma)', icon: Brain, color: 'text-purple-500' },
    { id: 'storage', label: 'Cơ sở Dữ liệu', icon: Folder, color: 'text-amber-500' },
    { id: 'about', label: 'Thông tin hệ thống', icon: Info, color: 'text-slate-500' },
    { id: 'guide', label: 'Hướng dẫn sử dụng', icon: BookOpen, color: 'text-slate-500' }
  ]

  return (
    <div className="flex bg-slate-50 h-[calc(100vh-4rem)] w-full overflow-hidden border border-slate-200 shadow-2xl rounded-3xl">
      {/* Sidebar Navigation (25%) */}
      <div className="w-1/4 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-2">Menu Chỉ Huy</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-300 group ${
                    isActive 
                    ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'} />
                  <span className="text-xs font-bold tracking-tight">{tab.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto opacity-50 animate-in fade-in slide-in-from-left-2" />}
                </button>
              )
            })}
          </nav>
        </div>
        
        <div className="mt-auto p-6 space-y-4">
            <div className="p-5 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20 border border-emerald-500/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Trạng thái Hệ thống</p>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-emerald-100/80">
                        <span>LÕI SIGMA</span>
                        <span className="text-white">ONLINE</span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-emerald-100/80">
                        <span>DHS-ALPHA</span>
                        <span className="text-white">ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <ShieldCheck className="text-emerald-500" size={20} />
                <div>
                    <p className="text-[10px] font-black text-slate-800 uppercase leading-none">An toàn</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Air-Gapped Mode</p>
                </div>
            </div>
        </div>
      </div>

      {/* Settings Content (75%) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative h-full">
        <div className="flex-1 overflow-y-auto p-12 pb-32 custom-scrollbar">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-right-3 duration-500">
              <header className="mb-10 pl-4 border-l-8 border-emerald-600">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tham mưu Chung</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">Operational Command Center</p>
              </header>
              
              <div className="bg-white space-y-2">
                <SettingsRow 
                  icon={Music4}
                  title="Phát nhạc nền tự động"
                  description="Kích hoạt cơ chế chuẩn bị nhạc nền ngay khi khởi tạo lệnh phát thanh."
                >
                  <Toggle 
                    active={localSettings.autoMix} 
                    onChange={(v) => setLocalSettings({...localSettings, autoMix: v})} 
                  />
                </SettingsRow>
                
                <SettingsRow 
                  icon={Zap}
                  title="Bộ Phân tích Ngữ âm Tiếng Việt"
                  description="Xử lý chuẩn hóa từ điển, chữ viết tắt và các ký hiệu quân sự trước khi tham mưu."
                >
                  <Toggle 
                    active={localSettings.autoNormalize} 
                    onChange={(v) => setLocalSettings({...localSettings, autoNormalize: v})} 
                  />
                </SettingsRow>

                <SettingsRow 
                  icon={Settings}
                  title="Độ trễ nhịp điệu (Dấu chấm)"
                  description="Hiệu chỉnh thời gian giãn ngắt giữa các khối dữ liệu sau khi kết thúc câu."
                >
                  <div className="flex items-center gap-5">
                    <input 
                        type="range" min="0.1" max="2.0" step="0.1"
                        value={localProsody.dot}
                        onChange={(e) => setLocalProsody({...localProsody, dot: parseFloat(e.target.value)})}
                        className="w-40 accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-full appearance-none"
                    />
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg min-w-[50px] text-center">{localProsody.dot}s</span>
                  </div>
                </SettingsRow>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="animate-in fade-in slide-in-from-right-3 duration-500">
              <header className="mb-10 pl-4 border-l-8 border-emerald-600">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Lõi Tham mưu (Sigma)</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">DHS Intelligence Core (Sigma)</p>
              </header>

              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-6 mb-10 shadow-sm">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-emerald-600/20">
                    <Cpu className="text-white" size={28} />
                 </div>
                 <div>
                    <p className="text-sm font-black text-emerald-900 leading-tight uppercase tracking-tight">Khối DHS-Alpha (CPU-Optimized)</p>
                    <p className="text-xs text-emerald-700/80 mt-2 font-semibold leading-relaxed">Hệ thống đang vận hành Động cơ Tổng hợp Âm thanh chuyên dụng cho dòng chip xử lý trung tâm, không yêu cầu phần cứng đồ họa rời.</p>
                 </div>
              </div>

              <div className="bg-white space-y-2">
                <SettingsRow 
                  icon={Database}
                  title="Giới hạn bộ nhớ (Khối Sigma)"
                  description="Cấp phát tài nguyên bộ nhớ tạm cho Lõi Tham mưu Trí tuệ Nhân tạo. Khuyến nghị: Mức II."
                >
                  <div className="flex items-center gap-4">
                    <select 
                        value={localSettings.ramLimit}
                        onChange={(e) => setLocalSettings({...localSettings, ramLimit: parseInt(e.target.value)})}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                    >
                        <option value="2">Mức Tối thiểu (I)</option>
                        <option value="4">Mức Tiêu chuẩn (II)</option>
                        <option value="8">Mức Mở rộng (III)</option>
                        <option value="16">Mức Tối đa (IV)</option>
                    </select>
                  </div>
                </SettingsRow>

                <SettingsRow 
                  icon={Cpu}
                  title="Mức hiệu năng Chỉ huy"
                  description="Điều tiết cường độ tính toán logic của Lõi Tham mưu. Mức cao giúp phản hồi nhanh nhưng tiêu tốn tài nguyên hơn."
                >
                  <div className="flex items-center gap-5">
                    <input 
                        type="range" min="1" max="16" step="1"
                        value={localSettings.cpuThreads}
                        onChange={(e) => setLocalSettings({...localSettings, cpuThreads: parseInt(e.target.value)})}
                        className="w-40 accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-full appearance-none"
                    />
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg min-w-[40px] text-center">
                            {localSettings.cpuThreads <= 4 ? 'THẤP' : localSettings.cpuThreads <= 8 ? 'TRUNG BÌNH' : 'CAO'}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">Mức</span>
                    </div>
                  </div>
                </SettingsRow>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="animate-in fade-in slide-in-from-right-3 duration-500">
              <header className="mb-10 pl-4 border-l-8 border-emerald-600">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cơ sở Dữ liệu</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">System Data & Path Control</p>
              </header>

              <div className="bg-white">
                <SettingsRow 
                  icon={Folder}
                  title="Vùng lưu trữ dữ liệu xuất bản"
                  description="Định dạng đường dẫn vật lý cho các tệp lệnh âm thanh sau khi được đóng gói hoàn thiện."
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-500 truncate max-w-[300px]">
                        {workspacePath || 'CHƯA THIẾT LẬP VÙNG NHỚ...'}
                    </div>
                    <button 
                        onClick={handleSelectWorkspace}
                        className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
                        title="Thay đổi vùng lưu trữ"
                    >
                        <Folder size={20} />
                    </button>
                  </div>
                </SettingsRow>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
             <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <About />
             </div>
          )}

          {activeTab === 'guide' && (
             <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                <UserGuide />
             </div>
          )}
        </div>

        {/* Sticky Footer for Config Tabs */}
        {!['about', 'guide'].includes(activeTab) && (
          <div className="sticky bottom-0 left-0 right-0 p-8 bg-white border-t border-slate-100 flex justify-between items-center shadow-[0_-15px_40px_rgba(0,0,0,0.05)] z-20">
            <button 
              onClick={handleRestoreDefaults}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95 group shadow-sm hover:shadow-md"
            >
              <RotateCcw size={16} className="group-hover:rotate-[-120deg] transition-transform duration-500" />
              Khôi phục Hệ thống
            </button>
            
            <div className="flex items-center gap-6">
               {showSuccess && (
                  <div className="flex items-center gap-2.5 text-emerald-600 animate-in fade-in slide-in-from-right-3 duration-500">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={12} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Bộ chỉ huy đã lưu</span>
                  </div>
               )}
               <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-4 px-12 py-4 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-900/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group"
               >
                  {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                      <Save size={18} className="group-hover:scale-110 transition-transform" />
                  )}
                  LƯU CẤU HÌNH HỆ THỐNG
               </button>
            </div>
          </div>
        )}

        {['about', 'guide'].includes(activeTab) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100 flex justify-end items-center shadow-[0_-10px_30px_rgba(0,0,0,0.02)] z-10">
             <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95"
             >
                Đóng
             </button>
          </div>
        )}
      </div>
    </div>
  )
}
