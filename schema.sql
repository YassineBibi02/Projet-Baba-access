CREATE TABLE patients (
  compteur INTEGER PRIMARY KEY,
  nom TEXT,
  nom_jeune_fille TEXT,
  prenom TEXT,
  numero_dossier TEXT,
  matricule TEXT,
  date_naissance TEXT,
  date_naissance_raw TEXT,
  lieu_naissance TEXT,
  sexe TEXT,
  situation_famille TEXT,
  civilite TEXT,
  adresse TEXT,
  ville TEXT,
  code_ville TEXT,
  gouvernorat_pays TEXT,
  origine TEXT,
  profession TEXT,
  employeur TEXT,
  activite_employeur TEXT,
  adresse_profession TEXT,
  ville_profession TEXT,
  code_ville_profession TEXT,
  tel_bureau TEXT,
  tel_domicile TEXT,
  proche TEXT,
  tel_proche TEXT,
  numero_affiliation TEXT,
  statut TEXT,
  couverture_sociale TEXT,
  remarques TEXT,
  remarques_medicales_importantes TEXT,
  date_premiere_consultation TEXT,
  date_premiere_consultation_raw TEXT,
  notes_state INTEGER,
  notes TEXT
)
CREATE TABLE import_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compteur INTEGER,
  column_name TEXT,
  raw_value TEXT,
  issue TEXT
)

CREATE INDEX idx_patients_nom_prenom ON patients (nom, prenom)
CREATE INDEX idx_patients_numero_dossier ON patients (numero_dossier)
CREATE INDEX idx_patients_date_naissance ON patients (date_naissance)
CREATE INDEX idx_patients_tel_domicile ON patients (tel_domicile)
CREATE INDEX idx_patients_ville ON patients (ville)
CREATE INDEX idx_patients_notes_state ON patients (notes_state)