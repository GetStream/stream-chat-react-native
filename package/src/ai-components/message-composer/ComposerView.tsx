import React, { type ComponentType, type ReactNode, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import type { StateStore } from '@stream-io/state-store';

import { ActionButton } from './ActionButton';
import { BottomSheetContent } from './ActionSheet';

import { AttachmentButton } from './AttachmentButton';
import { type AIChatOption, SelectedChatOptionChip } from './ChatOptions';
import { EditingMessageChip } from './EditingMessageChip';

import { MediaPreviewList } from './MediaPreviewList';

import { BottomSheet } from '../components/BottomSheet';

import {
  ComposerProvider,
  useAITranslation,
  useMessageComposerContext,
  useTheme,
} from '../contexts';
import type {
  AIConversationController,
  AIConversationControllerState,
} from '../conversation-state/controller/AIConversationController';
import { isAIConversationAnswering } from '../conversation-state/controller/types';
import { useAIConversationState } from '../conversation-state/controller/useAIConversationState';
import { useBottomSafeArea } from '../internal/hooks/useBottomSafeArea';
import { useStableCallback } from '../internal/hooks/useStableCallback';
import { KeyboardStickyView } from '../internal/keyboard';
import { primitives } from '../internal/tokens';
import type {
  AbstractMediaPickerService,
  MediaPickerState,
} from '../services/media-picker-service/AbstractMediaPickerService';
import {
  COMPOSER_DICTATION_SOURCE,
  useComposerChatOption,
  useComposerIsEditing,
  useComposerText,
} from '../store';
import type { ComposerState } from '../store';
import { useDictationState } from '../store/dictation/useDictationState';
import { useDictationTranscript } from '../store/dictation/useDictationTranscript';

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
  /**
   * The conversation the person writes in. The composer shows its `composer` store, sends what
   * the person writes to it, offers to stop the agent while it answers, and says when the person
   * is editing a message. It takes the place of `onSendMessage`, `isGenerating`,
   * `stopGenerating` and `state`.
   */
  conversation?: AIConversationController;
  /** Sends what the person wrote. Required without `conversation`. */
  onSendMessage?: (opts: {
    text: string;
    attachments?: MediaPickerState['assets'];
    /** The chat option picked for the message. */
    chatOption?: AIChatOption;
    custom?: Record<string, unknown>;
  }) => Promise<void>;
  bottomSheetOptions?: BottomSheetOption[];
  /**
   * Ways to ask, such as "Think harder", listed in the sheet under the camera and photos. The one
   * picked shows as a chip in the composer, is sent with each message as `chatOption`, and stays
   * picked until the person removes it. It is kept in `state`, as `chatOption`.
   */
  chatOptions?: AIChatOption[];
  /** Shown above the composer, riding the keyboard with it, such as suggestions to start with. */
  header?: ReactNode;
  /**
   * How far above the bottom of the screen the composer sits, such as above a tab bar: it rides
   * the keyboard up by as much as the keyboard rises past that. Defaults to the bottom safe area,
   * the same as `AIConversation`'s. Needs react-native-keyboard-controller, with its
   * `KeyboardProvider` above it; without it, the composer doesn't move with the keyboard.
   */
  keyboardOffset?: number;
  /**
   * Shown after the message box, on the same line, such as a button into voice mode.
   */
  trailing?: ReactNode;
  /**
   * The button that dictates into the message box while it is empty. Defaults to
   * `SpeechToTextButton`; `null` shows none.
   */
  SpeechToTextButton?: ComponentType | null;
  isGenerating?: boolean;
  stopGenerating?: () => Promise<void>;
  bottomSheetInsets?: BottomSheetInsets;
  mediaPickerService?: AbstractMediaPickerService;
  state?: StateStore<ComposerState>;
};

export const ComposerViewUI = ({
  bottomSheetOptions = [],
  bottomSheetInsets,
  chatOptions,
  header,
  isGenerating,
  keyboardOffset,
  SpeechToTextButton,
  stopGenerating,
  trailing,
}: ComposerViewProps) => {
  const {
    theme: {
      composer: { container, containerRow, inputPillContainer, inputPill, trailing: trailingStyle },
    },
  } = useTheme();
  const styles = useStyles();
  const bottomSafeArea = useBottomSafeArea();
  const offset = useMemo(
    () => ({ closed: 0, opened: keyboardOffset ?? bottomSafeArea }),
    [bottomSafeArea, keyboardOffset],
  );

  return (
    <View pointerEvents={'box-none'}>
      <KeyboardStickyView offset={offset} pointerEvents={'box-none'}>
        {/* Edge to edge, as the room around the composer is its own. */}
        {header}
        <View style={[styles.container, container]}>
          <View style={[styles.row, containerRow]}>
            <AttachmentButton />

            <Animated.View
              style={[styles.inputPillContainer, inputPillContainer]}
              layout={LinearTransition.duration(150)}
            >
              <MediaPreviewList />
              <EditingChip />
              <ChatOptionChip />
              <View style={[styles.inputPill, inputPill]}>
                <AIMessageInput />
                <ActionButton
                  isGenerating={isGenerating}
                  SpeechToTextButton={SpeechToTextButton}
                  stopGenerating={stopGenerating}
                />
              </View>
            </Animated.View>
            {trailing ? <View style={[styles.trailing, trailingStyle]}>{trailing}</View> : null}
          </View>
        </View>
      </KeyboardStickyView>
      <BottomSheet>
        <BottomSheetContent
          bottomSheetOptions={bottomSheetOptions}
          bottomSheetInsets={bottomSheetInsets}
          chatOptions={chatOptions}
        />
      </BottomSheet>
    </View>
  );
};

