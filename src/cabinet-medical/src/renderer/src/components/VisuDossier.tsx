import { useState, useEffect, useCallback } from 'react'
import './VisuDossier.css'
import ConsultationPage from './ConsultationPage'
import { Topbar } from './Topbar'

interface PatientInfo {
  compteur: number
  nom: string | null
  prenom: string | null
  n_dossier: string | null
  date_de_naissance: string | null
  notesstate: string | null
}

interface DossierConsultation {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  date_consultation: string | null
  code_dossier_medical: string | null
  titre_dossier_medical: string | null
}

interface DossierOrdonnance {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_ordonnance: number | null
  date_ordonnance: string | null
}

interface DossierCourrier {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_rapport: number | null
  date_rapport: string | null
  titre_rapport: string | null
}

interface DossierExamen {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_examens: number | null
  date_examens: string | null
  titre_examens: string | null
}

interface DossierActe {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_acte: number | null
  date_actes_et_honoraires: string | null
  total_actes: string | null
}

interface DossierData {
  consultations: DossierConsultation[]
  ordonnances: DossierOrdonnance[]
  courriers: DossierCourrier[]
  examens: DossierExamen[]
  actes: DossierActe[]
}

interface Props {
  patient: PatientInfo
  onBack: () => void   // back to PatientSearch
  onMenu: () => void   // back to Menu général
}

function parseAccessDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
  return isNaN(d.getTime()) ? null : d
}

function fmtDate(raw: string | null | undefined): string {
  const d = parseAccessDate(raw ?? null)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

interface ColumnProps {
  title: string
  children: React.ReactNode
}

function Column({ title, children }: ColumnProps) {
  return (
    <div className="vd-col-wrap">
      <span className="vd-col-title">{title}</span>
      <div className="vd-column">
        <div className="vd-col-body">{children}</div>
      </div>
    </div>
  )
}

interface EntryProps {
  num: number | string | null
  date: string | null | undefined
  clickable?: boolean
  onDoubleClick?: () => void
}

function Entry({ num, date, clickable, onDoubleClick }: EntryProps) {
  return (
    <div
      className={`vd-entry${clickable ? ' vd-entry--clickable' : ''}`}
      onDoubleClick={clickable ? onDoubleClick : undefined}
      title={clickable ? 'Double-cliquer pour ouvrir' : undefined}
    >
      <span className="vd-entry-num">{num ?? '?'}</span>
      <span className="vd-entry-date">{fmtDate(date)}</span>
    </div>
  )
}

export default function VisuDossier({ patient, onBack, onMenu }: Props) {
  const [data, setData] = useState<DossierData | null>(null)
  const [loading, setLoading] = useState(true)
  const [openConsult, setOpenConsult] = useState<{
    numeroDossier: number | string
    numeroConsultation: number
  } | null>(null)

  useEffect(() => {
    if (openConsult !== null) return
    setLoading(true)
    window.api.loadDossier(patient.compteur).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [patient.compteur, openConsult])

  const handleOpenConsult = useCallback((c: DossierConsultation) => {
    setOpenConsult({
      numeroDossier: c.numero_dossier_medical ?? 1,
      numeroConsultation: Number(c.numero_consultation ?? 1),
    })
  }, [])

  if (openConsult) {
    return (
      <ConsultationPage
        compteur={patient.compteur}
        nom={patient.nom}
        prenom={patient.prenom}
        dateNaissance={patient.date_de_naissance}
        notesState={patient.notesstate}
        numeroDossier={openConsult.numeroDossier}
        initialNumeroConsultation={openConsult.numeroConsultation}
        autoNew={false}
        onBack={() => setOpenConsult(null)}
      />
    )
  }

  const name = [patient.prenom, patient.nom].filter(Boolean).join(' ') || '—'
  const code = patient.n_dossier || '—'

  return (
    <div className="vd-shell">

      <Topbar title="Historique Médical" onBack={onBack} />

      {/* ── Workspace ── */}
      <div className="vd-workspace">
        <div className="vd-workspace-inner">

          <div className="vd-patient-card">
            <span className="vd-patient-name">{name}</span>
            <span className="vd-patient-code">Dossier : {code}</span>
          </div>

          {loading ? (
            <div className="vd-loading">Chargement…</div>
          ) : (
            <div className="vd-columns-card">

              <Column title="Consultations">
                {data?.consultations.map((c, i) => (
                  <Entry
                    key={i}
                    num={c.numero_consultation}
                    date={c.date_consultation}
                    clickable
                    onDoubleClick={() => handleOpenConsult(c)}
                  />
                ))}
              </Column>

              <Column title="Ordonnance">
                {data?.ordonnances.map((o, i) => (
                  <Entry key={i} num={o.numero_ordonnance} date={o.date_ordonnance} />
                ))}
              </Column>

              <Column title="Courrier">
                {data?.courriers.map((c, i) => (
                  <Entry key={i} num={c.numero_rapport} date={c.date_rapport} />
                ))}
              </Column>

              <Column title="Examens">
                {data?.examens.map((e, i) => (
                  <Entry key={i} num={e.numero_examens} date={e.date_examens} />
                ))}
              </Column>

              <Column title="Actes & Honoraires">
                {data?.actes.map((a, i) => (
                  <Entry key={i} num={a.numero_acte} date={a.date_actes_et_honoraires} />
                ))}
              </Column>

            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="vd-footer">
        <div className="vd-footer-inner">
          <div className="vd-footer-row-fill">
            <button className="vd-footer-btn" disabled>Administrative</button>
            <button className="vd-footer-btn" disabled>Visu Dossier</button>
            <button className="vd-footer-btn" disabled>Consultation</button>
            <button className="vd-footer-btn" disabled>Ordonnance</button>
            <button className="vd-footer-btn" disabled>Actes</button>
            <button className="vd-footer-btn" disabled>Courrier</button>
            <button className="vd-footer-btn" disabled>Résumé</button>
          </div>
          <div className="vd-footer-row-center">
            <button className="vd-footer-btn" disabled>Examens</button>
            <button className="vd-footer-btn" disabled>Diag.Tare...</button>
            <button className="vd-footer-btn" disabled>Fiche Per...</button>
            <button className="vd-footer-btn" disabled>Mémo</button>
            <button className="vd-footer-btn" disabled>Lst Recherche</button>
            <button className="vd-footer-btn" disabled>Rendez-vous</button>
            <button className="vd-footer-btn" onClick={onMenu}>Menu général</button>
          </div>
        </div>
      </div>

    </div>
  )
}
