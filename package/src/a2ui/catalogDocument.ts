// The app's components as A2UI knows them. Free of the A2UI packages, so the renderer and what
// writes an agent's instructions, which may run on a server, both read them.
import { A2UI_VERSION } from './A2UIStream';

import type { AIUIComponent } from '../ai-components/generative-ui/AIUIComponent';
import type {
  AIUIComponentDefinition,
  AIUIJSONSchema,
} from '../ai-components/generative-ui/AIUIComponentDefinition';
import { aiUISentence, aiUITypeName } from '../ai-components/generative-ui/AIUIHelpers';

/** The id of the catalog with the app's components, unless the renderer is given another. */
export const A2UI_DEFAULT_CATALOG_ID = 'getstream.io:app-catalog';

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
 * The app's components as an A2UI catalog document: each under its A2UI type, its parameters
 * as its properties and what its events do in its description, since it reports them itself
 * rather than through an A2UI action the agent writes. The same as StreamChatA2UI's
 * `PortableComponent`, so an agent writes for both alike. With `bindings`, as the renderer reads
 * them, a parameter may also be bound to the data model or worked out by a function; without,
 * as an agent is told them, it is the value its schema describes.
 */
export const a2uiAppCatalogDocument = (
  catalogId: string,
  components: (AIUIComponent | AIUIComponentDefinition)[],
  { bindings = true }: { bindings?: boolean } = {},
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
          // Sorted, as StreamChatA2UI writes it, so both platforms describe it alike.
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
  protocolVersion: A2UI_VERSION,
});
