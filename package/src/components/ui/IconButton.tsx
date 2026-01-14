import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../icons/utils/base';

export type IconButtonProps = PressableProps & {
  Icon: React.FC<IconProps> | React.ReactNode;
  iconColor?: string;
  onPress?: () => void;
  size?: 'sm' | 'md' | 'lg';
  status?: 'disabled' | 'pressed' | 'selected' | 'enabled';
  type?: 'primary' | 'secondary' | 'destructive';
  category?: 'ghost' | 'filled' | 'outline';
};

const sizes = {
  lg: { borderRadius: 24, height: 48, width: 48 },
  md: { borderRadius: 20, height: 40, width: 40 },
  sm: {
    borderRadius: 16,
    height: 32,
    width: 32,
  },
};

const getBackgroundColor = ({
  type,
  status,
}: {
  type: IconButtonProps['type'];
  status: IconButtonProps['status'];
}) => {
  if (type === 'primary') {
    if (status === 'disabled') {
      return '#E2E6EA';
    } else {
      return '#005FFF';
    }
  } else if (type === 'secondary') {
    return '#FFFFFF';
  }
  return {
    destructive: '#D92F26',
    primary: '#005FFF',
    secondary: '#FFFFFF',
  }[type ?? 'primary'];
};

export const IconButton = (props: IconButtonProps) => {
  const {
    category = 'filled',
    status = 'enabled',
    Icon,
    iconColor,
    onPress,
    size = 'md',
    style,
    type = 'primary',
    ...rest
  } = props;
  const {
    theme: {
      colors: { selected: selectedColor },
    },
  } = useTheme();
  return (
    <Pressable
      disabled={status === 'disabled'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        sizes[size],
        {
          backgroundColor:
            status === 'selected'
              ? selectedColor
              : pressed
                ? '#F5F6F7'
                : getBackgroundColor({ status, type }),
          borderColor: '#E2E6EA',
          borderWidth: category === 'outline' || category === 'filled' ? 1 : 0,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}
    >
      {typeof Icon === 'function' ? (
        <Icon
          height={20}
          stroke={status === 'disabled' ? '#B8BEC4' : (iconColor ?? '#384047')}
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          width={20}
        />
      ) : (
        <View>{Icon}</View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
