import React, { useCallback, useContext, useState } from 'react';

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
  useCanEditChannel,
  useIsDirectChat,
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
  const canEdit = useCanEditChannel(channel);
  const isDirect = useIsDirectChat(channel);
  const isEditButtonVisible = canEdit && !isDirect;

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
        <ChannelDetailsContextProvider channel={channel}>
          <ChannelDetailsEditButton style={{ flexShrink: 0, width: 'auto' }} />
        </ChannelDetailsContextProvider>
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
          headerRight: isEditButtonVisible ? renderHeaderRight : undefined,
        }}
      />
      <ChannelDetailsContextProvider channel={channel}>
        <WithComponents
          overrides={{
            ChannelDetailsActionsSection: ActionsSection,
            ChannelDetailsMemberSection: MemberSection,
            ChannelDetailsNavHeader: EmptyHeader,
            ChannelDetailsNavigationSection: NavigationSection,
          }}
        >
          <ChannelDetails />
          <ChannelAllMembersModal onClose={handleAllMembersClose} visible={isAllMembersVisible} />
        </WithComponents>
      </ChannelDetailsContextProvider>
    </>
  );
}
