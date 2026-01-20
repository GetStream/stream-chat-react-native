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

import { BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import {
  LocalMessage,
  MessageComposer,
  SendMessageOptions,
  StreamChat,
  Message as StreamMessage,
  UpdateMessageOptions,
  UploadRequestFn,
  UserResponse,
} from 'stream-chat';

import { useAttachmentManagerState } from './hooks/useAttachmentManagerState';
import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageComposer } from './hooks/useMessageComposer';

import {
  AutoCompleteSuggestionHeaderProps,
  AutoCompleteSuggestionItemProps,
  AutoCompleteSuggestionListProps,
  PollContentProps,
  StopMessageStreamingButtonProps,
} from '../../components';
import { dismissKeyboard } from '../../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { parseLinksFromText } from '../../components/Message/MessageSimple/utils/parseLinks';
import { AttachmentUploadPreviewListProps } from '../../components/MessageInput/components/AttachmentPreview/AttachmentUploadPreviewList';
import type { AttachmentUploadProgressIndicatorProps } from '../../components/MessageInput/components/AttachmentPreview/AttachmentUploadProgressIndicator';
import { AudioAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/AudioAttachmentUploadPreview';
import { FileAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/FileAttachmentUploadPreview';
import { ImageAttachmentUploadPreviewProps } from '../../components/MessageInput/components/AttachmentPreview/ImageAttachmentUploadPreview';
import type { AudioRecorderProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecorder';
import type { AudioRecordingButtonProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingButton';
import type { AudioRecordingInProgressProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingInProgress';
import type { AudioRecordingLockIndicatorProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingLockIndicator';
import type { AudioRecordingPreviewProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingPreview';
import type { AudioRecordingWaveformProps } from '../../components/MessageInput/components/AudioRecorder/AudioRecordingWaveform';
import type { CommandInputProps } from '../../components/MessageInput/components/CommandInput';
import type { AttachButtonProps } from '../../components/MessageInput/components/InputButtons/AttachButton';
import type { InputButtonsProps } from '../../components/MessageInput/components/InputButtons/index';
import type { CooldownTimerProps } from '../../components/MessageInput/components/OutputButtons/CooldownTimer';
import type { SendButtonProps } from '../../components/MessageInput/components/OutputButtons/SendButton';
import { useCooldown } from '../../components/MessageInput/hooks/useCooldown';
import type { MessageInputProps } from '../../components/MessageInput/MessageInput';
import { useStableCallback } from '../../hooks/useStableCallback';
import {
  createAttachmentsCompositionMiddleware,
  createDraftAttachmentsCompositionMiddleware,
} from '../../middlewares/attachments';

import { isDocumentPickerAvailable, MediaTypes, NativeHandlers } from '../../native';
import { MessageInputHeightStore } from '../../state-store/message-input-height-store';
import { File } from '../../types/types';
import { compressedImageURI } from '../../utils/compressImage';
import {
  AttachmentPickerIconProps,
  useAttachmentPickerContext,
} from '../attachmentPickerContext/AttachmentPickerContext';
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
  /** The time at which the active cooldown will end */
  cooldownEndsAt: Date;

  inputBoxRef: React.RefObject<TextInput | null>;
  openAttachmentPicker: () => void;
  /**
   * Function for picking a photo from native image picker and uploading it.
   */
  pickAndUploadImageFromNativePicker: () => Promise<void>;
  pickFile: () => Promise<void>;
  selectedPicker?: 'images';
  sendMessage: () => Promise<void>;
  /**
   * Ref callback to set reference on input box
   */
  setInputBoxRef: Ref<TextInput> | undefined;
  /**
   * Function for taking a photo and uploading it
   */
  takeAndUploadImage: (mediaType?: MediaTypes) => Promise<void>;
  toggleAttachmentPicker: () => void;
  uploadNewFile: (file: File) => Promise<void>;
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
   * When it’s enabled, recorded messages won’t be sent immediately. Instead they will “stack up” in the composer
   * allowing the user to send multiple voice recording as part of the same message.
   */
  asyncMessagesMultiSendEnabled: boolean;
  /**
   * Controls how many pixels to the leading side the user has to scroll in order to cancel the recording of a voice
   * message.
   */
  asyncMessagesSlideToCancelDistance: number;
  /**
   * Custom UI component for attach button.
   *
   * Defaults to and accepts same props as:
   * [AttachButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/attach-button/)
   */
  AttachButton: React.ComponentType<AttachButtonProps>;
  /**
   * Custom UI component for audio recorder UI.
   *
   * Defaults to and accepts same props as:
   * [AudioRecorder](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/AudioRecorder.tsx)
   */
  AudioRecorder: React.ComponentType<AudioRecorderProps>;
  /**
   * Controls whether the async audio feature is enabled.
   */
  audioRecordingEnabled: boolean;
  /**
   * Custom UI component to render audio recording in progress.
   *
   * **Default**
   * [AudioRecordingInProgress](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingInProgress.tsx)
   */
  AudioRecordingInProgress: React.ComponentType<AudioRecordingInProgressProps>;
  /**
   * Custom UI component for audio recording lock indicator.
   *
   * Defaults to and accepts same props as:
   * [AudioRecordingLockIndicator](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingLockIndicator.tsx)
   */
  AudioRecordingLockIndicator: React.ComponentType<AudioRecordingLockIndicatorProps>;
  /**
   * Custom UI component to render audio recording preview.
   *
   * **Default**
   * [AudioRecordingPreview](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingPreview.tsx)
   */
  AudioRecordingPreview: React.ComponentType<AudioRecordingPreviewProps>;
  /**
   * Custom UI component to render audio recording waveform.
   *
   * **Default**
   * [AudioRecordingWaveform](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingWaveform.tsx)
   */
  AudioRecordingWaveform: React.ComponentType<AudioRecordingWaveformProps>;

  AutoCompleteSuggestionHeader: React.ComponentType<AutoCompleteSuggestionHeaderProps>;
  AutoCompleteSuggestionItem: React.ComponentType<AutoCompleteSuggestionItemProps>;
  AutoCompleteSuggestionList: React.ComponentType<AutoCompleteSuggestionListProps>;

  /**
   * Custom UI component to render [draggable handle](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png) of attachmentpicker.
   *
   * **Default**
   * [AttachmentPickerBottomSheetHandle](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/AttachmentPickerBottomSheetHandle.tsx)
   */
  AttachmentPickerBottomSheetHandle: React.FC<BottomSheetHandleProps>;
  /**
   * Height of the image picker bottom sheet handle.
   * @type number
   * @default 20
   */
  attachmentPickerBottomSheetHandleHeight: number;
  /**
   * Height of the image picker bottom sheet when opened.
   * @type number
   * @default 40% of window height
   */
  attachmentPickerBottomSheetHeight: number;
  /**
   * Custom UI component for AttachmentPickerSelectionBar
   *
   * **Default: **
   * [AttachmentPickerSelectionBar](https://github.com/GetStream/stream-chat-react-native/blob/develop/package/src/components/AttachmentPicker/components/AttachmentPickerSelectionBar.tsx)
   */
  AttachmentPickerSelectionBar: React.ComponentType;
  /**
   * Height of the attachment selection bar displayed on the attachment picker.
   * @type number
   * @default 52
   */
  attachmentSelectionBarHeight: number;

  AttachmentUploadPreviewList: React.ComponentType<AttachmentUploadPreviewListProps>;
  /**
   * Custom UI component for [camera selector icon](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png)
   *
   * **Default: **
   * [CameraSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/CameraSelectorIcon.tsx)
   */
  CameraSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Custom UI component for the poll creation icon.
   *
   * **Default: **
   * [CreatePollIcon](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/CreatePollIcon.tsx)
   */
  CreatePollIcon: React.ComponentType;
  /**
   * Custom UI component for [file selector icon](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png)
   *
   * **Default: **
   * [FileSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/FileSelectorIcon.tsx)
   */
  FileSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Custom UI component for [image selector icon](https://github.com/GetStream/stream-chat-react-native/blob/main/screenshots/docs/1.png)
   *
   * **Default: **
   * [ImageSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/ImageSelectorIcon.tsx)
   */
  ImageSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  /**
   * Custom UI component for Android's video recorder selector icon.
   *
   * **Default: **
   * [VideoRecorderSelectorIcon](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/AttachmentPicker/components/VideoRecorderSelectorIcon.tsx)
   */
  VideoRecorderSelectorIcon: React.ComponentType<AttachmentPickerIconProps>;
  AudioAttachmentUploadPreview: React.ComponentType<AudioAttachmentUploadPreviewProps>;
  ImageAttachmentUploadPreview: React.ComponentType<ImageAttachmentUploadPreviewProps>;
  FileAttachmentUploadPreview: React.ComponentType<FileAttachmentUploadPreviewProps>;
  VideoAttachmentUploadPreview: React.ComponentType<FileAttachmentUploadPreviewProps>;

  /**
   * Custom UI component to display the remaining cooldown a user will have to wait before
   * being allowed to send another message. This component is displayed in place of the
   * send button for the MessageInput component.
   *
   * **default**
   * [CooldownTimer](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/CooldownTimer.tsx)
   */
  CooldownTimer: React.ComponentType<CooldownTimerProps>;
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

  CommandInput: React.ComponentType<CommandInputProps>;
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as:
   * [SendButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/send-button/)
   */
  SendButton: React.ComponentType<SendButtonProps>;
  sendMessage: (params: {
    localMessage: LocalMessage;
    message: StreamMessage;
    options?: SendMessageOptions;
  }) => Promise<void>;
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
   * Defaults to and accepts same props as:
   * [AudioRecordingButton](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/components/AudioRecorder/AudioRecordingButton.tsx)
   */
  StartAudioRecordingButton: React.ComponentType<AudioRecordingButtonProps>;
  StopMessageStreamingButton: React.ComponentType<StopMessageStreamingButtonProps> | null;
  /**
   * Custom UI component to render upload progress indicator on attachment preview.
   */
  AttachmentUploadProgressIndicator: React.ComponentType<AttachmentUploadProgressIndicatorProps>;
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
   * Override the entire content of the CreatePoll component. The component has full access to the useCreatePollContext() hook.
   * */
  CreatePollContent?: React.ComponentType<PollContentProps>;

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
   * Defaults to
   * [InputButtons](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageInput/InputButtons.tsx),
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
  openPollCreationDialog?: ({ sendMessage }: Pick<LocalMessageInputContext, 'sendMessage'>) => void;
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
  const { closePicker, openPicker, selectedPicker, setSelectedPicker } =
    useAttachmentPickerContext();
  const { client } = useChatContext();
  const channelCapabilities = useOwnCapabilitiesContext();

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

  const { endsAt: cooldownEndsAt, start: startCooldown } = useCooldown();

  const messageComposer = useMessageComposer();
  const { attachmentManager, editedMessage } = messageComposer;
  const { availableUploadSlots } = useAttachmentManagerState();

  /**
   * These are the RN SDK specific middlewares that are added to the message composer to provide the default behaviour.
   * TODO: Discuss and decide if we provide them by default in the SDK or leave it to the user to add them if they want
   * the feature.
   */
  useEffect(() => {
    if (value.doFileUploadRequest) {
      attachmentManager.setCustomUploadFn(value.doFileUploadRequest);
    }

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
    if (!availableUploadSlots) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

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

    if (file.cancelled) {
      return;
    }

    await uploadNewFile(file);
  });

  /**
   * Function for picking a photo from native image picker and uploading it
   */
  const pickAndUploadImageFromNativePicker = useStableCallback(async () => {
    if (!availableUploadSlots) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    const result = await NativeHandlers.pickImage({ maxNumberOfFiles: availableUploadSlots });
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

    if (!availableUploadSlots) {
      Alert.alert(t('Maximum number of files reached'));
      return;
    }

    const result = await NativeHandlers.pickDocument({
      maxNumberOfFiles: availableUploadSlots,
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

  const sendMessage = useStableCallback(async () => {
    startCooldown();

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
      uploadAbortControllerRef.current.set(file.name, client.createAbortControllerForNextRequest());
      const fileURI = file.type.includes('image')
        ? await compressedImageURI(file, value.compressImageQuality)
        : file.uri;
      const updatedFile = { ...file, uri: fileURI };
      await attachmentManager.uploadFiles([updatedFile]);
      uploadAbortControllerRef.current.delete(file.name);
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

  const messageInputContext = useCreateMessageInputContext({
    closeAttachmentPicker,
    cooldownEndsAt,
    inputBoxRef,
    openAttachmentPicker,
    pickAndUploadImageFromNativePicker,
    pickFile,
    setInputBoxRef,
    takeAndUploadImage,
    thread,
    toggleAttachmentPicker,
    uploadNewFile,
    ...value,
    closePollCreationDialog,
    openPollCreationDialog,
    selectedPicker,
    sendMessage, // overriding the originally passed in sendMessage
    showPollCreationDialog,
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
