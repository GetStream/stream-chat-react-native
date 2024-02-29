import type { LegacyRef } from 'react';
import React, { PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';
import type { TextInput, TextInputProps } from 'react-native';
import { Alert, Keyboard } from 'react-native';

import uniq from 'lodash/uniq';
import { lookup } from 'mime-types';
import {
  Attachment,
  logChatPromiseExecution,
  Message,
  SendFileAPIResponse,
  StreamChat,
  Message as StreamMessage,
  UserFilters,
  UserOptions,
  UserResponse,
  UserSort,
} from 'stream-chat';

import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageDetailsForState } from './hooks/useMessageDetailsForState';

import { parseLinksFromText } from '../../components/Message/MessageSimple/utils/parseLinks';
import type { AttachButtonProps } from '../../components/MessageInput/AttachButton';
import type { CommandsButtonProps } from '../../components/MessageInput/CommandsButton';
import type { InputEditingStateHeaderProps } from '../../components/MessageInput/components/InputEditingStateHeader';
import type { InputGiphySearchProps } from '../../components/MessageInput/components/InputGiphySearch';
import type { InputReplyStateHeaderProps } from '../../components/MessageInput/components/InputReplyStateHeader';
import type { CooldownTimerProps } from '../../components/MessageInput/CooldownTimer';
import type { FileUploadPreviewProps } from '../../components/MessageInput/FileUploadPreview';
import { useCooldown } from '../../components/MessageInput/hooks/useCooldown';
import type { ImageUploadPreviewProps } from '../../components/MessageInput/ImageUploadPreview';
import type { InputButtonsProps } from '../../components/MessageInput/InputButtons';
import type { MessageInputProps } from '../../components/MessageInput/MessageInput';
import type { MoreOptionsButtonProps } from '../../components/MessageInput/MoreOptionsButton';
import type { SendButtonProps } from '../../components/MessageInput/SendButton';
import type { UploadProgressIndicatorProps } from '../../components/MessageInput/UploadProgressIndicator';
import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { Emoji } from '../../emoji-data';
import { pickDocument } from '../../native';
import type {
  Asset,
  DefaultStreamChatGenerics,
  File,
  FileUpload,
  ImageUpload,
  UnknownType,
} from '../../types/types';
import { compressedImageURI } from '../../utils/compressImage';
import { removeReservedFields } from '../../utils/removeReservedFields';
import {
  ACITriggerSettings,
  ACITriggerSettingsParams,
  FileState,
  FileStateValue,
  generateRandomId,
  isBouncedMessage,
  TriggerSettings,
} from '../../utils/utils';
import { useAttachmentPickerContext } from '../attachmentPickerContext/AttachmentPickerContext';
import { ChannelContextValue, useChannelContext } from '../channelContext/ChannelContext';
import { useChatContext } from '../chatContext/ChatContext';
import { useMessagesContext } from '../messagesContext/MessagesContext';
import { useOwnCapabilitiesContext } from '../ownCapabilitiesContext/OwnCapabilitiesContext';
import { useThreadContext } from '../threadContext/ThreadContext';
import { useTranslationContext } from '../translationContext/TranslationContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type EmojiSearchIndex = {
  search: (query: string) => PromiseLike<Array<Emoji>> | Array<Emoji> | null;
};

export type MentionAllAppUsersQuery<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  filters?: UserFilters<StreamChatGenerics>;
  options?: UserOptions;
  sort?: UserSort<StreamChatGenerics>;
};

