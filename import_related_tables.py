import csv
import sqlite3
from datetime import datetime
from pathlib import Path


DB_FILE = Path("patients.sqlite")

FILES = {
    "dossiers": Path("DSSER.TXT"),
    "consultations": Path("CONSULT.TXT"),
    "consultation_themes": Path("CONSULTH.TXT"),
    "examens": Path("EXZAM.TXT"),
    "examen_elements": Path("EXAMSUB.TXT"),
}


def clean_text(value):
    if value is None:
        return None

    value = str(value).strip()

    if value == "":
        return None

    return value


def parse_int(value):
    value = clean_text(value)

    if value is None:
        return None

    return int(value)


def parse_old_access_date(value):
    raw = clean_text(value)

    if raw is None:
        return None, None, None

    date_part = raw.split(" ")[0]

    try:
        parsed = datetime.strptime(date_part, "%m/%d/%y")
        return parsed.date().isoformat(), raw, None
    except ValueError:
        return None, raw, f"Invalid date: {raw}"


def parse_old_access_time(value):
    raw = clean_text(value)

    if raw is None:
        return None, None, None

    parts = raw.split(" ")

    if len(parts) < 2:
        return None, raw, f"Invalid time: {raw}"

    time_part = parts[1]

    try:
        parsed = datetime.strptime(time_part, "%H:%M:%S")
        return parsed.time().isoformat(), raw, None
    except ValueError:
        return None, raw, f"Invalid time: {raw}"


