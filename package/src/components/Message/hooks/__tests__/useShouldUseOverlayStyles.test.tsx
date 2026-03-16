import React, { PropsWithChildren } from 'react';

import { act, cleanup, renderHook } from '@testing-library/react-native';

import {
  MessageContextValue,
  MessageProvider,
} from '../../../../contexts/messageContext/MessageContext';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { finalizeCloseOverlay, openOverlay, overlayStore } from '../../../../state-store';

import { useShouldUseOverlayStyles } from '../useShouldUseOverlayStyles';

const createMessageContextValue = (overrides: Partial<MessageContextValue>): MessageContextValue =>
  ({
    actionsEnabled: false,
    alignment: 'left',
    channel: {} as MessageContextValue['channel'],
    deliveredToCount: 0,
    dismissOverlay: jest.fn(),
    files: [],
    groupStyles: [],
    handleAction: jest.fn(),
    handleToggleReaction: jest.fn(),
    hasReactions: false,
    images: [],
    isMessageAIGenerated: jest.fn(),
    isMyMessage: false,
    lastGroupMessage: false,
    members: {},
    message: generateMessage({ id: 'shared-message-id' }),
    messageContentOrder: [],
    messageHasOnlySingleAttachment: false,
    messageOverlayId: 'message-overlay-default',
    onLongPress: jest.fn(),
    onlyEmojis: false,
    onOpenThread: jest.fn(),
    onPress: jest.fn(),
    onPressIn: null,
    otherAttachments: [],
    reactions: [],
    readBy: false,
    setQuotedMessage: jest.fn(),
    showAvatar: false,
    showMessageOverlay: jest.fn(),
    showReactionsOverlay: jest.fn(),
    showMessageStatus: false,
    threadList: false,
    videos: [],
    ...overrides,
  }) as MessageContextValue;

const createWrapper = (value: MessageContextValue) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <MessageProvider value={value}>{children}</MessageProvider>
  );

  return Wrapper;
};

describe('useShouldUseOverlayStyles', () => {
  beforeEach(() => {
    act(() => {
      finalizeCloseOverlay();
      overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
        messageId: undefined,
      });
    });
  });

  afterEach(() => {
    cleanup();

    act(() => {
      finalizeCloseOverlay();
      overlayStore.next({
        closing: false,
        closingPortalHostBlacklist: [],
        id: undefined,
        messageId: undefined,
      });
    });
  });

  it('tracks overlay activity by messageOverlayId instead of message.id', () => {
    const sharedMessage = generateMessage({ id: 'same-message-id' });

    const first = renderHook(() => useShouldUseOverlayStyles(), {
      wrapper: createWrapper(
        createMessageContextValue({
          message: sharedMessage,
          messageOverlayId: 'message-overlay-first',
        }),
      ),
    });

    const second = renderHook(() => useShouldUseOverlayStyles(), {
      wrapper: createWrapper(
        createMessageContextValue({
          message: sharedMessage,
          messageOverlayId: 'message-overlay-second',
        }),
      ),
    });

    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);

    act(() => {
      openOverlay('message-overlay-first');
    });

    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(false);

    first.unmount();
    second.unmount();
  });
});
