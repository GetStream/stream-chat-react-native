import React, { PropsWithChildren } from 'react';
import { act } from 'react-test-renderer';

import { renderHook } from '@testing-library/react-hooks';

import type { MessageType } from '../../../components/MessageList/hooks/useMessageList';
import {
  generateFileUploadPreview,
  generateImageUploadPreview,
} from '../../../mock-builders/generator/attachment';
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

describe("MessageInputContext's sendMessage", () => {
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
    const files = generateFileUploadPreview({ state: FileState.UPLOAD_FAILED });
    const images = generateImageUploadPreview({ state: FileState.UPLOAD_FAILED });
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
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

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        sendImageAsync: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setImageUploads([images]);
      result.current.setMentionedUsers([]);
      result.current.setText('');
    });

    act(() => {
      result.current.sendMessage();
    });

    rerender({ editing: false, sendImageAsync: true });

    await expect(result.current.asyncIds).toHaveLength(1);
    await expect(result.current.sending.current).toBeFalsy();
  });

  it('exit sendMessage when image upload status is uploading and sendImageAsync is available', async () => {
    const images = generateImageUploadPreview({ state: FileState.UPLOADING });

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
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
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
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

  it('exit sendMessage when image upload status is uploaded successfully', () => {
    const sendMessageMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const images = [
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.FINISHED }),
    ];
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        clearQuotedMessageState: clearQuotedMessageStateMock,
        editing: true,
        quotedMessage: false,
        sendMessage: sendMessageMock,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setImageUploads(images);
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

  it('exit sendMessage when image upload has an error and catch block is executed', () => {
    const setQuotedMessageStateMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const generatedQuotedMessage: boolean | MessageType<DefaultStreamChatGenerics> = message;
    const images = [
      generateImageUploadPreview({ state: FileState.UPLOADED }),
      generateImageUploadPreview({ state: FileState.FINISHED }),
    ];
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        clearQuotedMessageState: clearQuotedMessageStateMock,
        editing: true,
        quotedMessage: generatedQuotedMessage,
        setQuotedMessageState: setQuotedMessageStateMock,
      },
      wrapper: Wrapper,
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
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        clearEditingState: clearEditingStateMock,
        clearQuotedMessageState: clearQuotedMessageStateMock,
        editing: generatedMessage,
        editMessage: editMessageMock,
        quotedMessage: false,
        sendMessage: sendMessageMock,
      },
      wrapper: Wrapper,
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
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        clearQuotedMessageState: clearQuotedMessageStateMock,
        editing: true,
        quotedMessage: false,
        sendMessage: sendMessageMock,
      },
      wrapper: Wrapper,
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
