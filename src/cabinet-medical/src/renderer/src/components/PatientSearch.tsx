import { useState, useRef, useCallback, useEffect } from 'react'
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

interface Props { onBack: () => void }

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function calcAge(iso: string | null): string {
  if (!iso) return ''
  const birth = new Date(iso + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let years = now.getFullYear() - birth.getFullYear()
  const bdThisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
  if (now < bdThisYear) years--
  if (years < 0) return ''
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="ps-info-row">
      <span className="ps-info-label">{label}</span>
      <span className="ps-info-value">{value}</span>
    </div>
  )
}

export default function PatientSearch({ onBack }: Props) {
  const [nom, setNom]       = useState('')
  const [prenom, setPrenom] = useState('')
  const [code, setCode]     = useState('')
  const [results, setResults] = useState<PatientRow[]>([])
  const [openField, setOpenField] = useState<'nom' | 'prenom' | 'code' | null>(null)
  const [cursor, setCursor] = useState(-1)
  const [patient, setPatient] = useState<PatientFull | null>(null)

  const nomRef    = useRef<HTMLInputElement>(null)
  const formRef   = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!formRef.current?.contains(e.target as Node)) setOpenField(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Seek through the full sorted list for the given field — no cross-filtering
  function seek(field: 'nom' | 'prenom' | 'code', value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!value.trim()) { setResults([]); setOpenField(null); return }
    setOpenField(field)
    timerRef.current = setTimeout(async () => {
      const rows = await window.api.searchPatients({ field, value: value.trim() })
      setResults(rows)
      setCursor(-1)
    }, 40)
  }

  const pick = useCallback(async (row: PatientRow) => {
    setNom(row.nom ?? '')
    setPrenom(row.prenom ?? '')
    setCode(row.numero_dossier ?? '')
    setOpenField(null)
    setResults([])
    const full = await window.api.getPatient(row.compteur)
    setPatient(full)
  }, [])

  function onKey(e: React.KeyboardEvent) {
    if (!openField || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault(); pick(results[cursor])
    } else if (e.key === 'Escape') {
      setOpenField(null)
    }
  }

  function reset() {
    setNom(''); setPrenom(''); setCode('')
    setResults([]); setOpenField(null); setPatient(null); setCursor(-1)
    nomRef.current?.focus()
  }

  const open = openField !== null && results.length > 0

  function DropdownRows(
    colA: (r: PatientRow) => string | null,
    colB: (r: PatientRow) => string | null,
    aClass = ''
  ) {
    return results.map((r, i) => (
      <li
        key={r.compteur}
        className={`ps-dd-row${i === cursor ? ' hi' : ''}`}
        onMouseDown={() => pick(r)}
        onMouseEnter={() => setCursor(i)}
      >
        <span className={`c-bold ${aClass}`}>{colA(r) ?? '—'}</span>
        <span>{colB(r) ?? '—'}</span>
        <span className="c-mono">{r.numero_dossier ?? '—'}</span>
        <span className="c-dim">{fmtDate(r.date_naissance)}</span>
      </li>
    ))
  }

  return (
    <div className="ps-shell">
      <div className="ps-page">

        {/* ── Header ── */}
        <header className="ps-header">
          <h1 className="ps-title">Recherche patient</h1>
          <div className="ps-header-btns">
            <button className="ps-btn" onClick={onBack}>Menu général</button>
            <button className="ps-btn" onClick={reset}>Nouvelle fiche</button>
          </div>
        </header>

        {/* ── Search form ── */}
        <div className="ps-card" ref={formRef}>
          <div className="ps-form-layout">

            {/* Left column — search fields */}
            <div className="ps-form-fields">

              {/* Nom */}
              <div className="ps-field-row">
                <label className="ps-label">Nom :</label>
                <div className="ps-input-wrap">
                  <input
                    ref={nomRef}
                    className="ps-input"
                    autoFocus
                    autoComplete="off"
                    value={nom}
                    onChange={e => { setNom(e.target.value); setPatient(null); seek('nom', e.target.value) }}
                    onFocus={() => seek('nom', nom)}
                    onKeyDown={onKey}
                  />
                  {nom && <button className="ps-clear" tabIndex={-1} onMouseDown={reset}>×</button>}
                  {open && openField === 'nom' && (
                    <ul className="ps-dropdown">
                      <li className="ps-dd-head">
                        <span>Nom</span><span>Prénom</span><span>Code</span><span>Naissance</span>
                      </li>
                      {DropdownRows(r => r.nom, r => r.prenom)}
                    </ul>
                  )}
                </div>
              </div>

              {/* Prénom */}
              <div className="ps-field-row">
                <label className="ps-label">Prénom :</label>
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
                    <ul className="ps-dropdown">
                      <li className="ps-dd-head">
                        <span>Prénom</span><span>Nom</span><span>Code</span><span>Naissance</span>
                      </li>
                      {DropdownRows(r => r.prenom, r => r.nom)}
                    </ul>
                  )}
                </div>
              </div>

              {/* Code */}
              <div className="ps-field-row">
                <label className="ps-label">Code :</label>
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
                    <ul className="ps-dropdown">
                      <li className="ps-dd-head">
                        <span>Code</span><span>Nom</span><span>Prénom</span><span>Naissance</span>
                      </li>
                      {DropdownRows(r => r.numero_dossier, r => r.nom, 'c-mono')}
                    </ul>
                  )}
                </div>
              </div>

            </div>

            {/* Right column — meta */}
            <div className="ps-form-meta">
              <div className="ps-meta-row">
                <span className="ps-meta-label">Fiche des notes :</span>
                {patient
                  ? <span className={`ps-notes-chip${patient.notes_state ? ' on' : ''}`}>
                      {patient.notes_state ? 'Oui' : 'Non'}
                    </span>
                  : <span className="ps-notes-chip">—</span>}
              </div>
              <div className="ps-meta-row">
                <span className="ps-meta-label">Âge :</span>
                <span className="ps-age-val">
                  {patient?.date_naissance ? calcAge(patient.date_naissance) : '—'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ── Patient detail ── */}
        {patient && (
          <div className="ps-patient">

            <div className="ps-patient-head">
              <div>
                <p className="ps-patient-sub">
                  {[patient.civilite, patient.sexe, patient.situation_famille].filter(Boolean).join(' · ')}
                </p>
                <h2 className="ps-patient-name">
                  {patient.prenom} <strong>{patient.nom}</strong>
                  {patient.nom_jeune_fille && patient.nom_jeune_fille !== patient.nom && (
                    <small> née {patient.nom_jeune_fille}</small>
                  )}
                </h2>
              </div>
              <div className="ps-chips">
                {patient.date_naissance && (
                  <span className="ps-chip ps-chip--age">
                    {calcAge(patient.date_naissance)}
                    <small> · {fmtDate(patient.date_naissance)}</small>
                  </span>
                )}
                {patient.statut && <span className="ps-chip">{patient.statut}</span>}
                {patient.couverture_sociale && <span className="ps-chip">{patient.couverture_sociale}</span>}
              </div>
            </div>

            {patient.remarques_medicales_importantes && (
              <div className="ps-alert">
                <strong>⚠ Important :</strong> {patient.remarques_medicales_importantes}
              </div>
            )}

            <div className="ps-detail-grid">
              <section className="ps-section">
                <h3 className="ps-section-title">Identification</h3>
                <InfoRow label="Code dossier"       value={patient.numero_dossier} />
                <InfoRow label="Matricule"           value={patient.matricule} />
                <InfoRow label="Lieu de naissance"  value={patient.lieu_naissance} />
                <InfoRow label="Origine"            value={patient.origine} />
              </section>
              <section className="ps-section">
                <h3 className="ps-section-title">Contact</h3>
                <InfoRow label="Adresse"     value={patient.adresse} />
                <InfoRow label="Ville"       value={[patient.ville, patient.code_ville].filter(Boolean).join(' ')} />
                <InfoRow label="Gouvernorat" value={patient.gouvernorat_pays} />
                <InfoRow label="Tél. dom."   value={patient.tel_domicile} />
                <InfoRow label="Tél. bur."   value={patient.tel_bureau} />
                <InfoRow label="Proche"      value={patient.proche} />
                <InfoRow label="Tél. proche" value={patient.tel_proche} />
              </section>
              <section className="ps-section">
                <h3 className="ps-section-title">Profession</h3>
                <InfoRow label="Profession" value={patient.profession} />
                <InfoRow label="Employeur"  value={patient.employeur} />
              </section>
              <section className="ps-section">
                <h3 className="ps-section-title">Suivi</h3>
                <InfoRow label="1ère consultation" value={fmtDate(patient.date_premiere_consultation)} />
                <InfoRow label="N° affiliation"    value={patient.numero_affiliation} />
              </section>
            </div>

            {patient.remarques && (
              <div className="ps-remarks">
                <span className="ps-remarks-label">Remarques</span>
                <p>{patient.remarques}</p>
              </div>
            )}
            {patient.notes && (
              <div className="ps-remarks">
                <span className="ps-remarks-label">Notes</span>
                <p>{patient.notes}</p>
              </div>
            )}

          </div>
        )}

        {!patient && (
          <p className="ps-hint">Tapez dans un des champs pour chercher un patient.</p>
        )}

      </div>
    </div>
  )
}