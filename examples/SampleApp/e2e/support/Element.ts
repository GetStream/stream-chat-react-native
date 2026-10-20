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

export const waitToAppearAndClick = async (selector: Selector, options?: WaitOptions) => {
  const target = await waitToAppear(selector, options);
  await target.tap();
  return target;
};

export const waitToAppearAndLongPress = async (selector: Selector, options?: WaitOptions) => {
  const target = await waitToAppear(selector, options);
  await target.longPress();
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
