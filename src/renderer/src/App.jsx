import { useState } from 'react'
import { Search } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import TTSConverter from './components/TTSConverter'
import HistoryLog from './components/HistoryLog'
import LectureLibrary from './components/LectureLibrary'
import LexiconManager from './components/LexiconManager'
import VoiceManager from './components/VoiceManager'
import DraftManager from './components/DraftManager'
import VoiceLab from './components/VoiceLab'

export default function App() {
  const [activeTab, setActiveTab] = useState('tts')
  const [history, setHistory] = useState([])
  const [prefillText, setPrefillText] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeDraft, setActiveDraft] = useState(null)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPrefillText('')
  }

  const handleConversionComplete = (entry) => {
    setHistory((prev) => [entry, ...prev])
  }

  const handleDeleteEntry = (id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id))
  }

  const handleUseScript = (text) => {
    setPrefillText(text)
    setActiveTab('tts')
  }

  const handleRebroadcast = (text) => {
    setPrefillText(text)
    setActiveTab('tts')
  }

  const handleOpenDraft = (draft) => {
    setActiveDraft(draft)
    setActiveTab('tts')
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-dot-pattern font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-12 flex-shrink-0 px-5 flex justify-between items-center bg-[#14452F] border-b border-white/10">
          <h1 className="text-sm font-semibold text-white tracking-tight">Trung Tâm Điều Hành</h1>
          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm kiếm (Ctrl+K)"
              className="bg-white/10 border border-white/10 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:text-gray-900 outline-none w-56 transition-all text-white placeholder-white/40"
            />
            <Search className="h-3.5 w-3.5 text-white/50 absolute left-2.5 top-2 group-focus-within:text-gray-500 transition-colors" />
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-6">
            {activeTab === 'tts' && (
              <div className="space-y-4">
                <Dashboard history={history} />
                <TTSConverter
                  onConversionComplete={handleConversionComplete}
                  externalText={prefillText}
                  activeDraft={activeDraft}
                  clearDraft={() => setActiveDraft(null)}
                />
                {history.length > 0 && (
                  <HistoryLog
                    history={history}
                    onDeleteEntry={handleDeleteEntry}
                    onRebroadcast={handleRebroadcast}
                  />
                )}
              </div>
            )}

            {activeTab === 'drafts' && <DraftManager onOpenDraft={handleOpenDraft} />}
            {activeTab === 'lexicon' && <LexiconManager />}
            {activeTab === 'library' && <LectureLibrary onUseScript={handleUseScript} />}
            {activeTab === 'voices' && <VoiceManager />}
            {activeTab === 'history' && (
              <HistoryLog
                history={history}
                onDeleteEntry={handleDeleteEntry}
                onRebroadcast={handleRebroadcast}
              />
            )}
            {activeTab === 'voicelab' && <VoiceLab />}
          </div>
        </div>
      </main>
    </div>
  )
}
