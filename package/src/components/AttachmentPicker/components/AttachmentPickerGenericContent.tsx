import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { IconProps } from '../../../icons';
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
          backgroundColor: semantics.backgroundCoreElevation1,
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
    [semantics.backgroundCoreElevation1, semantics.textSecondary],
  );
};

export type AttachmentPickerContentProps = {
  height?: number;
};

export type AttachmentPickerGenericContentProps = AttachmentPickerContentProps & {
  Icon: React.ComponentType<IconProps>;
  onPress: () => void;
  buttonText?: string;
  description?: string;
};

export const AttachmentPickerGenericContent = (props: AttachmentPickerGenericContentProps) => {
  const { height, buttonText, Icon, description, onPress } = props;
  const styles = useStyles();

  const {
    theme: {
      semantics,
      attachmentPicker: {
        content: { container, text, infoContainer },
      },
    },
  } = useTheme();

  const ThemedIcon = useCallback(
    () => <Icon width={22} height={22} stroke={semantics.textTertiary} />,
    [Icon, semantics.textTertiary],
  );

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
        <ThemedIcon />
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
