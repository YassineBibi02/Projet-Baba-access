# SQLite Database Context

SQLite migration of old Microsoft Access medical database. Raw tables preserve Access exports. App views expose cleaner medical relationships without enforcing foreign keys.

## Important design notes

- raw_* tables are direct imports from Access TXT/CSV exports.
- All raw Access columns are stored mostly as TEXT to preserve old messy data.
- app_* views are the recommended interface for application code.
- Relationships are expressed in views, not enforced as foreign keys.
- Some orphan records are expected because the Access system is old and may contain deleted parent records.
- Do not delete orphan rows automatically.
- For patient identity, app_patients is the main view.
- For consultation history, use app_patient_consultation_history.
- For structured prescriptions, use app_prescriptions.
- For exams, use app_examens_details.
- For billing/acts, use app_actes_details.

## Recommended app views

| View | Purpose |
|---|---|
| `app_patients` | Main patient identity/search view |
| `app_patient_consultation_history` | Patient consultations with themes/clinical notes |
| `app_prescriptions` | Structured prescribed medications |
| `app_examens_details` | Exams with exam sub-elements |
| `app_actes_details` | Acts/honoraires with sub rows |

## Known logical relationships

### app_consultations.compteur -> app_patients.compteur

A consultation belongs to a patient.

### app_consultation_themes -> app_consultations

Columns: `compteur`, `numero_dossier_medical`, `numero_consultation`

A consultation theme belongs to a specific patient consultation.

### app_medicaments_prescrits -> app_consultations

Columns: `compteur`, `numero_dossier_medical`, `numero_consultation`

A prescribed medication row belongs to a specific consultation.

### app_examens -> app_consultations

Columns: `compteur`, `numero_dossier_medical`, `numero_consultation`

An exam belongs to a specific consultation when the consultation exists.

### app_examen_elements.compteur_examens -> app_examens.compteur_examens

An exam element belongs to an exam.

### app_actes_honoraires -> app_consultations

Columns: `compteur`, `numero_dossier_medical`, `numero_consultation`

An act/billing record belongs to a consultation when the consultation exists.

### app_actes_honoraires_sub.compteur_actes_et_honoraires -> app_actes_honoraires.compteur_actes_et_honoraires

An act/billing sub-row belongs to an act/billing parent row.

## Tables and views

### `import_columns`

Rows: **731**

| Column | Type | Primary key |
|---|---:|---:|
| `id` | `INTEGER` | yes |
| `sqlite_table_name` | `TEXT` |  |
| `column_position` | `INTEGER` |  |
| `original_column_name` | `TEXT` |  |
| `sqlite_column_name` | `TEXT` |  |

### `import_issues`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `id` | `INTEGER` | yes |
| `table_name` | `TEXT` |  |
| `source_file` | `TEXT` |  |
| `line_number` | `INTEGER` |  |
| `record_key` | `TEXT` |  |
| `column_name` | `TEXT` |  |
| `raw_value` | `TEXT` |  |
| `issue` | `TEXT` |  |
| `created_at` | `TEXT` |  |

### `import_tables`

Rows: **105**

| Column | Type | Primary key |
|---|---:|---:|
| `id` | `INTEGER` | yes |
| `source_file` | `TEXT` |  |
| `original_table_name` | `TEXT` |  |
| `sqlite_table_name` | `TEXT` |  |
| `rows_imported` | `INTEGER` |  |
| `rows_skipped` | `INTEGER` |  |
| `encoding` | `TEXT` |  |
| `imported_at` | `TEXT` |  |

### `raw_t_actes_categorie_des_actes`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_categorie_acte` | `TEXT` |  |
| `nom_categorie_acte` | `TEXT` |  |

### `raw_t_actes_et_honoraires`

Rows: **66113**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_actes_et_honoraires` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `numero_acte` | `TEXT` |  |
| `date_actes_et_honoraires` | `TEXT` |  |
| `heure_actes_et_honoraires` | `TEXT` |  |
| `total_actes` | `TEXT` |  |
| `total_fournitures` | `TEXT` |  |
| `montant_en_especes` | `TEXT` |  |
| `montant_par_cheque` | `TEXT` |  |
| `couverture_sociale` | `TEXT` |  |
| `code_banque` | `TEXT` |  |
| `n_cheque` | `TEXT` |  |

### `raw_t_actes_et_honoraires_sub`

Rows: **66396**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_actes_et_honoraires_sub` | `TEXT` |  |
| `compteur_actes_et_honoraires` | `TEXT` |  |
| `nom_categorie_acte` | `TEXT` |  |
| `nom_acte` | `TEXT` |  |
| `code_acte` | `TEXT` |  |
| `montant_acte` | `TEXT` |  |

### `raw_t_actes_liste_des_actes`

Rows: **13**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_categorie_acte` | `TEXT` |  |
| `nom_acte` | `TEXT` |  |
| `code_acte` | `TEXT` |  |
| `montant_acte` | `TEXT` |  |

### `raw_t_aide_table_des_fonctions`

Rows: **11**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_fonction` | `TEXT` |  |
| `nom_menu` | `TEXT` |  |
| `compteur` | `TEXT` |  |

### `raw_t_an_biologistes`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_biologiste` | `TEXT` |  |
| `code_biologiste` | `TEXT` |  |
| `nom_biologiste` | `TEXT` |  |
| `prenom_biologiste` | `TEXT` |  |
| `specialite_biologiste` | `TEXT` |  |
| `tel_bur_biologiste` | `TEXT` |  |
| `tel_dom_biologiste` | `TEXT` |  |
| `fax_biologiste` | `TEXT` |  |
| `minitel_biologiste` | `TEXT` |  |
| `adresse_biologiste_professionnelle` | `TEXT` |  |
| `ville_professionnelle` | `TEXT` |  |
| `code_ville_professionnelle` | `TEXT` |  |
| `adresse_biologiste_domicile` | `TEXT` |  |
| `ville_domicile` | `TEXT` |  |
| `code_ville_domicile` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `flag_appartenance` | `TEXT` |  |

### `raw_t_an_cliniques`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_clinique` | `TEXT` |  |
| `nom_clinique` | `TEXT` |  |
| `service_clinique` | `TEXT` |  |
| `nom_responsable` | `TEXT` |  |
| `tel_bur_clinique` | `TEXT` |  |
| `fax_clinique` | `TEXT` |  |
| `minitel_clinique` | `TEXT` |  |
| `adresse_clinique` | `TEXT` |  |
| `ville` | `TEXT` |  |
| `code_ville` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |

### `raw_t_an_dentistes`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_dentiste` | `TEXT` |  |
| `nom_dentiste` | `TEXT` |  |
| `prenom_dentiste` | `TEXT` |  |
| `tel_bur_dentiste` | `TEXT` |  |
| `tel_dom_dentiste` | `TEXT` |  |
| `fax_dentiste` | `TEXT` |  |
| `minitel_dentiste` | `TEXT` |  |
| `adresse_dentiste_professionnelle` | `TEXT` |  |
| `ville_professionnelle` | `TEXT` |  |
| `code_ville_professionnelle` | `TEXT` |  |
| `adresse_dentiste_domicile` | `TEXT` |  |
| `ville_domicile` | `TEXT` |  |
| `code_ville_domicile` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `flag_libre_pratique` | `TEXT` |  |
| `gouvernorat` | `TEXT` |  |
| `lieu_exercice` | `TEXT` |  |
| `nom_travail` | `TEXT` |  |

### `raw_t_an_entreprises`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_entreprise` | `TEXT` |  |
| `nom_entreprise` | `TEXT` |  |
| `tel_bur_entreprise` | `TEXT` |  |
| `fax_entreprise` | `TEXT` |  |
| `minitel_entreprise` | `TEXT` |  |
| `adresse_entreprise` | `TEXT` |  |
| `ville` | `TEXT` |  |
| `code_ville` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `fonction_entreprise` | `TEXT` |  |
| `secteur_entreprise` | `TEXT` |  |
| `nom_responsable` | `TEXT` |  |
| `libelle_correspondance` | `TEXT` |  |

### `raw_t_an_medecins`

Rows: **2287**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medecin` | `TEXT` |  |
| `code_medecin` | `TEXT` |  |
| `nom_medecin` | `TEXT` |  |
| `prenom_medecin` | `TEXT` |  |
| `specialite_medecin` | `TEXT` |  |
| `tel_bur_medecin` | `TEXT` |  |
| `tel_dom_medecin` | `TEXT` |  |
| `fax_medecin` | `TEXT` |  |
| `minitel_medecin` | `TEXT` |  |
| `adresse_medecin_professionnelle` | `TEXT` |  |
| `ville_professionnelle_medecin` | `TEXT` |  |
| `code_ville_professionnelle_medecin` | `TEXT` |  |
| `adresse_medecin_domicile` | `TEXT` |  |
| `ville_domicile_medecin` | `TEXT` |  |
| `code_ville_domicile_medecin` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `flag_appartenance` | `TEXT` |  |
| `flag_libre_pratique` | `TEXT` |  |
| `gouvernorat` | `TEXT` |  |
| `service` | `TEXT` |  |
| `travail` | `TEXT` |  |

### `raw_t_an_paramedicaux`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_paramedical` | `TEXT` |  |
| `code_infirmier` | `TEXT` |  |
| `nom_paramedical` | `TEXT` |  |
| `prenom_paramedical` | `TEXT` |  |
| `tel_bur_paramedical` | `TEXT` |  |
| `tel_dom_paramedical` | `TEXT` |  |
| `fax_paramedical` | `TEXT` |  |
| `minitel_paramedical` | `TEXT` |  |
| `adresse_paramedical_professionnelle` | `TEXT` |  |
| `ville_professionnelle` | `TEXT` |  |
| `code_ville_professionnelle` | `TEXT` |  |
| `adresse_paramedical_domicile` | `TEXT` |  |
| `ville_domicile` | `TEXT` |  |
| `code_ville_domicile` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `fonction_paramedical` | `TEXT` |  |
| `flag_appartenance` | `TEXT` |  |

### `raw_t_an_personnelle`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_personnelle` | `TEXT` |  |
| `nom_personnelle` | `TEXT` |  |
| `prenom_personnelle` | `TEXT` |  |
| `tel_bur_personnelle` | `TEXT` |  |
| `tel_dom_personnelle` | `TEXT` |  |
| `fax_personnelle` | `TEXT` |  |
| `minitel_personnelle` | `TEXT` |  |
| `adresse_personnelle_professionnelle` | `TEXT` |  |
| `ville_professionnelle` | `TEXT` |  |
| `code_ville_professionnelle` | `TEXT` |  |
| `adresse_personnelle_domicile` | `TEXT` |  |
| `ville_domicile` | `TEXT` |  |
| `code_ville_domicile` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |

### `raw_t_an_pharmaciens`

