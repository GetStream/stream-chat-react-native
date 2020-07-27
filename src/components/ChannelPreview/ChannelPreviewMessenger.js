import React, { PureComponent } from 'react';
import truncate from 'lodash/truncate';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';
import { themed } from '../../styles/theme';
import { withTranslationContext } from '../../context';

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
class ChannelPreviewMessenger extends PureComponent {
  static themePath = 'channelPreview';

  static propTypes = {
    /** @see See [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext) */
    setActiveChannel: PropTypes.func,
    /** @see See [Chat Context](https://getstream.github.io/stream-chat-react-native/#chatcontext) */
    channel: PropTypes.object,
    /**
     * Display preview for latest message on channel.
     * e.g. { text: 'Nothing yet ...', created_at: 'Yesterday' }
     */
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

  static defaultProps = {
    latestMessageLength: 30,
  };

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel);
  };

  renderAvatar = () => {
    const { channel, client } = this.props;
    const members = channel.state ? Object.values(channel.state.members) : [];
    const otherMembers = members.filter(
      (member) => member.user.id !== client.userID,
    );
    if (channel.data.image)
      return (
        <Avatar image={channel.data.image} size={40} name={channel.data.name} />
      );

    if (otherMembers.length === 1)
      return (
        <Avatar
          image={otherMembers[0].user.image}
          size={40}
          name={channel.data.name || otherMembers[0].user.name}
        />
      );

    return <Avatar size={40} name={channel.data.name} />;
  };

  getDisplayName = () => {
    const { channel } = this.props;
    let otherMembers = [];
    let name = channel.data.name;
    const isValidName = name && typeof name === 'string';

    if (!isValidName) {
      const members = channel.state ? Object.values(channel.state.members) : [];
      otherMembers = members.filter(
        (member) => member.user.id !== this.props.client.userID,
      );
      name = otherMembers
        .map((member) => member.user.name || member.user.id || 'Unnamed User')
        .join(', ');
    }

    return name;
  };

  getLatestMessageDisplayDate = () => {
    const { formatLatestMessageDate, latestMessage, lastMessage } = this.props;

    if (formatLatestMessageDate) {
      return formatLatestMessageDate(lastMessage.created_at);
    }

    return latestMessage.created_at;
  };

  render() {
    const { latestMessage, unread } = this.props;

    return (
      <Container onPress={this.onSelectChannel} testID="channel-preview-button">
        {this.renderAvatar()}
        <Details>
          <DetailsTop>
            <Title ellipsizeMode="tail" numberOfLines={1}>
              {this.getDisplayName()}
            </Title>
            <Date>{this.getLatestMessageDisplayDate()}</Date>
          </DetailsTop>
          <Message unread={unread > 0 ? unread : undefined}>
            {latestMessage &&
              truncate(latestMessage.text.replace(/\n/g, ' '), {
                length: this.props.latestMessageLength,
              })}
          </Message>
        </Details>
      </Container>
    );
  }
}

export default withTranslationContext(themed(ChannelPreviewMessenger));
