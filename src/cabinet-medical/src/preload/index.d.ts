import { ElectronAPI } from '@electron-toolkit/preload'

export interface PatientRow {
  compteur: number
  nom: string | null
  prenom: string | null
  numero_dossier: string | null
  date_naissance: string | null
  ville: string | null
  tel_domicile: string | null
}

export interface SearchResult {
  rows: PatientRow[]
  seekIndex: number
}

export interface PatientFull {
  compteur: number
  nom: string | null
  nom_jeune_fille: string | null
  prenom: string | null
  numero_dossier: string | null
  matricule: string | null
  date_naissance: string | null
  date_naissance_raw: string | null
  lieu_naissance: string | null
  sexe: string | null
  situation_famille: string | null
  civilite: string | null
  adresse: string | null
  ville: string | null
  code_ville: string | null
  gouvernorat_pays: string | null
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
  numero_affiliation: string | null
  statut: string | null
  couverture_sociale: string | null
  remarques: string | null
  remarques_medicales_importantes: string | null
  date_premiere_consultation: string | null
  date_premiere_consultation_raw: string | null
  notes_state: number | null
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

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      searchPatients: (p: {
        field: 'nom' | 'prenom' | 'code'
        value: string
      }) => Promise<SearchResult>
      getPatient: (compteur: number) => Promise<PatientFull | null>
      getConsultations: (compteur: number) => Promise<ConsultData>
    }
  }
}
