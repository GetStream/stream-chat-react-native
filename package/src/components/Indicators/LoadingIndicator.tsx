import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { Spinner } from '../UIComponents/Spinner';

type LoadingIndicatorWrapperProps = { text: string };

const LoadingIndicatorWrapper = ({ text }: LoadingIndicatorWrapperProps) => {
  const {
    theme: {
      colors: { black, white_snow },
      loadingIndicator: { container, loadingText },
    },
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: white_snow }, container]}>
      <Spinner height={20} width={20} />
      <Text style={[styles.loadingText, { color: black }, loadingText]} testID='loading'>
        {text}
      </Text>
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
      return <LoadingIndicatorWrapper text={t('Loading threads...')} />;
    default:
      return <LoadingIndicatorWrapper text={t('Loading...')} />;
  }
};

LoadingIndicator.displayName = 'LoadingIndicator{loadingIndicator}';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
  },
});
