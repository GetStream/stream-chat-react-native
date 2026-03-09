import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native';

import type { Attachment } from 'stream-chat';

import { FilePreview } from './FilePreview';
import { openUrlSafely } from './utils/openUrlSafely';

import { FileIcon as FileIconDefault, FileIconProps } from '../../components/Attachment/FileIcon';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks/useStateStore';
import type { PendingAttachmentsLoadingState } from '../../state-store/pending-attachments-loading-state';

export type FileAttachmentPropsWithContext = Pick<
  MessageContextValue,
  'onLongPress' | 'onPress' | 'onPressIn' | 'preventPress'
> &
  Pick<MessagesContextValue, 'additionalPressableProps'> & {
    /** The attachment to render */
    attachment: Attachment;
    attachmentIconSize?: FileIconProps['size'];
    // TODO: Think we really need a way to style the file preview using props if we have theme.
    styles?: Partial<{
      container: StyleProp<ViewStyle>;
      details: StyleProp<ViewStyle>;
      size: StyleProp<TextStyle>;
      title: StyleProp<TextStyle>;
    }>;
    /**
     * Whether the attachment is currently being uploaded.
     * This is used to show a loading indicator in the file attachment.
     */
    isPendingAttachmentLoading: boolean;
  };

const FileAttachmentWithContext = (props: FileAttachmentPropsWithContext) => {
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();

  const {
    additionalPressableProps,
    attachment,
    attachmentIconSize,
    onLongPress,
    onPress,
    onPressIn,
    preventPress,
    styles: stylesProp = styles,
    isPendingAttachmentLoading,
  } = props;

  const defaultOnPress = () => openUrlSafely(attachment.asset_url);

  const renderIndicator = useMemo(() => {
    if (isPendingAttachmentLoading) {
      return <ActivityIndicator color={semantics.accentPrimary} style={styles.activityIndicator} />;
    }
    return null;
  }, [isPendingAttachmentLoading, semantics.accentPrimary, styles.activityIndicator]);

  return (
    <Pressable
      disabled={preventPress}
      onLongPress={(event) => {
        if (onLongPress) {
          onLongPress({
            additionalInfo: { attachment },
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      onPress={(event) => {
        if (onPress) {
          onPress({
            additionalInfo: { attachment },
            defaultHandler: defaultOnPress,
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      onPressIn={(event) => {
        if (onPressIn) {
          onPressIn({
            additionalInfo: { attachment },
            defaultHandler: defaultOnPress,
            emitter: 'fileAttachment',
            event,
          });
        }
      }}
      testID='file-attachment'
      {...additionalPressableProps}
    >
      <FilePreview
        attachment={attachment}
        attachmentIconSize={attachmentIconSize}
        indicator={renderIndicator}
        styles={stylesProp}
      />
    </Pressable>
  );
};

export type FileAttachmentProps = Partial<Omit<FileAttachmentPropsWithContext, 'attachment'>> &
  Pick<FileAttachmentPropsWithContext, 'attachment'>;

export const FileAttachment = (props: FileAttachmentProps) => {
  const { attachment } = props;
  const { onLongPress, onPress, onPressIn, preventPress, message } = useMessageContext();
  const {
    additionalPressableProps,
    FileAttachmentIcon = FileIconDefault,
    pendingAttachmentsLoadingStore,
  } = useMessagesContext();

  const attachmentId = `${message.id}-${attachment.originalFile?.uri}`;
  const selector = useCallback(
    (state: PendingAttachmentsLoadingState) => ({
      isPendingAttachmentLoading: state.pendingAttachmentsLoading[attachmentId] ?? false,
    }),
    [attachmentId],
  );
  const { isPendingAttachmentLoading } = useStateStore(
    pendingAttachmentsLoadingStore.store,
    selector,
  ) ?? { isPendingAttachmentLoading: false };

  return (
    <FileAttachmentWithContext
      {...{
        additionalPressableProps,
        FileAttachmentIcon,
        onLongPress,
        onPress,
        onPressIn,
        preventPress,
        isPendingAttachmentLoading,
      }}
      {...props}
    />
  );
};

FileAttachment.displayName = 'FileAttachment{messageSimple{file}}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const { isMyMessage, messageHasOnlySingleAttachment } = useMessageContext();
  const showBackgroundTransparent = messageHasOnlySingleAttachment;

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        backgroundColor: showBackgroundTransparent
          ? 'transparent'
          : isMyMessage
            ? semantics.chatBgAttachmentOutgoing
            : semantics.chatBgAttachmentIncoming,
      },
      activityIndicator: {
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      },
    });
  }, [showBackgroundTransparent, isMyMessage, semantics]);
};
