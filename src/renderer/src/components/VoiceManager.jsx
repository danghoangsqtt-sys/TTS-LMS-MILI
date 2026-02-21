import { useState, useEffect } from 'react'
import {
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  HardDrive,
  FileAudio,
  ShieldCheck,
  RefreshCw,
  FileCheck
} from 'lucide-react'

export default function VoiceManager() {
  const [voices, setVoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    loadVoices()
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const loadVoices = async () => {
    setIsLoading(true)
    try {
      const list = await window.api.getLocalVoices()
      setVoices(list)
    } catch {
      setVoices([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const result = await window.api.importLocalVoice()
      if (result.success && result.imported?.length > 0) {
        setToast({
          type: 'success',
          message: `Đã nhập thành công ${result.imported.length} giọng đọc!`
        })
        await loadVoices()
      } else if (result.reason === 'canceled') {
        // User cancelled, do nothing
      } else if (result.errors?.length > 0) {
        setToast({ type: 'error', message: `Lỗi: ${result.errors.join(', ')}` })
      }
    } catch (err) {
      setToast({ type: 'error', message: `Lỗi nhập giọng đọc: ${err.message}` })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = async (filename) => {
    try {
      await window.api.deleteLocalVoice(filename)
      setToast({ type: 'success', message: `Đã xóa "${filename.replace('.onnx', '')}"` })
      setDeleteConfirm(null)
      await loadVoices()
    } catch (err) {
      setToast({ type: 'error', message: `Không thể xóa: ${err.message}` })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium transition-all ${
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
                Xác nhận xóa
              </h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600">
                Bạn có chắc muốn xóa giọng đọc{' '}
                <strong className="text-gray-800">
                  {deleteConfirm.replace('.onnx', '')}
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

      {/* Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#14452F] flex items-center justify-center text-white">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Quản Lý Giọng Đọc
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Nhập và quản lý mô hình giọng đọc offline từ USB hoặc máy tính
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadVoices}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-[#14452F] hover:bg-emerald-50 rounded-lg transition"
              title="Làm mới"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-4 py-2 bg-[#14452F] text-white text-xs font-bold rounded-lg hover:bg-emerald-800 disabled:opacity-50 transition flex items-center gap-2 shadow-sm"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isImporting
                ? 'Đang nhập...'
                : '📥 Nhập giọng đọc từ USB/Máy tính'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <FileAudio className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{voices.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              Giọng đọc
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {voices.filter((v) => v.hasConfig).length}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              Có cấu hình
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {voices.reduce((sum, v) => sum + parseFloat(v.sizeMB), 0).toFixed(0)} MB
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
              Tổng dung lượng
            </p>
          </div>
        </div>
      </div>

      {/* Voice Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <FileAudio className="h-3.5 w-3.5 text-[#14452F]" />
            Danh sách giọng đọc đã cài đặt
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            {voices.length} mục
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin opacity-30 mb-3" />
            <p className="text-xs">Đang tải danh sách...</p>
          </div>
        ) : voices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <HardDrive className="h-10 w-10 opacity-15 mb-3" />
            <p className="text-sm font-medium text-gray-500">
              Chưa có giọng đọc nào
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Nhấn &quot;Nhập giọng đọc từ USB/Máy tính&quot; để bắt đầu
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">
                  #
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">
                  Tên giọng đọc
                </th>
                <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">
                  File
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">
                  Dung lượng
                </th>
                <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">
                  Cấu hình
                </th>
                <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {voices.map((voice, idx) => (
                <tr
                  key={voice.filename}
                  className="hover:bg-gray-50/60 transition-colors group"
                >
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#14452F]/10 flex items-center justify-center flex-shrink-0">
                        <FileAudio className="h-3.5 w-3.5 text-[#14452F]" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {voice.baseName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-mono">
                      {voice.filename}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-medium text-gray-600">
                      {voice.sizeMB} MB
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {voice.hasConfig ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        JSON
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-semibold rounded-full">
                        Không có
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteConfirm(voice.filename)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition opacity-40 group-hover:opacity-100"
                      title="Xóa giọng đọc này"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600/50" />
        <span className="text-[10px] text-gray-400">
          Tất cả giọng đọc được lưu trữ cục bộ tại thư mục{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-500">
            extraResources/models/
          </code>{' '}
          — Không yêu cầu kết nối mạng.
        </span>
      </div>
    </div>
  )
}
