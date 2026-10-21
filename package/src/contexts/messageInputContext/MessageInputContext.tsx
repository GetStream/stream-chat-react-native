import React, {
  PropsWithChildren,
  Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert, Linking, TextInputProps } from 'react-native';

import { lookup as lookupMimeType } from 'mime-types';

import { useCreateMessageInputContext } from './hooks/useCreateMessageInputContext';
import { useMessageComposer } from './hooks/useMessageComposer';

import { dismissKeyboard } from '../../components/KeyboardCompatibleView/KeyboardCompatibleView';
import { parseLinksFromText } from '../../components/Message/MessageItemView/utils/parseLinks';
import { useAudioRecorder } from '../../components/MessageInput/hooks/useAudioRecorder';
import { useStableCallback } from '../../hooks/useStableCallback';
import { setupVideoAttachmentPreviewMiddleware } from '../../middlewares/attachments';

import { isDocumentPickerAvailable, MediaTypes, NativeHandlers } from '../../native';
import { AudioRecorderManager } from '../../state-store/audio-recorder-manager';
import { MessageInputHeightStore } from '../../state-store/message-input-height-store';
import { TextInputRef } from '../../types/react-native-compat';
import { File } from '../../types/types';
import { compressedImageURI } from '../../utils/compressImage';
import { useAttachmentPickerContext } from '../attachmentPickerContext/AttachmentPickerContext';
import { useOwnCapabilitiesContext } from '../ownCapabilitiesContext/OwnCapabilitiesContext';
import { useTranslationContext } from '../translationContext/TranslationContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type LocalMessageInputContext = {
  closeAttachmentPicker: () => void;
  inputBoxRef: React.RefObject<InputBoxRef | null>;
  openAttachmentPicker: () => void;
  /** Picks images with the native image picker and uploads them. */
  pickAndUploadImageFromNativePicker: () => Promise<void>;
  pickFile: () => Promise<void>;
  sendMessage: () => Promise<void>;
  /** Ref callback for the input box. Also forwards the ref to `setInputRef`. */
  setInputBoxRef: Ref<InputBoxRef> | undefined;
  /** Takes a photo or video with the camera and uploads it. */
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

export type InputBoxRef = TextInputRef & {
  clearState: () => void;
  restoreState: (text: string) => void;
};

export type InputMessageInputContextValue = {
  /**
   * Distance in pixels the user slides up to lock the recording, so that lifting the finger does
   * not stop it. Defaults to 50.
   */
  asyncMessagesLockDistance: number;
  /** Minimum press duration on the record button to start a voice recording. Defaults to 500. */
  asyncMessagesMinimumPressDuration: number;
  /**
   * Whether a completed voice recording is sent immediately (true) or added to the composer for the
   * user to send (false). Defaults to false.
   */
  audioRecordingSendOnComplete: boolean;
  /** Distance in pixels the user slides to the leading side to cancel recording. Defaults to 75. */
  asyncMessagesSlideToCancelDistance: number;
  /** Whether voice message recording is enabled. Defaults to false. */
  audioRecordingEnabled: boolean;
  /**
   * Height of the attachment picker bottom sheet when open.
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

  /**
   * Whether pressing the attach button while the attachment picker is open focuses the input,
   * switching from the picker to the keyboard. When false, the picker closes without focusing it.
   * @type boolean
   * @default true
   */
  focusInputOnPickerClose: boolean;

  /** Whether the camera picker button shows. */
  hasCameraPicker: boolean;

  /** Whether the commands button shows. */
  hasCommands: boolean;
  /** Whether the file picker button shows. */
  hasFilePicker: boolean;
  /** Whether the image picker button shows. */
  hasImagePicker: boolean;

  /** Props forwarded as is to the underlying `TextInput`. */
  additionalTextInputProps?: TextInputProps;
  closePollCreationDialog?: () => void;
  /**
   * Image compression quality from 0 to 1, where 1 is best. On iOS, values above 0.8 rarely improve
   * quality, while 0.8 roughly halves the file size. The image picker defaults to 0.8 on iOS and 1
   * on Android.
   */
  compressImageQuality?: number;

  /** Vertical gap between poll options in the poll creation dialog. */
  createPollOptionGap?: number;

  /** Called when the attach button is pressed. */
  handleAttachButtonPress?: () => void;

  /**
   * Whether the message input floats over the content.
   * @type boolean
   * @default false
   */
  messageInputFloating: boolean;

  openPollCreationDialog?: ({ sendMessage }: Pick<LocalMessageInputContext, 'sendMessage'>) => void;
  /**
   * Receives the ref of the underlying `TextInput`, and `null` on unmount.
   *
   * @param ref The `TextInput` ref.
   *
   * @overrideType Function
   */
  setInputRef?: (ref: TextInputRef | null) => void;
  showPollCreationDialog?: boolean;
  messageInputHeightStore: MessageInputHeightStore;
};

export type MessageInputContextValue = LocalMessageInputContext & InputMessageInputContextValue;

export const MessageInputContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageInputContextValue,
);

