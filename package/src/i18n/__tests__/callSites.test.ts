import fs from 'node:fs';
import path from 'node:path';

import ts from 'typescript';

import catalogJson from './catalog.fixture.json';

import { runtimeDefaults } from '../runtimeDefaults';

/**
 * Every `t()` call site, checked against the catalog.
 *
 * `catalogRenders.test.ts` proves each key *can* render; it says nothing about whether the call
 * sites ask for the right thing. These are the failures it cannot see, all of which ship a visibly
 * wrong string rather than an error:
 *
 * - a dotted key handed to something that renders it verbatim, so the user reads
 *   `messageInput.audioRecorder.holdToRecord.text` off the screen
 * - `t('key')` with neither an inline default nor a bundled value — i18next misses and returns the key
 * - copy that interpolates `{{name}}` while the call site passes `{ user }`, leaving `{{name}}` on screen
 * - a plural key called without `count`, so i18next cannot pick a form
 *
 * Parsing the source is the only way to see any of it: each one is a mismatch between two files that
 * individually type-check.
 */

const SRC = path.resolve(__dirname, '../..');
const catalog = catalogJson as Record<string, string>;
const bundledKeys = new Set(Object.keys(runtimeDefaults));

/** Callables that translate their first argument. None of them takes an inline default. */
const TRANSLATING = new Set(['t', 'translate', 'useA11yLabel']);

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const catalogKeys = new Set(Object.keys(catalog));
const pluralBases = new Set(
  Object.keys(catalog)
    .filter((key) => PLURAL_SUFFIX.test(key))
    .map((key) => key.replace(PLURAL_SUFFIX, '')),
);
const resolvable = (key: string) => catalogKeys.has(key) || pluralBases.has(key);
const copyFor = (key: string) =>
  catalog[key] ?? catalog[`${key}_other`] ?? catalog[`${key}_one`] ?? undefined;

/** `{{ x | fmt }}` resolves through a formatter, so its placeholder is not a caller's to supply. */
const isFormatterExpression = (copy: string) => /\{\{[^}]*\|[^}]*\}\}/.test(copy);
const placeholders = (copy: string) =>
  [...copy.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]);

const sourceFiles = (() => {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'mock-builders') continue;
        walk(full);
      } else if (
        /\.tsx?$/.test(entry.name) &&
        // Both are catalogs of keys, so every string in them would look like an untranslated use.
        entry.name !== 'keys.ts' &&
        entry.name !== 'runtimeDefaults.ts'
      ) {
        found.push(full);
      }
    }
  };
  walk(SRC);
  return found;
})();

type Finding = { detail: string; where: string };

const calleeName = (node: ts.CallExpression) => {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
};

/** `asDynamicKey(x)` is a branding wrapper; the key is what it wraps. */
const unwrapDynamic = (node: ts.Expression | undefined) =>
  node &&
  ts.isCallExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === 'asDynamicKey'
    ? node.arguments[0]
    : node;

const objectPropNames = (node: ts.Node | undefined) =>
  node && ts.isObjectLiteralExpression(node)
    ? node.properties
        .map((p) =>
          p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))
            ? p.name.text
            : undefined,
        )
        .filter((n): n is string => !!n)
    : [];

