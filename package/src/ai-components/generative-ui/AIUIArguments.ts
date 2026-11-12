import type { AIUIJSONSchema, AIUIParameter } from './AIUIComponentDefinition';
import { aiUIParametersOf } from './AIUIComponentDefinition';
import { isRecord } from './AIUIHelpers';

// Thrown inside decoding only, so a value that does not fit stops it at once.
class DoesNotFit extends Error {}

const RFC_3339 = /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A date the agent wrote: an RFC 3339 moment, or a whole day as `yyyy-MM-dd` that the calendar
 * has, which is that day's start where the person is. Anything else is not a date.
 */
export const aiUIDate = (text: string): Date | undefined => {
  if (RFC_3339.test(text)) {
    const moment = new Date(text);
    return Number.isNaN(moment.getTime()) ? undefined : moment;
  }
  const day = DAY.exec(text);
  if (!day) return undefined;
  const [year, month, date] = [Number(day[1]), Number(day[2]), Number(day[3])];
  const start = new Date(year, month - 1, date);
  start.setFullYear(year);
  return start.getFullYear() === year && start.getMonth() === month - 1 && start.getDate() === date
    ? start
    : undefined;
};

/** `place_name` as `placeName`, the way the agent's snake_case reads in JavaScript. */
export const aiUICamelCase = (key: string) => {
  const [, leading = '', middle = '', trailing = ''] = /^(_*)(.*?)(_*)$/.exec(key) ?? [];
  if (!middle.includes('_')) return key;
  const [first = '', ...rest] = middle.split('_').filter(Boolean);
  return (
    leading +
    first +
    rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('') +
    trailing
  );
};

const camelCased = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(camelCased);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [aiUICamelCase(key), camelCased(item)]),
  );
};

const decodeObject = (value: unknown, parameters: AIUIParameter[]) => {
  if (!isRecord(value)) throw new DoesNotFit();
  const declared = new Set(parameters.map(({ name }) => name));
  const decoded: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!declared.has(key)) decoded[aiUICamelCase(key)] = camelCased(item);
  }
  for (const { isRequired, name, type } of parameters) {
    const item = value[name];
    if (item === undefined || item === null) {
      if (isRequired) throw new DoesNotFit();
      continue;
    }
    decoded[aiUICamelCase(name)] = decodeValue(item, type);
  }
  return decoded;
};

const decodeValue = (value: unknown, schema: AIUIJSONSchema): unknown => {
  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') throw new DoesNotFit();
      if (Array.isArray(schema.enum) && !schema.enum.includes(value)) throw new DoesNotFit();
      if (schema.format === 'date' || schema.format === 'date-time') {
        const date = aiUIDate(value);
        if (!date) throw new DoesNotFit();
        return date;
      }
      return value;
    }
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new DoesNotFit();
      return value;
    case 'integer':
      if (!Number.isInteger(value)) throw new DoesNotFit();
      return value;
    case 'boolean':
      if (typeof value !== 'boolean') throw new DoesNotFit();
      return value;
    case 'array': {
      if (!Array.isArray(value)) throw new DoesNotFit();
      const items = isRecord(schema.items) ? schema.items : {};
      return value.map((item) => decodeValue(item, items));
    }
    case 'object':
      return decodeObject(value, aiUIParametersOf(schema));
    default:
      return camelCased(value);
  }
};

/**
 * The arguments the agent wrote for a component, as its view reads them: keys in camelCase,
 * dates as `Date`s. `undefined` while they do not fit its parameters, such as while they are
 * still streaming in: a required one is missing, or one is of the wrong type.
 */
export const decodeAIUIArguments = <Arguments = Record<string, unknown>>(
  args: Record<string, unknown>,
  parameters: AIUIParameter[],
): Arguments | undefined => {
  try {
    return decodeObject(args, parameters) as Arguments;
  } catch (error) {
    if (error instanceof DoesNotFit) return undefined;
    throw error;
  }
};