Rows: **114**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_pharmacien` | `TEXT` |  |
| `nom_pharmacien` | `TEXT` |  |
| `prenom_pharmacien` | `TEXT` |  |
| `tel_bur_pharmacien` | `TEXT` |  |
| `tel_dom_pharmacien` | `TEXT` |  |
| `fax_pharmacien` | `TEXT` |  |
| `minitel_pharmacien` | `TEXT` |  |
| `adresse_pharmacien_professionnelle` | `TEXT` |  |
| `ville_professionnelle` | `TEXT` |  |
| `code_ville_professionnelle` | `TEXT` |  |
| `adresse_pharmacien_domicile` | `TEXT` |  |
| `ville_domicile` | `TEXT` |  |
| `code_ville_domicile` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `flag_libre_pratique` | `TEXT` |  |
| `gouvernorat` | `TEXT` |  |
| `lieu_exercice` | `TEXT` |  |
| `nom_travail` | `TEXT` |  |

### `raw_t_an_table_des_fonctions`

Rows: **122**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_fonction` | `TEXT` |  |
| `nom_menu` | `TEXT` |  |
| `compteur` | `TEXT` |  |

### `raw_t_an_telephones`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_telephone` | `TEXT` |  |
| `nom_telephone` | `TEXT` |  |
| `tel_bur_telephone` | `TEXT` |  |
| `tel_dom_telephone` | `TEXT` |  |
| `fax_telephone` | `TEXT` |  |
| `minitel_telephone` | `TEXT` |  |
| `adresse_telephone` | `TEXT` |  |
| `ville` | `TEXT` |  |
| `code_ville` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |

### `raw_t_assurance`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_assurance` | `TEXT` |  |
| `adresse_assurance` | `TEXT` |  |
| `ville_assurance` | `TEXT` |  |
| `code_ville_assurance` | `TEXT` |  |
| `tel_assurance` | `TEXT` |  |

### `raw_t_banque`

Rows: **2**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `code_banque` | `TEXT` |  |
| `nom_banque` | `TEXT` |  |
| `adresse_banque` | `TEXT` |  |
| `tel_banque` | `TEXT` |  |

### `raw_t_bib_auteur`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_auteur` | `TEXT` |  |
| `nom_auteur` | `TEXT` |  |

### `raw_t_bib_bibliographie`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_bibliographie` | `TEXT` |  |
| `titre_bibliographie` | `TEXT` |  |
| `compteur_revue` | `TEXT` |  |
| `annee_revue` | `TEXT` |  |
| `mois_revue` | `TEXT` |  |
| `numero_revue` | `TEXT` |  |
| `page_debut_revue` | `TEXT` |  |
| `page_fin_revue` | `TEXT` |  |
| `type` | `TEXT` |  |
| `localisation` | `TEXT` |  |
| `reference_bibliographie` | `TEXT` |  |
| `editeur_bibliographie` | `TEXT` |  |
| `flag_1_bibliographie` | `TEXT` |  |
| `flag_2_bibliographie` | `TEXT` |  |
| `flag_3_bibliographie` | `TEXT` |  |
| `resume_bibliographie` | `TEXT` |  |
| `code_m1` | `TEXT` |  |
| `code_m2` | `TEXT` |  |
| `code_p` | `TEXT` |  |
| `code_t` | `TEXT` |  |
| `precision_1` | `TEXT` |  |
| `precision_2` | `TEXT` |  |
| `precision_3` | `TEXT` |  |

### `raw_t_bib_bibliographie_auteur`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_auteur` | `TEXT` |  |
| `nom_auteur` | `TEXT` |  |
| `compteur_bibliographie` | `TEXT` |  |

### `raw_t_bib_bibliographie_mot_cle`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_mot_cle` | `TEXT` |  |
| `texte_mot_cle` | `TEXT` |  |
| `compteur_bibliographie` | `TEXT` |  |

### `raw_t_bib_bibliographie_revue`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_revue` | `TEXT` |  |
| `nom_revue` | `TEXT` |  |
| `compteur_bibliographie` | `TEXT` |  |

### `raw_t_bib_code_medical_m1`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `code_m1` | `TEXT` |  |
| `designation_m1` | `TEXT` |  |

### `raw_t_bib_code_medical_m2`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `code_m1` | `TEXT` |  |
| `code_m2` | `TEXT` |  |
| `designation_m2` | `TEXT` |  |

### `raw_t_bib_code_medical_p`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `code_p` | `TEXT` |  |
| `designation_p` | `TEXT` |  |

### `raw_t_bib_code_medical_t`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `code_t` | `TEXT` |  |
| `designation_t` | `TEXT` |  |

### `raw_t_bib_mot_cle`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_mot_cle` | `TEXT` |  |
| `texte_mot_cle` | `TEXT` |  |

### `raw_t_bib_revue`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_revue` | `TEXT` |  |
| `nom_revue` | `TEXT` |  |

### `raw_t_bib_table_des_fonctions`

Rows: **50**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_fonction` | `TEXT` |  |
| `nom_menu` | `TEXT` |  |
| `compteur` | `TEXT` |  |

### `raw_t_constante_par_defaut`

Rows: **18**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `type_constante_defaut` | `TEXT` |  |
| `libelle_constante_defaut` | `TEXT` |  |
| `valeur_constante_defaut` | `TEXT` |  |

### `raw_t_consultations`

Rows: **154352**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_consultation` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `date_consultation` | `TEXT` |  |
| `heure_consultation` | `TEXT` |  |
| `enregistrement_son` | `TEXT` |  |
| `remarques_consultations` | `TEXT` |  |
| `flag_remarques_consultations` | `TEXT` |  |

### `raw_t_consultations_themes`

Rows: **338306**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_consultation_themes` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `titre_theme` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |
| `date_theme` | `TEXT` |  |
| `heure_theme` | `TEXT` |  |
| `contenu_theme` | `TEXT` |  |
| `flag_examen` | `TEXT` |  |

### `raw_t_consultations_titre_themes`

Rows: **6**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `titre_theme` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |
| `fiche_appelee` | `TEXT` |  |
| `flag_courrier` | `TEXT` |  |
| `flag_examen` | `TEXT` |  |
| `type_examen` | `TEXT` |  |
| `rapport_modele` | `TEXT` |  |

### `raw_t_dos_table_des_fonctions`

Rows: **12**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_fonction` | `TEXT` |  |
| `nom_menu` | `TEXT` |  |
| `compteur` | `TEXT` |  |

### `raw_t_dossier_medical`

Rows: **37241**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_dossier_medical` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `date_dossier_medical` | `TEXT` |  |
| `heure_dossier_medical` | `TEXT` |  |
| `code_dossier_medical` | `TEXT` |  |
| `titre_dossier_medical` | `TEXT` |  |
| `remarques_dossier_medical` | `TEXT` |  |
| `statut` | `TEXT` |  |
| `couverture_sociale` | `TEXT` |  |
| `date_accident` | `TEXT` |  |
| `heure_accident` | `TEXT` |  |

### `raw_t_examens`

Rows: **4026**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_examens` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `numero_examens` | `TEXT` |  |
| `date_examens` | `TEXT` |  |
| `heure_examens` | `TEXT` |  |
| `titre_examens` | `TEXT` |  |
| `conclusion_examens` | `TEXT` |  |
| `fait_par` | `TEXT` |  |
| `type_examen` | `TEXT` |  |

### `raw_t_examens_sub`

Rows: **4375**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_examens_sub` | `TEXT` |  |
| `compteur_examens` | `TEXT` |  |
| `nom_element` | `TEXT` |  |
| `donnee_element` | `TEXT` |  |
| `remarques` | `TEXT` |  |
| `image_radio` | `TEXT` |  |
| `resume_radio` | `TEXT` |  |

### `raw_t_fiche_administrative`

Rows: **38541**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur` | `TEXT` |  |
| `nom` | `TEXT` |  |
| `nom_jeune_fille` | `TEXT` |  |
| `prenom` | `TEXT` |  |
| `n_dossier` | `TEXT` |  |
| `matricule` | `TEXT` |  |
| `date_de_naissance` | `TEXT` |  |
| `lieu_de_naissance` | `TEXT` |  |
| `sexe` | `TEXT` |  |
| `situation_de_famille` | `TEXT` |  |
| `mr_mme_melle_enfant` | `TEXT` |  |
| `adresse` | `TEXT` |  |
| `ville` | `TEXT` |  |
| `code_ville` | `TEXT` |  |
| `gouvernorat_ou_pays` | `TEXT` |  |
| `origine` | `TEXT` |  |
| `profession` | `TEXT` |  |
| `employeur` | `TEXT` |  |
| `activite_employeur` | `TEXT` |  |
| `adresse_profession` | `TEXT` |  |
| `ville_profession` | `TEXT` |  |
| `code_ville_profession` | `TEXT` |  |
| `tel_bureau` | `TEXT` |  |
| `tel_domicile` | `TEXT` |  |
| `proche` | `TEXT` |  |
| `tel_proche` | `TEXT` |  |
| `n_affiliation` | `TEXT` |  |
| `statut` | `TEXT` |  |
| `couverture_sociale` | `TEXT` |  |
| `remarques` | `TEXT` |  |
| `remarques_medicales_importantes` | `TEXT` |  |
| `date_1ere_consultation` | `TEXT` |  |
| `notesstate` | `TEXT` |  |
| `notes` | `TEXT` |  |

### `raw_t_fiche_administrative_sub_confier`

Rows: **5**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medecins_traitants` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_medecin` | `TEXT` |  |
| `nom_medecin` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_fiche_administrative_sub_medecins`

Rows: **56**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medecins_traitants` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_medecin` | `TEXT` |  |
| `nom_medecin` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_ges_comptes_comptables`

Rows: **5**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_comptes_comptables` | `TEXT` |  |
| `n_compte` | `TEXT` |  |
| `libelle_compte` | `TEXT` |  |

### `raw_t_ges_constantes`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_comptes_comptables` | `TEXT` |  |
| `libelle_constante` | `TEXT` |  |
| `valeur_constante` | `TEXT` |  |

### `raw_t_ges_echeancier`

Rows: **455**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_echeancier` | `TEXT` |  |
| `annee_echeancier` | `TEXT` |  |
| `mois_echeancier` | `TEXT` |  |
| `jour_echeancier` | `TEXT` |  |
| `description_echeancier` | `TEXT` |  |
| `montant_echeancier` | `TEXT` |  |
| `flag_reglement_echeancier` | `TEXT` |  |
| `remarques_echeancier` | `TEXT` |  |

### `raw_t_ges_echeancier_depenses`

Rows: **518**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_echeancier` | `TEXT` |  |
| `annee_echeancier` | `TEXT` |  |
| `mois_echeancier` | `TEXT` |  |
| `jour_echeancier` | `TEXT` |  |
| `description_echeancier` | `TEXT` |  |
| `montant_echeancier` | `TEXT` |  |
| `flag_reglement_echeancier` | `TEXT` |  |
| `remarques_echeancier` | `TEXT` |  |

### `raw_t_ges_mouvements_comptes`

Rows: **8**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_mouvements_comptes` | `TEXT` |  |
| `annee_mouvement` | `TEXT` |  |
| `mois_mouvement` | `TEXT` |  |
| `n_piece` | `TEXT` |  |
| `n_compte` | `TEXT` |  |
| `libelle_mouvement` | `TEXT` |  |
| `montant_debit` | `TEXT` |  |
| `montant_credit` | `TEXT` |  |

### `raw_t_memento`

Rows: **122**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_memento` | `TEXT` |  |
| `titre_memento` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |
| `texte_memento` | `TEXT` |  |

### `raw_t_mv_delegues_medicaux`

