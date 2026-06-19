import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import "./PatientsFile.css";

interface Props {
  onBack: () => void;
}

interface Patient {
  compteur: number;
  nom: string | null;
  prenom: string | null;
  n_dossier: string | null;
  notesstate: string | null;
  date_de_naissance: string | null;
  date_1ere_consultation: string | null;
}

type SortKey = "nom" | "prenom" | "code" | "naissance";
type SortDir = "asc" | "desc" | null;

const CHUNK = 500;
const SCROLL_THRESHOLD = 200; // px avant le bas du tableau pour déclencher le lot suivant

const SORT_LABELS: Record<SortKey, string> = {
  nom: "Nom",
  prenom: "Prénom",
  code: "Code dossier",
  naissance: "Date de naissance",
};

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
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// Le code dossier suit le format "ZZZZ/XX" : un tri sur la chaîne brute est
// faux ("9/24" se retrouverait après "10/24"). On extrait la partie
// numérique avant le "/" et on compare des nombres.
function parseDossierNum(code: string | null): number {
  if (!code) return -Infinity;
  const head = code.split("/")[0].trim();
  const n = parseInt(head.replace(/\D/g, ""), 10);
  return isNaN(n) ? -Infinity : n;
}

interface ModalProps {
  patient: Patient;
  onClose: () => void;
}

function PatientModal({ patient, onClose }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="pf-modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pf-modal">
        <div className="pf-modal-header">
          <div className="pf-modal-avatar">
            {(patient.prenom?.[0] ?? patient.nom?.[0] ?? "?").toUpperCase()}
          </div>
          <div className="pf-modal-identity">
            <div className="pf-modal-name">
              {[patient.prenom, patient.nom].filter(Boolean).join(" ") || "—"}
            </div>
            <div className="pf-modal-code">Code dossier : {patient.n_dossier ?? "—"}</div>
          </div>
          <button type="button" className="pf-modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="pf-modal-body">
          <div className="pf-modal-row">
            <span className="pf-modal-label">Nom</span>
            <span className="pf-modal-val">{patient.nom ?? "—"}</span>
          </div>
          <div className="pf-modal-row">
            <span className="pf-modal-label">Prénom</span>
            <span className="pf-modal-val">{patient.prenom ?? "—"}</span>
          </div>
          <div className="pf-modal-row">
            <span className="pf-modal-label">N° dossier</span>
            <span className="pf-modal-val" style={{ fontFamily: "monospace", fontWeight: 700 }}>{patient.n_dossier ?? "—"}</span>
          </div>
          <div className="pf-modal-row">
            <span className="pf-modal-label">Date de naissance</span>
            <span className="pf-modal-val">{fmtDate(patient.date_de_naissance)}</span>
          </div>
          <div className="pf-modal-row">
            <span className="pf-modal-label">1ère consultation</span>
            <span className="pf-modal-val">{fmtDate(patient.date_1ere_consultation)}</span>
          </div>
          <div className="pf-modal-row">
            <span className="pf-modal-label">Fiche notes</span>
            <span className="pf-modal-val">{patient.notesstate ? "Oui" : "Non"}</span>
          </div>
        </div>
        <div className="pf-modal-footer">
          <button type="button" className="pf-btn" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="pf-sort-icon" aria-hidden="true">
      <span className={`pf-sort-arrow pf-sort-arrow--up${dir === "asc" ? " is-active" : ""}`}>▲</span>
      <span className={`pf-sort-arrow pf-sort-arrow--down${dir === "desc" ? " is-active" : ""}`}>▼</span>
    </span>
  );
}

