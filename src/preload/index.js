import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  generateTTS: (text, modelName, speed) =>
    ipcRenderer.invoke('generate-tts', { text, modelName, speed }),
  getDictionary: () => ipcRenderer.invoke('get-dictionary'),
  saveDictionary: (dict) => ipcRenderer.invoke('save-dictionary', dict),
  getModels: () => ipcRenderer.invoke('get-models'),
  getBgmList: () => ipcRenderer.invoke('get-bgm-list'),
  getBgmFile: (filename) => ipcRenderer.invoke('get-bgm-file', filename),
  exportMixedAudio: (payload) => ipcRenderer.invoke('export-mixed-audio', payload),
  getLocalVoices: () => ipcRenderer.invoke('get-local-voices'),
  importLocalVoice: () => ipcRenderer.invoke('import-local-voice'),
  deleteLocalVoice: (filename) => ipcRenderer.invoke('delete-local-voice', filename),
  getDrafts: () => ipcRenderer.invoke('get-drafts'),
  saveDraft: (draft) => ipcRenderer.invoke('save-draft', draft),
  deleteDraft: (id) => ipcRenderer.invoke('delete-draft', id),
  generateMultiTTS: (payload) => ipcRenderer.invoke('generate-multi-tts', payload),
  previewWord: (payload) => ipcRenderer.invoke('preview-word', payload),
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  openBgmFolder: () => ipcRenderer.invoke('open-bgm-folder')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
