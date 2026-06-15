import sqlite3


DB_FILE = "patients.sqlite"


def print_count(connection, table_name):
    count = connection.execute(
        f"SELECT COUNT(*) FROM {table_name}"
    ).fetchone()[0]

    print(f"{table_name}: {count}")


def main():
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row

    print("Table counts")
    print("------------")

    for table_name in [
        "patients",
        "dossiers",
        "consultations",
        "consultation_themes",
        "examens",
        "examen_elements",
        "import_issues",
    ]:
        print_count(connection, table_name)

    print()
    print("Import issues")
    print("-------------")

    for row in connection.execute(
        """
        SELECT
          table_name,
          source_file,
          line_number,
          record_key,
          column_name,
          raw_value,
          issue
        FROM import_issues
        ORDER BY table_name, line_number
        LIMIT 50
        """
    ):
        print(dict(row))

    print()
    print("Example patient with full medical history")
    print("-----------------------------------------")

    compteur = 2655

    patient = connection.execute(
        """
        SELECT
          compteur,
          nom,
          prenom,
          numero_dossier,
          date_naissance
        FROM patients
        WHERE compteur = ?
        """,
        (compteur,),
    ).fetchone()

    print("Patient:")
    print(dict(patient) if patient else None)

    print()
    print("Consultations:")

    for row in connection.execute(
        """
        SELECT
          compteur_consultation,
          numero_dossier_medical,
          numero_consultation,
          date_consultation,
          heure_consultation,
          remarques_consultations
        FROM consultations
        WHERE compteur = ?
        ORDER BY date_consultation, numero_consultation
        """,
        (compteur,),
    ):
        print(dict(row))

    print()
    print("Consultation themes:")

    for row in connection.execute(
        """
        SELECT
          numero_consultation,
          titre_theme,
          ordre_titre,
          date_theme,
          substr(contenu_theme, 1, 120) AS contenu_preview
        FROM consultation_themes
        WHERE compteur = ?
        ORDER BY numero_consultation, ordre_titre
        """,
        (compteur,),
    ):
        print(dict(row))

    print()
    print("Exams:")

    for row in connection.execute(
        """
        SELECT
          compteur_examens,
          numero_consultation,
          numero_examens,
          date_examens,
          titre_examens,
          type_examen
        FROM examens
        WHERE compteur = ?
        ORDER BY date_examens, numero_consultation, numero_examens
        """,
        (compteur,),
    ):
        print(dict(row))

    print()
    print("Exam elements:")

    for row in connection.execute(
        """
        SELECT
          e.compteur_examens,
          s.nom_element,
          s.donnee_element,
          s.resume_radio
        FROM examens e
        JOIN examen_elements s
          ON s.compteur_examens = e.compteur_examens
        WHERE e.compteur = ?
        ORDER BY e.date_examens, e.compteur_examens, s.compteur_examens_sub
        LIMIT 20
        """,
        (compteur,),
    ):
        print(dict(row))

    connection.close()


if __name__ == "__main__":
    main()