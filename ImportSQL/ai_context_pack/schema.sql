CREATE TABLE import_columns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sqlite_table_name TEXT NOT NULL,
          column_position INTEGER NOT NULL,
          original_column_name TEXT NOT NULL,
          sqlite_column_name TEXT NOT NULL
        );

CREATE TABLE import_issues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT,
          source_file TEXT,
          line_number INTEGER,
          record_key TEXT,
          column_name TEXT,
          raw_value TEXT,
          issue TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE import_tables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_file TEXT NOT NULL,
          original_table_name TEXT NOT NULL,
          sqlite_table_name TEXT NOT NULL,
          rows_imported INTEGER NOT NULL DEFAULT 0,
          rows_skipped INTEGER NOT NULL DEFAULT 0,
          encoding TEXT,
          imported_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE "raw_t_actes_categorie_des_actes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_categorie_acte" TEXT, "nom_categorie_acte" TEXT
        );

CREATE TABLE "raw_t_actes_et_honoraires" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_actes_et_honoraires" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "numero_acte" TEXT, "date_actes_et_honoraires" TEXT, "heure_actes_et_honoraires" TEXT, "total_actes" TEXT, "total_fournitures" TEXT, "montant_en_especes" TEXT, "montant_par_cheque" TEXT, "couverture_sociale" TEXT, "code_banque" TEXT, "n_cheque" TEXT
        );

CREATE TABLE "raw_t_actes_et_honoraires_sub" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_actes_et_honoraires_sub" TEXT, "compteur_actes_et_honoraires" TEXT, "nom_categorie_acte" TEXT, "nom_acte" TEXT, "code_acte" TEXT, "montant_acte" TEXT
        );

CREATE TABLE "raw_t_actes_liste_des_actes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_categorie_acte" TEXT, "nom_acte" TEXT, "code_acte" TEXT, "montant_acte" TEXT
        );

CREATE TABLE "raw_t_aide_table_des_fonctions" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_fonction" TEXT, "nom_menu" TEXT, "compteur" TEXT
        );

CREATE TABLE "raw_t_an_biologistes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_biologiste" TEXT, "code_biologiste" TEXT, "nom_biologiste" TEXT, "prenom_biologiste" TEXT, "specialite_biologiste" TEXT, "tel_bur_biologiste" TEXT, "tel_dom_biologiste" TEXT, "fax_biologiste" TEXT, "minitel_biologiste" TEXT, "adresse_biologiste_professionnelle" TEXT, "ville_professionnelle" TEXT, "code_ville_professionnelle" TEXT, "adresse_biologiste_domicile" TEXT, "ville_domicile" TEXT, "code_ville_domicile" TEXT, "autres_indications" TEXT, "flag_appartenance" TEXT
        );

CREATE TABLE "raw_t_an_cliniques" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_clinique" TEXT, "nom_clinique" TEXT, "service_clinique" TEXT, "nom_responsable" TEXT, "tel_bur_clinique" TEXT, "fax_clinique" TEXT, "minitel_clinique" TEXT, "adresse_clinique" TEXT, "ville" TEXT, "code_ville" TEXT, "autres_indications" TEXT
        );

CREATE TABLE "raw_t_an_dentistes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_dentiste" TEXT, "nom_dentiste" TEXT, "prenom_dentiste" TEXT, "tel_bur_dentiste" TEXT, "tel_dom_dentiste" TEXT, "fax_dentiste" TEXT, "minitel_dentiste" TEXT, "adresse_dentiste_professionnelle" TEXT, "ville_professionnelle" TEXT, "code_ville_professionnelle" TEXT, "adresse_dentiste_domicile" TEXT, "ville_domicile" TEXT, "code_ville_domicile" TEXT, "autres_indications" TEXT, "flag_libre_pratique" TEXT, "gouvernorat" TEXT, "lieu_exercice" TEXT, "nom_travail" TEXT
        );

CREATE TABLE "raw_t_an_entreprises" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_entreprise" TEXT, "nom_entreprise" TEXT, "tel_bur_entreprise" TEXT, "fax_entreprise" TEXT, "minitel_entreprise" TEXT, "adresse_entreprise" TEXT, "ville" TEXT, "code_ville" TEXT, "autres_indications" TEXT, "fonction_entreprise" TEXT, "secteur_entreprise" TEXT, "nom_responsable" TEXT, "libelle_correspondance" TEXT
        );

CREATE TABLE "raw_t_an_medecins" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medecin" TEXT, "code_medecin" TEXT, "nom_medecin" TEXT, "prenom_medecin" TEXT, "specialite_medecin" TEXT, "tel_bur_medecin" TEXT, "tel_dom_medecin" TEXT, "fax_medecin" TEXT, "minitel_medecin" TEXT, "adresse_medecin_professionnelle" TEXT, "ville_professionnelle_medecin" TEXT, "code_ville_professionnelle_medecin" TEXT, "adresse_medecin_domicile" TEXT, "ville_domicile_medecin" TEXT, "code_ville_domicile_medecin" TEXT, "autres_indications" TEXT, "flag_appartenance" TEXT, "flag_libre_pratique" TEXT, "gouvernorat" TEXT, "service" TEXT, "travail" TEXT
        );

