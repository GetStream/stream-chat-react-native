import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../../contexts';
import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { getDateString } from '../../../../utils/i18n/getDateString';
import { Avatar } from '../../../Avatar/Avatar';
import { usePollState } from '../../hooks/usePollState';
import { ShowAllVotesButton } from '../Button';

export type PollResultItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  option: PollOption<StreamChatGenerics>;
};

export const PollVote = (vote: PollVoteClass) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const {
    theme: {
      colors: { text_low_emphasis },
      poll: {
        results: {
          vote: { container, dateText, userName },
        },
      },
    },
  } = useTheme();

  const dateString = useMemo(
    () =>
      getDateString({
        date: vote.created_at,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/PollVote',
      }),
    [vote.created_at, t, tDateTimeParser],
  );

  return (
    <View key={`results_vote_${vote.id}`} style={[styles.voteContainer, container]}>
      <View style={{ flexDirection: 'row' }}>
        <Avatar image={vote.user?.image as string} key={vote.id} size={20} />
        <Text style={[styles.voteUserName, userName]}>{vote.user?.name}</Text>
      </View>
      <Text style={[styles.voteDate, { color: text_low_emphasis }, dateText]}>{dateString}</Text>
    </View>
  );
};

export const PollResultsItem = ({ option }: PollResultItemProps) => {
  const { t } = useTranslationContext();
  const { latest_votes_by_option, vote_counts_by_option } = usePollState();

  const {
    theme: {
      colors: { bg_user },
      poll: {
        results: {
          item: { container, headerContainer, title, voteCount },
        },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: bg_user }, container]}>
      <View style={[styles.headerContainer, headerContainer]}>
        <Text style={[styles.title, title]}>{option.text}</Text>
        <Text style={[styles.voteCount, voteCount]}>
          {t<string>('{{count}} votes', { count: vote_counts_by_option[option.id] ?? 0 })}
        </Text>
      </View>
      {latest_votes_by_option?.[option.id]?.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          {(latest_votes_by_option?.[option.id] ?? []).slice(0, 5).map(PollVote)}
        </View>
      ) : null}
      <ShowAllVotesButton option={option} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 16, fontWeight: '500' },
  voteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  voteCount: { fontSize: 16, marginLeft: 16 },
  voteDate: { fontSize: 14 },
  voteUserName: { fontSize: 14, marginLeft: 2 },
});
