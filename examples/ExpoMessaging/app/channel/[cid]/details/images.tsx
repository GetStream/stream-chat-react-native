import { useContext } from 'react';

import { Stack } from 'expo-router';

import { ChannelDetailsContextProvider, MediaList, useTheme } from 'stream-chat-expo';

import { AppContext } from '../../../../context/AppContext';

export default function ChannelImagesScreen() {
  const {
    theme: { semantics },
  } = useTheme();
  const { channel } = useContext(AppContext);

  if (!channel) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ contentStyle: { backgroundColor: semantics.backgroundCoreApp } }} />
      <ChannelDetailsContextProvider value={{ channel }}>
        <MediaList />
      </ChannelDetailsContextProvider>
    </>
  );
}
