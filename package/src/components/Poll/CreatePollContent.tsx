import React, { useCallback, useState } from 'react';
import { SafeAreaView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { CreatePollData, PollOptionData, VotingVisibility } from 'stream-chat';

import type { CurrentOptionPositionsCache } from './components/CreatePollOptions';
import { CreatePollOptions } from './components/CreatePollOptions';

import {
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
} from '../../contexts';

export const CreatePollContentWithContext = () => {
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionData[]>([{ text: '' }]);
  const [multipleAnswersAllowed, setMultipleAnswersAllowed] = useState(false);
  const [maxVotesPerPerson, setMaxVotesPerPerson] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [optionSuggestionsAllowed, setOptionSuggestionsAllowed] = useState(false);
  const [commentsAllowed, setCommentsAllowed] = useState(false);

  const { closePollCreationDialog, createAndSendPoll } = useCreatePollContentContext();

  // positions and index lookup map
  // TODO: Please rethink the structure of this, bidirectional data flow is not great
  const currentOptionPositions = useSharedValue<CurrentOptionPositionsCache>({
    inverseIndexCache: { 0: 0 },
    positionCache: { 0: { updatedIndex: 0, updatedTop: 0 } },
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={closePollCreationDialog}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>Create Poll</Text>
        <TouchableOpacity
          onPress={() => {
            const currentPollOptions = Object.assign({}, pollOptions);
            const reorderedPollOptions = [];

            for (let i = 0; i < pollOptions.length; i++) {
              reorderedPollOptions.push(
                currentPollOptions[currentOptionPositions.value.inverseIndexCache[i]],
              );
            }
            const parsedMaxVotesPerPerson = Number(maxVotesPerPerson);
            createAndSendPoll({
              allow_answers: commentsAllowed,
              allow_user_suggested_options: optionSuggestionsAllowed,
              enforce_unique_vote: !multipleAnswersAllowed,
              name: pollTitle,
              options: reorderedPollOptions,
              voting_visibility: isAnonymous ? VotingVisibility.anonymous : VotingVisibility.public,
              ...(!isNaN(parsedMaxVotesPerPerson) && parsedMaxVotesPerPerson > 0
                ? { max_votes_allowed: parsedMaxVotesPerPerson }
                : {}),
            });
          }}
        >
          <Text>SEND</Text>
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
              {maxVotesPerPerson.length > 0 &&
              (Number(maxVotesPerPerson) < 1 || Number(maxVotesPerPerson) > 10) ? (
                <Text
                  style={{ color: '#FF3842', fontSize: 12, left: 16, position: 'absolute', top: 0 }}
                >
                  Type a number from 1 to 10
                </Text>
              ) : null}
              <TextInput
                inputMode='numeric'
                onChangeText={setMaxVotesPerPerson}
                placeholder='Maximum votes per person'
                style={{ flex: 1, fontSize: 16 }}
                value={maxVotesPerPerson}
              />
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
    </SafeAreaView>
  );
};

export const CreatePollContent = () => {
  const { closePollCreationDialog, sendMessage } = useMessageInputContext();
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(
    async (pollData: CreatePollData) => {
      // TODO: replace with stateful name
      const poll = await client.polls.createPoll(pollData);
      console.log('CREATED POLL: ', poll.id);
      await sendMessage({ customMessageData: { poll_id: poll.id as string } });
      console.log('ISE: SENDING: ', pollData.options);
      closePollCreationDialog();
    },
    [client, sendMessage, closePollCreationDialog],
  );

  return (
    <CreatePollContentProvider value={{ closePollCreationDialog, createAndSendPoll }}>
      <CreatePollContentWithContext />
    </CreatePollContentProvider>
  );
};
