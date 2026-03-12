import { useState, useEffect } from 'react'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Tag,
  Newspaper,
  Megaphone,
  Music,
  GraduationCap,
  X,
  Check,
  ArrowRightFromLine
} from 'lucide-react'

const CATEGORIES = [
  { id: 'POLITICS', label: 'Chính trị - Tư tưởng', icon: GraduationCap, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'NEWS', label: 'Tin tức - Sự kiện', icon: Newspaper, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'ORDERS', label: 'Mệnh lệnh - Chỉ đạo', icon: Megaphone, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'STORY', label: 'Văn nghệ - Kể chuyện', icon: Music, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'OTHER', label: 'Khác', icon: Tag, color: 'text-gray-400', bg: 'bg-white/5' }
]

// ─── IndexedDB helpers for local script storage ───────────────────────────────
const DB_NAME = 'SQTT_SCRIPTS_DB'
const DB_VERSION = 1
const STORE_NAME = 'scripts'

function getDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

async function getAllScripts() {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.lastModified - a.lastModified))
    request.onerror = () => reject(request.error)
  })
}

async function putScript(script) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(script)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function removeScript(id) {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LectureLibrary({ onUseScript }) {
  const [scripts, setScripts] = useState([])
  const [activeCategory, setActiveCategory] = useState('POLITICS')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState({
    title: '',
    content: '',
    category: 'POLITICS'
  })

  const loadScripts = async () => {
    try {
      const data = await getAllScripts()
      setScripts(data)
    } catch (e) {
      console.error('Failed to load scripts', e)
    }
  }

  useEffect(() => {
    loadScripts()
  }, [])

  const filteredScripts = scripts.filter((s) => s.category === activeCategory)

  const handleOpenModal = (script) => {
    if (script) {
      setEditingScript({ ...script })
    } else {
      setEditingScript({ title: '', content: '', category: activeCategory })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingScript.title || !editingScript.content) {
      alert('Vui lòng nhập tiêu đề và nội dung.')
      return
    }
    const toSave = {
      id: editingScript.id || `script_${Date.now()}`,
      lastModified: Date.now(),
      title: editingScript.title,
      content: editingScript.content,
      category: editingScript.category,
      tags: editingScript.tags || []
    }
    await putScript(toSave)
    setIsModalOpen(false)
    loadScripts()
  }

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc muốn xóa bài giảng này?')) {
      await removeScript(id)
      loadScripts()
    }
  }

  return (
    <div className="flex h-full gap-4 animate-in fade-in duration-300">
      {/* SIDEBAR CATEGORIES */}
      <div className="w-60 bg-white rounded border border-slate-200 flex flex-col overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-slate-400 font-black flex items-center gap-2 uppercase tracking-[0.2em] text-[10px]">
            <BookOpen className="h-3 w-3" /> Danh mục kịch bản
          </h3>
        </div>
        <div className="p-2 space-y-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[11px] font-black uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#10b981] text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <div className={`p-1 rounded ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                  <Icon className={`h-3 w-3 ${isActive ? 'text-white' : cat.color}`} />
                </div>
                {cat.label}
                <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                   {scripts.filter((s) => s.category === cat.id).length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
          <div>
            <h2 className="font-black text-sm text-slate-800 uppercase tracking-[0.2em]">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Kho lưu trữ kịch bản vận hành</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-2 rounded font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> Thêm bài giảng
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredScripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 border border-slate-200 border-dashed rounded bg-slate-50/50">
              <BookOpen className="h-12 w-12 opacity-20 mb-4" />
              <p className="font-black uppercase tracking-[0.2em] text-[10px]">Database Empty</p>
              <button onClick={() => handleOpenModal()} className="mt-4 text-[#10b981] hover:underline text-[10px] font-black uppercase tracking-widest">
                Khởi tạo ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
              {filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-white rounded border border-slate-200 hover:border-[#10b981]/30 transition-all group flex flex-col shadow-sm hover:shadow-md"
                >
                  <div className="p-4 flex-1">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight line-clamp-2 mb-3 h-10 leading-snug text-[12px]" title={script.title}>
                      {script.title}
                    </h4>
                    <div className="bg-slate-50 p-3 rounded text-[11px] text-slate-500 font-medium line-clamp-4 h-24 mb-3 border border-slate-100 uppercase leading-relaxed tracking-tight group-hover:text-slate-700 transition-colors">
                      {script.content}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-300 font-black uppercase tracking-widest">
                      <Tag className="h-3 w-3" />
                      <span>Sync: {new Date(script.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 border-t border-slate-100 p-2 flex justify-between items-center">
                    <div className="flex gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(script)}
                        className="text-slate-400 hover:text-[#10b981] p-2 hover:bg-white rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(script.id)}
                        className="text-slate-400 hover:text-red-500 p-2 hover:bg-white rounded transition-colors"
                        title="Purge"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onUseScript(script.content)}
                      className="bg-white hover:bg-[#10b981] text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded flex items-center gap-2 transition-all border border-slate-200 hover:border-[#10b981] shadow-sm"
                    >
                      <ArrowRightFromLine className="h-3 w-3" />
                      Deploy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[560px] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3 text-xs">
                <Pencil className="h-4 w-4 text-[#10b981]" />
                {editingScript.id ? 'HIỆU CHỈNH KỊCH BẢN' : 'KHỞI TẠO KỊCH BẢN MỚI'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Tiêu đề kịch bản</label>
                <input
                  type="text"
                  value={editingScript.title}
                  onChange={(e) => setEditingScript((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[11px] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none font-bold text-slate-700 placeholder:text-slate-300 uppercase tracking-wider transition-all"
                  placeholder="VD: CHỈ THỊ VẬN HÀNH 05..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Phân loại Protocol</label>
                <select
                  value={editingScript.category}
                  onChange={(e) => setEditingScript((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-[11px] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none text-slate-700 font-bold uppercase tracking-widest transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex flex-col space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Nội dung dữ liệu</label>
                <textarea
                  value={editingScript.content}
                  onChange={(e) => setEditingScript((prev) => ({ ...prev, content: e.target.value }))}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded p-4 text-[12px] font-medium leading-relaxed focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] outline-none resize-none text-slate-700 uppercase tracking-tight scrollbar-thin transition-all"
                  placeholder="BẮT ĐẦU NHẬP NỘI DUNG..."
                />
              </div>
            </div>

            <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded text-[10px] font-black uppercase tracking-widest transition-all">
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded text-[10px] font-black flex items-center gap-2 transition-all active:scale-95 uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                <Check className="h-4 w-4" /> Lưu cấu trúc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
