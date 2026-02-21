import { useState, useEffect } from 'react'
import {
  FlaskConical,
  Upload,
  FileText,
  Cpu,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Trash2
} from 'lucide-react'

export default function VoiceLab() {
  const [step, setStep] = useState(1)
  const [wavFile, setWavFile] = useState(null)
  const [txtFile, setTxtFile] = useState(null)
  const [gpuStatus, setGpuStatus] = useState('scanning') // scanning, none, found
  const [isGpuLoading, setIsGpuLoading] = useState(false)
  const [isTraining, setIsTraining] = useState(false)

  useEffect(() => {
    if (step === 2) {
      scanGpu()
    }
  }, [step])

  const scanGpu = () => {
    setIsGpuLoading(true)
    setGpuStatus('scanning')
    setTimeout(() => {
      setGpuStatus('none')
      setIsGpuLoading(false)
    }, 1500)
  }

  const handleStartTraining = async () => {
    setIsTraining(true)
    try {
      const result = await window.api.ipcRenderer.invoke('start-voice-training')
      if (result.message === 'GPU_NOT_FOUND') {
        alert('Chưa tìm thấy Server GPU nội bộ. Vui lòng kết nối phần cứng để bắt đầu huấn luyện.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsTraining(false)
    }
  }

  const isStep1Done = wavFile && txtFile
  const isStep2Done = gpuStatus === 'found'

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Warning Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">
              ⚠️ YÊU CẦU PHẦN CỨNG
            </h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Tính năng Huấn luyện Giọng nói (Voice Cloning) yêu cầu máy tính được trang bị Card đồ họa (GPU) chuyên dụng (NVIDIA RTX 3060 trở lên). Hệ thống hiện đang chạy ở chế độ mô phỏng giao diện.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STEP 1: Data Prep */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${step === 1 ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${wavFile && txtFile ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {wavFile && txtFile ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <h3 className="font-bold text-gray-800 text-sm uppercase">Bước 1: Chuẩn bị Dữ liệu</h3>
          </div>

          <div className="space-y-3">
            <div className="relative group">
              <input
                type="file"
                accept=".wav"
                onChange={(e) => setWavFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition ${wavFile ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 group-hover:border-emerald-400 group-hover:bg-gray-50'}`}>
                <Upload className={`h-6 w-6 mx-auto mb-2 ${wavFile ? 'text-emerald-500' : 'text-gray-400'}`} />
                <p className="text-[11px] font-bold text-gray-700 truncate">
                  {wavFile ? wavFile.name : 'Tải lên File Mẫu (.wav)'}
                </p>
                <p className="text-[9px] text-gray-400 mt-1">Giọng đọc mẫu cần rõ nét, ít tạp âm.</p>
              </div>
            </div>

            <div className="relative group">
              <input
                type="file"
                accept=".txt"
                onChange={(e) => setTxtFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition ${txtFile ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 group-hover:border-emerald-400 group-hover:bg-gray-50'}`}>
                <FileText className={`h-6 w-6 mx-auto mb-2 ${txtFile ? 'text-emerald-500' : 'text-gray-400'}`} />
                <p className="text-[11px] font-bold text-gray-700 truncate">
                  {txtFile ? txtFile.name : 'Tải lên Nội dung (.txt)'}
                </p>
                <p className="text-[9px] text-gray-400 mt-1">Văn bản tương ứng với file âm thanh.</p>
              </div>
            </div>
            
            {wavFile && txtFile && (
               <button 
                 onClick={() => { setWavFile(null); setTxtFile(null); }}
                 className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-600 transition"
               >
                 <Trash2 className="h-3 w-3" /> Xóa dữ liệu đã chọn
               </button>
            )}
          </div>
          
          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
            * Chọn tập tin chứa giọng nói và văn bản bồi hoàn để máy học.
          </p>
        </div>

        {/* STEP 2: Hardware Check */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${step === 2 ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${gpuStatus === 'found' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {gpuStatus === 'found' ? <CheckCircle className="h-5 w-5" /> : '2'}
            </div>
            <h3 className="font-bold text-gray-800 text-sm uppercase">Bước 2: Kiểm tra Phần cứng</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="relative mb-4">
              <Cpu className={`h-12 w-12 ${gpuStatus === 'found' ? 'text-emerald-500' : gpuStatus === 'none' ? 'text-red-400' : 'text-gray-300'}`} />
              {isGpuLoading && <Loader2 className="h-12 w-12 text-emerald-500 absolute inset-0 animate-spin opacity-50" />}
            </div>

            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 
              ${gpuStatus === 'scanning' ? 'bg-blue-50 text-blue-600' : 
                gpuStatus === 'none' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 
                'bg-emerald-50 text-emerald-600'}`}>
              {gpuStatus === 'scanning' ? 'Đang quét hệ thống...' : 
               gpuStatus === 'none' ? 'Không tìm thấy GPU Rời' : 'Sẵn sàng (RTX 3060+)'}
            </div>

            <button 
              onClick={scanGpu}
              disabled={isGpuLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isGpuLoading ? 'animate-spin' : ''}`} /> Làm mới
            </button>
          </div>

          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
            * Hệ thống tự động kiểm tra Card đồ họa để đảm bảo tốc độ nhân bản.
          </p>
        </div>

        {/* STEP 3: Start Training */}
        <div className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${step === 3 ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-gray-800 text-sm uppercase">Bước 3: Bắt đầu Huấn luyện</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-4 h-[180px]">
            <button
              onClick={handleStartTraining}
              disabled={!isStep1Done || gpuStatus !== 'found' || isTraining}
              className={`w-full py-6 rounded-xl font-bold text-sm uppercase flex flex-col items-center justify-center gap-3 transition shadow-lg
                ${(!isStep1Done || gpuStatus !== 'found') 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none grayscale border border-gray-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 hover:shadow-emerald-600/40 transform active:scale-[0.98]'}`}
            >
              <div className={`p-3 rounded-full ${(!isStep1Done || gpuStatus !== 'found') ? 'bg-gray-200' : 'bg-white/20'}`}>
                {isTraining ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Zap className="h-6 w-6" />}
              </div>
              🚀 BẮT ĐẦU NHÂN BẢN GIỌNG NÓI
            </button>
          </div>

          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed italic">
            * Nhấn để bắt đầu quá trình huấn luyện AI. Thời gian dự kiến: 2-4 giờ.
          </p>
        </div>
      </div>
      
      {/* Help Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
         <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-gray-400" />
            <h4 className="text-xs font-bold text-gray-600 uppercase">Hướng dẫn sử dụng</h4>
         </div>
         <ul className="space-y-2">
            <li className="flex gap-2 text-xs text-gray-600">
               <span className="text-emerald-500 font-bold">•</span>
               <span>Tải lên 5-10 file âm thanh mẫu (.wav) chất lượng cao để có kết quả tốt nhất.</span>
            </li>
            <li className="flex gap-2 text-xs text-gray-600">
               <span className="text-emerald-500 font-bold">•</span>
               <span>Đảm bảo máy tính không chạy các ứng dụng nặng khác trong quá trình huấn luyện.</span>
            </li>
            <li className="flex gap-2 text-xs text-gray-600">
               <span className="text-emerald-500 font-bold">•</span>
               <span>Mô hình sau khi huấn luyện sẽ tự động xuất hiện trong danh sách Giọng Đọc.</span>
            </li>
         </ul>
      </div>
    </div>
  )
}
