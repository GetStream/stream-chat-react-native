import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';
import truncate from 'lodash/truncate';
import styled from '@stream-io/styled-components';

const Container = styled.TouchableOpacity`
  display: ${(props) => props.theme.channelPreview.messenger.container.display};
  flex-direction: ${(props) =>
    props.theme.channelPreview.messenger.container.flexDirection};
  border-bottom-color: ${(props) =>
    props.theme.channelPreview.messenger.container.borderBottomColor};
  border-bottom-width: ${(props) =>
    props.theme.channelPreview.messenger.container.borderBottomWidth};
  padding: ${(props) =>
    props.theme.channelPreview.messenger.container.padding}px;
`;

const Details = styled.View`
  display: ${(props) => props.theme.channelPreview.messenger.details.display};
  flex-direction: ${(props) =>
    props.theme.channelPreview.messenger.details.flexDirection};
  flex: ${(props) => props.theme.channelPreview.messenger.details.flex};
  padding-left: ${(props) =>
    props.theme.channelPreview.messenger.details.paddingLeft}px;
`;

const DetailsTop = styled.View`
  display: ${(props) =>
    props.theme.channelPreview.messenger.detailsTop.display};
  flex-direction: ${(props) =>
    props.theme.channelPreview.messenger.detailsTop.flexDirection};
  justify-content: ${(props) =>
    props.theme.channelPreview.messenger.detailsTop.justifyContent};
`;

const Title = styled.Text`
  font-weight: ${(props) =>
    props.theme.channelPreview.messenger.title.fontWeight};
  font-size: ${(props) => props.theme.channelPreview.messenger.title.fontSize};
  flex: ${(props) => props.theme.channelPreview.messenger.title.flex};
`;

const Date = styled.Text`
  color: ${(props) => props.theme.channelPreview.messenger.date.color};
  font-size: ${(props) => props.theme.channelPreview.messenger.date.fontSize};
  text-align: ${(props) => props.theme.channelPreview.messenger.date.textAlign};
`;

const Message = styled.Text`
  color: ${(props) =>
    props.unread
      ? props.theme.channelPreview.messenger.message.unreadColor
      : props.theme.channelPreview.messenger.message.color};
  font-size: ${(props) =>
    props.theme.channelPreview.messenger.message.fontSize};
  font-weight: ${(props) =>
    props.unread
      ? props.theme.channelPreview.messenger.message.unreadFontWeight
      : props.theme.channelPreview.messenger.message.fontWeight};
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
