import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import uniq from 'lodash/uniq';
import { lookup } from 'mime-types';
import {
  Attachment,
  logChatPromiseExecution,
  SendFileAPIResponse,
  StreamChat,
  Message as StreamMessage,
  UserResponse,
} from 'stream-chat';

import { useMessageDetailsForState } from './hooks/useMessageDetailsForState';

import { ChatContextValue, useChatContext } from '../chatContext/ChatContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../channelContext/ChannelContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../translationContext/TranslationContext';
import { getDisplayName } from '../utils/getDisplayName';

import {
  ACITriggerSettings,
  FileState,
  generateRandomId,
  TriggerSettings,
} from '../../utils/utils';

import { pickDocument, pickImage as pickImageNative } from '../../native';

import type { TextInput, TextInputProps } from 'react-native';

import type { AttachButtonProps } from '../../components/MessageInput/AttachButton';
import type { CommandsButtonProps } from '../../components/MessageInput/CommandsButton';
import type { FileUploadPreviewProps } from '../../components/MessageInput/FileUploadPreview';
import type { ImageUploadPreviewProps } from '../../components/MessageInput/ImageUploadPreview';
import type { MessageInputProps } from '../../components/MessageInput/MessageInput';
import type { MoreOptionsButtonProps } from '../../components/MessageInput/MoreOptionsButton';
import type { SendButtonProps } from '../../components/MessageInput/SendButton';
import type { UploadProgressIndicatorProps } from '../../components/MessageInput/UploadProgressIndicator';
import type { Message } from '../../components/MessageList/hooks/useMessageList';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type FileUpload = {
  file: {
    name: string;
    size?: number | string;
    type?: string;
    uri?: string;
  };
  id: string;
  state: string;
  url?: string;
};

export type ImageUpload = {
  file: {
    name?: string;
    uri?: string;
  };
  id: string;
  state: string;
  url?: string;
};

export type LocalMessageInputContext<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = {
  appendText: (newText: string) => void;
  asyncIds: string[];
  asyncUploads: {
    [key: string]: {
      state: string;
      url: string;
    };
  };
  /**
   * An array of file objects which are set for upload. It has the following structure:
   *
   * ```json
   *  [
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_1",
   *      "state": "uploading" // or "finished",
   *      "url": "https://url1.com",
   *    },
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_2",
   *      "state": "uploading" // or "finished",
   *      "url": "https://url1.com",
   *    },
   *  ]
   * ```
   *
   */
  fileUploads: FileUpload[];
  focused: boolean;
  /**
   * An array of image objects which are set for upload. It has the following structure:
   *
   * ```json
   *  [
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_1",
   *      "state": "uploading" // or "finished",
   *    },
   *    {
   *      "file": // File object,
   *      "id": "randomly_generated_temp_id_2",
   *      "state": "uploading" // or "finished",
   *    },
   *  ]
   * ```
   *
   */
  imageUploads: ImageUpload[];
  inputBoxRef: React.MutableRefObject<TextInput | null>;
  isValidMessage: () => boolean;
  mentionedUsers: string[];
  numberOfUploads: number;
  onChange: (newText: string) => void;
  onSelectItem: (item: UserResponse<Us>) => void;
  pickFile: () => Promise<void>;
  pickImage: () => Promise<void>;
  /**
   * Function for removing a file from the upload preview
   *
   * @param id string ID of file in `fileUploads` object in state of MessageInput
   */
  removeFile: (id: string) => void;
  /**
   * Function for removing an image from the upload preview
   *
   * @param id string ID of image in `imageUploads` object in state of MessageInput
   */
  removeImage: (id: string) => void;
  resetInput: (pendingAttachments?: Attachment[]) => void;
  sending: React.MutableRefObject<boolean>;
  sendMessage: () => Promise<void>;
  sendMessageAsync: (id: string) => void;
  setAsyncIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAsyncUploads: React.Dispatch<
    React.SetStateAction<{
      [key: string]: {
        state: string;
        url: string;
      };
    }>
  >;
  setFileUploads: React.Dispatch<React.SetStateAction<FileUpload[]>>;
  setFocused: React.Dispatch<React.SetStateAction<boolean>>;
  setImageUploads: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
  /**
   * Ref callback to set reference on input box
   */
  setInputBoxRef: (ref: TextInput | null) => void;
  setMentionedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  setNumberOfUploads: React.Dispatch<React.SetStateAction<number>>;
  setText: React.Dispatch<React.SetStateAction<string>>;
  /**
   * Text value of the TextInput
   */
  text: string;
  /**
   * Mapping of input triggers to the outputs to be displayed by the AutoCompleteInput
   */
  triggerSettings: TriggerSettings<Co, Us>;
  updateMessage: () => Promise<void>;
  /** Function for attempting to upload a file */
  uploadFile: ({ newFile }: { newFile: FileUpload }) => Promise<void>;
  /** Function for attempting to upload an image */
  uploadImage: ({ newImage }: { newImage: ImageUpload }) => Promise<void>;
  uploadNewFile: (file: {
    name: string;
    size?: number | string;
    type?: string;
    uri?: string;
  }) => Promise<void>;
  uploadNewImage: (image: { uri?: string }) => Promise<void>;
};

