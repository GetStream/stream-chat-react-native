import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PollOption, PollVote as PollVoteClass, VotingVisibility } from 'stream-chat';

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

export const PollVote = ({ vote }: { vote: PollVoteClass }) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const { votingVisibility } = usePollState();
  const {
    theme: {
      colors: { black, text_low_emphasis },
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

  const isAnonymous = useMemo(
    () => votingVisibility === VotingVisibility.anonymous,
    [votingVisibility],
  );

  return (
    <View style={[styles.voteContainer, container]}>
      <View style={{ flexDirection: 'row' }}>
        {!isAnonymous && vote.user?.image ? (
          <Avatar image={vote.user.image as string} key={vote.id} size={20} />
        ) : null}
        <Text style={[styles.voteUserName, { color: black }, userName]}>
          {isAnonymous ? t<string>('Anonymous') : vote.user?.name}
        </Text>
      </View>
      <Text style={[styles.voteDate, { color: text_low_emphasis }, dateText]}>{dateString}</Text>
    </View>
  );
};

const PollResultsVoteItem = (vote: PollVoteClass) => (
  <PollVote key={`results_vote_${vote.id}`} vote={vote} />
);

export const PollResultsItem = ({ option }: PollResultItemProps) => {
  const { t } = useTranslationContext();
  const { latestVotesByOption, voteCountsByOption } = usePollState();

  const {
    theme: {
      colors: { bg_user, black },
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
        <Text style={[styles.title, { color: black }, title]}>{option.text}</Text>
        <Text style={[styles.voteCount, { color: black }, voteCount]}>
          {t<string>('{{count}} votes', { count: voteCountsByOption[option.id] ?? 0 })}
        </Text>
      </View>
      {latestVotesByOption?.[option.id]?.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          {(latestVotesByOption?.[option.id] ?? []).slice(0, 5).map(PollResultsVoteItem)}
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
    marginBottom: 8,
    paddingVertical: 8,
  },
  voteCount: { fontSize: 16, marginLeft: 16 },
  voteDate: { fontSize: 14 },
  voteUserName: { fontSize: 14, marginLeft: 2 },
});
