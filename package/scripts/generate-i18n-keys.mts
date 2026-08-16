// Generates src/i18n/keys.ts — the type-only catalog of every translation key mapped to its
// English copy. The i18n types derive `TranslationKey` / `StreamTFunction` from it, so a typo'd
// key is a compile error.
//
// It is type-only on purpose: no runtime value is emitted, so it costs nothing in the bundle.
// (Deriving the type from `typeof import('./en.json')` would not work for consumers either — tsc
// does not copy JSON into lib/typescript.)
//
// The catalog has exactly two sources, and both are the place the copy is actually used:
//
//   1. Inline defaults at the call sites — `t('message.status.sent.text', 'Sent')`.
//      i18next renders these from the `defaultValue`, so they are never bundled as data.
//   2. src/i18n/runtimeDefaults.ts — hand-maintained, and the only translation data that ships.
//      Just the keys with no inline copy to fall back on: `timestamp.*` / `duration.*` formatter
//      expressions passed around as prop values, and keys built from a runtime value.
//
// There is deliberately no checked-in en.json. It was a third copy of strings that already exist
// in those two places, and keeping it in sync needed an extract pass plus a sync pass. Pass
// `--json <path>` to write the translatable keys out as JSON on demand, for a translator or a TMS,
// and add `--all` to include the formatter expressions.
//
// Run by `yarn build-translations`, from the `package` workspace root — every path below is
// relative to it.
import fs from 'node:fs';
import ts from 'typescript';
import { readCallSiteCopy } from './i18n-call-sites.mts';

const RUNTIME_DEFAULTS = 'src/i18n/runtimeDefaults.ts';
const EXTERNAL_STRINGS = 'src/i18n/externalStrings.ts';
const KEYS_OUT = 'src/i18n/keys.ts';

// Values under these prefixes are dayjs/i18next expressions, not copy. Mirrors `FormatterKey` in
// the i18n types. Excluded from the JSON export, which is a translator-facing file.
const FORMATTER_PREFIXES = ['timestamp.', 'duration.'];
const isFormatterKey = (key: string) => FORMATTER_PREFIXES.some((prefix) => key.startsWith(prefix));

// Some formatter values embed English day words in their `calendarFormats` (dayjs escapes literal
// text in brackets), so excluding them from the export does drop translatable text. It is not
// translatable *as copy* — the format string has to be rewritten — so the guide routes it through a
// key override instead. Counted rather than hardcoded so the note below cannot go stale.
const hasEnglishWords = (value: string) =>
  [...value.matchAll(/\[([^\]]+)\]/g)].some(([, literal]) => /[A-Za-z]{2}/.test(literal));

// `EXTERNAL_STRING_KEYS` entries whose low-level-client wording deliberately differs from the SDK's
// own copy for the same concept. Everything else must match, so a copy edit cannot silently
// desynchronise the two. See src/i18n/externalStrings.ts.
const REPHRASED_EXTERNAL_STRINGS = new Set<string>([
  // e.g. 'Command not ready to be sent', // SDK: 'Command not available'
]);

const jsonFlag = process.argv.indexOf('--json');
const JSON_OUT = jsonFlag === -1 ? null : process.argv[jsonFlag + 1];
if (jsonFlag !== -1 && (!JSON_OUT || JSON_OUT.startsWith('--'))) {
  console.error('--json requires an output path');
  process.exit(1);
}
// Include the formatter expressions in the export. Off by default: they are not copy, and a TMS
// that "translates" them breaks date rendering.
const INCLUDE_FORMATS = process.argv.includes('--all');

