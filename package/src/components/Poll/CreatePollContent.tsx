import React, { useCallback } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import {
  CreatePollContentProvider,
  useChatContext,
  useCreatePollContentContext,
  useMessageInputContext,
} from '../../contexts';

export const CreatePollContentWithContext = () => {
  const { createAndSendPoll, handleClose } = useCreatePollContentContext();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => handleClose()}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>Create Poll</Text>
        <TouchableOpacity onPress={createAndSendPoll}>
          <Text>SEND</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export const CreatePollContent = (props: { handleClose: () => void }) => {
  const { handleClose } = props;
  const { sendMessage } = useMessageInputContext();
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(async () => {
    // TODO: replace with stateful name
    const pollName = 'testing-polls';
    const poll = await client.polls.createPoll({ name: pollName });
    console.log('CREATED POLL: ', poll.id);
    await sendMessage({ customMessageData: { poll_id: poll.id as string } });
    handleClose();
  }, [client, sendMessage, handleClose]);

  return (
    <CreatePollContentProvider value={{ createAndSendPoll, handleClose }}>
      <CreatePollContentWithContext />
    </CreatePollContentProvider>
  );
};
