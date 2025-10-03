# Guidance for AI coding agents

File purpose: operational rules for automated or assisted code changes. Human-facing conceptual docs belong in `README.md` or the docs site.

## Repository purpose

Stream Chat SDKs for:

- React Native CLI
- Expo

Goals: API stability, backward compatibility, predictable releases, strong test coverage, accessibility, and performance discipline.

## Tech & toolchain

- Languages: TypeScript, React (web + native)
- Runtime: Node (use `nvm use` with `.nvmrc`)
- Package manager: Yarn (V1)
- Testing: Jest (unit)
- Lint/Format: ESLint + Prettier
- Build: Package-local build scripts (composed via root)
- Release: Conventional Commits -> automated versioning/publishing
- Platforms:
    - React Native: iOS and Android

## Environment setup

1. `nvm use`
2. `yarn install`
3. (Optional) Verify: `node -v` matches `.nvmrc`
4. `cd package`
5. `yarn install-all && cd ..`
6. Run tests: `yarn test:unit`

## Project layout (high-level)

- `package/`
    - `native-package/` (`react-native` CLI specific bundle)
    - `expo-package/` (`Expo` specific bundle)
    - `.` (core UI SDK, shared between both bundles)
- `examples/`
    - `ExpoMessaging/`
    - `SampleApp/`
    - `TypeScriptMessaging/`
- Config roots: linting, tsconfig, playwright, babel
- Do not edit generated output (`lib/`, build artifacts)

## Core commands (Runbook)

| Action                  | Command                      |
|-------------------------|------------------------------|
| Install deps            | `yarn install`               |
| Full build              | `yarn install-all`           |
| Watch (if available)    | `yarn start` (add if absent) |
| Lint                    | `yarn lint`                  |
| Fix lint (if separate)  | `yarn lint --fix`            |
| Unit tests (CI profile) | `yarn test:unit`             |

## API design principles

- Semantic versioning
- Use `@deprecated` JSDoc with replacement guidance
- Provide migration docs for breaking changes
- Avoid breaking changes; prefer additive evolution
- Public surfaces: explicit TypeScript types/interfaces
- Consistent naming: `camelCase` for functions/properties, `PascalCase` for components/types

### Deprecation lifecycle

1. Mark with `@deprecated` + rationale + alternative.
2. Maintain for at least one minor release unless security-critical.
3. Add to migration documentation.
4. Remove only in next major.

## Performance guidelines

- Minimize re-renders (memoization, stable refs)
- Use `React.memo` / `useCallback` / `useMemo` when profiling justifies
- Clean up side effects (`AbortController` for network calls, unsubscribe listeners when unmounting)
- Monitor bundle size; justify increases > 2% per package
- Prefer lazy loading for optional heavy modules
- Avoid unnecessary large dependency additions

## Accessibility (a11y)

- All interactive elements keyboard accessible
- Provide ARIA roles/labels where semantic tags insufficient
- Maintain color contrast (WCAG AA)
- Do not convey state by color alone
- Announce dynamic content changes (ARIA live regions if needed)

## Error & logging policy

- Public API: throw descriptive errors or return typed error results (consistent with existing patterns)
- No console noise in production builds
- Internal debug logging gated behind env flag (if present)
- Never leak credentials/user data in errors

## Concurrency & async

- Cancel stale async operations (media, network) when components unmount
- Use `AbortController` for fetch-like APIs
- Avoid race conditions: check instance IDs / timestamps before state updates

## Testing strategy

- Unit: pure functions, small components
- React Native: target minimal smoke + platform logic (avoid flakiness)
- Mocks/fakes: prefer shared test helpers
- Coverage target: maintain or improve existing percentage (fail PR if global coverage drops)
- File naming: `*.test.ts` / `*.spec.ts(x)`
- Add tests for: new public API, bug fixes (regression test), performance-sensitive utilities

## CI expectations

- Mandatory: build, lint, type check, unit/integration tests, (optionally) E2E smoke
- Node versions: those listed in matrix (see workflow YAML)
- Failing or flaky tests: fix or quarantine with justification PR comment (temporary)
- Zero new warnings

## Release workflow (high-level)

1. Conventional Commit messages on PR merge
2. Release automation aggregates commits
3. Version bump + changelog + tag
4. Publish to registry
5. Deprecations noted in CHANGELOG
6. Ensure docs updated prior to publishing breaking changes

## Dependency policy

- Avoid adding large deps without justification (size, maintenance)
- Prefer existing utility packages
- Run `yarn audit` (or equivalent) if adding security-impacting deps
- Keep upgrades separate from feature changes when possible

## Samples & docs

- New public feature: update at least one sample app
- Breaking changes: provide migration snippet
- Keep code snippets compilable
- Use placeholder keys (`YOUR_STREAM_KEY`)

## React Native specifics

- Clear Metro cache if module resolution has issues: `yarn react-native start --reset-cache` (for RN CLI) or `yarn expo start --dev-client -c` (for `Expo`)
- Test on iOS + Android for native module or platform-specific UI changes
- Avoid unguarded web-only APIs in shared code

## Linting & formatting

- Run `yarn lint` before commit
- Narrowly scope `eslint-disable` with inline comments and rationale
- No broad rule disabling

## Commit / PR conventions

- Small, focused PRs
- Include tests for changes
- Screenshot or video for UI changes (before/after)
- Label breaking changes clearly in description
- Document public API changes

## Security

- No credentials or real user data
- Use placeholders in examples
- Scripts must error on missing critical env vars
- Avoid introducing unmaintained dependencies

## Prohibited edits

- Do not edit build artifacts (`lib/`, generated types where present)
- Do not bypass lint/type errors with force merges

## Quick agent checklist (per commit)

- Build succeeds
- Lint clean
- Type check clean
- Tests (unit/integration) green
- Coverage not reduced
- Public API docs updated if changed
- Samples updated if feature surfaced
- No new warnings
- No generated files modified

---

Refine this file iteratively for agent clarity; keep human-facing explanations in docs site / `README.md`.
