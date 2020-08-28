import React from 'react';
import styled from '@stream-io/styled-components';
import truncate from 'lodash/truncate';
import PropTypes from 'prop-types';

import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';
import { useChannelPreviewDisplayAvatar } from './hooks/useChannelPreviewDisplayAvatar';

import Avatar from '../Avatar/Avatar';

import { themed } from '../../styles/theme';

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

const Message = styled.Text`
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
            {formatLatestMessageDate
              ? formatLatestMessageDate(latestMessage.messageObject.created_at)
              : latestMessage.created_at}
          </Date>
        </DetailsTop>
        <Message unread={unread > 0 ? unread : undefined}>
          {latestMessage &&
            latestMessage.text &&
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
  channel: PropTypes.object,
  /**
   * Formatter function for date of latest message.
   * @param date Message date
   * @returns Formatted date string
   *
   * By default today's date is shown in 'HH:mm A' format and other dates
   * are displayed in 'DD/MM/YY' format. props.latestMessage.created_at is the
   * default formatted date. This default logic is part of ChannelPreview component.
   */
  formatLatestMessageDate: PropTypes.func,
  /** Latest message (object) on channel */
  latestMessage: PropTypes.object,
  /** Length at which latest message should be truncated */
  latestMessageLength: PropTypes.number,
  /** @see See [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext) */
  setActiveChannel: PropTypes.func,
  /** Number of unread messages on channel */
  unread: PropTypes.number,
};

ChannelPreviewMessenger.themePath = 'channelPreview';

// TODO: remove HOC and use a theme context provider
export default themed(ChannelPreviewMessenger);
