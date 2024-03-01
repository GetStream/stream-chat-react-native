import React, { useContext } from "react";
import { SafeAreaView, View } from "react-native";
import { Channel, Thread } from "stream-chat-expo";
import { Stack } from "expo-router";
import { AppContext } from "../../../../../context/AppContext";

export default function ThreadScreen() {
    const { channel, thread, setThread } = useContext(AppContext);
    return (
        <SafeAreaView>
            <Stack.Screen options={{ title: "Thread Screen" }} />

            <Channel channel={channel} thread={thread} threadList>
                <View
                    style={{
                        flex: 1,
                        justifyContent: "flex-start",
                    }}
                >
                    <Thread
                        onThreadDismount={() => {
                            setThread(undefined);
                        }}
                    />
                </View>
            </Channel>
        </SafeAreaView>
    );
}
