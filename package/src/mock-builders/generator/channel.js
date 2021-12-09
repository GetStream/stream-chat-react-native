import { v4 as uuidv4 } from 'uuid';
import { getUserDefaults } from './user';

const defaultCapabilities = [
        "ban-channel-members",
        "delete-any-message",
        "delete-own-message",
        "flag-message",
        "mute-channel",
        "pin-message",
        "quote-message",
        "read-events",
        "send-links",
        "send-message",
        "send-reaction",
        "send-reply",
        "typing-events",
        "update-any-message",
        "update-own-message",
        "upload-file"
      ];

const defaultConfig = {
        "automod": "disabled",
        "automod_behavior": "flag",
        "commands": [
          { "args": "[text]", "description": "Post a random gif to the channel", "name": "giphy", "set": "fun_set" }
        ],
        "connect_events": true,
        "created_at": "2020-04-24T11:36:43.859020368Z",
        "max_message_length": 5000,
        "message_retention": "infinite",
        "mutes": true,
        "name": "Channel name",
        "reactions": true,
        "read_events": true,
        "replies": true,
        "search": true,
        "typing_events": true,
        "updated_at": "2020-04-24T11:36:43.859022903Z",
        "uploads": true, "url_enrichment": true
      }

const getChannelDefaults = ({ id, type } = { id: uuidv4(), type: 'messaging'}) => {
  return {
    "_client": {},
    "type": type,
    "id": id,
    "data": {
      "cid": "${type}:${id}",
      "config": {
        ...defaultConfig,
        name: type,
      },
      "created_at": "2020-04-28T11:20:48.578147Z",
      "created_by": getUserDefaults(),
      "frozen": false,
      "id": id,
      "own_capabilities": defaultCapabilities,
      "type": type,
      "updated_at": "2020-04-28T11:20:48.578147Z"
    }
  }}

export const generateChannel = (customValues) => ({
    ...getChannelDefaults(), ...customValues
});

export const generateChannelResponse = (options = { id: uuidv4(), type: 'messaging', channel: {}}) => {
  const { id = uuidv4(), type = 'messaging', channel = {}, ...rest } = options;

  const defaults = getChannelDefaults();
  return {
    channel: {
      ...defaults.data, ...{
        cid: `${type}:${id}`,
        ...channel,
      }
    },
    members: [],
    messages: [],
    ...rest
  }
};
