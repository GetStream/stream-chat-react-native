import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import Animated, { LinearTransition, useSharedValue } from 'react-native-reanimated';

import { PollComposerState, VotingVisibility } from 'stream-chat';

import { CreatePollOptions, CurrentOptionPositionsCache } from './components';

import { CreatePollHeader } from './components/CreatePollHeader';
import { MultipleAnswersField } from './components/MultipleAnswersField';
import { NameField } from './components/NameField';

import {
  CreatePollContentContextValue,
  CreatePollContentProvider,
  InputMessageInputContextValue,
  useCreatePollContentContext,
  useTheme,
  useTranslationContext,
} from '../../contexts';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../hooks/useStateStore';
import { primitives } from '../../theme';

const pollComposerStateSelector = (state: PollComposerState) => ({
  options: state.data.options,
});

export const CreatePollContent = () => {
  const [isAnonymousPoll, setIsAnonymousPoll] = useState<boolean>(false);
  const [allowUserSuggestedOptions, setAllowUserSuggestedOptions] = useState<boolean>(false);
  const [allowAnswers, setAllowAnswers] = useState<boolean>(false);

  const { t } = useTranslationContext();

  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { options } = useStateStore(pollComposer.state, pollComposerStateSelector);

  const {
    createPollOptionGap = 8,
    closePollCreationDialog,
    createAndSendPoll,
  } = useCreatePollContentContext();
  const normalizedCreatePollOptionGap =
    Number.isFinite(createPollOptionGap) && createPollOptionGap > 0 ? createPollOptionGap : 0;
  const optionIdsKey = useMemo(() => options.map((option) => option.id).join('|'), [options]);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // positions and index lookup map
  // TODO: Please rethink the structure of this, bidirectional data flow is not great
  const currentOptionPositions = useSharedValue<CurrentOptionPositionsCache>({
    inverseIndexCache: {},
    positionCache: {},
    totalHeight: 0,
  });

  const {
    theme: {
      poll: {
        createContent: { addComment, anonymousPoll, optionCardWrapper, scrollView, suggestOption },
      },
    },
  } = useTheme();
  const styles = useStyles();

  useEffect(() => {
    const latestOptions = optionsRef.current;
    const currentPositions = currentOptionPositions.value;
    const isCacheAlignedWithOptions =
      latestOptions.length === Object.keys(currentPositions.inverseIndexCache).length &&
      latestOptions.every(
        (option, index) =>
          currentPositions.inverseIndexCache[index] === option.id &&
          currentPositions.positionCache[option.id] !== undefined,
      );

    // Avoid overwriting freshly measured heights/tops from CreatePollOptions onLayout.
    // We only need this effect when options ids/order introduced missing cache entries.
    if (isCacheAlignedWithOptions) {
      return;
    }

    const previousPositionCache = currentOptionPositions.value.positionCache;
    const newCurrentOptionPositions: CurrentOptionPositionsCache = {
      inverseIndexCache: {},
      positionCache: {},
      totalHeight: 0,
    };
    let runningTop = 0;
    latestOptions.forEach((option, index) => {
      const preservedHeight = previousPositionCache[option.id]?.updatedHeight ?? 0;
      newCurrentOptionPositions.inverseIndexCache[index] = option.id;
      newCurrentOptionPositions.positionCache[option.id] = {
        updatedHeight: preservedHeight,
        updatedIndex: index,
        updatedTop: runningTop,
      };
      const gap = index === latestOptions.length - 1 ? 0 : normalizedCreatePollOptionGap;
      runningTop += preservedHeight + gap;
      newCurrentOptionPositions.totalHeight = runningTop;
    });
    currentOptionPositions.value = newCurrentOptionPositions;
  }, [currentOptionPositions, normalizedCreatePollOptionGap, optionIdsKey]);

  const onBackPressHandler = useCallback(() => {
    pollComposer.initState();
    closePollCreationDialog?.();
  }, [pollComposer, closePollCreationDialog]);

  const onCreatePollPressHandler = useCallback(async () => {
    await createAndSendPoll();
  }, [createAndSendPoll]);

  const onAnonymousPollChangeHandler = useCallback(
    async (value: boolean) => {
      setIsAnonymousPoll(value);
      await pollComposer.updateFields({
        voting_visibility: value ? VotingVisibility.anonymous : VotingVisibility.public,
      });
    },
    [pollComposer],
  );

  const onAllowUserSuggestedOptionsChangeHandler = useCallback(
    async (value: boolean) => {
      setAllowUserSuggestedOptions(value);
      await pollComposer.updateFields({ allow_user_suggested_options: value });
    },
    [pollComposer],
  );

  const onAllowAnswersChangeHandler = useCallback(
    async (value: boolean) => {
      setAllowAnswers(value);
      await pollComposer.updateFields({ allow_answers: value });
    },
    [pollComposer],
  );

  return (
    <>
      <CreatePollHeader
        onBackPressHandler={onBackPressHandler}
        onCreatePollPressHandler={onCreatePollPressHandler}
      />
      <ScrollView
        contentContainerStyle={styles.contentContainerStyle}
        style={[styles.scrollView, scrollView]}
      >
        <NameField />
        <CreatePollOptions currentOptionPositions={currentOptionPositions} />
        <Animated.View
          layout={LinearTransition.duration(200)}
          style={[styles.optionCardWrapper, optionCardWrapper]}
        >
          <MultipleAnswersField />
          <Animated.View
            layout={LinearTransition.duration(200)}
            style={[styles.optionCardWrapper, optionCardWrapper]}
          >
            <View style={[styles.optionCard, anonymousPoll.wrapper]}>
              <View style={[styles.optionCardContent, anonymousPoll.optionCardContent]}>
                <Text style={[styles.title, anonymousPoll.title]}>{t('Anonymous voting')}</Text>
                <Text style={[styles.description, anonymousPoll.description]}>Hide who voted</Text>
              </View>

              <Switch
                onValueChange={onAnonymousPollChangeHandler}
                value={isAnonymousPoll}
                style={[styles.optionCardSwitch, anonymousPoll.optionCardSwitch]}
              />
            </View>
            <View style={[styles.optionCard, suggestOption.wrapper]}>
              <View style={[styles.optionCardContent, suggestOption.optionCardContent]}>
                <Text style={[styles.title, suggestOption.title]}>{t('Suggest an option')}</Text>
                <Text style={[styles.description, suggestOption.description]}>
                  Let others add options
                </Text>
              </View>

              <Switch
                onValueChange={onAllowUserSuggestedOptionsChangeHandler}
                value={allowUserSuggestedOptions}
                style={[styles.optionCardSwitch, suggestOption.optionCardSwitch]}
              />
            </View>
            <View style={[styles.optionCard, addComment.wrapper]}>
              <View style={[styles.optionCardContent, addComment.optionCardContent]}>
                <Text style={[styles.title, addComment.title]}>{t('Add a comment')}</Text>
                <Text style={[styles.description, addComment.description]}>
                  Add a comment to the poll
                </Text>
              </View>

              <Switch
                onValueChange={onAllowAnswersChangeHandler}
                value={allowAnswers}
                style={[styles.optionCardSwitch, addComment.optionCardSwitch]}
              />
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </>
  );
};

