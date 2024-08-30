import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook, waitFor } from '@testing-library/react-native';

import type { MessageType } from '../../../components/MessageList/hooks/useMessageList';
import {
  generateFileUploadPreview,
  generateImageUploadPreview,
} from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { FileState } from '../../../utils/utils';
import * as AttachmentPickerContext from '../../attachmentPickerContext/AttachmentPickerContext';
import {
  InputMessageInputContextValue,
  MessageInputContextValue,
  MessageInputProvider,
  useMessageInputContext,
} from '../MessageInputContext';

type WrapperType<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  Partial<InputMessageInputContextValue<StreamChatGenerics>>;

const Wrapper = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  ...rest
}: PropsWithChildren<WrapperType<StreamChatGenerics>>) => (
  <MessageInputProvider
    value={
      {
        ...rest,
      } as MessageInputContextValue<StreamChatGenerics>
    }
  >
    {children}
  </MessageInputProvider>
);

const newMessage = generateMessage({ id: 'new-id' });
describe("MessageInputContext's sendMessage", () => {
  jest.spyOn(AttachmentPickerContext, 'useAttachmentPickerContext').mockImplementation(() => ({
    setSelectedFiles: jest.fn(),
    setSelectedImages: jest.fn(),
  }));
  const message: boolean | MessageType<DefaultStreamChatGenerics> = generateMessage({
    created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
    id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
    updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
    user: generateUser({
      id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
      image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
      name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
    }),
  }) as unknown as MessageType<DefaultStreamChatGenerics>;

  it('exit sendMessage when file upload status failed', async () => {
    const initialProps = {
      editing: undefined,
    };
    const files = generateFileUploadPreview({ state: FileState.UPLOAD_FAILED });
    const images = generateImageUploadPreview({ state: FileState.UPLOAD_FAILED });
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          // @ts-ignore
          editing={initialProps.editing}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setFileUploads([files]);
      result.current.setImageUploads([images]);
    });

    act(() => {
      result.current.sendMessage();
    });

    await expect(result.current.sending.current).toBeFalsy();
  });

  it('exit sendMessage when image upload status is uploading', async () => {
    const images = generateImageUploadPreview({ state: FileState.UPLOADING });
    const initialProps = {
      editing: message,
      sendImageAsync: true,
    };

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          // @ts-ignore
          editing={initialProps.editing}
          sendImageAsync={initialProps.sendImageAsync}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setImageUploads([images]);
      result.current.setMentionedUsers([]);
      result.current.setText('');
    });

    await waitFor(() => {
      result.current.sendMessage();
    });

    rerender({ editing: newMessage, sendImageAsync: true });

    await waitFor(() => {
      expect(result.current.asyncIds).toHaveLength(1);
    });
    await expect(result.current.sending.current).toBeFalsy();
  });

  it('exit sendMessage when image upload status is uploading and sendImageAsync is available', async () => {
    const images = generateImageUploadPreview({ state: FileState.UPLOADING });
    const initialProps = {
      editing: message,
    };

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          // @ts-ignore
          editing={initialProps.editing}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setImageUploads([images]);
      result.current.setMentionedUsers([]);
      result.current.setText('');
    });

    act(() => {
      result.current.sendMessage();
    });

    await expect(result.current.sending.current).toBeFalsy();
  });

  it('exit sendMessage when file upload status is uploading', async () => {
    const files = generateFileUploadPreview({ state: FileState.UPLOADING });
    const initialProps = {
      editing: message,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          // @ts-ignore
          editing={initialProps.editing}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setFileUploads([files]);
      result.current.setMentionedUsers([]);
      result.current.setText('');
    });

    act(() => {
      result.current.sendMessage();
    });

    await expect(result.current.sending.current).toBeFalsy();
  });

  it('exit sendMessage when image upload status is uploaded successfully', async () => {
    const sendMessageMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const images = [
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.FINISHED }),
    ];
    const initialProps = {
      clearQuotedMessageState: clearQuotedMessageStateMock,
      editing: undefined,
      quotedMessage: false,
      sendMessage: sendMessageMock,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          clearQuotedMessageState={initialProps.clearQuotedMessageState}
          editing={initialProps.editing}
          quotedMessage={initialProps.quotedMessage}
          sendMessage={initialProps.sendMessage}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setImageUploads(images);
      result.current.setMentionedUsers(['dummy1', 'dummy2']);
      result.current.setText('');
    });

    await waitFor(() => {
      result.current.sendMessage();
    });

    expect(sendMessageMock.mock.calls[0][0]).toMatchSnapshot();
    expect(clearQuotedMessageStateMock).toHaveBeenCalled();
    expect(result.current.sending.current).toBeFalsy();
    expect(result.current.fileUploads.length).toBe(0);
    expect(result.current.imageUploads.length).toBe(0);
    expect(result.current.mentionedUsers.length).toBe(0);
  });

  it('exit sendMessage when image upload has an error and catch block is executed', () => {
    const setQuotedMessageStateMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const generatedQuotedMessage: boolean | MessageType<DefaultStreamChatGenerics> = message;
    const images = [
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.FINISHED }),
    ];
    const initialProps = {
      clearQuotedMessageState: clearQuotedMessageStateMock,
      editing: undefined,
      quotedMessage: generatedQuotedMessage,
      setQuotedMessageState: setQuotedMessageStateMock,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          // @ts-ignore
          clearEditingState={initialProps.clearQuotedMessageState}
          editing={initialProps.editing}
          quotedMessage={initialProps.quotedMessage}
          setQuotedMessageState={initialProps.setQuotedMessageState}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setImageUploads(images);
      result.current.setMentionedUsers(['dummy1', 'dummy2']);
      result.current.setText('');
    });

    act(() => {
      result.current.sendMessage();
    });

    expect(setQuotedMessageStateMock).toHaveBeenCalled();
    expect(result.current.sending.current).toBeFalsy();
  });

  it('exit sendMessage when edit message is not boolean image upload status is uploaded successfully', () => {
    const sendMessageMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const clearEditingStateMock = jest.fn();
    const editMessageMock = jest.fn().mockResolvedValue({ data: {} });
    const images = generateImageUploadPreview({ state: FileState.UPLOADED });
    const generatedMessage: boolean | MessageType<DefaultStreamChatGenerics> = message;
    const initialProps = {
      clearEditingState: clearEditingStateMock,
      clearQuotedMessageState: clearQuotedMessageStateMock,
      editing: generatedMessage,
      editMessage: editMessageMock,
      quotedMessage: false,
      sendMessage: sendMessageMock,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          clearEditingState={initialProps.clearEditingState}
          clearQuotedMessageState={initialProps.clearQuotedMessageState}
          editing={initialProps.editing}
          editMessage={initialProps.editMessage}
          quotedMessage={initialProps.quotedMessage}
          sendMessage={initialProps.sendMessage}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setImageUploads([images]);
      result.current.setMentionedUsers(['dummy1', 'dummy2']);
      result.current.setText('');
    });

    act(() => {
      result.current.sendMessage();
    });

    expect(editMessageMock.mock.calls[0][0]).toMatchSnapshot();
    expect(clearEditingStateMock).toHaveBeenCalled();
    expect(result.current.sending.current).toBeFalsy();
    expect(result.current.fileUploads.length).toBe(0);
    expect(result.current.imageUploads.length).toBe(0);
    expect(result.current.mentionedUsers.length).toBe(0);
  });

  it('exit sendMessage when file upload status is uploaded successfully', () => {
    const files = [
      generateFileUploadPreview({ state: FileState.UPLOADED }),
      generateFileUploadPreview({ state: FileState.FINISHED, type: 'video/mp4' }),
      generateFileUploadPreview({ state: FileState.UPLOADED, type: 'audio/mp3' }),
      generateFileUploadPreview({ state: FileState.FINISHED, type: 'image/jpeg' }),
    ];
    const sendMessageMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const initialProps = {
      clearQuotedMessageState: clearQuotedMessageStateMock,
      editing: undefined,
      quotedMessage: false,
      sendMessage: sendMessageMock,
    };
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps,
      wrapper: (props) => (
        <Wrapper
          // @ts-ignore
          clearQuotedMessageState={initialProps.clearQuotedMessageState}
          editing={initialProps.editing}
          quotedMessage={initialProps.quotedMessage}
          sendMessage={initialProps.sendMessage}
          {...props}
        />
      ),
    });

    act(() => {
      result.current.setFileUploads(files);
      result.current.setMentionedUsers(['dummy1', 'dummy2']);
      result.current.setText('');
    });

    act(() => {
      result.current.sendMessage();
    });

    expect(sendMessageMock.mock.calls[0][0]).toMatchSnapshot();
    expect(clearQuotedMessageStateMock).toHaveBeenCalled();
    expect(result.current.sending.current).toBeFalsy();
    expect(result.current.fileUploads.length).toBe(0);
    expect(result.current.imageUploads.length).toBe(0);
    expect(result.current.mentionedUsers.length).toBe(0);
  });
});
