import { AsyncStorage } from './native';
import { ChannelState } from 'stream-chat';

export const storeChannelsToAsyncStorage = async (channels) => {
  const channelsToStore = channels.map((c) => {
    const countUnread = c.countUnread();
    const config = c.getConfig();
    return {
      type: c.type,
      id: c.id,
      // used by the frontend, gets updated:
      data: c.data,
      cid: c.cid,
      // listeners: c.listeners,
      // perhaps the state variable should be private
      state: {
        // watcher_count: { ...c.state.watcher_count },
        // typing: { ...c.state.typing },
        // read: { ...c.state.read },
        messages: [...c.state.messages],
        // threads: { ...c.state.threads },
        // a list of users to hide messages from
        // mutedUsers: [...c.state.mutedUsers],
        // watchers: { ...c.state.watchers },
        members: { ...c.state.members },
        // last_message_at: { ...c.state.last_message_at },
      },
      initialized: c.initialized,
      // lastTypingEvent: c.lastTypingEvent,
      // isTyping: c.isTyping,
      // disconnected: c.disconnected,
      countUnread,
      config,
    };
  });

  await AsyncStorage.setItem(
    '@stream-chat:channelList',
    JSON.stringify(channelsToStore),
  );
};

export const getChannelsFromAsyncStorage = async () => {
  // console.time('getPart');
  const channelsStr = await AsyncStorage.getItem('@stream-chat:channelList');
  // console.timeEnd('getPart');
  // console.time('parsing');
  const channels = JSON.parse(channelsStr);
  channels.forEach((c) => {
    const stateValues = { ...c.state };
    c.countUnread = () => c.countUnread;
    c.on = () => {};
    c.off = () => {};
    c.watch = () => {};
    c.getConfig = () => c.config;
    c.keystroke = () =>
      new Promise((resolve) => {
        resolve();
      });

    c.state = new ChannelState(c);
    // c.state.watcher_count = stateValues.watcher_count;
    // c.state.typing = stateValues.typing;
    // c.state.read = stateValues.read;
    c.state.messages = stateValues.messages;
    // c.state.threads = stateValues.threads;
    // c.state.mutedUsers = stateValues.mutedUsers;
    // c.state.watchers = stateValues.watchers;
    c.state.members = stateValues.members;
    // c.state.last_message_at = stateValues.last_message_at;
  });
  // console.timeEnd('parsing');
  return channels;
};
