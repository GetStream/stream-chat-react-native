/*
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The basic catalog's functions, ported from `@a2ui/web_core` 0.15.0
// (`src/common/basic_functions.js` and `src/catalogs/basic/v1/functions/basic_functions.js`). The
// package only exports them from entries that also define its web components, which React Native
// cannot load. Their schemas come from the basic catalog's own document; drop this file once the
// package exports them on their own.
import {
  A2uiExpressionError,
  computed,
  createFunctionImplementation,
  type DataContext,
  ExpressionParser,
  type FunctionApi,
  type FunctionImplementation,
  getValue,
  isAtLeastVersion,
  isSafeRegex,
  isSignal,
} from '@a2ui/web_core';

/** The locale formatting falls back to, so it never depends on the host's. */
const DEFAULT_LOCALE = 'en-US';

const resolveLocale = (locale?: string) => {
  if (!locale) return DEFAULT_LOCALE;
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length > 0 ? locale : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

const coerceToString = (value: unknown) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

type Validation = { valid: boolean; code?: string; message?: string; severity?: string };

const validateRequired = (value: unknown): Validation => {
  const valid = !(
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
  return { valid, ...(valid ? {} : { message: 'This field is required.' }) };
};

const validateRegex = (value: unknown, pattern: string): Validation => {
  if (!isSafeRegex(pattern)) {
    throw new A2uiExpressionError(
      `Unsafe regex pattern (catastrophic backtracking risk): ${pattern}`,
      'regex',
    );
  }
  try {
    const valid = new RegExp(pattern).test(String(value ?? ''));
    return { valid, ...(valid ? {} : { message: 'Value does not match required pattern.' }) };
  } catch (error) {
    throw new A2uiExpressionError(`Invalid regex pattern: ${pattern}`, 'regex', error);
  }
};

const validateLength = (value: unknown, min?: number, max?: number): Validation => {
  const length = typeof value === 'string' || Array.isArray(value) ? value.length : 0;
  if (min !== undefined && !isNaN(min) && length < min) {
    return { message: `Minimum length is ${min}.`, valid: false };
  }
  if (max !== undefined && !isNaN(max) && length > max) {
    return { message: `Maximum length is ${max}.`, valid: false };
  }
  return { valid: true };
};

const validateNumeric = (value: unknown, min?: number, max?: number): Validation => {
  const number = Number(value);
  if (isNaN(number)) return { message: 'Value must be a valid number.', valid: false };
  if (min !== undefined && !isNaN(min) && number < min) {
    return { message: `Minimum value is ${min}.`, valid: false };
  }
  if (max !== undefined && !isNaN(max) && number > max) {
    return { message: `Maximum value is ${max}.`, valid: false };
  }
  return { valid: true };
};

const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validateEmail = (value: unknown): Validation => {
  const valid = typeof value === 'string' && EMAIL.test(value);
  return valid
    ? { valid }
    : {
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address (e.g. user@example.com).',
        severity: 'error',
        valid,
      };
};

const numberFormats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = JSON.stringify([locale, options]);
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numberFormats.set(key, format);
  }
  return format;
};

const formatNumber = (
  value: number,
  decimals?: number,
  grouping?: boolean,
  locale = DEFAULT_LOCALE,
) =>
  isNaN(value)
    ? ''
    : numberFormat(locale, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
        useGrouping: grouping,
      }).format(value);

const formatCurrency = (
  value: number,
  code: unknown,
  decimals = 2,
  grouping?: boolean,
  locale = DEFAULT_LOCALE,
) => {
  if (isNaN(value)) return '';
  const currency = String(code).toUpperCase();
  const options = {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
    useGrouping: grouping,
  };
  try {
    return numberFormat(locale, { ...options, currency, style: 'currency' }).format(value);
  } catch {
    // Intl throws only for a code that isn't three letters. The layout is the locale's all the
    // same, so a placeholder currency is formatted as a code and replaced.
    return numberFormat(locale, {
      ...options,
      currency: 'USD',
      currencyDisplay: 'code',
      style: 'currency',
    })
      .formatToParts(value)
      .map((part) => (part.type === 'currency' ? currency : part.value))
      .join('');
  }
};

type DateNames = {
  monthsLong: string[];
  monthsShort: string[];
  weekdaysLong: string[];
  weekdaysShort: string[];
};