Rows: **16**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_delegue_medical` | `TEXT` |  |
| `nom_delegue_medical` | `TEXT` |  |
| `prenom_delegue_medical` | `TEXT` |  |
| `tel_bur_delegue_medical` | `TEXT` |  |
| `tel_dom_delegue_medical` | `TEXT` |  |
| `fax_delegue_medical` | `TEXT` |  |
| `minitel_delegue_medical` | `TEXT` |  |
| `adresse_delegue_medical_professionnelle` | `TEXT` |  |
| `ville_professionnelle` | `TEXT` |  |
| `adresse_delegue_medical_domicile` | `TEXT` |  |
| `ville_domicile` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |
| `laboratoire_delegue_medical` | `TEXT` |  |
| `code_laboratoire_medicament` | `TEXT` |  |

### `raw_t_mv_diagnostic`

Rows: **342**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_diagnostic` | `TEXT` |  |
| `code_diagnostic` | `TEXT` |  |
| `designation_diagnostic` | `TEXT` |  |
| `compteur_diagnostic_titre` | `TEXT` |  |
| `ordre_diagnostic` | `TEXT` |  |
| `type_diagnostic` | `TEXT` |  |

### `raw_t_mv_diagnostic_titre`

Rows: **16**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_diagnostic_titre` | `TEXT` |  |
| `titre_diagnostic` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |

### `raw_t_mv_famille_c_i_diagnostic`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_famille_c_i_diagnostic` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `code_diagnostic` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_mv_famille_c_i_tare`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_famille_c_i_tare` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `code_tare` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_mv_famille_medicaments`

Rows: **55**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_famille_medicament` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `famille_medicament` | `TEXT` |  |
| `niveau_hierarchie` | `TEXT` |  |

### `raw_t_mv_famille_sous_famille_medicaments`

Rows: **8**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_sous_famille_medicament` | `TEXT` |  |
| `code_principal_famille_medicament` | `TEXT` |  |
| `code_sous_famille_medicament` | `TEXT` |  |

### `raw_t_mv_fiche_allergie_famille`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_allergie_famille` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `date_debut_allergie_famille` | `TEXT` |  |
| `date_fin_allergie_famille` | `TEXT` |  |
| `remarque_allergie_famille` | `TEXT` |  |

### `raw_t_mv_fiche_allergie_medicamenteuse`

Rows: **9**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_allergie_medicamenteuse` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `date_debut_allergie_medicamenteuse` | `TEXT` |  |
| `date_fin_allergie_medicamenteuse` | `TEXT` |  |
| `remarque_allergie_medicamenteuse` | `TEXT` |  |

### `raw_t_mv_fiche_diagnostic`

Rows: **218**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_diagnostic` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_diagnostic` | `TEXT` |  |
| `date_debut_diagnostic` | `TEXT` |  |
| `date_fin_diagnostic` | `TEXT` |  |
| `remarque_diagnostic` | `TEXT` |  |

### `raw_t_mv_fiche_intolerance_famille`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_intolerance_famille` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `date_debut_intolerance_famille` | `TEXT` |  |
| `date_fin_intolerance_famille` | `TEXT` |  |
| `remarque_intolerance_famille` | `TEXT` |  |

### `raw_t_mv_fiche_intolerance_medicamenteuse`

Rows: **7**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_intolerance_medicamenteuse` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `date_debut_intolerance_medicamenteuse` | `TEXT` |  |
| `date_fin_intolerance_medicamenteuse` | `TEXT` |  |
| `remarque_intolerance_medicamenteuse` | `TEXT` |  |

### `raw_t_mv_fiche_medicaments_prescrits`

Rows: **326357**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_medicaments_prescrits` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `numero_ordonnance` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `date_debut_medicaments_prescrits` | `TEXT` |  |
| `date_fin_medicaments_prescrits` | `TEXT` |  |
| `flag_test_interactions` | `TEXT` |  |
| `zone_1_medicament_ordonnance` | `TEXT` |  |
| `zone_2_medicament_ordonnance` | `TEXT` |  |
| `zone_3_medicament_ordonnance` | `TEXT` |  |
| `zone_4_medicament_ordonnance` | `TEXT` |  |

### `raw_t_mv_fiche_tare`

Rows: **1145**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche_tare` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `code_tare` | `TEXT` |  |
| `date_debut_tare` | `TEXT` |  |
| `date_fin_tare` | `TEXT` |  |
| `remarque_tare` | `TEXT` |  |

### `raw_t_mv_interactions_familles_medicaments`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_interactions_familles_medicaments` | `TEXT` |  |
| `code_famille_medicament_a` | `TEXT` |  |
| `code_famille_medicament_b` | `TEXT` |  |
| `type_interaction` | `TEXT` |  |
| `precaution_d_emploi` | `TEXT` |  |

### `raw_t_mv_interactions_medicament_avec_famille`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_interactions_medicament_avec_famille` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `type_interaction` | `TEXT` |  |
| `precaution_d_emploi` | `TEXT` |  |

### `raw_t_mv_interactions_medicaments`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_interactions_medicaments` | `TEXT` |  |
| `code_medicament_a` | `TEXT` |  |
| `code_medicament_b` | `TEXT` |  |
| `type_interaction` | `TEXT` |  |
| `precaution_d_emploi` | `TEXT` |  |

### `raw_t_mv_laboratoires_medicaments`

Rows: **74**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_laboratoire_medicament` | `TEXT` |  |
| `code_laboratoire_medicament` | `TEXT` |  |
| `nom_laboratoire_medicament` | `TEXT` |  |
| `adresse_laboratoire_medicament` | `TEXT` |  |
| `tel_laboratoire_medicament` | `TEXT` |  |
| `fax_laboratoire_medicament` | `TEXT` |  |
| `minitel_laboratoire_medicament` | `TEXT` |  |
| `autres_indications` | `TEXT` |  |

### `raw_t_mv_medicament_c_i_diagnostic`

Rows: **2**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicament_c_i_diagnostic` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `code_diagnostic` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_mv_medicament_c_i_tare`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicament_c_i_tare` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `code_tare` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_mv_medicament_forme_posologie`

Rows: **4799**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicament_forme_posologie` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `forme_et_presentations` | `TEXT` |  |
| `mode_d_emploi_et_posologie` | `TEXT` |  |
| `flag_existe` | `TEXT` |  |

### `raw_t_mv_medicaments`

Rows: **2346**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicament` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `nom_commercial_medicament` | `TEXT` |  |
| `code_laboratoire_medicament` | `TEXT` |  |
| `forme_et_presentations_medicament` | `TEXT` |  |
| `composition_medicament` | `TEXT` |  |
| `mode_d_emploi_et_posologie_medicament` | `TEXT` |  |
| `effets_indesirables_medicament` | `TEXT` |  |
| `proprietes_medicament` | `TEXT` |  |
| `sort_du_medicament` | `TEXT` |  |
| `indications_medicament` | `TEXT` |  |
| `contre_indications_medicament` | `TEXT` |  |
| `precautions_d_emploi_medicament` | `TEXT` |  |
| `interactions_medicamenteuses` | `TEXT` |  |
| `duree_de_stabilite_medicament` | `TEXT` |  |
| `conservation_medicament` | `TEXT` |  |
| `surdosage_medicament` | `TEXT` |  |
| `tableau_medicament` | `TEXT` |  |
| `prix_medicament` | `TEXT` |  |
| `remarques_medicament` | `TEXT` |  |
| `liste` | `TEXT` |  |
| `flag_existe` | `TEXT` |  |

### `raw_t_mv_medicaments_delegues_medicaux`

Rows: **89**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicaments_delegue_medical` | `TEXT` |  |
| `compteur_delegue_medical` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |

### `raw_t_mv_medicaments_familles`

Rows: **339**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicaments_familles` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `code_famille_medicament` | `TEXT` |  |
| `code_sous_famille_medicament` | `TEXT` |  |
| `code_sous_sous_famille_medicament` | `TEXT` |  |

### `raw_t_mv_medicaments_noms_chimiques`

Rows: **414**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_medicaments_noms_chimiques` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `code_nom_chimique` | `TEXT` |  |

### `raw_t_mv_noms_chimiques`

Rows: **159**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_noms_chimiques` | `TEXT` |  |
| `code_nom_chimique` | `TEXT` |  |
| `nom_chimique` | `TEXT` |  |

### `raw_t_mv_ordonnance`

Rows: **113900**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_ordonnance` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `numero_ordonnance` | `TEXT` |  |
| `date_ordonnance` | `TEXT` |  |
| `heure_ordonnance` | `TEXT` |  |
| `flag_date_de_naissance` | `TEXT` |  |
| `flag_adresse` | `TEXT` |  |
| `flag_entete` | `TEXT` |  |
| `zone_nom_prenom` | `TEXT` |  |
| `flag_test_medicament` | `TEXT` |  |
| `flag_test_allergie` | `TEXT` |  |
| `flag_test_intolerance` | `TEXT` |  |
| `flag_test_diagnostic` | `TEXT` |  |
| `flag_test_tare` | `TEXT` |  |
| `flag_nom_prenom` | `TEXT` |  |
| `prochain_controle` | `TEXT` |  |
| `nombre_duree` | `TEXT` |  |
| `type_duree` | `TEXT` |  |
| `nombre_renouvellement` | `TEXT` |  |
| `poids` | `TEXT` |  |

### `raw_t_mv_remarques_delegues_medicaux`

Rows: **4**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_remarques_delegue_medical` | `TEXT` |  |
| `compteur_delegue_medical` | `TEXT` |  |
| `dates_remarques_delegue_medical` | `TEXT` |  |
| `remarques_delegue_medical` | `TEXT` |  |

### `raw_t_mv_table_des_fonctions`

Rows: **206**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_fonction` | `TEXT` |  |
| `nom_menu` | `TEXT` |  |
| `compteur` | `TEXT` |  |

### `raw_t_mv_tare`

Rows: **41**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_tare` | `TEXT` |  |
| `code_tare` | `TEXT` |  |
| `designation_tare` | `TEXT` |  |
| `compteur_tare_titre` | `TEXT` |  |
| `ordre_tare` | `TEXT` |  |
| `type_tare` | `TEXT` |  |

### `raw_t_mv_tare_titre`

Rows: **1**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_tare_titre` | `TEXT` |  |
| `titre_tare` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |

### `raw_t_patient_fiche_des_notes`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur` | `TEXT` |  |
| `notes` | `TEXT` |  |

### `raw_t_pers_nom_etat`

Rows: **7**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_etat` | `TEXT` |  |

### `raw_t_pers_table`

Rows: **4**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `code_personnalisation` | `TEXT` |  |
| `type_personnalisation` | `TEXT` |  |
| `flag_impression` | `TEXT` |  |
| `nom_etat` | `TEXT` |  |
| `flag_resume` | `TEXT` |  |

### `raw_t_personnalisation_contenu`

Rows: **155**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_personnalisation_contenu` | `TEXT` |  |
| `compteur_personnalisation` | `TEXT` |  |
| `element_personnalisation` | `TEXT` |  |
| `ordre_personnalisation` | `TEXT` |  |
| `type_personnalisation` | `TEXT` |  |

### `raw_t_personnalisation_titre`

Rows: **9**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_personnalisation` | `TEXT` |  |
| `titre_personnalisation` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |

### `raw_t_rapo_liste_rapport`

Rows: **26**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_liste_rapport` | `TEXT` |  |
| `titre_liste_rapport` | `TEXT` |  |
| `ordre_titre` | `TEXT` |  |
| `zone_liste_rapport` | `TEXT` |  |
| `flag_liste_entete` | `TEXT` |  |
| `flag_liste_titre` | `TEXT` |  |
| `nom_liste_etat` | `TEXT` |  |

