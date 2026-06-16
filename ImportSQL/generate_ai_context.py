import json
import sqlite3
import sys
from pathlib import Path


DEFAULT_DB_FILE = Path("access_full.sqlite")
OUTPUT_FOLDER = Path("ai_context_pack")


def quote_identifier(name):
    return '"' + name.replace('"', '""') + '"'


def get_tables(connection):
    rows = connection.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ORDER BY name
        """
    ).fetchall()

    return [row[0] for row in rows]


def get_views(connection):
    rows = connection.execute(
        """
        SELECT name, sql
        FROM sqlite_master
        WHERE type = 'view'
        ORDER BY name
        """
    ).fetchall()

    return [{"name": row[0], "sql": row[1]} for row in rows]


def get_table_columns(connection, table_name):
    rows = connection.execute(
        f"PRAGMA table_info({quote_identifier(table_name)})"
    ).fetchall()

    columns = []

    for row in rows:
        columns.append(
            {
                "cid": row[0],
                "name": row[1],
                "type": row[2],
                "notnull": bool(row[3]),
                "default_value": row[4],
                "primary_key": bool(row[5]),
            }
        )

    return columns


def get_row_count(connection, table_name):
    return connection.execute(
        f"SELECT COUNT(*) FROM {quote_identifier(table_name)}"
    ).fetchone()[0]


def get_create_sql(connection):
    rows = connection.execute(
        """
        SELECT type, name, sql
        FROM sqlite_master
        WHERE type IN ('table', 'view', 'index')
          AND name NOT LIKE 'sqlite_%'
        ORDER BY
          CASE type
            WHEN 'table' THEN 1
            WHEN 'view' THEN 2
            WHEN 'index' THEN 3
            ELSE 4
          END,
          name
        """
    ).fetchall()

    parts = []

    for object_type, name, sql in rows:
        if sql:
            parts.append(sql.strip() + ";")

    return "\n\n".join(parts)


def get_import_column_mappings(connection):
    existing_tables = set(get_tables(connection))

    if "import_columns" not in existing_tables:
        return []

    rows = connection.execute(
        """
        SELECT
          sqlite_table_name,
          column_position,
          original_column_name,
          sqlite_column_name
        FROM import_columns
        ORDER BY sqlite_table_name, column_position
        """
    ).fetchall()

    return [
        {
            "sqlite_table_name": row[0],
            "column_position": row[1],
            "original_column_name": row[2],
            "sqlite_column_name": row[3],
        }
        for row in rows
    ]


def get_import_tables(connection):
    existing_tables = set(get_tables(connection))

    if "import_tables" not in existing_tables:
        return []

    rows = connection.execute(
        """
        SELECT
          source_file,
          original_table_name,
          sqlite_table_name,
          rows_imported,
          rows_skipped,
          encoding,
          imported_at
        FROM import_tables
        ORDER BY sqlite_table_name
        """
    ).fetchall()

    return [
        {
            "source_file": row[0],
            "original_table_name": row[1],
            "sqlite_table_name": row[2],
            "rows_imported": row[3],
            "rows_skipped": row[4],
            "encoding": row[5],
            "imported_at": row[6],
        }
        for row in rows
    ]


def build_context_json(connection):
    tables = get_tables(connection)
    views = get_views(connection)

    table_infos = []

    for table_name in tables:
        table_infos.append(
            {
                "name": table_name,
                "row_count": get_row_count(connection, table_name),
                "columns": get_table_columns(connection, table_name),
            }
        )

    return {
        "database_description": "SQLite migration of old Microsoft Access medical database. Raw tables preserve Access exports. App views expose cleaner medical relationships without enforcing foreign keys.",
        "important_design_notes": [
            "raw_* tables are direct imports from Access TXT/CSV exports.",
            "All raw Access columns are stored mostly as TEXT to preserve old messy data.",
            "app_* views are the recommended interface for application code.",
            "Relationships are expressed in views, not enforced as foreign keys.",
            "Some orphan records are expected because the Access system is old and may contain deleted parent records.",
            "Do not delete orphan rows automatically.",
            "For patient identity, app_patients is the main view.",
            "For consultation history, use app_patient_consultation_history.",
            "For structured prescriptions, use app_prescriptions.",
            "For exams, use app_examens_details.",
            "For billing/acts, use app_actes_details.",
        ],
        "known_logical_relationships": [
            {
                "from": "app_consultations.compteur",
                "to": "app_patients.compteur",
                "meaning": "A consultation belongs to a patient.",
            },
            {
                "from": "app_consultation_themes",
                "to": "app_consultations",
                "columns": [
                    "compteur",
                    "numero_dossier_medical",
                    "numero_consultation",
                ],
                "meaning": "A consultation theme belongs to a specific patient consultation.",
            },
            {
                "from": "app_medicaments_prescrits",
                "to": "app_consultations",
                "columns": [
                    "compteur",
                    "numero_dossier_medical",
                    "numero_consultation",
                ],
                "meaning": "A prescribed medication row belongs to a specific consultation.",
            },
            {
                "from": "app_examens",
                "to": "app_consultations",
                "columns": [
                    "compteur",
                    "numero_dossier_medical",
                    "numero_consultation",
                ],
                "meaning": "An exam belongs to a specific consultation when the consultation exists.",
            },
            {
                "from": "app_examen_elements.compteur_examens",
                "to": "app_examens.compteur_examens",
                "meaning": "An exam element belongs to an exam.",
            },
            {
                "from": "app_actes_honoraires",
                "to": "app_consultations",
                "columns": [
                    "compteur",
                    "numero_dossier_medical",
                    "numero_consultation",
                ],
                "meaning": "An act/billing record belongs to a consultation when the consultation exists.",
            },
            {
                "from": "app_actes_honoraires_sub.compteur_actes_et_honoraires",
                "to": "app_actes_honoraires.compteur_actes_et_honoraires",
                "meaning": "An act/billing sub-row belongs to an act/billing parent row.",
            },
        ],
        "tables": table_infos,
        "views": views,
        "import_tables": get_import_tables(connection),
        "import_column_mappings": get_import_column_mappings(connection),
    }


def write_markdown(context, output_path):
    lines = []

    lines.append("# SQLite Database Context")
    lines.append("")
    lines.append(context["database_description"])
    lines.append("")

    lines.append("## Important design notes")
    lines.append("")
    for note in context["important_design_notes"]:
        lines.append(f"- {note}")
    lines.append("")

    lines.append("## Recommended app views")
    lines.append("")
    lines.append("| View | Purpose |")
    lines.append("|---|---|")
    lines.append("| `app_patients` | Main patient identity/search view |")
    lines.append("| `app_patient_consultation_history` | Patient consultations with themes/clinical notes |")
    lines.append("| `app_prescriptions` | Structured prescribed medications |")
    lines.append("| `app_examens_details` | Exams with exam sub-elements |")
    lines.append("| `app_actes_details` | Acts/honoraires with sub rows |")
    lines.append("")

    lines.append("## Known logical relationships")
    lines.append("")
    for rel in context["known_logical_relationships"]:
        lines.append(f"### {rel['from']} -> {rel['to']}")
        if "columns" in rel:
            lines.append("")
            lines.append("Columns: `" + "`, `".join(rel["columns"]) + "`")
        lines.append("")
        lines.append(rel["meaning"])
        lines.append("")

    lines.append("## Tables and views")
    lines.append("")

    for table in context["tables"]:
        lines.append(f"### `{table['name']}`")
        lines.append("")
        lines.append(f"Rows: **{table['row_count']}**")
        lines.append("")
        lines.append("| Column | Type | Primary key |")
        lines.append("|---|---:|---:|")

        for col in table["columns"]:
            pk = "yes" if col["primary_key"] else ""
            lines.append(f"| `{col['name']}` | `{col['type']}` | {pk} |")

        lines.append("")

    lines.append("## Access-to-SQLite column mappings")
    lines.append("")
    lines.append("The full mapping is in `db_context.json`. Summary below:")
    lines.append("")

    current_table = None

    for mapping in context["import_column_mappings"]:
        table_name = mapping["sqlite_table_name"]

        if table_name != current_table:
            current_table = table_name
            lines.append(f"### `{current_table}`")
            lines.append("")
            lines.append("| Original Access column | SQLite column |")
            lines.append("|---|---|")

        original = mapping["original_column_name"].replace("|", "\\|")
        sqlite_name = mapping["sqlite_column_name"]
        lines.append(f"| `{original}` | `{sqlite_name}` |")

    output_path.write_text("\n".join(lines), encoding="utf-8")


def write_agent_instructions(output_path):
    text = """# Instructions for AI Agent Using This SQLite Database

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
"""
    output_path.write_text(text, encoding="utf-8")


def main():
    if len(sys.argv) == 2:
        db_file = Path(sys.argv[1])
    else:
        db_file = DEFAULT_DB_FILE

    if not db_file.exists():
        raise FileNotFoundError(f"Database not found: {db_file}")

    OUTPUT_FOLDER.mkdir(exist_ok=True)

    connection = sqlite3.connect(db_file)

    try:
        context = build_context_json(connection)

        schema_sql = get_create_sql(connection)

        (OUTPUT_FOLDER / "schema.sql").write_text(schema_sql, encoding="utf-8")

        (OUTPUT_FOLDER / "db_context.json").write_text(
            json.dumps(context, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        write_markdown(context, OUTPUT_FOLDER / "db_context.md")

        write_agent_instructions(
            OUTPUT_FOLDER / "agent_instructions.md"
        )

        print()
        print("AI context pack created")
        print("-----------------------")
        print(f"Folder: {OUTPUT_FOLDER.resolve()}")
        print()
        print("Files:")
        print("  schema.sql")
        print("  db_context.json")
        print("  db_context.md")
        print("  agent_instructions.md")

    finally:
        connection.close()


if __name__ == "__main__":
    main()