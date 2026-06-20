import { useState, useEffect, forwardRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { fr } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import './ConsultationList.css'
import ConsultationPage from './ConsultationPage'

registerLocale('fr', fr)

interface ConsultationByDateRow {
  compteur_consultation: number
  compteur: number
  numero_dossier_medical: number | string | null
  numero_consultation: number | string | null
  date_consultation: string | null
  heure_consultation: string | null
  remarques_consultations: string | null
  flag_remarques_consultations: number | null
  nom: string | null
  prenom: string | null
  date_de_naissance: string | null
  notesstate: string | null
  titre_dossier_medical: string | null
  code_dossier_medical: string | null
}

interface Props { onBack: () => void }

const DAYS   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function dateToDMY(d: Date): string {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function parseDMY(s: string): Date | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  return isNaN(d.getTime()) ? null : d
}

function formatInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function dayLabel(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtTime(raw: string | null | undefined): string {
  if (!raw) return ''
  const m = raw.match(/(\d{1,2}:\d{2})/)
  return m ? m[1] : ''
}

// Custom input: prevents react-datepicker from overriding the displayed text
interface DPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  displayText?: string
  onTextChange?: (v: string) => void
}
const DPInput = forwardRef<HTMLInputElement, DPInputProps>(
  function DPInput({ value: _v, onChange: _o, displayText = '', onTextChange, ...rest }, ref) {
    return (
      <input
        ref={ref}
        {...rest}
        value={displayText}
        onChange={e => onTextChange?.(e.target.value)}
        className="cl-date-inp"
        autoComplete="off"
        spellCheck={false}
        placeholder="JJ/MM/AAAA"
      />
    )
  }
)


// ── Main component ────────────────────────────────────────────────────────────
export default function ConsultationList({ onBack }: Props) {
  const [date, setDate]             = useState<Date>(new Date())
  const [displayText, setText]      = useState(() => dateToDMY(new Date()))
  const [rows, setRows]             = useState<ConsultationByDateRow[]>([])
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState<ConsultationByDateRow | null>(null)

  useEffect(() => {
    let live = true
    setLoading(true)
    window.api.getConsultationsByDate(dateToDMY(date)).then((data: ConsultationByDateRow[]) => {
      if (!live) return
      setRows(data)
      setLoading(false)
    })
    return () => { live = false }
  }, [date])

  function handleTextChange(raw: string) {
    const v = formatInput(raw)
    setText(v)
    const parsed = parseDMY(v)
    if (parsed) setDate(parsed)
  }

  function handlePickerChange(d: Date | null) {
    if (!d) return
    setDate(d)
    setText(dateToDMY(d))
  }

  function step(delta: 1 | -1) {
    const nd = new Date(date)
    nd.setDate(nd.getDate() + delta)
    setDate(nd)
    setText(dateToDMY(nd))
  }

  if (selected) {
    return (
      <ConsultationPage
        compteur={selected.compteur}
        nom={selected.nom}
        prenom={selected.prenom}
        dateNaissance={selected.date_de_naissance}
        notesState={selected.notesstate}
        numeroDossier={selected.numero_dossier_medical ?? 1}
        initialNumeroConsultation={Number(selected.numero_consultation ?? 1)}
        onBack={() => setSelected(null)}
      />
    )
  }

  const label = dayLabel(date)

  return (
    <div className="cl-shell">

      {/* Topbar */}
      <div className="cl-topbar">
        <div className="cl-topbar-inner">
          <h1 className="cl-title">Liste de Consultation</h1>
          <div className="cl-topbar-btns">
            <button className="cl-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="cl-workspace">

        {/* Date filter card */}
        <div className="cl-card">
          <div className="cl-date-bar">
            <button className="cl-nav-btn" onClick={() => step(-1)} title="Jour précédent">◄</button>
            <DatePicker
              locale="fr"
              dateFormat="dd/MM/yyyy"
              selected={date}
              onChange={handlePickerChange}
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={50}
              showMonthDropdown
              dropdownMode="select"
              customInput={
                <DPInput displayText={displayText} onTextChange={handleTextChange} />
              }
            />
            <button className="cl-nav-btn" onClick={() => step(1)} title="Jour suivant">►</button>
            <span className="cl-day-label">{label}</span>
          </div>
        </div>

        {/* Results */}
        <div className="cl-results">
          {loading && <p className="cl-empty">Chargement…</p>}
          {!loading && rows.length === 0 && (
            <p className="cl-empty">Aucune consultation enregistrée le {label}.</p>
          )}
          {!loading && rows.length > 0 && (
            <>
              <div className="cl-results-header">
                {rows.length} consultation{rows.length > 1 ? 's' : ''} — {label}
              </div>
              <table className="cl-table">
                <thead className="cl-thead">
                  <tr>
                    <th className="cl-th cl-th--seq">#</th>
                    <th className="cl-th cl-th--time">Heure</th>
                    <th className="cl-th cl-th--patient">Patient</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.compteur_consultation}
                      className="cl-row cl-row--clickable"
                      onClick={() => setSelected(r)}
                    >
                      <td className="cl-td cl-td--seq">{i + 1}</td>
                      <td className="cl-td cl-td--time">
                        {fmtTime(r.heure_consultation) || '—'}
                      </td>
                      <td className="cl-td cl-td--patient">
                        {r.nom || r.prenom
                          ? <><span className="cl-nom">{r.nom ?? ''}</span>{' '}<span className="cl-prenom">{r.prenom ?? ''}</span></>
                          : <span className="cl-prenom">Patient inconnu</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="cl-footer">
        <div className="cl-footer-inner">
          <div className="cl-footer-row-fill">
            <button className="cl-footer-btn" disabled>Visu Dossier</button>
            <button className="cl-footer-btn" disabled>Consultation Zoom</button>
            <button className="cl-footer-btn" disabled>Ordonnance</button>
            <button className="cl-footer-btn" disabled>Actes</button>
            <button className="cl-footer-btn" disabled>Courrier</button>
            <button className="cl-footer-btn" disabled>Résumé</button>
          </div>
          <div className="cl-footer-row-center">
            <button className="cl-footer-btn" disabled>Examens</button>
            <button className="cl-footer-btn" disabled>Diag.Tare...</button>
            <button className="cl-footer-btn" disabled>Fiche Per...</button>
            <button className="cl-footer-btn" disabled>Mémo</button>
            <button className="cl-footer-btn" disabled>Lst Recherche</button>
            <button className="cl-footer-btn" disabled>Rendez-vous</button>
            <button className="cl-footer-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>

    </div>
  )
}
