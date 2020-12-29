import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native/v2';

import { Delete } from '../icons/Delete';

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
  const {
    theme: {
      colors: { accent_red, black, border, grey, white },
    },
  } = useTheme();
  const inset = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: white,
          marginBottom: inset.bottom,
        },
      ]}
    >
      <View style={styles.description}>
        <Delete fill={accent_red} height={24} width={24} />
        <Text style={[styles.title, { color: black }]}>{title}</Text>
        <Text style={[styles.subtext, { color: black }]}>{subtext}</Text>
      </View>
      <View
        style={[
          styles.actionButtonsContainer,
          {
            borderTopColor: border,
          },
        ]}
      >
        <TouchableOpacity onPress={dismissHandler} style={styles.actionButton}>
          <Text style={{ color: grey }}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          style={[styles.actionButton, { alignItems: 'flex-end' }]}
        >
          <Text style={{ color: accent_red }}>{confirmText}</Text>
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
