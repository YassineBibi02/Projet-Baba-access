import { useState, useEffect, useRef, forwardRef } from 'react'
import type { PatientFull } from '../../../preload/index.d'
import { createPortal } from 'react-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import './PatientSearch.css'
import './NewPatient.css'

registerLocale('fr', fr)

interface Props { onBack: () => void; editCompteur?: number | null }

interface Form {
  nom: string
  prenom: string
  nom_jeune_fille: string
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
    nom: '', prenom: '', nom_jeune_fille: '', numero_dossier: '',
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

// Convert DD/MM/YYYY string to Date, or null
function parseDDMMYYYY(s: string): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const d = new Date(+m[3], +m[2] - 1, +m[1])
  return isNaN(d.getTime()) ? null : d
}

function dateToDDMMYYYY(d: Date): string {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

// Convert DD/MM/YYYY → M/D/YYYY (Access date format) for DB storage
function toAccessDate(s: string): string | null {
  if (!s.trim()) return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return s || null
  return `${parseInt(m[2])}/${parseInt(m[1])}/${m[3]}`
}

// Convert Access M/D/YYYY → DD/MM/YYYY for display
function fromAccessDate(raw: string | null): string {
  if (!raw) return ''
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return ''
  return `${String(+m[2]).padStart(2,'0')}/${String(+m[1]).padStart(2,'0')}/${m[3]}`
}

function patientToForm(p: PatientFull): Form {
  return {
    nom:                      p.nom ?? '',
    prenom:                   p.prenom ?? '',
    nom_jeune_fille:          p.nom_jeune_fille ?? '',
    numero_dossier:           p.n_dossier ?? '',
    date_naissance:           fromAccessDate(p.date_de_naissance),
    lieu_naissance:           p.lieu_de_naissance ?? '',
    sexe:                     p.sexe ?? '',
    situation_famille:        p.situation_de_famille ?? '',
    adresse:                  p.adresse ?? '',
    ville:                    p.ville ?? '',
    code_ville:               p.code_ville ?? '',
    gouvernorat_pays:         p.gouvernorat_ou_pays ?? '',
    profession:               p.profession ?? '',
    employeur:                p.employeur ?? '',
    activite_employeur:       p.activite_employeur ?? '',
    adresse_profession:       p.adresse_profession ?? '',
    ville_profession:         p.ville_profession ?? '',
    code_ville_profession:    p.code_ville_profession ?? '',
    tel_domicile:             p.tel_domicile ?? '',
    tel_bureau:               p.tel_bureau ?? '',
    proche:                   p.proche ?? '',
    tel_proche:               p.tel_proche ?? '',
    date_premiere_consultation: fromAccessDate(p.date_1ere_consultation),
    statut:                   p.statut ?? '',
    couverture_sociale:       p.couverture_sociale ?? '',
    numero_affiliation:       p.n_affiliation ?? '',
    remarques:                p.remarques ?? '',
    notes_state:              Number(p.notesstate) === 1,
  }
}

// ── Date picker input ─────────────────────────────────────────────────────────

// Renders the calendar popup in document.body so it never affects flex layout
function CalendarPortal({ children }: { children?: React.ReactNode }) {
  return createPortal(children ?? null, document.body)
}

// Auto-insert slashes: "31012002" → "31/01/2002"
function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// Custom input that owns its own text state so react-datepicker's injected
// `value` prop is ignored; only `displayText` and `onTextChange` matter.
interface DateNativeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  displayText?: string
  onTextChange?: (v: string) => void
}

const DateNativeInput = forwardRef<HTMLInputElement, DateNativeInputProps>(
  function DateNativeInput(
    { value: _rdp, onChange: _rdpOnChange, displayText = '', onTextChange, ...rest },
    ref
  ) {
    return (
      <input
        ref={ref}
        {...rest}
        value={displayText}
        onChange={e => onTextChange?.(formatDateInput(e.target.value))}
        className="np-inp np-inp--sm"
        autoComplete="off"
      />
    )
  }
)

interface DateInputProps { value: string; onChange: (v: string) => void; maxDate?: Date }

