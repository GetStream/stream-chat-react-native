import {
  Catalog,
  type ComponentApi,
  createFunctionImplementation,
  type DataContext,
  type FunctionApi,
  type FunctionImplementation,
} from '@a2ui/web_core';

import { A2UI_VERSION } from './A2UIStream';
import basicCatalogDocument from './basicCatalog.json';
import { basicFunctionsOf } from './basicFunctions';
import { a2uiAppCatalogDocument, a2uiTypeName } from './catalogDocument';
import { secretValuesOf, withoutSecrets } from './secrets';

import type { AIUIComponent } from '../ai-components/generative-ui/AIUIComponent';
import type { AIClientToolDefinition } from '../ai-components/tool-calls/AIClientToolRunner';

/** How long a reply's UI waits for one of the app's tools before it gives up on it. */
export const A2UI_TOOL_TIMEOUT_MS = 30_000;

let basic: Catalog<ComponentApi, FunctionApi> | undefined;

/**
 * The basic catalog's definitions, from its specification document: its components and the
 * schemas of its functions. The package's own basic catalog is made of its web components, which
 * React Native cannot load, so the components are drawn here and the functions are
 * `basicFunctionsOf`'s.
 */
export const basicCatalogDefinitions = (): Catalog<ComponentApi, FunctionApi> => {
  basic ??= Catalog.fromJson(basicCatalogDocument as never, A2UI_VERSION) as Catalog<
    ComponentApi,
    FunctionApi
  >;
  return basic;
};

/** The id of the basic catalog, which a surface may name rather than the app's. */
export const A2UI_BASIC_CATALOG_ID = basicCatalogDocument.catalogId;

export type A2UICatalogsOptions = {
  catalogId: string;
  components: AIUIComponent[];
  /** Tells the app that one of its components can't join the catalog. */
  onComponentError: (component: AIUIComponent, error: unknown) => void;
  openUrl: (url: string) => void;
  locale?: string;
  /** The basic catalog's components and functions to leave out. */
  removing?: string[];
  /**
   * Runs one of the app's tools, which the agent calls from the UI as a function of the catalog,
   * `userInitiated` when the person started it, such as with a tap.
   */
  runTool?: (
    name: string,
    args: Record<string, unknown>,
    options: { userInitiated: boolean },
  ) => Promise<unknown>;
  /** The app's tools the agent can call from the UI it writes. */
  tools?: AIClientToolDefinition[];
  /** Tells the app that one of its tools can't join the catalog. */
  onToolError?: (tool: AIClientToolDefinition, error: unknown) => void;
};

// Runs a tool, giving up on it after `A2UI_TOOL_TIMEOUT_MS`.
const withTimeout = (name: string, running: Promise<unknown>) =>
  new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${name} did not answer within ${A2UI_TOOL_TIMEOUT_MS / 1000}s`)),
      A2UI_TOOL_TIMEOUT_MS,
    );
    running.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

// The app's tools as functions of the catalog, each running the tool with none of what the person
// typed into an obscured field. One named like a function of the basic catalog is left out: the
// basic catalog's own come first.
const toolFunctionsOf = (
  catalogId: string,
  taken: Set<string>,
  {
    onToolError,
    runTool,
    tools = [],
  }: Pick<A2UICatalogsOptions, 'onToolError' | 'runTool' | 'tools'>,
): FunctionImplementation[] => {
  if (!runTool) return [];
  return tools.flatMap((tool) => {
    if (taken.has(tool.name)) {
      onToolError?.(tool, new Error(`${tool.name} is a function of the basic catalog`));
      return [];
    }
    try {
      const api = Catalog.fromJson(
        a2uiAppCatalogDocument(catalogId, [], { tools: [tool] }) as never,
        A2UI_VERSION,
      ).functions.get(tool.name);
      if (!api) return [];
      return [
        createFunctionImplementation(
          api as never,
          (args: Record<string, unknown>, context?: DataContext) =>
            withTimeout(
              tool.name,
              runTool(tool.name, withoutSecrets(args ?? {}, secretValuesOf(context?.surface)), {
                userInitiated: context?.isUserActivated ?? false,
              }),
            ),
        ) as FunctionImplementation,
      ];
    } catch (error) {
      onToolError?.(tool, error);
      return [];
    }
  });
};

/**
 * The catalogs a reply's surfaces are made with: the basic catalog with the app's components,
 * under the renderer's catalog id and under the basic catalog's own, so a surface naming either
 * shows them. Links open the way the host allows.
 */
export const a2uiCatalogsOf = ({
  catalogId,
  components: appComponents,
  locale,
  onComponentError,
  onToolError,
  openUrl,
  removing = [],
  runTool,
  tools,
}: A2UICatalogsOptions): Catalog<ComponentApi>[] => {
  const definitions = basicCatalogDefinitions();
  const removed = new Set(removing);
  const functions = basicFunctionsOf(
    new Map([...definitions.functions].filter(([name]) => !removed.has(name))) as Map<
      string,
      FunctionApi
    >,
    { locale, openUrl },
  );
  functions.push(
    ...toolFunctionsOf(catalogId, new Set(definitions.functions.keys()), {
      onToolError,
      runTool,
      tools,
    }),
  );
  const appApis: ComponentApi[] = [];
  for (const component of appComponents) {
    const type = a2uiTypeName(component.definition.name);
    // The basic catalog's own components come first: an app's component never takes one's name.
    if (definitions.components.has(type)) {
      onComponentError(component, new Error(`${type} is a component of the basic catalog`));
      continue;
    }
    try {
      const api = Catalog.fromJson(
        a2uiAppCatalogDocument(catalogId, [component]) as never,
        A2UI_VERSION,
      ).components.get(type);
      if (api) appApis.push(api as ComponentApi);
    } catch (error) {
      onComponentError(component, error);
    }
  }
  const basic = [...definitions.components.values()].filter(({ name }) => !removed.has(name));
  const all = [...basic, ...appApis] as ComponentApi[];
  return [
    new Catalog<ComponentApi>(catalogId, A2UI_VERSION, all, functions),
    ...(catalogId === A2UI_BASIC_CATALOG_ID
      ? []
      : [new Catalog<ComponentApi>(A2UI_BASIC_CATALOG_ID, A2UI_VERSION, all, functions)]),
  ];
};
