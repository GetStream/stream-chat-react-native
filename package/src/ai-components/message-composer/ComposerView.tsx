import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { BottomSheetContent } from './ActionSheet';

import Animated, { LinearTransition } from 'react-native-reanimated';
import type {
  AbstractMediaPickerService,
  MediaPickerState,
} from '../services/media-picker-service/AbstractMediaPickerService';
import { useDictationState } from '../store/dictation/useDictationState';
import { useDictationTranscript } from '../store/dictation/useDictationTranscript';
import { AttachmentButton } from './AttachmentButton';
import { ActionButton } from './ActionButton';
import { MediaPreviewList } from './MediaPreviewList';
import {
  ComposerProvider,
  useMessageComposerContext,
  useTheme,
} from '../contexts';
import { useComposerText } from '../store';
import type { StateStore } from '@stream-io/state-store';
import type { ComposerState } from '../store';

export type BottomSheetOption = {
  title: string;
  action: () => void | Promise<void>;
  subtitle?: string;
  Icon?: React.ComponentType;
};

export type BottomSheetInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type ComposerViewProps = {
  onSendMessage: (opts: {
    text: string;
    attachments?: MediaPickerState['assets'];
    custom?: Record<string, unknown>;
  }) => Promise<void>;
  bottomSheetOptions?: BottomSheetOption[];
  isGenerating?: boolean;
  stopGenerating?: () => Promise<void>;
  bottomSheetInsets?: BottomSheetInsets;
  mediaPickerService?: AbstractMediaPickerService;
  state?: StateStore<ComposerState>;
};

export const ComposerViewUI = ({
  bottomSheetOptions = [],
  bottomSheetInsets,
  isGenerating,
  stopGenerating,
}: ComposerViewProps) => {
  const {
    theme: {
      composer: { container, containerRow, inputPillContainer, inputPill },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View pointerEvents={'box-none'} style={[styles.container, container]}>
      <View style={[styles.row, containerRow]}>
        <AttachmentButton />

        <Animated.View
          style={[styles.inputPillContainer, inputPillContainer]}
          layout={LinearTransition.duration(150)}
        >
          <MediaPreviewList />
          <View style={[styles.inputPill, inputPill]}>
            <AIMessageInput />
            <ActionButton
              isGenerating={isGenerating}
              stopGenerating={stopGenerating}
            />
          </View>
        </Animated.View>
      </View>
      <BottomSheet>
        <BottomSheetContent
          bottomSheetOptions={bottomSheetOptions}
          bottomSheetInsets={bottomSheetInsets}
        />
      </BottomSheet>
    </View>
  );
};

export const AIMessageInput = () => {
  const {
    theme: {
      colors: { grey_neutral },
      composer: { textInput },
    },
  } = useTheme();
  const styles = useStyles();

  const { error, isRecording } = useDictationState();
  const { text } = useComposerText();
  const { transcript } = useDictationTranscript();
  const { setText } = useMessageComposerContext();

  useEffect(() => {
    if (isRecording && !error) {
      setText(transcript);
    }
  }, [isRecording, transcript, error, setText]);

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      placeholder={'Ask anything'}
      placeholderTextColor={grey_neutral}
      style={[styles.textInput, textInput]}
      multiline
      underlineColorAndroid={'transparent'}
    />
  );
};

export const ComposerView = (props: ComposerViewProps) => (
  <ComposerProvider
    onSendMessage={props.onSendMessage}
    mediaPickerService={props.mediaPickerService}
    state={props.state}
  >
    <ComposerViewUI {...props} />
  </ComposerProvider>
);

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(() => {
    const { colors, composer } = theme;

    const pillHeight = composer.inputPillHeight;

    return StyleSheet.create({
      container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
      },
      inputPill: {
        alignItems: 'center',
        flexDirection: 'row',
        maxHeight: pillHeight * 3,
      },
      inputPillContainer: {
        flex: 1,
        minHeight: pillHeight,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: pillHeight / 2,
        backgroundColor: colors.white_smoke,
        paddingHorizontal: 14,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        shadowColor: colors.black,
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
        elevation: 2,
      },
      textInput: {
        flex: 1,
        fontSize: 16,
        color: colors.black,
        paddingVertical: 0,
        paddingHorizontal: 0,
        marginRight: 24,
      },
    });
  }, [theme]);
};
