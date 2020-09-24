import React from 'react';
import truncate from 'lodash/truncate';
import type { ChannelState, MessageResponse, UnknownType } from 'stream-chat';

import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';

import Avatar from '../Avatar/Avatar';

import { styled } from '../../styles/styledComponents';
import { themed } from '../../styles/theme';

import type { ChannelPreviewProps } from './ChannelPreview';
import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const Container = styled.TouchableOpacity`
  flex-direction: row;
  border-bottom-color: #ebebeb;
  border-bottom-width: 1px;
  padding: 10px;
  ${({ theme }) => theme.channelPreview.container.css}
`;

const Details = styled.View`
  flex: 1;
  padding-left: 10px;
  ${({ theme }) => theme.channelPreview.details.css}
`;

const DetailsTop = styled.View`
  flex-direction: row;
  justify-content: space-between;
  ${({ theme }) => theme.channelPreview.detailsTop.css}
`;

const Title = styled.Text`
  font-weight: bold;
  font-size: 14px;
  ${({ theme }) => theme.channelPreview.title.css}
`;

const Date = styled.Text`
  color: #767676;
  font-size: 11px;
  text-align: right;
  ${({ theme }) => theme.channelPreview.date.css}
`;

const StyledMessage = styled.Text<{ unread?: number }>`
  color: ${({ theme, unread }) =>
    unread
      ? theme.channelPreview.message.unreadColor
      : theme.channelPreview.message.color};
  font-size: 13px;
  font-weight: ${({ theme, unread }) =>
    unread
      ? theme.channelPreview.message.unreadFontWeight
      : theme.channelPreview.message.fontWeight};
  ${({ theme }) => theme.channelPreview.message.css}
`;

export type ChannelPreviewMessengerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** Latest message on a channel, formatted for preview */
  latestMessagePreview: LatestMessagePreview<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Formatter function for date of latest message.
   * @param date Message date
   * @returns Formatted date string
   *
   * By default today's date is shown in 'HH:mm A' format and other dates
   * are displayed in 'DD/MM/YY' format. props.latestMessage.created_at is the
   * default formatted date. This default logic is part of ChannelPreview component.
   */
  formatLatestMessageDate?: (date: string) => string;
  /** Most recent message on the channel */
  lastMessage?:
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
    | MessageResponse<At, Ch, Co, Me, Re, Us>;
  /** Length at which latest message should be truncated */
  latestMessageLength?: number;
  /** Number of unread messages on the channel */
  unread?: number;
};

/**
 * This UI component displays an individual preview item for each channel in a list. It also receives all props
 * from the ChannelPreview component.
 *
 * @example ./ChannelPreviewMessenger.md
 */
const ChannelPreviewMessenger = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  channel,
  formatLatestMessageDate,
  latestMessageLength = 30,
  latestMessagePreview,
  setActiveChannel,
  unread,
}: ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayName = useChannelPreviewDisplayName(channel);

  return (
    <Container
      onPress={setActiveChannel && setActiveChannel.bind(null, channel)}
      testID='channel-preview-button'
    >
      <Avatar image={displayAvatar.image} name={displayAvatar.name} size={40} />
      <Details>
        <DetailsTop>
          <Title ellipsizeMode='tail' numberOfLines={1}>
            {displayName}
          </Title>
          <Date>
            {formatLatestMessageDate &&
            typeof latestMessagePreview.messageObject?.created_at === 'string'
              ? formatLatestMessageDate(
                  latestMessagePreview.messageObject.created_at,
                )
              : latestMessagePreview?.created_at}
          </Date>
        </DetailsTop>
        <StyledMessage unread={unread}>
          {latestMessagePreview?.text &&
            truncate(latestMessagePreview.text.replace(/\n/g, ' '), {
              length: latestMessageLength,
            })}
        </StyledMessage>
      </Details>
    </Container>
  );
};

ChannelPreviewMessenger.themePath = 'channelPreview';

// TODO: remove HOC and use a theme context provider
export default themed(
  ChannelPreviewMessenger,
) as typeof ChannelPreviewMessenger;