CREATE TABLE "raw_t_an_paramedicaux" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_paramedical" TEXT, "code_infirmier" TEXT, "nom_paramedical" TEXT, "prenom_paramedical" TEXT, "tel_bur_paramedical" TEXT, "tel_dom_paramedical" TEXT, "fax_paramedical" TEXT, "minitel_paramedical" TEXT, "adresse_paramedical_professionnelle" TEXT, "ville_professionnelle" TEXT, "code_ville_professionnelle" TEXT, "adresse_paramedical_domicile" TEXT, "ville_domicile" TEXT, "code_ville_domicile" TEXT, "autres_indications" TEXT, "fonction_paramedical" TEXT, "flag_appartenance" TEXT
        );

CREATE TABLE "raw_t_an_personnelle" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_personnelle" TEXT, "nom_personnelle" TEXT, "prenom_personnelle" TEXT, "tel_bur_personnelle" TEXT, "tel_dom_personnelle" TEXT, "fax_personnelle" TEXT, "minitel_personnelle" TEXT, "adresse_personnelle_professionnelle" TEXT, "ville_professionnelle" TEXT, "code_ville_professionnelle" TEXT, "adresse_personnelle_domicile" TEXT, "ville_domicile" TEXT, "code_ville_domicile" TEXT, "autres_indications" TEXT
        );

CREATE TABLE "raw_t_an_pharmaciens" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_pharmacien" TEXT, "nom_pharmacien" TEXT, "prenom_pharmacien" TEXT, "tel_bur_pharmacien" TEXT, "tel_dom_pharmacien" TEXT, "fax_pharmacien" TEXT, "minitel_pharmacien" TEXT, "adresse_pharmacien_professionnelle" TEXT, "ville_professionnelle" TEXT, "code_ville_professionnelle" TEXT, "adresse_pharmacien_domicile" TEXT, "ville_domicile" TEXT, "code_ville_domicile" TEXT, "autres_indications" TEXT, "flag_libre_pratique" TEXT, "gouvernorat" TEXT, "lieu_exercice" TEXT, "nom_travail" TEXT
        );

CREATE TABLE "raw_t_an_table_des_fonctions" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_fonction" TEXT, "nom_menu" TEXT, "compteur" TEXT
        );

CREATE TABLE "raw_t_an_telephones" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_telephone" TEXT, "nom_telephone" TEXT, "tel_bur_telephone" TEXT, "tel_dom_telephone" TEXT, "fax_telephone" TEXT, "minitel_telephone" TEXT, "adresse_telephone" TEXT, "ville" TEXT, "code_ville" TEXT, "autres_indications" TEXT
        );

CREATE TABLE "raw_t_assurance" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_assurance" TEXT, "adresse_assurance" TEXT, "ville_assurance" TEXT, "code_ville_assurance" TEXT, "tel_assurance" TEXT
        );

CREATE TABLE "raw_t_banque" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "code_banque" TEXT, "nom_banque" TEXT, "adresse_banque" TEXT, "tel_banque" TEXT
        );

CREATE TABLE "raw_t_bib_auteur" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_auteur" TEXT, "nom_auteur" TEXT
        );

CREATE TABLE "raw_t_bib_bibliographie" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_bibliographie" TEXT, "titre_bibliographie" TEXT, "compteur_revue" TEXT, "annee_revue" TEXT, "mois_revue" TEXT, "numero_revue" TEXT, "page_debut_revue" TEXT, "page_fin_revue" TEXT, "type" TEXT, "localisation" TEXT, "reference_bibliographie" TEXT, "editeur_bibliographie" TEXT, "flag_1_bibliographie" TEXT, "flag_2_bibliographie" TEXT, "flag_3_bibliographie" TEXT, "resume_bibliographie" TEXT, "code_m1" TEXT, "code_m2" TEXT, "code_p" TEXT, "code_t" TEXT, "precision_1" TEXT, "precision_2" TEXT, "precision_3" TEXT
        );

CREATE TABLE "raw_t_bib_bibliographie_auteur" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_auteur" TEXT, "nom_auteur" TEXT, "compteur_bibliographie" TEXT
        );

CREATE TABLE "raw_t_bib_bibliographie_mot_cle" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_mot_cle" TEXT, "texte_mot_cle" TEXT, "compteur_bibliographie" TEXT
        );

CREATE TABLE "raw_t_bib_bibliographie_revue" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_revue" TEXT, "nom_revue" TEXT, "compteur_bibliographie" TEXT
        );

CREATE TABLE "raw_t_bib_code_medical_m1" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "code_m1" TEXT, "designation_m1" TEXT
        );

CREATE TABLE "raw_t_bib_code_medical_m2" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "code_m1" TEXT, "code_m2" TEXT, "designation_m2" TEXT
        );

CREATE TABLE "raw_t_bib_code_medical_p" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "code_p" TEXT, "designation_p" TEXT
        );

