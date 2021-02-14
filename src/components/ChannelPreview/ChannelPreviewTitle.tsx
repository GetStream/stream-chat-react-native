import React from 'react';
import { useTheme } from '../../contexts';
import { StyleSheet, Text } from 'react-native';

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700' },
});

export type ChannelPreviewTitleProps = {
  displayName: string;
};
export const ChannelPreviewTitle: React.FC<ChannelPreviewTitleProps> = ({
  displayName,
}) => {
  const {
    theme: {
      channelPreview: { title },
      colors: { black },
    },
  } = useTheme();
  return (
    <Text numberOfLines={1} style={[styles.title, { color: black }, title]}>
      {displayName}
    </Text>
  );
};
