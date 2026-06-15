import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'

let db: Database.Database | null = null
const stmtCache = new Map<string, Database.Statement>()

function openDatabase(): void {
  const dbPath = is.dev
    ? join(app.getAppPath(), 'data/patients.sqlite')
    : join(process.resourcesPath, 'data/patients.sqlite')
  db = new Database(dbPath, { readonly: true })
}

function getStmt(sql: string): Database.Statement {
  if (!stmtCache.has(sql)) stmtCache.set(sql, db!.prepare(sql))
  return stmtCache.get(sql)!
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    fullscreen: false,
    backgroundColor: '#065f46',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  openDatabase()

  ipcMain.handle(
    'patients:search',
    (_event, query: string, field: 'nom' | 'prenom' | 'code') => {
      if (!db || !query || query.trim().length === 0) return []
      const col =
        field === 'nom' ? 'nom' : field === 'prenom' ? 'prenom' : 'numero_dossier'
      const sql = `
        SELECT compteur, nom, prenom, numero_dossier, date_naissance, ville, tel_domicile
        FROM patients
        WHERE ${col} LIKE ?
        ORDER BY nom, prenom
        LIMIT 60
      `
      return getStmt(sql).all(`%${query.trim()}%`)
    }
  )

  ipcMain.handle('patients:get', (_event, compteur: number) => {
    if (!db) return null
    return getStmt('SELECT * FROM patients WHERE compteur = ?').get(compteur) ?? null
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
