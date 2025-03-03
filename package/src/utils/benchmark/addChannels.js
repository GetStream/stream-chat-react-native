const StreamChat = require('stream-chat').StreamChat;

const client = StreamChat.getInstance('nq447pefn5by');
const user = {
  id: 'khushalagarwalgetstreamio',
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoia2h1c2hhbGFnYXJ3YWxnZXRzdHJlYW1pbyJ9.9ZQA9dwRDagqmRJ-EPr8yKtnIR_O--GjKeXQ3-XLIoA',
};

async function connectUserAndCreateChannels() {
  try {
    await client.connectUser({ id: user.id }, user.token);
    console.log('User Connected');
    await createPollAndSendToChannel();
  } catch (err) {
    console.error('Error connecting user:', err);
  }
}

async function deleteAllChannels() {
  const channels = await client.queryChannels(
    {
      type: 'messaging',
    },
    {},
    { limit: 100 },
  );
  for (const channel of channels) {
    await channel.delete();
    console.log(`Channel ${channel.id} deleted`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function createChannelsWithThrottle(index) {
  if (index >= 10) {
    console.log('All channels created!');
    return;
  }

  try {
    const channel = client.channel('messaging', `channel-${index}`, {
      name: `Channel ${index}`,
      members: [user.id, 'tommaso-80'],
    });

    await channel.create(); // Wait for channel creation
    await channel.sendMessage({ text: `Channel ${index}! This is a test message.` });
    console.log(`Channel ${index} created and message sent!`);

    setTimeout(() => createChannelsWithThrottle(index + 1), 500); // Schedule next channel
  } catch (err) {
    console.error(`Error creating Channel ${index}:`, err);

    // Retry with exponential backoff
    setTimeout(() => createChannelsWithThrottle(index), 500);
  }
}

async function sendReactionToAMessage() {
  for (let i = 0; i < 100; i++) {
    const channel = client.channel('messaging', 'sample-app-channel-3');
    await channel.watch();
    const message = await channel.sendMessage({ text: 'Hello, world!' });
    const reaction = await channel.sendReaction(message.message.id, {
      type: 'love',
      user_id: `tommaso-${i}`,
    });
    console.log(`Reaction sent to message ${message.message.id} for user ${user.id}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

const createPollAndSendToChannel = async () => {
  const channel = client.channel('messaging', 'sample-app-channel-0');
  await channel.watch();
  const poll = await client.polls.createPoll({
    allow_answers: true,
    name: 'What is the best Framework?',
    enforce_unique_vote: false,
    options: [
      { text: 'Option 1' },
      { text: 'Option 2' },
      { text: 'Option 3' },
      { text: 'Option 4' },
      { text: 'Option 5' },
    ],
  });
  const message = await channel.sendMessage({ poll_id: poll.id });
  console.log('Poll created and sent to channel:', poll.id, poll.state.getLatestValue().options);
};

const castPollVotes = async () => {
  for (let i = 0; i < 96; i++) {
    await client.castPollVote(
      '25d2e42a-1c9d-4a1f-9844-385c49fdd0b1',
      'eb3356ee-4e71-4cd3-a6f8-fe95d8055dc2',
      {
        option_id: 'e858b508-7099-4368-8832-66504f863ed8',
      },
      `tommaso-${i}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
};

connectUserAndCreateChannels();
