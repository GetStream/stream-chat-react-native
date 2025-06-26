import React, { useCallback } from 'react';
import { FlatList, type FlatListProps, StyleSheet, Text, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollVote } from './PollVote';

import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../../../contexts';

import { usePollOptionVotesPagination } from '../../hooks/usePollOptionVotesPagination';
import { usePollState } from '../../hooks/usePollState';

export type PollOptionFullResultsProps = PollContextValue & {
  option: PollOption;
  additionalFlatListProps?: Partial<FlatListProps<PollVoteClass>>;
  PollOptionFullResultsContent?: React.ComponentType<{ option: PollOption }>;
};

export const PollOptionFullResultsItem = ({ item }: { item: PollVoteClass }) => (
  <PollVote vote={item} />
);

export const PollOptionFullResultsContent = ({
  additionalFlatListProps,
  option,
}: Pick<PollOptionFullResultsProps, 'option' | 'additionalFlatListProps'>) => {
  const { t } = useTranslationContext();
  const { hasNextPage, loadMore, votes } = usePollOptionVotesPagination({ option });
  const { voteCountsByOption } = usePollState();

  const {
    theme: {
      colors: { bg_user, black, white },
      poll: {
        fullResults: { container, contentContainer, headerContainer, headerText },
      },
    },
  } = useTheme();

  const PollOptionFullResultsHeader = useCallback(
    () => (
      <View style={[styles.headerContainer, headerContainer]}>
        <Text style={[styles.headerText, { color: black }, headerText]}>
          {t('{{count}} votes', { count: voteCountsByOption[option.id] ?? 0 })}
        </Text>
      </View>
    ),
    [black, headerContainer, headerText, option.id, t, voteCountsByOption],
  );

  return (
    <View style={[styles.container, { backgroundColor: white }, container]}>
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
  headerContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  headerText: { fontSize: 16, marginLeft: 16 },
});
