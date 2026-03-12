import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  Rocket,
  Clock,
  Sparkles,
  Send,
  Loader2,
  Wand2,
  X,
  Cpu,
  ChevronRight,
  Save,
  FileText
} from 'lucide-react'
import PropTypes from 'prop-types'

const CATEGORIES = [
  {
    id: 'NEWS',
    label: 'Tin tức truyền thông',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100'
  },
  {
    id: 'INTERNAL',
    label: 'Thông báo nội bộ',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100'
  },
  {
    id: 'PROPAGANDA',
    label: 'Thông báo tuyên truyền',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100'
  },
  {
    id: 'ADMIN',
    label: 'Văn bản hành chính',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100'
  },
  {
    id: 'OTHER',
    label: 'Chuyên mục khác',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-100'
  }
]

const STORAGE_KEY = 'sqtt_scripts'

export default function LectureLibrary({ onUseScript }) {
  const [scripts, setScripts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScript, setSelectedScript] = useState(null)
  
  // Editor States
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('NEWS')
  const [editContent, setEditContent] = useState('')
  
  // AI Assistant States
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState(null)

  const handleSelectScript = (script) => {
    setSelectedScript(script)
    setEditTitle(script.title)
    setEditCategory(script.category)
    setEditContent(script.content)
  }

  // Load scripts from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.length > 0) {
          setScripts(parsed)
          const first = parsed[0]
          handleSelectScript(first)
        }
      } catch (e) {
        console.error('Failed to parse scripts', e)
      }
    }
  }, [])

  // Save scripts to localStorage
  const saveToStorage = (newScripts) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newScripts))
    setScripts(newScripts)
  }

  const handleCreateNew = () => {
    const newScript = {
      id: `script_${Date.now()}`,
      title: 'Kịch bản mới',
      category: 'NEWS',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditTitle(newScript.title)
    setEditCategory(newScript.category)
    setEditContent(newScript.content)
    setSelectedScript(null)
  }

  const handleSave = () => {
    if (!editTitle.trim()) {
      alert('Vui lòng nhập tiêu đề kịch bản')
      return
    }

    const scriptToSave = {
      id: selectedScript?.id || `script_${Date.now()}`,
      title: editTitle,
      category: editCategory,
      content: editContent,
      createdAt: selectedScript?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    let newScripts
    if (selectedScript) {
      newScripts = scripts.map((s) => (s.id === selectedScript.id ? scriptToSave : s))
    } else {
      newScripts = [scriptToSave, ...scripts]
    }

    saveToStorage(newScripts)
    setSelectedScript(scriptToSave)
  }

  const handleDelete = () => {
    if (!selectedScript) return
    if (!confirm('Bạn có chắc chắn muốn xóa kịch bản này?')) return

    const newScripts = scripts.filter((s) => s.id !== selectedScript.id)
    saveToStorage(newScripts)
    
    if (newScripts.length > 0) {
      handleSelectScript(newScripts[0])
    } else {
      handleCreateNew()
    }
  }

  const handleLaunchStudio = () => {
    if (!editContent.trim()) {
      alert('Nội dung kịch bản đang trống!')
      return
    }
    
    // Auto save if it's an existing script
    if (selectedScript) {
      handleSave()
    }

    localStorage.setItem('pending_script', editContent)
    if (onUseScript) onUseScript(editContent)
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    setAiError(null)
    setAiResult('')
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      
      const data = await response.json()
      if (data.success) {
        setAiResult(data.text)
      } else {
        throw new Error(data.error || 'AI Error')
      }
    } catch (err) {
      setAiError(err.message || 'Lỗi kết nối AI Core')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleInsertAi = () => {
    if (!aiResult) return
    setEditContent((prev) => (prev ? prev + '\n\n' + aiResult : aiResult))
    setIsAiPanelOpen(false)
  }

  const filteredScripts = useMemo(
    () =>
      scripts.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.content.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [scripts, searchTerm]
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* LEFT COLUMN: Library Management (35%) */}
      <div className="w-[35%] flex flex-col bg-slate-50 border-r border-slate-200">
        <div className="p-6 border-b border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="text-emerald-600" size={18} />
              Danh sách Kịch bản
            </h3>
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md"
            >
              <Plus size={14} />
              Tạo mới
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Tìm kiếm kịch bản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 py-2.5 text-xs focus:ring-2 focus:ring-emerald-50 focus:border-emerald-200 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredScripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <FileText size={48} className="text-slate-300 mb-2" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Thư viện trống</p>
            </div>
          ) : (
            filteredScripts.map(script => {
              const category = CATEGORIES.find(c => c.id === script.category) || CATEGORIES[4]
              const isActive = selectedScript?.id === script.id
              return (
                <button
                  key={script.id}
                  onClick={() => handleSelectScript(script)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border flex flex-col gap-2 group ${
                    isActive 
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                      : 'bg-white border-white hover:border-slate-200 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${category.bg} ${category.color} ${category.border}`}>
                      {category.label}
                    </span>
                    <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(script.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold leading-tight ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {script.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {script.content || '(Chưa có nội dung soạn thảo)'}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Drafting & AI Assistant (65%) */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="p-8 pb-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Pencil className="text-emerald-600" size={20} />
              Trạm Soạn thảo Nội dung
            </h3>
            
            <button 
              onClick={() => setIsAiPanelOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all"
            >
              <Sparkles size={14} />
              Khởi động Trợ lý AI
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tiêu đề bản thảo</label>
              <input 
                type="text" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ví dụ: Thông báo khẩn về điều chuyển nhân sự..."
                className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-200 focus:bg-white rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chuyên mục</label>
              <select 
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-200 focus:bg-white rounded-2xl px-5 py-3 text-xs font-bold text-slate-700 transition-all outline-none appearance-none cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 px-8 pb-32 flex flex-col overflow-hidden">
          <div className="flex-1 relative border border-slate-100 rounded-3xl overflow-hidden focus-within:border-emerald-200 transition-all">
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Nhập nội dung truyền thông của bạn tại đây..."
              className="w-full h-full p-8 text-lg font-medium text-slate-700 leading-relaxed outline-none resize-none custom-scrollbar bg-slate-50/30"
            />
            
            <div className="absolute bottom-6 right-6 px-3 py-1 bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {editContent.length} ký tự | {editContent.trim().split(/\s+/).filter(Boolean).length} từ
            </div>

            {/* AI OVERLAY PANEL */}
            {isAiPanelOpen && (
              <div className="absolute inset-0 z-50 bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center">
                      <Wand2 size={22} className="text-teal-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Trợ lý AI Thông minh</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Local DHS-Brain Engine</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAiPanelOpen(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đề bài / Yêu cầu soạn thảo</label>
                    <div className="relative">
                      <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Hãy viết một thông báo về việc bảo trì hệ thống vào tối nay..."
                        className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-medium text-slate-700 focus:bg-white focus:border-teal-200 transition-all outline-none resize-none shadow-inner"
                      />
                      <button 
                        onClick={handleGenerateAi}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="absolute bottom-4 right-4 p-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-30 shadow-lg shadow-teal-900/10"
                      >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>

                  {aiError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
                       <Cpu size={14} /> {aiError}
                    </div>
                  )}

                  {aiResult && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Kết quả văn bản gợi ý</label>
                      <div className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {aiResult}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3">
                  <button onClick={() => setIsAiPanelOpen(false)} className="flex-1 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all">
                    Hủy bỏ
                  </button>
                  <button 
                    disabled={!aiResult || isGenerating}
                    onClick={handleInsertAi}
                    className="flex-[2] py-4 bg-teal-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-teal-900/20 hover:bg-teal-700 transition-all disabled:opacity-30"
                  >
                    Chèn vào Vùng soạn thảo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STICKY ACTION BAR */}
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] flex items-center justify-between z-40">
           <div className="flex gap-4">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <Save size={16} />
                Lưu hồ sơ
              </button>
              <button 
                onClick={handleDelete}
                disabled={!selectedScript}
                className="flex items-center gap-2 px-6 py-3.5 bg-white border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20"
              >
                <Trash2 size={16} />
                Xóa
              </button>
           </div>

           <button 
            onClick={handleLaunchStudio}
            className="flex items-center gap-3 px-12 py-4 bg-slate-900 text-white rounded-3xl text-[13px] font-bold uppercase tracking-[0.15em] hover:bg-black transition-all shadow-2xl shadow-slate-900/30 active:scale-95 group"
           >
             <Rocket size={18} className="text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             Chuyển sang Studio Phát thanh
             <ChevronRight size={16} className="opacity-40" />
           </button>
        </div>
      </div>
    </div>
  )
}

LectureLibrary.propTypes = {
  onUseScript: PropTypes.func
}
