import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  Poll as PollClass,
  PollOption as PollOptionClass,
  PollResponse,
  PollState,
  PollVote,
} from 'stream-chat';

import { usePollAnswersPagination } from './hooks/usePollAnswersPagination';

import {
  PollContextProvider,
  useChatContext,
  useMessageContext,
  usePollContext,
} from '../../contexts';
import { useStateStore } from '../../hooks';
// import * as dbApi from '../../store/apis';
import { Avatar } from '../Avatar/Avatar';

const selector = (nextValue: PollState) =>
  [
    nextValue.vote_counts_by_option,
    nextValue.ownVotesByOptionId,
    nextValue.latest_votes_by_option,
    nextValue.answers_count,
    nextValue.latestCastOrUpdatedAnswer,
    nextValue.latestRemovedAnswer,
    nextValue.options,
    nextValue.name,
    nextValue.max_votes_allowed,
  ] as const;

const selector2 = (nextValue: PollState) =>
  [nextValue.latest_votes_by_option, nextValue.maxVotedOptionIds] as const;

const PollInputDialog = ({ closeDialog, onSubmit, title, visible }) => {
  const [dialogInput, setDialogInput] = useState('');

  return (
    <Modal animationType='fade' onRequestClose={closeDialog} transparent={true} visible={visible}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <View
          style={{
            width: '80%',
            paddingHorizontal: 16,
            paddingTop: 32,
            paddingBottom: 20,
            borderRadius: 16,
            backgroundColor: 'white',
          }}
        >
          <Text style={{ fontSize: 17, lineHeight: 20, fontWeight: 500 }}>{title}</Text>
          <TextInput
            onChangeText={setDialogInput}
            placeholder='Ask a question'
            style={{
              fontSize: 16,
              height: 36,
              alignItems: 'center',
              padding: 0,
              borderColor: 'gray',
              borderRadius: 18,
              borderWidth: 1,
              paddingHorizontal: 16,
              marginTop: 16,
            }}
            value={dialogInput}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 52 }}>
            <TouchableOpacity onPress={closeDialog}>
              <Text style={{ color: '#005DFF', fontSize: 17, fontWeight: 500 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onSubmit(dialogInput);
                closeDialog();
              }}
              style={{ marginLeft: 32 }}
            >
              <Text style={{ color: '#005DFF', fontSize: 17, fontWeight: 500 }}>SEND</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const PollOption = ({ option }: { option: PollOptionClass }) => {
  const { optionVoteCounts, ownVotesByOptionId, poll } = usePollContext();
  const { message } = useMessageContext();

  const toggleVote = useCallback(async () => {
    if (ownVotesByOptionId[option.id]) {
      await poll.removeVote(ownVotesByOptionId[option.id], message.id);
    } else {
      await poll.castVote(option.id, message.id);
    }
  }, [message.id, option.id, ownVotesByOptionId, poll]);

  const [latestVotesByOption, maxVotedOptionIds] = useStateStore(poll.state, selector2);

  const relevantVotes = useMemo(
    () => latestVotesByOption?.[option.id]?.slice(0, 2) || [],
    [latestVotesByOption, option.id],
  );
  const maxVotes = useMemo(
    () => (maxVotedOptionIds?.[0] && optionVoteCounts ? optionVoteCounts[maxVotedOptionIds[0]] : 0),
    [maxVotedOptionIds, optionVoteCounts],
  );
  const votes = optionVoteCounts[option.id] || 0;
  // TODO: Just a reminder to take care of offline mode.
  // useEffect(() => {
  //   const pollState = poll.state.getLatestValue();
  //   dbApi.updateMessage({
  //     message: {
  //       ...message,
  //       poll_id: poll.id,
  //       poll: { ...pollState, own_votes: pollState.ownVotes, id: poll.id },
  //     },
  //   });
  // }, [optionVoteCounts]);

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={toggleVote}
          style={{
            width: 15,
            height: 15,
            backgroundColor: ownVotesByOptionId[option.id] ? 'red' : 'white',
            borderWidth: 1,
            borderColor: 'black',
          }}
        />
        <Text style={{ flex: 1 }}>{option.text}</Text>
        <View style={{ flexDirection: 'row' }}>
          {relevantVotes.map((vote: PollVote) => (
            <Avatar
              // containerStyle={{ position: 'absolute', right: index * 15 }}
              image={vote.user.image as string}
              key={vote.id}
              size={20}
            />
          ))}
          <Text style={{ marginLeft: 2 }}>{optionVoteCounts[option.id] || 0}</Text>
        </View>
      </View>
      <View style={{ flex: 1, height: 4, borderRadius: 4, flexDirection: 'row' }}>
        <View style={{ backgroundColor: '#005DFF', flex: maxVotes > 0 ? votes / maxVotes : 0 }} />
        <View
          style={{
            backgroundColor: 'grey',
            flex: maxVotes > 0 ? (maxVotes - votes) / maxVotes : 1,
          }}
        />
      </View>
    </View>
  );
};

