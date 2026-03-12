import { useState, useEffect, useRef } from 'react'
import { 
    BookOpenCheck, 
    Plus, 
    Trash2, 
    Search, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    Volume2
} from 'lucide-react'

export default function LexiconManager() {
  const [entries, setEntries] = useState([])
  const [shortInput, setShortInput] = useState('')
  const [fullInput, setFullInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Preview voice
  const [models, setModels] = useState([])
  const [previewVoice, setPreviewVoice] = useState('')
  const [previewingKey, setPreviewingKey] = useState(null)
  const previewAudioRef = useRef(null)

  useEffect(() => { loadDictionary() }, [])
  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-models').then((m) => {
      setModels(m || [])
      if (m?.length > 0) setPreviewVoice(m[0])
    })
  }, [])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t) } }, [toast])

  const loadDictionary = async () => {
    setLoading(true)
    try {
      const dict = await window.electron.ipcRenderer.invoke('get-dictionary')
      setEntries(Object.entries(dict || {}).map(([short, full]) => ({ short, full })))
    } catch (err) { showToast('Không thể tải từ điển.', 'error') }
    finally { setLoading(false) }
  }

  const persistDictionary = async (updatedEntries) => {
    setSaving(true)
    try {
      const dict = {}
      updatedEntries?.forEach((e) => { if (e.short) dict[e.short] = e.full })
      await window.electron.ipcRenderer.invoke('save-dictionary', dict)
      showToast('Đã lưu!', 'success')
    } catch (err) { showToast('Lỗi khi lưu.', 'error') }
    finally { setSaving(false) }
  }

  const showToast = (message, type) => setToast({ message, type })

  const handleAdd = () => {
    const s = shortInput.trim(), f = fullInput.trim()
    if (!s || !f) return
    if (entries?.some((e) => e.short.toLowerCase() === s.toLowerCase())) { showToast(`"${s}" đã tồn tại.`, 'error'); return }
    const updated = [{ short: s, full: f }, ...(entries || [])]
    setEntries(updated); setShortInput(''); setFullInput('')
    persistDictionary(updated)
  }

  const handleDelete = (short) => {
    const updated = entries?.filter((e) => e.short !== short) || []
    setEntries(updated); persistDictionary(updated)
  }

  const handlePreview = async (text, key) => {
    if (!previewVoice || !text) return
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null }
    setPreviewingKey(key)
    try {
      const base64 = await window.electron.ipcRenderer.invoke('preview-word', { text, modelName: previewVoice })
      const audio = new Audio(base64)
      previewAudioRef.current = audio
      audio.onended = () => setPreviewingKey(null)
      audio.play().catch(() => setPreviewingKey(null))
    } catch {
      showToast('Lỗi phát âm thanh.', 'error')
      setPreviewingKey(null)
    }
  }

  const filteredEntries = searchTerm
    ? entries?.filter((e) => e.short.toLowerCase().includes(searchTerm.toLowerCase()) || e.full.toLowerCase().includes(searchTerm.toLowerCase())) || []
    : (entries || [])

  return (
    <div className="space-y-6 animate-in fade-in duration-500 bg-[#f8fafc] p-8 rounded-3xl min-h-screen">
      {/* Header section with Stats */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">Từ Điển Quân Sự</h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">Hệ thống chuẩn hóa phát âm SQTT.AI</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tổng số mục</span>
              <span className="text-lg font-black text-emerald-600">{entries?.length || 0}</span>
           </div>
           <div className="h-8 w-[1px] bg-gray-200" />
           {saving && (
              <div className="flex items-center gap-2 text-emerald-500 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Đang đồng bộ...</span>
              </div>
           )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border text-xs font-bold transition-all animate-in slide-in-from-top duration-300 ${
          toast.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-red-600 border-red-100'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Input Section - Refined Card Style */}
      <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-3 space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Ký hiệu / Viết tắt</label>
            <input 
              type="text" 
              value={shortInput} 
              onChange={(e) => setShortInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="VD: BQP" 
              className="w-full bg-[#f1f5f9] border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold text-[#1e293b] outline-none placeholder:text-gray-300 transition-all uppercase tracking-widest"
            />
          </div>
          <div className="md:col-span-5 space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Định nghĩa phát âm đầy đủ</label>
            <input 
              type="text" 
              value={fullInput} 
              onChange={(e) => setFullInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="VD: BỘ QUỐC PHÒNG" 
              className="w-full bg-[#f1f5f9] border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3.5 text-sm font-bold text-[#1e293b] outline-none placeholder:text-gray-300 transition-all uppercase tracking-widest"
            />
          </div>
          <div className="md:col-span-3 space-y-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
               Giọng đọc thử
            </label>
            <div className="relative">
              <select 
                value={previewVoice} 
                onChange={(e) => setPreviewVoice(e.target.value)}
                className="w-full bg-[#f1f5f9] border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3.5 text-xs font-bold text-gray-600 outline-none appearance-none cursor-pointer tracking-widest"
              >
                {models?.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('.onnx', '').replace(/-/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Volume2 size={16} />
              </div>
            </div>
          </div>
          <div className="md:col-span-1">
            <button 
              onClick={handleAdd} 
              disabled={!shortInput.trim() || !fullInput.trim()}
              className="w-full h-[54px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-emerald-200 active:scale-95"
            >
              <Plus className="h-6 w-6 stroke-[3px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Table Card */}
      <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm flex flex-col overflow-hidden max-h-[600px]">
        {/* Table Search & Control Header */}
        <div className="px-8 py-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-[20]">
          <div className="relative w-full max-w-sm">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Tìm kiếm từ viết tắt hoặc định nghĩa..."
              className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border-none rounded-2xl text-xs font-bold text-[#1e293b] focus:ring-2 focus:ring-emerald-500/20 outline-none placeholder:text-gray-400"
            />
            <Search className="h-4 w-4 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          
          <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Đang hiển thị {filteredEntries?.length || 0} mục
              </span>
          </div>
        </div>

        {/* Excel-style Table Body */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-300 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Đang tải cơ sở dữ liệu...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f8fafc] text-gray-400 font-bold text-[10px] uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-8 py-4 w-20 border-b border-gray-100">ID</th>
                  <th className="px-8 py-4 w-64 border-b border-gray-100">Mã Viết Tắt</th>
                  <th className="px-8 py-4 border-b border-gray-100">Phát Âm Đầy Đủ</th>
                  <th className="px-8 py-4 w-32 border-b border-gray-100 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(filteredEntries?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-32 text-center text-gray-300">
                      <div className="flex flex-col items-center gap-4">
                        <BookOpenCheck className="h-20 w-20 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Không tìm thấy dữ liệu phù hợp</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, i) => (
                    <tr key={entry.short} className="group hover:bg-emerald-50/30 transition-all border-l-4 border-transparent hover:border-emerald-500">
                      <td className="px-8 py-5 text-[11px] text-gray-400 font-mono">
                        {(i + 1).toString().padStart(3, '0')}
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-block bg-emerald-50 text-emerald-700 font-black text-xs px-4 py-1.5 rounded-full border border-emerald-100 tracking-wider">
                          {entry.short}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-[#1e293b]">
                        {entry.full}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handlePreview(entry.full, entry.short)}
                            disabled={previewingKey === entry.short || !previewVoice}
                            className={`p-2 rounded-xl transition-all ${
                                previewingKey === entry.short 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : 'bg-gray-50 text-gray-400 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-200'
                            }`}
                          >
                            {previewingKey === entry.short
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Volume2 className="h-4 w-4" />
                            }
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.short)}
                            className="p-2 bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 hover:shadow-lg hover:shadow-red-100 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
