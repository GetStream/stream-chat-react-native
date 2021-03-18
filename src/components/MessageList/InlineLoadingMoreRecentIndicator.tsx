import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useMessageListContext } from '../../contexts/messageListContext/MessageListContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

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

export type InlineLoadingMoreRecentIndicatorPropsWithContext = {
  loadingMoreRecent?: boolean;
};

export const InlineLoadingMoreRecentIndicatorWithContext: React.FC<InlineLoadingMoreRecentIndicatorPropsWithContext> = ({
  loadingMoreRecent,
}) => {
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
  prevProps: InlineLoadingMoreRecentIndicatorPropsWithContext,
  nextProps: InlineLoadingMoreRecentIndicatorPropsWithContext,
) => {
  const { loadingMoreRecent: prevLoadingMoreRecent } = prevProps;
  const { loadingMoreRecent: nextLoadingMoreRecent } = nextProps;

  const loadingMoreRecentEqual =
    prevLoadingMoreRecent === nextLoadingMoreRecent;
  if (!loadingMoreRecentEqual) return false;

  return true;
};

const MemoizedInlineLoadingMoreRecentIndicator = React.memo(
  InlineLoadingMoreRecentIndicatorWithContext,
  areEqual,
) as typeof InlineLoadingMoreRecentIndicatorWithContext;

export const InlineLoadingMoreRecentIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() => {
  const { loadingMoreRecent } = useMessageListContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedInlineLoadingMoreRecentIndicator
      loadingMoreRecent={loadingMoreRecent}
    />
  );
};
