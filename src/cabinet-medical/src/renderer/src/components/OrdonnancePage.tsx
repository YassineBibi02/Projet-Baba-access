import { useState, useEffect, useRef } from 'react'
import './OrdonnancePage.css'
import { Topbar } from './Topbar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MedLine {
  key: string
  compteurLigne: number | null
  ordre: number
  nom: string
  posologie: string
  isDirty: boolean
}

interface OrdonnanceRow {
  compteur_ordonnance: number
  numero_dossier_medical: number | string
  numero_consultation: number | null
  numero_ordonnance: number
  date_ordonnance: string | null
  heure_ordonnance: string | null
  duree_valeur: string | null
  duree_unite: string | null
  a_renouveler_fois: number | null
  prochain_controle: string | null
  flag_interactions: number | null
  flag_allergie: number | null
  flag_intolerance: number | null
  flag_diagnostic: number | null
  flag_tare: number | null
  imprimer_entete: number | null
  imprimer_nom_prenom: number | null
  imprimer_date_naissance: number | null
  imprimer_adresse: number | null
  texte_entete: string | null
}

interface LigneRow {
  compteur_ligne: number
  compteur_ordonnance: number
  ordre: number
  nom_medicament: string | null
  posologie: string | null
}

interface Props {
  compteur: number
  civilite: string | null
  nom: string | null
  prenom: string | null
  dateNaissance: string | null
  adresse: string | null
  numeroDossier: string | number
  numeroConsultation: number | null
  onBack: () => void
}

// ── Helpers (mêmes conventions que ConsultationPage) ────────────────────────

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
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
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

