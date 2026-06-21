import { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import './PatientSearch.css'
import ConsultationPage from './ConsultationPage'
import VisuDossier from './VisuDossier'
import NewPatient from './NewPatient'
import { Topbar } from './Topbar'

interface PatientRow {
  compteur: number
  nom: string | null
  prenom: string | null
  n_dossier: string | null
  date_de_naissance: string | null
  ville: string | null
  tel_domicile: string | null
}

interface SearchResult {
  rows: PatientRow[]
  seekIndex: number
  hasBefore: boolean
  hasAfter: boolean
}

interface PatientFull {
  compteur: number
  nom: string | null
  nom_jeune_fille: string | null
  prenom: string | null
  n_dossier: string | null
  matricule: string | null
  date_de_naissance: string | null
  lieu_de_naissance: string | null
  sexe: string | null
  situation_de_famille: string | null
  mr_mme_melle_enfant: string | null
  adresse: string | null
  ville: string | null
  code_ville: string | null
  gouvernorat_ou_pays: string | null
  origine: string | null
  profession: string | null
  employeur: string | null
  activite_employeur: string | null
  adresse_profession: string | null
  ville_profession: string | null
  code_ville_profession: string | null
  tel_bureau: string | null
  tel_domicile: string | null
  proche: string | null
  tel_proche: string | null
  statut: string | null
  couverture_sociale: string | null
  n_affiliation: string | null
  remarques: string | null
  remarques_medicales_importantes: string | null
  date_1ere_consultation: string | null
  notesstate: string | null
  notes: string | null
}

interface ConsultationRow {
  compteur_consultation: number
  numero_dossier_medical: number | null
  numero_consultation: number | null
  date_consultation: string | null
  heure_consultation: string | null
  remarques_consultations: string | null
  flag_remarques_consultations: number | null
  titre_dossier_medical: string | null
  code_dossier_medical: string | null
}

interface ThemeRow {
  compteur_consultation_themes: number
  numero_dossier_medical: number | null
  numero_consultation: number | null
  titre_theme: string | null
  contenu_theme: string | null
  ordre_titre: number | null
  date_theme: string | null
  heure_theme: string | null
  flag_examen: number | null
}

interface ConsultData {
  consultations: ConsultationRow[]
  themes: ThemeRow[]
}

interface Props { onBack: () => void }

const ROW_H_BASE = 36
const VISIBLE_ROWS = 13
const EMPTY: SearchResult = { rows: [], seekIndex: 0, hasBefore: false, hasAfter: false }

// Auto-insert slashes immediately after day (2 digits) and month (4 digits).
// isDeleting prevents re-appending the slash when the user backspaces through it.
function formatDateInput(raw: string, isDeleting = false): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length < 2) return digits
  if (digits.length === 2) return isDeleting ? digits : digits + '/'
  if (digits.length < 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  if (digits.length === 4) return isDeleting
    ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}`
    : `${digits.slice(0, 2)}/${digits.slice(2, 4)}/`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// Access exports dates as "M/D/YYYY H:MM:SS" (US month-first)
function parseAccessDate(raw: string | null): Date | null {
  if (!raw) return null
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const d = new Date(+m[3], +m[1] - 1, +m[2])
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(raw: string | null): string {
  const d = parseAccessDate(raw)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function fmtTime(raw: string | null): string {
  if (!raw) return ''
  const m = raw.match(/(\d{1,2}:\d{2})/)
  return m ? m[1] : ''
}

function calcAge(raw: string | null): string | null {
  const birth = parseAccessDate(raw)
  if (!birth) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let years = now.getFullYear() - birth.getFullYear()
  const bdThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (now < bdThisYear) years--
  if (years < 0) return null
  const lastBd = new Date(
    now.getFullYear() - (now < bdThisYear ? 1 : 0),
    birth.getMonth(),
    birth.getDate()
  )
  const days = Math.round((now.getTime() - lastBd.getTime()) / 86_400_000)
  if (years === 0) {
    const tot = Math.round((now.getTime() - birth.getTime()) / 86_400_000)
    return tot < 31 ? `${tot} jours` : `${Math.floor(tot / 30.44)} mois`
  }
  return days === 0 ? `${years} ans` : `${years} ans ${days} jours`
}

// ── Virtual-scroll seek dropdown ──────────────────────────────────────────────
interface DropProps {
  result: SearchResult
  cursor: number
  onPick: (r: PatientRow) => void
  onHover: (i: number) => void
  header: [string, string, string, string]
  renderRow: (r: PatientRow) => React.ReactNode
  onScrollEdge: (dir: 'before' | 'after') => void
  scrollAdjustRef: React.RefObject<number>
}

function SeekDropdown({ result, cursor, onPick, onHover, header, renderRow, onScrollEdge, scrollAdjustRef }: DropProps) {
  const { rows, seekIndex, hasBefore, hasAfter } = result
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const fromMouseRef = useRef(false)
  const seekAdjustedRef   = useRef(false)
  const edgeCooldownRef   = useRef(false)
  const prependHandledRef = useRef(false)

  const ROW_H = useMemo(() => {
    const s = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim()
    ) || 1
    return Math.round(ROW_H_BASE * s)
  }, [])

  const CONTAINER_H = VISIBLE_ROWS * ROW_H
  const BUFFER = 5

  // Runs synchronously before paint — handles prepend correction here so there
  // is no single-frame flash of wrong rows, and fine-tunes the seek position.
  useLayoutEffect(() => {
    const el = listRef.current
    if (!el) return

    const adj = scrollAdjustRef.current
    if (adj > 0) {
      // Rows prepended: shift scrollTop down by the same amount before the browser paints.
      scrollAdjustRef.current = 0
      prependHandledRef.current = true
      const delta = adj * ROW_H
      el.scrollTop += delta
      setScrollTop(prev => prev + delta)
      return
    }

    // Fine-tune: snap scrollTop to the seek element's real offsetTop (runs once per result set).
    if (seekAdjustedRef.current) return
    const seekEl = el.querySelector('[data-seek]') as HTMLElement | null
    if (!seekEl) return
    seekAdjustedRef.current = true
    const offset = seekEl.offsetTop - el.offsetTop
    if (offset !== el.scrollTop) {
      el.scrollTop = offset
      setScrollTop(offset)
    }
  })

  // Runs after paint — handles initial seek scroll and append-preserve.
  useEffect(() => {
    const el = listRef.current
    if (!el || rows.length === 0) return

    // Prepend was already handled synchronously by useLayoutEffect above.
    if (prependHandledRef.current) {
      prependHandledRef.current = false
      return
    }

    // Append: rows added at the bottom — preserve current scroll position.
    const adj = scrollAdjustRef.current
    if (adj < 0) {
      scrollAdjustRef.current = 0
      return
    }

    // New search or seek: scroll to the seek row.
    seekAdjustedRef.current = false
    const target = seekIndex * ROW_H
    el.scrollTop = target
    setScrollTop(target)
  }, [rows, seekIndex, ROW_H])

  // Keyboard navigation: scroll to keep the cursor row visible
  useEffect(() => {
    if (fromMouseRef.current) { fromMouseRef.current = false; return }
    const el = listRef.current
    if (!el || cursor < 0) return
    const top = cursor * ROW_H
    const bottom = top + ROW_H
    if (top < el.scrollTop) el.scrollTop = top
    else if (bottom > el.scrollTop + CONTAINER_H) el.scrollTop = bottom - CONTAINER_H
  }, [cursor, ROW_H, CONTAINER_H])

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const st = el.scrollTop
    setScrollTop(st)
    if (edgeCooldownRef.current) return
    if (hasBefore && st < ROW_H * 3) {
      edgeCooldownRef.current = true
      onScrollEdge('before')
      setTimeout(() => { edgeCooldownRef.current = false }, 600)
    } else if (hasAfter && st + CONTAINER_H > el.scrollHeight - ROW_H * 3) {
      edgeCooldownRef.current = true
      onScrollEdge('after')
      setTimeout(() => { edgeCooldownRef.current = false }, 600)
    }
  }

  const start   = Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER)
  const end     = Math.min(rows.length, Math.ceil((scrollTop + CONTAINER_H) / ROW_H) + BUFFER)
  const topH    = start * ROW_H
  const bottomH = Math.max(0, (rows.length - end) * ROW_H)

  return (
    <div className="ps-dropdown">
      <div className="ps-dd-head">
        {header.map(h => <span key={h}>{h}</span>)}
      </div>
      <div
        ref={listRef}
        className="ps-vlist"
        style={{ height: CONTAINER_H }}
        onScroll={handleScroll}
      >
        {topH > 0 && <div style={{ height: topH }} />}
        {rows.slice(start, end).map((r, ri) => {
          const i = start + ri
          return (
            <div
              key={r.compteur}
              className={`ps-dd-row${i === cursor ? ' hi' : ''}`}
              style={{ minHeight: ROW_H }}
              data-seek={i === seekIndex ? '' : undefined}
              onMouseDown={() => onPick(r)}
              onMouseEnter={() => { fromMouseRef.current = true; onHover(i) }}
            >
              {renderRow(r)}
            </div>
          )
        })}
        {bottomH > 0 && <div style={{ height: bottomH }} />}
      </div>
      <div className="ps-dd-count">
        {rows.length.toLocaleString('fr-FR')} patient{rows.length > 1 ? 's' : ''}
        {seekIndex > 0 && ` · position ${(seekIndex + 1).toLocaleString('fr-FR')}`}
        {(hasBefore || hasAfter) && ' …'}
      </div>
    </div>
  )
}

// ── Patient detail table ──────────────────────────────────────────────────────
function PatientDetails({ patient }: { patient: PatientFull }) {
  const v = (x: string | null | undefined) => x || '—'
  const villeContact  = [patient.ville, patient.code_ville].filter(Boolean).join(' ') || '—'
  const villeProf     = [patient.ville_profession, patient.code_ville_profession].filter(Boolean).join(' ') || '—'

  return (
    <div className="ps-detail">
      <table className="ps-dt">
        <tbody>
          <tr className="ps-dt-section"><th colSpan={4}>Identité</th></tr>
          <tr><th>Nom</th><td>{v(patient.nom)}</td><th>Prénom</th><td>{v(patient.prenom)}</td></tr>
          <tr><th>Nom jeune fille</th><td>{v(patient.nom_jeune_fille)}</td><th>Civilité</th><td>{v(patient.mr_mme_melle_enfant)}</td></tr>
          <tr><th>Sexe</th><td>{v(patient.sexe)}</td><th>Situation familiale</th><td>{v(patient.situation_de_famille)}</td></tr>
          <tr><th>Date de naissance</th><td>{fmtDate(patient.date_de_naissance)}</td><th>Lieu de naissance</th><td>{v(patient.lieu_de_naissance)}</td></tr>
          <tr><th>Origine</th><td colSpan={3}>{v(patient.origine)}</td></tr>

          <tr className="ps-dt-section"><th colSpan={4}>Dossier</th></tr>
          <tr><th>Code dossier</th><td>{v(patient.n_dossier)}</td><th>Matricule</th><td>{v(patient.matricule)}</td></tr>
          <tr><th>Statut</th><td>{v(patient.statut)}</td><th>Couverture sociale</th><td>{v(patient.couverture_sociale)}</td></tr>
          <tr><th>N° affiliation</th><td>{v(patient.n_affiliation)}</td><th>1ère consultation</th><td>{fmtDate(patient.date_1ere_consultation)}</td></tr>
          <tr><th>Fiche de notes</th><td colSpan={3}>{patient.notesstate ? 'Oui' : 'Non'}</td></tr>

          <tr className="ps-dt-section"><th colSpan={4}>Contact</th></tr>
          <tr><th>Adresse</th><td colSpan={3}>{v(patient.adresse)}</td></tr>
          <tr><th>Ville</th><td>{villeContact}</td><th>Gouvernorat / Pays</th><td>{v(patient.gouvernorat_ou_pays)}</td></tr>
          <tr><th>Tél. domicile</th><td>{v(patient.tel_domicile)}</td><th>Tél. bureau</th><td>{v(patient.tel_bureau)}</td></tr>
          <tr><th>Proche</th><td>{v(patient.proche)}</td><th>Tél. proche</th><td>{v(patient.tel_proche)}</td></tr>

          <tr className="ps-dt-section"><th colSpan={4}>Profession</th></tr>
          <tr><th>Profession</th><td>{v(patient.profession)}</td><th>Employeur</th><td>{v(patient.employeur)}</td></tr>
          <tr><th>Activité employeur</th><td colSpan={3}>{v(patient.activite_employeur)}</td></tr>
          <tr><th>Adresse profession</th><td colSpan={3}>{v(patient.adresse_profession)}</td></tr>
          <tr><th>Ville profession</th><td colSpan={3}>{villeProf}</td></tr>
        </tbody>
      </table>

      {patient.remarques_medicales_importantes && (
        <div className="ps-dt-alert">
          <strong>Important :</strong> {patient.remarques_medicales_importantes}
        </div>
      )}

      {patient.remarques && (
        <div className="ps-dt-text">
          <div className="ps-dt-text-label">Remarques</div>
          <p>{patient.remarques}</p>
        </div>
      )}

      {patient.notes && (
        <div className="ps-dt-text">
          <div className="ps-dt-text-label">Notes</div>
          <p>{patient.notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Consultations ─────────────────────────────────────────────────────────────
interface ConsultListProps extends ConsultData {
  onOpen: (c: ConsultationRow) => void
}

function ConsultationList({ consultations, themes, onOpen }: ConsultListProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setExpanded(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const byKey = useMemo(() => {
    const map = new Map<string, ThemeRow[]>()
    for (const t of themes) {
      const k = `${t.numero_dossier_medical}:${t.numero_consultation}`
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(t)
    }
    return map
  }, [themes])

  if (consultations.length === 0) {
    return <p className="ps-empty">Aucune consultation enregistrée.</p>
  }

  return (
    <div className="ps-consult-list">
      {consultations.map(c => {
        const k = `${c.numero_dossier_medical}:${c.numero_consultation}`
        const cThemes = byKey.get(k) ?? []
        const open = expanded.has(c.compteur_consultation)

        return (
          <div key={c.compteur_consultation} className="ps-consult-item">
            <div className="ps-consult-row" onClick={() => toggle(c.compteur_consultation)}>
              <span className="ps-consult-chevron">{open ? '▼' : '▶'}</span>
              <span className="ps-consult-date">{fmtDate(c.date_consultation)}</span>
              <span className="ps-consult-time">{fmtTime(c.heure_consultation)}</span>
              <span className="ps-consult-dossier">
                {c.titre_dossier_medical ?? c.code_dossier_medical ?? `Dossier ${c.numero_dossier_medical ?? '?'}`}
              </span>
              <button
                className="ps-consult-open-btn"
                onClick={e => { e.stopPropagation(); onOpen(c) }}
                title="Ouvrir dans l'éditeur de consultation"
              >Ouvrir →</button>
            </div>

            {open && (
              <div className="ps-consult-body">
                {cThemes.map((t, idx) => (
                  <div key={t.compteur_consultation_themes}>
                    {idx > 0 && <hr className="ps-theme-sep" />}
                    <div className={`ps-theme${t.flag_examen ? ' ps-theme--exam' : ''}`}>
                      {t.titre_theme && <div className="ps-theme-title">{t.titre_theme}</div>}
                      {t.contenu_theme && <div className="ps-theme-content">{t.contenu_theme}</div>}
                    </div>
                  </div>
                ))}
                {cThemes.length === 0 && (
                  <p className="ps-empty ps-empty--sm">Aucun détail enregistré.</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PatientSearch({ onBack }: Props) {
  const [nom, setNom]       = useState('')
  const [prenom, setPrenom] = useState('')
  const [code, setCode]     = useState('')
  const [ddn, setDdn]       = useState('')
  const [result, setResult]         = useState<SearchResult>(EMPTY)
  const [openField, setOpenField]   = useState<'nom' | 'prenom' | 'code' | 'ddn' | null>(null)
  const [cursor, setCursor]         = useState(-1)
  const [patient, setPatient]       = useState<PatientFull | null>(null)
  const [showResume, setShowResume] = useState(false)
  const [consultData, setConsultData] = useState<ConsultData | null>(null)
  const [openConsult, setOpenConsult] = useState<{
    numeroDossier: number | string
    numeroConsultation: number
    autoNew: boolean
  } | null>(null)
  const [openVisuDossier, setOpenVisuDossier] = useState(false)
  const [openAdmin, setOpenAdmin] = useState(false)

  const nomRef  = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingMoreRef = useRef(false)
  const scrollAdjustRef = useRef(0)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!formRef.current?.contains(e.target as Node)) setOpenField(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function seek(field: 'nom' | 'prenom' | 'code' | 'ddn', value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpenField(field)
    timerRef.current = setTimeout(async () => {
      const data = await window.api.searchPatients({ field, value: value.trim() })
      setResult(data)
      setCursor(-1)
    }, 40)
  }

  async function loadMore(dir: 'before' | 'after') {
    if (loadingMoreRef.current || !openField) return
    if (openField === 'ddn') return  // birthday results are not paginated
    const anchor = dir === 'after' ? result.rows[result.rows.length - 1] : result.rows[0]
    if (!anchor) return
    loadingMoreRef.current = true
    try {
      const more = await window.api.loadMorePatients({ field: openField, direction: dir, anchor })
      if (dir === 'after') {
        scrollAdjustRef.current = -1  // signal SeekDropdown: don't reset scroll
        setResult(prev => ({ ...prev, rows: [...prev.rows, ...more.rows], hasAfter: more.hasMore }))
      } else {
        scrollAdjustRef.current += more.rows.length
        setResult(prev => ({
          ...prev,
          rows: [...more.rows, ...prev.rows],
          seekIndex: prev.seekIndex + more.rows.length,
          hasBefore: more.hasMore,
        }))
      }
    } finally {
      loadingMoreRef.current = false
    }
  }

  const pick = useCallback(async (row: PatientRow) => {
    setNom(row.nom ?? '')
    setPrenom(row.prenom ?? '')
    setCode(row.n_dossier ?? '')
    setDdn(fmtDate(row.date_de_naissance))
    setOpenField(null)
    setResult(EMPTY)
    setShowResume(false)
    setConsultData(null)
    const [full, consults] = await Promise.all([
      window.api.getPatient(row.compteur),
      window.api.getConsultations(row.compteur)
    ])
    setPatient(full)
    setConsultData(consults)
  }, [])

  function onKey(e: React.KeyboardEvent) {
    if (!openField || result.rows.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setCursor(c => Math.min(c + 1, result.rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault(); pick(result.rows[cursor])
    } else if (e.key === 'Escape') {
      setOpenField(null)
    }
  }

  function reset() {
    setNom(''); setPrenom(''); setCode(''); setDdn('')
    setResult(EMPTY); setOpenField(null); setPatient(null)
    setShowResume(false); setConsultData(null); setCursor(-1)
    nomRef.current?.focus()
  }

  const open = openField !== null && result.rows.length > 0

  // ── NewPatient (Administrative) overlay ─────────────────────────────────────
  if (patient && openAdmin) {
    return (
      <NewPatient
        editCompteur={patient.compteur}
        onBack={() => setOpenAdmin(false)}
      />
    )
  }

  // ── VisuDossier overlay ──────────────────────────────────────────────────────
  if (patient && openVisuDossier) {
    return (
      <VisuDossier
        patient={{
          compteur: patient.compteur,
          nom: patient.nom,
          prenom: patient.prenom,
          n_dossier: patient.n_dossier,
          date_de_naissance: patient.date_de_naissance,
          notesstate: patient.notesstate,
        }}
        onBack={() => setOpenVisuDossier(false)}
        onMenu={onBack}
      />
    )
  }

  // ── ConsultationPage overlay ─────────────────────────────────────────────────
  if (patient && openConsult) {
    return (
      <ConsultationPage
        compteur={patient.compteur}
        nom={patient.nom}
        prenom={patient.prenom}
        dateNaissance={patient.date_de_naissance}
        notesState={patient.notesstate}
        numeroDossier={openConsult.numeroDossier}
        initialNumeroConsultation={openConsult.numeroConsultation}
        autoNew={openConsult.autoNew}
        onBack={async () => {
          setOpenConsult(null)
          const data = await window.api.getConsultations(patient.compteur)
          setConsultData(data)
        }}
      />
    )
  }

  let ageText = '—'
  let ageError = false
  if (patient) {
    const a = calcAge(patient.date_de_naissance)
    if (a === null) { ageText = 'Erreur'; ageError = true }
    else ageText = a
  }

  return (
    <div className="ps-shell">
      <Topbar title="Recherche patient" onBack={onBack}>
        <button className="topbar-btn" onClick={reset}>Nouvelle fiche</button>
      </Topbar>

      <div className="ps-workspace">

        {/* ── Search card ── */}
        <div className="ps-card" ref={formRef}>
          <div className="ps-form-layout">

            <div className="ps-field-group">
              <label className="ps-label">Nom</label>
              <div className="ps-input-wrap">
                <input
                  ref={nomRef}
                  className="ps-input"
                  autoComplete="off"
                  value={nom}
                  onChange={e => { setNom(e.target.value); setPatient(null); seek('nom', e.target.value) }}
                  onFocus={() => seek('nom', nom)}
                  onKeyDown={onKey}
                />
                {nom && <button className="ps-clear" tabIndex={-1} onMouseDown={reset}>×</button>}
                {open && openField === 'nom' && (
                  <SeekDropdown
                    result={result} cursor={cursor}
                    onPick={pick} onHover={setCursor}
                    onScrollEdge={loadMore} scrollAdjustRef={scrollAdjustRef}
                    header={['Nom', 'Prénom', 'Code', 'Naissance']}
                    renderRow={r => (
                      <>
                        <span className="c-bold">{r.nom ?? '—'}</span>
                        <span>{r.prenom ?? '—'}</span>
                        <span className="c-mono">{r.n_dossier ?? '—'}</span>
                        <span className="c-dim">{fmtDate(r.date_de_naissance)}</span>
                      </>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="ps-field-group">
              <label className="ps-label">Prénom</label>
              <div className="ps-input-wrap">
                <input
                  className="ps-input"
                  autoComplete="off"
                  value={prenom}
                  onChange={e => { setPrenom(e.target.value); setPatient(null); seek('prenom', e.target.value) }}
                  onFocus={() => seek('prenom', prenom)}
                  onKeyDown={onKey}
                />
                {open && openField === 'prenom' && (
                  <SeekDropdown
                    result={result} cursor={cursor}
                    onPick={pick} onHover={setCursor}
                    onScrollEdge={loadMore} scrollAdjustRef={scrollAdjustRef}
                    header={['Prénom', 'Nom', 'Code', 'Naissance']}
                    renderRow={r => (
                      <>
                        <span className="c-bold">{r.prenom ?? '—'}</span>
                        <span>{r.nom ?? '—'}</span>
                        <span className="c-mono">{r.n_dossier ?? '—'}</span>
                        <span className="c-dim">{fmtDate(r.date_de_naissance)}</span>
                      </>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="ps-field-group">
              <label className="ps-label">Code dossier</label>
              <div className="ps-input-wrap">
                <input
                  className="ps-input ps-input--mono"
                  autoComplete="off"
                  value={code}
                  onChange={e => { setCode(e.target.value); setPatient(null); seek('code', e.target.value) }}
                  onFocus={() => seek('code', code)}
                  onKeyDown={onKey}
                />
                {open && openField === 'code' && (
                  <SeekDropdown
                    result={result} cursor={cursor}
                    onPick={pick} onHover={setCursor}
                    onScrollEdge={loadMore} scrollAdjustRef={scrollAdjustRef}
                    header={['Code', 'Nom', 'Prénom', 'Naissance']}
                    renderRow={r => (
                      <>
                        <span className="c-bold c-mono">{r.n_dossier ?? '—'}</span>
                        <span>{r.nom ?? '—'}</span>
                        <span>{r.prenom ?? '—'}</span>
                        <span className="c-dim">{fmtDate(r.date_de_naissance)}</span>
                      </>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="ps-field-group">
              <label className="ps-label">Date de naissance</label>
              <div className="ps-input-wrap">
                <input
                  className="ps-input ps-input--mono"
                  autoComplete="off"
                  placeholder="jj/mm/aaaa"
                  value={ddn}
                  onChange={e => {
                    const isDeleting = (e.nativeEvent as InputEvent).inputType?.startsWith('delete') ?? false
                    const v = formatDateInput(e.target.value, isDeleting)
                    setDdn(v)
                    setPatient(null)
                    seek('ddn', v)
                  }}
                  onFocus={() => { setResult(EMPTY); seek('ddn', ddn) }}
                  onKeyDown={onKey}
                />
                {open && openField === 'ddn' && (
                  <SeekDropdown
                    result={result} cursor={cursor}
                    onPick={pick} onHover={setCursor}
                    onScrollEdge={loadMore} scrollAdjustRef={scrollAdjustRef}
                    header={['Naissance', 'Nom', 'Prénom', 'Code']}
                    renderRow={r => (
                      <>
                        <span className="c-bold c-mono">{fmtDate(r.date_de_naissance)}</span>
                        <span>{r.nom ?? '—'}</span>
                        <span>{r.prenom ?? '—'}</span>
                        <span className="c-dim c-mono">{r.n_dossier ?? '—'}</span>
                      </>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="ps-form-meta">
              <div className="ps-meta-row">
                <span className="ps-meta-label">Âge</span>
                <div className="ps-age-row">
                  <span className={`ps-age-val${ageError ? ' ps-age-val--err' : ''}`}>
                    {ageText}
                  </span>
                  {patient && (
                    <span
                      className={`ps-notes-dot${patient.notesstate ? ' ps-notes-dot--yes' : ''}`}
                      title="Fiche notes"
                    />
                  )}
                </div>
              </div>
            </div>

          </div>

          {patient && (
            <div className="ps-card-footer">
              <span className="ps-patient-chip">
                {[patient.mr_mme_melle_enfant, patient.prenom, patient.nom].filter(Boolean).join(' ')}
                {!ageError && ageText !== '—' && ` · ${ageText}`}
                {patient.remarques_medicales_importantes && (
                  <span className="ps-patient-chip-alert"> ⚠ Important</span>
                )}
              </span>
              <button className="ps-resume-btn" onClick={() => setShowResume(v => !v)}>
                {showResume ? 'Masquer le résumé ▲' : 'Résumé ▼'}
              </button>
            </div>
          )}
        </div>

        {/* ── Patient detail (résumé) ── */}
        {patient && showResume && (
          <div className="ps-panel">
            <div className="ps-panel-title">Résumé du dossier</div>
            <PatientDetails patient={patient} />
          </div>
        )}

        {/* ── Consultations ── always visible ── */}
        <div className="ps-panel">
          <div className="ps-panel-title">
            Consultations
            {consultData && <span className="ps-panel-badge">{consultData.consultations.length}</span>}
          </div>
          {!patient && (
            <p className="ps-empty">Sélectionnez un patient pour afficher ses consultations.</p>
          )}
          {patient && !consultData && (
            <p className="ps-empty">Chargement des consultations…</p>
          )}
          {patient && consultData && (
            <ConsultationList
              consultations={consultData.consultations}
              themes={consultData.themes}
              onOpen={c => setOpenConsult({
                numeroDossier: c.numero_dossier_medical ?? 1,
                numeroConsultation: Number(c.numero_consultation ?? 1),
                autoNew: false
              })}
            />
          )}
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="ps-footer">
        <div className="ps-footer-inner">
          <div className="ps-footer-row-fill">
            <button
              className="ps-footer-btn ps-footer-btn--active"
              disabled={!patient}
              onClick={() => patient && setOpenAdmin(true)}
            >Administrative</button>
            <button
              className="ps-footer-btn"
              disabled={!patient}
              onClick={() => patient && setOpenVisuDossier(true)}
            >Visu Dossier</button>
            <button
              className="ps-footer-btn"
              disabled={!patient}
              onClick={() => {
                if (!patient) return
                const consults = consultData?.consultations ?? []
                const numeroDossier = consults[0]?.numero_dossier_medical ?? 1
                const lastN = consults.length > 0
                  ? Number(consults[consults.length - 1].numero_consultation ?? 0)
                  : 0
                setOpenConsult({ numeroDossier, numeroConsultation: lastN, autoNew: true })
              }}
            >Consultation</button>
            <button className="ps-footer-btn" disabled>Ordonnance</button>
            <button className="ps-footer-btn" disabled>Actes</button>
            <button className="ps-footer-btn" disabled>Courrier</button>
            <button className="ps-footer-btn" disabled={!patient} onClick={() => setShowResume(v => !v)}>
              Résumé
            </button>
          </div>
          <div className="ps-footer-row-center">
            <button className="ps-footer-btn" disabled>Examens</button>
            <button className="ps-footer-btn" disabled>Diag.Tare...</button>
            <button className="ps-footer-btn" disabled>Fiche Per...</button>
            <button className="ps-footer-btn" disabled>Mémo</button>
            <button className="ps-footer-btn" disabled>Lst Recherche</button>
            <button className="ps-footer-btn" disabled>Rendez-vous</button>
            <button className="ps-footer-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>
    </div>
  )
}