### `raw_t_rapo_rapport`

Rows: **24666**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_rapport` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `numero_rapport` | `TEXT` |  |
| `date_rapport` | `TEXT` |  |
| `heure_rapport` | `TEXT` |  |
| `flag_entete` | `TEXT` |  |
| `flag_titre` | `TEXT` |  |
| `titre_rapport` | `TEXT` |  |
| `zone_rapport` | `TEXT` |  |
| `titre_theme` | `TEXT` |  |
| `nom_etat` | `TEXT` |  |
| `flag_liaison` | `TEXT` |  |
| `zone_liaison` | `TEXT` |  |

### `raw_t_rapo_table_des_fonctions`

Rows: **76**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fonction` | `TEXT` |  |
| `syntaxe_fonction` | `TEXT` |  |
| `code` | `TEXT` |  |
| `ordre` | `TEXT` |  |
| `origine` | `TEXT` |  |

### `raw_t_rdv_fiche_des_notes`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `jour` | `TEXT` |  |
| `notes` | `TEXT` |  |

### `raw_t_rdv_jours_conges`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `jour_conge` | `TEXT` |  |
| `designation_conge` | `TEXT` |  |

### `raw_t_rdv_personnalisation`

Rows: **28**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_rdv_personnalisation` | `TEXT` |  |
| `libelle_jour` | `TEXT` |  |
| `numero_jour` | `TEXT` |  |
| `horaire_debut_rdv` | `TEXT` |  |
| `nombre_de_rdv` | `TEXT` |  |
| `intervalle_minute` | `TEXT` |  |
| `mois_debut` | `TEXT` |  |
| `mois_fin` | `TEXT` |  |
| `date_debut_limite` | `TEXT` |  |
| `date_fin_limite` | `TEXT` |  |

### `raw_t_rdv_rendez_vous`

Rows: **3849**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `jour_rendez_vous` | `TEXT` |  |
| `heure_rendez_vous` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `flag_confirmation` | `TEXT` |  |
| `date_affectation` | `TEXT` |  |
| `flag_rdv` | `TEXT` |  |
| `nomprenom` | `TEXT` |  |
| `n_dossier` | `TEXT` |  |
| `remarques` | `TEXT` |  |
| `flag_paiement` | `TEXT` |  |
| `flag_remarques` | `TEXT` |  |

### `raw_t_rdv_table_des_fiches`

Rows: **14**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nom_fonction` | `TEXT` |  |
| `compteur` | `TEXT` |  |

### `raw_t_stk_medicaments`

Rows: **12**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_stk_medicaments` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `forme_et_presentations` | `TEXT` |  |

### `raw_t_stk_medicaments_sub_d`

Rows: **2**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_stk_medicaments_sub_d` | `TEXT` |  |
| `compteur_stk_medicaments_sub_r` | `TEXT` |  |
| `compteur_stk_medicaments` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `quantite` | `TEXT` |  |
| `date_livraison` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_stk_medicaments_sub_r`

Rows: **9**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_stk_medicaments_sub_r` | `TEXT` |  |
| `compteur_stk_medicaments` | `TEXT` |  |
| `code_medicament` | `TEXT` |  |
| `quantite` | `TEXT` |  |
| `date_reception` | `TEXT` |  |
| `date_limite` | `TEXT` |  |
| `remarques` | `TEXT` |  |

### `raw_t_trace`

Rows: **170598**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_trace` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `date_trace` | `TEXT` |  |

### `raw_t_w_parametres_consultation`

Rows: **37**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_parametres_consultation` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `date_parametres_consultation` | `TEXT` |  |
| `heure_parametres_consultation` | `TEXT` |  |
| `recul` | `TEXT` |  |
| `temperature` | `TEXT` |  |
| `pouls` | `TEXT` |  |
| `frequence_respiratoire` | `TEXT` |  |
| `ta_couche` | `TEXT` |  |
| `ta_debout` | `TEXT` |  |
| `poids` | `TEXT` |  |
| `taille` | `TEXT` |  |

### `raw_t_w_parametres_courrier`

Rows: **14579**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_parametres_courrier` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `date_parametres_courrier` | `TEXT` |  |
| `heure_parametres_courrier` | `TEXT` |  |
| `accompagnant` | `TEXT` |  |
| `date_debut_accompagnant` | `TEXT` |  |
| `date_fin_accompagnant` | `TEXT` |  |
| `type_incapacite` | `TEXT` |  |
| `nombre_jours_incapacite` | `TEXT` |  |
| `date_debut_incapacite` | `TEXT` |  |
| `date_fin_incapacite` | `TEXT` |  |
| `cause_incapacite` | `TEXT` |  |
| `sortie_autorisee_interdite` | `TEXT` |  |
| `confier_a_code_medecin` | `TEXT` |  |
| `confier_a_nom_medecin` | `TEXT` |  |
| `confier_a_remarques` | `TEXT` |  |

### `raw_t_w_pers_type_table`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_fiche` | `TEXT` |  |
| `compteur` | `TEXT` |  |
| `numero_dossier_medical` | `TEXT` |  |
| `numero_consultation` | `TEXT` |  |
| `numero_fiche` | `TEXT` |  |
| `date_fiche` | `TEXT` |  |
| `heure_fiche` | `TEXT` |  |

### `raw_table_nomforms`

Rows: **192**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_table_nomforms` | `TEXT` |  |
| `nomforms` | `TEXT` |  |
| `nomforms_ii` | `TEXT` |  |
| `nomforms_iii` | `TEXT` |  |

### `raw_table_nomtables`

Rows: **97**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_table_nomtables` | `TEXT` |  |
| `nomtables` | `TEXT` |  |
| `nomtables_ii` | `TEXT` |  |
| `nomtables_iii` | `TEXT` |  |

### `raw_table_nomtables_attach`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_table_nomtables` | `TEXT` |  |
| `nomtables` | `TEXT` |  |
| `nomtables_ii` | `TEXT` |  |
| `nomtables_iii` | `TEXT` |  |

### `raw_tc_liste_attach`

Rows: **98**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_liste_attach` | `TEXT` |  |
| `nomtables` | `TEXT` |  |
| `nomtables_ii` | `TEXT` |  |
| `nomtables_iii` | `TEXT` |  |

### `raw_tc_repertoire`

Rows: **0**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `compteur_liste_attach_repertoire` | `TEXT` |  |
| `nom_drive` | `TEXT` |  |
| `nom_repertoire` | `TEXT` |  |
| `repertoire_programme` | `TEXT` |  |
| `repertoire_donnee` | `TEXT` |  |
| `nom_base` | `TEXT` |  |
| `notes` | `TEXT` |  |

### `raw_tc_table_stable`

Rows: **99**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `nomtables` | `TEXT` |  |
| `nomtables_ii` | `TEXT` |  |

### `raw_tc_table_variable`

Rows: **638**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `n` | `TEXT` |  |
| `variable` | `TEXT` |  |
| `variable_ii` | `TEXT` |  |
| `variable_iii` | `TEXT` |  |
| `type_variable` | `TEXT` |  |

### `raw_tc_table_variable1`

Rows: **638**

| Column | Type | Primary key |
|---|---:|---:|
| `__id` | `INTEGER` | yes |
| `__source_file` | `TEXT` |  |
| `__line_number` | `INTEGER` |  |
| `n` | `TEXT` |  |
| `variable` | `TEXT` |  |
| `variable_ii` | `TEXT` |  |
| `variable_iii` | `TEXT` |  |
| `type_variable` | `TEXT` |  |

## Access-to-SQLite column mappings

The full mapping is in `db_context.json`. Summary below:

### `raw_t_actes_categorie_des_actes`

| Original Access column | SQLite column |
|---|---|
| `Compteur catégorie acte` | `compteur_categorie_acte` |
| `Nom catégorie acte` | `nom_categorie_acte` |
### `raw_t_actes_et_honoraires`

| Original Access column | SQLite column |
|---|---|
| `Compteur Actes et Honoraires` | `compteur_actes_et_honoraires` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Numéro acte` | `numero_acte` |
| `Date Actes et Honoraires` | `date_actes_et_honoraires` |
| `Heure Actes et Honoraires` | `heure_actes_et_honoraires` |
| `Total actes` | `total_actes` |
| `Total fournitures` | `total_fournitures` |
| `Montant en espèces` | `montant_en_especes` |
| `Montant par chèque` | `montant_par_cheque` |
| `Couverture sociale` | `couverture_sociale` |
| `Code banque` | `code_banque` |
| `N° chèque` | `n_cheque` |
### `raw_t_actes_et_honoraires_sub`

| Original Access column | SQLite column |
|---|---|
| `Compteur Actes et Honoraires Sub` | `compteur_actes_et_honoraires_sub` |
| `Compteur Actes et Honoraires` | `compteur_actes_et_honoraires` |
| `Nom catégorie acte` | `nom_categorie_acte` |
| `Nom acte` | `nom_acte` |
| `Code acte` | `code_acte` |
| `Montant acte` | `montant_acte` |
### `raw_t_actes_liste_des_actes`

| Original Access column | SQLite column |
|---|---|
| `Compteur catégorie acte` | `compteur_categorie_acte` |
| `Nom acte` | `nom_acte` |
| `Code acte` | `code_acte` |
| `Montant acte` | `montant_acte` |
### `raw_t_aide_table_des_fonctions`

| Original Access column | SQLite column |
|---|---|
| `Nom fonction` | `nom_fonction` |
| `Nom menu` | `nom_menu` |
| `Compteur` | `compteur` |
### `raw_t_an_biologistes`

| Original Access column | SQLite column |
|---|---|
| `Compteur biologiste` | `compteur_biologiste` |
| `Code biologiste` | `code_biologiste` |
| `Nom biologiste` | `nom_biologiste` |
| `Prénom biologiste` | `prenom_biologiste` |
| `Spécialité biologiste` | `specialite_biologiste` |
| `Tél Bur biologiste` | `tel_bur_biologiste` |
| `Tél Dom biologiste` | `tel_dom_biologiste` |
| `Fax biologiste` | `fax_biologiste` |
| `Minitel biologiste` | `minitel_biologiste` |
| `Adresse biologiste  professionnelle` | `adresse_biologiste_professionnelle` |
| `Ville professionnelle` | `ville_professionnelle` |
| `Code Ville professionnelle` | `code_ville_professionnelle` |
| `Adresse biologiste  domicile` | `adresse_biologiste_domicile` |
| `Ville domicile` | `ville_domicile` |
| `Code Ville domicile` | `code_ville_domicile` |
| `Autres indications` | `autres_indications` |
| `Flag appartenance` | `flag_appartenance` |
### `raw_t_an_cliniques`

| Original Access column | SQLite column |
|---|---|
| `Compteur clinique` | `compteur_clinique` |
| `Nom clinique` | `nom_clinique` |
| `Service clinique` | `service_clinique` |
| `Nom responsable` | `nom_responsable` |
| `Tél Bur clinique` | `tel_bur_clinique` |
| `Fax clinique` | `fax_clinique` |
| `Minitel clinique` | `minitel_clinique` |
| `Adresse clinique` | `adresse_clinique` |
| `Ville` | `ville` |
| `Code Ville` | `code_ville` |
| `Autres indications` | `autres_indications` |
### `raw_t_an_dentistes`

