// Reads every `t()` call in the library source and reports the translation keys it declares.
//
// The call sites are the source of truth for the catalog. A prose key exists because some
// component asks for it and passes its English copy inline; delete the call and the key is gone.
// That is what removed the need for a checked-in en.json and for `i18next-cli`'s
// extract/removeUnusedKeys pass.
//
// The only keys that cannot be described this way are the ones with no inline copy — a formatter
// expression or a key built from a runtime value. Those live in `src/i18n/runtimeDefaults.ts`,
// which is hand-maintained; `generate-i18n-keys.mts` joins the two and cross-checks them.
//
// Run by `node` directly — Node 24 strips the types. No loader, no ts-morph: only the TypeScript
// parser API, no `Program` and no type checker, so it needs no tsconfig and is fast.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export type CallSiteCopy = {
  /** `key -> English copy` for every key written with an inline default. */
  copy: Map<string, string>;
  /**
   * `key -> file` for keys called with no inline copy — `t('timestamp.MessageTimestamp', {…})`.
   * These must be present in `runtimeDefaults.ts` or they render as the raw key.
   */
  withoutCopy: Map<string, string>;
  /** Keys seen with two different inline copies — a key must render one thing. */
  conflicts: Array<{ key: string; a: string; b: string; file: string }>;
};

const isTCallee = (expr: ts.Expression): boolean =>
  (ts.isIdentifier(expr) && expr.text === 't') ||
  (ts.isPropertyAccessExpression(expr) && expr.name.text === 't');

export const sourceFiles = (root = 'src'): string[] => {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'mock-builders') continue;
        walk(full);
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        out.push(full);
      }
    }
  })(root);
  return out;
};

export const readCallSiteCopy = (root = 'src'): CallSiteCopy => {
  const copy = new Map<string, string>();
  const withoutCopy = new Map<string, string>();
  const conflicts: CallSiteCopy['conflicts'] = [];

  const record = (key: string, value: string, file: string) => {
    const existing = copy.get(key);
    if (existing !== undefined && existing !== value) {
      conflicts.push({ a: existing, b: value, file, key });
      return;
    }
    copy.set(key, value);
  };

  for (const file of sourceFiles(root)) {
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    (function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && isTCallee(node.expression)) {
        const [keyArg, second] = node.arguments;
        if (keyArg && ts.isStringLiteralLike(keyArg)) {
          const key = keyArg.text;
          if (second && ts.isStringLiteralLike(second)) {
            // t('key', 'Copy')
            record(key, second.text, file);
          } else if (second && ts.isObjectLiteralExpression(second)) {
            // t('key', { count, defaultValue_one, defaultValue_other }) — the catalog holds the
            // `_one` / `_other` forms, never the bare key.
            let plurals = 0;
            for (const prop of second.properties) {
              if (!ts.isPropertyAssignment(prop)) continue;
              const name = prop.name.getText(sourceFile).replace(/['"]/g, '');
              const suffix = name.match(/^defaultValue_(\w+)$/)?.[1];
              if (suffix && ts.isStringLiteralLike(prop.initializer)) {
                record(`${key}_${suffix}`, prop.initializer.text, file);
                plurals++;
              }
            }
            if (!plurals) withoutCopy.set(key, file);
          } else {
            // t('key') — carries no inline copy, so it has to resolve from runtimeDefaults.
            withoutCopy.set(key, file);
          }
        }
      }
      ts.forEachChild(node, visit);
    })(sourceFile);
  }

  return { conflicts, copy, withoutCopy };
};
