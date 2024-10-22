import React, { useCallback } from 'react';
import { FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollVote } from './PollResultItem';

import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { usePollOptionVotesPagination } from '../../hooks/usePollOptionVotesPagination';
import { usePollState } from '../../hooks/usePollState';

export type PollOptionFullResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = PollContextValue & {
  option: PollOption<StreamChatGenerics>;
  additionalFlatListProps?: Partial<FlatListProps<PollVoteClass<StreamChatGenerics>>>;
  PollOptionFullResultsContent?: React.ComponentType<{ option: PollOption<StreamChatGenerics> }>;
};

export const PollOptionFullResultsItem = ({ item }: { item: PollVoteClass }) => (
  <PollVote {...item} />
);

export const PollOptionFullResultsContent = ({
  additionalFlatListProps,
  option,
}: Pick<PollOptionFullResultsProps, 'option' | 'additionalFlatListProps'>) => {
  const { t } = useTranslationContext();
  const { hasNextPage, loadMore, votes } = usePollOptionVotesPagination({ option });
  const { vote_counts_by_option } = usePollState();

  const {
    theme: {
      colors: { bg_user },
      poll: {
        fullResults: { container, contentContainer, headerContainer, headerText },
      },
    },
  } = useTheme();

  const PollOptionFullResultsHeader = useCallback(
    () => (
      <View style={[styles.headerContainer, headerContainer]}>
        <Text style={[styles.headerText, headerText]}>
          {t<string>('{{count}} votes', { count: vote_counts_by_option[option.id] ?? 0 })}
        </Text>
      </View>
    ),
    [headerContainer, headerText, option, t, vote_counts_by_option],
  );

  return (
    <View style={[styles.container, container]}>
      <FlatList
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: bg_user },
          contentContainer,
        ]}
        data={votes}
        keyExtractor={(item) => `option_full_results_${item.id}`}
        ListHeaderComponent={PollOptionFullResultsHeader}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={PollOptionFullResultsItem}
        {...additionalFlatListProps}
      />
    </View>
  );
};

export const PollOptionFullResults = ({
  additionalFlatListProps,
  message,
  option,
  poll,
  PollOptionFullResultsContent: PollOptionFullResultsContentOverride,
}: PollOptionFullResultsProps) => (
  <PollContextProvider value={{ message, poll }}>
    {PollOptionFullResultsContentOverride ? (
      <PollOptionFullResultsContentOverride option={option} />
    ) : (
      <PollOptionFullResultsContent
        additionalFlatListProps={additionalFlatListProps}
        option={option}
      />
    )}
  </PollContextProvider>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContainer: { flexDirection: 'row', justifyContent: 'flex-end' },
  headerText: { fontSize: 16, marginLeft: 16 },
});
