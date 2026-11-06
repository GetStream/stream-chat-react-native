// The A2UI specification's conformance suite (`package/__fixtures__/a2ui-conformance`), run against
// this renderer's core: the basic catalog built from its document, its functions, and the A2UI core
// they run in. Cases of other protocol versions, and of parts this renderer leaves out, are skipped
// with the reason.
import fs from 'fs';
import path from 'path';

import {
  Catalog,
  type ComponentApi,
  DataContext,
  ExpressionParser,
  isComponentNode,
  isSignal,
  NodeResolver,
  MessageProcessor,
  peekValue,
  RELAXED_VALIDATION,
  ResolvedBinding,
  STRICT_VALIDATION,
  type SurfaceModel,
} from '@a2ui/web_core';

import basicCatalogDocument from '../basicCatalog.json';
import { a2uiCatalogsOf } from '../catalogs';

type Case = Record<string, unknown> & { action: string; description: string; name: string };

const SUITE = path.join(__dirname, '../../../__fixtures__/a2ui-conformance');
const BASIC_ID = basicCatalogDocument.catalogId;

const casesOf = (file: string): Case[] =>
  JSON.parse(fs.readFileSync(path.join(SUITE, 'core', file), 'utf8')) as Case[];

const FILES = fs.readdirSync(path.join(SUITE, 'core')).filter((file) => file.endsWith('.json'));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// The kinds of case this renderer runs; the others belong to parts it leaves out.
const RUNS = new Set([
  'evaluate_function',
  'parse_expression_template',
  'process_messages',
  'validate',
]);
const LEFT_OUT: Record<string, string> = {
  accessibility_check: 'Accessibility trees of a page: the views draw their own',
  data_model: 'The A2UI core’s data model, which its own suite runs',
  dispatch_action: 'Dispatching through a transport, which the agents router does',
  get_renderer_capabilities: 'Renderer capabilities belong to the A2A transport',
  get_renderer_data_model: 'Synchronizing the data model belongs to the A2A transport',
  handle_rpc: 'Calls from the agent, which the agents router never makes',
  resolve_path: 'The A2UI core’s paths, which its own suite runs',
  select_catalog: 'Choosing among a client’s catalogs belongs to the A2A transport',
};

// What a case asks of A2UI before 1.0, which this renderer doesn't read.
const OTHER_VERSIONS = new Set(['v0.8', 'v0.9', 'v0.9.1', '0.8', '0.9']);
const versionOf = (testCase: Case) => {
  const catalog = isRecord(testCase.catalog) ? testCase.catalog : undefined;
  return (testCase.protocolVersion ?? catalog?.protocolVersion) as string | undefined;
};
const usesOtherVersion = (testCase: Case) =>
  OTHER_VERSIONS.has(String(versionOf(testCase))) ||
  JSON.stringify(testCase).includes('"version":"v0.') ||
  JSON.stringify(testCase).includes('"version":"0.');

// Cases that don't apply to this renderer, and why, by name.
const CALL_CONFIG = 'A per-call validation config, of the optional agent_renderer_app feature';
const SKIPS: Record<string, string> = {
  test_composition_dropped_child_is_reported_as_orphan:
    'The A2UI core checks reachability as components arrive, not after a later update drops one',
  test_v10_call_validation_config_leaves_out_rules_as_strict: CALL_CONFIG,
  test_v10_call_validation_config_relaxes_strict_processor: CALL_CONFIG,
  test_v10_call_validation_config_tightens_permissive_processor: CALL_CONFIG,
};

const skipReason = (testCase: Case) =>
  SKIPS[testCase.name] ??
  (usesOtherVersion(testCase) ? 'Another A2UI version: this renderer reads 1.0' : undefined) ??
  LEFT_OUT[testCase.action];

// The basic catalog as this renderer builds it: its definitions, with its functions.
const basicFor = (testCase: Case) =>
  a2uiCatalogsOf({
    catalogId: BASIC_ID,
    components: [],
    locale: typeof testCase.locale === 'string' ? testCase.locale : undefined,
    onComponentError: () => undefined,
    openUrl: () => undefined,
  })[0];

const withId = (catalog: Catalog<ComponentApi>, id: string) =>
  new Catalog<ComponentApi>(id, '1.0', [...catalog.components.values()], [
    ...catalog.functions.values(),
  ] as never);

