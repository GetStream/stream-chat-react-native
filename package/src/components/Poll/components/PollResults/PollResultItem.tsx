import React, { useCallback, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { LocalMessage, Poll, PollOption, PollVote as PollVoteClass } from 'stream-chat';

import { PollOptionFullResults } from './PollOptionFullResults';
import { PollVote } from './PollVote';

import {
  useOwnCapabilitiesContext,
  usePollContext,
  useTheme,
  useTranslationContext,
} from '../../../../contexts';

import { usePollState } from '../../hooks/usePollState';
import { GenericPollButton } from '../Button';
import { PollModalHeader } from '../PollModalHeader';

export type ShowAllVotesButtonProps = {
  option: PollOption;
  onPress?: ({
    message,
    option,
    poll,
  }: {
    message: LocalMessage;
    option: PollOption;
    poll: Poll;
  }) => void;
};

export const ShowAllVotesButton = (props: ShowAllVotesButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { voteCountsByOption } = usePollState();
  const ownCapabilities = useOwnCapabilitiesContext();
  const [showAllVotes, setShowAllVotes] = useState(false);
  const { onPress, option } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, option, poll });
      return;
    }

    setShowAllVotes(true);
  }, [message, onPress, option, poll]);

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  return (
    <>
      {ownCapabilities.queryPollVotes &&
      voteCountsByOption &&
      voteCountsByOption?.[option.id] > 5 ? (
        <GenericPollButton onPress={onPressHandler} title={t('Show All')} />
      ) : null}
      {showAllVotes ? (
        <Modal
          animationType='fade'
          onRequestClose={() => setShowAllVotes(false)}
          visible={showAllVotes}
        >
          <SafeAreaView style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader onPress={() => setShowAllVotes(false)} title={option.text} />
            <PollOptionFullResults message={message} option={option} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export type PollResultItemProps = {
  option: PollOption;
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
          {t('{{count}} votes', { count: voteCountsByOption[option.id] ?? 0 })}
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
  voteCount: { fontSize: 16, marginLeft: 16 },
});
