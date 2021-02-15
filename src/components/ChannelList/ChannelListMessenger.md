```tsx static
import { View }  from 'react-native';
import { Chat, ChannelList, ChannelListMessenger } from 'stream-chat-react-native';

<OverlayProvider>
    <View>
        <Chat client={client}>
            <ChannelList
                List={ChannelListMessenger}
                filters={{
                    members: {
                        $in: ['vishal', 'neil']
                    }
                }}
            />
        </Chat>
    </View>
</OverlayProvider>
```
