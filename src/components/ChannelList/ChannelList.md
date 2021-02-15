```tsx static
import { View }  from 'react-native';
import { Chat, ChannelList } from 'stream-chat-react-native';

<OverlayProvider>
    <View>
        <Chat client={client}>
            <ChannelList
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
