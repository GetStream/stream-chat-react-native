import React, { useCallback, useContext, useState } from 'react';

import { Stack, useRouter } from 'expo-router';

import {
  ChannelAllMembersModal,
  ChannelDetails,
  ChannelDetailsContextProvider,
  ChannelDetailsNavigationSectionType,
  GetChannelDetailsNavigationItems,
  GetChannelMemberActionItems,
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

const Header = () => {
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

  const getChannelMemberActionItems = useCallback<GetChannelMemberActionItems>(
    ({ defaultItems }) => defaultItems,
    [],
  );

  if (!channel) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Channel details',
        }}
      />
      <WithComponents overrides={{ ChannelDetailsNavHeader: Header }}>
        <ChannelDetails
          channel={channel}
          getChannelMemberActionItems={getChannelMemberActionItems}
          getNavigationItems={getNavigationItems}
          onChannelDismiss={popToRoot}
          onViewAllMembersPress={handleAllMembersPress}
        />
      </WithComponents>
      <ChannelDetailsContextProvider value={{ channel, getChannelMemberActionItems }}>
        <ChannelAllMembersModal onClose={handleAllMembersClose} visible={isAllMembersVisible} />
      </ChannelDetailsContextProvider>
    </>
  );
}
