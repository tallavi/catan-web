---
name: PausedView JSON editor
overview: Add a Paused-only **Edit save** flow (keyboard **e**) with a JSON editor (syntax highlighting + parse linting + validation via `GameState.tryFromGameSaveData`), then replace the app’s `GameLogic` instance with a newly constructed one, persist to localStorage, and keep the game paused.
todos:
  - id: deps-codemirror
    content: Add CodeMirror 6 / @uiw/react-codemirror dependencies
    status: pending
  - id: game-state-try-from
    content: Add GameState.tryFromGameSaveData (result type, fail-fast one error) + vitest
    status: completed
  - id: json-parse-plain-to-save
    content: JSON.parse + plain object to GameSaveData (reuse/align with GameStorage.deserialize); unknown keys / shape before tryFrom
    status: pending
  - id: storage-json-public
    content: Expose formatted JSON helper on GameStorage for editor seed
    status: pending
  - id: app-replace-gamelogic
    content: App holds GameLogic in state (not useMemo singleton); replace on successful Edit save + persist + pause new instance
    status: pending
  - id: actionbar-cm-focus
    content: Skip ActionBar shortcuts when focus inside .cm-editor
    status: pending
  - id: paused-view-ui
    content: 'PausedView Edit save: ViewMode, Modal, editor, Apply / Cancel(Esc), callback to parent'
    status: pending
isProject: false
---

# PausedView: Edit save (localStorage JSON)

## Progress

- **Done:** `GameState.tryFromGameSaveData` in `[src/core/types/game-state.ts](src/core/types/game-state.ts)` with exported type `GameStateTryFromResult` (`[src/core/index.ts](src/core/index.ts)`). Fail-fast: `errors` has at most one string (constructor / `playTurn` throws). `**tryFrom` does not clone** — it passes `data` straight to `new GameState(data)`; the argument is **mutated like the constructor always has been; on throw, `data` may be inconsistent. Tests: `[src/core/__tests__/game-state.test.ts](src/core/__tests__/game-state.test.ts)`.
- **Not started:** CodeMirror deps, plain→`GameSaveData` pipeline, `GameStorage` JSON helper, App `GameLogic` replacement, ActionBar `.cm-editor` guard, PausedView UI.

## Context

- Save shape is `[GameSaveData](src/core/types/index.ts)`: `players`, `blockedResults`, `gameTurns`; each turn has `turnNumber`, `playerIndex`, `cubes` (`yellowCube`, `redCube`, optional `predetermined`), `eventsCube`, `turnDuration`.
- Persistence: `[GameStorage](src/core/storage.ts)` (`serialize` / `deserialize`, key `catan-game-save`). Serialize is **private**; expose a **public** pretty-print helper (e.g. `GameStorage.toJsonString(data: GameSaveData)`) for seeding the editor.
- `[GameLogic](src/core/game-logic.ts)` constructor: with `initialData` and non-empty turns, initial status is **InProgress** and the turn timer `**resume()`s** (see constructor around lines 56–66). Replacing `GameLogic` after a successful edit must `**pause()**` the **new instance so the user stays paused and `[App](src/components/App/App.tsx)` mode stays `Paused`.
- `[GameState](src/core/types/game-state.ts)` **mutates** the object passed into its constructor (and `**tryFromGameSaveData` mutates the same object**). For **Edit save**, build `GameSaveData` from parsed JSON (disposable) before `tryFrom`; for `**new GameLogic\*\*`, pass data that must not alias the live game instance (e.g. deserialize again from string, or clone only where you need two copies).
- `[ActionBar](src/components/Common/ActionBar/ActionBar.tsx)`: extend focus guard for CodeMirror (e.g. `target.closest('.cm-editor')`).
- `[Modal](src/components/Common/Modal/Modal.tsx)`: existing Space handling; Cancel via Esc as today.

## Feature naming: **Edit save**

- User-facing action label: **Edit save** (shortcut **e** in paused **Normal** mode, in `[PausedView.tsx](src/components/PausedView/PausedView.tsx)`).
- Internal `ViewMode` can stay e.g. `'EditSave'` or align naming with the feature.

## UX

- Modal: large editor, title for **Edit save**, error area under the editor (JSON syntax + validation).
- Action bar: **Apply** (no keyboard shortcut); **Cancel** (`Esc`). Disable **Apply** when JSON/validation fails.

## JSON editor + highlighting

- CodeMirror 6 stack: `@uiw/react-codemirror`, `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-json`, `@codemirror/lint`, optional theme package.
- `jsonParseLinter` for syntax; semantic messages from validation below the editor.