/** Says the person is editing a message they sent, with a button that cancels it. */
const EditingChip = () => {
  const { isEditing } = useComposerIsEditing();
  const { state } = useMessageComposerContext();
  if (!isEditing) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={chipStyles.chip}
    >
      <EditingMessageChip onCancel={() => state.partialNext({ isEditing: false, text: '' })} />
    </Animated.View>
  );
};

/** The chat option picked for the next message, if any, with a button that removes it. */
const ChatOptionChip = () => {
  const { chatOption } = useComposerChatOption();
  const { setChatOption } = useMessageComposerContext();
  if (!chatOption) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      style={chipStyles.chip}
    >
      <SelectedChatOptionChip onRemove={() => setChatOption(null)} option={chatOption} />
    </Animated.View>
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
  const { t } = useAITranslation();

  const { error, isRecording, source } = useDictationState();
  const { text } = useComposerText();
  const { transcript } = useDictationTranscript();
  const { isEditing } = useComposerIsEditing();
  const { setText, state } = useMessageComposerContext();
  const previousTranscript = useRef(transcript);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!isEditing) return;
    if (Platform.OS === 'ios') {
      inputRef.current?.setNativeProps({ text: state.getLatestValue().text });
    }
    inputRef.current?.focus();
  }, [isEditing, state]);

  useEffect(() => {
    if (Platform.OS === 'ios' && text === '') {
      inputRef.current?.setNativeProps({ text: '' });
    }
  }, [text]);

  useEffect(() => {
    const transcriptChanged = transcript !== previousTranscript.current;
    previousTranscript.current = transcript;
    // Only dictation from the composer's own button fills the input; dictation started elsewhere
    // (a voice mode, say) must not overwrite what the user typed.
    if (source !== COMPOSER_DICTATION_SOURCE) return;
    if (!error && (isRecording || transcriptChanged)) {
      setText(transcript);
    }
  }, [isRecording, transcript, error, setText, source]);

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      placeholder={t('Ask anything')}
      placeholderTextColor={grey_neutral}
      ref={inputRef}
      style={[styles.textInput, textInput]}
      multiline
      underlineColorAndroid={'transparent'}
    />
  );
};

const statusSelector = ({ status }: AIConversationControllerState) => ({ status });

const ConversationComposerView = ({
  conversation,
  ...props
}: ComposerViewProps & { conversation: AIConversationController }) => {
  const { status } = useAIConversationState(conversation, statusSelector);
  const onSendMessage = useStableCallback((message: Parameters<SendMessage>[0]) =>
    Promise.resolve(conversation.send(message)),
  );
  const stopGenerating = useStableCallback(() => Promise.resolve(conversation.stop()));
  return (
    <ComposerProvider
      mediaPickerService={props.mediaPickerService}
      onSendMessage={onSendMessage}
      state={conversation.composer}
    >
      <ComposerViewUI
        {...props}
        isGenerating={isAIConversationAnswering(status)}
        stopGenerating={stopGenerating}
      />
    </ComposerProvider>
  );
};

type SendMessage = NonNullable<ComposerViewProps['onSendMessage']>;

export const ComposerView = (props: ComposerViewProps) =>
  props.conversation ? (
    <ConversationComposerView {...props} conversation={props.conversation} />
  ) : (
    <ComposerProvider
      onSendMessage={props.onSendMessage}
      mediaPickerService={props.mediaPickerService}
      state={props.state}
    >
      <ComposerViewUI {...props} />
    </ComposerProvider>
  );

const chipStyles = StyleSheet.create({
  chip: { alignSelf: 'stretch', paddingBottom: primitives.spacingXs },
});

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
      trailing: {
        justifyContent: 'center',
        marginStart: 8,
        minHeight: pillHeight,
      },
      textInput: {
        flex: 1,
        fontSize: primitives.typographyFontSizeMd,
        color: colors.black,
        paddingVertical: 0,
        paddingHorizontal: 0,
        marginRight: 24,
      },
    });
  }, [theme]);
};
