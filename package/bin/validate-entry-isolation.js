/* global __dirname, process, require */
/**
 * Keeps the `ai-components` entry point isolated from the main SDK entry point, in both directions.
 *
 * Metro does not tree-shake: everything reachable from an imported module ends up in the app's
 * bundle. So:
 *
 * 1. The main entry points (core `src/index.ts` and the wrappers' `src/index.js`) must never reach
 *    the AI components or their dependencies. Apps that don't use AI must not bundle any of it.
 * 2. The AI entry points (core `src/ai-components/index.ts` and the wrappers'
 *    `ai-components/index.js`) may only reach the AI sources plus an explicit allowlist of other
 *    files. Apps that only use the AI components must not bundle the chat SDK.
 * 3. The codegen spec copies the wrappers need (codegen only reads a package's own `jsSrcsDir`) stay
 *    byte-identical to the core source of truth.
 *
 * Type-only imports and exports are ignored, since they are erased at build time.
 */
const fs = require('fs');
const path = require('path');

const ts = require('typescript');

const PACKAGE_DIR = path.resolve(__dirname, '..');
const CORE_SRC = path.join(PACKAGE_DIR, 'src');
const AI_SRC = path.join(CORE_SRC, 'ai-components');
const WRAPPERS = ['native-package', 'expo-package'].map((name) => path.join(PACKAGE_DIR, name));

// Third-party packages only the AI components may use. (`lodash` and `@stream-io/state-store` are
// not among them: the main entry point imports both too.)
const AI_ONLY_PACKAGES = [
  '@khanacademy/simple-markdown',
  '@shopify/react-native-skia',
  'react-syntax-highlighter',
  'victory-native',
  'zod',
];

// Files outside `src/ai-components` that the AI entry points are allowed to reach.
const AI_ALLOWED_FILES = [
  path.join(CORE_SRC, 'native.ts'),
  path.join(CORE_SRC, 'components/UIComponents/NativeShimmerView.tsx'),
  ...WRAPPERS.flatMap((wrapper) => [
    path.join(wrapper, 'ai-components/index.js'),
    path.join(wrapper, 'src/optionalDependencies/NativeShimmerView.ts'),
    path.join(wrapper, 'src/native/StreamShimmerViewNativeComponent.ts'),
    path.join(wrapper, 'src/native/PerfTextNativeComponent.ts'),
  ]),
];

// Third-party packages the AI entry points must never reach.
const AI_FORBIDDEN_PACKAGES = ['stream-chat', 'stream-chat-react-native-core'];

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const resolveFile = (candidate) => {
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  for (const ext of EXTENSIONS) {
    if (fs.existsSync(candidate + ext)) return candidate + ext;
  }
  for (const ext of EXTENSIONS) {
    const index = path.join(candidate, 'index' + ext);
    if (fs.existsSync(index)) return index;
  }
  return undefined;
};

