import React, { useCallback, useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Poll, PollOption } from 'stream-chat';

import { PollAnswersList } from './PollAnswersList';
import { PollInputDialog } from './PollInputDialog';
import { PollModalHeader } from './PollModalHeader';
import { PollAllOptions } from './PollOption';

import { PollOptionFullResults, PollResults } from './PollResults';

import { useChatContext, usePollContext, useTheme, useTranslationContext } from '../../../contexts';
import { Check } from '../../../icons';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { MessageType } from '../../MessageList/hooks/useMessageList';
import { usePollState } from '../hooks/usePollState';

export type PollButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  onPress?: ({
    message,
    poll,
  }: {
    message: MessageType<StreamChatGenerics>;
    poll: Poll<StreamChatGenerics>;
  }) => void;
};

export type PollVoteButtonProps = {
  onPress?: () => void;
};

export const GenericPollButton = ({ onPress, title }: { onPress?: () => void; title?: string }) => {
  const {
    theme: {
      colors: { accent_dark_blue },
      poll: {
        button: { container, text },
      },
    },
  } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, container]}>
      <Text style={[styles.text, { color: accent_dark_blue }, text]}>{title}</Text>
    </TouchableOpacity>
  );
};

export const ViewResultsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const [showResults, setShowResults] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowResults(true);
  }, [message, onPress, poll]);

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  return (
    <>
      <GenericPollButton onPress={onPressHandler} title={t<string>('View Results')} />
      {showResults ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowResults(false)}
          visible={showResults}
        >
          <SafeAreaView style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader
              onPress={() => setShowResults(false)}
              title={t<string>('Poll Results')}
            />
            <PollResults message={message} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const EndVoteButton = () => {
  const { t } = useTranslationContext();
  const { created_by, endVote, is_closed } = usePollState();
  const { client } = useChatContext();

  return !is_closed && created_by?.id === client.userID ? (
    <GenericPollButton onPress={endVote} title={t<string>('End Vote')} />
  ) : null;
};

export const AddCommentButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addComment, allow_answers, is_closed } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  return (
    <>
      {!is_closed && allow_answers ? (
        <GenericPollButton onPress={onPressHandler} title={t<string>('Add a comment')} />
      ) : null}
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddCommentDialog(false)}
          onSubmit={addComment}
          title={t<string>('Add a comment')}
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export const ShowAllCommentsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { answers_count } = usePollState();
  const [showAnswers, setShowAnswers] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAnswers(true);
  }, [message, onPress, poll]);

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  return (
    <>
      {answers_count && answers_count > 0 ? (
        <GenericPollButton
          onPress={onPressHandler}
          title={t<string>('View {{count}} comments', { count: answers_count })}
        />
      ) : null}
      {showAnswers ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowAnswers(false)}
          visible={showAnswers}
        >
          <SafeAreaView style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader
              onPress={() => setShowAnswers(false)}
              title={t<string>('Poll Comments')}
            />
            <PollAnswersList message={message} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const AnswerListAddCommentButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addComment, ownAnswer } = usePollState();
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  const {
    theme: {
      colors: { accent_dark_blue, bg_user },
      poll: {
        answersList: { buttonContainer },
        button: { text },
      },
    },
  } = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={onPressHandler}
        style={[
          styles.answerListAddCommentContainer,
          { backgroundColor: bg_user },
          buttonContainer,
        ]}
      >
        <Text style={[styles.text, { color: accent_dark_blue }, text]}>
          {ownAnswer ? t<string>('Update your comment') : t<string>('Add a comment')}
        </Text>
      </TouchableOpacity>
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddCommentDialog(false)}
          onSubmit={addComment}
          title={t<string>('Add a comment')}
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export const SuggestOptionButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addOption, allow_user_suggested_options, is_closed } = usePollState();
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddOptionDialog(true);
  }, [message, onPress, poll]);

  return (
    <>
      {!is_closed && allow_user_suggested_options ? (
        <GenericPollButton onPress={onPressHandler} title={t<string>('Suggest an option')} />
      ) : null}
      {showAddOptionDialog ? (
        <PollInputDialog
          closeDialog={() => setShowAddOptionDialog(false)}
          onSubmit={addOption}
          title={t<string>('Suggest an option')}
          visible={showAddOptionDialog}
        />
      ) : null}
    </>
  );
};

export const ShowAllOptionsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const [showAllOptions, setShowAllOptions] = useState(false);
  const { message, poll } = usePollContext();
  const { options } = usePollState();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAllOptions(true);
  }, [message, onPress, poll]);

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  return (
    <>
      {options && options.length > 10 ? (
        <GenericPollButton
          onPress={onPressHandler}
          title={t<string>('See all {{count}} options', { count: options.length })}
        />
      ) : null}
      {showAllOptions ? (
        <Modal
          animationType='slide'
          onRequestClose={() => setShowAllOptions(false)}
          visible={showAllOptions}
        >
          <SafeAreaView style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader
              onPress={() => setShowAllOptions(false)}
              title={t<string>('Poll Options')}
            />
            <PollAllOptions message={message} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

export const VoteButton = ({ onPress, option }: PollVoteButtonProps & { option: PollOption }) => {
  const { is_closed, ownVotesByOptionId } = usePollState();

  const {
    theme: {
      colors: { accent_dark_blue, disabled },
      poll: {
        message: {
          option: { voteButtonActive, voteButtonContainer, voteButtonInactive },
        },
      },
    },
  } = useTheme();

  return !is_closed ? (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.voteContainer,
        {
          backgroundColor: ownVotesByOptionId[option.id]
            ? voteButtonActive || accent_dark_blue
            : 'transparent',
          borderColor: ownVotesByOptionId[option.id]
            ? voteButtonActive || accent_dark_blue
            : voteButtonInactive || disabled,
        },
        voteButtonContainer,
      ]}
    >
      {ownVotesByOptionId[option.id] ? <Check height={15} pathFill='white' width={20} /> : null}
    </TouchableOpacity>
  ) : null;
};

export const ShowAllVotesButton = (props: PollButtonProps & { option: PollOption }) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { vote_counts_by_option } = usePollState();
  const [showAllVotes, setShowAllVotes] = useState(false);
  const { onPress, option } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAllVotes(true);
  }, [message, onPress, poll]);

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  return (
    <>
      {vote_counts_by_option && vote_counts_by_option?.[option.id] > 5 ? (
        <GenericPollButton onPress={onPressHandler} title={t<string>('Show All')} />
      ) : null}
      {showAllVotes ? (
        <Modal
          animationType='fade'
          onRequestClose={() => setShowAllVotes(false)}
          visible={showAllVotes}
        >
          <SafeAreaView style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader onPress={() => setShowAllVotes(false)} title={option.text} />
            <PollOptionFullResults message={message} option={option} poll={poll} />
          </SafeAreaView>
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  answerListAddCommentContainer: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  container: {
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 11,
  },
  text: { fontSize: 16 },
  voteContainer: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
});
