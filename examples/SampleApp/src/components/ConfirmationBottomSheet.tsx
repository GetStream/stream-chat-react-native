import { useTheme } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete } from '../icons/Delete';
import { AppTheme } from '../types';

export type ConfirmationBottomSheetProps = {
  onCancel: () => void;
  onConfirm: () => void;
  subtext: string;
  title: string;
  cancelText?: string;
  confirmText?: string;
};
export const ConfirmationBottomSheet: React.FC<ConfirmationBottomSheetProps> = ({
  cancelText = 'CANCEL',
  confirmText = 'CONFIRM',
  onCancel,
  onConfirm,
  subtext,
  title,
}) => {
  const { colors } = useTheme() as AppTheme;
  const inset = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: inset.bottom,
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
        <TouchableOpacity onPress={onCancel} style={styles.actionButton}>
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
