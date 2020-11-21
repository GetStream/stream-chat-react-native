import React, { useEffect, useRef, useState } from 'react';
import {
  ImageRequireSource,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
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

import {
  ActionSheetAttachment as ActionSheetAttachmentDefault,
  ActionSheetProps,
  ActionSheetStyles,
} from './ActionSheetAttachment';
import {
  AttachButton as AttachButtonDefault,
  AttachButtonProps,
} from './AttachButton';
import {
  FileUploadPreview as FileUploadPreviewDefault,
  FileUploadPreviewProps,
} from './FileUploadPreview';
import {
  ImageUploadPreview as ImageUploadPreviewDefault,
  ImageUploadPreviewProps,
} from './ImageUploadPreview';
import { SendButton as SendButtonDefault, SendButtonProps } from './SendButton';

import {
  FileUpload,
  ImageUpload,
  useMessageDetailsForState,
} from './hooks/useMessageDetailsForState';
import { generateRandomId } from './utils/generateRandomId';

import {
  AutoCompleteInput,
  AutoCompleteInputProps,
} from '../AutoCompleteInput/AutoCompleteInput';
import { IconSquare } from '../IconSquare';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  isEditingBoolean,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useSuggestionsContext } from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import {
  ACITriggerSettings,
  FileState,
  TriggerSettings,
} from '../../utils/utils';

import { pickDocument, pickImage as pickImageNative } from '../../native';

import type { ActionSheetCustom } from 'react-native-actionsheet';

import type { FileIconProps } from '../Attachment/FileIcon';
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
import {
  CommandsButton as CommandsButtonDefault,
  CommandsButtonProps,
} from './CommandsButton';

const iconClose: ImageRequireSource = require('../../../images/icons/icon_close.png');

const styles = StyleSheet.create({
  composerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 10,
    minHeight: 46,
    paddingHorizontal: 10,
  },
  container: {
    borderColor: '#00000014',
    borderTopWidth: 1,
  },
  editingBoxContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#808080',
    shadowOpacity: 0.5,
    zIndex: 100,
  },
  editingBoxHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  editingBoxHeaderTitle: {
    fontWeight: 'bold',
  },
});

export type MessageInputProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Custom UI component for ActionSheetAttachment.
   *
   * Defaults to and accepts same props as: [ActionSheetAttachment](https://getstream.github.io/stream-chat-react-native/#actionsheetattachment)
   */
  ActionSheetAttachment?: React.ComponentType<ActionSheetProps>;
  /**
   * Style object for actionsheet (used for option to choose file attachment or photo attachment).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles?: ActionSheetStyles;
  /**
   * Additional props for underlying TextInput component. These props will be forwarded as it is to TextInput component.
   *
   * @see See https://reactnative.dev/docs/textinput#reference
   */
  additionalTextInputProps?: TextInputProps;
  /**
   * Custom UI component for attach button.
   *
   * Defaults to and accepts same props as: [AttachButton](https://getstream.github.io/stream-chat-react-native/#attachbutton)
   */
  AttachButton?: React.ComponentType<AttachButtonProps>;
  /**
   * Custom UI component for attachment icon for type 'file' attachment in preview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Attachment/FileIcon.tsx
   */
  AttachmentFileIcon?: React.ComponentType<FileIconProps>;
  /**
   * Custom UI component for commands button.
   *
   * Defaults to and accepts same props as: [CommandsButton](https://getstream.github.io/stream-chat-react-native/#commandsbutton)
   */
  CommandsButton?: React.ComponentType<CommandsButtonProps>;
  /**
   * Compress image with quality (from 0 to 1, where 1 is best quality).
   * On iOS, values larger than 0.8 don't produce a noticeable quality increase in most images,
   * while a value of 0.8 will reduce the file size by about half or less compared to a value of 1.
   * Image picker defaults to 0.8 for iOS and 1 for Android
   */
  compressImageQuality?: number;
  /**
   * Override of context disabled for disabling input only
   */
  disabled?: boolean;
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
  /**
   * Custom UI component for FileUploadPreview.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/MessageInput/FileUploadPreview.tsx
   */
  FileUploadPreview?: React.ComponentType<FileUploadPreviewProps>;
  /** If component should have file picker functionality */
  hasFilePicker?: boolean;
  /** If component should have image picker functionality */
  hasImagePicker?: boolean;
  ImageUploadPreview?: React.ComponentType<ImageUploadPreviewProps>;
  /** Initial value to set on input */
  initialValue?: string;
  /**
   * Custom UI component for AutoCompleteInput.
   * Defaults to and accepts same props as: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AutoCompleteInput/AutoCompleteInput.tsx
   */
  Input?: React.ComponentType<
    AutoCompleteInputProps<Co, Us> & {
      _pickFile: () => Promise<void>;
      _pickImage: () => Promise<void>;
      _removeFile: FileUploadPreviewProps['removeFile'];
      _removeImage: ImageUploadPreviewProps['removeImage'];
      _uploadFile: FileUploadPreviewProps['retryUpload'];
      _uploadImage: ImageUploadPreviewProps['retryUpload'];
      appendText: (newText: string) => void;
      closeAttachActionSheet: () => void;
      disabled: boolean;
      getUsers: () => UserResponse<Us>[];
      handleOnPress: () => Promise<void>;
      isValidMessage: () => boolean;
      onSelectItem: (item: UserResponse<Us>) => void;
      sendMessage: () => Promise<void>;
      setInputBoxContainerRef: (ref: View | null) => void;
      updateMessage: () => Promise<void>;
      uploadNewFile: (file: {
        name: string;
        size?: number | string;
        type?: string;
        uri?: string;
      }) => Promise<void>;
      uploadNewImage: (image: { uri?: string }) => Promise<void>;
    }
  >;
  /** Limit on allowed number of files to attach at a time. */
  maxNumberOfFiles?: number;
  /**
   * Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler.
   *
   * @param newText
   */
  onChangeText?: (newText: string) => void;
  /** Parent message id - in case of thread */
  parent_id?: StreamMessage<At, Me, Us>['parent_id'];
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react-native/#sendbutton)
   */
  SendButton?: React.ComponentType<SendButtonProps>;
  /**
   * For images still in uploading state when user hits send, send text immediately and send image as follow-up message once uploaded
   */
  sendImageAsync?: boolean;
  /**
   * ref for input setter function
   */
  setInputRef?: (ref: TextInput | null) => void;
};

