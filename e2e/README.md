# End-to-end tests (Playwright)

Browser tests live here. They are **not** part of `npm run check` (Vitest stays fast).

## One-time setup

Install the Chromium build Playwright expects (once per machine / CI image):

```bash
npx playwright install chromium
```

## Run

| Command | Purpose |
|--------|---------|
| `npm run e2e` | Headless; builds the app, starts `vite preview`, runs all specs |
| `npm run e2e:ui` | [UI mode](https://playwright.dev/docs/test-ui-mode) — time travel, pick tests |
| `npm run e2e:debug` | [Debug](https://playwright.dev/docs/debug) — step through with inspector |

Configuration: root [`playwright.config.ts`](../playwright.config.ts) (`baseURL`, `webServer`, Chromium-only project).

**Vitest:** Specs under `e2e/` are excluded in [`vitest.config.ts`](../vitest.config.ts) so `npm run test:run` does not try to run Playwright files.

## Layout

| Path | Role |
|------|------|
| [`fixtures/storage.ts`](fixtures/storage.ts) | `DEFAULT_GAME_STORAGE_KEY` (sync with [`GameStorage.ts`](../src/core/GameStorage.ts)), `registerAppE2EInitScripts` (clear save + fix `Math.random`) |
| [`helpers/actionBar.ts`](helpers/actionBar.ts) | `focusNeutralForActionBar`, `longPress` for ~2s ActionBar buttons |
| [`helpers/setup.ts`](helpers/setup.ts) | SetupView: player names, add player/blocked, **Start** + long-press **Yes** |
| [`helpers/paused.ts`](helpers/paused.ts) | PausedView: pause/resume, **Free Roll** / **Predetermined**, repair **Apply** |
| [`smoke.spec.ts`](smoke.spec.ts) | Fast sanity check |
| [`app-full-flow.spec.ts`](app-full-flow.spec.ts) | Minimal full coordinator journey |
| [`app-extended-flow.spec.ts`](app-extended-flow.spec.ts) | Extended journey (setup edits, ≥2 turns, paused sub-modes, second pause → repair) |

## Concepts (map to this repo)

- **`page`** — One tab; call `registerAppE2EInitScripts(page)` **before** `goto` so scripts run on first load.
- **Locators** — Prefer `getByRole('button', { name: /…/ })` over CSS classes.
- **`webServer`** — Playwright runs `npm run build && vite preview` before tests; you always hit a production build.

### Keyboard vs ActionBar

[`actionBarKeyboard.ts`](../src/components/Common/ActionBar/actionBarKeyboard.ts) ignores shortcuts when focus is in `input`, `textarea`, `select`, or **CodeMirror** (`.cm-editor`). Before **Space**, **e**, or **Enter** shortcuts, call **`focusNeutralForActionBar(page)`** (clicks `.game-view`).

### Long-press

Setup **Yes**, Repair **Apply** / **Cancel**, etc. use ~2s hold (`useLongPress` + CSS). Use **`longPress(locator)`** from [`helpers/actionBar.ts`](helpers/actionBar.ts) (mouse down → `waitForTimeout(2500)` → up). If flakes appear, increase the hold slightly.

## Adding a new spec

1. Create `e2e/my-feature.spec.ts`, `import { test, expect } from '@playwright/test'`.
2. Reuse `registerAppE2EInitScripts` and helpers where possible.
3. Run headed first: `npm run e2e:debug`.

Full architecture notes: [`.cursor/plans/playwright_e2e_learning_plan.md`](../.cursor/plans/playwright_e2e_learning_plan.md).
