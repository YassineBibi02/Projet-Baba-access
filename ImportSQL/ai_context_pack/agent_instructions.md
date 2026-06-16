# Instructions for AI Agent Using This SQLite Database

You are working with a SQLite database migrated from an old Microsoft Access medical application.

Use the `app_*` views for application logic whenever possible.

Recommended views:

- `app_patients`: patient identity/search.
- `app_patient_consultation_history`: consultations and clinical theme content.
- `app_prescriptions`: structured prescribed medications.
- `app_examens_details`: exams and exam sub-elements.
- `app_actes_details`: acts/honoraires and billing details.

Raw tables:

- `raw_*` tables are direct imports from Access TXT/CSV files.
- Raw tables preserve original columns and values.
- Raw tables are useful for debugging or finding data not yet exposed in app views.

Important rules:

1. Do not assume all relationships are complete.
2. Old orphan records are expected.
3. Do not delete rows just because a parent row is missing.
4. Prefer LEFT JOIN when linking historical tables.
5. Use `compteur` as the main patient identifier.
6. Consultation-level records usually link by:
   - `compteur`
   - `numero_dossier_medical`
   - `numero_consultation`
7. Exam sub-elements link by:
   - `compteur_examens`
8. Act/honoraires sub-elements link by:
   - `compteur_actes_et_honoraires`
9. Dates may be old Access text values and should be treated carefully.
10. Raw columns are mostly TEXT by design to preserve old data.

When writing SQL, start from the app views unless the user asks for raw Access data.
