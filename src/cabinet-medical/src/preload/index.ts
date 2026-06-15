import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  searchPatients: (p: { field: 'nom' | 'prenom' | 'code'; value: string }) =>
    ipcRenderer.invoke('patients:search', p),
  getPatient: (compteur: number) => ipcRenderer.invoke('patients:get', compteur)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
