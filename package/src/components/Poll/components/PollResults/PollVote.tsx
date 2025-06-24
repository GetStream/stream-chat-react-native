import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { PollVote as PollVoteClass, VotingVisibility } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../../contexts';
import { getDateString } from '../../../../utils/i18n/getDateString';

import { Avatar } from '../../../Avatar/Avatar';
import { usePollState } from '../../hooks/usePollState';

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
          {isAnonymous ? t('Anonymous') : (vote.user?.name ?? vote.user?.id)}
        </Text>
      </View>
      <Text style={[styles.voteDate, { color: text_low_emphasis }, dateText]}>{dateString}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