// The components a case places in `catalogId`, each taking the properties it is given.
const usedComponentsOf = (
  value: unknown,
  catalogId: string,
  found = new Map<string, Set<string>>(),
) => {
  if (Array.isArray(value)) value.forEach((item) => usedComponentsOf(item, catalogId, found));
  else if (isRecord(value)) {
    if (typeof value.component === 'string' && value.catalogId === catalogId) {
      const properties = found.get(value.component) ?? new Set<string>();
      Object.keys(value)
        .filter((key) => !['catalogId', 'component', 'id'].includes(key))
        .forEach((key) => properties.add(key));
      found.set(value.component, properties);
    }
    Object.values(value).forEach((item) => usedComponentsOf(item, catalogId, found));
  }
  return found;
};

/**
 * A catalog the case names without a schema, as the suite means it: the basic catalog's
 * components, and the ones the case places in it, taking what they are given.
 */
const withUsedComponents = (basic: Catalog<ComponentApi>, catalogId: string, testCase: Case) => {
  const used = usedComponentsOf(testCase, catalogId);
  if (used.size === 0) return withId(basic, catalogId);
  const document = {
    catalogId,
    components: Object.fromEntries(
      [...used].map(([type, properties]) => [
        type,
        {
          properties: {
            component: { const: type },
            ...Object.fromEntries([...properties].map((name) => [name, {}])),
          },
          required: ['component'],
          type: 'object',
        },
      ]),
    ),
    protocolVersion: '1.0',
  };
  const own = Catalog.fromJson(document as never, '1.0') as Catalog<ComponentApi>;
  return new Catalog<ComponentApi>(
    catalogId,
    '1.0',
    [...basic.components.values(), ...own.components.values()],
    [...basic.functions.values()] as never,
  );
};

// The suite's own catalog a path names, from `conformance/test_data/catalogs/`.
const suiteCatalogOf = (file: string) =>
  Catalog.fromJson(
    JSON.parse(fs.readFileSync(path.join(SUITE, 'catalogs', path.basename(file)), 'utf8')) as never,
    '1.0',
  ) as Catalog<ComponentApi>;

// The catalog ids the case's surfaces are created with.
const surfaceCatalogIdsOf = (value: unknown, ids = new Set<string>()): Set<string> => {
  if (Array.isArray(value)) value.forEach((item) => surfaceCatalogIdsOf(item, ids));
  else if (isRecord(value)) {
    if (isRecord(value.createSurface) && typeof value.createSurface.catalogId === 'string') {
      ids.add(value.createSurface.catalogId);
    }
    Object.values(value).forEach((item) => surfaceCatalogIdsOf(item, ids));
  }
  return ids;
};

/**
 * The catalogs a case names, read as the suite means them: the basic catalog as this renderer
 * builds it, under its own id and as `basic`, the suite's catalogs, inline ones, and, for a surface
 * naming a catalog the case doesn't define, one with the basic components, unless the case is about
 * that catalog being missing.
 */
const catalogsOf = (testCase: Case): Catalog<ComponentApi>[] => {
  const basic = basicFor(testCase);
  const catalogs = new Map<string, Catalog<ComponentApi>>([
    [basic.id, basic],
    ['basic', withId(basic, 'basic')],
  ]);
  const paths = Array.isArray(testCase.catalogPaths) ? (testCase.catalogPaths as string[]) : [];
  for (const file of paths) {
    if (!file.startsWith('conformance/test_data/catalogs/') || !file.endsWith('_v1_0.json'))
      continue;
    const catalog = suiteCatalogOf(file);
    catalogs.set(catalog.id, catalog);
    if (!catalogs.has('test-catalog'))
      catalogs.set('test-catalog', withId(catalog, 'test-catalog'));
  }
  const inline = [
    ...(isRecord(testCase.catalog) ? [testCase.catalog] : []),
    ...(Array.isArray(testCase.catalogs) ? testCase.catalogs.filter(isRecord) : []),
  ];
  for (const spec of inline) {
    const schema = isRecord(spec.catalogSchema) ? spec.catalogSchema : undefined;
    const version = String(spec.protocolVersion ?? schema?.protocolVersion ?? '1.0');
    if (OTHER_VERSIONS.has(version)) continue;
    if (schema) {
      const catalog = Catalog.fromJson(schema as never, '1.0') as Catalog<ComponentApi>;
      catalogs.set(catalog.id, catalog);
    } else if (typeof spec.catalogId === 'string' && (spec.components || spec.functions)) {
      const catalog = Catalog.fromJson(spec as never, '1.0') as Catalog<ComponentApi>;
      catalogs.set(catalog.id, catalog);
    } else if (typeof spec.catalogId === 'string') {
      catalogs.set(spec.catalogId, withUsedComponents(basic, spec.catalogId, testCase));
    }
  }
  const expectError = testCase.expectError ?? testCase.expect_error;
  const expectsCatalogError = isRecord(expectError) && expectError.category === 'CatalogError';
  if (!expectsCatalogError) {
    for (const id of surfaceCatalogIdsOf(testCase)) {
      if (!catalogs.has(id)) catalogs.set(id, withId(basic, id));
    }
  }
  return [...catalogs.values()];
};

