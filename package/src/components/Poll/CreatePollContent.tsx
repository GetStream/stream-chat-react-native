import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { CreatePollData, PollOptionData, VotingVisibility } from 'stream-chat';

import { CreatePollOptions, CurrentOptionPositionsCache, PollModalHeader } from './components';

import {
  CreatePollContentContextValue,
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useTheme,
} from '../../contexts';
import { SendPoll } from '../../icons';

export const isMaxNumberOfVotesValid = (maxNumberOfVotes: string) => {
  const parsedMaxNumberOfVotes = Number(maxNumberOfVotes);

  return (
    !isNaN(parsedMaxNumberOfVotes) && parsedMaxNumberOfVotes > 0 && parsedMaxNumberOfVotes <= 10
  );
};

export const CreatePollContentWithContext = () => {
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
      colors: { bg_user },
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

  const isPollValid = useMemo(
    () =>
      pollTitle &&
      pollTitle?.length > 0 &&
      duplicates.length === 0 &&
      ((maxVotesPerPersonEnabled && isMaxNumberOfVotesValid(maxVotesPerPerson)) ||
        !maxVotesPerPersonEnabled),
    [duplicates, maxVotesPerPerson, maxVotesPerPersonEnabled, pollTitle],
  );

  return (
    <>
      <View style={[styles.headerContainer, headerContainer]}>
        <PollModalHeader onPress={() => closePollCreationDialog?.()} title='Create Poll' />
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
      <ScrollView style={[styles.scrollView, scrollView]}>
        <Text style={[styles.text, name.title]}>Questions</Text>
        <TextInput
          onChangeText={setPollTitle}
          placeholder='Ask a question'
          style={[styles.textInputWrapper, styles.text, { backgroundColor: bg_user }, name.input]}
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
            <Text style={[styles.text, multipleAnswers.title]}>Multiple answers</Text>
            <Switch
              onValueChange={() => setMultipleAnswersAllowed(!multipleAnswersAllowed)}
              value={multipleAnswersAllowed}
            />
          </View>
          {multipleAnswersAllowed ? (
            <View style={[styles.maxVotesWrapper, maxVotes.wrapper]}>
              {maxVotesPerPersonEnabled && !isMaxNumberOfVotesValid(maxVotesPerPerson) ? (
                <Text style={[styles.maxVotesValidationText, maxVotes.validationText]}>
                  Type a number from 1 to 10
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  inputMode='numeric'
                  onChangeText={setMaxVotesPerPerson}
                  placeholder='Maximum votes per person'
                  style={[styles.maxVotesInput, maxVotes.input]}
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
          <Text style={[styles.text, anonymousPoll.title]}>Anonymous poll</Text>
          <Switch onValueChange={() => setIsAnonymous(!isAnonymous)} value={isAnonymous} />
        </View>
        <View
          style={[styles.textInputWrapper, { backgroundColor: bg_user }, suggestOption.wrapper]}
        >
          <Text style={[styles.text, suggestOption.title]}>Suggest an option</Text>
          <Switch
            onValueChange={() => setOptionSuggestionsAllowed(!optionSuggestionsAllowed)}
            value={optionSuggestionsAllowed}
          />
        </View>
        <View style={[styles.textInputWrapper, { backgroundColor: bg_user }, addComment.wrapper]}>
          <Text style={[styles.text, addComment.title]}>Add a comment</Text>
          <Switch
            onValueChange={() => setCommentsAllowed(!commentsAllowed)}
            value={commentsAllowed}
          />
        </View>
      </ScrollView>
    </>
  );
};

export const CreatePollContent = ({
  closePollCreationDialog,
  createPollOptionHeight,
  sendMessage,
}: Pick<
  CreatePollContentContextValue,
  'createPollOptionHeight' | 'sendMessage' | 'closePollCreationDialog'
>) => {
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(
    async (pollData: CreatePollData) => {
      const poll = await client.polls.createPoll(pollData);
      await sendMessage({ customMessageData: { poll_id: poll.id as string } });
      closePollCreationDialog?.();
    },
    [client, sendMessage, closePollCreationDialog],
  );

  return (
    <CreatePollContentProvider
      value={{ closePollCreationDialog, createAndSendPoll, createPollOptionHeight, sendMessage }}
    >
      <CreatePollContentWithContext />
    </CreatePollContentProvider>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  maxVotesInput: { flex: 1, fontSize: 16 },
  maxVotesValidationText: {
    color: '#FF3842',
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
