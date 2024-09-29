import React, { useCallback, useState } from 'react';
import { SafeAreaView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { CreatePollData, PollOptionData, VotingVisibility } from 'stream-chat';

import {
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
} from '../../contexts';
import { DragHandle } from '../../icons';

const CreatePollOption = ({
  handleChangeText,
  index,
  option,
}: {
  handleChangeText: (newText: string, index: number) => void;
  index: number;
  option: PollOptionData;
}) => (
  <View
    style={{
      alignItems: 'center',
      backgroundColor: '#F7F7F8',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 18,
    }}
  >
    <TextInput
      onChangeText={(newText) => handleChangeText(newText, index)}
      placeholder='Option'
      style={{ flex: 1, fontSize: 16 }}
      value={option.text}
    />
    <DragHandle pathFill='#7E828B' />
  </View>
);

const MemoizedCreatePollOption = React.memo(CreatePollOption);

export const CreatePollContentWithContext = () => {
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionData[]>([{ text: '' }]);
  const [multipleAnswersAllowed, setMultipleAnswersAllowed] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [optionSuggestionsAllowed, setOptionSuggestionsAllowed] = useState(false);

  const { createAndSendPoll, handleClose } = useCreatePollContentContext();

  const updateOptions = useCallback((newText: string, index: number) => {
    setPollOptions((prevOptions) =>
      prevOptions.map((option, idx) => (idx === index ? { ...option, text: newText } : option)),
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => handleClose()}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>Create Poll</Text>
        <TouchableOpacity
          onPress={() =>
            createAndSendPoll({
              allow_user_suggested_options: optionSuggestionsAllowed,
              enforce_unique_vote: !multipleAnswersAllowed,
              name: pollTitle,
              options: pollOptions,
              voting_visibility: isAnonymous ? VotingVisibility.anonymous : VotingVisibility.public,
            })
          }
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
        <View style={{ marginVertical: 16 }}>
          <Text style={{ fontSize: 16 }}>Options</Text>
          {pollOptions.map((option, index) => (
            <MemoizedCreatePollOption
              handleChangeText={updateOptions}
              index={index}
              key={index}
              option={option}
            />
          ))}
          <TouchableOpacity
            onPress={() => setPollOptions([...pollOptions, { text: '' }])}
            style={{
              backgroundColor: '#F7F7F8',
              borderRadius: 12,
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
          >
            <Text style={{ fontSize: 16 }}>Add an option</Text>
          </TouchableOpacity>
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
          <Text style={{ fontSize: 16 }}>Multiple answers</Text>
          <Switch
            onValueChange={() => setMultipleAnswersAllowed(!multipleAnswersAllowed)}
            value={multipleAnswersAllowed}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export const CreatePollContent = (props: { handleClose: () => void }) => {
  const { handleClose } = props;
  const { sendMessage } = useMessageInputContext();
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(
    async (pollData: CreatePollData) => {
      // TODO: replace with stateful name
      const poll = await client.polls.createPoll(pollData);
      console.log('CREATED POLL: ', poll.id);
      await sendMessage({ customMessageData: { poll_id: poll.id as string } });
      // console.log('ISE: SENDING: ', pollData.options);
      handleClose();
    },
    [client, sendMessage, handleClose],
  );

  return (
    <CreatePollContentProvider value={{ createAndSendPoll, handleClose }}>
      <CreatePollContentWithContext />
    </CreatePollContentProvider>
  );
};
