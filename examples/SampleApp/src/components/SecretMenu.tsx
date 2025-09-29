import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  LayoutChangeEvent,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StyleSheet,
} from 'react-native';
import { Close, Notification, Delete, useTheme } from 'stream-chat-react-native';
import { styles as menuDrawerStyles } from './MenuDrawer.tsx';
import AsyncStore from '../utils/AsyncStore.ts';
import { StreamChat } from 'stream-chat';
import { LabeledTextInput } from '../screens/AdvancedUserSelectorScreen.tsx';

export const SlideInView = ({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) => {
  const animatedHeight = useSharedValue(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    animatedHeight.value = height;
  };

  const animatedStyle = useAnimatedStyle(
    () => ({
      height: withSpring(visible ? animatedHeight.value : 0, {
        damping: 20,
        overshootClamping: true,
      }),
      opacity: withTiming(visible ? 1 : 0, { duration: 500 }),
    }),
    [visible],
  );

  return (
    <Animated.View style={animatedStyle}>
      {visible ? (
        <View onLayout={onLayout} style={{ position: 'absolute', width: '100%' }}>
          {children}
        </View>
      ) : null}
    </Animated.View>
  );
};

const isAndroid = Platform.OS === 'android';

type NotificationConfigItem = { label: string; name: string; id: string };
type MessageListImplementationConfigItem = { label: string; id: string };

const SecretMenuNotificationConfigItem = ({
  notificationConfigItem,
  storeProvider,
  isSelected,
}: {
  notificationConfigItem: NotificationConfigItem;
  storeProvider: (item: NotificationConfigItem) => void;
  isSelected: boolean;
}) => {
  const [providerNameOverride, setProviderNameOverride] = useState<string>('');
  const [lastSubmittedOverride, setLastSubmittedOverride] = useState<string | null>(null);

  const asyncStorageKey = useMemo(
    () => `@stream-rn-sampleapp-push-provider-${notificationConfigItem.id}-override`,
    [notificationConfigItem],
  );

  useEffect(() => {
    const getProviderNameOverride = async () => {
      const nameOverride = await AsyncStore.getItem(asyncStorageKey, '');
      setLastSubmittedOverride(nameOverride ?? '');
    };
    getProviderNameOverride();
  }, [asyncStorageKey]);

  const storeProviderNameOverride = useCallback(async () => {
    await AsyncStore.setItem(asyncStorageKey, providerNameOverride);
    setLastSubmittedOverride(providerNameOverride);
  }, [asyncStorageKey, providerNameOverride]);

  return (
    <View
      style={[styles.notificationItemContainer, { borderColor: isSelected ? 'green' : 'gray' }]}
    >
      <TouchableOpacity
        style={{ flexDirection: 'row' }}
        onPress={() => storeProvider(notificationConfigItem)}
      >
        <Text style={styles.notificationItem}>{notificationConfigItem.label}</Text>
        <Text
          numberOfLines={1}
          style={{ opacity: 0.7, fontSize: 14, marginLeft: 4, maxWidth: 145 }}
        >
          {lastSubmittedOverride && lastSubmittedOverride.length > 0
            ? lastSubmittedOverride
            : notificationConfigItem.name}
        </Text>
      </TouchableOpacity>
      {isSelected ? (
        <>
          <LabeledTextInput
            onChangeText={setProviderNameOverride}
            label={'PN Provider name override'}
            value={providerNameOverride}
          />
          <TouchableOpacity style={styles.submitButton} onPress={storeProviderNameOverride}>
            <Text style={{ color: 'white', fontSize: 12 }}>Submit</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
};

const SecretMenuMessageListConfigItem = ({
  messageListImplementationConfigItem,
  storeMessageListImplementation,
  isSelected,
}: {
  messageListImplementationConfigItem: MessageListImplementationConfigItem;
  storeMessageListImplementation: (item: MessageListImplementationConfigItem) => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    style={[styles.notificationItemContainer, { borderColor: isSelected ? 'green' : 'gray' }]}
    onPress={() => storeMessageListImplementation(messageListImplementationConfigItem)}
  >
    <Text style={styles.notificationItem}>{messageListImplementationConfigItem.label}</Text>
  </TouchableOpacity>
);

export const SecretMenu = ({
  close,
  visible,
  chatClient,
}: {
  close: () => void;
  visible: boolean;
  chatClient: StreamChat;
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedMessageListImplementation, setSelectedMessageListImplementation] = useState<
    string | null
  >(null);
  const {
    theme: {
      colors: { black, grey },
    },
  } = useTheme();

  const notificationConfigItems = useMemo(
    () => [
      { label: 'Firebase', name: 'rn-fcm', id: 'firebase' },
      ...(isAndroid ? [] : [{ label: 'APNs', name: 'APN', id: 'apn' }]),
    ],
    [],
  );

  const messageListImplementationConfigItems = useMemo(
    () => [
      { label: 'FlashList', id: 'flashlist' },
      { label: 'FlatList', id: 'flatlist' },
    ],
    [],
  );

  useEffect(() => {
    const getSelectedConfig = async () => {
      const notificationProvider = await AsyncStore.getItem(
        '@stream-rn-sampleapp-push-provider',
        notificationConfigItems[0],
      );
      const messageListImplementation = await AsyncStore.getItem(
        '@stream-rn-sampleapp-messagelist-implementation',
        messageListImplementationConfigItems[0],
      );
      setSelectedProvider(notificationProvider?.id ?? 'firebase');
      setSelectedMessageListImplementation(messageListImplementation?.id ?? 'flashlist');
    };
    getSelectedConfig();
  }, [notificationConfigItems, messageListImplementationConfigItems]);

  const storeProvider = useCallback(async (item: NotificationConfigItem) => {
    await AsyncStore.setItem('@stream-rn-sampleapp-push-provider', item);
    setSelectedProvider(item.id);
  }, []);

  const storeMessageListImplementation = useCallback(
    async (item: MessageListImplementationConfigItem) => {
      await AsyncStore.setItem('@stream-rn-sampleapp-messagelist-implementation', item);
      setSelectedMessageListImplementation(item.id);
    },
    [],
  );

  const removeAllDevices = useCallback(async () => {
    const { devices } = await chatClient.getDevices(chatClient.userID);
    for (const device of devices ?? []) {
      await chatClient.removeDevice(device.id, chatClient.userID);
    }
  }, [chatClient]);

  return (
    <SlideInView visible={visible}>
      <View style={[menuDrawerStyles.menuItem, { alignItems: 'flex-start' }]}>
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
          <View style={{ marginLeft: 16 }}>
            {notificationConfigItems.map((item) => (
              <SecretMenuNotificationConfigItem
                key={item.id}
                notificationConfigItem={item}
                storeProvider={storeProvider}
                isSelected={item.id === selectedProvider}
              />
            ))}
          </View>
        </View>
      </View>
      <View style={[menuDrawerStyles.menuItem, { alignItems: 'flex-start' }]}>
        <Notification height={24} pathFill={grey} width={24} />
        <View>
          <Text style={[menuDrawerStyles.menuTitle]}>Message List implementation</Text>
          <View style={{ marginLeft: 16 }}>
            {messageListImplementationConfigItems.map((item) => (
              <SecretMenuMessageListConfigItem
                key={item.id}
                messageListImplementationConfigItem={item}
                storeMessageListImplementation={storeMessageListImplementation}
                isSelected={item.id === selectedMessageListImplementation}
              />
            ))}
          </View>
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
  notificationItemContainer: {
    paddingTop: 8,
    marginTop: 12,
    borderRadius: 15,
    borderWidth: 2,
    padding: 8,
    width: 225,
  },
  notificationItem: {
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    marginTop: 8,
    borderRadius: 5,
    backgroundColor: 'lightskyblue',
    padding: 8,
    alignItems: 'center',
  },
});