const fail = (message: string, lines: string[]) => {
  console.error(`\n${message}`);
  for (const line of lines) console.error(`  ${line}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------------------
// Read the hand-maintained string maps
// ---------------------------------------------------------------------------------------
// Parsed rather than imported: `await import()` works under Node's type stripping but warns
// MODULE_TYPELESS_PACKAGE_JSON on every run, and the package cannot be `"type": "module"`.
const readStringMap = (file: string, exportName: string): Map<string, string> => {
  if (!fs.existsSync(file)) {
    fail(`could not read the file that is expected to export \`${exportName}\`:`, [file]);
  }
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const out = new Map<string, string>();
  let found = false;

  ts.forEachChild(source, (node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== exportName ||
        !declaration.initializer
      ) {
        continue;
      }
      // `= { … } as const` / `satisfies …` are both fine.
      let initializer: ts.Expression = declaration.initializer;
      while (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer)) {
        initializer = initializer.expression;
      }
      if (!ts.isObjectLiteralExpression(initializer)) continue;
      found = true;
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) {
          fail(`${exportName} in ${file} must be a flat object of string literals.`, [
            property.getText(source).slice(0, 80),
          ]);
        }
        const assignment = property as ts.PropertyAssignment;
        if (
          !ts.isStringLiteralLike(assignment.name) ||
          !ts.isStringLiteralLike(assignment.initializer)
        ) {
          fail(`${exportName} entries must be 'quoted.key': 'string literal'.`, [
            assignment.getText(source).slice(0, 80),
          ]);
        }
        out.set(
          (assignment.name as ts.StringLiteralLike).text,
          (assignment.initializer as ts.StringLiteralLike).text,
        );
      }
    }
  });

  if (!found) {
    fail(`could not find an exported \`${exportName}\` object literal in`, [file]);
  }
  return out;
};

const runtimeDefaults = readStringMap(RUNTIME_DEFAULTS, 'runtimeDefaults');
const { conflicts, copy: inlineCopy, withoutCopy } = readCallSiteCopy();

// ---------------------------------------------------------------------------------------
// Cross-check the two sources
// ---------------------------------------------------------------------------------------
if (conflicts.length) {
  fail(
    `${conflicts.length} key(s) used with conflicting inline copy — a key must render one thing:`,
    conflicts.map(
      (c) => `${c.key}\n    ${JSON.stringify(c.a)}\n    ${JSON.stringify(c.b)}  (${c.file})`,
    ),
  );
}

// A key called without inline copy resolves from the bundled resource or not at all — i18next
// would render the raw dotted key in the UI.
const unresolvable = [...withoutCopy].filter(([key]) => !runtimeDefaults.has(key));
if (unresolvable.length) {
  fail(
    `${unresolvable.length} key(s) are called with no inline default and are missing from ${RUNTIME_DEFAULTS}.\n` +
      `They would render as the raw key. Either pass the English copy inline — t('key', 'Copy') —\n` +
      `or add an entry to ${RUNTIME_DEFAULTS}:`,
    unresolvable.map(([key, file]) => `${key}  (${file})`),
  );
}

// The bundled resource wins over a `defaultValue`, so a key in both places silently renders the
// bundled string and ignores the copy at the call site.
const shadowed = [...runtimeDefaults.keys()].filter((key) => inlineCopy.has(key));
if (shadowed.length) {
  fail(
    `${shadowed.length} key(s) are in both ${RUNTIME_DEFAULTS} and an inline default.\n` +
      `The bundled value wins, so editing the call site would silently change nothing.\n` +
      `Remove the runtimeDefaults entry:`,
    shadowed.map(
      (key) =>
        `${key}\n    bundled:   ${JSON.stringify(runtimeDefaults.get(key))}\n    call site: ${JSON.stringify(inlineCopy.get(key))}`,
    ),
  );
}

// ---------------------------------------------------------------------------------------
// keys.ts
// ---------------------------------------------------------------------------------------
const catalog = new Map([...inlineCopy, ...runtimeDefaults]);
const keys = [...catalog.keys()].sort();

// A key that is a strict dotted prefix of another key cannot be both a leaf and a namespace:
// with i18next's default `keySeparator: '.'` the shorter key resolves to an object, and a nested
// resource tree cannot represent the two at once. Compared on segment boundaries, so
// `poll.title` / `poll.titleText` is fine and `poll.title` / `poll.title.text` is not.
const keySet = new Set(keys);
const prefixCollisions: Array<{ leaf: string; nested: string }> = [];
for (const key of keys) {
  const segments = key.split('.');
  for (let i = 1; i < segments.length; i++) {
    const ancestor = segments.slice(0, i).join('.');
    if (keySet.has(ancestor)) prefixCollisions.push({ leaf: ancestor, nested: key });
  }
}
if (prefixCollisions.length) {
  fail(
    `${prefixCollisions.length} key(s) are a strict prefix of another key — a key cannot be both a leaf\n` +
      `and a namespace. Rename one of them, usually by giving the shorter key a modality segment\n` +
      `(.label / .text / .title):`,
    prefixCollisions.map(({ leaf, nested }) => `${leaf}\n    is a strict prefix of: ${nested}`),
  );
}

