import * as React from 'react';
import { buildStylesheet } from '../styles/styles';

import styled from 'styled-components';

const Container = styled.View``;

const Icon = styled.View`
  padding-top: ${(props) => props.theme.iconBadge.icon.paddingTop};
  align-self: ${(props) => props.theme.iconBadge.icon.alignSelf};
  border-radius: ${(props) => props.theme.iconBadge.icon.borderRadius};
  align-items: ${(props) => props.theme.iconBadge.icon.alignItems};
  justify-content: ${(props) => props.theme.iconBadge.icon.justifyContent};
`;

const IconInner = styled.View`
  background-color: ${(props) => props.theme.iconBadge.iconInner.paddingTop};
  justify-content: ${(props) => props.theme.iconBadge.iconInner.justifyContent};
  align-items: ${(props) => props.theme.iconBadge.iconInner.alignItems};
  align-self: ${(props) => props.theme.iconBadge.iconInner.alignSelf};
  min-width: ${(props) => props.theme.iconBadge.iconInner.minWidth};
  height: ${(props) => props.theme.iconBadge.iconInner.height};
  padding-left: ${(props) => props.theme.iconBadge.iconInner.paddingLeft};
  padding-right: ${(props) => props.theme.iconBadge.iconInner.paddingRight};
  border-radius: ${(props) => props.theme.iconBadge.iconInner.borderRadius};
`;

const UnreadCount = styled.Text`
  font-size: ${(props) => props.theme.iconBadge.unreadCount.fontSize};
  color: ${(props) => props.theme.iconBadge.unreadCount.color};
`;

export class IconBadge extends React.Component {
  render() {
    const { children, showNumber, unread } = this.props;
    const styles = buildStylesheet('iconBadge', this.props.styles);

    return (
      <Container>
        {children}
        {unread > 0 && (
          <Icon style={styles.icon}>
            <IconInner style={styles.iconInner}>
              {showNumber && (
                <UnreadCount style={styles.text}>{unread}</UnreadCount>
              )}
            </IconInner>
          </Icon>
        )}
      </Container>
    );
  }
}
