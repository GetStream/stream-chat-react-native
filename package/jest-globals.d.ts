// Provides Jest's ambient globals (describe/it/expect/jest, …) to the test
// type-check program. TypeScript 6.0 no longer auto-includes `@types/jest`
// from `node_modules/@types` the way 5.x did, so we reference it explicitly.
//
// This file sits at the package root — outside `src/` — so that it is neither
// picked up by Jest as a test suite nor emitted into the published `lib/`
// declarations (which must not depend on `@types/jest`). It is pulled in
// only via `tsconfig.test.json`'s `include`.
/// <reference types="jest" />
