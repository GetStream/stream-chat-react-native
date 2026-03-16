const {
  patchFile,
  shouldPatchVersion,
  TARGET_VERSION_RANGE,
} = require('../patch-bottom-sheet-5.1.8-pr-2561');

describe('patch-bottom-sheet-5.1.8-pr-2561', () => {
  it('patches the supported source implementation with the PR #2561 diff', () => {
    const originalContents = `    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    if (ref.current.unstable_getBoundingClientRect !== null) {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable 🤞.
    if (ref.current.getBoundingClientRect !== null) {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`;

    const { changed, contents } = patchFile(
      'src/hooks/useBoundingClientRect.ts',
      originalContents,
    );

    expect(TARGET_VERSION_RANGE).toEqual({
      maxExclusive: '5.2.7',
      minInclusive: '5.1.8',
    });
    expect(changed).toBe(true);
    expect(contents).toContain(`typeof ref.current.unstable_getBoundingClientRect === 'function'`);
    expect(contents).toContain(`typeof ref.current.getBoundingClientRect === 'function'`);
    expect(contents).not.toContain(`.call(ref.current)`);
  });

  it('patches versions from 5.1.8 up to but excluding 5.2.7', () => {
    expect(shouldPatchVersion('5.1.7')).toBe(false);
    expect(shouldPatchVersion('5.1.8')).toBe(true);
    expect(shouldPatchVersion('5.2.0')).toBe(true);
    expect(shouldPatchVersion('5.2.6')).toBe(true);
    expect(shouldPatchVersion('5.2.7')).toBe(false);
    expect(shouldPatchVersion('5.2.8')).toBe(false);
  });

  it('is idempotent once the patch has already been applied', () => {
    const patchedContents = `    if (
      // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
      ref.current.unstable_getBoundingClientRect !== null &&
      // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
      typeof ref.current.unstable_getBoundingClientRect === 'function'
    ) {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    if (
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      ref.current.getBoundingClientRect !== null &&
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      typeof ref.current.getBoundingClientRect === 'function'
    ) {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`;

    const { changed, contents } = patchFile(
      'src/hooks/useBoundingClientRect.ts',
      patchedContents,
    );

    expect(changed).toBe(false);
    expect(contents).toBe(patchedContents);
  });
});
