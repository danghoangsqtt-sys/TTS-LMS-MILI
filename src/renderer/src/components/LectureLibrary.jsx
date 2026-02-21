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
  { id: 'POLITICS', label: 'Chính trị - Tư tưởng', icon: GraduationCap, color: 'text-red-600', bg: 'bg-red-50' },
  { id: 'NEWS', label: 'Tin tức - Sự kiện', icon: Newspaper, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'ORDERS', label: 'Mệnh lệnh - Chỉ đạo', icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'STORY', label: 'Văn nghệ - Kể chuyện', icon: Music, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'OTHER', label: 'Khác', icon: Tag, color: 'text-gray-600', bg: 'bg-gray-50' }
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

  useEffect(() => {
    loadScripts()
  }, [])

  const loadScripts = async () => {
    try {
      const data = await getAllScripts()
      setScripts(data)
    } catch (e) {
      console.error('Failed to load scripts', e)
    }
  }

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
    <div className="flex h-full gap-6 animate-fade-in">
      {/* SIDEBAR CATEGORIES */}
      <div className="w-64 bg-white rounded-2xl border border-gray-200 flex flex-col shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-gray-800 font-bold flex items-center gap-2 uppercase tracking-wide text-sm">
            <BookOpen className="h-4 w-4 text-sqtt-primary" /> Danh mục
          </h3>
        </div>
        <div className="p-3 space-y-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeCategory === cat.id ? 'bg-white' : cat.bg}`}>
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                </div>
                {cat.label}
                <span className="ml-auto text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {scripts.filter((s) => s.category === cat.id).length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Toolbar */}
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-card">
          <div>
            <h2 className="font-bold text-lg text-gray-800">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Quản lý và sử dụng các kịch bản mẫu.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-sqtt-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-5 w-5" /> Thêm bài mới
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredScripts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <BookOpen className="h-12 w-12 opacity-20 mb-3" />
              <p className="font-medium">Chưa có bài giảng nào trong mục này.</p>
              <button onClick={() => handleOpenModal()} className="mt-2 text-sqtt-primary hover:underline text-sm font-bold">
                Tạo ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition group flex flex-col hover:-translate-y-1 duration-200"
                >
                  <div className="p-5 flex-1">
                    <h4 className="font-bold text-gray-800 line-clamp-2 mb-2 h-12 leading-snug" title={script.title}>
                      {script.title}
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 font-medium line-clamp-4 h-24 mb-3 border border-gray-100">
                      {script.content}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <Tag className="h-3 w-3" />
                      <span>Sửa đổi: {new Date(script.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center rounded-b-xl">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(script)}
                        className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                        title="Sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(script.id)}
                        className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* ACTION BUTTON - LINK TO CONSOLE */}
                    <button
                      onClick={() => onUseScript(script.content)}
                      className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                    >
                      <ArrowRightFromLine className="h-3.5 w-3.5" />
                      Nạp vào Console
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <Pencil className="h-5 w-5 text-sqtt-primary" />
                {editingScript.id ? 'Chỉnh sửa Bài giảng' : 'Soạn thảo Bài giảng Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto bg-gray-50/50">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Tiêu đề</label>
                <input
                  type="text"
                  value={editingScript.title}
                  onChange={(e) => setEditingScript((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-gray-800 bg-white shadow-sm"
                  placeholder="VD: Chỉ thị 05 về Phòng chống bão lũ..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Danh mục</label>
                <select
                  value={editingScript.category}
                  onChange={(e) => setEditingScript((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none bg-white shadow-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nội dung kịch bản</label>
                <textarea
                  value={editingScript.content}
                  onChange={(e) => setEditingScript((prev) => ({ ...prev, content: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-lg p-4 text-sm font-medium leading-relaxed focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none bg-white shadow-sm text-gray-700"
                  placeholder="Nhập nội dung chi tiết..."
                />
              </div>
            </div>

            <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-bold transition">
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-sqtt-primary text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition"
              >
                <Check className="h-4 w-4" /> Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
