import * as React from 'react';

import styled from '@stream-io/styled-components';

const Container = styled.View``;

const Icon = styled.View`
  padding-top: 5;
  align-self: center;
  border-radius: 20;
  align-items: center;
  justify-content: center;
  ${({ theme }) => theme.iconBadge.icon.css}
`;

const IconInner = styled.View`
  background-color: green;
  justify-content: center;
  align-items: center;
  align-self: flex-start;
  min-width: 15;
  height: 15;
  padding-left: 3;
  padding-right: 3;
  border-radius: 20;
  ${({ theme }) => theme.iconBadge.iconInner.css}
`;

const UnreadCount = styled.Text`
  font-size: 10;
  color: #ffffff;
  ${({ theme }) => theme.iconBadge.unreadCount.css}
`;

export class IconBadge extends React.Component {
  render() {
    const { children, showNumber, unread } = this.props;

    return (
      <Container>
        {children}
        {unread > 0 && (
          <Icon>
            <IconInner>
              {showNumber && <UnreadCount>{unread}</UnreadCount>}
            </IconInner>
          </Icon>
        )}
      </Container>
    );
  }
}
