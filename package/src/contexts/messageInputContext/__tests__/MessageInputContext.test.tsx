import React, { PropsWithChildren } from 'react';

import type { TextInput } from 'react-native';

import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import { ChatContextValue, ChatProvider } from '../../../contexts/chatContext/ChatContext';

import { generateImageAttachment } from '../../../mock-builders/generator/attachment';

import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';

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

const user1 = generateUser();
const message = generateMessage({ user: user1 });
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

  it('appendText works', () => {
    const initialProps = {
      editing: message,
      hasImagePicker: true,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          editing={initialProps.editing}
          hasImagePicker={initialProps.hasImagePicker}
          {...props}
        />
      ),
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
    const initialProps = {
      editing: message,
      maxNumberOfFiles: 2,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          editing={initialProps.editing}
          maxNumberOfFiles={initialProps.maxNumberOfFiles}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.uploadNewImage(
        generateImageAttachment({
          name: 'dummy.png',
          uri: 'https://www.bastiaanmulder.nl/wp-content/uploads/2013/11/dummy-image-square.png',
        }),
      );
    });

    expect(result.current.imageUploads[0].state).toBe(FileState.NOT_SUPPORTED);

    act(() => {
      result.current.uploadNewFile({
        name: 'dummy.mp3',
        uri: 'https://www.bastiaanmulder.nl/wp-content/uploads/2013/11/dummy.mp3',
      });
    });
    expect(result.current.imageUploads[0].state).toBe(FileState.NOT_SUPPORTED);
  });

  it('onSelectItem works', () => {
    const mentioned_user = generateUser();
    const initialUsers = [mentioned_user.id];

    const initialProps = {
      editing: message,
      hasImagePicker: true,
    };

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          editing={initialProps.editing}
          hasImagePicker={initialProps.hasImagePicker}
          {...props}
        />
      ),
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
    const initialProps = {
      editing: message,
      setInputRef: setInputRefMock,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper editing={initialProps.editing} setInputRef={initialProps.setInputRef} {...props} />
      ),
    });

    act(() => {
      if (result.current.setInputBoxRef) {
        result.current.setInputBoxRef(inputRef.current);
      }
    });

    expect(setInputRefMock).toHaveBeenCalled();
  });

  it('openCommandsPicker works', () => {
    const initialProps = {
      editing: message,
      hasImagePicker: true,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          editing={initialProps.editing}
          hasImagePicker={initialProps.hasImagePicker}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.openCommandsPicker();
    });

    expect(result.current.text).toBe(`${initialProps.editing.text}/`);
  });

  it('openMentionPicker works', async () => {
    const initialProps = {
      editing: message,
      hasImagePicker: true,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          editing={initialProps.editing}
          hasImagePicker={initialProps.hasImagePicker}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.openMentionsPicker();
    });

    await waitFor(() => {
      expect(result.current.text).toBe(`${initialProps.editing.text}@`);
    });
  });
});
