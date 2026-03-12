import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Disc, Cpu, Database, Network, Loader2, Info, Terminal } from 'lucide-react'

const tips = [
  "STRATEGY: Clear transcripts yield 99% accuracy in neural voice cloning.",
  "DHSYSTEM: Numeric data and dates are automatically normalized by the core.",
  "GGUF_ENGINE: CPU-optimized inference active. No high-end GPU required.",
  "INPUT_TIP: High-fidelity reference audio ensures superior voice matching.",
  "SECURITY: All processing occurs on local hardware. Offline mode enabled.",
  "PROTOCOL: Naming convention [Name]_[Region] is recommended for voice assets."
]

const SplashScreen = ({ onReady }) => {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('INITIALIZING COMMAND_CENTER...')
  const [status, setStatus] = useState('initializing')
  const [currentTip, setCurrentTip] = useState(tips[0])
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [logs, setLogs] = useState([])

  // Typewriter effect for system logs
  useEffect(() => {
    const systemLogs = [
      "[INFO] Loading Neural Weights into RAM...",
      "[SYSTEM] CPU Quantization: Q4_K_M Active.",
      "[CORE] Memory isolation protocol established.",
      "[NET] Local API binding to :8000...",
      "[AUTH] DHSYSTEM encrypted handshake complete."
    ]
    
    let i = 0
    const interval = setInterval(() => {
      if (i < systemLogs.length) {
        setLogs(prev => [...prev, systemLogs[i]])
        i++
      } else {
        clearInterval(interval)
      }
    }, 800)
    
    return () => clearInterval(interval)
  }, [])

  // Polling Status Logic
  useEffect(() => {
    let pollingInterval;
    
    const checkStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/status')
        const data = await res.json()
        
        setProgress(data.progress)
        setMessage(data.message.toUpperCase())
        
        if (data.status === 'ready') {
          clearInterval(pollingInterval)
          setStatus('ready')
          setTimeout(() => {
            setIsFadingOut(true)
            setTimeout(onReady, 800)
          }, 500)
        }
      } catch (e) {
        // Continue polling
      }
    }

    pollingInterval = setInterval(checkStatus, 1000)
    checkStatus()

    return () => clearInterval(pollingInterval)
  }, [onReady])

  // Tip Rotation Logic
  useEffect(() => {
    const tipInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * tips.length)
      setCurrentTip(tips[randomIndex])
    }, 4000)
    return () => clearInterval(tipInterval)
  }, [])

  return (
    <div className={`fixed inset-0 bg-[#000000] z-[9999] flex flex-col items-center justify-center p-8 overflow-hidden select-none transition-opacity duration-700 font-sans ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Scanning Effect Overlay (Vertical Radar) */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-[0.15]">
        <div className="absolute top-0 left-0 w-full h-[15px] bg-gradient-to-b from-transparent via-[#10b981] to-transparent animate-scan"></div>
      </div>

      {/* Decorative Geometric Blocks */}
      <div className="absolute top-10 left-10 w-24 h-24 border-t border-l border-[#10b981]/10"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 border-b border-r border-[#10b981]/10"></div>

      {/* Main Content */}
      <div className="relative flex flex-col items-center max-w-2xl w-full z-20">
        
        {/* Logo Section */}
        <div className="mb-12 relative flex flex-col items-center">
            <div className="w-14 h-14 border border-[#10b981] rounded-none flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
               <div className="absolute inset-0 bg-[#10b981]/5 animate-pulse" />
               <Disc className="h-8 w-8 text-[#10b981] animate-spin relative z-10" style={{ animationDuration: '6s' }} />
            </div>
            <h1 className="text-2xl font-black tracking-[0.6em] text-white">DHSYSTEM</h1>
            <div className="flex items-center gap-2 mt-2 opacity-40">
                <div className="h-0.5 w-8 bg-[#10b981]" />
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-[#10b981]">NEURAL_CONSOLE_v3.0</p>
                <div className="h-0.5 w-8 bg-[#10b981]" />
            </div>
        </div>

        {/* Progress Section */}
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-end mb-1">
              <div className="flex items-center gap-2">
                 <Loader2 className="h-3 w-3 animate-spin text-[#10b981]" />
                 <span className="text-[9px] text-[#10b981] font-black tracking-[0.2em] uppercase">
                    &gt; {message}
                 </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono font-black tracking-widest">{progress}%</span>
            </div>
            
            <div className="h-0.5 w-full bg-white/5 overflow-hidden rounded-none">
              <div 
                className="h-full bg-[#10b981] transition-all duration-500 ease-out shadow-[0_0_10px_#10b981]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* System Messages (Typewriter Logs) */}
          <div className="bg-black border border-white/5 p-4 min-h-[140px] font-mono overflow-hidden flex flex-col justify-end">
             <div className="flex items-center gap-2 mb-3 opacity-30">
                <Terminal size={10} className="text-[#10b981]" />
                <span className="text-[8px] uppercase tracking-widest font-black">Boot_Sequence_Log</span>
             </div>
             <div className="space-y-1">
                {logs.map((log, idx) => (
                    <div key={idx} className="text-[9px] text-white/30 flex gap-2 animate-in fade-in slide-in-from-left-1">
                        <span className="text-[#10b981]/50 underline">SYSTEM:</span>
                        <span className="tracking-tight uppercase">{log}</span>
                    </div>
                ))}
             </div>
          </div>

          {/* Tips Section */}
          <div className="flex gap-4 items-start pt-4 border-t border-white/5 opacity-60 group">
            <div className="mt-1">
               <Info className="h-3.5 w-3.5 text-[#10b981] group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex-1">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-[#10b981] block mb-1">Tactical_Briefing</span>
              <p className="text-[10px] text-white/50 leading-relaxed font-bold tracking-tight uppercase">
                {currentTip}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}} />
    </div>
  )
}

SplashScreen.propTypes = {
  onReady: PropTypes.func.isRequired
}

export default SplashScreen
