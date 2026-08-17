// Fixture tests for the i18n build scripts. Run with:
//
//   node --test scripts/tests/i18n-tooling-checks.mts     (from the `package` workspace root)
//
// Deliberately NOT a jest test, and deliberately named neither `*.test.*` nor `__tests__/`:
// jest.config.js leaves `testRegex` empty, so jest falls back to its default `testMatch`
// (`**/__tests__/**/*.?([mc])[jt]s?(x)` and `**/?(*.)+(spec|test).?([mc])[jt]s?(x)`) over the whole
// package — either name would pull this file, and any checked-in fixture, into `yarn test:unit`.
//
// The fixtures are synthetic sources that must not be type-checked, linted or run by jest, so they
// are written to a scratch directory at run time and the generator is spawned with its cwd pointed
// at them — which is exactly how it runs in the workspace, since every path it uses is relative.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GENERATOR = path.join(HERE, '..', 'generate-i18n-keys.mts');

/** The two hand-maintained maps, in their simplest valid form. */
const emptyRuntimeDefaults = 'export const runtimeDefaults = {};\n';
const emptyExternalStrings = 'export const EXTERNAL_STRING_KEYS = {};\n';

type Fixture = Record<string, string>;

const run = (files: Fixture, args: string[] = []) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-fixture-'));
  const all: Fixture = {
    'src/i18n/externalStrings.ts': emptyExternalStrings,
    'src/i18n/runtimeDefaults.ts': emptyRuntimeDefaults,
    ...files,
  };
  for (const [relative, contents] of Object.entries(all)) {
    const full = path.join(dir, relative);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, contents);
  }
  const result = spawnSync(process.execPath, [GENERATOR, ...args], {
    cwd: dir,
    encoding: 'utf8',
  });
  const keysPath = path.join(dir, 'src/i18n/keys.ts');
  return {
    dir,
    keys: fs.existsSync(keysPath) ? fs.readFileSync(keysPath, 'utf8') : null,
    status: result.status,
    stderr: result.stderr,
    stdout: result.stdout,
    read: (relative: string) => fs.readFileSync(path.join(dir, relative), 'utf8'),
  };
};

