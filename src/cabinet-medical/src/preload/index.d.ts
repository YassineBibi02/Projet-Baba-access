import { ElectronAPI } from '@electron-toolkit/preload'

export interface PatientRow {
  compteur: number
  nom: string | null
  prenom: string | null
  n_dossier: string | null
  date_de_naissance: string | null
  ville: string | null
  tel_domicile: string | null
}

export interface SearchResult {
  rows: PatientRow[]
  seekIndex: number
  hasBefore: boolean
  hasAfter: boolean
}

export interface PatientFull {
  compteur: number
  nom: string | null
  nom_jeune_fille: string | null
  prenom: string | null
  n_dossier: string | null
  matricule: string | null
  date_de_naissance: string | null
  lieu_de_naissance: string | null
  sexe: string | null
  situation_de_famille: string | null
  mr_mme_melle_enfant: string | null
  adresse: string | null
  ville: string | null
  code_ville: string | null
  gouvernorat_ou_pays: string | null
  origine: string | null
  profession: string | null
  employeur: string | null
  activite_employeur: string | null
  adresse_profession: string | null
  ville_profession: string | null
  code_ville_profession: string | null
  tel_bureau: string | null
  tel_domicile: string | null
  proche: string | null
  tel_proche: string | null
  n_affiliation: string | null
  statut: string | null
  couverture_sociale: string | null
  remarques: string | null
  remarques_medicales_importantes: string | null
  date_1ere_consultation: string | null
  notesstate: string | null
  notes: string | null
}

export interface ConsultationRow {
  compteur_consultation: number
  numero_dossier_medical: number | null
  numero_consultation: number | null
  date_consultation: string | null
  heure_consultation: string | null
  remarques_consultations: string | null
  flag_remarques_consultations: number | null
  titre_dossier_medical: string | null
  code_dossier_medical: string | null
}

export interface ThemeRow {
  compteur_consultation_themes: number
  numero_dossier_medical: number | null
  numero_consultation: number | null
  titre_theme: string | null
  contenu_theme: string | null
  ordre_titre: number | null
  date_theme: string | null
  heure_theme: string | null
  flag_examen: number | null
}

export interface ConsultData {
  consultations: ConsultationRow[]
  themes: ThemeRow[]
}

export interface OrdonnanceRow {
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

export interface OrdonnanceLigneRow {
  compteur_ligne: number
  compteur_ordonnance: number
  ordre: number
  nom_medicament: string | null
  posologie: string | null
}

export interface OrdonnanceData {
  ordonnances: OrdonnanceRow[]
  lignes: OrdonnanceLigneRow[]
}

export interface OrdonnanceHeaderPayload {
  dureeValeur: string
  dureeUnite: string
  aRenouvelerFois: number | null
  prochainControle: string
  flagInteractions: boolean
  flagAllergie: boolean
  flagIntolerance: boolean
  flagDiagnostic: boolean
  flagTare: boolean
  imprimerEntete: boolean
  imprimerNomPrenom: boolean
  imprimerDateNaissance: boolean
  imprimerAdresse: boolean
  texteEntete: string
}

export interface OrdonnanceLignePayload {
  ordre: number
  nom: string
  posologie: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      searchPatients: (p: {
        field: 'nom' | 'prenom' | 'code'
        value: string
      }) => Promise<SearchResult>
      loadMorePatients: (p: {
        field: 'nom' | 'prenom' | 'code'
        direction: 'before' | 'after'
        anchor: { nom?: string | null; prenom?: string | null; n_dossier?: string | null; compteur: number }
      }) => Promise<{ rows: PatientRow[]; hasMore: boolean }>
      getPatient: (compteur: number) => Promise<PatientFull | null>
      getConsultations: (compteur: number) => Promise<ConsultData>

      loadOrdonnancesForDossier: (
        compteur: number,
        numeroDossier: string | number
      ) => Promise<OrdonnanceData>
      createOrdonnance: (p: OrdonnanceHeaderPayload & {
        compteur: number
        numeroDossier: string
        numeroConsultation: number | null
        dateOrdonnance: string
        heureOrdonnance: string
        lignes: OrdonnanceLignePayload[]
      }) => Promise<{ ok: boolean; compteurOrdonnance?: number; error?: string }>
      saveOrdonnance: (p: OrdonnanceHeaderPayload & {
        compteurOrdonnance: number
      }) => Promise<{ ok: boolean; error?: string }>
      saveOrdonnanceLigne: (p: {
        compteurOrdonnance: number
        compteurLigne: number | null
        ordre: number
        nom: string
        posologie: string
      }) => Promise<{ ok: boolean; error?: string }>
      deleteOrdonnanceLigne: (compteurLigne: number) => Promise<{ ok: boolean; error?: string }>
      deleteOrdonnance: (compteurOrdonnance: number) => Promise<{ ok: boolean; error?: string }>

      lookupSearch: (p: { source: string; value: string }) => Promise<{ vals: string[]; hasAfter: boolean }>
      lookupLoadMore: (p: { source: string; value: string; anchor: string }) => Promise<{ vals: string[]; hasAfter: boolean }>
    }
  }
}