| Original Access column | SQLite column |
|---|---|
| `Compteur dentiste` | `compteur_dentiste` |
| `Nom dentiste` | `nom_dentiste` |
| `Prénom dentiste` | `prenom_dentiste` |
| `Tél Bur dentiste` | `tel_bur_dentiste` |
| `Tél Dom dentiste` | `tel_dom_dentiste` |
| `Fax dentiste` | `fax_dentiste` |
| `Minitel dentiste` | `minitel_dentiste` |
| `Adresse dentiste  professionnelle` | `adresse_dentiste_professionnelle` |
| `Ville professionnelle` | `ville_professionnelle` |
| `Code Ville professionnelle` | `code_ville_professionnelle` |
| `Adresse dentiste  domicile` | `adresse_dentiste_domicile` |
| `Ville domicile` | `ville_domicile` |
| `Code Ville domicile` | `code_ville_domicile` |
| `Autres indications` | `autres_indications` |
| `Flag libre pratique` | `flag_libre_pratique` |
| `Gouvernorat` | `gouvernorat` |
| `Lieu exercice` | `lieu_exercice` |
| `Nom travail` | `nom_travail` |
### `raw_t_an_entreprises`

| Original Access column | SQLite column |
|---|---|
| `Compteur entreprise` | `compteur_entreprise` |
| `Nom entreprise` | `nom_entreprise` |
| `Tél Bur entreprise` | `tel_bur_entreprise` |
| `Fax entreprise` | `fax_entreprise` |
| `Minitel entreprise` | `minitel_entreprise` |
| `Adresse entreprise` | `adresse_entreprise` |
| `Ville` | `ville` |
| `Code Ville` | `code_ville` |
| `Autres indications` | `autres_indications` |
| `Fonction entreprise` | `fonction_entreprise` |
| `Secteur entreprise` | `secteur_entreprise` |
| `Nom responsable` | `nom_responsable` |
| `Libellé correspondance` | `libelle_correspondance` |
### `raw_t_an_medecins`

| Original Access column | SQLite column |
|---|---|
| `Compteur médecin` | `compteur_medecin` |
| `Code médecin` | `code_medecin` |
| `Nom médecin` | `nom_medecin` |
| `Prénom médecin` | `prenom_medecin` |
| `Spécialité médecin` | `specialite_medecin` |
| `Tél Bur médecin` | `tel_bur_medecin` |
| `Tél Dom médecin` | `tel_dom_medecin` |
| `Fax médecin` | `fax_medecin` |
| `Minitel médecin` | `minitel_medecin` |
| `Adresse médecin  professionnelle` | `adresse_medecin_professionnelle` |
| `Ville professionnelle médecin` | `ville_professionnelle_medecin` |
| `Code Ville professionnelle médecin` | `code_ville_professionnelle_medecin` |
| `Adresse médecin  domicile` | `adresse_medecin_domicile` |
| `Ville domicile médecin` | `ville_domicile_medecin` |
| `Code Ville domicile médecin` | `code_ville_domicile_medecin` |
| `Autres indications` | `autres_indications` |
| `Flag appartenance` | `flag_appartenance` |
| `Flag libre pratique` | `flag_libre_pratique` |
| `Gouvernorat` | `gouvernorat` |
| `Service` | `service` |
| `Travail` | `travail` |
### `raw_t_an_paramedicaux`

| Original Access column | SQLite column |
|---|---|
| `Compteur paramédical` | `compteur_paramedical` |
| `Code infirmier` | `code_infirmier` |
| `Nom paramédical` | `nom_paramedical` |
| `Prénom paramédical` | `prenom_paramedical` |
| `Tél Bur paramédical` | `tel_bur_paramedical` |
| `Tél Dom paramédical` | `tel_dom_paramedical` |
| `Fax paramédical` | `fax_paramedical` |
| `Minitel paramédical` | `minitel_paramedical` |
| `Adresse paramédical  professionnelle` | `adresse_paramedical_professionnelle` |
| `Ville professionnelle` | `ville_professionnelle` |
| `Code Ville professionnelle` | `code_ville_professionnelle` |
| `Adresse paramédical  domicile` | `adresse_paramedical_domicile` |
| `Ville domicile` | `ville_domicile` |
| `Code Ville domicile` | `code_ville_domicile` |
| `Autres indications` | `autres_indications` |
| `Fonction paramédical` | `fonction_paramedical` |
| `Flag appartenance` | `flag_appartenance` |
### `raw_t_an_personnelle`

| Original Access column | SQLite column |
|---|---|
| `Compteur personnelle` | `compteur_personnelle` |
| `Nom personnelle` | `nom_personnelle` |
| `Prénom personnelle` | `prenom_personnelle` |
| `Tél Bur personnelle` | `tel_bur_personnelle` |
| `Tél Dom personnelle` | `tel_dom_personnelle` |
| `Fax personnelle` | `fax_personnelle` |
| `Minitel personnelle` | `minitel_personnelle` |
| `Adresse personnelle  professionnelle` | `adresse_personnelle_professionnelle` |
| `Ville professionnelle` | `ville_professionnelle` |
| `Code Ville professionnelle` | `code_ville_professionnelle` |
| `Adresse personnelle  domicile` | `adresse_personnelle_domicile` |
| `Ville domicile` | `ville_domicile` |
| `Code Ville domicile` | `code_ville_domicile` |
| `Autres indications` | `autres_indications` |
### `raw_t_an_pharmaciens`

| Original Access column | SQLite column |
|---|---|
| `Compteur pharmacien` | `compteur_pharmacien` |
| `Nom pharmacien` | `nom_pharmacien` |
| `Prénom pharmacien` | `prenom_pharmacien` |
| `Tél Bur pharmacien` | `tel_bur_pharmacien` |
| `Tél Dom pharmacien` | `tel_dom_pharmacien` |
| `Fax pharmacien` | `fax_pharmacien` |
| `Minitel pharmacien` | `minitel_pharmacien` |
| `Adresse pharmacien  professionnelle` | `adresse_pharmacien_professionnelle` |
| `Ville professionnelle` | `ville_professionnelle` |
| `Code Ville professionnelle` | `code_ville_professionnelle` |
| `Adresse pharmacien  domicile` | `adresse_pharmacien_domicile` |
| `Ville domicile` | `ville_domicile` |
| `Code Ville domicile` | `code_ville_domicile` |
| `Autres indications` | `autres_indications` |
| `Flag libre pratique` | `flag_libre_pratique` |
| `Gouvernorat` | `gouvernorat` |
| `Lieu exercice` | `lieu_exercice` |
| `Nom travail` | `nom_travail` |
### `raw_t_an_table_des_fonctions`

| Original Access column | SQLite column |
|---|---|
| `Nom fonction` | `nom_fonction` |
| `Nom menu` | `nom_menu` |
| `Compteur` | `compteur` |
### `raw_t_an_telephones`

| Original Access column | SQLite column |
|---|---|
| `Compteur téléphone` | `compteur_telephone` |
| `Nom téléphone` | `nom_telephone` |
| `Tél Bur téléphone` | `tel_bur_telephone` |
| `Tél Dom téléphone` | `tel_dom_telephone` |
| `Fax téléphone` | `fax_telephone` |
| `Minitel téléphone` | `minitel_telephone` |
| `Adresse téléphone` | `adresse_telephone` |
| `Ville` | `ville` |
| `Code Ville` | `code_ville` |
| `Autres indications` | `autres_indications` |
### `raw_t_assurance`

| Original Access column | SQLite column |
|---|---|
| `Nom assurance` | `nom_assurance` |
| `Adresse assurance` | `adresse_assurance` |
| `Ville assurance` | `ville_assurance` |
| `Code Ville assurance` | `code_ville_assurance` |
| `Tél assurance` | `tel_assurance` |
### `raw_t_banque`

| Original Access column | SQLite column |
|---|---|
| `Code banque` | `code_banque` |
| `Nom banque` | `nom_banque` |
| `Adresse banque` | `adresse_banque` |
| `Tél banque` | `tel_banque` |
### `raw_t_bib_auteur`

| Original Access column | SQLite column |
|---|---|
| `Compteur auteur` | `compteur_auteur` |
| `Nom auteur` | `nom_auteur` |
### `raw_t_bib_bibliographie`

| Original Access column | SQLite column |
|---|---|
| `Compteur bibliographie` | `compteur_bibliographie` |
| `Titre bibliographie` | `titre_bibliographie` |
| `Compteur revue` | `compteur_revue` |
| `Année revue` | `annee_revue` |
| `Mois revue` | `mois_revue` |
| `Numéro revue` | `numero_revue` |
| `Page début revue` | `page_debut_revue` |
| `Page fin revue` | `page_fin_revue` |
| `Type` | `type` |
| `Localisation` | `localisation` |
| `Référence bibliographie` | `reference_bibliographie` |
| `Editeur bibliographie` | `editeur_bibliographie` |
| `Flag 1 bibliographie` | `flag_1_bibliographie` |
| `Flag 2 bibliographie` | `flag_2_bibliographie` |
| `Flag 3 bibliographie` | `flag_3_bibliographie` |
| `Résumé bibliographie` | `resume_bibliographie` |
| `Code M1` | `code_m1` |
| `Code M2` | `code_m2` |
| `Code P` | `code_p` |
| `Code T` | `code_t` |
| `Précision 1` | `precision_1` |
| `Précision 2` | `precision_2` |
| `Précision 3` | `precision_3` |
### `raw_t_bib_bibliographie_auteur`

| Original Access column | SQLite column |
|---|---|
| `Compteur auteur` | `compteur_auteur` |
| `Nom auteur` | `nom_auteur` |
| `Compteur bibliographie` | `compteur_bibliographie` |
### `raw_t_bib_bibliographie_mot_cle`

| Original Access column | SQLite column |
|---|---|
| `Compteur mot clé` | `compteur_mot_cle` |
| `Texte mot clé` | `texte_mot_cle` |
| `Compteur bibliographie` | `compteur_bibliographie` |
### `raw_t_bib_bibliographie_revue`

| Original Access column | SQLite column |
|---|---|
| `Compteur revue` | `compteur_revue` |
| `Nom revue` | `nom_revue` |
| `Compteur bibliographie` | `compteur_bibliographie` |
### `raw_t_bib_code_medical_m1`

| Original Access column | SQLite column |
|---|---|
| `Code M1` | `code_m1` |
| `Désignation M1` | `designation_m1` |
### `raw_t_bib_code_medical_m2`

| Original Access column | SQLite column |
|---|---|
| `Code M1` | `code_m1` |
| `Code M2` | `code_m2` |
| `Désignation M2` | `designation_m2` |
### `raw_t_bib_code_medical_p`

| Original Access column | SQLite column |
|---|---|
| `Code P` | `code_p` |
| `Désignation P` | `designation_p` |
### `raw_t_bib_code_medical_t`

| Original Access column | SQLite column |
|---|---|
| `Code T` | `code_t` |
| `Désignation T` | `designation_t` |
### `raw_t_bib_mot_cle`

| Original Access column | SQLite column |
|---|---|
| `Compteur mot clé` | `compteur_mot_cle` |
| `Texte mot clé` | `texte_mot_cle` |
### `raw_t_bib_revue`