def insert_issue(
    connection,
    table_name,
    source_file,
    line_number,
    record_key,
    column_name,
    raw_value,
    issue,
):
    connection.execute(
        """
        INSERT INTO import_issues (
          table_name,
          source_file,
          line_number,
          record_key,
          column_name,
          raw_value,
          issue
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            table_name,
            source_file,
            line_number,
            record_key,
            column_name,
            raw_value,
            issue,
        ),
    )


def read_csv_rows(path):
    with path.open("r", encoding="cp1252", newline="") as file:
        reader = csv.reader(file)
        header = next(reader)

        for line_number, row in enumerate(reader, start=2):
            yield line_number, header, row


def create_schema(connection):
    connection.execute("PRAGMA foreign_keys = OFF")

    connection.executescript(
        """
        DROP TABLE IF EXISTS examen_elements;
        DROP TABLE IF EXISTS examens;
        DROP TABLE IF EXISTS consultation_themes;
        DROP TABLE IF EXISTS consultations;
        DROP TABLE IF EXISTS dossiers;

        DROP TABLE IF EXISTS import_issues;

        CREATE TABLE import_issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT,
            source_file TEXT,
            line_number INTEGER,
            record_key TEXT,
            column_name TEXT,
            raw_value TEXT,
            issue TEXT
        );

        CREATE TABLE dossiers (
          compteur_dossier_medical INTEGER PRIMARY KEY,
          compteur INTEGER NOT NULL,
          numero_dossier_medical INTEGER,

          date_dossier_medical TEXT,
          date_dossier_medical_raw TEXT,

          heure_dossier_medical TEXT,
          heure_dossier_medical_raw TEXT,

          code_dossier_medical TEXT,
          titre_dossier_medical TEXT,
          remarques_dossier_medical TEXT,
          statut TEXT,
          couverture_sociale TEXT,

          date_accident TEXT,
          date_accident_raw TEXT,

          heure_accident TEXT,
          heure_accident_raw TEXT,

          FOREIGN KEY (compteur) REFERENCES patients(compteur)
        );

        CREATE TABLE consultations (
          compteur_consultation INTEGER PRIMARY KEY,
          compteur INTEGER NOT NULL,
          numero_dossier_medical INTEGER,
          numero_consultation INTEGER,

          date_consultation TEXT,
          date_consultation_raw TEXT,

          heure_consultation TEXT,
          heure_consultation_raw TEXT,

          enregistrement_son TEXT,
          remarques_consultations TEXT,
          flag_remarques_consultations INTEGER,

          FOREIGN KEY (compteur) REFERENCES patients(compteur)
        );

        CREATE UNIQUE INDEX idx_consultations_natural_key
        ON consultations (
          compteur,
          numero_dossier_medical,
          numero_consultation
        );

        CREATE TABLE consultation_themes (
          compteur_consultation_themes INTEGER PRIMARY KEY,
          compteur INTEGER NOT NULL,
          numero_dossier_medical INTEGER,
          numero_consultation INTEGER,

          titre_theme TEXT,
          ordre_titre INTEGER,

          date_theme TEXT,
          date_theme_raw TEXT,

          heure_theme TEXT,
          heure_theme_raw TEXT,

          contenu_theme TEXT,
          flag_examen INTEGER,

          FOREIGN KEY (compteur) REFERENCES patients(compteur),

          FOREIGN KEY (
            compteur,
            numero_dossier_medical,
            numero_consultation
          )
          REFERENCES consultations (
            compteur,
            numero_dossier_medical,
            numero_consultation
          )
        );

        CREATE TABLE examens (
          compteur_examens INTEGER PRIMARY KEY,
          compteur INTEGER NOT NULL,
          numero_dossier_medical INTEGER,
          numero_consultation INTEGER,
          numero_examens INTEGER,

          date_examens TEXT,
          date_examens_raw TEXT,

          heure_examens TEXT,
          heure_examens_raw TEXT,

          titre_examens TEXT,
          conclusion_examens TEXT,
          fait_par TEXT,
          type_examen TEXT,

          FOREIGN KEY (compteur) REFERENCES patients(compteur),

          FOREIGN KEY (
            compteur,
            numero_dossier_medical,
            numero_consultation
          )
          REFERENCES consultations (
            compteur,
            numero_dossier_medical,
            numero_consultation
          )
        );

        CREATE TABLE examen_elements (
          compteur_examens_sub INTEGER PRIMARY KEY,
          compteur_examens INTEGER NOT NULL,

          nom_element TEXT,
          donnee_element TEXT,
          remarques TEXT,
          image_radio TEXT,
          resume_radio TEXT,

          FOREIGN KEY (compteur_examens) REFERENCES examens(compteur_examens)
        );

        CREATE INDEX idx_dossiers_patient
        ON dossiers(compteur);

        CREATE INDEX idx_consultations_patient
        ON consultations(compteur);

        CREATE INDEX idx_consultation_themes_patient
        ON consultation_themes(compteur);

        CREATE INDEX idx_examens_patient
        ON examens(compteur);

        CREATE INDEX idx_examens_consultation
        ON examens(compteur, numero_dossier_medical, numero_consultation);

        CREATE INDEX idx_examen_elements_examens
        ON examen_elements(compteur_examens);
        """
    )


def validate_header(table_name, actual_header, expected_header):
    if actual_header != expected_header:
        raise ValueError(
            f"{table_name}: header mismatch\n"
            f"Expected: {expected_header}\n"
            f"Actual:   {actual_header}"
        )


def parse_date_column(
    connection,
    table_name,
    source_file,
    line_number,
    record_key,
    column_name,
    value,
):
    parsed, raw, error = parse_old_access_date(value)

    if error:
        insert_issue(
            connection,
            table_name,
            source_file,
            line_number,
            record_key,
            column_name,
            raw,
            error,
        )

    return parsed, raw


def parse_time_column(
    connection,
    table_name,
    source_file,
    line_number,
    record_key,
    column_name,
    value,
):
    parsed, raw, error = parse_old_access_time(value)

    if error:
        insert_issue(
            connection,
            table_name,
            source_file,
            line_number,
            record_key,
            column_name,
            raw,
            error,
        )

    return parsed, raw


def check_patient_exists(connection, table_name, source_file, line_number, record_key, compteur):
    row = connection.execute(
        "SELECT 1 FROM patients WHERE compteur = ?",
        (compteur,),
    ).fetchone()

    if row is None:
        insert_issue(
            connection,
            table_name,
            source_file,
            line_number,
            record_key,
            "compteur",
            str(compteur),
            "Patient not found in patients table",
        )


def import_dossiers(connection):
    path = FILES["dossiers"]

    if not path.exists():
        print("Skipping dossiers: DSSER.TXT not found")
        return 0

    expected_header = [
        "Compteur dossier médical",
        "Compteur",
        "Numéro dossier médical",
        "Date dossier médical",
        "Heure dossier médical",
        "Code dossier médical",
        "Titre dossier médical",
        "Remarques dossier médical",
        "Statut",
        "Couverture sociale",
        "Date accident",
        "Heure accident",
    ]

    count = 0

    for line_number, header, row in read_csv_rows(path):
        validate_header("dossiers", header, expected_header)

        if len(row) != len(header):
            insert_issue(
                connection,
                "dossiers",
                path.name,
                line_number,
                None,
                "row",
                str(row),
                f"Expected {len(header)} columns, got {len(row)}",
            )
            continue

        data = dict(zip(header, row))
        record_key = clean_text(data["Compteur dossier médical"])

        compteur = parse_int(data["Compteur"])
        check_patient_exists(connection, "dossiers", path.name, line_number, record_key, compteur)

        date_dossier, date_dossier_raw = parse_date_column(
            connection,
            "dossiers",
            path.name,
            line_number,
            record_key,
            "Date dossier médical",
            data["Date dossier médical"],
        )

        heure_dossier, heure_dossier_raw = parse_time_column(
            connection,
            "dossiers",
            path.name,
            line_number,
            record_key,
            "Heure dossier médical",
            data["Heure dossier médical"],
        )

        date_accident, date_accident_raw = parse_date_column(
            connection,
            "dossiers",
            path.name,
            line_number,
            record_key,
            "Date accident",
            data["Date accident"],
        )

        heure_accident, heure_accident_raw = parse_time_column(
            connection,
            "dossiers",
            path.name,
            line_number,
            record_key,
            "Heure accident",
            data["Heure accident"],
        )

        connection.execute(
            """
            INSERT INTO dossiers (
              compteur_dossier_medical,
              compteur,
              numero_dossier_medical,
              date_dossier_medical,
              date_dossier_medical_raw,
              heure_dossier_medical,
              heure_dossier_medical_raw,
              code_dossier_medical,
              titre_dossier_medical,
              remarques_dossier_medical,
              statut,
              couverture_sociale,
              date_accident,
              date_accident_raw,
              heure_accident,
              heure_accident_raw
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                parse_int(data["Compteur dossier médical"]),
                compteur,
                parse_int(data["Numéro dossier médical"]),
                date_dossier,
                date_dossier_raw,
                heure_dossier,
                heure_dossier_raw,
                clean_text(data["Code dossier médical"]),
                clean_text(data["Titre dossier médical"]),
                clean_text(data["Remarques dossier médical"]),
                clean_text(data["Statut"]),
                clean_text(data["Couverture sociale"]),
                date_accident,
                date_accident_raw,
                heure_accident,
                heure_accident_raw,
            ),
        )

        count += 1

    return count


