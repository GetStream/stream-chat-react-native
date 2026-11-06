import React from 'react';
import { View } from 'react-native';

import { render } from '@testing-library/react-native';

import {
  useAttachmentPickerContext,
  useChannelContext,
  useChannelsContext,
  useChatContext,
  useBottomSheetContext,
  useCreatePollContentContext,
  useImageGalleryContext,
  useMessageInputContext,
  useMessagesContext,
  useOverlayContext,
  useOwnCapabilitiesContext,
  usePollContext,
  useTheme,
  useThreadContext,
} from '../';
import { useMessageListItemContext } from '../messageListItemContext/MessageListItemContext';

jest.mock('../utils/isTestEnvironment', () => ({ isTestEnvironment: jest.fn(() => false) }));
jest.spyOn(console, 'error').mockImplementation();
describe('contexts hooks in a component throws an error with message when not wrapped in a provider', () => {
  const TestComponent = ({ useContextHook }: { useContextHook(): void }) => {
    useContextHook();
    return <View />;
  };

  it.each([
    [
      useOverlayContext,
      'The useOverlayContext hook was called outside the OverlayContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/overlay-provider/',
    ],
    [
      useOwnCapabilitiesContext,
      'The useOwnCapabilitiesContext hook was called outside the Channel Component. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    ],
    [
      useTheme,
      'The useThemeContext hook was called outside the ThemeContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/overlay-provider/',
    ],
    [
      useChannelContext,
      'The useChannelContext hook was called outside of the ChannelContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    ],
    [
      useChannelsContext,
      'The useChannelsContext hook was called outside of the ChannelsContext provider. Make sure you have configured ChannelList component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel-list/',
    ],
    [
      useChatContext,
      'The useChatContext hook was called outside the ChatContext Provider. Make sure you have configured Chat component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/chat/',
    ],
    [
      useImageGalleryContext,
      'The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/overlay-provider/',
    ],
    [
      useMessagesContext,
      'The useMessagesContext hook was called outside of the MessagesContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    ],
    [
      useAttachmentPickerContext,
      'The useAttachmentPickerContext hook was called outside the AttachmentPickerContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    ],
    [
      useMessageInputContext,
      'The useMessageInputContext hook was called outside of the MessageInputContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    ],
    [
      useMessageListItemContext,
      'The useMessageListItemContext hook was called outside of the MessageListItemContext provider. Make sure you have configured MessageList component correctly - https://getstream.io/chat/docs/sdk/react-native/ui-components/message-list/',
    ],
    [
      usePollContext,
      'The usePollContext hook was called outside of the PollContext provider. Make sure you have configured the Poll component correctly - https://getstream.io/chat/docs/sdk/react-native/ui-components/poll/',
    ],
    [
      useCreatePollContentContext,
      'The useCreatePollContentContext hook was called outside of the CreatePollContentContext provider. Make sure you have configured the CreatePoll component correctly - https://getstream.io/chat/docs/sdk/react-native/ui-components/create-poll/',
    ],
    [
      useBottomSheetContext,
      'The useBottomSheetContext hook was called outside the BottomSheetContext Provider. Make sure you have configured BottomSheetModal component correctly.',
    ],
  ])('calls %p results in error %p', (useContextHook, expectedErrorMessage) => {
    expect(() => render(<TestComponent useContextHook={useContextHook} />)).toThrow(
      expectedErrorMessage,
    );
  });
});

// Only `<Thread>` provides the thread context, so outside one a component reads "no thread" rather
// than a missing provider.
describe('useThreadContext', () => {
  it('returns no thread outside a thread', () => {
    let thread: unknown = 'unset';
    const TestComponent = () => {
      thread = useThreadContext().thread;
      return <View />;
    };

    render(<TestComponent />);

    expect(thread).toBeUndefined();
  });
});
