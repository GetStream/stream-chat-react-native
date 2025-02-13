import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LayoutChangeEvent, Text, TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import { Close, Notification, Check, Delete, useTheme } from 'stream-chat-react-native';
import { styles as menuDrawerStyles } from './MenuDrawer.tsx';
import AsyncStore from '../utils/AsyncStore.ts';
import { StreamChat } from 'stream-chat';

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

const isAndroid = Platform.OS === 'android';

export const SecretMenu = ({ close, visible, chatClient }: { close: () => void, visible: boolean, chatClient: StreamChat }) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();

  const notificationConfigItems = useMemo(() => [{ label: 'Firebase', name: 'rn-fcm', id: 'firebase' }, { label: 'APNs', name: 'APN', id: 'apn' }], []);

  useEffect(() => {
    const getSelectedProvider = async () => {
      const provider = await AsyncStore.getItem('@stream-rn-sampleapp-push-provider', notificationConfigItems[0]);
      setSelectedProvider(provider?.id ?? 'firebase');
    };
    getSelectedProvider();
  }, [notificationConfigItems]);

  const storeProvider = useCallback(async (item: { label: string, name: string, id: string }) => {
      await AsyncStore.setItem('@stream-rn-sampleapp-push-provider', item);
      setSelectedProvider(item.id);
  }, []);

  const removeAllDevices = useCallback(async () => {
    const { devices } = await chatClient.getDevices(chatClient.userID);
    for (const device of devices ?? []) {
      await chatClient.removeDevice(device.id, chatClient.userID);
    }
  }, [chatClient]);

  return (
    <SlideInView visible={visible}>
      <View
        style={[
          menuDrawerStyles.menuItem,
          { opacity: isAndroid ? 0.3 : 1, alignItems: 'flex-start' },
        ]}
      >
        <Notification height={24} pathFill={grey} width={24} />
        <View>
          <Text
            style={[
              menuDrawerStyles.menuTitle,
              {
                color: black,
                marginTop: 4,
              },
            ]}
          >
            Notification Provider
          </Text>
          {isAndroid ? null : <View style={{ marginLeft: 16 }}>
            {notificationConfigItems.map((item) => (
              <TouchableOpacity key={item.id} style={{ paddingTop: 8, flexDirection: 'row' }} onPress={() => storeProvider(item)}>
                <Text style={styles.notificationItem}>{item.label}</Text>
                {item.id === selectedProvider ? <Check height={16} pathFill={'green'} width={16} style={{ marginLeft: 12 }} /> : null}
              </TouchableOpacity>
            ))}
          </View>}
        </View>
      </View>
      <TouchableOpacity onPress={removeAllDevices} style={menuDrawerStyles.menuItem}>
        <Delete height={24} size={24} pathFill={grey} width={24} />
        <Text
          style={[
            menuDrawerStyles.menuTitle,
            {
              color: black,
            },
          ]}
        >
          Remove all devices
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
        <View style={[styles.separator, { backgroundColor: grey }]} />
      </View>
    </SlideInView>
  );
};

export const styles = StyleSheet.create({
  separator: { height: 1, width: '100%', opacity: 0.2 },
  notificationContainer: {},
  notificationItem: {
    fontSize: 13,
    fontWeight: '500',
  },
});
