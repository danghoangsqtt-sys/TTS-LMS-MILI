import { useEffect, useState, useRef } from 'react'
import { Play, Square, Trash2, RefreshCw, Calendar, Search, Download, FileText } from 'lucide-react'

export default function HistoryLog({ history = [], onDeleteEntry, onRebroadcast }) {
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [playingId, setPlayingId] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    let res = [...history]
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      res = res.filter((l) => l.rawText.toLowerCase().includes(lower) || l.configSummary.toLowerCase().includes(lower))
    }
    if (filterDate) res = res.filter((l) => new Date(l.timestamp).toISOString().split('T')[0] === filterDate)
    setFilteredLogs(res)
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col max-h-[420px] overflow-hidden">
      {/* Filters */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
        <div className="relative flex-1">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm kiếm..."
            className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:border-emerald-500 outline-none"
          />
          <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-2" />
        </div>
        <div className="relative">
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
            className="pl-7 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:border-emerald-500 outline-none"
          />
          <Calendar className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-2" />
        </div>
        <span className="text-[10px] text-gray-400 font-medium">{filteredLogs.length}/{history.length}</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 text-gray-500 font-semibold text-[10px] uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 w-20">Thời gian</th>
              <th className="px-3 py-2">Nội dung</th>
              <th className="px-3 py-2 w-32">Cấu hình</th>
              <th className="px-3 py-2 w-10 text-center">▶</th>
              <th className="px-3 py-2 w-20 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-400 text-xs">
                <FileText className="h-6 w-6 opacity-20 mx-auto mb-1" />Không có dữ liệu.
              </td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-gray-50/80 transition-colors">
                  <td className="px-3 py-2 align-top">
                    <div className="text-xs font-medium text-gray-800">{new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed" title={log.rawText}>{log.rawText}</p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{log.configSummary}</span>
                  </td>
                  <td className="px-3 py-2 align-middle text-center">
                    {log.audioBlob ? (
                      <button onClick={() => handlePlay(log)}
                        className={`h-6 w-6 rounded-full flex items-center justify-center transition mx-auto ${playingId === log.id ? 'bg-[#14452F] text-white' : 'bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-700'}`}
                      >
                        {playingId === log.id ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3 ml-px" />}
                      </button>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    <div className="flex justify-end gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      {onRebroadcast && <button onClick={() => onRebroadcast(log.rawText)} className="p-1 text-blue-500 hover:bg-blue-50 rounded transition" title="Phát lại"><RefreshCw className="h-3.5 w-3.5" /></button>}
                      <button onClick={() => handleDownload(log)} className="p-1 text-gray-500 hover:bg-gray-100 rounded transition" title="Tải"><Download className="h-3.5 w-3.5" /></button>
                      {onDeleteEntry && <button onClick={() => { if (confirm('Xóa?')) onDeleteEntry(log.id) }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition" title="Xóa"><Trash2 className="h-3.5 w-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
