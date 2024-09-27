import React, { useCallback } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';

import { useChatContext, useMessageInputContext } from '../../contexts';

export const CreatePollContent = (props: { setShowModal: (val: boolean) => void }) => {
  const { setShowModal } = props;
  const { sendMessage } = useMessageInputContext();
  const { client } = useChatContext();

  const createAndSendPoll = useCallback(async () => {
    // TODO: replace with stateful name
    const pollName = 'testing-polls';
    const poll = await client.polls.createPoll({ name: pollName });
    console.log('CREATED POLL: ', poll.id);
    await sendMessage({ customMessageData: { poll_id: poll.id as string } });
    setShowModal(false);
  }, [client, sendMessage]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => setShowModal(false)}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text>THIS IS A MODAL</Text>
        <TouchableOpacity onPress={createAndSendPoll}>
          <Text>SEND</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
