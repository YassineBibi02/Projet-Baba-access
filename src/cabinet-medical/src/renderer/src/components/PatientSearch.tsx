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
  date_naissance_raw: string | null
  lieu_naissance: string | null
  sexe: string | null
  situation_famille: string | null
  civilite: string | null
  adresse: string | null
  ville: string | null
  code_ville: string | null
  gouvernorat_pays: string | null
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
  numero_affiliation: string | null
  statut: string | null
  couverture_sociale: string | null
  remarques: string | null
  remarques_medicales_importantes: string | null
  date_premiere_consultation: string | null
  date_premiere_consultation_raw: string | null
  notes_state: number | null
  notes: string | null
}

interface Props {
  onBack: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcAge(iso: string | null): string {
  if (!iso) return ''
  const birth = new Date(iso)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--
  if (years < 0) return ''
  if (years === 0) {
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
    return `${months} mois`
  }
  return `${years} ans`
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="ps-field">
      <span className="ps-field-label">{label}</span>
      <span className="ps-field-value">{value}</span>
    </div>
  )
}

export default function PatientSearch({ onBack }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientRow[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<PatientFull | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const rows = await window.api.searchPatients(q.trim())
    setResults(rows)
    setOpen(rows.length > 0)
    setActiveIndex(-1)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.trim().length === 0) {
      setResults([])
      setOpen(false)
      return
    }
    timerRef.current = setTimeout(() => search(query), 180)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, search])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function selectPatient(row: PatientRow) {
    setOpen(false)
    setQuery(`${row.prenom ?? ''} ${row.nom ?? ''}`.trim())
    const full = await window.api.getPatient(row.compteur)
    setSelected(full)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectPatient(results[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    setResults([])
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="ps-shell">
      <div className="ps-page">
        <header className="ps-header">
          <button className="ps-back-btn" onClick={onBack}>
            ← Menu général
          </button>
          <h1 className="ps-title">Recherche patient</h1>
          <span className="ps-count">
            {results.length > 0 && open ? `${results.length} résultat(s)` : ''}
          </span>
        </header>

        <div className="ps-search-area">
          <div className="ps-search-wrap">
            <div className="ps-input-row">
              <label className="ps-label" htmlFor="ps-input">
                Rechercher
              </label>
              <div className="ps-input-box">
                <svg className="ps-icon" viewBox="0 0 20 20" fill="none">
                  <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  id="ps-input"
                  ref={inputRef}
                  className="ps-input"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  placeholder="Nom, prénom, code dossier ou téléphone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => results.length > 0 && setOpen(true)}
                  onKeyDown={handleKeyDown}
                />
                {loading && <span className="ps-spinner" />}
                {query.length > 0 && !loading && (
                  <button className="ps-clear" onClick={clearSelection} tabIndex={-1}>
                    ×
                  </button>
                )}
              </div>
            </div>

            <p className="ps-hint">
              Saisissez au moins une lettre pour lancer la recherche dans les 38 541 patients.
              Critères&nbsp;: nom · prénom · code dossier · téléphone.
            </p>

            {open && (
              <div className="ps-dropdown" ref={dropdownRef}>
                <div className="ps-dropdown-head">
                  <span>Prénom</span>
                  <span>Nom</span>
                  <span>Code</span>
                  <span>Naissance</span>
                </div>
                <ul className="ps-dropdown-list">
                  {results.map((r, i) => (
                    <li
                      key={r.compteur}
                      className={`ps-dropdown-item${i === activeIndex ? ' active' : ''}`}
                      onMouseDown={() => selectPatient(r)}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <span className="ps-col-prenom">{r.prenom ?? '—'}</span>
                      <span className="ps-col-nom">{r.nom ?? '—'}</span>
                      <span className="ps-col-code">{r.numero_dossier ?? '—'}</span>
                      <span className="ps-col-dob">{formatDate(r.date_naissance)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="ps-patient-card">
            <div className="ps-card-header">
              <div className="ps-card-name">
                <span className="ps-card-civilite">{selected.civilite ?? ''}</span>
                <h2>
                  {selected.prenom} {selected.nom}
                  {selected.nom_jeune_fille && selected.nom_jeune_fille !== selected.nom
                    ? ` (née ${selected.nom_jeune_fille})`
                    : ''}
                </h2>
              </div>
              <div className="ps-card-badges">
                {selected.date_naissance && (
                  <span className="ps-badge ps-badge-age">{calcAge(selected.date_naissance)}</span>
                )}
                {selected.sexe && (
                  <span className="ps-badge">{selected.sexe}</span>
                )}
                {selected.statut && (
                  <span className="ps-badge ps-badge-statut">{selected.statut}</span>
                )}
              </div>
            </div>

            <div className="ps-card-body">
              <section className="ps-section">
                <h3 className="ps-section-title">Identification</h3>
                <div className="ps-fields-grid">
                  <Field label="Code dossier" value={selected.numero_dossier} />
                  <Field label="Matricule" value={selected.matricule} />
                  <Field label="Date de naissance" value={formatDate(selected.date_naissance)} />
                  <Field label="Lieu de naissance" value={selected.lieu_naissance} />
                  <Field label="Situation familiale" value={selected.situation_famille} />
                  <Field label="Origine" value={selected.origine} />
                </div>
              </section>

              <section className="ps-section">
                <h3 className="ps-section-title">Coordonnées</h3>
                <div className="ps-fields-grid">
                  <Field label="Adresse" value={selected.adresse} />
                  <Field label="Ville" value={selected.ville} />
                  <Field label="Code ville" value={selected.code_ville} />
                  <Field label="Gouvernorat / Pays" value={selected.gouvernorat_pays} />
                  <Field label="Tél. domicile" value={selected.tel_domicile} />
                  <Field label="Tél. bureau" value={selected.tel_bureau} />
                  <Field label="Proche" value={selected.proche} />
                  <Field label="Tél. proche" value={selected.tel_proche} />
                </div>
              </section>

              <section className="ps-section">
                <h3 className="ps-section-title">Profession</h3>
                <div className="ps-fields-grid">
                  <Field label="Profession" value={selected.profession} />
                  <Field label="Employeur" value={selected.employeur} />
                  <Field label="Activité" value={selected.activite_employeur} />
                  <Field label="Adresse prof." value={selected.adresse_profession} />
                  <Field label="Ville prof." value={selected.ville_profession} />
                </div>
              </section>

              <section className="ps-section">
                <h3 className="ps-section-title">Couverture sociale</h3>
                <div className="ps-fields-grid">
                  <Field label="Couverture" value={selected.couverture_sociale} />
                  <Field label="N° affiliation" value={selected.numero_affiliation} />
                </div>
              </section>

              {(selected.remarques || selected.remarques_medicales_importantes) && (
                <section className="ps-section">
                  <h3 className="ps-section-title">Remarques</h3>
                  {selected.remarques_medicales_importantes && (
                    <div className="ps-alert">
                      <strong>Important&nbsp;:</strong> {selected.remarques_medicales_importantes}
                    </div>
                  )}
                  {selected.remarques && (
                    <div className="ps-remark">{selected.remarques}</div>
                  )}
                </section>
              )}

              <section className="ps-section">
                <h3 className="ps-section-title">Suivi</h3>
                <div className="ps-fields-grid">
                  <Field
                    label="1ère consultation"
                    value={formatDate(selected.date_premiere_consultation)}
                  />
                </div>
                <div className="ps-consult-placeholder">
                  <span>Dossier médical · consultations — à venir</span>
                </div>
              </section>

              {selected.notes && (
                <section className="ps-section">
                  <h3 className="ps-section-title">Notes</h3>
                  <div className="ps-remark">{selected.notes}</div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
