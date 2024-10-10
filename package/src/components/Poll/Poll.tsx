import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import {
  Poll as PollClass,
  PollOption as PollOptionClass,
  PollResponse,
  PollState,
} from 'stream-chat';

import { PollAnswersList } from './components/PollAnswersList';
import { PollInputDialog } from './components/PollInputDialog';
import { PollOption, ShowAllOptionsContent } from './components/PollOption';
import { PollResults } from './components/PollResults';

import {
  PollContextProvider,
  useChatContext,
  useMessageContext,
  usePollContext,
} from '../../contexts';
import { useStateStore } from '../../hooks';
// import * as dbApi from '../../store/apis';

const selector = (nextValue: PollState) =>
  [
    nextValue.vote_counts_by_option,
    nextValue.ownVotesByOptionId,
    nextValue.latest_votes_by_option,
    nextValue.answers_count,
    nextValue.options,
    nextValue.name,
    nextValue.max_votes_allowed,
  ] as const;

const PollWithContext = () => {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { addComment, addOption, answersCount, endVote, maxNumberOfVotes, name, options } =
    usePollContext();
  const subtitle = maxNumberOfVotes ? `Select up to ${maxNumberOfVotes}` : 'Select one or more';

  return (
    <View style={{ padding: 15, width: 270 }}>
      <Text>{name}</Text>
      <Text>{subtitle}</Text>
      {options?.slice(0, 10)?.map((option: PollOptionClass) => (
        <PollOption key={option.id} option={option} />
      ))}
      {options && options.length > 10 ? (
        <>
          <TouchableOpacity
            onPress={() => setShowAllOptions(true)}
            style={{
              alignItems: 'center',
              marginHorizontal: 16,
            }}
          >
            <Text>See all {options.length} options</Text>
          </TouchableOpacity>
          {showAllOptions ? (
            <Modal
              animationType='slide'
              onRequestClose={() => setShowAllOptions(false)}
              visible={showAllOptions}
            >
              <SafeAreaView style={{ flex: 1 }}>
                <ShowAllOptionsContent close={() => setShowAllOptions(false)} />
              </SafeAreaView>
            </Modal>
          ) : null}
        </>
      ) : null}
      <TouchableOpacity
        onPress={() => setShowAnswers(true)}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>View {answersCount} comments</Text>
      </TouchableOpacity>
      <Modal
        animationType='slide'
        onRequestClose={() => setShowAnswers(false)}
        visible={showAnswers}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <PollAnswersList addComment={addComment} close={() => setShowAnswers(false)} />
        </SafeAreaView>
      </Modal>
      <TouchableOpacity
        onPress={() => setShowAddOptionDialog(true)}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>Suggest an option</Text>
      </TouchableOpacity>
      <PollInputDialog
        closeDialog={() => setShowAddOptionDialog(false)}
        onSubmit={(value) => addOption(value)}
        title='Suggest an option'
        visible={showAddOptionDialog}
      />
      <TouchableOpacity
        onPress={() => setShowAddCommentDialog(true)}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>Add a comment</Text>
      </TouchableOpacity>
      <PollInputDialog
        closeDialog={() => setShowAddCommentDialog(false)}
        onSubmit={(value) => addComment(value)}
        title='Add a comment'
        visible={showAddCommentDialog}
      />
      <TouchableOpacity
        onPress={() => setShowResults(true)}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>View Results</Text>
      </TouchableOpacity>
      {showResults ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowResults(false)}
          visible={showResults}
        >
          <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
            <PollResults close={() => setShowResults(false)} />
          </SafeAreaView>
        </Modal>
      ) : null}
      <TouchableOpacity
        onPress={endVote}
        style={{
          alignItems: 'center',
          marginHorizontal: 16,
        }}
      >
        <Text>End Vote</Text>
      </TouchableOpacity>
    </View>
  );
};

export const Poll = ({ poll: pollData }: { poll: PollResponse }) => {
  const { client } = useChatContext();
  const { message } = useMessageContext();

  const poll = useMemo<PollClass>(
    () => new PollClass({ client, poll: pollData }),
    [client, pollData],
  );

  const [
    optionVoteCounts,
    ownVotesByOptionId,
    latestVotesByOption,
    answersCount,
    options,
    name,
    maxNumberOfVotes,
  ] = useStateStore(poll.state, selector);

  const addOption = useCallback(
    (optionText: string) => poll.createOption({ text: optionText }),
    [poll],
  );
  const addComment = useCallback(
    (answerText: string) => poll.addAnswer(answerText, message.id),
    [message.id, poll],
  );
  const endVote = useCallback(() => poll.close(), [poll]);

  useEffect(() => {
    poll.registerSubscriptions();
    return poll.unregisterSubscriptions;
  }, [poll]);

  return (
    <PollContextProvider
      value={{
        maxNumberOfVotes,
        options,
        optionVoteCounts,
        poll,
        name,
        ownVotesByOptionId,
        addOption,
        addComment,
        answersCount,
        endVote,
        latestVotesByOption,
      }}
    >
      <PollWithContext />
    </PollContextProvider>
  );
};
