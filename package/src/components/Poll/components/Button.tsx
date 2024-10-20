import React, { useCallback, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PollAnswersList } from './PollAnswersList';
import { PollInputDialog } from './PollInputDialog';
import { ShowAllOptionsContent } from './PollOption';

import { PollOptionFullResults, PollResults } from './PollResults';

import { Poll, PollOption } from '../../../../../../stream-chat-js';
import { useChatContext, usePollContext } from '../../../contexts';
import { Check } from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageType } from '../../MessageList/hooks/useMessageList';
import { usePollState } from '../hooks/usePollState';

export type PollButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  onPress?: ({
    message,
    poll,
  }: {
    message: MessageType<StreamChatGenerics>;
    poll: Poll<StreamChatGenerics>;
  }) => void;
};

export type PollVoteButtonProps = {
  onPress?: () => void;
};

export const ViewResultsButton = (props: PollButtonProps) => {
  const { message, poll } = usePollContext();
  const [showResults, setShowResults] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowResults(true);
  }, [message, onPress, poll]);

  return (
    <>
      <TouchableOpacity onPress={onPressHandler} style={[styles.container]}>
        <Text style={[styles.text]}>View Results</Text>
      </TouchableOpacity>
      {showResults ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowResults(false)}
          visible={showResults}
        >
          <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', paddingVertical: 18 }}>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Text>BACK</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 32 }}>Poll Results</Text>
            </View>
            <PollResults message={message} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const EndVoteButton = () => {
  const { created_by, endVote, is_closed } = usePollState();
  const { client } = useChatContext();
  return !is_closed && created_by?.id === client.userID ? (
    <TouchableOpacity onPress={endVote} style={[styles.container]}>
      <Text style={[styles.text]}>End Vote</Text>
    </TouchableOpacity>
  ) : null;
};

export const AddCommentButton = (props: PollButtonProps) => {
  const { message, poll } = usePollContext();
  const { addComment, allow_answers, is_closed } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  return (
    <>
      {!is_closed && allow_answers ? (
        <TouchableOpacity onPress={onPressHandler} style={[styles.container]}>
          <Text style={[styles.text]}>Add a comment</Text>
        </TouchableOpacity>
      ) : null}

      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddCommentDialog(false)}
          onSubmit={addComment}
          title='Add a comment'
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export const ShowAllCommentsButton = (props: PollButtonProps) => {
  const { message, poll } = usePollContext();
  const { answers_count } = usePollState();
  const [showAnswers, setShowAnswers] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAnswers(true);
  }, [message, onPress, poll]);

  return (
    <>
      {answers_count && answers_count > 0 ? (
        <TouchableOpacity onPress={onPressHandler} style={[styles.container]}>
          <Text style={[styles.text]}>View {answers_count} comments</Text>
        </TouchableOpacity>
      ) : null}
      {showAnswers ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowAnswers(false)}
          visible={showAnswers}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => setShowAnswers(false)}>
                <Text>BACK</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '500', marginLeft: 32 }}>Poll Comments</Text>
            </View>
            <PollAnswersList message={message} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const AnswerListAddCommentButton = (props: PollButtonProps) => {
  const { message, poll } = usePollContext();
  const { addComment, ownAnswer } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  return (
    <>
      <TouchableOpacity onPress={onPressHandler} style={[styles.answerListAddCommentContainer]}>
        <Text style={[styles.text]}>{ownAnswer ? 'Update your comment' : 'Add a comment'}</Text>
      </TouchableOpacity>
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddCommentDialog(false)}
          onSubmit={addComment}
          title='Add a comment'
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export const SuggestOptionButton = (props: PollButtonProps) => {
  const { message, poll } = usePollContext();
  const { addOption, allow_user_suggested_options, is_closed } = usePollState();
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddOptionDialog(true);
  }, [message, onPress, poll]);

  return (
    <>
      {!is_closed && allow_user_suggested_options ? (
        <TouchableOpacity onPress={onPressHandler} style={[styles.container]}>
          <Text style={[styles.text]}>Suggest an option</Text>
        </TouchableOpacity>
      ) : null}
      {showAddOptionDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddOptionDialog(false)}
          onSubmit={addOption}
          title='Suggest an option'
          visible={showAddOptionDialog}
        />
      ) : null}
    </>
  );
};

export const ShowAllOptionsButton = (props: PollButtonProps) => {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const { message, poll } = usePollContext();
  const { options } = usePollState();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAllOptions(true);
  }, [message, onPress, poll]);

  return (
    <>
      {options && options.length > 10 ? (
        <TouchableOpacity onPress={onPressHandler} style={[styles.container]}>
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

export const VoteButton = ({ onPress, option }: PollVoteButtonProps & { option: PollOption }) => {
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
  const { message, poll } = usePollContext();
  const { vote_counts_by_option } = usePollState();
  const [showAllVotes, setShowAllVotes] = useState(false);
  const { onPress, option } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAllVotes(true);
  }, [message, onPress, poll]);

  return (
    <>
      {vote_counts_by_option && vote_counts_by_option?.[option.id] > 5 ? (
        <TouchableOpacity onPress={onPressHandler} style={[styles.container]}>
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
            <PollOptionFullResults
              close={() => setShowAllVotes(false)}
              message={message}
              option={option}
              poll={poll}
            />
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
