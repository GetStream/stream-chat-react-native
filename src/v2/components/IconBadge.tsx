import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    paddingTop: 5,
  },
  iconInner: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#00FF00',
    borderRadius: 20,
    height: 15,
    justifyContent: 'center',
    minWidth: 15,
    paddingHorizontal: 3,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 10,
  },
});

export type IconBadgeProps = {
  unread: number;
  showNumber?: boolean;
};

export const IconBadge: React.FC<IconBadgeProps> = (props) => {
  const { children, showNumber, unread } = props;

  const {
    theme: {
      iconBadge: { icon, iconInner, unreadCount },
    },
  } = useTheme();

  return (
    <View>
      {children}
      {unread > 0 && (
        <View style={[styles.icon, icon]}>
          <View style={[styles.iconInner, iconInner]}>
            {showNumber && (
              <Text style={[styles.unreadCount, unreadCount]}>{unread}</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

IconBadge.displayName = 'IconBadge{iconBadge}';
