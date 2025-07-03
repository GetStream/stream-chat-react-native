import { Text, View } from 'react-native';
import { Channel } from 'stream-chat';
import { AIStates, useAIState } from 'stream-chat-expo';

export const MyAITypingIndicatorView = ({ channel }: { channel: Channel }) => {
  const { aiState } = useAIState(channel);
  return aiState === AIStates.Generating || aiState === AIStates.Thinking ? (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6200EE',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 75,
        left: 15,
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: '500',
        }}
      >
        G
      </Text>
    </View>
  ) : null;
};
