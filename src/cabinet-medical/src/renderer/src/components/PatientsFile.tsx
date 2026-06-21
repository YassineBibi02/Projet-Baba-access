import { useState, useEffect, useCallback, useRef } from "react";
import "./PatientsFile.css";
import { Topbar } from "./Topbar";
import NewPatient from "./NewPatient";
import VisuDossier from "./VisuDossier";
import ConsultationPage from "./ConsultationPage";
import type { PatientRow } from "../../../preload/index.d";

interface Props { onBack: () => void }

type SortKey = "nom" | "prenom" | "code" | "naissance" | "premiere";
type Overlay = null | "new" | "edit" | "visu" | "consult";

interface OpenConsultData { numeroDossier: number | string; lastN: number }

const PAGE_SIZES = [25, 50, 100, 200] as const;

const COLGROUP = (
  <colgroup>
    <col className="pf-col-nom" />
    <col className="pf-col-prenom" />
    <col className="pf-col-code" />
    <col className="pf-col-naissance" />
    <col className="pf-col-premiere" />
  </colgroup>
);

function parseAccessDate(raw: string | null): Date | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const d = new Date(+m[3], +m[1] - 1, +m[2]);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(raw: string | null): string {
  const d = parseAccessDate(raw);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total-4, total-3, total-2, total-1, total];
  return [1, "…", current-1, current, current+1, "…", total];
}

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <span className="pf-sort-icon" aria-hidden="true">
      <span className={`pf-sort-arrow pf-sort-arrow--up${dir === "asc" ? " is-active" : ""}`}>▲</span>
      <span className={`pf-sort-arrow pf-sort-arrow--down${dir === "desc" ? " is-active" : ""}`}>▼</span>
    </span>
  );
}

// Spinning arc that fills to 100% when `done` is set
function LoadingRing({ done }: { done: boolean }) {
  const r = 22, cx = 26, cy = 26;
  const circ = 2 * Math.PI * r;
  return (
    // Spin the SVG itself (not a wrapper) so when animation stops it resets to rotate(0),
    // and the SVG-attribute rotate(180 cx cy) on the arc still puts the start at 9 o'clock.
    <svg
      width="52" height="52"
      viewBox="0 0 52 52"
      style={{ display: "block", transformBox: "fill-box", transformOrigin: "center" }}
      className={done ? "pf-ring" : "pf-ring pf-ring--spinning"}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3.5} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#065f46"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={done ? 0 : circ * 0.28}
        transform={`rotate(180 ${cx} ${cy})`}
        style={{ transition: done ? "stroke-dashoffset 0.35s ease" : "none" }}
      />
    </svg>
  );
}