function DateInput({ value, onChange, maxDate }: DateInputProps) {
  const [displayText, setDisplayText] = useState(value)

  // Sync when parent resets the form
  useEffect(() => { setDisplayText(value) }, [value])

  function handleTextChange(text: string) {
    setDisplayText(text)
    const parsed = parseDDMMYYYY(text)
    onChange(parsed ? dateToDDMMYYYY(parsed) : text)
  }

  return (
    <DatePicker
      locale="fr"
      dateFormat="dd/MM/yyyy"
      selected={parseDDMMYYYY(displayText)}
      onChange={(date: Date | null) => {
        const formatted = date ? dateToDDMMYYYY(date) : ''
        setDisplayText(formatted)
        onChange(formatted)
      }}
      placeholderText="jj/mm/aaaa"
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={120}
      showMonthDropdown
      dropdownMode="select"
      maxDate={maxDate}
      customInput={
        <DateNativeInput displayText={displayText} onTextChange={handleTextChange} />
      }
      popperPlacement="bottom-start"
      popperProps={{ strategy: 'fixed' }}
      popperContainer={CalendarPortal}
    />
  )
}

// ── Lookup field ──────────────────────────────────────────────────────────────

interface LookupProps {
  value: string
  onChange: (v: string) => void
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'half' | 'grow'
  source?: string
  options?: string[]
}

interface LookupData { vals: string[]; hasAfter: boolean }
const EMPTY_LD: LookupData = { vals: [], hasAfter: false }

