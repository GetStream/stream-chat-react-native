import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { ImageSource, Session } from '@stream-io/calypso';
import type { Channel, StreamChat } from 'stream-chat';
import { useStableCallback } from 'stream-chat-expo';

import { agents, agentSessions, streamToken } from '../agent/agents';
import { AgentConfig } from '../agent/config';

type Conversation = { channel: Channel; session: Session };

export type AppContextValue = {
  /** The channel the router writes the open conversation into. */
  channel: Channel | undefined;
  /** Why the last conversation couldn't be opened, or what asking failed with. */
  failure: string | undefined;
  /** Asks the agent, with photos as data URIs. Its reply arrives in the channel. */
  ask: (text: string, images?: ImageSource[]) => Promise<void>;
  /** Carries on a conversation from the drawer. */
  openConversation: (channel: Channel) => void;
  /** Starts a new conversation. */
  startConversation: () => void;
  /** Stops the reply being written. What it wrote so far stays. */
  stop: () => void;
};

export const AppContext = React.createContext<AppContextValue>({
  ask: async () => {},
  channel: undefined,
  failure: undefined,
  openConversation: () => {},
  startConversation: () => {},
  stop: () => {},
});

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const AppProvider = ({ client, children }: PropsWithChildren<{ client: StreamChat }>) => {
  const [conversation, setConversation] = useState<Conversation>();
  const [failure, setFailure] = useState<string>();
  const current = useRef<Conversation | undefined>(undefined);

  // Opening one conversation after another: the newest wins, and one that was never asked
  // anything is deleted rather than left in the drawer.
  const open = useStableCallback(async (opening: () => Promise<Session>) => {
    setFailure(undefined);
    try {
      const session = await opening();
      const { channel } = await session.chat();
      const previous = current.current;
      const next = { channel: channel as Channel, session };
      current.current = next;
      setConversation(next);
      if (previous && previous.session.id !== session.id) {
        const unused = previous.channel.state.messages.length === 0;
        await (unused ? previous.session.delete() : previous.session.close()).catch(() => {});
      }
    } catch (error) {
      setFailure(messageOf(error));
    }
  });

  const startConversation = useStableCallback(() => {
    void open(() => agentSessions().create({ modelOverwrites: { llm: AgentConfig.chatModel } }));
  });

  const openConversation = useStableCallback((channel: Channel) => {
    if (!channel.id || channel.id === current.current?.session.id) {
      return;
    }
    // A conversation's session id is its channel's id.
    void open(() => agentSessions().resume(channel.id as string));
  });

  const ask = useStableCallback(async (text: string, images: ImageSource[] = []) => {
    const session = current.current?.session;
    if (!session) {
      return;
    }
    setFailure(undefined);
    try {
      await session.responses.create(text, images.length > 0 ? { images } : undefined);
    } catch (error) {
      setFailure(messageOf(error));
    }
  });

  const stop = useStableCallback(() => {
    try {
      current.current?.session.interrupt();
    } catch {
      // The reply finished first, which is what stopping it was for.
    }
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The router and Stream Chat as the same user, on the app's own chat client.
        await agents.setUser(AgentConfig.user, streamToken);
        agents.use({ chat: client });
        if (!cancelled) {
          startConversation();
        }
      } catch (error) {
        setFailure(messageOf(error));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, startConversation]);

  const contextValue = useMemo(
    () => ({
      ask,
      channel: conversation?.channel,
      failure,
      openConversation,
      startConversation,
      stop,
    }),
    [ask, conversation, failure, openConversation, startConversation, stop],
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useAppContext = () => React.useContext(AppContext);
