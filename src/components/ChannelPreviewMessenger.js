import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';
import truncate from 'lodash/truncate';
import styled from '@stream-io/styled-components';

const Container = styled.TouchableOpacity`
  display: flex;
  flex-direction: row;
  border-bottom-color: #ebebeb;
  border-bottom-width: 1;
  padding: 10px;
  ${({ theme }) => theme.channelPreview.container.extra}
`;

const Details = styled.View`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-left: 10px;
  ${({ theme }) => theme.channelPreview.details.extra}
`;

const DetailsTop = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  ${({ theme }) => theme.channelPreview.detailsTop.extra}
`;

const Title = styled.Text`
  font-weight: bold;
  font-size: 14;
  flex: 1;
  ${({ theme }) => theme.channelPreview.title.extra}
`;

const Date = styled.Text`
  color: #767676;
  font-size: 11;
  text-align: right;
  ${({ theme }) => theme.channelPreview.date.extra}
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
  ${({ theme }) => theme.channelPreview.message.extra}
`;

export class ChannelPreviewMessenger extends PureComponent {
  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel);
  };

  render() {
    const { channel } = this.props;
    return (
      <Container onPress={this.onSelectChannel}>
        <Avatar image={channel.data.image} size={40} />
        <Details>
          <DetailsTop>
            <Title ellipsizeMode="tail" numberOfLines={1}>
              {channel.data.name}
            </Title>
            <Date>{this.props.latestMessage.created_at}</Date>
          </DetailsTop>
          <Message
            unread={this.props.unread > 0}
            style={{
              color: this.props.unread > 0 ? 'black' : '#767676',
              fontSize: 13,
              fontWeight: this.props.unread > 0 ? 'bold' : 'normal',
            }}
          >
            {!channel.state.messages[0]
              ? 'Nothing yet...'
              : truncate(this.props.latestMessage.text.replace(/\n/g, ' '), 14)}
          </Message>
        </Details>
      </Container>
    );
  }
}
