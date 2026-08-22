# GitHub Pages Static Mode Feasibility Report

## Summary

The isolated **GitHub Pages-compatible proof of concept is feasible and has been built on the local branch `migration/github-pages-poc`**. It starts and operates without the Express server, database, OAuth login, Manus runtime, Forge key, platform analytics, or any `/api/trpc` request. The production Manus architecture and its server implementation were not removed or replaced.

The static version deliberately has a **local-first** operating model. A student creates and continues a spiral in browser storage, exports JSON for backup and submission, imports JSON for recovery on another device, generates an `.ics` calendar locally, uses the existing browser print route to save a worksheet as PDF, and uses the three existing standalone tools through static iframe assets.

| Decision area | Static POC outcome |
|---|---|
| Deployment model | Vite static build to `dist-static/`, configured for `/SynthesisLog/` |
| Routing | Hash routing (`#/`, `#/about`, `#/tools/report`) so no server fallback is required |
| Student data | `localStorage` plus JSON import/export; no remote persistence in static mode |
| Authentication | Disabled; static users are anonymous and no OAuth query is made |
| AI | Clearly unavailable until an independently hosted, privacy-reviewed AI gateway is added |
| Calendar | Generated locally in the browser as RFC 5545 `.ics` |
| PDF outcome | Existing print worksheet opens; students choose **Save as PDF** in the browser print dialog |
| Google Sheets | Direct public CSV attempt only; browser CORS restrictions fall back to CSV upload |

## What Was Implemented

The POC adds a build-time `VITE_STATIC_MODE=true` flag through `.env.static`, a separate `vite.static.config.ts`, and `pnpm build:static`. The regular production `vite.config.ts`, Express entry point, database schema, and tRPC procedures remain available for the existing Manus app. The static configuration uses `base: "/SynthesisLog/"`, writes only to the ignored `dist-static/` directory, removes the platform analytics tag from the generated HTML, and does not include the Manus Vite runtime plugin.

Static routing uses Wouter’s hash-location hook. This means a GitHub Pages project site can load the root app at `/SynthesisLog/` and navigate to `#/about` or `#/tools/report` without a server rewrite rule. The three tool wrappers now construct iframe paths from Vite’s base path, preserving their locally packaged standalone HTML, CSS, and JavaScript under the project path.

The main Synthesis Log now recognizes static mode. The authentication query is disabled, the static tRPC client has a disabled sentinel path, AI controls are visibly unavailable, and browser-only saves continue to use the existing localStorage data model. The JSON importer now correctly converts saved `{ text, rating }` entries back into separate reflection text and rating state; this fixed an import defect uncovered during the recovery test. The reflection calendar likewise recognizes both legacy string entries and the current object-based saved format.

The new shared browser-safe `icsCalendar.ts` replaces the need for the server calendar export in static mode. It intentionally avoids Node `Buffer` APIs. The static version of Google Sheets import derives a public CSV export URL and attempts a direct browser fetch. If the Sheet is not published with browser-permitted CORS, the app explains the limitation and directs the student to the existing CSV upload path.

## Files Added or Changed

| Area | Files | Purpose |
|---|---|---|
| Static build and deployment | `.env.static`, `vite.static.config.ts`, `package.json`, `.github/workflows/deploy-static-pages.yml`, `.gitignore` | Isolated build command, `/SynthesisLog/` base path, manual GitHub Pages workflow, generated artifact exclusion |
| Runtime isolation | `client/src/lib/staticMode.ts`, `client/src/main.tsx`, `client/src/_core/hooks/useAuth.ts`, `client/src/App.tsx` | Explicit static flag, disabled auth requests, no unauthorized redirect, hash routing |
| Student workflow | `client/src/pages/SynthesisLog.tsx`, `client/src/components/ReflectionCalendar.tsx`, `client/src/components/ListSelectorMulti.tsx` | Local calendar export, print/PDF fallback, AI unavailable state, durable JSON recovery, CSV and optional direct Sheets behavior |
| Static tools and copy | `client/src/pages/ToolReport.tsx`, `ToolStudentMaker.tsx`, `ToolTeacherBatch.tsx`, `About.tsx` | Base-aware iframe paths and no hard-coded Manus deployment guidance |
| Shared browser helpers and tests | `shared/icsCalendar.ts`, `shared/googleSheetsClient.ts`, `shared/staticBrowserHelpers.test.ts`, `vitest.config.ts` | Browser-safe ICS/CSV behavior and test coverage |
| Test correction | `server/spiralQueue.test.ts` | Corrects a stale wind-down expectation to match the already-correct stage-advancement implementation |

