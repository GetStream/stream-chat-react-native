import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useTheme } from 'stream-chat-react-native/v2';

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
      style={{
        alignItems: 'center',
        backgroundColor: icon_background,
        borderRadius: 20,
        elevation: 5,
        height: 40,
        justifyContent: 'center',
        shadowColor: black,
        shadowOffset: {
          height: 2,
          width: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        width: 40,
      }}
    >
      {children}
    </TouchableOpacity>
  );
};
