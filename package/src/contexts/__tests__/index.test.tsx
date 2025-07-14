import React from 'react';
import { View } from 'react-native';

import { render } from '@testing-library/react-native';

import {
  useAttachmentPickerContext,
  useChannelContext,
  useChannelsContext,
  useChatContext,
  useImageGalleryContext,
  useMessagesContext,
  useOverlayContext,
  useOwnCapabilitiesContext,
  usePaginatedMessageListContext,
  useTheme,
  useThreadContext,
  useTypingContext,
} from '../';
import { useChannelsStateContext } from '../channelsStateContext/ChannelsStateContext';

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
      'The useOverlayContext hook was called outside the OverlayContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    ],
    [
      usePaginatedMessageListContext,
      'The usePaginatedMessageListContext hook was called outside of the PaginatedMessageList provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    ],
    [
      useChannelsStateContext,
      'The useChannelsStateContext hook was called outside the ChannelStateContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    ],
    [
      useOwnCapabilitiesContext,
      'The useOwnCapabilitiesContext hook was called outside the Channel Component. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    ],
    [
      useTypingContext,
      'The useTypingContext hook was called outside of the TypingContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    ],
    [
      useTheme,
      'The useThemeContext hook was called outside the ThemeContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    ],
    [
      useChannelContext,
      'The useChannelContext hook was called outside of the ChannelContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    ],
    [
      useChannelsContext,
      'The useChannelsContext hook was called outside of the ChannelsContext provider. Make sure you have configured ChannelList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel-list',
    ],
    [
      useChatContext,
      'The useChatContext hook was called outside the ChatContext Provider. Make sure you have configured Chat component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#chat',
    ],
    [
      useImageGalleryContext,
      'The useImageGalleryContext hook was called outside the ImageGalleryContext Provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    ],
    [
      useMessagesContext,
      'The useMessagesContext hook was called outside of the MessagesContext provider. Make sure you have configured MessageList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#message-list',
    ],
    [
      useThreadContext,
      'The useThreadContext hook was called outside of the ThreadContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    ],
    [
      useAttachmentPickerContext,
      'The useAttachmentPickerContext hook was called outside the AttachmentPickerContext provider. Make sure you have configured OverlayProvider component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#overlay-provider',
    ],
  ])('calls %p results in error %p', (useContextHook, expectedErrorMessage) => {
    expect(() => render(<TestComponent useContextHook={useContextHook} />)).toThrow(
      expectedErrorMessage,
    );
  });
});
