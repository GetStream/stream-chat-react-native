const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The object's fields, with those stream-chat keeps under `custom` moved up beside them. An object
 * read straight from the API has them at the top level already, and reads the same.
 */
export const withCustomFields = (object: Record<string, unknown>): Record<string, unknown> => {
  const { custom, ...standard } = object;
  return isObject(custom) ? { ...standard, ...custom } : object;
};
