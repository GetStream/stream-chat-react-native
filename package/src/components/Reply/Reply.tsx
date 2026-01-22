import React, { useCallback, useMemo } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';

import dayjs from 'dayjs';
import { LocalMessage, MessageComposerState, PollState } from 'stream-chat';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { MessagesContextValue } from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStateStore } from '../../hooks';
import { NewFile } from '../../icons/NewFile';
import { NewLink } from '../../icons/NewLink';
import { NewMapPin } from '../../icons/NewMapPin';
import { NewMic } from '../../icons/NewMic';
import { NewPhoto } from '../../icons/NewPhoto';
import { NewPoll } from '../../icons/NewPoll';
import { NewVideo } from '../../icons/NewVideo';
import { FileTypes } from '../../types/types';
import { checkQuotedMessageEquality } from '../../utils/utils';
import { FileIcon } from '../Attachment/FileIcon';
import { AttachmentRemoveControl } from '../MessageInput/components/AttachmentPreview/AttachmentRemoveControl';
import { VideoPlayIndicator } from '../ui/VideoPlayIndicator';

const messageComposerStateStoreSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const selector = (nextValue: PollState) => ({
  name: nextValue.name,
});

const RightContent = React.memo((props: { message: LocalMessage }) => {
  const { message } = props;
  const attachments = message?.attachments;

  if (!attachments || attachments.length > 1) {
    return null;
  }

  const attachment = attachments?.[0];

  if (attachment?.type === FileTypes.Image) {
    return (
      <View style={styles.contentWrapper}>
        <Image source={{ uri: attachment.image_url }} style={StyleSheet.absoluteFillObject} />
      </View>
    );
  }
  if (attachment?.type === FileTypes.Video) {
    return (
      <View style={styles.contentWrapper}>
        <View style={styles.attachmentContainer}>
          <Image source={{ uri: attachment.thumb_url }} style={StyleSheet.absoluteFillObject} />
          <VideoPlayIndicator size='sm' />
        </View>
      </View>
    );
  }

  if (attachment?.type === FileTypes.File) {
    return <FileIcon mimeType={attachment.mime_type} size={40} />;
  }

  return null;
});

const SubtitleText = React.memo(({ message }: { message?: LocalMessage | null }) => {
  const { client } = useChatContext();
  const poll = client.polls.fromState(message?.poll_id ?? '');
  const { name: pollName } = useStateStore(poll?.state, selector) ?? {};
  const {
    theme: {
      reply: { subtitle: subtitleStyle },
    },
  } = useTheme();

  const subtitle = useMemo(() => {
    const attachments = message?.attachments;
    const audioAttachments = attachments?.filter(
      (attachment) => attachment.type === FileTypes.Audio,
    );
    const imageAttachments = attachments?.filter(
      (attachment) => attachment.type === FileTypes.Image,
    );
    const videoAttachments = attachments?.filter(
      (attachment) => attachment.type === FileTypes.Video,
    );
    const fileAttachments = attachments?.filter((attachment) => attachment.type === FileTypes.File);
    const voiceRecordingAttachments = attachments?.filter(
      (attachment) => attachment.type === FileTypes.VoiceRecording,
    );
    const onlyImages = imageAttachments?.length && imageAttachments?.length === attachments?.length;
    const onlyVideos = videoAttachments?.length && videoAttachments?.length === attachments?.length;
    const onlyFiles = fileAttachments?.length && fileAttachments?.length === attachments?.length;
    const onlyAudio = audioAttachments?.length === attachments?.length;
    const onlyVoiceRecordings =
      voiceRecordingAttachments?.length &&
      voiceRecordingAttachments?.length === attachments?.length;

    if (pollName) {
      return pollName;
    }

    if (message?.shared_location) {
      if (
        message?.shared_location?.end_at &&
        new Date(message?.shared_location?.end_at) > new Date()
      ) {
        return 'Live Location';
      }
      return 'Location';
    }

    if (message?.text) {
      return message?.text;
    }

    if (onlyImages) {
      if (imageAttachments?.length === 1) {
        return 'Photo';
      } else {
        return `${imageAttachments?.length} Photos`;
      }
    }

    if (onlyVideos) {
      if (videoAttachments?.length === 1) {
        return 'Video';
      } else {
        return `${videoAttachments?.length} Videos`;
      }
    }

    if (onlyAudio) {
      if (audioAttachments?.length === 1) {
        return 'Audio';
      } else {
        return `${audioAttachments?.length} Audios`;
      }
    }

    if (onlyVoiceRecordings) {
      if (voiceRecordingAttachments?.length === 1) {
        return `Voice message (${dayjs.duration(voiceRecordingAttachments?.[0]?.duration ?? 0, 'seconds').format('m:ss')})`;
      } else {
        return `${voiceRecordingAttachments?.length} Voice messages`;
      }
    }

    if (onlyFiles && fileAttachments?.length === 1) {
      return fileAttachments?.[0]?.title;
    }

    return `${attachments?.length} Files`;
  }, [message?.attachments, message?.shared_location, message?.text, pollName]);

  if (!subtitle) {
    return null;
  }

  return (
    <Text numberOfLines={1} style={[styles.subtitle, subtitleStyle]}>
      {subtitle}
    </Text>
  );
});

