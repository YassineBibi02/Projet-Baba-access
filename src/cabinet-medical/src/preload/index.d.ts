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

export interface DossierConsultation {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  date_consultation: string | null
  code_dossier_medical: string | null
  titre_dossier_medical: string | null
}

export interface DossierOrdonnance {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_ordonnance: number | null
  date_ordonnance: string | null
}

export interface DossierCourrier {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_rapport: number | null
  date_rapport: string | null
  titre_rapport: string | null
}

export interface DossierExamen {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_examens: number | null
  date_examens: string | null
  titre_examens: string | null
}

export interface DossierActe {
  numero_dossier_medical: number | null
  numero_consultation: number | null
  numero_acte: number | null
  date_actes_et_honoraires: string | null
  total_actes: string | null
}

export interface DossierData {
  consultations: DossierConsultation[]
  ordonnances: DossierOrdonnance[]
  courriers: DossierCourrier[]
  examens: DossierExamen[]
  actes: DossierActe[]
}

export interface ConsultationByDateRow {
  compteur_consultation: number
  compteur: number
  numero_dossier_medical: number | string | null
  numero_consultation: number | string | null
  date_consultation: string | null
  heure_consultation: string | null
  remarques_consultations: string | null
  flag_remarques_consultations: number | null
  nom: string | null
  prenom: string | null
  date_de_naissance: string | null
  notesstate: string | null
  titre_dossier_medical: string | null
  code_dossier_medical: string | null
}

export interface ThemeTypeRow {
  titre_theme: string
  ordre_titre: string
}

export interface ConsultForDossierRow {
  compteur_consultation: string | number
  numero_dossier_medical: string | null
  numero_consultation: string | null
  date_consultation: string | null
  heure_consultation: string | null
  titre_dossier_medical: string | null
  code_dossier_medical: string | null
}

export interface ConsultThemeRow {
  compteur_consultation_themes: string | number
  numero_dossier_medical: string | null
  numero_consultation: string | null
  titre_theme: string | null
  contenu_theme: string | null
  ordre_titre: string | null
}

export interface ConsultForDossierData {
  consultations: ConsultForDossierRow[]
  themes: ConsultThemeRow[]
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      searchPatients: (p: {
        field: 'nom' | 'prenom' | 'code' | 'ddn'
        value: string
      }) => Promise<SearchResult>
      loadMorePatients: (p: {
        field: 'nom' | 'prenom' | 'code'
        direction: 'before' | 'after'
        anchor: { nom: string | null; prenom: string | null; n_dossier: string | null; compteur: number }
      }) => Promise<{ rows: PatientRow[]; hasMore: boolean }>
      getPatient: (compteur: number) => Promise<PatientFull | null>
      getConsultations: (compteur: number) => Promise<ConsultData>
      getConsultationsByDate: (date: string) => Promise<ConsultationByDateRow[]>
      getThemeTypes: () => Promise<ThemeTypeRow[]>
      loadConsultationsForDossier: (compteur: number, numeroDossier: string | number) => Promise<ConsultForDossierData>
      saveConsultationTheme: (data: {
        compteur: number; numeroDossier: string; numeroConsultation: string
        titreTheme: string; contenuTheme: string; compteurTheme: number | null
      }) => Promise<{ ok: boolean; compteurTheme?: number; error?: string }>
      createConsultation: (data: {
        compteur: number; numeroDossier: string; titreTheme: string; contenuTheme: string
      }) => Promise<{ ok: boolean; numeroConsultation?: number; compteurConsultation?: number; error?: string }>
      deleteConsultation: (data: {
        compteur: number; numeroDossier: string; numeroConsultation: string; compteurConsultation: number | string
      }) => Promise<{ ok: boolean; error?: string }>
      deleteConsultationTheme: (compteurTheme: number) => Promise<{ ok: boolean; error?: string }>
      lookupSearch: (p: { source: string; value: string }) => Promise<{ vals: string[]; hasAfter: boolean }>
      lookupLoadMore: (p: { source: string; value: string; anchor: string }) => Promise<{ vals: string[]; hasAfter: boolean }>
      getNextDossier: () => Promise<string>
      deletePatient: (compteur: number) => Promise<{ ok: boolean; error?: string }>
      updatePatient: (compteur: number, data: Record<string, string | number | null>) => Promise<{ ok: boolean; error?: string }>
      createPatient: (data: Record<string, string | number | null>) => Promise<{ ok: boolean; compteur?: number; error?: string }>
      loadDossier: (compteur: number) => Promise<DossierData>
    }
  }
}
