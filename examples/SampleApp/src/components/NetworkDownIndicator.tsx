import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

  return (
    <View style={styles.networkDownContainer} testID='network-down-indicator'>
      <Text
        style={[
          styles.networkDownText,
          titleSize === 'large' ? styles.networkDownTextLarge : {},
        ]}
      >
        Searching for Network
      </Text>
    </View>
  );
};
