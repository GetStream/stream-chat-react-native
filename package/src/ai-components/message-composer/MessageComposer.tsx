import React, { useEffect } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { BottomSheet } from '../components/BottomSheet';
import { BottomSheetContent } from './ActionSheet';

import Animated, { LinearTransition } from 'react-native-reanimated';
import { type MediaPickerState } from '../services/media-picker-service/AbstractMediaPickerService';
import { useDictationState } from '../store/dictation/useDictationState';
import { useDictationTranscript } from '../store/dictation/useDictationTranscript';
import { AttachmentButton } from './AttachmentButton';
import { ActionButton } from './ActionButton';
import { MediaPreviewList } from './MediaPreviewList';
import {
  MessageComposerProvider,
  useMessageComposerContext,
} from '../contexts/message-composer-context';
import { useComposerText } from '../store/composer/useComposerText';

export type BottomSheetOption = {
  title: string;
  action: () => void | Promise<void>;
  subtitle?: string;
  Icon?: React.ComponentType;
};

export type AIMessageComposerProps = {
  bottomSheetOptions: BottomSheetOption[];
  onSendMessage: (opts: {
    text: string;
    attachments?: MediaPickerState['assets'];
    custom?: Record<string, unknown>;
  }) => Promise<void>;
  isGenerating: boolean;
  stopGenerating: () => Promise<void>;
};

export const MessageComposerUI = ({
  bottomSheetOptions = [],
  isGenerating,
  stopGenerating,
}: AIMessageComposerProps) => {
  const { error, isRecording } = useDictationState();
  const { transcript } = useDictationTranscript();
  const { setText, mediaPickerService } = useMessageComposerContext();

  useEffect(() => {
    if (isRecording && !error) {
      setText(transcript);
    }
  }, [isRecording, transcript, error, setText]);

  return (
    <>
      <View pointerEvents={'box-none'} style={styles.absoluteContainer}>
        <View style={styles.row}>
          <AttachmentButton />

          <Animated.View
            style={styles.inputPillContainer}
            layout={LinearTransition.duration(150)}
          >
            <MediaPreviewList mediaPickerService={mediaPickerService} />
            <View style={styles.inputPill}>
              <MessageInput />
              <ActionButton
                isGenerating={isGenerating}
                stopGenerating={stopGenerating}
              />
            </View>
          </Animated.View>
        </View>
        <BottomSheet>
          <BottomSheetContent bottomSheetOptions={bottomSheetOptions} />
        </BottomSheet>
      </View>
    </>
  );
};

const MessageInput = () => {
  const { text } = useComposerText();
  const { setText } = useMessageComposerContext();

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      placeholder={'Ask anything'}
      placeholderTextColor={'#9E9E9E'}
      style={styles.textInput}
      multiline
      underlineColorAndroid={'transparent'}
    />
  );
};

export const AIMessageComposer = (props: AIMessageComposerProps) => (
  <MessageComposerProvider onSendMessage={props.onSendMessage}>
    <MessageComposerUI {...props} />
  </MessageComposerProvider>
);

export const PILL_HEIGHT = 48;

const styles = StyleSheet.create({
  absoluteContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  plusIcon: {
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputPill: {
    alignItems: 'center',
    flexDirection: 'row',
    maxHeight: PILL_HEIGHT * 3,
  },
  inputPillContainer: {
    flex: 1,
    minHeight: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: PILL_HEIGHT / 2,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginRight: 24,
  },
});
