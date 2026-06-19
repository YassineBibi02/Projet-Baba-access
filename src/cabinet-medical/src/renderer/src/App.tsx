import { useState } from "react";
import "./App.css";
import PatientSearch from "./components/PatientSearch";
import NewPatient from "./components/NewPatient";
import PatientsFile from "./components/PatientsFile";

type MenuItem = {
  label: string;
  view: string;
  enabled: boolean;
};

const menuItems: MenuItem[] = [
  {
    label: "Saisie nouveau patient",
    view: "nouveau-patient",
    enabled: true,
  },
  {
    label: "Annuaires",
    view: "annuaires",
    enabled: false,
  },
  {
    label: "Fichier patients",
    view: "fichier-patients",
    enabled: true,
  },
  {
    label: "Bibliographie",
    view: "bibliographie",
    enabled: false,
  },
  {
    label: "Recherche patient",
    view: "recherche-patient",
    enabled: true,
  },
  {
    label: "Stock médicaments",
    view: "stock-medicaments",
    enabled: false,
  },
  {
    label: "Rendez-vous",
    view: "rendez-vous",
    enabled: false,
  },
  {
    label: "Gestion",
    view: "gestion",
    enabled: false,
  },
  {
    label: "Mémento",
    view: "memento",
    enabled: false,
  },
  {
    label: "Personnalisation",
    view: "personnalisation",
    enabled: false,
  },
  {
    label: "VIDAL System",
    view: "vidal",
    enabled: false,
  },
  {
    label: "Quitter",
    view: "quitter",
    enabled: true,
  },
];

function App() {
  const [currentView, setCurrentView] = useState<string | null>(null);
  const [editCompteur, setEditCompteur] = useState<number | null>(null);

  function handleMenuClick(item: MenuItem) {
    if (item.view === "quitter") {
      window.close();
      return;
    }
    if (item.view === "nouveau-patient") {
      setEditCompteur(null);
      setCurrentView("nouveau-patient");
      return;
    }
    if (item.view === "recherche-patient" || item.view === "fichier-patients") {
      setCurrentView(item.view);
      return;
    }
    alert(`Ouverture: ${item.label}`);
  }

  function openDeveloperWebsite() {
    window.open("https://yassinebibi.de", "_blank");
  }

  if (currentView === "recherche-patient") {
    return <PatientSearch
      onBack={() => setCurrentView(null)}
      onOpenAdmin={compteur => { setEditCompteur(compteur); setCurrentView("nouveau-patient"); }}
    />;
  }
  if (currentView === "fichier-patients") {
    return <PatientsFile onBack={() => setCurrentView(null)} />;
  }
  if (currentView === "nouveau-patient") {
    return <NewPatient
      onBack={() => { setEditCompteur(null); setCurrentView(null); }}
      editCompteur={editCompteur}
    />;
  }

  return (
    <main className="app-shell">
      <section className="main-menu">
        <header className="main-menu-header">
          <p className="app-kicker">Système de gestion du cabinet</p>
          <h1>Cabinet Dr. Med Bibi</h1>
        </header>

        <section className="menu-section">
          <p className="app-subtitle">Menu général</p>

          <div className="menu-grid">
            {menuItems.map((item) => (
              <button
                key={item.view}
                type="button"
                disabled={!item.enabled}
                className={item.enabled ? "menu-button" : "menu-button disabled"}
                onClick={() => handleMenuClick(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <footer className="main-menu-footer">
          <div className="footer-left">
            <span>© 2025 Cabinet Dr. Med Bibi</span>
            <span className="footer-separator">•</span>
            <span>Application locale privée</span>
          </div>

          <button
            type="button"
            className="developer-link"
            onClick={openDeveloperWebsite}
          >
            Developed by Engr. Yassine Bibi
          </button>
        </footer>
      </section>
    </main>
  );
}

export default App;
