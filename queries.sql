-- Search for a patient by name, first name, dossier number, or phone.
SELECT
  compteur,
  nom,
  prenom,
  numero_dossier,
  date_naissance,
  ville,
  tel_domicile
FROM patients
WHERE nom LIKE '%' || :q || '%'
   OR prenom LIKE '%' || :q || '%'
   OR numero_dossier LIKE '%' || :q || '%'
   OR tel_domicile LIKE '%' || :q || '%'
ORDER BY nom, prenom
LIMIT 50;

-- Open one patient record.
SELECT *
FROM patients
WHERE compteur = :compteur;

-- Check import problems.
SELECT *
FROM import_issues
ORDER BY compteur;
