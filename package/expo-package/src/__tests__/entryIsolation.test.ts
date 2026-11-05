const mockExpoUiImport = jest.fn(() => {
  throw new Error('@expo/ui is not installed');
});

jest.mock('@expo/ui', () => mockExpoUiImport(), { virtual: true });
jest.mock('@expo/ui/community/bottom-sheet', () => mockExpoUiImport(), { virtual: true });

// Native capability registration is not under test; don't boot Expo's native
// runtime in Jest. The import-graph validator also checks inside these shims.
jest.mock('../optionalDependencies', () => ({}));
jest.mock('../handlers', () => ({}));

describe('Expo main entry point', () => {
  it('loads the default SDK without importing the optional Expo UI peer', () => {
    const sdk = require('../index');
    expect(sdk.Channel).toBeDefined();
    expect(sdk.AttachmentPicker).toBeDefined();
    expect(sdk.ExpoAttachmentPicker).toBeUndefined();
    expect(mockExpoUiImport).not.toHaveBeenCalled();
  });

  it('keeps the core attachment picker as the default component slot', () => {
    const {
      DEFAULT_COMPONENTS,
    } = require('../../../src/contexts/componentsContext/defaultComponents');
    const {
      AttachmentPicker,
    } = require('../../../src/components/AttachmentPicker/AttachmentPicker');
    expect(DEFAULT_COMPONENTS.AttachmentPicker).toBe(AttachmentPicker);
    expect(mockExpoUiImport).not.toHaveBeenCalled();
  });
});
