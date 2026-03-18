import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { usePaginatedMessageListContext } from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: primitives.spacingSm,
    width: '100%',
  },
});

export type InlineLoadingMoreRecentIndicatorPropsWithContext = {
  loadingMoreRecent?: boolean;
};

export const InlineLoadingMoreRecentIndicatorWithContext = ({
  loadingMoreRecent,
}: InlineLoadingMoreRecentIndicatorPropsWithContext) => {
  const { theme } = useTheme();

  const { semantics } = theme;

  if (!loadingMoreRecent) {
    return null;
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator color={semantics.accentPrimary} size='small' />
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
  if (!loadingMoreRecentEqual) {
    return false;
  }

  return true;
};

const MemoizedInlineLoadingMoreRecentIndicator = React.memo(
  InlineLoadingMoreRecentIndicatorWithContext,
  areEqual,
) as typeof InlineLoadingMoreRecentIndicatorWithContext;

export const InlineLoadingMoreRecentIndicator = () => {
  const { loadingMoreRecent } = usePaginatedMessageListContext();

  return <MemoizedInlineLoadingMoreRecentIndicator loadingMoreRecent={loadingMoreRecent} />;
};
