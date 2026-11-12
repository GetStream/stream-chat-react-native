/**
 * A tool call's arguments as the person reads them before they allow the call: JSON, indented,
 * or the text as it came when it isn't JSON. Nothing for a call that sends nothing.
 */
export const formatToolArguments = (args: unknown): string | undefined => {
  if (args === undefined || args === null || args === '') return undefined;
  if (typeof args === 'string') {
    try {
      return formatToolArguments(JSON.parse(args));
    } catch {
      return args;
    }
  }
  if (typeof args === 'object' && !Array.isArray(args) && Object.keys(args).length === 0) {
    return undefined;
  }
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
};
