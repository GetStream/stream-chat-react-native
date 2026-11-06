import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StreamChat } from 'stream-chat';

import { apiKey, appUser, mockServerUrl } from './config';

/** Fetches a token from the mock server, which decides whether it is valid, expired or broken. */
const fetchToken = async () => {
  const response = await fetch(`${mockServerUrl}/jwt/get?platform=js`);
  return response.ok ? response.text() : '';
};

/** Token provider calls since launch, so the screen can show whether the token was refreshed. */
let tokenRequests = 0;
const tokenListeners = new Set<(count: number) => void>();
const tokenProvider = () => {
  tokenRequests += 1;
  tokenListeners.forEach((listener) => listener(tokenRequests));
  return fetchToken();
};

/**
 * Connects with a token provider and shows the connection state, like the native SDKs' JWT test
 * screens: `jwt-connection-status-connected` while connected,
 * `jwt-has-been-disconnected-true` once the connection dropped after it was first up, and
 * `jwt-token-refreshed-true` once the token provider was called again (a refresh; the mock server
 * hands out tokens that expire, or are invalid, on request).
 */
export const JwtScreen = () => {
  const [connected, setConnected] = useState(false);
  const [disconnections, setDisconnections] = useState(0);
  const [tokenRequestCount, setTokenRequestCount] = useState(tokenRequests);

  useEffect(() => {
    tokenListeners.add(setTokenRequestCount);
    return () => {
      tokenListeners.delete(setTokenRequestCount);
    };
  }, []);
  const wasConnected = useRef(false);

  useEffect(() => {
    const client = StreamChat.getInstance(apiKey, {
      client: { axiosRequestConfig: { timeout: 6000 }, baseURL: mockServerUrl },
    });
    return client.wsConnection.state.subscribeWithSelector(
      ({ isHealthy }) => ({ isHealthy }),
      ({ isHealthy }) => {
        const online = !!isHealthy;
        setConnected(online);
        if (online) {
          wasConnected.current = true;
        } else if (wasConnected.current) {
          setDisconnections((count) => count + 1);
        }
      },
    );
  }, []);

  const connect = useCallback(async () => {
    const client = StreamChat.getInstance(apiKey);
    try {
      await client.connectUser({ id: appUser.id }, tokenProvider);
    } catch (error) {
      console.warn('JWT connect failed', error);
    }
  }, []);

  const status = connected ? 'connected' : 'disconnected';
  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={connect} testID='jwt-connection-button'>
        <Text style={styles.title}>JWT Test</Text>
      </Pressable>
      <View style={styles.row}>
        <Text style={styles.label}>Connection status:</Text>
        <Text style={styles.value} testID={`jwt-connection-status-${status}`}>
          {status}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Disconnections:</Text>
        <Text style={styles.value} testID={`jwt-has-been-disconnected-${disconnections > 0}`}>
          {disconnections}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Token requests:</Text>
        <Text style={styles.value} testID={`jwt-token-refreshed-${tokenRequestCount > 1}`}>
          {tokenRequestCount}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: '#FFFFFF', flex: 1, paddingTop: 100 },
  label: { fontSize: 20, paddingHorizontal: 16 },
  row: { flexDirection: 'row', paddingTop: 60 },
  title: { fontSize: 33, fontWeight: '700' },
  value: { fontSize: 20, fontWeight: '700' },
});
