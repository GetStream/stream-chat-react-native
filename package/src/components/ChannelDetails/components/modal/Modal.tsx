import React, { useMemo } from 'react';
import { Modal } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

type ChannelDetailsModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
  presentationStyle?: 'pageSheet' | 'formSheet' | 'fullScreen';
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const ChannelDetailsModal = ({
  children,
  onClose,
  visible,
  presentationStyle = 'pageSheet',
}: ChannelDetailsModalProps) => {
  const {
    theme: {
      channelDetails: {
        modal: { body: bodyOverride },
      },
    },
  } = useTheme();
  const styles = useStyles();
  const { top } = useSafeAreaInsets();

  return (
    <Modal
      animationType='slide'
      onRequestClose={onClose}
      presentationStyle={presentationStyle}
      visible={visible}
    >
      <GestureHandlerRootView
        style={[
          styles.body,
          presentationStyle === 'fullScreen' ? { paddingTop: top } : {},
          bodyOverride,
        ]}
      >
        {children}
      </GestureHandlerRootView>
    </Modal>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () => ({
      body: {
        flex: 1,
        backgroundColor: semantics.backgroundCoreElevation1,
      },
    }),
    [semantics],
  );
};
