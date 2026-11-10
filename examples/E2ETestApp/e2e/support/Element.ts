/**
 * Element helpers mirroring the Android suite's `uiautomator` extensions (`Element.kt`, `Wait.kt`),
 * so robot code reads the same: `selector.waitToAppearAndClick()` becomes
 * `await waitToAppearAndClick(selector)`.
 */

export const defaultTimeout = 15000;

type Selector = Detox.NativeMatcher;

type WaitOptions = {
  /** Picks one match when the selector matches several elements. */
  index?: number;
  timeout?: number;
};

const findElement = (selector: Selector, index?: number) =>
  index === undefined ? element(selector) : element(selector).atIndex(index);

export const waitToAppear = async (
  selector: Selector,
  { index, timeout = defaultTimeout }: WaitOptions = {},
) => {
  const target = findElement(selector, index);
  await waitFor(target).toBeVisible().withTimeout(timeout);
  return target;
};

/**
 * Retries `action` while Detox reports the element as not hittable (e.g. covered by the keyboard
 * while it animates in). iOS runs without Detox's idle synchronization, which used to absorb that.
 */
const retryWhileNotHittable = async (action: () => Promise<void>, timeout = defaultTimeout) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      return await action();
    } catch (error) {
      if (Date.now() > deadline || !/not hittable/i.test(String(error))) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};

export const waitToAppearAndClick = async (selector: Selector, options?: WaitOptions) => {
  const target = await waitToAppear(selector, options);
  await retryWhileNotHittable(() => target.tap(), options?.timeout);
  return target;
};

/**
 * Taps an element of something that animates in: a menu, a bottom sheet, a swipe action. iOS runs
 * without Detox's idle sync, so a tap that lands during the animation is reported done but never
 * fires. On iOS this lets the animation settle first; Android's Espresso sync already waits.
 */
export const waitToSettleAndClick = async (selector: Selector, options?: WaitOptions) => {
  if (device.getPlatform() === 'ios') {
    await waitToAppear(selector, options);
    await sleep(1000);
  }
  return waitToAppearAndClick(selector, options);
};

export const waitToAppearAndLongPress = async (selector: Selector, options?: WaitOptions) => {
  const target = await waitToAppear(selector, options);
  await retryWhileNotHittable(() => target.longPress(), options?.timeout);
  return target;
};

/** Waits until nothing matching `selector` is visible. Resolves (does not throw) on timeout. */
export const waitToDisappear = async (
  selector: Selector,
  { index, timeout = defaultTimeout }: WaitOptions = {},
) => {
  try {
    await waitFor(findElement(selector, index)).not.toBeVisible().withTimeout(timeout);
  } catch {
    // The caller asserts on `isDisplayed` afterwards, like `waitToDisappear().isDisplayed()` on Android.
  }
};

/**
 * Waits until `selector` exists (or, with `shouldExist: false`, until it no longer does), and
 * returns whether it exists then. For elements Detox iOS never reports as visible, such as avatars
 * whose remote image has not loaded: its visibility check needs rendered pixels.
 */
export const waitForExistence = async (
  selector: Selector,
  {
    index,
    shouldExist = true,
    timeout = defaultTimeout,
  }: WaitOptions & { shouldExist?: boolean } = {},
) => {
  const target = findElement(selector, index);
  try {
    if (shouldExist) {
      await waitFor(target).toExist().withTimeout(timeout);
    } else {
      await waitFor(target).not.toExist().withTimeout(timeout);
    }
    return shouldExist;
  } catch {
    return !shouldExist;
  }
};

export const isDisplayed = async (selector: Selector, index?: number) => {
  try {
    await expect(findElement(selector, index)).toBeVisible();
    return true;
  } catch {
    return false;
  }
};

/**
 * Whether any element matching `selector` is on screen. Unlike `isDisplayed` without an index, it
 * copes with several matches: Detox iOS also reports the list's off-screen cells (a message text and
 * the same text inside a quote further down), where `isDisplayed` throws "multiple elements" and so
 * answers `false` even with the text in view.
 */
export const isAnyDisplayed = async (selector: Selector) =>
  device.getPlatform() === 'ios'
    ? (await allAttributes(selector)).some((attributes) => attributes.visible)
    : isDisplayed(selector);

/** Polls until `predicate` holds, then returns `true`; returns `false` once `timeout` elapses. */
export const waitUntil = async (
  predicate: () => Promise<boolean>,
  timeout = defaultTimeout,
  interval = 500,
) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return predicate();
};

/** Number of elements currently matching `selector` (Detox has no count query of its own). */
export const count = async (selector: Selector) => {
  try {
    const attributes = await element(selector).getAttributes();
    return 'elements' in attributes ? attributes.elements.length : 1;
  } catch {
    return 0;
  }
};

/** Waits until `selector` matches exactly `expected` elements and returns the last count seen. */
export const waitForCount = async (selector: Selector, expected: number, timeout?: number) => {
  let actual = 0;
  await waitUntil(async () => {
    actual = await count(selector);
    return actual === expected;
  }, timeout);
  return actual;
};

/** Waits until `selector` (or its `index`-th match) shows `text` and returns the text it shows. */
export const waitForText = async (
  selector: Selector,
  text: string,
  { index = 0, mustBeEqual = true, timeout }: WaitOptions & { mustBeEqual?: boolean } = {},
) => {
  let actual = '';
  await waitUntil(async () => {
    actual = await textOf(selector, index);
    return mustBeEqual ? actual === text : actual.includes(text);
  }, timeout);
  return actual;
};

export const textOf = async (selector: Selector, index = 0) => {
  try {
    const attributes = await element(selector).getAttributes();
    const match = 'elements' in attributes ? attributes.elements[index] : attributes;
    return match?.text ?? match?.label ?? '';
  } catch {
    return '';
  }
};

type ElementAttributes = {
  enabled?: boolean;
  visible?: boolean;
  frame?: { height: number; width: number; x: number; y: number };
  label?: string;
  text?: string;
};

/** Attributes of every element matching `selector`, in Detox's match order; `[]` when none match. */
export const allAttributes = async (selector: Selector): Promise<ElementAttributes[]> => {
  try {
    const attributes = (await element(selector).getAttributes()) as
      | ElementAttributes
      | { elements: ElementAttributes[] };
    return 'elements' in attributes ? attributes.elements : [attributes];
  } catch {
    return [];
  }
};

/**
 * The Detox index of the `fromBottom`-th match counted from the bottom of the screen (0 is the
 * lowest), like Android's `waitToAppearBottomUp`. Message lists render the newest message at the
 * bottom, but the platforms disagree on the order in which they report matches.
 */
export const indexFromBottom = async (
  selector: Selector,
  fromBottom = 0,
  timeout = defaultTimeout,
) => {
  let matches: ElementAttributes[] = [];
  await waitUntil(async () => {
    matches = await allAttributes(selector);
    return matches.length > 0;
  }, timeout);
  if (matches.length === 0) {
    throw new Error(`No element matches ${JSON.stringify(selector)}`);
  }
  const order = matches
    .map((match, index) => ({ index, y: match.frame?.y ?? 0 }))
    .sort((a, b) => b.y - a.y);
  return order[Math.min(fromBottom, order.length - 1)].index;
};

export const frameOf = async (selector: Selector, index = 0) => {
  const matches = await allAttributes(selector);
  const frame = matches[index]?.frame;
  if (!frame) {
    throw new Error(`No frame for ${JSON.stringify(selector)} at index ${index}`);
  }
  return frame;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
