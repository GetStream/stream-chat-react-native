import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { GenericPollButton, PollButtonProps } from './Button';
import { PollAnswersList } from './PollAnswersList';
import { PollInputDialog } from './PollInputDialog';
import { PollModal } from './PollModal';
import { PollModalHeader } from './PollModalHeader';
import { PollAllOptions } from './PollOption';
import { PollResults } from './PollResults';

import { useChatContext, usePollContext, useTheme, useTranslationContext } from '../../../contexts';
import { primitives } from '../../../theme';
import { defaultPollOptionCount } from '../../../utils/constants';
import {
  useAddCommentOpen,
  useAllCommentsOpen,
  useAllOptionsOpen,
  usePollUIStateContext,
  useSuggestOptionOpen,
  useViewResultsOpen,
} from '../contexts/PollUIStateContext';
import { useIsPollCreatedByCurrentUser } from '../hook/useIsPollCreatedByCurrentUser';
import { usePollState } from '../hooks/usePollState';

export const ViewResultsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { closeViewResults, openViewResults } = usePollUIStateContext();
  const showResults = useViewResultsOpen();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    openViewResults();
  }, [message, onPress, openViewResults, poll]);

  const styles = useStyles();

  return (
    <>
      <GenericPollButton
        label={t('View Results')}
        onPress={onPressHandler}
        style={styles.viewResultsButton}
        type='outline'
      />
      {showResults ? (
        <PollModal onRequestClose={closeViewResults} visible={showResults}>
          <PollModalHeader onPress={closeViewResults} title={t('Poll Results')} />
          <PollResults message={message} poll={poll} />
        </PollModal>
      ) : null}
    </>
  );
};

export const ShowAllOptionsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { closeAllOptions, openAllOptions } = usePollUIStateContext();
  const showAllOptions = useAllOptionsOpen();
  const { message, poll } = usePollContext();
  const { options } = usePollState();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    openAllOptions();
  }, [message, onPress, openAllOptions, poll]);

  return (
    <>
      {options && options.length > defaultPollOptionCount ? (
        <GenericPollButton
          onPress={onPressHandler}
          label={t('+{{count}} More Options', { count: options.length - defaultPollOptionCount })}
        />
      ) : null}
      {showAllOptions ? (
        <PollModal onRequestClose={closeAllOptions} visible={showAllOptions}>
          <PollModalHeader onPress={closeAllOptions} title={t('Poll Options')} />
          <PollAllOptions message={message} poll={poll} />
        </PollModal>
      ) : null}
    </>
  );
};

export const ShowAllCommentsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { answersCount } = usePollState();
  const { closeAllComments, openAllComments } = usePollUIStateContext();
  const showAnswers = useAllCommentsOpen();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    openAllComments();
  }, [message, onPress, openAllComments, poll]);

  return (
    <>
      {answersCount && answersCount > 0 ? (
        <GenericPollButton
          onPress={onPressHandler}
          label={t('View {{count}} comments', { count: answersCount })}
        />
      ) : null}
      {showAnswers ? (
        <PollModal onRequestClose={closeAllComments} visible={showAnswers}>
          <PollModalHeader onPress={closeAllComments} title={t('Poll Comments')} />
          <PollAnswersList message={message} poll={poll} />
        </PollModal>
      ) : null}
    </>
  );
};

export const SuggestOptionButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addOption, allowUserSuggestedOptions, isClosed } = usePollState();
  const { closeSuggestOption, openSuggestOption } = usePollUIStateContext();
  const showAddOptionDialog = useSuggestOptionOpen();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    openSuggestOption();
  }, [message, onPress, openSuggestOption, poll]);

  return (
    <>
      {!isClosed && allowUserSuggestedOptions ? (
        <GenericPollButton onPress={onPressHandler} label={t('Suggest an option')} />
      ) : null}
      {showAddOptionDialog ? (
        <PollInputDialog
          closeDialog={closeSuggestOption}
          onSubmit={addOption}
          placeholder={t('Enter a new option')}
          title={t('Suggest an option')}
          visible={showAddOptionDialog}
        />
      ) : null}
    </>
  );
};

export const AddCommentButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addComment, allowAnswers, isClosed, ownAnswer } = usePollState();
  const { closeAddComment, openAddComment } = usePollUIStateContext();
  const showAddCommentDialog = useAddCommentOpen();
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    openAddComment();
  }, [message, onPress, openAddComment, poll]);

  return (
    <>
      {!isClosed && allowAnswers ? (
        <GenericPollButton onPress={onPressHandler} label={t('Add a comment')} />
      ) : null}
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={closeAddComment}
          initialValue={ownAnswer?.answer_text ?? ''}
          onSubmit={addComment}
          placeholder={t('Your comment')}
          title={t('Add a comment')}
          visible={showAddCommentDialog}
        />
      ) : null}
    </>
  );
};

export const EndVoteButton = () => {
  const { t } = useTranslationContext();
  const { createdBy, endVote, isClosed } = usePollState();
  const { client } = useChatContext();
  const styles = useStyles();

  return !isClosed && createdBy?.id === client.userID ? (
    <GenericPollButton
      label={t('End Vote')}
      onPress={endVote}
      style={styles.endVoteButton}
      type='outline'
    />
  ) : null;
};

export const PollButtons = () => {
  const styles = useStyles();
  return (
    <View style={styles.buttonsContainer}>
      <ViewResultsButton />
      <EndVoteButton />
      <SuggestOptionButton />
      <AddCommentButton />
      <ShowAllCommentsButton />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const isPollCreatedByClient = useIsPollCreatedByCurrentUser();
  return useMemo(() => {
    return StyleSheet.create({
      buttonsContainer: { gap: primitives.spacingXs },
      endVoteButton: {
        borderColor: isPollCreatedByClient
          ? semantics.chatBorderOnChatOutgoing
          : semantics.chatBorderOnChatIncoming,
      },
      viewResultsButton: {
        borderColor: isPollCreatedByClient
          ? semantics.chatBorderOnChatOutgoing
          : semantics.chatBorderOnChatIncoming,
      },
    });
  }, [semantics, isPollCreatedByClient]);
};
