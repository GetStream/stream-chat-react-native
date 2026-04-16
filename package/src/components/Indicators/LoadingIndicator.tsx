import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { primitives } from '../../theme';
import { Spinner } from '../UIComponents/Spinner';

type LoadingIndicatorWrapperProps = { text: string | undefined };

const LoadingIndicatorWrapper = ({ text }: LoadingIndicatorWrapperProps) => {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <Spinner height={20} width={20} />
      {text ? (
        <Text style={styles.loadingText} testID='loading'>
          {text}
        </Text>
      ) : null}
    </View>
  );
};

export type LoadingProps = {
  listType?: 'channel' | 'message' | 'threads' | 'default';
  loadingText?: string;
};

/**
 * UI Component for LoadingIndicator
 */
export const LoadingIndicator = (props: LoadingProps) => {
  const { listType, loadingText } = props;

  const { t } = useTranslationContext();

  if (loadingText) {
    return <LoadingIndicatorWrapper text={loadingText} />;
  }

  switch (listType) {
    case 'channel':
      return <LoadingIndicatorWrapper text={t('Loading channels...')} />;
    case 'message':
      return <LoadingIndicatorWrapper text={t('Loading messages...')} />;
    case 'threads':
      return <LoadingIndicatorWrapper text={undefined} />;
    default:
      return <LoadingIndicatorWrapper text={t('Loading...')} />;
  }
};

LoadingIndicator.displayName = 'LoadingIndicator{loadingIndicator}';

const useStyles = () => {
  const {
    theme: {
      loadingIndicator: { container, loadingText },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: { alignItems: 'center', flex: 1, justifyContent: 'center', ...container },
      loadingText: {
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        marginTop: primitives.spacingSm,
        color: semantics.textPrimary,
        ...loadingText,
      },
    });
  }, [container, loadingText, semantics]);
};
