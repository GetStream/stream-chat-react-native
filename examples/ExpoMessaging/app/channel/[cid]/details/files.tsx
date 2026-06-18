import { useContext } from 'react';

import { Stack } from 'expo-router';

import { ChannelDetailsContextProvider, FileAttachmentList, useTheme } from 'stream-chat-expo';

import { AppContext } from '../../../../context/AppContext';

export default function ChannelFilesScreen() {
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
        <FileAttachmentList />
      </ChannelDetailsContextProvider>
    </>
  );
}