## Validation: `GameState.tryFromGameSaveData`

Implemented on `[GameState](src/core/types/game-state.ts)`:

```ts
export type GameStateTryFromResult =
  | { ok: true; state: GameState }
  | { ok: false; errors: string[] }
```

- **Fail-fast:** at most **one** message in `errors` for now; keep `errors` as `string[]` for future multi-error.
- **Mutates input** `data` (same as constructor); on failure `data` may be inconsistent.
- **Follow-up:** collect more errors inside `GameState` / helpers without changing the result shape.

**Pipeline before / with `tryFrom`:**

1. `JSON.parse` editor text.
2. Plain object → `GameSaveData` (aligned with `[deserialize](src/core/storage.ts)`), optional strict unknown-key checks. Use a **fresh** object for `tryFrom` so the live game is not touched if validation fails mid-mutation.

**Editor rule:** `gameTurns.length >= 1` when applying from pause (document in `tryFrom` or immediately before it).

**Intended rules** (expand over time; many not enforced yet beyond replay throws):

- Root keys only: `players`, `blockedResults`, `gameTurns`.
- Players: non-empty, trimmed non-empty names, unique.
- `blockedResults`: unique ints in 2–12; set ≠ full 2..12.
- Turns: sequential `turnNumber` from 1; circular `playerIndex`; cubes 1–6; `predetermined` if present must be `true`; `eventsCube` 0–3; `turnDuration` ≥ 0.

## Apply flow: **no** `GameLogic.applySaveDataFromEditor`

Do **not** add a mutating apply method on `GameLogic`.

On **Apply** success:

1. `const result = GameState.tryFromGameSaveData(data)` with `data` built from parsed JSON (not the live `gameLogic.state.gameSaveData` reference).
2. If `!result.ok`, show `result.errors` and stop.
3. Extract save payload suitable for persistence and for the constructor (e.g. re-serialize / deserialize, or clone — `result.state.gameSaveData` is the mutated object owned by `state`).
4. `**GameStorage.save(...)**` — required because `[GameLogic](src/core/game-logic.ts)` constructor does **not** call `_save()` when `initialData` is provided; localStorage must be updated explicitly.
5. `**const next = new GameLogic(storageKey, saveData, onGameModeChange)**` — same callback as today (`setGameMode` from App).
6. `**next.pause()**` — new instance starts **InProgress** with a running timer; calling `**pause()**` matches “user was editing while paused” and updates status via `_setStatus` so `**gameMode` stays `Paused**`.
7. Replace the React-owned instance: e.g. `**setGameLogic(next)**` (and ensure `**setOnGameModeChange**` is wired if you create the instance before the effect runs — simplest is passing `setGameMode` into the constructor and not needing a separate effect for the new instance, same as first load).

## App architecture change

Today `[App.tsx](src/components/App/App.tsx)` uses `**useMemo(() => new GameLogic(...), [])**`. That must change so the instance can be replaced:

- Hold `**GameLogic` in `useState**`, with initial value from the same logic as today (storage key, mock flag, `setGameMode`).
- Pass `**setGameLogic**` (or a small `**onEditSaveApplied(save: GameSaveData)**` wrapper) into `**PausedView**` along with `**storageKey**` / `**setGameMode**` as needed.

## `PausedView` wiring

- Open **Edit save**: seed editor from `GameStorage.toJsonString(gameLogic.state.gameSaveData)` (or equivalent).
- **Apply**: parse → `GameSaveData` → `tryFrom` → on success parent replaces `GameLogic` + persist + pause (as above); on failure show errors.
- **Cancel / Esc**: discard, return to Normal paused UI.

## Tests

- **Done:** vitest for `GameState.tryFromGameSaveData` in `[game-state.test.ts](src/core/__tests__/game-state.test.ts)`.
- **Later:** thin tests for parse + plain-to-save if extracted.

## Dependency summary

`@uiw/react-codemirror`, `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-json`, `@codemirror/lint`, optional theme.

```mermaid
flowchart LR
  subgraph ui [PausedView Edit save]
    keyE[key e]
    modal[Modal + CodeMirror]
    apply[Apply]
    keyE --> modal
    modal --> apply
  end
  parse[JSON.parse plus plain to GameSaveData]
  tryFrom[GameState.tryFromGameSaveData]
  save[GameStorage.save]
  newLogic[new GameLogic]
  pauseNew[pause new instance]
  setState[App setGameLogic]
  apply --> parse
  parse --> tryFrom
  tryFrom -->|ok| save
  save --> newLogic
  newLogic --> pauseNew
  pauseNew --> setState
```
