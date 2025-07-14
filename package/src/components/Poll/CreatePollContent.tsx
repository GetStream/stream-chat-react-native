import React, { useCallback, useEffect, useState } from 'react';
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
      colors: { bg_user, black, white },
      poll: {
        createContent: { addComment, anonymousPoll, scrollView, suggestOption },
      },
    },
  } = useTheme();

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
        contentContainerStyle={{ paddingBottom: 70 }}
        style={[styles.scrollView, { backgroundColor: white }, scrollView]}
      >
        <NameField />
        <CreatePollOptions currentOptionPositions={currentOptionPositions} />
        <MultipleAnswersField />
        <View
          style={[styles.textInputWrapper, { backgroundColor: bg_user }, anonymousPoll.wrapper]}
        >
          <Text style={[styles.text, { color: black }, anonymousPoll.title]}>
            {t('Anonymous poll')}
          </Text>
          <Switch onValueChange={onAnonymousPollChangeHandler} value={isAnonymousPoll} />
        </View>
        <View
          style={[styles.textInputWrapper, { backgroundColor: bg_user }, suggestOption.wrapper]}
        >
          <Text style={[styles.text, { color: black }, suggestOption.title]}>
            {t('Suggest an option')}
          </Text>
          <Switch
            onValueChange={onAllowUserSuggestedOptionsChangeHandler}
            value={allowUserSuggestedOptions}
          />
        </View>
        <View style={[styles.textInputWrapper, { backgroundColor: bg_user }, addComment.wrapper]}>
          <Text style={[styles.text, { color: black }, addComment.title]}>
            {t('Add a comment')}
          </Text>
          <Switch onValueChange={onAllowAnswersChangeHandler} value={allowAnswers} />
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

const styles = StyleSheet.create({
  scrollView: { flex: 1, padding: 16 },
  text: { fontSize: 16 },
  textInputWrapper: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
});
