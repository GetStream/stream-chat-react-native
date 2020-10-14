import React from 'react';
import { View } from 'react-native';

import { styled } from '../../styles/styledComponents';

const Icon = styled.View`
  align-items: center;
  align-self: center;
  border-radius: 20px;
  justify-content: center;
  padding-top: 5px;
  ${({ theme }) => theme.iconBadge.icon.css};
`;

const IconInner = styled.View`
  align-items: center;
  align-self: flex-start;
  background-color: green;
  border-radius: 20px;
  height: 15px;
  justify-content: center;
  min-width: 15px;
  padding-horizontal: 3px;
  ${({ theme }) => theme.iconBadge.iconInner.css};
`;

const UnreadCount = styled.Text`
  color: #ffffff;
  font-size: 10px;
  ${({ theme }) => theme.iconBadge.unreadCount.css};
`;

export type IconBadgeProps = {
  unread: number;
  showNumber?: boolean;
};

export const IconBadge: React.FC<IconBadgeProps> = (props) => {
  const { children, showNumber, unread } = props;

  return (
    <View>
      {children}
      {unread > 0 && (
        <Icon>
          <IconInner>
            {showNumber && <UnreadCount>{unread}</UnreadCount>}
          </IconInner>
        </Icon>
      )}
    </View>
  );
};
