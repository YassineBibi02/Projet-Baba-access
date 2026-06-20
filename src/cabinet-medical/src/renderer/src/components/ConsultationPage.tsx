import { useState, useEffect, useRef } from 'react'
import './ConsultationPage.css'

interface ThemePanel {
  key: string
  themeTitle: string
  content: string
  compteurTheme: number | null
  isDirty: boolean
}

interface Props {
  compteur: number
  nom: string | null
  prenom: string | null
  dateNaissance: string | null
  notesState: string | null
  numeroDossier: string | number
  initialNumeroConsultation: number
  autoNew?: boolean
  onBack: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAccessDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
  return isNaN(d.getTime()) ? null : d
}

function fmtDateFR(s: string | null | undefined): string {
  const d = parseAccessDate(s)
  if (!d) return '—'
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function fmtTime(s: string | null | undefined): string {
  if (!s) return ''
  const m = s.match(/(\d{1,2}:\d{2})/)
  return m ? m[1] : ''
}

function calcAge(dob: string | null | undefined, ref: string | null | undefined): string {
  const d1 = parseAccessDate(dob)
  const d2 = parseAccessDate(ref)
  if (!d1 || !d2) return '—'
  let yy = d2.getFullYear() - d1.getFullYear()
  let mm = d2.getMonth() - d1.getMonth()
  let dd = d2.getDate() - d1.getDate()
  if (dd < 0) { mm--; dd += new Date(d2.getFullYear(), d2.getMonth(), 0).getDate() }
  if (mm < 0) { yy--; mm += 12 }
  return `${yy} ans ${mm} mois ${dd} jours`
}

function calcRecul(consultations: any[], idx: number): string {
  if (idx <= 0) return '—'
  const prev = parseAccessDate(consultations[idx - 1]?.date_consultation)
  const curr = parseAccessDate(consultations[idx]?.date_consultation)
  if (!prev || !curr) return '—'
  const totalDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
  if (totalDays < 0) return '—'
  if (totalDays === 0) return 'Même jour'
  let yy = curr.getFullYear() - prev.getFullYear()
  let mm = curr.getMonth() - prev.getMonth()
  let dd = curr.getDate() - prev.getDate()
  if (dd < 0) { mm--; dd += new Date(curr.getFullYear(), curr.getMonth(), 0).getDate() }
  if (mm < 0) { yy--; mm += 12 }
  const parts: string[] = []
  if (yy > 0) parts.push(`${yy} an${yy > 1 ? 's' : ''}`)
  if (mm > 0) parts.push(`${mm} mois`)
  if (dd > 0 || parts.length === 0) parts.push(`${dd} jour${dd > 1 ? 's' : ''}`)
  return parts.join(' ')
}

function nowMDY(): string {
  const n = new Date()
  return `${n.getMonth()+1}/${n.getDate()}/${n.getFullYear()}`
}
function nowHMS(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:00`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConsultationPage({
  compteur, nom, prenom, dateNaissance, notesState,
  numeroDossier, initialNumeroConsultation, autoNew, onBack
}: Props) {
  const [consultations, setConsultations] = useState<any[]>([])
  const [allThemes, setAllThemes]         = useState<any[]>([])
  const [themeTypes, setThemeTypes]       = useState<string[]>([])
  const [currentIndex, setCurrentIndex]   = useState(0)
  const [panels, setPanels]               = useState<ThemePanel[]>([])
  const [saving, setSaving]               = useState(false)
  const [isNew, setIsNew]                 = useState(false)
  const [newDT, setNewDT]                 = useState<{ date: string; time: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<ThemePanel | null>(null)
  const [addPickerOpen, setAddPickerOpen] = useState(false)
  const addBtnRef = useRef<HTMLDivElement>(null)

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      window.api.loadConsultationsForDossier(compteur, numeroDossier),
      window.api.getThemeTypes()
    ]).then(([data, types]) => {
      const typeNames = (types as any[]).map(t => t.titre_theme as string)
      setThemeTypes(typeNames)
      const consults = (data as any).consultations ?? []
      setConsultations(consults)
      setAllThemes((data as any).themes ?? [])
      if (autoNew) {
        setIsNew(true)
        setNewDT({ date: nowMDY(), time: nowHMS() })
      } else {
        const idx = consults.findIndex(
          (c: any) => Number(c.numero_consultation) === initialNumeroConsultation
        )
        setCurrentIndex(idx >= 0 ? idx : 0)
      }
    })
  }, [compteur, numeroDossier, initialNumeroConsultation, autoNew])

  // ── Rebuild panels when navigation or data changes ───────────────────────────
  useEffect(() => {
    if (isNew) { setPanels([]); return }
    const consult = consultations[currentIndex]
    if (!consult) { setPanels([]); return }
    const themes = (allThemes as any[]).filter(t =>
      String(t.numero_dossier_medical) === String(consult.numero_dossier_medical) &&
      String(t.numero_consultation)    === String(consult.numero_consultation)
    )
    setPanels(themes.map((t: any) => ({
      key:           `e-${t.compteur_consultation_themes}`,
      themeTitle:    t.titre_theme ?? '',
      content:       t.contenu_theme ?? '',
      compteurTheme: t.compteur_consultation_themes
        ? Number(t.compteur_consultation_themes) : null,
      isDirty: false
    })))
  }, [currentIndex, isNew, allThemes, consultations])

  // ── Close add-picker on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!addPickerOpen) return
    function onDown(e: MouseEvent) {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target as Node)) {
        setAddPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [addPickerOpen])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const total          = consultations.length
  const currentConsult = isNew ? null : consultations[currentIndex]
  const usedThemes     = new Set(panels.map(p => p.themeTitle))
  const availThemes    = themeTypes.filter(t => !usedThemes.has(t))
  const hasDirty       = panels.some(p => p.isDirty)

  const displayN     = isNew
    ? (total > 0 ? Number(consultations[total-1]?.numero_consultation ?? 0) + 1 : 1)
    : (currentConsult?.numero_consultation ?? '—')
  const displayDate  = isNew ? fmtDateFR(newDT?.date) : fmtDateFR(currentConsult?.date_consultation)
  const displayTime  = isNew ? fmtTime(newDT?.time)   : fmtTime(currentConsult?.heure_consultation)
  const displayRecul = isNew
    ? calcRecul([...consultations, { date_consultation: newDT?.date }], total)
    : calcRecul(consultations, currentIndex)
  const displayAge   = calcAge(dateNaissance, isNew ? newDT?.date : currentConsult?.date_consultation)
  const dossierN     = consultations[0]?.numero_dossier_medical ?? numeroDossier
  const dossierTitre = consultations[0]?.titre_dossier_medical ?? ''

  // ── Data helpers ─────────────────────────────────────────────────────────────
  async function reloadData() {
    const data = await window.api.loadConsultationsForDossier(compteur, numeroDossier)
    setConsultations((data as any).consultations ?? [])
    setAllThemes((data as any).themes ?? [])
  }

  function handleNew() {
    setIsNew(true)
    setNewDT({ date: nowMDY(), time: nowHMS() })
  }

  function navigate(delta: number) {
    setIsNew(false)
    setCurrentIndex(prev => Math.max(0, Math.min(total - 1, prev + delta)))
  }

  function updatePanel(key: string, content: string) {
    setPanels(prev => prev.map(p => p.key === key ? { ...p, content, isDirty: true } : p))
  }

  function addTheme(title: string) {
    setPanels(prev => [...prev, {
      key: `new-${Date.now()}`,
      themeTitle: title,
      content: '',
      compteurTheme: null,
      isDirty: true
    }])
    setAddPickerOpen(false)
  }

  function requestRemoveTheme(panel: ThemePanel) {
    if (panel.content.trim()) {
      setRemoveConfirm(panel)
    } else {
      doRemoveTheme(panel)
    }
  }

  async function doRemoveTheme(panel: ThemePanel) {
    setRemoveConfirm(null)
    if (panel.compteurTheme !== null) {
      const r = await window.api.deleteConsultationTheme(panel.compteurTheme)
      if (!r.ok) { alert(`Erreur: ${r.error}`); return }
      await reloadData()
    } else {
      setPanels(prev => prev.filter(p => p.key !== panel.key))
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      if (isNew) {
        const first = panels[0]
        const result = await window.api.createConsultation({
          compteur,
          numeroDossier: String(numeroDossier),
          titreTheme:    first?.themeTitle ?? '',
          contenuTheme:  first?.content ?? ''
        })
        if (!result.ok) { alert(`Erreur: ${result.error}`); return }
        for (const p of panels.slice(1)) {
          if (!p.themeTitle) continue
          await window.api.saveConsultationTheme({
            compteur,
            numeroDossier:      String(numeroDossier),
            numeroConsultation: String(result.numeroConsultation),
            titreTheme:   p.themeTitle,
            contenuTheme: p.content,
            compteurTheme: null
          })
        }
        const data = await window.api.loadConsultationsForDossier(compteur, numeroDossier)
        const consults = (data as any).consultations ?? []
        setConsultations(consults)
        setAllThemes((data as any).themes ?? [])
        const idx = consults.findIndex(
          (c: any) => Number(c.numero_consultation) === result.numeroConsultation
        )
        setCurrentIndex(idx >= 0 ? idx : consults.length - 1)
        setIsNew(false)
      } else {
        if (!currentConsult) return
        let err = false
        for (const p of panels) {
          if (!p.isDirty) continue
          const r = await window.api.saveConsultationTheme({
            compteur,
            numeroDossier:      String(currentConsult.numero_dossier_medical),
            numeroConsultation: String(currentConsult.numero_consultation),
            titreTheme:   p.themeTitle,
            contenuTheme: p.content,
            compteurTheme: p.compteurTheme
          })
          if (!r.ok) { alert(`Erreur: ${r.error}`); err = true; break }
        }
        if (!err) await reloadData()
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Delete consultation ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!currentConsult) return
    setSaving(true)
    try {
      const r = await window.api.deleteConsultation({
        compteur,
        numeroDossier:      String(currentConsult.numero_dossier_medical),
        numeroConsultation: String(currentConsult.numero_consultation)
      })
      if (!r.ok) { alert(`Erreur: ${r.error}`); return }
      const newList = consultations.filter((_: any, i: number) => i !== currentIndex)
      setConsultations(newList)
      setAllThemes(prev => (prev as any[]).filter(t =>
        !(String(t.numero_dossier_medical) === String(currentConsult.numero_dossier_medical) &&
          String(t.numero_consultation)    === String(currentConsult.numero_consultation))
      ))
      setCurrentIndex(Math.min(currentIndex, Math.max(0, newList.length - 1)))
      setDeleteConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="cp-shell">

      {/* Topbar */}
      <div className="cp-topbar">
        <div className="cp-topbar-inner">
          <h1 className="cp-title">CONSULTATIONS</h1>
          <div className="cp-topbar-btns">
            {hasDirty && !saving && (
              <span className="cp-unsaved-hint">Modifications non enregistrées</span>
            )}
            <button className="cp-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button className="cp-menu-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>

      {/* Scrollable workspace */}
      <div className="cp-workspace">
        <div className="cp-card">

          {/* Patient name + counter */}
          <div className="cp-card-header">
            <div>
              <span className="cp-patient-nom">{nom ?? ''}</span>
              {' '}
              <span className="cp-patient-prenom">{prenom ?? ''}</span>
            </div>
            <div className="cp-card-header-right">
              {isNew
                ? <span className="cp-new-chip">Nouvelle consultation</span>
                : <span className="cp-counter">{total > 0 ? currentIndex + 1 : 0} / {total}</span>
              }
            </div>
          </div>

          {/* ── Inline navigation (between patient name and dossier) ── */}
          <div className="cp-inav">
            <button className="cp-inav-btn"
              onClick={() => navigate(-currentIndex)}
              disabled={isNew || currentIndex === 0 || total === 0}
              title="Première">|◄</button>
            <button className="cp-inav-btn"
              onClick={() => navigate(-1)}
              disabled={isNew || currentIndex === 0 || total === 0}
              title="Précédente">◄ Précédente</button>
            <button className="cp-inav-btn"
              onClick={() => navigate(1)}
              disabled={isNew || currentIndex >= total - 1 || total === 0}
              title="Suivante">Suivante ►</button>
            <button className="cp-inav-btn"
              onClick={() => navigate(total - 1 - currentIndex)}
              disabled={isNew || currentIndex >= total - 1 || total === 0}
              title="Dernière">►|</button>
            <div className="cp-inav-sep" />
            <button
              className={`cp-inav-btn${isNew ? ' cp-inav-btn--active' : ''}`}
              onClick={handleNew}
              disabled={isNew}
            >+ Nouvelle</button>
            <button className="cp-inav-btn cp-inav-btn--del"
              onClick={() => setDeleteConfirm(true)}
              disabled={isNew || !currentConsult}
            >Supprimer</button>
            <div className="cp-inav-sep" />
            <button className="cp-inav-btn" disabled>Visualiser // tout</button>
            <button className="cp-inav-btn" disabled>Impressions</button>
          </div>

          {/* Dossier + notes */}
          <div className="cp-subheader">
            <span className="cp-dossier-num">Dossier {dossierN}</span>
            {dossierTitre && <span className="cp-dossier-titre"> — {dossierTitre}</span>}
            <span className="cp-notes-dot" title="Fiche des notes">
              {notesState ? '● Notes' : '○ Notes'}
            </span>
          </div>

          {/* Consultation info strip */}
          {(total > 0 || isNew) && (
            <div className="cp-info-strip">
              <div className="cp-info-cell">
                <span className="cp-info-label">N°</span>
                <span className="cp-info-value">{displayN}</span>
              </div>
              <div className="cp-info-cell">
                <span className="cp-info-label">Date</span>
                <span className="cp-info-value">{displayDate}</span>
              </div>
              <div className="cp-info-cell">
                <span className="cp-info-label">Heure</span>
                <span className="cp-info-value">{displayTime || '—'}</span>
              </div>
              <div className="cp-info-cell">
                <span className="cp-info-label">Recul</span>
                <span className="cp-info-value cp-info-recul">{displayRecul}</span>
              </div>
              <div className="cp-info-cell cp-info-cell--grow">
                <span className="cp-info-label">Âge</span>
                <span className="cp-info-value">{displayAge}</span>
              </div>
            </div>
          )}

          {/* Theme panels */}
          <div className="cp-themes-area">

            {total === 0 && !isNew && (
              <div className="cp-empty">
                <p>Aucune consultation pour ce dossier.</p>
                <button className="cp-save-btn" onClick={handleNew}>
                  + Nouvelle consultation
                </button>
              </div>
            )}

            {(total > 0 || isNew) && panels.map(panel => (
              <div key={panel.key} className="cp-theme-card">
                <div className="cp-theme-card-top">
                  <span className="cp-theme-badge">{panel.themeTitle}</span>
                  {panel.isDirty && (
                    <span className="cp-dirty-dot" title="Non enregistré">●</span>
                  )}
                  <button
                    className="cp-remove-btn"
                    onClick={() => requestRemoveTheme(panel)}
                    disabled={saving}
                    title="Retirer ce thème"
                  >×</button>
                </div>
                <textarea
                  className="cp-theme-ta"
                  value={panel.content}
                  onChange={e => updatePanel(panel.key, e.target.value)}
                  placeholder={`${panel.themeTitle}…`}
                  rows={5}
                />
              </div>
            ))}

            {/* Add theme button — rendered outside the card's overflow so dropdown is visible */}
            {(total > 0 || isNew) && availThemes.length > 0 && (
              <div className="cp-add-wrap" ref={addBtnRef}>
                <button
                  className="cp-add-btn"
                  onClick={() => setAddPickerOpen(o => !o)}
                >
                  + Ajouter un thème ▾
                </button>
                {addPickerOpen && (
                  <div className="cp-picker">
                    {availThemes.map(title => (
                      <button
                        key={title}
                        className="cp-picker-item"
                        onClick={() => addTheme(title)}
                      >{title}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="cp-footer">
        <div className="cp-footer-inner">
          <div className="cp-footer-row">
            <button className="cp-footer-btn" disabled>Administrative</button>
            <button className="cp-footer-btn" disabled>Visu Dossier</button>
            <button className="cp-footer-btn" disabled>Consultation Zoom</button>
            <button className="cp-footer-btn" disabled>Ordonnance</button>
            <button className="cp-footer-btn" disabled>Actes</button>
            <button className="cp-footer-btn" disabled>Courrier</button>
            <button className="cp-footer-btn" disabled>Résumé</button>
          </div>
          <div className="cp-footer-row cp-footer-row--center">
            <button className="cp-footer-btn" disabled>Examens</button>
            <button className="cp-footer-btn" disabled>Diag.Tare...</button>
            <button className="cp-footer-btn" disabled>Fiche Pers...</button>
            <button className="cp-footer-btn" disabled>Mémo</button>
            <button className="cp-footer-btn" disabled>Lst Recherche</button>
            <button className="cp-footer-btn" disabled>Rendez-vous</button>
            <button className="cp-footer-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>

      {/* Delete consultation modal */}
      {deleteConfirm && (
        <div className="cp-modal-overlay">
          <div className="cp-modal">
            <p className="cp-modal-text">
              Supprimer la consultation N°{currentConsult?.numero_consultation} ?
              <br /><small>Cette action est irréversible.</small>
            </p>
            <div className="cp-modal-btns">
              <button className="cp-modal-btn cp-modal-btn--danger"
                onClick={handleDelete} disabled={saving}>Supprimer</button>
              <button className="cp-modal-btn"
                onClick={() => setDeleteConfirm(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove theme confirmation modal */}
      {removeConfirm && (
        <div className="cp-modal-overlay">
          <div className="cp-modal">
            <p className="cp-modal-text">
              Supprimer le thème <strong>"{removeConfirm.themeTitle}"</strong> ?
              <br /><small>Le contenu saisi sera perdu définitivement.</small>
            </p>
            <div className="cp-modal-btns">
              <button className="cp-modal-btn cp-modal-btn--danger"
                onClick={() => doRemoveTheme(removeConfirm)}>Supprimer</button>
              <button className="cp-modal-btn"
                onClick={() => setRemoveConfirm(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
