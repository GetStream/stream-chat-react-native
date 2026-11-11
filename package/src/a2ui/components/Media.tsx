// A2UI's Video and AudioPlayer, played in place with the player the app registered for the chat
// SDK's own video and voice messages (expo-video, react-native-video, expo-audio, …). An app with
// none of them, or an AI-only app, gets a link that opens where the device plays it.
import React, { useContext, useEffect, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Svg, { Path } from 'react-native-svg';

import { A2UI_ICON_PATHS } from './iconPaths';

import { useAITranslation } from '../../ai-components/contexts';
import { primitives } from '../../ai-components/internal/tokens';
import {
  NativeHandlers,
  type PlaybackStatus,
  type SoundReturnType,
  type VideoType,
} from '../../native';
import { A2UIEngineContext, A2UIReplyContext } from '../A2UIContexts';
import { useReplyState } from '../useReplyState';

export type MediaPalette = {
  accent: string;
  onAccent: string;
  secondaryText: string;
  subtleSurface: string;
  text: string;
};

const PlayIcon = ({ color, playing }: { color: string; playing: boolean }) => (
  <Svg
    accessibilityElementsHidden
    height={24}
    importantForAccessibility='no-hide-descendants'
    viewBox='0 0 24 24'
    width={24}
  >
    <Path d={playing ? A2UI_ICON_PATHS.pause : A2UI_ICON_PATHS.play} fill={color} />
  </Svg>
);

/** A link to media the device plays where it opens, for an app with no player registered. */
export const MediaLink = ({
  label,
  palette,
  url,
}: {
  label: string;
  palette: MediaPalette;
  url: string;
}) => {
  const engine = useContext(A2UIEngineContext);
  return (
    <Pressable
      accessibilityRole='link'
      onPress={() => engine?.host.open(url)}
      style={({ pressed }) => [
        styles.link,
        { backgroundColor: palette.subtleSurface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <PlayIcon color={palette.accent} playing={false} />
      <Text numberOfLines={2} style={[styles.label, { color: palette.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
};

/** A2UI's Video: the video in place, its poster until it plays, playing and pausing on a tap. */
export const VideoView = ({
  palette,
  posterUrl,
  url,
}: {
  palette: MediaPalette;
  url: string;
  posterUrl?: string;
}) => {
  const { t } = useAITranslation();
  const [paused, setPaused] = useReplyState(true);
  const [started, setStarted] = useReplyState(false);
  const videoRef = useRef<VideoType>(null);
  const NativeVideo = NativeHandlers.Video;
  if (!NativeVideo) return <MediaLink label={url} palette={palette} url={url} />;
  return (
    <View style={[styles.video, { backgroundColor: palette.subtleSurface }]}>
      {started ? (
        <NativeVideo
          onEnd={() => setPaused(true)}
          paused={paused}
          resizeMode='contain'
          style={styles.fill}
          testID='a2ui-video'
          uri={url}
          videoRef={videoRef as React.RefObject<VideoType>}
        />
      ) : posterUrl ? (
        <Image resizeMode='cover' source={{ uri: posterUrl }} style={styles.fill} />
      ) : null}
      <Pressable
        accessibilityLabel={
          paused
            ? t('a2ui.media.play.accessibilityLabel', 'Play')
            : t('a2ui.media.pause.accessibilityLabel', 'Pause')
        }
        accessibilityRole='button'
        onPress={() => {
          setStarted(true);
          setPaused((was) => !was);
        }}
        style={styles.videoControl}
      >
        {paused ? (
          <View style={[styles.playBadge, { backgroundColor: palette.accent }]}>
            <PlayIcon color={palette.onAccent} playing={false} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
};

/** A2UI's AudioPlayer: what it plays, a button that plays and pauses it, and how far it is. */
export const AudioView = ({
  description,
  palette,
  url,
}: {
  palette: MediaPalette;
  url: string;
  description?: string;
}) => {
  const { t } = useAITranslation();
  const messageId = useContext(A2UIReplyContext)?.messageId;
  const [playing, setPlaying] = useReplyState(false);
  const [progress, setProgress] = useReplyState(0);
  const sound = useRef<SoundReturnType | null>(null);
  const loading = useRef(false);
  const generation = useRef(0);
  const initializeSound = NativeHandlers.Sound?.initializeSound;

  // What it plays is let go of once it leaves the reply.
  useEffect(
    () => () => {
      generation.current += 1;
      loading.current = false;
      void sound.current?.stopAsync?.();
      void sound.current?.unloadAsync?.();
      sound.current = null;
    },
    [messageId],
  );

  if (!initializeSound) {
    return <MediaLink label={description || url} palette={palette} url={url} />;
  }

  const onStatus = (status: PlaybackStatus) => {
    if (!status.isLoaded) return;
    const duration = status.durationMillis || status.duration * 1000;
    if (duration > 0) setProgress(Math.min((status.positionMillis || 0) / duration, 1));
    if (status.didJustFinish) {
      setPlaying(false);
      setProgress(0);
      void sound.current?.setPositionAsync?.(0);
      return;
    }
    setPlaying(status.isPlaying);
  };

  const toggle = async () => {
    if (sound.current) {
      if (playing) await sound.current.pauseAsync?.();
      else await sound.current.playAsync?.();
      setPlaying(!playing);
      return;
    }
    if (loading.current) return;
    loading.current = true;
    const at = generation.current;
    try {
      const loaded = await initializeSound(
        { uri: url },
        { progressUpdateIntervalMillis: 250, shouldPlay: true },
        (status) => {
          if (generation.current === at) onStatus(status);
        },
      );
      if (generation.current !== at) {
        void loaded?.stopAsync?.();
        void loaded?.unloadAsync?.();
        return;
      }
      sound.current = loaded;
      await sound.current?.playAsync?.();
      setPlaying(true);
    } finally {
      if (generation.current === at) loading.current = false;
    }
  };

  return (
    <View style={[styles.audio, { backgroundColor: palette.subtleSurface }]}>
      <Pressable
        accessibilityLabel={
          playing
            ? t('a2ui.media.pause.accessibilityLabel', 'Pause')
            : t('a2ui.media.play.accessibilityLabel', 'Play')
        }
        accessibilityRole='button'
        hitSlop={8}
        onPress={() => void toggle()}
        style={[styles.audioButton, { backgroundColor: palette.accent }]}
      >
        <PlayIcon color={palette.onAccent} playing={playing} />
      </Pressable>
      <View style={styles.audioBody}>
        {description ? (
          <Text numberOfLines={2} style={[styles.label, { color: palette.text }]}>
            {description}
          </Text>
        ) : null}
        <View style={[styles.track, { backgroundColor: palette.secondaryText + '33' }]}>
          <View
            style={[
              styles.trackFill,
              { backgroundColor: palette.accent, width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  audio: {
    alignItems: 'center',
    borderRadius: primitives.radiusLg,
    flexDirection: 'row',
    gap: primitives.spacingSm,
    padding: primitives.spacingSm,
  },
  audioBody: { flex: 1, gap: primitives.spacingXs },
  audioButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  label: { flexShrink: 1, fontSize: primitives.typographyFontSizeMd, fontWeight: '600' },
  link: {
    alignItems: 'center',
    borderRadius: primitives.radiusMd,
    flexDirection: 'row',
    gap: primitives.spacingXs,
    padding: primitives.spacingSm,
  },
  playBadge: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  track: { borderRadius: 2, height: 4, overflow: 'hidden' },
  trackFill: { height: 4 },
  video: {
    alignSelf: 'stretch',
    aspectRatio: 16 / 9,
    borderRadius: primitives.radiusLg,
    overflow: 'hidden',
  },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  videoControl: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