const PollAnswersList = ({
  addComment,
  close,
}: {
  addComment: (text: string) => void;
  close: () => void;
}) => {
  const { hasNextPage, loadMore, pollAnswers } = usePollAnswersPagination();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);

  return (
    <View>
      <TouchableOpacity onPress={close}>
        <Text>BACK</Text>
      </TouchableOpacity>
      <Text>Poll Comments</Text>
      <FlatList
        data={pollAnswers}
        // keyExtractor={(item) => item.id}
        onEndReached={() => hasNextPage && loadMore()}
        renderItem={({ item }) => (
          <>
            <Text>{item.answer_text}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Avatar
                // containerStyle={{ position: 'absolute', right: index * 15 }}
                image={item.user.image as string}
                size={20}
              />
              <Text>{item.created_at}</Text>
            </View>
          </>
        )}
      />
      <TouchableOpacity
        onPress={() => setShowAddCommentDialog(true)}
        style={{
          marginHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text>Add a comment</Text>
      </TouchableOpacity>
      <PollInputDialog
        closeDialog={() => setShowAddCommentDialog(false)}
        onSubmit={(value) => addComment(value)}
        title='Add a comment'
        visible={showAddCommentDialog}
      />
    </View>
  );
};

const PollResults = ({ close }: { close: () => void }) => {
  const { latestVotesByOption, name, options, optionVoteCounts } = usePollContext();
  const [showAllVotes, setShowAllVotes] = useState(false);

  const sortedOptions = [...options].sort(
    (a, b) => (optionVoteCounts[b.id] ?? 0) - (optionVoteCounts[a.id] ?? 0),
  );
  return (
    <>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={close}>
          <Text>BACK</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 32 }}>Poll Results</Text>
      </View>
      <Text>{name}</Text>
      {sortedOptions.map((option) => (
        <View
          key={`results_${option.id}`}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: '#F7F7F8',
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>{option.text}</Text>
            <Text>{optionVoteCounts[option.id] ?? 0} votes</Text>
          </View>
          {(latestVotesByOption?.[option.id] ?? []).map((vote: PollVote) => (
            <View
              key={`results_vote_${vote.id}`}
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row' }}>
                <Avatar
                  // containerStyle={{ position: 'absolute', right: index * 15 }}
                  image={vote.user.image as string}
                  key={vote.id}
                  size={20}
                />
                <Text>{vote.user.name}</Text>
              </View>
              <Text>{vote.created_at}</Text>
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setShowAllVotes(true)}
            style={{
              marginHorizontal: 16,
              alignItems: 'center',
            }}
          >
            <Text>View Results</Text>
          </TouchableOpacity>
          {showAllVotes ? (
            <Modal
              animationType='fade'
              onRequestClose={() => setShowAllVotes(false)}
              visible={showAllVotes}
            >
              <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => setShowAllVotes(false)}
                    style={{
                      marginHorizontal: 16,
                      alignItems: 'center',
                    }}
                  >
                    <Text>BACK</Text>
                  </TouchableOpacity>
                  <Text>{option.text}</Text>
                </View>
              </SafeAreaView>
            </Modal>
          ) : null}
        </View>
      ))}
    </>
  );
};

