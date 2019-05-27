import * as React from 'react';
import { buildStylesheet } from '../styles/styles';

import styled from '@stream-io/styled-components';

const Container = styled.View``;

const Icon = styled.View`
  padding-top: ${({ theme }) => theme.iconBadge.icon.paddingTop};
  align-self: ${({ theme }) => theme.iconBadge.icon.alignSelf};
  border-radius: ${({ theme }) => theme.iconBadge.icon.borderRadius};
  align-items: ${({ theme }) => theme.iconBadge.icon.alignItems};
  justify-content: ${({ theme }) => theme.iconBadge.icon.justifyContent};
  ${({ theme }) => theme.iconBadge.icon.extra}
`;

const IconInner = styled.View`
  background-color: ${({ theme }) => theme.iconBadge.iconInner.paddingTop};
  justify-content: ${({ theme }) => theme.iconBadge.iconInner.justifyContent};
  align-items: ${({ theme }) => theme.iconBadge.iconInner.alignItems};
  align-self: ${({ theme }) => theme.iconBadge.iconInner.alignSelf};
  min-width: ${({ theme }) => theme.iconBadge.iconInner.minWidth};
  height: ${({ theme }) => theme.iconBadge.iconInner.height};
  padding-left: ${({ theme }) => theme.iconBadge.iconInner.paddingLeft};
  padding-right: ${({ theme }) => theme.iconBadge.iconInner.paddingRight};
  border-radius: ${({ theme }) => theme.iconBadge.iconInner.borderRadius};
  ${({ theme }) => theme.iconBadge.iconInner.extra}
`;

const UnreadCount = styled.Text`
  font-size: ${({ theme }) => theme.iconBadge.unreadCount.fontSize};
  color: ${({ theme }) => theme.iconBadge.unreadCount.color};
  ${({ theme }) => theme.iconBadge.unreadCount.extra}
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
