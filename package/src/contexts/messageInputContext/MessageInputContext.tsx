import React, {
  LegacyRef,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Keyboard, Linking, TextInput, TextInputProps } from 'react-native';

import {
  Attachment,
  LocalMessage,
  logChatPromiseExecution,
  Message,
  SendFileAPIResponse,
  StreamChat,
  Message as StreamMessage,
  TextComposerMiddleware,
  TextComposerState,
  UserFilters,
  UserOptions,
  UserResponse,
  UserSort,
} from 'stream-chat';

import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageComposer } from './hooks/useMessageComposer';
import { useMessageDetailsForState } from './hooks/useMessageDetailsForState';

import { isUploadAllowed, MAX_FILE_SIZE_TO_UPLOAD, prettifyFileSize } from './utils/utils';

import {
  AutoCompleteSuggestionHeaderProps,
  AutoCompleteSuggestionItemProps,
  AutoCompleteSuggestionListProps,
  PollContentProps,
  StopMessageStreamingButtonProps,
} from '../../components';
import { AudioAttachmentProps } from '../../components/Attachment/AudioAttachment';
import { parseLinksFromText } from '../../components/Message/MessageSimple/utils/parseLinks';
import type { AttachButtonProps } from '../../components/MessageInput/AttachButton';
import type { CommandsButtonProps } from '../../components/MessageInput/CommandsButton';
import type { AudioRecorderProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecorder';
import type { AudioRecordingButtonProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingButton';
import type { AudioRecordingInProgressProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingInProgress';
import type { AudioRecordingLockIndicatorProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingLockIndicator';
import type { AudioRecordingPreviewProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingPreview';
import type { AudioRecordingWaveformProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingWaveform';
import type { CommandInputProps } from '../../components/MessageInput/components/CommandInput';
import type { InputEditingStateHeaderProps } from '../../components/MessageInput/components/InputEditingStateHeader';
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
import { useStateStore } from '../../hooks/useStateStore';
import {
  createCommandControlMiddleware,
  createCommandInjectionMiddleware,
  createDraftCommandInjectionMiddleware,
} from '../../middlewares/commandControl';
import {
  isDocumentPickerAvailable,
  isImageMediaLibraryAvailable,
  MediaTypes,
  NativeHandlers,
} from '../../native';
import { File, FileTypes, FileUpload } from '../../types/types';
import { compressedImageURI } from '../../utils/compressImage';
import { removeReservedFields } from '../../utils/removeReservedFields';
import {
  FileState,
  FileStateValue,
  generateRandomId,
  getFileNameFromPath,
  getFileTypeFromMimeType,
  isBouncedMessage,
} from '../../utils/utils';
import { useAttachmentPickerContext } from '../attachmentPickerContext/AttachmentPickerContext';
import { ChannelContextValue, useChannelContext } from '../channelContext/ChannelContext';
import { useChatContext } from '../chatContext/ChatContext';
import { useMessagesContext } from '../messagesContext/MessagesContext';
import { useOwnCapabilitiesContext } from '../ownCapabilitiesContext/OwnCapabilitiesContext';
import { useThreadContext } from '../threadContext/ThreadContext';
import { useTranslationContext } from '../translationContext/TranslationContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

/**
 * Function to escape special characters except . in a string and replace with '_'
 * @param text
 * @returns string
 */
function escapeRegExp(text: string) {
  return text.replace(/[[\]{}()*+?,\\^$|#\s]/g, '_');
}

export type MentionAllAppUsersQuery = {
  filters?: UserFilters;
  options?: UserOptions;
  sort?: UserSort;
};

export type LocalMessageInputContext = {
  asyncIds: string[];
  asyncUploads: {
    [key: string]: {
      state: string;
      url: string;
    };
  };
  isCommandUIEnabled: boolean;
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
  imageUploads: FileUpload[];
  inputBoxRef: React.MutableRefObject<TextInput | null>;
  isValidMessage: () => boolean;
  numberOfUploads: number;
  openAttachmentPicker: () => void;
  openFilePicker: () => void;
  /**
   * Function for picking a photo from native image picker and uploading it.
   */
  pickAndUploadImageFromNativePicker: () => Promise<void>;
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
  resetInput: (pendingAttachments?: Attachment[]) => void;
  selectedPicker: string | undefined;
  sending: React.MutableRefObject<boolean>;
  sendMessage: (params?: { customMessageData?: Partial<Message> }) => Promise<void>;
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
  setImageUploads: React.Dispatch<React.SetStateAction<FileUpload[]>>;
  /**
   * Ref callback to set reference on input box
   */
  setInputBoxRef: LegacyRef<TextInput> | undefined;
  setNumberOfUploads: React.Dispatch<React.SetStateAction<number>>;
  setSendThreadMessageInChannel: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMoreOptions: React.Dispatch<React.SetStateAction<boolean>>;
  showMoreOptions: boolean;
  /**
   * Function for taking a photo and uploading it
   */
  takeAndUploadImage: (mediaType?: MediaTypes) => Promise<void>;
  toggleAttachmentPicker: () => void;
  updateMessage: () => Promise<void>;
  /** Function for attempting to upload a file */
  uploadFile: ({ newFile }: { newFile: FileUpload }) => Promise<void>;
  /** Function for attempting to upload an image */
  uploadImage: ({ newImage }: { newImage: FileUpload }) => Promise<void>;
  uploadNewFile: (file: File, fileType?: FileTypes) => Promise<void>;
  uploadNewImage: (image: File) => Promise<void>;
};

export type InputMessageInputContextValue = {
  /**
   * Controls how many pixels to the top side the user has to scroll in order to lock the recording view and allow the user to lift their finger from the screen without stopping the recording.
   */
  asyncMessagesLockDistance: number;
  /**
   * Controls the minimum duration that the user has to press on the record button in the composer, in order to start recording a new voice message.
   */
  asyncMessagesMinimumPressDuration: number;
  /**
   * When it’s enabled, recorded messages won’t be sent immediately. Instead they will “stack up” in the composer allowing the user to send multiple voice recording as part of the same message.
   */
  asyncMessagesMultiSendEnabled: boolean;
  /**
   * Controls how many pixels to the leading side the user has to scroll in order to cancel the recording of a voice message.
   */
  asyncMessagesSlideToCancelDistance: number;
  /**
   * Custom UI component for attach button.
   *
   * Defaults to and accepts same props as: [AttachButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/attach-button/)
   */
  AttachButton: React.ComponentType<AttachButtonProps>;
  /**
   * Custom UI component for audio attachment upload preview.
   *
   * Defaults to and accepts same props as: [AudioAttachmentUploadPreview](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/AudioAttachment.tsx)
   */
  AudioAttachmentUploadPreview: React.ComponentType<AudioAttachmentProps>;
  /**
   * Custom UI component for audio recorder UI.
   *
   * Defaults to and accepts same props as: [AudioRecorder](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/AudioRecorder.tsx)
   */
  AudioRecorder: React.ComponentType<AudioRecorderProps>;
  /**
   * Controls whether the async audio feature is enabled.
   */
  audioRecordingEnabled: boolean;
  /**
   * Custom UI component to render audio recording in progress.
   *
   * **Default** [AudioRecordingInProgress](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingInProgress.tsx)
   */
  AudioRecordingInProgress: React.ComponentType<AudioRecordingInProgressProps>;
  /**
   * Custom UI component for audio recording lock indicator.
   *
   * Defaults to and accepts same props as: [AudioRecordingLockIndicator](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingLockIndicator.tsx)
   */
  AudioRecordingLockIndicator: React.ComponentType<AudioRecordingLockIndicatorProps>;
  /**
   * Custom UI component to render audio recording preview.
   *
   * **Default** [AudioRecordingPreview](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingPreview.tsx)
   */
  AudioRecordingPreview: React.ComponentType<AudioRecordingPreviewProps>;
  /**
   * Custom UI component to render audio recording waveform.
   *
   * **Default** [AudioRecordingWaveform](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingWaveform.tsx)
   */
  AudioRecordingWaveform: React.ComponentType<AudioRecordingWaveformProps>;

  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<AutoCompleteSuggestionItemProps>;
  AutoCompleteSuggestionList: React.ComponentType<AutoCompleteSuggestionListProps>;

  clearEditingState: () => void;
  clearQuotedMessageState: () => void;
  /**
   * Custom UI component for commands button.
   *
   * Defaults to and accepts same props as: [CommandsButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/commands-button/)
   */
  CommandsButton: React.ComponentType<CommandsButtonProps>;
  /**
   * Custom UI component to display the remaining cooldown a user will have to wait before
   * being allowed to send another message. This component is displayed in place of the
   * send button for the MessageInput component.
   *
   * **default** [CooldownTimer](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/CooldownTimer.tsx)
   */
  CooldownTimer: React.ComponentType<CooldownTimerProps>;
  editMessage: StreamChat['updateMessage'];
  /**
   * Custom UI component for FileUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/FileUploadPreview.tsx
   */
  FileUploadPreview: React.ComponentType<FileUploadPreviewProps>;

  /** When false, CameraSelectorIcon will be hidden */
  hasCameraPicker: boolean;

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
  ImageUploadPreview: React.ComponentType<ImageUploadPreviewProps>;
  InputEditingStateHeader: React.ComponentType<InputEditingStateHeaderProps>;
  CommandInput: React.ComponentType<CommandInputProps>;
  InputReplyStateHeader: React.ComponentType<InputReplyStateHeaderProps>;
  /** Limit on allowed number of files to attach at a time. */
  maxNumberOfFiles: number;
  /**
   * Custom UI component for more options button.
   *
   * Defaults to and accepts same props as: [MoreOptionsButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/more-options-button/)
   */
  MoreOptionsButton: React.ComponentType<MoreOptionsButtonProps>;

  /** Limit on the number of lines in the text input before scrolling */
  numberOfLines: number;
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/send-button/)
   */
  SendButton: React.ComponentType<SendButtonProps>;
  sendImageAsync: boolean;
  sendMessage: (message: Partial<StreamMessage>) => Promise<void>;
  setQuotedMessageState: (message: LocalMessage) => void;
  /**
   * Custom UI component to render checkbox with text ("Also send to channel") in Thread's input box.
   * When ticked, message will also be sent in parent channel.
   */
  ShowThreadMessageInChannelButton: React.ComponentType<{
    threadList?: boolean;
  }>;

  /**
   * Custom UI component for audio recording mic button.
   *
   * Defaults to and accepts same props as: [AudioRecordingButton](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingButton.tsx)
   */
  StartAudioRecordingButton: React.ComponentType<AudioRecordingButtonProps>;
  StopMessageStreamingButton: React.ComponentType<StopMessageStreamingButtonProps> | null;
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
  closePollCreationDialog?: () => void;
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality).
   * On iOS, values larger than 0.8 don't produce a noticeable quality increase in most images,
   * while a value of 0.8 will reduce the file size by about half or less compared to a value of 1.
   * Image picker defaults to 0.8 for iOS and 1 for Android
   */
  compressImageQuality?: number;

  /**
   * Override the entire content of the CreatePoll component. The component has full access to the
   * useCreatePollContext() hook.
   * */
  CreatePollContent?: React.ComponentType<PollContentProps>;

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
    channel: ChannelContextValue['channel'],
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
    file: File,
    channel: ChannelContextValue['channel'],
  ) => Promise<SendFileAPIResponse>;

  /**
   * Variable that tracks the editing state.
   * It is defined with message type if the editing state is true, else its undefined.
   */
  editing?: LocalMessage;
  /**
   * Handler for when the attach button is pressed.
   */
  handleAttachButtonPress?: () => void;
  /** Initial value to set on input */
  initialValue?: string;
  /**
   * Custom UI component for AutoCompleteInput.
   * Has access to all of [MessageInputContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/messageInputContext/MessageInputContext.tsx)
   */
  Input?: React.ComponentType<
    Omit<MessageInputProps, 'Input'> &
      InputButtonsProps & {
        getUsers: () => UserResponse[];
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
  InputButtons?: React.ComponentType<InputButtonsProps>;
  maxMessageLength?: number;
  /** Object containing filters/sort/options overrides for an @mention user query */
  mentionAllAppUsersEnabled?: boolean;
  mentionAllAppUsersQuery?: MentionAllAppUsersQuery;
  /**
   * Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler.
   */
  onChangeText?: (newText: string) => void;
  openPollCreationDialog?: ({ sendMessage }: Pick<LocalMessageInputContext, 'sendMessage'>) => void;
  quotedMessage?: LocalMessage;
  SendMessageDisallowedIndicator?: React.ComponentType;
  /**
   * ref for input setter function
   *
   * @param ref [Ref object](https://reactjs.org/docs/refs-and-the-dom.html) for underling `TextInput` component.
   *
   * @overrideType Function
   */
  setInputRef?: (ref: TextInput | null) => void;
  showPollCreationDialog?: boolean;
};

export type MessageInputContextValue = LocalMessageInputContext &
  Omit<InputMessageInputContextValue, 'sendMessage'>;

export const MessageInputContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageInputContextValue,
);

const textComposerStateSelector = (state: TextComposerState) => ({
  mentionedUsers: state.mentionedUsers,
  suggestions: state.suggestions,
  text: state.text,
});

export const MessageInputProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: InputMessageInputContextValue;
}>) => {
  const {
    closePicker,
    openPicker,
    selectedFiles,
    selectedImages,
    selectedPicker,
    setSelectedFiles,
    setSelectedImages,
    setSelectedPicker,
  } = useAttachmentPickerContext();
  const { appSettings, client, enableOfflineSupport } = useChatContext();
  const { removeMessage } = useMessagesContext();

  const getFileUploadConfig = () => {
    const fileConfig = appSettings?.app?.file_upload_config;
    if (fileConfig !== undefined) {
      return fileConfig;
    } else {
      return {};
    }
  };

  const getImageUploadConfig = () => {
    const imageConfig = appSettings?.app?.image_upload_config;
    if (imageConfig !== undefined) {
      return imageConfig;
    }
    return {};
  };

  const channelCapabities = useOwnCapabilitiesContext();

  const { channel, isCommandUIEnabled, uploadAbortControllerRef } = useChannelContext();
  const { thread } = useThreadContext();
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
  const [sendThreadMessageInChannel, setSendThreadMessageInChannel] = useState(false);
  const [showPollCreationDialog, setShowPollCreationDialog] = useState(false);

  const defaultOpenPollCreationDialog = useCallback(() => setShowPollCreationDialog(true), []);
  const closePollCreationDialog = useCallback(() => setShowPollCreationDialog(false), []);

  const {
    editing,
    initialValue,
    openPollCreationDialog: openPollCreationDialogFromContext,
    StopMessageStreamingButton,
  } = value;

  const {
    fileUploads,
    imageUploads,
    numberOfUploads,
    setFileUploads,
    setImageUploads,
    setNumberOfUploads,
    setShowMoreOptions,
    showMoreOptions,
  } = useMessageDetailsForState(editing, initialValue);
  const { endsAt: cooldownEndsAt, start: startCooldown } = useCooldown();

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { mentionedUsers, text } = useStateStore(textComposer.state, textComposerStateSelector);

  const threadId = thread?.id;
  useEffect(() => {
    setSendThreadMessageInChannel(false);
  }, [threadId]);

  useEffect(() => {
    if (!client || !isCommandUIEnabled) {
      return;
    }

    client.setMessageComposerSetupFunction(({ composer }) => {
      composer.compositionMiddlewareExecutor.insert({
        middleware: [createCommandInjectionMiddleware(composer)],
        position: { after: 'stream-io/message-composer-middleware/attachments' },
      });
      composer.draftCompositionMiddlewareExecutor.insert({
        middleware: [createDraftCommandInjectionMiddleware(composer)],
        position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
      });
      composer.textComposer.middlewareExecutor.insert({
        middleware: [createCommandControlMiddleware(composer) as TextComposerMiddleware],
        position: { before: 'stream-io/text-composer/pre-validation-middleware' },
      });
    });
  }, [client, isCommandUIEnabled]);

  /** Checks if the message is valid or not. Accordingly we can enable/disable send button */
  const isValidMessage = useStableCallback(() => {
    if (text && text.trim()) {
      return true;
    }

    const imagesAndFiles = [...imageUploads, ...fileUploads];
    if (imagesAndFiles.length === 0) {
      return false;
    }

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
  });

  /**
   * Function for capturing a photo and uploading it
   */
  const takeAndUploadImage = useStableCallback(async (mediaType?: MediaTypes) => {
    setSelectedPicker(undefined);
    closePicker();
    const file = await NativeHandlers.takePhoto({
      compressImageQuality: value.compressImageQuality,
      mediaType,
    });
    if (file.askToOpenSettings) {
      Alert.alert(
        t('Allow camera access in device settings'),
        t('Device camera is used to take photos or videos.'),
        [
          { style: 'cancel', text: t('Cancel') },
          { onPress: () => Linking.openSettings(), style: 'default', text: t('Open Settings') },
        ],
      );
    }
    if (!file.cancelled) {
      if (file.type.includes('image')) {
        // We already compressed the image in the native handler, so we can upload it directly.
        await uploadNewImage(file);
      } else {
        await uploadNewFile(file);
      }
    }
  });

  /**
   * Function for picking a photo from native image picker and uploading it
   */
  const pickAndUploadImageFromNativePicker = useStableCallback(async () => {
    const result = await NativeHandlers.pickImage();
    if (result.askToOpenSettings) {
      Alert.alert(
        t('Allow access to your Gallery'),
        t('Device gallery permissions is used to take photos or videos.'),
        [
          { style: 'cancel', text: t('Cancel') },
          { onPress: () => Linking.openSettings(), style: 'default', text: t('Open Settings') },
        ],
      );
    }

    // RN CLI
    if (numberOfUploads >= value.maxNumberOfFiles) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    if (result.assets && result.assets.length > 0) {
      // Expo
      if (result.assets.length > value.maxNumberOfFiles) {
        Alert.alert(t('Maximum number of files reached'));
        return;
      }
      result.assets.forEach(async (asset) => {
        if (asset.type.includes('image')) {
          const compressedURI = await compressedImageURI(asset, value.compressImageQuality);
          await uploadNewImage({
            ...asset,
            uri: compressedURI,
          });
        } else {
          await uploadNewFile(asset);
        }
      });
    }
  });

  /**
   * Function to open the attachment picker if the MediaLibary is installed.
   */
  const openAttachmentPicker = useCallback(() => {
    Keyboard.dismiss();
    setSelectedPicker('images');
    openPicker();
  }, [openPicker, setSelectedPicker]);

  /**
   * Function to close the attachment picker if the MediaLibrary is installed.
   */
  const closeAttachmentPicker = useCallback(() => {
    setSelectedPicker(undefined);
    closePicker();
  }, [closePicker, setSelectedPicker]);

  /**
   * Function to toggle the attachment picker if the MediaLibrary is installed.
   */
  const toggleAttachmentPicker = useCallback(() => {
    if (selectedPicker) {
      closeAttachmentPicker();
    } else {
      openAttachmentPicker();
    }
  }, [closeAttachmentPicker, openAttachmentPicker, selectedPicker]);

  const pickFile = useStableCallback(async () => {
    if (!isDocumentPickerAvailable()) {
      console.log(
        'The file picker is not installed. Check our Getting Started documentation to install it.',
      );
      return;
    }

    if (numberOfUploads >= value.maxNumberOfFiles) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    const result = await NativeHandlers.pickDocument({
      maxNumberOfFiles: value.maxNumberOfFiles - numberOfUploads,
    });

    if (!result.cancelled && result.assets) {
      result.assets.forEach(async (asset) => {
        if (asset.type.includes('image')) {
          const compressedURI = await compressedImageURI(asset, value.compressImageQuality);
          await uploadNewImage({
            ...asset,
            uri: compressedURI,
          });
        } else {
          await uploadNewFile(asset);
        }
      });
    }
  });

  const removeFile = useCallback(
    (id: string) => {
      if (fileUploads.some((file) => file.id === id)) {
        setFileUploads((prevFileUploads) => prevFileUploads.filter((file) => file.id !== id));
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      }
    },
    [fileUploads, setFileUploads, setNumberOfUploads],
  );

  const removeImage = useCallback(
    (id: string) => {
      if (imageUploads.some((image) => image.id === id)) {
        setImageUploads((prevImageUploads) => prevImageUploads.filter((image) => image.id !== id));
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads - 1);
      }
    },
    [imageUploads, setImageUploads, setNumberOfUploads],
  );

  const resetInput = useStableCallback((pendingAttachments: Attachment[] = []) => {
    /**
     * If the MediaLibrary is available, reset the selected files and images
     */
    if (isImageMediaLibraryAvailable()) {
      setSelectedFiles([]);
      setSelectedImages([]);
    }

    // setText('');
    setFileUploads([]);
    // setGiphyActive(false);
    // setShowMoreOptions(true);
    setImageUploads([]);
    // setMentionedUsers([]);
    setNumberOfUploads(
      (prevNumberOfUploads) => prevNumberOfUploads - (pendingAttachments?.length || 0),
    );
    if (value.editing) {
      value.clearEditingState();
    }
  });

  const mapImageUploadToAttachment = useStableCallback((image: FileUpload): Attachment => {
    return {
      fallback: image.file.name,
      image_url: image.url,
      mime_type: image.file.type,
      original_height: image.file.height,
      original_width: image.file.width,
      originalImage: image.file,
      type: FileTypes.Image,
    };
  });

  const mapFileUploadToAttachment = useStableCallback((file: FileUpload): Attachment => {
    if (file.type === FileTypes.Image) {
      return {
        fallback: file.file.name,
        image_url: file.url,
        mime_type: file.file.type,
        original_height: file.file.height,
        original_width: file.file.width,
        originalFile: file.file,
        type: FileTypes.Image,
      };
    } else if (file.type === FileTypes.Audio) {
      return {
        asset_url: file.url || file.file.uri,
        duration: file.file.duration,
        file_size: file.file.size,
        mime_type: file.file.type,
        originalFile: file.file,
        title: file.file.name,
        type: FileTypes.Audio,
      };
    } else if (file.type === FileTypes.Video) {
      return {
        asset_url: file.url || file.file.uri,
        duration: file.file.duration,
        file_size: file.file.size,
        mime_type: file.file.type,
        originalFile: file.file,
        thumb_url: file.thumb_url,
        title: file.file.name,
        type: FileTypes.Video,
      };
    } else if (file.type === FileTypes.VoiceRecording) {
      return {
        asset_url: file.url || file.file.uri,
        duration: file.file.duration,
        file_size: file.file.size,
        mime_type: file.file.type,
        originalFile: file.file,
        title: file.file.name,
        type: FileTypes.VoiceRecording,
        waveform_data: file.file.waveform_data,
      };
    } else {
      return {
        asset_url: file.url || file.file.uri,
        file_size: file.file.size,
        mime_type: file.file.type,
        originalFile: file.file,
        title: file.file.name,
        type: FileTypes.File,
      };
    }
  });

  // TODO: Figure out why this is async, as it doesn't await any promise.
  const sendMessage = useStableCallback(
    async ({
      customMessageData,
    }: {
      customMessageData?: Partial<Message>;
    } = {}) => {
      if (sending.current) {
        return;
      }
      const linkInfos = parseLinksFromText(text);

      if (!channelCapabities.sendLinks && linkInfos.length > 0) {
        Alert.alert(
          t('Links are disabled'),
          t('Sending links is not allowed in this conversation'),
        );

        return;
      }

      sending.current = true;

      startCooldown();

      if (inputBoxRef.current) {
        inputBoxRef.current.clear();
      }

      const attachments = [] as Attachment[];
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
      if (!text && attachments.length === 0 && !customMessageData?.poll_id) {
        sending.current = false;
        return;
      }

      const message = value.editing;
      if (message && message.type !== 'error') {
        const updatedMessage = {
          ...message,
          attachments,
          mentioned_users: mentionedUsers.map((user) => ({ id: user.id })),
          quoted_message: undefined,
          text,
          ...customMessageData,
        } as Parameters<StreamChat['updateMessage']>[0];

        // TODO: Remove this line and show an error when submit fails
        value.clearEditingState();

        const updateMessagePromise = value
          .editMessage(
            // @ts-ignore
            removeReservedFields(updatedMessage),
          )
          .then(value.clearEditingState);
        logChatPromiseExecution(updateMessagePromise, 'update message');
        resetInput(attachments);

        sending.current = false;
      } else {
        try {
          /**
           * If the message is bounced by moderation, we firstly remove the message from message list and then send a new message.
           */
          if (message && isBouncedMessage(message)) {
            await removeMessage(message);
          }

          value.sendMessage({
            attachments,
            // TODO: Handle unique users
            mentioned_users: mentionedUsers.map((user) => user.id),
            /** Parent message id - in case of thread */
            parent_id: thread?.id,
            quoted_message_id: value.quotedMessage ? value.quotedMessage.id : undefined,
            show_in_channel: sendThreadMessageInChannel || undefined,
            text,
            ...customMessageData,
          });

          value.clearQuotedMessageState();
          sending.current = false;
          resetInput(attachments);
        } catch (_error) {
          sending.current = false;
          if (value.quotedMessage && typeof value.quotedMessage !== 'boolean') {
            value.setQuotedMessageState(value.quotedMessage);
          }
          console.log('Failed to send message');
        }
      }
    },
  );

  const sendMessageAsync = useStableCallback((id: string) => {
    const image = asyncUploads[id];
    if (!image || image.state === FileState.UPLOAD_FAILED) {
      return;
    }

    if (image.state === FileState.UPLOADED || image.state === FileState.FINISHED) {
      const attachments = [
        {
          image_url: image.url,
          type: FileTypes.Image,
        },
      ] as StreamMessage['attachments'];

      startCooldown();
      try {
        value.sendMessage({
          attachments,
          mentioned_users: [],
          parent_id: thread?.id,
          quoted_message_id: value.quotedMessage ? value.quotedMessage.id : undefined,
          show_in_channel: sendThreadMessageInChannel || undefined,
          text: '',
        } as unknown as Partial<StreamMessage>);

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
  });

  const setInputBoxRef = useStableCallback((ref: TextInput | null) => {
    inputBoxRef.current = ref;
    if (value.setInputRef) {
      value.setInputRef(ref);
    }
  });

  const updateMessage = useStableCallback(async () => {
    try {
      if (value.editing) {
        await client.updateMessage({
          ...value.editing,
          quoted_message: undefined,
          text,
        } as Parameters<StreamChat['updateMessage']>[0]);
      }

      value.clearEditingState();
      resetInput();
    } catch (error) {
      console.log(error);
    }
  });

  const regexCondition = /File (extension \.\w{2,4}|type \S+) is not supported/;

  const getUploadSetStateAction = useStableCallback(
    <UploadType extends FileUpload>(
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
        }),
  );

  const handleFileOrImageUploadError = useStableCallback(
    (error: unknown, isImageError: boolean, id: string) => {
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
    },
  );

  const uploadFile = useStableCallback(async ({ newFile }: { newFile: FileUpload }) => {
    const { file, id } = newFile;

    // The file name can have special characters, so we escape it.
    const filename = escapeRegExp(file.name);

    setFileUploads(getUploadSetStateAction(id, FileState.UPLOADING));

    let response: Partial<SendFileAPIResponse> = {};
    try {
      if (value.doDocUploadRequest) {
        response = await value.doDocUploadRequest(file, channel);
      } else if (channel && file.uri) {
        uploadAbortControllerRef.current.set(
          filename,
          client.createAbortControllerForNextRequest(),
        );
        // Compress images selected through file picker when uploading them
        if (file.type?.includes('image')) {
          const compressedUri = await compressedImageURI(file, value.compressImageQuality);
          response = await channel.sendFile(compressedUri, filename, file.type);
        } else {
          response = await channel.sendFile(file.uri, filename, file.type);
        }
        uploadAbortControllerRef.current.delete(filename);
      }

      const extraData: Partial<FileUpload> = {
        thumb_url: response.thumb_url,
        url: response.file,
      };
      setFileUploads(getUploadSetStateAction(id, FileState.UPLOADED, extraData));
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'CanceledError')
      ) {
        // nothing to do
        uploadAbortControllerRef.current.delete(filename);
        return;
      }
      handleFileOrImageUploadError(error, false, id);
    }
  });

  const uploadImage = useStableCallback(async ({ newImage }: { newImage: FileUpload }) => {
    const { file, id } = newImage || {};

    if (!file) {
      return;
    }

    let response = {} as SendFileAPIResponse;

    const uri = file.uri || '';
    // The file name can have special characters, so we escape it.
    const filename = escapeRegExp(file.name ?? getFileNameFromPath(uri));

    try {
      const contentType = file.type || 'multipart/form-data';
      if (value.doImageUploadRequest) {
        response = await value.doImageUploadRequest(file, channel);
      } else if (channel) {
        if (value.sendImageAsync) {
          uploadAbortControllerRef.current.set(
            filename,
            client.createAbortControllerForNextRequest(),
          );
          channel.sendImage(file.uri, filename, contentType).then(
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
                const newImageUploads = getUploadSetStateAction<FileUpload>(
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
          response = await channel.sendImage(file.uri, filename, contentType);
          uploadAbortControllerRef.current.delete(filename);
        }
      }

      if (Object.keys(response).length) {
        const newImageUploads = getUploadSetStateAction<FileUpload>(id, FileState.UPLOADED, {
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
  });

  /**
   * The fileType is optional and is used to override the file type detection.
   * This is useful for voice recordings, where the file type is not always detected correctly.
   * This will change if we unify the file uploads to attachments.
   */
  const uploadNewFile = useStableCallback(async (file: File, fileType?: FileTypes) => {
    try {
      const id: string = generateRandomId();
      const fileConfig = getFileUploadConfig();
      const { size_limit } = fileConfig;

      const isAllowed = isUploadAllowed({ config: fileConfig, file });

      const sizeLimit = size_limit || MAX_FILE_SIZE_TO_UPLOAD;

      if (file.size && file.size > sizeLimit) {
        Alert.alert(
          t('File is too large: {{ size }}, maximum upload size is {{ limit }}', {
            limit: prettifyFileSize(sizeLimit),
            size: prettifyFileSize(file.size),
          }),
        );
        setSelectedFiles(selectedFiles.filter((selectedFile) => selectedFile.uri !== file.uri));
        return;
      }

      const fileState = isAllowed ? FileState.UPLOADING : FileState.NOT_SUPPORTED;
      const derivedFileType = fileType ?? getFileTypeFromMimeType(file.type);

      const newFile: FileUpload = {
        duration: file.duration || 0,
        file,
        id,
        mime_type: file.type,
        state: fileState,
        thumb_url: file.thumb_url,
        type: derivedFileType,
        url: file.uri,
      };

      await Promise.all([
        setFileUploads((prevFileUploads) => prevFileUploads.concat([newFile])),
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
      ]);

      if (isAllowed) {
        await uploadFile({ newFile });
      }
    } catch (error) {
      console.log('Error uploading file', error);
    }
  });

  const uploadNewImage = useStableCallback(async (image: File) => {
    try {
      const id = generateRandomId();
      const imageUploadConfig = getImageUploadConfig();

      const { size_limit } = imageUploadConfig;

      const isAllowed = isUploadAllowed({ config: imageUploadConfig, file: image });

      const sizeLimit = size_limit || MAX_FILE_SIZE_TO_UPLOAD;

      if (image.size && image?.size > sizeLimit) {
        Alert.alert(
          t('File is too large: {{ size }}, maximum upload size is {{ limit }}', {
            limit: prettifyFileSize(sizeLimit),
            size: prettifyFileSize(image.size),
          }),
        );
        setSelectedImages(
          selectedImages.filter((selectedImage) => selectedImage.uri !== image.uri),
        );
        return;
      }

      const imageState = isAllowed ? FileState.UPLOADING : FileState.NOT_SUPPORTED;

      const newImage: FileUpload = {
        file: image,
        height: image.height,
        id,
        mime_type: image.type,
        state: imageState,
        type: FileTypes.Image,
        url: image.uri,
        width: image.width,
      };

      await Promise.all([
        setImageUploads((prevImageUploads) => prevImageUploads.concat([newImage])),
        setNumberOfUploads((prevNumberOfUploads) => prevNumberOfUploads + 1),
      ]);

      if (isAllowed) {
        await uploadImage({ newImage });
      }
    } catch (error) {
      console.log('Error uploading image', error);
    }
  });

  const openPollCreationDialog = useStableCallback(() => {
    if (openPollCreationDialogFromContext) {
      openPollCreationDialogFromContext({ sendMessage });
      return;
    }
    defaultOpenPollCreationDialog();
  });

  const messageInputContext = useCreateMessageInputContext({
    asyncIds,
    asyncUploads,
    closeAttachmentPicker,
    cooldownEndsAt,
    fileUploads,
    imageUploads,
    inputBoxRef,
    isCommandUIEnabled,
    isValidMessage,
    numberOfUploads,
    openAttachmentPicker,
    openFilePicker: pickFile,
    pickAndUploadImageFromNativePicker,
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
    setImageUploads,
    setInputBoxRef,
    setNumberOfUploads,
    setSendThreadMessageInChannel,
    setShowMoreOptions,
    showMoreOptions,
    takeAndUploadImage,
    thread,
    toggleAttachmentPicker,
    updateMessage,
    uploadFile,
    uploadImage,
    uploadNewFile,
    uploadNewImage,
    ...value,
    closePollCreationDialog,
    openPollCreationDialog,
    sendMessage, // overriding the originally passed in sendMessage
    showPollCreationDialog,
    StopMessageStreamingButton,
  });
  return (
    <MessageInputContext.Provider
      value={messageInputContext as unknown as MessageInputContextValue}
    >
      {children}
    </MessageInputContext.Provider>
  );
};

export const useMessageInputContext = () => {
  const contextValue = useContext(MessageInputContext) as unknown as MessageInputContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageInputContext hook was called outside of the MessageInputContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const useStableCallback = <T extends Function>(callback: T): T => {
  const ref = useRef<T>(callback);
  ref.current = callback;
  return useCallback(((...args: unknown[]) => ref.current(...args)) as unknown as T, []);
};