CREATE TABLE "raw_t_bib_code_medical_t" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "code_t" TEXT, "designation_t" TEXT
        );

CREATE TABLE "raw_t_bib_mot_cle" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_mot_cle" TEXT, "texte_mot_cle" TEXT
        );

CREATE TABLE "raw_t_bib_revue" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_revue" TEXT, "nom_revue" TEXT
        );

CREATE TABLE "raw_t_bib_table_des_fonctions" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_fonction" TEXT, "nom_menu" TEXT, "compteur" TEXT
        );

CREATE TABLE "raw_t_constante_par_defaut" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "type_constante_defaut" TEXT, "libelle_constante_defaut" TEXT, "valeur_constante_defaut" TEXT
        );

CREATE TABLE "raw_t_consultations" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_consultation" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "date_consultation" TEXT, "heure_consultation" TEXT, "enregistrement_son" TEXT, "remarques_consultations" TEXT, "flag_remarques_consultations" TEXT
        );

CREATE TABLE "raw_t_consultations_themes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_consultation_themes" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "titre_theme" TEXT, "ordre_titre" TEXT, "date_theme" TEXT, "heure_theme" TEXT, "contenu_theme" TEXT, "flag_examen" TEXT
        );

CREATE TABLE "raw_t_consultations_titre_themes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "titre_theme" TEXT, "ordre_titre" TEXT, "fiche_appelee" TEXT, "flag_courrier" TEXT, "flag_examen" TEXT, "type_examen" TEXT, "rapport_modele" TEXT
        );

CREATE TABLE "raw_t_dos_table_des_fonctions" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_fonction" TEXT, "nom_menu" TEXT, "compteur" TEXT
        );

CREATE TABLE "raw_t_dossier_medical" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_dossier_medical" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "date_dossier_medical" TEXT, "heure_dossier_medical" TEXT, "code_dossier_medical" TEXT, "titre_dossier_medical" TEXT, "remarques_dossier_medical" TEXT, "statut" TEXT, "couverture_sociale" TEXT, "date_accident" TEXT, "heure_accident" TEXT
        );

CREATE TABLE "raw_t_examens" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_examens" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "numero_examens" TEXT, "date_examens" TEXT, "heure_examens" TEXT, "titre_examens" TEXT, "conclusion_examens" TEXT, "fait_par" TEXT, "type_examen" TEXT
        );

CREATE TABLE "raw_t_examens_sub" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_examens_sub" TEXT, "compteur_examens" TEXT, "nom_element" TEXT, "donnee_element" TEXT, "remarques" TEXT, "image_radio" TEXT, "resume_radio" TEXT
        );

CREATE TABLE "raw_t_fiche_administrative" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur" TEXT, "nom" TEXT, "nom_jeune_fille" TEXT, "prenom" TEXT, "n_dossier" TEXT, "matricule" TEXT, "date_de_naissance" TEXT, "lieu_de_naissance" TEXT, "sexe" TEXT, "situation_de_famille" TEXT, "mr_mme_melle_enfant" TEXT, "adresse" TEXT, "ville" TEXT, "code_ville" TEXT, "gouvernorat_ou_pays" TEXT, "origine" TEXT, "profession" TEXT, "employeur" TEXT, "activite_employeur" TEXT, "adresse_profession" TEXT, "ville_profession" TEXT, "code_ville_profession" TEXT, "tel_bureau" TEXT, "tel_domicile" TEXT, "proche" TEXT, "tel_proche" TEXT, "n_affiliation" TEXT, "statut" TEXT, "couverture_sociale" TEXT, "remarques" TEXT, "remarques_medicales_importantes" TEXT, "date_1ere_consultation" TEXT, "notesstate" TEXT, "notes" TEXT
        );

CREATE TABLE "raw_t_fiche_administrative_sub_confier" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medecins_traitants" TEXT, "compteur" TEXT, "code_medecin" TEXT, "nom_medecin" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_fiche_administrative_sub_medecins" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medecins_traitants" TEXT, "compteur" TEXT, "code_medecin" TEXT, "nom_medecin" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_ges_comptes_comptables" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_comptes_comptables" TEXT, "n_compte" TEXT, "libelle_compte" TEXT
        );

CREATE TABLE "raw_t_ges_constantes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_comptes_comptables" TEXT, "libelle_constante" TEXT, "valeur_constante" TEXT
        );

CREATE TABLE "raw_t_ges_echeancier" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_echeancier" TEXT, "annee_echeancier" TEXT, "mois_echeancier" TEXT, "jour_echeancier" TEXT, "description_echeancier" TEXT, "montant_echeancier" TEXT, "flag_reglement_echeancier" TEXT, "remarques_echeancier" TEXT
        );

CREATE TABLE "raw_t_ges_echeancier_depenses" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_echeancier" TEXT, "annee_echeancier" TEXT, "mois_echeancier" TEXT, "jour_echeancier" TEXT, "description_echeancier" TEXT, "montant_echeancier" TEXT, "flag_reglement_echeancier" TEXT, "remarques_echeancier" TEXT
        );

