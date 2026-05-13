# Consolidate ESLint + Prettier into the root workspace

## Context

Today every workspace in the monorepo carries its own lint tooling:

- `package/eslint.config.mjs` (full SDK config, uses the legacy `@react-native-community/eslint-plugin@1.3.0` and `@react-native-community/eslint-config@3.2.0`, integrates Prettier via `eslint-plugin-prettier`, lints Markdown).
- `examples/SampleApp/eslint.config.mjs` (lightweight, uses modern `@react-native/eslint-config@0.81.6` — only `jsx-quotes` + `no-inline-styles` customizations).
- `examples/TypeScriptMessaging/eslint.config.mjs` (same lightweight shape, modern `@react-native/eslint-config@0.80.2`).
- `examples/ExpoMessaging`, `package/native-package`, `package/expo-package` — no ESLint config, no scripts.
- Every workspace except the three smallest declares its own copy of `eslint`, `typescript-eslint`, `prettier`, and the React/RN plugins. There is **version drift** (`prettier ^3.5.1` at root vs `^3.5.3` everywhere else; two different RN ESLint config families).

Prettier is already nearly centralized — `.prettierrc` and `.prettierignore` live at the repo root and are referenced by core via `../.prettierrc`. Only the `prettier` binary itself is duplicated.

CI (`.github/workflows/check-pr.yml:33`, `.github/workflows/release.yml:48`) and the pre-commit hook (`dotgit/hooks/pre-commit-format.sh:5-6`) both invoke `yarn lint` at the repo root, which today proxies to `yarn workspace stream-chat-react-native-core lint`.

**Goal:** one shared ESLint config and one Prettier setup, both owned by the root workspace. Sub-workspaces declare zero eslint/prettier dependencies, ship no config files, and the existing `yarn lint` / `yarn lint-fix` / pre-commit hook / CI entry points keep working unchanged.

**User decisions captured in this plan:**

1. Standardize on the modern **`@react-native/eslint-config`** (single version) and drop `@react-native-community/eslint-*`.
2. **Same strictness everywhere** — one shared rule set applied to `package/**` and `examples/**` alike. Expect a one-time wave of fixes/disables in the example apps.
3. **Keep the current Prettier integration**: `eslint-plugin-prettier` + `eslint-config-prettier` inside the ESLint config, and a separate `prettier --list-different` step in the lint script.

## Approach

