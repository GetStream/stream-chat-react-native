import { PropsWithChildren, createContext, useContext, useState } from "react";
import { StreamChatGenerics } from "../types";
import { Channel as ChannelType } from "stream-chat";
import { ThreadContextValue } from "stream-chat-expo";

export type AppContextType = {
    channel: ChannelType<StreamChatGenerics> | undefined;
    setChannel: React.Dispatch<
        React.SetStateAction<ChannelType<StreamChatGenerics> | undefined>
    >;
    setThread: React.Dispatch<
        React.SetStateAction<
            ThreadContextValue<StreamChatGenerics>["thread"] | undefined
        >
    >;
    thread: ThreadContextValue<StreamChatGenerics>["thread"] | undefined;
};

export const AppContext = createContext<AppContextType>({
    channel: undefined,
    setChannel: undefined,
    setThread: undefined,
    thread: undefined,
});

export const AppProvider = ({ children }: PropsWithChildren) => {
    const [channel, setChannel] = useState<
        ChannelType<StreamChatGenerics> | undefined
    >(undefined);
    const [thread, setThread] = useState<
        ThreadContextValue<StreamChatGenerics>["thread"] | undefined
    >(undefined);

    return (
        <AppContext.Provider value={{ channel, setChannel, thread, setThread }}>
            {children}
        </AppContext.Provider>
    );
};
