# Data format

## Where data comes from

1. **Reports added in the app** (the default). Each report is parsed in the browser. The person is matched by
   the name printed on it, or a new profile is created. Profiles and reports are saved in localStorage.
2. **Bundled files** (optional). Set `VITE_DATA_DIR` to a folder under `public/` that contains a
   `profiles.json` and the files it lists. Those profiles are loaded on every start.
3. **Sample data**. `public/sample-data/` uses the same layout and is shown only when the viewer asks for it.

```text
public/local-data/
  profiles.json
  jane-doe/2025-03-12.csv
  jane-doe/2025-09-18.json
  ...
```

## Profiles created in the app

Stored under the localStorage key `health-insights.profiles.v1` as `{ id, name, match, created_at }`. The id is
derived from the name (`"DOE, JOHN"` becomes `John Doe` with id `john-doe`; duplicates get `-2`, `-3`). The
printed name is kept in `match` so later reports with the same name are suggested for that profile.
Deleting a profile also deletes the reports saved for it.

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
| `id` | yes | Unique, lowercase letters, digits, `-` or `_`. `unassigned` is reserved and ids starting with `sample-` are used by the sample data. Must equal `profile_id` in the records. |
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

## Adding a food

Foods live in `FOOD_CATALOG` in `src/content/foodCatalog.js`. Each entry names a USDA SR28 food by its NDB number
and a serving in grams; the app never stores hand-typed nutrient values.

```js
legume({ id: 'lentils', name: 'Lentils (masoor dal)', emoji: '🍲', ndb: '16070', g: 99, serving: '½ cup cooked',
  ideas: { indian: 'Masoor dal with lemon', western: 'Lentil soup or salad' } }),
```

| Field | Meaning |
|---|---|
| `ndb` | USDA SR28 NDB number. Search the food on the USDA site or in `FOOD_DES.txt`. |
| `g`, `serving` | Grams in one serving and how that serving is described to the user. |
| `diet` | `vegan`, `vegetarian` (contains dairy), `egg`, `fish` (fish or seafood) or `meat`. |
| `cuisine` | `['indian']`, `['western']` or both. Controls the cuisine filter. |
| `allergens` | Any of `dairy`, `egg`, `fish`, `shellfish`, `gluten`, `peanut`, `treenut`, `soy`, `sesame`. |
| `omega3`, `heme` | Optional tags: `'marine'` or `'ala'` omega-3 source; iron from meat, fish or poultry. |
| `mealOnly` | Used inside meals but never suggested on its own (for example white rice in idli). |

After adding a food with a new NDB number, regenerate the nutrient file from the SR28 abbreviated table
(`ABBREV.txt`, from USDA's "sr28abbr" download or the `fda-nutrient-database` npm package):

```bash
npm run foods -- path/to/ABBREV.txt
```

Meals in `src/content/meals.js` list catalog foods and servings, for example `[['moong', 1], ['curd', 0.5]]`.
Their diet, allergens and nutrient score are worked out from those foods.

## Food preferences

Stored under the localStorage key `health-insights.preferences.v1` as an object keyed by profile id:

```json
{ "john-doe": { "diet": "vegetarian", "cuisine": "indian", "avoid": ["peanut"], "hidden": ["chikoo"] } }
```
