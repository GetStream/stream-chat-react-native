import { RouteProp } from '@react-navigation/native';
import React from 'react';
import { useContext } from 'react';
import { getChannelPreviewDisplayName } from '../../../../src/v2';
import { ScreenHeader } from '../components/ScreenHeader';
import { AppContext } from '../context/AppContext';
import { StackNavigatorParamList } from '../types';

type GroupChannelDetailsRouteProp = RouteProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

type GroupChannelDetailsProps = {
  route: GroupChannelDetailsRouteProp;
};

export const GroupChannelDetailsScreen: React.FC<GroupChannelDetailsProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { chatClient } = useContext(AppContext);
  const memberCount = Object.keys(channel.state.members).length;
  return (
    <>
      <ScreenHeader
        subtitle={`${memberCount} members`}
        title={getChannelPreviewDisplayName(channel, chatClient)}
      />
    </>
  );
};
