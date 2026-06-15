import csv
import io
import sqlite3
from pathlib import Path
from datetime import datetime

SOURCE_TXT = Path("TABLEP(1).TXT")
OUTPUT_DB = Path("patients.sqlite")

HEADERS = [
    "compteur","nom","nom_jeune_fille","prenom","numero_dossier","matricule",
    "date_naissance","lieu_naissance","sexe","situation_famille","civilite",
    "adresse","ville","code_ville","gouvernorat_pays","origine","profession",
    "employeur","activite_employeur","adresse_profession","ville_profession",
    "code_ville_profession","tel_bureau","tel_domicile","proche","tel_proche",
    "numero_affiliation","statut","couverture_sociale","remarques",
    "remarques_medicales_importantes","date_premiere_consultation","notes_state","notes"
]

def parse_access_date(value):
    value = (value or "").strip()
    if not value:
        return None, None

    for fmt in ("%m/%d/%y %H:%M:%S", "%m/%d/%Y %H:%M:%S", "%m/%d/%y", "%m/%d/%Y"):
        try:
            return datetime.strptime(value, fmt).date().isoformat(), None
        except ValueError:
            pass

    return None, f"Invalid date: {value}"

def main():
    text = SOURCE_TXT.read_text(encoding="cp1252")
    rows = list(csv.reader(io.StringIO(text)))

    bad_widths = sorted(set(len(row) for row in rows if len(row) != len(HEADERS)))
    if bad_widths:
        raise RuntimeError(f"Unexpected column counts found: {bad_widths}")

    if OUTPUT_DB.exists():
        OUTPUT_DB.unlink()

    db = sqlite3.connect(OUTPUT_DB)
    cur = db.cursor()

    cur.executescript(Path("schema.sql").read_text(encoding="utf-8"))

    insert_cols = [
        "compteur","nom","nom_jeune_fille","prenom","numero_dossier","matricule",
        "date_naissance","date_naissance_raw","lieu_naissance","sexe","situation_famille","civilite",
        "adresse","ville","code_ville","gouvernorat_pays","origine","profession","employeur",
        "activite_employeur","adresse_profession","ville_profession","code_ville_profession","tel_bureau",
        "tel_domicile","proche","tel_proche","numero_affiliation","statut","couverture_sociale","remarques",
        "remarques_medicales_importantes","date_premiere_consultation","date_premiere_consultation_raw",
        "notes_state","notes"
    ]
    placeholders = ",".join(["?"] * len(insert_cols))

    issues = []

    for row in rows:
        rec = dict(zip(HEADERS, row))
        date_naissance, issue = parse_access_date(rec["date_naissance"])
        date_consultation, issue2 = parse_access_date(rec["date_premiere_consultation"])

        compteur = int(rec["compteur"])

        if issue:
            issues.append((compteur, "date_naissance", rec["date_naissance"], issue))
        if issue2:
            issues.append((compteur, "date_premiere_consultation", rec["date_premiere_consultation"], issue2))

        values = [
            compteur,
            rec["nom"] or None,
            rec["nom_jeune_fille"] or None,
            rec["prenom"] or None,
            rec["numero_dossier"] or None,
            rec["matricule"] or None,
            date_naissance,
            rec["date_naissance"] or None,
            rec["lieu_naissance"] or None,
            rec["sexe"] or None,
            rec["situation_famille"] or None,
            rec["civilite"] or None,
            rec["adresse"] or None,
            rec["ville"] or None,
            rec["code_ville"] or None,
            rec["gouvernorat_pays"] or None,
            rec["origine"] or None,
            rec["profession"] or None,
            rec["employeur"] or None,
            rec["activite_employeur"] or None,
            rec["adresse_profession"] or None,
            rec["ville_profession"] or None,
            rec["code_ville_profession"] or None,
            rec["tel_bureau"] or None,
            rec["tel_domicile"] or None,
            rec["proche"] or None,
            rec["tel_proche"] or None,
            rec["numero_affiliation"] or None,
            rec["statut"] or None,
            rec["couverture_sociale"] or None,
            rec["remarques"] or None,
            rec["remarques_medicales_importantes"] or None,
            date_consultation,
            rec["date_premiere_consultation"] or None,
            int(rec["notes_state"]) if rec["notes_state"].strip().isdigit() else None,
            rec["notes"] or None,
        ]

        cur.execute(
            f"INSERT INTO patients ({','.join(insert_cols)}) VALUES ({placeholders})",
            values,
        )

    cur.executemany(
        "INSERT INTO import_issues (compteur, column_name, raw_value, issue) VALUES (?, ?, ?, ?)",
        issues,
    )

    db.commit()

    print("Imported patients:", cur.execute("SELECT COUNT(*) FROM patients").fetchone()[0])
    print("Import issues:", cur.execute("SELECT COUNT(*) FROM import_issues").fetchone()[0])

if __name__ == "__main__":
    main()