export const MessageInputProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: InputMessageInputContextValue;
}>) => {
  const {
    closePicker,
    openPicker,
    attachmentPickerStore,
    disableAttachmentPicker,
    shouldRenderAttachmentPicker = true,
  } = useAttachmentPickerContext();
  const channelCapabilities = useOwnCapabilitiesContext();
  const [audioRecorderManager] = useState(new AudioRecorderManager());

  const { t } = useTranslationContext();
  const inputBoxRef = useRef<InputBoxRef | null>(null);

  const [showPollCreationDialog, setShowPollCreationDialog] = useState(false);

  const defaultOpenPollCreationDialog = useCallback(() => setShowPollCreationDialog(true), []);
  const closePollCreationDialog = useCallback(() => setShowPollCreationDialog(false), []);

  const { openPollCreationDialog: openPollCreationDialogFromContext } = value;

  const messageComposer = useMessageComposer();
  const { attachmentManager } = messageComposer;

  // Composer middleware this SDK owns. Sending before uploads finish is not configured here:
  // `attachments.pendingUploadsEnabled` is composer config that `<Chat>` defaults through
  // `client.config`, and an imperative update here would outrank the integrator's own config.
  useEffect(() => {
    setupVideoAttachmentPreviewMiddleware(messageComposer);
  }, [messageComposer]);

  const takeAndUploadImage = useStableCallback(async (mediaType?: MediaTypes) => {
    if (!attachmentManager.availableUploadSlots) {
      Alert.alert(t('attachmentPicker.maxFiles.error', 'Maximum number of files reached'));
      return;
    }

    const file = await NativeHandlers.takePhoto({
      compressImageQuality: value.compressImageQuality,
      mediaType,
    });

    if (file.askToOpenSettings && disableAttachmentPicker) {
      Alert.alert(
        t('common.cameraPermission.title', 'Allow camera access in device settings'),
        t('common.cameraPermission.text', 'The camera is used to take photos and videos.'),
        [
          { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
          {
            onPress: () => Linking.openSettings(),
            style: 'default',
            text: t('common.openSettings.label', 'Open Settings'),
          },
        ],
      );
    }

    if (file.askToOpenSettings || file.cancelled) {
      return file;
    }

    await uploadNewFile(file);

    return file;
  });

  const pickAndUploadImageFromNativePicker = useStableCallback(async () => {
    if (!attachmentManager.availableUploadSlots) {
      Alert.alert(t('attachmentPicker.maxFiles.error', 'Maximum number of files reached'));
      return;
    }

    const result = await NativeHandlers.pickImage({
      maxNumberOfFiles: attachmentManager.availableUploadSlots,
    });
    if (result.askToOpenSettings) {
      Alert.alert(
        t('common.galleryPermission.title', 'Allow access to your Gallery'),
        t('common.galleryPermission.text', 'Gallery access is used to share photos and videos.'),
        [
          { style: 'cancel', text: t('common.cancel.label', 'Cancel') },
          {
            onPress: () => Linking.openSettings(),
            style: 'default',
            text: t('common.openSettings.label', 'Open Settings'),
          },
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
      Alert.alert(t('attachmentPicker.maxFiles.error', 'Maximum number of files reached'));
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

  const openAttachmentPicker = useCallback(() => {
    if (!shouldRenderAttachmentPicker) {
      // No picker to open, and selecting one would reserve space for it.
      return;
    }
    dismissKeyboard();
    attachmentPickerStore.setSelectedPicker('images');
    openPicker();
  }, [attachmentPickerStore, openPicker, shouldRenderAttachmentPicker]);

  const closeAttachmentPicker = useCallback(() => {
    attachmentPickerStore.setSelectedPicker(undefined);
    closePicker();
  }, [closePicker, attachmentPickerStore]);

  const sendMessage = useStableCallback(async () => {
    const text = messageComposer.textComposer.text;

    if (!channelCapabilities.sendLinks && parseLinksFromText(text).length > 0) {
      Alert.alert(
        t('common.linksDisabled.title', 'Links are disabled'),
        t('common.linksDisabled.text', 'Sending links is not allowed in this conversation'),
      );
      return;
    }

    inputBoxRef.current?.clearState();

    try {
      // Editing a bounced message (type 'error') sends it again as a new message.
      const { editedMessage } = messageComposer;
      const result =
        editedMessage && editedMessage.type !== 'error'
          ? await messageComposer.update()
          : await messageComposer.send();

      if (result === 'nothing-to-send') {
        inputBoxRef.current?.restoreState(text);
      }
    } catch (error) {
      // Only composing can throw; a failed request is reported by the composer itself.
      inputBoxRef.current?.restoreState(text);
      console.error('Error while sending message:', error);
    }
  });

  const setInputBoxRef = useStableCallback((ref: InputBoxRef | null) => {
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
      const fileURI = normalizedFile.type.includes('image')
        ? await compressedImageURI(normalizedFile, value.compressImageQuality)
        : normalizedFile.uri;
      const updatedFile = { ...normalizedFile, uri: fileURI };
      const uploadedFiles = await attachmentManager.uploadFiles([updatedFile]);
      // A blocked upload (over the size limit or of a disallowed type) is rejected for good, so it
      // is removed from the composer. The attachment manager has already notified the user.
      const blockedAttachmentIds = (uploadedFiles ?? [])
        .filter((attachment) => attachment?.localMetadata?.uploadState === 'blocked')
        .map((attachment) => attachment?.localMetadata.id)
        .filter((id): id is string => typeof id === 'string');
      if (blockedAttachmentIds.length) {
        attachmentManager.removeAttachments(blockedAttachmentIds);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'CanceledError')
      ) {
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
    uploadNewFile,
    ...value,
    closePollCreationDialog,
    openPollCreationDialog,
    sendMessage,
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
      'The useMessageInputContext hook was called outside of the MessageInputContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel/',
    );
  }

  return contextValue;
};
