import { act, cleanup, renderHook } from '@testing-library/react-native';
import type { CommandSuggestion, MessageComposerState } from 'stream-chat';

import { generateMessage } from '../../../mock-builders/generator/message';
import { useIsCommandDisabled } from '../hooks/useIsCommandDisabled';
import { useMessageComposer } from '../hooks/useMessageComposer';

jest.mock('../hooks/useMessageComposer', () => ({
  useMessageComposer: jest.fn(),
}));

type TestMessageComposerStateStore = {
  getLatestValue: () => MessageComposerState;
  partialNext: (nextValue: Partial<MessageComposerState>) => void;
  subscribeWithSelector: (
    selector: (state: MessageComposerState) => Record<string, unknown>,
    onStoreChange: () => void,
  ) => () => void;
};

const createMessageComposerState = (): TestMessageComposerStateStore => {
  let value: MessageComposerState = {
    draftId: null,
    editedMessage: null,
    id: 'composer-id',
    pollId: null,
    quotedMessage: null,
    showReplyInChannel: false,
  };
  const subscribers = new Set<() => void>();

  return {
    getLatestValue: () => value,
    partialNext: (nextValue) => {
      value = { ...value, ...nextValue };
      subscribers.forEach((subscriber) => subscriber());
    },
    subscribeWithSelector: (_selector, onStoreChange) => {
      subscribers.add(onStoreChange);
      return () => {
        subscribers.delete(onStoreChange);
      };
    },
  };
};

const command = {
  id: 'ban',
  name: 'ban',
  set: 'moderation_set',
} as CommandSuggestion;

describe('useIsCommandDisabled', () => {
  const mockUseMessageComposer = useMessageComposer as jest.MockedFunction<
    typeof useMessageComposer
  >;

  afterEach(() => {
    jest.resetAllMocks();
    cleanup();
  });

  it('recalculates when quoted message existence changes', () => {
    const state = createMessageComposerState();
    const messageComposer = {
      isCommandDisabled: jest.fn(() => !!state.getLatestValue().quotedMessage),
      state,
    } as unknown as ReturnType<typeof useMessageComposer>;

    mockUseMessageComposer.mockReturnValue(messageComposer);

    const { result } = renderHook(() => useIsCommandDisabled(command));

    expect(result.current).toBe(false);
    expect(messageComposer.isCommandDisabled).toHaveBeenCalledTimes(1);

    act(() => {
      state.partialNext({ quotedMessage: generateMessage({ id: 'quoted-message' }) });
    });

    expect(result.current).toBe(true);
    expect(messageComposer.isCommandDisabled).toHaveBeenCalledTimes(2);
  });

  it('does not recalculate when quoted message changes but existence does not', () => {
    const state = createMessageComposerState();
    const messageComposer = {
      isCommandDisabled: jest.fn(() => !!state.getLatestValue().quotedMessage),
      state,
    } as unknown as ReturnType<typeof useMessageComposer>;

    mockUseMessageComposer.mockReturnValue(messageComposer);

    const { result } = renderHook(() => useIsCommandDisabled(command));

    act(() => {
      state.partialNext({ quotedMessage: generateMessage({ id: 'first-quoted-message' }) });
    });

    expect(result.current).toBe(true);
    expect(messageComposer.isCommandDisabled).toHaveBeenCalledTimes(2);

    act(() => {
      state.partialNext({ quotedMessage: generateMessage({ id: 'second-quoted-message' }) });
    });

    expect(result.current).toBe(true);
    expect(messageComposer.isCommandDisabled).toHaveBeenCalledTimes(2);
  });
});
