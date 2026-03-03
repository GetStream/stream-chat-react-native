import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ChannelPreviewMessenger,
  ChannelPreviewMessengerProps,
  ChannelPreviewStatus,
  ChannelPreviewStatusProps,
  Pin,
  useChannelMembershipState,
  useTheme,
} from 'stream-chat-react-native';

const styles = StyleSheet.create({
  leftSwipeableButton: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 20,
  },
  rightSwipeableButton: {
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 20,
  },
  swipeableContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  pinIconContainer: {
    marginLeft: 8,
  },
});

const CustomChannelPreviewStatus = (props: ChannelPreviewStatusProps) => {
  const { channel } = props;

  const membership = useChannelMembershipState(channel);
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <View style={styles.statusContainer}>
      <ChannelPreviewStatus {...props} />
      {membership.pinned_at && (
        <View style={styles.pinIconContainer}>
          <Pin height={24} width={24} stroke={semantics.textSecondary} />
        </View>
      )}
    </View>
  );
};

export const ChannelPreview: React.FC<ChannelPreviewMessengerProps> = (props) => {
  return <ChannelPreviewMessenger {...props} PreviewStatus={CustomChannelPreviewStatus} />;
};
