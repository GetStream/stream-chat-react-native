import React, { useMemo } from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

export type HeaderErrorProps = {
  onPress?: (event: GestureResponderEvent) => void;
};

export const ChannelListHeaderErrorIndicator = ({ onPress = () => null }: HeaderErrorProps) => {
  const styles = useStyles();
  const { t } = useTranslationContext();

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.errorText} testID='channel-loading-error'>
        {t('Error while loading, please reload/refresh')}
      </Text>
    </TouchableOpacity>
  );
};

ChannelListHeaderErrorIndicator.displayName =
  'ChannelListHeaderErrorIndicator{channelListHeaderErrorIndicator}';

const useStyles = () => {
  const {
    theme: {
      channelListHeaderErrorIndicator: { container, errorText },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        backgroundColor: semantics.backgroundCoreSurface,
        paddingVertical: primitives.spacingXs,
        paddingHorizontal: primitives.spacingSm,
        ...container,
      },
      errorText: {
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
        color: semantics.chatTextSystem,
        ...errorText,
      },
    });
  }, [container, errorText, semantics]);
};
