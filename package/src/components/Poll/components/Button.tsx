import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { PollOption } from '../../../../../../stream-chat-js';
import { usePollContext } from '../../../contexts';
import { Check } from '../../../icons';

export type PollButtonProps = {
  onPress: () => void;
};

export const ViewResultsButton = ({ onPress }: PollButtonProps) => (
  <TouchableOpacity onPress={onPress} style={[styles.container]}>
    <Text style={[styles.text]}>View Results</Text>
  </TouchableOpacity>
);

export const EndVoteButton = ({ onPress }: PollButtonProps) => {
  const { is_closed } = usePollContext();
  return is_closed ? null : (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>End Vote</Text>
    </TouchableOpacity>
  );
};

export const AddCommentButton = ({ onPress }: PollButtonProps) => {
  const { allow_answers } = usePollContext();
  return allow_answers ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>Add a comment</Text>
    </TouchableOpacity>
  ) : null;
};

export const ShowAllCommentsButton = ({ onPress }: PollButtonProps) => {
  const { answers_count } = usePollContext();
  return answers_count && answers_count > 0 ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>View {answers_count} comments</Text>
    </TouchableOpacity>
  ) : null;
};

export const SuggestOptionButton = ({ onPress }: PollButtonProps) => {
  const { allow_user_suggested_options } = usePollContext();
  return allow_user_suggested_options ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>Suggest an option</Text>
    </TouchableOpacity>
  ) : null;
};

export const ShowAllOptionsButton = ({ onPress }: PollButtonProps) => {
  const { options } = usePollContext();
  return options && options.length > 10 ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>See all {options.length} options</Text>
    </TouchableOpacity>
  ) : null;
};

export const VoteButton = ({ onPress, option }: PollButtonProps & { option: PollOption }) => {
  const { ownVotesByOptionId } = usePollContext();

  return (
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
  );
};

export const ShowAllVotesButton = ({
  onPress,
  option,
}: PollButtonProps & { option: PollOption }) => {
  const { vote_counts_by_option } = usePollContext();
  return vote_counts_by_option && vote_counts_by_option?.[option.id] > 5 ? (
    <TouchableOpacity onPress={onPress} style={[styles.container]}>
      <Text style={[styles.text]}>Show All</Text>
    </TouchableOpacity>
  ) : null;
};

const styles = StyleSheet.create({
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