export const isEditingBoolean = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  editing: MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>['editing'],
): editing is boolean => typeof editing === 'boolean';

export type InputMessageInputContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Custom UI component for attach button.
   *
   * Defaults to and accepts same props as: [AttachButton](https://getstream.github.io/stream-chat-react-native/#attachbutton)
   */
  AttachButton: React.ComponentType<AttachButtonProps>;
  clearEditingState: () => void;
  clearReplyToState: () => void;
  /**
   * Custom UI component for commands button.
   *
   * Defaults to and accepts same props as: [CommandsButton](https://getstream.github.io/stream-chat-react-native/#commandsbutton)
   */
  CommandsButton: React.ComponentType<CommandsButtonProps>;
  editing: boolean | Message<At, Ch, Co, Ev, Me, Re, Us>;
  editMessage: StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage'];
  /**
   * Custom UI component for FileUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageInput/FileUploadPreview.tsx
   */
  FileUploadPreview: React.ComponentType<FileUploadPreviewProps>;
  /** If component should have file picker functionality */
  hasFilePicker: boolean;
  /** If component should have image picker functionality */
  hasImagePicker: boolean;
  /**
   * Custom UI component for ImageUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageInput/ImageUploadPreview.tsx
   */
  ImageUploadPreview: React.ComponentType<ImageUploadPreviewProps>;
  /** Limit on allowed number of files to attach at a time. */
  maxNumberOfFiles: number;
  /**
   * Custom UI component for more options button.
   *
   * Defaults to and accepts same props as: [MoreOptionsButton](https://getstream.github.io/stream-chat-react-native/#moreoptionsbutton)
   */
  MoreOptionsButton: React.ComponentType<MoreOptionsButtonProps>;
  /** Limit on the number of lines in the text input before scrolling */
  numberOfLines: number;
  replyTo: boolean | Message<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react-native/#sendbutton)
   */
  SendButton: React.ComponentType<SendButtonProps>;
  sendImageAsync: boolean;
  sendMessage: (message: Partial<StreamMessage<At, Me, Us>>) => Promise<void>;
  UploadProgressIndicator: React.ComponentType<UploadProgressIndicatorProps>;
  /**
   * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
   *
   * @see See https://reactnative.dev/docs/textinput#reference
   */
  additionalTextInputProps?: TextInputProps;
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality).
   * On iOS, values larger than 0.8 don't produce a noticeable quality increase in most images,
   * while a value of 0.8 will reduce the file size by about half or less compared to a value of 1.
   * Image picker defaults to 0.8 for iOS and 1 for Android
   */
  compressImageQuality?: number;
  /**
   * Override file upload request
   *
   * @param file    File object - { uri: '', name: '' }
   * @param channel Current channel object
   */
  doDocUploadRequest?: (
    file: {
      name: string;
      size?: string | number;
      type?: string;
      uri?: string;
    },
    channel: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['channel'],
  ) => Promise<SendFileAPIResponse>;
  /**
   * Override image upload request
   *
   * @param file    File object - { uri: '' }
   * @param channel Current channel object
   */
  doImageUploadRequest?: (
    file: {
      name?: string;
      uri?: string;
    },
    channel: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['channel'],
  ) => Promise<SendFileAPIResponse>;
  /** Initial value to set on input */
  initialValue?: string;
  /**
   * Custom UI component for AutoCompleteInput.
   * Has access to all of [MessageInputContext](https://github.com/GetStream/stream-chat-react-native/blob/master/src/v2/contexts/messageInputContext/MessageInputContext.tsx)
   */
  Input?: React.ComponentType<
    Omit<MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>, 'Input'> & {
      getUsers: () => UserResponse<Us>[];
      handleOnPress: () => Promise<void>;
    }
  >;
  /**
   * Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler.
   *
   * @param newText
   */
  onChangeText?: (newText: string) => void;
  /**
   * ref for input setter function
   */
  setInputRef?: (ref: TextInput | null) => void;
};