CREATE TABLE "raw_t_ges_mouvements_comptes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_mouvements_comptes" TEXT, "annee_mouvement" TEXT, "mois_mouvement" TEXT, "n_piece" TEXT, "n_compte" TEXT, "libelle_mouvement" TEXT, "montant_debit" TEXT, "montant_credit" TEXT
        );

CREATE TABLE "raw_t_memento" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_memento" TEXT, "titre_memento" TEXT, "ordre_titre" TEXT, "texte_memento" TEXT
        );

CREATE TABLE "raw_t_mv_delegues_medicaux" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_delegue_medical" TEXT, "nom_delegue_medical" TEXT, "prenom_delegue_medical" TEXT, "tel_bur_delegue_medical" TEXT, "tel_dom_delegue_medical" TEXT, "fax_delegue_medical" TEXT, "minitel_delegue_medical" TEXT, "adresse_delegue_medical_professionnelle" TEXT, "ville_professionnelle" TEXT, "adresse_delegue_medical_domicile" TEXT, "ville_domicile" TEXT, "autres_indications" TEXT, "laboratoire_delegue_medical" TEXT, "code_laboratoire_medicament" TEXT
        );

CREATE TABLE "raw_t_mv_diagnostic" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_diagnostic" TEXT, "code_diagnostic" TEXT, "designation_diagnostic" TEXT, "compteur_diagnostic_titre" TEXT, "ordre_diagnostic" TEXT, "type_diagnostic" TEXT
        );

CREATE TABLE "raw_t_mv_diagnostic_titre" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_diagnostic_titre" TEXT, "titre_diagnostic" TEXT, "ordre_titre" TEXT
        );

CREATE TABLE "raw_t_mv_famille_c_i_diagnostic" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_famille_c_i_diagnostic" TEXT, "code_famille_medicament" TEXT, "code_diagnostic" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_mv_famille_c_i_tare" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_famille_c_i_tare" TEXT, "code_famille_medicament" TEXT, "code_tare" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_mv_famille_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_famille_medicament" TEXT, "code_famille_medicament" TEXT, "famille_medicament" TEXT, "niveau_hierarchie" TEXT
        );

CREATE TABLE "raw_t_mv_famille_sous_famille_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_sous_famille_medicament" TEXT, "code_principal_famille_medicament" TEXT, "code_sous_famille_medicament" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_allergie_famille" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_allergie_famille" TEXT, "compteur" TEXT, "code_famille_medicament" TEXT, "date_debut_allergie_famille" TEXT, "date_fin_allergie_famille" TEXT, "remarque_allergie_famille" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_allergie_medicamenteuse" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_allergie_medicamenteuse" TEXT, "compteur" TEXT, "code_medicament" TEXT, "date_debut_allergie_medicamenteuse" TEXT, "date_fin_allergie_medicamenteuse" TEXT, "remarque_allergie_medicamenteuse" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_diagnostic" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_diagnostic" TEXT, "compteur" TEXT, "code_diagnostic" TEXT, "date_debut_diagnostic" TEXT, "date_fin_diagnostic" TEXT, "remarque_diagnostic" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_intolerance_famille" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_intolerance_famille" TEXT, "compteur" TEXT, "code_famille_medicament" TEXT, "date_debut_intolerance_famille" TEXT, "date_fin_intolerance_famille" TEXT, "remarque_intolerance_famille" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_intolerance_medicamenteuse" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_intolerance_medicamenteuse" TEXT, "compteur" TEXT, "code_medicament" TEXT, "date_debut_intolerance_medicamenteuse" TEXT, "date_fin_intolerance_medicamenteuse" TEXT, "remarque_intolerance_medicamenteuse" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_medicaments_prescrits" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_medicaments_prescrits" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "numero_ordonnance" TEXT, "code_medicament" TEXT, "date_debut_medicaments_prescrits" TEXT, "date_fin_medicaments_prescrits" TEXT, "flag_test_interactions" TEXT, "zone_1_medicament_ordonnance" TEXT, "zone_2_medicament_ordonnance" TEXT, "zone_3_medicament_ordonnance" TEXT, "zone_4_medicament_ordonnance" TEXT
        );

CREATE TABLE "raw_t_mv_fiche_tare" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche_tare" TEXT, "compteur" TEXT, "code_tare" TEXT, "date_debut_tare" TEXT, "date_fin_tare" TEXT, "remarque_tare" TEXT
        );

CREATE TABLE "raw_t_mv_interactions_familles_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_interactions_familles_medicaments" TEXT, "code_famille_medicament_a" TEXT, "code_famille_medicament_b" TEXT, "type_interaction" TEXT, "precaution_d_emploi" TEXT
        );

CREATE TABLE "raw_t_mv_interactions_medicament_avec_famille" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_interactions_medicament_avec_famille" TEXT, "code_medicament" TEXT, "code_famille_medicament" TEXT, "type_interaction" TEXT, "precaution_d_emploi" TEXT
        );