| Original Access column | SQLite column |
|---|---|
| `Compteur revue` | `compteur_revue` |
| `Nom revue` | `nom_revue` |
### `raw_t_bib_table_des_fonctions`

| Original Access column | SQLite column |
|---|---|
| `Nom fonction` | `nom_fonction` |
| `Nom menu` | `nom_menu` |
| `Compteur` | `compteur` |
### `raw_t_constante_par_defaut`

| Original Access column | SQLite column |
|---|---|
| `Type constante défaut` | `type_constante_defaut` |
| `Libellé constante défaut` | `libelle_constante_defaut` |
| `Valeur constante défaut` | `valeur_constante_defaut` |
### `raw_t_consultations`

| Original Access column | SQLite column |
|---|---|
| `Compteur consultation` | `compteur_consultation` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Date consultation` | `date_consultation` |
| `Heure consultation` | `heure_consultation` |
| `Enregistrement son` | `enregistrement_son` |
| `Remarques consultations` | `remarques_consultations` |
| `Flag Remarques consultations` | `flag_remarques_consultations` |
### `raw_t_consultations_themes`

| Original Access column | SQLite column |
|---|---|
| `Compteur consultation thèmes` | `compteur_consultation_themes` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Titre thème` | `titre_theme` |
| `Ordre Titre` | `ordre_titre` |
| `Date thème` | `date_theme` |
| `Heure thème` | `heure_theme` |
| `Contenu thème` | `contenu_theme` |
| `Flag examen` | `flag_examen` |
### `raw_t_consultations_titre_themes`

| Original Access column | SQLite column |
|---|---|
| `Titre thème` | `titre_theme` |
| `Ordre Titre` | `ordre_titre` |
| `Fiche appelée` | `fiche_appelee` |
| `Flag courrier` | `flag_courrier` |
| `Flag examen` | `flag_examen` |
| `Type examen` | `type_examen` |
| `Rapport modèle` | `rapport_modele` |
### `raw_t_dos_table_des_fonctions`

| Original Access column | SQLite column |
|---|---|
| `Nom fonction` | `nom_fonction` |
| `Nom menu` | `nom_menu` |
| `Compteur` | `compteur` |
### `raw_t_dossier_medical`

| Original Access column | SQLite column |
|---|---|
| `Compteur dossier médical` | `compteur_dossier_medical` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Date dossier médical` | `date_dossier_medical` |
| `Heure dossier médical` | `heure_dossier_medical` |
| `Code dossier médical` | `code_dossier_medical` |
| `Titre dossier médical` | `titre_dossier_medical` |
| `Remarques dossier médical` | `remarques_dossier_medical` |
| `Statut` | `statut` |
| `Couverture sociale` | `couverture_sociale` |
| `Date accident` | `date_accident` |
| `Heure accident` | `heure_accident` |
### `raw_t_examens`

| Original Access column | SQLite column |
|---|---|
| `Compteur EXAMENS` | `compteur_examens` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Numéro examens` | `numero_examens` |
| `Date examens` | `date_examens` |
| `Heure examens` | `heure_examens` |
| `Titre examens` | `titre_examens` |
| `Conclusion examens` | `conclusion_examens` |
| `Fait par` | `fait_par` |
| `Type examen` | `type_examen` |
### `raw_t_examens_sub`

| Original Access column | SQLite column |
|---|---|
| `Compteur EXAMENS SUB` | `compteur_examens_sub` |
| `Compteur EXAMENS` | `compteur_examens` |
| `Nom élément` | `nom_element` |
| `Donnée élément` | `donnee_element` |
| `Remarques` | `remarques` |
| `Image radio` | `image_radio` |
| `Résumé radio` | `resume_radio` |
### `raw_t_fiche_administrative`

| Original Access column | SQLite column |
|---|---|
| `Compteur` | `compteur` |
| `Nom` | `nom` |
| `Nom jeune fille` | `nom_jeune_fille` |
| `Prénom` | `prenom` |
| `N° dossier` | `n_dossier` |
| `Matricule` | `matricule` |
| `Date de naissance` | `date_de_naissance` |
| `Lieu de naissance` | `lieu_de_naissance` |
| `Sexe` | `sexe` |
| `Situation de famille` | `situation_de_famille` |
| `Mr Mme Melle Enfant` | `mr_mme_melle_enfant` |
| `Adresse` | `adresse` |
| `Ville` | `ville` |
| `Code Ville` | `code_ville` |
| `Gouvernorat ou pays` | `gouvernorat_ou_pays` |
| `Origine` | `origine` |
| `Profession` | `profession` |
| `Employeur` | `employeur` |
| `Activité employeur` | `activite_employeur` |
| `Adresse Profession` | `adresse_profession` |
| `Ville Profession` | `ville_profession` |
| `Code Ville Profession` | `code_ville_profession` |
| `Tél bureau` | `tel_bureau` |
| `Tél domicile` | `tel_domicile` |
| `Proche` | `proche` |
| `Tél Proche` | `tel_proche` |
| `N° affiliation` | `n_affiliation` |
| `Statut` | `statut` |
| `Couverture sociale` | `couverture_sociale` |
| `Remarques` | `remarques` |
| `Remarques médicales importantes` | `remarques_medicales_importantes` |
| `Date 1ère consultation` | `date_1ere_consultation` |
| `NotesState` | `notesstate` |
| `Notes` | `notes` |
### `raw_t_fiche_administrative_sub_confier`

| Original Access column | SQLite column |
|---|---|
| `Compteur Médecins traitants` | `compteur_medecins_traitants` |
| `Compteur` | `compteur` |
| `Code médecin` | `code_medecin` |
| `Nom médecin` | `nom_medecin` |
| `Remarques` | `remarques` |
### `raw_t_fiche_administrative_sub_medecins`

| Original Access column | SQLite column |
|---|---|
| `Compteur Médecins traitants` | `compteur_medecins_traitants` |
| `Compteur` | `compteur` |
| `Code médecin` | `code_medecin` |
| `Nom médecin` | `nom_medecin` |
| `Remarques` | `remarques` |
### `raw_t_ges_comptes_comptables`

| Original Access column | SQLite column |
|---|---|
| `Compteur comptes comptables` | `compteur_comptes_comptables` |
| `N° compte` | `n_compte` |
| `Libellé compte` | `libelle_compte` |
### `raw_t_ges_constantes`

| Original Access column | SQLite column |
|---|---|
| `Compteur comptes comptables` | `compteur_comptes_comptables` |
| `Libellé constante` | `libelle_constante` |
| `Valeur constante` | `valeur_constante` |
### `raw_t_ges_echeancier`

| Original Access column | SQLite column |
|---|---|
| `Compteur échéancier` | `compteur_echeancier` |
| `Année échéancier` | `annee_echeancier` |
| `Mois échéancier` | `mois_echeancier` |
| `Jour échéancier` | `jour_echeancier` |
| `Description échéancier` | `description_echeancier` |
| `Montant échéancier` | `montant_echeancier` |
| `Flag règlement échéancier` | `flag_reglement_echeancier` |
| `Remarques échéancier` | `remarques_echeancier` |
### `raw_t_ges_echeancier_depenses`

| Original Access column | SQLite column |
|---|---|
| `Compteur échéancier` | `compteur_echeancier` |
| `Année échéancier` | `annee_echeancier` |
| `Mois échéancier` | `mois_echeancier` |
| `Jour échéancier` | `jour_echeancier` |
| `Description échéancier` | `description_echeancier` |
| `Montant échéancier` | `montant_echeancier` |
| `Flag règlement échéancier` | `flag_reglement_echeancier` |
| `Remarques échéancier` | `remarques_echeancier` |
### `raw_t_ges_mouvements_comptes`

| Original Access column | SQLite column |
|---|---|
| `Compteur mouvements comptes` | `compteur_mouvements_comptes` |
| `Année mouvement` | `annee_mouvement` |
| `Mois mouvement` | `mois_mouvement` |
| `N° pièce` | `n_piece` |
| `N° compte` | `n_compte` |
| `Libellé mouvement` | `libelle_mouvement` |
| `Montant débit` | `montant_debit` |
| `Montant crédit` | `montant_credit` |
### `raw_t_memento`

| Original Access column | SQLite column |
|---|---|
| `Compteur MEMENTO` | `compteur_memento` |
| `Titre mémento` | `titre_memento` |
| `Ordre Titre` | `ordre_titre` |
| `Texte mémento` | `texte_memento` |
### `raw_t_mv_delegues_medicaux`

| Original Access column | SQLite column |
|---|---|
| `Compteur délégué médical` | `compteur_delegue_medical` |
| `Nom délégué médical` | `nom_delegue_medical` |
| `Prénom délégué médical` | `prenom_delegue_medical` |
| `Tél Bur délégué médical` | `tel_bur_delegue_medical` |
| `Tél Dom délégué médical` | `tel_dom_delegue_medical` |
| `Fax délégué médical` | `fax_delegue_medical` |
| `Minitel délégué médical` | `minitel_delegue_medical` |
| `Adresse délégué médical  professionnelle` | `adresse_delegue_medical_professionnelle` |
| `Ville professionnelle` | `ville_professionnelle` |
| `Adresse délégué médical  domicile` | `adresse_delegue_medical_domicile` |
| `Ville domicile` | `ville_domicile` |
| `Autres indications` | `autres_indications` |
| `Laboratoire délégué médical` | `laboratoire_delegue_medical` |
| `Code laboratoire médicament` | `code_laboratoire_medicament` |
### `raw_t_mv_diagnostic`

| Original Access column | SQLite column |
|---|---|
| `Compteur Diagnostic` | `compteur_diagnostic` |
| `Code Diagnostic` | `code_diagnostic` |
| `Désignation Diagnostic` | `designation_diagnostic` |
| `Compteur Diagnostic Titre` | `compteur_diagnostic_titre` |
| `Ordre Diagnostic` | `ordre_diagnostic` |
| `Type Diagnostic` | `type_diagnostic` |
### `raw_t_mv_diagnostic_titre`

| Original Access column | SQLite column |
|---|---|
| `Compteur Diagnostic Titre` | `compteur_diagnostic_titre` |
| `Titre Diagnostic` | `titre_diagnostic` |
| `Ordre Titre` | `ordre_titre` |
### `raw_t_mv_famille_c_i_diagnostic`

| Original Access column | SQLite column |
|---|---|
| `Compteur FAMILLE C I Diagnostic` | `compteur_famille_c_i_diagnostic` |
| `Code famille médicament` | `code_famille_medicament` |
| `Code Diagnostic` | `code_diagnostic` |
| `Remarques` | `remarques` |
### `raw_t_mv_famille_c_i_tare`

