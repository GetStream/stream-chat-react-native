import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AttachmentMediaPicker } from './AttachmentMediaPicker/AttachmentMediaPicker';

import { useAttachmentPickerContext } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useAttachmentPickerState, useStableCallback } from '../../../hooks';
import { primitives } from '../../../theme';
import { Button } from '../../ui';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: semantics.backgroundElevationElevation1,
          paddingHorizontal: primitives.spacing2xl,
          paddingBottom: primitives.spacing3xl,
        },
        infoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
        text: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textSecondary,
          marginTop: 8,
          marginHorizontal: 24,
          textAlign: 'center',
          maxWidth: 200,
        },
      }),
    [semantics.backgroundElevationElevation1, semantics.textSecondary],
  );
};

export type AttachmentPickerGenericContentProps = {
  Icon: React.ComponentType;
  onPress: () => void;
  height?: number;
  buttonText?: string;
  description?: string;
};

export const AttachmentPickerGenericContent = (props: AttachmentPickerGenericContentProps) => {
  const { height, buttonText, Icon, description, onPress: onPressProp } = props;
  const styles = useStyles();

  const {
    theme: {
      attachmentPicker: {
        content: { container, text, infoContainer },
      },
    },
  } = useTheme();

  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();

  const onPress = useStableCallback(() => {
    attachmentPickerStore.setSelectedPicker(undefined);
    closePicker();
    onPressProp();
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
        },
        container,
      ]}
    >
      <View style={[styles.infoContainer, infoContainer]}>
        <Icon />
        <Text style={[styles.text, text]}>{description}</Text>
      </View>
      <Button
        variant={'secondary'}
        type={'outline'}
        size={'lg'}
        label={buttonText}
        onPress={onPress}
      />
    </View>
  );
};

export type AttachmentPickerContent = Pick<AttachmentPickerGenericContentProps, 'height'>;

export const AttachmentPickerContent = (props: AttachmentPickerContent) => {
  const { height } = props;
  const { selectedPicker } = useAttachmentPickerState();

  // TODO V9: Think of a better way to do this. This is just a temporary fix.
  const lastSelectedPickerRef = useRef(selectedPicker);
  if (selectedPicker) {
    lastSelectedPickerRef.current = selectedPicker;
  }

  if (lastSelectedPickerRef.current === 'images') {
    return <AttachmentMediaPicker height={height} />;
  }

  return null;
};
