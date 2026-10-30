import { Robot } from './Robot';

import type { MockServer } from '../mock-server/MockServer';

/** Drives server-side state through the mock server's test-control endpoints. */
export class BackendRobot extends Robot {
  constructor(private readonly mockServer: MockServer) {
    super();
  }

  generateChannels({
    channelsCount,
    messagesCount = 0,
    repliesCount = 0,
    messagesText,
    repliesText,
    channelNames = [],
    withDirectMessageChannel = false,
  }: {
    channelsCount: number;
    messagesCount?: number;
    repliesCount?: number;
    messagesText?: string;
    repliesText?: string;
    channelNames?: string[];
    withDirectMessageChannel?: boolean;
  }): this {
    const params = new URLSearchParams();
    if (messagesText !== undefined) params.set('messages_text', messagesText);
    if (repliesText !== undefined) params.set('replies_text', repliesText);
    if (channelNames.length > 0) params.set('channel_names', channelNames.join(','));
    if (withDirectMessageChannel) params.set('dm', 'true');
    params.set('channels', `${channelsCount}`);
    params.set('messages', `${messagesCount}`);
    params.set('replies', `${repliesCount}`);
    return this.post(`mock?${params}`);
  }

  failNewMessages(): this {
    return this.post('fail_messages');
  }

  freezeNewMessages(): this {
    return this.post('freeze_messages');
  }

  setCooldown(enabled: boolean, duration: number): this {
    return this.post(`config/cooldown?enabled=${enabled}&duration=${duration}`);
  }

  /**
   * Truncates the currently open channel on the server side. The app receives `channel.truncated`.
   *
   * @param withMessage also delivers a "Channel truncated" system message.
   */
  truncateChannel(withMessage: boolean): this {
    return this.post(`truncate_channel?with_message=${withMessage}`);
  }

  /** Enables or disables read events on every channel. Call before the channel is opened. */
  setReadEvents(enabled: boolean): this {
    return this.post(`config/read_events?value=${enabled}`);
  }

  /** Adds a member to the currently open channel. The app receives `member.added` + `channel.updated`. */
  addMember(userId: string): this {
    return this.post(`add_member?user_id=${encodeURIComponent(userId)}`);
  }

  /** Removes a member from the currently open channel. The app receives `member.removed` + `channel.updated`. */
  removeMember(userId: string): this {
    return this.post(`remove_member?user_id=${encodeURIComponent(userId)}`);
  }

  /**
   * Creates a reminder for the last message of the currently open channel.
   *
   * @param remindAtSeconds how far in the future it is due; omit for a "saved for later" reminder.
   */
  createReminder(remindAtSeconds?: number): this {
    return this.post(
      remindAtSeconds === undefined
        ? 'create_reminder'
        : `create_reminder?remind_at=${remindAtSeconds}`,
    );
  }

  revokeToken(duration = 5): this {
    return this.post(`jwt/revoke_token?duration=${duration}`);
  }

  invalidateToken(duration = 5): this {
    return this.post(`jwt/invalidate_token?duration=${duration}`);
  }

  invalidateTokenDate(duration = 5): this {
    return this.post(`jwt/invalidate_token_date?duration=${duration}`);
  }

  invalidateTokenSignature(duration = 5): this {
    return this.post(`jwt/invalidate_token_signature?duration=${duration}`);
  }

  breakTokenGeneration(duration = 5): this {
    return this.post(`jwt/break_token_generation?duration=${duration}`);
  }

  /**
   * Waits until the app closes its WebSocket. The SDK keeps the socket open for a while after the
   * app goes to background, so call this before server-side events that must not arrive live.
   */
  waitForWebSocketDisconnection(timeoutMs = 10000): this {
    return this.perform(async () => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const status = JSON.parse(await this.mockServer.getRequest('ws/status'));
        if (!status.connected) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      throw new Error(`WebSocket was not disconnected within ${timeoutMs}ms`);
    });
  }

  private post(endpoint: string): this {
    return this.perform(() => this.mockServer.postRequest(endpoint));
  }
}
