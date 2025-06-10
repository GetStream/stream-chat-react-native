import React, { useCallback, useEffect } from 'react';
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

const pollComposerStateSelector = (state: PollComposerState) => ({
  allow_answers: state.data.allow_answers,
  allow_user_suggested_options: state.data.allow_user_suggested_options,
  enforce_unique_vote: state.data.enforce_unique_vote,
  max_votes_allowed: state.data.max_votes_allowed,
  name: state.data.name,
  options: state.data.options,
  voting_visibility: state.data.voting_visibility,
});

export const POLL_OPTION_HEIGHT = 71;

export const CreatePollContent = () => {
  const { t } = useTranslationContext();

  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;
  const { allow_answers, allow_user_suggested_options, options, voting_visibility } = useStateStore(
    pollComposer.state,
    pollComposerStateSelector,
  );

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
            {t<string>('Anonymous poll')}
          </Text>
          <Switch
            onValueChange={(value) =>
              pollComposer.updateFields({
                voting_visibility: value ? VotingVisibility.anonymous : VotingVisibility.public,
              })
            }
            value={voting_visibility === VotingVisibility.anonymous}
          />
        </View>
        <View
          style={[styles.textInputWrapper, { backgroundColor: bg_user }, suggestOption.wrapper]}
        >
          <Text style={[styles.text, { color: black }, suggestOption.title]}>
            {t<string>('Suggest an option')}
          </Text>
          <Switch
            onValueChange={(value) =>
              pollComposer.updateFields({ allow_user_suggested_options: value })
            }
            value={allow_user_suggested_options}
          />
        </View>
        <View style={[styles.textInputWrapper, { backgroundColor: bg_user }, addComment.wrapper]}>
          <Text style={[styles.text, { color: black }, addComment.title]}>
            {t<string>('Add a comment')}
          </Text>
          <Switch
            onValueChange={(value) => pollComposer.updateFields({ allow_answers: value })}
            value={allow_answers}
          />
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
      /**
       * The poll is emptied inside the createPoll method(using initState) which is why we close the dialog
       * first so that it doesn't look weird.
       */
      closePollCreationDialog?.();
      await messageComposer.createPoll();
      await sendMessage();
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
