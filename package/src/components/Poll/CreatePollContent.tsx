import React, { useCallback, useState } from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { CreatePollData, PollOptionData } from 'stream-chat';

import {
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
} from '../../contexts';

export const CreatePollContentWithContext = () => {
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOptionData[]>([]);
  const [multipleAnswersAllowed, setMultipleAnswersAllowed] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [optionSuggestionsAllowed, setOptionSuggestionsAllowed] = useState(false);

  const { createAndSendPoll, handleClose } = useCreatePollContentContext();

  const CreatePollOption = (option, index) => {
    const updateOptions = (newText) => {
      const newPollOptions = [...pollOptions];
      newPollOptions.splice(index, 1, { ...newPollOptions[index], text: newText });
      setPollOptions(newPollOptions);
    };
    return (
      <TextInput
        key={index}
        onChangeText={updateOptions}
        placeholder='Option'
        style={{
          backgroundColor: '#F7F7F8',
          borderRadius: 12,
          marginTop: 8,
          paddingHorizontal: 16,
          paddingVertical: 18,
        }}
        value={pollOptions[index].text}
      />
    );
  };

  console.log('ISE: ', pollOptions)

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
      <View style={{ margin: 16 }}>
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
      <View style={{ margin: 16 }}>
        <Text style={{ fontSize: 16 }}>Options</Text>
        {pollOptions.map(CreatePollOption)}
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
