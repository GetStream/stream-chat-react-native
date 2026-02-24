import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import dayjs from 'dayjs';
import {
  DraftMessage,
  LiveLocationPayload,
  LocalMessage,
  MessageResponse,
  PollState,
} from 'stream-chat';

import { useGroupedAttachments } from './hook/useGroupedAttachments';

import { useTheme } from '../../contexts';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../hooks';
import { CircleBan } from '../../icons/CircleBan';
import { NewFile } from '../../icons/NewFile';
import { NewLink } from '../../icons/NewLink';
import { NewMapPin } from '../../icons/NewMapPin';
import { NewMic } from '../../icons/NewMic';
import { NewPhoto } from '../../icons/NewPhoto';
import { NewPoll } from '../../icons/NewPoll';
import { NewVideo } from '../../icons/NewVideo';
import { IconProps } from '../../icons/utils/base';
import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';

const selector = (nextValue: PollState) => ({
  name: nextValue.name,
});

const MessagePreviewText = React.memo(
  ({
    message,
    style,
  }: {
    message?: LocalMessage | MessageResponse | DraftMessage | null;
    style?: StyleProp<TextStyle>;
  }) => {
    const { client } = useChatContext();
    const poll = client.polls.fromState(message?.poll_id ?? '');
    const { name: pollName } = useStateStore(poll?.state, selector) ?? {};
    const styles = useStyles();
    const { giphys, audios, images, videos, files, voiceRecordings } = useGroupedAttachments(
      message?.attachments,
    );
    const attachmentsLength = message?.attachments?.length;

    const subtitle = useMemo(() => {
      const onlyImages = images?.length && images?.length === attachmentsLength;
      const onlyVideos = videos?.length && videos?.length === attachmentsLength;
      const onlyFiles = files?.length && files?.length === attachmentsLength;
      const onlyAudio = audios?.length === attachmentsLength;
      const onlyVoiceRecordings =
        voiceRecordings?.length && voiceRecordings?.length === attachmentsLength;

      if (message?.type === 'deleted') {
        return 'Message deleted';
      }

      if (pollName) {
        return pollName;
      }

      if (message?.shared_location) {
        if (
          // There is a problem with types in Draft Message, and its not able to infer the type of `end_at` correctly, so the `as` is used.
          (message?.shared_location as LiveLocationPayload)?.end_at &&
          new Date((message?.shared_location as LiveLocationPayload)?.end_at) > new Date()
        ) {
          return 'Live Location';
        }
        return 'Location';
      }

      if (message?.text) {
        return message?.text;
      }

      if (onlyImages) {
        if (images?.length === 1) {
          return 'Photo';
        } else {
          return `${images?.length} Photos`;
        }
      }

      if (onlyVideos) {
        if (videos?.length === 1) {
          return 'Video';
        } else {
          return `${videos?.length} Videos`;
        }
      }

      if (onlyAudio) {
        if (audios?.length === 1) {
          return 'Audio';
        } else {
          return `${audios?.length} Audios`;
        }
      }

      if (onlyVoiceRecordings) {
        if (voiceRecordings?.length === 1) {
          return `Voice message (${dayjs.duration(voiceRecordings?.[0]?.duration ?? 0, 'seconds').format('m:ss')})`;
        } else {
          return `${voiceRecordings?.length} Voice messages`;
        }
      }

      if (giphys?.length) {
        return 'Giphy';
      }

      if (onlyFiles && files?.length === 1) {
        return files?.[0]?.title;
      }

      return `${attachmentsLength} Files`;
    }, [
      attachmentsLength,
      audios?.length,
      files,
      giphys?.length,
      images?.length,
      message?.shared_location,
      message?.text,
      message?.type,
      pollName,
      videos?.length,
      voiceRecordings,
    ]);

    if (!subtitle) {
      return null;
    }

    return (
      <Text numberOfLines={1} style={[styles.subtitle, style]}>
        {subtitle}
      </Text>
    );
  },
);

const MessagePreviewIcon = React.memo(
  (props: {
    message?: LocalMessage | MessageResponse | DraftMessage | null;
    iconProps?: IconProps;
  }) => {
    const { message, iconProps } = props;
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();
    const { giphys, audios, images, videos, files, voiceRecordings } = useGroupedAttachments(
      message?.attachments,
    );
    const attachmentsLength = message?.attachments?.length;
    if (!message) {
      return null;
    }

    const onlyImages = images?.length && images?.length === attachmentsLength;
    const onlyAudio = audios?.length && audios?.length === attachmentsLength;
    const onlyVideos = videos?.length && videos?.length === attachmentsLength;
    const onlyVoiceRecordings =
      voiceRecordings?.length && voiceRecordings?.length === attachmentsLength;
    const hasLink = message?.attachments?.some(
      (attachment) => attachment.type === FileTypes.Image && attachment.og_scrape_url,
    );

    if (message.type === 'deleted') {
      return (
        <CircleBan
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (message.poll_id) {
      return (
        <NewPoll
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (message.shared_location) {
      return (
        <NewMapPin
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (hasLink) {
      return (
        <NewLink
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (onlyAudio || onlyVoiceRecordings) {
      return (
        <NewMic
          height={12}
          stroke={semantics.textPrimary}
          strokeWidth={1.2}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (onlyVideos) {
      return (
        <NewVideo
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (onlyImages) {
      return (
        <NewPhoto
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (giphys?.length) {
      return (
        <NewFile
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    if (files?.length || images?.length || videos?.length || audios?.length) {
      return (
        <NewFile
          height={12}
          stroke={semantics.textPrimary}
          style={styles.iconStyle}
          width={12}
          {...iconProps}
        />
      );
    }

    return null;
  },
);

export type MessagePreviewProps = {
  message: LocalMessage | MessageResponse | DraftMessage;
  iconProps?: IconProps;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export const MessagePreview = ({
  message,
  iconProps,
  textStyle,
  containerStyle,
}: MessagePreviewProps) => {
  const styles = useStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      <MessagePreviewIcon message={message} iconProps={iconProps} />
      <MessagePreviewText message={message} style={textStyle} />
    </View>
  );
};

const useStyles = () => {
  return useMemo(() => {
    return StyleSheet.create({
      subtitle: {
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        includeFontPadding: false,
      },
      container: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: primitives.spacingXxs,
        flexShrink: 1,
      },
      iconStyle: {},
    });
  }, []);
};
