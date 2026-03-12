/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Square,
  Trash2,
  Loader2,
  FileText,
  Microchip,
  Zap,
  ChevronDown,
  Music,
  Settings2,
  AlertTriangle,
  X,
  CheckCircle2,
  Download,
  RotateCcw,
  History,
  FolderOpen,
  Volume2,
  RefreshCw
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
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Kiểm soát Nhịp điệu (Alpha)</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
            </button>
        </div>

        <div className="p-8 space-y-8">
            <div className="flex gap-2">
                {['ĐỌC CHẬM', 'CHUẨN', 'ĐỌC NHANH'].map((m) => (
                    <button key={m} className="flex-1 py-2 text-[10px] font-bold border border-gray-100 rounded-xl text-gray-400 hover:border-emerald-200 hover:text-emerald-600 transition-all uppercase tracking-widest">
                        {m}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {items.map((item) => (
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
  cachedVoices = [], // We can still receive this, but will favor self-fetched
  voicesLoading: propVoicesLoading = false,
  workspacePath: propWorkspacePath,
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
  const [workspacePath, setWorkspacePath] = useState('')
  const [availableVoices, setAvailableVoices] = useState(cachedVoices)
  const [isVoicesLoading, setIsVoicesLoading] = useState(propVoicesLoading)
  const [sessionHistory, setSessionHistory] = useState([])
  const [isProsodyOpen, setIsProsodyOpen] = useState(false)

  // Preview States
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const previewAudioRef = useRef(null)

  // --- Refs ---
  const audioRef = useRef(null)

  const fetchVoices = useCallback(async () => {
    setIsVoicesLoading(true)
    try {
      const res = await fetch('http://127.0.0.1:8000/api/voices')
      const data = await res.json()
      if (data.success) {
        // Handle both old object format and new string array format
        const formattedVoices = data.voices.map((v) => 
          typeof v === 'string' ? { id: v, name: v } : v
        )
        setAvailableVoices(formattedVoices)
        // Auto-select first voice if none selected
        if (formattedVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(formattedVoices[0].id)
        } else if (!formattedVoices.find((v) => v.id === selectedVoice) && formattedVoices.length > 0) {
          // If selected voice is gone, select first again
          setSelectedVoice(formattedVoices[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch voices:', err)
      setErrorMsg('Không thể đồng bộ danh sách giọng Radar.')
    } finally {
      setIsVoicesLoading(false)
    }
  }, [selectedVoice])

  useEffect(() => {
    fetchVoices()
  }, [fetchVoices])

  // Sync workspace from prop
  useEffect(() => {
    if (propWorkspacePath) setWorkspacePath(propWorkspacePath)
  }, [propWorkspacePath])

  // --- Handle External Text (Prop-based) ---
  useEffect(() => {
    if (externalText) setText(externalText)
  }, [externalText])

  // --- Handle Playing Sample ---
  const handlePlaySample = () => {
    if (isPreviewPlaying) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current.currentTime = 0
      }
      setIsPreviewPlaying(false)
      return
    }

    if (!selectedVoice) return

    // Stop main audio if playing
    stopAudio()

    const sampleUrl = `http://127.0.0.1:8000/api/voices/${selectedVoice}/sample`
    
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
    }

    const audio = new Audio(sampleUrl)
    previewAudioRef.current = audio

    audio.onplay = () => setIsPreviewPlaying(true)
    audio.onended = () => setIsPreviewPlaying(false)
    audio.onerror = () => {
      setIsPreviewPlaying(false)
      setErrorMsg("Không thể phát giọng mẫu. Vui lòng kiểm tra lại backend.")
    }

    audio.play().catch((err) => {
      console.error("Playback error:", err)
      setIsPreviewPlaying(false)
    })
  }

  // --- Memory Cleanup ---
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      sessionHistory.forEach((item) => {
        if (item.audioBlob) URL.revokeObjectURL(item.audioBlob)
      })
    }
  }, [audioUrl, sessionHistory])

  // Stop preview if selected voice changes
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }
    setIsPreviewPlaying(false)
  }, [selectedVoice])

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

  // --- Check for Pending Script from Library on Mount ---
  useEffect(() => {
    const pending = localStorage.getItem('pending_script')
    if (pending) {
      setText(pending)
      localStorage.removeItem('pending_script')
      setSuccessMsg("Đã nạp kịch bản từ kho tác chiến!")
    }
  }, [])

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
      
      if (blob.size < 100) {
        throw new Error("Dữ liệu âm thanh nhận được quá nhỏ (có thể là file lỗi)")
      }

      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      
      const newHistoryItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        rawText: text,
        configSummary: `${selectedVoice} (${speed}x${selectedBgm ? ' + BGM' : ''})`,
        audioBlob: url,
        voiceName: availableVoices.find((v) => v.id === selectedVoice)?.name || selectedVoice
      }

      setSessionHistory(prev => [newHistoryItem, ...prev].slice(0, 20))
      setSuccessMsg(`Tín hiệu đã sẵn sàng. Sẵn sàng phát sóng!`)

      if (onConversionComplete) {
        onConversionComplete(newHistoryItem)
      }
    } catch (err) {
      console.error('TTS Error:', err)
      setErrorMsg(err.message || 'Lỗi kết nối AI Core')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!audioUrl) return
    const a = document.createElement('a')
    a.href = audioUrl
    const fileName = `${selectedVoice.replace(/\s+/g, '_')}_Audio.wav`
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleClear = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setSuccessMsg(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 xl:p-8 font-sans transition-all duration-300">
      <ProsodyModal 
        isOpen={isProsodyOpen} 
        onClose={() => setIsProsodyOpen(false)} 
        config={prosodyConfig}
        setConfig={setProsodyConfig}
      />

      {/* --- Overall Layout Container --- */}
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Main Grid: Script (Left) & Controls (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* --- 1. SCRIPT EDITOR AREA (Left Column) --- */}
          <div className="xl:col-span-8 flex flex-col space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[600px] overflow-hidden group">
              {/* Header */}
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Soạn Thảo Kịch Bản</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Bảng Điều khiển Soạn thảo</p>
                  </div>
                </div>
                
                {/* Mode Selectors (Filters) */}
                <div className="hidden sm:flex items-center gap-2 p-1 bg-slate-50 rounded-xl">
                  {['NEWS', 'ALERT', 'STORY'].map((filter) => (
                    <button 
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        activeFilter === filter 
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea Area */}
              <div className="flex-1 relative p-8">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập kịch bản truyền tin tại đây..."
                  className="w-full h-full text-lg font-medium text-slate-700 placeholder:text-slate-300 border-none outline-none resize-none leading-relaxed custom-scrollbar focus:ring-emerald-500/20 focus:ring-2 rounded-xl p-2 transition-all"
                />
                
                {/* Character Counter */}
                <div className="absolute bottom-6 right-8 flex items-center gap-2 px-3 py-1.5 bg-slate-50/80 backdrop-blur-sm rounded-lg border border-slate-100 text-slate-400 pointer-events-none">
                  <span className="text-[11px] font-bold tracking-widest">{text.length} <span className="opacity-50">KÝ TỰ</span></span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-slate-50/40 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Zap size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Normalizer Active</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Microchip size={14} className="text-blue-500" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Lõi Sigma v2.0 (Native)</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setText('')} 
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center gap-2 group"
                >
                  <Trash2 size={18} className="transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Xóa kịch bản</span>
                </button>
              </div>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-red-700 uppercase tracking-tight">CẢNH BÁO HỆ THỐNG</h4>
                  <p className="text-[11px] font-bold text-red-600/80">{errorMsg}</p>
                </div>
                <button onClick={() => setErrorMsg(null)} className="p-2 text-red-300 hover:text-red-500">
                  <X size={20} />
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-tight">THÔNG BÁO</h4>
                  <p className="text-[11px] font-bold text-emerald-600/80">{successMsg}</p>
                </div>
                <button onClick={() => setSuccessMsg(null)} className="p-2 text-emerald-300 hover:text-emerald-500">
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* --- 2. CONTROL CENTER (Right Column) --- */}
          <div className="xl:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col h-full space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Trung Tâm Điều Khiển</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Hành lang Chỉ huy</p>
                </div>
              </div>

              {/* Voice Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cấu hình Giọng đọc</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={fetchVoices}
                      disabled={isVoicesLoading}
                      className={`p-1.5 rounded-lg transition-all ${isVoicesLoading ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      title="Làm mới danh sách (Radar Refresh)"
                    >
                      <RefreshCw size={16} className={isVoicesLoading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          await window.electron.ipcRenderer.invoke('open-voices-folder')
                        } catch (err) {
                          console.error('Failed to open folder:', err)
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Mở thư mục mẫu giọng"
                    >
                      <FolderOpen size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 group">
                  <div className="relative flex-1">
                    <select 
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3.5 appearance-none text-[13px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:bg-white transition-all cursor-pointer group-hover:border-slate-200"
                    >
                      {availableVoices.length > 0 ? (
                        availableVoices.map((v) => (
                          <option key={v.id} value={v.id}>{v.name || v.id}</option>
                        ))
                      ) : (
                        <option value="">-- Mặc định --</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                  </div>
                  
                  <button 
                    onClick={handlePlaySample}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                      isPreviewPlaying 
                        ? 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                    }`}
                    title={isPreviewPlaying ? "Dừng" : "Nghe thử"}
                  >
                    {isPreviewPlaying ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 px-1">
                    <div className="flex items-center gap-2 uppercase tracking-widest">
                      <Zap size={12} className="text-emerald-500" />
                      Tốc độ đọc
                    </div>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{speed}x</span>
                  </div>
                  <input 
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 px-1">
                    <div className="flex items-center gap-2 uppercase tracking-widest">
                      <Volume2 size={12} className="text-emerald-500" />
                      Cao độ (Pitch)
                    </div>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{pitch}</span>
                  </div>
                  <input 
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>

              {/* BGM Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nhạc nền (BGM)</label>
                  <button 
                    onClick={handleOpenBgmFolder}
                    className="text-[9px] font-bold text-emerald-600 hover:underline flex items-center gap-1 uppercase"
                  >
                    <FolderOpen size={12} /> Kho nhạc
                  </button>
                </div>
                <div className="relative">
                  <select 
                    value={selectedBgm}
                    onChange={(e) => setSelectedBgm(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3.5 appearance-none text-[13px] font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Không nhạc nền --</option>
                    {bgmList.map((bgm) => (
                      <option key={bgm} value={bgm}>{bgm.replace(/\.(wav|mp3)$/, '')}</option>
                    ))}
                  </select>
                  <Music className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
              </div>

              {/* Prosody Shortcut */}
              <button 
                onClick={() => setIsProsodyOpen(true)}
                className="w-full py-3.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 group"
              >
                <Settings2 size={16} className="transition-transform group-hover:rotate-12" />
                Hiệu chỉnh Ngắt câu
              </button>

              {/* Execute Button */}
              <div className="pt-4 mt-auto">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !text.trim() || !selectedVoice}
                  className={`w-full py-6 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98] disabled:opacity-40 disabled:grayscale group relative overflow-hidden ${
                    isLoading 
                      ? 'bg-slate-100' 
                      : 'bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">ĐANG TỔNG HỢP ÂM THANH...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Play size={20} className="fill-white" />
                        <span className="text-lg font-black uppercase tracking-widest italic">PHÁT SÓNG NGAY</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] group-hover:text-white/80">Kích hoạt Tín hiệu Tổng hợp</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- 3. RESULTS & HISTORY (Bottom Section) --- */}
        <div className="space-y-6">
          
          {/* Main Output Player (Shows when ready) */}
          {audioUrl && (
            <div className="p-10 rounded-3xl bg-emerald-50/30 border-2 border-emerald-100 shadow-xl shadow-emerald-900/5 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                
                <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-900/20 animate-pulse">
                        <Volume2 size={32} />
                    </div>
                    <div className="text-center mt-2">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">KẾT QUẢ TRUYỀN THÔNG</h3>
                        <p className="text-xs text-emerald-600/80 font-bold uppercase tracking-widest mt-1">Tín hiệu sẵn sàng Phát sóng</p>
                    </div>
                </div>

                <div className="w-full max-w-3xl bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 relative z-10 transition-transform hover:scale-[1.01]">
                    <audio 
                      ref={audioRef}
                      src={audioUrl} 
                      controls 
                      className="w-full h-12 accent-emerald-600"
                    />
                </div>

                <div className="flex flex-wrap justify-center gap-4 w-full relative z-10">
                    <button 
                      onClick={handleDownload}
                      className="min-w-[240px] px-8 py-5 rounded-2xl bg-emerald-600 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 hover:-translate-y-1 transition-all border-b-4 border-emerald-800 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-3"
                    >
                        <Download size={20} />
                        Lưu tệp Audio
                    </button>
                    <button 
                      onClick={handleClear}
                      className="px-8 py-5 rounded-2xl bg-white border-2 border-slate-200 text-slate-400 text-sm font-black uppercase tracking-widest hover:border-red-200 hover:text-red-500 transition-all flex items-center justify-center gap-3 group"
                    >
                        <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                        Hủy / Tạo lại
                    </button>
                </div>
            </div>
          )}

          {/* History Sidebar/Section (As part of Output & History) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                  <History size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Nhật Ký Truyền Tin</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Recent Generations</p>
                </div>
              </div>
              
              {sessionHistory.length > 0 && (
                <button 
                  onClick={() => {
                    sessionHistory.forEach((h) => URL.revokeObjectURL(h.audioBlob))
                    setSessionHistory([])
                  }}
                  className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Xóa lịch sử
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sessionHistory.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-200">
                  <History size={64} className="opacity-20 mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.3em]">Hệ thống trống</p>
                </div>
              ) : (
                sessionHistory.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-white hover:shadow-md transition-all group flex flex-col justify-between h-[180px]">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-lg border border-emerald-50 shadow-sm tracking-widest">{item.timestamp}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-700 line-clamp-1">{item.voiceName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-3 mt-1 leading-relaxed italic">&ldquo;{item.rawText}&rdquo;</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100/50 mt-auto">
                      <button 
                        onClick={() => {
                          setAudioUrl(item.audioBlob)
                          setText(item.rawText)
                        }}
                        className="flex-1 py-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm transition-all flex items-center justify-center gap-2 group/play"
                      >
                        <Play size={10} fill="currentColor" className="group-hover/play:scale-110" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Nạp lại</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
