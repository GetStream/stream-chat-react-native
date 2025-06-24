import React, { useCallback, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { PollComposerState } from 'stream-chat';

import { useTheme, useTranslationContext } from '../../../contexts';
import { useMessageComposer } from '../../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../../hooks/useStateStore';

const pollComposerStateSelector = (state: PollComposerState) => ({
  error: state.errors.max_votes_allowed,
  max_votes_allowed: state.data.max_votes_allowed,
});

export const MultipleAnswersField = () => {
  const [allowMultipleVotes, setAllowMultipleVotes] = useState<boolean>(false);
  const { t } = useTranslationContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { handleFieldBlur, updateFields } = pollComposer;
  const { error, max_votes_allowed } = useStateStore(pollComposer.state, pollComposerStateSelector);

  const {
    theme: {
      colors: { accent_error, bg_user, black },
      poll: {
        createContent: { maxVotes, multipleAnswers },
      },
    },
  } = useTheme();

  const onEnforceUniqueVoteHandler = useCallback(
    async (value: boolean) => {
      setAllowMultipleVotes(value);
      await updateFields({ enforce_unique_vote: !value });
    },
    [updateFields],
  );

  const onChangeTextHandler = useCallback(
    async (newText: string) => {
      await updateFields({ max_votes_allowed: newText });
    },
    [updateFields],
  );

  const onBlurHandler = useCallback(async () => {
    await handleFieldBlur('max_votes_allowed');
  }, [handleFieldBlur]);

  return (
    <View
      style={[styles.multipleAnswersWrapper, { backgroundColor: bg_user }, multipleAnswers.wrapper]}
    >
      <View style={[styles.multipleAnswersRow, multipleAnswers.row]}>
        <Text style={[styles.text, { color: black }, multipleAnswers.title]}>
          {t('Multiple answers')}
        </Text>
        <Switch onValueChange={onEnforceUniqueVoteHandler} value={allowMultipleVotes} />
      </View>
      {allowMultipleVotes ? (
        <View style={[styles.maxVotesWrapper, maxVotes.wrapper]}>
          {max_votes_allowed && error ? (
            <Text
              style={[
                styles.maxVotesValidationText,
                { color: accent_error },
                maxVotes.validationText,
              ]}
            >
              {t(error)}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              inputMode='numeric'
              onBlur={onBlurHandler}
              onChangeText={onChangeTextHandler}
              placeholder={t('Maximum votes per person')}
              style={[styles.maxVotesInput, { color: black }, maxVotes.input]}
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
