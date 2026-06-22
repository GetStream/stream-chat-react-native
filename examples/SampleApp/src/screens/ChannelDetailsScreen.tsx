import React, { useCallback, useState } from 'react';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ChannelDetails,
  ChannelDetailsActionsSection,
  ChannelDetailsMemberSection,
  ChannelDetailsNavigationSection,
  GetChannelDetailsNavigationItems,
  GetChannelMemberActionItems,
  ChannelAllMembersModal,
  ChannelDetailsContextProvider,
  ChannelDetailsNavigationSectionType,
  ChannelMemberActionsSheet,
  WithComponents,
  ChannelDetailsActionsSectionProps,
} from 'stream-chat-react-native';

import { SendDirectMessage } from '../icons/SendDirectMessage';

import type { StackNavigatorParamList } from '../types';

type ChannelDetailsScreenRouteProp = RouteProp<StackNavigatorParamList, 'ChannelDetailsScreen'>;

type ChannelDetailsScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'ChannelDetailsScreen'
>;

type Props = {
  navigation: ChannelDetailsScreenNavigationProp;
  route: ChannelDetailsScreenRouteProp;
};

const navigationItems: {
  [key in ChannelDetailsNavigationSectionType]:
    | 'ChannelPinnedMessagesScreen'
    | 'ChannelImagesScreen'
    | 'ChannelFilesScreen';
} = {
  'pinned-messages': 'ChannelPinnedMessagesScreen',
  'photos-and-videos': 'ChannelImagesScreen',
  files: 'ChannelFilesScreen',
};

export const ChannelDetailsScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const onBack = useCallback(() => navigation.goBack(), [navigation]);
  const getNavigationItems = useCallback<GetChannelDetailsNavigationItems>(
    ({ defaultItems }) =>
      defaultItems.map((item) => ({
        ...item,
        ...(navigationItems[item.section]
          ? { onPress: () => navigation.navigate(navigationItems[item.section], { channel }) }
          : {}),
      })),
    [navigation, channel],
  );
  const popToRoot = useCallback(
    () =>
      navigation.reset({
        index: 0,
        routes: [{ name: 'MessagingScreen' }],
      }),
    [navigation],
  );
  const [isAllMembersVisible, setAllMembersVisible] = useState(false);
  const handleAllMembersClose = useCallback(() => setAllMembersVisible(false), []);
  const handleAllMembersPress = useCallback(() => setAllMembersVisible(true), []);

  const ActionsSection = useCallback(
    (props: ChannelDetailsActionsSectionProps) => (
      <ChannelDetailsActionsSection {...props} onChannelDismiss={popToRoot} />
    ),
    [popToRoot],
  );

  const getChannelMemberActionItems = useCallback<GetChannelMemberActionItems>(
    ({ context, defaultItems }) => {
      // Don't offer sending a direct message to yourself.
      if (context.isCurrentUser) {
        return defaultItems;
      }
      const user = context.member.user;
      return [
        {
          action: () => {
            setAllMembersVisible(false);
            navigation.navigate('NewDirectMessagingScreen', { initialUser: user });
            return Promise.resolve();
          },
          Icon: SendDirectMessage,
          id: 'sendDirectMessage',
          label: context.t('Send Direct Message'),
          type: 'standard',
        },
        ...defaultItems,
      ];
    },
    [navigation],
  );

  const NavigationSection = useCallback(
    (props: Parameters<typeof ChannelDetailsNavigationSection>[0]) => (
      <ChannelDetailsNavigationSection {...props} getNavigationItems={getNavigationItems} />
    ),
    [getNavigationItems],
  );

  // Handle view all members modal so we can close it after navigation is triggered by our custom action.
  const MemberSection = useCallback(
    (props: Parameters<typeof ChannelDetailsMemberSection>[0]) => (
      <ChannelDetailsMemberSection {...props} onViewAllMembersPress={handleAllMembersPress} />
    ),
    [handleAllMembersPress],
  );

  const MemberActionsSheet = useCallback(
    (props: Parameters<typeof ChannelMemberActionsSheet>[0]) => (
      <ChannelMemberActionsSheet
        {...props}
        getChannelMemberActionItems={getChannelMemberActionItems}
      />
    ),
    [getChannelMemberActionItems],
  );

  return (
    <ChannelDetailsContextProvider channel={channel}>
      <WithComponents
        overrides={{
          ChannelDetailsActionsSection: ActionsSection,
          ChannelDetailsMemberSection: MemberSection,
          ChannelDetailsNavigationSection: NavigationSection,
          ChannelMemberActionsSheet: MemberActionsSheet,
        }}
      >
        <ChannelDetails onBack={onBack} />
        <ChannelAllMembersModal onClose={handleAllMembersClose} visible={isAllMembersVisible} />
      </WithComponents>
    </ChannelDetailsContextProvider>
  );
};
