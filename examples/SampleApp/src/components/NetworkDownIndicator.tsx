import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spinner, useTheme } from 'stream-chat-react-native';

const styles = StyleSheet.create({
  networkDownContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  networkDownText: {
    fontSize: 12,
    marginLeft: 4,
  },
  networkDownTextLarge: {
    fontSize: 16,
    fontWeight: '700',
  },
  spinner: {
    backgroundColor: 'white',
  },
});

export const NetworkDownIndicator: React.FC<{ titleSize: 'small' | 'large' }> = ({
  titleSize = 'small',
}) => {
  const {
    theme: {
      colors: { black },
    },
  } = useTheme();

  return (
    <View style={styles.networkDownContainer} testID='network-down-indicator'>
      <Spinner height={12} style={styles.spinner} width={12} />
      <Text
        style={[
          styles.networkDownText,
          {
            color: black,
          },
          titleSize === 'large' ? styles.networkDownTextLarge : {},
        ]}
      >
        Searching for Network
      </Text>
    </View>
  );
};