def import_consultations(connection):
    path = FILES["consultations"]

    if not path.exists():
        print("Skipping consultations: CONSULTATION.TXT not found")
        return 0

    expected_header = [
        "Compteur consultation",
        "Compteur",
        "Numéro dossier médical",
        "Numéro consultation",
        "Date consultation",
        "Heure consultation",
        "Enregistrement son",
        "Remarques consultations",
        "Flag Remarques consultations",
    ]

    count = 0

    for line_number, header, row in read_csv_rows(path):
        validate_header("consultations", header, expected_header)

        if len(row) != len(header):
            insert_issue(
                connection,
                "consultations",
                path.name,
                line_number,
                None,
                "row",
                str(row),
                f"Expected {len(header)} columns, got {len(row)}",
            )
            continue

        data = dict(zip(header, row))
        record_key = clean_text(data["Compteur consultation"])

        compteur = parse_int(data["Compteur"])
        check_patient_exists(connection, "consultations", path.name, line_number, record_key, compteur)

        date_consultation, date_consultation_raw = parse_date_column(
            connection,
            "consultations",
            path.name,
            line_number,
            record_key,
            "Date consultation",
            data["Date consultation"],
        )

        heure_consultation, heure_consultation_raw = parse_time_column(
            connection,
            "consultations",
            path.name,
            line_number,
            record_key,
            "Heure consultation",
            data["Heure consultation"],
        )

        connection.execute(
            """
            INSERT INTO consultations (
              compteur_consultation,
              compteur,
              numero_dossier_medical,
              numero_consultation,
              date_consultation,
              date_consultation_raw,
              heure_consultation,
              heure_consultation_raw,
              enregistrement_son,
              remarques_consultations,
              flag_remarques_consultations
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                parse_int(data["Compteur consultation"]),
                compteur,
                parse_int(data["Numéro dossier médical"]),
                parse_int(data["Numéro consultation"]),
                date_consultation,
                date_consultation_raw,
                heure_consultation,
                heure_consultation_raw,
                clean_text(data["Enregistrement son"]),
                clean_text(data["Remarques consultations"]),
                parse_int(data["Flag Remarques consultations"]),
            ),
        )

        count += 1

    return count


def import_consultation_themes(connection):
    path = FILES["consultation_themes"]

    if not path.exists():
        print("Skipping consultation themes: CONSULT_THEME.TXT not found")
        return 0

    expected_header = [
        "Compteur consultation thèmes",
        "Compteur",
        "Numéro dossier médical",
        "Numéro consultation",
        "Titre thème",
        "Ordre Titre",
        "Date thème",
        "Heure thème",
        "Contenu thème",
        "Flag examen",
    ]

    count = 0

    for line_number, header, row in read_csv_rows(path):
        validate_header("consultation_themes", header, expected_header)

        if len(row) != len(header):
            insert_issue(
                connection,
                "consultation_themes",
                path.name,
                line_number,
                None,
                "row",
                str(row),
                f"Expected {len(header)} columns, got {len(row)}",
            )
            continue

        data = dict(zip(header, row))
        record_key = clean_text(data["Compteur consultation thèmes"])

        compteur = parse_int(data["Compteur"])
        numero_dossier = parse_int(data["Numéro dossier médical"])
        numero_consultation = parse_int(data["Numéro consultation"])

        check_patient_exists(connection, "consultation_themes", path.name, line_number, record_key, compteur)

        consultation_exists = connection.execute(
            """
            SELECT 1
            FROM consultations
            WHERE compteur = ?
              AND numero_dossier_medical = ?
              AND numero_consultation = ?
            """,
            (compteur, numero_dossier, numero_consultation),
        ).fetchone()

        if consultation_exists is None:
            insert_issue(
                connection,
                "consultation_themes",
                path.name,
                line_number,
                record_key,
                "consultation_key",
                f"{compteur}/{numero_dossier}/{numero_consultation}",
                "Consultation not found for theme",
            )

        date_theme, date_theme_raw = parse_date_column(
            connection,
            "consultation_themes",
            path.name,
            line_number,
            record_key,
            "Date thème",
            data["Date thème"],
        )

        heure_theme, heure_theme_raw = parse_time_column(
            connection,
            "consultation_themes",
            path.name,
            line_number,
            record_key,
            "Heure thème",
            data["Heure thème"],
        )

        connection.execute(
            """
            INSERT INTO consultation_themes (
              compteur_consultation_themes,
              compteur,
              numero_dossier_medical,
              numero_consultation,
              titre_theme,
              ordre_titre,
              date_theme,
              date_theme_raw,
              heure_theme,
              heure_theme_raw,
              contenu_theme,
              flag_examen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                parse_int(data["Compteur consultation thèmes"]),
                compteur,
                numero_dossier,
                numero_consultation,
                clean_text(data["Titre thème"]),
                parse_int(data["Ordre Titre"]),
                date_theme,
                date_theme_raw,
                heure_theme,
                heure_theme_raw,
                clean_text(data["Contenu thème"]),
                parse_int(data["Flag examen"]),
            ),
        )

        count += 1

    return count


