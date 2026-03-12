import { useState, useRef, useMemo, useEffect } from 'react'
import { 
  Play, 
  Square, 
  Trash2, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database,
  Trash,
  ChevronRight
} from 'lucide-react'
import PropTypes from 'prop-types'

export default function HistoryLog({ history = [], onDeleteEntry, onClearHistory, onRebroadcast }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [playingId, setPlayingId] = useState(null)
  const [toast, setToast] = useState(null)
  const audioRef = useRef(null)

  // Filter logic
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return [...history]
    const lower = searchTerm.toLowerCase()
    return history.filter((l) => 
      l.rawText?.toLowerCase().includes(lower) || 
      l.configSummary?.toLowerCase().includes(lower)
    )
  }, [history, searchTerm])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const handlePlay = (log) => {
    if (!log.audioBlob) return
    
    if (playingId === log.id) {
      if (audioRef.current) audioRef.current.pause()
      setPlayingId(null)
      return
    }

    if (audioRef.current) audioRef.current.pause()
    
    try {
      const audio = new Audio(log.audioBlob)
      audioRef.current = audio
      audio.onended = () => setPlayingId(null)
      audio.play()
      setPlayingId(log.id)
    } catch (e) {
      console.error('Audio play error', e)
      showToast('Lỗi phát âm thanh', 'error')
    }
  }

  const handleDownload = (log) => {
    if (!log.audioBlob) return
    const link = document.createElement('a')
    link.href = log.audioBlob
    link.download = `LichSu_XuLy_${new Date(log.timestamp).getTime()}.wav`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Bắt đầu tải xuống...')
  }

  const handleDelete = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi nhật ký này?')) {
      onDeleteEntry(id)
      showToast('Đã xóa bản ghi')
    }
  }

  const handleClearAll = () => {
    if (confirm('CẢNH BÁO: Hành động này sẽ xóa toàn bộ lịch sử xử lý. Bạn có chắc chắn?')) {
      onClearHistory()
      showToast('Đã dọn dẹp toàn bộ nhật ký')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* 1. STICKY HEADER & TOOLS */}
      <div className="sticky top-0 z-30 bg-white p-8 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Nhật ký Hệ thống</h2>
            <p className="text-xs text-slate-400 font-medium">Lưu trữ lịch sử các phiên tổng hợp giọng nói và xử lý AI</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Lọc nội dung kịch bản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 bg-slate-100 border-none rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={handleClearAll}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-5 py-3 border-2 border-red-50 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all disabled:opacity-20"
          >
            <Trash size={14} />
            Xóa toàn bộ lịch sử
          </button>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
            <Clock size={80} className="text-slate-200 mb-4" />
            <h4 className="text-lg font-bold text-slate-400">Chưa có dữ liệu xử lý nào được ghi nhận</h4>
            <p className="text-sm">Mọi hoạt động tổng hợp giọng nói của bạn sẽ xuất hiện tại đây</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex items-center gap-6 group"
            >
              {/* Column 1: Session Info (20%) */}
              <div className="w-[20%] border-r border-slate-100 pr-6 space-y-3">
                {log.audioBlob ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                    <CheckCircle2 size={12} /> Hoàn tất
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-100">
                    <XCircle size={12} /> Lỗi
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">
                    {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Column 2: Details & Content (60%) */}
              <div className="w-[60%] px-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold border border-emerald-100">
                    {log.configSummary || 'Giọng đọc chuẩn'}
                  </span>
                  {log.speed && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">
                      Tốc độ: {log.speed}x
                    </span>
                  )}
                  {log.pitch && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-100">
                      Cao độ: {log.pitch}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">
                  {log.rawText || '(Không có nội dung dữ liệu)'}
                </p>
              </div>

              {/* Column 3: Actions (20%) */}
              <div className="w-[20%] flex items-center justify-end gap-3 pl-6 border-l border-slate-100">
                {log.audioBlob && (
                  <button 
                    onClick={() => handlePlay(log)}
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95 ${
                      playingId === log.id 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'
                    }`}
                    title={playingId === log.id ? "Dừng" : "Nghe lại"}
                  >
                    {playingId === log.id ? <Square size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
                  </button>
                )}
                
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => handleDownload(log)}
                    disabled={!log.audioBlob}
                    className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-10"
                    title="Tải xuống"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Xóa"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {onRebroadcast && (
                  <button 
                    onClick={() => onRebroadcast(log.rawText)}
                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200"
                    title="Chuyển sang soạn thảo"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom duration-300 ${
          toast.type === 'error' ? 'bg-red-600 text-white border-red-700' : 'bg-slate-900 text-white border-slate-800'
        }`}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* Scoped Scrollbar Styling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  )
}

HistoryLog.propTypes = {
  history: PropTypes.array,
  onDeleteEntry: PropTypes.func.isRequired,
  onClearHistory: PropTypes.func.isRequired,
  onRebroadcast: PropTypes.func
}
