import React from 'react';

import type { TouchableOpacityProps } from 'react-native';

import { TouchableOpacity as TouchableOpacityOriginal } from '@gorhom/bottom-sheet';

export const BottomSheetTouchableOpacity =
  TouchableOpacityOriginal as React.ComponentType<TouchableOpacityProps>;

export type BottomSheetTouchableOpacityProps = TouchableOpacityProps;