/**
 * UI Component for message input
 * It's a consumer of
 * [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext),
 * [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext),
 * [Messages Context](https://getstream.github.io/stream-chat-react-native/#messagescontext),
 * [Suggestions Context](https://getstream.github.io/stream-chat-react-native/#suggestionscontext), and
 * [Translation Context](https://getstream.github.io/stream-chat-react-native/#translationcontext)
 *
 * @example ./MessageInput.md
 */
export const MessageInput = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    ActionSheetAttachment = ActionSheetAttachmentDefault,
    actionSheetStyles,
    additionalTextInputProps,
    AttachButton = AttachButtonDefault,
    CommandsButton = CommandsButtonDefault,
    AttachmentFileIcon,
    compressImageQuality,
    disabled: disabledProp,
    doDocUploadRequest,
    doImageUploadRequest,
    FileUploadPreview = FileUploadPreviewDefault,
    hasFilePicker = true,
    hasImagePicker = true,
    ImageUploadPreview = ImageUploadPreviewDefault,
    initialValue,
    Input,
    maxNumberOfFiles,
    onChangeText: onChangeTextProp,
    parent_id,
    SendButton = SendButtonDefault,
    sendImageAsync = false,
    setInputRef,
  } = props;

  const {
    channel,
    disabled: disabledContext = false,
    members,
    watchers,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const disabled = disabledProp || disabledContext;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    clearEditingState,
    editing,
    editMessage,
    sendMessage: sendMessageContext,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { setInputBoxContainerRef } = useSuggestionsContext<Co, Us>();

  const {
    theme: {
      messageInput: {
        composerContainer,
        container: { conditionalPadding, ...container },
        editingBoxContainer,
        editingBoxHeader,
        editingBoxHeaderTitle,
      },
    },
  } = useTheme();

  const { t } = useTranslationContext();

  const attachActionSheet = useRef<ActionSheetCustom | null>(null);
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
    imageUploads,
    mentionedUsers,
    numberOfUploads,
    setFileUploads,
    setImageUploads,
    setMentionedUsers,
    setNumberOfUploads,
    setText,
    text,
  } = useMessageDetailsForState<At, Ch, Co, Ev, Me, Re, Us>(
    editing,
    initialValue,
  );

  useEffect(() => {
    if (editing && inputBoxRef.current) {
      inputBoxRef.current.focus();
    }

    if (!editing) {
      resetInput();
    }
  }, [editing]);

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
        sendMessageContext(({
          attachments,
          mentioned_users: [],
          parent_id,
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

  const resetInput = (pendingAttachments: Attachment[] = []) => {
    setFileUploads([]);
    setImageUploads([]);
    setMentionedUsers([]);
    setNumberOfUploads(
      (prevNumberOfUploads) =>
        prevNumberOfUploads - (pendingAttachments?.length || 0),
    );
    setText('');
  };

  useEffect(() => {
    if (Object.keys(asyncUploads).length) {
      /**
       * When successful image upload response occurs after hitting send,
       * send a follow up message with the image
       */
      sending.current = true;
      asyncIds.forEach((id) => sendMessageAsync(id));
      sending.current = false;
    }
  }, [asyncIds, asyncUploads, sending, sendMessageAsync]);

  const appendText = (newText: string) => {
    setText((prevText) => `${prevText}${newText}`);
  };

  const closeAttachActionSheet = () => {
    if (attachActionSheet.current) {
      attachActionSheet.current.hide();
    }
  };

  const getMembers = () => {
    const result: UserResponse<Us>[] = [];
    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) =>
        result.push(member.user as UserResponse<Us>),
      );
    }

    return result;
  };

  const getUsers = () => {
    const users = [...getMembers(), ...getWatchers()];

    // make sure we don't list users twice
    const uniqueUsers: { [key: string]: UserResponse<Us> } = {};
    for (const user of users) {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user as UserResponse<Us>;
      }
    }
    const usersArray = Object.values(uniqueUsers);

    return usersArray;
  };

  const getWatchers = () => {
    const result: UserResponse<Us>[] = [];
    if (watchers && Object.values(watchers).length) {
      result.push(...(Object.values(watchers) as UserResponse<Us>[]));
    }

    return result;
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

  const onChangeText = (newText: string) => {
    if (sending.current) {
      return;
    }
    setText(newText);

    if (newText && channel) {
      logChatPromiseExecution(channel.keystroke(), 'start typing event');
    }

    if (onChangeTextProp) {
      onChangeTextProp(newText);
    }
  };

  const onSelectItem = (item: UserResponse<Us>) => {
    setMentionedUsers((prevMentionedUsers) => [...prevMentionedUsers, item.id]);
  };

  const pickFile = async () => {
    if (
      (maxNumberOfFiles && numberOfUploads >= maxNumberOfFiles) ||
      numberOfUploads > 10
    ) {
      return;
    }

    const result = await pickDocument({ maxNumberOfFiles });
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
    if (
      (maxNumberOfFiles && numberOfUploads >= maxNumberOfFiles) ||
      numberOfUploads > 10
    ) {
      return;
    }

    const result = await pickImageNative({
      compressImageQuality,
      maxNumberOfFiles,
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

  const handleOnPress = async () => {
    if (
      (maxNumberOfFiles && numberOfUploads >= maxNumberOfFiles) ||
      numberOfUploads >= 10
    ) {
      return;
    }

    if (hasImagePicker) {
      if (hasFilePicker) {
        await Keyboard.dismiss();
        if (attachActionSheet?.current) {
          attachActionSheet.current.show();
        }
      } else {
        pickImage();
      }
    } else if (hasFilePicker) {
      pickFile();
    }
  };

  const renderInputContainer = () => {
    const additionalTextInputContainerProps = {
      editable: disabled ? false : undefined,
      ...additionalTextInputProps,
    };

    const triggerSettings = channel
      ? ACITriggerSettings<At, Ch, Co, Ev, Me, Re, Us>({
          channel,
          onMentionSelectItem: onSelectItem,
          t,
        })
      : ({} as TriggerSettings<Co, Us>);

    return (
      <View
        style={[
          styles.container,
          { paddingTop: imageUploads.length ? conditionalPadding : 0 },
          container,
        ]}
      >
        {fileUploads && (
          <FileUploadPreview
            AttachmentFileIcon={AttachmentFileIcon}
            fileUploads={fileUploads}
            removeFile={removeFile}
            retryUpload={uploadFile}
          />
        )}
        {imageUploads && (
          <ImageUploadPreview
            imageUploads={imageUploads}
            removeImage={removeImage}
            retryUpload={uploadImage}
          />
        )}

        {/**
         * TODO: Use custom action sheet to show icon with titles of button. But it doesn't
         * work well with async onPress operations. So find a solution.
         */}
        <ActionSheetAttachment
          closeAttachActionSheet={closeAttachActionSheet}
          pickFile={pickFile}
          pickImage={pickImage}
          setAttachActionSheetRef={setAttachActionSheetRef}
          styles={actionSheetStyles}
        />
        <View
          ref={setInputBoxContainerRef}
          style={[styles.composerContainer, composerContainer]}
        >
          {Input ? (
            <Input
              _pickFile={pickFile}
              _pickImage={pickImage}
              _removeFile={removeFile}
              _removeImage={removeImage}
              _uploadFile={uploadFile}
              _uploadImage={uploadImage}
              additionalTextInputProps={additionalTextInputContainerProps}
              appendText={appendText}
              closeAttachActionSheet={closeAttachActionSheet}
              disabled={disabled}
              getUsers={getUsers}
              handleOnPress={handleOnPress}
              isValidMessage={isValidMessage}
              onChange={onChangeText}
              onSelectItem={onSelectItem}
              sendMessage={sendMessage}
              setInputBoxContainerRef={setInputBoxContainerRef}
              setInputBoxRef={setInputBoxRef}
              triggerSettings={triggerSettings}
              updateMessage={updateMessage}
              uploadNewFile={uploadNewFile}
              uploadNewImage={uploadNewImage}
              value={text}
            />
          ) : (
            <>
              {(hasImagePicker || hasFilePicker) && (
                <AttachButton
                  disabled={disabled}
                  handleOnPress={handleOnPress}
                />
              )}
              <CommandsButton />
              <AutoCompleteInput<Co, Us>
                additionalTextInputProps={additionalTextInputProps || {}}
                onChange={onChangeText}
                setInputBoxRef={setInputBoxRef}
                triggerSettings={triggerSettings}
                value={text}
              />
              <SendButton
                disabled={disabled || sending.current || !isValidMessage()}
                sendMessage={sendMessage}
              />
            </>
          )}
        </View>
      </View>
    );
  };

  const sendMessage = async () => {
    if (sending.current) {
      return;
    }
    sending.current = true;

    const prevText = text;
    await setText('');
    if (inputBoxRef.current) {
      inputBoxRef.current.clear();
    }

    const attachments = [] as Array<Attachment<At>>;
    for (const image of imageUploads) {
      if (!image || image.state === FileState.UPLOAD_FAILED) {
        continue;
      }

      if (image.state === FileState.UPLOADING) {
        // TODO: show error to user that they should wait until image is uploaded
        if (sendImageAsync) {
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

    if (editing && !isEditingBoolean(editing)) {
      const updatedMessage = {
        ...editing,
        attachments,
        mentioned_users: mentionedUsers,
        text: prevText,
      } as Parameters<
        StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']
      >[0];

      // TODO: Remove this line and show an error when submit fails
      clearEditingState();

      const updateMessagePromise = editMessage(updatedMessage).then(
        clearEditingState,
      );
      resetInput(attachments);
      logChatPromiseExecution(updateMessagePromise, 'update message');

      sending.current = false;
    } else {
      try {
        sendMessageContext(({
          attachments,
          mentioned_users: uniq(mentionedUsers),
          parent_id,
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
  };

  const setAttachActionSheetRef = (ref: ActionSheetCustom | null) => {
    attachActionSheet.current = ref;
  };

  const setInputBoxRef = (ref: TextInput | null) => {
    inputBoxRef.current = ref;
    if (setInputRef) {
      setInputRef(ref);
    }
  };

  const updateMessage = async () => {
    try {
      if (!isEditingBoolean(editing)) {
        await client.updateMessage({
          ...editing,
          text,
        } as Parameters<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>[0]);
      }

      resetInput();
      clearEditingState();
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
      if (doDocUploadRequest) {
        response = await doDocUploadRequest(file, channel);
      } else if (channel && file.uri) {
        response = await channel.sendFile(file.uri, file.name, file.type);
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
      if (doImageUploadRequest) {
        response = await doImageUploadRequest(file, channel);
      } else if (file.uri && channel) {
        if (sendImageAsync) {
          channel.sendImage(file.uri, undefined, contentType).then((res) => {
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
          response = await channel.sendImage(file.uri, undefined, contentType);
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

  return editing ? (
    <View
      style={[styles.editingBoxContainer, editingBoxContainer]}
      testID='editing'
    >
      <View style={[styles.editingBoxHeader, editingBoxHeader]}>
        <Text style={[styles.editingBoxHeaderTitle, editingBoxHeaderTitle]}>
          {t('Editing Message')}
        </Text>
        <IconSquare
          icon={iconClose}
          onPress={() => {
            resetInput();
            clearEditingState();
          }}
        />
      </View>
      {renderInputContainer()}
    </View>
  ) : (
    renderInputContainer()
  );
};

MessageInput.displayName = 'MessageInput{messageInput}';