export type LocalMessageInputContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  appendText: (newText: string) => void;
  asyncIds: string[];
  asyncUploads: {
    [key: string]: {
      state: string;
      url: string;
    };
  };
  closeAttachmentPicker: () => void;
  /** The time at which the active cooldown will end */
  cooldownEndsAt: Date;
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
  giphyActive: boolean;
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
  onSelectItem: (item: UserResponse<StreamChatGenerics>) => void;
  openAttachmentPicker: () => void;
  openCommandsPicker: () => void;
  openFilePicker: () => void;
  openMentionsPicker: () => void;
  pickFile: () => Promise<void>;
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
  resetInput: (pendingAttachments?: Attachment<StreamChatGenerics>[]) => void;
  selectedPicker: string | undefined;
  sending: React.MutableRefObject<boolean>;
  sendMessage: (customMessageData?: Partial<Message<StreamChatGenerics>>) => Promise<void>;
  sendMessageAsync: (id: string) => void;
  sendThreadMessageInChannel: boolean;
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
  setGiphyActive: React.Dispatch<React.SetStateAction<boolean>>;
  setImageUploads: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
  /**
   * Ref callback to set reference on input box
   */
  setInputBoxRef: LegacyRef<TextInput> | undefined;
  setMentionedUsers: React.Dispatch<React.SetStateAction<string[]>>;
  setNumberOfUploads: React.Dispatch<React.SetStateAction<number>>;
  setSendThreadMessageInChannel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMoreOptions: React.Dispatch<React.SetStateAction<boolean>>;
  setText: React.Dispatch<React.SetStateAction<string>>;
  showMoreOptions: boolean;
  /**
   * Text value of the TextInput
   */
  text: string;
  toggleAttachmentPicker: () => void;
  /**
   * Mapping of input triggers to the outputs to be displayed by the AutoCompleteInput
   */
  triggerSettings: TriggerSettings<StreamChatGenerics>;
  updateMessage: () => Promise<void>;
  /** Function for attempting to upload a file */
  uploadFile: ({ newFile }: { newFile: FileUpload }) => Promise<void>;
  /** Function for attempting to upload an image */
  uploadImage: ({ newImage }: { newImage: ImageUpload }) => Promise<void>;
  uploadNewFile: (file: File) => Promise<void>;
  uploadNewImage: (image: Partial<Asset>) => Promise<void>;
};

