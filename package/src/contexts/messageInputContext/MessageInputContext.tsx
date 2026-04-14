import React, {
  PropsWithChildren,
  Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Linking, TextInput, TextInputProps } from 'react-native';

import { lookup as lookupMimeType } from 'mime-types';
import {
  LocalMessage,
  MessageComposer,
  SendMessageOptions,
  StreamChat,
  Message as StreamMessage,
  UpdateMessageOptions,
  UploadRequestFn,
} from 'stream-chat';

import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageComposer } from './hooks/useMessageComposer';

import { dismissKeyboard } from '../../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { parseLinksFromText } from '../../components/Message/MessageItemView/utils/parseLinks';
import { useAudioRecorder } from '../../components/MessageInput/hooks/useAudioRecorder';
import { useStableCallback } from '../../hooks/useStableCallback';
import {
  createAttachmentsCompositionMiddleware,
  createDraftAttachmentsCompositionMiddleware,
  setupVideoAttachmentPreviewMiddleware,
} from '../../middlewares/attachments';

import { isDocumentPickerAvailable, MediaTypes, NativeHandlers } from '../../native';
import { AudioRecorderManager } from '../../state-store/audio-recorder-manager';
import { MessageInputHeightStore } from '../../state-store/message-input-height-store';
import { File } from '../../types/types';
import { compressedImageURI } from '../../utils/compressImage';
import { useAttachmentPickerContext } from '../attachmentPickerContext/AttachmentPickerContext';
import { useChannelContext } from '../channelContext/ChannelContext';
import { useChatContext } from '../chatContext/ChatContext';
import { useMessageComposerAPIContext } from '../messageComposerContext/MessageComposerAPIContext';
import { useOwnCapabilitiesContext } from '../ownCapabilitiesContext/OwnCapabilitiesContext';
import { useThreadContext } from '../threadContext/ThreadContext';
import { useTranslationContext } from '../translationContext/TranslationContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type LocalMessageInputContext = {
  closeAttachmentPicker: () => void;
  inputBoxRef: React.RefObject<TextInput | null>;
  openAttachmentPicker: () => void;
  /**
   * Function for picking a photo from native image picker and uploading it.
   */
  pickAndUploadImageFromNativePicker: () => Promise<void>;
  pickFile: () => Promise<void>;
  sendMessage: () => Promise<void>;
  /**
   * Ref callback to set reference on input box
   */
  setInputBoxRef: Ref<TextInput> | undefined;
  /**
   * Function for taking a photo and uploading it
   */
  takeAndUploadImage: (
    mediaType?: MediaTypes,
  ) => Promise<{ askToOpenSettings?: boolean; canceled?: boolean } | undefined>;
  uploadNewFile: (file: File) => Promise<void>;
  audioRecorderManager: AudioRecorderManager;
  startVoiceRecording: () => Promise<boolean | undefined>;
  deleteVoiceRecording: () => Promise<void>;
  uploadVoiceRecording: (sendOnComplete: boolean) => Promise<void>;
  stopVoiceRecording: () => Promise<void>;
};

export type InputMessageInputContextValue = {
  /**
   * Controls how many pixels to the top side the user has to scroll in order to lock the recording view and allow the
   * user to lift their finger from the screen without stopping the recording.
   */
  asyncMessagesLockDistance: number;
  /**
   * Controls the minimum duration that the user has to press on the record button in the composer, in order to start
   * recording a new voice message.
   */
  asyncMessagesMinimumPressDuration: number;
  /**
   * Controls whether a completed voice recording is sent immediately or added to the composer first.
   * When true, the recording is sent immediately on completion.
   * When false, the recording is added to the composer and only sent if the user decides to.
   */
  audioRecordingSendOnComplete: boolean;
  /**
   * Controls how many pixels to the leading side the user has to scroll in order to cancel the recording of a voice
   * message.
   */
  asyncMessagesSlideToCancelDistance: number;
  /**
   * Controls whether the async audio feature is enabled.
   */
  audioRecordingEnabled: boolean;
  /**
   * Height of the image picker bottom sheet when opened.
   * @type number
   * @default 40% of window height
   */
  attachmentPickerBottomSheetHeight: number;
  /**
   * Height of the attachment selection bar displayed on the attachment picker.
   * @type number
   * @default 52
   * @deprecated Please remove this in scope of V9
   */
  attachmentSelectionBarHeight: number;

  editMessage: (params: {
    localMessage: LocalMessage;
    options?: UpdateMessageOptions;
  }) => ReturnType<StreamChat['updateMessage']>;

  /** When false, CameraSelectorIcon will be hidden */
  hasCameraPicker: boolean;

  /** When false, CommandsButton will be hidden */
  hasCommands: boolean;
  /** When false, FileSelectorIcon will be hidden */
  hasFilePicker: boolean;
  /** When false, ImageSelectorIcon will be hidden */
  hasImagePicker: boolean;

  sendMessage: (params: {
    localMessage: LocalMessage;
    message: StreamMessage;
    options?: SendMessageOptions;
  }) => Promise<void>;
  /**
   * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
   *
   * @see See https://reactnative.dev/docs/textinput#reference
   */
  additionalTextInputProps?: TextInputProps;
  allowSendBeforeAttachmentsUpload?: boolean;
  closePollCreationDialog?: () => void;
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality).
   * On iOS, values larger than 0.8 don't produce a noticeable quality increase in most images,
   * while a value of 0.8 will reduce the file size by about half or less compared to a value of 1.
   * Image picker defaults to 0.8 for iOS and 1 for Android
   */
  compressImageQuality?: number;

  /**
   * Vertical gap between poll options in poll creation dialog.
   */
  createPollOptionGap?: number;

  /**
   * Override file upload request
   *
   * @param file    File object
   *
   * @overrideType Function
   */
  doFileUploadRequest?: UploadRequestFn;

  /**
   * Handler for when the attach button is pressed.
   */
  handleAttachButtonPress?: () => void;

  /**
   * Whether the message input is floating or not.
   * @type boolean
   * @default false
   */
  messageInputFloating: boolean;

  openPollCreationDialog?: ({ sendMessage }: Pick<LocalMessageInputContext, 'sendMessage'>) => void;
  /**
   * ref for input setter function
   *
   * @param ref [Ref object](https://reactjs.org/docs/refs-and-the-dom.html) for underling `TextInput` component.
   *
   * @overrideType Function
   */
  setInputRef?: (ref: TextInput | null) => void;
  showPollCreationDialog?: boolean;
  messageInputHeightStore: MessageInputHeightStore;
};

