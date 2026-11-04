import React from 'react';

import type { TouchableOpacityProps } from 'react-native';
import { TouchableOpacity } from 'react-native';

import { TouchableOpacity as TouchableOpacityOriginal } from '@gorhom/bottom-sheet';

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';

const GorhomTouchableOpacity =
  TouchableOpacityOriginal as React.ComponentType<TouchableOpacityProps>;

export const BottomSheetTouchableOpacity = (props: TouchableOpacityProps) => {
  const { attachmentPickerPresentation } = useAttachmentPickerContext();
  const Component =
    attachmentPickerPresentation === 'modal' ? TouchableOpacity : GorhomTouchableOpacity;
  return <Component {...props} />;
};

export type BottomSheetTouchableOpacityProps = TouchableOpacityProps;
