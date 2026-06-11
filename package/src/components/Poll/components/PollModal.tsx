import React, { PropsWithChildren, useMemo } from 'react';
import { Modal, ModalProps, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../../contexts';
import { SafeAreaViewWrapper } from '../../UIComponents/SafeAreaViewWrapper';

export type PollModalProps = PropsWithChildren<{
  animationType?: ModalProps['animationType'];
  onRequestClose?: () => void;
  visible?: boolean;
}>;

export const PollModal = ({
  animationType = 'slide',
  children,
  onRequestClose,
  visible,
}: PollModalProps) => {
  const styles = useStyles();

  return (
    <Modal
      animationType={animationType}
      navigationBarTranslucent
      onRequestClose={onRequestClose}
      presentationStyle='pageSheet'
      statusBarTranslucent
      visible={visible}
    >
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaViewWrapper style={styles.safeArea}>{children}</SafeAreaViewWrapper>
      </GestureHandlerRootView>
    </Modal>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        safeArea: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreElevation1,
        },
      }),
    [semantics],
  );
};
