import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname, basename } from 'path'
import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
  existsSync,
  copyFileSync,
  statSync
} from 'fs'
import { execFile } from 'child_process'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

// Point fluent-ffmpeg to the bundled binary
ffmpeg.setFfmpegPath(ffmpegStatic)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getExtraResourcesPath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'extraResources')
  }
  return join(app.getAppPath(), 'extraResources')
}

function getDictionaryPath() {
  return join(getExtraResourcesPath(), 'dictionary.json')
}

function loadDictionary() {
  try {
    const raw = readFileSync(getDictionaryPath(), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function normalizeText(text) {
  const dict = loadDictionary()
  let normalized = text
  const sortedKeys = Object.keys(dict).sort((a, b) => b.length - a.length)
  for (const abbr of sortedKeys) {
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Use \b for pure-ASCII abbreviations (exact whole-word match)
    // Use Unicode-aware lookaround for non-ASCII keys
    const isAscii = /^[\x20-\x7E]+$/.test(abbr)
    const pattern = isAscii ? `\\b${escaped}\\b` : `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`
    const regex = new RegExp(pattern, 'gu')
    normalized = normalized.replace(regex, dict[abbr])
  }
  return normalized
}

function cleanupFiles(...paths) {
  for (const p of paths) {
    try {
      if (existsSync(p)) unlinkSync(p)
    } catch {
      /* ignore */
    }
  }
}

/**
 * Generate a silent WAV file (16-bit PCM, 16kHz mono) of given duration in seconds.
 */
function generateSilenceWav(durationSec, outputPath) {
  const sampleRate = 16000
  const numChannels = 1
  const bitsPerSample = 16
  const numSamples = Math.round(sampleRate * durationSec)
  const dataSize = numSamples * numChannels * (bitsPerSample / 8)
  const buffer = Buffer.alloc(44 + dataSize, 0) // 44-byte WAV header + silent PCM data

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  // fmt sub-chunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16) // sub-chunk size
  buffer.writeUInt16LE(1, 20) // PCM format
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28) // byte rate
  buffer.writeUInt16LE(numChannels * (bitsPerSample / 8), 32) // block align
  buffer.writeUInt16LE(bitsPerSample, 34)
  // data sub-chunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)
  // PCM data is all zeros (silence) — already allocated as 0

  writeFileSync(outputPath, buffer)
}

/**
 * Run piper.exe for a single chunk of text and return the output WAV path.
 */
function piperSynthesize(text, piperExe, modelPath, lengthScale) {
  return new Promise((resolve, reject) => {
    const tempWav = join(
      tmpdir(),
      `piper-chunk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.wav`
    )
    const child = execFile(
      piperExe,
      ['--model', modelPath, '--length_scale', String(lengthScale), '--output_file', tempWav],
      { windowsHide: true, maxBuffer: 50 * 1024 * 1024 },
      (error) => {
        if (error) return reject(new Error(`Piper failed: ${error.message}`))
        if (!existsSync(tempWav)) return reject(new Error('Piper produced no output'))
        resolve(tempWav)
      }
    )
    child.stdin.write(text)
    child.stdin.end()
  })
}

/**
 * Concatenate multiple WAV files into one using ffmpeg concat filter.
 */
function concatWavFiles(wavPaths, outputPath) {
  return new Promise((resolve, reject) => {
    if (wavPaths.length === 0) return reject(new Error('No audio chunks to concatenate'))
    if (wavPaths.length === 1) {
      // Just copy
      writeFileSync(outputPath, readFileSync(wavPaths[0]))
      return resolve(outputPath)
    }

    // Build a concat file list for ffmpeg
    const listPath = join(tmpdir(), `concat-list-${Date.now()}.txt`)
    const listContent = wavPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n')
    writeFileSync(listPath, listContent, 'utf-8')

    ffmpeg()
      .input(listPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .output(outputPath)
      .on('end', () => {
        cleanupFiles(listPath)
        resolve(outputPath)
      })
      .on('error', (err) => {
        cleanupFiles(listPath)
        reject(new Error(`FFmpeg concat failed: ${err.message}`))
      })
      .run()
  })
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ---------------------------------------------------------------------------
// IPC Handlers
// ---------------------------------------------------------------------------

function registerIpcHandlers() {
  // ----- Preview a single word/phrase (for Lexicon) -----
  ipcMain.handle('preview-word', async (_event, { text, modelName }) => {
    const extraPath = getExtraResourcesPath()
    const piperExe = join(extraPath, 'piper.exe')
    const modelPath = join(extraPath, 'models', modelName)
    if (!existsSync(piperExe)) throw new Error('piper.exe not found')
    if (!existsSync(modelPath)) throw new Error(`Model not found: ${modelName}`)
    const wavPath = await piperSynthesize(text, piperExe, modelPath, 1.0)
    const wavBuffer = readFileSync(wavPath)
    cleanupFiles(wavPath)
    return `data:audio/wav;base64,${wavBuffer.toString('base64')}`
  })

  // ----- Generate TTS (with smart chunking + custom pauses) -----
  ipcMain.handle('generate-tts', async (_event, { text, modelName, speed = 1.0 }) => {
    const normalized = normalizeText(text)
    const extraPath = getExtraResourcesPath()
    const piperExe = join(extraPath, 'piper.exe')
    const modelPath = join(extraPath, 'models', modelName)

    if (!existsSync(piperExe)) throw new Error(`piper.exe not found at: ${piperExe}`)
    if (!existsSync(modelPath)) throw new Error(`Model not found at: ${modelPath}`)

    const lengthScale = parseFloat(speed) || 1.0

    // Split text into chunks: sentences and pause tags
    // This regex captures pause tags and splits on them, preserving sentence-like chunks
    const pauseTagRegex = /(\[nghi_(\d+(?:\.\d+)?)s\])/g
    const parts = normalized.split(pauseTagRegex)

    // parts will be: [textBefore, fullTag, seconds, textAfter, fullTag, seconds, ...]
    // Rebuild into ordered chunk descriptors
    const chunks = []
    let i = 0
    while (i < parts.length) {
      const part = parts[i]
      if (part && part.match(/^\[nghi_[\d.]+s\]$/)) {
        // This is a pause tag, next item is the captured seconds
        const sec = parseFloat(parts[i + 1]) || 1.0
        chunks.push({ type: 'pause', duration: sec })
        i += 2
      } else if (part && part.trim()) {
        // Split long text into sentence-level sub-chunks to avoid overloading Piper
        const sentences = part
          .split(/(?<=[.!?。])\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        for (const sentence of sentences) {
          chunks.push({ type: 'text', content: sentence })
        }
        i += 1
      } else {
        i += 1
      }
    }

    if (chunks.length === 0) {
      throw new Error('No processable text found')
    }

    // Process each chunk into a WAV file
    const chunkWavPaths = []
    try {
      for (const chunk of chunks) {
        if (chunk.type === 'pause') {
          const silPath = join(
            tmpdir(),
            `silence-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.wav`
          )
          generateSilenceWav(chunk.duration, silPath)
          chunkWavPaths.push(silPath)
        } else {
          const wavPath = await piperSynthesize(chunk.content, piperExe, modelPath, lengthScale)
          chunkWavPaths.push(wavPath)
        }
      }

      // Concatenate all chunks
      const finalWav = join(tmpdir(), `tts-final-${Date.now()}.wav`)
      await concatWavFiles(chunkWavPaths, finalWav)

      // Read and convert to base64
      const wavBuffer = readFileSync(finalWav)
      const base64 = wavBuffer.toString('base64')
      const dataUri = `data:audio/wav;base64,${base64}`

      // Cleanup
      cleanupFiles(finalWav, ...chunkWavPaths)

      return dataUri
    } catch (err) {
      // Cleanup on error
      cleanupFiles(...chunkWavPaths)
      throw err
    }
  })

  // ----- Export Mixed Audio (TTS + BGM via FFmpeg) -----
  ipcMain.handle(
    'export-mixed-audio',
    async (_event, { ttsBase64, bgmFilename, ttsVolume, bgmVolume }) => {
      // Ask user where to save
      const win = BrowserWindow.getFocusedWindow()
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: 'Xuất file audio',
        defaultPath: `SQTT_Mixed_${Date.now()}.mp3`,
        filters: [
          { name: 'MP3 Audio', extensions: ['mp3'] },
          { name: 'WAV Audio', extensions: ['wav'] }
        ]
      })

      if (canceled || !filePath) return { success: false, reason: 'canceled' }

      // Write TTS base64 to temp WAV
      const ttsTemp = join(tmpdir(), `tts-export-${Date.now()}.wav`)
      const raw = ttsBase64.includes(',') ? ttsBase64.split(',')[1] : ttsBase64
      writeFileSync(ttsTemp, Buffer.from(raw, 'base64'))

      // Resolve BGM path
      const bgmPath = join(getExtraResourcesPath(), 'bgm', bgmFilename)
      if (!existsSync(bgmPath)) {
        cleanupFiles(ttsTemp)
        throw new Error(`BGM file not found: ${bgmFilename}`)
      }

      try {
        await new Promise((resolve, reject) => {
          const tvol = Math.max(0, Math.min(1, parseFloat(ttsVolume) || 1.0))
          const bvol = Math.max(0, Math.min(1, parseFloat(bgmVolume) || 0.2))

          ffmpeg()
            .input(ttsTemp)
            .input(bgmPath)
            .complexFilter([
              `[0:a]volume=${tvol}[tts]`,
              `[1:a]volume=${bvol}[bgm]`,
              `[tts][bgm]amix=inputs=2:duration=first:dropout_transition=3[out]`
            ])
            .outputOptions(['-map', '[out]'])
            .audioCodec(filePath.endsWith('.wav') ? 'pcm_s16le' : 'libmp3lame')
            .audioBitrate('192k')
            .output(filePath)
            .on('end', () => resolve())
            .on('error', (err) => reject(new Error(`FFmpeg mix failed: ${err.message}`)))
            .run()
        })

        cleanupFiles(ttsTemp)
        return { success: true, filePath }
      } catch (err) {
        cleanupFiles(ttsTemp)
        throw err
      }
    }
  )

  // ----- Get dictionary -----
  ipcMain.handle('get-dictionary', async () => {
    return loadDictionary()
  })

  // ----- Save dictionary -----
  ipcMain.handle('save-dictionary', async (_event, dict) => {
    writeFileSync(getDictionaryPath(), JSON.stringify(dict, null, 2), 'utf-8')
    return { success: true }
  })

  // ----- Get available models -----
  ipcMain.handle('get-models', async () => {
    const modelsDir = join(getExtraResourcesPath(), 'models')
    try {
      const files = readdirSync(modelsDir)
      return files.filter((f) => f.endsWith('.onnx'))
    } catch {
      return []
    }
  })

  // ----- Get BGM file list -----
  ipcMain.handle('get-bgm-list', async () => {
    const bgmDir = join(getExtraResourcesPath(), 'bgm')
    try {
      if (!existsSync(bgmDir)) return []
      const files = readdirSync(bgmDir)
      return files.filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f))
    } catch {
      return []
    }
  })

  // ----- Get BGM file as Base64 -----
  ipcMain.handle('get-bgm-file', async (_event, filename) => {
    const bgmDir = join(getExtraResourcesPath(), 'bgm')
    const filePath = join(bgmDir, filename)
    if (!existsSync(filePath)) {
      throw new Error(`BGM file not found: ${filename}`)
    }
    const buffer = readFileSync(filePath)
    const base64 = buffer.toString('base64')
    const ext = filename.split('.').pop().toLowerCase()
    const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4' }
    const mime = mimeMap[ext] || 'audio/mpeg'
    return `data:${mime};base64,${base64}`
  })

  // ----- Get local installed voices -----
  ipcMain.handle('get-local-voices', async () => {
    const modelsDir = join(getExtraResourcesPath(), 'models')
    try {
      if (!existsSync(modelsDir)) return []
      const files = readdirSync(modelsDir).filter((f) => f.endsWith('.onnx'))
      return files.map((f) => {
        const filePath = join(modelsDir, f)
        const stats = statSync(filePath)
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1)
        const baseName = f.replace('.onnx', '')
        const hasConfig = existsSync(join(modelsDir, baseName + '.onnx.json'))
        return { filename: f, baseName, sizeMB, hasConfig }
      })
    } catch {
      return []
    }
  })

  // ----- Import voice from local filesystem (USB/drive) -----
  ipcMain.handle('import-local-voice', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Chọn file giọng đọc (.onnx)',
      filters: [{ name: 'ONNX Voice Model', extensions: ['onnx'] }],
      properties: ['openFile', 'multiSelections']
    })

    if (canceled || filePaths.length === 0) return { success: false, reason: 'canceled' }

    const modelsDir = join(getExtraResourcesPath(), 'models')
    const imported = []
    const errors = []

    for (const onnxPath of filePaths) {
      const onnxName = basename(onnxPath)
      const destOnnx = join(modelsDir, onnxName)
      try {
        copyFileSync(onnxPath, destOnnx)
        imported.push(onnxName)

        // Try to copy matching .json config from same source directory
        const sourceDir = dirname(onnxPath)
        const jsonName = onnxName + '.json'
        const sourceJson = join(sourceDir, jsonName)
        if (existsSync(sourceJson)) {
          copyFileSync(sourceJson, join(modelsDir, jsonName))
        }
      } catch (err) {
        errors.push(`${onnxName}: ${err.message}`)
      }
    }

    return { success: true, imported, errors }
  })

  // ----- Delete a local voice model -----
  ipcMain.handle('delete-local-voice', async (_event, onnxFilename) => {
    const modelsDir = join(getExtraResourcesPath(), 'models')
    const onnxPath = join(modelsDir, onnxFilename)
    const jsonPath = join(modelsDir, onnxFilename + '.json')

    try {
      if (existsSync(onnxPath)) unlinkSync(onnxPath)
      if (existsSync(jsonPath)) unlinkSync(jsonPath)
      return { success: true }
    } catch (err) {
      throw new Error(`Không thể xóa: ${err.message}`)
    }
  })

  // ----- Drafts persistence helpers -----
  const draftsPath = join(app.getPath('userData'), 'drafts.json')

  function readDrafts() {
    try {
      if (!existsSync(draftsPath)) {
        writeFileSync(draftsPath, '[]', 'utf-8')
        return []
      }
      return JSON.parse(readFileSync(draftsPath, 'utf-8'))
    } catch {
      return []
    }
  }

  function writeDrafts(drafts) {
    writeFileSync(draftsPath, JSON.stringify(drafts, null, 2), 'utf-8')
  }

  // ----- Get all drafts -----
  ipcMain.handle('get-drafts', async () => {
    return readDrafts()
  })

  // ----- Save / update a draft -----
  ipcMain.handle('save-draft', async (_event, draft) => {
    const drafts = readDrafts()
    const idx = drafts.findIndex((d) => d.id === draft.id)
    if (idx >= 0) {
      drafts[idx] = { ...drafts[idx], ...draft, date: new Date().toISOString() }
    } else {
      drafts.unshift({ ...draft, id: Date.now(), date: new Date().toISOString() })
    }
    writeDrafts(drafts)
    return { success: true }
  })

  // ----- Delete a draft -----
  ipcMain.handle('delete-draft', async (_event, draftId) => {
    const drafts = readDrafts().filter((d) => d.id !== draftId)
    writeDrafts(drafts)
    return { success: true }
  })

  // ----- Generate Multi-Voice TTS (block-by-block, different models) -----
  ipcMain.handle('generate-multi-tts', async (_event, { blocks }) => {
    const extraPath = getExtraResourcesPath()
    const piperExe = join(extraPath, 'piper.exe')
    if (!existsSync(piperExe)) throw new Error(`piper.exe not found at: ${piperExe}`)

    const blockWavPaths = []
    try {
      for (const block of blocks) {
        const normalizedText = normalizeText(block.text)
        const modelPath = join(extraPath, 'models', block.voice)
        if (!existsSync(modelPath)) throw new Error(`Model not found: ${block.voice}`)
        const lengthScale = parseFloat(block.speed) || 1.0

        // Split into sentences for this block
        const pauseTagRegex = /(\[nghi_(\d+(?:\.\d+)?)s\])/g
        const parts = normalizedText.split(pauseTagRegex)
        const chunks = []
        let pi = 0
        while (pi < parts.length) {
          const part = parts[pi]
          if (part && part.match(/^\[nghi_[\d.]+s\]$/)) {
            const sec = parseFloat(parts[pi + 1]) || 1.0
            chunks.push({ type: 'pause', duration: sec })
            pi += 2
          } else if (part && part.trim()) {
            const sentences = part
              .split(/(?<=[.!?。])\s+/)
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
            for (const sentence of sentences) {
              chunks.push({ type: 'text', content: sentence })
            }
            pi += 1
          } else {
            pi += 1
          }
        }

        // Process chunks for this block
        const chunkWavs = []
        for (const chunk of chunks) {
          if (chunk.type === 'pause') {
            const silPath = join(
              tmpdir(),
              `sil-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.wav`
            )
            generateSilenceWav(chunk.duration, silPath)
            chunkWavs.push(silPath)
          } else {
            const wavPath = await piperSynthesize(chunk.content, piperExe, modelPath, lengthScale)
            chunkWavs.push(wavPath)
          }
        }

        if (chunkWavs.length === 0) continue

        // Concatenate this block's chunks into one WAV
        const blockWav = join(
          tmpdir(),
          `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.wav`
        )
        await concatWavFiles(chunkWavs, blockWav)
        cleanupFiles(...chunkWavs)
        blockWavPaths.push(blockWav)
      }

      if (blockWavPaths.length === 0) throw new Error('No audio blocks generated')

      // Concatenate all block WAVs into final output
      const finalWav = join(tmpdir(), `multi-tts-final-${Date.now()}.wav`)
      await concatWavFiles(blockWavPaths, finalWav)

      const wavBuffer = readFileSync(finalWav)
      const base64 = wavBuffer.toString('base64')
      const dataUri = `data:audio/wav;base64,${base64}`

      cleanupFiles(finalWav, ...blockWavPaths)
      return dataUri
    } catch (err) {
      cleanupFiles(...blockWavPaths)
      throw err
    }
  })

  // ----- Mock Voice Training -----
  ipcMain.handle('start-voice-training', async () => {
    // Simulate training delay
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return { success: false, message: 'GPU_NOT_FOUND' }
  })
}

// ---------------------------------------------------------------------------
// App Lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron.mb-tts')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
