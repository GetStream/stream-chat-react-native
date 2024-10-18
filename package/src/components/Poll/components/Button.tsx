import React, { useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { PollInputDialog } from './PollInputDialog';
import { ShowAllOptionsContent } from './PollOption';

import { PollOptionFullResults, PollResults } from './PollResults';

import { PollOption } from '../../../../../../stream-chat-js';
import { useChatContext, usePollContext } from '../../../contexts';
import { Check } from '../../../icons';
import { usePollState } from '../hooks/usePollState';

export type PollButtonProps = {
  onPress?: () => void;
};

export const ViewResultsButton = (props: PollButtonProps) => {
  const { message, poll } = usePollContext();
  const [showResults, setShowResults] = useState(false);
  const { onPress = () => setShowResults(true) } = props;
  return (
    <>
      <TouchableOpacity onPress={onPress} style={[styles.container]}>
        <Text style={[styles.text]}>View Results</Text>
      </TouchableOpacity>
      {showResults ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowResults(false)}
          visible={showResults}
        >
          <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
            <PollResults close={() => setShowResults(false)} message={message} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const EndVoteButton = ({ onPress }: PollButtonProps) => {
  const { created_by, is_closed } = usePollState();
  const { client } = useChatContext();
  return !is_closed && created_by?.id === client.userID ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>End Vote</Text>
    </TouchableOpacity>
  ) : null;
};

export const AddCommentButton = (props: PollButtonProps) => {
  const { addComment, allow_answers, is_closed } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress = () => setShowAddCommentDialog(true) } = props;
  return (
    <>
      {!is_closed && allow_answers ? (
        <TouchableOpacity onPress={onPress} style={[styles.container]}>
          <Text style={[styles.text]}>Add a comment</Text>
        </TouchableOpacity>
      ) : null}

      <PollInputDialog
        closeDialog={() => setShowAddCommentDialog(false)}
        onSubmit={addComment}
        title='Add a comment'
        visible={showAddCommentDialog}
      />
    </>
  );
};

export const ShowAllCommentsButton = ({ onPress }: PollButtonProps) => {
  const { answers_count } = usePollState();
  return answers_count && answers_count > 0 ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>View {answers_count} comments</Text>
    </TouchableOpacity>
  ) : null;
};

export const AnswerListAddCommentButton = ({ onPress }: PollButtonProps) => {
  const { ownAnswer } = usePollState();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.answerListAddCommentContainer]}>
      <Text style={[styles.text]}>{ownAnswer ? 'Update your comment' : 'Add a comment'}</Text>
    </TouchableOpacity>
  );
};

export const SuggestOptionButton = (props: PollButtonProps) => {
  const { addOption, allow_user_suggested_options, is_closed } = usePollState();
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const { onPress = () => setShowAddOptionDialog(true) } = props;
  return (
    <>
      {!is_closed && allow_user_suggested_options ? (
        <TouchableOpacity onPress={onPress} style={[styles.container]}>
          <Text style={[styles.text]}>Suggest an option</Text>
        </TouchableOpacity>
      ) : null}
      <PollInputDialog
        closeDialog={() => setShowAddOptionDialog(false)}
        onSubmit={addOption}
        title='Suggest an option'
        visible={showAddOptionDialog}
      />
    </>
  );
};

export const ShowAllOptionsButton = (props: PollButtonProps) => {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const { message, poll } = usePollContext();
  const { options } = usePollState();
  const { onPress = () => setShowAllOptions(true) } = props;
  return (
    <>
      {options && options.length > 10 ? (
        <TouchableOpacity onPress={onPress} style={[styles.container]}>
          <Text style={[styles.text]}>See all {options.length} options</Text>
        </TouchableOpacity>
      ) : null}
      {showAllOptions ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowAllOptions(false)}
          visible={showAllOptions}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ShowAllOptionsContent
              close={() => setShowAllOptions(false)}
              message={message}
              poll={poll}
            />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const VoteButton = ({ onPress, option }: PollButtonProps & { option: PollOption }) => {
  const { is_closed, ownVotesByOptionId } = usePollState();

  return !is_closed ? (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.voteContainer,
        {
          backgroundColor: ownVotesByOptionId[option.id] ? '#005DFF' : 'transparent',
          borderColor: ownVotesByOptionId[option.id] ? '#005DFF' : '#B4BBBA',
        },
      ]}
    >
      {ownVotesByOptionId[option.id] ? <Check height={15} pathFill='white' width={20} /> : null}
    </TouchableOpacity>
  ) : null;
};

export const ShowAllVotesButton = (props: PollButtonProps & { option: PollOption }) => {
  const [showAllVotes, setShowAllVotes] = useState(false);
  const { onPress = () => setShowAllVotes(true), option } = props;
  const { vote_counts_by_option } = usePollState();
  return (
    <>
      {vote_counts_by_option && vote_counts_by_option?.[option.id] > 5 ? (
        <TouchableOpacity onPress={onPress} style={[styles.container]}>
          <Text style={[styles.text]}>Show All</Text>
        </TouchableOpacity>
      ) : null}
      {showAllVotes ? (
        <Modal
          animationType='fade'
          onRequestClose={() => setShowAllVotes(false)}
          visible={showAllVotes}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <PollOptionFullResults close={() => setShowAllVotes(false)} option={option} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  answerListAddCommentContainer: {
    alignItems: 'center',
    backgroundColor: '#F7F7F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  container: {
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 11,
  },
  text: { color: '#005DFF', fontSize: 16 },
  voteContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
});
