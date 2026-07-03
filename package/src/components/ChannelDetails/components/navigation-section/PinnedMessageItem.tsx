import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import type { Channel, MessageResponse } from 'stream-chat';

import { useComponentsContext } from '../../../../contexts';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { useTranslatedMessage } from '../../../../hooks/useTranslatedMessage';
import { primitives } from '../../../../theme';
import { ChannelPreviewStatusProps } from '../../../ChannelPreview/ChannelPreviewStatus';
import { UserAvatar } from '../../../ui/Avatar/UserAvatar';

export type PinnedMessageItemProps = {
  /** The channel the pinned message belongs to. */
  channel: Channel;
  /** The pinned message to render. */
  message: MessageResponse;
} & { formatMessageDate?: ChannelPreviewStatusProps['formatLatestMessageDate'] };

export const PinnedMessageItem = (props: PinnedMessageItemProps) => {
  const { channel, message: propMessage, formatMessageDate } = props;
  const {
    theme: {
      channelDetails: { pinnedMessageItem },
      semantics,
    },
  } = useTheme();
  const { ChannelPreviewLastMessage, ChannelPreviewStatus } = useComponentsContext();
  const styles = useStyles();

  const translatedMessage = useTranslatedMessage(propMessage);
  const message = translatedMessage ?? propMessage;

  const senderName = message.user?.name || message.user?.id || '';

  return (
    <View
      style={[styles.container, pinnedMessageItem.container]}
      testID={`pinned-message-item-${message.id}`}
    >
      {message.user ? <UserAvatar size='lg' user={message.user} /> : null}
      <View style={[styles.content, pinnedMessageItem.content]}>
        <View style={[styles.title, pinnedMessageItem.title]}>
          <Text
            ellipsizeMode='tail'
            numberOfLines={1}
            style={[styles.name, { color: semantics.textPrimary }, pinnedMessageItem.name]}
          >
            {senderName}
          </Text>
          <ChannelPreviewStatus
            channel={channel}
            lastMessage={message}
            formatLatestMessageDate={formatMessageDate}
          />
        </View>
        <ChannelPreviewLastMessage message={message}></ChannelPreviewLastMessage>
      </View>
    </View>
  );
};

PinnedMessageItem.displayName = 'PinnedMessageItem{pinnedMessageItem}';

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingSm,
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingMd,
        },
        content: {
          flex: 1,
          gap: primitives.spacingXxxs,
        },
        name: {
          flex: 1,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightRegular,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        title: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: primitives.spacingXxs,
        },
      }),
    [],
  );
};
