const error = require('eslint-plugin-react/lib/util/error');
const { StreamChat } = require('stream-chat');


const appKey = 'yjrt5yxw77ev';
const appSecret = 'kscndrhzzcujsyv7k8rejhjnwhxy5ahjhzvakb422kdjjh4f94wsrxuapxdt85fw';

const serverClient = new StreamChat(appKey, appSecret);

const exportedData = '{"channel":{"cid":"messaging:!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE","id":"!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE","type":"messaging","last_message_at":"2025-01-23T13:05:54.645081Z","created_by":{"id":"rodolphe","role":"user","created_at":"2024-09-18T09:39:02.302556Z","updated_at":"2025-01-23T12:30:02.405893Z","last_active":"2025-01-23T13:06:58.365621247Z","last_engaged_at":"2025-01-23T00:06:23.292601Z","banned":false,"online":false,"name":"Rodolphe Irany","image":"https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192","birthland":""},"created_at":"2025-01-23T13:05:35.310709Z","updated_at":"2025-01-23T13:05:35.310709Z","frozen":false,"disabled":false,"member_count":2,"config":{"name":"messaging","typing_events":true,"read_events":true,"connect_events":true,"search":true,"reactions":true,"replies":true,"quotes":true,"mutes":true,"uploads":true,"url_enrichment":true,"custom_events":true,"push_notifications":true,"reminders":false,"mark_messages_pending":false,"polls":true,"message_retention":"infinite","max_message_length":5000,"automod":"AI","automod_behavior":"flag","blocklist_behavior":"flag","automod_thresholds":{"explicit":{"flag":0.85,"block":0.9},"spam":{"flag":0.85,"block":0.9},"toxic":{"flag":0.85,"block":0.9}},"skip_last_msg_update_for_system_msgs":false,"created_at":"2021-03-01T19:29:10.634629Z","updated_at":"2024-12-19T12:08:48.048363Z","commands":["giphy","mute","unmute","ban","unban"]},"auto_translation_language":""},"messages":[{"id":"64828eb5-ca8c-4459-ad13-276f4b374360","text":"Hi","html":"\u003cp\u003eHi\u003c/p\u003e\\n","type":"regular","user":{"id":"rodolphe","role":"user","created_at":"2024-09-18T09:39:02.302556Z","updated_at":"2025-01-23T12:30:02.405893Z","last_active":"2025-01-23T13:06:58.365621247Z","last_engaged_at":"2025-01-23T00:06:23.292601Z","banned":false,"online":false,"birthland":"","name":"Rodolphe Irany","image":"https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192"},"attachments":[],"latest_reactions":[],"own_reactions":[],"reaction_counts":{},"reaction_scores":{},"reaction_groups":null,"reply_count":0,"deleted_reply_count":0,"cid":"messaging:!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE","created_at":"2025-01-23T13:05:35.491258Z","updated_at":"2025-01-23T13:05:35.491258Z","shadowed":false,"mentioned_users":[],"silent":false,"pinned":false,"pinned_at":null,"pinned_by":null,"pin_expires":null},{"id":"rodolphe-85f6fa93-1165-437c-01f7-90a02d07cdc9","text":"Hiya hiya","html":"\u003cp\u003eHiya hiya\u003c/p\u003e\\n","type":"regular","user":{"id":"rodolphe","role":"user","created_at":"2024-09-18T09:39:02.302556Z","updated_at":"2025-01-23T12:30:02.405893Z","last_active":"2025-01-23T13:06:58.365621247Z","last_engaged_at":"2025-01-23T00:06:23.292601Z","banned":false,"online":false,"name":"Rodolphe Irany","image":"https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192","birthland":""},"attachments":[],"latest_reactions":[],"own_reactions":[],"reaction_counts":{},"reaction_scores":{},"reaction_groups":null,"reply_count":0,"deleted_reply_count":0,"cid":"messaging:!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE","created_at":"2025-01-23T13:05:40.116085Z","updated_at":"2025-01-23T13:05:40.116085Z","shadowed":false,"mentioned_users":[],"silent":false,"pinned":false,"pinned_at":null,"pinned_by":null,"pin_expires":null},{"id":"rodolphe-58faf785-69e0-44e6-3a34-f3226ac1c084","text":"Will try to migrate this","html":"\u003cp\u003eWill try to migrate this\u003c/p\u003e\\n","type":"regular","user":{"id":"rodolphe","role":"user","created_at":"2024-09-18T09:39:02.302556Z","updated_at":"2025-01-23T12:30:02.405893Z","last_active":"2025-01-23T13:06:58.365621247Z","last_engaged_at":"2025-01-23T00:06:23.292601Z","banned":false,"online":false,"name":"Rodolphe Irany","image":"https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192","birthland":""},"attachments":[],"latest_reactions":[],"own_reactions":[],"reaction_counts":{},"reaction_scores":{},"reaction_groups":null,"reply_count":0,"deleted_reply_count":0,"cid":"messaging:!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE","created_at":"2025-01-23T13:05:49.526105Z","updated_at":"2025-01-23T13:05:49.526105Z","shadowed":false,"mentioned_users":[],"silent":false,"pinned":false,"pinned_at":null,"pinned_by":null,"pin_expires":null},{"id":"rodolphe-2d126a21-ed50-4c2a-2359-a92a083fd4b6","text":"Maybe it works","html":"\u003cp\u003eMaybe it works\u003c/p\u003e\\n","type":"regular","user":{"id":"rodolphe","role":"user","created_at":"2024-09-18T09:39:02.302556Z","updated_at":"2025-01-23T12:30:02.405893Z","last_active":"2025-01-23T13:06:58.365621247Z","last_engaged_at":"2025-01-23T00:06:23.292601Z","banned":false,"online":false,"name":"Rodolphe Irany","image":"https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192","birthland":""},"attachments":[],"latest_reactions":[],"own_reactions":[],"reaction_counts":{},"reaction_scores":{},"reaction_groups":null,"reply_count":0,"deleted_reply_count":0,"cid":"messaging:!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE","created_at":"2025-01-23T13:05:54.645081Z","updated_at":"2025-01-23T13:05:54.645081Z","shadowed":false,"mentioned_users":[],"silent":false,"pinned":false,"pinned_at":null,"pinned_by":null,"pin_expires":null}],"members":[{"user_id":"rodolphe","user":{"id":"rodolphe","role":"user","created_at":"2024-09-18T09:39:02.302556Z","updated_at":"2025-01-23T12:30:02.405893Z","last_active":"2025-01-23T13:06:58.365621247Z","last_engaged_at":"2025-01-23T00:06:23.292601Z","banned":false,"online":false,"birthland":"","name":"Rodolphe Irany","image":"https://ca.slack-edge.com/T02RM6X6B-U05C1DG31LJ-3e1ec816128d-192"},"status":"member","created_at":"2025-01-23T13:05:35.315676Z","updated_at":"2025-01-23T13:05:35.315676Z","banned":false,"shadow_banned":false,"archived_at":null,"pinned_at":null,"role":"owner","channel_role":"channel_member","notifications_muted":false},{"user_id":"test-mig-user","user":{"id":"test-mig-user","role":"user","created_at":"2025-01-23T13:05:03.06666Z","updated_at":"2025-01-23T13:05:03.06666Z","banned":false,"online":false,"name":"Test Mig User"},"status":"member","created_at":"2025-01-23T13:05:35.315676Z","updated_at":"2025-01-23T13:05:35.315676Z","banned":false,"shadow_banned":false,"archived_at":null,"pinned_at":null,"role":"member","channel_role":"channel_member","notifications_muted":false}]}';

