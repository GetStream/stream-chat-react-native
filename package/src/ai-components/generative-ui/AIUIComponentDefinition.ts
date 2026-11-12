import { isRecord } from './AIUIHelpers';

/** A JSON Schema, as a component's parameters are described to the agent. */
export type AIUIJSONSchema = Record<string, unknown>;

/** Something the agent fills in for a component. */
export type AIUIParameter = {
  /** Whether the agent must fill it in. */
  isRequired: boolean;
  /** The name the agent fills it in by, such as `title`. */
  name: string;
  /** What it holds, as a JSON Schema, such as `AIUIParameterType.string`. */
  type: AIUIJSONSchema;
  /** What it is, for the agent. */
  description?: string;
};

/** Something a component reports when the person uses it, such as tapping a place. */
export type AIUIComponentEvent = {
  /** When it happens, for the agent. */
  description: string;
  /** The name it is reported by, such as `ask_about`. */
  name: string;
  /** What it carries, in order. */
  parameters: AIUIParameter[];
};

/**
 * An app's component as the agent knows it: its name, what it shows, what the agent fills in
 * and what it reports. It is portable JSON, the same on every platform, so one description
 * (such as a `UIComponents.json` shared with the iOS and Android apps) serves them all.
 */
export type AIUIComponentDefinition = {
  /** What it shows and when to use it, for the agent. */
  description: string;
  /** What it reports when the person uses it. */
  events: AIUIComponentEvent[];
  /** The name the agent places it by, such as `place_card`. */
  name: string;
  /**
   * What the agent fills in, in order: a format such as OpenUI Lang passes arguments by
   * position.
   */
  parameters: AIUIParameter[];
};

/** The types a parameter commonly has, as JSON Schemas. */
export const AIUIParameterType = {
  /** A list of values of one type. */
  array: (items: AIUIJSONSchema): AIUIJSONSchema => ({ items, type: 'array' }),
  boolean: { type: 'boolean' } as AIUIJSONSchema,
  /** A day, such as `2026-11-14`. */
  date: { format: 'date', type: 'string' } as AIUIJSONSchema,
  /** A moment, such as `2026-11-14T09:30:00Z`. */
  dateTime: { format: 'date-time', type: 'string' } as AIUIJSONSchema,
  /** One of a fixed set of strings. */
  enumeration: (values: string[]): AIUIJSONSchema => ({ enum: values, type: 'string' }),
  integer: { type: 'integer' } as AIUIJSONSchema,
  number: { type: 'number' } as AIUIJSONSchema,
  /** An object with named fields, in order. */
  object: (fields: AIUIParameter[]): AIUIJSONSchema => aiUIObjectSchema(fields),
  string: { type: 'string' } as AIUIJSONSchema,
  /** A link, such as an image's. */
  url: { format: 'uri', type: 'string' } as AIUIJSONSchema,
};

/** A parameter the agent must fill in. */
export const requiredAIUIParameter = (
  name: string,
  type: AIUIJSONSchema,
  description?: string,
): AIUIParameter => ({ description, isRequired: true, name, type });

/** A parameter the agent may leave out. */
export const optionalAIUIParameter = (
  name: string,
  type: AIUIJSONSchema,
  description?: string,
): AIUIParameter => ({ description, isRequired: false, name, type });

// The key that keeps the order of an object's fields, which JSON objects don't have.
const ORDER_KEY = 'x-order';

const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

/** Parameters as a JSON Schema object, the way a tool's are described, keeping their order. */
export const aiUIObjectSchema = (parameters: AIUIParameter[]): AIUIJSONSchema => ({
  [ORDER_KEY]: parameters.map(({ name }) => name),
  properties: Object.fromEntries(
    parameters.map(({ description, name, type }) => [
      name,
      description === undefined ? type : { ...type, description },
    ]),
  ),
  required: parameters.filter(({ isRequired }) => isRequired).map(({ name }) => name),
  type: 'object',
});

/** The fields of a JSON Schema object, in the order it keeps, then by name. */
export const aiUIParametersOf = (schema: unknown): AIUIParameter[] => {
  if (!isRecord(schema)) return [];
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = new Set(strings(schema.required));
  const ordered = strings(schema[ORDER_KEY]).filter((name) => name in properties);
  const rest = Object.keys(properties)
    .filter((name) => !ordered.includes(name))
    .sort();
  return [...ordered, ...rest].flatMap((name) => {
    const field = properties[name];
    if (!isRecord(field)) return [];
    const { description, ...type } = field;
    return [
      {
        description: typeof description === 'string' ? description : undefined,
        isRequired: required.has(name),
        name,
        type,
      },
    ];
  });
};

/**
 * Reads a component's portable JSON, such as one entry of a `UIComponents.json`, or returns
 * `undefined` for one without a name.
 */
export const parseAIUIComponentDefinition = (
  json: unknown,
): AIUIComponentDefinition | undefined => {
  if (!isRecord(json) || typeof json.name !== 'string' || json.name === '') {
    return undefined;
  }
  const events = Array.isArray(json.events) ? json.events : [];
  return {
    description: typeof json.description === 'string' ? json.description : '',
    events: events.flatMap((event) =>
      isRecord(event) && typeof event.name === 'string'
        ? [
            {
              description: typeof event.description === 'string' ? event.description : '',
              name: event.name,
              parameters: aiUIParametersOf(event.parameters),
            },
          ]
        : [],
    ),
    name: json.name,
    parameters: aiUIParametersOf(json.parameters),
  };
};

/** A component's portable JSON, as `parseAIUIComponentDefinition` reads it back. */
export const aiUIComponentDefinitionJSON = (definition: AIUIComponentDefinition) => ({
  description: definition.description,
  events: definition.events.map(({ description, name, parameters }) => ({
    description,
    name,
    ...(parameters.length ? { parameters: aiUIObjectSchema(parameters) } : {}),
  })),
  name: definition.name,
  parameters: aiUIObjectSchema(definition.parameters),
});
