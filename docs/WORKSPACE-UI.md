# Workspace UI

Refine the existing CPA Tools workspace, not its authentication or data model. Website audit remains the landing route. Release workflow starts expanded; Google tools remain external links. New layout work uses Tailwind utilities. Domain report bodies retain their evidence and coverage distinctions.

## Direction contract

THESIS: A compact tool workbench brings the task ahead of promotional headlines. Audit, smoke testing, histories and train lookup share the same reading rhythm.

OWN-WORLD: Preserve navy navigation, white content, blue actions and cyan navigation accents. Use readable system typography, restrained 12px corners and single-border panels.

STORY: Find the tool, choose its scope, run it, then inspect evidence and limitations. Histories offer search and a clear route back to running a check.

FIRST VIEWPORT: Persistent navigation and account at the top, a white commute strip, then a compact task heading and the working form. Primary actions remain visible without a marketing hero. Mobile uses a keyboard-contained toolbox drawer.

FORM: Local refinement of the established workspace, with user-pinned navy/white branding; no new identity or concept seed. Signature interaction is persistent tool navigation with explicit active states; motion is limited to control feedback and reduced-motion-aware progress.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Browser verification

On Windows with Microsoft Edge installed, run an isolated build and the synthetic UI check:

```powershell
$env:CPA_TOOLS_BUILD_DIR='.next-workspace-check'
npm run build
node scripts/verify-workspace-ui.cjs
```

The check launches its own production server on port 3109, uses a short-lived synthetic session, mocks audit/smoke mutations and daily-brief/account responses, and writes only disposable browser records and ignored screenshots under `.impeccable/review/`. It does not send Telegram messages or perform real audits. Metro SSR may read official transport data; unavailable data is also a valid inspected state. Browser and test server close afterward; leave the normal development server running. Checks cover five routes, persistent chrome, mobile overflow/focus, populated histories, URL pagination/filtering and loading/error/report states. Restore Next.js-generated verification-directory references in `next-env.d.ts`/`tsconfig.json` after an isolated build.

## Finish record

2026-09-16: typecheck, isolated build, 44 tests and the 17-capture browser check passed. Independent specification-based review requested three mobile layout corrections plus documentation evidence; the subsequent verdict scored all four resolved (`ship` at that fix-list scope). DESIGN.md and its schemaVersion 2 sidecar describe the finished shared system. Unchanged detailed audit styles and native-control/motion drift are explicitly not a completed whole-site Tailwind/accessibility migration.
