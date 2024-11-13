import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { CreatePollData, PollOptionData, VotingVisibility } from 'stream-chat';

import { CreatePollOptions, CurrentOptionPositionsCache, PollModalHeader } from './components';

import {
  CreatePollContentContextValue,
  CreatePollContentProvider,
  InputMessageInputContextValue,
  useChatContext,
  useCreatePollContentContext,
  useTheme,
  useTranslationContext,
} from '../../contexts';
import { SendPoll } from '../../icons';

export const isMaxNumberOfVotesValid = (maxNumberOfVotes: string) => {
  const parsedMaxNumberOfVotes = Number(maxNumberOfVotes);

  return (
    !isNaN(parsedMaxNumberOfVotes) && parsedMaxNumberOfVotes > 1 && parsedMaxNumberOfVotes <= 10
  );
};

export const CreatePollContent = () => {
  const { t } = useTranslationContext();
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionData[]>([{ text: '' }]);
  const [multipleAnswersAllowed, setMultipleAnswersAllowed] = useState(false);
  const [maxVotesPerPerson, setMaxVotesPerPerson] = useState('');
  const [maxVotesPerPersonEnabled, setMaxVotesPerPersonEnabled] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [optionSuggestionsAllowed, setOptionSuggestionsAllowed] = useState(false);
  const [commentsAllowed, setCommentsAllowed] = useState(false);
  const [duplicates, setDuplicates] = useState<string[]>([]);

  const { closePollCreationDialog, createAndSendPoll } = useCreatePollContentContext();

  // positions and index lookup map
  // TODO: Please rethink the structure of this, bidirectional data flow is not great
  const currentOptionPositions = useSharedValue<CurrentOptionPositionsCache>({
    inverseIndexCache: { 0: 0 },
    positionCache: { 0: { updatedIndex: 0, updatedTop: 0 } },
  });

  const {
    theme: {
      colors: { accent_error, bg_user, black, white },
      poll: {
        createContent: {
          addComment,
          anonymousPoll,
          headerContainer,
          maxVotes,
          multipleAnswers,
          name,
          scrollView,
          sendButton,
          suggestOption,
        },
      },
    },
  } = useTheme();

  useEffect(() => {
    const seenTexts = new Set<string>();
    const duplicateTexts = new Set<string>();
    for (const option of pollOptions) {
      const { text } = option;
      if (seenTexts.has(text)) {
        duplicateTexts.add(text);
      }
      if (text.length > 0) {
        seenTexts.add(text);
      }
    }

    setDuplicates(Array.from(duplicateTexts));
  }, [pollOptions]);

  const isPollValid =
    pollTitle &&
    pollTitle?.length > 0 &&
    duplicates.length === 0 &&
    ((maxVotesPerPersonEnabled && isMaxNumberOfVotesValid(maxVotesPerPerson)) ||
      !maxVotesPerPersonEnabled);

  return (
    <>
      <View style={[styles.headerContainer, { backgroundColor: white }, headerContainer]}>
        <PollModalHeader onPress={() => closePollCreationDialog?.()} title={t('Create Poll')} />
        <TouchableOpacity
          disabled={!isPollValid}
          onPress={() => {
            const currentPollOptions = Object.assign({}, pollOptions);
            const reorderedPollOptions = [];

            for (let i = 0; i < pollOptions.length; i++) {
              const currentOption =
                currentPollOptions[currentOptionPositions.value.inverseIndexCache[i]];
              if (currentOption.text.length > 0) {
                reorderedPollOptions.push(currentOption);
              }
            }

            createAndSendPoll({
              allow_answers: commentsAllowed,
              allow_user_suggested_options: optionSuggestionsAllowed,
              enforce_unique_vote: !multipleAnswersAllowed,
              name: pollTitle,
              options: reorderedPollOptions,
              voting_visibility: isAnonymous ? VotingVisibility.anonymous : VotingVisibility.public,
              ...(isMaxNumberOfVotesValid(maxVotesPerPerson) && maxVotesPerPersonEnabled
                ? { max_votes_allowed: Number(maxVotesPerPerson) }
                : {}),
            });
          }}
          style={[styles.sendButton, sendButton]}
        >
          <SendPoll
            height={24}
            pathFill={isPollValid ? '#005DFF' : '#B4BBBA'}
            viewBox='0 0 24 24'
            width={24}
          />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 70 }}
        style={[styles.scrollView, { backgroundColor: white }, scrollView]}
      >
        <Text style={[styles.text, { color: black }, name.title]}>{t<string>('Questions')}</Text>
        <TextInput
          onChangeText={setPollTitle}
          placeholder={t('Ask a question')}
          style={[
            styles.textInputWrapper,
            styles.text,
            { backgroundColor: bg_user, color: black },
            name.input,
          ]}
          value={pollTitle}
        />
        <CreatePollOptions
          currentOptionPositions={currentOptionPositions}
          duplicates={duplicates}
          pollOptions={pollOptions}
          setPollOptions={setPollOptions}
        />
        <View
          style={[
            styles.multipleAnswersWrapper,
            { backgroundColor: bg_user },
            multipleAnswers.wrapper,
          ]}
        >
          <View style={[styles.multipleAnswersRow, multipleAnswers.row]}>
            <Text style={[styles.text, { color: black }, multipleAnswers.title]}>
              {t<string>('Multiple answers')}
            </Text>
            <Switch
              onValueChange={() => {
                if (multipleAnswersAllowed) {
                  setMaxVotesPerPersonEnabled(false);
                }
                setMultipleAnswersAllowed(!multipleAnswersAllowed);
              }}
              value={multipleAnswersAllowed}
            />
          </View>
          {multipleAnswersAllowed ? (
            <View style={[styles.maxVotesWrapper, maxVotes.wrapper]}>
              {maxVotesPerPersonEnabled && !isMaxNumberOfVotesValid(maxVotesPerPerson) ? (
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
                  onChangeText={setMaxVotesPerPerson}
                  placeholder={t('Maximum votes per person')}
                  style={[styles.maxVotesInput, { color: black }, maxVotes.input]}
                  value={maxVotesPerPerson}
                />
                <Switch
                  onValueChange={() => setMaxVotesPerPersonEnabled(!maxVotesPerPersonEnabled)}
                  value={maxVotesPerPersonEnabled}
                />
              </View>
            </View>
          ) : null}
        </View>
        <View
          style={[styles.textInputWrapper, { backgroundColor: bg_user }, anonymousPoll.wrapper]}
        >
          <Text style={[styles.text, { color: black }, anonymousPoll.title]}>
            {t<string>('Anonymous poll')}
          </Text>
          <Switch onValueChange={() => setIsAnonymous(!isAnonymous)} value={isAnonymous} />
        </View>
        <View
          style={[styles.textInputWrapper, { backgroundColor: bg_user }, suggestOption.wrapper]}
        >
          <Text style={[styles.text, { color: black }, suggestOption.title]}>
            {t<string>('Suggest an option')}
          </Text>
          <Switch
            onValueChange={() => setOptionSuggestionsAllowed(!optionSuggestionsAllowed)}
            value={optionSuggestionsAllowed}
          />
        </View>
        <View style={[styles.textInputWrapper, { backgroundColor: bg_user }, addComment.wrapper]}>
          <Text style={[styles.text, { color: black }, addComment.title]}>
            {t<string>('Add a comment')}
          </Text>
          <Switch
            onValueChange={() => setCommentsAllowed(!commentsAllowed)}
            value={commentsAllowed}
          />
        </View>
      </ScrollView>
    </>
  );
};

export const CreatePoll = ({
  closePollCreationDialog,
  CreatePollContent: CreatePollContentOverride,
  createPollOptionHeight,
  sendMessage,
}: Pick<
  CreatePollContentContextValue,
  'createPollOptionHeight' | 'closePollCreationDialog' | 'sendMessage'
> &
  Pick<InputMessageInputContextValue, 'CreatePollContent'>) => {
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(
    async (pollData: CreatePollData) => {
      const poll = await client.polls.createPoll(pollData);
      await sendMessage({ customMessageData: { poll_id: poll.id } });
      closePollCreationDialog?.();
    },
    [client, sendMessage, closePollCreationDialog],
  );

  return (
    <CreatePollContentProvider
      value={{ closePollCreationDialog, createAndSendPoll, createPollOptionHeight, sendMessage }}
    >
      {CreatePollContentOverride ? <CreatePollContentOverride /> : <CreatePollContent />}
    </CreatePollContentProvider>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between' },
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
  scrollView: { flex: 1, padding: 16 },
  sendButton: { paddingHorizontal: 16, paddingVertical: 18 },
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
