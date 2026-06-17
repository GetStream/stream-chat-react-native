import React, { useCallback, useContext, useState } from 'react';

import { useRouter } from 'expo-router';

import {
  ChannelAddMembersModal,
  ChannelAllMembersModal,
  ChannelDetails,
  ChannelDetailsContextProvider,
  ChannelDetailsNavigationSectionType,
  GetChannelDetailsNavigationItems,
  GetChannelMemberActionItems,
} from 'stream-chat-expo';

import { AppContext } from '../../../../context/AppContext';

const navigationItems: {
  [key in ChannelDetailsNavigationSectionType]: 'pinned' | 'images' | 'files';
} = {
  'pinned-messages': 'pinned',
  'photos-and-videos': 'images',
  files: 'files',
};

export default function ChannelDetailsScreen() {
  const router = useRouter();
  const { channel } = useContext(AppContext);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

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

  const [isAddMembersVisible, setAddMembersVisible] = useState(false);
  const handleAddMembersClose = useCallback(() => setAddMembersVisible(false), []);
  const handleAddMembersPress = useCallback(() => {
    setAllMembersVisible(false);
    setAddMembersVisible(true);
  }, []);

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
      <ChannelDetails
        channel={channel}
        getChannelMemberActionItems={getChannelMemberActionItems}
        getNavigationItems={getNavigationItems}
        onBack={onBack}
        onChannelDismiss={popToRoot}
        onViewAllMembersPress={handleAllMembersPress}
      />
      <ChannelDetailsContextProvider value={{ channel, getChannelMemberActionItems }}>
        <ChannelAllMembersModal
          onClose={handleAllMembersClose}
          visible={isAllMembersVisible}
          onAddMembersPress={handleAddMembersPress}
        />
        <ChannelAddMembersModal onClose={handleAddMembersClose} visible={isAddMembersVisible} />
      </ChannelDetailsContextProvider>
    </>
  );
}
