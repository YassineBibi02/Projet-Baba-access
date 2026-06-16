import csv
import re
import sqlite3
import sys
import tempfile
import unicodedata
import zipfile
from pathlib import Path


DEFAULT_DB_FILE = "access_full.sqlite"


def normalize_identifier(value):
    value = str(value)

    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))

    value = value.lower()
    value = value.replace("°", "")
    value = value.replace("ø", "")
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = value.strip("_")

    if not value:
        value = "column"

    if value[0].isdigit():
        value = "col_" + value

    return value


def make_unique_identifiers(values):
    result = []
    seen = {}

    for value in values:
        base = normalize_identifier(value)

        if base not in seen:
            seen[base] = 1
            result.append(base)
        else:
            seen[base] += 1
            result.append(f"{base}_{seen[base]}")

    return result


def quote_identifier(value):
    return '"' + value.replace('"', '""') + '"'


def open_text_file(path):
    """
    Access 97 French exports often decode correctly with cp850.
    errors="replace" prevents one bad character from stopping import.
    """
    encodings = ["cp850", "cp437", "cp1252", "utf-8-sig", "latin1"]

    for encoding in encodings:
        try:
            file = path.open(
                "r",
                encoding=encoding,
                errors="strict",
                newline="",
            )
            file.read(4096)
            file.seek(0)
            return file, encoding
        except UnicodeDecodeError:
            continue

    file = path.open(
        "r",
        encoding="cp850",
        errors="replace",
        newline="",
    )
    return file, "cp850-replace"


