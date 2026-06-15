import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

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
      channelDetails: {
        modal: { body: bodyOverride },
      },
    },
  } = useTheme();

  return (
    <Modal
      animationType='slide'
      onRequestClose={onClose}
      presentationStyle='pageSheet'
      visible={visible}
    >
      <View style={[styles.body, bodyOverride]}>{children}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
