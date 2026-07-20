import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: primitives.spacingSm,
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
  prevProps: InlineLoadingMoreRecentThreadIndicatorPropsWithContext,
  nextProps: InlineLoadingMoreRecentThreadIndicatorPropsWithContext,
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

export const InlineLoadingMoreRecentThreadIndicator = (
  _props: InlineLoadingMoreRecentThreadIndicatorPropsWithContext,
) => {
  // The reply paginator exposes a single `isLoading` flag with no head/tail direction, so a
  // dedicated "loading newer replies" state isn't available yet; keep this indicator dormant (it
  // was previously driven by `threadLoadingMoreRecent`, which was never actually produced).
  // TODO: wire to a directional loading flag on MessagePaginator once one exists.
  return <MemoizedInlineLoadingMoreRecentIndicator loadingMoreRecent={false} />;
};