CREATE TABLE "raw_t_mv_interactions_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_interactions_medicaments" TEXT, "code_medicament_a" TEXT, "code_medicament_b" TEXT, "type_interaction" TEXT, "precaution_d_emploi" TEXT
        );

CREATE TABLE "raw_t_mv_laboratoires_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_laboratoire_medicament" TEXT, "code_laboratoire_medicament" TEXT, "nom_laboratoire_medicament" TEXT, "adresse_laboratoire_medicament" TEXT, "tel_laboratoire_medicament" TEXT, "fax_laboratoire_medicament" TEXT, "minitel_laboratoire_medicament" TEXT, "autres_indications" TEXT
        );

CREATE TABLE "raw_t_mv_medicament_c_i_diagnostic" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicament_c_i_diagnostic" TEXT, "code_medicament" TEXT, "code_diagnostic" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_mv_medicament_c_i_tare" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicament_c_i_tare" TEXT, "code_medicament" TEXT, "code_tare" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_mv_medicament_forme_posologie" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicament_forme_posologie" TEXT, "code_medicament" TEXT, "forme_et_presentations" TEXT, "mode_d_emploi_et_posologie" TEXT, "flag_existe" TEXT
        );

CREATE TABLE "raw_t_mv_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicament" TEXT, "code_medicament" TEXT, "nom_commercial_medicament" TEXT, "code_laboratoire_medicament" TEXT, "forme_et_presentations_medicament" TEXT, "composition_medicament" TEXT, "mode_d_emploi_et_posologie_medicament" TEXT, "effets_indesirables_medicament" TEXT, "proprietes_medicament" TEXT, "sort_du_medicament" TEXT, "indications_medicament" TEXT, "contre_indications_medicament" TEXT, "precautions_d_emploi_medicament" TEXT, "interactions_medicamenteuses" TEXT, "duree_de_stabilite_medicament" TEXT, "conservation_medicament" TEXT, "surdosage_medicament" TEXT, "tableau_medicament" TEXT, "prix_medicament" TEXT, "remarques_medicament" TEXT, "liste" TEXT, "flag_existe" TEXT
        );

CREATE TABLE "raw_t_mv_medicaments_delegues_medicaux" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicaments_delegue_medical" TEXT, "compteur_delegue_medical" TEXT, "code_medicament" TEXT
        );

CREATE TABLE "raw_t_mv_medicaments_familles" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicaments_familles" TEXT, "code_medicament" TEXT, "code_famille_medicament" TEXT, "code_sous_famille_medicament" TEXT, "code_sous_sous_famille_medicament" TEXT
        );

CREATE TABLE "raw_t_mv_medicaments_noms_chimiques" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_medicaments_noms_chimiques" TEXT, "code_medicament" TEXT, "code_nom_chimique" TEXT
        );

CREATE TABLE "raw_t_mv_noms_chimiques" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_noms_chimiques" TEXT, "code_nom_chimique" TEXT, "nom_chimique" TEXT
        );

CREATE TABLE "raw_t_mv_ordonnance" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_ordonnance" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "numero_ordonnance" TEXT, "date_ordonnance" TEXT, "heure_ordonnance" TEXT, "flag_date_de_naissance" TEXT, "flag_adresse" TEXT, "flag_entete" TEXT, "zone_nom_prenom" TEXT, "flag_test_medicament" TEXT, "flag_test_allergie" TEXT, "flag_test_intolerance" TEXT, "flag_test_diagnostic" TEXT, "flag_test_tare" TEXT, "flag_nom_prenom" TEXT, "prochain_controle" TEXT, "nombre_duree" TEXT, "type_duree" TEXT, "nombre_renouvellement" TEXT, "poids" TEXT
        );

CREATE TABLE "raw_t_mv_remarques_delegues_medicaux" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_remarques_delegue_medical" TEXT, "compteur_delegue_medical" TEXT, "dates_remarques_delegue_medical" TEXT, "remarques_delegue_medical" TEXT
        );

CREATE TABLE "raw_t_mv_table_des_fonctions" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_fonction" TEXT, "nom_menu" TEXT, "compteur" TEXT
        );

CREATE TABLE "raw_t_mv_tare" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_tare" TEXT, "code_tare" TEXT, "designation_tare" TEXT, "compteur_tare_titre" TEXT, "ordre_tare" TEXT, "type_tare" TEXT
        );

CREATE TABLE "raw_t_mv_tare_titre" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_tare_titre" TEXT, "titre_tare" TEXT, "ordre_titre" TEXT
        );

CREATE TABLE "raw_t_patient_fiche_des_notes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur" TEXT, "notes" TEXT
        );

CREATE TABLE "raw_t_pers_nom_etat" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_etat" TEXT
        );

CREATE TABLE "raw_t_pers_table" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "code_personnalisation" TEXT, "type_personnalisation" TEXT, "flag_impression" TEXT, "nom_etat" TEXT, "flag_resume" TEXT
        );

CREATE TABLE "raw_t_personnalisation_contenu" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_personnalisation_contenu" TEXT, "compteur_personnalisation" TEXT, "element_personnalisation" TEXT, "ordre_personnalisation" TEXT, "type_personnalisation" TEXT
        );

