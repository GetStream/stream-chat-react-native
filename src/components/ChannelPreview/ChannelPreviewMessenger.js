import React from 'react';
import truncate from 'lodash/truncate';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';
import { themed } from '../../styles/theme';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';
import useChannelPreviewDisplayAvatar from './hooks/useChannelPreviewDisplayAvatar';

const Container = styled.TouchableOpacity`
  display: flex;
  flex-direction: row;
  border-bottom-color: #ebebeb;
  border-bottom-width: 1;
  padding: 10px;
  ${({ theme }) => theme.channelPreview.container.css}
`;

const Details = styled.View`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-left: 10px;
  ${({ theme }) => theme.channelPreview.details.css}
`;

const DetailsTop = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  ${({ theme }) => theme.channelPreview.detailsTop.css}
`;

const Title = styled.Text`
  font-weight: bold;
  font-size: 14;
  flex: 1;
  ${({ theme }) => theme.channelPreview.title.css}
`;

const Date = styled.Text`
  color: #767676;
  font-size: 11;
  text-align: right;
  ${({ theme }) => theme.channelPreview.date.css}
`;

const Message = styled.Text`
  color: ${({ theme, unread }) =>
    unread
      ? theme.channelPreview.message.unreadColor
      : theme.channelPreview.message.color};
  font-size: 13;
  font-weight: ${({ theme, unread }) =>
    unread
      ? theme.channelPreview.message.unreadFontWeight
      : theme.channelPreview.message.fontWeight};
  ${({ theme }) => theme.channelPreview.message.css}
`;

/**
 * ChannelPreviewMessenger - UI component for individual item in list of channels.
 *
 * @example ../docs/ChannelPreviewMessenger.md
 */
const ChannelPreviewMessenger = ({
  channel,
  formatLatestMessageDate,
  latestMessage,
  latestMessageLength = 30,
  setActiveChannel,
  unread,
}) => {
  const displayAvatar = useChannelPreviewDisplayAvatar(channel);
  const displayName = useChannelPreviewDisplayName(channel);

  return (
    <Container
      onPress={setActiveChannel.bind(null, channel)}
      testID='channel-preview-button'
    >
      <Avatar size={40} image={displayAvatar.image} name={displayAvatar.name} />
      <Details>
        <DetailsTop>
          <Title ellipsizeMode="tail" numberOfLines={1}>
            {displayName}
          </Title>
          <Date>
            {formatLatestMessageDate
              ? formatLatestMessageDate(latestMessage.messageObject.created_at)
              : latestMessage.created_at}
          </Date>
        </DetailsTop>
        <Message unread={unread > 0 ? unread : undefined}>
          {latestMessage?.text &&
            truncate(latestMessage.text.replace(/\n/g, ' '), {
              length: latestMessageLength,
            })}
        </Message>
      </Details>
    </Container>
  );
};

ChannelPreviewMessenger.propTypes = {
  /** @see See [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext) */
  setActiveChannel: PropTypes.func,
  /** @see See [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext) */
  channel: PropTypes.object,
  /** Latest message (object) on channel */
  latestMessage: PropTypes.object,
  /** Number of unread messages on channel */
  unread: PropTypes.number,
  /** Length at which latest message should be truncated */
  latestMessageLength: PropTypes.number,
  /**
   * Formatter function for date of latest message.
   * @param date Message date
   * @returns Formatted date string
   *
   * By default today's date is shown in 'HH:mm A' format and other dates
   * are displayed in 'DD/MM/YY' format. props.latestMessage.created_at is the
   * default formated date. This default logic is part of ChannelPreview component.
   */
  formatLatestMessageDate: PropTypes.func,
};

ChannelPreviewMessenger.themePath = 'channelPreview';

export default themed(ChannelPreviewMessenger);