const SubtitleIcon = React.memo((props: { message?: LocalMessage | null }) => {
  const { message } = props;
  const {
    theme: {
      reply: { pollIcon, locationIcon, linkIcon, audioIcon, fileIcon, videoIcon, photoIcon },
    },
  } = useTheme();
  if (!message) {
    return null;
  }

  const attachments = message?.attachments;
  const audioAttachments = attachments?.filter((attachment) => attachment.type === FileTypes.Audio);
  const imageAttachments = attachments?.filter((attachment) => attachment.type === FileTypes.Image);
  const videoAttachments = attachments?.filter((attachment) => attachment.type === FileTypes.Video);
  const voiceRecordingAttachments = attachments?.filter(
    (attachment) => attachment.type === FileTypes.VoiceRecording,
  );
  const fileAttachments = attachments?.filter((attachment) => attachment.type === FileTypes.File);
  const onlyImages = imageAttachments?.length && imageAttachments?.length === attachments?.length;
  const onlyAudio = audioAttachments?.length && audioAttachments?.length === attachments?.length;
  const onlyVideos = videoAttachments?.length && videoAttachments?.length === attachments?.length;
  const onlyVoiceRecordings =
    voiceRecordingAttachments?.length && voiceRecordingAttachments?.length === attachments?.length;
  const hasLink = attachments?.some(
    (attachment) => attachment.type === FileTypes.Image && attachment.og_scrape_url,
  );

  if (message.poll_id) {
    return (
      <NewPoll height={12} stroke={'#384047'} style={styles.iconStyle} width={12} {...pollIcon} />
    );
  }

  if (message.shared_location) {
    return (
      <NewMapPin
        height={12}
        stroke={'#384047'}
        style={styles.iconStyle}
        width={12}
        {...locationIcon}
      />
    );
  }

  if (hasLink) {
    return (
      <NewLink height={12} stroke={'#384047'} style={styles.iconStyle} width={12} {...linkIcon} />
    );
  }

  if (onlyAudio || onlyVoiceRecordings) {
    return (
      <NewMic
        height={12}
        stroke={'#384047'}
        strokeWidth={1.2}
        style={styles.iconStyle}
        width={12}
        {...audioIcon}
      />
    );
  }

  if (onlyVideos) {
    return (
      <NewVideo height={12} stroke={'#384047'} style={styles.iconStyle} width={12} {...videoIcon} />
    );
  }

  if (onlyImages) {
    return (
      <NewPhoto height={12} stroke={'#384047'} style={styles.iconStyle} width={12} {...photoIcon} />
    );
  }

  if (
    fileAttachments?.length ||
    imageAttachments?.length ||
    videoAttachments?.length ||
    audioAttachments?.length
  ) {
    return (
      <NewFile height={12} stroke={'#384047'} style={styles.iconStyle} width={12} {...fileIcon} />
    );
  }

  return null;
});

export type ReplyPropsWithContext = Pick<MessageContextValue, 'message'> &
  Pick<MessagesContextValue, 'quotedMessage'> & {
    isMyMessage: boolean;
    onDismiss: () => void;
    mode: 'reply' | 'edit';
    // This is temporary for the MessageContent Component to style the Reply component
    style?: ViewStyle;
  };

