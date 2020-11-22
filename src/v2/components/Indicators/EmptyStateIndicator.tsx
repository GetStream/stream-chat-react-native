import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { MessageIcon } from '../../icons/MessageIcon';
import { vw } from '../../utils/utils';

const width = vw(33);

const styles = StyleSheet.create({
  channelContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  channelDetails: {
    color: '#7A7A7A',
    fontSize: 14,
    textAlign: 'center',
    width: vw(66),
  },
  channelTitle: {
    fontSize: 16,
    paddingBottom: 8,
    paddingTop: 16,
  },
});

export type EmptyStateProps = {
  listType?: 'channel' | 'message' | 'default';
};

export const EmptyStateIndicator: React.FC<EmptyStateProps> = ({
  listType,
}) => {
  const {
    theme: {
      emptyStateIndicator: { channelContainer, channelDetails, channelTitle },
    },
  } = useTheme();

  switch (listType) {
    case 'channel':
      return (
        <View style={[styles.channelContainer, channelContainer]}>
          <MessageIcon height={width} pathFill='#DBDBDB' width={width} />
          <Text
            style={[styles.channelTitle, channelTitle]}
            testID='empty-channel-state-title'
          >
            {"Let's start chatting!"}
          </Text>
          <Text
            style={[styles.channelDetails, channelDetails]}
            testID='empty-channel-state-details'
          >
            {'How about sending your first message to a friend?'}
          </Text>
        </View>
      );
    case 'message':
      return null;
    default:
      return <Text>No items exist</Text>;
  }
};
