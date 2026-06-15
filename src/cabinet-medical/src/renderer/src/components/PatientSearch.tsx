import { useState, useEffect, useRef, useCallback } from 'react'
import './PatientSearch.css'

interface PatientRow {
  compteur: number
  nom: string | null
  prenom: string | null
  numero_dossier: string | null
  date_naissance: string | null
  ville: string | null
  tel_domicile: string | null
}

interface PatientFull {
  compteur: number
  nom: string | null
  nom_jeune_fille: string | null
  prenom: string | null
  numero_dossier: string | null
  matricule: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  sexe: string | null
  situation_famille: string | null
  civilite: string | null
  adresse: string | null
  ville: string | null
  code_ville: string | null
  gouvernorat_pays: string | null
  profession: string | null
  employeur: string | null
  tel_bureau: string | null
  tel_domicile: string | null
  proche: string | null
  tel_proche: string | null
  statut: string | null
  couverture_sociale: string | null
  numero_affiliation: string | null
  remarques: string | null
  remarques_medicales_importantes: string | null
  date_premiere_consultation: string | null
  notes_state: number | null
  notes: string | null
}

interface Props {
  onBack: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcAge(iso: string | null): string {
  if (!iso) return '—'
  const birth = new Date(iso)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--
  if (years < 0) return '—'
  if (years === 0) {
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
    return `${months} mois`
  }
  return `${years} ans`
}

type SearchField = 'nom' | 'prenom' | 'code'

function useFieldSearch(field: SearchField) {
  const [value, setValue] = useState('')
  const [results, setResults] = useState<PatientRow[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    const rows = await window.api.searchPatients(q.trim(), field)
    setResults(rows)
    setOpen(rows.length > 0)
    setActiveIndex(-1)
  }, [field])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(() => search(value), 160)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [value, search])

  function closeDropdown() { setOpen(false) }
  function openDropdown() { if (results.length > 0) setOpen(true) }

  return { value, setValue, results, open, setOpen, activeIndex, setActiveIndex, inputRef, listRef, closeDropdown, openDropdown }
}

