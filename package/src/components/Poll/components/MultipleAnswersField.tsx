import React from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { PollComposerState } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';

export const isMaxNumberOfVotesValid = (maxNumberOfVotes: string) => {
  const parsedMaxNumberOfVotes = Number(maxNumberOfVotes);

  return (
    !isNaN(parsedMaxNumberOfVotes) && parsedMaxNumberOfVotes > 1 && parsedMaxNumberOfVotes <= 10
  );
};

const pollComposerStateSelector = (state: PollComposerState) => ({
  enforce_unique_vote: state.data.enforce_unique_vote,
  error: state.errors.max_votes_allowed,
  max_votes_allowed: state.data.max_votes_allowed,
});

export const MultipleAnswersField = () => {
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { enforce_unique_vote, max_votes_allowed } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );

  const {
    theme: {
      colors: { accent_error, bg_user, black },
      poll: {
        createContent: { maxVotes, multipleAnswers },
      },
    },
  } = useTheme();

  return (
    <View
      style={[styles.multipleAnswersWrapper, { backgroundColor: bg_user }, multipleAnswers.wrapper]}
    >
      <View style={[styles.multipleAnswersRow, multipleAnswers.row]}>
        <Text style={[styles.text, { color: black }, multipleAnswers.title]}>
          {t<string>('Multiple answers')}
        </Text>
        <Switch
          onValueChange={(value) => {
            pollComposer.updateFields({ enforce_unique_vote: !value });
          }}
          value={!enforce_unique_vote}
        />
      </View>
      {!enforce_unique_vote ? (
        <View style={[styles.maxVotesWrapper, maxVotes.wrapper]}>
          {max_votes_allowed && !isMaxNumberOfVotesValid(max_votes_allowed) ? (
            <Text
              style={[
                styles.maxVotesValidationText,
                { color: accent_error },
                maxVotes.validationText,
              ]}
            >
              {t<string>('Type a number from 2 to 10')}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              inputMode='numeric'
              onBlur={() => pollComposer.handleFieldBlur('max_votes_allowed')}
              onChangeText={(text) => pollComposer.updateFields({ max_votes_allowed: text })}
              placeholder={t('Maximum votes per person')}
              style={[styles.maxVotesInput, { color: black }, maxVotes.input]}
              value={max_votes_allowed}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  maxVotesInput: { flex: 1, fontSize: 16 },
  maxVotesValidationText: {
    fontSize: 12,
    left: 16,
    position: 'absolute',
    top: 0,
  },
  maxVotesWrapper: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  multipleAnswersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  multipleAnswersWrapper: { borderRadius: 12, marginTop: 16 },
  text: { fontSize: 16 },
  textInputWrapper: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
});