function Lookup({ value, onChange, size = 'md', source, options: fixedOpts }: LookupProps) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<LookupData>(EMPTY_LD)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const hasLookup = !!(source || fixedOpts)

  useEffect(() => {
    if (!open || !source) return
    let alive = true
    window.api.lookupSearch({ source, value: value.trim() }).then((result) => {
      if (alive) setData(result)
    })
    return () => { alive = false }
  }, [open, value, source])

  useEffect(() => { if (!open) setData(EMPTY_LD) }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function loadMore() {
    if (!source || !data.hasAfter || loadingRef.current || data.vals.length === 0) return
    loadingRef.current = true
    try {
      const result = await window.api.lookupLoadMore({
        source,
        value: value.trim(),
        anchor: data.vals[data.vals.length - 1],
      })
      setData(prev => ({ vals: [...prev.vals, ...result.vals], hasAfter: result.hasAfter }))
    } finally {
      loadingRef.current = false
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) loadMore()
  }

  const displayOptions = fixedOpts
    ? (value.trim()
        ? fixedOpts.filter(o => o.toLowerCase().includes(value.toLowerCase()))
        : fixedOpts)
    : data.vals

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
        <div className="np-lookup-dd" onScroll={handleScroll}>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function NewPatient({ onBack, editCompteur }: Props) {
  const [form, setForm] = useState<Form>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteResult, setDeleteResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const [countdown, setCountdown] = useState(3)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!deleteResult?.ok) return
    let c = 3
    setCountdown(3)
    countdownRef.current = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c === 0) {
        clearInterval(countdownRef.current!)
        onBack()
      }
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [deleteResult])

  useEffect(() => {
    if (editCompteur) {
      window.api.getPatient(editCompteur).then(p => {
        if (p) setForm(patientToForm(p))
      })
    } else {
      window.api.getNextDossier().then(code => {
        if (code) setForm(prev => ({ ...prev, numero_dossier: code }))
      })
    }
  }, [editCompteur])

  function set<K extends keyof Form>(field: K, value: Form[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.nom.trim() && !form.prenom.trim()) {
      setFeedback({ type: 'error', msg: 'Le nom ou le prénom est requis.' })
      return
    }

    if (form.date_naissance) {
      const dob = parseDDMMYYYY(form.date_naissance)
      if (!dob) {
        setFeedback({ type: 'error', msg: 'Date de naissance invalide (format attendu : jj/mm/aaaa).' })
        return
      }
      const today = new Date(); today.setHours(0, 0, 0, 0)
      if (dob > today) {
        setFeedback({ type: 'error', msg: 'La date de naissance ne peut pas être dans le futur.' })
        return
      }
      const limit = new Date(); limit.setFullYear(limit.getFullYear() - 120)
      if (dob < limit) {
        setFeedback({ type: 'error', msg: 'La date de naissance ne peut pas dépasser 120 ans.' })
        return
      }
    }
    setSaving(true)
    setFeedback(null)
    try {
      const data: Record<string, string | number | null> = {
        nom:                    form.nom.trim() || null,
        nom_jeune_fille:        form.nom_jeune_fille.trim() || null,
        prenom:                 form.prenom.trim() || null,
        n_dossier:              form.numero_dossier.trim() || null,
        date_de_naissance:      toAccessDate(form.date_naissance),
        lieu_de_naissance:      form.lieu_naissance.trim() || null,
        sexe:                   form.sexe.trim() || null,
        situation_de_famille:   form.situation_famille.trim() || null,
        adresse:                form.adresse.trim() || null,
        ville:                  form.ville.trim() || null,
        code_ville:             form.code_ville.trim() || null,
        gouvernorat_ou_pays:    form.gouvernorat_pays.trim() || null,
        profession:             form.profession.trim() || null,
        employeur:              form.employeur.trim() || null,
        activite_employeur:     form.activite_employeur.trim() || null,
        adresse_profession:     form.adresse_profession.trim() || null,
        ville_profession:       form.ville_profession.trim() || null,
        code_ville_profession:  form.code_ville_profession.trim() || null,
        tel_bureau:             form.tel_bureau.trim() || null,
        tel_domicile:           form.tel_domicile.trim() || null,
        proche:                 form.proche.trim() || null,
        tel_proche:             form.tel_proche.trim() || null,
        n_affiliation:          form.numero_affiliation.trim() || null,
        statut:                 form.statut.trim() || null,
        couverture_sociale:     form.couverture_sociale.trim() || null,
        date_1ere_consultation: toAccessDate(form.date_premiere_consultation),
        notesstate:             form.notes_state ? 1 : 0,
        remarques:              form.remarques.trim() || null,
      }

      const result = editCompteur
        ? await window.api.updatePatient(editCompteur, data)
        : await window.api.createPatient(data)

      if (result.ok) {
        if (editCompteur) {
          setFeedback({ type: 'success', msg: 'Fiche mise à jour.' })
        } else {
          setFeedback({ type: 'success', msg: `Patient enregistré (n° ${'compteur' in result ? result.compteur : ''}).` })
          const newForm = emptyForm()
          setForm(newForm)
          window.api.getNextDossier().then(code => {
            if (code) setForm(prev => ({ ...prev, numero_dossier: code }))
          })
        }
      } else {
        setFeedback({ type: 'error', msg: `Erreur : ${result.error}` })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editCompteur) return
    const result = await window.api.deletePatient(editCompteur)
    setShowDeleteModal(false)
    setDeleteInput('')
    setDeleteResult(result)
  }

  const expectedName = form.nom.trim().toUpperCase()
  const deleteConfirmed = deleteInput.trim().toUpperCase() === expectedName && expectedName !== ''

  return (
    <div className="ps-shell">

      {/* ── Top bar ── */}
      <div className="ps-topbar">
        <div className="ps-topbar-inner">
          <h1 className="ps-title">{editCompteur ? 'Édition fiche administrative' : 'Fiche administrative'}</h1>
          <div className="ps-topbar-btns">
            {!editCompteur && (
              <button className="ps-btn" onClick={() => {
                setForm(emptyForm())
                setFeedback(null)
                window.api.getNextDossier().then(code => {
                  if (code) setForm(prev => ({ ...prev, numero_dossier: code }))
                })
              }}>Nouvelle fiche</button>
            )}
            <button className="ps-btn" disabled>Imprimer</button>
            <button className="ps-btn" onClick={onBack}>Menu général</button>
            {editCompteur && (
              <button className="ps-btn np-btn--danger" onClick={() => { setDeleteInput(''); setShowDeleteModal(true) }}>
                Supprimer
              </button>
            )}
            <button
              className="ps-btn np-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement…' : editCompteur ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="ps-workspace">
        <div className="ps-card np-card-fill">
          <div className="np-form">

            {feedback && (
              <div className={`np-feedback np-feedback--${feedback.type}`}>
                {feedback.msg}
                <button className="np-feedback-close" onClick={() => setFeedback(null)}>×</button>
              </div>
            )}

            {/* ── IDENTITÉ ── */}
            <div className="np-section">
              <div className="np-section-head">Identité</div>
              <div className="np-section-body">

                <div className="np-row">
                  <span className="np-lbl">Nom</span>
                  <div className="np-inline">
                    <input className="np-inp np-inp--half" value={form.nom}
                      onChange={e => set('nom', e.target.value.toUpperCase())} autoComplete="off" />
                    <span className="np-lbl2 np-lbl2--align">Code dossier</span>
                    <input className="np-inp np-inp--sm" value={form.numero_dossier}
                      onChange={e => set('numero_dossier', e.target.value)} autoComplete="off" />
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Prénom</span>
                  <div className="np-inline">
                    <input className="np-inp np-inp--half" value={form.prenom}
                      onChange={e => set('prenom', e.target.value.toUpperCase())} autoComplete="off" />
                    <span className="np-lbl2 np-lbl2--align">Sexe</span>
                    <Lookup size="xs" source="sexe" value={form.sexe} onChange={v => set('sexe', v)} />
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Nom j. fille</span>
                  <div className="np-inline">
                    <input className="np-inp np-inp--half" value={form.nom_jeune_fille}
                      onChange={e => set('nom_jeune_fille', e.target.value.toUpperCase())} autoComplete="off" />
                    <span className="np-lbl2 np-lbl2--align">Situation</span>
                    <Lookup size="md" source="situation_famille" value={form.situation_famille} onChange={v => set('situation_famille', v)} />
                    {form.situation_famille && <span className="np-badge">{form.situation_famille}</span>}
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Né(e) le</span>
                  <div className="np-inline">
                    <DateInput value={form.date_naissance} onChange={v => set('date_naissance', v)} maxDate={new Date()} />
                    <span className="np-lbl2">Lieu</span>
                    <Lookup size="md" source="lieu_naissance" value={form.lieu_naissance} onChange={v => set('lieu_naissance', v)} />
                  </div>
                </div>

              </div>
            </div>

            {/* ── ADRESSE & CONTACT ── */}
            <div className="np-section">
              <div className="np-section-head">Adresse &amp; Contact</div>
              <div className="np-section-body">

                <div className="np-row">
                  <span className="np-lbl">Adresse</span>
                  <div className="np-inline">
                    <Lookup size="grow" source="adresse" value={form.adresse} onChange={v => set('adresse', v)} />
                    <span className="np-lbl2">Ville</span>
                    <Lookup size="md" source="ville" value={form.ville} onChange={v => set('ville', v)} />
                    <Lookup size="sm" source="code_ville" value={form.code_ville} onChange={v => set('code_ville', v)} />
                    <span className="np-lbl2">Gouv./pays</span>
                    <Lookup size="sm" source="gouvernorat" value={form.gouvernorat_pays} onChange={v => set('gouvernorat_pays', v)} />
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Tél domicile</span>
                  <div className="np-inline">
                    <input className="np-inp np-inp--md" value={form.tel_domicile}
                      onChange={e => set('tel_domicile', e.target.value)} autoComplete="off" />
                    <span className="np-lbl2">Tél bureau</span>
                    <input className="np-inp np-inp--md" value={form.tel_bureau}
                      onChange={e => set('tel_bureau', e.target.value)} autoComplete="off" />
                    <span className="np-lbl2">Proche</span>
                    <Lookup size="md" source="proche" value={form.proche} onChange={v => set('proche', v)} />
                    <span className="np-lbl2">Tél proche</span>
                    <input className="np-inp np-inp--md" value={form.tel_proche}
                      onChange={e => set('tel_proche', e.target.value)} autoComplete="off" />
                  </div>
                </div>

              </div>
            </div>

            {/* ── ACTIVITÉ PROFESSIONNELLE ── */}
            <div className="np-section">
              <div className="np-section-head">Activité professionnelle</div>
              <div className="np-section-body">

                <div className="np-row">
                  <span className="np-lbl">Profession</span>
                  <div className="np-inline">
                    <Lookup size="grow" source="profession" value={form.profession} onChange={v => set('profession', v)} />
                    <span className="np-lbl2">Employeur</span>
                    <Lookup size="grow" source="employeur" value={form.employeur} onChange={v => set('employeur', v)} />
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Activité</span>
                  <Lookup size="grow" source="activite_employeur" value={form.activite_employeur} onChange={v => set('activite_employeur', v)} />
                </div>

                <div className="np-row">
                  <span className="np-lbl">Adresse pro</span>
                  <div className="np-inline">
                    <Lookup size="grow" source="adresse_prof" value={form.adresse_profession} onChange={v => set('adresse_profession', v)} />
                    <span className="np-lbl2">Ville</span>
                    <Lookup size="md" source="ville_prof" value={form.ville_profession} onChange={v => set('ville_profession', v)} />
                    <Lookup size="sm" source="code_ville_prof" value={form.code_ville_profession} onChange={v => set('code_ville_profession', v)} />
                  </div>
                </div>

              </div>
            </div>

            {/* ── SUIVI MÉDICAL ── */}
            <div className="np-section">
              <div className="np-section-head">Suivi médical</div>
              <div className="np-section-body">

                <div className="np-row">
                  <span className="np-lbl">1ère consult</span>
                  <div className="np-inline">
                    <input className="np-inp np-inp--sm" value={form.date_premiere_consultation}
                      onChange={e => set('date_premiere_consultation', e.target.value)} autoComplete="off" />
                    <span className="np-lbl2">Dernière</span>
                    <input className="np-inp np-inp--sm" value="" readOnly />
                    <span className="np-lbl2">Solde</span>
                    <input className="np-inp np-inp--sm" value="" readOnly />
                    <span className="np-lbl2">Statut</span>
                    <Lookup size="md" source="statut" value={form.statut} onChange={v => set('statut', v)} />
                    <span className="np-lbl2">Fiche notes</span>
                    <input type="checkbox" className="np-checkbox" checked={form.notes_state}
                      onChange={e => set('notes_state', e.target.checked)} />
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Assurance</span>
                  <div className="np-inline">
                    <Lookup size="grow" value={form.couverture_sociale} onChange={v => set('couverture_sociale', v)} />
                    <span className="np-lbl2">N° affiliation</span>
                    <input className="np-inp np-inp--md" value={form.numero_affiliation}
                      onChange={e => set('numero_affiliation', e.target.value)} autoComplete="off" />
                  </div>
                </div>

                <div className="np-row">
                  <span className="np-lbl">Médecins</span>
                  <input className="np-inp" value="" readOnly />
                </div>

                <div className="np-row">
                  <span className="np-lbl">Confier à</span>
                  <input className="np-inp" value="" readOnly />
                </div>

                <div className="np-row">
                  <span className="np-lbl">Remarques</span>
                  <textarea className="np-textarea np-textarea--auto" value={form.remarques} rows={1}
                    onChange={e => {
                      set('remarques', e.target.value)
                      const el = e.target
                      el.style.height = 'auto'
                      el.style.height = `${el.scrollHeight}px`
                    }} />
                </div>

              </div>
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

      {/* ── Delete result modal ── */}
      {deleteResult && (
        <div className="np-modal-overlay">
          <div className="np-modal">
            <h2 className={`np-modal-title ${deleteResult.ok ? 'np-modal-title--success' : ''}`}>
              {deleteResult.ok ? 'Patient supprimé' : 'Erreur de suppression'}
            </h2>
            <p className="np-modal-body">
              {deleteResult.ok
                ? `La fiche a été supprimée avec succès. Redirection dans ${countdown}…`
                : `Erreur : ${deleteResult.error}`}
            </p>
            <div className="np-modal-actions">
              <button
                className="np-modal-btn np-modal-btn--cancel"
                onClick={() => {
                  if (deleteResult.ok) {
                    if (countdownRef.current) clearInterval(countdownRef.current)
                    onBack()
                  } else {
                    setDeleteResult(null)
                  }
                }}
              >
                {deleteResult.ok ? 'Retour maintenant' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="np-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="np-modal" onClick={e => e.stopPropagation()}>
            <h2 className="np-modal-title">Supprimer le patient</h2>
            <p className="np-modal-body">
              Cette action est <strong>irréversible</strong>. La fiche de{' '}
              <strong>{[form.prenom, form.nom].filter(Boolean).join(' ')}</strong> sera définitivement supprimée.
            </p>
            <div>
              <div className="np-modal-label">Tapez le nom <strong>{form.nom}</strong> pour confirmer :</div>
              <input
                className="np-modal-inp"
                autoFocus
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && deleteConfirmed) handleDelete() }}
                placeholder={form.nom}
              />
            </div>
            <div className="np-modal-actions">
              <button className="np-modal-btn np-modal-btn--cancel" onClick={() => setShowDeleteModal(false)}>
                Annuler
              </button>
              <button className="np-modal-btn np-modal-btn--delete" disabled={!deleteConfirmed} onClick={handleDelete}>
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