export const CreatePoll = ({
  closePollCreationDialog,
  CreatePollContent: CreatePollContentOverride,
  createPollOptionGap = 8,
  sendMessage,
}: Pick<
  CreatePollContentContextValue,
  'createPollOptionGap' | 'closePollCreationDialog' | 'sendMessage'
> &
  Pick<InputMessageInputContextValue, 'CreatePollContent'>) => {
  const messageComposer = useMessageComposer();

  const createAndSendPoll = useCallback(async () => {
    try {
      await messageComposer.createPoll();
      await sendMessage();
      closePollCreationDialog?.();
      // it's important that the reset of the pollComposer state happens
      // after we've already closed the modal; as otherwise we'd get weird
      // UI behaviour.
      messageComposer.pollComposer.initState();
    } catch (error) {
      console.log('Error creating a poll and sending a message:', error);
    }
  }, [messageComposer, sendMessage, closePollCreationDialog]);

  return (
    <CreatePollContentProvider
      value={{
        closePollCreationDialog,
        createAndSendPoll,
        createPollOptionGap,
        sendMessage,
      }}
    >
      {CreatePollContentOverride ? <CreatePollContentOverride /> : <CreatePollContent />}
    </CreatePollContentProvider>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      scrollView: {
        flex: 1,
        padding: primitives.spacingMd,
        backgroundColor: semantics.backgroundCoreElevation1,
      },
      contentContainerStyle: { paddingBottom: 70 },
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      description: {
        color: semantics.textTertiary,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      optionCardContent: {
        gap: primitives.spacingXxs,
      },
      optionCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        backgroundColor: semantics.backgroundCoreSurfaceCard,
        padding: primitives.spacingMd,
        borderRadius: primitives.radiusLg,
      },
      optionCardWrapper: {
        gap: primitives.spacingMd,
      },
      optionCardSwitch: { width: 64 },
    });
  }, [semantics]);
};