const PollWithContext = () => {
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { addComment, addOption, answersCount, endVote, maxNumberOfVotes, name, options } =
    usePollContext();
  const subtitle = maxNumberOfVotes ? `Select up to ${maxNumberOfVotes}` : 'Select one or more';

  return (
    <View style={{ padding: 15, width: 270 }}>
      <Text>{name}</Text>
      <Text>{subtitle}</Text>
      {options?.slice(0, 10)?.map((option: PollOptionClass) => (
        <PollOption key={option.id} option={option} />
      ))}
      {options && options.length > 10 ? (
        <>
          <TouchableOpacity
            onPress={() => setShowAllOptions(true)}
            style={{
              marginHorizontal: 16,
              alignItems: 'center',
            }}
          >
            <Text>See all {options.length} options</Text>
          </TouchableOpacity>
          {showAllOptions ? (
            <Modal
              animationType='slide'
              onRequestClose={() => setShowAllOptions(false)}
              visible={showAllOptions}
            >
              <SafeAreaView style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => setShowAllOptions(false)}>
                  <Text>BACK</Text>
                </TouchableOpacity>
                <Text>{name}</Text>
                {options?.map((option: PollOptionClass) => (
                  <PollOption key={option.id} option={option} />
                ))}
              </SafeAreaView>
            </Modal>
          ) : null}
        </>
      ) : null}
      <TouchableOpacity
        onPress={() => setShowAnswers(true)}
        style={{
          marginHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text>View {answersCount} comments</Text>
      </TouchableOpacity>
      <Modal
        animationType='slide'
        onRequestClose={() => setShowAnswers(false)}
        visible={showAnswers}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <PollAnswersList addComment={addComment} close={() => setShowAnswers(false)} />
        </SafeAreaView>
      </Modal>
      <TouchableOpacity
        onPress={() => setShowAddOptionDialog(true)}
        style={{
          marginHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text>Suggest an option</Text>
      </TouchableOpacity>
      <PollInputDialog
        closeDialog={() => setShowAddOptionDialog(false)}
        onSubmit={(value) => addOption(value)}
        title='Suggest an option'
        visible={showAddOptionDialog}
      />
      <TouchableOpacity
        onPress={() => setShowAddCommentDialog(true)}
        style={{
          marginHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text>Add a comment</Text>
      </TouchableOpacity>
      <PollInputDialog
        closeDialog={() => setShowAddCommentDialog(false)}
        onSubmit={(value) => addComment(value)}
        title='Add a comment'
        visible={showAddCommentDialog}
      />
      <TouchableOpacity
        onPress={() => setShowResults(true)}
        style={{
          marginHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text>View Results</Text>
      </TouchableOpacity>
      {showResults ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowResults(false)}
          visible={showResults}
        >
          <SafeAreaView style={{ flex: 1, marginHorizontal: 16 }}>
            <PollResults close={() => setShowResults(false)} />
          </SafeAreaView>
        </Modal>
      ) : null}
      <TouchableOpacity
        onPress={endVote}
        style={{
          marginHorizontal: 16,
          alignItems: 'center',
        }}
      >
        <Text>End Vote</Text>
      </TouchableOpacity>
    </View>
  );
};

export const Poll = ({ poll: pollData }: { poll: PollResponse }) => {
  const { client } = useChatContext();
  const { message } = useMessageContext();

  const poll = useMemo<PollClass>(
    () => new PollClass({ client, poll: pollData }),
    [client, pollData],
  );

  const [
    optionVoteCounts,
    ownVotesByOptionId,
    latestVotesByOption,
    answersCount,
    latestCastOrUpdatedAnswer,
    latestRemovedAnswer,
    options,
    name,
    maxNumberOfVotes,
  ] = useStateStore(poll.state, selector);

  const addOption = useCallback(
    (optionText: string) => poll.createOption({ text: optionText }),
    [poll],
  );
  const addComment = useCallback(
    (answerText: string) => poll.addAnswer(answerText, message.id),
    [message.id, poll],
  );
  const endVote = useCallback(() => poll.close(), [poll]);

  useEffect(() => {
    poll.registerSubscriptions();
    return poll.unregisterSubscriptions;
  }, [poll]);

  return (
    <PollContextProvider
      value={{
        maxNumberOfVotes,
        options,
        optionVoteCounts,
        poll,
        name,
        ownVotesByOptionId,
        addOption,
        addComment,
        answersCount,
        latestCastOrUpdatedAnswer,
        latestRemovedAnswer,
        endVote,
        latestVotesByOption,
      }}
    >
      <PollWithContext />
    </PollContextProvider>
  );
};
