import { Shield, Cpu, Globe, Zap, Heart } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Hero Section */}
      <div className="bg-white rounded border border-slate-200 p-8 text-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Zap className="h-3 w-3 text-[#10b981]" />
            Neural DHS-Sigma Core v2.0
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight uppercase text-slate-800">
              MB-TTS <span className="text-[#10b981]">SYSTEM</span>
            </h1>
            <p className="text-slate-400 font-black text-[9px] uppercase tracking-[0.3em]">
          Thông tin hệ thống: Trạng thái Động cơ [Hoạt động] | Phiên bản Operational (Sigma)
        </p>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-500 font-medium">
            MB-TTS được thiết kế cho các kịch bản phát thanh chuyên nghiệp, tích hợp hệ thống Mạng nơ-ron
            tối ưu riêng cho ngữ âm Tiếng Việt. Hệ thống vận hành hoàn toàn Offline, đảm bảo an toàn 
            không gian mạng và bảo mật dữ liệu tuyệt đối. Tích hợp Lõi Tham mưu (Sigma) cho hiệu năng 
            vượt trội trên mọi cấu hình phần cứng.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 border border-slate-100">
              <Shield className="h-3.5 w-3.5 text-[#10b981]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Air-Gapped Secure</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-50 border border-slate-100">
              <Globe className="h-3.5 w-3.5 text-[#10b981]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Native Vietnamese</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded border border-slate-200 p-6 hover:border-[#10b981]/30 transition-all shadow-sm group">
          <div className="h-10 w-10 rounded bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 group-hover:bg-[#10b981]/10 transition-colors">
            <Cpu className="h-5 w-5 text-slate-400 group-hover:text-[#10b981] transition-colors" />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Neural Optimization</h3>
          <p className="text-slate-500 leading-relaxed text-[11px] font-medium uppercase tracking-wide">
            Cấu trúc Tiny-モデル mang lại tốc độ tổng hợp âm thanh thời gian thực (Real-time Factor {'>'} 8.0) 
            ngay cả trên các dòng CPU phổ thông không có GPU rời.
          </p>
        </div>

        <div className="bg-white rounded border border-slate-200 p-6 hover:border-[#10b981]/30 transition-all shadow-sm group">
          <div className="h-10 w-10 rounded bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 group-hover:bg-[#10b981]/10 transition-colors">
            <Heart className="h-5 w-5 text-slate-400 group-hover:text-[#10b981] transition-colors" />
          </div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Development Lead</h3>
          <p className="text-slate-500 leading-relaxed text-[11px] font-medium uppercase tracking-wide">
            Sản phẩm được nghiên cứu bởi <span className="text-slate-800 font-bold">Lê Bá Đăng Hoàng</span>. 
            Phân phối bởi DHSYSTEM nhằm mục đích nâng cao năng lực chuyển đổi số trong lĩnh vực tuyên truyền.
          </p>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-center pt-8 opacity-40">
        <p className="text-[9px] text-slate-400 uppercase tracking-[0.4em] font-black">
          MB-TTS Enterprise Edition • build_2026.03.11_rel
        </p>
      </div>
    </div>
  )
}
