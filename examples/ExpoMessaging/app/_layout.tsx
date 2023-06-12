import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChatWrapper } from "../components/ChatWrapper";
import { AppProvider } from "../context/AppContext";
import { StyleSheet } from "react-native";

export default function Layout() {
    return (
        <GestureHandlerRootView style={styles.container}>
            <ChatWrapper>
                <AppProvider>
                    <Stack />
                </AppProvider>
            </ChatWrapper>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
