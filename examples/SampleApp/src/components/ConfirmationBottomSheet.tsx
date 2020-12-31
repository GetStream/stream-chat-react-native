import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'stream-chat-react-native/v2';

import { Delete } from '../icons/Delete';

const styles = StyleSheet.create({
  actionButtonLeft: {
    flex: 1,
    padding: 20,
  },
  actionButtonRight: {
    alignItems: 'flex-end',
    flex: 1,
    padding: 20,
  },
  actionButtonsContainer: {
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  container: {
    height: 224,
  },
  description: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  subtext: {
    marginTop: 8,
  },
  title: {
    fontWeight: '600',
    marginTop: 18,
  },
});

export type ConfirmationBottomSheetProps = {
  dismissHandler: () => void;
  onConfirm: () => void;
  subtext: string;
  title: string;
  cancelText?: string;
  confirmText?: string;
};

export const ConfirmationBottomSheet: React.FC<ConfirmationBottomSheetProps> = (
  props,
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
        <TouchableOpacity
          onPress={dismissHandler}
          style={styles.actionButtonLeft}
        >
          <Text style={{ color: grey }}>{cancelText}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onConfirm} style={styles.actionButtonRight}>
          <Text style={{ color: accent_red }}>{confirmText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
