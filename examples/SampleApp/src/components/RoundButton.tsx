import React from 'react';
import {Platform, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from 'stream-chat-react-native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...Platform.select({
      android: {
        elevation: 4,
      },
      default: {
        shadowOffset: {
          height: 2,
          width: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
});

type RoundButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};

export const RoundButton: React.FC<RoundButtonProps> = props => {
  const {children, disabled, onPress} = props;
  const {
    theme: {
      colors: {black, icon_background},
    },
  } = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: icon_background,
          shadowColor: black,
        },
      ]}>
      {children}
    </TouchableOpacity>
  );
};
