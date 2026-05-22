import React, { useMemo } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { SafeAreaViewWrapper } from '../../../UIComponents/SafeAreaViewWrapper';

type ChannelDetailsModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
};

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
        <SafeAreaViewWrapper style={rootStyle}>
          <View style={[styles.body, bodyOverride]}>{children}</View>
        </SafeAreaViewWrapper>
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