CREATE TABLE "raw_t_personnalisation_titre" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_personnalisation" TEXT, "titre_personnalisation" TEXT, "ordre_titre" TEXT
        );

CREATE TABLE "raw_t_rapo_liste_rapport" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_liste_rapport" TEXT, "titre_liste_rapport" TEXT, "ordre_titre" TEXT, "zone_liste_rapport" TEXT, "flag_liste_entete" TEXT, "flag_liste_titre" TEXT, "nom_liste_etat" TEXT
        );

CREATE TABLE "raw_t_rapo_rapport" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_rapport" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "numero_rapport" TEXT, "date_rapport" TEXT, "heure_rapport" TEXT, "flag_entete" TEXT, "flag_titre" TEXT, "titre_rapport" TEXT, "zone_rapport" TEXT, "titre_theme" TEXT, "nom_etat" TEXT, "flag_liaison" TEXT, "zone_liaison" TEXT
        );

CREATE TABLE "raw_t_rapo_table_des_fonctions" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fonction" TEXT, "syntaxe_fonction" TEXT, "code" TEXT, "ordre" TEXT, "origine" TEXT
        );

CREATE TABLE "raw_t_rdv_fiche_des_notes" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "jour" TEXT, "notes" TEXT
        );

CREATE TABLE "raw_t_rdv_jours_conges" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "jour_conge" TEXT, "designation_conge" TEXT
        );

CREATE TABLE "raw_t_rdv_personnalisation" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_rdv_personnalisation" TEXT, "libelle_jour" TEXT, "numero_jour" TEXT, "horaire_debut_rdv" TEXT, "nombre_de_rdv" TEXT, "intervalle_minute" TEXT, "mois_debut" TEXT, "mois_fin" TEXT, "date_debut_limite" TEXT, "date_fin_limite" TEXT
        );

CREATE TABLE "raw_t_rdv_rendez_vous" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "jour_rendez_vous" TEXT, "heure_rendez_vous" TEXT, "compteur" TEXT, "flag_confirmation" TEXT, "date_affectation" TEXT, "flag_rdv" TEXT, "nomprenom" TEXT, "n_dossier" TEXT, "remarques" TEXT, "flag_paiement" TEXT, "flag_remarques" TEXT
        );

CREATE TABLE "raw_t_rdv_table_des_fiches" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nom_fonction" TEXT, "compteur" TEXT
        );

CREATE TABLE "raw_t_stk_medicaments" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_stk_medicaments" TEXT, "code_medicament" TEXT, "forme_et_presentations" TEXT
        );

CREATE TABLE "raw_t_stk_medicaments_sub_d" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_stk_medicaments_sub_d" TEXT, "compteur_stk_medicaments_sub_r" TEXT, "compteur_stk_medicaments" TEXT, "code_medicament" TEXT, "quantite" TEXT, "date_livraison" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_stk_medicaments_sub_r" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_stk_medicaments_sub_r" TEXT, "compteur_stk_medicaments" TEXT, "code_medicament" TEXT, "quantite" TEXT, "date_reception" TEXT, "date_limite" TEXT, "remarques" TEXT
        );

CREATE TABLE "raw_t_trace" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_trace" TEXT, "compteur" TEXT, "date_trace" TEXT
        );

CREATE TABLE "raw_t_w_parametres_consultation" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_parametres_consultation" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "date_parametres_consultation" TEXT, "heure_parametres_consultation" TEXT, "recul" TEXT, "temperature" TEXT, "pouls" TEXT, "frequence_respiratoire" TEXT, "ta_couche" TEXT, "ta_debout" TEXT, "poids" TEXT, "taille" TEXT
        );

CREATE TABLE "raw_t_w_parametres_courrier" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_parametres_courrier" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "date_parametres_courrier" TEXT, "heure_parametres_courrier" TEXT, "accompagnant" TEXT, "date_debut_accompagnant" TEXT, "date_fin_accompagnant" TEXT, "type_incapacite" TEXT, "nombre_jours_incapacite" TEXT, "date_debut_incapacite" TEXT, "date_fin_incapacite" TEXT, "cause_incapacite" TEXT, "sortie_autorisee_interdite" TEXT, "confier_a_code_medecin" TEXT, "confier_a_nom_medecin" TEXT, "confier_a_remarques" TEXT
        );

CREATE TABLE "raw_t_w_pers_type_table" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_fiche" TEXT, "compteur" TEXT, "numero_dossier_medical" TEXT, "numero_consultation" TEXT, "numero_fiche" TEXT, "date_fiche" TEXT, "heure_fiche" TEXT
        );

CREATE TABLE "raw_table_nomforms" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_table_nomforms" TEXT, "nomforms" TEXT, "nomforms_ii" TEXT, "nomforms_iii" TEXT
        );

CREATE TABLE "raw_table_nomtables" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_table_nomtables" TEXT, "nomtables" TEXT, "nomtables_ii" TEXT, "nomtables_iii" TEXT
        );

