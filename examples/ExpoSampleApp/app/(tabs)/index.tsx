import { StyleSheet, View } from 'react-native';
import { ChannelList } from 'stream-chat-expo';
import { useContext, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ChannelSort } from 'stream-chat';
import { AppContext } from '@/context/AppContext';
import { STREAM_USER_DATA } from '@/constants';

const sort: ChannelSort = { last_updated: -1 };
const options = {
  state: true,
  watch: true,
};

export default function ChannelListScreen() {
  const filters = useMemo(
    () => ({
      members: { $in: [STREAM_USER_DATA.id] },
      type: 'messaging',
    }),
    [],
  );
  const router = useRouter();
  const { setChannel } = useContext(AppContext);

  return (
    <View style={styles.container}>
      <ChannelList
        filters={filters}
        onSelect={(channel) => {
          setChannel(channel);
          router.push(`/channel/${channel.cid}`);
        }}
        options={options}
        sort={sort}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
});
