import React, { useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { PollVote as PollVoteClass, VotingVisibility } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../../contexts';
import { primitives } from '../../../../theme';
import { getDateString } from '../../../../utils/i18n/getDateString';
import { UserAvatar } from '../../../ui/Avatar/UserAvatar';

import { usePollState } from '../../hooks/usePollState';

export const PollVote = ({ vote }: { vote: PollVoteClass }) => {
  const { t, tDateTimeParser } = useTranslationContext();
  const { votingVisibility } = usePollState();
  const {
    theme: {
      poll: {
        results: {
          vote: { container, dateText, userName },
        },
      },
    },
  } = useTheme();
  const styles = useStyles();

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
      <View style={styles.userContainer}>
        {!isAnonymous && vote.user ? <UserAvatar user={vote.user} size='md' showBorder /> : null}
        <Text style={[styles.voteUserName, userName]}>
          {isAnonymous ? t('Anonymous') : (vote.user?.name ?? vote.user?.id)}
        </Text>
      </View>
      <Text style={[styles.voteDate, dateText]}>{dateString}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        voteContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: primitives.spacingXs,
        },
        voteDate: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textTertiary,
        },
        voteUserName: {
          fontSize: primitives.typographyFontSizeMd,
          lineHeight: primitives.typographyLineHeightNormal,
          color: semantics.textPrimary,
          paddingLeft: primitives.spacingXs,
        },
        userContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
      }),
    [semantics],
  );
};
