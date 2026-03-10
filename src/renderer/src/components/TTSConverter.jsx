/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Square,
  Zap,
  Download,
  Cpu,
  CheckCircle,
  Volume2,
  Headphones,
  Loader2,
  ChevronDown,
  AlertCircle
} from 'lucide-react'

export default function TTSConverter({ onConversionComplete, externalText }) {
  // --- States ---
  const [voices, setVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // --- Refs for Visualization & Audio ---
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const isPlayingRef = useRef(false)
  const audioRef = useRef(null)

  // --- Initialize: Fetch Voices ---
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/voices')
        const data = await response.json()
        if (data.success && data.voices) {
          setVoices(data.voices)
          if (data.voices.length > 0) {
            setSelectedVoice(data.voices[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to fetch voices:', err)
        setErrorMsg('Không thể kết nối đến máy chủ AI (127.0.0.1:8000)')
      }
    }
    fetchVoices()
  }, [])

  // --- Handle External Text ---
  useEffect(() => {
    if (externalText) {
      setText(externalText)
    }
  }, [externalText])

  // --- Clean up URLs ---
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  // --- Visualizer Logic ---
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isPlayingRef.current) return
      animationRef.current = requestAnimationFrame(draw)
      analyserRef.current.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        gradient.addColorStop(0, '#10b981') // emerald-500
        gradient.addColorStop(1, '#6ee7b7') // emerald-300
        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
    }
    draw()
  }

  // --- Audio Handlers ---
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    isPlayingRef.current = false
    setIsPlaying(false)
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAudio()
    } else if (audioRef.current) {
      // Connect visualizer if first time
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        const ctx = audioContextRef.current
        analyserRef.current = ctx.createAnalyser()
        analyserRef.current.fftSize = 256
        const source = ctx.createMediaElementSource(audioRef.current)
        source.connect(analyserRef.current)
        analyserRef.current.connect(ctx.destination)
      }
      
      audioRef.current.play()
      setIsPlaying(true)
      isPlayingRef.current = true
      drawVisualizer()
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!text.trim() || !selectedVoice) return

    setIsLoading(true)
    setErrorMsg(null)
    stopAudio()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)

    try {
      const formData = new FormData()
      formData.append('voice_id', selectedVoice)
      formData.append('text', text)

      const response = await fetch('http://127.0.0.1:8000/api/tts', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Lỗi server khi tạo giọng nói')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)

      if (onConversionComplete) {
        onConversionComplete({
          timestamp: Date.now(),
          text: text,
          voice: selectedVoice,
          audioUrl: url
        })
      }
    } catch (err) {
      console.error('TTS Error:', err)
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ AI')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Zap className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Cộng tác viên Kỹ thuật số</h2>
            <p className="text-sm text-gray-500">Chuyển văn bản thành giọng nói F5-TTS</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">AI Engine Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Editor */}
        <div className="md:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            {/* Toolbar */}
            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cấu hình</span>
                <div className="relative group">
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {voices.length === 0 && <option value="">Đang tải giọng nói...</option>}
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        Voice: {v.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400">{text.length} ký tự</span>
            </div>

            {/* Textarea */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập nội dung văn bản bạn muốn chuyển đổi sang giọng nói tại đây..."
              className="w-full min-h-[300px] p-6 text-gray-700 leading-relaxed outline-none resize-none placeholder-gray-300 font-medium"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !text.trim() || !selectedVoice}
            className="w-full py-4 bg-[#14452F] text-white rounded-xl font-bold shadow-lg hover:bg-emerald-800 disabled:opacity-50 disabled:hover:bg-[#14452F] active:scale-[0.99] transition flex items-center justify-center gap-3 group"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Cpu className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            )}
            {isLoading ? 'Đang hợp nhất dữ liệu âm thanh...' : 'Tạo giọng đọc ngay'}
          </button>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">Lỗi không mong muốn</p>
                <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status & Player */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-50 pb-3">Kết quả Audio</h3>
            
            {!audioUrl && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Headphones className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-xs font-medium text-gray-400 leading-relaxed px-4">
                  Chưa có audio được tạo. Nhấn nút &quot;Tạo giọng đọc&quot; để bắt đầu.
                </p>
              </div>
            )}

            {isLoading && (
              <div className="space-y-4 py-8">
                <div className="h-12 w-full bg-gray-50 rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-gray-50 rounded-lg animate-pulse delay-75" />
                <p className="text-center text-[10px] font-bold text-emerald-600 uppercase animate-pulse">Processing GPU...</p>
              </div>
            )}

            {audioUrl && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                <div className="h-32 bg-gray-900 rounded-xl overflow-hidden relative group">
                  <canvas ref={canvasRef} width={400} height={128} className="w-full h-full opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <button
                      onClick={handlePlayPause}
                      className="h-14 w-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition active:scale-95"
                    >
                      {isPlaying ? <Square className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
                    <Volume2 className="h-4 w-4 text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Định dạng file</p>
                      <p className="text-xs font-bold text-gray-700">WAV (Military Grade)</p>
                    </div>
                  </div>
                  
                  <a
                    href={audioUrl}
                    download={`TTS_${selectedVoice}_${Date.now()}.wav`}
                    className="flex items-center justify-center gap-2 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 transition active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" /> Tải về máy (.wav)
                  </a>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => {
                    setIsPlaying(false)
                    isPlayingRef.current = false
                  }}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="bg-emerald-950 rounded-2xl p-6 text-white shadow-xl shadow-emerald-950/20">
            <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-4">
              <Cpu className="h-3.5 w-3.5" /> AI Engine Insights
            </h4>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Model</span>
                <span className="text-emerald-400 font-bold">F5-TTS v1.0</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-white/50">Reference</span>
                <span className="text-emerald-400 font-bold">Zero-Shot Cloning</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Output</span>
                <span className="text-emerald-400 font-bold">24kHz PCM WAV</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