- Add **one** `eslint.config.mjs` at the repo root, derived from `package/eslint.config.mjs` (full feature set: TS, React, React-Native, import order, Prettier, Jest, Markdown) but with **`@react-native-community/eslint-*` replaced by `@react-native/eslint-config` + `@react-native/eslint-plugin`** and the `globals` parsing logic adapted (the modern config uses `true` instead of `'readonly'` — see `examples/SampleApp/eslint.config.mjs:17-22` for the existing pattern).
- The shared config applies to all source files; **file-glob overrides** keep small workspace-specific behaviors (Jest test files, example apps' lower bar where unavoidable — e.g. ignoring generated files under `examples/*/ios/build/`, Metro/Babel config files).
- Move every eslint/prettier-related devDependency to **root `devDependencies`**. Delete them from sub-workspace `package.json`s. Yarn 4 with `nmHoistingLimits: workspaces` puts root devDeps in `<repo>/node_modules/`, so Node resolution walks up and finds them from any sub-workspace.
- Delete `package/eslint.config.mjs`, `examples/SampleApp/eslint.config.mjs`, `examples/TypeScriptMessaging/eslint.config.mjs`. ESLint flat-config auto-discovery walks up from the cwd until it finds an `eslint.config.mjs`, so a single config at the root covers every workspace.
- Redefine the **root `lint` / `lint-fix` / `eslint` scripts** to do the work in place (instead of proxying to a workspace). New shape:
  - `lint`: `prettier --list-different . && eslint . --max-warnings 0 && yarn workspace stream-chat-react-native-core validate-translations`
  - `lint-fix`: `prettier --write . && eslint . --fix --max-warnings 0`
  - `eslint`: `eslint .`
  - `prettier`: `prettier --list-different .`
  - `prettier-fix`: `prettier --write .`
- The core package keeps its **`validate-translations`** script (it depends on translation files that only exist under `package/src/i18n/`); the new root `lint` script calls into it via `yarn workspace`.
- Sub-workspace `lint`/`eslint`/`lint-fix`/`prettier*` scripts are **deleted** (with one exception: `validate-translations` stays in core).
- The pre-commit hook and the CI workflows already call `yarn lint` from the repo root — no changes needed there.
- `.prettierignore` and `.prettierrc` stay where they are at the root.
- Extend `.prettierignore` to also exclude example app build artifacts that aren't currently listed but will start being scanned once Prettier runs from the root (`examples/*/ios/Pods/`, `examples/*/android/build/`, `examples/*/.expo/`, `examples/SampleApp/patches/` if relevant, etc.). Verify by running `prettier --list-different .` after the move and adding any noisy paths to the ignore file rather than fixing them.

## Files to change

**Add**

- `eslint.config.mjs` — new root flat config (copy of `package/eslint.config.mjs` with modern `@react-native/*` imports + adapted globals parsing + broader `ignores` covering all workspaces' build outputs + example-app overrides if needed).

**Modify**

- `package.json` (root): add eslint/prettier-related devDeps; rewrite `eslint` / `lint` / `lint-fix` scripts; add `prettier` / `prettier-fix` scripts; bump `prettier` to `^3.5.3` to match what core/examples already pin.
- `.prettierignore`: extend with any example-app paths that surface noise once Prettier scans the whole repo.
- `package/package.json`: remove every eslint/prettier-related entry from `devDependencies` (`eslint`, `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-eslint-comments`, `eslint-plugin-import`, `eslint-plugin-jest`, `eslint-plugin-markdown`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-react-native`, `@react-native-community/eslint-config`, `@react-native-community/eslint-plugin`, `prettier`); remove `eslint` / `lint` / `lint-fix` / `prettier` / `prettier-fix` scripts; **keep `validate-translations`**.
- `examples/SampleApp/package.json`: remove eslint/prettier devDeps; remove `lint` / `eslint` / `lint-fix` scripts.
- `examples/TypeScriptMessaging/package.json`: remove eslint/prettier devDeps; remove `lint` script.

**Delete**

- `package/eslint.config.mjs`
- `examples/SampleApp/eslint.config.mjs`
- `examples/TypeScriptMessaging/eslint.config.mjs`

**Unchanged (no edits needed, but verify nothing breaks)**

- `.prettierrc` (already root-owned)
- `.husky/pre-commit` and `dotgit/hooks/pre-commit-format.sh` (call `yarn lint`, which still resolves to the redefined root script)
- `.github/workflows/check-pr.yml`, `.github/workflows/release.yml` (call `yarn lint`)
- `.vscode/settings.json` (only sets `formatOnSave`, picks up root `.prettierrc` automatically)
- `package/.editorconfig`

## Step-by-step migration

1. **Snapshot baseline** — run `yarn lint` on `develop` and save the pass/fail output, so any new errors after the migration are clearly attributable to the new ruleset.
2. **Add root `eslint.config.mjs`** derived from core's. Concretely:
   - Replace `@react-native-community/eslint-config` → `@react-native/eslint-config`, `@react-native-community/eslint-plugin` → `@react-native/eslint-plugin`, and rename the corresponding `plugins` key from `'@react-native-community'` to `'@react-native'`.
   - Adapt the globals reducer (the modern config stores `true`/`false`, not `'readonly'`) — pattern shown in `examples/SampleApp/eslint.config.mjs:17-22`.
   - Broaden the top-level `ignores` to cover every workspace: `node_modules/`, `**/build/`, `**/dist/`, `**/lib/`, `**/.expo/`, `**/vendor/`, `**/ios/build/`, `**/ios/Pods/`, `**/android/build/`, `**/android/app/build/`, `package/src/components/docs/`, plus any Metro-generated dirs in examples.
   - Keep the Jest overlay for `**/__tests__/**`, `**/*.test.*`, and `src/mock-builders/**` (the glob already covers all workspaces; verify with a dry run).
   - If example apps trip new rules that aren't worth fixing immediately, add a third overlay `{ files: ['examples/**/*.{js,ts,tsx,jsx}'], rules: { ... } }` with targeted relaxations. Prefer fixing real issues over piling up disables.
3. **Update root `package.json`**:
   - Add devDeps (versions match what's installed today in core/examples to minimize lockfile churn): `eslint ^9.28.0`, `typescript-eslint ^8.34.0`, `eslint-config-prettier ^10.1.5`, `eslint-plugin-prettier ^5.4.1`, `eslint-plugin-eslint-comments ^3.2.0`, `eslint-plugin-import ^2.31.0`, `eslint-plugin-jest ^28.13.3`, `eslint-plugin-markdown ^5.1.0`, `eslint-plugin-react ^7.37.5`, `eslint-plugin-react-hooks ^5.2.0`, `eslint-plugin-react-native ^5.0.0`, `@react-native/eslint-config ^0.81.6`, `@react-native/eslint-plugin ^0.81.6`. Bump root `prettier` from `^3.5.1` to `^3.5.3`.
   - Rewrite scripts as described in the Approach section.
4. **Strip sub-workspace `package.json`s** of eslint/prettier devDeps and lint scripts. Delete their `eslint.config.mjs` files.
5. **Run `yarn install`** to regenerate `yarn.lock`. Confirm only intended deps moved/were removed.
6. **Run `yarn lint`** from the repo root. Triage:
   - True regressions → fix in code.
   - Stylistic differences from the modern `@react-native/eslint-config` vs the legacy community plugin → reconcile by adjusting the root config rules (favour preserving today's core behavior where it conflicts with the modern defaults).
   - Example-app noise from now-stricter linting → fix or relax via the `examples/**` overlay.
7. **Run `yarn lint-fix`** and re-run `yarn lint`. Expect a clean pass.
8. **Run the pre-commit hook locally** (`./dotgit/hooks/pre-commit-format.sh` after staging a small no-op change) to confirm it still works.
9. **Spot-check editor integration**: open a file in `examples/SampleApp/` in VSCode, save, and confirm Prettier formats it and ESLint diagnostics show up.
10. **Push & verify CI** — `check-pr.yml`'s `yarn lint` step is the canonical signal.

## Verification

- `yarn install --immutable` succeeds after the lockfile regeneration commit is in place.
- `yarn lint` from the repo root exits 0 and reports zero warnings (`--max-warnings 0`).
- `yarn lint` from any sub-workspace directory (`cd examples/SampleApp && yarn lint`) either runs the root script (if we keep a thin proxy) or fails with a clear "no script" message — confirm the chosen behavior is documented.
- `yarn lint-fix` rewrites only intended files; `git status` after a clean checkout + `yarn lint-fix` shows no diff.
- `node -e "require('eslint/package.json').version"` from `examples/SampleApp/` returns the root-installed version (proves hoisting works).
- Pre-commit hook: introduce a deliberate formatting violation in a staged file, attempt `git commit`, confirm it is rejected with the existing message.
- CI: `check-pr.yml` and `release.yml` both green on a draft PR.
- Grep sanity check: `grep -R "eslint-plugin\|@react-native-community/eslint\|@react-native/eslint" package examples` returns no matches in any `package.json` other than the root.

## Risks & mitigations

- **Rule-set drift between legacy and modern RN configs.** The modern `@react-native/eslint-config` ships a different default rule set than `@react-native-community/eslint-config@3.2.0`. Mitigation: derive the root config from the current core config and override modern defaults to match today's behavior wherever they conflict; treat any net-new errors as either a real bug or a targeted disable.
- **Yarn hoisting edge cases.** With `nmHoistingLimits: workspaces`, root devDeps land in `<repo>/node_modules/` and resolve via Node walking up. If a sub-workspace ships its own copy of a peer-dependency that conflicts, ESLint plugin resolution can pick the wrong one. Mitigation: after `yarn install`, run `yarn why eslint` and `yarn why @react-native/eslint-config` and confirm a single instance is hoisted to the root.
- **Different RN versions in examples.** `examples/SampleApp` is on RN 0.81.x; `examples/TypeScriptMessaging` is on RN 0.80.x. We're pinning one `@react-native/eslint-config` version. Lint rules are largely version-agnostic; the worst case is a couple of cosmetic differences that get resolved by `yarn lint-fix`.
- **Markdown linting.** The existing core config keeps `eslint-plugin-markdown` in deps but the active config doesn't actually wire it up as a plugin (the file extension is in the `eslint` glob, not the flat config plugins). Verify whether dropping `eslint-plugin-markdown` entirely is safe; if so, omit it from the root devDeps. (Decision deferred to execution — check by removing the dep, running lint, and seeing if anything regresses.)
- **`enableHardenedMode: true` in `.yarnrc.yml`** means dependency additions are scrutinized. None of the deps we're moving are new to the repo (they all already exist in sub-workspaces), so the audit surface doesn't grow. Lockfile regen should be uneventful.

## Out of scope

- Modernizing the rule set (e.g. enabling new TypeScript strictness rules, tightening `react-hooks/exhaustive-deps` from `warn` to `error`). The migration aims for behavioral parity; rule changes are a follow-up.
- Switching to a separate ESLint config package (e.g. `tooling/eslint-config-stream-chat-rn`). The root-config approach is simpler and matches the "root owns the config" intent. If we ever publish other RN SDKs from this repo, that can be revisited.
- Touching test runners, TypeScript configs, or Husky setup.
