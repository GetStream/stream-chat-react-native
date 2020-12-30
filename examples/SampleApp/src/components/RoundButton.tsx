import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'stream-chat-react-native/v2';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 20,
    elevation: 4,
    height: 40,
    justifyContent: 'center',
    shadowOffset: {
      height: 1,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 40,
  },
});

type RoundButtonProps = {
  disabled?: boolean;
  onPress?: () => void;
};
export const RoundButton: React.FC<RoundButtonProps> = ({
  children,
  disabled = false,
  onPress,
}) => {
  const {
    theme: {
      colors: { black, icon_background },
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
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};