CREATE TABLE "raw_table_nomtables_attach" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_table_nomtables" TEXT, "nomtables" TEXT, "nomtables_ii" TEXT, "nomtables_iii" TEXT
        );

CREATE TABLE "raw_tc_liste_attach" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_liste_attach" TEXT, "nomtables" TEXT, "nomtables_ii" TEXT, "nomtables_iii" TEXT
        );

CREATE TABLE "raw_tc_repertoire" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "compteur_liste_attach_repertoire" TEXT, "nom_drive" TEXT, "nom_repertoire" TEXT, "repertoire_programme" TEXT, "repertoire_donnee" TEXT, "nom_base" TEXT, "notes" TEXT
        );

CREATE TABLE "raw_tc_table_stable" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "nomtables" TEXT, "nomtables_ii" TEXT
        );

CREATE TABLE "raw_tc_table_variable" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "n" TEXT, "variable" TEXT, "variable_ii" TEXT, "variable_iii" TEXT, "type_variable" TEXT
        );

CREATE TABLE "raw_tc_table_variable1" (
          "__id" INTEGER PRIMARY KEY AUTOINCREMENT, "__source_file" TEXT, "__line_number" INTEGER, "n" TEXT, "variable" TEXT, "variable_ii" TEXT, "variable_iii" TEXT, "type_variable" TEXT
        );

CREATE VIEW app_actes_details AS
        SELECT
          p.compteur,
          p.nom,
          p.prenom,
          a.compteur_actes_et_honoraires,
          a.numero_dossier_medical,
          a.numero_consultation,
          a.numero_acte,
          a.date_actes_et_honoraires,
          a.total_actes,
          a.total_fournitures,
          a.montant_en_especes,
          a.montant_par_cheque,
          s.compteur_actes_et_honoraires_sub,
          s.nom_categorie_acte,
          s.nom_acte,
          s.code_acte,
          s.montant_acte
        FROM app_actes_honoraires a
        LEFT JOIN app_patients p
          ON p.compteur = a.compteur
        LEFT JOIN app_actes_honoraires_sub s
          ON s.compteur_actes_et_honoraires = a.compteur_actes_et_honoraires;

CREATE VIEW app_actes_honoraires AS
        SELECT
          CAST(compteur_actes_et_honoraires AS INTEGER) AS compteur_actes_et_honoraires,
          CAST(compteur AS INTEGER) AS compteur,
          CAST(numero_dossier_medical AS INTEGER) AS numero_dossier_medical,
          CAST(numero_consultation AS INTEGER) AS numero_consultation,
          CAST(numero_acte AS INTEGER) AS numero_acte,
          date_actes_et_honoraires,
          heure_actes_et_honoraires,
          total_actes,
          total_fournitures,
          montant_en_especes,
          montant_par_cheque,
          couverture_sociale,
          code_banque,
          n_cheque
        FROM raw_t_actes_et_honoraires;

CREATE VIEW app_actes_honoraires_sub AS
        SELECT
          CAST(compteur_actes_et_honoraires_sub AS INTEGER) AS compteur_actes_et_honoraires_sub,
          CAST(compteur_actes_et_honoraires AS INTEGER) AS compteur_actes_et_honoraires,
          nom_categorie_acte,
          nom_acte,
          code_acte,
          montant_acte
        FROM raw_t_actes_et_honoraires_sub;

CREATE VIEW app_consultation_themes AS
        SELECT
          CAST(compteur_consultation_themes AS INTEGER) AS compteur_consultation_themes,
          CAST(compteur AS INTEGER) AS compteur,
          CAST(numero_dossier_medical AS INTEGER) AS numero_dossier_medical,
          CAST(numero_consultation AS INTEGER) AS numero_consultation,
          titre_theme,
          ordre_titre,
          date_theme,
          heure_theme,
          contenu_theme,
          flag_examen
        FROM raw_t_consultations_themes;

CREATE VIEW app_consultations AS
        SELECT
          CAST(compteur_consultation AS INTEGER) AS compteur_consultation,
          CAST(compteur AS INTEGER) AS compteur,
          CAST(numero_dossier_medical AS INTEGER) AS numero_dossier_medical,
          CAST(numero_consultation AS INTEGER) AS numero_consultation,
          date_consultation,
          heure_consultation,
          enregistrement_son,
          remarques_consultations,
          flag_remarques_consultations
        FROM raw_t_consultations;

CREATE VIEW app_dossiers AS
        SELECT
          CAST(compteur_dossier_medical AS INTEGER) AS compteur_dossier_medical,
          CAST(compteur AS INTEGER) AS compteur,
          CAST(numero_dossier_medical AS INTEGER) AS numero_dossier_medical,
          date_dossier_medical,
          heure_dossier_medical,
          code_dossier_medical,
          titre_dossier_medical,
          remarques_dossier_medical,
          statut,
          couverture_sociale,
          date_accident,
          heure_accident
        FROM raw_t_dossier_medical;

