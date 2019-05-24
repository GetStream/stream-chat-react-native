import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';
import truncate from 'lodash/truncate';
import styled from '@stream-io/styled-components';
import { getTheme } from '../styles/theme';

const Container = styled.TouchableOpacity`
  display: ${(props) =>
    getTheme(props).channelPreview.messenger.container.display};
  flex-direction: ${(props) =>
    getTheme(props).channelPreview.messenger.container.flexDirection};
  border-bottom-color: ${(props) =>
    getTheme(props).channelPreview.messenger.container.borderBottomColor};
  border-bottom-width: ${(props) =>
    getTheme(props).channelPreview.messenger.container.borderBottomWidth};
  padding: ${(props) =>
    getTheme(props).channelPreview.messenger.container.padding}px;
`;

const Details = styled.View`
  display: ${(props) =>
    getTheme(props).channelPreview.messenger.details.display};
  flex-direction: ${(props) =>
    getTheme(props).channelPreview.messenger.details.flexDirection};
  flex: ${(props) => getTheme(props).channelPreview.messenger.details.flex};
  padding-left: ${(props) =>
    getTheme(props).channelPreview.messenger.details.paddingLeft}px;
`;

const DetailsTop = styled.View`
  display: ${(props) =>
    getTheme(props).channelPreview.messenger.detailsTop.display};
  flex-direction: ${(props) =>
    getTheme(props).channelPreview.messenger.detailsTop.flexDirection};
  justify-content: ${(props) =>
    getTheme(props).channelPreview.messenger.detailsTop.justifyContent};
`;

const Title = styled.Text`
  font-weight: ${(props) =>
    getTheme(props).channelPreview.messenger.title.fontWeight};
  font-size: ${(props) =>
    getTheme(props).channelPreview.messenger.title.fontSize};
  flex: ${(props) => getTheme(props).channelPreview.messenger.title.flex};
`;

const Date = styled.Text`
  color: ${(props) => getTheme(props).channelPreview.messenger.date.color};
  font-size: ${(props) =>
    getTheme(props).channelPreview.messenger.date.fontSize};
  text-align: ${(props) =>
    getTheme(props).channelPreview.messenger.date.textAlign};
`;

const Message = styled.Text`
  color: ${(props) =>
    props.unread
      ? getTheme(props).channelPreview.messenger.message.unreadColor
      : getTheme(props).channelPreview.messenger.message.color};
  font-size: ${(props) =>
    getTheme(props).channelPreview.messenger.message.fontSize};
  font-weight: ${(props) =>
    props.unread
      ? getTheme(props).channelPreview.messenger.message.unreadFontWeight
      : getTheme(props).channelPreview.messenger.message.fontWeight};
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
