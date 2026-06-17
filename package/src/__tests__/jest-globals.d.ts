// Provides Jest's ambient globals (describe/it/expect/jest, …) to the test
// type-check program. TypeScript 6.0 no longer auto-includes `@types/jest`
// from `node_modules/@types` the way 5.x did, so we reference it explicitly.
//
// This file lives under `__tests__/` so it is excluded from the published
// build (`tsconfig.json` excludes `**/__tests__`) — keeping `@types/jest` out
// of `lib/` — while still being picked up by `tsconfig.test.json`.
/// <reference types="jest" />
