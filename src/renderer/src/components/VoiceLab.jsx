import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Zap,
  CheckCircle,
  Loader2,
  Trash2,
  Volume2,
  Terminal,
  Copy,
  Download,
  FlaskConical,
  Upload,
  FileText,
  Cpu,
  AlertTriangle,
  Info
} from 'lucide-react'

// Helper Component for terminal/code blocks
function CodeBlock({
  code = '',
  language = 'bash',
  copyToClipboard = () => {},
  maxHeight = 'max-h-40'
}) {
  if (!code) return null
  return (
    <div className="relative group">
      <div
        className={`bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-y-auto ${maxHeight} custom-scrollbar`}
      >
        <div className="flex justify-between items-start mb-2 sticky top-0 bg-slate-900/90 pb-1 backdrop-blur-sm">
          <span className="text-slate-500 text-[9px] uppercase tracking-wider font-bold">
            # {language}
          </span>
          <button
            onClick={() => copyToClipboard(code)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md transition text-slate-300 hover:text-white flex items-center gap-1.5 shadow-sm border border-slate-700"
          >
            <Copy className="h-3 w-3" />
            <span className="text-[9px] font-bold">COPY</span>
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-all leading-relaxed">{code}</pre>
      </div>
    </div>
  )
}

export default function VoiceLab() {
  const [voiceName, setVoiceName] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const handleSaveVoice = async () => {
    if (!voiceName || !audioFile) {
      alert('Vui lòng điền đầy đủ thông tin: Tên giọng nói và File mẫu.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('voice_name', voiceName)
    formData.append('audio_file', audioFile)

    try {
      const response = await fetch('http://127.0.0.1:8000/api/add-voice', {
        method: 'POST',
        body: formData
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Server returned an error')
      }

      setSuccessMsg(data.message || 'Đã lưu thành công!')
      setVoiceName('')
      setAudioFile(null)
    } catch (err) {
      console.error('Saving error:', err)
      const msg = err.message || 'Không thể kết nối đến AI Engine.'
      setError(msg)
      alert(`[LỖI] ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setVoiceName('')
    setAudioFile(null)
    setError(null)
    setSuccessMsg(null)
  }

  const [activeStep, setActiveStep] = useState(null)

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Đã sao chép lệnh!')
  }

  const steps = [
    {
      id: 1,
      title: 'Bước 1: Cài đặt Python chuẩn quân sự (3.10.11)',
      icon: <Download className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Yêu cầu người dùng tải và cài đặt Python 3.10.11 (64-bit) để đảm bảo tính tương thích
            tuyệt đối với các thư viện AI.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-xs font-bold text-amber-800 uppercase">
                BẮT BUỘC: Phải tích vào ô &quot;Add Python 3.10 to PATH&quot; ở màn hình cài đặt đầu
                tiên.
              </p>
            </div>
          </div>
          <a
            href="https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-sm"
          >
            <Download className="h-4 w-4" /> TẢI XUỐNG PYTHON 3.10.11
          </a>
        </div>
      )
    },
    {
      id: 2,
      title: 'Bước 2: Khởi tạo Lò phản ứng (Môi trường ảo)',
      icon: <Zap className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Tạo thư mục và môi trường ảo biệt lập nằm ngoài dự án để quản lý các dependencies của AI
            Engine.
          </p>
          <CodeBlock
            code={`cd ..\nmkdir MB-TTS-AI-Engine\ncd MB-TTS-AI-Engine\npy -3.10 -m venv venv\n.\\venv\\Scripts\\Activate.ps1`}
            language="powershell"
            copyToClipboard={copyToClipboard}
          />
          <p className="text-[10px] text-red-500 italic font-medium">
            Ghi chú: Nếu báo lỗi đỏ khi Activate, chạy lệnh:{' '}
            <code className="bg-red-50 px-1 rounded">
              Set-ExecutionPolicy Unrestricted -Scope CurrentUser
            </code>
          </p>
        </div>
      )
    },
    {
      id: 3,
      title: 'Bước 3: Nạp nhân CUDA & Thư viện lõi',
      icon: <Cpu className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Cài đặt PyTorch hỗ trợ CUDA 11.8 và các thư viện xử lý ngôn ngữ, âm thanh.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg mb-2">
            <p className="text-[10px] text-blue-800 leading-tight">
              Lưu ý: Quá trình này tải khoảng 2-3GB dữ liệu. Vui lòng đảm bảo kết nối mạng ổn định.
            </p>
          </div>
          <CodeBlock
            code={`pip --default-timeout=2000 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118\npip install fastapi uvicorn python-multipart pydantic TTS transformers==4.37.2`}
            language="bash"
            copyToClipboard={copyToClipboard}
          />
        </div>
      )
    },
    {
      id: 4,
      title: 'Bước 4: Đúc Lõi Động Cơ (Tạo file Server)',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Tạo file <code className="bg-slate-100 px-1 rounded font-bold">ai_server.py</code> trong
            thư mục MB-TTS-AI-Engine và dán đoạn mã dưới đây:
          </p>
          <CodeBlock
            code={`import os
import subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MB-TTS Voice Bank Engine", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tạo kho lưu trữ giọng nói gốc
VOICE_BANK_DIR = "voice_bank"
os.makedirs(VOICE_BANK_DIR, exist_ok=True)

print("[*] Hệ thống Ngân hàng Giọng nói đã khởi động.")

# API 1: XEM DANH SÁCH GIỌNG ĐÃ LƯU
@app.get("/api/voices")
async def get_voices():
    voices = []
    for file in os.listdir(VOICE_BANK_DIR):
        if file.endswith(".wav"):
            voice_name = file.replace(".wav", "")
            voices.append({"id": voice_name, "name": voice_name})
    return {"success": True, "voices": voices}

# API 2: THÊM GIỌNG MỚI VÀO NGÂN HÀNG (Chỉ làm 1 lần cho mỗi người)
@app.post("/api/add-voice")
async def add_voice(
    voice_name: str = Form(...),
    audio_file: UploadFile = File(...)
):
    print(f"[+] Đang lưu trữ định danh giọng mới: {voice_name}")
    
    # Định dạng tên file an toàn (bỏ khoảng trắng)
    safe_name = voice_name.strip().replace(" ", "_")
    save_path = os.path.join(VOICE_BANK_DIR, f"{safe_name}.wav")
    
    with open(save_path, "wb") as f:
        f.write(await audio_file.read())
        
    return {"success": True, "message": f"Đã lưu thành công giọng: {voice_name}"}

# API 3: SỬ DỤNG GIỌNG ĐÃ LƯU ĐỂ ĐỌC VĂN BẢN (Dùng nhiều lần)
@app.post("/api/tts")
async def generate_tts(
    voice_id: str = Form(...),
    text: str = Form(...)
):
    print(f"\\n[+] Lệnh TTS - Giọng: {voice_id}")
    
    ref_audio_path = os.path.join(VOICE_BANK_DIR, f"{voice_id}.wav")
    if not os.path.exists(ref_audio_path):
        raise HTTPException(status_code=404, detail="Không tìm thấy giọng nói này trong kho.")
        
    output_dir = "output_audio"
    os.makedirs(output_dir, exist_ok=True)
    default_out_file = os.path.join(output_dir, "out.wav")
    final_output_path = os.path.join(output_dir, f"tts_{voice_id}.wav")
    
    command = [
        "f5-tts_infer-cli",
        "--model", "F5TTS_v1_Base",
        "--ref_audio", ref_audio_path,
        "--gen_text", text,
        "--output_dir", output_dir
    ]
    
    try:
        print("[*] Đang xuất audio...")
        subprocess.run(command, check=True)
        
        if os.path.exists(default_out_file):
            if os.path.exists(final_output_path):
                os.remove(final_output_path)
            os.rename(default_out_file, final_output_path)
            print(f"[+] Hoàn tất xử lý cho giọng {voice_id}!")
        else:
            raise Exception("Lỗi file đầu ra.")
            
    except subprocess.CalledProcessError:
        return {"success": False, "error": "Lỗi phần cứng khi xử lý."}
        
    return FileResponse(final_output_path, media_type="audio/wav")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)`}
            language="python"
            copyToClipboard={copyToClipboard}
            maxHeight="max-h-64"
          />
        </div>
      )
    },
    {
      id: 5,
      title: 'Bước 5: Kích hoạt hệ thống',
      icon: <CheckCircle className="h-5 w-5" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Khởi động AI Engine lần đầu để tải mô hình (1.87GB) và bắt đầu phục vụ.
          </p>
          <CodeBlock
            code={`python ai_server.py`}
            language="bash"
            copyToClipboard={copyToClipboard}
          />
          <div className="bg-slate-100 rounded-lg p-3 text-[11px] text-slate-600 border border-slate-200">
            <p>
              ● Lần đầu chạy sẽ yêu cầu xác nhận CPML (gõ{' '}
              <kbd className="bg-white px-1 border rounded shadow-sm text-blue-600 font-bold">
                y
              </kbd>{' '}
              và Enter).
            </p>
            <p>
              ● Hãy giữ nguyên cửa sổ Terminal này chạy ngầm trong suốt quá trình sử dụng phần mềm.
            </p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* New Onboarding Guide Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-900 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-bold text-slate-800 uppercase tracking-tight">
              Hướng Dẫn Cài Đặt Động Cơ Voice Bank (Chỉ làm 1 lần)
            </h2>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-full uppercase">
            Yêu cầu card NVIDIA
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {steps.map((step) => (
            <div key={step.id} className="group">
              <button
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${activeStep === step.id ? 'bg-blue-900 text-white shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}
                  >
                    {step.icon}
                  </div>
                  <h3
                    className={`font-bold text-sm transition-colors ${activeStep === step.id ? 'text-blue-900' : 'text-slate-700'}`}
                  >
                    {step.title}
                  </h3>
                </div>
                <div
                  className={`transform transition-transform duration-200 ${activeStep === step.id ? 'rotate-180' : ''}`}
                >
                  <svg
                    className="h-5 w-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {activeStep === step.id && (
                <div className="px-18 pb-6 pr-6 pl-18 md:pl-20 animate-in slide-in-from-top-2 duration-300">
                  {step.content}
                </div>
              )}
            </div>
          ))}
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
              <h3 className="font-bold text-gray-800 uppercase">Thêm Giọng Vào Ngân Hàng</h3>
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

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveVoice}
                disabled={isLoading || !voiceName || !audioFile}
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
                    💾 LƯU VÀO NGÂN HÀNG
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
                  [BUSY] Đang gửi file âm thanh gốc lên Ngân hàng Giọng nói...
                </p>
              )}
              {error && <p className="text-red-400 font-bold">[ERROR] {error}</p>}
              {successMsg && <p className="text-emerald-400">[SUCCESS] {successMsg}</p>}
              {!isLoading && !error && !successMsg && (
                <p className="text-slate-500 italic">Sẵn sàng tiếp nhận yêu cầu từ phòng Lab.</p>
              )}
            </div>
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
                <span>
                  Hệ thống sẽ lưu trữ đặc trưng âm học vào thư mục Voice Bank. Tất cả giọng sẽ tự
                  động xuất hiện ở tính năng Phát thanh.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

CodeBlock.propTypes = {
  code: PropTypes.string,
  language: PropTypes.string,
  copyToClipboard: PropTypes.func,
  maxHeight: PropTypes.string
}
