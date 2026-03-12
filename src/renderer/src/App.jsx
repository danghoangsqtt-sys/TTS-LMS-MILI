import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TTSConverter from './components/TTSConverter'
import HistoryLog from './components/HistoryLog'
import LectureLibrary from './components/LectureLibrary'
import LexiconManager from './components/LexiconManager'
import VoiceManager from './components/VoiceManager'
import DraftManager from './components/DraftManager'
import VoiceLab from './components/VoiceLab'
import { HelpCircle, Search, FolderOpen, Settings } from 'lucide-react'
import About from './components/About'
import UserGuide from './components/UserGuide'
import SplashScreen from './components/SplashScreen'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  const [activeTab, setActiveTab] = useState('tts')
  const [history, setHistory] = useState([])
  const [prefillText, setPrefillText] = useState('')
  const [activeDraft, setActiveDraft] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Desktop Production States
  const [workspacePath, setWorkspacePath] = useState(localStorage.getItem('mb_workspace') || '')
  const [prosodyConfig, setProsodyConfig] = useState({
    dot: 0.5,
    comma: 0.2,
    semicolon: 0.3,
    newline: 0.8
  })

  // Caching & Initialization
  const [isInitializing, setIsInitializing] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [voices, setVoices] = useState([])
  const [voicesLoading, setVoicesLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  const handleReady = async () => {
    setIsInitializing(false)
    attemptConnection(0)
  }

  const handleSelectWorkspace = async () => {
    const path = await window.api.selectWorkspace()
    if (path) {
      setWorkspacePath(path)
      localStorage.setItem('mb_workspace', path)
    }
  }

  const attemptConnection = async (count = 0) => {
    setIsConnecting(true)
    setConnectionError(false)
    setVoicesLoading(true)
    
    try {
      const res = await fetch('http://127.0.0.1:8000/api/voices')
      const data = await res.json()
      if (data.success) {
        setVoices(data.voices)
        setIsConnecting(false)
        setVoicesLoading(false)
      } else {
        throw new Error('No voices found')
      }
    } catch (err) {
      console.warn(`Connection attempt ${count + 1} failed:`, err)
      if (count < 4) {
        setRetryCount(count + 1)
        setTimeout(() => attemptConnection(count + 1), 2000)
      } else {
        setConnectionError(true)
        setIsConnecting(false)
        setVoicesLoading(false)
      }
    }
  }

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

  if (isInitializing) {
    return <SplashScreen onReady={handleReady} />
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full overflow-hidden bg-white font-sans text-[13px] text-gray-900 selection:bg-[#0D6241]/20">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="flex-1 flex flex-col h-screen overflow-hidden relative dot-grid">
          {/* Main Area Header */}
          <header className="h-20 flex-shrink-0 px-8 flex justify-between items-center relative z-10">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Trung Tâm Điều Hành</h1>
              <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Sẵn sàng sản xuất</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Workspace Selector */}
              <button 
                onClick={handleSelectWorkspace}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                    workspacePath 
                    ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-100 hover:bg-emerald-900/60' 
                    : 'bg-black/20 border-white/10 text-white/40 hover:bg-black/30 hover:text-white'
                }`}
              >
                <FolderOpen size={16} />
                <div className="flex flex-col items-start text-left">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none">Thư mục đầu ra</span>
                    <span className="text-[11px] font-bold truncate max-w-[180px] leading-tight mt-0.5">
                        {workspacePath ? workspacePath.split(/[\\/]/).pop() : 'Chọn Workspace...'}
                    </span>
                </div>
              </button>

              <div className="h-8 w-[1px] bg-white/10 mx-2" />

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Tra cứu kịch bản (Ctrl+K)..." 
                  className="bg-black/20 border-none text-white placeholder:text-white/40 w-64 pl-10 py-2 rounded-xl text-sm focus:ring-2 focus:ring-white/10 transition-all outline-none h-10"
                />
              </div>
              
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/20 text-white/60 hover:text-white hover:bg-black/30 transition-all border border-white/5"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
            </div>
          </header>

          {/* Connection Overlay */}
          {isConnecting && (
            <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500 rounded-l-3xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#0D6241]/10 border-t-[#0D6241] rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-[#0D6241]">Initializing AI Engine...</p>
                  <p className="text-[9px] text-gray-400 uppercase mt-0.5 tracking-widest font-bold">Attempt {retryCount}/5</p>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar main-scroll">
            <div className="max-w-7xl mx-auto px-8 py-4 space-y-6 pb-12">
              {activeTab === 'tts' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <TTSConverter
                    onConversionComplete={handleConversionComplete}
                    externalText={prefillText}
                    activeDraft={activeDraft}
                    clearDraft={() => setActiveDraft(null)}
                    cachedVoices={voices || []}
                    voicesLoading={voicesLoading}
                    workspacePath={workspacePath}
                    prosodyConfig={prosodyConfig}
                    setProsodyConfig={setProsodyConfig}
                  />
                  {(history?.length || 0) > 0 && (
                    <HistoryLog
                      history={history || []}
                      onDeleteEntry={handleDeleteEntry}
                      onRebroadcast={handleRebroadcast}
                    />
                  )}
                </div>
              )}

              {activeTab === 'drafts' && <DraftManager onOpenDraft={handleOpenDraft} />}
              {activeTab === 'lexicon' && <LexiconManager />}
              {activeTab === 'library' && <LectureLibrary onUseScript={handleUseScript} />}
              {activeTab === 'voices' && (
                <VoiceManager 
                  voices={voices || []} 
                  loading={voicesLoading} 
                  refreshVoices={attemptConnection} 
                />
              )}
              {activeTab === 'history' && (
                <HistoryLog
                  history={history || []}
                  onDeleteEntry={handleDeleteEntry}
                  onRebroadcast={handleRebroadcast}
                />
              )}
              {activeTab === 'voicelab' && <VoiceLab />}
            </div>
          </div>
        </main>
      </div>

      {/* Help & Settings Modal Overlay */}
      {showHelp && (
        <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-[1.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D6241] flex items-center justify-center shadow-lg shadow-emerald-900/10">
                  <Settings className="text-white h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-tight text-gray-800">Cấu hình hệ thống</h3>
                  <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Version 3.0.0 [Office Elite]</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelp(false)} 
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-all text-xl font-light"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <About />
                <UserGuide />
              </div>
            </div>
            <div className="p-6 border-t border-gray-50 flex justify-end bg-gray-50/30">
              <button 
                onClick={() => setShowHelp(false)}
                className="px-8 py-3 bg-[#0D6241] hover:bg-[#0B4D33] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-900/10 active:scale-95"
              >
                Đóng cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  )
}