const dateNamesByLocale = new Map<string, DateNames>();
const dateNamesOf = (locale: string) => {
  let names = dateNamesByLocale.get(locale);
  if (!names) {
    const render = (options: Intl.DateTimeFormatOptions, dates: Date[]) => {
      const format = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
      return dates.map((date) => format.format(date));
    };
    const months = Array.from({ length: 12 }, (_, index) => new Date(Date.UTC(2021, index, 15)));
    const weekdays = Array.from(
      { length: 7 },
      (_, index) => new Date(Date.UTC(2021, 2, 1 + index)),
    );
    names = {
      monthsLong: render({ month: 'long' }, months),
      monthsShort: render({ month: 'short' }, months),
      weekdaysLong: render({ weekday: 'long' }, weekdays),
      weekdaysShort: render({ weekday: 'short' }, weekdays),
    };
    dateNamesByLocale.set(locale, names);
  }
  return names;
};

const DATE_TOKENS = /yyyy|yy|MMMM|MMM|MM|M|EEEE|E|dd|d|HH|H|hh|h|mm|ss|a/g;
const ISO_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;
const WRITTEN_FIELDS = /^([+-]?\d{4,6})-(\d{2})-(\d{2})(?:[T ](\d{2})(?::(\d{2})(?::(\d{2}))?)?)?/;

// The fields as written, so a date the calendar doesn't have, such as the 31st of February, is no
// date rather than the 3rd of March.
const fieldsRoundTrip = (value: string, shifted: Date) => {
  const written = WRITTEN_FIELDS.exec(value);
  if (!written) return false;
  const field = (group: number) =>
    written[group] === undefined ? undefined : Number(written[group]);
  return (
    field(1) === shifted.getUTCFullYear() &&
    field(2) === shifted.getUTCMonth() + 1 &&
    field(3) === shifted.getUTCDate() &&
    (field(4) ?? shifted.getUTCHours()) === shifted.getUTCHours() &&
    (field(5) ?? shifted.getUTCMinutes()) === shifted.getUTCMinutes() &&
    (field(6) ?? shifted.getUTCSeconds()) === shifted.getUTCSeconds()
  );
};

// A timestamp as written, in the offset it was written in, and as an instant.
const parseTimestamp = (value: string) => {
  const instant = new Date(ISO_OFFSET.test(value) ? value : `${value}Z`);
  if (isNaN(instant.getTime())) return null;
  let offsetMinutes = 0;
  const offset = /([+-])(\d{2}):?(\d{2})$/.exec(value);
  if (offset) {
    offsetMinutes = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]));
  }
  const shifted = new Date(instant.getTime() + offsetMinutes * 60_000);
  return fieldsRoundTrip(value, shifted) ? { instant, shifted } : null;
};

const formatDate = (value: unknown, pattern = 'yyyy-MM-dd', locale = DEFAULT_LOCALE) => {
  if (!value) return '';
  const parsed = parseTimestamp(String(value));
  if (!parsed) return '';
  const { instant, shifted } = parsed;
  const format = pattern || 'yyyy-MM-dd';
  if (format === 'ISO') return instant.toISOString();
  const names = dateNamesOf(locale);
  const weekday = (shifted.getUTCDay() + 6) % 7;
  const hours = shifted.getUTCHours();
  const hours12 = hours % 12 || 12;
  const two = (number: number) => String(number).padStart(2, '0');
  return format.replace(DATE_TOKENS, (token) => {
    switch (token) {
      case 'yyyy':
        return String(shifted.getUTCFullYear());
      case 'yy':
        return String(shifted.getUTCFullYear()).slice(-2);
      case 'MMMM':
        return names.monthsLong[shifted.getUTCMonth()];
      case 'MMM':
        return names.monthsShort[shifted.getUTCMonth()];
      case 'MM':
        return two(shifted.getUTCMonth() + 1);
      case 'M':
        return String(shifted.getUTCMonth() + 1);
      case 'EEEE':
        return names.weekdaysLong[weekday];
      case 'E':
        return names.weekdaysShort[weekday];
      case 'dd':
        return two(shifted.getUTCDate());
      case 'd':
        return String(shifted.getUTCDate());
      case 'HH':
        return two(hours);
      case 'H':
        return String(hours);
      case 'hh':
        return two(hours12);
      case 'h':
        return String(hours12);
      case 'mm':
        return two(shifted.getUTCMinutes());
      case 'ss':
        return two(shifted.getUTCSeconds());
      case 'a':
        return hours < 12 ? 'AM' : 'PM';
      default:
        return token;
    }
  });
};

const pluralRulesByLocale = new Map<string, Intl.PluralRules>();
const pluralize = (value: number, forms: Record<string, unknown>, locale = DEFAULT_LOCALE) => {
  let category: string;
  if (value === 0 && forms.zero !== undefined) category = 'zero';
  else if (value === 1 && forms.one !== undefined) category = 'one';
  else if (value === 2 && forms.two !== undefined) category = 'two';
  else {
    let rules = pluralRulesByLocale.get(locale);
    if (!rules) {
      rules = new Intl.PluralRules(locale);
      pluralRulesByLocale.set(locale, rules);
    }
    category = rules.select(value);
  }
  return String(forms[category] ?? forms.other ?? '');
};

