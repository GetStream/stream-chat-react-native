import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { usePollContext } from '../../../contexts';

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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  text: {},
});