export const ReplyWithContext = (props: ReplyPropsWithContext) => {
  const { isMyMessage, message: messageFromContext, mode, onDismiss, quotedMessage, style } = props;
  const {
    theme: {
      colors: { grey_whisper },
      reply: {
        wrapper,
        container,
        leftContainer,
        rightContainer,
        title: titleStyle,
        subtitleContainer,
        dismissWrapper,
      },
    },
  } = useTheme();

  const title = useMemo(
    () =>
      mode === 'edit'
        ? 'Edit Message'
        : isMyMessage
          ? 'You'
          : `Reply to ${quotedMessage?.user?.name}`,
    [mode, isMyMessage, quotedMessage?.user?.name],
  );

  if (!quotedMessage) {
    return null;
  }

  return (
    <View style={[styles.wrapper, wrapper]}>
      <View
        style={[
          styles.container,
          { backgroundColor: isMyMessage ? '#F2F4F6' : '#D2E3FF', borderColor: grey_whisper },
          container,
          style,
        ]}
      >
        <View
          style={[
            styles.leftContainer,
            { borderLeftColor: isMyMessage ? '#B8BEC4' : '#4E8BFF' },
            leftContainer,
          ]}
        >
          <Text numberOfLines={1} style={[styles.title, titleStyle]}>
            {title}
          </Text>
          <View style={[styles.subtitleContainer, subtitleContainer]}>
            <SubtitleIcon message={quotedMessage} />
            <SubtitleText message={quotedMessage} />
          </View>
        </View>
        <View style={[styles.rightContainer, rightContainer]}>
          <RightContent message={quotedMessage} />
        </View>
      </View>
      {!messageFromContext?.quoted_message ? (
        <View style={[styles.dismissWrapper, dismissWrapper]}>
          <AttachmentRemoveControl onPress={onDismiss} />
        </View>
      ) : null}
    </View>
  );
};

const areEqual = (prevProps: ReplyPropsWithContext, nextProps: ReplyPropsWithContext) => {
  const {
    isMyMessage: prevIsMyMessage,
    mode: prevMode,
    quotedMessage: prevQuotedMessage,
  } = prevProps;
  const {
    isMyMessage: nextIsMyMessage,
    mode: nextMode,
    quotedMessage: nextQuotedMessage,
  } = nextProps;

  const isMyMessageEqual = prevIsMyMessage === nextIsMyMessage;

  if (!isMyMessageEqual) {
    return false;
  }

  const modeEqual = prevMode === nextMode;
  if (!modeEqual) {
    return false;
  }

  const messageEqual =
    prevQuotedMessage &&
    nextQuotedMessage &&
    checkQuotedMessageEquality(prevQuotedMessage, nextQuotedMessage);
  if (!messageEqual) {
    return false;
  }

  return true;
};

export const MemoizedReply = React.memo(ReplyWithContext, areEqual) as typeof ReplyWithContext;

export type ReplyProps = Partial<ReplyPropsWithContext>;

export const Reply = (props: ReplyProps) => {
  const { message: messageFromContext } = useMessageContext();
  const { client } = useChatContext();

  const messageComposer = useMessageComposer();
  const { quotedMessage: quotedMessageFromComposer } = useStateStore(
    messageComposer.state,
    messageComposerStateStoreSelector,
  );

  const onDismiss = useCallback(() => {
    messageComposer.setQuotedMessage(null);
  }, [messageComposer]);

  const quotedMessage = messageFromContext
    ? (messageFromContext.quoted_message as MessagesContextValue['quotedMessage'])
    : quotedMessageFromComposer;

  const isMyMessage = client.user?.id === quotedMessage?.user?.id;

  const mode = messageComposer.editedMessage ? 'edit' : 'reply';

  return (
    <MemoizedReply
      {...{ isMyMessage, message: messageFromContext, mode, onDismiss, quotedMessage }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  attachmentContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    borderRadius: 12,
    flexDirection: 'row',
    padding: 8,
  },
  contentWrapper: {
    backgroundColor: 'white',
    borderColor: '#E2E6EA',
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    overflow: 'hidden',
    width: 40,
  },
  dismissWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  iconStyle: {},
  imageAttachment: {},
  leftContainer: {
    borderLeftColor: '#B8BEC4',
    borderLeftWidth: 2,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  playIconContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  rightContainer: {},
  subtitle: {
    color: '#384047',
    flexShrink: 1,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
  },
  subtitleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingTop: 4,
  },
  title: {
    color: '#384047',
    fontSize: 12,
    fontWeight: 'bold',
    includeFontPadding: false,
    lineHeight: 16,
  },
  wrapper: {
    padding: 4,
  },
});
