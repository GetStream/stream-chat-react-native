import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { usePaginatedMessageListContext } from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
});

export type InlineLoadingMoreRecentIndicatorPropsWithContext = {
  loadingMoreRecent?: boolean;
};

export const InlineLoadingMoreRecentIndicatorWithContext: React.FC<InlineLoadingMoreRecentIndicatorPropsWithContext> =
  ({ loadingMoreRecent }) => {
    const { theme } = useTheme('InlineLoadingMoreRecentIndicator');

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
  prevProps: InlineLoadingMoreRecentIndicatorPropsWithContext,
  nextProps: InlineLoadingMoreRecentIndicatorPropsWithContext,
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

export const InlineLoadingMoreRecentIndicator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const { loadingMoreRecent } = usePaginatedMessageListContext<StreamChatGenerics>(
    'InlineLoadingMoreRecentIndicator',
  );

  return <MemoizedInlineLoadingMoreRecentIndicator loadingMoreRecent={loadingMoreRecent} />;
};
