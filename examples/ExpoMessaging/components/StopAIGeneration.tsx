import { Text, View } from 'react-native';
import { Channel } from 'stream-chat';
import { AIStates, useAIState } from 'stream-chat-expo';

export const MyStopGenerationButton = ({ channel }: { channel: Channel }) => {
  const { aiState } = useAIState(channel);

  return aiState === AIStates.Generating ? (
    <View style={{ padding: 20, backgroundColor: '#D8BFD8' }}>
      <Text>Stop generation</Text>
    </View>
  ) : null;
};