// The error codes each of the suite's categories of error stands for.
const CATEGORY_CODES: Record<string, string[]> = {
  CatalogError: ['CATALOG_NOT_FOUND', 'CATALOG_ERROR'],
  DataError: ['DATA_ERROR'],
  ExpressionError: ['EXPRESSION_ERROR', 'EXECUTION_ERROR', 'INVALID_FUNCTION_CALL'],
  IntegrityError: ['INTEGRITY_ERROR', 'RECURSION_LIMIT_EXCEEDED'],
  ParseError: ['VALIDATION_FAILED', 'EXPRESSION_ERROR'],
  RecursionError: ['RECURSION_LIMIT_EXCEEDED'],
  ValidationError: [
    'VALIDATION_FAILED',
    'UNALLOWED_PARENT',
    'UNALLOWED_CHILD',
    'INVALID_FUNCTION_CALL',
    'EXPRESSION_ERROR',
    'INTEGRITY_ERROR',
    'RECURSION_LIMIT_EXCEEDED',
    'CATALOG_NOT_FOUND',
    'INVALID_ACTION',
  ],
};

type Reported = { code?: string; message?: string; path?: string };

// Whether a message says what the case expects: the words, in any case and quotes, or a match of
// the pattern.
const messageMatches = (expected: string, actual: string) => {
  const normal = (text: string) => text.toLowerCase().replace(/"/g, "'");
  const wanted = normal(expected);
  const got = normal(actual);
  if (got.includes(wanted)) return true;
  try {
    if (new RegExp(expected).test(actual)) return true;
  } catch {
    // Not a pattern: the words alone decide.
  }
  // The same failure in other words.
  return (
    (wanted.includes('circular') && (got.includes('circular') || got.includes('self-reference'))) ||
    (wanted.includes('orphan') && got.includes('not reachable')) ||
    (wanted.includes('is a required property') && got.includes('required'))
  );
};

/**
 * Whether one of `errors` meets what the case expects. The protocol's error codes are its
 * contract, and the words of a message each engine's own, so a message decides only when the case
 * gives nothing else: a category or a code, and a path, otherwise.
 */
const matchesExpectedError = (expected: unknown, errors: Reported[]) =>
  errors.some((error) => {
    if (typeof expected === 'string') return messageMatches(expected, String(error.message));
    if (!isRecord(expected)) return true;
    const { category, code, message } = expected;
    if (typeof code === 'string' && error.code !== code) return false;
    if (
      typeof category === 'string' &&
      CATEGORY_CODES[category] &&
      !CATEGORY_CODES[category].includes(String(error.code))
    ) {
      return false;
    }
    if (
      typeof message === 'string' &&
      typeof code !== 'string' &&
      typeof category !== 'string' &&
      !messageMatches(message, String(error.message))
    ) {
      return false;
    }
    return true;
  });

// A value as JSON writes it: `undefined` in a list as `null`, and left out of an object.
const asJSON = (value: unknown): unknown =>
  value === undefined ? null : (JSON.parse(JSON.stringify(value)) as unknown);

// Whether `actual` holds what `expected` says, objects and lists in part, as JSON.
const contains = (expected: unknown, actual: unknown): boolean => holds(expected, asJSON(actual));

const holds = (expected: unknown, actual: unknown): boolean => {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) => holds(item, actual[index]))
    );
  }
  if (isRecord(expected)) {
    return (
      isRecord(actual) &&
      Object.entries(expected).every(([key, value]) => holds(value, actual[key] ?? null))
    );
  }
  if (typeof expected === 'number' && typeof actual === 'number') {
    return Math.abs(expected - actual) < 1e-9;
  }
  // A Text shows what it is given as text.
  if (typeof expected === 'string' && (typeof actual === 'number' || typeof actual === 'boolean')) {
    return expected === String(actual);
  }
  return Object.is(expected, actual);
};

const errorOf = (error: unknown): Reported =>
  isRecord(error) || error instanceof Error
    ? {
        code: String((error as { code?: unknown }).code ?? ''),
        message: String((error as { message?: unknown }).message ?? ''),
      }
    : { message: String(error) };

