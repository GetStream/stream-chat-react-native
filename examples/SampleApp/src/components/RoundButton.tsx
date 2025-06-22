import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

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

type RoundButtonProps = PropsWithChildren<{
  disabled?: boolean;
  onPress?: () => void;
}>;

export const RoundButton: React.FC<RoundButtonProps> = (props) => {
  const { children, disabled, onPress } = props;
  const grey = '#808080';

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: grey,
          shadowColor: grey,
        },
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};
