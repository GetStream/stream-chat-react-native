/**
 * Joins the non-empty `parts` into one accessibility label, separated by commas so screen readers
 * pause between segments.
 *
 * @param parts Label segments; empty strings and non-strings are dropped.
 * @returns The joined label, or an empty string when no part remains.
 */
export const composeAccessibilityLabel = (
  ...parts: Array<string | null | undefined | false>
): string => parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(', ');

/**
 * Builds the `accessibilityValue` object for progress and seek surfaces.
 *
 * @param params.max Upper bound of the range.
 * @param params.min Lower bound of the range. Defaults to 0.
 * @param params.now Current value, clamped to `[min, max]`.
 * @param params.text Optional spoken description, omitted from the result when empty.
 * @returns The `accessibilityValue` object.
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

type A11yAction = Readonly<{ name: string; label?: string }>;

/**
 * Merges `accessibilityActions` lists, deduplicating by `name` (the later list wins).
 *
 * @param actionLists Lists of actions; `undefined` entries are skipped.
 * @returns The merged actions, in first-seen order of their `name`.
 */
export const mergeAccessibilityActions = (
  ...actionLists: Array<ReadonlyArray<A11yAction> | undefined>
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