| Original Access column | SQLite column |
|---|---|
| `Compteur FAMILLE C I Tare` | `compteur_famille_c_i_tare` |
| `Code famille médicament` | `code_famille_medicament` |
| `Code Tare` | `code_tare` |
| `Remarques` | `remarques` |
### `raw_t_mv_famille_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur Famille médicament` | `compteur_famille_medicament` |
| `Code famille médicament` | `code_famille_medicament` |
| `Famille médicament` | `famille_medicament` |
| `Niveau hiérarchie` | `niveau_hierarchie` |
### `raw_t_mv_famille_sous_famille_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur Sous famille médicament` | `compteur_sous_famille_medicament` |
| `Code principal famille médicament` | `code_principal_famille_medicament` |
| `Code sous famille médicament` | `code_sous_famille_medicament` |
### `raw_t_mv_fiche_allergie_famille`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Allergie famille` | `compteur_fiche_allergie_famille` |
| `Compteur` | `compteur` |
| `Code famille médicament` | `code_famille_medicament` |
| `Date début Allergie famille` | `date_debut_allergie_famille` |
| `Date fin Allergie famille` | `date_fin_allergie_famille` |
| `Remarque Allergie famille` | `remarque_allergie_famille` |
### `raw_t_mv_fiche_allergie_medicamenteuse`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Allergie médicamenteuse` | `compteur_fiche_allergie_medicamenteuse` |
| `Compteur` | `compteur` |
| `Code médicament` | `code_medicament` |
| `Date début Allergie médicamenteuse` | `date_debut_allergie_medicamenteuse` |
| `Date fin Allergie médicamenteuse` | `date_fin_allergie_medicamenteuse` |
| `Remarque Allergie médicamenteuse` | `remarque_allergie_medicamenteuse` |
### `raw_t_mv_fiche_diagnostic`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Diagnostic` | `compteur_fiche_diagnostic` |
| `Compteur` | `compteur` |
| `Code Diagnostic` | `code_diagnostic` |
| `Date début Diagnostic` | `date_debut_diagnostic` |
| `Date fin Diagnostic` | `date_fin_diagnostic` |
| `Remarque Diagnostic` | `remarque_diagnostic` |
### `raw_t_mv_fiche_intolerance_famille`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Intolérance famille` | `compteur_fiche_intolerance_famille` |
| `Compteur` | `compteur` |
| `Code famille médicament` | `code_famille_medicament` |
| `Date début Intolérance famille` | `date_debut_intolerance_famille` |
| `Date fin Intolérance famille` | `date_fin_intolerance_famille` |
| `Remarque Intolérance famille` | `remarque_intolerance_famille` |
### `raw_t_mv_fiche_intolerance_medicamenteuse`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Intolérance médicamenteuse` | `compteur_fiche_intolerance_medicamenteuse` |
| `Compteur` | `compteur` |
| `Code médicament` | `code_medicament` |
| `Date début Intolérance médicamenteuse` | `date_debut_intolerance_medicamenteuse` |
| `Date fin Intolérance médicamenteuse` | `date_fin_intolerance_medicamenteuse` |
| `Remarque Intolérance médicamenteuse` | `remarque_intolerance_medicamenteuse` |
### `raw_t_mv_fiche_medicaments_prescrits`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Médicaments prescrits` | `compteur_fiche_medicaments_prescrits` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Numéro ordonnance` | `numero_ordonnance` |
| `Code médicament` | `code_medicament` |
| `Date début Médicaments prescrits` | `date_debut_medicaments_prescrits` |
| `Date fin Médicaments prescrits` | `date_fin_medicaments_prescrits` |
| `Flag test interactions` | `flag_test_interactions` |
| `Zone 1 médicament ordonnance` | `zone_1_medicament_ordonnance` |
| `Zone 2 médicament ordonnance` | `zone_2_medicament_ordonnance` |
| `Zone 3 médicament ordonnance` | `zone_3_medicament_ordonnance` |
| `Zone 4 médicament ordonnance` | `zone_4_medicament_ordonnance` |
### `raw_t_mv_fiche_tare`

| Original Access column | SQLite column |
|---|---|
| `Compteur FICHE Tare` | `compteur_fiche_tare` |
| `Compteur` | `compteur` |
| `Code Tare` | `code_tare` |
| `Date début Tare` | `date_debut_tare` |
| `Date fin Tare` | `date_fin_tare` |
| `Remarque Tare` | `remarque_tare` |
### `raw_t_mv_interactions_familles_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur INTERACTIONS Familles médicaments` | `compteur_interactions_familles_medicaments` |
| `Code famille médicament A` | `code_famille_medicament_a` |
| `Code famille médicament B` | `code_famille_medicament_b` |
| `Type interaction` | `type_interaction` |
| `Précaution d'emploi` | `precaution_d_emploi` |
### `raw_t_mv_interactions_medicament_avec_famille`

| Original Access column | SQLite column |
|---|---|
| `Compteur INTERACTIONS Médicament avec Famille` | `compteur_interactions_medicament_avec_famille` |
| `Code médicament` | `code_medicament` |
| `Code famille médicament` | `code_famille_medicament` |
| `Type interaction` | `type_interaction` |
| `Précaution d'emploi` | `precaution_d_emploi` |
### `raw_t_mv_interactions_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur INTERACTIONS Médicaments` | `compteur_interactions_medicaments` |
| `Code médicament A` | `code_medicament_a` |
| `Code médicament B` | `code_medicament_b` |
| `Type interaction` | `type_interaction` |
| `Précaution d'emploi` | `precaution_d_emploi` |
### `raw_t_mv_laboratoires_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur laboratoire médicament` | `compteur_laboratoire_medicament` |
| `Code laboratoire médicament` | `code_laboratoire_medicament` |
| `Nom laboratoire médicament` | `nom_laboratoire_medicament` |
| `Adresse laboratoire médicament` | `adresse_laboratoire_medicament` |
| `Tél laboratoire médicament` | `tel_laboratoire_medicament` |
| `Fax laboratoire médicament` | `fax_laboratoire_medicament` |
| `Minitel laboratoire médicament` | `minitel_laboratoire_medicament` |
| `Autres indications` | `autres_indications` |
### `raw_t_mv_medicament_c_i_diagnostic`

| Original Access column | SQLite column |
|---|---|
| `Compteur MEDICAMENT C I Diagnostic` | `compteur_medicament_c_i_diagnostic` |
| `Code médicament` | `code_medicament` |
| `Code Diagnostic` | `code_diagnostic` |
| `Remarques` | `remarques` |
### `raw_t_mv_medicament_c_i_tare`

| Original Access column | SQLite column |
|---|---|
| `Compteur MEDICAMENT C I Tare` | `compteur_medicament_c_i_tare` |
| `Code médicament` | `code_medicament` |
| `Code Tare` | `code_tare` |
| `Remarques` | `remarques` |
### `raw_t_mv_medicament_forme_posologie`

| Original Access column | SQLite column |
|---|---|
| `Compteur MEDICAMENT FORME POSOLOGIE` | `compteur_medicament_forme_posologie` |
| `Code médicament` | `code_medicament` |
| `Forme et présentations` | `forme_et_presentations` |
| `Mode d'emploi et posologie` | `mode_d_emploi_et_posologie` |
| `Flag existe` | `flag_existe` |
### `raw_t_mv_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur médicament` | `compteur_medicament` |
| `Code médicament` | `code_medicament` |
| `Nom commercial médicament` | `nom_commercial_medicament` |
| `Code laboratoire médicament` | `code_laboratoire_medicament` |
| `Forme et présentations médicament` | `forme_et_presentations_medicament` |
| `Composition médicament` | `composition_medicament` |
| `Mode d'emploi et posologie médicament` | `mode_d_emploi_et_posologie_medicament` |
| `Effets indésirables médicament` | `effets_indesirables_medicament` |
| `Propriétés médicament` | `proprietes_medicament` |
| `Sort du médicament` | `sort_du_medicament` |
| `Indications médicament` | `indications_medicament` |
| `Contre indications médicament` | `contre_indications_medicament` |
| `Précautions d'emploi médicament` | `precautions_d_emploi_medicament` |
| `Interactions médicamenteuses` | `interactions_medicamenteuses` |
| `Durée de stabilité médicament` | `duree_de_stabilite_medicament` |
| `Conservation médicament` | `conservation_medicament` |
| `Surdosage médicament` | `surdosage_medicament` |
| `Tableau médicament` | `tableau_medicament` |
| `Prix médicament` | `prix_medicament` |
| `Remarques médicament` | `remarques_medicament` |
| `Liste` | `liste` |
| `Flag existe` | `flag_existe` |
### `raw_t_mv_medicaments_delegues_medicaux`

| Original Access column | SQLite column |
|---|---|
| `Compteur médicaments délégué médical` | `compteur_medicaments_delegue_medical` |
| `Compteur délégué médical` | `compteur_delegue_medical` |
| `Code médicament` | `code_medicament` |
### `raw_t_mv_medicaments_familles`

| Original Access column | SQLite column |
|---|---|
| `Compteur MEDICAMENTS FAMILLES` | `compteur_medicaments_familles` |
| `Code médicament` | `code_medicament` |
| `Code famille médicament` | `code_famille_medicament` |
| `Code sous famille médicament` | `code_sous_famille_medicament` |
| `Code sous sous famille médicament` | `code_sous_sous_famille_medicament` |
### `raw_t_mv_medicaments_noms_chimiques`

| Original Access column | SQLite column |
|---|---|
| `Compteur MEDICAMENTS NOMS CHIMIQUES` | `compteur_medicaments_noms_chimiques` |
| `Code médicament` | `code_medicament` |
| `Code nom chimique` | `code_nom_chimique` |
### `raw_t_mv_noms_chimiques`

| Original Access column | SQLite column |
|---|---|
| `Compteur NOMS CHIMIQUES` | `compteur_noms_chimiques` |
| `Code nom chimique` | `code_nom_chimique` |
| `Nom chimique` | `nom_chimique` |
### `raw_t_mv_ordonnance`

