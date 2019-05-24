import * as React from 'react';
import { buildStylesheet } from '../styles/styles';
import { getTheme } from '../styles/theme';

import styled from '@stream-io/styled-components';

const Container = styled.View``;

const Icon = styled.View`
  padding-top: ${(props) => getTheme(props).iconBadge.icon.paddingTop};
  align-self: ${(props) => getTheme(props).iconBadge.icon.alignSelf};
  border-radius: ${(props) => getTheme(props).iconBadge.icon.borderRadius};
  align-items: ${(props) => getTheme(props).iconBadge.icon.alignItems};
  justify-content: ${(props) => getTheme(props).iconBadge.icon.justifyContent};
`;

const IconInner = styled.View`
  background-color: ${(props) =>
    getTheme(props).iconBadge.iconInner.paddingTop};
  justify-content: ${(props) =>
    getTheme(props).iconBadge.iconInner.justifyContent};
  align-items: ${(props) => getTheme(props).iconBadge.iconInner.alignItems};
  align-self: ${(props) => getTheme(props).iconBadge.iconInner.alignSelf};
  min-width: ${(props) => getTheme(props).iconBadge.iconInner.minWidth};
  height: ${(props) => getTheme(props).iconBadge.iconInner.height};
  padding-left: ${(props) => getTheme(props).iconBadge.iconInner.paddingLeft};
  padding-right: ${(props) => getTheme(props).iconBadge.iconInner.paddingRight};
  border-radius: ${(props) => getTheme(props).iconBadge.iconInner.borderRadius};
`;

const UnreadCount = styled.Text`
  font-size: ${(props) => getTheme(props).iconBadge.unreadCount.fontSize};
  color: ${(props) => getTheme(props).iconBadge.unreadCount.color};
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