const audit = () => {
  const rawKeyLeaks: Finding[] = [];
  const unknownKeys: Finding[] = [];
  const unresolvable: Finding[] = [];
  const drift: Finding[] = [];
  const missingInterpolation: Finding[] = [];
  const pluralWithoutCount: Finding[] = [];

  /**
   * Identifiers whose value reaches a translating call somewhere in the SDK, so a key literal
   * assigned to one is translated even though its own line has no `t()` on it — a lookup table
   * (`SUBTITLE_KEY[type]`) or an exported constant.
   */
  const translatedRoots = new Set<string>();
  const parsed = sourceFiles.map((file) => ({
    file,
    sf: ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
  }));

  for (const { sf } of parsed) {
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && TRANSLATING.has(calleeName(node) ?? '')) {
        const arg = unwrapDynamic(node.arguments[0]);
        if (arg && !ts.isStringLiteral(arg)) {
          let root: ts.Node = arg;
          while (
            ts.isPropertyAccessExpression(root) ||
            ts.isElementAccessExpression(root) ||
            ts.isNonNullExpression(root) ||
            ts.isParenthesizedExpression(root)
          ) {
            if (ts.isPropertyAccessExpression(root)) translatedRoots.add(root.name.text);
            root = root.expression;
          }
          if (ts.isIdentifier(root)) translatedRoots.add(root.text);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  for (const { file, sf } of parsed) {
    const rel = path.relative(SRC, file);
    const at = (node: ts.Node) =>
      `${rel}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const name = calleeName(node);

        if (name === 't' || name === 'translate') {
          const keyNode = unwrapDynamic(node.arguments[0]);
          if (keyNode && ts.isStringLiteral(keyNode)) {
            const key = keyNode.text;
            const second = node.arguments[1];
            const inlineDefault = second && ts.isStringLiteral(second) ? second.text : undefined;
            const options = objectPropNames(
              second && ts.isObjectLiteralExpression(second) ? second : node.arguments[2],
            );

            if (!resolvable(key)) {
              unknownKeys.push({ detail: `t('${key}')`, where: at(node) });
            } else {
              // A plural call site carries its copy as `defaultValue_one` / `defaultValue_other`
              // inside the options object rather than as the second argument.
              const hasDefault =
                !!inlineDefault || options.some((o) => o.startsWith('defaultValue'));
              if (!hasDefault && !bundledKeys.has(key)) {
                unresolvable.push({
                  detail: `t('${key}') — no inline default, not in runtimeDefaults`,
                  where: at(node),
                });
              }
              if (inlineDefault && catalog[key] !== undefined && inlineDefault !== catalog[key]) {
                drift.push({
                  detail: `t('${key}')\n      inline : ${JSON.stringify(inlineDefault)}\n      catalog: ${JSON.stringify(catalog[key])}`,
                  where: at(node),
                });
              }
              const copy = copyFor(key);
              if (copy && !isFormatterExpression(copy)) {
                const missing = placeholders(copy).filter((v) => !options.includes(v));
                if (missing.length) {
                  missingInterpolation.push({
                    detail: `t('${key}') needs {{${missing.join('}}, {{')}}}; options supply [${options.join(', ')}]`,
                    where: at(node),
                  });
                }
              }
              if (pluralBases.has(key) && !options.includes('count')) {
                pluralWithoutCount.push({ detail: `t('${key}')`, where: at(node) });
              }
            }
          }
        }

        if (name === 'useA11yLabel') {
          const arg = node.arguments[0];
          if (arg && ts.isStringLiteral(arg)) {
            if (!resolvable(arg.text))
              unknownKeys.push({ detail: `useA11yLabel('${arg.text}')`, where: at(node) });
            else if (!bundledKeys.has(arg.text)) {
              unresolvable.push({
                detail: `useA11yLabel('${arg.text}') — the hook passes no inline default, so the key must be bundled`,
                where: at(node),
              });
            } else {
              const needed = placeholders(copyFor(arg.text) ?? '');
              if (needed.length && !node.arguments[1]) {
                missingInterpolation.push({
                  detail: `useA11yLabel('${arg.text}') needs {{${needed.join('}}, {{')}}} but passes no params`,
                  where: at(node),
                });
              }
            }
          }
        }
      }

      if (ts.isStringLiteral(node) && node.text.includes('.') && resolvable(node.text)) {
        // Climb past pass-through syntax (ternaries, `??`, parens, JSX braces) to the slot that names
        // this value, then decide whether that slot is translated downstream.
        let parent: ts.Node = node.parent;
        let child: ts.Node = node;
        let translated = false;
        while (parent) {
          if (ts.isCallExpression(parent) && TRANSLATING.has(calleeName(parent) ?? '')) {
            const first = parent.arguments[0];
            if (first === child || unwrapDynamic(first) === child) translated = true;
          }
          if (
            !(
              ts.isConditionalExpression(parent) ||
              ts.isParenthesizedExpression(parent) ||
              ts.isBinaryExpression(parent) ||
              ts.isJsxExpression(parent) ||
              ts.isAsExpression(parent) ||
              ts.isCallExpression(parent)
            )
          ) {
            break;
          }
          child = parent;
          parent = parent.parent;
        }

        if (!translated) {
          let slot: string | undefined;
          if (ts.isJsxAttribute(parent)) slot = parent.name.getText(sf);
          else if (ts.isPropertyAssignment(parent)) slot = parent.name.getText(sf);
          else if (ts.isBindingElement(parent) && parent.name) slot = parent.name.getText(sf);
          else if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name))
            slot = parent.name.text;

          // A `*Key` slot is translated by whoever receives it (`Button`'s `accessibilityLabelKey`,
          // `getDateString`'s `timestampTranslationKey`). Those receivers pass no inline default, so
          // the key has to be bundled.
          if (slot && /Key$/.test(slot)) {
            if (!bundledKeys.has(node.text)) {
              unresolvable.push({
                detail: `${slot}='${node.text}' — translated without an inline default, so it must be bundled`,
                where: at(node),
              });
            }
          } else {
            const names: string[] = [];
            let walker: ts.Node | undefined = node.parent;
            while (walker) {
              if (ts.isPropertyAssignment(walker) && walker.name)
                names.push(walker.name.getText(sf));
              if (ts.isVariableDeclaration(walker) && ts.isIdentifier(walker.name)) {
                names.push(walker.name.text);
                break;
              }
              walker = walker.parent;
            }
            if (!names.some((n) => translatedRoots.has(n))) {
              rawKeyLeaks.push({
                detail: `'${node.text}' in ${slot ? `slot '${slot}'` : ts.SyntaxKind[parent?.kind]} — never reaches t()`,
                where: at(node),
              });
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  return {
    drift,
    missingInterpolation,
    pluralWithoutCount,
    rawKeyLeaks,
    unknownKeys,
    unresolvable,
  };
};

const format = (findings: Finding[]) =>
  findings.map((f) => `  ${f.where}\n      ${f.detail}`).join('\n');

describe('translation call sites', () => {
  const result = audit();

  it('scanned the source tree', () => {
    // Guards against the walk silently finding nothing and every assertion below passing vacuously.
    expect(sourceFiles.length).toBeGreaterThan(500);
    expect(catalogKeys.size).toBeGreaterThan(300);
  });

  it('never hands a translation key to something that renders it verbatim', () => {
    expect(format(result.rawKeyLeaks)).toBe('');
  });

  it('only asks for keys the catalog has', () => {
    expect(format(result.unknownKeys)).toBe('');
  });

  it('always supplies copy, inline or bundled', () => {
    expect(format(result.unresolvable)).toBe('');
  });

  it('keeps inline copy identical to the generated catalog', () => {
    expect(format(result.drift)).toBe('');
  });

  it('supplies every value the copy interpolates', () => {
    expect(format(result.missingInterpolation)).toBe('');
  });

  it('passes count for every plural key', () => {
    expect(format(result.pluralWithoutCount)).toBe('');
  });
});