// `translateExternalString` passes the raw low-level-client sentence as the `defaultValue`, so that
// is what renders in English — not the key's catalog copy. When the two differ, `TranslationCatalog`
// and the JSON export advertise a string the external path never produces. Deliberate rephrasings
// are allowlisted above; anything else means a copy edit desynchronised the two.
const externalStrings = readStringMap(EXTERNAL_STRINGS, 'EXTERNAL_STRING_KEYS');
const desynchronised = [...externalStrings]
  .filter(([raw]) => !REPHRASED_EXTERNAL_STRINGS.has(raw))
  .filter(([raw, key]) => catalog.get(key) !== raw);
if (desynchronised.length) {
  fail(
    `${desynchronised.length} entr(ies) in ${EXTERNAL_STRINGS} map an external string onto a key\n` +
      `whose catalog copy differs. English renders the external string, so the catalog would\n` +
      `advertise copy that never appears. Align the two, or add the external string to\n` +
      `REPHRASED_EXTERNAL_STRINGS in this script if the wording differs on purpose:`,
    desynchronised.map(
      ([raw, key]) =>
        `${key}\n    catalog:  ${JSON.stringify(catalog.get(key))}\n    external: ${JSON.stringify(raw)}`,
    ),
  );
}

const lines: string[] = [
  '// AUTO-GENERATED by scripts/generate-i18n-keys.mts — do not edit by hand.',
  '// Regenerate with `yarn build-translations`. CI fails if this file is out of sync.',
  '//',
  '// Type-only: no runtime value is emitted, so this adds nothing to the bundle.',
  '',
  '/**',
  ' * Every translation entry shipped with the SDK, mapped to its English copy.',
  ' *',
  ' * Plural entries appear as `<key>_one` / `<key>_other`; call sites use the bare `<key>` and',
  ' * pass `count`. See {@link TranslationKey}.',
  ' */',
  'export type TranslationCatalog = {',
];
for (const key of keys) {
  lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(catalog.get(key))};`);
}
lines.push('};', '');
fs.writeFileSync(KEYS_OUT, lines.join('\n'));

console.log(
  `generated ${KEYS_OUT} (${keys.length} entries, type-only) — ` +
    `${inlineCopy.size} from inline defaults, ${runtimeDefaults.size} bundled`,
);

// ---------------------------------------------------------------------------------------
// Optional JSON export, for translators / a TMS
// ---------------------------------------------------------------------------------------
if (JSON_OUT) {
  const exported = INCLUDE_FORMATS ? keys : keys.filter((key) => !isFormatterKey(key));
  const asObject: Record<string, string> = {};
  for (const key of exported) asObject[key] = catalog.get(key)!;
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(asObject, null, 2)}\n`);

  const excludedKeys = keys.filter((key) => !exported.includes(key));
  console.log(
    `wrote ${JSON_OUT} (${exported.length} ${INCLUDE_FORMATS ? 'entries, formatter expressions included' : 'translatable entries'})`,
  );
  if (excludedKeys.length) {
    const withEnglish = excludedKeys.filter((key) => hasEnglishWords(catalog.get(key)!));
    console.log(
      `  excluded ${excludedKeys.length} formatter expressions (${FORMATTER_PREFIXES.join(', ')}) — ` +
        `not copy, and\n  a TMS that translates them breaks date rendering. ` +
        `Pass --all to include them.\n  ${withEnglish.length} of them do carry English day words; ` +
        `those are translated by overriding the key —\n  see ` +
        `ai-docs/i18n-v15-migration.md#date-and-time.`,
    );
  }
}
