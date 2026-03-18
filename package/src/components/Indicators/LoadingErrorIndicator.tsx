import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';

type LoadingErrorWrapperProps = {
  text: string;
  onPress?: () => void;
};

const LoadingErrorWrapper = (props: React.PropsWithChildren<LoadingErrorWrapperProps>) => {
  const { children, onPress, text } = props;

  const styles = useStyles();

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.errorText} testID='loading-error'>
        {text}
      </Text>
      {children}
    </TouchableOpacity>
  );
};

export type LoadingErrorProps = {
  error?: boolean | Error;
  listType?: 'channel' | 'message' | 'default';
  loadNextPage?: () => Promise<void>;
  retry?: () => void;
};

export const LoadingErrorIndicator = (props: LoadingErrorProps) => {
  const { listType, retry = () => null } = props;

  const { t } = useTranslationContext();
  const styles = useStyles();

  switch (listType) {
    case 'channel':
      return (
        <LoadingErrorWrapper onPress={retry} text={t('Error loading channel list...')}>
          <Text style={styles.retryText}>⟳</Text>
        </LoadingErrorWrapper>
      );
    case 'message':
      return (
        <LoadingErrorWrapper
          onPress={retry}
          text={t('Error loading messages for this channel...')}
        />
      );
    default:
      return <LoadingErrorWrapper text={t('Error loading')} />;
  }
};

LoadingErrorIndicator.displayName = 'LoadingErrorIndicator{loadingErrorIndicator}';

const useStyles = () => {
  const {
    theme: {
      loadingErrorIndicator: { errorText, retryText, container },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
        ...container,
      },
      errorText: {
        color: semantics.accentError,
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightSemiBold,
        paddingVertical: primitives.spacingSm,
        ...errorText,
      },
      retryText: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeLg,
        lineHeight: primitives.typographyLineHeightNormal,
        fontWeight: primitives.typographyFontWeightSemiBold,
        ...retryText,
      },
    });
  }, [container, semantics.accentError, semantics.textPrimary, errorText, retryText]);
};
