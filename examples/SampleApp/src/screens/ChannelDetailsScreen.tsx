import React, { useCallback, useState } from 'react';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ChannelDetails,
  ChannelDetailsNavigationSectionProps,
  GetChannelMemberActionItems,
  ChannelAddMembersModal,
  ChannelAllMembersModal,
  ChannelDetailsContextProvider,
  useChannelDetailsContext,
  ChannelDetailsNavigationSection,
  WithComponents,
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

const NavSection = (props: ChannelDetailsNavigationSectionProps) => {
  const navigation = useNavigation();
  const { channel } = useChannelDetailsContext();

  const onPress = useCallback(
    (section: ChannelDetailsNavigationSectionType) => {
      switch (section) {
        case 'pinned-messages':
          navigation.navigate('ChannelPinnedMessagesScreen', { channel });
          break;
        case 'photos-and-videos':
          navigation.navigate('ChannelImagesScreen', { channel });
          break;
        case 'files':
          navigation.navigate('ChannelFilesScreen', { channel });
          break;
        default:
          break;
      }
    },
    [navigation, channel],
  );

  return <ChannelDetailsNavigationSection {...props} onPress={onPress} />;
};

export const ChannelDetailsScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const onBack = useCallback(() => navigation.goBack(), [navigation]);
  const popToRoot = useCallback(
    () =>
      navigation.reset({
        index: 0,
        routes: [{ name: 'MessagingScreen' }],
      }),
    [navigation],
  );
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

  return (
    <>
      <WithComponents overrides={{ ChannelDetailsNavigationSection: NavSection }}>
        <ChannelDetails
          channel={channel}
          getChannelMemberActionItems={getChannelMemberActionItems}
          onBack={onBack}
          onChannelDismiss={popToRoot}
          // Handler view all members modal so we can close it after navigation is triggered by our custom action
          onViewAllMembersPress={handleAllMembersPress}
        />
      </WithComponents>
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
};
