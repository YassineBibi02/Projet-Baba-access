import { useMemo, useState, useEffect, useCallback } from "react";
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
type PageSize = 10 | 25 | 50 | 100 | "all";

const PAGE_SIZE_OPTIONS: { label: string; value: PageSize }[] = [
  { label: "10", value: 10 },
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "Tous", value: "all" },
];

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

export default function PatientsFile({ onBack }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [orderBy, setOrderBy] = useState<SortKey>("nom");
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [page, setPage] = useState(1);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [before, after] = await Promise.all([
          window.api.searchPatients({ field: "nom", value: "!" }),
          window.api.searchPatients({ field: "nom", value: "A" }),
        ]);
        if (!cancelled) {
          const seen = new Set<number>();
          const all: Patient[] = [];
          for (const row of [...(before.rows as Patient[]), ...(after.rows as Patient[])]) {
            if (!seen.has(row.compteur)) { seen.add(row.compteur); all.push(row); }
          }
          setPatients(all);
        }
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

    return [...base].sort((a, b) => {
      switch (orderBy) {
        case "prenom":
          return (a.prenom ?? "").localeCompare(b.prenom ?? "");
        case "code":
          return (a.n_dossier ?? "").localeCompare(b.n_dossier ?? "");
        case "naissance":
          return (a.date_de_naissance ?? "").localeCompare(b.date_de_naissance ?? "");
        default:
          return (a.nom ?? "").localeCompare(b.nom ?? "");
      }
    });
  }, [patients, search, orderBy]);

  const totalPages = useMemo(() => {
    if (pageSize === "all") return 1;
    return Math.max(1, Math.ceil(filtered.length / (pageSize as number)));
  }, [filtered.length, pageSize]);

  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    if (pageSize === "all") return filtered;
    const size = pageSize as number;
    const start = (safePage - 1) * size;
    return filtered.slice(start, start + size);
  }, [filtered, pageSize, safePage]);

  const handleSort = useCallback((key: SortKey) => {
    setOrderBy(key);
    setPage(1);
  }, []);

  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const handlePageSize = useCallback((v: PageSize) => {
    setPageSize(v);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const handleRowDblClick = useCallback((p: Patient) => {
    setModalPatient(p);
  }, []);

  const scrollTop = useCallback(() => {
    document.querySelector(".pf-table-wrapper")?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const startEntry = pageSize === "all" ? 1 : (safePage - 1) * (pageSize as number) + 1;
  const endEntry = pageSize === "all" ? filtered.length : Math.min(safePage * (pageSize as number), filtered.length);

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
            <span className="pf-order-label">Ordre</span>
            <div className="pf-chip-group">
              {(["nom", "prenom", "code", "naissance"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={orderBy === key ? "pf-chip pf-chip--active" : "pf-chip"}
                  onClick={() => handleSort(key)}
                >
                  {key === "nom" ? "Nom" : key === "prenom" ? "Prénom" : key === "code" ? "Code dossier" : "Date naissance"}
                </button>
              ))}
            </div>
          </div>

          <div className="pf-controls-right">
            <div className="pf-pagesize">
              <span className="pf-order-label">Lignes</span>
              <div className="pf-chip-group">
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    className={pageSize === opt.value ? "pf-chip pf-chip--active" : "pf-chip"}
                    onClick={() => handlePageSize(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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

        <div className="pf-table-wrapper">
          {loading ? (
            <div className="pf-empty">Chargement des patients…</div>
          ) : filtered.length === 0 ? (
            <div className="pf-empty">Aucun patient trouvé</div>
          ) : (
            <table className="pf-table">
              <thead>
                <tr>
                  <th className="pf-col-index">#</th>
                  <th className="pf-col-name">Nom</th>
                  <th className="pf-col-firstname">Prénom</th>
                  <th className="pf-col-code">Code dossier</th>
                  <th className="pf-col-notes">Notes</th>
                  <th className="pf-col-birth">Né(e) le</th>
                  <th className="pf-col-consult">1ère consultation</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((patient, index) => {
                  const globalIndex = pageSize === "all"
                    ? index + 1
                    : (safePage - 1) * (pageSize as number) + index + 1;
                  return (
                    <tr
                      key={patient.compteur}
                      className={selectedId === patient.compteur ? "pf-row-active" : ""}
                      onClick={() => handleRowClick(patient.compteur)}
                      onDoubleClick={() => handleRowDblClick(patient)}
                    >
                      <td className="pf-col-index">{globalIndex}</td>
                      <td className="pf-col-name">{patient.nom ?? "—"}</td>
                      <td className="pf-col-firstname">{patient.prenom ?? "—"}</td>
                      <td className="pf-col-code">{patient.n_dossier ?? "—"}</td>
                      <td className="pf-col-notes">
                        <span className={patient.notesstate ? "pf-note-box pf-note-box--checked" : "pf-note-box"} />
                      </td>
                      <td className="pf-col-birth">{fmtDate(patient.date_de_naissance)}</td>
                      <td className="pf-col-consult">{fmtDate(patient.date_1ere_consultation)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <footer className="pf-footer">
          <div className="pf-status">
            <span className="pf-status-dot" />
            <span>
              {filtered.length > 0
                ? `${startEntry}–${endEntry} sur ${filtered.length} patient${filtered.length > 1 ? "s" : ""}`
                : "0 patient"}
            </span>
          </div>

          <div className="pf-pagination">
            <button
              type="button"
              className="pf-page-btn"
              disabled={safePage <= 1 || pageSize === "all"}
              onClick={() => setPage(1)}
              title="Première page"
            >
              «
            </button>
            <button
              type="button"
              className="pf-page-btn"
              disabled={safePage <= 1 || pageSize === "all"}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Page précédente"
            >
              ‹
            </button>

            <span className="pf-page-info">
              {pageSize === "all" ? "Tout" : `Page ${safePage} / ${totalPages}`}
            </span>

            <button
              type="button"
              className="pf-page-btn"
              disabled={safePage >= totalPages || pageSize === "all"}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Page suivante"
            >
              ›
            </button>
            <button
              type="button"
              className="pf-page-btn"
              disabled={safePage >= totalPages || pageSize === "all"}
              onClick={() => setPage(totalPages)}
              title="Dernière page"
            >
              »
            </button>

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