const exportLivestreamChannel = async () =>  {
  try {
    const response = await serverClient.exportChannel({
      type: "messaging",
      id: "!members-T587kU501WCs0ADiZq-37FW6uTNcxmCFiLhJqaXawjE",
      //messages_since: "2020-11-10T09:30:00.000Z",
      //messages_until: "2020-11-10T11:30:00.000Z",
    },{
      include_truncated_messages: true,
      // include_soft_deleted_channels: true,
    });
    const taskID = response.task_id;
    console.log("Exported channel successfully. Task ID:", taskID);
    return taskID;
  } catch (error) {
    console.error("Error exporting channel:", error);
    throw error;
    // return null;
  }
};

const fetchTaskApi = async ({ taskId }) => {
  try {
    return await serverClient.getExportChannelStatus(taskId);
  } catch (error) {
    console.error("Error fetching task:", error);
    throw error;
  }
};

const exportAndFetchTask = async () => {
  const taskId = await exportLivestreamChannel();
  const response = await fetchTaskApi({ taskId });
  console.log('Export response: ', response);
};

// exportAndFetchTask();

const importData = async () => {
  const parsedData = JSON.parse(exportedData);

  const channelId = parsedData.channel.id;
  const channelType = 'messaging';
  const memberIds = parsedData.members.map(m => m.user.id);

  const channel = {
    type: 'channel',
    item: {
      created_by: parsedData.channel.created_by.id,
      // id: channelId,
      member_ids: memberIds,
      type: channelType,
    }
  };

  const members = parsedData.members.map(m => ({
      type: 'member',
      item: {
        user_id: m.user_id,
        // channel_id: channelId,
        channel_member_ids: memberIds,
        channel_type: channelType,
        channel_role: m.channel_role,
        created_at: m.created_at,
      }
    }));

  const messages = parsedData.messages.map(m => ({
      type: 'message',
      item: {
        id: m.id,
        // channel_id: channelId,
        channel_member_ids: memberIds,
        channel_type: channelType,
        user: m.user.id,
        text: m.text,
        type: m.type,
        created_at: m.created_at,
      }
    }));

  const users = parsedData.members.map(m => ({
      type: 'user',
      item: {
        id: m.user.id,
        name: m.user.name,
        image: m.user.image,
        role: m.user.role,
        created_at: m.user.created_at,
        invisible: true,
      }
    }));

  const importData = [channel, ...members, ...messages, ...users];

  console.log(JSON.stringify(importData));
};

importData();


// exportLivestreamChannel()
//   .then(() => {
//     console.log("Export operation completed successfully.");
//   })
//   .catch((error) => {
//     console.error("Error exporting channel:", error);
//   });

// 20b7e6f8-5008-4a3e-b8d6-d2afde842255
