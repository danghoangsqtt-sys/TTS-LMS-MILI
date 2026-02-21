import { useState, useEffect, useRef } from 'react'
import { BookOpenCheck, Plus, Trash2, Search, AlertCircle, CheckCircle2, Loader2, Volume2 } from 'lucide-react'

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
    window.api.getModels().then((m) => {
      setModels(m)
      if (m.length > 0) setPreviewVoice(m[0])
    })
  }, [])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t) } }, [toast])

  const loadDictionary = async () => {
    setLoading(true)
    try {
      const dict = await window.api.getDictionary()
      setEntries(Object.entries(dict || {}).map(([short, full]) => ({ short, full })))
    } catch (err) { showToast('Không thể tải từ điển.', 'error') }
    finally { setLoading(false) }
  }

  const persistDictionary = async (updatedEntries) => {
    setSaving(true)
    try {
      const dict = {}
      updatedEntries.forEach((e) => { if (e.short) dict[e.short] = e.full })
      await window.api.saveDictionary(dict)
      showToast('Đã lưu!', 'success')
    } catch (err) { showToast('Lỗi khi lưu.', 'error') }
    finally { setSaving(false) }
  }

  const showToast = (message, type) => setToast({ message, type })

  const handleAdd = () => {
    const s = shortInput.trim(), f = fullInput.trim()
    if (!s || !f) return
    if (entries.some((e) => e.short.toLowerCase() === s.toLowerCase())) { showToast(`"${s}" đã tồn tại.`, 'error'); return }
    const updated = [{ short: s, full: f }, ...entries]
    setEntries(updated); setShortInput(''); setFullInput('')
    persistDictionary(updated)
  }

  const handleDelete = (short) => {
    const updated = entries.filter((e) => e.short !== short)
    setEntries(updated); persistDictionary(updated)
  }

  const handlePreview = async (text, key) => {
    if (!previewVoice || !text) return
    if (previewAudioRef.current) { previewAudioRef.current.pause(); previewAudioRef.current = null }
    setPreviewingKey(key)
    try {
      const base64 = await window.api.previewWord({ text, modelName: previewVoice })
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
    ? entries.filter((e) => e.short.toLowerCase().includes(searchTerm.toLowerCase()) || e.full.toLowerCase().includes(searchTerm.toLowerCase()))
    : entries

  return (
    <div className="space-y-3">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-xs font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}{toast.message}
        </div>
      )}

      {/* Add Row + Voice Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
        <div className="flex items-end gap-2">
          <div className="w-40">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Viết tắt</label>
            <input type="text" value={shortInput} onChange={(e) => setShortInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="BQP" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-800 focus:border-[#14452F] outline-none placeholder-gray-300"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Nghĩa đầy đủ</label>
            <input type="text" value={fullInput} onChange={(e) => setFullInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Bộ Quốc phòng" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:border-[#14452F] outline-none placeholder-gray-300"
            />
          </div>
          <div className="w-48">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Volume2 className="h-3 w-3" /> Giọng đọc thử
            </label>
            <select value={previewVoice} onChange={(e) => setPreviewVoice(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:border-[#14452F] outline-none font-medium">
              {models.map((m) => <option key={m} value={m}>{m.replace('.onnx', '').replace(/-/g, ' ')}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} disabled={!shortInput.trim() || !fullInput.trim()}
            className="px-4 py-1.5 bg-[#14452F] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-emerald-800 disabled:opacity-40 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" /> Thêm
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm..."
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:border-emerald-500 outline-none"
            />
            <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-2" />
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{filteredEntries.length}/{entries.length} mục</span>
          {saving && <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Lưu...</span>}
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400"><Loader2 className="h-5 w-5 animate-spin mr-2" />Đang tải...</div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold text-[10px] uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">#</th>
                  <th className="px-3 py-2 w-36">Viết tắt</th>
                  <th className="px-3 py-2">Nghĩa đầy đủ</th>
                  <th className="px-3 py-2 w-24 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEntries.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400 text-xs">
                    <BookOpenCheck className="h-6 w-6 opacity-20 mx-auto mb-1" />
                    {searchTerm ? 'Không tìm thấy.' : 'Từ điển trống.'}
                  </td></tr>
                ) : (
                  filteredEntries.map((entry, i) => (
                    <tr key={entry.short} className="group hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 py-2 text-center text-[10px] text-gray-300 font-mono">{i + 1}</td>
                      <td className="px-3 py-2">
                        <span className="bg-amber-50 text-amber-800 font-bold text-[11px] px-2 py-0.5 rounded border border-amber-200 font-mono">{entry.short}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-700 font-medium text-xs">{entry.full}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handlePreview(entry.full, entry.short)}
                            disabled={previewingKey === entry.short || !previewVoice}
                            className="p-1 text-gray-400 hover:text-[#14452F] hover:bg-emerald-50 rounded transition opacity-40 group-hover:opacity-100 disabled:opacity-20"
                            title="Nghe thử"
                          >
                            {previewingKey === entry.short
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#14452F]" />
                              : <Volume2 className="h-3.5 w-3.5" />
                            }
                          </button>
                          <button onClick={() => handleDelete(entry.short)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition opacity-40 group-hover:opacity-100"
                          ><Trash2 className="h-3.5 w-3.5" /></button>
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
