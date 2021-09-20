require('dotenv').config({ path: `${__dirname}/.env` });

module.exports = {
  apiKey: process.env.API_KEY,
  secret: process.env.SECRET,
  baseUrl: 'https://chat-us-east-staging.stream-io-api.com',

  channelType: 'messaging',

  /**
   * This user will be used to create/update stuff using server-side token.
   */
  serverSideUser: 'e2etest1',

  // ============================================================
  //
  //  CONFIG USED FOR `create-channels`  command
  //
  // ============================================================

  /**
   * This is the prefix that will be added to channel ids.
   * As long as you don't change this value, new channels won't be created on subsequent runs
   * of `create-channels` script - only the messages will be added to existing channels.
   */
  channelIdPrefix: 'e2e-tests',

  /**
   * Custom field for channels
   *
   * Custom properties to be added to channels. They will be updated in channel only on first run.
   */
  customProperties: {
    // you can add as many properties as you want
  },

  /**
   * Group channels will be created with these users (id) as members. Channel members won't be changed
   * on subsequent running of command `create-channels`
   *
   * Also following users will be used to send messages on channel.
   *
   * If the users don't exist, then set `createUsers` as true, so that the script will create/generate these
   * users first, before proceeding to channel creation.
   *
   * I would recommend using readable user-ids.
   * Could be either object or string
   */
  appUsers: [
    {
      id: 'e2etest1',
      name: 'E2E Test 1',
    },
    {
      id: 'e2etest2',
      name: 'E2E Test 2',
    },
    {
      id: 'e2etest3',
      name: 'E2E Test 3',
    },
  ],

  /**
   * If true, users will be first created (if they don't exist in app).
   * Name will be same as userID, with first letter capitalized
   * Some random user avatar will be added for user.
   */
  createUsers: true,

  /** Total number of group channels to create */
  numberOfGroupChannel: 40,
  /** If true, script will also create one-to-one conversation between all users. */
  createOneToOneConversations: false,
  /**
   * Channel names will be some random combination of adjective and verb.
   * but if you want to have your own channel names then specify then here.
   * If `numberOfGroupChannel` is greater than length of `channelNames`, then for remainder of channels, name will
   * be auto generated.
   */
  channelNames: new Array(40).fill(null).map((_, i) => `e2e test channel ${i}`),

  numberOfMessagesPerChannel: 70,

  // ============================================================
  //
  //  CONFIG USED FOR `create-channels` and `add-messages` command
  //
  // ============================================================

  // So number of attachments will vary between 1 and MAX_NUMBER_OF_ATTACHMENTS_PER_MESSAGE
  maxNumberOfAttachmentsPerMessage: 6,
  // Frequency x => 1 in every x number of messages will contain the given entity.
  attachmentFrequency: 0,
  urlFrequency: 0,
  reactionFrequency: 0,
  threadReplyFrequency: 5,

  /** Truncates the channel, if it already exists, before adding messages. */
  truncateBeforeAddingNewMessages: true,

  // ALlowed reactions
  reactions: ['like', 'love', 'haha', 'wow', 'sad'],
  // Messages will contain following urls once in a while - as per configured `urlFrequency`
  urls: [
    'https://www.youtube.com/watch?v=ceGLEhahLKQ',
    'https://reactnative.dev/',
    'https://shorturl.at/hmyKM',
    'https://www.youtube.com/watch?v=3oGLuM_--Uo&t=13s',
    'https://shorturl.at/mBUY7',
    'https://github.com/GetStream/slack-clone-react-native/',
    'https://www.youtube.com/watch?v=tQ7T530Q7aU',
  ],

  // Don't change this. We do have support to add messages in various languages,
  // but it needs to be tested after latest changes.
  language: 'en',
};
