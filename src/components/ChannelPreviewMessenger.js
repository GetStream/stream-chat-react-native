import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';
import truncate from 'lodash/truncate';
import styled from '@stream-io/styled-components';

const Container = styled.TouchableOpacity`
  display: ${({ theme }) => theme.channelPreview.messenger.container.display};
  flex-direction: ${({ theme }) =>
    theme.channelPreview.messenger.container.flexDirection};
  border-bottom-color: ${({ theme }) =>
    theme.channelPreview.messenger.container.borderBottomColor};
  border-bottom-width: ${({ theme }) =>
    theme.channelPreview.messenger.container.borderBottomWidth};
  padding: ${({ theme }) => theme.channelPreview.messenger.container.padding}px;
  ${({ theme }) => theme.channelPreview.container.extra}
`;

const Details = styled.View`
  display: ${({ theme }) => theme.channelPreview.messenger.details.display};
  flex-direction: ${({ theme }) =>
    theme.channelPreview.messenger.details.flexDirection};
  flex: ${({ theme }) => theme.channelPreview.messenger.details.flex};
  padding-left: ${({ theme }) =>
    theme.channelPreview.messenger.details.paddingLeft}px;
  ${({ theme }) => theme.channelPreview.messenger.details.extra}
`;

const DetailsTop = styled.View`
  display: ${({ theme }) => theme.channelPreview.messenger.detailsTop.display};
  flex-direction: ${({ theme }) =>
    theme.channelPreview.messenger.detailsTop.flexDirection};
  justify-content: ${({ theme }) =>
    theme.channelPreview.messenger.detailsTop.justifyContent};
  ${({ theme }) => theme.channelPreview.messenger.detailsTop.extra}
`;

const Title = styled.Text`
  font-weight: ${({ theme }) =>
    theme.channelPreview.messenger.title.fontWeight};
  font-size: ${({ theme }) => theme.channelPreview.messenger.title.fontSize};
  flex: ${({ theme }) => theme.channelPreview.messenger.title.flex};
  ${({ theme }) => theme.channelPreview.messenger.title.extra}
`;

const Date = styled.Text`
  color: ${({ theme }) => theme.channelPreview.messenger.date.color};
  font-size: ${({ theme }) => theme.channelPreview.messenger.date.fontSize};
  text-align: ${({ theme }) => theme.channelPreview.messenger.date.textAlign};
  ${({ theme }) => theme.channelPreview.messenger.date.extra}
`;

const Message = styled.Text`
  color: ${({ theme, unread }) =>
    unread
      ? theme.channelPreview.messenger.message.unreadColor
      : theme.channelPreview.messenger.message.color};
  font-size: ${({ theme }) => theme.channelPreview.messenger.message.fontSize};
  font-weight: ${({ theme, unread }) =>
    unread
      ? theme.channelPreview.messenger.message.unreadFontWeight
      : theme.channelPreview.messenger.message.fontWeight};
  ${({ theme }) => theme.channelPreview.messenger.message.extra}
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