export type MessageInputContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = LocalMessageInputContext<Co, Us> &
  Omit<
    InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'sendMessage'
  >;

export const MessageInputContext = React.createContext(
  {} as MessageInputContextValue,
);

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: PropsWithChildren<{
    value: MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
  nextProps: PropsWithChildren<{
    value: MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
) => {
  const {
    value: {
      editing: prevEditing,
      fileUploads: prevFileUploads,
      focused: prevFocused,
      imageUploads: prevImageUploads,
      mentionedUsers: prevMentionedUsers,
      replyTo: prevReplyTo,
      text: prevText,
    },
  } = prevProps;
  const {
    value: {
      editing: nextEditing,
      fileUploads: nextFileUploads,
      focused: nextFocused,
      imageUploads: nextImageUploads,
      mentionedUsers: nextMentionedUsers,
      replyTo: nextReplyTo,
      text: nextText,
    },
  } = nextProps;

  const editingEqual = !!prevEditing === !!nextEditing;
  if (!editingEqual) return false;

  const replyToEqual = !!prevReplyTo === !!nextReplyTo;
  if (!replyToEqual) return false;

  const textEqual = prevText === nextText;
  if (!textEqual) return false;

  const focusedEqual = prevFocused === nextFocused;
  if (!focusedEqual) return false;

  const mentionedUsersEqual =
    prevMentionedUsers.length === nextMentionedUsers.length;
  if (!mentionedUsersEqual) return false;

  const fileUploadsEqual =
    prevFileUploads.length === nextFileUploads.length &&
    prevFileUploads.every(
      (prevFileUpload, index) =>
        prevFileUpload.state === nextFileUploads[index].state,
    );
  if (!fileUploadsEqual) return false;

  const imageUploadsEqual =
    prevImageUploads.length === nextImageUploads.length &&
    prevImageUploads.every(
      (prevImageUpload, index) =>
        prevImageUpload.state === nextImageUploads[index].state,
    );
  if (!imageUploadsEqual) return false;

  return true;
};

const MemoizedMessageInputProvider = React.memo(
  MessageInputContext.Provider,
  areEqual,
) as typeof MessageInputContext.Provider;

type MessageInputProviderPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'thread'> &
  Pick<TranslationContextValue, 't'> &
  InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>;

const MessageInputProviderWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageInputProviderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>;
}>) => {
  const inputBoxRef = useRef<TextInput | null>(null);
  const sending = useRef(false);

  const [asyncIds, setAsyncIds] = useState<string[]>([]);
  const [asyncUploads, setAsyncUploads] = useState<{
    [key: string]: {
      state: string;
      url: string;
    };
  }>({});

  const {
    fileUploads,
    focused,
    imageUploads,
    mentionedUsers,
    numberOfUploads,
    setFileUploads,
    setFocused,
    setImageUploads,
    setMentionedUsers,
    setNumberOfUploads,
    setText,
    text,
  } = useMessageDetailsForState<At, Ch, Co, Ev, Me, Re, Us>(
    value.editing,
    value.initialValue,
  );

  const appendText = (newText: string) => {
    setText((prevText) => `${prevText}${newText}`);
  };

  /** Checks if the message is valid or not. Accordingly we can enable/disable send button */
  const isValidMessage = () => {
    if (text) {
      return true;
    }

    for (const image of imageUploads) {
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    for (const file of fileUploads) {
      if (!file || file.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (file.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        return false;
      }

      return true;
    }

    return false;
  };

  const onChange = (newText: string) => {
    if (sending.current) {
      return;
    }
    setText(newText);

    if (newText && value.channel) {
      logChatPromiseExecution(value.channel.keystroke(), 'start typing event');
    }

    if (value.onChangeText) {
      value.onChangeText(newText);
    }
  };

  const onSelectItem = (item: UserResponse<Us>) => {
    setMentionedUsers((prevMentionedUsers) => [...prevMentionedUsers, item.id]);
  };

  const pickFile = async () => {
    if (numberOfUploads >= value.maxNumberOfFiles) {
      return;
    }

    const result = await pickDocument({
      maxNumberOfFiles: value.maxNumberOfFiles - numberOfUploads,
    });
    if (!result.cancelled && result.docs) {
      result.docs.forEach((doc) => {
        const mimeType = lookup(doc.name);

        if (mimeType && mimeType?.startsWith('image/')) {
          uploadNewImage(doc);
        } else {
          uploadNewFile(doc);
        }
      });
    }
  };

  const pickImage = async () => {
    if (numberOfUploads >= value.maxNumberOfFiles) {
      return;
    }

    const result = await pickImageNative({
      compressImageQuality: value.compressImageQuality,
      maxNumberOfFiles: value.maxNumberOfFiles - numberOfUploads,
    });

    if (!result.cancelled && result.images) {
      result.images.forEach((image) => {
        uploadNewImage(image);
      });
    }
  };

  const removeFile = (id: string) => {
    if (fileUploads.some((file) => file.id === id)) {
      setFileUploads((prevFileUploads) =>
        prevFileUploads.filter((file) => file.id !== id),
      );
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
    }
  };

  const removeImage = (id: string) => {
    if (imageUploads.some((image) => image.id === id)) {
      setImageUploads((prevImageUploads) =>
        prevImageUploads.filter((image) => image.id !== id),
      );
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
    }
  };

  const resetInput = (pendingAttachments: Attachment<At>[] = []) => {
    setFileUploads([]);
    setImageUploads([]);
    setMentionedUsers([]);
    setNumberOfUploads(
      (prevNumberOfUploads) =>
        prevNumberOfUploads - (pendingAttachments?.length || 0),
    );
    setText('');
  };

  const sendMessage = useCallback(async () => {
    if (sending.current) {
      return;
    }
    sending.current = true;

    const prevText = text;
    await setText('');
    if (inputBoxRef.current) {
      inputBoxRef.current.clear();
    }

    const attachments = [] as Attachment<At>[];
    for (const image of imageUploads) {
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }

      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        if (value.sendImageAsync) {
          /**
           * If user hit send before image uploaded, push ID into a queue to later
           * be matched with the successful CDN response
           */
          setAsyncIds((prevAsyncIds) => [...prevAsyncIds, image.id]);
        } else {
          sending.current = false;
          return setText(prevText);
        }
      }

      if (
        image.state === FileState.UPLOADED ||
        image.state === FileState.FINISHED
      ) {
        attachments.push({
          fallback: image.file.name,
          image_url: image.url,
          type: 'image',
        } as Attachment<At>);
      }
    }

    for (const file of fileUploads) {
      if (!file || file.state === FileState.UPLOAD_FAILED) {
        continue;
      }
      if (file.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        sending.current = false;
        return;
      }
      if (
        file.state === FileState.UPLOADED ||
        file.state === FileState.FINISHED
      ) {
        attachments.push({
          asset_url: file.url,
          file_size: file.file.size,
          mime_type: file.file.type,
          title: file.file.name,
          type: 'file',
        } as Attachment<At>);
      }
    }

    // Disallow sending message if its empty.
    if (!prevText && attachments.length === 0) {
      sending.current = false;
      return;
    }

    if (value.editing && !isEditingBoolean(value.editing)) {
      const updatedMessage = {
        ...value.editing,
        attachments,
        mentioned_users: mentionedUsers,
        text: prevText,
      } as Parameters<
        StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']
      >[0];

      // TODO: Remove this line and show an error when submit fails
      value.clearEditingState();

      const updateMessagePromise = value
        .editMessage(updatedMessage)
        .then(value.clearEditingState);
      resetInput(attachments);
      logChatPromiseExecution(updateMessagePromise, 'update message');

      sending.current = false;
    } else {
      try {
        value.sendMessage(({
          attachments,
          mentioned_users: uniq(mentionedUsers),
          /** Parent message id - in case of thread */
          parent_id: value.thread?.id as StreamMessage<At, Me, Us>['parent_id'],
          text: prevText,
        } as unknown) as StreamMessage<At, Me, Us>);

        sending.current = false;
        resetInput(attachments);
      } catch (_error) {
        sending.current = false;
        setText(prevText);
        console.log('Failed to send message');
      }
    }
  }, [
    fileUploads,
    imageUploads,
    mentionedUsers,
    sending.current,
    text,
    value.editing,
  ]);

  const sendMessageAsync = (id: string) => {
    const image = asyncUploads[id];
    if (!image || image.state === FileState.UPLOAD_FAILED) {
      return;
    }

    if (
      image.state === FileState.UPLOADED ||
      image.state === FileState.FINISHED
    ) {
      const attachments = [
        {
          image_url: image.url,
          type: 'image',
        },
      ] as StreamMessage<At, Me, Us>['attachments'];

      try {
        value.sendMessage(({
          attachments,
          mentioned_users: [],
          parent_id: value.thread?.id as StreamMessage<At, Me, Us>['parent_id'],
          text: '',
        } as unknown) as Partial<StreamMessage<At, Me, Us>>);

        setAsyncIds((prevAsyncIds) =>
          prevAsyncIds.splice(prevAsyncIds.indexOf(id), 1),
        );
        setAsyncUploads((prevAsyncUploads) => {
          delete prevAsyncUploads[id];
          return prevAsyncUploads;
        });

        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      } catch (_error) {
        console.log('Failed');
      }
    }
  };

  const setInputBoxRef = (ref: TextInput | null) => {
    inputBoxRef.current = ref;
    if (value.setInputRef) {
      value.setInputRef(ref);
    }
  };

  const triggerSettings = value.channel
    ? ACITriggerSettings<At, Ch, Co, Ev, Me, Re, Us>({
        channel: value.channel,
        onMentionSelectItem: onSelectItem,
        t: value.t,
      })
    : ({} as TriggerSettings<Co, Us>);

  const updateMessage = async () => {
    try {
      if (!isEditingBoolean(value.editing)) {
        await value.client.updateMessage({
          ...value.editing,
          text,
        } as Parameters<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>[0]);
      }

      resetInput();
      value.clearEditingState();
    } catch (error) {
      console.log(error);
    }
  };

  const uploadFile = async ({ newFile }: { newFile: FileUpload }) => {
    if (!newFile) {
      return;
    }
    const { file, id } = newFile;

    await setFileUploads((prevFileUploads) =>
      prevFileUploads.map((fileUpload) => {
        if (fileUpload.id === id) {
          return {
            ...fileUpload,
            state: FileState.UPLOADING,
          };
        }
        return fileUpload;
      }),
    );

    let response = {} as SendFileAPIResponse;
    try {
      if (value.doDocUploadRequest) {
        response = await value.doDocUploadRequest(file, value.channel);
      } else if (value.channel && file.uri) {
        response = await value.channel.sendFile(file.uri, file.name, file.type);
      }
    } catch (error) {
      console.warn(error);
      if (!newFile) {
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      } else {
        setFileUploads((prevFileUploads) =>
          prevFileUploads.map((fileUpload) => {
            if (fileUpload.id === id) {
              return {
                ...fileUpload,
                state: FileState.UPLOAD_FAILED,
              };
            }
            return fileUpload;
          }),
        );
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      }
      return;
    }

    setFileUploads((prevFileUploads) =>
      prevFileUploads.map((fileUpload) => {
        if (fileUpload.id === id) {
          return {
            ...fileUpload,
            state: FileState.UPLOADED,
            url: response.file,
          };
        }
        return fileUpload;
      }),
    );
  };

  const uploadImage = async ({ newImage }: { newImage: ImageUpload }) => {
    const { file, id } = newImage || {};
    if (!file) {
      return;
    }

    let response = {} as SendFileAPIResponse;

    const filename = (file.name || file.uri || '').replace(
      /^(file:\/\/|content:\/\/)/,
      '',
    );
    const contentType = lookup(filename) || 'multipart/form-data';

    try {
      if (value.doImageUploadRequest) {
        response = await value.doImageUploadRequest(file, value.channel);
      } else if (file.uri && value.channel) {
        if (value.sendImageAsync) {
          value.channel
            .sendImage(file.uri, undefined, contentType)
            .then((res) => {
              if (asyncIds.includes(id)) {
                // Evaluates to true if user hit send before image successfully uploaded
                setAsyncUploads((prevAsyncUploads) => {
                  prevAsyncUploads[id] = {
                    ...prevAsyncUploads[id],
                    state: FileState.UPLOADED,
                    url: res.file,
                  };
                  return prevAsyncUploads;
                });
              } else {
                setImageUploads((prevImageUploads) =>
                  prevImageUploads.map((imageUpload) => {
                    if (imageUpload.id === id) {
                      return {
                        ...imageUpload,
                        state: FileState.UPLOADED,
                        url: res.file,
                      };
                    }
                    return imageUpload;
                  }),
                );
              }
            });
        } else {
          response = await value.channel.sendImage(
            file.uri,
            undefined,
            contentType,
          );
        }
      }

      if (Object.keys(response).length) {
        setImageUploads((prevImageUploads) =>
          prevImageUploads.map((imageUpload) => {
            if (imageUpload.id === id) {
              return {
                ...imageUpload,
                state: FileState.UPLOADED,
                url: response.file,
              };
            }
            return imageUpload;
          }),
        );
      }
    } catch (error) {
      console.warn(error);
      if (newImage) {
        setImageUploads((prevImageUploads) =>
          prevImageUploads.map((imageUpload) => {
            if (imageUpload.id === id) {
              return {
                ...imageUpload,
                state: FileState.UPLOAD_FAILED,
              };
            }
            return imageUpload;
          }),
        );
      }
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);

      return;
    }
  };

  const uploadNewFile = async (file: {
    name: string;
    size?: number | string;
    type?: string;
    uri?: string;
  }) => {
    const id = generateRandomId();
    const mimeType = lookup(file.name);
    const newFile = {
      file: { ...file, type: mimeType || file?.type },
      id,
      state: FileState.UPLOADING,
    };
    await Promise.all([
      setFileUploads((prevFileUploads) => prevFileUploads.concat([newFile])),
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
    ]);

    uploadFile({ newFile });
  };

  const uploadNewImage = async (image: { uri?: string }) => {
    const id = generateRandomId();
    const newImage = {
      file: image,
      id,
      state: FileState.UPLOADING,
    };
    await Promise.all([
      setImageUploads((prevImageUploads) =>
        prevImageUploads.concat([newImage]),
      ),
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
    ]);

    uploadImage({ newImage });
  };

  return (
    <MemoizedMessageInputProvider
      value={
        ({
          appendText,
          asyncIds,
          asyncUploads,
          fileUploads,
          focused,
          imageUploads,
          inputBoxRef,
          isValidMessage,
          mentionedUsers,
          numberOfUploads,
          onChange,
          onSelectItem,
          pickFile,
          pickImage,
          removeFile,
          removeImage,
          resetInput,
          sending,
          sendMessageAsync,
          setAsyncIds,
          setAsyncUploads,
          setFileUploads,
          setFocused,
          setImageUploads,
          setInputBoxRef,
          setMentionedUsers,
          setNumberOfUploads,
          setText,
          text,
          triggerSettings,
          updateMessage,
          uploadFile,
          uploadImage,
          uploadNewFile,
          uploadNewImage,
          ...value,
          channel: undefined,
          client: undefined,
          sendMessage, // overriding the originally passed in sendMessage
          t: undefined,
        } as unknown) as MessageInputContextValue
      }
    >
      {children}
    </MemoizedMessageInputProvider>
  );
};

const areEqualContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: PropsWithChildren<{
    value: MessageInputProviderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
  nextProps: PropsWithChildren<{
    value: MessageInputProviderPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
) => {
  const {
    value: { editing: prevEditing, replyTo: prevReplyTo, thread: prevThread },
  } = prevProps;
  const {
    value: { editing: nextEditing, replyTo: nextReplyTo, thread: nextThread },
  } = nextProps;

  const editingEqual = !!prevEditing === !!nextEditing;
  if (!editingEqual) return false;

  const replyToEqual = !!prevReplyTo === !!nextReplyTo;
  if (!replyToEqual) return false;

  const threadEqual = prevThread?.id === nextThread?.id;
  if (!threadEqual) return false;

  return true;
};

const MemoizedMessageInputProviderWithContext = React.memo(
  MessageInputProviderWithContext,
  areEqualContext,
) as typeof MessageInputProviderWithContext;

export const MessageInputProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { thread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();
  return (
    <MemoizedMessageInputProviderWithContext
      value={
        ({
          ...{ channel, client, t, thread },
          ...value,
        } as unknown) as MessageInputProviderPropsWithContext
      }
    >
      {children}
    </MemoizedMessageInputProviderWithContext>
  );
};

export const useMessageInputContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(MessageInputContext) as unknown) as MessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if MessageInputContext
 * typing is desired while using the HOC withMessageInputContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageInputContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<
  Omit<P, keyof MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>>
> => {
  const WithMessageInputContextComponent = (
    props: Omit<P, keyof MessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const messageInputContext = useMessageInputContext<
      At,
      Ch,
      Co,
      Ev,
      Me,
      Re,
      Us
    >();

    return <Component {...(props as P)} {...messageInputContext} />;
  };
  WithMessageInputContextComponent.displayName = `WithMessageInputContext${getDisplayName(
    Component,
  )}`;
  return WithMessageInputContextComponent;
};
