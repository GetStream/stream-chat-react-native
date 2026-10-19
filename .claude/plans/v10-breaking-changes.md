# v10 breaking-changes inventory — plan

## Context

v10 moves much of the SDK's state logic into `stream-chat` v10 so it can be shared with `stream-chat-react`. Before release we need one authoritative list of every breaking change to the public API (exported components, props, contexts, hooks, utilities, types, state stores, theme, i18n, peer deps), to drive the migration guide and the docs update.

What exists today:

- v10 code lives on branch **`V10`** (origin/V10 = `c994ffd00`). This worktree's branch sits on `develop` (`42662cdb1`) and contains none of it.
- The running ledger `ai-docs/ai-migration-v9-to-v10.md` exists only on `V10` (~2.7k lines, sections §2–§19 plus Parts I–O). Companions: `ai-docs/channel-state-ui-migration.md`, `ai-docs/i18n-v10-migration.md`, `ai-docs/i18n-v10-key-map.json`.
- LLC guides already exist in `../stream-chat-js/` (`v9-to-v10-migration-guide-client-construction.md`, `…-dates.md`, `react-thread-paginator-migration.md`) — link to them, don't duplicate.
- Docs: `../getstream.io/content/docs/chat-sdk/react-native/v9-latest/` (302 pages; no v10 folder yet).
- Baseline caveats: V10 merges develop via **squash** PRs (#3865), so git ancestry and `develop...V10` three-dot diffs are wrong — compare **tree tips** instead. Three develop commits are not yet in V10 (#3862 host layers, #3863 CI, #3864 RN 0.88/Expo 58); anything only they introduced is filtered out and noted.
- 40 PRs merged into `V10` (plus some direct commits) — the source of behavioral changes and rationale.

Decisions (from user): cover the RN surface **plus** the stream-chat changes an RN integrator hits through the SDK (linking to LLC guides for the rest); **patch the ledger** where it is incomplete or stale; docs impact goes to a **separate report file**, no edits to getstream.io.

## Approach — mechanical diff first, human review second

The ledger was written incrementally by hand, so it is the thing being verified, not the input. Ground truth comes from a type-level diff of the two public surfaces, then commit/PR review catches what types can't see (behavior, defaults, runtime). Two extra **oracles** catch what a surface diff alone misses (see Step 1b).

## Execution order — what runs in parallel

- **Wave A (all concurrent):** both `yarn install`s in the background · 3 PR-review agents (Step 2, need no install) · 1 agent on non-TS surfaces + `examples/` diff + test diffs (Step 1c) · 1 agent extracting `stream-chat-react`'s v10 breaking-change notes for cross-reference.
- **Wave B (concurrent, after installs):** snapshot script in both checkouts · compile-the-v9-app oracle (Step 1b) · LLC type-closure snapshot.
- **Wave C (concurrent):** ledger reconciliation (me, Step 3) · docs-impact scan agent (Step 5) fed the merged item list from Waves A+B.
- **Wave D (sequential):** write the final file, completeness gate, verification.

~5–6 agents total via the Agent tool, run in one message per wave. (A Workflow script could orchestrate the same fan-out deterministically if you'd prefer — say "use a workflow".)

### Step 0 — Setup

- Move this worktree's branch onto `V10` (it has no commits of its own): `git switch -C claude/sdk-v10-breaking-changes-b84ec2 V10`, then `yarn install`.
- Baseline checkout in the scratchpad: `git worktree add <scratchpad>/develop develop` + `yarn install` (needs stream-chat 9.x types, so a separate install is unavoidable).
- Copy this plan into the repo at `.claude/plans/v10-breaking-changes.md` (repo convention).

### Step 1 — Public-surface snapshot (scratchpad script, not committed)

Write `<scratchpad>/api-snapshot.ts` using the TypeScript compiler API (`typescript` is already a dependency). For each entry point — `package/src/index.ts` and `package/src/ai-components/index.ts`, plus the wrapper extras in `package/{native,expo}-package/src/index.js` (`Audio`, `Video`, `FlatList`, …) — it:

- walks `checker.getExportsOfModule()` (following `export *` chains) and records each export's kind: component / hook / function / context / const / type / interface / enum;
- for functions & hooks: parameter names, optionality, types, and return type (`typeToString` with `NoTruncation`);
- for interfaces & type aliases (props, context values, `Theme`, `ComponentOverrides`): **flattened** members via `getPropertiesOfType`, so `Pick<…>`/`Omit<…>`-derived types like `ChannelProps` are compared property-by-property (name, optional, type string); recurse into `Theme` to full depth;
- special-cases `DEFAULT_COMPONENTS` keys and its `icons` map, the `*Translations` / i18n exports, and `state-store` classes (public members).

Emits `snapshot.json`. Run it in both checkouts (`yarn tsx` / `node --experimental-strip-types` from the scratchpad, passing the checkout path as an arg), then a small diff script classifies every change:

- **removed export**, **added export** (non-breaking, tracked for docs),
- **likely rename** (removed+added pairs with similar names/shapes, flagged for confirmation),
- **prop/member removed**, **optional → required**, **type changed** (narrowed/retyped), **signature changed** (params, return type).

Output: `<scratchpad>/surface-diff.md`, grouped by kind. This is the completeness backbone — every breaking line must end up either in the final file or explicitly dismissed (e.g. internal-only, came from develop-only commits).

**LLC type closure.** A prop typed `MessageResponse` prints the same string in v9 and v10 even though stream-chat reshaped it (`.custom`, timestamps). So the snapshot also collects every `stream-chat` type referenced from RN public signatures, snapshots those types (flattened) from stream-chat 9.x vs 10 rc, and flags RN exports whose referenced LLC types changed shape.

### Step 1b — Oracles (catch what the surface diff misses)

- **Compile v9 consumer code against v10.** Copy `develop`'s `examples/SampleApp/src` and `examples/ExpoMessaging` app code into a scratch dir that resolves `stream-chat-react-native` to the V10 checkout and run `tsc --noEmit`. Every error is a break a real integrator hits — cluster errors by symbol and require each cluster to map to an entry.
- **The team's own migration.** `git diff develop V10 -- examples/` is the migration already performed on the sample apps; every changed SDK usage there must map to an entry.
- **Test diffs.** Deleted/rewritten tests under `package/src/**/__tests__` between the tips point at removed behavior; feed them to the Step 2 agents.
- **Deep imports.** The 54 deleted / moved `package/src` files break `stream-chat-react-native-core/src/...` and `lib/...` deep imports; list them (low severity) and check the docs for deep-import paths.
- **Cross-SDK check.** `../stream-chat-react`'s v10/v14 migration notes list the shared LLC-driven changes; anything there that also applies to RN and is missing here gets investigated.

### Step 1c — Non-TS surfaces

Diff directly: `package.json` peer deps / deps (`stream-chat` ^10, new `@stream-io/i18n`, removed `@stream-io/state-store`?), wrapper `package.json`s, native module/Podfile flags, `SqliteClient.dbVersion`, theme generated tokens, i18n keys (already covered by `i18n-v10-migration.md` — cross-link only).

### Step 2 — Behavioral & runtime changes (parallel review)

Types miss default-value changes, removed side effects, moved logic, event semantics. Using `gh pr list --repo GetStream/stream-chat-react-native --base V10 --state merged` (40 PRs) plus direct commits on V10, run **3 parallel Explore/general agents**, each owning a slice of PRs (by area: channel/message-list/paginator & state; composer/attachments/offline/i18n; channel list/threads/connection/config). Each reads PR descriptions + diffs and returns a structured list: `{symbol, v9 behavior, v10 behavior, migration, PR}` for anything not already visible in the type diff (prop defaults, removed side effects, changed callback timing, things that now require `client.config`).

### Step 3 — Reconcile with the ledger

Build a coverage matrix (symbol × ledger §): for every item from Steps 1–2, grep the ledger.

- **Covered** → link the § in the new file.
- **Missing** → add a section to `ai-migration-v9-to-v10.md` in its existing style (Problem / Before / After / Detection; renames as bullets, not tables — per the ai-docs convention).
- **Stale** (ledger claims a removal/rename the diff doesn't confirm, or the replacement API changed again later, e.g. paginator follow-ups) → fix in place.
- Also fix the ledger's ordering quirks (e.g. §K.8 before §K.6, two "§13.1") only if trivially safe; otherwise leave.

### Step 4 — Write `ai-docs/v10-breaking-changes.md`

Source of truth for docs/migration authors (human + agent readable). Structure:

1. Scope & how it was produced (baseline `develop@<sha>` vs `V10@<sha>`, regeneration recipe pointing at the snapshot approach).
2. Dependencies & platform (stream-chat v10, peer deps, native/Expo, offline DB version bump).
3. One section per surface kind — Components & props · `<Channel>` / `<Chat>` / `<ChannelList>` props · Contexts (removed contexts, removed/retyped context fields) · Hooks · Utilities & functions · Types · State stores · `WithComponents` slots & icons · Theme · i18n (summary + link to `i18n-v10-migration.md`).
4. stream-chat changes an RN integrator hits (custom fields under `.custom`, timestamps, `client.config`, connection recovery, `channel.state`, OfflineDB APIs) — short entries linking to the LLC guides.
5. Behavioral changes (no symbol change).
6. Additive APIs worth documenting (from "added exports") — kept brief, needed for the docs update.

Each entry, as bullets: **symbol** — what changed (v9 → v10) — replacement / migration one-liner — ledger § link — PR #.

### Step 5 — Docs impact report `ai-docs/v10-docs-impact.md`

Script over `getstream.io/content/docs/chat-sdk/react-native/v9-latest/**`: for every removed/renamed/retyped symbol and removed prop name from the final list, grep page bodies, code fences and import lines (word-boundary match; prop names matched in context of their component to avoid noise like `channel`). Then manually triage hits. Report:

- per page: breaking items referenced + what must change (rewrite / delete section / update snippet);
- pages to delete outright (e.g. docs for removed contexts like `TypingContext`, `PaginatedMessageListContext`), pages needing new content (paginator, `client.config`, `channel.state`), and the migration-guide page to create (`06-migration-guides/…upgrading-from-v9`);
- summary counts so the docs effort can be sized.

## Critical files

- Read: `V10:ai-docs/ai-migration-v9-to-v10.md`, `package/src/index.ts`, `package/src/ai-components/index.ts`, `package/src/contexts/componentsContext/defaultComponents.ts`, `package/{native,expo}-package/src/index.js`, `package/package.json`, `package/src/store/SqliteClient.ts`
- Write: `ai-docs/v10-breaking-changes.md` (new), `ai-docs/v10-docs-impact.md` (new), `ai-docs/ai-migration-v9-to-v10.md` (patched), `.claude/plans/v10-breaking-changes.md` (plan copy)
- Scratch only: snapshot/diff scripts and their JSON/MD output.

## Verification

- Oracle gate: every `tsc` error cluster from compiling the v9 sample apps against V10, and every SDK-usage change in the `examples/` diff, maps to an entry (target: 0 unmapped).
- Completeness gate: every line in `surface-diff.md` classified as breaking is mapped to an entry in `v10-breaking-changes.md` or listed in a "dismissed" appendix with a reason — the script re-runs and reports unmapped symbols (target: 0).
- Spot-check 10 random entries against the code on `V10` (symbol really gone / retyped as stated).
- Every replacement API named in the file exists in `V10` exports (`grep` against the V10 snapshot).
- `yarn lint` passes (prettier on the new markdown).
- Nothing committed without showing the diff and getting approval.
