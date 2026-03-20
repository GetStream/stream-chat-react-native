import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal, Delete, useStableCallback, useTheme } from 'stream-chat-react-native';

import { UserMinus } from '../icons/UserMinus';

const SHEET_HEIGHT = 224;

export type ConfirmationData = {
  onConfirm: () => void;
  title: string;
  cancelText?: string;
  confirmText?: string;
  subtext?: string;
};

type ConfirmationBottomSheetProps = {
  onClose: () => void;
  visible: boolean;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  subtext?: string;
  title?: string;
};

export const ConfirmationBottomSheet = React.memo(
  ({
    cancelText = 'CANCEL',
    confirmText = 'CONFIRM',
    onClose,
    onConfirm,
    subtext,
    title,
    visible,
  }: ConfirmationBottomSheetProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();
    const stableOnClose = useStableCallback(onClose);

    const handleCancel = useCallback(() => {
      stableOnClose();
    }, [stableOnClose]);

    const handleConfirm = useCallback(() => {
      onConfirm?.();
      stableOnClose();
    }, [onConfirm, stableOnClose]);

    const isLeave = confirmText === 'LEAVE';

    return (
      <BottomSheetModal visible={visible} onClose={stableOnClose} height={SHEET_HEIGHT}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.description}>
            {isLeave ? (
              <UserMinus pathFill={semantics.textSecondary} />
            ) : (
              <Delete height={20} width={20} stroke={semantics.accentError} />
            )}
            <Text style={[styles.title, { color: semantics.textPrimary }]}>{title}</Text>
            {subtext ? (
              <Text style={[styles.subtext, { color: semantics.textPrimary }]}>{subtext}</Text>
            ) : null}
          </View>
          <View style={[styles.actions, { borderTopColor: semantics.borderCoreDefault }]}>
            <Pressable onPress={handleCancel} style={styles.actionButton}>
              <Text style={[styles.actionText, { color: semantics.textSecondary }]}>
                {cancelText}
              </Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.actionButton}>
              <Text style={[styles.actionText, { color: semantics.accentError }]}>
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </BottomSheetModal>
    );
  },
);

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        actionButton: {
          padding: 20,
        },
        actionText: {
          fontSize: 14,
          fontWeight: '600',
        },
        actions: {
          borderTopWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        description: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        },
        safeArea: {
          flex: 1,
        },
        subtext: {
          fontSize: 14,
          fontWeight: '500',
          marginTop: 8,
          paddingHorizontal: 16,
          textAlign: 'center',
        },
        title: {
          fontSize: 16,
          fontWeight: '700',
          marginTop: 18,
          paddingHorizontal: 16,
        },
      }),
    [semantics],
  );
};
