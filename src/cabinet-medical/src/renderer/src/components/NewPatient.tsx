import { useState, useEffect, useRef } from 'react'
import './PatientSearch.css'
import './NewPatient.css'

interface Props { onBack: () => void }

interface Form {
  nom: string
  prenom: string
  nom_jeune_fille: string
  matricule: string
  numero_dossier: string
  date_naissance: string
  lieu_naissance: string
  sexe: string
  situation_famille: string
  adresse: string
  ville: string
  code_ville: string
  gouvernorat_pays: string
  profession: string
  employeur: string
  activite_employeur: string
  adresse_profession: string
  ville_profession: string
  code_ville_profession: string
  tel_domicile: string
  tel_bureau: string
  proche: string
  tel_proche: string
  date_premiere_consultation: string
  statut: string
  couverture_sociale: string
  numero_affiliation: string
  remarques: string
  notes_state: boolean
}

function todayFr(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function emptyForm(): Form {
  return {
    nom: '', prenom: '', nom_jeune_fille: '', matricule: '', numero_dossier: '',
    date_naissance: '', lieu_naissance: '', sexe: '', situation_famille: '',
    adresse: '', ville: '', code_ville: '', gouvernorat_pays: '',
    profession: '', employeur: '', activite_employeur: '',
    adresse_profession: '', ville_profession: '', code_ville_profession: '',
    tel_domicile: '', tel_bureau: '', proche: '', tel_proche: '',
    date_premiere_consultation: todayFr(),
    statut: '', couverture_sociale: '', numero_affiliation: '',
    remarques: '', notes_state: false,
  }
}

interface LookupProps {
  value: string
  onChange: (v: string) => void
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'grow'
  source?: string      // IPC source name for DB autocomplete
  options?: string[]   // Fixed list filtered in JS
}

function Lookup({ value, onChange, size = 'md', source, options: fixedOpts }: LookupProps) {
  const [open, setOpen] = useState(false)
  const [dbOptions, setDbOptions] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const hasLookup = !!(source || fixedOpts)

  useEffect(() => {
    if (!open || !source) return
    let alive = true
    window.api.lookupSearch({ source, value: value.trim() }).then((rows) => {
      if (alive) setDbOptions(rows.map((r) => r.val))
    })
    return () => { alive = false }
  }, [open, value, source])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const displayOptions = fixedOpts
    ? (value.trim()
        ? fixedOpts.filter(o => o.toLowerCase().includes(value.toLowerCase()))
        : fixedOpts)
    : dbOptions

  return (
    <div ref={containerRef} className={`np-lookup np-lookup--${size}`}>
      <input
        className="np-inp"
        value={value}
        onChange={e => { onChange(e.target.value); if (hasLookup) setOpen(true) }}
        onFocus={() => { if (hasLookup) setOpen(true) }}
        onKeyDown={e => { if (e.key === 'Escape') setOpen(false) }}
        autoComplete="off"
      />
      <button
        type="button"
        className="np-lookup-btn"
        tabIndex={-1}
        onMouseDown={e => { e.preventDefault(); if (hasLookup) setOpen(v => !v) }}
      >
        <span>▲</span><span>▼</span>
      </button>
      {open && displayOptions.length > 0 && (
        <div className="np-lookup-dd">
          {displayOptions.map(opt => (
            <div
              key={opt}
              className="np-lookup-dd-item"
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false) }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewPatient({ onBack }: Props) {
  const [form, setForm] = useState<Form>(emptyForm())

  function set<K extends keyof Form>(field: K, value: Form[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="ps-shell">

      {/* ── Top bar ── */}
      <div className="ps-topbar">
        <div className="ps-topbar-inner">
          <h1 className="ps-title">Fiche administrative</h1>
          <div className="ps-topbar-btns">
            <button className="ps-btn" onClick={() => setForm(emptyForm())}>Nouvelle fiche</button>
            <button className="ps-btn" disabled>Imprimer</button>
            <button className="ps-btn" onClick={onBack}>Menu général</button>
            <button className="ps-btn np-btn--danger" disabled>Supprimer</button>
            <button className="ps-btn np-btn--primary" disabled>Enregistrer</button>
          </div>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="ps-workspace">
        <div className="ps-card">
          <div className="np-form">

            {/* Row 1 — Nom / Matricule */}
            <div className="np-row">
              <span className="np-lbl">Nom</span>
              <input className="np-inp np-inp--grow" value={form.nom}
                onChange={e => set('nom', e.target.value)} autoComplete="off" />
              <span className="np-lbl">Matricule (Réf. interne)</span>
              <input className="np-inp np-inp--md" value={form.matricule}
                onChange={e => set('matricule', e.target.value)} autoComplete="off" />
            </div>

            {/* Row 2 — Prénom / Code dossier */}
            <div className="np-row">
              <span className="np-lbl">Prénom</span>
              <input className="np-inp np-inp--grow" value={form.prenom}
                onChange={e => set('prenom', e.target.value)} autoComplete="off" />
              <span className="np-lbl">Code (dossier)</span>
              <input className="np-inp np-inp--sm" value={form.numero_dossier}
                onChange={e => set('numero_dossier', e.target.value)} autoComplete="off" />
              <button type="button" className="np-action-btn" disabled>Assigner</button>
            </div>

            {/* Row 3 — Nom jeune fille */}
            <div className="np-row">
              <span className="np-lbl">Nom j. fille</span>
              <input className="np-inp np-inp--lg" value={form.nom_jeune_fille}
                onChange={e => set('nom_jeune_fille', e.target.value)} autoComplete="off" />
            </div>

            {/* Row 4 — Naissance / Lieu / Sexe / Situation */}
            <div className="np-row">
              <span className="np-lbl">Né(e) le</span>
              <input className="np-inp np-inp--sm" value={form.date_naissance}
                onChange={e => set('date_naissance', e.target.value)}
                placeholder="jj/mm/aaaa" autoComplete="off" />
              <span className="np-lbl">Lieu</span>
              <Lookup size="sm" source="lieu_naissance" value={form.lieu_naissance} onChange={v => set('lieu_naissance', v)} />
              <span className="np-lbl">Sexe</span>
              <Lookup size="xs" options={['M', 'F']} value={form.sexe} onChange={v => set('sexe', v)} />
              <span className="np-lbl">Situation</span>
              <Lookup size="md" options={['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)', 'Enfant']} value={form.situation_famille} onChange={v => set('situation_famille', v)} />
              {form.situation_famille && (
                <span className="np-badge">{form.situation_famille}</span>
              )}
            </div>

            <div className="np-divider" />

            {/* Row 5 — Adresse / Ville / Code ville */}
            <div className="np-row">
              <span className="np-lbl">Adresse</span>
              <Lookup size="grow" source="adresse" value={form.adresse} onChange={v => set('adresse', v)} />
              <span className="np-lbl">Ville</span>
              <Lookup size="md" source="ville" value={form.ville} onChange={v => set('ville', v)} />
              <Lookup size="sm" source="code_ville" value={form.code_ville} onChange={v => set('code_ville', v)} />
            </div>

            {/* Row 6 — Gouv/pays / Profession */}
            <div className="np-row">
              <span className="np-lbl">Gouv./pays</span>
              <Lookup size="md" source="gouvernorat" value={form.gouvernorat_pays} onChange={v => set('gouvernorat_pays', v)} />
              <span className="np-lbl">Profession</span>
              <Lookup size="grow" source="profession" value={form.profession} onChange={v => set('profession', v)} />
            </div>

            <div className="np-divider" />

            {/* Row 7 — Employeur / Activité */}
            <div className="np-row">
              <span className="np-lbl">Employeur</span>
              <Lookup size="grow" source="employeur" value={form.employeur} onChange={v => set('employeur', v)} />
              <span className="np-lbl">Activité</span>
              <Lookup size="grow" source="activite_employeur" value={form.activite_employeur} onChange={v => set('activite_employeur', v)} />
            </div>

            {/* Row 8 — Adresse pro / Ville pro */}
            <div className="np-row">
              <span className="np-lbl">Adresse</span>
              <Lookup size="grow" source="adresse_prof" value={form.adresse_profession} onChange={v => set('adresse_profession', v)} />
              <span className="np-lbl">Ville</span>
              <Lookup size="md" source="ville_prof" value={form.ville_profession} onChange={v => set('ville_profession', v)} />
              <Lookup size="sm" source="code_ville_prof" value={form.code_ville_profession} onChange={v => set('code_ville_profession', v)} />
            </div>

            <div className="np-divider" />

            {/* Row 9 — Téléphones */}
            <div className="np-row">
              <span className="np-lbl">Tél dom</span>
              <input className="np-inp np-inp--md" value={form.tel_domicile}
                onChange={e => set('tel_domicile', e.target.value)} autoComplete="off" />
              <span className="np-lbl">Tél bur</span>
              <input className="np-inp np-inp--md" value={form.tel_bureau}
                onChange={e => set('tel_bureau', e.target.value)} autoComplete="off" />
              <span className="np-lbl">Tél Proche</span>
              <input className="np-inp np-inp--md" value={form.tel_proche}
                onChange={e => set('tel_proche', e.target.value)} autoComplete="off" />
              <Lookup size="sm" source="proche" value={form.proche} onChange={v => set('proche', v)} />
            </div>

            <div className="np-divider" />

            {/* Row 10 — Dates / Solde / Fiche notes */}
            <div className="np-row">
              <span className="np-lbl">1ère consult</span>
              <input className="np-inp np-inp--sm" value={form.date_premiere_consultation}
                onChange={e => set('date_premiere_consultation', e.target.value)} autoComplete="off" />
              <span className="np-lbl">Dernière consult</span>
              <input className="np-inp np-inp--sm" value="" readOnly />
              <span className="np-lbl">Solde</span>
              <input className="np-inp np-inp--sm" value="" readOnly />
              <span className="np-lbl">Fiche notes</span>
              <input type="checkbox" className="np-checkbox"
                checked={form.notes_state}
                onChange={e => set('notes_state', e.target.checked)} />
            </div>

            {/* Row 11 — Statut / Assurance / N° affiliation */}
            <div className="np-row">
              <span className="np-lbl">Statut</span>
              <Lookup size="md" source="statut" value={form.statut} onChange={v => set('statut', v)} />
              <span className="np-lbl">Assurance</span>
              <Lookup size="grow" value={form.couverture_sociale} onChange={v => set('couverture_sociale', v)} />
              <span className="np-lbl">N° affiliation</span>
              <input className="np-inp np-inp--md" value={form.numero_affiliation}
                onChange={e => set('numero_affiliation', e.target.value)} autoComplete="off" />
            </div>

            {/* Auto-notes area (grey, read-only) */}
            <textarea className="np-auto-notes" readOnly placeholder="" />

            <div className="np-divider" />

            {/* Médecins traitants */}
            <div className="np-list-row">
              <span className="np-list-label">Médecins traitants</span>
              <div className="np-list-box" />
            </div>

            {/* Confier à */}
            <div className="np-list-row">
              <span className="np-list-label">Confier à</span>
              <div className="np-list-box" />
            </div>

            <div className="np-divider" />

            {/* Remarques */}
            <div className="np-remarks-row">
              <span className="np-list-label">Remarques</span>
              <textarea className="np-textarea" value={form.remarques}
                onChange={e => set('remarques', e.target.value)} />
            </div>

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="ps-footer">
        <div className="ps-footer-inner">
          <div className="ps-footer-row-fill">
            <button className="ps-footer-btn ps-footer-btn--active" disabled>Administrative</button>
            <button className="ps-footer-btn" disabled>Visu Dossier</button>
            <button className="ps-footer-btn" disabled>Consultation Zoom</button>
            <button className="ps-footer-btn" disabled>Ordonnance</button>
            <button className="ps-footer-btn" disabled>Actes</button>
            <button className="ps-footer-btn" disabled>Courrier</button>
            <button className="ps-footer-btn" disabled>Résumé</button>
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
