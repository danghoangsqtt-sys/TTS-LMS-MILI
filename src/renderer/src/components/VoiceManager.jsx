/* eslint-disable react/prop-types */
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

export default function VoiceManager({ voices = [], loading = false, refreshVoices }) {
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const result = await window.electron.ipcRenderer.invoke('import-local-voice')
      if (result.success && result.imported?.length > 0) {
        setToast({
          type: 'success',
          message: `Đã nhập thành công ${result.imported.length} giọng đọc!`
        })
        if (refreshVoices) refreshVoices()
      } else if (result.reason === 'canceled') {
        // User cancelled
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
      await window.electron.ipcRenderer.invoke('delete-local-voice', filename)
      setToast({ type: 'success', message: `Đã xóa "${filename.replace('.onnx', '')}"` })
      setDeleteConfirm(null)
      if (refreshVoices) refreshVoices()
    } catch (err) {
      setToast({ type: 'error', message: `Không thể xóa: ${err.message}` })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-2 border shadow-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
          toast.type === 'success' ? 'bg-[#10b981] text-black border-[#10b981]' : 'bg-red-600 text-white border-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {toast.message}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-[#050505] border border-white/5 p-4 flex items-center justify-between shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-[#10b981] animate-scanline" />
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="h-10 w-10 bg-white/5 flex items-center justify-center border border-white/5">
            <HardDrive className="h-4 w-4 text-[#10b981]" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural_Asset_Vault</h2>
            <p className="text-[8px] text-[#10b981] uppercase font-black tracking-widest opacity-60">CORE_VOICE_MODELS_MANAGER</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={refreshVoices}
            disabled={loading}
            className="p-2 text-white/20 hover:text-[#10b981] hover:bg-white/5 transition-all"
            title="Re-scan Directory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-6 py-2 bg-[#10b981] text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#059669] disabled:opacity-20 transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-3 active:scale-95"
          >
            {isImporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            IMPORT_RECRUIT
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#050505] border border-white/5 px-5 py-4 flex items-center gap-4 shadow-sm hover:border-white/10 transition-colors">
          <FileAudio className="h-4 w-4 text-white/20" />
          <div>
            <p className="text-sm font-black text-white leading-none tracking-widest">{(voices?.length || 0)}</p>
            <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black mt-1">AVAILABLE_PROFILES</p>
          </div>
        </div>
        <div className="bg-[#050505] border border-white/5 px-5 py-4 flex items-center gap-4 shadow-sm">
          <FileCheck className="h-4 w-4 text-[#10b981]/40" />
          <div>
            <p className="text-sm font-black text-white leading-none tracking-widest">{voices?.filter(v => v.hasConfig)?.length || 0}</p>
            <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black mt-1">GGUF_VERIFIED</p>
          </div>
        </div>
        <div className="bg-[#050505] border border-white/5 px-5 py-4 flex items-center gap-4 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-white/20" />
          <div>
            <p className="text-sm font-black text-white leading-none tracking-widest uppercase">
              {voices?.reduce((sum, v) => sum + (parseFloat(v.sizeMB) || 0), 0).toFixed(0) || '0'} MB
            </p>
            <p className="text-[7px] text-white/20 uppercase tracking-[0.2em] font-black mt-1">DATABASE_WEIGHT</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-[#050505] border border-white/5 shadow-2xl relative">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/40">
          <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
            NEURAL_INDEX_MANIFEST
          </span>
          <span className="text-[8px] text-[#10b981]/40 font-mono uppercase tracking-widest">ENCRYPTION: AES_LOCAL</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-white/20">
                <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest">ID_PROFILE</th>
                <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest">BINARY_ORIGIN</th>
                <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest text-center">MASS</th>
                <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest text-center">INTEGRITY</th>
                <th className="px-6 py-3 text-[8px] font-black uppercase tracking-widest text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-white/10">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">SYNCHRONIZING...</span>
                  </td>
                </tr>
              ) : (voices?.length || 0) === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center text-white/10 font-black uppercase text-[10px] tracking-[0.4em]">
                    No neural assets indexed in vault
                  </td>
                </tr>
              ) : (
                voices.map((voice) => (
                  <tr key={voice.filename} className="hover:bg-white/[0.03] transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-7 w-7 bg-white/5 flex items-center justify-center border border-white/5">
                          <FileAudio className="h-3.5 w-3.5 text-[#10b981]/50 group-hover:text-[#10b981] transition-colors" />
                        </div>
                        <span className="text-[11px] font-black text-white tracking-widest uppercase">{voice.baseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[9px] text-white/30 font-mono tracking-tighter uppercase">
                        {voice.filename}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center text-[10px] font-mono text-white/20">{voice.sizeMB} MB</td>
                    <td className="px-6 py-4 text-center">
                      {voice.hasConfig ? (
                        <span className="text-[#10b981] text-[8px] font-black uppercase tracking-widest">VERIFIED</span>
                      ) : (
                        <span className="text-white/10 text-[8px] font-black uppercase tracking-widest">LEGACY_RAW</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteConfirm(voice.filename)}
                        className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-md p-8 animate-in fade-in duration-300">
          <div className="bg-[#050505] border border-red-500/30 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-5 py-4 border-b border-white/5 bg-black/40 flex items-center gap-3">
               <AlertTriangle className="h-4 w-4 text-red-500" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                Critical_System_Warning
              </h3>
            </div>
            <div className="p-8 text-center">
              <p className="text-[11px] text-white/60 leading-relaxed font-bold uppercase tracking-widest mb-2">
                Initiate profile destruction sequence?
              </p>
              <div className="bg-black/80 border border-white/5 p-3 font-mono text-[10px] text-red-500/80 mb-8 break-all">
                {deleteConfirm}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => setDeleteConfirm(null)}
                    className="py-3 text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-all border border-white/5 hover:bg-white/5"
                >
                    ABORT_TASK
                </button>
                <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                    CONFIRM_PURGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
