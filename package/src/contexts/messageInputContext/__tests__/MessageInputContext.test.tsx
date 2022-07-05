import React, { PropsWithChildren } from 'react';

import { Alert, TextInput } from 'react-native';

import { act, renderHook } from '@testing-library/react-hooks';

import { waitFor } from '@testing-library/react-native';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import type { MessageType } from '../../../components/MessageList/hooks/useMessageList';
import { ChatContextValue, ChatProvider } from '../../../contexts/chatContext/ChatContext';

import {
  generateFileAttachment,
  generateFileUploadPreview,
  generateImageAttachment,
  generateImageUploadPreview,
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

  it('isValidMessage is false when text is empty and there is no image uploads and file uploads', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is true when text is present but there is no image uploads, file uploads and mentioned users', () => {
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
      result.current.setText('Dummy Text');
    });

    expect(result.current.isValidMessage()).toBe(true);
  });

  it('isValidMessage is true when text is not present and there are files', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([generateFileUploadPreview()]);
      result.current.setImageUploads([]);
      result.current.setMentionedUsers([]);
      result.current.setNumberOfUploads(0);
      result.current.setText('');
    });

    expect(result.current.isValidMessage()).toBe(true);
  });

  it('isValidMessage is true when text is not present and there are images', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([]);
      result.current.setImageUploads([generateImageUploadPreview()]);
      result.current.setMentionedUsers([]);
    });

    expect(result.current.isValidMessage()).toBe(true);
  });

  it('isValidMessage is false when text is not present and there is one image with state Upload Failed', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([]);
      result.current.setImageUploads([
        generateImageUploadPreview({ state: FileState.UPLOAD_FAILED }),
      ]);
      result.current.setMentionedUsers([]);
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is false when text is not present and there is one file with state Upload Failed', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([
        generateFileUploadPreview({ state: FileState.UPLOAD_FAILED }),
      ]);
      result.current.setImageUploads([]);
      result.current.setMentionedUsers([]);
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is false when text is not present and there is one file with state Uploading', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([generateFileUploadPreview({ state: FileState.UPLOADING })]);
      result.current.setImageUploads([]);
      result.current.setMentionedUsers([]);
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

  it('isValidMessage is false when text is not present and there is one image with state Uploading', () => {
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        hasImagePicker: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([]);
      result.current.setImageUploads([generateImageUploadPreview({ state: FileState.UPLOADING })]);
      result.current.setMentionedUsers([]);
    });

    expect(result.current.isValidMessage()).toBe(false);
  });

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

  it('pickFile throws alert when numberOfUploads is greater than equal to maxNumberOfFiles', () => {
    jest.spyOn(Alert, 'alert');
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        maxNumberOfFiles: 2,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setNumberOfUploads(3);
    });

    rerender({ editing: false, maxNumberOfFiles: 2 });

    act(() => {
      result.current.pickFile();
    });

    expect(Alert.alert).toHaveBeenCalledWith('Maximum number of files reached');
  });

  it('pickFile succeeds numberOfUploads is less than equal to maxNumberOfFiles', () => {
    jest.spyOn(Alert, 'alert');
    jest.spyOn(NativeUtils, 'pickDocument').mockImplementation(
      jest.fn().mockResolvedValue({
        cancelled: false,
        docs: [
          generateFileAttachment(),
          generateFileAttachment({
            name: 'dummy.mp3',
            uri: 'https://www.songspk.com/dummy.mp3',
          }),
        ],
      }),
    );
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        maxNumberOfFiles: 2,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setNumberOfUploads(1);
    });

    rerender({ editing: false, maxNumberOfFiles: 2 });

    act(() => {
      result.current.pickFile();
    });

    expect(Alert.alert).not.toHaveBeenCalled();
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

  it('removing an image works', async () => {
    const image = generateImageAttachment({
      file: {
        id: 'test',
        name: 'Test Image',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      },
    });

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setImageUploads([image]);
      result.current.setNumberOfUploads(1);
    });

    rerender({ editing: false });

    await waitFor(() => {
      expect(result.current.imageUploads.length).toBe(1);
    });

    act(() => {
      result.current.removeImage(image.id);
    });

    rerender({ editing: true });

    await waitFor(() => {
      expect(result.current.imageUploads.length).toBe(0);
      expect(result.current.numberOfUploads).toBe(0);
    });
  });

  it('image does not gets removed if the id do not match', async () => {
    const image = generateImageAttachment({
      file: {
        id: 'test',
        name: 'Test Image',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      },
    });

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setImageUploads([image]);
      result.current.setNumberOfUploads(1);
    });

    rerender({ editing: false });

    await waitFor(() => {
      expect(result.current.imageUploads.length).toBe(1);
    });

    act(() => {
      result.current.removeImage('dummy');
    });

    rerender({ editing: true });

    await waitFor(() => {
      expect(result.current.imageUploads.length).toBe(1);
      expect(result.current.numberOfUploads).toBe(1);
    });
  });

  it('removing a file works', async () => {
    const file = generateFileAttachment({
      file: {
        id: 'test',
        name: 'Test Image',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      },
    });

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([file]);
      result.current.setNumberOfUploads(1);
    });

    rerender({ editing: false });

    await waitFor(() => {
      expect(result.current.fileUploads.length).toBe(1);
    });

    act(() => {
      result.current.removeFile(file.id);
    });

    rerender({ editing: true });

    await waitFor(() => {
      expect(result.current.fileUploads.length).toBe(0);
      expect(result.current.numberOfUploads).toBe(0);
    });
  });

  it('file does not gets removed if the id do not match', async () => {
    const file = generateFileAttachment({
      file: {
        id: 'test',
        name: 'Test Image',
        uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
      },
    });

    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setFileUploads([file]);
      result.current.setNumberOfUploads(1);
    });

    rerender({ editing: false });

    await waitFor(() => {
      expect(result.current.fileUploads.length).toBe(1);
    });

    act(() => {
      result.current.removeFile('dummy');
    });

    rerender({ editing: true });

    await waitFor(() => {
      expect(result.current.fileUploads.length).toBe(1);
      expect(result.current.numberOfUploads).toBe(1);
    });
  });

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

  it('uploadFile works', () => {
    const doDocUploadRequestMock = jest.fn().mockResolvedValue({
      file: {
        url: '',
      },
      thumb_url: '',
    });
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        doDocUploadRequest: doDocUploadRequestMock,
        editing: true,
      },
      wrapper: Wrapper,
    });

    expect(result.current.fileUploads).toHaveLength(0);

    act(() => {
      result.current.uploadFile({ newFile: generateFileUploadPreview({ state: '' }) });
    });

    expect(doDocUploadRequestMock).toHaveBeenCalled();
  });

  it('uploadFile catch block gets executed', () => {
    const doDocUploadRequestMock = jest.fn().mockResolvedValue(new Error('This is an error'));
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        doDocUploadRequest: doDocUploadRequestMock,
        editing: true,
      },
      wrapper: Wrapper,
    });

    expect(result.current.fileUploads).toHaveLength(0);

    act(() => {
      result.current.uploadFile({ newFile: generateFileUploadPreview({ state: '' }) });
    });

    expect(result.current.fileUploads.length).toBe(0);
  });

  it('uploadImage works', async () => {
    const doImageUploadRequestMock = jest.fn().mockResolvedValue({ file: 'https://www' });
    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        doImageUploadRequest: doImageUploadRequestMock,
        editing: true,
      },
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.uploadImage({ newImage: generateImageUploadPreview() });
    });

    expect(doImageUploadRequestMock).toHaveBeenCalledTimes(1);
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

    expect(sendMessageMock).toHaveBeenCalledWith({
      attachments: [
        {
          fallback: undefined,
          image_url: undefined,
          original_height: undefined,
          original_width: undefined,
          type: 'image',
        },
        {
          fallback: undefined,
          image_url: undefined,
          original_height: undefined,
          original_width: undefined,
          type: 'image',
        },
      ],
      mentioned_users: ['dummy1', 'dummy2'],
      parent_id: undefined,
      quoted_message_id: undefined,
      show_in_channel: undefined,
      text: '',
    });
    expect(clearQuotedMessageStateMock).toHaveBeenCalled();
    expect(result.current.sending.current).toBeFalsy();
    expect(result.current.fileUploads.length).toBe(0);
    expect(result.current.imageUploads.length).toBe(0);
    expect(result.current.mentionedUsers.length).toBe(0);
  });

  it('exit sendMessage when image upload has an error and catch block is executed', () => {
    const setQuotedMessageStateMock = jest.fn();
    const clearQuotedMessageStateMock = jest.fn();
    const generatedQuotedMessage: boolean | MessageType<DefaultStreamChatGenerics> =
      generateMessage({
        created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
        id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
        updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
        user: generateUser({
          id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
          image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
          name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
        }),
      }) as unknown as MessageType<DefaultStreamChatGenerics>;
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
    const generatedMessage: boolean | MessageType<DefaultStreamChatGenerics> = generateMessage({
      created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
      updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      user: generateUser({
        id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
        image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
        name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
      }),
    }) as unknown as MessageType<DefaultStreamChatGenerics>;
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

    expect(editMessageMock).toHaveBeenCalledWith({
      attachments: [
        {
          fallback: undefined,
          image_url: undefined,
          original_height: undefined,
          original_width: undefined,
          type: 'image',
        },
      ],
      created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      html: '<p>regular</p>',
      id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
      mentioned_users: ['dummy1', 'dummy2'],
      quoted_message: undefined,
      text: '',
      type: 'regular',
      updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      user: {
        banned: false,
        created_at: '2020-04-27T13:39:49.331742Z',
        id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
        image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
        name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
        online: false,
        role: 'user',
        updated_at: '2020-04-27T13:39:49.332087Z',
      },
    });
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

    expect(sendMessageMock).toHaveBeenCalledWith({
      attachments: [
        {
          asset_url: undefined,
          fallback: undefined,
          file_size: undefined,
          mime_type: 'file',
          title: 'dummy.pdf',
          type: 'file',
        },
        {
          asset_url: undefined,
          duration: undefined,
          file_size: undefined,
          mime_type: 'video/mp4',
          thumb_url: undefined,
          title: 'dummy.pdf',
          type: 'video',
        },
        {
          asset_url: undefined,
          duration: undefined,
          file_size: undefined,
          mime_type: 'audio/mp3',
          title: 'dummy.pdf',
          type: 'audio',
        },
        {
          fallback: 'dummy.pdf',
          image_url: undefined,
          original_height: undefined,
          original_width: undefined,
          type: 'image',
        },
      ],
      mentioned_users: ['dummy1', 'dummy2'],
      parent_id: undefined,
      quoted_message_id: undefined,
      show_in_channel: undefined,
      text: '',
    });
    expect(clearQuotedMessageStateMock).toHaveBeenCalled();
    expect(result.current.sending.current).toBeFalsy();
    expect(result.current.fileUploads.length).toBe(0);
    expect(result.current.imageUploads.length).toBe(0);
    expect(result.current.mentionedUsers.length).toBe(0);
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

  it('sendMessageAsync returns undefined when image state is UPLOAD_FAILED', () => {
    const asyncUploads = {
      'test-file': {
        state: FileState.UPLOAD_FAILED,
        url: 'https://www.test.com',
      },
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: false });

    let data;
    act(() => {
      data = result.current.sendMessageAsync('test-file');
    });

    expect(data).toBeUndefined();
  });

  it('sendMessageAsync works when image state is UPLOADED', () => {
    const sendMessageMock = jest.fn();
    const asyncUploads = {
      'test-file': {
        state: FileState.UPLOADED,
        url: 'https://www.test.com',
      },
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        quotedMessage: false,
        sendMessage: sendMessageMock,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: false, quotedMessage: false, sendMessage: sendMessageMock });

    act(() => {
      result.current.sendMessageAsync('test-file');
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      attachments: [{ image_url: 'https://www.test.com', type: 'image' }],
      mentioned_users: [],
      parent_id: undefined,
      quoted_message_id: undefined,
      show_in_channel: undefined,
      text: '',
    });
  });

  it('sendMessageAsync works when image state is FINISHED', () => {
    const sendMessageMock = jest.fn();
    const asyncUploads = {
      'test-file': {
        state: FileState.FINISHED,
        url: 'https://www.test.com',
      },
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        quotedMessage: false,
        sendMessage: sendMessageMock,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: false, quotedMessage: false, sendMessage: sendMessageMock });

    act(() => {
      result.current.sendMessageAsync('test-file');
    });

    expect(sendMessageMock).toHaveBeenCalledWith({
      attachments: [{ image_url: 'https://www.test.com', type: 'image' }],
      mentioned_users: [],
      parent_id: undefined,
      quoted_message_id: undefined,
      show_in_channel: undefined,
      text: '',
    });
  });

  it('sendMessageAsync goes to catch block', () => {
    const sendMessageMock = jest.fn();
    const asyncUploads = {
      'test-file': {
        state: FileState.FINISHED,
        url: 'https://www.test.com',
      },
    };
    const { rerender, result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: true,
        quotedMessage: false,
      },
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setAsyncUploads(asyncUploads);
    });

    rerender({ editing: false, quotedMessage: false });

    act(() => {
      result.current.sendMessageAsync('test-file');
    });

    expect(sendMessageMock).not.toHaveBeenCalledWith({
      attachments: [{ image_url: 'https://www.test.com', type: 'image' }],
      mentioned_users: [],
      parent_id: undefined,
      quoted_message_id: undefined,
      show_in_channel: undefined,
      text: '',
    });
  });

  it('updateMessage throws error as clearEditingState is not available', async () => {
    const setUpdateMessageMock = jest.fn();
    const clearEditingStateMock = jest.fn();
    const generatedMessage: boolean | MessageType<DefaultStreamChatGenerics> = generateMessage({
      created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
      updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      user: generateUser({
        id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
        image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
        name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
      }),
    }) as unknown as MessageType<DefaultStreamChatGenerics>;

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        editing: generatedMessage,
        setInputRef: setUpdateMessageMock,
      },
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.updateMessage();
    });

    expect(clearEditingStateMock).toHaveBeenCalledTimes(0);
  });

  it('updateMessage throws error as client.updateMessage is available', async () => {
    const setUpdateMessageMock = jest.fn();
    const clearEditingStateMock = jest.fn();
    const generatedMessage: boolean | MessageType<DefaultStreamChatGenerics> = generateMessage({
      created_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      id: '7a85f744-cc89-4f82-a1d4-5456432cc8bf',
      updated_at: 'Sat Jul 02 2022 23:55:13 GMT+0530 (India Standard Time)',
      user: generateUser({
        id: '5d6f6322-567e-4e1e-af90-97ef1ed5cc23',
        image: 'fc86ddcb-bac4-400c-9afd-b0c0a1c0cd33',
        name: '50cbdd0e-ca7e-4478-9e2c-be0f1ac6a995',
      }),
    }) as unknown as MessageType<DefaultStreamChatGenerics>;

    const { result } = renderHook(() => useMessageInputContext(), {
      initialProps: {
        clearEditingState: clearEditingStateMock,
        editing: generatedMessage,
        setInputRef: setUpdateMessageMock,
      },
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.updateMessage();
    });

    expect(clearEditingStateMock).toHaveBeenCalledTimes(1);
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