def import_examens(connection):
    path = FILES["examens"]

    if not path.exists():
        print("Skipping examens: EXZAM.TXT not found")
        return 0

    expected_header = [
        "Compteur EXAMENS",
        "Compteur",
        "Numéro dossier médical",
        "Numéro consultation",
        "Numéro examens",
        "Date examens",
        "Heure examens",
        "Titre examens",
        "Conclusion examens",
        "Fait par",
        "Type examen",
    ]

    count = 0

    for line_number, header, row in read_csv_rows(path):
        validate_header("examens", header, expected_header)

        if len(row) != len(header):
            insert_issue(
                connection,
                "examens",
                path.name,
                line_number,
                None,
                "row",
                str(row),
                f"Expected {len(header)} columns, got {len(row)}",
            )
            continue

        data = dict(zip(header, row))
        record_key = clean_text(data["Compteur EXAMENS"])

        compteur = parse_int(data["Compteur"])
        numero_dossier = parse_int(data["Numéro dossier médical"])
        numero_consultation = parse_int(data["Numéro consultation"])

        check_patient_exists(connection, "examens", path.name, line_number, record_key, compteur)

        consultation_exists = connection.execute(
            """
            SELECT 1
            FROM consultations
            WHERE compteur = ?
              AND numero_dossier_medical = ?
              AND numero_consultation = ?
            """,
            (compteur, numero_dossier, numero_consultation),
        ).fetchone()

        if consultation_exists is None:
            insert_issue(
                connection,
                "examens",
                path.name,
                line_number,
                record_key,
                "consultation_key",
                f"{compteur}/{numero_dossier}/{numero_consultation}",
                "Consultation not found for exam",
            )

        date_examens, date_examens_raw = parse_date_column(
            connection,
            "examens",
            path.name,
            line_number,
            record_key,
            "Date examens",
            data["Date examens"],
        )

        heure_examens, heure_examens_raw = parse_time_column(
            connection,
            "examens",
            path.name,
            line_number,
            record_key,
            "Heure examens",
            data["Heure examens"],
        )

        connection.execute(
            """
            INSERT INTO examens (
              compteur_examens,
              compteur,
              numero_dossier_medical,
              numero_consultation,
              numero_examens,
              date_examens,
              date_examens_raw,
              heure_examens,
              heure_examens_raw,
              titre_examens,
              conclusion_examens,
              fait_par,
              type_examen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                parse_int(data["Compteur EXAMENS"]),
                compteur,
                numero_dossier,
                numero_consultation,
                parse_int(data["Numéro examens"]),
                date_examens,
                date_examens_raw,
                heure_examens,
                heure_examens_raw,
                clean_text(data["Titre examens"]),
                clean_text(data["Conclusion examens"]),
                clean_text(data["Fait par"]),
                clean_text(data["Type examen"]),
            ),
        )

        count += 1

    return count


def import_examen_elements(connection):
    path = FILES["examen_elements"]

    if not path.exists():
        print("Skipping examen elements: EXAMSUB.TXT not found")
        return 0

    expected_header = [
        "Compteur EXAMENS SUB",
        "Compteur EXAMENS",
        "Nom élément",
        "Donnée élément",
        "Remarques",
        "Image radio",
        "Résumé radio",
    ]

    count = 0

    for line_number, header, row in read_csv_rows(path):
        validate_header("examen_elements", header, expected_header)

        if len(row) != len(header):
            insert_issue(
                connection,
                "examen_elements",
                path.name,
                line_number,
                None,
                "row",
                str(row),
                f"Expected {len(header)} columns, got {len(row)}",
            )
            continue

        data = dict(zip(header, row))
        record_key = clean_text(data["Compteur EXAMENS SUB"])

        compteur_examens = parse_int(data["Compteur EXAMENS"])

        exam_exists = connection.execute(
            "SELECT 1 FROM examens WHERE compteur_examens = ?",
            (compteur_examens,),
        ).fetchone()

        if exam_exists is None:
            insert_issue(
                connection,
                "examen_elements",
                path.name,
                line_number,
                record_key,
                "compteur_examens",
                str(compteur_examens),
                "Exam not found for exam element",
            )

        connection.execute(
            """
            INSERT INTO examen_elements (
              compteur_examens_sub,
              compteur_examens,
              nom_element,
              donnee_element,
              remarques,
              image_radio,
              resume_radio
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                parse_int(data["Compteur EXAMENS SUB"]),
                compteur_examens,
                clean_text(data["Nom élément"]),
                clean_text(data["Donnée élément"]),
                clean_text(data["Remarques"]),
                clean_text(data["Image radio"]),
                clean_text(data["Résumé radio"]),
            ),
        )

        count += 1

    return count


