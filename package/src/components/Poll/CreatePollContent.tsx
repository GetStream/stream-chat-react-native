import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { PollComposerState, VotingVisibility } from 'stream-chat';

import { CreatePollOptions, CurrentOptionPositionsCache, PollModalHeader } from './components';

import { MultipleAnswersField } from './components/MultipleAnswersField';
import { NameField } from './components/NameField';

import { useCanCreatePoll } from './hooks/useCanCreatePoll';

import {
  CreatePollContentContextValue,
  CreatePollContentProvider,
  InputMessageInputContextValue,
  useChatContext,
  useCreatePollContentContext,
  useTheme,
  useTranslationContext,
} from '../../contexts';
import { useMessageComposer } from '../../contexts/messageInputContext/hooks/useMessageComposer';
import { useStateStore } from '../../hooks/useStateStore';
import { SendPoll } from '../../icons';

const pollComposerStateSelector = (state: PollComposerState) => ({
  allow_answers: state.data.allow_answers,
  allow_user_suggested_options: state.data.allow_user_suggested_options,
  enforce_unique_vote: state.data.enforce_unique_vote,
  max_votes_allowed: state.data.max_votes_allowed,
  name: state.data.name,
  options: state.data.options,
  voting_visibility: state.data.voting_visibility,
});

export const CreatePollContent = () => {
  const { t } = useTranslationContext();
  // const [pollOptions, setPollOptions] = useState<PollOptionData[]>([{ text: '' }]);

  const [duplicates, setDuplicates] = useState<string[]>([]);
  const messageComposer = useMessageComposer();
  const canCreatePoll = useCanCreatePoll();
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
    inverseIndexCache: { 0: 0 },
    positionCache: { 0: { updatedIndex: 0, updatedTop: 0 } },
  });

  const {
    theme: {
      colors: { bg_user, black, white },
      poll: {
        createContent: {
          addComment,
          anonymousPoll,
          headerContainer,
          scrollView,
          sendButton,
          suggestOption,
        },
      },
    },
  } = useTheme();

  useEffect(() => {
    if (!createPollOptionHeight) return;
    const newIndex = options.length;
    currentOptionPositions.value = {
      inverseIndexCache: {
        ...currentOptionPositions.value.inverseIndexCache,
        [newIndex]: newIndex,
      },
      positionCache: {
        ...currentOptionPositions.value.positionCache,
        [newIndex]: {
          updatedIndex: newIndex,
          updatedTop: newIndex * createPollOptionHeight,
        },
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPollOptionHeight, options.length]);

  useEffect(() => {
    const seenTexts = new Set<string>();
    const duplicateTexts = new Set<string>();
    for (const option of options) {
      const { text } = option;
      if (seenTexts.has(text)) {
        duplicateTexts.add(text);
      }
      if (text.length > 0) {
        seenTexts.add(text);
      }
    }

    setDuplicates(Array.from(duplicateTexts));
  }, [options]);

  return (
    <>
      <View style={[styles.headerContainer, { backgroundColor: white }, headerContainer]}>
        <PollModalHeader
          onPress={() => {
            pollComposer.initState();
            closePollCreationDialog?.();
          }}
          title={t('Create Poll')}
        />
        <Pressable
          disabled={!canCreatePoll}
          onPress={async () => {
            const currentPollOptions = Object.assign({}, options);
            const reorderedPollOptions = [];

            for (let i = 0; i < options.length; i++) {
              const currentOption =
                currentPollOptions[currentOptionPositions.value.inverseIndexCache[i]];
              if (currentOption.text.length > 0) {
                reorderedPollOptions.push(currentOption);
              }
            }
            await pollComposer.updateFields({
              options: reorderedPollOptions,
            });
            await createAndSendPoll();
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }, styles.sendButton, sendButton]}
        >
          <SendPoll
            height={24}
            pathFill={canCreatePoll ? '#005DFF' : '#B4BBBA'}
            viewBox='0 0 24 24'
            width={24}
          />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 70 }}
        style={[styles.scrollView, { backgroundColor: white }, scrollView]}
      >
        <NameField />
        <CreatePollOptions
          currentOptionPositions={currentOptionPositions}
          duplicates={duplicates}
        />
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
  createPollOptionHeight = 71,
  sendMessage,
}: Pick<
  CreatePollContentContextValue,
  'createPollOptionHeight' | 'closePollCreationDialog' | 'sendMessage'
> &
  Pick<InputMessageInputContextValue, 'CreatePollContent'>) => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposer();
  const { pollComposer } = messageComposer;

  const createAndSendPoll = useCallback(async () => {
    try {
      const composition = await pollComposer.compose();
      if (!composition || !composition.data.id) return;

      const { poll } = await client.createPoll(composition.data);

      await sendMessage({ customMessageData: { poll_id: poll.id } });
      await pollComposer.initState();
      closePollCreationDialog?.();
    } catch (error) {
      console.log('error', error);
    }
  }, [pollComposer, client, sendMessage, closePollCreationDialog]);

  return (
    <CreatePollContentProvider
      value={{ closePollCreationDialog, createAndSendPoll, createPollOptionHeight, sendMessage }}
    >
      {CreatePollContentOverride ? <CreatePollContentOverride /> : <CreatePollContent />}
    </CreatePollContentProvider>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  scrollView: { flex: 1, padding: 16 },
  sendButton: { paddingHorizontal: 16, paddingVertical: 18 },
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
