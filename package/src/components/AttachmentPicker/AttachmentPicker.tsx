import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  EmitterSubscription,
  Keyboard,
  Platform,
  View,
  LayoutChangeEvent,
} from 'react-native';

import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useStableCallback } from '../../hooks';
import { BottomSheet } from '../BottomSheetCompatibility/BottomSheet';
import { KeyboardControllerPackage } from '../KeyboardCompatibleView/KeyboardControllerAvoidingView';

dayjs.extend(duration);

const SPRING_CONFIG = {
  damping: 80,
  overshootClamping: true,
  restDisplacementThreshold: 0.1,
  restSpeedThreshold: 0.1,
  stiffness: 500,
  duration: 200,
};

export const AttachmentPicker = () => {
  const {
    closePicker,
    attachmentPickerStore,
    AttachmentPickerSelectionBar,
    AttachmentPickerContent,
    attachmentPickerBottomSheetHeight,
    bottomSheetRef: ref,
    disableAttachmentPicker,
  } = useAttachmentPickerContext();
  const {
    theme: { semantics },
  } = useTheme();

  const [currentIndex, setCurrentIndexInternal] = useState(-1);
  const currentIndexRef = useRef<number>(currentIndex);
  const setCurrentIndex = useStableCallback((_: number, toIndex: number) => {
    setCurrentIndexInternal(toIndex);
    currentIndexRef.current = toIndex;
  });

  useEffect(() => {
    const backAction = () => {
      if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
        attachmentPickerStore.setSelectedPicker(undefined);
        closePicker();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [attachmentPickerStore, closePicker]);

  useEffect(() => {
    const onKeyboardOpenHandler = () => {
      if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
        attachmentPickerStore.setSelectedPicker(undefined);
      }
      closePicker();
    };
    let keyboardSubscription: EmitterSubscription | null = null;
    if (KeyboardControllerPackage?.KeyboardEvents) {
      keyboardSubscription = KeyboardControllerPackage.KeyboardEvents.addListener(
        'keyboardWillShow',
        onKeyboardOpenHandler,
      );
    } else {
      const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      keyboardSubscription = Keyboard.addListener(keyboardShowEvent, onKeyboardOpenHandler);
    }
    return () => {
      keyboardSubscription?.remove();
    };
  }, [attachmentPickerStore, closePicker]);

  useEffect(() => {
    if (currentIndex < 0) {
      attachmentPickerStore.setSelectedPicker(undefined);
    }
  }, [currentIndex, attachmentPickerStore]);

  const selectionBarRef = useRef<number | null>(null);

  const initialSnapPoint = attachmentPickerBottomSheetHeight;

  /**
   * Snap points changing cause a rerender of the position,
   * this is an issue if you are calling close on the bottom sheet.
   */
  const snapPoints = useMemo(() => [initialSnapPoint], [initialSnapPoint]);

  const onAttachmentPickerSelectionBarLayout = useStableCallback((e: LayoutChangeEvent) => {
    selectionBarRef.current = e.nativeEvent.layout.height;
  });

  const animationConfigs = useBottomSheetSpringConfigs(SPRING_CONFIG);
  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: semantics.backgroundCoreElevation1,
      borderTopWidth: 0,
      elevation: Platform.OS === 'android' ? 0 : undefined,
      shadowOpacity: Platform.OS === 'android' ? 0 : undefined,
    }),
    [semantics.backgroundCoreElevation1],
  );

  const animatedIndex = useSharedValue(currentIndex);

  // This is required to prevent the attachment picker from getting out of sync
  // with the rest of the state. While there are more prudent fixes, this is about
  // as much as we can do now without refactoring the entire state layer for the
  // picker. When we do that, this can be removed completely.
  const reactToIndex = useStableCallback((index: number) => {
    if (index === -1) {
      attachmentPickerStore.setSelectedPicker(undefined);
    }

    if (index === 0) {
      // TODO: Extend the store to at least accept a default value.
      //       This in particular is not nice.
      attachmentPickerStore.setSelectedPicker('images');
    }
  });

  useAnimatedReaction(
    () => animatedIndex.value,
    (index, previousIndex) => {
      if ((index === 0 || index === -1) && index !== previousIndex) {
        runOnJS(reactToIndex)(index);
      }
    },
  );

  return (
    <BottomSheet
      android_keyboardInputMode='adjustResize'
      backgroundStyle={backgroundStyle}
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      enableDynamicSizing={false}
      handleComponent={RenderNull}
      index={currentIndex}
      onAnimate={setCurrentIndex}
      animatedIndex={animatedIndex}
      // @ts-ignore
      ref={ref}
      snapPoints={snapPoints}
      animationConfigs={animationConfigs}
    >
      <View onLayout={onAttachmentPickerSelectionBarLayout}>
        <AttachmentPickerSelectionBar />
      </View>
      {!disableAttachmentPicker ? (
        <AttachmentPickerContent
          height={attachmentPickerBottomSheetHeight - (selectionBarRef?.current ?? 0)}
        />
      ) : null}
    </BottomSheet>
  );
};

const RenderNull = () => null;

AttachmentPicker.displayName = 'AttachmentPicker';
