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

  const cols = 'compteur, nom, prenom, n_dossier, date_de_naissance, ville, tel_domicile'

  // Helpers — sort keys using TRIM so leading-space entries sort with their letter group.
  // All ORDER BY / WHERE clauses use the same expression for consistency.
  const SN  = "TRIM(COALESCE(nom,''))"
  const SP  = "TRIM(COALESCE(prenom,''))"
  const SND = "TRIM(COALESCE(n_dossier,''))"

  // patients:search
  // - empty value  → first 2500 rows in trimmed alphabetical order (browse mode)
  // - typed value  → 500 before seek + 2000 after seek
  // Returns { rows, seekIndex, hasBefore, hasAfter }
  ipcMain.handle(
    'patients:search',
    (_event, p: { field: 'nom' | 'prenom' | 'code'; value: string }) => {
      if (!db) return { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }
      const v = p.value.trim()

      // ── Browse mode (empty field) ──────────────────────────────────────────
      if (!v) {
        let sql: string
        if (p.field === 'nom') {
          sql = `SELECT ${cols} FROM app_patients ORDER BY ${SN}, ${SP}, compteur LIMIT 2501`
        } else if (p.field === 'prenom') {
          sql = `SELECT ${cols} FROM app_patients ORDER BY ${SP}, ${SN}, compteur LIMIT 2501`
        } else {
          sql = `SELECT ${cols} FROM app_patients ORDER BY ${SND}, compteur LIMIT 2501`
        }
        const rows = getStmt(sql).all() as unknown[]
        const hasAfter = rows.length > 2500
        return { rows: rows.slice(0, 2500), seekIndex: 0, hasBefore: false, hasAfter }
      }

      // ── Seek mode (typed value) ────────────────────────────────────────────
      if (p.field === 'nom') {
        const q = v.toUpperCase()
        const before = (getStmt(
          `SELECT ${cols} FROM app_patients WHERE ${SN} < ? ORDER BY ${SN} DESC, ${SP} DESC, compteur DESC LIMIT 500`
        ).all(q) as unknown[]).reverse()
        const after = getStmt(
          `SELECT ${cols} FROM app_patients WHERE ${SN} >= ? ORDER BY ${SN}, ${SP}, compteur LIMIT 2000`
        ).all(q) as unknown[]
        return {
          rows: [...before, ...after],
          seekIndex: before.length,
          hasBefore: before.length === 500,
          hasAfter: after.length === 2000,
        }
      }

      if (p.field === 'prenom') {
        const q = v.charAt(0).toUpperCase() + v.slice(1)
        const before = (getStmt(
          `SELECT ${cols} FROM app_patients WHERE ${SP} < ? ORDER BY ${SP} DESC, ${SN} DESC, compteur DESC LIMIT 500`
        ).all(q) as unknown[]).reverse()
        const after = getStmt(
          `SELECT ${cols} FROM app_patients WHERE ${SP} >= ? ORDER BY ${SP}, ${SN}, compteur LIMIT 2000`
        ).all(q) as unknown[]
        return {
          rows: [...before, ...after],
          seekIndex: before.length,
          hasBefore: before.length === 500,
          hasAfter: after.length === 2000,
        }
      }

      // code: substring match
      const rows = getStmt(
        `SELECT ${cols} FROM app_patients WHERE n_dossier LIKE ? ORDER BY ${SND}, compteur LIMIT 1000`
      ).all('%' + v + '%') as unknown[]
      return { rows, seekIndex: 0, hasBefore: false, hasAfter: rows.length === 1000 }
    }
  )

  // patients:load-more — cursor-based pagination using trimmed sort keys
  // Returns { rows, hasMore }
  ipcMain.handle(
    'patients:load-more',
    (_event, p: {
      field: 'nom' | 'prenom' | 'code'
      direction: 'before' | 'after'
      anchor: { nom?: string | null; prenom?: string | null; n_dossier?: string | null; compteur: number }
    }) => {
      if (!db) return { rows: [], hasMore: false }
      const LIMIT = 501

      if (p.field === 'nom') {
        const n  = (p.anchor.nom  ?? '').trim()
        const pr = (p.anchor.prenom ?? '').trim()
        const c  = p.anchor.compteur
        if (p.direction === 'after') {
          const rows = getStmt(`
            SELECT ${cols} FROM app_patients
            WHERE ${SN} > ?
              OR (${SN} = ? AND ${SP} > ?)
              OR (${SN} = ? AND ${SP} = ? AND compteur > ?)
            ORDER BY ${SN}, ${SP}, compteur LIMIT ${LIMIT}
          `).all(n, n, pr, n, pr, c) as unknown[]
          return { rows: rows.slice(0, 500), hasMore: rows.length === LIMIT }
        } else {
          const rows = (getStmt(`
            SELECT ${cols} FROM app_patients
            WHERE ${SN} < ?
              OR (${SN} = ? AND ${SP} < ?)
              OR (${SN} = ? AND ${SP} = ? AND compteur < ?)
            ORDER BY ${SN} DESC, ${SP} DESC, compteur DESC LIMIT ${LIMIT}
          `).all(n, n, pr, n, pr, c) as unknown[]).reverse()
          const hasMore = rows.length === LIMIT
          return { rows: rows.slice(hasMore ? 1 : 0), hasMore }
        }
      }

      if (p.field === 'prenom') {
        const pr = (p.anchor.prenom ?? '').trim()
        const n  = (p.anchor.nom  ?? '').trim()
        const c  = p.anchor.compteur
        if (p.direction === 'after') {
          const rows = getStmt(`
            SELECT ${cols} FROM app_patients
            WHERE ${SP} > ?
              OR (${SP} = ? AND ${SN} > ?)
              OR (${SP} = ? AND ${SN} = ? AND compteur > ?)
            ORDER BY ${SP}, ${SN}, compteur LIMIT ${LIMIT}
          `).all(pr, pr, n, pr, n, c) as unknown[]
          return { rows: rows.slice(0, 500), hasMore: rows.length === LIMIT }
        } else {
          const rows = (getStmt(`
            SELECT ${cols} FROM app_patients
            WHERE ${SP} < ?
              OR (${SP} = ? AND ${SN} < ?)
              OR (${SP} = ? AND ${SN} = ? AND compteur < ?)
            ORDER BY ${SP} DESC, ${SN} DESC, compteur DESC LIMIT ${LIMIT}
          `).all(pr, pr, n, pr, n, c) as unknown[]).reverse()
          const hasMore = rows.length === LIMIT
          return { rows: rows.slice(hasMore ? 1 : 0), hasMore }
        }
      }

      // code field
      const nd = (p.anchor.n_dossier ?? '').trim()
      const c  = p.anchor.compteur
      if (p.direction === 'after') {
        const rows = getStmt(`
          SELECT ${cols} FROM app_patients
          WHERE ${SND} > ?
            OR (${SND} = ? AND compteur > ?)
          ORDER BY ${SND}, compteur LIMIT ${LIMIT}
        `).all(nd, nd, c) as unknown[]
        return { rows: rows.slice(0, 500), hasMore: rows.length === LIMIT }
      } else {
        const rows = (getStmt(`
          SELECT ${cols} FROM app_patients
          WHERE ${SND} < ?
            OR (${SND} = ? AND compteur < ?)
          ORDER BY ${SND} DESC, compteur DESC LIMIT ${LIMIT}
        `).all(nd, nd, c) as unknown[]).reverse()
        const hasMore = rows.length === LIMIT
        return { rows: rows.slice(hasMore ? 1 : 0), hasMore }
      }
    }
  )

  ipcMain.handle('patients:get', (_event, compteur: number) => {
    if (!db) return null
    return getStmt('SELECT * FROM app_patients WHERE compteur = ?').get(compteur) ?? null
  })

  // lookup:search — distinct autocomplete values from patient data
  // source maps to a column in raw_t_fiche_administrative
  // value filters with LIKE (starts-with ranked first); returns up to 50 rows
  ipcMain.handle('lookup:search', (_event, p: { source: string; value: string }) => {
    if (!db) return []
    const SOURCES: Record<string, string> = {
      lieu_naissance:     `SELECT DISTINCT TRIM(lieu_de_naissance)    AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(lieu_de_naissance,''))    != '' AND TRIM(lieu_de_naissance)    NOT GLOB '[0-9./*]*' AND LENGTH(TRIM(lieu_de_naissance))    >= 3`,
      adresse:            `SELECT DISTINCT TRIM(adresse)              AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(adresse,''))              != '' AND LENGTH(TRIM(adresse))              >= 3`,
      ville:              `SELECT DISTINCT TRIM(ville)                AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(ville,''))                != '' AND LENGTH(TRIM(ville))                >= 2`,
      code_ville:         `SELECT DISTINCT TRIM(code_ville)           AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(code_ville,''))           != '' AND LENGTH(TRIM(code_ville))           >= 2`,
      gouvernorat:        `SELECT DISTINCT TRIM(gouvernorat_ou_pays)  AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(gouvernorat_ou_pays,''))  != '' AND LENGTH(TRIM(gouvernorat_ou_pays))  >= 2`,
      profession:         `SELECT DISTINCT TRIM(profession)           AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(profession,''))           != '' AND LENGTH(TRIM(profession))           >= 2`,
      employeur:          `SELECT DISTINCT TRIM(employeur)            AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(employeur,''))            != '' AND LENGTH(TRIM(employeur))            >= 2`,
      activite_employeur: `SELECT DISTINCT TRIM(activite_employeur)  AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(activite_employeur,''))  != '' AND LENGTH(TRIM(activite_employeur))  >= 2`,
      adresse_prof:       `SELECT DISTINCT TRIM(adresse_profession)  AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(adresse_profession,''))  != '' AND LENGTH(TRIM(adresse_profession))  >= 3`,
      ville_prof:         `SELECT DISTINCT TRIM(ville_profession)    AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(ville_profession,''))    != '' AND LENGTH(TRIM(ville_profession))    >= 2`,
      code_ville_prof:    `SELECT DISTINCT TRIM(code_ville_profession) AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(code_ville_profession,'')) != '' AND LENGTH(TRIM(code_ville_profession)) >= 2`,
      proche:             `SELECT DISTINCT TRIM(proche)               AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(proche,''))               != '' AND LENGTH(TRIM(proche))               >= 2`,
      statut:             `SELECT DISTINCT TRIM(statut)               AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(statut,''))               != '' AND LENGTH(TRIM(statut))               >= 2`,
      situation_famille:  `SELECT DISTINCT TRIM(situation_de_famille) AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(situation_de_famille,'')) != '' AND TRIM(situation_de_famille) NOT GLOB '[0-9*/+]*' AND LENGTH(TRIM(situation_de_famille)) >= 3`,
    }
    const baseSql = SOURCES[p.source]
    if (!baseSql) return []
    const v = p.value.trim()
    if (v) {
      return getStmt(
        `SELECT val FROM (${baseSql}) WHERE val LIKE ? ORDER BY CASE WHEN val LIKE ? THEN 0 ELSE 1 END, val LIMIT 50`
      ).all('%' + v + '%', v + '%')
    }
    return getStmt(`SELECT val FROM (${baseSql}) ORDER BY val LIMIT 50`).all()
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
