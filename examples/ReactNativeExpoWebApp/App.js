import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Platform,
  SafeAreaView as SafeAreaViewMobile,
} from 'react-native';

import { ProgressControl } from './components/ProgressControl';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView as SafeAreaViewWeb, Button } from 'react-native-web';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ChannelList, Chat, OverlayProvider } from 'stream-chat-expo';
import { chatApiKey, chatUserId } from './chatConfig';
import { StreamChat } from 'stream-chat';
import { useChatClient } from './useChatClient';

const Stack = createStackNavigator();

const chatClient = StreamChat.getInstance(chatApiKey);

const filters = {
  members: {
    $in: [chatUserId],
  },
};

const sort = {
  last_message_at: -1,
};

const NavigationStack = () => {
  const { clientIsReady } = useChatClient();
  if (!clientIsReady) {
    return <Text>Loading chat ...</Text>;
  }
  return (
    <OverlayProvider>
      <Chat client={chatClient} enableOfflineSupport={false}>
        <Stack.Navigator>
          <Stack.Screen name='ChannelList' component={ChannelListScreen} />
          <Stack.Screen name='Home' component={HomeScreen} />
        </Stack.Navigator>
      </Chat>
    </OverlayProvider>
  );
};

const SafeAreaView = Platform.OS === 'web' ? SafeAreaViewWeb : SafeAreaViewMobile;

export default () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <NavigationStack />
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

function HomeScreen() {
  const [progress, setProgress] = React.useState(0);
  const [image, setImage] = React.useState(null);
  let videoRef = useRef(null);

  const _handleVideoRef = (component) => {
    videoRef = component;
  };

  return (
    <View style={{ margin: 50 }}>
      <ProgressControl
        duration={180}
        progress={progress}
        onProgressDrag={(value) => {
          setProgress(value);
        }}
      />
      <Video
        ref={_handleVideoRef}
        source={
          'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        }
      />
      <Button
        title='submit'
        onPress={async () => {
          const permissionCheck = await ImagePicker.getCameraPermissionsAsync();
          const permissionGranted =
            permissionCheck?.status === 'granted'
              ? permissionCheck
              : await ImagePicker.requestCameraPermissionsAsync();
          if (permissionGranted?.status === 'granted' || permissionGranted?.granted === true) {
            const photo = await ImagePicker.launchCameraAsync({
              quality: Math.min(Math.max(0, 1), 1),
            });
            console.log(photo);
          }
        }}
      />
    </View>
  );
}

const ChannelListScreen = () => {
  return <ChannelList filters={filters} sort={sort} />;
};