export default function PatientSearch({ onBack }: Props) {
  const nom = useFieldSearch('nom')
  const prenom = useFieldSearch('prenom')
  const code = useFieldSearch('code')

  const [patient, setPatient] = useState<PatientFull | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { setOpen: setNomOpen } = nom
  const { setOpen: setPrenomOpen } = prenom
  const { setOpen: setCodeOpen } = code

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setNomOpen(false)
        setPrenomOpen(false)
        setCodeOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [setNomOpen, setPrenomOpen, setCodeOpen])

  async function selectPatient(row: PatientRow) {
    nom.setValue(row.nom ?? '')
    nom.setOpen(false)
    prenom.setValue(row.prenom ?? '')
    prenom.setOpen(false)
    code.setValue(row.numero_dossier ?? '')
    code.setOpen(false)
    const full = await window.api.getPatient(row.compteur)
    setPatient(full)
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    field: ReturnType<typeof useFieldSearch>
  ) {
    if (!field.open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      field.setActiveIndex((i) => Math.min(i + 1, field.results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      field.setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && field.activeIndex >= 0) {
      e.preventDefault()
      selectPatient(field.results[field.activeIndex])
    } else if (e.key === 'Escape') {
      field.setOpen(false)
    }
  }

  function clearAll() {
    nom.setValue('')
    prenom.setValue('')
    code.setValue('')
    setPatient(null)
    nom.inputRef.current?.focus()
  }

  const toolbarActions = [
    'Administrative', 'Visu Dossier', 'Consultation Zoom',
    'Ordonnance', 'Actes', 'Courrier', 'Résumé'
  ]
  const toolbarActions2 = [
    'Examens', 'Diag. Tarif', 'Fiche Per.', 'Mémo',
    'Lst Recherche', 'Rendez-vous', 'Menu général'
  ]

  return (
    <div className="rp-shell">
      {/* ── Top bar ── */}
      <div className="rp-topbar">
        <h1 className="rp-title">Recherche patient</h1>
        <div className="rp-topbar-actions">
          <button className="rp-topbtn" onClick={onBack}>Menu général</button>
          <button className="rp-topbtn" onClick={clearAll}>Nouvelle fiche</button>
        </div>
      </div>

      {/* ── Main form ── */}
      <div className="rp-body" ref={containerRef}>
        <div className="rp-left">

          {/* Nom */}
          <div className="rp-field-row">
            <label className="rp-label">Nom :</label>
            <div className="rp-input-wrap">
              <input
                ref={nom.inputRef}
                className="rp-input"
                autoFocus
                autoComplete="off"
                value={nom.value}
                onChange={(e) => nom.setValue(e.target.value)}
                onFocus={nom.openDropdown}
                onKeyDown={(e) => handleKeyDown(e, nom)}
              />
              {nom.open && (
                <ul className="rp-dropdown" ref={nom.listRef}>
                  {nom.results.map((r, i) => (
                    <li
                      key={r.compteur}
                      className={`rp-dd-item${i === nom.activeIndex ? ' active' : ''}`}
                      onMouseDown={() => selectPatient(r)}
                      onMouseEnter={() => nom.setActiveIndex(i)}
                    >
                      <span className="rp-dd-nom">{r.nom}</span>
                      <span className="rp-dd-prenom">{r.prenom}</span>
                      <span className="rp-dd-code">{r.numero_dossier}</span>
                      <span className="rp-dd-dob">{formatDate(r.date_naissance)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Prénom */}
          <div className="rp-field-row">
            <label className="rp-label">Prénom :</label>
            <div className="rp-input-wrap">
              <input
                ref={prenom.inputRef}
                className="rp-input"
                autoComplete="off"
                value={prenom.value}
                onChange={(e) => prenom.setValue(e.target.value)}
                onFocus={prenom.openDropdown}
                onKeyDown={(e) => handleKeyDown(e, prenom)}
              />
              {prenom.open && (
                <ul className="rp-dropdown" ref={prenom.listRef}>
                  {prenom.results.map((r, i) => (
                    <li
                      key={r.compteur}
                      className={`rp-dd-item${i === prenom.activeIndex ? ' active' : ''}`}
                      onMouseDown={() => selectPatient(r)}
                      onMouseEnter={() => prenom.setActiveIndex(i)}
                    >
                      <span className="rp-dd-prenom">{r.prenom}</span>
                      <span className="rp-dd-nom">{r.nom}</span>
                      <span className="rp-dd-code">{r.numero_dossier}</span>
                      <span className="rp-dd-dob">{formatDate(r.date_naissance)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Code */}
          <div className="rp-field-row">
            <label className="rp-label">Code :</label>
            <div className="rp-input-wrap rp-input-wrap--code">
              <input
                ref={code.inputRef}
                className="rp-input rp-input--code"
                autoComplete="off"
                value={code.value}
                onChange={(e) => code.setValue(e.target.value)}
                onFocus={code.openDropdown}
                onKeyDown={(e) => handleKeyDown(e, code)}
              />
              {code.open && (
                <ul className="rp-dropdown" ref={code.listRef}>
                  {code.results.map((r, i) => (
                    <li
                      key={r.compteur}
                      className={`rp-dd-item${i === code.activeIndex ? ' active' : ''}`}
                      onMouseDown={() => selectPatient(r)}
                      onMouseEnter={() => code.setActiveIndex(i)}
                    >
                      <span className="rp-dd-code rp-dd-code--bold">{r.numero_dossier}</span>
                      <span className="rp-dd-prenom">{r.prenom}</span>
                      <span className="rp-dd-nom">{r.nom}</span>
                      <span className="rp-dd-dob">{formatDate(r.date_naissance)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* ── Right info panel ── */}
        <div className="rp-right">
          <div className="rp-info-row">
            <span className="rp-info-label">Fiche des notes :</span>
            <span className={`rp-notes-dot${patient?.notes_state ? ' active' : ''}`} />
          </div>
          <div className="rp-info-row">
            <span className="rp-info-label">Solde :</span>
            <span className="rp-info-value rp-solde">—</span>
          </div>
          <div className="rp-info-row">
            <span className="rp-info-label">Age :</span>
            <span className={`rp-info-value rp-age${patient ? ' filled' : ''}`}>
              {patient ? calcAge(patient.date_naissance) : ''}
            </span>
          </div>
          <button className="rp-topbtn rp-impressions" disabled={!patient}>
            Impressions
          </button>
        </div>
      </div>

      {/* ── Dossier bar ── */}
      <div className="rp-dossier-bar">
        <span className="rp-dossier-label">Numéro dossier médical :</span>
        <span className="rp-dossier-value">{patient?.numero_dossier ?? ''}</span>
        {patient?.remarques_medicales_importantes && (
          <span className="rp-dossier-alert">⚠ {patient.remarques_medicales_importantes}</span>
        )}
      </div>

      {/* ── Consultation list ── */}
      <div className="rp-consult-area">
        {patient ? (
          <table className="rp-consult-table">
            <thead>
              <tr>
                <th className="rp-th-num">#</th>
                <th className="rp-th-date">Date</th>
                <th className="rp-th-motif">Motif / Résumé</th>
              </tr>
            </thead>
            <tbody>
              {patient.date_premiere_consultation ? (
                <tr className="rp-consult-row rp-consult-row--first">
                  <td>1</td>
                  <td>{formatDate(patient.date_premiere_consultation)}</td>
                  <td className="rp-consult-motif">Première consultation</td>
                </tr>
              ) : null}
              <tr className="rp-consult-empty">
                <td colSpan={3}>
                  Dossier médical · historique des consultations — à venir
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div className="rp-consult-placeholder">
            Sélectionnez un patient pour afficher son dossier
          </div>
        )}
      </div>

      {/* ── Bottom toolbar ── */}
      <div className="rp-toolbar">
        <div className="rp-toolbar-row">
          {toolbarActions.map((a) => (
            <button key={a} className="rp-toolbar-btn" disabled={!patient}>{a}</button>
          ))}
        </div>
        <div className="rp-toolbar-row">
          {toolbarActions2.map((a) => (
            <button
              key={a}
              className={`rp-toolbar-btn${a === 'Menu général' ? ' rp-toolbar-btn--menu' : ''}`}
              onClick={a === 'Menu général' ? onBack : undefined}
              disabled={a !== 'Menu général' && !patient}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
