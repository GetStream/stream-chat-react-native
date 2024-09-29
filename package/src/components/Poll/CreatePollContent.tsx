import React, { useCallback, useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';

import { CreatePollData, PollOptionData } from 'stream-chat';

import {
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
} from '../../contexts';

const CreatePollOption = ({
  handleChangeText,
  index,
  option,
}: {
  handleChangeText: (newText: string, index: number) => void;
  index: number;
  option: PollOptionData;
}) => (
  <TextInput
    onChangeText={(newText) => handleChangeText(newText, index)}
    placeholder='Option'
    style={{
      backgroundColor: '#F7F7F8',
      borderRadius: 12,
      marginTop: 8,
      paddingHorizontal: 16,
      paddingVertical: 18,
    }}
    value={option.text}
  />
);

const MemoizedCreatePollOption = React.memo(CreatePollOption);

export const CreatePollContentWithContext = () => {
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionData[]>([]);
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
          onPress={() => createAndSendPoll({ name: pollTitle, options: pollOptions })}
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
              marginTop: 8,
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
            value={pollTitle}
          />
        </View>
        <View style={{ marginTop: 16 }}>
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
            <Text>Add an option</Text>
          </TouchableOpacity>
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
