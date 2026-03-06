import { useState } from 'react'
import {
  FlaskConical,
  Upload,
  FileText,
  Cpu,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Trash2,
  Volume2,
  Terminal,
  Copy
} from 'lucide-react'

export default function VoiceLab() {
  const [voiceName, setVoiceName] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [textToSpeak, setTextToSpeak] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultAudioUrl, setResultAudioUrl] = useState(null)
  const [error, setError] = useState(null)

  const handleCloneVoice = async () => {
    if (!voiceName || !audioFile || !textToSpeak) {
      alert('Vui lòng điền đầy đủ thông tin: Tên giọng nói, File mẫu và Văn bản.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResultAudioUrl(null)

    const formData = new FormData()
    formData.append('voice_name', voiceName)
    formData.append('audio_file', audioFile)
    formData.append('text', textToSpeak)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/clone-voice', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Server returned an error')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResultAudioUrl(url)
    } catch (err) {
      console.error('Cloning error:', err)
      setError('Không thể kết nối đến AI Engine. Vui lòng kiểm tra card đồ họa và server nội bộ.')
      alert('Không thể kết nối đến AI Engine. Vui lòng kiểm tra card đồ họa và server nội bộ.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setVoiceName('')
    setAudioFile(null)
    setTextToSpeak('')
    setResultAudioUrl(null)
    setError(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Đã sao chép lệnh!')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Information & Startup Banner */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* PHẦN 1: YÊU CẦU HỆ THỐNG */}
          <div className="p-5 bg-amber-50/50 border-r border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
                PHẦN 1: ⚠️ YÊU CẦU HỆ THỐNG & KẾT NỐI
              </h3>
            </div>
            <div className="space-y-3 text-xs text-amber-900/80 leading-relaxed">
              <p>
                <span className="font-bold text-amber-800">● Cơ chế:</span> Tính năng Nhân bản Giọng nói (Zero-Shot Voice Cloning) yêu cầu kết nối trực tiếp với AI Engine (Qwen3-TTS) đang chạy tại máy tính của bạn.
              </p>
              <p>
                <span className="font-bold text-amber-800">● Phần cứng:</span> Yêu cầu GPU NVIDIA RTX (khuyến nghị VRAM 6GB+ như dòng RTX 3060).
              </p>
              <p>
                <span className="font-bold text-amber-800">● Dữ liệu:</span> Công nghệ Zero-Shot chỉ cần 10 giây âm thanh mẫu giọng nói (không tạp âm) để trích xuất bản đồ âm sắc.
              </p>
            </div>
          </div>

          {/* PHẦN 2: HƯỚNG DẪN KHỞI ĐỘNG */}
          <div className="p-5 bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-5 w-5 text-slate-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                PHẦN 2: 🚀 HƯỚNG DẪN KHỞI ĐỘNG ĐỘNG CƠ AI
              </h3>
            </div>
            
            <div className="relative group">
              <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-emerald-400 border border-slate-800">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-slate-500 text-[10px]"># terminal_instructions</span>
                  <button 
                  onClick={() => copyToClipboard('cd MB-TTS-AI-Engine\n.\\venv\\Scripts\\activate\npython ai_server.py')}
                  className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white">
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <p>cd MB-TTS-AI-Engine</p>
                <p>.\venv\Scripts\activate</p>
                <p>python ai_server.py</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic">
              Lưu ý: Lần chạy đầu tiên hệ thống sẽ tự động tải mô hình Qwen3-TTS về máy tính. Vui lòng giữ nguyên cửa sổ Terminal trong suốt quá trình sử dụng.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-900 flex items-center justify-center">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 uppercase">Cấu hình Nhân bản</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Military Standard Lab
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Voice Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-blue-900" />
                Tên Giọng Đọc
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Giọng Đồng chí A"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition"
              />
            </div>

            {/* Audio File */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                <Upload className="h-3.5 w-3.5 text-blue-900" />
                File Âm Thanh Mẫu
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".wav,.mp3"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition ${audioFile ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 group-hover:border-blue-900 group-hover:bg-slate-50'}`}
                >
                  <Volume2
                    className={`h-8 w-8 mx-auto mb-2 ${audioFile ? 'text-emerald-500' : 'text-slate-300'}`}
                  />
                  <p className="text-xs font-bold text-gray-700 truncate">
                    {audioFile ? audioFile.name : 'Nhấp hoặc kéo thả file .wav / .mp3'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Tối đa 10 giây. Âm thanh rõ nét.</p>
                </div>
              </div>
            </div>

            {/* Text to Speak */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-900" />
                Văn bản cần đọc
              </label>
              <textarea
                placeholder="Nhập nội dung cần chuyển đổi sang giọng nói nhân bản..."
                value={textToSpeak}
                onChange={(e) => setTextToSpeak(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCloneVoice}
                disabled={isLoading || !voiceName || !audioFile || !textToSpeak}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm uppercase transition shadow-md
                  ${
                    isLoading
                      ? 'bg-blue-800 text-white cursor-wait'
                      : 'bg-blue-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                  } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    ĐANG XỬ LÝ GPU...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    🚀 TẠO GIỌNG ĐỌC
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                className="px-4 py-3 border border-slate-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-red-500 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status & Output Section */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl min-h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                System Terminal
              </h3>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
            </div>

            <div className="flex-1 font-mono text-xs space-y-2 text-slate-300">
              <p className="text-emerald-400">$ system_status: IDLE</p>
              {isLoading && (
                <p className="animate-pulse text-blue-400 italic">
                  [BUSY] Đang sử dụng GPU RTX để nhân bản giọng nói...
                </p>
              )}
              {error && <p className="text-red-400 font-bold">[ERROR] {error}</p>}
              {resultAudioUrl && (
                <p className="text-emerald-400">
                  [SUCCESS] Kết quả nhân bản hoàn tất. Sẵn sàng phát lại.
                </p>
              )}
              {!isLoading && !error && !resultAudioUrl && (
                <p className="text-slate-500 italic">Sẵn sàng tiếp nhận yêu cầu từ phòng Lab.</p>
              )}
            </div>

            {resultAudioUrl && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Kết quả Audio</p>
                <audio
                  controls
                  src={resultAudioUrl}
                  autoPlay
                  className="w-full h-10 filter invert brightness-100 contrast-100"
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-900" />
              <h4 className="text-xs font-bold text-blue-900 uppercase">Quy trình Lab</h4>
            </div>
            <ul className="space-y-2">
              <li className="flex gap-2 text-xs text-slate-600">
                <span className="text-blue-900 font-bold">01.</span>
                <span>Nhập tên định danh cho giọng nói để lưu vào hệ thống.</span>
              </li>
              <li className="flex gap-2 text-xs text-slate-600">
                <span className="text-blue-900 font-bold">02.</span>
                <span>Cung cấp 5-10 giây âm thanh mẫu rõ lời, không nhạc nền.</span>
              </li>
              <li className="flex gap-2 text-xs text-slate-600">
                <span className="text-blue-900 font-bold">03.</span>
                <span>Kết quả sẽ được xử lý trực tiếp bởi AI Engine Local.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