export default function PatientsFile({ onBack }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const rows = await window.api.listPatients();
        if (!cancelled) setPatients(rows);
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const v = search.toLowerCase().trim();
    const base = v
      ? patients.filter(
          (p) =>
            (p.nom ?? "").toLowerCase().includes(v) ||
            (p.prenom ?? "").toLowerCase().includes(v) ||
            (p.n_dossier ?? "").toLowerCase().includes(v)
        )
      : patients;

    if (!sortKey || !sortDir) return base;

    const mult = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      switch (sortKey) {
        case "prenom":
          return mult * (a.prenom ?? "").localeCompare(b.prenom ?? "");
        case "code":
          return mult * (parseDossierNum(a.n_dossier) - parseDossierNum(b.n_dossier));
        case "naissance": {
          const da = parseAccessDate(a.date_de_naissance)?.getTime() ?? -Infinity;
          const db = parseAccessDate(b.date_de_naissance)?.getTime() ?? -Infinity;
          return mult * (da - db);
        }
        default:
          return mult * (a.nom ?? "").localeCompare(b.nom ?? "");
      }
    });
  }, [patients, search, sortKey, sortDir]);

  // À chaque nouvelle recherche / nouveau tri, on revient au premier lot de 500
  useEffect(() => {
    setVisibleCount(CHUNK);
    wrapperRef.current?.scrollTo({ top: 0 });
  }, [search, sortKey, sortDir]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + CHUNK, filtered.length));
  }, [filtered.length]);

  const handleScroll = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD) {
      loadMore();
    }
  }, [loadMore]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir("asc");
    }
  }, [sortKey, sortDir]);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
  }, []);

  const handleRowClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const handleRowDblClick = useCallback((p: Patient) => {
    setModalPatient(p);
  }, []);

  const scrollTop = useCallback(() => {
    wrapperRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="pf-page">
      {modalPatient && (
        <PatientModal patient={modalPatient} onClose={() => setModalPatient(null)} />
      )}

      <div className="pf-shell">
        <header className="pf-header">
          <div className="pf-title-group">
            <span className="pf-kicker">Gestion administrative médicale</span>
            <h1 className="pf-title">Fichier Patients</h1>
            <span className="pf-subtitle">Consultation et gestion des fiches patients</span>
          </div>
          <div className="pf-toolbar">
            <button type="button" className="pf-btn">Ouvrir fiche</button>
            <button type="button" className="pf-btn pf-btn--primary">Nouvelle fiche</button>
            <button type="button" className="pf-btn pf-btn--danger">Supprimer</button>
            <button type="button" className="pf-btn" onClick={onBack}>Menu général</button>
          </div>
        </header>

        <section className="pf-controls">
          <div className="pf-order">
            <span className="pf-order-label">Tri</span>
            <span className="pf-order-hint">
              {sortKey && sortDir
                ? `${SORT_LABELS[sortKey]} · ${sortDir === "asc" ? "croissant" : "décroissant"}`
                : "Cliquez sur un en-tête de colonne"}
            </span>
            {sortKey && (
              <button
                type="button"
                className="pf-chip"
                onClick={() => { setSortKey(null); setSortDir(null); }}
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="pf-controls-right">
            <div className="pf-search">
              <div className="pf-search-box">
                <span className="pf-search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Recherche patient..."
                  className="pf-search-input"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="pf-table-wrapper" ref={wrapperRef} onScroll={handleScroll}>
          {loading ? (
            <div className="pf-empty">Chargement des patients…</div>
          ) : filtered.length === 0 ? (
            <div className="pf-empty">Aucun patient trouvé</div>
          ) : (
            <table className="pf-table">
              <thead>
                <tr>
                  <th className="pf-col-index">#</th>
                  <th className="pf-col-name pf-th-sortable" onClick={() => handleSort("nom")}>
                    <span className="pf-th-inner">Nom<SortIcon dir={sortKey === "nom" ? sortDir : null} /></span>
                  </th>
                  <th className="pf-col-firstname pf-th-sortable" onClick={() => handleSort("prenom")}>
                    <span className="pf-th-inner">Prénom<SortIcon dir={sortKey === "prenom" ? sortDir : null} /></span>
                  </th>
                  <th className="pf-col-code pf-th-sortable" onClick={() => handleSort("code")}>
                    <span className="pf-th-inner">Code dossier<SortIcon dir={sortKey === "code" ? sortDir : null} /></span>
                  </th>
                  <th className="pf-col-notes">Notes</th>
                  <th className="pf-col-birth pf-th-sortable" onClick={() => handleSort("naissance")}>
                    <span className="pf-th-inner">Né(e) le<SortIcon dir={sortKey === "naissance" ? sortDir : null} /></span>
                  </th>
                  <th className="pf-col-consult">1ère consultation</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((patient, index) => (
                  <tr
                    key={patient.compteur}
                    className={selectedId === patient.compteur ? "pf-row-active" : ""}
                    onClick={() => handleRowClick(patient.compteur)}
                    onDoubleClick={() => handleRowDblClick(patient)}
                  >
                    <td className="pf-col-index">{index + 1}</td>
                    <td className="pf-col-name">{patient.nom ?? "—"}</td>
                    <td className="pf-col-firstname">{patient.prenom ?? "—"}</td>
                    <td className="pf-col-code">{patient.n_dossier ?? "—"}</td>
                    <td className="pf-col-notes">
                      <span className={patient.notesstate ? "pf-note-box pf-note-box--checked" : "pf-note-box"} />
                    </td>
                    <td className="pf-col-birth">{fmtDate(patient.date_de_naissance)}</td>
                    <td className="pf-col-consult">{fmtDate(patient.date_1ere_consultation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="pf-footer">
          <div className="pf-status">
            <span className="pf-status-dot" />
            <span>
              {filtered.length > 0
                ? `${visible.length.toLocaleString("fr-FR")} sur ${filtered.length.toLocaleString("fr-FR")} patient${filtered.length > 1 ? "s" : ""} affichés`
                : "0 patient"}
            </span>
          </div>

          <div className="pf-pagination">
            {visibleCount < filtered.length && (
              <button type="button" className="pf-page-btn pf-page-btn--wide" onClick={loadMore}>
                Afficher 500 de plus
              </button>
            )}
            <button
              type="button"
              className="pf-page-btn pf-page-btn--top"
              onClick={scrollTop}
              title="Retour en haut"
            >
              ↑
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}