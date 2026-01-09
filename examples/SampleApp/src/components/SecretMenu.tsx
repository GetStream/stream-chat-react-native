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
  ScrollView,
} from 'react-native';
import { Close, Edit, Notification, Delete, Folder, ZIP, useTheme } from 'stream-chat-react-native';
import { styles as menuDrawerStyles } from './MenuDrawer.tsx';
import AsyncStore from '../utils/AsyncStore.ts';
import { StreamChat } from 'stream-chat';
import { LabeledTextInput } from '../screens/AdvancedUserSelectorScreen.tsx';

const isAndroid = Platform.OS === 'android';

export type NotificationConfigItem = { label: string; name: string; id: string };
export type MessageListImplementationConfigItem = { label: string; id: 'flatlist' | 'flashlist' };
export type MessageListModeConfigItem = { label: string; mode: 'default' | 'livestream' };
export type MessageListPruningConfigItem = { label: string; value: 100 | 500 | 1000 | undefined };
export type MessageInputFloatingConfigItem = { label: string; value: boolean };

const messageListImplementationConfigItems: MessageListImplementationConfigItem[] = [
  { label: 'FlatList', id: 'flatlist' },
  { label: 'FlashList', id: 'flashlist' },
];

const messageListModeConfigItems: MessageListModeConfigItem[] = [
  { label: 'Default', mode: 'default' },
  { label: 'Livestreaming', mode: 'livestream' },
];

const messageListPruningConfigItems: MessageListPruningConfigItem[] = [
  { label: 'None', value: undefined },
  { label: '100 Messages', value: 100 },
  { label: '500 Messages', value: 500 },
  { label: '1000 Messages', value: 1000 },
];

const messageInputFloatingConfigItems: MessageInputFloatingConfigItem[] = [
  { label: 'Normal', value: false },
  { label: 'Floating', value: true },
];

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