const packageNameOf = (specifier) => {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

/** Resolves a specifier to `{ file }` for first-party code or `{ pkg }` for a dependency. */
const resolveSpecifier = (specifier, fromFile) => {
  if (specifier.startsWith('.')) {
    const file = resolveFile(path.resolve(path.dirname(fromFile), specifier));
    if (!file) throw new Error(`Cannot resolve "${specifier}" from ${fromFile}`);
    return { file };
  }
  if (specifier === 'stream-chat-react-native-core/ai-components') {
    return { file: path.join(AI_SRC, 'index.ts') };
  }
  return { pkg: packageNameOf(specifier), specifier };
};

const isTypeOnlyImport = (node) => {
  const clause = node.importClause;
  if (!clause) return false; // side-effect import
  if (clause.isTypeOnly) return true;
  if (clause.name) return false; // default import
  const bindings = clause.namedBindings;
  if (!bindings || ts.isNamespaceImport(bindings)) return false;
  return bindings.elements.length > 0 && bindings.elements.every((element) => element.isTypeOnly);
};

/** Returns the runtime module specifiers of a file. */
const runtimeSpecifiers = (file) => {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const specifiers = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      if (!isTypeOnlyImport(node)) specifiers.push(node.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier && !node.isTypeOnly) {
        const onlyTypes =
          node.exportClause &&
          ts.isNamedExports(node.exportClause) &&
          node.exportClause.elements.length > 0 &&
          node.exportClause.elements.every((element) => element.isTypeOnly);
        if (!onlyTypes) specifiers.push(node.moduleSpecifier.text);
      }
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      ((ts.isIdentifier(node.expression) && node.expression.text === 'require') ||
        node.expression.kind === ts.SyntaxKind.ImportKeyword)
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return specifiers;
};

/** Walks the runtime import graph, returning reached files and packages with an example path. */
const walk = (entry) => {
  const files = new Map([[entry, [entry]]]);
  const packages = new Map();
  const queue = [entry];
  while (queue.length) {
    const file = queue.shift();
    for (const specifier of runtimeSpecifiers(file)) {
      const resolved = resolveSpecifier(specifier, file);
      if (resolved.file) {
        if (!files.has(resolved.file)) {
          files.set(resolved.file, [...files.get(file), resolved.file]);
          queue.push(resolved.file);
        }
      } else if (!packages.has(resolved.specifier)) {
        packages.set(resolved.specifier, [...files.get(file), resolved.specifier]);
      }
    }
  }
  return { files, packages };
};

const relative = (p) => (path.isAbsolute(p) ? path.relative(PACKAGE_DIR, p) : p);
const errors = [];
const report = (message, chain) =>
  errors.push(`${message}\n    via: ${chain.map(relative).join('\n      -> ')}`);

// 1. Main entry points must not reach the AI components.
for (const entry of [
  path.join(CORE_SRC, 'index.ts'),
  ...WRAPPERS.map((w) => path.join(w, 'src/index.js')),
]) {
  const { files, packages } = walk(entry);
  for (const [file, chain] of files) {
    if (
      file.startsWith(AI_SRC + path.sep) ||
      file.includes(`${path.sep}ai-components${path.sep}`)
    ) {
      report(`${relative(entry)} reaches the AI components (${relative(file)})`, chain);
    }
  }
  for (const [specifier, chain] of packages) {
    if (AI_ONLY_PACKAGES.includes(packageNameOf(specifier))) {
      report(`${relative(entry)} reaches the AI-only dependency "${specifier}"`, chain);
    }
  }
}

// 2. AI entry points must not reach the rest of the SDK.
for (const entry of [
  path.join(AI_SRC, 'index.ts'),
  ...WRAPPERS.map((w) => path.join(w, 'ai-components/index.js')),
]) {
  const { files, packages } = walk(entry);
  for (const [file, chain] of files) {
    if (!file.startsWith(AI_SRC + path.sep) && !AI_ALLOWED_FILES.includes(file)) {
      report(
        `${relative(entry)} reaches ${relative(file)}, which is not in the AI allowlist`,
        chain,
      );
    }
  }
  for (const [specifier, chain] of packages) {
    if (AI_FORBIDDEN_PACKAGES.includes(specifier)) {
      report(`${relative(entry)} reaches "${specifier}"`, chain);
    }
  }
}

// 3. Codegen spec copies must not drift.
const copies = [
  [
    path.join(AI_SRC, 'native-specs/NativeAIDictation.ts'),
    ...WRAPPERS.map((w) => path.join(w, 'src/native/NativeAIDictation.ts')),
  ],
  WRAPPERS.map((w) => path.join(w, 'src/native/PerfTextNativeComponent.ts')),
];
for (const [source, ...targets] of copies) {
  const expected = fs.readFileSync(source, 'utf8');
  for (const target of targets) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== expected) {
      errors.push(`${relative(target)} must be identical to ${relative(source)}`);
    }
  }
}

if (errors.length) {
  console.error(
    `Entry point isolation check failed:\n\n${errors.map((e) => `  - ${e}`).join('\n\n')}`,
  );
  process.exit(1);
}
console.log('Entry point isolation check passed.');
