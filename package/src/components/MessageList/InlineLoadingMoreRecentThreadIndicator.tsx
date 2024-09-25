import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useThreadContext } from '../../contexts';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
});

export type InlineLoadingMoreRecentThreadIndicatorPropsWithContext = {
  loadingMoreRecent?: boolean;
};

export const InlineLoadingMoreRecentIndicatorWithContext = ({
  loadingMoreRecent,
}: InlineLoadingMoreRecentThreadIndicatorPropsWithContext) => {
  const { theme } = useTheme();

  const {
    colors: { accent_blue },
  } = theme;

  if (!loadingMoreRecent) {
    return null;
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={accent_blue} size='small' />
    </View>
  );
};

const areEqual = (
  prevProps: InlineLoadingMoreRecentThreadIndicatorPropsWithContext,
  nextProps: InlineLoadingMoreRecentThreadIndicatorPropsWithContext,
) => {
  const { loadingMoreRecent: prevLoadingMoreRecent } = prevProps;
  const { loadingMoreRecent: nextLoadingMoreRecent } = nextProps;

  const loadingMoreRecentEqual = prevLoadingMoreRecent === nextLoadingMoreRecent;
  if (!loadingMoreRecentEqual) return false;

  return true;
};

const MemoizedInlineLoadingMoreRecentIndicator = React.memo(
  InlineLoadingMoreRecentIndicatorWithContext,
  areEqual,
) as typeof InlineLoadingMoreRecentIndicatorWithContext;

export const InlineLoadingMoreRecentThreadIndicator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const { threadLoadingMoreRecent } = useThreadContext<StreamChatGenerics>();

  return <MemoizedInlineLoadingMoreRecentIndicator loadingMoreRecent={threadLoadingMoreRecent} />;
};
