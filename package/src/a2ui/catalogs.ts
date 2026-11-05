import { Catalog, type ComponentApi, type FunctionApi } from '@a2ui/web_core';

import { A2UI_VERSION } from './A2UIStream';
import basicCatalogDocument from './basicCatalog.json';
import { basicFunctionsOf } from './basicFunctions';
import { a2uiAppCatalogDocument, a2uiTypeName } from './catalogDocument';

import type { AIUIComponent } from '../ai-components/generative-ui/AIUIComponent';

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
  openUrl,
}: A2UICatalogsOptions): Catalog<ComponentApi>[] => {
  const definitions = basicCatalogDefinitions();
  const functions = basicFunctionsOf(definitions.functions as Map<string, FunctionApi>, {
    locale,
    openUrl,
  });
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
  const all = [...definitions.components.values(), ...appApis] as ComponentApi[];
  return [
    new Catalog<ComponentApi>(catalogId, A2UI_VERSION, all, functions),
    ...(catalogId === A2UI_BASIC_CATALOG_ID
      ? []
      : [new Catalog<ComponentApi>(A2UI_BASIC_CATALOG_ID, A2UI_VERSION, all, functions)]),
  ];
};
