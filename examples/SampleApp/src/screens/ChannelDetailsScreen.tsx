import React, { useCallback, useState } from 'react';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ChannelDetails,
  ChannelDetailsActionsSection,
  ChannelDetailsNavigationSection,
  GetChannelDetailsNavigationItems,
  GetChannelMemberActionItems,
  ChannelDetailsContextProvider,
  ChannelDetailsNavigationSectionType,
  ChannelMemberActionsSheet,
  WithComponents,
  ChannelDetailsActionsSectionProps,
  useChannelDetailsContext,
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

const ChannelDetailsScreenInner = () => {
  const navigation = useNavigation<ChannelDetailsScreenNavigationProp>();
  const { channel, closeModals } = useChannelDetailsContext();

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
            closeModals();
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
    [navigation, closeModals],
  );

  const NavigationSection = useCallback(
    (props: Parameters<typeof ChannelDetailsNavigationSection>[0]) => (
      <ChannelDetailsNavigationSection {...props} getNavigationItems={getNavigationItems} />
    ),
    [getNavigationItems],
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
    <WithComponents
      overrides={{
        ChannelDetailsActionsSection: ActionsSection,
        ChannelDetailsNavigationSection: NavigationSection,
        ChannelMemberActionsSheet: MemberActionsSheet,
      }}
    >
      <ChannelDetails onBack={onBack} />
    </WithComponents>
  );
};

export const ChannelDetailsScreen: React.FC<Props> = ({
  route: {
    params: { channel },
  },
}) => {
  return (
    <ChannelDetailsContextProvider channel={channel}>
      <ChannelDetailsScreenInner />
    </ChannelDetailsContextProvider>
  );
};
