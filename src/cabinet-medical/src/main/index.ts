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

  ipcMain.handle(
    'patients:search',
    (_event, p: { field: 'nom' | 'prenom' | 'code' | 'ddn'; value: string }) => {
      if (!db) return { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }

      const v    = p.value.trim()
      const cols = 'compteur, nom, prenom, n_dossier, date_de_naissance, ville, tel_domicile'

      // Access M/D/YYYY → sort integer YYYYMMDD
      const _r   = "SUBSTR(date_de_naissance,INSTR(date_de_naissance,'/')+1)"
      const SDDN = `(CAST(SUBSTR(${_r},INSTR(${_r},'/')+1,4) AS INTEGER)*10000 + CAST(SUBSTR(date_de_naissance,1,INSTR(date_de_naissance,'/')-1) AS INTEGER)*100 + CAST(SUBSTR(${_r},1,INSTR(${_r},'/')-1) AS INTEGER))`
      // n_dossier "XXXX/YY" → sort by numeric part before '/'
      const SCODE = `CAST(CASE WHEN INSTR(n_dossier,'/') > 0 THEN SUBSTR(n_dossier,1,INSTR(n_dossier,'/')-1) ELSE n_dossier END AS INTEGER)`

      if (!v) {
        // Browse mode — clicking an empty field opens the full sorted list
        if (p.field === 'nom') {
          const rows = getStmt(`SELECT ${cols} FROM app_patients ORDER BY UPPER(TRIM(nom)), UPPER(TRIM(prenom)) LIMIT 2501`).all()
          const hasAfter = rows.length > 2500
          return { rows: (rows as unknown[]).slice(0, 2500), seekIndex: 0, hasBefore: false, hasAfter }
        }
        if (p.field === 'prenom') {
          const rows = getStmt(`SELECT ${cols} FROM app_patients ORDER BY UPPER(TRIM(prenom)), UPPER(TRIM(nom)) LIMIT 2501`).all()
          const hasAfter = rows.length > 2500
          return { rows: (rows as unknown[]).slice(0, 2500), seekIndex: 0, hasBefore: false, hasAfter }
        }
        if (p.field === 'code') {
          const rows = getStmt(`SELECT ${cols} FROM app_patients WHERE n_dossier IS NOT NULL AND TRIM(n_dossier) != '' ORDER BY ${SCODE}, n_dossier LIMIT 2501`).all()
          const hasAfter = rows.length > 2500
          return { rows: (rows as unknown[]).slice(0, 2500), seekIndex: 0, hasBefore: false, hasAfter }
        }
        if (p.field === 'ddn') {
          const rows = getStmt(`SELECT ${cols} FROM app_patients WHERE date_de_naissance IS NOT NULL AND TRIM(date_de_naissance) != '' ORDER BY ${SDDN}, compteur LIMIT 2501`).all()
          const hasAfter = rows.length > 2500
          return { rows: (rows as unknown[]).slice(0, 2500), seekIndex: 0, hasBefore: false, hasAfter }
        }
        return { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }
      }

      // Seek modes
      if (p.field === 'nom') {
        const q      = v.toUpperCase()
        const before = (getStmt(
          `SELECT ${cols} FROM app_patients WHERE UPPER(TRIM(nom)) < ? ORDER BY UPPER(TRIM(nom)) DESC, UPPER(TRIM(prenom)) DESC LIMIT 500`
        ).all(q) as unknown[]).reverse()
        const after  = getStmt(
          `SELECT ${cols} FROM app_patients WHERE UPPER(TRIM(nom)) >= ? ORDER BY UPPER(TRIM(nom)), UPPER(TRIM(prenom)) LIMIT 2000`
        ).all(q)
        return { rows: [...before, ...after], seekIndex: before.length, hasBefore: false, hasAfter: false }
      }

      if (p.field === 'prenom') {
        const q      = v.toUpperCase()
        const before = (getStmt(
          `SELECT ${cols} FROM app_patients WHERE UPPER(TRIM(prenom)) < ? ORDER BY UPPER(TRIM(prenom)) DESC, UPPER(TRIM(nom)) DESC LIMIT 500`
        ).all(q) as unknown[]).reverse()
        const after  = getStmt(
          `SELECT ${cols} FROM app_patients WHERE UPPER(TRIM(prenom)) >= ? ORDER BY UPPER(TRIM(prenom)), UPPER(TRIM(nom)) LIMIT 2000`
        ).all(q)
        return { rows: [...before, ...after], seekIndex: before.length, hasBefore: false, hasAfter: false }
      }

      if (p.field === 'ddn') {
        const parts = v.split('/')
        const dd    = parseInt(parts[0] ?? '', 10)
        const mm    = parseInt(parts[1] ?? '', 10)
        if (!dd || !mm) return { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }
        const yyyy    = parts[2] ?? null
        const pattern = yyyy ? `${mm}/${dd}/${yyyy}%` : `${mm}/${dd}/%`
        const rows    = getStmt(
          `SELECT ${cols} FROM app_patients WHERE date_de_naissance LIKE ? ORDER BY ${SDDN}, compteur LIMIT 1001`
        ).all(pattern) as unknown[]
        const hasAfter = rows.length > 1000
        return { rows: rows.slice(0, 1000), seekIndex: 0, hasBefore: false, hasAfter }
      }

      // code: substring match sorted by numeric part before '/'
      const rows = getStmt(
        `SELECT ${cols} FROM app_patients WHERE n_dossier LIKE ? ORDER BY ${SCODE}, n_dossier LIMIT 1000`
      ).all('%' + v + '%')
      return { rows, seekIndex: 0, hasBefore: false, hasAfter: false }
    }
  )

  ipcMain.handle(
    'patients:load-more',
    (_event, p: {
      field: 'nom' | 'prenom' | 'code'
      direction: 'before' | 'after'
      anchor: { nom: string | null; prenom: string | null; n_dossier: string | null; compteur: number }
    }) => {
      if (!db) return { rows: [], hasMore: false }
      const cols  = 'compteur, nom, prenom, n_dossier, date_de_naissance, ville, tel_domicile'
      const SCODE = `CAST(CASE WHEN INSTR(n_dossier,'/') > 0 THEN SUBSTR(n_dossier,1,INSTR(n_dossier,'/')-1) ELSE n_dossier END AS INTEGER)`
      const fwd   = p.direction === 'after'
      const cpt   = p.anchor.compteur

      if (p.field === 'nom') {
        const n  = (p.anchor.nom    ?? '').toUpperCase()
        const pr = (p.anchor.prenom ?? '').toUpperCase()
        const rows = fwd
          ? getStmt(`SELECT ${cols} FROM app_patients WHERE UPPER(nom) > @n OR (UPPER(nom) = @n AND UPPER(prenom) > @pr) OR (UPPER(nom) = @n AND UPPER(prenom) = @pr AND CAST(compteur AS INTEGER) > @cpt) ORDER BY UPPER(nom) ASC, UPPER(prenom) ASC, CAST(compteur AS INTEGER) ASC LIMIT 501`).all({ n, pr, cpt })
          : (getStmt(`SELECT ${cols} FROM app_patients WHERE UPPER(nom) < @n OR (UPPER(nom) = @n AND UPPER(prenom) < @pr) OR (UPPER(nom) = @n AND UPPER(prenom) = @pr AND CAST(compteur AS INTEGER) < @cpt) ORDER BY UPPER(nom) DESC, UPPER(prenom) DESC, CAST(compteur AS INTEGER) DESC LIMIT 501`).all({ n, pr, cpt }) as unknown[]).reverse()
        const hasMore = rows.length > 500
        return { rows: (rows as unknown[]).slice(0, 500), hasMore }
      }

      if (p.field === 'prenom') {
        const pr = (p.anchor.prenom ?? '').toUpperCase()
        const n  = (p.anchor.nom    ?? '').toUpperCase()
        const rows = fwd
          ? getStmt(`SELECT ${cols} FROM app_patients WHERE UPPER(prenom) > @pr OR (UPPER(prenom) = @pr AND UPPER(nom) > @n) OR (UPPER(prenom) = @pr AND UPPER(nom) = @n AND CAST(compteur AS INTEGER) > @cpt) ORDER BY UPPER(prenom) ASC, UPPER(nom) ASC, CAST(compteur AS INTEGER) ASC LIMIT 501`).all({ pr, n, cpt })
          : (getStmt(`SELECT ${cols} FROM app_patients WHERE UPPER(prenom) < @pr OR (UPPER(prenom) = @pr AND UPPER(nom) < @n) OR (UPPER(prenom) = @pr AND UPPER(nom) = @n AND CAST(compteur AS INTEGER) < @cpt) ORDER BY UPPER(prenom) DESC, UPPER(nom) DESC, CAST(compteur AS INTEGER) DESC LIMIT 501`).all({ pr, n, cpt }) as unknown[]).reverse()
        const hasMore = rows.length > 500
        return { rows: (rows as unknown[]).slice(0, 500), hasMore }
      }

      // code
      const nd = p.anchor.n_dossier ?? ''
      const sc = parseInt(nd.split('/')[0] ?? '0', 10)
      const rows = fwd
        ? getStmt(`SELECT ${cols} FROM app_patients WHERE ${SCODE} > @sc OR (${SCODE} = @sc AND n_dossier > @nd) OR (n_dossier = @nd AND CAST(compteur AS INTEGER) > @cpt) ORDER BY ${SCODE} ASC, n_dossier ASC, CAST(compteur AS INTEGER) ASC LIMIT 501`).all({ sc, nd, cpt })
        : (getStmt(`SELECT ${cols} FROM app_patients WHERE ${SCODE} < @sc OR (${SCODE} = @sc AND n_dossier < @nd) OR (n_dossier = @nd AND CAST(compteur AS INTEGER) < @cpt) ORDER BY ${SCODE} DESC, n_dossier DESC, CAST(compteur AS INTEGER) DESC LIMIT 501`).all({ sc, nd, cpt }) as unknown[]).reverse()
      const hasMore = rows.length > 500
      return { rows: (rows as unknown[]).slice(0, 500), hasMore }
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

  // patients:delete — permanently remove a record by compteur
  ipcMain.handle('patients:delete', (_event, compteur: number) => {
    if (!db) return { ok: false, error: 'No database' }
    try {
      db.prepare('DELETE FROM raw_t_fiche_administrative WHERE CAST(compteur AS INTEGER) = ?').run(compteur)
      return { ok: true }
    } catch (e: unknown) {
      return { ok: false, error: String(e) }
    }
  })

  // patients:update — update an existing record by compteur
  ipcMain.handle('patients:update', (_event, compteur: number, data: Record<string, string | number | null>) => {
    if (!db) return { ok: false, error: 'No database' }
    try {
      db.prepare(`
        UPDATE raw_t_fiche_administrative SET
          nom = @nom, nom_jeune_fille = @nom_jeune_fille, prenom = @prenom, n_dossier = @n_dossier,
          date_de_naissance = @date_de_naissance, lieu_de_naissance = @lieu_de_naissance,
          sexe = @sexe, situation_de_famille = @situation_de_famille,
          adresse = @adresse, ville = @ville, code_ville = @code_ville, gouvernorat_ou_pays = @gouvernorat_ou_pays,
          profession = @profession, employeur = @employeur, activite_employeur = @activite_employeur,
          adresse_profession = @adresse_profession, ville_profession = @ville_profession,
          code_ville_profession = @code_ville_profession,
          tel_bureau = @tel_bureau, tel_domicile = @tel_domicile, proche = @proche, tel_proche = @tel_proche,
          n_affiliation = @n_affiliation, statut = @statut, couverture_sociale = @couverture_sociale,
          date_1ere_consultation = @date_1ere_consultation, notesstate = @notesstate, remarques = @remarques
        WHERE CAST(compteur AS INTEGER) = @cpt
      `).run({ cpt: compteur, ...data })
      return { ok: true }
    } catch (e: unknown) {
      return { ok: false, error: String(e) }
    }
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
