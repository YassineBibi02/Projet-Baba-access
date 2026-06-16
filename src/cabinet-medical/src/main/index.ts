import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Database from 'better-sqlite3'

let db: Database.Database | null = null
const stmtCache = new Map<string, Database.Statement>()

function openDatabase(): void {
  const dbPath = is.dev
    ? join(app.getAppPath(), 'data/access_full.sqlite')
    : join(process.resourcesPath, 'data/access_full.sqlite')

  db = new Database(dbPath)
  db.pragma('cache_size = -8000')
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

  // Returns { rows, seekIndex } where seekIndex is the first row >= the typed value.
  // 500 rows before the seek position + 2000 after = up to 2500 rows, virtually scrolled.
  ipcMain.handle(
    'patients:search',
    (_event, p: { field: 'nom' | 'prenom' | 'code'; value: string }) => {
      if (!db || !p.value.trim()) return { rows: [], seekIndex: 0 }
      const v = p.value.trim()
      const cols = 'compteur, nom, prenom, n_dossier, date_de_naissance, ville, tel_domicile'

      if (p.field === 'nom') {
        const q = v.toUpperCase()
        const before = (getStmt(
          `SELECT ${cols} FROM app_patients WHERE nom < ? ORDER BY nom DESC, prenom DESC LIMIT 500`
        ).all(q) as unknown[]).reverse()
        const after = getStmt(
          `SELECT ${cols} FROM app_patients WHERE nom >= ? ORDER BY nom, prenom LIMIT 2000`
        ).all(q)
        return { rows: [...before, ...after], seekIndex: before.length }
      }

      if (p.field === 'prenom') {
        const q = v.charAt(0).toUpperCase() + v.slice(1)
        const before = (getStmt(
          `SELECT ${cols} FROM app_patients WHERE prenom < ? ORDER BY prenom DESC, nom DESC LIMIT 500`
        ).all(q) as unknown[]).reverse()
        const after = getStmt(
          `SELECT ${cols} FROM app_patients WHERE prenom >= ? ORDER BY prenom, nom LIMIT 2000`
        ).all(q)
        return { rows: [...before, ...after], seekIndex: before.length }
      }

      // code: substring match, no natural seek boundary
      const rows = getStmt(
        `SELECT ${cols} FROM app_patients WHERE n_dossier LIKE ? ORDER BY n_dossier LIMIT 1000`
      ).all('%' + v + '%')
      return { rows, seekIndex: 0 }
    }
  )

  ipcMain.handle('patients:get', (_event, compteur: number) => {
    if (!db) return null
    return getStmt('SELECT * FROM app_patients WHERE compteur = ?').get(compteur) ?? null
  })

  ipcMain.handle('patients:consultations', (_event, compteur: number) => {
    if (!db) return { consultations: [], themes: [] }
    const consultations = getStmt(`
      SELECT c.compteur_consultation, c.numero_dossier_medical, c.numero_consultation,
             c.date_consultation, c.heure_consultation,
             c.remarques_consultations, c.flag_remarques_consultations,
             d.titre_dossier_medical, d.code_dossier_medical
      FROM app_consultations c
      LEFT JOIN app_dossiers d
        ON d.compteur = c.compteur
        AND d.numero_dossier_medical = c.numero_dossier_medical
      WHERE c.compteur = ?
      ORDER BY c.compteur_consultation ASC
      LIMIT 500
    `).all(compteur)
    const themes = getStmt(`
      SELECT compteur_consultation_themes, numero_dossier_medical, numero_consultation,
             titre_theme, contenu_theme, ordre_titre,
             date_theme, heure_theme, flag_examen
      FROM app_consultation_themes
      WHERE compteur = ?
      ORDER BY compteur_consultation_themes ASC
      LIMIT 5000
    `).all(compteur)
    return { consultations, themes }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
