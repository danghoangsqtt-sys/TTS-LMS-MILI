import { Mic, Zap, ChevronRight, Fingerprint } from 'lucide-react'

export default function UserGuide() {
  const steps = [
    {
      id: 1,
      title: 'Huấn luyện AI',
      subtitle: 'Voice Profiling',
      icon: <Fingerprint className="h-4 w-4 text-[#10b981]" />,
      description: 'Tải lên các đoạn văn bản mẫu kèm âm thanh để AI trích xuất đặc trưng giọng nói (Vân giọng).'
    },
    {
      id: 2,
      title: 'Console Phát thanh',
      subtitle: 'Neural Synthesis',
      icon: <Mic className="h-4 w-4 text-[#10b981]" />,
      description: 'Nhập nội dung cần truyền tải. Hệ thống tự động chuẩn hóa số liệu và ngữ pháp trước khi tổng hợp.'
    },
    {
      id: 3,
      title: 'Lưu trữ & Xuất bản',
      subtitle: 'Signal Output',
      icon: <Zap className="h-4 w-4 text-[#10b981]" />,
      description: 'Kiểm tra tệp tin âm thanh đầu ra và lưu vào thư viện để sử dụng cho các phiên tiếp theo.'
    }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black text-slate-800 tracking-[0.2em] uppercase">
          Giao thức vận hành <span className="text-[#10b981]">MB-TTS CORE</span>
        </h2>
        <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">
          Thông tin hệ thống: Trạng thái Động cơ [Hoạt động] | Phiên bản Standard (CPU)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step) => (
          <div key={step.id} className="bg-white border border-slate-200 p-5 rounded hover:border-[#10b981]/30 transition-all group shadow-sm hover:shadow-md">
            <div className="h-10 w-10 rounded bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 group-hover:bg-[#10b981]/10 transition-colors">
              {step.icon}
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {step.id}. {step.title}
              </h3>
              <p className="text-[9px] uppercase font-black tracking-widest text-[#10b981]/60 leading-none">
                {step.subtitle}
              </p>
              <p className="text-slate-500 text-[11px] leading-relaxed font-medium pt-3 uppercase tracking-tight">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded border border-slate-200 p-8 text-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <h4 className="text-sm font-black italic tracking-[0.2em] uppercase text-slate-800">Cảnh báo vận hành?</h4>
            <p className="max-w-md text-slate-500 text-[11px] font-medium leading-relaxed uppercase tracking-tight">
              Đảm bảo mẫu âm thanh không có tạp âm và văn bản khớp 100% với nội dung nói để AI có thể học được &quot;vân giọng&quot; chính xác nhất.
            </p>
          </div>
          <button className="whitespace-nowrap px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded font-black text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2 uppercase shadow-lg shadow-emerald-500/20">
            BẮT ĐẦU NGAY
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
