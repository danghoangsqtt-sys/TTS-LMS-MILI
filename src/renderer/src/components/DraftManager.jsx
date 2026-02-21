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
    <div className="space-y-4 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Xác nhận xóa kịch bản
              </h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600">
                Bạn có chắc muốn xóa kịch bản{' '}
                <strong className="text-gray-800">
                  {drafts.find((d) => d.id === deleteConfirm)?.title || ''}
                </strong>
                ? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="px-5 py-3 flex gap-2 border-t border-gray-100">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#14452F] flex items-center justify-center text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Quản Lý Kịch Bản
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Lưu trữ và quản lý các bản nháp kịch bản phát thanh
              </p>
            </div>
          </div>
          <button
            onClick={loadDrafts}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-[#14452F] hover:bg-emerald-50 rounded-lg transition"
            title="Làm mới"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <FileText className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{drafts.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              Kịch bản đã lưu
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {drafts.length > 0 ? formatDate(drafts[0]?.date) : '—'}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              Cập nhật gần nhất
            </p>
          </div>
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            📝 Danh sách kịch bản
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            {drafts.length} mục
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin opacity-30 mb-3" />
            <p className="text-xs">Đang tải...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="h-10 w-10 opacity-15 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Chưa có kịch bản nào
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Nhấn &quot;💾 Lưu nháp&quot; trong Console Phát Thanh để tạo kịch
              bản đầu tiên
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="px-4 py-3.5 hover:bg-gray-50/60 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="h-9 w-9 rounded-lg bg-[#14452F]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-[#14452F]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800 truncate">
                        {draft.title || 'Không có tiêu đề'}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {draft.text
                        ? draft.text.length > 80
                          ? draft.text.substring(0, 80) + '...'
                          : draft.text
                        : 'Nội dung trống'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(draft.date)}
                      </span>
                      {draft.voiceModel && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Mic className="h-2.5 w-2.5" />
                          {draft.voiceModel.replace('.onnx', '')}
                        </span>
                      )}
                      {draft.speed && draft.speed !== 1.0 && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                          {draft.speed}x
                        </span>
                      )}
                      {draft.bgm && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                          <Music className="h-2.5 w-2.5" />
                          BGM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenDraft(draft)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#14452F] bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1"
                      title="Mở kịch bản này trong Console Phát Thanh"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Mở
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(draft.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                      title="Xóa kịch bản"
                    >
                      <Trash2 className="h-4 w-4" />
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
