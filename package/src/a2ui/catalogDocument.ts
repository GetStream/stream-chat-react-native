// The app's components as A2UI knows them. Free of the A2UI packages, so the renderer and what
// writes an agent's instructions, which may run on a server, both read them.
import { A2UI_VERSION } from './A2UIStream';

import type { AIUIComponent } from '../ai-components/generative-ui/AIUIComponent';
import type {
  AIUIComponentDefinition,
  AIUIJSONSchema,
} from '../ai-components/generative-ui/AIUIComponentDefinition';
import { aiUISentence, aiUITypeName } from '../ai-components/generative-ui/AIUIHelpers';
import type { AIClientToolDefinition } from '../ai-components/tool-calls/AIClientToolRunner';

/** The id of the catalog with the app's components, unless the renderer is given another. */
export const A2UI_DEFAULT_CATALOG_ID = 'getstream.io:app-catalog';

/**
 * The id the web SDK names the same catalog with. A renderer on the default id draws surfaces
 * that name it too, so an agent set up for a web app shows its UI here as well.
 */
export const A2UI_WEB_CATALOG_ID = 'stream-app-catalog';

/** The ids a surface may name for a renderer whose catalog is `catalogId`. */
export const a2uiAppCatalogIds = (catalogId: string) =>
  catalogId === A2UI_DEFAULT_CATALOG_ID ? [catalogId, A2UI_WEB_CATALOG_ID] : [catalogId];

const definitionOf = (component: AIUIComponent | AIUIComponentDefinition) =>
  'definition' in component ? component.definition : component;

/** The A2UI type of one of the app's components, named as the basic catalog names its own. */
export const a2uiTypeName = aiUITypeName;

// A parameter as the agent may write it: the value its schema describes, bound to the data
// model, or worked out by a function.
const dynamic = (schema: AIUIJSONSchema) => ({
  anyOf: [
    schema,
    { $ref: 'common_types.json#/$defs/DataBinding' },
    { $ref: 'common_types.json#/$defs/FunctionCall' },
  ],
});

/**
 * One of the app's tools as a function of the catalog, which the agent can call from the UI it
 * writes, such as to fill a list with what the tool answers. Its arguments are its input's
 * properties, each, with `bindings`, also bound to the data model or worked out by a function.
 */
const toolFunctionOf = (tool: AIClientToolDefinition, bindings: boolean) => {
  const schema = tool.inputSchema ?? {};
  const properties =
    typeof schema.properties === 'object' && schema.properties !== null
      ? (schema.properties as Record<string, AIUIJSONSchema>)
      : {};
  const required = Array.isArray(schema.required) ? schema.required : [];
  return {
    ...(tool.description ? { description: aiUISentence(tool.description) } : {}),
    properties: {
      '@call': { const: tool.name },
      args: {
        properties: Object.fromEntries(
          Object.entries(properties).map(([name, property]) => [
            name,
            bindings ? dynamic(property) : property,
          ]),
        ),
        required,
        type: 'object',
      },
    },
    required: ['@call'],
    returnType: 'any',
    type: 'object',
  };
};

/**
 * The app's components as an A2UI catalog document: each under its A2UI type, its parameters
 * as its properties and what its events do in its description, since it reports them itself
 * rather than through an A2UI action the agent writes. With `bindings`, as the renderer reads
 * them, a parameter may also be bound to the data model or worked out by a function; without,
 * as an agent is told them, it is the value its schema describes.
 */
export const a2uiAppCatalogDocument = (
  catalogId: string,
  components: (AIUIComponent | AIUIComponentDefinition)[],
  { bindings = true, tools = [] }: { bindings?: boolean; tools?: AIClientToolDefinition[] } = {},
) => ({
  catalogId,
  components: Object.fromEntries(
    components.map(definitionOf).map((definition) => {
      const type = a2uiTypeName(definition.name);
      const notes = [definition.description, ...definition.events.map((e) => e.description)]
        .filter((note) => note.trim() !== '')
        .map(aiUISentence);
      return [
        type,
        {
          ...(notes.length ? { description: notes.join(' ') } : {}),
          properties: {
            component: { const: type },
            ...Object.fromEntries(
              definition.parameters.map(({ description, name, type: schema }) => [
                name,
                (bindings ? dynamic : (plain: AIUIJSONSchema) => plain)(
                  description === undefined ? schema : { ...schema, description },
                ),
              ]),
            ),
          },
          required: [
            'component',
            ...definition.parameters
              .filter(({ isRequired }) => isRequired)
              .map(({ name }) => name)
              .sort(),
          ],
          type: 'object',
        },
      ];
    }),
  ),
  ...(tools.length
    ? {
        functions: Object.fromEntries(
          tools.map((tool) => [tool.name, toolFunctionOf(tool, bindings)]),
        ),
      }
    : {}),
  protocolVersion: A2UI_VERSION,
});
