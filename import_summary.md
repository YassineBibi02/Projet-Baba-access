# Patients SQLite import from TXT

Source file: `TABLEP(1).TXT`

## Result

- Imported patient rows: `38541`
- Columns detected per row: `34`
- `compteur` range: `2655` to `41694`
- Duplicate `compteur` values: `0`
- Rows with non-empty notes: `873`
- Import issues stored in `import_issues`: `68`
- First consultation date range: `1970-01-09` to `2026-05-30`

## Important import choices

- The file is comma-separated CSV text with quoted fields.
- Encoding used: `cp1252`, because names and French accents decode correctly with that encoding.
- Dates were normalized to `YYYY-MM-DD` when valid.
- Raw date strings were also preserved in:
  - `date_naissance_raw`
  - `date_premiere_consultation_raw`
- Invalid dates were not guessed. They are stored as `NULL` in the normalized column and listed in `import_issues`.

## Tables

- `patients`
- `import_issues`

## Recommended local application stack

For your case, the practical choice is:

- Electron
- React
- Vite
- TypeScript
- SQLite
- `better-sqlite3`

This stays close to your JavaScript/web-development comfort zone but creates a real local desktop app.
