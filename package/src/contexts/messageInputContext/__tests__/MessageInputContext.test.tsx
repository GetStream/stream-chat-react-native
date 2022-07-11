import React, { PropsWithChildren } from 'react';

import type { TextInput } from 'react-native';

import { act, renderHook } from '@testing-library/react-hooks';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import { ChatContextValue, ChatProvider } from '../../../contexts/chatContext/ChatContext';

import {
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/generator/attachment';

import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';

import * as NativeUtils from '../../../native';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { FileState } from '../../../utils/utils';
import {
  InputMessageInputContextValue,
  MessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

type WrapperType<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  Partial<InputMessageInputContextValue<StreamChatGenerics>>;

afterEach(jest.clearAllMocks);

describe('MessageInputContext', () => {
  const Wrapper = <
    StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  >({
    children,
    ...rest
  }: PropsWithChildren<WrapperType<StreamChatGenerics>>) => (
    <ChatProvider
      value={
        {
          appSettings: {
            app: {
              file_upload_config: {
                blocked_file_extensions: ['.mp3'],
                blocked_mime_types: ['video/mp4'],
              },
              image_upload_config: {
                blocked_file_extensions: ['.png'],
                blocked_mime_types: ['image/png'],
              },
            },
          } as unknown as AppSettingsAPIResponse<StreamChatGenerics>,
          client: {
            updateMessage: jest.fn().mockResolvedValue({ message: generateMessage() }),
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

  it('appendText works', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([]);
      result.current.setImageUploads([]);
      result.current.setMentionedUsers([]);
      result.current.setText('dummy');
      result.current.appendText('text');
    });

    expect(result.current.text).toBe('dummytext');
  });

  it('uploadNewImage with blocked image extensions to be not supported', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        maxNumberOfFiles: 2,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.uploadNewImage(
        generateImageAttachment({
          uri: 'https://www.bastiaanmulder.nl/wp-content/uploads/2013/11/dummy-image-square.png',
        }),
      );
    });

    expect(result.current.imageUploads[0].state).toBe(FileState.NOT_SUPPORTED);
  });

  it('onSelectItem works', () => {
    const mentioned_user = generateUser();
    const initialUsers = [mentioned_user.id];

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([]);
      result.current.setImageUploads([]);
      result.current.setMentionedUsers(initialUsers);
      result.current.onSelectItem(mentioned_user);
    });

    expect(result.current.mentionedUsers.length).toBe(2);
  });

  it('setInputBoxRef works', () => {
    const setInputRefMock = jest.fn();
    const inputRef = React.createRef<TextInput | null>();
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        setInputRef: setInputRefMock,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setInputBoxRef(inputRef.current);
    });

    expect(setInputRefMock).toHaveBeenCalled();
  });

  it('openCommandsPicker works', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.openCommandsPicker();
    });

    expect(result.current.text).toBe('/');
  });

  it('openMentionPicker works', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.openMentionsPicker();
    });

    expect(result.current.text).toBe('@');
  });

  it('openAttachmentPicker works', async () => {
    jest.spyOn(NativeUtils, 'pickDocument').mockImplementation(
      jest.fn().mockResolvedValue({
        cancelled: false,
        docs: [generateFileAttachment(), generateImageAttachment()],
      }),
    );
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasFilePicker: true,
        hasImagePicker: false,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.openAttachmentPicker();
    });

    expect(await result.current.pickFile()).toBe(undefined);
  });
});
