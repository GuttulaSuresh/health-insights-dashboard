# Contributing

Thanks for helping improve Health Insights Dashboard. This is a small project, so the process is light.

## Local setup

```bash
git clone https://github.com/GuttulaSuresh/health-insights-dashboard.git
cd health-insights-dashboard
npm ci
npm run dev
```

Node.js 20.19+ or 22.13+ is required. The same commands work in PowerShell, Command Prompt, macOS Terminal and Linux.

## Health data

Never commit, attach or paste real lab results, reports or screenshots that show them, in code, tests, issues or
pull requests. Use the synthetic profiles in `public/sample-data/` or invent new values. `.gitignore` excludes
`public/local-data/` and PDF files for this reason.

## Branches

Create a branch from `main` named after the change:

- `feat/<short-description>` for new features
- `fix/<short-description>` for bug fixes
- `docs/<short-description>` for documentation only

## Coding standards

- Match the surrounding style: ES modules, two-space indentation, single quotes, functional React components.
- Keep `src/lib/` free of browser APIs where possible so the logic stays testable in Node.
  Browser-only code lives in `loadData.js`, `storage.js`, `pdfText.js` and the components.
- Status must always come from the lab's reference range. Clinical context belongs in severity rules.
- Medical wording stays educational: "can be associated with", "may suggest", never a diagnosis.
- Comment business rules and non-obvious behavior, not what the code already says.
- Run `npm run lint` and fix all errors.

## Tests

- Add or update tests in `tests/` for any change to parsing, status, severity, trends, findings or storage.
- Use synthetic fixtures only.
- Run everything CI runs before opening a pull request:

```bash
npm run check
```

## Pull requests

- Keep each pull request focused on one change and describe what a user would notice.
- Include screenshots for UI changes, taken with the sample data.
- Make sure CI is green on all three operating systems.
- Update `README.md` or `docs/` when behavior, configuration or the data format changes.
