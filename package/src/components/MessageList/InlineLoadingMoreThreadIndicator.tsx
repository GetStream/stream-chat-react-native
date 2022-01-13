import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';

import type { StreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
});

export type InlineLoadingMoreThreadIndicatorPropsWithContext = {
  threadLoadingMore?: boolean;
};

export const InlineLoadingMoreThreadIndicatorWithContext: React.FC<InlineLoadingMoreThreadIndicatorPropsWithContext> =
  ({ threadLoadingMore }) => {
    const { theme } = useTheme();

    const {
      colors: { accent_blue },
    } = theme;

    if (!threadLoadingMore) {
      return null;
    }

    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator color={accent_blue} size='small' />
      </View>
    );
  };

const areEqual = (
  prevProps: InlineLoadingMoreThreadIndicatorPropsWithContext,
  nextProps: InlineLoadingMoreThreadIndicatorPropsWithContext,
) => {
  const { threadLoadingMore: prevThreadLoadingMore } = prevProps;
  const { threadLoadingMore: nextThreadLoadingMore } = nextProps;

  const threadLoadingMoreEqual = prevThreadLoadingMore === nextThreadLoadingMore;
  if (!threadLoadingMoreEqual) return false;

  return true;
};

const MemoizedInlineLoadingMoreThreadIndicator = React.memo(
  InlineLoadingMoreThreadIndicatorWithContext,
  areEqual,
) as typeof InlineLoadingMoreThreadIndicatorWithContext;

export const InlineLoadingMoreThreadIndicator = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() => {
  const { threadLoadingMore } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <MemoizedInlineLoadingMoreThreadIndicator threadLoadingMore={threadLoadingMore} />;
};
