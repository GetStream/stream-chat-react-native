import React, { useCallback, useContext, useState } from 'react';

import { View } from 'react-native';

import { Stack, useRouter } from 'expo-router';

import {
  ChannelAllMembersModal,
  ChannelDetails,
  ChannelDetailsActionsSection,
  ChannelDetailsContextProvider,
  ChannelDetailsMemberSection,
  ChannelDetailsNavigationSection,
  ChannelDetailsNavigationSectionType,
  GetChannelDetailsNavigationItems,
  ChannelDetailsEditButton,
  WithComponents,
} from 'stream-chat-expo';

import { AppContext } from '../../../../context/AppContext';

const navigationItems: {
  [key in ChannelDetailsNavigationSectionType]: 'pinned' | 'images' | 'files';
} = {
  'pinned-messages': 'pinned',
  'photos-and-videos': 'images',
  files: 'files',
};

const EmptyHeader = () => {
  return null;
};

export default function ChannelDetailsScreen() {
  const router = useRouter();
  const { channel } = useContext(AppContext);

  const getNavigationItems = useCallback<GetChannelDetailsNavigationItems>(
    ({ defaultItems }) =>
      defaultItems.map((item) => {
        const subRoute = navigationItems[item.section];
        if (!subRoute || !channel?.cid) {
          return item;
        }
        return {
          ...item,
          onPress: () => router.push(`/channel/${channel.cid}/details/${subRoute}`),
        };
      }),
    [router, channel?.cid],
  );

  const popToRoot = useCallback(() => router.replace('/'), [router]);

  const [isAllMembersVisible, setAllMembersVisible] = useState(false);
  const handleAllMembersClose = useCallback(() => setAllMembersVisible(false), []);
  const handleAllMembersPress = useCallback(() => setAllMembersVisible(true), []);

  const NavigationSection = useCallback(
    () => <ChannelDetailsNavigationSection getNavigationItems={getNavigationItems} />,
    [getNavigationItems],
  );

  const MemberSection = useCallback(
    () => <ChannelDetailsMemberSection onViewAllMembersPress={handleAllMembersPress} />,
    [handleAllMembersPress],
  );

  const renderHeaderRight = useCallback(
    () =>
      channel ? (
        <View style={{ flexGrow: 0, flexShrink: 0 }}>
          <ChannelDetailsContextProvider value={{ channel }}>
            <ChannelDetailsEditButton />
          </ChannelDetailsContextProvider>
        </View>
      ) : null,
    [channel],
  );

  const ActionsSection = useCallback(
    () => <ChannelDetailsActionsSection onChannelDismiss={popToRoot} />,
    [popToRoot],
  );

  if (!channel) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Channel details',
          headerRight: renderHeaderRight,
        }}
      />
      <WithComponents
        overrides={{
          ChannelDetailsActionsSection: ActionsSection,
          ChannelDetailsMemberSection: MemberSection,
          ChannelDetailsNavHeader: EmptyHeader,
          ChannelDetailsNavigationSection: NavigationSection,
        }}
      >
        <ChannelDetails channel={channel} />
      </WithComponents>
      <ChannelDetailsContextProvider value={{ channel }}>
        <ChannelAllMembersModal onClose={handleAllMembersClose} visible={isAllMembersVisible} />
      </ChannelDetailsContextProvider>
    </>
  );
}
