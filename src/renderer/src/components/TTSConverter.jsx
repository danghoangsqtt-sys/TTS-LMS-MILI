/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Trash2,
  Loader2,
  FileText,
  Microchip,
  Volume2,
  Zap,
  Info,
  ChevronDown,
  Music,
  Settings2,
  AlertTriangle,
  X,
  Save,
  CheckCircle2,
  FolderOpen
} from 'lucide-react'

// --- Prosody Modal Component ---
function ProsodyModal({ isOpen, onClose, config, setConfig }) {
  if (!isOpen) return null

  const items = [
    { id: 'dot', label: 'Dấu chấm (.)', symbol: '.', defaultVal: 0.5 },
    { id: 'comma', label: 'Dấu phẩy (,)', symbol: ',', defaultVal: 0.2 },
    { id: 'semicolon', label: 'Chấm phẩy (;)', symbol: ';', defaultVal: 0.3 },
    { id: 'newline', label: 'Xuống dòng', symbol: '↵', defaultVal: 0.8 },
  ]

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Music className="text-emerald-600" size={20} />
                <div>
                   <h3 className="text-base font-bold text-gray-800">Tinh chỉnh Nhịp điệu</h3>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Prosody Alignment Control</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
            </button>
        </div>

        <div className="p-8 space-y-8">
            <div className="flex gap-2">
                {['ĐỌC CHẬM', 'CHUẨN', 'ĐỌC NHANH'].map(m => (
                    <button key={m} className="flex-1 py-2 text-[10px] font-bold border border-gray-100 rounded-xl text-gray-400 hover:border-emerald-200 hover:text-emerald-600 transition-all uppercase tracking-widest">
                        {m}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {items.map(item => (
                    <div key={item.id} className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-100 italic">
                                    {item.symbol}
                                </div>
                                <span className="text-xs font-bold text-gray-600">{item.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{config[item.id]}s</span>
                        </div>
                        <input 
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={config[item.id]}
                            onChange={(e) => setConfig({...config, [item.id]: parseFloat(e.target.value)})}
                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                    </div>
                ))}
            </div>
        </div>

        <div className="p-6 bg-gray-50/50 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-white border border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all">
                Hủy bỏ
            </button>
            <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all">
                <CheckCircle2 size={16} />
                Lưu cấu hình
            </button>
        </div>
      </div>
    </div>
  )
}

export default function TTSConverter({ 
  onConversionComplete, 
  externalText, 
  cachedVoices = [], 
  voicesLoading = false,
  workspacePath = '',
  prosodyConfig,
  setProsodyConfig
}) {
  // --- States ---
  const [selectedVoice, setSelectedVoice] = useState('')
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [activeFilter, setActiveFilter] = useState('NEWS')
  
  // Parametric States
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [bgmList, setBgmList] = useState([])
  const [selectedBgm, setSelectedBgm] = useState('')
  const [isProsodyOpen, setIsProsodyOpen] = useState(false)

  // --- Refs ---
  const audioRef = useRef(null)

  // --- Initialize Selection ---
  useEffect(() => {
    if (cachedVoices.length > 0 && !selectedVoice) {
      setSelectedVoice(cachedVoices[0].id)
    }
  }, [cachedVoices])

  // --- Fetch BGM List ---
  useEffect(() => {
    const fetchBgm = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/bgm')
            const data = await res.json()
            if (data.success) {
                setBgmList(data.bgm || [])
            }
        } catch (e) {
            console.error('Failed to fetch BGM:', e)
        }
    }
    fetchBgm()
  }, [])

  // --- Handle External Text ---
  useEffect(() => {
    if (externalText) setText(externalText)
  }, [externalText])

  const stopAudio = () => {
    if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
    }
  }

  const handleOpenBgmFolder = () => {
    window.api.openBgmFolder()
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!text.trim() || !selectedVoice) return

    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    stopAudio()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)

    try {
      const formData = new FormData()
      formData.append('voice_id', selectedVoice)
      formData.append('text', text)
      formData.append('speed', speed)
      formData.append('pitch', pitch)
      formData.append('prosody', JSON.stringify(prosodyConfig))
      if (selectedBgm) {
        formData.append('bgm', selectedBgm)
      }
      if (workspacePath) {
        formData.append('save_path', workspacePath)
      }

      const response = await fetch('http://127.0.0.1:8000/api/tts', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Lỗi server AI')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      setSuccessMsg(`Đã tạo âm thanh thành công tại: ${workspacePath || 'Thư mục mặc định'}`)

      if (onConversionComplete) {
        onConversionComplete({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          rawText: text,
          configSummary: `${selectedVoice} (${speed}x${selectedBgm ? ' + BGM' : ''})`,
          audioBlob: url
        })
      }
    } catch (err) {
      console.error('TTS Error:', err)
      setErrorMsg(err.message || 'Lỗi kết nối AI Core')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Prosody Modal */}
      <ProsodyModal 
        isOpen={isProsodyOpen} 
        onClose={() => setIsProsodyOpen(false)} 
        config={prosodyConfig}
        setConfig={setProsodyConfig}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Script Area */}
        <div className="lg:col-span-12 xl:col-span-8 flex flex-col space-y-6">
            <div className="pro-card-xl flex flex-col min-h-[520px] overflow-hidden">
                <div className="p-6 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FileText size={20} className="text-emerald-700" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800 tracking-tight leading-none">Kịch bản phát thanh</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Input Script Processing</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {['NEWS', 'ALERT', 'STORY'].map(filter => (
                            <button 
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                    activeFilter === filter 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm'
                                        : 'text-gray-400 border-transparent hover:bg-gray-50'
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="px-8 py-4 flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Nhập nội dung cần truyền tín hiệu..."
                        className="w-full h-full text-base font-medium text-gray-700 placeholder:text-gray-300 border-none outline-none resize-none leading-relaxed custom-scrollbar min-h-[350px]"
                    />
                </div>

                <div className="p-6 bg-gray-50/20 border-t border-gray-50 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Zap size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Normalize</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Info size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{text.length} ký tự</span>
                        </div>
                    </div>
                    <button onClick={() => setText('')} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Error/Success Feedback Inline */}
            {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-left duration-300">
                    <AlertTriangle className="text-red-500 flex-shrink-0" size={18} />
                    <span className="text-xs font-bold text-red-700 uppercase tracking-tight">{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="ml-auto p-1.5 text-red-300 hover:text-red-500">
                        <X size={14} />
                    </button>
                </div>
            )}

            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-left duration-300">
                    <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-tight">{successMsg}</span>
                    <button onClick={() => setSuccessMsg(null)} className="ml-auto p-1.5 text-emerald-300 hover:text-emerald-500">
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>

        {/* Right Column: Control Panel */}
        <div className="lg:col-span-12 xl:col-span-4 flex flex-col space-y-6">
            <div className="pro-card-xl p-8 space-y-8 flex flex-col min-h-[520px]">
                
                {/* Voice Selector */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em]">Giọng đọc (Phòng Ban)</label>
                        <button className="text-[9px] font-bold text-emerald-600 hover:underline uppercase tracking-widest flex items-center gap-1.5">
                            <Zap size={10} /> Làm mới
                        </button>
                    </div>

                    {!voicesLoading && cachedVoices.length === 0 && (
                         <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 mb-2 animate-in fade-in">
                            <AlertTriangle className="text-amber-500 flex-shrink-0" size={16} />
                            <p className="text-[10px] font-bold text-amber-700 leading-tight">Chưa có dữ liệu giọng nói. Sử dụng giọng mặc định.</p>
                         </div>
                    )}

                    <div className="relative group">
                        <select 
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            className="w-full bg-white border-2 border-emerald-50 rounded-2xl px-5 py-3.5 appearance-none text-[13px] font-bold text-gray-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-50/50 transition-all cursor-pointer"
                        >
                            {cachedVoices.length > 0 ? (
                                cachedVoices.map(v => (
                                    <option key={v.id} value={v.id}>{v.name || v.id}</option>
                                ))
                            ) : (
                                <option value="">Hệ thống Foundation Base</option>
                            )}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
                    </div>
                </div>

                {/* BGM Selector */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-[0.2em]">Nhạc nền (Tùy chọn)</label>
                        <button 
                            onClick={handleOpenBgmFolder}
                            className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 uppercase transition-colors"
                        >
                            <FolderOpen size={12} /> Thư mục nhạc
                        </button>
                    </div>
                    <div className="relative group">
                        <select 
                            value={selectedBgm}
                            onChange={(e) => setSelectedBgm(e.target.value)}
                            className="w-full bg-white border-2 border-gray-50 rounded-2xl px-5 py-3.5 appearance-none text-[13px] font-bold text-gray-700 shadow-sm focus:outline-none focus:border-emerald-100 transition-all cursor-pointer"
                        >
                            <option value="">-- Không sử dụng nhạc nền --</option>
                            {bgmList.map(bgm => (
                                <option key={bgm} value={bgm}>{bgm.replace(/\.(wav|mp3)$/, '')}</option>
                            ))}
                        </select>
                        <Music className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-200" size={18} />
                    </div>
                </div>

                {/* Sliders Grid */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Tốc độ</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md leading-none">{speed}x</span>
                        </div>
                        <input 
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={speed}
                            onChange={(e) => setSpeed(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                    </div>
                    <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Cao độ</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md leading-none">{pitch}</span>
                        </div>
                        <input 
                            type="range"
                            min="0.5"
                            max="1.5"
                            step="0.1"
                            value={pitch}
                            onChange={(e) => setPitch(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                    </div>
                </div>

                {/* Prosody Button */}
                <button 
                  onClick={() => setIsProsodyOpen(true)}
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 text-[11px] font-extrabold text-gray-400 hover:text-emerald-700 transition-all flex items-center justify-center gap-3"
                >
                    <Settings2 size={16} />
                    Thiết lập Ngắt câu (Prosody)
                </button>

                {/* Sub-Footer Stats */}
                <div className="pt-4 mt-auto border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Microchip className="text-gray-300" size={14} />
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">GGUF-Q4 Loaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                         <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Hệ thống Ổn định</span>
                    </div>
                </div>
            </div>

            {/* Execute Button */}
            <button
                onClick={handleSubmit}
                disabled={isLoading || !text.trim() || !selectedVoice}
                className="w-full py-6 rounded-[2rem] bg-[#0D6241] hover:bg-[#0B4D33] text-white flex flex-col items-center justify-center gap-1 transition-all shadow-2xl shadow-emerald-900/30 active:scale-95 disabled:opacity-40 disabled:grayscale group"
            >
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                ) : (
                    <div className="flex items-center gap-4">
                        <Zap size={22} className="fill-white animate-pulse" />
                        <span className="text-lg font-black uppercase tracking-widest italic">THỰC HIỆN CHUYỂN ĐỔI</span>
                    </div>
                )}
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] group-hover:text-white/60">Execute Synthesis Signal</span>
            </button>
        </div>

      </div>
    </div>
  )
}