CREATE VIEW app_examen_elements AS
        SELECT
          CAST(compteur_examens_sub AS INTEGER) AS compteur_examens_sub,
          CAST(compteur_examens AS INTEGER) AS compteur_examens,
          nom_element,
          donnee_element,
          remarques,
          image_radio,
          resume_radio
        FROM raw_t_examens_sub;

CREATE VIEW app_examens AS
        SELECT
          CAST(compteur_examens AS INTEGER) AS compteur_examens,
          CAST(compteur AS INTEGER) AS compteur,
          CAST(numero_dossier_medical AS INTEGER) AS numero_dossier_medical,
          CAST(numero_consultation AS INTEGER) AS numero_consultation,
          CAST(numero_examens AS INTEGER) AS numero_examens,
          date_examens,
          heure_examens,
          titre_examens,
          conclusion_examens,
          fait_par,
          type_examen
        FROM raw_t_examens;

CREATE VIEW app_examens_details AS
        SELECT
          p.compteur,
          p.nom,
          p.prenom,
          e.compteur_examens,
          e.numero_dossier_medical,
          e.numero_consultation,
          e.numero_examens,
          e.date_examens,
          e.heure_examens,
          e.titre_examens,
          e.type_examen,
          e.conclusion_examens,
          s.compteur_examens_sub,
          s.nom_element,
          s.donnee_element,
          s.remarques,
          s.resume_radio
        FROM app_examens e
        LEFT JOIN app_patients p
          ON p.compteur = e.compteur
        LEFT JOIN app_examen_elements s
          ON s.compteur_examens = e.compteur_examens;

CREATE VIEW app_medicaments_prescrits AS
        SELECT
          CAST(compteur_fiche_medicaments_prescrits AS INTEGER) AS compteur_fiche_medicaments_prescrits,
          CAST(compteur AS INTEGER) AS compteur,
          CAST(numero_dossier_medical AS INTEGER) AS numero_dossier_medical,
          CAST(numero_consultation AS INTEGER) AS numero_consultation,
          CAST(numero_ordonnance AS INTEGER) AS numero_ordonnance,
          code_medicament,
          date_debut_medicaments_prescrits,
          date_fin_medicaments_prescrits,
          flag_test_interactions,
          zone_1_medicament_ordonnance,
          zone_2_medicament_ordonnance,
          zone_3_medicament_ordonnance,
          zone_4_medicament_ordonnance
        FROM raw_t_mv_fiche_medicaments_prescrits;

CREATE VIEW app_patient_consultation_history AS
        SELECT
          p.compteur,
          p.nom,
          p.prenom,
          p.n_dossier,
          c.compteur_consultation,
          c.numero_dossier_medical,
          c.numero_consultation,
          c.date_consultation,
          c.heure_consultation,
          t.compteur_consultation_themes,
          t.titre_theme,
          t.ordre_titre,
          t.contenu_theme,
          t.flag_examen
        FROM app_patients p
        JOIN app_consultations c
          ON c.compteur = p.compteur
        LEFT JOIN app_consultation_themes t
          ON t.compteur = c.compteur
         AND t.numero_dossier_medical = c.numero_dossier_medical
         AND t.numero_consultation = c.numero_consultation;

CREATE VIEW app_patients AS
        SELECT
          CAST(compteur AS INTEGER) AS compteur,
          nom,
          nom_jeune_fille,
          prenom,
          n_dossier,
          matricule,
          date_de_naissance,
          lieu_de_naissance,
          sexe,
          situation_de_famille,
          mr_mme_melle_enfant,
          adresse,
          ville,
          code_ville,
          gouvernorat_ou_pays,
          origine,
          profession,
          employeur,
          activite_employeur,
          adresse_profession,
          ville_profession,
          code_ville_profession,
          tel_bureau,
          tel_domicile,
          proche,
          tel_proche,
          n_affiliation,
          statut,
          couverture_sociale,
          remarques,
          remarques_medicales_importantes,
          date_1ere_consultation,
          notesstate,
          notes
        FROM raw_t_fiche_administrative;

CREATE VIEW app_prescriptions AS
        SELECT
          p.compteur,
          p.nom,
          p.prenom,
          c.compteur_consultation,
          c.numero_dossier_medical,
          c.numero_consultation,
          c.date_consultation,
          c.heure_consultation,
          m.compteur_fiche_medicaments_prescrits,
          m.numero_ordonnance,
          m.code_medicament,
          m.date_debut_medicaments_prescrits,
          m.date_fin_medicaments_prescrits,
          m.zone_1_medicament_ordonnance AS ordre_ligne,
          m.zone_2_medicament_ordonnance AS medicament,
          m.zone_3_medicament_ordonnance AS posologie,
          m.zone_4_medicament_ordonnance AS complement
        FROM app_medicaments_prescrits m
        LEFT JOIN app_patients p
          ON p.compteur = m.compteur
        LEFT JOIN app_consultations c
          ON c.compteur = m.compteur
         AND c.numero_dossier_medical = m.numero_dossier_medical
         AND c.numero_consultation = m.numero_consultation;