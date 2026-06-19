import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  searchPatients: (p: { field: 'nom' | 'prenom' | 'code'; value: string }) =>
    ipcRenderer.invoke('patients:search', p),
  loadMorePatients: (p: {
    field: 'nom' | 'prenom' | 'code'
    direction: 'before' | 'after'
    anchor: { nom?: string | null; prenom?: string | null; n_dossier?: string | null; compteur: number }
  }) => ipcRenderer.invoke('patients:load-more', p),
  getPatient: (compteur: number) => ipcRenderer.invoke('patients:get', compteur),
  getConsultations: (compteur: number) => ipcRenderer.invoke('patients:consultations', compteur),
  lookupSearch: (p: { source: string; value: string }) => ipcRenderer.invoke('lookup:search', p),
  lookupLoadMore: (p: { source: string; value: string; anchor: string }) => ipcRenderer.invoke('lookup:load-more', p)
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
