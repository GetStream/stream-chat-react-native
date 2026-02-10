import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AttachmentMediaPicker } from './AttachmentMediaPicker/AttachmentMediaPicker';

import { useMessageInputContext, useTranslationContext } from '../../../contexts';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useAttachmentPickerState } from '../../../hooks';
import { FilePickerIcon } from '../../../icons';
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
  const { height, buttonText, Icon, description, onPress } = props;
  const styles = useStyles();

  const {
    theme: {
      attachmentPicker: {
        content: { container, text, infoContainer },
      },
    },
  } = useTheme();

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

const AttachmentFilePickerIcon = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return <FilePickerIcon height={22} stroke={semantics.textTertiary} width={22} />;
};

export const AttachmentFilePicker = (props: AttachmentPickerContentProps) => {
  const { t } = useTranslationContext();
  const { height } = props;
  const { pickFile } = useMessageInputContext();

  return (
    <AttachmentPickerGenericContent
      Icon={AttachmentFilePickerIcon}
      onPress={pickFile}
      height={height}
      buttonText={t('Pick document')}
      description={t('Pick a document to share it with everyone')}
    />
  );
};

export type AttachmentPickerContentProps = Pick<AttachmentPickerGenericContentProps, 'height'>;

export const AttachmentPickerContent = (props: AttachmentPickerContentProps) => {
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

  if (lastSelectedPickerRef.current === 'files') {
    return <AttachmentFilePicker height={height} />;
  }

  return null;
};
