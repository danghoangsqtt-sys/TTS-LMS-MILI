import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Mic,
  Square,
  Upload,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  FileText,
  Zap,
  Loader2,
  ArrowRight,
  Info
} from 'lucide-react'

export default function VoiceLab() {
  // --- States ---
  const [profileName, setProfileName] = useState('')
  const [transcriptText, setTranscriptText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingBlob, setRecordingBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  // --- Refs ---
  const mediaRecorderRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  // --- Recording Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' })
        setRecordingBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      showStatus('error', 'Không thể truy cập Microphone. Vui lòng kiểm tra quyền thiết bị.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'audio/wav') {
        showStatus('error', 'Vui lòng chỉ tải lên định dạng .WAV chuẩn kỹ thuật.')
        return
      }
      setRecordingBlob(file)
      setAudioUrl(URL.createObjectURL(file))
      showStatus('success', `Đã nạp file: ${file.name}`)
    }
  }

  // --- Submit Logic ---
  const handleCreateProfile = async () => {
    if (!profileName.trim()) return showStatus('error', 'Vui lòng nhập Tên Hồ Sơ Giọng.')
    if (!transcriptText.trim()) return showStatus('error', 'Vui lòng nhập Văn bản đối khớp.')
    if (!recordingBlob) return showStatus('error', 'Chưa có dữ liệu âm thanh mẫu.')

    setIsProcessing(true)
    setStatusMsg({ type: '', text: '' })

    const formData = new FormData()
    formData.append('voice_name', profileName)
    formData.append('audio_file', recordingBlob)
    formData.append('ref_text', transcriptText)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/clone-voice', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        showStatus('success', 'KHỞI TẠO THÀNH CÔNG: Hồ sơ đã được nạp vào Radar Chỉ huy.')
        // Clear form on success
        setProfileName('')
        setTranscriptText('')
        setRecordingBlob(null)
        setAudioUrl(null)
      } else {
        throw new Error(data.error || 'Lỗi xử lý đặc trưng âm thanh.')
      }
    } catch (err) {
      showStatus('error', `THẤT BẠI: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const showStatus = useCallback((type, text) => {
    setStatusMsg({ type, text })
    if (type === 'success') {
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 5000)
    }
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
              <Mic size={24} />
            </span>
            Phòng Thu Tác Chiến
          </h1>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            Hệ thống Nhân bản Giọng nói Neural (Zero-shot Cloning) <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Khối DHS-Cloning</span>
          </p>
        </div>
        
        {statusMsg.text && (
          <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 animate-in slide-in-from-right-4 shadow-sm border ${
            statusMsg.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}>
            {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-xs font-bold uppercase tracking-tight">{statusMsg.text}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[35fr_65fr] gap-6 items-start">
        
        {/* Left Column: Guidelines */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Info className="text-emerald-600" size={20} />
              <h2 className="font-black text-slate-800 uppercase tracking-wider text-xs">📋 Tiêu chuẩn Hồ sơ Giọng nói</h2>
            </div>
            
            <div className="p-6 space-y-5">
              {[
                { title: 'Thời lượng vàng', desc: 'Âm thanh mẫu tối ưu từ 5 đến 15 giây.', icon: <Clock size={16} /> },
                { title: 'Chất lượng phòng thu', desc: 'Định dạng WAV, không tạp âm, không nhạc nền.', icon: <Zap size={16} /> },
                { title: 'Văn bản đối khớp', desc: 'Chính xác 100% nội dung người nói đang đọc.', icon: <FileText size={16} /> },
                { title: 'Môi trường yên tĩnh', desc: 'Tránh các khu vực có tiếng vang hoặc gió.', icon: <Mic size={16} /> }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 group">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-slate-100 mt-2">
                <button 
                  onClick={() => alert('Đang mở thư mục Voice Bank...')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all text-xs font-bold border border-slate-200"
                >
                  <FolderOpen size={16} />
                  Mở thư mục Kho Giọng gốc
                </button>
              </div>
            </div>
          </div>

          <div className="bg-emerald-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-xl">
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Mic size={150} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-2">Trạng thái Lõi</h3>
            <p className="text-lg font-bold leading-tight uppercase">Hệ thống sẵn sàng tiếp nhận tín hiệu Neural</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-300">DHS-Engine v2.0 Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Recording Station */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-[600px] overflow-hidden">
          
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Zap size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hệ thống Nhân bản Giọng</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Khối Điều khiển DHS-Cloning Central</p>
              </div>
            </div>
          </div>

          <div className="p-8 flex-1 space-y-8">
            
            {/* Step 1: Identification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">1</span>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Tên Hồ Sơ Giọng (Định danh)</label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ví dụ: Đại úy Hùng - Miền Bắc"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Step 2: Transcript */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Văn bản mẫu (Lời thoại đọc)</label>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-4 text-slate-400">
                  <FileText size={18} />
                </div>
                <textarea 
                  rows={4}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Nhập chính xác 100% nội dung bạn định đọc trong audio mẫu..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Step 3: Audio Control */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">3</span>
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">Kiểm soát Tín hiệu Âm thanh</label>
              </div>
              
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 relative group overflow-hidden">
                
                {audioUrl && !isRecording && (
                   <div className="absolute top-4 right-4 animate-in fade-in zoom-in">
                      <audio controls src={audioUrl} className="h-8 w-48 opacity-60 hover:opacity-100 transition-opacity" />
                   </div>
                )}

                <div className="relative">
                  {isRecording && (
                    <div className="absolute -inset-8 bg-red-500/5 rounded-full animate-ping" />
                  )}
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`h-24 w-24 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10 ${
                      isRecording 
                      ? 'bg-red-500 text-white animate-pulse shadow-red-200 scale-110' 
                      : 'bg-white text-slate-400 border-4 border-slate-100 hover:border-emerald-500 hover:text-emerald-500 shadow-slate-100'
                    }`}
                  >
                    {isRecording ? <Square size={32} /> : <Mic size={32} />}
                  </button>
                </div>

                <div className="text-center space-y-1">
                   {isRecording ? (
                     <>
                        <p className="text-2xl font-black text-red-500 font-mono tracking-tighter">{formatTime(recordingTime)}</p>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Đang thu tín hiệu...</p>
                     </>
                   ) : (
                     <>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Nhấn để bắt đầu thu âm</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">Đảm bảo bạn đọc to, rõ lời và ngắt nghỉ đúng dấu câu.</p>
                     </>
                   )}
                </div>

                <div className="pt-4 flex flex-col items-center gap-3">
                   <div className="h-px w-32 bg-slate-200" />
                   <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                      <Upload size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Hoặc tải file .wav</span>
                      <input type="file" accept=".wav" onChange={handleFileUpload} className="hidden" />
                   </label>
                </div>
              </div>
            </div>

          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={handleCreateProfile}
              disabled={isProcessing || isRecording}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl ${
                isProcessing 
                ? 'bg-slate-200 text-slate-400 cursor-wait' 
                : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-emerald-200 hover:-translate-y-1 active:translate-y-0'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Đang đúc lõi hồ sơ...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  ⚡ TẠO HỒ SƠ NHÂN BẢN GIỌNG
                  <ArrowRight size={18} className="opacity-50" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
