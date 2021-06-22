import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Delete, UserMinus, useTheme } from 'stream-chat-react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import {
  isAddMemberBottomSheetData,
  useBottomSheetOverlayContext,
} from '../context/BottomSheetOverlayContext';

const styles = StyleSheet.create({
  actionButtonLeft: {
    padding: 20,
  },
  actionButtonRight: {
    padding: 20,
  },
  actionButtonsContainer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    height: 224,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  description: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  subtext: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
    paddingHorizontal: 16,
  },
});

export const ConfirmationBottomSheet: React.FC = () => {
  const { setOverlay } = useAppOverlayContext();
  const { data: contextData, reset } = useBottomSheetOverlayContext();
  const data = contextData && !isAddMemberBottomSheetData(contextData) ? contextData : undefined;

  const {
    theme: {
      colors: { accent_red, black, border, grey, white },
    },
  } = useTheme();
  const inset = useSafeAreaInsets();

  if (!data) {
    return null;
  }

  const { cancelText = 'CANCEL', confirmText = 'CONFIRM', onConfirm, subtext, title } = data;

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
        {confirmText === 'LEAVE' ? <UserMinus pathFill={grey} /> : <Delete pathFill={accent_red} />}
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
        {/* using onPressOut instead of onPress works with touchables inside absolutely positioned parents and gives the same opacity feedback  */}
        <TouchableOpacity
          onPress={() => {
            setOverlay('none');
            reset();
          }}
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
