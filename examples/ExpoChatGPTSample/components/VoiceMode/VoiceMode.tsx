import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  StreamTheme,
  useDictationAudioLevel,
  type VoiceAgentState,
  VoiceGlow,
  VoiceWave,
} from 'stream-chat-expo/ai-components';

import { useVoiceConversation } from './useVoiceConversation';

const BACKDROP = '#0b0b10';
const COLORS = ['#005fff', '#7b5cff', '#00c2ff'];

const LABELS: Record<VoiceAgentState, string> = {
  connecting: 'Connecting…',
  idle: 'Tap the glow to talk',
  listening: 'Listening',
  speaking: 'Speaking',
  thinking: 'Thinking',
};

const VoiceModeOverlay = ({ onClose }: { onClose: () => void }) => {
  const { top, bottom } = useSafeAreaInsets();
  const { error, listen, phase, userIsTalking } = useVoiceConversation(true);
  const micLevel = useDictationAudioLevel();

  return (
    <StreamTheme style={{ voiceVisualization: { backdropColor: BACKDROP, colors: COLORS } }}>
      <View style={[styles.overlay, { paddingBottom: bottom + 24, paddingTop: top + 12 }]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel='Close voice mode' hitSlop={12} onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityHint='Starts listening'
          disabled={phase !== 'idle'}
          onPress={listen}
          style={styles.glowContainer}
        >
          <VoiceGlow state={phase} style={styles.glow} />
        </Pressable>
        <Text style={styles.label}>
          {error ? 'Couldn’t hear you. Tap the glow to try again.' : LABELS[phase]}
        </Text>
        <VoiceWave
          accessibilityLabel='Your voice'
          audioLevel={micLevel}
          state={userIsTalking ? 'listening' : 'idle'}
          style={styles.wave}
        />
      </View>
    </StreamTheme>
  );
};

/** Opens a full-screen voice conversation with the AI agent. */
export const VoiceMode = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View style={styles.entry}>
        <Pressable
          accessibilityLabel='Start voice mode'
          accessibilityRole='button'
          onPress={() => setOpen(true)}
          style={styles.button}
        >
          <VoiceGlow state='idle' style={styles.buttonGlow} />
        </Pressable>
      </View>
      <Modal animationType='fade' onRequestClose={() => setOpen(false)} visible={open}>
        {open ? <VoiceModeOverlay onClose={() => setOpen(false)} /> : null}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#ececec',
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  buttonGlow: { height: 64, width: 64 },
  close: { color: '#ffffff', fontSize: 22 },
  entry: { alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 },
  glow: { aspectRatio: 1, width: '100%' },
  glowContainer: { alignSelf: 'stretch', flex: 1, justifyContent: 'center' },
  header: { alignItems: 'flex-end', paddingHorizontal: 20 },
  label: { color: '#c9cbd3', fontSize: 17, marginVertical: 16, textAlign: 'center' },
  overlay: { backgroundColor: BACKDROP, flex: 1 },
  wave: { alignSelf: 'stretch', height: 140 },
});
