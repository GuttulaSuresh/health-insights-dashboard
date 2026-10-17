# Tech stack

| Area | Choice | Version | Why |
|---|---|---|---|
| Language | JavaScript (ES modules, JSX) | ES2022+ | Runs unchanged in the browser and in Node for tests and scripts. |
| UI library | React | 18.3.1 | Component model for the eleven tabs; mature and widely known. |
| Build tool and dev server | Vite | 6.4.x | Fast dev server, simple static production build, env variable handling. |
| React integration | @vitejs/plugin-react | 4.7.0 | JSX transform and fast refresh for Vite. |
| PDF parsing | pdfjs-dist (pdf.js) | 4.10.38 | Reads text from PDF reports entirely in the browser; lazy-loaded so it does not slow the first page load. |
| Test runner | Node.js `node:test` | Node 20.19+ | Built in, no extra dependency; the engine modules are pure functions that run in Node. |
| Linting | ESLint + eslint-plugin-react-hooks | 10.x / 7.x | Catches unused code and hook mistakes. |
| CI | GitHub Actions | n/a | Lint, test, data checks and build on Ubuntu, Windows and macOS with Node 20 and 22. |
| Package manager | npm | bundled with Node | `package-lock.json` makes installs reproducible with `npm ci`. |
| Persistence | Browser localStorage | n/a | Keeps uploaded reports and food preferences on the user's device without a server. |
| Nutrient data | USDA SR28 (bundled JSON) | Release 28 | Public-domain nutrient values for every food, so suggestions are computed offline from real numbers. |
| On-device AI (optional) | @mlc-ai/web-llm | 0.2.85 | Runs a small language model in the browser with WebGPU, in a web worker. Lazy-loaded and off by default. |

## Not used

- **No backend, database or cloud services.** All processing happens in the browser.
- **No external APIs or cloud AI services.** The Ask tab is a local rule-based engine; the optional AI runs on
  the device. No API keys are needed.
- **No CSS framework.** Styling is a single hand-written stylesheet (`src/styles.css`) with CSS variables.
- **No TypeScript.** Data shapes are documented in [DATA_FORMAT.md](DATA_FORMAT.md) and JSDoc comments.

## Development tools

- Node.js 20.19+ or 22.13+ (`.nvmrc` pins 22 for nvm users)
- `.editorconfig` and `.gitattributes` keep indentation and line endings consistent across Windows and macOS
