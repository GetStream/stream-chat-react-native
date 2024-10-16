import React, { useCallback, useMemo, useState } from 'react';
import { Modal, SafeAreaView, Text, View } from 'react-native';

import { Poll as PollClass, PollOption as PollOptionClass, PollState } from 'stream-chat';

import {
  AddCommentButton,
  EndVoteButton,
  ShowAllCommentsButton,
  ShowAllOptionsButton,
  SuggestOptionButton,
  ViewResultsButton,
} from './components/Button';
import { PollAnswersList } from './components/PollAnswersList';
import { PollInputDialog } from './components/PollInputDialog';
import { PollOption, ShowAllOptionsContent } from './components/PollOption';
import { PollResults } from './components/PollResults';

import { PollContextProvider, useMessageContext, usePollContext } from '../../contexts';
import { useStateStore } from '../../hooks';

const selector = (nextValue: PollState) =>
  [
    nextValue.vote_counts_by_option,
    nextValue.ownVotesByOptionId,
    nextValue.latest_votes_by_option,
    nextValue.answers_count,
    nextValue.ownAnswer,
    nextValue.options,
    nextValue.name,
    nextValue.max_votes_allowed,
    nextValue.is_closed,
    nextValue.enforce_unique_vote,
    nextValue.allow_answers,
    nextValue.allow_user_suggested_options,
    nextValue.created_by,
  ] as const;

const PollWithContext = () => {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const {
    addComment,
    addOption,
    endVote,
    enforce_unique_vote,
    is_closed,
    max_votes_allowed,
    name,
    options,
  } = usePollContext();
  const subtitle = useMemo(() => {
    if (is_closed) return 'Vote ended';
    if (enforce_unique_vote) return 'Select one';
    if (max_votes_allowed) return `Select up to ${max_votes_allowed}`;
    return 'Select one or more';
  }, [is_closed, enforce_unique_vote, max_votes_allowed]);

  return (
    <View style={{ padding: 15, width: 270 }}>
      <Text style={{ color: '#080707', fontSize: 16, fontWeight: '500' }}>{name}</Text>
      <Text style={{ color: '#7E828B', fontSize: 12 }}>{subtitle}</Text>
      <View style={{ marginTop: 12 }}>
        {options?.slice(0, 10)?.map((option: PollOptionClass) => (
          <PollOption key={`message_poll_option_${option.id}`} option={option} />
        ))}
      </View>
      <ShowAllOptionsButton onPress={() => setShowAllOptions(true)} />
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
      <ShowAllCommentsButton onPress={() => setShowAnswers(true)} />
      <Modal
        animationType='slide'
        onRequestClose={() => setShowAnswers(false)}
        visible={showAnswers}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <PollAnswersList addComment={addComment} close={() => setShowAnswers(false)} />
        </SafeAreaView>
      </Modal>
      <SuggestOptionButton onPress={() => setShowAddOptionDialog(true)} />
      {showAddOptionDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddOptionDialog(false)}
          onSubmit={(value) => addOption(value)}
          title='Suggest an option'
          visible={showAddOptionDialog}
        />
      ) : null}
      <AddCommentButton onPress={() => setShowAddCommentDialog(true)} />
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddCommentDialog(false)}
          onSubmit={(value) => addComment(value)}
          title='Add a comment'
          visible={showAddCommentDialog}
        />
      ) : null}
      <ViewResultsButton onPress={() => setShowResults(true)} />
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
      <EndVoteButton onPress={endVote} />
    </View>
  );
};

export const Poll = ({ poll }: { poll: PollClass }) => {
  const { message } = useMessageContext();

  const [
    vote_counts_by_option,
    ownVotesByOptionId,
    latest_votes_by_option,
    answers_count,
    ownAnswer,
    options,
    name,
    max_votes_allowed,
    is_closed,
    enforce_unique_vote,
    allow_answers,
    allow_user_suggested_options,
    created_by,
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

  return (
    <PollContextProvider
      value={{
        addComment,
        addOption,
        allow_answers,
        allow_user_suggested_options,
        answers_count,
        created_by,
        endVote,
        enforce_unique_vote,
        is_closed,
        latest_votes_by_option,
        max_votes_allowed,
        name,
        vote_counts_by_option,
        options,
        ownAnswer,
        ownVotesByOptionId,
        poll,
      }}
    >
      <PollWithContext />
    </PollContextProvider>
  );
};
