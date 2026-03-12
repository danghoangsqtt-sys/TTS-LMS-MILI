/* eslint-disable react/prop-types */
import { useState, useRef, useMemo, useEffect } from 'react'
import { Play, Square, Trash2, RefreshCw, Calendar, Search, Download, FileText, Database, ShieldCheck } from 'lucide-react'

export default function HistoryLog({ history = [], onDeleteEntry, onRebroadcast }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [playingId, setPlayingId] = useState(null)
  const audioRef = useRef(null)

  const filteredLogs = useMemo(() => {
    let res = [...(history || [])]
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      res = res.filter((l) => l.rawText?.toLowerCase().includes(lower) || l.configSummary?.toLowerCase().includes(lower))
    }
    if (filterDate) res = res.filter((l) => new Date(l.timestamp).toISOString().split('T')[0] === filterDate)
    return res
  }, [history, searchTerm, filterDate])

  useEffect(() => { return () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null } } }, [])

  const handlePlay = (log) => {
    if (!log.audioBlob) return
    if (playingId === log.id) { if (audioRef.current) audioRef.current.pause(); setPlayingId(null); return }
    if (audioRef.current) audioRef.current.pause()
    try {
      const audio = new Audio(log.audioBlob)
      audioRef.current = audio
      audio.onended = () => setPlayingId(null)
      audio.play()
      setPlayingId(log.id)
    } catch (e) { console.error('Audio play error', e) }
  }

  const handleDownload = (log) => {
    if (!log.audioBlob) return
    const link = document.createElement('a')
    link.href = log.audioBlob
    link.download = `Broadcast_${log.timestamp}.wav`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="pro-card-xl flex flex-col max-h-[400px] overflow-hidden">
      {/* Table Header */}
      <div className="p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <Database size={16} className="text-blue-700" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-gray-800 tracking-tight leading-none">Lịch sử phát thanh</h3>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Hoạt động thời gian thực</p>
            </div>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Tìm nhanh..."
                    className="pl-8 pr-3 py-1.5 bg-gray-100 border-none rounded-lg text-xs text-gray-700 placeholder:text-gray-400 w-40 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all h-8"
                />
            </div>
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <input 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="pl-8 pr-2 py-1.5 bg-gray-100 border-none rounded-lg text-xs text-gray-700 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all h-8"
                />
            </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-x-auto custom-scrollbar px-6">
        <table className="w-full text-left border-separate border-spacing-y-1">
          <thead>
            <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Kịch bản</th>
              <th className="px-4 py-3">Cấu hình</th>
              <th className="px-4 py-3 text-center">Phát</th>
              <th className="px-4 py-3 text-right">Lệnh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center opacity-10">
                        <FileText size={32} className="text-gray-400 mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Không có dữ liệu</span>
                    </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-emerald-50/20 transition-all">
                  <td className="px-4 py-3 align-middle">
                    <div className="font-bold text-gray-700 text-xs">{new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[8px] text-gray-400 font-bold uppercase">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="px-4 py-3 align-middle max-w-[300px]">
                    <p className="text-gray-500 truncate font-medium text-xs" title={log.rawText}>
                      {log.rawText}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/60 px-2 py-0.5 rounded-md border border-emerald-100/50">
                      {log.configSummary}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    {log.audioBlob ? (
                      <button 
                        onClick={() => handlePlay(log)}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all mx-auto shadow-sm active:scale-90 ${
                          playingId === log.id 
                            ? 'bg-emerald-600 text-white shadow-emerald-900/10' 
                            : 'bg-white border border-gray-100 text-gray-400 hover:text-emerald-600 hover:border-emerald-200'
                        }`}
                      >
                        {playingId === log.id ? <Square className="h-2.5 w-2.5 fill-current" /> : <Play className="h-2.5 w-2.5 fill-current ml-0.5" />}
                      </button>
                    ) : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      {onRebroadcast && (
                        <button onClick={() => onRebroadcast(log.rawText)} className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm" title="Phát lại">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDownload(log)} className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors shadow-sm" title="Tải xuống">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {onDeleteEntry && (
                        <button onClick={() => { if (confirm('Xóa bản ghi này?')) onDeleteEntry(log.id) }} className="p-1.5 bg-white border border-gray-100 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm" title="Xóa">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#0D6241]/60">Secure Local Storage</span>
        </div>
        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
            {filteredLogs.length}/{history?.length || 0} SECTOR_LOG
        </span>
      </div>
    </div>
  )
}