export type InputMessageInputContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'disabled'> & {
  /**
   * Custom UI component for attach button.
   *
   * Defaults to and accepts same props as: [AttachButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/attach-button/)
   */
  AttachButton: React.ComponentType<AttachButtonProps<StreamChatGenerics>>;

  clearEditingState: () => void;
  clearQuotedMessageState: () => void;
  /**
   * Custom UI component for commands button.
   *
   * Defaults to and accepts same props as: [CommandsButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/commands-button/)
   */
  CommandsButton: React.ComponentType<CommandsButtonProps<StreamChatGenerics>>;
  /**
   * Custom UI component to display the remaining cooldown a user will have to wait before
   * being allowed to send another message. This component is displayed in place of the
   * send button for the MessageInput component.
   *
   * **default** [CooldownTimer](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/CooldownTimer.tsx)
   */
  CooldownTimer: React.ComponentType<CooldownTimerProps>;
  editMessage: StreamChat<StreamChatGenerics>['updateMessage'];

  /**
   * Custom UI component for FileUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/FileUploadPreview.tsx
   */
  FileUploadPreview: React.ComponentType<FileUploadPreviewProps<StreamChatGenerics>>;

  /** When false, CommandsButton will be hidden */
  hasCommands: boolean;
  /** When false, FileSelectorIcon will be hidden */
  hasFilePicker: boolean;
  /** When false, ImageSelectorIcon will be hidden */
  hasImagePicker: boolean;
  /**
   * Custom UI component for ImageUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/ImageUploadPreview.tsx
   */
  ImageUploadPreview: React.ComponentType<ImageUploadPreviewProps<StreamChatGenerics>>;
  InputEditingStateHeader: React.ComponentType<InputEditingStateHeaderProps<StreamChatGenerics>>;
  InputGiphySearch: React.ComponentType<InputGiphySearchProps<StreamChatGenerics>>;
  InputReplyStateHeader: React.ComponentType<InputReplyStateHeaderProps<StreamChatGenerics>>;
  /** Limit on allowed number of files to attach at a time. */
  maxNumberOfFiles: number;
  /**
   * Custom UI component for more options button.
   *
   * Defaults to and accepts same props as: [MoreOptionsButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/more-options-button/)
   */
  MoreOptionsButton: React.ComponentType<MoreOptionsButtonProps<StreamChatGenerics>>;
  /** Limit on the number of lines in the text input before scrolling */
  numberOfLines: number;
  quotedMessage: boolean | MessageType<StreamChatGenerics>;
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/send-button/)
   */
  SendButton: React.ComponentType<SendButtonProps<StreamChatGenerics>>;
  sendImageAsync: boolean;
  sendMessage: (message: Partial<StreamMessage<StreamChatGenerics>>) => Promise<void>;
  setQuotedMessageState: (message: MessageType<StreamChatGenerics>) => void;
  /**
   * Custom UI component to render checkbox with text ("Also send to channel") in Thread's input box.
   * When ticked, message will also be sent in parent channel.
   */
  ShowThreadMessageInChannelButton: React.ComponentType<{
    threadList?: boolean;
  }>;
  /**
   * Custom UI component to render upload progress indicator on attachment preview.
   *
   * **Default** [UploadProgressIndicator](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/UploadProgressIndicator.tsx)
   */
  UploadProgressIndicator: React.ComponentType<UploadProgressIndicatorProps>;
  /**
   * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
   *
   * @see See https://reactnative.dev/docs/textinput#reference
   */
  additionalTextInputProps?: TextInputProps;
  /** Max number of suggestions to display in autocomplete list. Defaults to 10. */
  autoCompleteSuggestionsLimit?: number;
  /**
   * Mapping of input triggers to the outputs to be displayed by the AutoCompleteInput
   */
  autoCompleteTriggerSettings?: (
    settings: ACITriggerSettingsParams<StreamChatGenerics>,
  ) => TriggerSettings<StreamChatGenerics>;
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
   *
   * @overrideType Function
   */
  doDocUploadRequest?: (
    file: File,
    channel: ChannelContextValue<StreamChatGenerics>['channel'],
  ) => Promise<SendFileAPIResponse>;
  /**
   * Override image upload request
   *
   * @param file    File object - { uri: '' }
   * @param channel Current channel object
   *
   * @overrideType Function
   */
  doImageUploadRequest?: (
    file: {
      name?: string;
      uri?: string;
    },
    channel: ChannelContextValue<StreamChatGenerics>['channel'],
  ) => Promise<SendFileAPIResponse>;

  /**
   * Variable that tracks the editing state.
   * It is defined with message type if the editing state is true, else its undefined.
   */
  editing?: MessageType<StreamChatGenerics>;

  /**
   * Prop to override the default emoji search index in auto complete suggestion list.
   */
  emojiSearchIndex?: EmojiSearchIndex;

  /** Initial value to set on input */
  initialValue?: string;
  /**
   * Custom UI component for AutoCompleteInput.
   * Has access to all of [MessageInputContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/messageInputContext/MessageInputContext.tsx)
   */
  Input?: React.ComponentType<
    Omit<MessageInputProps<StreamChatGenerics>, 'Input'> &
      InputButtonsProps<StreamChatGenerics> & {
        getUsers: () => UserResponse<StreamChatGenerics>[];
      }
  >;
  /**
   * Custom UI component to override buttons on left side of input box
   * Defaults to [InputButtons](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/InputButtons.tsx),
   * which contain following components/buttons:
   *
   *  - AttachButton
   *  - CommandsButtom
   *
   * You have access to following prop functions:
   *
   * - closeAttachmentPicker
   * - openAttachmentPicker
   * - openCommandsPicker
   * - toggleAttachmentPicker
   */
  InputButtons?: React.ComponentType<InputButtonsProps<StreamChatGenerics>>;
  maxMessageLength?: number;
  mentionAllAppUsersEnabled?: boolean;
  /** Object containing filters/sort/options overrides for an @mention user query */
  mentionAllAppUsersQuery?: MentionAllAppUsersQuery<StreamChatGenerics>;
  /**
   * Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler.
   */
  onChangeText?: (newText: string) => void;
  SendMessageDisallowedIndicator?: React.ComponentType;
  /**
   * ref for input setter function
   *
   * @param ref [Ref object](https://reactjs.org/docs/refs-and-the-dom.html) for underling `TextInput` component.
   *
   * @overrideType Function
   */
  setInputRef?: (ref: TextInput | null) => void;
};

export type MessageInputContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = LocalMessageInputContext<StreamChatGenerics> &
  Omit<InputMessageInputContextValue<StreamChatGenerics>, 'sendMessage'>;

export const MessageInputContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageInputContextValue,
);

