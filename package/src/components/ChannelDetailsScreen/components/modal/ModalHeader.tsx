import React, { useMemo } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { ArrowLeft } from '../../../../icons/arrow-left';
import { primitives } from '../../../../theme';
import { Button } from '../../../ui/Button/Button';

type ModalHeaderProps = {
  onClose: () => void;
  title: string;
  rightAction?: React.ReactNode;
};

export const ModalHeader = ({ onClose, rightAction, title }: ModalHeaderProps) => {
  const {
    theme: {
      channelDetailsScreen: {
        modal: { header: headerOverride, headerTitle: headerTitleOverride },
      },
      semantics,
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.header, headerOverride]}>
      <View style={styles.side}>
        <Button
          accessibilityLabelKey='a11y/Close'
          iconOnly
          LeadingIcon={ArrowLeft}
          onPress={onClose}
          size='md'
          type='ghost'
          variant='secondary'
        />
      </View>
      <View style={styles.center}>
        <Text
          accessibilityRole='header'
          numberOfLines={1}
          style={[styles.title, { color: semantics.textPrimary }, headerTitleOverride]}
        >
          {title}
        </Text>
      </View>
      <View style={[styles.side, styles.sideRight]}>{rightAction}</View>
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        center: {
          alignItems: 'center',
          flex: 2,
          justifyContent: 'center',
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingBottom: primitives.spacingSm,
          paddingHorizontal: primitives.spacingSm,
          paddingTop: primitives.spacingSm,
          gap: primitives.spacingSm,
        },
        side: {
          flex: 1,
          justifyContent: 'center',
        },
        sideRight: {
          alignItems: 'flex-end',
        },
        title: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
      }),
    [],
  );
