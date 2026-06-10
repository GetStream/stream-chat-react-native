import React, { useMemo } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

type ChannelDetailsModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsModal = ({ children, onClose, visible }: ChannelDetailsModalProps) => {
  const {
    theme: {
      channelDetailsScreen: {
        modal: { body: bodyOverride, root: rootOverride },
      },
      semantics,
    },
  } = useTheme();
  const rootStyle = useMemo(
    () =>
      StyleSheet.flatten([
        styles.root,
        { backgroundColor: semantics.backgroundCoreElevation1 },
        rootOverride,
      ]),
    [rootOverride, semantics.backgroundCoreElevation1],
  );

  return (
    <Modal
      animationType='slide'
      onRequestClose={onClose}
      presentationStyle='pageSheet'
      visible={visible}
    >
      <GestureHandlerRootView style={rootStyle}>
        <View style={[styles.body, bodyOverride]}>{children}</View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
});