export const MessageInputProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: InputMessageInputContextValue<StreamChatGenerics>;
}>) => {
  const { closePicker, openPicker, selectedPicker, setSelectedPicker } =
    useAttachmentPickerContext();
  const { appSettings, client, enableOfflineSupport } = useChatContext<StreamChatGenerics>();
  const { removeMessage } = useMessagesContext();

  const getFileUploadConfig = () => {
    const fileConfig = appSettings?.app?.file_upload_config;
    if (fileConfig !== null || fileConfig !== undefined) {
      return fileConfig;
    } else {
      return {};
    }
  };

  const blockedFileExtensionTypes = getFileUploadConfig()?.blocked_file_extensions;
  const blockedFileMimeTypes = getFileUploadConfig()?.blocked_mime_types;

  const getImageUploadConfig = () => {
    const imageConfig = appSettings?.app?.image_upload_config;
    if (imageConfig !== null || imageConfig !== undefined) {
      return imageConfig;
    }
    return {};
  };

  const blockedImageExtensionTypes = getImageUploadConfig()?.blocked_file_extensions;
  const blockedImageMimeTypes = getImageUploadConfig()?.blocked_mime_types;

  const channelCapabities = useOwnCapabilitiesContext();

  const { channel, giphyEnabled, uploadAbortControllerRef } =
    useChannelContext<StreamChatGenerics>();
  const { thread } = useThreadContext<StreamChatGenerics>();
  const { t } = useTranslationContext();
  const inputBoxRef = useRef<TextInput | null>(null);
  const sending = useRef(false);

  const [asyncIds, setAsyncIds] = useState<string[]>([]);
  const [asyncUploads, setAsyncUploads] = useState<{
    [key: string]: {
      state: string;
      url: string;
    };
  }>({});
  const [giphyActive, setGiphyActive] = useState(false);
  const [sendThreadMessageInChannel, setSendThreadMessageInChannel] = useState(false);
  const { editing, hasFilePicker, hasImagePicker, initialValue } = value;
  const {
    fileUploads,
    imageUploads,
    mentionedUsers,
    numberOfUploads,
    setFileUploads,
    setImageUploads,
    setMentionedUsers,
    setNumberOfUploads,
    setShowMoreOptions,
    setText,
    showMoreOptions,
    text,
  } = useMessageDetailsForState<StreamChatGenerics>(editing, initialValue);
  const { endsAt: cooldownEndsAt, start: startCooldown } = useCooldown<StreamChatGenerics>();

  const threadId = thread?.id;
  useEffect(() => {
    setSendThreadMessageInChannel(false);
  }, [threadId]);

  const appendText = (newText: string) => {
    setText((prevText) => `${prevText}${newText}`);
  };

  /** Checks if the message is valid or not. Accordingly we can enable/disable send button */
  const isValidMessage = () => {
    if (text && text.trim()) {
      return true;
    }

    const imagesAndFiles = [...imageUploads, ...fileUploads];
    if (imagesAndFiles.length === 0) return false;

    if (enableOfflineSupport) {
      // Allow only if none of the attachments have unsupported status
      for (const file of imagesAndFiles) {
        if (file.state === FileState.NOT_SUPPORTED) {
          return false;
        }
      }

      return true;
    }

    for (const file of imagesAndFiles) {
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

    if (newText && channel && channelCapabities.sendTypingEvents) {
      logChatPromiseExecution(channel.keystroke(thread?.id), 'start typing event');
    }

    if (value.onChangeText) {
      value.onChangeText(newText);
    }
  };

  const openCommandsPicker = () => {
    appendText('/');
    if (inputBoxRef.current) {
      inputBoxRef.current.focus();
    }
  };

  const openMentionsPicker = () => {
    appendText('@');
    if (inputBoxRef.current) {
      inputBoxRef.current.focus();
    }
  };

  const openAttachmentPicker = () => {
    if (hasImagePicker) {
      Keyboard.dismiss();
      setSelectedPicker('images');
      openPicker();
    } else if (hasFilePicker) {
      pickFile();
    }
  };

  const closeAttachmentPicker = () => {
    setSelectedPicker(undefined);
    closePicker();
  };

  const toggleAttachmentPicker = () => {
    if (selectedPicker) {
      closeAttachmentPicker();
    } else {
      openAttachmentPicker();
    }
  };

  const onSelectItem = (item: UserResponse<StreamChatGenerics>) => {
    setMentionedUsers((prevMentionedUsers) => [...prevMentionedUsers, item.id]);
  };

  const pickFile = async () => {
    if (pickDocument === null) {
      console.log(
        'The file picker is not installed. Check our Getting Started documentation to install it.',
      );
      return;
    }

    if (numberOfUploads >= value.maxNumberOfFiles) {
      Alert.alert('Maximum number of files reached');
      return;
    }

    const result = await pickDocument({
      maxNumberOfFiles: value.maxNumberOfFiles - numberOfUploads,
    });

    const MEGA_BYTES_TO_BYTES = 1024 * 1024;
    const MAX_FILE_SIZE_TO_UPLOAD_IN_MB = 100;

    if (!result.cancelled && result.assets) {
      const totalFileSize = result.assets.reduce((acc, asset) => acc + Number(asset.size), 0);
      if (totalFileSize / MEGA_BYTES_TO_BYTES > MAX_FILE_SIZE_TO_UPLOAD_IN_MB) {
        Alert.alert(
          t(
            `Maximum file size upload limit reached. Please upload a file below {{MAX_FILE_SIZE_TO_UPLOAD_IN_MB}} MB.`,
            { MAX_FILE_SIZE_TO_UPLOAD_IN_MB },
          ),
        );
      } else {
        result.assets.forEach((asset) => {
          /**
           * TODO: The current tight coupling of images to the image
           * picker does not allow images picked from the file picker
           * to be rendered in a preview via the uploadNewImage call.
           * This should be updated alongside allowing image a file
           * uploads together.
           */
          uploadNewFile(asset);
        });
      }
    }
  };

  const removeFile = (id: string) => {
    if (fileUploads.some((file) => file.id === id)) {
      setFileUploads((prevFileUploads) => prevFileUploads.filter((file) => file.id !== id));
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
    }
  };

  const removeImage = (id: string) => {
    if (imageUploads.some((image) => image.id === id)) {
      setImageUploads((prevImageUploads) => prevImageUploads.filter((image) => image.id !== id));
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
    }
  };

  const resetInput = (pendingAttachments: Attachment<StreamChatGenerics>[] = []) => {
    setFileUploads([]);
    setGiphyActive(false);
    setShowMoreOptions(true);
    setImageUploads([]);
    setMentionedUsers([]);
    setNumberOfUploads(
      (prevNumberOfUploads) => prevNumberOfUploads - (pendingAttachments?.length || 0),
    );
    setText('');
    if (value.editing) {
      value.clearEditingState();
    }
  };

  const mapImageUploadToAttachment = (image: ImageUpload): Attachment<StreamChatGenerics> => {
    const mime_type: string | boolean = lookup(image.file.name as string);
    const name = image.file.name as string;
    return {
      fallback: name,
      image_url: image.url,
      mime_type: mime_type ? mime_type : undefined,
      original_height: image.height,
      original_width: image.width,
      originalImage: image.file,
      type: 'image',
    };
  };

  const mapFileUploadToAttachment = (file: FileUpload): Attachment<StreamChatGenerics> => {
    if (file.file.mimeType?.startsWith('image/')) {
      return {
        fallback: file.file.name,
        image_url: file.url,
        mime_type: file.file.mimeType,
        originalFile: file.file,
        type: 'image',
      };
    } else if (file.file.mimeType?.startsWith('audio/')) {
      return {
        asset_url: file.url || file.file.uri,
        duration: file.file.duration,
        file_size: file.file.size,
        mime_type: file.file.mimeType,
        originalFile: file.file,
        title: file.file.name,
        type: 'audio',
      };
    } else if (file.file.mimeType?.startsWith('video/')) {
      return {
        asset_url: file.url || file.file.uri,
        duration: file.file.duration,
        file_size: file.file.size,
        mime_type: file.file.mimeType,
        originalFile: file.file,
        thumb_url: file.thumb_url,
        title: file.file.name,
        type: 'video',
      };
    } else {
      return {
        asset_url: file.url || file.file.uri,
        file_size: file.file.size,
        mime_type: file.file.mimeType,
        originalFile: file.file,
        title: file.file.name,
        type: 'file',
      };
    }
  };

  // TODO: Figure out why this is async, as it doesn't await any promise.
  // eslint-disable-next-line require-await
  const sendMessage = async (customMessageData?: Partial<Message<StreamChatGenerics>>) => {
    if (sending.current) {
      return;
    }
    const linkInfos = parseLinksFromText(text);

    if (!channelCapabities.sendLinks && linkInfos.length > 0) {
      Alert.alert(t('Links are disabled'), t('Sending links is not allowed in this conversation'));

      return;
    }

    sending.current = true;

    startCooldown();

    const prevText = giphyEnabled && giphyActive ? `/giphy ${text}` : text;
    setText('');
    if (inputBoxRef.current) {
      inputBoxRef.current.clear();
    }

    const attachments = [] as Attachment<StreamChatGenerics>[];
    for (const image of imageUploads) {
      if (enableOfflineSupport) {
        if (image.state === FileState.NOT_SUPPORTED) {
          return;
        }
        attachments.push(mapImageUploadToAttachment(image));
        continue;
      }

      if ((!image || image.state === FileState.UPLOAD_FAILED) && !enableOfflineSupport) {
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

      // To get the mime type of the image from the file name and send it as an response for an image
      if (image.state === FileState.UPLOADED || image.state === FileState.FINISHED) {
        attachments.push(mapImageUploadToAttachment(image));
      }
    }

    for (const file of fileUploads) {
      if (enableOfflineSupport) {
        if (file.state === FileState.NOT_SUPPORTED) {
          return;
        }
        attachments.push(mapFileUploadToAttachment(file));
        continue;
      }

      if (!file || file.state === FileState.UPLOAD_FAILED) {
        continue;
      }

      if (file.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        sending.current = false;
        return;
      }

      if (file.state === FileState.UPLOADED || file.state === FileState.FINISHED) {
        attachments.push(mapFileUploadToAttachment(file));
      }
    }

    // Disallow sending message if its empty.
    if (!prevText && attachments.length === 0) {
      sending.current = false;
      return;
    }

    const message = value.editing;
    if (message && message.type !== 'error') {
      const updatedMessage = {
        ...message,
        attachments,
        mentioned_users: mentionedUsers,
        quoted_message: undefined,
        text: prevText,
        ...customMessageData,
      } as Parameters<StreamChat<StreamChatGenerics>['updateMessage']>[0];

      // TODO: Remove this line and show an error when submit fails
      value.clearEditingState();

      const updateMessagePromise = value
        .editMessage(
          // @ts-ignore
          removeReservedFields(updatedMessage),
        )
        .then(value.clearEditingState);
      resetInput(attachments);
      logChatPromiseExecution(updateMessagePromise, 'update message');

      sending.current = false;
    } else {
      try {
        /**
         * If the message is bounced by moderation, we firstly remove the message from message list and then send a new message.
         */
        if (message && isBouncedMessage(message as MessageType<StreamChatGenerics>)) {
          removeMessage(message);
        }
        value.sendMessage({
          attachments,
          mentioned_users: uniq(mentionedUsers),
          /** Parent message id - in case of thread */
          parent_id: thread?.id,
          quoted_message_id:
            typeof value.quotedMessage === 'boolean' ? undefined : value.quotedMessage.id,
          show_in_channel: sendThreadMessageInChannel || undefined,
          text: prevText,
          ...customMessageData,
        } as unknown as StreamMessage<StreamChatGenerics>);

        value.clearQuotedMessageState();
        sending.current = false;
        resetInput(attachments);
      } catch (_error) {
        sending.current = false;
        if (value.quotedMessage && typeof value.quotedMessage !== 'boolean') {
          value.setQuotedMessageState(value.quotedMessage);
        }
        setText(prevText.slice(giphyEnabled && giphyActive ? 7 : 0)); // 7 because of '/giphy ' length
        console.log('Failed to send message');
      }
    }
  };

  const sendMessageAsync = (id: string) => {
    const image = asyncUploads[id];
    if (!image || image.state === FileState.UPLOAD_FAILED) {
      return;
    }

    if (image.state === FileState.UPLOADED || image.state === FileState.FINISHED) {
      const attachments = [
        {
          image_url: image.url,
          type: 'image',
        },
      ] as StreamMessage<StreamChatGenerics>['attachments'];

      startCooldown();
      try {
        value.sendMessage({
          attachments,
          mentioned_users: [],
          parent_id: thread?.id,
          quoted_message_id:
            typeof value.quotedMessage === 'boolean' ? undefined : value.quotedMessage.id,
          show_in_channel: sendThreadMessageInChannel || undefined,
          text: '',
        } as unknown as Partial<StreamMessage<StreamChatGenerics>>);

        setAsyncIds((prevAsyncIds) => prevAsyncIds.splice(prevAsyncIds.indexOf(id), 1));
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

  const getTriggerSettings = () => {
    let triggerSettings: TriggerSettings<StreamChatGenerics> = {};
    if (channel) {
      if (value.autoCompleteTriggerSettings) {
        triggerSettings = value.autoCompleteTriggerSettings({
          channel,
          client,
          emojiSearchIndex: value.emojiSearchIndex,
          onMentionSelectItem: onSelectItem,
        });
      } else {
        triggerSettings = ACITriggerSettings<StreamChatGenerics>({
          channel,
          client,
          emojiSearchIndex: value.emojiSearchIndex,
          onMentionSelectItem: onSelectItem,
        });
      }
    }
    return triggerSettings;
  };

  const triggerSettings = getTriggerSettings();

  const updateMessage = async () => {
    try {
      if (value.editing) {
        await client.updateMessage({
          ...value.editing,
          quoted_message: undefined,
          text: giphyEnabled && giphyActive ? `/giphy ${text}` : text,
        } as Parameters<StreamChat<StreamChatGenerics>['updateMessage']>[0]);
      }

      value.clearEditingState();
      resetInput();
    } catch (error) {
      console.log(error);
    }
  };

  const regexCondition = /File (extension \.\w{2,4}|type \S+) is not supported/;

  const getUploadSetStateAction =
    <UploadType extends ImageUpload | FileUpload>(
      id: string,
      fileState: FileStateValue,
      extraData: Partial<UploadType> = {},
    ): React.SetStateAction<UploadType[]> =>
    (prevUploads: UploadType[]) =>
      prevUploads.map((prevUpload) => {
        if (prevUpload.id === id) {
          return {
            ...prevUpload,
            ...extraData,
            state: fileState,
          };
        }
        return prevUpload;
      });

  const handleFileOrImageUploadError = (error: unknown, isImageError: boolean, id: string) => {
    if (isImageError) {
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      if (error instanceof Error) {
        if (regexCondition.test(error.message)) {
          return setImageUploads(getUploadSetStateAction(id, FileState.NOT_SUPPORTED));
        }

        return setImageUploads(getUploadSetStateAction(id, FileState.UPLOAD_FAILED));
      }
    } else {
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);

      if (error instanceof Error) {
        if (regexCondition.test(error.message)) {
          return setFileUploads(getUploadSetStateAction(id, FileState.NOT_SUPPORTED));
        }
        return setFileUploads(getUploadSetStateAction(id, FileState.UPLOAD_FAILED));
      }
    }
  };

  const uploadFile = async ({ newFile }: { newFile: FileUpload }) => {
    const { file, id } = newFile;

    setFileUploads(getUploadSetStateAction(id, FileState.UPLOADING));

    let response: Partial<SendFileAPIResponse> = {};
    try {
      if (value.doDocUploadRequest) {
        response = await value.doDocUploadRequest(file, channel);
      } else if (channel && file.uri) {
        uploadAbortControllerRef.current.set(
          file.name,
          client.createAbortControllerForNextRequest(),
        );
        // Compress images selected through file picker when uploading them
        if (file.mimeType?.includes('image')) {
          const compressedUri = await compressedImageURI(file, value.compressImageQuality);
          response = await channel.sendFile(compressedUri, file.name, file.mimeType);
        } else {
          response = await channel.sendFile(file.uri, file.name, file.mimeType);
        }
        uploadAbortControllerRef.current.delete(file.name);
      }
      const extraData: Partial<FileUpload> = { thumb_url: response.thumb_url, url: response.file };
      setFileUploads(getUploadSetStateAction(id, FileState.UPLOADED, extraData));
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'CanceledError')
      ) {
        // nothing to do
        uploadAbortControllerRef.current.delete(file.name);
        return;
      }
      handleFileOrImageUploadError(error, false, id);
    }
  };

  const uploadImage = async ({ newImage }: { newImage: ImageUpload }) => {
    const { file, id } = newImage || {};

    if (!file) {
      return;
    }

    let response = {} as SendFileAPIResponse;

    const uri = file.uri || '';
    const filename = file.name ?? uri.replace(/^(file:\/\/|content:\/\/)/, '');

    try {
      const compressedUri = await compressedImageURI(file, value.compressImageQuality);
      const contentType = lookup(filename) || 'multipart/form-data';
      if (value.doImageUploadRequest) {
        response = await value.doImageUploadRequest(file, channel);
      } else if (compressedUri && channel) {
        if (value.sendImageAsync) {
          uploadAbortControllerRef.current.set(
            filename,
            client.createAbortControllerForNextRequest(),
          );
          channel.sendImage(compressedUri, filename, contentType).then(
            (res) => {
              uploadAbortControllerRef.current.delete(filename);
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
                const newImageUploads = getUploadSetStateAction<ImageUpload>(
                  id,
                  FileState.UPLOADED,
                  {
                    url: res.file,
                  },
                );
                setImageUploads(newImageUploads);
              }
            },
            () => {
              uploadAbortControllerRef.current.delete(filename);
            },
          );
        } else {
          uploadAbortControllerRef.current.set(
            filename,
            client.createAbortControllerForNextRequest(),
          );
          response = await channel.sendImage(compressedUri, filename, contentType);
          uploadAbortControllerRef.current.delete(filename);
        }
      }

      if (Object.keys(response).length) {
        const newImageUploads = getUploadSetStateAction<ImageUpload>(id, FileState.UPLOADED, {
          height: file.height,
          url: response.file,
          width: file.width,
        });
        setImageUploads(newImageUploads);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'CanceledError')
      ) {
        // nothing to do
        uploadAbortControllerRef.current.delete(filename);
        return;
      }
      handleFileOrImageUploadError(error, true, id);
    }
  };

  const uploadNewFile = async (file: File) => {
    const id: string = generateRandomId();

    const isBlockedFileExtension: boolean | undefined = blockedFileExtensionTypes?.some(
      (fileExtensionType: string) => file.name?.includes(fileExtensionType),
    );
    const isBlockedFileMimeType: boolean | undefined = blockedFileMimeTypes?.some(
      (mimeType: string) => file.name?.includes(mimeType),
    );

    const fileState =
      isBlockedFileExtension || isBlockedFileMimeType
        ? FileState.NOT_SUPPORTED
        : FileState.UPLOADING;

    const newFile: FileUpload = {
      duration: 0,
      file,
      id: file.id || id,
      paused: true,
      progress: 0,
      state: fileState,
    };

    await Promise.all([
      setFileUploads((prevFileUploads) => prevFileUploads.concat([newFile])),
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
    ]);

    if (!isBlockedFileExtension) {
      uploadFile({ newFile });
    }
  };

  const uploadNewImage = async (image: Partial<Asset>) => {
    const id = generateRandomId();

    const isBlockedImageMimeType = blockedImageMimeTypes?.some((mimeType: string) =>
      image.uri?.includes(mimeType),
    );

    const isBlockedImageExtension = blockedImageExtensionTypes?.some((imageExtensionType: string) =>
      image.uri?.includes(imageExtensionType),
    );

    const imageState =
      isBlockedImageExtension || isBlockedImageMimeType
        ? FileState.NOT_SUPPORTED
        : FileState.UPLOADING;

    const newImage: ImageUpload = {
      file: image,
      height: image.height,
      id,
      state: imageState,
      url: image.uri,
      width: image.width,
    };

    await Promise.all([
      setImageUploads((prevImageUploads) => prevImageUploads.concat([newImage])),
      setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
    ]);

    if (!isBlockedImageExtension) {
      uploadImage({ newImage });
    }
  };

  const messageInputContext = useCreateMessageInputContext({
    appendText,
    asyncIds,
    asyncUploads,
    closeAttachmentPicker,
    cooldownEndsAt,
    fileUploads,
    giphyActive,
    imageUploads,
    inputBoxRef,
    isValidMessage,
    mentionedUsers,
    numberOfUploads,
    onChange,
    onSelectItem,
    openAttachmentPicker,
    openCommandsPicker,
    openFilePicker: pickFile,
    openMentionsPicker,
    pickFile,
    removeFile,
    removeImage,
    resetInput,
    selectedPicker,
    sending,
    sendMessageAsync,
    sendThreadMessageInChannel,
    setAsyncIds,
    setAsyncUploads,
    setFileUploads,
    setGiphyActive,
    setImageUploads,
    setInputBoxRef,
    setMentionedUsers,
    setNumberOfUploads,
    setSendThreadMessageInChannel,
    setShowMoreOptions,
    setText,
    showMoreOptions,
    text,
    thread,
    toggleAttachmentPicker,
    triggerSettings,
    updateMessage,
    uploadFile,
    uploadImage,
    uploadNewFile,
    uploadNewImage,
    ...value,
    sendMessage, // overriding the originally passed in sendMessage
  });

  return (
    <MessageInputContext.Provider
      value={messageInputContext as unknown as MessageInputContextValue}
    >
      {children}
    </MessageInputContext.Provider>
  );
};

export const useMessageInputContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    MessageInputContext,
  ) as unknown as MessageInputContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useMessageInputContext hook was called outside of the MessageInputContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};

/**
 * Typescript currently does not support partial inference so if MessageInputContext
 * typing is desired while using the HOC withMessageInputContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageInputContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageInputContextValue<StreamChatGenerics>>> => {
  const WithMessageInputContextComponent = (
    props: Omit<P, keyof MessageInputContextValue<StreamChatGenerics>>,
  ) => {
    const messageInputContext = useMessageInputContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...messageInputContext} />;
  };
  WithMessageInputContextComponent.displayName = `WithMessageInputContext${getDisplayName(
    Component,
  )}`;
  return WithMessageInputContextComponent;
};
