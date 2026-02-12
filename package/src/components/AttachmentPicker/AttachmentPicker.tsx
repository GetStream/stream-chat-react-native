import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  EmitterSubscription,
  Keyboard,
  Platform,
  View,
  LayoutChangeEvent,
} from 'react-native';

import { useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
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

  return (
    <BottomSheet
      enablePanDownToClose={false}
      enableContentPanningGesture={false}
      enableDynamicSizing={false}
      handleComponent={RenderNull}
      index={currentIndex}
      onAnimate={setCurrentIndex}
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