function nowMDY(): string {
  const n = new Date()
  return `${n.getMonth() + 1}/${n.getDate()}/${n.getFullYear()}`
}
function nowHMS(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:00`
}

function uid(): string {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const DUREE_UNITES = ['jour(s)', 'semaine(s)', 'mois']

// ── Composant ─────────────────────────────────────────────────────────────────

export default function OrdonnancePage({
  compteur, civilite, nom, prenom, dateNaissance, adresse,
  numeroDossier, numeroConsultation, onBack
}: Props) {
  const [ordonnances, setOrdonnances] = useState<OrdonnanceRow[]>([])
  const [allLignes, setAllLignes]     = useState<LigneRow[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isNew, setIsNew]             = useState(true)
  const [newDT, setNewDT]             = useState<{ date: string; time: string }>({ date: nowMDY(), time: nowHMS() })
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)

  const [lines, setLines]         = useState<MedLine[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const [duree, setDuree]                       = useState('')
  const [dureeUnite, setDureeUnite]             = useState(DUREE_UNITES[0])
  const [renouveler, setRenouveler]             = useState('')
  const [prochainControle, setProchainControle] = useState('')

  const [flagInteractions, setFlagInteractions] = useState(true)
  const [flagAllergie, setFlagAllergie]         = useState(false)
  const [flagIntolerance, setFlagIntolerance]   = useState(false)
  const [flagDiagnostic, setFlagDiagnostic]     = useState(false)
  const [flagTare, setFlagTare]                 = useState(false)

  const [imprimerEntete, setImprimerEntete]               = useState(true)
  const [imprimerNomPrenom, setImprimerNomPrenom]         = useState(true)
  const [imprimerDateNaissance, setImprimerDateNaissance] = useState(false)
  const [imprimerAdresse, setImprimerAdresse]             = useState(false)

  const defaultEntete = `${civilite ? civilite + ' ' : ''}${prenom ?? ''} ${nom ?? ''}`.trim()
  const [texteEntete, setTexteEntete] = useState(defaultEntete)

  const [deleteConfirm, setDeleteConfirm]         = useState(false)
  const [removeLineConfirm, setRemoveLineConfirm] = useState<MedLine | null>(null)

  const printRef = useRef<HTMLDivElement>(null)

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    window.api.loadOrdonnancesForDossier(compteur, numeroDossier).then((data: any) => {
      if (cancelled) return
      const list: OrdonnanceRow[] = data?.ordonnances ?? []
      setOrdonnances(list)
      setAllLignes(data?.lignes ?? [])
      if (list.length > 0) {
        setIsNew(false)
        setCurrentIndex(list.length - 1)
      } else {
        setIsNew(true)
        setNewDT({ date: nowMDY(), time: nowHMS() })
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [compteur, numeroDossier])

  // ── Reconstruction du formulaire à chaque navigation ────────────────────────
  useEffect(() => {
    if (isNew) {
      setLines([])
      setDuree(''); setDureeUnite(DUREE_UNITES[0]); setRenouveler(''); setProchainControle('')
      setFlagInteractions(true); setFlagAllergie(false); setFlagIntolerance(false)
      setFlagDiagnostic(false); setFlagTare(false)
      setImprimerEntete(true); setImprimerNomPrenom(true)
      setImprimerDateNaissance(false); setImprimerAdresse(false)
      setTexteEntete(defaultEntete)
      setActiveKey(null)
      return
    }
    const current = ordonnances[currentIndex]
    if (!current) return
    const ls = allLignes
      .filter(l => l.compteur_ordonnance === current.compteur_ordonnance)
      .sort((a, b) => a.ordre - b.ordre)
    setLines(ls.map(l => ({
      key: `e-${l.compteur_ligne}`,
      compteurLigne: l.compteur_ligne,
      ordre: l.ordre,
      nom: l.nom_medicament ?? '',
      posologie: l.posologie ?? '',
      isDirty: false
    })))
    setDuree(current.duree_valeur ?? '')
    setDureeUnite(current.duree_unite ?? DUREE_UNITES[0])
    setRenouveler(current.a_renouveler_fois != null ? String(current.a_renouveler_fois) : '')
    setProchainControle(current.prochain_controle ? fmtDateFR(current.prochain_controle) : '')
    setFlagInteractions(!!current.flag_interactions)
    setFlagAllergie(!!current.flag_allergie)
    setFlagIntolerance(!!current.flag_intolerance)
    setFlagDiagnostic(!!current.flag_diagnostic)
    setFlagTare(!!current.flag_tare)
    setImprimerEntete(!!current.imprimer_entete)
    setImprimerNomPrenom(!!current.imprimer_nom_prenom)
    setImprimerDateNaissance(!!current.imprimer_date_naissance)
    setImprimerAdresse(!!current.imprimer_adresse)
    setTexteEntete(current.texte_entete ?? defaultEntete)
    setActiveKey(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isNew, ordonnances, allLignes])

  const total   = ordonnances.length
  const current = isNew ? null : ordonnances[currentIndex]
  const hasDirty = isNew ? (lines.length > 0) : lines.some(l => l.isDirty)

  const displayNumero = isNew
    ? (total > 0 ? (ordonnances[total - 1]?.numero_ordonnance ?? 0) + 1 : 1)
    : (current?.numero_ordonnance ?? '—')
  const displayDate = isNew ? fmtDateFR(newDT.date) : fmtDateFR(current?.date_ordonnance)
  const displayTime = isNew ? fmtTime(newDT.time) : fmtTime(current?.heure_ordonnance)
  const refDateRaw  = isNew ? newDT.date : current?.date_ordonnance
  const displayAge  = calcAge(dateNaissance, refDateRaw)

  // ── Navigation ───────────────────────────────────────────────────────────────
  function goFirst() { setIsNew(false); setCurrentIndex(0) }
  function goLast()  { setIsNew(false); setCurrentIndex(Math.max(0, total - 1)) }
  function navigate(delta: number) {
    const from = isNew ? total : currentIndex
    setIsNew(false)
    setCurrentIndex(Math.max(0, Math.min(total - 1, from + delta)))
  }
  function handleNew() {
    setIsNew(true)
    setNewDT({ date: nowMDY(), time: nowHMS() })
  }

  // ── Lignes médicaments ─────────────────────────────────────────────────────
  function addLine() {
    const k = uid()
    setLines(prev => [...prev, {
      key: k, compteurLigne: null, ordre: prev.length + 1,
      nom: '', posologie: '', isDirty: true
    }])
    setActiveKey(k)
  }
  function updateLine(key: string, field: 'nom' | 'posologie', value: string) {
    setLines(prev => prev.map(l => l.key === key ? { ...l, [field]: value, isDirty: true } : l))
  }
  function requestRemoveLine(line: MedLine) {
    if (line.nom.trim() || line.posologie.trim()) setRemoveLineConfirm(line)
    else doRemoveLine(line)
  }
  async function doRemoveLine(line: MedLine) {
    setRemoveLineConfirm(null)
    if (line.compteurLigne !== null) {
      const r = await window.api.deleteOrdonnanceLigne(line.compteurLigne)
      if (!r.ok) { alert(`Erreur: ${r.error}`); return }
      setAllLignes(prev => prev.filter(l => l.compteur_ligne !== line.compteurLigne))
    }
    setLines(prev => prev.filter(l => l.key !== line.key))
    if (activeKey === line.key) setActiveKey(null)
  }

  // ── Sauvegarde ─────────────────────────────────────────────────────────────
  async function handleSave(): Promise<boolean> {
    if (saving) return true
    setSaving(true)
    try {
      const header = {
        dureeValeur: duree,
        dureeUnite,
        aRenouvelerFois: renouveler ? Number(renouveler) : null,
        prochainControle,
        flagInteractions, flagAllergie, flagIntolerance, flagDiagnostic, flagTare,
        imprimerEntete, imprimerNomPrenom, imprimerDateNaissance, imprimerAdresse,
        texteEntete
      }

      if (isNew) {
        const result = await window.api.createOrdonnance({
          compteur,
          numeroDossier: String(numeroDossier),
          numeroConsultation: numeroConsultation ?? null,
          dateOrdonnance: newDT.date,
          heureOrdonnance: newDT.time,
          ...header,
          lignes: lines.map((l, i) => ({ ordre: i + 1, nom: l.nom, posologie: l.posologie }))
        })
        if (!result.ok) { alert(`Erreur: ${result.error}`); return false }
        const data = await window.api.loadOrdonnancesForDossier(compteur, numeroDossier)
        const list: OrdonnanceRow[] = (data as any)?.ordonnances ?? []
        setOrdonnances(list)
        setAllLignes((data as any)?.lignes ?? [])
        const idx = list.findIndex(o => o.compteur_ordonnance === result.compteurOrdonnance)
        setCurrentIndex(idx >= 0 ? idx : Math.max(0, list.length - 1))
        setIsNew(false)
      } else {
        if (!current) return false
        const r = await window.api.saveOrdonnance({
          compteurOrdonnance: current.compteur_ordonnance,
          ...header
        })
        if (!r.ok) { alert(`Erreur: ${r.error}`); return false }
        for (const l of lines) {
          if (!l.isDirty) continue
          const lr = await window.api.saveOrdonnanceLigne({
            compteurOrdonnance: current.compteur_ordonnance,
            compteurLigne: l.compteurLigne,
            ordre: l.ordre,
            nom: l.nom,
            posologie: l.posologie
          })
          if (!lr.ok) { alert(`Erreur: ${lr.error}`); return false }
        }
        const data = await window.api.loadOrdonnancesForDossier(compteur, numeroDossier)
        setOrdonnances((data as any)?.ordonnances ?? [])
        setAllLignes((data as any)?.lignes ?? [])
      }
      return true
    } finally {
      setSaving(false)
    }
  }

  // ── Suppression ordonnance ──────────────────────────────────────────────────
  async function handleDelete() {
    if (!current) return
    setSaving(true)
    try {
      const r = await window.api.deleteOrdonnance(current.compteur_ordonnance)
      if (!r.ok) { alert(`Erreur: ${r.error}`); return }
      const newList = ordonnances.filter((_, i) => i !== currentIndex)
      setOrdonnances(newList)
      setAllLignes(prev => prev.filter(l => l.compteur_ordonnance !== current.compteur_ordonnance))
      setCurrentIndex(Math.min(currentIndex, Math.max(0, newList.length - 1)))
      if (newList.length === 0) setIsNew(true)
      setDeleteConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Impression ─────────────────────────────────────────────────────────────
  async function handlePrint() {
    const ok = await handleSave()
    if (!ok) return
    requestAnimationFrame(() => window.print())
  }

  if (loading) {
    return (
      <div className="op-shell">
        <Topbar title="Ordonnance" onBack={onBack} />
        <div className="op-workspace"><p className="op-loading">Chargement…</p></div>
      </div>
    )
  }

  return (
    <div className="op-shell">

      <Topbar title="Ordonnance" onBack={onBack}>
        {hasDirty && !saving && (
          <span className="op-unsaved-hint">Modifications non enregistrées</span>
        )}
        <button className="topbar-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button className="topbar-btn topbar-btn--save" onClick={handlePrint} disabled={saving}>
          Imprimer
        </button>
      </Topbar>

      <div className="op-workspace">
        <div className="op-card">

          {/* Patient + compteur */}
          <div className="op-card-header">
            <div>
              <span className="op-patient-nom">{nom ?? ''}</span>{' '}
              <span className="op-patient-prenom">{prenom ?? ''}</span>
            </div>
            <div className="op-card-header-right">
              {isNew
                ? <span className="op-new-chip">Nouvelle ordonnance</span>
                : <span className="op-counter">{total > 0 ? currentIndex + 1 : 0} / {total}</span>}
            </div>
          </div>

          {/* Navigation */}
          <div className="op-inav">
            <button className="op-inav-btn" onClick={goFirst}
              disabled={total === 0 || (!isNew && currentIndex === 0)} title="Première">|◄</button>
            <button className="op-inav-btn" onClick={() => navigate(-1)}
              disabled={total === 0 || (!isNew && currentIndex === 0)} title="Précédente">◄ Précédente</button>
            <button className="op-inav-btn" onClick={() => navigate(1)}
              disabled={isNew || total === 0 || currentIndex >= total - 1} title="Suivante">Suivante ►</button>
            <button className="op-inav-btn" onClick={goLast}
              disabled={isNew || total === 0 || currentIndex >= total - 1} title="Dernière">►|</button>
            <div className="op-inav-sep" />
            <button className={`op-inav-btn${isNew ? ' op-inav-btn--active' : ''}`}
              onClick={handleNew} disabled={isNew}>+ Nouvelle</button>
            <button className="op-inav-btn op-inav-btn--del"
              onClick={() => setDeleteConfirm(true)} disabled={isNew || !current}>Supprimer</button>
          </div>

          {/* Dossier / consultation */}
          <div className="op-subheader">
            <span className="op-dossier-num">Dossier {String(numeroDossier)}</span>
            {numeroConsultation != null && (
              <span className="op-dossier-titre"> — Consultation {numeroConsultation}</span>
            )}
          </div>

          {/* N° / Date / Heure / Âge */}
          <div className="op-info-strip">
            <div className="op-info-cell">
              <span className="op-info-label">N°</span>
              <span className="op-info-value">{displayNumero}</span>
            </div>
            <div className="op-info-cell">
              <span className="op-info-label">Date</span>
              <span className="op-info-value">{displayDate}</span>
            </div>
            <div className="op-info-cell">
              <span className="op-info-label">Heure</span>
              <span className="op-info-value">{displayTime || '—'}</span>
            </div>
            <div className="op-info-cell op-info-cell--grow">
              <span className="op-info-label">Âge</span>
              <span className="op-info-value">{displayAge}</span>
            </div>
          </div>

          {/* Médicaments */}
          <div className="op-meds-section">
            <div className="op-meds-toolbar">
              <button className="op-tool-btn op-tool-btn--primary" onClick={addLine}>+ Ajouter</button>
              <button className="op-tool-btn" disabled title="Saisie manuelle uniquement">Remplacer</button>
              <button className="op-tool-btn" disabled title="Aucune base médicament reliée">Médic. patient</button>
              <button className="op-tool-btn" disabled title="Aucune base médicament reliée">Fiche médic.</button>
              <button className="op-tool-btn" disabled title="Non disponible">Numérotation</button>
              <button className="op-tool-btn op-tool-btn--del"
                onClick={() => { const l = lines.find(x => x.key === activeKey); if (l) requestRemoveLine(l) }}
                disabled={!activeKey}>Supprimer</button>
            </div>

            {lines.length === 0 && (
              <p className="op-empty">Aucun médicament. Cliquez sur « + Ajouter » pour en saisir un.</p>
            )}

            <div className="op-med-grid">
              {lines.map((l, i) => (
                <div key={l.key}
                  className={`op-med-row${activeKey === l.key ? ' active' : ''}`}
                  onClick={() => setActiveKey(l.key)}>
                  <span className="op-med-idx">{i + 1}</span>
                  <div className="op-med-fields">
                    <input
                      className="op-med-nom"
                      placeholder="Nom du médicament"
                      value={l.nom}
                      onChange={e => updateLine(l.key, 'nom', e.target.value)}
                      onFocus={() => setActiveKey(l.key)}
                    />
                    <input
                      className="op-med-poso"
                      placeholder="Posologie (ex: 1 cp x 3/j pendant 5 jours)"
                      value={l.posologie}
                      onChange={e => updateLine(l.key, 'posologie', e.target.value)}
                      onFocus={() => setActiveKey(l.key)}
                    />
                  </div>
                  <button className="op-med-remove" title="Retirer cette ligne"
                    onClick={e => { e.stopPropagation(); requestRemoveLine(l) }}>×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Durée / renouvellement / contrôle */}
          <div className="op-meta-row">
            <div className="op-meta-field">
              <label className="op-meta-label">Durée</label>
              <div className="op-meta-inline">
                <input className="op-meta-input op-meta-input--num" value={duree}
                  onChange={e => setDuree(e.target.value)} placeholder="—" />
                <select className="op-meta-select" value={dureeUnite}
                  onChange={e => setDureeUnite(e.target.value)}>
                  {DUREE_UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="op-meta-field">
              <label className="op-meta-label">À renouveler</label>
              <div className="op-meta-inline">
                <input className="op-meta-input op-meta-input--num" value={renouveler}
                  onChange={e => setRenouveler(e.target.value.replace(/\D/g, ''))} placeholder="0" />
                <span className="op-meta-suffix">fois</span>
              </div>
            </div>
            <div className="op-meta-field">
              <label className="op-meta-label">Prochain contrôle</label>
              <input className="op-meta-input op-meta-input--mono" value={prochainControle}
                onChange={e => setProchainControle(e.target.value)} placeholder="jj/mm/aaaa" />
            </div>
          </div>

          {/* Drapeaux */}
          <div className="op-flags-row">
            <label className="op-checkbox">
              <input type="checkbox" checked={flagInteractions} onChange={e => setFlagInteractions(e.target.checked)} />
              Interactions médicamenteuses
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={flagAllergie} onChange={e => setFlagAllergie(e.target.checked)} />
              Allergie
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={flagIntolerance} onChange={e => setFlagIntolerance(e.target.checked)} />
              Intolérance
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={flagDiagnostic} onChange={e => setFlagDiagnostic(e.target.checked)} />
              Diagnostic
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={flagTare} onChange={e => setFlagTare(e.target.checked)} />
              Tare
            </label>
          </div>

          {/* Options d'impression */}
          <div className="op-print-opts">
            <label className="op-checkbox op-checkbox--strong">
              <input type="checkbox" checked={imprimerEntete} onChange={e => setImprimerEntete(e.target.checked)} />
              Imprimer entête
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={imprimerNomPrenom} onChange={e => setImprimerNomPrenom(e.target.checked)} />
              Nom prénom
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={imprimerDateNaissance} onChange={e => setImprimerDateNaissance(e.target.checked)} />
              Date de naissance
            </label>
            <label className="op-checkbox">
              <input type="checkbox" checked={imprimerAdresse} onChange={e => setImprimerAdresse(e.target.checked)} />
              Adresse
            </label>
          </div>

          {/* Texte libre d'en-tête */}
          <div className="op-entete-block">
            <div className="op-entete-label">Texte d'en-tête</div>
            <textarea className="op-entete-ta" rows={4}
              value={texteEntete} onChange={e => setTexteEntete(e.target.value)} />
          </div>

        </div>
      </div>

      {/* Footer cohérent avec le reste de l'app */}
      <div className="op-footer">
        <div className="op-footer-inner">
          <div className="op-footer-row">
            <button className="op-footer-btn" disabled>Administrative</button>
            <button className="op-footer-btn" disabled>Visu Dossier</button>
            <button className="op-footer-btn" disabled>Consultation Zoom</button>
            <button className="op-footer-btn op-footer-btn--active" disabled>Ordonnance</button>
            <button className="op-footer-btn" disabled>Actes</button>
            <button className="op-footer-btn" disabled>Courrier</button>
            <button className="op-footer-btn" disabled>Résumé</button>
          </div>
          <div className="op-footer-row op-footer-row--center">
            <button className="op-footer-btn" disabled>Examens</button>
            <button className="op-footer-btn" disabled>Diag.Tare...</button>
            <button className="op-footer-btn" disabled>Fiche Pers...</button>
            <button className="op-footer-btn" disabled>Mémo</button>
            <button className="op-footer-btn" disabled>Lst Recherche</button>
            <button className="op-footer-btn" disabled>Rendez-vous</button>
            <button className="op-footer-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>

      {/* Feuille d'impression — cachée à l'écran, visible via @media print */}
      <div className="op-print-sheet" ref={printRef}>
        {imprimerEntete && texteEntete && (
          <div className="op-print-entete">{texteEntete}</div>
        )}
        <div className="op-print-meta">
          {imprimerNomPrenom && <div>{[civilite, prenom, nom].filter(Boolean).join(' ')}</div>}
          {imprimerDateNaissance && <div>Né(e) le {fmtDateFR(dateNaissance)}</div>}
          {imprimerAdresse && adresse && <div>{adresse}</div>}
          <div>Le {displayDate}{displayTime ? ` à ${displayTime}` : ''}</div>
        </div>
        <div className="op-print-meds">
          {lines.map((l, i) => (
            <div className="op-print-med" key={l.key}>
              <div className="op-print-med-nom">{i + 1}. {l.nom}</div>
              {l.posologie && <div className="op-print-med-poso">{l.posologie}</div>}
            </div>
          ))}
        </div>
        {(duree || renouveler || prochainControle) && (
          <div className="op-print-foot">
            {duree && <span>Durée : {duree} {dureeUnite}</span>}
            {renouveler && <span>À renouveler {renouveler} fois</span>}
            {prochainControle && <span>Prochain contrôle : {prochainControle}</span>}
          </div>
        )}
      </div>

      {/* Modale suppression ordonnance */}
      {deleteConfirm && (
        <div className="op-modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="op-modal" onClick={e => e.stopPropagation()}>
            <p className="op-modal-text">
              Cette action est <strong>irréversible</strong>. L'ordonnance{' '}
              <strong>N°{current?.numero_ordonnance}</strong> du{' '}
              <strong>{fmtDateFR(current?.date_ordonnance)}</strong> sera définitivement supprimée.
            </p>
            <div className="op-modal-btns">
              <button className="op-modal-btn" onClick={() => setDeleteConfirm(false)}>Annuler</button>
              <button className="op-modal-btn op-modal-btn--danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression ligne */}
      {removeLineConfirm && (
        <div className="op-modal-overlay" onClick={() => setRemoveLineConfirm(null)}>
          <div className="op-modal" onClick={e => e.stopPropagation()}>
            <p className="op-modal-text">
              Retirer le médicament <strong>"{removeLineConfirm.nom || '(sans nom)'}"</strong> ?
            </p>
            <div className="op-modal-btns">
              <button className="op-modal-btn" onClick={() => setRemoveLineConfirm(null)}>Annuler</button>
              <button className="op-modal-btn op-modal-btn--danger" onClick={() => doRemoveLine(removeLineConfirm)}>Retirer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}