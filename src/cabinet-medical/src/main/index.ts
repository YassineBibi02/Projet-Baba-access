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
  const SN  = "UPPER(TRIM(COALESCE(nom,'')))"
  const SP  = "UPPER(TRIM(COALESCE(prenom,'')))"
  const SND = "TRIM(COALESCE(n_dossier,''))"
  // Sort key for Access date format M/D/YYYY → integer YYYYMMDD (e.g. 19851231) for correct chronological ORDER BY
  const _r   = "SUBSTR(date_de_naissance,INSTR(date_de_naissance,'/')+1)"
  const SDDN = `(CAST(SUBSTR(${_r},INSTR(${_r},'/')+1,4) AS INTEGER)*10000 + CAST(SUBSTR(date_de_naissance,1,INSTR(date_de_naissance,'/')-1) AS INTEGER)*100 + CAST(SUBSTR(${_r},1,INSTR(${_r},'/')-1) AS INTEGER))`

  // patients:search
  // - empty value  → first 2500 rows in trimmed alphabetical order (browse mode)
  // - typed value  → 500 before seek + 2000 after seek
  // Returns { rows, seekIndex, hasBefore, hasAfter }
  ipcMain.handle(
    'patients:search',
    (_event, p: { field: 'nom' | 'prenom' | 'code' | 'ddn'; value: string }) => {
      if (!db) return { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }
      const v = p.value.trim()

      // ── Browse mode (empty field) ──────────────────────────────────────────
      if (!v) {
        let sql: string
        if (p.field === 'nom') {
          sql = `SELECT ${cols} FROM app_patients ORDER BY ${SN}, ${SP}, compteur LIMIT 2501`
        } else if (p.field === 'prenom') {
          sql = `SELECT ${cols} FROM app_patients ORDER BY ${SP}, ${SN}, compteur LIMIT 2501`
        } else if (p.field === 'ddn') {
          sql = `SELECT ${cols} FROM app_patients WHERE date_de_naissance IS NOT NULL AND TRIM(date_de_naissance) != '' ORDER BY ${SDDN}, compteur LIMIT 2501`
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
        const q = v.toUpperCase()
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

      // ddn: convert DD/MM[/YYYY] → Access M/D/YYYY LIKE pattern
      if (p.field === 'ddn') {
        const parts = v.split('/')
        const dd = parseInt(parts[0] ?? '', 10)
        const mm = parseInt(parts[1] ?? '', 10)
        if (!dd || !mm) return { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }
        const yyyy = parts[2] ? parts[2] : null
        const pattern = yyyy ? `${mm}/${dd}/${yyyy}%` : `${mm}/${dd}/%`
        const rows = getStmt(
          `SELECT ${cols} FROM app_patients WHERE date_de_naissance LIKE ? ORDER BY ${SDDN}, compteur LIMIT 1001`
        ).all(pattern) as unknown[]
        const hasAfter = rows.length > 1000
        return { rows: rows.slice(0, 1000), seekIndex: 0, hasBefore: false, hasAfter }
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
      field: 'nom' | 'prenom' | 'code' | 'ddn'
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

  // Shared source definitions for lookup dropdowns — distinct values per column
  const LOOKUP_SOURCES: Record<string, string> = {
    lieu_naissance:     `SELECT DISTINCT TRIM(lieu_de_naissance)      AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(lieu_de_naissance,''))      != ''`,
    adresse:            `SELECT DISTINCT TRIM(adresse)                AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(adresse,''))                != ''`,
    ville:              `SELECT DISTINCT TRIM(ville)                  AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(ville,''))                  != ''`,
    code_ville:         `SELECT DISTINCT TRIM(code_ville)             AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(code_ville,''))             != ''`,
    gouvernorat:        `SELECT DISTINCT TRIM(gouvernorat_ou_pays)    AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(gouvernorat_ou_pays,''))    != ''`,
    profession:         `SELECT DISTINCT TRIM(profession)             AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(profession,''))             != ''`,
    employeur:          `SELECT DISTINCT TRIM(employeur)              AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(employeur,''))              != ''`,
    activite_employeur: `SELECT DISTINCT TRIM(activite_employeur)    AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(activite_employeur,''))    != ''`,
    adresse_prof:       `SELECT DISTINCT TRIM(adresse_profession)    AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(adresse_profession,''))    != ''`,
    ville_prof:         `SELECT DISTINCT TRIM(ville_profession)      AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(ville_profession,''))      != ''`,
    code_ville_prof:    `SELECT DISTINCT TRIM(code_ville_profession) AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(code_ville_profession,'')) != ''`,
    proche:             `SELECT DISTINCT TRIM(proche)                 AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(proche,''))                 != ''`,
    statut:             `SELECT DISTINCT TRIM(statut)                 AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(statut,''))                 != ''`,
    situation_famille:  `SELECT DISTINCT TRIM(situation_de_famille)  AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(situation_de_famille,''))  != ''`,
    sexe:               `SELECT DISTINCT TRIM(sexe)                   AS val FROM raw_t_fiche_administrative WHERE TRIM(COALESCE(sexe,''))                   != ''`,
  }

  // lookup:search — returns first 2500 distinct values alphabetically, plus hasAfter flag
  ipcMain.handle('lookup:search', (_event, p: { source: string; value: string }) => {
    if (!db) return { vals: [], hasAfter: false }
    const baseSql = LOOKUP_SOURCES[p.source]
    if (!baseSql) return { vals: [], hasAfter: false }
    const v = p.value.trim()
    const LIMIT = 2501
    let rows: { val: string }[]
    if (v) {
      rows = getStmt(`SELECT val FROM (${baseSql}) WHERE val LIKE ? ORDER BY val LIMIT ${LIMIT}`).all('%' + v + '%') as { val: string }[]
    } else {
      rows = getStmt(`SELECT val FROM (${baseSql}) ORDER BY val LIMIT ${LIMIT}`).all() as { val: string }[]
    }
    return { vals: rows.slice(0, 2500).map(r => r.val), hasAfter: rows.length === LIMIT }
  })

  // lookup:load-more — cursor-based: returns next 500 values after anchor
  ipcMain.handle('lookup:load-more', (_event, p: { source: string; value: string; anchor: string }) => {
    if (!db) return { vals: [], hasAfter: false }
    const baseSql = LOOKUP_SOURCES[p.source]
    if (!baseSql) return { vals: [], hasAfter: false }
    const v = p.value.trim()
    const LIMIT = 501
    let rows: { val: string }[]
    if (v) {
      rows = getStmt(`SELECT val FROM (${baseSql}) WHERE val LIKE ? AND val > ? ORDER BY val LIMIT ${LIMIT}`).all('%' + v + '%', p.anchor) as { val: string }[]
    } else {
      rows = getStmt(`SELECT val FROM (${baseSql}) WHERE val > ? ORDER BY val LIMIT ${LIMIT}`).all(p.anchor) as { val: string }[]
    }
    return { vals: rows.slice(0, 500).map(r => r.val), hasAfter: rows.length === LIMIT }
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

  // patients:next-dossier — read the last patient's n_dossier, increment its leading number
  ipcMain.handle('patients:next-dossier', () => {
    if (!db) return ''
    const row = db
      .prepare(
        `SELECT n_dossier FROM app_patients WHERE n_dossier IS NOT NULL AND TRIM(n_dossier) != '' ORDER BY compteur DESC LIMIT 1`
      )
      .get() as { n_dossier: string } | undefined
    if (!row?.n_dossier) return '1'
    const match = row.n_dossier.trim().match(/^(\d+)(.*)$/)
    if (!match) return row.n_dossier
    return String(parseInt(match[1], 10) + 1) + match[2]
  })

  // patients:create — insert into the raw source table (app_patients is a read-only view)
  // compteur is stored as TEXT in raw_t_fiche_administrative; derive next value via CAST
  ipcMain.handle('patients:create', (_event, data: Record<string, string | number | null>) => {
    if (!db) return { ok: false, error: 'No database' }
    try {
      const maxRow = db
        .prepare('SELECT MAX(CAST(compteur AS INTEGER)) AS max_c FROM raw_t_fiche_administrative')
        .get() as { max_c: number | null }
      const nextCompteur = (maxRow.max_c ?? 0) + 1
      db.prepare(`
        INSERT INTO raw_t_fiche_administrative (
          compteur, nom, nom_jeune_fille, prenom, n_dossier,
          date_de_naissance, lieu_de_naissance, sexe, situation_de_famille,
          adresse, ville, code_ville, gouvernorat_ou_pays,
          profession, employeur, activite_employeur,
          adresse_profession, ville_profession, code_ville_profession,
          tel_bureau, tel_domicile, proche, tel_proche,
          n_affiliation, statut, couverture_sociale,
          date_1ere_consultation, notesstate, remarques
        ) VALUES (
          @compteur, @nom, @nom_jeune_fille, @prenom, @n_dossier,
          @date_de_naissance, @lieu_de_naissance, @sexe, @situation_de_famille,
          @adresse, @ville, @code_ville, @gouvernorat_ou_pays,
          @profession, @employeur, @activite_employeur,
          @adresse_profession, @ville_profession, @code_ville_profession,
          @tel_bureau, @tel_domicile, @proche, @tel_proche,
          @n_affiliation, @statut, @couverture_sociale,
          @date_1ere_consultation, @notesstate, @remarques
        )
      `).run({ compteur: String(nextCompteur), ...data })
      return { ok: true, compteur: nextCompteur }
    } catch (e: unknown) {
      return { ok: false, error: String(e) }
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
