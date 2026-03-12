import { useState, useEffect, useRef } from 'react'
import { 
    BookOpenCheck, 
    Plus, 
    Trash2, 
    Search, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    Volume2,
    Terminal
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-2 border shadow-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
          toast.type === 'success' ? 'bg-[#10b981] text-black border-[#10b981]' : 'bg-red-600 text-white border-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          {toast.message}
        </div>
      )}

      {/* Add Row + Voice Selector */}
      <div className="bg-[#050505] border border-white/5 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#10b981] animate-scanline" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end relative z-10">
          <div className="md:col-span-3">
            <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 px-1">KÝ_HIỆU_MÃ</label>
            <input 
              type="text" 
              value={shortInput} 
              onChange={(e) => setShortInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="VD: BQP" 
              className="w-full bg-black border border-white/10 rounded-none px-4 py-2.5 text-[12px] font-bold text-white focus:border-[#10b981]/50 outline-none placeholder:text-white/10 uppercase tracking-widest transition-all"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 px-1">ĐỊNH_NGHĨA_PHÁT_ÂM</label>
            <input 
              type="text" 
              value={fullInput} 
              onChange={(e) => setFullInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="VD: BỘ QUỐC PHÒNG" 
              className="w-full bg-black border border-white/10 rounded-none px-4 py-2.5 text-[12px] font-bold text-white focus:border-[#10b981]/50 outline-none placeholder:text-white/10 uppercase tracking-widest transition-all"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
              <Volume2 className="h-3 w-3 text-[#10b981]" /> MODULE_DIỄN_ĐỌC
            </label>
            <select 
              value={previewVoice} 
              onChange={(e) => setPreviewVoice(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-none px-3 py-2.5 text-[11px] text-white/60 focus:border-[#10b981]/50 outline-none font-bold uppercase tracking-widest appearance-none cursor-pointer"
            >
              {models?.map((m) => (
                <option key={m} value={m} className="bg-[#050505]">
                  {m.replace('.onnx', '').replace(/-/g, ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <button 
              onClick={handleAdd} 
              disabled={!shortInput.trim() || !fullInput.trim()}
              className="w-full h-[42px] bg-[#10b981] hover:bg-[#059669] text-black rounded-none flex items-center justify-center transition-all disabled:opacity-20 active:scale-95 shadow-lg shadow-emerald-500/10"
              title="Add to Core Database"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Database View */}
      <div className="bg-[#050505] border border-white/5 flex flex-col overflow-hidden max-h-[550px] shadow-2xl">
        {/* Search & Tool Bar */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-4 bg-black/40">
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="SEARCHING CORE_DICTIONARY..."
              className="w-full pl-10 pr-4 py-2 bg-black/50 border border-white/5 rounded-none text-[10px] text-white focus:border-[#10b981]/30 outline-none uppercase tracking-[0.2em] placeholder:text-white/10"
            />
            <Search className="h-3.5 w-3.5 text-white/20 absolute left-4 top-2.5" />
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-6">
            <span className="text-[9px] text-white/20 font-black tracking-[0.2em] uppercase">
                {filteredEntries?.length || 0} / {entries?.length || 0} SECTOR_DATA
            </span>
            {saving && (
              <span className="text-[9px] text-[#10b981] font-black flex items-center gap-2 uppercase tracking-[0.2em] animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                SYNC_CORE...
              </span>
            )}
            <div className="h-4 w-[1px] bg-white/5" />
            <Terminal size={14} className="text-[#10b981]/40" />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/10 gap-4">
              <Loader2 className="h-10 w-10 animate-spin opacity-20" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Retrieving_Data...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02] text-white/20 font-black text-[8px] uppercase tracking-[0.3em] border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">HEX_ID</th>
                  <th className="px-6 py-4 w-48">MÃ_VĂN_BẢN</th>
                  <th className="px-6 py-4">ĐỊNH_DẠNG_PHÁT_ÂM</th>
                  <th className="px-6 py-3 w-32 text-center">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(filteredEntries?.length || 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center text-white/5 uppercase font-black tracking-[0.4em] text-[11px]">
                      <BookOpenCheck className="h-16 w-16 opacity-10 mx-auto mb-6" />
                      {searchTerm ? 'No Data Matching Protocol' : 'Core Dictionary Database Offline'}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, i) => (
                    <tr key={entry.short} className="group hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-4 text-center text-[10px] text-white/10 font-mono tracking-tighter">
                        {String(i + 1).padStart(3, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-[#10b981]/10 text-[#10b981] font-black text-[11px] px-3 py-1 border border-[#10b981]/20 font-mono tracking-widest uppercase">
                          {entry.short}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white/60 font-black text-[11px] uppercase tracking-tight">
                        {entry.full}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePreview(entry.full, entry.short)}
                            disabled={previewingKey === entry.short || !previewVoice}
                            className="p-2 text-white/40 hover:text-[#10b981] hover:bg-white/5 transition-all disabled:opacity-10"
                            title="Preview Synthesis"
                          >
                            {previewingKey === entry.short
                              ? <Loader2 className="h-4 w-4 animate-spin text-[#10b981]" />
                              : <Volume2 className="h-4 w-4" />
                            }
                          </button>
                          <button 
                            onClick={() => handleDelete(entry.short)}
                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                            title="Purge Entry"
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
