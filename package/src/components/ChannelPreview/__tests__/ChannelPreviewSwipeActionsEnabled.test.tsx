import React from 'react';
import { Text, View } from 'react-native';

import { render } from '@testing-library/react-native';
import type { Channel } from 'stream-chat';

import { ChannelPreview } from '../ChannelPreview';
import type { LastMessageType } from '../hooks/useChannelPreviewData';

const mockUseChannelsContext = jest.fn();
const mockUseChatContext = jest.fn();
const mockUseChannelPreviewData = jest.fn();
const mockUseTranslatedMessage = jest.fn();
const mockChannelSwipableWrapper = jest.fn(({ children }: React.PropsWithChildren) => (
  <View testID='swipe-wrapper'>{children}</View>
));

jest.mock('../../../contexts/channelsContext/ChannelsContext', () => ({
  useChannelsContext: () => mockUseChannelsContext(),
}));

jest.mock('../../../contexts/chatContext/ChatContext', () => ({
  useChatContext: () => mockUseChatContext(),
}));

jest.mock('../hooks/useChannelPreviewData', () => ({
  useChannelPreviewData: (...args: unknown[]) => mockUseChannelPreviewData(...args),
}));

jest.mock('../../../hooks/useTranslatedMessage', () => ({
  useTranslatedMessage: (...args: unknown[]) => mockUseTranslatedMessage(...args),
}));

jest.mock('../ChannelSwipableWrapper', () => ({
  ChannelSwipableWrapper: (...args: unknown[]) => mockChannelSwipableWrapper(...args),
}));

const PreviewComponent = ({
  lastMessage,
  muted,
  unread,
}: {
  lastMessage: LastMessageType;
  muted: boolean;
  unread: number;
}) => (
  <>
    <Text testID='preview-muted'>{`${muted}`}</Text>
    <Text testID='preview-unread'>{`${unread}`}</Text>
    <Text testID='preview-last-message'>{lastMessage?.text ?? ''}</Text>
  </>
);

describe('ChannelPreview swipeActionsEnabled', () => {
  const channel = { cid: 'messaging:test-channel', id: 'test-channel' } as Channel;
  const client = { userID: 'test-user-id' };
  const lastMessage = { text: 'hello' } as LastMessageType;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChannelsContext.mockReturnValue({
      Preview: PreviewComponent,
      getChannelActionItems: undefined,
      swipeActionsEnabled: true,
    });
    mockUseChatContext.mockReturnValue({ client });
    mockUseChannelPreviewData.mockReturnValue({
      muted: false,
      unread: 3,
      lastMessage,
    });
    mockUseTranslatedMessage.mockReturnValue(undefined);
  });

  it('does not render ChannelSwipableWrapper when swipeActionsEnabled is false', () => {
    mockUseChannelsContext.mockReturnValue({
      Preview: PreviewComponent,
      getChannelActionItems: undefined,
      swipeActionsEnabled: false,
    });

    const { getByTestId, queryByTestId } = render(<ChannelPreview channel={channel} />);

    expect(getByTestId('preview-muted')).toHaveTextContent('false');
    expect(getByTestId('preview-unread')).toHaveTextContent('3');
    expect(getByTestId('preview-last-message')).toHaveTextContent('hello');
    expect(queryByTestId('swipe-wrapper')).toBeNull();
    expect(mockChannelSwipableWrapper).not.toHaveBeenCalled();
  });

  it('renders ChannelSwipableWrapper when swipeActionsEnabled is true', () => {
    const { getByTestId } = render(<ChannelPreview channel={channel} />);

    expect(getByTestId('swipe-wrapper')).toBeTruthy();
    expect(mockChannelSwipableWrapper).toHaveBeenCalledTimes(1);
    expect(getByTestId('preview-unread')).toHaveTextContent('3');
  });
});
