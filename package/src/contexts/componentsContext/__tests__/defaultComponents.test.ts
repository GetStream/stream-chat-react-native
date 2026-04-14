import { DEFAULT_COMPONENTS } from '../defaultComponents';

// Optional component keys that are intentionally undefined (no default implementation)
const OPTIONAL_KEYS = new Set([
  'AttachmentPickerIOSSelectMorePhotos',
  'ChatLoadingIndicator',
  'CreatePollContent',
  'Input',
  'ListHeaderComponent',
  'MessageContentBottomView',
  'MessageContentLeadingView',
  'MessageContentTopView',
  'MessageContentTrailingView',
  'MessageLocation',
  'MessageSpacer',
  'MessageText',
  'PollContent',
]);

describe('DEFAULT_COMPONENTS', () => {
  it('should have all required values defined', () => {
    const entries = Object.entries(DEFAULT_COMPONENTS);
    expect(entries.length).toBeGreaterThan(50);

    const unexpectedUndefined = entries.filter(
      ([key, value]) => value === undefined && !OPTIONAL_KEYS.has(key),
    );
    if (unexpectedUndefined.length > 0) {
      console.log(
        'Unexpectedly undefined keys:',
        unexpectedUndefined.map(([k]) => k),
      );
    }
    expect(unexpectedUndefined).toEqual([]);
  });

  it('optional keys should be explicitly listed', () => {
    const entries = Object.entries(DEFAULT_COMPONENTS);
    const actualUndefined = new Set(
      entries.filter(([, v]) => v === undefined || v === null).map(([k]) => k),
    );
    expect(actualUndefined).toEqual(OPTIONAL_KEYS);
  });
});