export default function PatientsFile({ onBack }: Props) {
  const [rows, setRows]               = useState<PatientRow[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [ringDone, setRingDone]       = useState(false);
  const [firstLoad, setFirstLoad]     = useState(true);
  const [reloadKey, setReloadKey]     = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState<SortKey | null>(null);
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("asc");
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState<typeof PAGE_SIZES[number]>(50);

  const [selectedId, setSelectedId]   = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [overlay, setOverlay]         = useState<Overlay>(null);
  const [openConsultData, setOpenConsultData] = useState<OpenConsultData | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput]         = useState("");
  const [deleting, setDeleting]               = useState(false);
  const [deleteResult, setDeleteResult]       = useState<{ ok: boolean; error?: string } | null>(null);
  const [countdown, setCountdown]             = useState(3);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // ── Server-side data load (one page at a time) ───────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRingDone(false);

    window.api.listPatients({
      offset: (page - 1) * pageSize,
      limit: pageSize,
      sortField: sortKey,
      sortDir,
      search,
    }).then(result => {
      if (cancelled) return;
      setRows(result.rows as PatientRow[]);
      setTotal(result.total);
      setRingDone(true);
      // Brief pause so 100% ring is visible, then clear loading
      setTimeout(() => {
        if (!cancelled) { setLoading(false); setFirstLoad(false); }
      }, 280);
    }).catch(() => {
      if (!cancelled) { setLoading(false); setFirstLoad(false); }
    });

    return () => { cancelled = true; };
  }, [page, pageSize, search, sortKey, sortDir, reloadKey]);

  const reload = useCallback(() => {
    setSelectedId(null);
    setSelectedPatient(null);
    setReloadKey(k => k + 1);
  }, []);

  // ── Search debounce ───────────────────────────────────────────────────
  const handleSearchChange = (v: string) => {
    setSearchInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
    }, 300);
  };

  // ── Sort ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      setPage(1);
    } else {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
      setPage(1);
    }
  }, [sortKey]);

  const goTo = (p: number) => {
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    setPage(Math.max(1, Math.min(p, total_pages)));
  };

  // ── Row click: track selection ────────────────────────────────────────
  const handleRowClick = (p: PatientRow) => {
    setSelectedId(p.compteur);
    setSelectedPatient(p);
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const norm = (s: string | null) => (s ?? "").trim().toUpperCase();
  const deleteConfirmed = deleteInput.trim().toUpperCase() === norm(selectedPatient?.nom ?? "");

  async function handleDelete() {
    if (!selectedId || !deleteConfirmed || deleting) return;
    setDeleting(true);
    const result = await window.api.deletePatient(selectedId);
    setDeleting(false);
    if (result.ok) {
      setShowDeleteModal(false);
      setDeleteInput("");
      setDeleteResult({ ok: true });
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            setDeleteResult(null);
            reload();
            return 3;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      setDeleteResult({ ok: false, error: result.error });
    }
  }

  // ── Overlay actions ───────────────────────────────────────────────────
  async function handleOpenConsult() {
    if (!selectedId || !selectedPatient) return;
    const data = await window.api.getConsultations(selectedId);
    const consults = data?.consultations ?? [];
    const numeroDossier = consults[0]?.numero_dossier_medical ?? 1;
    const lastN = consults.length > 0
      ? Number(consults[consults.length - 1].numero_consultation ?? 0) : 0;
    setOpenConsultData({ numeroDossier, lastN });
    setOverlay("consult");
  }

  // ── Overlay renders ───────────────────────────────────────────────────
  if (overlay === "new") {
    return <NewPatient onBack={() => { setOverlay(null); reload(); }} />;
  }
  if (overlay === "edit" && selectedPatient) {
    return <NewPatient editCompteur={selectedPatient.compteur} onBack={() => { setOverlay(null); reload(); }} />;
  }
  if (overlay === "visu" && selectedPatient) {
    return (
      <VisuDossier
        patient={{
          compteur: selectedPatient.compteur,
          nom: selectedPatient.nom,
          prenom: selectedPatient.prenom,
          n_dossier: selectedPatient.n_dossier,
          date_de_naissance: selectedPatient.date_de_naissance,
          notesstate: selectedPatient.notesstate,
        }}
        onBack={() => setOverlay(null)}
        onMenu={onBack}
      />
    );
  }
  if (overlay === "consult" && selectedPatient && openConsultData) {
    return (
      <ConsultationPage
        compteur={selectedPatient.compteur}
        nom={selectedPatient.nom}
        prenom={selectedPatient.prenom}
        dateNaissance={selectedPatient.date_de_naissance}
        notesState={selectedPatient.notesstate}
        numeroDossier={openConsultData.numeroDossier}
        initialNumeroConsultation={openConsultData.lastN}
        autoNew
        onBack={() => { setOverlay(null); setOpenConsultData(null); }}
      />
    );
  }

  // ── Pagination helpers ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasSelected = selectedId !== null;
  const showRing = firstLoad && loading;

  return (
    <div className="pf-page">
      <Topbar title="Fichier Patients" onBack={onBack} />

      <div className="pf-workspace">
        <div className="pf-content">

          {/* Search + actions */}
          <div className="pf-search-bar">
            <input
              className="pf-search-input"
              type="text"
              placeholder="Rechercher par nom, prénom ou code dossier…"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              spellCheck={false}
            />
            <button className="pf-action-btn" onClick={() => setOverlay("new")}>Nouveau patient</button>
            <button className="pf-action-btn" disabled={!hasSelected} onClick={() => setOverlay("edit")}>Modifier patient</button>
            <button
              className="pf-action-btn pf-action-btn--danger"
              disabled={!hasSelected}
              onClick={() => { setDeleteInput(""); setDeleteResult(null); setShowDeleteModal(true); }}
            >Supprimer patient</button>
          </div>

          {/* Table area */}
          <div className="pf-table-wrap">
            {showRing ? (
              /* Initial load: full loading screen */
              <div className="pf-loading-wrap">
                <LoadingRing done={ringDone} />
                <div className="pf-loading-text">Chargement des patients…</div>
              </div>
            ) : rows.length === 0 && !loading ? (
              <div className="pf-state">{search ? "Aucun résultat." : "Aucun patient."}</div>
            ) : (
              <>
                {/* Header — overflow-y: scroll + invisible scrollbar so it reserves the same gutter width as the body */}
                <div className="pf-thead-wrap">
                  <table className="pf-table">
                    {COLGROUP}
                    <thead>
                      <tr>
                        <th onClick={() => handleSort("nom")}>Nom <SortIcon dir={sortKey === "nom" ? sortDir : null} /></th>
                        <th onClick={() => handleSort("prenom")}>Prénom <SortIcon dir={sortKey === "prenom" ? sortDir : null} /></th>
                        <th onClick={() => handleSort("code")}>Code dossier <SortIcon dir={sortKey === "code" ? sortDir : null} /></th>
                        <th onClick={() => handleSort("naissance")}>Date de naissance <SortIcon dir={sortKey === "naissance" ? sortDir : null} /></th>
                        <th onClick={() => handleSort("premiere")}>1ère consultation <SortIcon dir={sortKey === "premiere" ? sortDir : null} /></th>
                      </tr>
                    </thead>
                  </table>
                </div>
                {/* Body — the ONLY scrollable container */}
                <div className={`pf-tbody-wrap${loading ? " pf-tbody-wrap--loading" : ""}`}>
                  <table className="pf-table">
                    {COLGROUP}
                    <tbody>
                      {rows.map(p => (
                        <tr
                          key={p.compteur}
                          className={p.compteur === selectedId ? "is-selected" : ""}
                          onClick={() => handleRowClick(p)}
                        >
                          <td className="pf-td-bold">{p.nom ?? "—"}</td>
                          <td>{p.prenom ?? "—"}</td>
                          <td className="pf-td-code">{p.n_dossier ?? "—"}</td>
                          <td>{fmtDate(p.date_de_naissance)}</td>
                          <td>{fmtDate(p.date_1ere_consultation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {!firstLoad && total > 0 && (
            <div className="pf-pagination">
              <div className="pf-pagination-left">
                <label className="pf-page-size-label" htmlFor="pf-page-size">Lignes :</label>
                <select
                  id="pf-page-size"
                  className="pf-page-size-select"
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value) as typeof PAGE_SIZES[number]); setPage(1); }}
                >
                  {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="pf-pagination-info">
                  {total} patient{total !== 1 ? "s" : ""} — page {page} / {totalPages}
                </span>
              </div>
              <div className="pf-pagination-controls">
                <button className="pf-page-btn" onClick={() => goTo(1)} disabled={page === 1}>«</button>
                <button className="pf-page-btn" onClick={() => goTo(page - 1)} disabled={page === 1}>‹</button>
                {pageNumbers(page, totalPages).map((n, i) =>
                  n === "…"
                    ? <span key={`e${i}`} className="pf-page-ellipsis">…</span>
                    : <button
                        key={n}
                        className={`pf-page-btn${n === page ? " is-active" : ""}`}
                        onClick={() => goTo(n as number)}
                      >{n}</button>
                )}
                <button className="pf-page-btn" onClick={() => goTo(page + 1)} disabled={page === totalPages}>›</button>
                <button className="pf-page-btn" onClick={() => goTo(totalPages)} disabled={page === totalPages}>»</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="pf-footer">
        <div className="pf-footer-inner">
          <div className="pf-footer-row-fill">
            <button className="pf-footer-btn" disabled={!hasSelected} onClick={() => setOverlay("edit")}>Administrative</button>
            <button className="pf-footer-btn" disabled={!hasSelected} onClick={() => setOverlay("visu")}>Visu Dossier</button>
            <button className="pf-footer-btn" disabled={!hasSelected} onClick={handleOpenConsult}>Consultation</button>
            <button className="pf-footer-btn" disabled>Ordonnance</button>
            <button className="pf-footer-btn" disabled>Actes</button>
            <button className="pf-footer-btn" disabled>Courrier</button>
            <button className="pf-footer-btn" disabled>Résumé</button>
          </div>
          <div className="pf-footer-row-center">
            <button className="pf-footer-btn" disabled>Examens</button>
            <button className="pf-footer-btn" disabled>Diag.Tare...</button>
            <button className="pf-footer-btn" disabled>Fiche Per...</button>
            <button className="pf-footer-btn" disabled>Mémo</button>
            <button className="pf-footer-btn" disabled>Lst Recherche</button>
            <button className="pf-footer-btn" disabled>Rendez-vous</button>
            <button className="pf-footer-btn" onClick={onBack}>Menu général</button>
          </div>
        </div>
      </div>

      {/* Delete result modal */}
      {deleteResult && (
        <div className="np-modal-overlay">
          <div className="np-modal">
            <h2 className={`np-modal-title ${deleteResult.ok ? "np-modal-title--success" : ""}`}>
              {deleteResult.ok ? "Patient supprimé" : "Erreur de suppression"}
            </h2>
            <p className="np-modal-body">
              {deleteResult.ok
                ? `La fiche a été supprimée. Fermeture dans ${countdown}…`
                : `Erreur : ${deleteResult.error}`}
            </p>
            <div className="np-modal-actions">
              <button className="np-modal-btn np-modal-btn--cancel" onClick={() => {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setDeleteResult(null);
                if (deleteResult.ok) reload();
              }}>
                {deleteResult.ok ? "Fermer maintenant" : "Fermer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="np-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="np-modal" onClick={e => e.stopPropagation()}>
            <h2 className="np-modal-title">Supprimer le patient</h2>
            <p className="np-modal-body">
              Cette action est <strong>irréversible</strong>. La fiche de{" "}
              <strong>{[selectedPatient?.prenom, selectedPatient?.nom].filter(Boolean).join(" ")}</strong> sera définitivement supprimée.
            </p>
            <div>
              <div className="np-modal-label">Tapez le nom <strong>{selectedPatient?.nom}</strong> pour confirmer :</div>
              <input
                className="np-modal-inp"
                autoFocus
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && deleteConfirmed) handleDelete(); }}
                placeholder={selectedPatient?.nom ?? ""}
              />
            </div>
            <div className="np-modal-actions">
              <button className="np-modal-btn np-modal-btn--cancel" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button
                className="np-modal-btn np-modal-btn--delete"
                disabled={!deleteConfirmed || deleting}
                onClick={handleDelete}
              >
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
