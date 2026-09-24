import { StateStore } from '@stream-io/state-store';
import { act, renderHook } from '@testing-library/react-native';

import { useMessageComposer } from '../hooks/useMessageComposer';
import { useMessageComposerHasSendableData } from '../hooks/useMessageComposerHasSendableData';

jest.mock('../hooks/useMessageComposer', () => ({
  useMessageComposer: jest.fn(),
}));

type Config = { attachments: { pendingUploadsEnabled: boolean } };

/**
 * A composer holding one attachment that is still uploading: whether it is sendable depends only
 * on `pendingUploadsEnabled`, exactly as `MessageComposer.hasSendableData` decides it.
 */
const createComposer = () => {
  const configState = new StateStore<Config>({ attachments: { pendingUploadsEnabled: false } });
  const composer = {
    configState,
    editingAuditState: new StateStore({ lastChange: {} }),
    get hasSendableData() {
      return configState.getLatestValue().attachments.pendingUploadsEnabled;
    },
  };
  jest.mocked(useMessageComposer).mockReturnValue(composer as never);
  return composer;
};

describe('useMessageComposerHasSendableData', () => {
  it('re-renders when pendingUploadsEnabled changes, with nothing else changing', () => {
    const { configState } = createComposer();

    const { result } = renderHook(() => useMessageComposerHasSendableData());
    expect(result.current).toBe(false);

    // What `attachments.pendingUploadsEnabled` flipping at runtime does — config, not composer state.
    act(() => {
      configState.partialNext({ attachments: { pendingUploadsEnabled: true } });
    });

    expect(result.current).toBe(true);
  });
});
