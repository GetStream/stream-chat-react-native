import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

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
import { POLL_OPTION_HEIGHT } from '../../utils/constants';

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

  const { createPollOptionHeight, closePollCreationDialog, createAndSendPoll } =
    useCreatePollContentContext();

  // positions and index lookup map
  // TODO: Please rethink the structure of this, bidirectional data flow is not great
  const currentOptionPositions = useSharedValue<CurrentOptionPositionsCache>({
    inverseIndexCache: {},
    positionCache: {},
  });

  const {
    theme: {
      colors: { white },
      poll: {
        createContent: { addComment, anonymousPoll, optionCardWrapper, scrollView, suggestOption },
      },
    },
  } = useTheme();
  const styles = useStyles();

  useEffect(() => {
    if (!createPollOptionHeight) return;
    const newCurrentOptionPositions: CurrentOptionPositionsCache = {
      inverseIndexCache: {},
      positionCache: {},
    };
    options.forEach((option, index) => {
      newCurrentOptionPositions.inverseIndexCache[index] = option.id;
      newCurrentOptionPositions.positionCache[option.id] = {
        updatedIndex: index,
        updatedTop: index * createPollOptionHeight,
      };
    });
    currentOptionPositions.value = newCurrentOptionPositions;
  }, [createPollOptionHeight, currentOptionPositions, options]);

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
        style={[styles.scrollView, { backgroundColor: white }, scrollView]}
      >
        <NameField />
        <CreatePollOptions currentOptionPositions={currentOptionPositions} />
        <View style={[styles.optionCardWrapper, optionCardWrapper]}>
          <MultipleAnswersField />
          <View style={[styles.optionCard, anonymousPoll.wrapper]}>
            <View style={[styles.optionCardContent, anonymousPoll.optionCardContent]}>
              <Text style={[styles.title, anonymousPoll.title]}>{t('Anonymous poll')}</Text>
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
        </View>
      </ScrollView>
    </>
  );
};

export const CreatePoll = ({
  closePollCreationDialog,
  CreatePollContent: CreatePollContentOverride,
  createPollOptionHeight = POLL_OPTION_HEIGHT,
  sendMessage,
}: Pick<
  CreatePollContentContextValue,
  'createPollOptionHeight' | 'closePollCreationDialog' | 'sendMessage'
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
      value={{ closePollCreationDialog, createAndSendPoll, createPollOptionHeight, sendMessage }}
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
      scrollView: { flex: 1, padding: primitives.spacingMd },
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
        backgroundColor: semantics.inputOptionCardBg,
        padding: primitives.spacingMd,
        borderRadius: primitives.radiusLg,
      },
      optionCardWrapper: {
        gap: primitives.spacingMd,
      },
      optionCardSwitch: {
        marginRight: primitives.spacingMd,
      },
    });
  }, [semantics]);
};
