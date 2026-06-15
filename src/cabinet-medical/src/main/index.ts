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

  db = new Database(dbPath)
  db.pragma('cache_size = -8000')

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_patients_prenom ON patients (prenom)')
  } catch {
    // non-fatal on OneDrive / read-only file systems
  }
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

  // Each field seeks independently through the full sorted list — no cross-field filtering.
  // nom/prenom use >= so the list "jumps to" that alphabetical position and shows everything from there.
  // code uses LIKE because dossier numbers aren't naturally seeked by prefix.
  ipcMain.handle(
    'patients:search',
    (_event, p: { field: 'nom' | 'prenom' | 'code'; value: string }) => {
      if (!db || !p.value.trim()) return []
      const v = p.value.trim()
      const cols = 'compteur, nom, prenom, numero_dossier, date_naissance, ville, tel_domicile'

      if (p.field === 'nom') {
        return getStmt(
          `SELECT ${cols} FROM patients WHERE nom >= ? ORDER BY nom LIMIT 60`
        ).all(v.toUpperCase())
      }
      if (p.field === 'prenom') {
        // Stored in Title Case — match by capitalising the first letter
        const q = v.charAt(0).toUpperCase() + v.slice(1)
        return getStmt(
          `SELECT ${cols} FROM patients WHERE prenom >= ? ORDER BY prenom LIMIT 60`
        ).all(q)
      }
      // code
      return getStmt(
        `SELECT ${cols} FROM patients WHERE numero_dossier LIKE ? ORDER BY numero_dossier LIMIT 60`
      ).all('%' + v + '%')
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
  if (process.platform !== 'darwin') app.quit()
})