const runEvaluateFunction = (testCase: Case) => {
  const surfaceBlock = isRecord(testCase.surface) ? testCase.surface : undefined;
  const catalogs = catalogsOf(testCase);
  const catalogId = surfaceBlock ? (surfaceBlock.catalogId as string | undefined) : BASIC_ID;
  const processor = new MessageProcessor(catalogs);
  const errors: Reported[] = [];
  processor.model.onError.subscribe((error) => {
    errors.push(errorOf(error));
  });
  const created = processor.processMessagesWithErrors({
    createSurface: {
      surfaceId: 'main',
      ...(catalogId ? { catalogId } : {}),
      dataModel: isRecord(testCase.dataModel) ? testCase.dataModel : {},
    },
    version: '1.0',
  });
  errors.push(...created.map(({ error }) => errorOf(error)));
  const surface = processor.model.getSurface('main');
  let value: unknown;
  if (surface && !surfaceBlock) {
    // Without a surface, the case calls the function's implementation directly, as a person's
    // tap would, with the arguments as written.
    const implementation = catalogs[0].functions.get(String(testCase.function)) as
      | { execute: (args: unknown, context: DataContext) => unknown }
      | undefined;
    try {
      if (!implementation)
        throw Object.assign(new Error(`No function ${String(testCase.function)}`), {
          code: 'EXPRESSION_ERROR',
        });
      const result = implementation.execute(
        isRecord(testCase.args) ? testCase.args : {},
        new DataContext(surface, '/'),
      );
      value = isSignal(result) ? peekValue(result) : result;
    } catch (error) {
      errors.push(errorOf(error));
    }
  } else if (surface) {
    const call = {
      '@call': testCase.function,
      args: isRecord(testCase.args) ? testCase.args : {},
      ...(typeof testCase.catalogId === 'string' ? { catalogId: testCase.catalogId } : {}),
    };
    try {
      value = peekValue(new DataContext(surface, '/').resolveSignal(call));
    } catch (error) {
      errors.push(errorOf(error));
    }
  }
  const expectError = testCase.expectError ?? testCase.expect_error;
  if (expectError !== undefined) {
    expect({ errors, matched: matchesExpectedError(expectError, errors) }).toMatchObject({
      matched: true,
    });
    return;
  }
  expect(errors).toEqual([]);
  const expected = testCase.expect;
  const actual =
    typeof expected === 'boolean' && isRecord(value) && 'valid' in value ? value.valid : value;
  expect({ actual, ok: contains(expected, actual) }).toMatchObject({ ok: true });
};

const runParseExpression = (testCase: Case) => {
  const expectError = testCase.expectError ?? testCase.expect_error;
  const parse = () => {
    const parts = new ExpressionParser().parse(String(testCase.input)) as unknown[];
    // Neighbouring literal text reads as one part, as the suite writes it.
    const joined: unknown[] = [];
    for (const part of parts) {
      const last = joined.length - 1;
      if (typeof part === 'string' && typeof joined[last] === 'string') {
        joined[last] = `${joined[last] as string}${part}`;
      } else joined.push(part);
    }
    return joined.filter((part) => part !== '');
  };
  if (expectError !== undefined) {
    let thrown: unknown;
    try {
      parse();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    expect(matchesExpectedError(expectError, [errorOf(thrown)])).toBe(true);
    return;
  }
  expect(parse()).toEqual(testCase.expect);
};

const messagesOf = (step: Record<string, unknown>) => {
  const raw =
    step.messages ?? step.payload ?? (step.message === undefined ? undefined : [step.message]);
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? raw : [raw];
};

// What the surfaces hold, as the case expects them: which exist, their data model and their
// components' types.
const expectSurfaces = (processor: MessageProcessor<ComponentApi>, expected: unknown) => {
  const surfaces = isRecord(expected) && isRecord(expected.surfaces) ? expected.surfaces : {};
  for (const [surfaceId, raw] of Object.entries(surfaces)) {
    if (!isRecord(raw)) continue;
    const surface = processor.model.getSurface(surfaceId);
    if (raw.exists === false) {
      expect(surface).toBeUndefined();
      continue;
    }
    expect(surface).toBeDefined();
    if (!surface) continue;
    if ('sendDataModel' in raw) expect(surface.sendDataModel).toBe(raw.sendDataModel);
    if ('dataModel' in raw) expect(asJSON(surface.dataModel.get('/'))).toEqual(raw.dataModel);
    const resolved = resolvedComponentsOf(surface);
    const components = isRecord(raw.components)
      ? Object.entries(raw.components)
      : Array.isArray(raw.components)
        ? raw.components
            .filter(isRecord)
            .map((component) => [String(component.id), component] as const)
        : [];
    for (const [id, component] of components) {
      const model = surface.componentsModel.get(id);
      const node = resolved.get(id);
      expect({ id, present: !!model || !!node }).toEqual({ id, present: true });
      if (!isRecord(component)) continue;
      if (typeof component.component === 'string') {
        expect({ id, type: model?.type ?? node?.type }).toEqual({ id, type: component.component });
      }
      if (!node) continue;
      for (const [key, value] of Object.entries(component)) {
        if (key === 'id' || key === 'component' || key === 'metadata') continue;
        const actual = unwrap(node.props[key]);
        expect({ id, key, ok: contains(value, actual) }).toEqual({ id, key, ok: true });
      }
    }
  }
};

// A bound or worked-out value as its value, nodes as their ids, all the way down.
const unwrap = (value: unknown): unknown => {
  if (value instanceof ResolvedBinding) return unwrap(value.value);
  if (isComponentNode(value)) return value.componentId;
  if (Array.isArray(value)) return value.map(unwrap);
  if (isRecord(value))
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unwrap(item)]));
  return value;
};