def create_metadata_tables(connection):
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS import_tables (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_file TEXT NOT NULL,
          original_table_name TEXT NOT NULL,
          sqlite_table_name TEXT NOT NULL,
          rows_imported INTEGER NOT NULL DEFAULT 0,
          rows_skipped INTEGER NOT NULL DEFAULT 0,
          encoding TEXT,
          imported_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS import_columns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sqlite_table_name TEXT NOT NULL,
          column_position INTEGER NOT NULL,
          original_column_name TEXT NOT NULL,
          sqlite_column_name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS import_issues (
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
        """
    )


def clear_metadata_for_table(connection, table_name):
    connection.execute(
        "DELETE FROM import_tables WHERE sqlite_table_name = ?",
        (table_name,),
    )
    connection.execute(
        "DELETE FROM import_columns WHERE sqlite_table_name = ?",
        (table_name,),
    )
    connection.execute(
        "DELETE FROM import_issues WHERE table_name = ?",
        (table_name,),
    )


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


def create_raw_table(connection, table_name, column_names):
    quoted_table = quote_identifier(table_name)

    connection.execute(f"DROP TABLE IF EXISTS {quoted_table}")

    column_definitions = [
        quote_identifier("__id") + " INTEGER PRIMARY KEY AUTOINCREMENT",
        quote_identifier("__source_file") + " TEXT",
        quote_identifier("__line_number") + " INTEGER",
    ]

    for column_name in column_names:
        column_definitions.append(quote_identifier(column_name) + " TEXT")

    connection.execute(
        f"""
        CREATE TABLE {quoted_table} (
          {", ".join(column_definitions)}
        )
        """
    )


def import_one_file(connection, path):
    original_table_name = path.stem
    table_name = "raw_" + normalize_identifier(original_table_name)

    print()
    print(f"Importing: {path.name}")
    print(f"SQLite table: {table_name}")

    file, encoding = open_text_file(path)

    with file:
        reader = csv.reader(file)

        try:
            header = next(reader)
        except StopIteration:
            print("  skipped: empty file")
            return table_name, 0, 1

        if not header:
            print("  skipped: no header")
            return table_name, 0, 1

        column_names = make_unique_identifiers(header)

        clear_metadata_for_table(connection, table_name)
        create_raw_table(connection, table_name, column_names)

        connection.execute(
            """
            INSERT INTO import_tables (
              source_file,
              original_table_name,
              sqlite_table_name,
              rows_imported,
              rows_skipped,
              encoding
            )
            VALUES (?, ?, ?, 0, 0, ?)
            """,
            (
                path.name,
                original_table_name,
                table_name,
                encoding,
            ),
        )

        for index, (original_column, sqlite_column) in enumerate(
            zip(header, column_names),
            start=1,
        ):
            connection.execute(
                """
                INSERT INTO import_columns (
                  sqlite_table_name,
                  column_position,
                  original_column_name,
                  sqlite_column_name
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    table_name,
                    index,
                    original_column,
                    sqlite_column,
                ),
            )

        insert_columns = [
            "__source_file",
            "__line_number",
            *column_names,
        ]

        quoted_columns = ", ".join(
            quote_identifier(column) for column in insert_columns
        )

        placeholders = ", ".join(["?"] * len(insert_columns))

        insert_sql = f"""
        INSERT INTO {quote_identifier(table_name)} (
          {quoted_columns}
        )
        VALUES ({placeholders})
        """

        imported = 0
        skipped = 0

        for line_number, row in enumerate(reader, start=2):
            if not row:
                continue

            if len(row) != len(header):
                insert_issue(
                    connection=connection,
                    table_name=table_name,
                    source_file=path.name,
                    line_number=line_number,
                    record_key=row[0] if row else None,
                    column_name="row",
                    raw_value=str(row),
                    issue=f"Expected {len(header)} columns, got {len(row)}",
                )
                skipped += 1
                continue

            values = [
                path.name,
                line_number,
                *row,
            ]

            connection.execute(insert_sql, values)
            imported += 1

            if imported % 50000 == 0:
                print(f"  imported {imported} rows...")

        connection.execute(
            """
            UPDATE import_tables
            SET rows_imported = ?,
                rows_skipped = ?
            WHERE sqlite_table_name = ?
            """,
            (
                imported,
                skipped,
                table_name,
            ),
        )

        print(f"  done: {imported} rows imported, {skipped} skipped")

        return table_name, imported, skipped


def collect_txt_files(input_path):
    input_path = Path(input_path)

    if input_path.is_file() and input_path.suffix.lower() == ".zip":
        temp_dir = tempfile.TemporaryDirectory()
        extract_path = Path(temp_dir.name)

        with zipfile.ZipFile(input_path, "r") as zip_file:
            zip_file.extractall(extract_path)

        txt_files = sorted(
            [
                path
                for path in extract_path.rglob("*")
                if path.is_file()
                and path.suffix.lower() in [".txt", ".csv"]
            ]
        )

        return txt_files, temp_dir

    if input_path.is_dir():
        txt_files = sorted(
            [
                path
                for path in input_path.rglob("*")
                if path.is_file()
                and path.suffix.lower() in [".txt", ".csv"]
            ]
        )

        return txt_files, None

    raise ValueError("Input must be a .zip file or a folder")


def view_if_table_exists(connection, table_name):
    row = connection.execute(
        """
        SELECT 1
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
        """,
        (table_name,),
    ).fetchone()

    return row is not None


def create_core_views(connection):
    """
    These are app-friendly views over the raw tables.

    They do not enforce relationships.
    They simply expose the known Access relationships in clean SQL form.
    """

    required = [
        "raw_t_fiche_administrative",
        "raw_t_dossier_medical",
        "raw_t_consultations",
        "raw_t_consultations_themes",
        "raw_t_examens",
        "raw_t_examens_sub",
        "raw_t_mv_fiche_medicaments_prescrits",
        "raw_t_actes_et_honoraires",
        "raw_t_actes_et_honoraires_sub",
    ]

    missing = [
        table
        for table in required
        if not view_if_table_exists(connection, table)
    ]

    if missing:
        print()
        print("Some core views were not created because these raw tables are missing:")
        for table in missing:
            print(f"  {table}")
        print()
        return

    connection.executescript(
        """
        DROP VIEW IF EXISTS app_patients;
        DROP VIEW IF EXISTS app_dossiers;
        DROP VIEW IF EXISTS app_consultations;
        DROP VIEW IF EXISTS app_consultation_themes;
        DROP VIEW IF EXISTS app_examens;
        DROP VIEW IF EXISTS app_examen_elements;
        DROP VIEW IF EXISTS app_medicaments_prescrits;
        DROP VIEW IF EXISTS app_actes_honoraires;
        DROP VIEW IF EXISTS app_actes_honoraires_sub;

        DROP VIEW IF EXISTS app_patient_consultation_history;
        DROP VIEW IF EXISTS app_prescriptions;
        DROP VIEW IF EXISTS app_examens_details;
        DROP VIEW IF EXISTS app_actes_details;

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
        """
    )

    print()
    print("Created app views:")
    print("  app_patients")
    print("  app_dossiers")
    print("  app_consultations")
    print("  app_consultation_themes")
    print("  app_examens")
    print("  app_examen_elements")
    print("  app_medicaments_prescrits")
    print("  app_actes_honoraires")
    print("  app_actes_honoraires_sub")
    print("  app_patient_consultation_history")
    print("  app_prescriptions")
    print("  app_examens_details")
    print("  app_actes_details")


def print_final_summary(connection):
    print()
    print("Final import summary")
    print("--------------------")

    rows = connection.execute(
        """
        SELECT
          sqlite_table_name,
          rows_imported,
          rows_skipped,
          source_file
        FROM import_tables
        ORDER BY sqlite_table_name
        """
    ).fetchall()

    total_rows = 0
    total_skipped = 0

    for table_name, rows_imported, rows_skipped, source_file in rows:
        total_rows += rows_imported
        total_skipped += rows_skipped
        print(
            f"{table_name}: {rows_imported} rows"
            f" ({rows_skipped} skipped) <- {source_file}"
        )

    issue_count = connection.execute(
        "SELECT COUNT(*) FROM import_issues"
    ).fetchone()[0]

    print()
    print(f"Total imported rows: {total_rows}")
    print(f"Total skipped rows: {total_skipped}")
    print(f"Total import issues: {issue_count}")


def main():
    if len(sys.argv) not in [2, 3]:
        print("Usage:")
        print("  python import_access_full.py BIBI.zip")
        print("  python import_access_full.py BIBI.zip access_full.sqlite")
        print("  python import_access_full.py C:\\ACCESS_EXPORTS access_full.sqlite")
        sys.exit(1)

    input_path = Path(sys.argv[1])

    if len(sys.argv) == 3:
        db_file = Path(sys.argv[2])
    else:
        db_file = Path(DEFAULT_DB_FILE)

    txt_files, temp_dir = collect_txt_files(input_path)

    if not txt_files:
        raise RuntimeError("No .TXT or .CSV files found.")

    print(f"Found {len(txt_files)} text files.")
    print(f"SQLite database: {db_file}")

    connection = sqlite3.connect(db_file)

    try:
        create_metadata_tables(connection)

        for path in txt_files:
            import_one_file(connection, path)
            connection.commit()

        create_core_views(connection)
        connection.commit()

        print_final_summary(connection)

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()

        if temp_dir is not None:
            temp_dir.cleanup()


if __name__ == "__main__":
    main()