const SecretMenuMessageListImplementationConfigItem = ({
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

const SecretMenuMessageInputFloatingConfigItem = ({
  messageInputFloatingConfigItem,
  storeMessageInputFloating,
  isSelected,
}: {
  messageInputFloatingConfigItem: MessageInputFloatingConfigItem;
  storeMessageInputFloating: (item: MessageInputFloatingConfigItem) => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    style={[styles.notificationItemContainer, { borderColor: isSelected ? 'green' : 'gray' }]}
    onPress={() => storeMessageInputFloating(messageInputFloatingConfigItem)}
  >
    <Text style={styles.notificationItem}>{messageInputFloatingConfigItem.label}</Text>
  </TouchableOpacity>
);

const SecretMenuMessageListModeConfigItem = ({
  messageListModeConfigItem,
  storeMessageListMode,
  isSelected,
}: {
  messageListModeConfigItem: MessageListModeConfigItem;
  storeMessageListMode: (item: MessageListModeConfigItem) => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    style={[styles.notificationItemContainer, { borderColor: isSelected ? 'green' : 'gray' }]}
    onPress={() => storeMessageListMode(messageListModeConfigItem)}
  >
    <Text style={styles.notificationItem}>{messageListModeConfigItem.label}</Text>
  </TouchableOpacity>
);

const SecretMenuMessageListPruningConfigItem = ({
  messageListPruningConfigItem,
  storeMessageListPruning,
  isSelected,
}: {
  messageListPruningConfigItem: MessageListPruningConfigItem;
  storeMessageListPruning: (item: MessageListPruningConfigItem) => void;
  isSelected: boolean;
}) => (
  <TouchableOpacity
    style={[styles.notificationItemContainer, { borderColor: isSelected ? 'green' : 'gray' }]}
    onPress={() => storeMessageListPruning(messageListPruningConfigItem)}
  >
    <Text style={styles.notificationItem}>{messageListPruningConfigItem.label}</Text>
  </TouchableOpacity>
);

/*
 * TODO: Please rewrite this entire component.
 */

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
    MessageListImplementationConfigItem['id'] | null
  >(null);
  const [selectedMessageListMode, setSelectedMessageListMode] = useState<
    MessageListModeConfigItem['mode'] | null
  >(null);
  const [selectedMessageListPruning, setSelectedMessageListPruning] = useState<
    MessageListPruningConfigItem['value'] | null
  >(null);
  const [selectedMessageInputFloating, setSelectedMessageInputFloating] =
    useState<MessageInputFloatingConfigItem['value']>(false);
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
      const messageListMode = await AsyncStore.getItem(
        '@stream-rn-sampleapp-messagelist-mode',
        messageListModeConfigItems[0],
      );
      const messageListPruning = await AsyncStore.getItem(
        '@stream-rn-sampleapp-messagelist-pruning',
        messageListPruningConfigItems[0],
      );
      const messageInputFloating = await AsyncStore.getItem(
        '@stream-rn-sampleapp-messageinput-floating',
        messageInputFloatingConfigItems[0],
      );
      setSelectedProvider(notificationProvider?.id ?? notificationConfigItems[0].id);
      setSelectedMessageListImplementation(
        messageListImplementation?.id ?? messageListImplementationConfigItems[0].id,
      );
      setSelectedMessageListMode(messageListMode?.mode ?? messageListModeConfigItems[0].mode);
      setSelectedMessageListPruning(messageListPruning?.value);
      setSelectedMessageInputFloating(
        messageInputFloating?.value ?? messageInputFloatingConfigItems[0].value,
      );
    };
    getSelectedConfig();
  }, [notificationConfigItems]);

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

  const storeMessageListMode = useCallback(async (item: MessageListModeConfigItem) => {
    await AsyncStore.setItem('@stream-rn-sampleapp-messagelist-mode', item);
    setSelectedMessageListMode(item.mode);
  }, []);

  const storeMessageListPruning = useCallback(async (item: MessageListPruningConfigItem) => {
    await AsyncStore.setItem('@stream-rn-sampleapp-messagelist-pruning', item);
    setSelectedMessageListPruning(item.value);
  }, []);

  const storeMessageInputFloating = useCallback(async (item: MessageInputFloatingConfigItem) => {
    await AsyncStore.setItem('@stream-rn-sampleapp-messageinput-floating', item);
    setSelectedMessageInputFloating(item.value);
  }, []);

  const removeAllDevices = useCallback(async () => {
    const { devices } = await chatClient.getDevices(chatClient.userID);
    for (const device of devices ?? []) {
      await chatClient.removeDevice(device.id, chatClient.userID);
    }
  }, [chatClient]);

  return (
    <SlideInView visible={visible}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ height: 500 }}>
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
          <Folder height={20} pathFill={grey} width={20} />
          <View>
            <Text style={[menuDrawerStyles.menuTitle]}>Message List implementation</Text>
            <View style={{ marginLeft: 16 }}>
              {messageListImplementationConfigItems.map((item) => (
                <SecretMenuMessageListImplementationConfigItem
                  key={item.id}
                  messageListImplementationConfigItem={item}
                  storeMessageListImplementation={storeMessageListImplementation}
                  isSelected={item.id === selectedMessageListImplementation}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={[menuDrawerStyles.menuItem, { alignItems: 'flex-start' }]}>
          <Folder height={20} pathFill={grey} width={20} />
          <View>
            <Text style={[menuDrawerStyles.menuTitle]}>Message Input Floating</Text>
            <View style={{ marginLeft: 16 }}>
              {messageInputFloatingConfigItems.map((item) => (
                <SecretMenuMessageInputFloatingConfigItem
                  key={item.value.toString()}
                  messageInputFloatingConfigItem={item}
                  storeMessageInputFloating={storeMessageInputFloating}
                  isSelected={item.value === selectedMessageInputFloating}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={[menuDrawerStyles.menuItem, { alignItems: 'flex-start' }]}>
          <Edit height={20} pathFill={grey} width={20} />
          <View>
            <Text style={[menuDrawerStyles.menuTitle]}>Message List mode</Text>
            <View style={{ marginLeft: 16 }}>
              {messageListModeConfigItems.map((item) => (
                <SecretMenuMessageListModeConfigItem
                  key={item.mode}
                  messageListModeConfigItem={item}
                  storeMessageListMode={storeMessageListMode}
                  isSelected={item.mode === selectedMessageListMode}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={[menuDrawerStyles.menuItem, { alignItems: 'flex-start' }]}>
          <ZIP height={20} pathFill={grey} width={20} />
          <View>
            <Text style={[menuDrawerStyles.menuTitle]}>Message List pruning</Text>
            <View style={{ marginLeft: 16 }}>
              {messageListPruningConfigItems.map((item) => (
                <SecretMenuMessageListPruningConfigItem
                  key={item.value ?? 0}
                  messageListPruningConfigItem={item}
                  storeMessageListPruning={storeMessageListPruning}
                  isSelected={item.value === selectedMessageListPruning}
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
      </ScrollView>
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
