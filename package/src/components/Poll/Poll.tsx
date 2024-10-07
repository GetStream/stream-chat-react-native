import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import {
  Poll as PollClass,
  PollOption as PollOptionClass,
  PollResponse,
  PollState,
  PollVote,
} from 'stream-chat';

import {
  PollContextProvider,
  useChatContext,
  useMessageContext,
  usePollContext,
} from '../../contexts';
import { useStateStore } from '../../hooks';
import { Avatar } from '../Avatar/Avatar';

const selector = (nextValue: PollState) =>
  [
    nextValue.vote_counts_by_option,
    nextValue.ownVotesByOptionId,
    nextValue.options,
    nextValue.name,
    nextValue.max_votes_allowed,
  ] as const;

const selector2 = (nextValue: PollState) =>
  [nextValue.latest_votes_by_option, nextValue.maxVotedOptionIds] as const;

const PollOption2 = ({ option }: { option: PollOptionClass }) => {
  const { optionVoteCounts, ownVotesByOptionId, poll } = usePollContext();
  const { message } = useMessageContext();

  const toggleVote = useCallback(async () => {
    if (ownVotesByOptionId[option.id]) {
      await poll.removeVote(ownVotesByOptionId[option.id], message.id);
    } else {
      await poll.castVote(option.id, message.id);
    }
  }, [message.id, option.id, ownVotesByOptionId, poll]);

  const [latestVotesByOption, maxVotedOptionIds] = useStateStore(poll.state, selector2);
  const relevantVotes = useMemo(
    () => latestVotesByOption[option.id]?.slice(0, 2) || [],
    [latestVotesByOption, option.id],
  );
  console.log('ISE: LATEST: ', latestVotesByOption[option.id], relevantVotes);

  return (
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity
        onPress={toggleVote}
        style={{
          width: 15,
          height: 15,
          backgroundColor: ownVotesByOptionId[option.id] ? 'red' : 'white',
          borderWidth: 1,
          borderColor: 'black',
        }}
      />
      <Text style={{ flex: 1 }}>{option.text}</Text>
      <View style={{ flexDirection: 'row' }}>
        {relevantVotes.map((vote: PollVote) => (
          <Avatar
            // containerStyle={{ position: 'absolute', right: index * 15 }}
            image={vote.user.image as string}
            key={vote.id}
            size={20}
          />
        ))}
        <Text style={{ marginLeft: 2 }}>{optionVoteCounts[option.id] || 0}</Text>
      </View>
    </View>
  );
};

const PollOption = React.memo(PollOption2);

const PollWithContext = () => {
  const [showResults, setShowResults] = useState(false);
  const { maxNumberOfVotes, name, options } = usePollContext();
  const subtitle = maxNumberOfVotes ? `Select up to ${maxNumberOfVotes}` : 'Select one or more';

  return (
    <View style={{ padding: 15, width: 270 }}>
      <Text>{name}</Text>
      <Text>{subtitle}</Text>
      {options?.map((option: PollOptionClass) => (
        <PollOption key={option.id} option={option} />
      ))}
      {options && options.length > 10 ? (
        <>
          <TouchableOpacity
            onPress={() => setShowResults(true)}
            style={{
              marginHorizontal: 16,
              alignItems: 'center',
            }}
          >
            <Text>See all {options.length} options</Text>
          </TouchableOpacity>
          <Modal
            animationType='slide'
            onRequestClose={() => setShowResults(false)}
            visible={showResults}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Text>BACK</Text>
              </TouchableOpacity>
              <Text>{name}</Text>
              {options?.map((option: PollOptionClass) => (
                <PollOption key={option.id} option={option} />
              ))}
            </SafeAreaView>
          </Modal>
        </>
      ) : null}
    </View>
  );
};

export const Poll = ({ poll: pollData }: { poll: PollResponse }) => {
  const { client } = useChatContext();

  const poll = useMemo<PollClass>(
    () => new PollClass({ client, poll: pollData }),
    [client, pollData],
  );
  useEffect(() => {
    poll.registerSubscriptions();
    return poll.unregisterSubscriptions;
  }, [poll]);

  const [optionVoteCounts, ownVotesByOptionId, options, name, maxNumberOfVotes] = useStateStore(
    poll.state,
    selector,
  );
  return (
    <PollContextProvider
      value={{ maxNumberOfVotes, options, optionVoteCounts, poll, name, ownVotesByOptionId }}
    >
      <PollWithContext />
    </PollContextProvider>
  );
};
