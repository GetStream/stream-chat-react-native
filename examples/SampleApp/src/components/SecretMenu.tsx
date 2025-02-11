import React from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
import { Close, Notification, useTheme } from 'stream-chat-react-native';
import { styles as menuDrawerStyles } from './MenuDrawer.tsx';

export const SlideInView = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => {
  const animatedHeight = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    animatedHeight.value = height;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: withSpring(visible ? animatedHeight.value : 0, { damping: 10 }),
    opacity: withTiming(visible ? 1 : 0, { duration: 500 }),
  }), [visible]);

  return (
    <Animated.View style={animatedStyle}>
      {visible ? <View onLayout={onLayout} style={{ position: 'absolute', width: '100%' }}>
        {children}
      </View> : null}
    </Animated.View>
  );
};

export const SecretMenu = ({ close, visible }: { close: () => void, visible: boolean }) => {
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();

  return <SlideInView visible={visible} >
    <TouchableOpacity style={menuDrawerStyles.menuItem}>
      <Notification height={24} pathFill={grey} width={24} />
      <Text
        style={[
          menuDrawerStyles.menuTitle,
          {
            color: black,
          },
        ]}
      >
        BRUH
      </Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={close} style={menuDrawerStyles.menuItem}>
      <Close height={24} pathFill={grey} width={24} />
      <Text
        style={[
          menuDrawerStyles.menuTitle,
          {
            color: black,
          },
        ]}
      >
        Close
      </Text>
    </TouchableOpacity>
    <View style={menuDrawerStyles.menuItem}>
      <View style={{ backgroundColor: grey, height: 1, width: '100%', opacity: 0.2 }}/>
    </View>
  </SlideInView>;
};