// A check's result counts as its `valid`, so `and` and `or` combine checks as well as booleans.
const isTruthyOrValid = (value: unknown) => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const { valid } = value as { valid?: unknown };
    if (typeof valid === 'boolean') return valid;
  }
  return !!value;
};

const atLeastTwo = (values: unknown, name: string): unknown[] => {
  if (!Array.isArray(values) || values.length < 2) {
    throw new A2uiExpressionError(`${name} requires at least 2 values`, name);
  }
  return values;
};

// A 1.0 expression's part as the processor reads it, from the form the expression parser writes.
const adaptPart = (part: unknown): unknown => {
  if (typeof part !== 'object' || part === null || Array.isArray(part)) return part;
  const written = part as Record<string, unknown>;
  if (typeof written.path === 'string' && !('@path' in written)) return { '@path': written.path };
  if (typeof written.call === 'string' && !('@call' in written)) {
    const args: Record<string, unknown> = {};
    if (written.args && typeof written.args === 'object') {
      for (const [key, value] of Object.entries(written.args)) args[key] = adaptPart(value);
    }
    return { '@call': written.call, args, returnType: written.returnType };
  }
  return part;
};

const formatString = (template: string, context: DataContext) => {
  const parts = new ExpressionParser().parse(template);
  if (parts.length === 0) return '';
  const { surface } = context as unknown as {
    surface?: { defaultCatalog?: { protocolVersion?: string }; protocolVersion?: string };
  };
  const isV1 = isAtLeastVersion(
    surface?.protocolVersion ?? surface?.defaultCatalog?.protocolVersion,
    '1.0',
  );
  const dynamic = parts.map((part: unknown) =>
    typeof part !== 'object' || part === null || Array.isArray(part)
      ? part
      : context.resolveSignal((isV1 ? adaptPart(part) : part) as never),
  );
  return computed(() =>
    dynamic.map((part) => coerceToString(isSignal(part) ? getValue(part) : part)).join(''),
  );
};

// The links `openUrl` may open, as the specification lists them. The host may refuse more.
const OPEN_URL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

type Args = Record<string, unknown>;
type Execute = (args: Args, context: DataContext) => unknown;

/**
 * The basic catalog's functions, for the function definitions `apis` of its document, with
 * `openUrl` run by `openUrl`. Formatting follows `locale`, or `en-US`.
 */
export const basicFunctionsOf = (
  apis: Map<string, FunctionApi>,
  { locale, openUrl }: { openUrl: (url: string) => void; locale?: string },
): FunctionImplementation[] => {
  const resolved = resolveLocale(locale);
  const number = (value: unknown) => Number(value);
  const optionalNumber = (value: unknown) => (value === undefined ? undefined : Number(value));
  const executors: Record<string, Execute> = {
    and: ({ values }) => atLeastTwo(values, 'and').every(isTruthyOrValid),
    email: ({ value }) => validateEmail(value),
    formatCurrency: ({ currency, decimals, grouping, value }) =>
      formatCurrency(
        number(value),
        currency,
        optionalNumber(decimals) ?? 2,
        grouping as boolean | undefined,
        resolved,
      ),
    formatDate: ({ format, value }) => formatDate(value, format as string | undefined, resolved),
    formatNumber: ({ decimals, grouping, value }) =>
      formatNumber(
        number(value),
        optionalNumber(decimals),
        grouping as boolean | undefined,
        resolved,
      ),
    formatString: ({ value }, context) => formatString(String(value ?? ''), context),
    length: ({ max, min, value }) =>
      validateLength(value, optionalNumber(min), optionalNumber(max)),
    not: ({ value }) => !isTruthyOrValid(value),
    numeric: ({ max, min, value }) =>
      validateNumeric(value, optionalNumber(min), optionalNumber(max)),
    openUrl: ({ url }) => {
      if (typeof url !== 'string') return;
      // The schemes the specification allows, as the A2UI core's own openUrl reports others.
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(url.trim())?.[1]?.toLowerCase();
      if (!scheme || !OPEN_URL_SCHEMES.has(scheme)) {
        throw new A2uiExpressionError(`Unsupported URL scheme: ${scheme ?? url}`, 'openUrl');
      }
      openUrl(url);
    },
    or: ({ values }) => atLeastTwo(values, 'or').some(isTruthyOrValid),
    pluralize: (args) => pluralize(number(args.value), args, resolved),
    regex: ({ pattern, value }) => validateRegex(value, String(pattern)),
    required: ({ value }) => validateRequired(value),
  };
  return [...apis.values()].flatMap((api) => {
    const execute = executors[api.name];
    return execute
      ? [createFunctionImplementation(api as never, execute as never) as FunctionImplementation]
      : [];
  });
};
