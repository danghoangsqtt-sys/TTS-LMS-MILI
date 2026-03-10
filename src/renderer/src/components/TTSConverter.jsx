/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react'
import {
  Play,
  Square,
  Zap,
  X,
  Download,
  Cpu,
  CheckCircle,
  Music,
  Volume2,
  Headphones,
  Trash2,
  ClipboardPaste,
  Timer,
  FileDown,
  Loader2,
  Plus,
  Save,
  ChevronDown
} from 'lucide-react'

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i)
  return bytes.buffer
}

let blockIdCounter = Date.now()
const nextBlockId = () => ++blockIdCounter

export default function TTSConverter({
  onConversionComplete,
  externalText,
  activeDraft,
  clearDraft
}) {
  console.log('[TTSConverter] Initializing...')
  if (!window.api) {
    console.error('[TTSConverter] window.api is missing! IPC bridge failure.')
  }

  const [models, setModels] = useState([])
  const [blocks, setBlocks] = useState([{ id: nextBlockId(), text: '', voice: '', speed: 1.0 }])

  const [isLoading, setIsLoading] = useState(false)
  const [audioData, setAudioData] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [logs, setLogs] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [highlightInput, setHighlightInput] = useState(false)
  const [showPauseModal, setShowPauseModal] = useState(false)
  const [draftPauseConfig, setDraftPauseConfig] = useState({
    period: 0.5,
    comma: 0.2,
    semicolon: 0.3,
    newline: 0.8
  })
  const [pauseConfig, setPauseConfig] = useState({
    period: 0.5,
    comma: 0.2,
    semicolon: 0.3,
    newline: 0.8
  })

  // BGM state
  const [bgmList, setBgmList] = useState([])
  const [selectedBgm, setSelectedBgm] = useState('')
  const [bgmBase64, setBgmBase64] = useState(null)
  const [bgmVolume, setBgmVolume] = useState(0.2)
  const [ttsVolume, setTtsVolume] = useState(1.0)

  // Recent outputs
  const [recentAudios, setRecentAudios] = useState([])
  const [recentPlayingId, setRecentPlayingId] = useState(null)
  const recentAudioElRef = useRef(null)

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [toast, setToast] = useState(null)

  // Draft save modal
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')

  const audioContextRef = useRef(null)
  const sourceRef = useRef(null)
  const analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const isPlayingRef = useRef(false)
  const bgmAudioRef = useRef(null)
  const gainNodeRef = useRef(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/voices')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.voices) {
          const m = data.voices.map((v) => v.id)
          setModels(m)
          if (m.length > 0) {
            setBlocks((prev) => prev.map((b) => (b.voice === '' ? { ...b, voice: m[0] } : b)))
          }
        }
      })
      .catch((err) => {
        console.warn('F5-TTS Voice Bank error:', err)
        setModels([])
      })
    window.api
      .getBgmList()
      .then((list) => setBgmList(list))
      .catch(() => setBgmList([]))
  }, [])

  // Load draft from DraftManager
  useEffect(() => {
    if (activeDraft && models.length > 0) {
      if (activeDraft.blocks && activeDraft.blocks.length > 0) {
        setBlocks(activeDraft.blocks.map((b) => ({ ...b, id: nextBlockId() })))
      } else if (activeDraft.text) {
        setBlocks([
          {
            id: nextBlockId(),
            text: activeDraft.text,
            voice: activeDraft.voiceModel || models[0],
            speed: activeDraft.speed || 1.0
          }
        ])
      }
      if (activeDraft.bgm) setSelectedBgm(activeDraft.bgm)
      if (activeDraft.bgmVolume != null) setBgmVolume(activeDraft.bgmVolume)
      if (activeDraft.ttsVolume != null) setTtsVolume(activeDraft.ttsVolume)
      setHighlightInput(true)
      const t = setTimeout(() => setHighlightInput(false), 2000)
      if (clearDraft) clearDraft()
      return () => clearTimeout(t)
    }
  }, [activeDraft, models])

  // Load external text (from library / rebroadcast)
  useEffect(() => {
    if (externalText && models.length > 0) {
      console.log('[TTSConverter] Loading external text:', externalText.substring(0, 30))
      setBlocks([{ id: nextBlockId(), text: externalText, voice: models[0] || '', speed: 1.0 }])
      setHighlightInput(true)
      const t = setTimeout(() => setHighlightInput(false), 2000)
      return () => clearTimeout(t)
    }
  }, [externalText, models]) // Added models to dependency array

  useEffect(() => {
    if (!selectedBgm) {
      setBgmBase64(null)
      return
    }
    window.api
      .getBgmFile(selectedBgm)
      .then((d) => setBgmBase64(d))
      .catch(() => setBgmBase64(null))
  }, [selectedBgm])

  useEffect(() => {
    if (bgmAudioRef.current) bgmAudioRef.current.volume = bgmVolume
  }, [bgmVolume])
  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = ttsVolume
  }, [ttsVolume])
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])
  useEffect(() => {
    return () => {
      if (recentAudioElRef.current) {
        recentAudioElRef.current.pause()
        recentAudioElRef.current = null
      }
    }
  }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })
  const addLog = (msg) => {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8)
    setLogs((p) => [...p, `[${ts}] ${msg}`])
  }

  const groupModels = (modelList) => {
    return {
      bank: { label: '�️ Voice Bank', items: modelList }
    }
  }

  const formatModelName = (m) => m

  // -------- Block Management --------
  const updateBlock = (id, field, value) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  const addBlock = () => {
    const defaultVoice = models.length > 0 ? models[0] : ''
    setBlocks((prev) => [...prev, { id: nextBlockId(), text: '', voice: defaultVoice, speed: 1.0 }])
  }

  const removeBlock = (id) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((b) => b.id !== id)
    })
  }

  // -------- Draft Save --------
  const handleSaveDraft = async () => {
    if (!draftTitle.trim()) return
    try {
      const allText = blocks.map((b) => b.text).join('\n\n')
      await window.api.saveDraft({
        title: draftTitle.trim(),
        text: allText,
        blocks: blocks.map(({ id, ...rest }) => rest),
        voiceModel: blocks[0]?.voice || '',
        speed: blocks[0]?.speed || 1.0,
        bgm: selectedBgm,
        bgmVolume,
        ttsVolume
      })
      showToast('Đã lưu kịch bản thành công!')
      setShowSaveModal(false)
      setDraftTitle('')
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error')
    }
  }

  // -------- Audio --------
  const stopAudio = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop()
      } catch (e) {
        /* */
      }
      sourceRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    isPlayingRef.current = false
    setIsPlaying(false)
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause()
      bgmAudioRef.current.currentTime = 0
    }
    if (canvasRef.current) {
      const c = canvasRef.current.getContext('2d')
      if (c) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  const playAudio = async () => {
    if (!audioData) return
    if (isPlaying) {
      stopAudio()
      return
    }
    try {
      if (!audioContextRef.current)
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioContextRef.current
      const rawBase64 = audioData.includes(',') ? audioData.split(',')[1] : audioData
      const audioBuffer = await ctx.decodeAudioData(base64ToArrayBuffer(rawBase64))
      const gainNode = ctx.createGain()
      gainNode.gain.value = ttsVolume
      gainNodeRef.current = gainNode
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(gainNode)
      gainNode.connect(analyser)
      analyser.connect(ctx.destination)
      sourceRef.current = source
      analyserRef.current = analyser
      source.onended = () => {
        isPlayingRef.current = false
        setIsPlaying(false)
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        if (bgmAudioRef.current) {
          bgmAudioRef.current.pause()
          bgmAudioRef.current.currentTime = 0
        }
      }
      source.start()
      isPlayingRef.current = true
      setIsPlaying(true)
      if (bgmBase64 && bgmAudioRef.current) {
        bgmAudioRef.current.volume = bgmVolume
        bgmAudioRef.current.currentTime = 0
        bgmAudioRef.current.play().catch(() => {})
      }
      drawVisualizer()
    } catch (e) {
      console.error('Playback error', e)
      setIsPlaying(false)
    }
  }

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const bufLen = analyserRef.current.frequencyBinCount
    const data = new Uint8Array(bufLen)
    const draw = () => {
      if (!isPlayingRef.current) return
      animationRef.current = requestAnimationFrame(draw)
      analyserRef.current.getByteFrequencyData(data)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const bw = (canvas.width / bufLen) * 2.5
      let x = 0
      for (let i = 0; i < bufLen; i++) {
        const bh = (data[i] / 255) * canvas.height
        const g = ctx.createLinearGradient(0, canvas.height, 0, 0)
        g.addColorStop(0, '#059669')
        g.addColorStop(1, '#A7F3D0')
        ctx.fillStyle = g
        ctx.fillRect(x, canvas.height - bh, bw, bh)
        x += bw + 1
      }
    }
    draw()
  }

  const handleDownloadPlain = (dataUri) => {
    if (!dataUri) return
    const link = document.createElement('a')
    link.href = dataUri
    link.download = `SQTT_TTS_${Date.now()}.wav`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportMixed = async () => {
    if (!audioData) return
    setIsExporting(true)
    try {
      const result = await window.api.exportMixedAudio({
        ttsBase64: audioData,
        bgmFilename: selectedBgm,
        ttsVolume,
        bgmVolume
      })
      if (result.success) showToast('Xuất file thành công!', 'success')
      else showToast('Đã hủy xuất file.', 'info')
    } catch (err) {
      showToast(`Lỗi: ${err.message}`, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePlayRecent = (item) => {
    if (recentPlayingId === item.id) {
      if (recentAudioElRef.current) recentAudioElRef.current.pause()
      setRecentPlayingId(null)
      return
    }
    if (recentAudioElRef.current) recentAudioElRef.current.pause()
    const audio = new Audio(item.base64)
    recentAudioElRef.current = audio
    audio.onended = () => setRecentPlayingId(null)
    audio.play().catch(() => {})
    setRecentPlayingId(item.id)
  }

  // -------- Voice Bank Submit --------
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    const validBlocks = blocks.filter((b) => b.text.trim() && b.voice)
    if (validBlocks.length === 0) return

    setIsLoading(true)
    setLogs([])
    setErrorMsg(null)
    stopAudio()
    setAudioData(null)
    const block = validBlocks[0] // Only use the first block for F5-TTS
    addLog(`Đang gửi yêu cầu đến Voice Bank...`)
    addLog(`Giọng: ${block.voice}`)
    if (selectedBgm)
      addLog(`Nhạc nền: ${selectedBgm.replace('.mp3', '')} @ ${Math.round(bgmVolume * 100)}%`)

    try {
      const startTime = Date.now()

      const formData = new FormData()
      formData.append('voice_id', block.voice)
      formData.append('text', block.text)

      const response = await fetch('http://127.0.0.1:8000/api/tts', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || errData.error || 'Lỗi tạo audio từ Server Voice Bank')
      }
      const blob = await response.blob()

      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        const dataUri = reader.result
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
        addLog(`Hoàn tất (${elapsed}s). WAV ready.`)
        setAudioData(dataUri)

        const fullText = block.text
        setRecentAudios((prev) =>
          [
            {
              id: Date.now(),
              textSnippet: fullText.length > 40 ? fullText.substring(0, 40) + '...' : fullText,
              base64: dataUri,
              time: new Date().toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            },
            ...prev
          ].slice(0, 20)
        )

        if (onConversionComplete) {
          onConversionComplete({
            id: Date.now().toString(),
            timestamp: Date.now(),
            rawText: fullText,
            textLength: fullText.length,
            duration: parseFloat(elapsed),
            configSummary: `Voice Bank: ${block.voice}`,
            audioBlob: dataUri,
            speed: 1.0
          })
        }
        setIsLoading(false)
      }
    } catch (err) {
      const msg = err.message || 'Lỗi không kết nối được Ngân hàng Giọng nói'
      setErrorMsg(msg)
      addLog(`[ERROR] ${msg}`)
      setIsLoading(false)
    }
  }

  const charLimit = 5000
  const totalChars = blocks.reduce((sum, b) => sum + b.text.length, 0)
  const isOverLimit = totalChars > charLimit

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : null}
          {toast.message}
        </div>
      )}

      {/* ═══════ LEFT COLUMN — Block Editor ═══════ */}
      <div className="lg:col-span-2 space-y-3">
        {/* Block Editor Header */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#14452F]" />
            <span className="text-xs font-bold text-gray-700">Trình Điều Khiển Voice Bank</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-2.5 py-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition flex items-center gap-1"
              title="Lưu kịch bản nháp"
            >
              <Save className="h-3 w-3" /> Lưu nháp
            </button>
          </div>
        </div>

        {/* Central Voice Block */}
        <div
          className={`space-y-2 transition-colors ${highlightInput ? 'ring-2 ring-emerald-500/30 rounded-lg' : ''}`}
        >
          {blocks.slice(0, 1).map((block, idx) => (
            <div
              key={block.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden group"
            >
              {/* Block Header */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 border-b border-gray-100">
                <span className="text-[10px] font-bold text-[#14452F] bg-emerald-50 px-1.5 py-0.5 rounded">
                  Lựa Chọn Giọng Đọc
                </span>

                {/* Voice selector */}
                <div className="relative flex-1 max-w-[200px]">
                  <select
                    value={block.voice}
                    onChange={(e) => updateBlock(block.id, 'voice', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-[#14452F] font-medium appearance-none pr-6"
                  >
                    {Object.entries(groupModels(models)).map(
                      ([key, group]) =>
                        group.items.length > 0 && (
                          <optgroup key={key} label={group.label}>
                            {group.items.map((m) => (
                              <option key={m} value={m}>
                                {formatModelName(m)}
                              </option>
                            ))}
                          </optgroup>
                        )
                    )}
                  </select>
                  <ChevronDown className="h-3 w-3 text-gray-400 absolute right-1.5 top-1.5 pointer-events-none" />
                </div>

                <div className="flex-1" />

                {/* Char count */}
                <span className="text-[10px] font-mono text-gray-400">
                  {block.text.length} ký tự
                </span>
              </div>

              {/* Block Textarea */}
              <textarea
                value={block.text}
                onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                className="w-full p-3 outline-none resize-none text-sm leading-6 min-h-[140px] placeholder-gray-300 font-medium"
                placeholder="Nhập nội dung văn bản..."
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-end gap-3 mt-1">
          <span
            className={`text-[10px] font-mono flex-shrink-0 ${isOverLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}
          >
            {totalChars.toLocaleString()} / {charLimit.toLocaleString()} ký tự
          </span>
        </div>

        {/* Audio Mixer */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Headphones className="h-3.5 w-3.5 text-[#14452F]" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Bộ trộn Âm thanh
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Nhạc nền
              </label>
              <select
                value={selectedBgm}
                onChange={(e) => setSelectedBgm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:border-[#14452F] outline-none font-medium"
              >
                <option value="">Không dùng nhạc nền</option>
                {bgmList.map((f) => (
                  <option key={f} value={f}>
                    {f.replace(/\.[^.]+$/, '')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Volume2 className="h-3 w-3" /> Giọng đọc{' '}
                <span className="text-[#14452F] ml-auto">{Math.round(ttsVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ttsVolume}
                onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#14452F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Music className="h-3 w-3" /> Nhạc nền{' '}
                <span className={`ml-auto ${selectedBgm ? 'text-[#14452F]' : 'text-gray-300'}`}>
                  {Math.round(bgmVolume * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                disabled={!selectedBgm}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#14452F] disabled:opacity-30"
              />
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || totalChars === 0 || isOverLimit}
          className="w-full py-3 bg-[#14452F] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-emerald-800 disabled:opacity-40 disabled:shadow-none transition flex items-center justify-center gap-2"
        >
          {isLoading ? <Cpu className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isLoading ? `Đang xử lý...` : 'Phát thanh'}
        </button>

        {/* Error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Main Audio Player */}
        {audioData && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 flex items-center gap-3">
            <button
              onClick={playAudio}
              className="h-10 w-10 rounded-full bg-[#14452F] text-white flex items-center justify-center hover:bg-emerald-800 transition flex-shrink-0"
            >
              {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <div className="flex-1 h-10 bg-gray-900 rounded-lg overflow-hidden relative">
              <canvas ref={canvasRef} width={600} height={48} className="w-full h-full" />
              {selectedBgm && bgmBase64 && (
                <div className="absolute top-1 right-2 text-[9px] font-mono text-emerald-400/70">
                  BGM: {selectedBgm.replace(/\.[^.]+$/, '')}
                </div>
              )}
            </div>
            {selectedBgm && bgmBase64 ? (
              <button
                onClick={handleExportMixed}
                disabled={isExporting}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition flex items-center gap-1"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileDown className="h-3.5 w-3.5" />
                )}
                {isExporting ? 'Xuất...' : 'Xuất file'}
              </button>
            ) : (
              <button
                onClick={() => handleDownloadPlain(audioData)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> .WAV
              </button>
            )}
          </div>
        )}

        {/* Log Terminal */}
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-[11px] max-h-24 overflow-y-auto border border-gray-700">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-400 leading-relaxed">
                <span className="text-emerald-500 mr-1">$</span>
                {log}
              </div>
            ))}
            {isLoading && <div className="text-amber-400 animate-pulse">_ processing...</div>}
          </div>
        )}

        {/* Hidden BGM player */}
        {bgmBase64 && (
          <audio
            ref={bgmAudioRef}
            src={bgmBase64}
            loop
            preload="auto"
            style={{ display: 'none' }}
          />
        )}
      </div>

      {/* ═══════ RIGHT COLUMN — Recent Outputs ═══════ */}
      <div className="lg:col-span-1">
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col sticky top-0"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
          <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              🎧 Audio vừa tạo
            </span>
            <span className="text-[10px] text-gray-400 font-mono">{recentAudios.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
            {recentAudios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Headphones className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-xs">Chưa có audio nào</p>
              </div>
            ) : (
              recentAudios.map((item) => (
                <div
                  key={item.id}
                  className="px-3 py-2.5 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handlePlayRecent(item)}
                      className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                        recentPlayingId === item.id
                          ? 'bg-[#14452F] text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700'
                      }`}
                    >
                      {recentPlayingId === item.id ? (
                        <Square className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3 ml-px" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs text-gray-700 leading-relaxed truncate"
                        title={item.textSnippet}
                      >
                        {item.textSnippet}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{item.time}</p>
                    </div>
                    <button
                      onClick={() => handleDownloadPlain(item.base64)}
                      className="mt-0.5 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition opacity-40 group-hover:opacity-100"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════ Save Draft Modal ═══════ */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Save className="h-4 w-4 text-[#14452F]" />
                Lưu kịch bản nháp
              </h3>
            </div>
            <div className="px-5 py-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Tên kịch bản
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveDraft()
                }}
                placeholder="VD: Bản tin sáng 21/02..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#14452F] focus:ring-1 focus:ring-emerald-500/20"
                autoFocus
              />
              <p className="text-[10px] text-gray-400 mt-1.5">
                {blocks.length} đoạn · {totalChars} ký tự · {blocks.filter((b) => b.voice).length}{' '}
                giọng đọc
              </p>
            </div>
            <div className="px-5 py-3 flex gap-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowSaveModal(false)
                  setDraftTitle('')
                }}
                className="flex-1 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={!draftTitle.trim()}
                className="flex-1 py-2 bg-[#14452F] text-white text-sm font-medium rounded-lg hover:bg-emerald-800 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Prosody Modal ═══════ */}
      {showPauseModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Music className="h-4 w-4 text-[#14452F]" /> Prosody
              </h3>
              <button
                onClick={() => setShowPauseModal(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['slow', 'default', 'fast'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      if (mode === 'default')
                        setDraftPauseConfig({
                          period: 0.5,
                          comma: 0.2,
                          semicolon: 0.3,
                          newline: 0.8
                        })
                      if (mode === 'fast')
                        setDraftPauseConfig({
                          period: 0.3,
                          comma: 0.1,
                          semicolon: 0.2,
                          newline: 0.5
                        })
                      if (mode === 'slow')
                        setDraftPauseConfig({
                          period: 0.8,
                          comma: 0.4,
                          semicolon: 0.5,
                          newline: 1.2
                        })
                    }}
                    className="py-1.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg text-xs text-gray-600 font-medium transition"
                  >
                    {mode === 'slow' ? 'Chậm' : mode === 'fast' ? 'Nhanh' : 'Chuẩn'}
                  </button>
                ))}
              </div>
              {[
                { label: 'Dấu chấm', sym: '.', key: 'period', max: 2.0 },
                { label: 'Dấu phẩy', sym: ',', key: 'comma', max: 1.0 },
                { label: 'Chấm phẩy', sym: ';', key: 'semicolon', max: 1.5 },
                { label: 'Xuống dòng', sym: '¶', key: 'newline', max: 3.0 }
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium flex items-center gap-1.5">
                      <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold font-mono border">
                        {item.sym}
                      </span>
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-600">
                      {draftPauseConfig[item.key]}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={item.max}
                    step="0.05"
                    value={draftPauseConfig[item.key]}
                    onChange={(e) =>
                      setDraftPauseConfig((p) => ({
                        ...p,
                        [item.key]: parseFloat(parseFloat(e.target.value).toFixed(2))
                      }))
                    }
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#14452F]"
                  />
                </div>
              ))}
            </div>
            <div className="px-4 py-3 flex gap-2 border-t border-gray-100">
              <button
                onClick={() => setShowPauseModal(false)}
                className="flex-1 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setPauseConfig({ ...draftPauseConfig })
                  setShowPauseModal(false)
                }}
                className="flex-1 py-1.5 bg-[#14452F] text-white text-sm font-medium rounded-lg hover:bg-emerald-800 transition flex justify-center items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
