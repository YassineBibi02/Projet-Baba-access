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
  origine: string | null
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
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function calcAge(iso: string | null): string {
  if (!iso) return ''
  const birth = new Date(iso)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  const md = now.getMonth() - birth.getMonth()
  if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) years--
  if (years < 0) return ''
  if (years === 0) {
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()
    return `${months} mois`
  }
  return `${years} ans`
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="sr-info-row">
      <span className="sr-info-label">{label}</span>
      <span className="sr-info-value">{value}</span>
    </div>
  )
}

function useField(field: 'nom' | 'prenom' | 'code') {
  const [value, setValue] = useState('')
  const [results, setResults] = useState<PatientRow[]>([])
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setOpen(false)
        return
      }
      const rows = await window.api.searchPatients(q.trim(), field)
      setResults(rows)
      setOpen(rows.length > 0)
      setCursor(-1)
    },
    [field]
  )

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    // 40ms debounce — just enough to avoid duplicate rapid-fire calls
    timerRef.current = setTimeout(() => runSearch(value), 40)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, runSearch])

  return { value, setValue, results, open, setOpen, cursor, setCursor, inputRef }
}

export default function PatientSearch({ onBack }: Props) {
  const nom = useField('nom')
  const prenom = useField('prenom')
  const code = useField('code')
  const [patient, setPatient] = useState<PatientFull | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Close all dropdowns on outside click
  const { setOpen: nomSetOpen } = nom
  const { setOpen: prenomSetOpen } = prenom
  const { setOpen: codeSetOpen } = code
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!formRef.current?.contains(e.target as Node)) {
        nomSetOpen(false)
        prenomSetOpen(false)
        codeSetOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [nomSetOpen, prenomSetOpen, codeSetOpen])

  async function pick(row: PatientRow) {
    nom.setValue(row.nom ?? '')
    nom.setOpen(false)
    prenom.setValue(row.prenom ?? '')
    prenom.setOpen(false)
    code.setValue(row.numero_dossier ?? '')
    code.setOpen(false)
    const full = await window.api.getPatient(row.compteur)
    setPatient(full)
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>, f: ReturnType<typeof useField>) {
    if (!f.open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      f.setCursor((c) => Math.min(c + 1, f.results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      f.setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && f.cursor >= 0) {
      e.preventDefault()
      pick(f.results[f.cursor])
    } else if (e.key === 'Escape') {
      f.setOpen(false)
    }
  }

  function reset() {
    nom.setValue('')
    prenom.setValue('')
    code.setValue('')
    setPatient(null)
    nom.inputRef.current?.focus()
  }

  return (
    <div className="sr-shell">
      <div className="sr-page">

        {/* ── Header ── */}
        <header className="sr-header">
          <div className="sr-header-left">
            <button className="sr-back" onClick={onBack}>← Menu général</button>
            <h1 className="sr-title">Recherche patient</h1>
          </div>
          <button className="sr-new" onClick={reset}>Nouvelle fiche</button>
        </header>

        {/* ── Search card ── */}
        <div className="sr-card" ref={formRef}>
          <div className="sr-fields">

            {/* Nom */}
            <div className="sr-field">
              <label className="sr-label">Nom</label>
              <div className="sr-input-wrap">
                <input
                  ref={nom.inputRef}
                  className="sr-input"
                  autoFocus
                  autoComplete="off"
                  placeholder="Rechercher par nom…"
                  value={nom.value}
                  onChange={(e) => nom.setValue(e.target.value)}
                  onFocus={() => nom.results.length > 0 && nom.setOpen(true)}
                  onKeyDown={(e) => onKey(e, nom)}
                />
                {nom.value && (
                  <button className="sr-clear" tabIndex={-1} onMouseDown={reset}>×</button>
                )}
                {nom.open && (
                  <ul className="sr-dropdown">
                    <li className="sr-dd-head">
                      <span>Nom</span><span>Prénom</span><span>Code</span><span>Naissance</span>
                    </li>
                    {nom.results.map((r, i) => (
                      <li
                        key={r.compteur}
                        className={`sr-dd-row${i === nom.cursor ? ' hi' : ''}`}
                        onMouseDown={() => pick(r)}
                        onMouseEnter={() => nom.setCursor(i)}
                      >
                        <span className="c-bold">{r.nom}</span>
                        <span>{r.prenom}</span>
                        <span className="c-mono">{r.numero_dossier}</span>
                        <span className="c-dim">{formatDate(r.date_naissance)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Prénom */}
            <div className="sr-field">
              <label className="sr-label">Prénom</label>
              <div className="sr-input-wrap">
                <input
                  ref={prenom.inputRef}
                  className="sr-input"
                  autoComplete="off"
                  placeholder="Rechercher par prénom…"
                  value={prenom.value}
                  onChange={(e) => prenom.setValue(e.target.value)}
                  onFocus={() => prenom.results.length > 0 && prenom.setOpen(true)}
                  onKeyDown={(e) => onKey(e, prenom)}
                />
                {prenom.open && (
                  <ul className="sr-dropdown">
                    <li className="sr-dd-head">
                      <span>Prénom</span><span>Nom</span><span>Code</span><span>Naissance</span>
                    </li>
                    {prenom.results.map((r, i) => (
                      <li
                        key={r.compteur}
                        className={`sr-dd-row${i === prenom.cursor ? ' hi' : ''}`}
                        onMouseDown={() => pick(r)}
                        onMouseEnter={() => prenom.setCursor(i)}
                      >
                        <span className="c-bold">{r.prenom}</span>
                        <span>{r.nom}</span>
                        <span className="c-mono">{r.numero_dossier}</span>
                        <span className="c-dim">{formatDate(r.date_naissance)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Code */}
            <div className="sr-field sr-field--code">
              <label className="sr-label">Code dossier</label>
              <div className="sr-input-wrap">
                <input
                  ref={code.inputRef}
                  className="sr-input sr-input--mono"
                  autoComplete="off"
                  placeholder="Ex: 20075/15"
                  value={code.value}
                  onChange={(e) => code.setValue(e.target.value)}
                  onFocus={() => code.results.length > 0 && code.setOpen(true)}
                  onKeyDown={(e) => onKey(e, code)}
                />
                {code.open && (
                  <ul className="sr-dropdown">
                    <li className="sr-dd-head">
                      <span>Code</span><span>Nom</span><span>Prénom</span><span>Naissance</span>
                    </li>
                    {code.results.map((r, i) => (
                      <li
                        key={r.compteur}
                        className={`sr-dd-row${i === code.cursor ? ' hi' : ''}`}
                        onMouseDown={() => pick(r)}
                        onMouseEnter={() => code.setCursor(i)}
                      >
                        <span className="c-mono c-bold">{r.numero_dossier}</span>
                        <span>{r.nom}</span>
                        <span>{r.prenom}</span>
                        <span className="c-dim">{formatDate(r.date_naissance)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── Patient profile ── */}
        {patient && (
          <div className="sr-patient">

            <div className="sr-patient-header">
              <div>
                <p className="sr-patient-sub">
                  {patient.civilite ?? ''} · {patient.sexe ?? ''} · {patient.situation_famille ?? ''}
                </p>
                <h2 className="sr-patient-name">
                  {patient.prenom} <span>{patient.nom}</span>
                  {patient.nom_jeune_fille && patient.nom_jeune_fille !== patient.nom
                    ? <small> née {patient.nom_jeune_fille}</small>
                    : null}
                </h2>
              </div>
              <div className="sr-patient-chips">
                {patient.date_naissance && (
                  <span className="sr-chip sr-chip--age">
                    {calcAge(patient.date_naissance)}
                    <small> · {formatDate(patient.date_naissance)}</small>
                  </span>
                )}
                {patient.statut && <span className="sr-chip">{patient.statut}</span>}
                {patient.couverture_sociale && <span className="sr-chip">{patient.couverture_sociale}</span>}
              </div>
            </div>

            {patient.remarques_medicales_importantes && (
              <div className="sr-alert">
                <strong>Important :</strong> {patient.remarques_medicales_importantes}
              </div>
            )}

            <div className="sr-patient-grid">
              <section className="sr-section">
                <h3 className="sr-section-title">Identification</h3>
                <InfoRow label="Code dossier" value={patient.numero_dossier} />
                <InfoRow label="Matricule" value={patient.matricule} />
                <InfoRow label="Lieu de naissance" value={patient.lieu_naissance} />
                <InfoRow label="Origine" value={patient.origine} />
              </section>

              <section className="sr-section">
                <h3 className="sr-section-title">Contact</h3>
                <InfoRow label="Adresse" value={patient.adresse} />
                <InfoRow label="Ville" value={[patient.ville, patient.code_ville].filter(Boolean).join(' ')} />
                <InfoRow label="Gouvernorat" value={patient.gouvernorat_pays} />
                <InfoRow label="Tél. domicile" value={patient.tel_domicile} />
                <InfoRow label="Tél. bureau" value={patient.tel_bureau} />
                <InfoRow label="Proche" value={patient.proche} />
                <InfoRow label="Tél. proche" value={patient.tel_proche} />
              </section>

              <section className="sr-section">
                <h3 className="sr-section-title">Profession</h3>
                <InfoRow label="Profession" value={patient.profession} />
                <InfoRow label="Employeur" value={patient.employeur} />
              </section>

              <section className="sr-section">
                <h3 className="sr-section-title">Suivi</h3>
                <InfoRow label="1ère consultation" value={formatDate(patient.date_premiere_consultation)} />
                <InfoRow label="N° affiliation" value={patient.numero_affiliation} />
                <div className="sr-consult-stub">
                  Historique des consultations · à venir
                </div>
              </section>
            </div>

            {patient.remarques && (
              <div className="sr-remarks">
                <span className="sr-remarks-label">Remarques</span>
                <p>{patient.remarques}</p>
              </div>
            )}

            {patient.notes && (
              <div className="sr-remarks">
                <span className="sr-remarks-label">Notes</span>
                <p>{patient.notes}</p>
              </div>
            )}

          </div>
        )}

        {!patient && (
          <p className="sr-hint">
            Tapez dans l'un des champs ci-dessus — les résultats apparaissent instantanément.
          </p>
        )}

      </div>
    </div>
  )
}
