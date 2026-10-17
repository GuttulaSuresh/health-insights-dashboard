# Architecture

## System overview

Health Insights Dashboard is a static single-page application. Vite bundles the React UI and the rule engines into
plain HTML, CSS and JavaScript. At runtime the browser fetches `profiles.json` and the lab files it lists from the
configured data folder, then does all parsing and analysis locally. There is no server component, database,
authentication or third-party API.

```mermaid
flowchart TB
    subgraph Browser
        direction TB
        App[App.jsx<br/>profile + tab state, hash routing]
        subgraph Data
            Loader[loadData.js]
            Manifest[manifest.js<br/>validation]
            Storage[storage.js<br/>localStorage]
            Parser[reportParser.js]
            PdfText[pdfText.js<br/>pdf.js, lazy-loaded]
        end
        subgraph Engine
            Normalize[normalize.js]
            Model[model.js]
            Insights[insights.js]
            Nutrition[nutrition.js]
            QA[qa.js]
        end
        Content[(content/markers.js<br/>content/foods.js)]
        UI[components/*]
    end
    Static[(public/&lt;data dir&gt;/<br/>profiles.json, *.json, *.csv)] --> Loader
    Loader --> Manifest
    App --> Loader
    App --> Storage
    UI -- Add Report --> PdfText --> Parser --> Storage
    Loader --> Model
    Storage --> Model
    Model --> Normalize --> Insights --> Nutrition
    Content --> Normalize
    Content --> Insights
    Content --> Nutrition
    Model --> UI
    QA --> UI
```

## Components and responsibilities

| Module | Responsibility |
|---|---|
| `lib/config.js` | Reads `VITE_DATA_DIR` and the build base path; rejects data folders outside `public/`. |
| `lib/manifest.js` | Validates `profiles.json`: unique lowercase ids, names, relative file paths. |
| `lib/loadData.js` | Fetches the manifest and, on demand, one profile's files. Adapts saved uploads to the same shape. |
| `lib/storage.js` | Saves, lists and deletes reports added in the app (localStorage). Async API so the backend can change. |
| `lib/pdfText.js` | Extracts printed lines from a text-based PDF with pdf.js. Loaded only when a PDF is chosen. |
| `lib/reportParser.js` | Turns report lines into draft records: name, value, flag, range, unit, report title, patient name, date. |
| `lib/normalize.js` | Maps test names to catalog markers, computes status and severity, removes duplicates, builds history and trends, quarantines records for other profiles. |
| `lib/insights.js` | Findings (related tests read together), score, goals, follow-up tests and appointment questions. |
| `lib/nutrition.js` | Ranks foods, limits, swaps, a daily plan and plate proportions from the profile's needs. |
| `lib/qa.js` | Offline rule-based answers for the Ask tab. |
| `lib/model.js` | Assembles one profile's complete model from its files. |
| `content/markers.js` | Marker catalog: aliases, categories, plain-language text and severity rules. |
| `content/foods.js` | Food library, limits, swaps and meal options. |
| `components/` | One React component per tab, plus shared UI primitives in `ui.jsx`. |

## Data flow

1. `App` loads and validates the manifest, then reads saved uploads from storage.
2. When a profile is selected, `loadProfileFiles` fetches only that profile's files.
3. `buildProfileModel(profile, files)` receives that profile's bundled files plus uploads whose `profile_id`
   matches. `normalizeProfileData` quarantines any record with a different or missing `profile_id`.
4. The rule engines run on the normalized records and the UI renders the resulting model.
5. Add Report parses a file into a draft, the user reviews it and picks a profile (or Unassigned), and the saved
   report is merged into that profile's model on the next render. Unassigned reports reach no model.

## Key business rules

- **Status** (High / Low / In range) is computed from the value and the lab's own reference range
  (`computeStatus`). Values are never compared with ranges from another lab or another source.
- **Severity** adds clinical context on top of status via optional `rule` functions in the marker catalog,
  falling back to the distance outside the range. It never turns an in-range value into High or Low.
- **Trends** use only real earlier measurements with the same unit. A change is meaningful when it exceeds the
  marker's `trendDelta`, or 5% when none is defined.
- **Duplicates** are records with the same marker, collection date and value; they are counted once.
- **Profile separation**: every function that builds insights receives one profile's records only.

## Configuration

Configuration comes from Vite environment variables, read at build time (see `.env.example`). `vite.config.js`
also reads `PORT` and `PREVIEW_PORT`. There are no runtime secrets.

## Persistence

- Bundled data: static files under `public/<data dir>/`, read-only at runtime.
- Uploaded reports: localStorage key `health-insights.reports.v1`, an array of report objects. Corrupt values are
  ignored, and saving fails with a readable message when storage is unavailable (for example in some private
  browsing modes).

## Error handling

- Missing or invalid `profiles.json` shows a message naming the file and the setting to check.
- File fetch failures name the file and HTTP status.
- Unknown test names are shown under their file category with generic wording and listed in the data quality
  check rather than dropped.
- Scanned PDFs without text, files that mix several profiles, and unrecognized formats are rejected with an
  explanation before anything is saved.

## Deployment considerations

- `npm run build` produces a static `dist/` folder. With the default `VITE_BASE_PATH=./` it works from any path.
- Everything in `public/` is copied into `dist/`. Build public deployments only with the synthetic sample data.
- If the app is ever hosted for others, localStorage is per browser and per origin; there is no sync or backup.
