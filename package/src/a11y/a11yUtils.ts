/**
 * Compose a single accessibility label from multiple parts.
 * Empty/null/undefined parts are filtered out, the remainder joined with a comma+space
 * so screen readers add a brief pause between segments.
 */
export const composeAccessibilityLabel = (
  ...parts: Array<string | null | undefined | false>
): string => parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(', ');

/**
 * Build the value object passed to `accessibilityValue` for progress/seek surfaces.
 * Mirrors the React SDK's `progressBarA11y.ts` shape.
 */
export const formatAccessibilityValue = ({
  max,
  min = 0,
  now,
  text,
}: {
  max: number;
  now: number;
  min?: number;
  text?: string;
}): { max: number; min: number; now: number; text?: string } => {
  const value: { max: number; min: number; now: number; text?: string } = {
    max,
    min,
    now: Math.min(Math.max(min, now), max),
  };
  if (text) value.text = text;
  return value;
};

/**
 * Merge two `accessibilityActions` arrays, deduplicating by `name` (later wins).
 */
type A11yAction = { name: string; label?: string };

export const mergeAccessibilityActions = (
  ...actionLists: Array<A11yAction[] | undefined>
): A11yAction[] => {
  const byName = new Map<string, A11yAction>();
  for (const list of actionLists) {
    if (!list) continue;
    for (const action of list) {
      byName.set(action.name, action);
    }
  }
  return Array.from(byName.values());
};
