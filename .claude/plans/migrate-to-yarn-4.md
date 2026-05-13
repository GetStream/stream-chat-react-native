# Migrate stream-chat-react-native to Yarn 4 + native workspaces

> Note: per user's stored preference, plans normally live in the repo's `.claude/plans/`. Plan mode required writing here. The executing agent should copy this file into the repo (e.g. `.claude/plans/migrate-to-yarn-4.md`) before starting.

## Context

The repo currently uses **Yarn 1.22.22 + Lerna v4** with **seven separate `yarn.lock` files** (root, `package/`, `package/native-package/`, `package/expo-package/`, and the three apps under `examples/`). The example apps wire the SDK in via `link:../../package/...` and rely on per-app `metro.config.js` extraNodeModules/blockList workarounds. There's a partial Berry-style `.yarnrc.yml` already, but `yarnPath` still points at the v1 binary and the lockfiles are v1 format.

This migration is **tooling-only**: bump Yarn to v4, declare native workspaces, drop Lerna, consolidate lockfiles, lock down with full hardening. No dependency upgrades. The v1 lockfile is migrated **in place** via `yarn install` so resolutions don't drift; we'll only add `resolutions` entries if verification surfaces a real break.

User decisions captured before planning:
1. **Drop Lerna entirely** — replace with `yarn workspaces foreach`. Rework `release/release.config.js` to not read from `lerna.json`.
2. **All three examples become workspaces** — `SampleApp`, `ExpoMessaging`, `TypeScriptMessaging`.
3. **Full hardening in this PR** — `enableHardenedMode`, `enableScripts: false` with a `dependenciesMeta` whitelist for native build scripts, `npmMinimalAgeGate`, `nmMode: hardlinks-global`.
4. **Migrate lockfile in place** — `yarn install` translates v1 → v8 format without changing resolutions. Pin only if verification breaks.

Repo conventions to honor: Conventional Commits (commitlint enforced), branches target `develop`, never force push, never commit without explicit confirmation, `yarn shared-native:sync` copies `package/shared-native/` into native- and expo-package sources before each example build, husky v6 with hooks in `.husky/`. PRs go through `.github/actions/install-and-build-sdk/action.yml`.

## Strategy

Land the migration as a sequence of small, individually-green commits. CI must stay green at every commit; in particular, the commit that introduces the `workspaces` field, deletes nested lockfiles, and rewrites the composite action is atomic — those three can't be split.

