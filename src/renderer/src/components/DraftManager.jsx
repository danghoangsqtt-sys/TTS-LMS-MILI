import { useState, useEffect } from 'react'
import {
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Mic,
  Clock,
  Music
} from 'lucide-react'

export default function DraftManager({ onOpenDraft }) {
  const [drafts, setDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadDrafts()
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  const loadDrafts = async () => {
    setIsLoading(true)
    try {
      const list = await window.api.getDrafts()
      setDrafts(list)
    } catch {
      setDrafts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await window.api.deleteDraft(id)
      setToast({ type: 'success', message: 'Đã xóa kịch bản.' })
      setDeleteConfirm(null)
      await loadDrafts()
    } catch (err) {
      setToast({ type: 'error', message: `Lỗi: ${err.message}` })
    }
  }

  const formatDate = (iso) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-3 py-1.5 rounded shadow-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            toast.type === 'success'
              ? 'bg-[#10b981] text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded border border-slate-200 shadow-2xl w-full max-w-xs overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="text-[10px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-[0.2em]">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Hệ Thống Cảnh Báo
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
                Xác nhận xóa kịch bản: <br/>
                <span className="text-slate-800 tracking-normal lowercase italic mt-1 block">
                  &quot;{drafts.find((d) => d.id === deleteConfirm)?.title || ''}&quot;
                </span>
              </p>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all font-bold"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="py-1.5 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded border border-red-200 transition-all font-bold flex items-center justify-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-slate-50 flex items-center justify-center border border-slate-100">
              <FileText className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Quản Lý Kịch Bản
              </h2>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                DATABASE OF SAVED BROADCAST SCRIPTS
              </p>
            </div>
          </div>
          <button
            onClick={loadDrafts}
            disabled={isLoading}
            className="p-1.5 text-slate-300 hover:text-[#10b981] hover:bg-slate-50 rounded transition-all"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100">
            <FileText className="h-4 w-4 text-[#10b981]" />
          </div>
          <div>
            <p className="text-lg font-black text-slate-800 leading-none">{drafts.length}</p>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-1">
              Active Drafts
            </p>
          </div>
        </div>
        <div className="bg-white rounded border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100">
            <Clock className="h-4 w-4 text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-800 leading-none truncate max-w-[120px]">
              {drafts.length > 0 ? formatDate(drafts[0]?.date).split(',')[0] : '—'}
            </p>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-1">
              Last Registry
            </p>
          </div>
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            SCRIPTS LIBRARY
          </span>
          <span className="text-[9px] text-slate-300 font-mono italic">
            {drafts.length} entries
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin mb-3" />
            <p className="text-[9px] font-black uppercase tracking-widest">Accessing records...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <FileText className="h-10 w-10 opacity-10 mb-3" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">
              Library is Empty
            </p>
            <p className="text-[9px] text-slate-400 mt-1 uppercase font-black">
              SAVE DRAFTS IN THE CONTROL CONSOLE
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="px-4 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="h-9 w-9 rounded bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-[#10b981]/50" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[12px] font-bold text-slate-700 truncate tracking-tight uppercase">
                        {draft.title || 'Untitled Script'}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate font-medium">
                      {draft.text
                        ? draft.text.length > 80
                          ? draft.text.substring(0, 80) + '...'
                          : draft.text
                        : 'No content recorded'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDate(draft.date)}
                      </span>
                      {draft.voiceModel && (
                        <span className="text-[8px] text-[#10b981] bg-emerald-50 px-1 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 border border-emerald-100">
                          <Mic className="h-2 w-2" />
                          {draft.voiceModel.replace('.onnx', '')}
                        </span>
                      )}
                      {draft.speed && draft.speed !== 1.0 && (
                        <span className="text-[8px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded font-black uppercase tracking-widest border border-blue-100">
                          {draft.speed}x
                        </span>
                      )}
                      {draft.bgm && (
                        <span className="text-[8px] text-amber-500 bg-amber-50 px-1 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 border border-amber-100">
                          <Music className="h-2 w-2" />
                          BGM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => onOpenDraft(draft)}
                      className="px-3 py-1.5 text-[9px] font-black text-white bg-[#10b981] rounded uppercase tracking-widest hover:bg-[#059669] shadow-sm transition-all flex items-center gap-1"
                      title="Load this script"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Mở
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(draft.id)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                      title="Delete script"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
