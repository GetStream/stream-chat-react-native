import React, { useEffect, useMemo } from 'react';
import { Modal, Platform } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useChannelDetailsContext } from '../../../../contexts/channelDetailsContext/channelDetailsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';

type ChannelDetailsModalProps = {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
  presentationStyle?: 'pageSheet' | 'formSheet' | 'fullScreen';
};

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
  const { signalStore } = useChannelDetailsContext();

  useEffect(() => {
    const unsubscribe = signalStore.state.subscribeWithSelector(
      (state) => ({ signal: state.signal }),
      ({ signal }) => {
        if (signal) {
          onClose();
        }
      },
    );
    return unsubscribe;
  }, [signalStore, onClose]);

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
          presentationStyle === 'fullScreen' || Platform.OS === 'android'
            ? { paddingTop: top }
            : {},
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