The riskiest commit is dropping Lerna (the release pipeline reads `lerna.json`'s `packages` array). That commit is gated behind a dry-run of `yarn release` against a fork branch before merging. Full hardening lands last so the rest is stable before we layer in `enableScripts: false` (which is the most likely source of "huh, that suddenly stopped working" reports).

## Commit sequence

### Commit 1 — `chore(yarn): upgrade to yarn 4 binary and migrate lockfiles`

- Download `yarn-4.x.y.cjs` (latest stable 4.x; e.g. 4.x ≥ 4.10) and commit to `.yarn/releases/yarn-4.x.y.cjs`.
- Delete `.yarn/releases/yarn-1.22.22.cjs`.
- Update `.yarnrc.yml`: change `yarnPath` to the new file. **Don't add hardening flags yet** — keep this commit focused.
- Update root `package.json` `packageManager` field to `yarn@4.x.y`.
- Run `yarn install` at every yarn-lock location to migrate v1 → v8 in place: root, `package/`, `package/native-package/`, `package/expo-package/`, `examples/SampleApp/`, `examples/ExpoMessaging/`, `examples/TypeScriptMessaging/`. Each lockfile rewrites with the same resolutions in the new format.
- Add `.gitattributes` line marking `.yarn/releases/*.cjs binary` if not already present.

**Verify:**
- `yarn --version` prints 4.x at root and in every nested dir
- `yarn install --immutable` in each lock location is a no-op
- `cd package && yarn build` succeeds
- `cd package && yarn test:unit` passes
- `cd package && yarn lint` passes
- `cd examples/SampleApp && yarn react-native --version` resolves
- CI on this commit passes (the composite action's `yarn --frozen-lockfile` still works — Yarn 4 accepts it with a deprecation warning)

### Commit 2 — `feat(repo): declare yarn workspaces and convert link protocols`

This is the structural commit. Atomic: don't split.

- Root `package.json`: add `"workspaces": ["package", "package/native-package", "package/expo-package", "examples/SampleApp", "examples/ExpoMessaging", "examples/TypeScriptMessaging"]`.
- `examples/SampleApp/package.json`, `examples/ExpoMessaging/package.json`, `examples/TypeScriptMessaging/package.json`: replace
  - `"stream-chat-react-native-core": "link:../../package"` → `"stream-chat-react-native-core": "workspace:^"`
  - `"stream-chat-react-native": "link:../../package/native-package"` → `"stream-chat-react-native": "workspace:^"` (where applicable)
  - `"stream-chat-expo": "link:../../package/expo-package"` → `"stream-chat-expo": "workspace:^"` (ExpoMessaging only)
- `package/native-package/package.json` and `package/expo-package/package.json`: change `"stream-chat-react-native-core": "8.1.0"` → `"workspace:^"`. Yarn rewrites this to the literal version during `yarn pack` so published artifacts are unaffected.
- Delete the six nested `yarn.lock` files (keep only the root): `package/yarn.lock`, `package/native-package/yarn.lock`, `package/expo-package/yarn.lock`, `examples/SampleApp/yarn.lock`, `examples/ExpoMessaging/yarn.lock`, `examples/TypeScriptMessaging/yarn.lock`.
- `.github/actions/install-and-build-sdk/action.yml`: collapse the four install steps to a single step: `yarn install --immutable`. Drop all `cd` blocks.
- Run `yarn install` at root to regenerate the consolidated lockfile.

**Don't touch `metro.config.js` files.** Their `extraNodeModules` + `blockList` + `watchFolders` machinery is independent of the Yarn protocol; switching `link:` → `workspace:^` leaves them functional. Metro simplification is a separate follow-up.

**Verify:**
- `yarn install --immutable` clean
- `yarn workspaces list` shows all six workspaces
- `yarn workspace stream-chat-react-native-core build` produces `package/lib`
- `yarn workspace stream-chat-react-native-core test:unit` passes (uses `TZ=UTC` via existing script)
- `yarn workspace stream-chat-react-native-core lint` passes
- `cd examples/SampleApp && yarn react-native start --reset-cache` — Metro resolves `stream-chat-react-native-core` from `package/src/` (verified by adding a console.log to `package/src/index.ts` and confirming the example app sees it)
- iOS pod install in `examples/SampleApp/ios/` still works after `yarn install`
- Same Metro start check for `examples/ExpoMessaging` and `examples/TypeScriptMessaging`

### Commit 3 — `fix(examples): move sync-native off preinstall`

- `examples/SampleApp/package.json`: remove `"preinstall": "yarn sync-native"` (keep `preandroid`, `preios`, `prestart`, and the `sync-native` script itself).
- Same in `examples/ExpoMessaging/package.json` and `examples/TypeScriptMessaging/package.json`.
- Root `package.json`: add `"postinstall": "yarn workspace stream-chat-react-native-core shared-native:sync"`.
- `package/package.json`: remove the `install-all` script (predates workspaces — no longer needed).

**Why:** child-workspace `preinstall` scripts can fire unpredictably under Yarn 4. Moving the sync into a root `postinstall` (which always runs) plus keeping the `preandroid`/`preios`/`prestart` belt-and-suspenders gives the same guarantee with one less moving part.

**Verify:**
- `rm -rf node_modules package/**/node_modules examples/*/node_modules && yarn install` populates `package/native-package/src/` and `package/expo-package/src/` with shared-native files
- `cd examples/SampleApp && yarn android` (or at minimum `yarn preandroid`) runs the sync again

### Commit 4 — `chore(scripts): migrate routine scripts off lerna to yarn workspaces`

This is the **non-release** half of the Lerna removal. Releases still go through Lerna in this commit.

In root `package.json`, replace these scripts (each currently `yarn lerna-workspaces run <x>`):
- `bootstrap` → remove (just an alias for `lerna bootstrap`, which is now redundant under workspaces)
- `eslint`, `lint`, `lint-fix`, `build`, `test:coverage`, `test:unit` → `yarn workspaces foreach -A --topological-dev --no-private --include 'stream-chat-react-native-core' --include 'stream-chat-react-native' --include 'stream-chat-expo' run <task>`

`release`, `release-next`, `extract-changelog` stay on Lerna for now (next commit handles them).

Keep `lerna-workspaces` script as an alias for `lerna` (still invoked by the release scripts).

**Verify:**
- `yarn lint`, `yarn build`, `yarn test:unit` all produce identical results to before
- CI passes — none of the migrated scripts were called by the composite action, so no CI changes needed

### Commit 5 — `feat(release): replace lerna with yarn workspaces foreach in release pipeline`

This is the **risky** commit. Dry-run on a fork branch before merging to `develop`.

- `release/release.config.js`: replace `const lernaPackage = require('../lerna.json'); ... workspaces: lernaPackage.packages` with a hardcoded array `workspaces: ['package', 'examples/SampleApp']` (the same set that was in `lerna.json`). This decouples release config from Lerna.
- Verify `release/monorepo-setup.js` still consumes `workspaces` from the resolved config — should be transparent.
- Root `package.json`:
  - `release`: `yarn workspaces foreach -A --topological-dev --include 'stream-chat-react-native-core' --include 'sampleapp' run release`
  - `release-next`: `yarn workspaces foreach -A --topological-dev --include 'stream-chat-react-native-core' --include 'sampleapp' run release-next`
  - `extract-changelog`: `rm -rf NEXT_RELEASE_CHANGELOG.md && yarn workspaces foreach -A --topological-dev --include 'stream-chat-react-native-core' --include 'sampleapp' run extract-changelog`
- Remove `lerna-workspaces` script.
- Delete `lerna.json`.
- Remove `lerna` from root `package.json` `devDependencies`.

**Verify:**
- Dry-run on a throwaway branch: push a `chore:` commit, watch `release.yml` execute against a dummy npm registry (e.g. set `NPM_TOKEN` to a no-op), confirm `semantic-release` produces the same plan (changelog/tag) as before.
- Inspect `git log --grep 'chore(release)'` on the dry-run to confirm tag format matches `stream-chat-react-native-core@vX.Y.Z` and `sampleapp@vX.Y.Z` patterns.
- `yarn extract-changelog` (locally) produces a `NEXT_RELEASE_CHANGELOG.md` that matches the previous output.

### Commit 6 — `chore(husky): clean up legacy v4 husky config`

- Root `package.json`: remove the `"husky": { "hooks": {...} }` block (Husky v6 silently ignores it; it's misleading).
- Root `package.json`: add `"prepare": "husky install"` to `scripts`. In Yarn Berry, `prepare` is **not** run on install — but `husky install` only sets `core.hooksPath`, which only needs to happen once per clone. Add `"postinstall": "husky install && yarn workspace stream-chat-react-native-core shared-native:sync"` to make hooks register on fresh clones too. (Combining the husky install with the existing postinstall from commit 3.)
- `.husky/pre-commit` and `.husky/commit-msg` stay as-is.

**Verify:**
- Fresh clone: `rm -rf .git/hooks && yarn install` → `.git/hooks/pre-commit` is now a stub that routes to `.husky/pre-commit`
- `git commit --allow-empty -m "test: hook fires"` triggers the format and reject-binaries hooks

### Commit 7 — `chore(yarn): enable hardened mode and supply-chain settings`

Extend `.yarnrc.yml`:

```yaml
nmHoistingLimits: workspaces       # already present, keep
nodeLinker: node-modules           # already present, keep
yarnPath: .yarn/releases/yarn-4.x.y.cjs  # already updated in commit 1
npmPublishProvenance: true         # already present, keep

# New:
enableHardenedMode: true
enableTelemetry: false
enableGlobalCache: true
nmMode: hardlinks-global
npmMinimalAgeGate: "3d"
```

**Verify:**
- `yarn install --immutable` succeeds without integrity errors
- No `dangerouslyIgnoreUnsafeReleaseScripts`-style flags added

### Commit 8 — `chore(yarn): disable install scripts and whitelist required packages`

Add `enableScripts: false` to `.yarnrc.yml`.

Run `yarn install` and capture every "build script was skipped" warning. Add a `dependenciesMeta` block in root `package.json` whitelisting each package the codebase actually depends on at runtime/build time. Start with the likely-required set and expand based on warnings:

```json
"dependenciesMeta": {
  "react-native": { "built": true },
  "react-native-reanimated": { "built": true },
  "react-native-worklets": { "built": true },
  "react-native-screens": { "built": true },
  "react-native-gesture-handler": { "built": true },
  "@op-engineering/op-sqlite": { "built": true },
  "react-native-nitro-modules": { "built": true },
  "react-native-nitro-sound": { "built": true },
  "react-native-svg": { "built": true },
  "react-native-video": { "built": true },
  "@react-native-firebase/app": { "built": true },
  "@react-native-firebase/messaging": { "built": true },
  "@notifee/react-native": { "built": true },
  "husky": { "built": true },
  "esbuild": { "built": true },
  "@parcel/watcher": { "built": true }
}
```

Iterate: run `yarn install` → fix warnings → run `yarn workspace sampleapp android` / `yarn workspace sampleapp ios` / `yarn workspace expomessaging start` → fix any "module not found" or "native module not linked" errors by whitelisting more packages.

**Verify:**
- `yarn install` produces no "build script was skipped" warnings for packages the apps need
- Full build + run-android + run-ios pass for SampleApp
- Full build + Metro start pass for ExpoMessaging and TypeScriptMessaging
- `yarn workspace stream-chat-react-native-core build` produces the same `lib/` output as on `develop` (compare with `diff -r`)

### Commit 9 — `ci: cache yarn berry artifacts in github actions`

- `.github/workflows/check-pr.yml`, `.github/workflows/release.yml`, `.github/workflows/sample-distribution.yml`, `.github/workflows/sdk-size-metrics.yml`: in each `actions/setup-node@v6`, add:
  ```yaml
  cache: 'yarn'
  cache-dependency-path: 'yarn.lock'
  ```
  (Already present in `sdk-size-metrics.yml` — verify it still points at root lockfile.)
- `.github/workflows/changelog-preview.yml`: collapse the four `yarn --frozen-lockfile` invocations (root, package, native-package, examples/SampleApp) into a single root `yarn install --immutable`.
- Globally: replace any remaining `yarn --frozen-lockfile` with `yarn install --immutable`. (`--frozen-lockfile` still works as a deprecated alias but raises a warning.)

**Verify:**
- Push to branch, observe CI hits the Yarn cache (look for "Cache hit" in setup-node logs)
- All workflows pass

### Commit 10 — `docs: document yarn 4 + workspaces setup`

Update:
- `README.md`: replace `cd package && yarn build` etc. with root-workspace commands.
- `CONTRIBUTING.md` (and `RELEASE_PROCESS.md` if it exists): note that the repo uses Yarn 4 via a committed binary (`.yarn/releases/yarn-4.x.y.cjs`), no Corepack required, any globally-installed Yarn launcher delegates via `yarnPath`. Replace install instructions to be root-level (`yarn install`).
- `CLAUDE.md` (this file is in the repo root, not the user's global): update the "Common Commands" section to reflect workspaces. Replace `cd package && yarn lint` with `yarn workspace stream-chat-react-native-core lint`. Replace `yarn install --frozen-lockfile` with `yarn install --immutable`. Note Lerna is gone.
- `examples/*/README.md` (if present): replace per-app install instructions with the root flow.

**Verify:** manual read-through; no broken links to `lerna.json` etc.

## Critical files

- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/package.json` — packageManager, workspaces, scripts, husky, postinstall, dependenciesMeta
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/.yarnrc.yml` — binary path, hardening
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/lerna.json` — deleted in commit 5
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/release/release.config.js` — workspaces source decoupled from lerna.json (commit 5)
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/.github/actions/install-and-build-sdk/action.yml` — single install step (commit 2)
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/.github/workflows/changelog-preview.yml` — collapse four installs to one (commit 9)
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/examples/SampleApp/package.json` — `workspace:^`, drop preinstall, scripts (commits 2, 3)
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/examples/ExpoMessaging/package.json` — same
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/examples/TypeScriptMessaging/package.json` — same
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/package/package.json` — drop `install-all`
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/package/native-package/package.json` — `workspace:^` for core dep
- `/Users/oliverlaz/w/repos/stream-chat-sdks/stream-chat-react-native/package/expo-package/package.json` — `workspace:^` for core dep

Existing helpers to reuse (don't re-implement):
- `package/scripts/sync-shared-native.sh` — the shared-native sync (already wired to `package/package.json` script `shared-native:sync`). Root postinstall just shells out to it via `yarn workspace stream-chat-react-native-core shared-native:sync`.
- `release/monorepo-setup.js` and `release/prod.js`/`release/next.js` — keep as-is, just change `workspaces` source in commit 5.
- `@rnx-kit/metro-config` `resolveUniqueModule` — already used by every example's `metro.config.js`; the workspace migration doesn't disturb this and it's the right RN-monorepo pattern.

## Drift handling (only if needed)

The "migrate in place" strategy means resolutions stay identical — there's nothing to pin. But if commit 8's full hardening surfaces an integrity mismatch for a package, the response is **not** to add `dangerouslyIgnoreUnsafeReleaseScripts`; instead investigate `yarn why <pkg>` and pin a known-good version via `resolutions` in root `package.json` with a comment explaining the symptom. Land any such pins as a separate `chore(deps): pin <pkg> after hardening surfaced <issue>` commit.

## Verification checklist (before opening the PR)

- [ ] `yarn --version` → `4.x`
- [ ] `yarn install --immutable` on a clean checkout → no lockfile changes
- [ ] `yarn lint` / `yarn build` / `yarn test:unit` → same status as `develop`
- [ ] `yarn workspace stream-chat-react-native-core build` output `package/lib/` byte-equivalent to `develop` (diff-recursive)
- [ ] No `yarn.lock` outside the repo root
- [ ] No `link:` protocol anywhere (grep `package.json` files)
- [ ] No `lerna` reference anywhere (grep workflow yaml, package.json scripts, release/*)
- [ ] Husky hooks fire on a test commit
- [ ] For each example: `yarn install`, Metro starts, dev build succeeds. SampleApp: iOS+Android build succeeds.
- [ ] CI green on the PR branch
- [ ] Release dry-run on a throwaway branch produces the same tags/changelog as the previous Lerna-driven run

## Constraints (from user + global preferences)

- No force pushing. New commit > amend + force.
- No commits without explicit user confirmation. Stage, show diff summary, wait for approval.
- Don't bundle dependency upgrades into this PR. Migration is tooling-only.
- Don't introduce `dangerouslyIgnoreUnsafeReleaseScripts`. Investigate the package.
- Don't enable Yarn PnP — `nodeLinker: node-modules` only.
- PRs target `develop`.
