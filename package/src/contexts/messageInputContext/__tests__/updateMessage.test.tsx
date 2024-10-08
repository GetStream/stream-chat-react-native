import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-native';

import type { StreamChat } from 'stream-chat';

import type { MessageType } from '../../../components/MessageList/hooks/useMessageList';

import { ChatContextValue, ChatProvider } from '../../../contexts/chatContext/ChatContext';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import * as AttachmentPickerContext from '../../attachmentPickerContext/AttachmentPickerContext';
import {
  InputMessageInputContextValue,
  MessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

const message = generateMessage({});

type WrapperType<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  Partial<InputMessageInputContextValue<StreamChatGenerics>>;

const Wrapper = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  ...rest
}: PropsWithChildren<WrapperType<StreamChatGenerics>>) => (
  <ChatProvider
    value={
      {
        client: {
          updateMessage: jest.fn().mockResolvedValue({ message }),
        } as unknown as StreamChat<StreamChatGenerics>,
      } as ChatContextValue<StreamChatGenerics>
    }
  >
    <MessageInputProvider
      value={
        {
          ...rest,
        } as MessageInputContextValue<StreamChatGenerics>
      }
    >
      {children}
    </MessageInputProvider>
  </ChatProvider>
);

describe("MessageInputContext's updateMessage", () => {
  jest.spyOn(AttachmentPickerContext, 'useAttachmentPickerContext').mockImplementation(() => ({
    setSelectedFiles: jest.fn(),
    setSelectedImages: jest.fn(),
  }));
  const clearEditingStateMock = jest.fn();
  const generatedMessage: boolean | MessageType<DefaultStreamChatGenerics> = generateMessage({
    created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
    id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
    text: 'hey',
    updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
    user: generateUser({
      id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
      image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
      name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
    }),
  }) as unknown as MessageType<DefaultStreamChatGenerics>;

  it('updateMessage throws error as clearEditingState is not available', async () => {
    const initialProps = {
      editing: generatedMessage,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => <Wrapper editing={initialProps.editing} {...props} />,
    });

    await act(async () => {
      await result.current.updateMessage();
    });

    expect(clearEditingStateMock).toHaveBeenCalledTimes(0);
  });

  it('updateMessage throws error as client.updateMessage is available', async () => {
    const initialProps = {
      clearEditingState: clearEditingStateMock,
      editing: generatedMessage,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          clearEditingState={initialProps.clearEditingState}
          editing={initialProps.editing}
          {...props}
        />
      ),
    });

    await act(async () => {
      await result.current.updateMessage();
    });

    expect(clearEditingStateMock).toHaveBeenCalledTimes(2);
  });
});