def print_table_count(connection, table_name):
    count = connection.execute(
        f"SELECT COUNT(*) FROM {table_name}"
    ).fetchone()[0]

    print(f"{table_name}: {count}")


def main():
    if not DB_FILE.exists():
        raise FileNotFoundError(
            "patients.sqlite not found. Run the patient import first."
        )

    connection = sqlite3.connect(DB_FILE)

    create_schema(connection)

    counts = {}

    counts["dossiers"] = import_dossiers(connection)
    counts["consultations"] = import_consultations(connection)
    counts["consultation_themes"] = import_consultation_themes(connection)
    counts["examens"] = import_examens(connection)
    counts["examen_elements"] = import_examen_elements(connection)

    connection.commit()

    connection.execute("PRAGMA foreign_keys = ON")

    print()
    print("Import finished")
    print("----------------")

    for table_name in [
        "patients",
        "dossiers",
        "consultations",
        "consultation_themes",
        "examens",
        "examen_elements",
        "import_issues",
    ]:
        print_table_count(connection, table_name)

    print()
    print("Rows imported in this run")
    print("-------------------------")
    for table_name, count in counts.items():
        print(f"{table_name}: {count}")

    print()
    print("Import issues by table")
    print("----------------------")

    for row in connection.execute(
        """
        SELECT
          table_name,
          COUNT(*) AS issue_count
        FROM import_issues
        GROUP BY table_name
        ORDER BY table_name
        """
    ):
        print(f"{row[0]}: {row[1]}")

    connection.close()


if __name__ == "__main__":
    main()