import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useThreadContext } from '../../contexts/threadContext/ThreadContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

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

export const InlineLoadingMoreThreadIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>() => {
  const { threadLoadingMore } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <MemoizedInlineLoadingMoreThreadIndicator threadLoadingMore={threadLoadingMore} />;
};
