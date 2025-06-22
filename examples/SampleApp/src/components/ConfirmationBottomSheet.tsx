import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 224,
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
          marginBottom: inset.bottom,
        },
      ]}
    >
      <View
        style={[
          styles.actionButtonsContainer,
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setOverlay('none');
            reset();
          }}
          style={styles.actionButtonLeft}
         />
        <TouchableOpacity onPress={onConfirm} style={styles.actionButtonRight} />
      </View>
    </View>
  );
};