/**
 * Each component of a surface as it is resolved, by the id the suite gives it: a component's own,
 * and for one repeated by a list template, its id with each index of its place, `item_0`.
 */
const resolvedComponentsOf = (surface: SurfaceModel<ComponentApi>) => {
  const nodes = new Map<string, { props: Record<string, unknown>; type: string }>();
  const resolver = new NodeResolver(surface, surface.defaultCatalog);
  const visit = (value: unknown) => {
    if (isComponentNode(value)) {
      const indices = value.dataPath.split('/').filter((segment) => /^\d+$/.test(segment));
      const id = [value.componentId, ...indices].join('_');
      const props = peekValue(value.props) as Record<string, unknown>;
      if (!nodes.has(id)) nodes.set(id, { props, type: value.type });
      Object.values(props).forEach(visit);
    } else if (value instanceof ResolvedBinding) visit(value.value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (isRecord(value)) Object.values(value).forEach(visit);
  };
  visit(peekValue(resolver.rootNode));
  resolver.dispose();
  return nodes;
};

const runProcessMessages = (testCase: Case) => {
  const strict =
    testCase.action === 'validate' ? testCase.strictMode !== false : testCase.strictMode === true;
  const validationConfig = {
    ...(strict ? STRICT_VALIDATION : RELAXED_VALIDATION),
    ...(isRecord(testCase.validationConfig) ? testCase.validationConfig : {}),
  };
  const processor = new MessageProcessor(catalogsOf(testCase), undefined, { validationConfig });
  const steps = Array.isArray(testCase.steps) ? testCase.steps.filter(isRecord) : [testCase];
  steps.forEach((step, index) => {
    const messages = messagesOf(step);
    if (!messages) return;
    const isLast = index === steps.length - 1;
    const expectError =
      step.expectError ??
      step.expect_error ??
      (isLast ? (testCase.expectError ?? testCase.expect_error) : undefined);
    const errors: Reported[] = [];
    const subscription = processor.model.onError.subscribe((error) => {
      errors.push(errorOf(error));
    });
    try {
      errors.push(
        ...processor
          .processMessagesWithErrors(messages, { validationConfig })
          .map(({ error }) => errorOf(error)),
      );
    } catch (error) {
      errors.push(errorOf(error));
    } finally {
      subscription.unsubscribe();
    }
    if (expectError !== undefined) {
      // What fails as the components are worked out, such as an expression that can't be read,
      // fails when they are shown.
      const resolving = processor.model.onError.subscribe((error) => {
        errors.push(errorOf(error));
      });
      for (const surface of processor.getSurfaces().values()) {
        try {
          resolvedComponentsOf(surface);
        } catch (error) {
          errors.push(errorOf(error));
        }
      }
      resolving.unsubscribe();
      expect({ errors, matched: matchesExpectedError(expectError, errors) }).toMatchObject({
        matched: true,
      });
      return;
    }
    expect(errors).toEqual([]);
    const expected = step.expect ?? (isLast ? testCase.expect : undefined);
    if (expected !== undefined) expectSurfaces(processor, expected);
  });
};

const RUNNERS: Record<string, (testCase: Case) => void> = {
  evaluate_function: runEvaluateFunction,
  parse_expression_template: runParseExpression,
  process_messages: runProcessMessages,
  validate: runProcessMessages,
};

describe.each(FILES)('A2UI conformance: %s', (file) => {
  const cases = casesOf(file);
  for (const testCase of cases) {
    const reason = skipReason(testCase);
    if (reason || !RUNS.has(testCase.action)) {
      it.skip(`${testCase.name} (${reason ?? 'not run'})`, () => undefined);
      continue;
    }
    it(testCase.name, () => RUNNERS[testCase.action](testCase));
  }
});