| Original Access column | SQLite column |
|---|---|
| `Compteur ORDONNANCE` | `compteur_ordonnance` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Numéro ordonnance` | `numero_ordonnance` |
| `Date ordonnance` | `date_ordonnance` |
| `Heure ordonnance` | `heure_ordonnance` |
| `Flag date de naissance` | `flag_date_de_naissance` |
| `Flag adresse` | `flag_adresse` |
| `Flag entête` | `flag_entete` |
| `Zone Nom Prénom` | `zone_nom_prenom` |
| `Flag test médicament` | `flag_test_medicament` |
| `Flag test allergie` | `flag_test_allergie` |
| `Flag test intolérance` | `flag_test_intolerance` |
| `Flag test diagnostic` | `flag_test_diagnostic` |
| `Flag test tare` | `flag_test_tare` |
| `Flag nom prénom` | `flag_nom_prenom` |
| `Prochain contrôle` | `prochain_controle` |
| `Nombre durée` | `nombre_duree` |
| `Type durée` | `type_duree` |
| `Nombre renouvellement` | `nombre_renouvellement` |
| `Poids` | `poids` |
### `raw_t_mv_remarques_delegues_medicaux`

| Original Access column | SQLite column |
|---|---|
| `Compteur remarques délégué médical` | `compteur_remarques_delegue_medical` |
| `Compteur délégué médical` | `compteur_delegue_medical` |
| `Dates remarques délégué médical` | `dates_remarques_delegue_medical` |
| `Remarques délégué médical` | `remarques_delegue_medical` |
### `raw_t_mv_table_des_fonctions`

| Original Access column | SQLite column |
|---|---|
| `Nom fonction` | `nom_fonction` |
| `Nom menu` | `nom_menu` |
| `Compteur` | `compteur` |
### `raw_t_mv_tare`

| Original Access column | SQLite column |
|---|---|
| `Compteur Tare` | `compteur_tare` |
| `Code Tare` | `code_tare` |
| `Désignation Tare` | `designation_tare` |
| `Compteur Tare Titre` | `compteur_tare_titre` |
| `Ordre Tare` | `ordre_tare` |
| `Type Tare` | `type_tare` |
### `raw_t_mv_tare_titre`

| Original Access column | SQLite column |
|---|---|
| `Compteur Tare Titre` | `compteur_tare_titre` |
| `Titre Tare` | `titre_tare` |
| `Ordre Titre` | `ordre_titre` |
### `raw_t_patient_fiche_des_notes`

| Original Access column | SQLite column |
|---|---|
| `Compteur` | `compteur` |
| `Notes` | `notes` |
### `raw_t_pers_nom_etat`

| Original Access column | SQLite column |
|---|---|
| `Nom état` | `nom_etat` |
### `raw_t_pers_table`

| Original Access column | SQLite column |
|---|---|
| `Code personnalisation` | `code_personnalisation` |
| `Type personnalisation` | `type_personnalisation` |
| `Flag impression` | `flag_impression` |
| `Nom état` | `nom_etat` |
| `Flag résumé` | `flag_resume` |
### `raw_t_personnalisation_contenu`

| Original Access column | SQLite column |
|---|---|
| `Compteur PERSONNALISATION Contenu` | `compteur_personnalisation_contenu` |
| `Compteur PERSONNALISATION` | `compteur_personnalisation` |
| `Elément PERSONNALISATION` | `element_personnalisation` |
| `Ordre PERSONNALISATION` | `ordre_personnalisation` |
| `Type PERSONNALISATION` | `type_personnalisation` |
### `raw_t_personnalisation_titre`

| Original Access column | SQLite column |
|---|---|
| `Compteur PERSONNALISATION` | `compteur_personnalisation` |
| `Titre PERSONNALISATION` | `titre_personnalisation` |
| `Ordre Titre` | `ordre_titre` |
### `raw_t_rapo_liste_rapport`

| Original Access column | SQLite column |
|---|---|
| `Compteur LISTE RAPPORT` | `compteur_liste_rapport` |
| `Titre liste rapport` | `titre_liste_rapport` |
| `Ordre Titre` | `ordre_titre` |
| `Zone liste rapport` | `zone_liste_rapport` |
| `Flag liste entête` | `flag_liste_entete` |
| `Flag liste titre` | `flag_liste_titre` |
| `Nom liste état` | `nom_liste_etat` |
### `raw_t_rapo_rapport`

| Original Access column | SQLite column |
|---|---|
| `Compteur RAPPORT` | `compteur_rapport` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Numéro rapport` | `numero_rapport` |
| `Date rapport` | `date_rapport` |
| `Heure rapport` | `heure_rapport` |
| `Flag entête` | `flag_entete` |
| `Flag titre` | `flag_titre` |
| `Titre rapport` | `titre_rapport` |
| `Zone rapport` | `zone_rapport` |
| `Titre thème` | `titre_theme` |
| `Nom état` | `nom_etat` |
| `Flag liaison` | `flag_liaison` |
| `Zone liaison` | `zone_liaison` |
### `raw_t_rapo_table_des_fonctions`

| Original Access column | SQLite column |
|---|---|
| `Compteur fonction` | `compteur_fonction` |
| `Syntaxe fonction` | `syntaxe_fonction` |
| `code` | `code` |
| `Ordre` | `ordre` |
| `Origine` | `origine` |
### `raw_t_rdv_fiche_des_notes`

| Original Access column | SQLite column |
|---|---|
| `Jour` | `jour` |
| `Notes` | `notes` |
### `raw_t_rdv_jours_conges`

| Original Access column | SQLite column |
|---|---|
| `Jour congé` | `jour_conge` |
| `Désignation congé` | `designation_conge` |
### `raw_t_rdv_personnalisation`

| Original Access column | SQLite column |
|---|---|
| `Compteur RDV PERSONNALISATION` | `compteur_rdv_personnalisation` |
| `Libellé jour` | `libelle_jour` |
| `Numéro jour` | `numero_jour` |
| `Horaire début RDV` | `horaire_debut_rdv` |
| `Nombre de RDV` | `nombre_de_rdv` |
| `Intervalle minute` | `intervalle_minute` |
| `Mois début` | `mois_debut` |
| `Mois fin` | `mois_fin` |
| `Date début limite` | `date_debut_limite` |
| `Date fin limite` | `date_fin_limite` |
### `raw_t_rdv_rendez_vous`

| Original Access column | SQLite column |
|---|---|
| `Jour rendez vous` | `jour_rendez_vous` |
| `Heure rendez vous` | `heure_rendez_vous` |
| `Compteur` | `compteur` |
| `Flag confirmation` | `flag_confirmation` |
| `Date affectation` | `date_affectation` |
| `Flag RDV` | `flag_rdv` |
| `NomPrénom` | `nomprenom` |
| `N° dossier` | `n_dossier` |
| `Remarques` | `remarques` |
| `Flag paiement` | `flag_paiement` |
| `Flag remarques` | `flag_remarques` |
### `raw_t_rdv_table_des_fiches`

| Original Access column | SQLite column |
|---|---|
| `Nom fonction` | `nom_fonction` |
| `Compteur` | `compteur` |
### `raw_t_stk_medicaments`

| Original Access column | SQLite column |
|---|---|
| `Compteur STK MEDICAMENTS` | `compteur_stk_medicaments` |
| `Code médicament` | `code_medicament` |
| `Forme et présentations` | `forme_et_presentations` |
### `raw_t_stk_medicaments_sub_d`

| Original Access column | SQLite column |
|---|---|
| `Compteur STK MEDICAMENTS SUB D` | `compteur_stk_medicaments_sub_d` |
| `Compteur STK MEDICAMENTS SUB R` | `compteur_stk_medicaments_sub_r` |
| `Compteur STK MEDICAMENTS` | `compteur_stk_medicaments` |
| `Code médicament` | `code_medicament` |
| `Quantité` | `quantite` |
| `Date livraison` | `date_livraison` |
| `Remarques` | `remarques` |
### `raw_t_stk_medicaments_sub_r`

| Original Access column | SQLite column |
|---|---|
| `Compteur STK MEDICAMENTS SUB R` | `compteur_stk_medicaments_sub_r` |
| `Compteur STK MEDICAMENTS` | `compteur_stk_medicaments` |
| `Code médicament` | `code_medicament` |
| `Quantité` | `quantite` |
| `Date réception` | `date_reception` |
| `Date limite` | `date_limite` |
| `Remarques` | `remarques` |
### `raw_t_trace`

| Original Access column | SQLite column |
|---|---|
| `Compteur TRACE` | `compteur_trace` |
| `Compteur` | `compteur` |
| `Date TRACE` | `date_trace` |
### `raw_t_w_parametres_consultation`

| Original Access column | SQLite column |
|---|---|
| `Compteur paramètres consultation` | `compteur_parametres_consultation` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Date paramètres consultation` | `date_parametres_consultation` |
| `Heure paramètres consultation` | `heure_parametres_consultation` |
| `Recul` | `recul` |
| `Température` | `temperature` |
| `Pouls` | `pouls` |
| `Fréquence respiratoire` | `frequence_respiratoire` |
| `TA couché` | `ta_couche` |
| `TA debout` | `ta_debout` |
| `Poids` | `poids` |
| `Taille` | `taille` |
### `raw_t_w_parametres_courrier`

| Original Access column | SQLite column |
|---|---|
| `Compteur paramètres courrier` | `compteur_parametres_courrier` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Date paramètres courrier` | `date_parametres_courrier` |
| `Heure paramètres courrier` | `heure_parametres_courrier` |
| `Accompagnant` | `accompagnant` |
| `Date début Accompagnant` | `date_debut_accompagnant` |
| `Date fin Accompagnant` | `date_fin_accompagnant` |
| `Type incapacité` | `type_incapacite` |
| `Nombre jours incapacité` | `nombre_jours_incapacite` |
| `Date début incapacité` | `date_debut_incapacite` |
| `Date fin incapacité` | `date_fin_incapacite` |
| `Cause incapacité` | `cause_incapacite` |
| `Sortie autorisée interdite` | `sortie_autorisee_interdite` |
| `Confier à Code médecin` | `confier_a_code_medecin` |
| `Confier à Nom médecin` | `confier_a_nom_medecin` |
| `Confier à Remarques` | `confier_a_remarques` |
### `raw_t_w_pers_type_table`

| Original Access column | SQLite column |
|---|---|
| `Compteur fiche` | `compteur_fiche` |
| `Compteur` | `compteur` |
| `Numéro dossier médical` | `numero_dossier_medical` |
| `Numéro consultation` | `numero_consultation` |
| `Numéro fiche` | `numero_fiche` |
| `Date fiche` | `date_fiche` |
| `Heure fiche` | `heure_fiche` |
### `raw_table_nomforms`

| Original Access column | SQLite column |
|---|---|
| `Compteur TABLE NOMFORMS` | `compteur_table_nomforms` |
| `NOMFORMS` | `nomforms` |
| `NOMFORMS II` | `nomforms_ii` |
| `NOMFORMS III` | `nomforms_iii` |
### `raw_table_nomtables`

| Original Access column | SQLite column |
|---|---|
| `Compteur TABLE NOMTABLES` | `compteur_table_nomtables` |
| `NOMTABLES` | `nomtables` |
| `NOMTABLES II` | `nomtables_ii` |
| `NOMTABLES III` | `nomtables_iii` |
### `raw_table_nomtables_attach`

| Original Access column | SQLite column |
|---|---|
| `Compteur TABLE NOMTABLES` | `compteur_table_nomtables` |
| `NOMTABLES` | `nomtables` |
| `NOMTABLES II` | `nomtables_ii` |
| `NOMTABLES III` | `nomtables_iii` |
### `raw_tc_liste_attach`

| Original Access column | SQLite column |
|---|---|
| `Compteur LISTE ATTACH` | `compteur_liste_attach` |
| `NOMTABLES` | `nomtables` |
| `NOMTABLES II` | `nomtables_ii` |
| `NOMTABLES III` | `nomtables_iii` |
### `raw_tc_repertoire`

| Original Access column | SQLite column |
|---|---|
| `Compteur LISTE ATTACH REPERTOIRE` | `compteur_liste_attach_repertoire` |
| `Nom drive` | `nom_drive` |
| `Nom répertoire` | `nom_repertoire` |
| `Répertoire programme` | `repertoire_programme` |
| `Répertoire donnée` | `repertoire_donnee` |
| `Nom base` | `nom_base` |
| `Notes` | `notes` |
### `raw_tc_table_stable`

| Original Access column | SQLite column |
|---|---|
| `NOMTABLES` | `nomtables` |
| `NOMTABLES II` | `nomtables_ii` |
### `raw_tc_table_variable`

| Original Access column | SQLite column |
|---|---|
| `N°` | `n` |
| `VARIABLE` | `variable` |
| `VARIABLE II` | `variable_ii` |
| `VARIABLE III` | `variable_iii` |
| `TYPE VARIABLE` | `type_variable` |
### `raw_tc_table_variable1`

| Original Access column | SQLite column |
|---|---|
| `N°` | `n` |
| `VARIABLE` | `variable` |
| `VARIABLE II` | `variable_ii` |
| `VARIABLE III` | `variable_iii` |
| `TYPE VARIABLE` | `type_variable` |