// ---------------------------------------------------------------------------------------
// Recognised call forms
// ---------------------------------------------------------------------------------------
test('records every recognised t() call form and ignores the rest', () => {
  const result = run({
    // A .d.ts file is skipped entirely.
    'src/components/legacy.d.ts': `declare const t: (k: string, d?: string) => string;\n`,
    'src/components/Widget.tsx': `
      declare const t: (k: string, d?: unknown) => string;
      declare const props: { t: typeof t };
      declare const count: number;
      declare const timestamp: Date;
      declare const cond: boolean;

      export const Widget = () => (
        <View
          accessibilityLabel={t('widget.close.ariaLabel', 'Close')}
          title={props.t('widget.header.title', 'Widget')}
        >
          {t(\`widget.body.text\`, 'Body')}
          {t('widget.replies.label', {
            count,
            defaultValue_one: '{{count}} reply',
            defaultValue_other: '{{count}} replies',
          })}
          {t('timestamp.WidgetTimestamp', { timestamp })}
          {t('duration.widget')}
          {t(cond ? 'widget.ignored.a' : 'widget.ignored.b')}
          {[t('widget.nested.text', 'Nested')]}
        </View>
      );
    `,
    // Both excluded directory names.
    'src/components/__tests__/Widget.test.tsx': `t('never.seen.text', 'Never');\n`,
    'src/mock-builders/fake.ts': `t('also.never.text', 'Never');\n`,
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        'duration.widget': 'mm:ss',
        'timestamp.WidgetTimestamp': '{{ timestamp | timestampFormatter }}',
      } as const;
    `,
  });

  assert.equal(result.status, 0, result.stderr);
  // Sliced to the catalog block rather than compared against the whole tail of the file, so the
  // prose of the `BundledTranslationKey` doc comment is not load-bearing for this assertion.
  const catalogStart = result.keys!.indexOf('export type TranslationCatalog');
  assert.equal(
    result.keys!.slice(catalogStart, result.keys!.indexOf('};', catalogStart) + 3),
    [
      'export type TranslationCatalog = {',
      '  "duration.widget": "mm:ss";',
      '  "timestamp.WidgetTimestamp": "{{ timestamp | timestampFormatter }}";',
      '  "widget.body.text": "Body";',
      '  "widget.close.ariaLabel": "Close";',
      '  "widget.header.title": "Widget";',
      '  "widget.nested.text": "Nested";',
      '  "widget.replies.label_one": "{{count}} reply";',
      '  "widget.replies.label_other": "{{count}} replies";',
      '};',
      '',
    ].join('\n'),
  );
  // The two keys with no inline copy are also emitted as the bundled union, which is what the
  // `t()` overloads use to tell a key that needs a `defaultValue` from one that does not.
  const bundled = result.keys!.slice(result.keys!.indexOf('export type BundledTranslationKey'));
  assert.match(bundled, /\|\s+"duration\.widget"/);
  assert.match(bundled, /\|\s+"timestamp\.WidgetTimestamp"/);
  assert.doesNotMatch(bundled, /widget\.close\.ariaLabel/);
  // Conditional keys are invisible to the scanner — neither branch is recorded, and it is not
  // reported as an error.
  assert.ok(!result.keys?.includes('widget.ignored'));
  assert.match(result.stdout, /8 entries, type-only/);
  assert.match(result.stdout, /6 from inline defaults, 2 bundled/);
});

// ---------------------------------------------------------------------------------------
// Guard 1 — conflicting inline copy
// ---------------------------------------------------------------------------------------
test('guard 1: one key used with two different inline copies', () => {
  const result = run({
    'src/a.tsx': `t('widget.close.label', 'Close');\n`,
    'src/b.tsx': `t('widget.close.label', 'Dismiss');\n`,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /1 key\(s\) used with conflicting inline copy — a key must render one thing:/,
  );
  assert.match(result.stderr, /widget\.close\.label/);
  assert.match(result.stderr, /"Close"/);
  assert.match(result.stderr, /"Dismiss"/);
  assert.equal(result.keys, null);
});

// ---------------------------------------------------------------------------------------
// Guard 2 — no inline default and no runtimeDefaults entry
// ---------------------------------------------------------------------------------------
test('guard 2: key called with no inline default and no runtimeDefaults entry', () => {
  const result = run({
    'src/a.tsx': `t('widget.orphan.text');\nt('widget.interpolated.text', { name });\n`,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /2 key\(s\) are called with no inline default and are missing from src\/i18n\/runtimeDefaults\.ts\./,
  );
  assert.match(result.stderr, /They would render as the raw key\./);
  assert.match(result.stderr, /widget\.orphan\.text {2}\(src\/a\.tsx\)/);
  assert.match(result.stderr, /widget\.interpolated\.text {2}\(src\/a\.tsx\)/);
  assert.equal(result.keys, null);
});

// ---------------------------------------------------------------------------------------
// Guard 3 — key in both the call sites and runtimeDefaults
// ---------------------------------------------------------------------------------------
test('guard 3: key present in both an inline default and runtimeDefaults', () => {
  const result = run({
    'src/a.tsx': `t('widget.close.label', 'Close');\n`,
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        'widget.close.label': 'Shut',
      };
    `,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /1 key\(s\) are in both src\/i18n\/runtimeDefaults\.ts and an inline default\./,
  );
  assert.match(result.stderr, /The bundled value wins, so editing the call site would silently/);
  assert.match(result.stderr, /bundled: {3}"Shut"/);
  assert.match(result.stderr, /call site: "Close"/);
  assert.equal(result.keys, null);
});

// ---------------------------------------------------------------------------------------
// Guard 4 — externalStrings desynchronised from the catalog
// ---------------------------------------------------------------------------------------
test('guard 4: external string no longer matches its key catalog copy', () => {
  const files = (external: string) => ({
    'src/a.tsx': `t('notification.locationShareFailed', 'Failed to share location');\n`,
    'src/i18n/externalStrings.ts': external,
  });

  const desynchronised = run(
    files(`
      export const EXTERNAL_STRING_KEYS = {
        'Failed to share the location': 'notification.locationShareFailed',
      } as const;
    `),
  );
  assert.equal(desynchronised.status, 1);
  assert.match(
    desynchronised.stderr,
    /1 entr\(ies\) in src\/i18n\/externalStrings\.ts map an external string onto a key/,
  );
  assert.match(desynchronised.stderr, /catalog: {2}"Failed to share location"/);
  assert.match(desynchronised.stderr, /external: "Failed to share the location"/);
  assert.equal(desynchronised.keys, null);

  // The aligned spelling passes.
  const aligned = run(
    files(`
      export const EXTERNAL_STRING_KEYS = {
        'Failed to share location': 'notification.locationShareFailed',
      } as const;
    `),
  );
  assert.equal(aligned.status, 0, aligned.stderr);
});

