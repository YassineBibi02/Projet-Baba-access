import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  searchPatients: (query: string, field: 'nom' | 'prenom' | 'code') =>
    ipcRenderer.invoke('patients:search', query, field),
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
