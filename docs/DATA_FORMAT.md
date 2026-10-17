# Data format

## Data folder

The app reads from `public/<VITE_DATA_DIR>/` (default `public/data/`):

```text
public/data/
  profiles.json
  jane-doe/2025-03-12.csv
  jane-doe/2025-09-18.json
  ...
```

## profiles.json

```json
{
  "profiles": [
    {
      "id": "jane-doe",
      "name": "Jane Doe",
      "match": ["DOE, JANE"],
      "files": ["jane-doe/2025-03-12.csv", "jane-doe/2025-09-18.json"]
    }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique, lowercase letters, digits, `-` or `_`. `unassigned` is reserved. Must equal `profile_id` in the records. |
| `name` | yes | Display name. |
| `files` | no | Paths relative to the data folder. JSON or CSV. May be empty. |
| `match` | no | Names as printed on lab reports. Used only to suggest a profile when a PDF is added. |

## Lab records

Files can be a JSON array of records, a JSON object `{ "records": [...] }`, or CSV with the same column names.

| Field | Required | Example | Notes |
|---|---|---|---|
| `profile_id` | yes | `jane-doe` | Records that do not match the profile are quarantined and never analyzed. |
| `test_name` | yes | `LDL cholesterol` | Mapped to the marker catalog through aliases; unknown names are kept as "Other Tests". |
| `value` | yes | `131` | Number, or text for qualitative results (`NOT DETECTED`). Empty means not available. |
| `unit` | yes | `mg/dL` | Trends only compare values with the same unit. |
| `reference_low` | no | `40` | Lower limit as printed by the lab. |
| `reference_high` | no | `100` | Upper limit as printed by the lab. |
| `collection_date` | yes | `2026-03-20` | `YYYY-MM-DD`. |
| `reference_rule` | no | `lt` | `range`, `lt`, `le`, `ge` or `gt`. Inferred from which limits are present when omitted (`< high`, `≥ low`). |
| `profile_name` | no | `Jane Doe` | Informational. |
| `category` | no | `Cholesterol/Cardiovascular` | Used only when the test is not in the catalog. |
| `status` | no | `HIGH` | Ignored for display; the app recomputes it and reports disagreements in the data quality check. Use `NOT REPORTED` with an empty value for tests the lab skipped. |
| `source` | no | `Lab portal export` | Shown under Sources. |
| `laboratory_name` | no | `Example Clinical Lab` | Shown under Sources. |
| `report` | no | `Lipid panel` | Groups results by report. |
| `notes` | no | `Fasting: yes` | Free text. |
| `previous_value` | no | `148` | Used for the trend only when no earlier record exists. |

### CSV example

```csv
profile_id,test_name,value,unit,reference_low,reference_high,collection_date
jane-doe,LDL cholesterol,131,mg/dL,,100,2026-03-20
jane-doe,HDL cholesterol,61,mg/dL,40,,2026-03-20
```

Quote fields that contain commas (`"Bilirubin, total"`).

## PDF reports

The Add Report tab reads text-based PDFs whose result rows are laid out in columns:

```text
F    TRIGLYCERIDES    171    H    <150 (mg/dL)    EX
```

The leading status letter, the flag and the trailing lab code are optional. Ranges printed on a following line
("Reference range: <100") are picked up and labeled. Scanned image PDFs have no text and cannot be read.
`examples/sample-lab-report.pdf` is a synthetic example.

## Adding a marker

To teach the app a new test, add an entry to `MARKERS` in `src/content/markers.js` with an `id`, `name`,
`short`, `category`, `aliases` and the explanatory text fields. Optional `rule(value, record, pct)` returns a
severity (`watch`, `attention`, `priority`) and `trendDelta` sets the smallest meaningful change.