// ---------------------------------------------------------------------------------------
// Guard 5 — strict-prefix collision (RN only; web has no equivalent)
// ---------------------------------------------------------------------------------------
test('guard 5: a key that is a strict prefix of another key', () => {
  const result = run({
    'src/a.tsx': `
      t('poll.title', 'Poll');
      t('poll.title.text', 'Poll title');
    `,
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /1 key\(s\) are a strict prefix of another key — a key cannot be both a/,
  );
  assert.match(result.stderr, /^ {2}poll\.title$/m);
  assert.match(result.stderr, /^ {4}is a strict prefix of: poll\.title\.text$/m);
  assert.equal(result.keys, null);
});

test('guard 5: compares on segment boundaries, so poll.title / poll.titleText is fine', () => {
  const result = run({
    'src/a.tsx': `
      t('poll.title', 'Poll');
      t('poll.titleText', 'Poll title');
      t('poll.title_one', 'One poll');
    `,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.keys?.includes('"poll.title": "Poll";'));
  assert.ok(result.keys?.includes('"poll.titleText": "Poll title";'));
});

test('guard 5: also catches a collision introduced by runtimeDefaults', () => {
  const result = run({
    'src/a.tsx': `t('duration.remindMe.short', 'mm:ss');\n`,
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        'duration.remindMe': 'hh:mm',
      };
    `,
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /are a strict prefix of another key/);
  assert.match(result.stderr, /^ {2}duration\.remindMe$/m);
  assert.match(result.stderr, /^ {4}is a strict prefix of: duration\.remindMe\.short$/m);
});

// ---------------------------------------------------------------------------------------
// readStringMap guards, ported from web
// ---------------------------------------------------------------------------------------
test('readStringMap: the exported object must exist and be flat string literals', () => {
  const missing = run({ 'src/i18n/runtimeDefaults.ts': `export const somethingElse = {};\n` });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /could not find an exported `runtimeDefaults` object literal in/);

  const notFlat = run({
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        ...spread,
      };
    `,
  });
  assert.equal(notFlat.status, 1);
  assert.match(
    notFlat.stderr,
    /runtimeDefaults in src\/i18n\/runtimeDefaults\.ts must be a flat object of string literals\./,
  );

  const notStrings = run({
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        'duration.widget': someValue,
      };
    `,
  });
  assert.equal(notStrings.status, 1);
  assert.match(
    notStrings.stderr,
    /runtimeDefaults entries must be 'quoted\.key': 'string literal'\./,
  );

  const absent = run({ 'src/i18n/runtimeDefaults.ts': '' });
  fs.rmSync(path.join(absent.dir, 'src/i18n/runtimeDefaults.ts'));
  const rerun = spawnSync(process.execPath, [GENERATOR], { cwd: absent.dir, encoding: 'utf8' });
  assert.equal(rerun.status, 1);
  assert.match(
    rerun.stderr,
    /could not read the file that is expected to export `runtimeDefaults`/,
  );
});

// ---------------------------------------------------------------------------------------
// JSON export
// ---------------------------------------------------------------------------------------
test('--json writes the joined catalog, excluding formatter keys unless --all is passed', () => {
  const files = {
    'src/a.tsx': `t('widget.close.label', 'Close');\nt('timestamp.Foo', { t: 1 });\n`,
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        'timestamp.Foo': '[Today at] LT',
      };
    `,
  };

  const translatable = run(files, ['--json', 'out.json']);
  assert.equal(translatable.status, 0, translatable.stderr);
  assert.deepEqual(JSON.parse(translatable.read('out.json')), { 'widget.close.label': 'Close' });
  assert.match(translatable.stdout, /excluded 1 formatter expressions \(timestamp\., duration\.\)/);
  assert.match(translatable.stdout, /1 of them do carry English copy/);
  // The excluded keys are named, not just counted — a translator working from the JSON export
  // never sees them otherwise.
  assert.match(translatable.stdout, /^ {4}timestamp\.Foo$/m);

  const all = run(files, ['--json', 'out.json', '--all']);
  assert.equal(all.status, 0, all.stderr);
  assert.deepEqual(JSON.parse(all.read('out.json')), {
    'timestamp.Foo': '[Today at] LT',
    'widget.close.label': 'Close',
  });

  const noPath = run(files, ['--json']);
  assert.equal(noPath.status, 1);
  assert.match(noPath.stderr, /--json requires an output path/);
});

test('--json reports English prose beside an interpolation, not just bracketed day words', () => {
  // The real case is `timestamp.UserActivityStatus`: 'Last seen {{ timestamp | fromNowFormatter }}'.
  // Its English sits outside the brackets, so a bracket-only check misses it and the string ships
  // untranslated — invisible, because the key is excluded from the export a translator works from.
  const files = {
    'src/a.tsx': `t('widget.close.label', 'Close');\nt('timestamp.Seen', { t: 1 });\nt('timestamp.Plain', { t: 1 });\n`,
    'src/i18n/runtimeDefaults.ts': `
      export const runtimeDefaults = {
        'timestamp.Seen': 'Last seen {{ timestamp | fromNowFormatter }}',
        'timestamp.Plain': '{{ timestamp | timestampFormatter(format: LT) }}',
      };
    `,
  };

  const result = run(files, ['--json', 'out.json']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 of them do carry English copy/);
  assert.match(result.stdout, /^ {4}timestamp\.Seen$/m);
  // A pure formatter expression has no copy in it and must not be reported.
  assert.doesNotMatch(result.stdout, /timestamp\.Plain/);
});
