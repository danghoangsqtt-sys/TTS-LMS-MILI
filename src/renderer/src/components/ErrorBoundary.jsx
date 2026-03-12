import React from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Crash Captured:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#000000] flex items-center justify-center p-8 z-[99999]">
          <div className="max-w-md w-full border border-red-500/30 bg-[#050505] p-8 shadow-2xl relative overflow-hidden">
             {/* Red Scanline for Error */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 animate-scanline" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/50 flex items-center justify-center mb-6">
                <AlertTriangle className="text-red-500 h-8 w-8" />
              </div>
              
              <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2">System_Critical_Failure</h2>
              <div className="h-0.5 w-12 bg-red-500 mb-6" />
              
              <p className="text-[11px] text-white/40 uppercase tracking-widest leading-relaxed mb-6 font-bold">
                Mất kết nối giao thức hiển thị. Trạm chỉ huy đã bị phong tỏa để bảo vệ dữ liệu.
              </p>

              <div className="bg-black/50 border border-white/5 p-4 w-full mb-8 text-left font-mono">
                <p className="text-[10px] text-red-500/70 uppercase mb-1">Error_Log:</p>
                <p className="text-[10px] text-white/60 break-all leading-tight">
                   {this.state.error?.message || 'Unknown Execution Error'}
                </p>
              </div>

              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-black font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <RefreshCcw size={14} />
                Khởi động lại hệ thống
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