export type MessageInputContextValue = LocalMessageInputContext &
  Omit<InputMessageInputContextValue, 'sendMessage'>;

export const MessageInputContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageInputContextValue,
);

export const MessageInputProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: InputMessageInputContextValue;
}>) => {
  const { closePicker, openPicker, attachmentPickerStore, disableAttachmentPicker } =
    useAttachmentPickerContext();
  const { client } = useChatContext();
  const channelCapabilities = useOwnCapabilitiesContext();
  const [audioRecorderManager] = useState(new AudioRecorderManager());

  const { uploadAbortControllerRef } = useChannelContext();
  const { clearEditingState } = useMessageComposerAPIContext();
  const { thread } = useThreadContext();
  const { t } = useTranslationContext();
  const inputBoxRef = useRef<TextInput | null>(null);

  const [showPollCreationDialog, setShowPollCreationDialog] = useState(false);

  const defaultOpenPollCreationDialog = useCallback(() => setShowPollCreationDialog(true), []);
  const closePollCreationDialog = useCallback(() => setShowPollCreationDialog(false), []);

  const {
    openPollCreationDialog: openPollCreationDialogFromContext,
    allowSendBeforeAttachmentsUpload,
  } = value;

  const messageComposer = useMessageComposer();
  const { attachmentManager, editedMessage } = messageComposer;

  /**
   * These are the RN SDK specific middlewares that are added to the message composer to provide the default behaviour.
   * TODO: Discuss and decide if we provide them by default in the SDK or leave it to the user to add them if they want
   * the feature.
   */
  useEffect(() => {
    if (value.doFileUploadRequest) {
      attachmentManager.setCustomUploadFn(value.doFileUploadRequest);
    }

    setupVideoAttachmentPreviewMiddleware(messageComposer);

    if (allowSendBeforeAttachmentsUpload) {
      messageComposer.compositionMiddlewareExecutor.replace([
        createAttachmentsCompositionMiddleware(messageComposer),
      ]);

      messageComposer.draftCompositionMiddlewareExecutor.replace([
        createDraftAttachmentsCompositionMiddleware(messageComposer),
      ]);
    }
  }, [
    value.doFileUploadRequest,
    allowSendBeforeAttachmentsUpload,
    messageComposer,
    attachmentManager,
  ]);

  /**
   * Function for capturing a photo and uploading it
   */
  const takeAndUploadImage = useStableCallback(async (mediaType?: MediaTypes) => {
    if (!attachmentManager.availableUploadSlots) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    const file = await NativeHandlers.takePhoto({
      compressImageQuality: value.compressImageQuality,
      mediaType,
    });

    if (file.askToOpenSettings && disableAttachmentPicker) {
      Alert.alert(
        t('Allow camera access in device settings'),
        t('Device camera is used to take photos or videos.'),
        [
          { style: 'cancel', text: t('Cancel') },
          { onPress: () => Linking.openSettings(), style: 'default', text: t('Open Settings') },
        ],
      );
    }

    if (file.askToOpenSettings || file.cancelled) {
      return file;
    }

    await uploadNewFile(file);

    return file;
  });

  /**
   * Function for picking a photo from native image picker and uploading it
   */
  const pickAndUploadImageFromNativePicker = useStableCallback(async () => {
    if (!attachmentManager.availableUploadSlots) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    const result = await NativeHandlers.pickImage({
      maxNumberOfFiles: attachmentManager.availableUploadSlots,
    });
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

    if (result.cancelled || !result.assets?.length) {
      return;
    }

    result.assets.forEach(async (asset) => {
      await uploadNewFile(asset);
    });
  });

  const pickFile = useStableCallback(async () => {
    if (!isDocumentPickerAvailable()) {
      console.log(
        'The file picker is not installed. Check our Getting Started documentation to install it.',
      );
      return;
    }

    if (!attachmentManager.availableUploadSlots) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    const result = await NativeHandlers.pickDocument({
      maxNumberOfFiles: attachmentManager.availableUploadSlots,
    });

    if (result.cancelled || !result.assets?.length) {
      return;
    }

    result.assets.forEach(async (asset) => {
      await uploadNewFile(asset);
    });
  });

  /**
   * Function to open the attachment picker if the MediaLibary is installed.
   */
  const openAttachmentPicker = useCallback(() => {
    dismissKeyboard();
    attachmentPickerStore.setSelectedPicker('images');
    openPicker();
  }, [attachmentPickerStore, openPicker]);

  /**
   * Function to close the attachment picker if the MediaLibrary is installed.
   */
  const closeAttachmentPicker = useCallback(() => {
    attachmentPickerStore.setSelectedPicker(undefined);
    closePicker();
  }, [closePicker, attachmentPickerStore]);

  const sendMessage = useStableCallback(async () => {
    if (inputBoxRef.current) {
      inputBoxRef.current.clear();
    }

    try {
      const composition = await messageComposer.compose();

      if (!composition || !composition.message) return;

      const { localMessage, message, sendOptions } = composition;
      const linkInfos = parseLinksFromText(localMessage.text);

      if (!channelCapabilities.sendLinks && linkInfos.length > 0) {
        Alert.alert(
          t('Links are disabled'),
          t('Sending links is not allowed in this conversation'),
        );

        return;
      }

      // MODERATION: This is for the case where the message is of type 'error' and if you try to edit it, it will throw an error.
      if (editedMessage && editedMessage.type !== 'error') {
        try {
          clearEditingState();
          await value.editMessage({ localMessage, options: sendOptions });
        } catch (error) {
          throw new Error('Error while editing message');
        }
      } else {
        try {
          // Since the message id does not get cleared, we have to handle this manually
          // and let the poll creation dialog handle clearing the rest of the state. Once
          // sending a message has been moved to the composer as an API, this will be
          // redundant and can be removed.
          if (localMessage.poll_id) {
            messageComposer.state.partialNext({
              id: MessageComposer.generateId(),
              pollId: null,
            });
          } else {
            messageComposer.clear();
          }
          // Even though we edit, but we eventually send the message as a regular message, so we need to clear the editing state.
          if (editedMessage) {
            clearEditingState();
          }
          await value.sendMessage({
            localMessage,
            message,
            options: sendOptions,
          });
        } catch (error) {
          throw new Error('Error while sending message');
        }
      }
    } catch (error) {
      console.error('Error while sending message:', error);
    }
  });

  const setInputBoxRef = useStableCallback((ref: TextInput | null) => {
    inputBoxRef.current = ref;
    if (value.setInputRef) {
      value.setInputRef(ref);
    }
  });

  const uploadNewFile = useStableCallback(async (file: File) => {
    try {
      if (!file?.uri) {
        return;
      }

      const fallbackMimeType =
        lookupMimeType(file.name || file.uri || '') ||
        (file.duration ? 'video/*' : file.height && file.width ? 'image/*' : undefined);
      const normalizedFile = {
        ...file,
        type:
          file.type ||
          (typeof fallbackMimeType === 'string' ? fallbackMimeType : 'application/octet-stream'),
      };
      uploadAbortControllerRef.current.set(file.name, client.createAbortControllerForNextRequest());
      const fileURI = normalizedFile.type.includes('image')
        ? await compressedImageURI(normalizedFile, value.compressImageQuality)
        : normalizedFile.uri;
      const updatedFile = { ...normalizedFile, uri: fileURI };
      await attachmentManager.uploadFiles([updatedFile]);
      uploadAbortControllerRef.current.delete(normalizedFile.name);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'CanceledError')
      ) {
        uploadAbortControllerRef.current.delete(file.name);
        return;
      }
    }
  });

  const openPollCreationDialog = useStableCallback(() => {
    if (openPollCreationDialogFromContext) {
      openPollCreationDialogFromContext({ sendMessage });
      return;
    }
    defaultOpenPollCreationDialog();
  });

  const { deleteVoiceRecording, startVoiceRecording, stopVoiceRecording, uploadVoiceRecording } =
    useAudioRecorder({ audioRecorderManager, sendMessage });

  const messageInputContext = useCreateMessageInputContext({
    closeAttachmentPicker,
    inputBoxRef,
    openAttachmentPicker,
    pickAndUploadImageFromNativePicker,
    pickFile,
    setInputBoxRef,
    takeAndUploadImage,
    thread,
    uploadNewFile,
    ...value,
    closePollCreationDialog,
    openPollCreationDialog,
    sendMessage, // overriding the originally passed in sendMessage
    showPollCreationDialog,
    audioRecorderManager,
    startVoiceRecording,
    deleteVoiceRecording,
    uploadVoiceRecording,
    stopVoiceRecording,
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
