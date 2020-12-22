import React, { useEffect, useState } from 'react';
import { useTheme } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete } from '../icons/Delete';
import { AppTheme } from '../types';
import BottomSheet, {
  TouchableOpacity,
  useBottomSheet,
} from '@gorhom/bottom-sheet';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';

const ADD_MEMBER_BOTTOM_SHEET_HEIGHT = 224;

export type ConfirmationBottomSheetProps = {
  dismissHandler: () => void;
  onConfirm: () => void;
  subtext: string;
  title: string;
  cancelText?: string;
  confirmText?: string;
};
export const ConfirmationBottomSheet = (
  props: ConfirmationBottomSheetProps,
) => {
  const {
    cancelText = 'CANCEL',
    confirmText = 'CONFIRM',
    dismissHandler,
    onConfirm,
    subtext,
    title,
  } = props;
  const { colors } = useTheme() as AppTheme;
  const inset = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: inset.bottom,
        },
      ]}
    >
      <View style={styles.description}>
        <Delete fill={colors.danger} height={24} width={24} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtext, { color: colors.text }]}>{subtext}</Text>
      </View>
      <View
        style={[
          styles.actionButtonsContainer,
          {
            borderTopColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity onPress={dismissHandler} style={styles.actionButton}>
          <Text>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={[styles.actionButton, { alignItems: 'flex-end' }]}
        >
          <Text>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

ConfirmationBottomSheet.displayName = 'ConfirmationBottomSheet';

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
    padding: 20,
  },
  actionButtonsContainer: {
    alignSelf: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    display: 'flex',
    flexDirection: 'column',
    height: 224,
    width: '100%',
  },
  description: {
    alignItems: 'center',
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
  subtext: {
    marginTop: 8,
  },
  title: {
    fontWeight: 'bold',
    marginTop: 18,
  },
});
