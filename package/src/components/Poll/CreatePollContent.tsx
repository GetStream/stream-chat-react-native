import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { CreatePollData, PollOptionData, VotingVisibility } from 'stream-chat';

import { CreatePollOptions, CurrentOptionPositionsCache, PollModalHeader } from './components';

import {
  CreatePollContentContextValue,
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
          style={{ paddingHorizontal: 16, paddingVertical: 18 }}
        >
          <SendPoll
            height={24}
            pathFill={isPollValid ? '#005DFF' : '#B4BBBA'}
            viewBox='0 0 24 24'
            width={24}
          />
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, margin: 16 }}>
        <View>
          <Text style={{ fontSize: 16 }}>Questions</Text>
          <TextInput
            onChangeText={setPollTitle}
            placeholder='Ask a question'
            style={{
              backgroundColor: '#F7F7F8',
              borderRadius: 12,
              fontSize: 16,
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
            value={pollTitle}
          />
        </View>
        <CreatePollOptions
          currentOptionPositions={currentOptionPositions}
          duplicates={duplicates}
          pollOptions={pollOptions}
          setPollOptions={setPollOptions}
        />
        <View style={{ backgroundColor: '#F7F7F8', borderRadius: 12, marginTop: 16 }}>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
          >
            <Text style={{ fontSize: 16 }}>Multiple answers</Text>
            <Switch
              onValueChange={() => setMultipleAnswersAllowed(!multipleAnswersAllowed)}
              value={multipleAnswersAllowed}
            />
          </View>
          {multipleAnswersAllowed ? (
            <View
              style={{
                alignItems: 'flex-start',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 18,
              }}
            >
              {maxVotesPerPersonEnabled && !isMaxNumberOfVotesValid(maxVotesPerPerson) ? (
                <Text
                  style={{ color: '#FF3842', fontSize: 12, left: 16, position: 'absolute', top: 0 }}
                >
                  Type a number from 1 to 10
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row' }}>
                <TextInput
                  inputMode='numeric'
                  onChangeText={setMaxVotesPerPerson}
                  placeholder='Maximum votes per person'
                  style={{ flex: 1, fontSize: 16 }}
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
          style={{
            alignItems: 'center',
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16 }}>Anonymous poll</Text>
          <Switch onValueChange={() => setIsAnonymous(!isAnonymous)} value={isAnonymous} />
        </View>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16 }}>Suggest an option</Text>
          <Switch
            onValueChange={() => setOptionSuggestionsAllowed(!optionSuggestionsAllowed)}
            value={optionSuggestionsAllowed}
          />
        </View>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 18,
          }}
        >
          <Text style={{ fontSize: 16 }}>Add a comment</Text>
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
  createPollOptionHeight,
}: Pick<CreatePollContentContextValue, 'createPollOptionHeight'>) => {
  const { closePollCreationDialog, sendMessage } = useMessageInputContext();
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
      value={{ closePollCreationDialog, createAndSendPoll, createPollOptionHeight }}
    >
      <CreatePollContentWithContext />
    </CreatePollContentProvider>
  );
};
