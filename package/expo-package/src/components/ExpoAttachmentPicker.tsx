import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomSheet from '@expo/ui/community/bottom-sheet';
import {
  AttachmentPickerContext,
  useAttachmentPickerContext,
  useAttachmentPickerState,
  useComponentsContext,
  useResolvedModalAccessibilityProps,
  useTheme,
  useTranslationContext,
} from 'stream-chat-react-native-core';

/** Imported only through stream-chat-expo/attachment-picker, so @expo/ui remains optional. */
export const ExpoAttachmentPicker = () => {
  const context = useAttachmentPickerContext();
  const {
    attachmentPickerBottomSheetHeight,
    attachmentPickerStore,
    bottomSheetRef,
    disableAttachmentPicker,
  } = context;
  const { AttachmentPickerContent, AttachmentPickerSelectionBar } = useComponentsContext();
  const { selectedPicker } = useAttachmentPickerState();
  const {
    theme: { semantics },
  } = useTheme();
  const { t } = useTranslationContext();
  const modalAccessibilityProps = useResolvedModalAccessibilityProps();
  const { height: windowHeight } = useWindowDimensions();
  const height = Math.min(windowHeight * 0.85, Math.max(attachmentPickerBottomSheetHeight, 160));
  const sheetRef = useRef<BottomSheet>(null);
  const openRef = useRef(false);
  const closingRef = useRef(false);
  const afterDismissRef = useRef<Array<() => void>>([]);
  const pendingOpenRef = useRef<(() => void) | undefined>(undefined);
  const [contentSize, setContentSize] = useState({
    width: undefined as number | undefined,
    height: Math.max(0, height - 100),
  });

  const close = useCallback(() => {
    if (!openRef.current || closingRef.current) return;
    closingRef.current = true;
    sheetRef.current?.close();
  }, []);

  const dismissPicker = useCallback(() => {
    if (!openRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      afterDismissRef.current.push(resolve);
      close();
    });
  }, [close]);

  const open = useCallback((action: () => void) => {
    if (closingRef.current) {
      pendingOpenRef.current = () => {
        openRef.current = true;
        action();
      };
      return;
    }
    openRef.current = true;
    action();
  }, []);

  useImperativeHandle(
    bottomSheetRef,
    () => ({
      snapToIndex: (index) =>
        index < 0 ? close() : open(() => sheetRef.current?.snapToIndex(index)),
      snapToPosition: (position) => open(() => sheetRef.current?.snapToPosition(position)),
      expand: () => open(() => sheetRef.current?.expand()),
      collapse: () => open(() => sheetRef.current?.collapse()),
      close,
      forceClose: close,
    }),
    [close, open],
  );

  const onDismiss = useCallback(() => {
    openRef.current = false;
    closingRef.current = false;
    attachmentPickerStore.setSelectedPicker(undefined);
    const callbacks = afterDismissRef.current.splice(0);
    callbacks.forEach((callback) => callback());
    const pendingOpen = pendingOpenRef.current;
    pendingOpenRef.current = undefined;
    pendingOpen?.();
  }, [attachmentPickerStore]);

  useEffect(
    () => () => {
      // Do not launch a camera/dialog after the channel has unmounted.
      afterDismissRef.current = [];
      pendingOpenRef.current = undefined;
    },
    [],
  );

  const value = useMemo(
    () => ({
      ...context,
      attachmentPickerPresentation: 'modal' as const,
      attachmentPickerContentWidth: contentSize.width,
      dismissPicker,
    }),
    [context, contentSize.width, dismissPicker],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      enablePanDownToClose
      handleComponent={null}
      backgroundStyle={{ backgroundColor: semantics.backgroundCoreElevation1 }}
      onChange={(index) => {
        if (index >= 0) {
          openRef.current = true;
          if (!attachmentPickerStore.state.getLatestValue().selectedPicker) {
            attachmentPickerStore.setSelectedPicker('images');
          }
        }
      }}
      onDismiss={onDismiss}
    >
      <GestureHandlerRootView
        style={{ height, backgroundColor: semantics.backgroundCoreElevation1 }}
      >
        <AttachmentPickerContext.Provider value={value}>
          <View
            {...modalAccessibilityProps}
            collapsable={false}
            onAccessibilityEscape={close}
            style={styles.container}
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole='button'
                onPress={close}
                style={styles.close}
                testID='expo-attachment-picker-close'
              >
                <Text style={{ color: semantics.textPrimary }}>{t('a11y/Close')}</Text>
              </Pressable>
            </View>
            <AttachmentPickerSelectionBar />
            <View
              style={styles.container}
              onLayout={({ nativeEvent: { layout } }) => {
                setContentSize((previous) =>
                  previous.width === layout.width && previous.height === layout.height
                    ? previous
                    : { width: layout.width, height: layout.height },
                );
              }}
            >
              {!disableAttachmentPicker || selectedPicker === 'commands' ? (
                <AttachmentPickerContent height={contentSize.height} />
              ) : null}
            </View>
          </View>
        </AttachmentPickerContext.Provider>
      </GestureHandlerRootView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'flex-end', paddingHorizontal: 16 },
  close: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
});