## How to Build and Preview Locally

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build:static
pnpm preview:static --port 4173
```

Open `http://localhost:4173/SynthesisLog/`. The static artifact is generated in `dist-static/`; it is ignored by Git and is uploaded by the workflow instead of being committed.

The included workflow is intentionally **manual only** (`workflow_dispatch`). It will not deploy automatically when the branch is pushed. When GitHub access is enabled and this branch is pushed to the canonical repository, configure the repository’s Pages source to **GitHub Actions**, then run **Build Static GitHub Pages Proof of Concept** from the Actions tab on this branch.

## Test Evidence

| Test | Result | Notes |
|---|---|---|
| `pnpm check` | Passed | TypeScript completed without errors |
| `pnpm test` | Passed | 4 files and 46 tests, including static ICS generation across all 2-, 3-, 4-, and 5-step models plus CSV helper tests |
| `pnpm build:static` | Passed | Built `dist-static/` without starting Express |
| Analytics HTML scan | Passed | No `manus-analytics`, Umami, or website-id tag remained in static `index.html` |
| Browser root load | Passed | Loaded at `/SynthesisLog/` with the production-style static base path |
| Preset spiral workflow | Passed | TOK Spiral selected and started; reflection, rating, and local save worked |
| Local reload | Passed | Spiral, reflection text, rating, and TOK Pathways persisted after refresh |
| JSON recovery | Passed | Storage cleared, exported JSON imported, and all tested text/rating/pathway state restored |
| Calendar export | Passed | `.ics` generated and downloaded in the browser without a server call |
| Print / PDF outcome | Passed | Browser worksheet preview opened and gave a Save-as-PDF path |
| CSV continuation | Passed | A 10-term one-column CSV was parsed locally and added to the active spiral |
| Static tools | Passed | Report Viewer, Student JSON Maker, and Teacher Batch Tool loaded through hash routes |
| Network isolation | Passed | Browser resource log showed no API, OAuth, Forge, Manus, or analytics request after rebuilding |

## Static-Mode Differences and Limits

| Feature | Static POC behavior | Future decision needed |
|---|---|---|
| Login and cross-device account sync | Not present | Add a privacy-reviewed independent auth/data service only if classroom sync is needed |
| AI coach | Disabled and labelled unavailable | Build a server-side AI proxy on Cloudflare Workers, Vercel Functions, or another controlled service; never expose provider keys in the browser |
| Full server PDF report | Print worksheet / Save as PDF | A richer browser-rendered full report can be added later, or retain it as an optional server capability |
| Google Sheets import | Direct public CSV attempt; CSV upload fallback | Validate with an actual school-approved published Sheet and document CORS requirements |
| Database reflection backup | No static dependency | JSON export is the disaster-recovery mechanism; communicate backup expectations to students |
| Large client bundle | Functional but has a Vite chunk-size warning | Code-split the report/diagram-heavy dependencies before broad production use |

## Boundaries Respected

This POC does **not** remove, refactor, or publish the existing production server. It does not modify the database schema, environment variables, OAuth server code, Manus production deployment, or the main branch. The only server-side file touched is an existing test whose expectation had become stale after the previously completed wind-down bug fix. The build artifacts are ignored, and the GitHub Pages workflow requires a deliberate manual run.

The local branch was created successfully, but the session’s GitHub connection was not enabled, so the branch was **not pushed** to `https://github.com/kappter/SynthesisLog`. No GitHub Pages configuration was changed and no public deployment was created.

## Recommended Next Step

Enable GitHub access, push `migration/github-pages-poc` to the canonical repository, set GitHub Pages to use GitHub Actions, and manually run the included workflow. Ask a small group of students to complete the JSON recovery exercise using the staging URL before any decision about a custom domain or independent AI gateway. Keep the current Manus app in place until that test and the backup plan have been accepted.
