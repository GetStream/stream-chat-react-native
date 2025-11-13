import React, { useCallback, useState } from 'react';
import { Modal } from 'react-native';

import { GenericPollButton, PollButtonProps } from './Button';
import { PollAnswersList } from './PollAnswersList';
import { PollInputDialog } from './PollInputDialog';
import { PollModalHeader } from './PollModalHeader';
import { PollAllOptions } from './PollOption';
import { PollResults } from './PollResults';

import { useChatContext, usePollContext, useTheme, useTranslationContext } from '../../../contexts';
import { SafeAreaViewWrapper } from '../../UIComponents/SafeAreaViewWrapper';
import { usePollState } from '../hooks/usePollState';

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

  const onRequestClose = useCallback(() => {
    setShowResults(false);
  }, []);

  return (
    <>
      <GenericPollButton onPress={onPressHandler} title={t('View Results')} />
      {showResults ? (
        <Modal animationType='slide' onRequestClose={onRequestClose} visible={showResults}>
          <SafeAreaViewWrapper style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader onPress={onRequestClose} title={t('Poll Results')} />
            <PollResults message={message} poll={poll} />
          </SafeAreaViewWrapper>
        </Modal>
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

  const onRequestClose = useCallback(() => {
    setShowAllOptions(false);
  }, []);

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
          title={t('See all {{count}} options', { count: options.length })}
        />
      ) : null}
      {showAllOptions ? (
        <Modal animationType='slide' onRequestClose={onRequestClose} visible={showAllOptions}>
          <SafeAreaViewWrapper style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader onPress={onRequestClose} title={t('Poll Options')} />
            <PollAllOptions message={message} poll={poll} />
          </SafeAreaViewWrapper>
        </Modal>
      ) : null}
    </>
  );
};

export const ShowAllCommentsButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { answersCount } = usePollState();
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

  const onRequestClose = useCallback(() => {
    setShowAnswers(false);
  }, []);

  return (
    <>
      {answersCount && answersCount > 0 ? (
        <GenericPollButton
          onPress={onPressHandler}
          title={t('View {{count}} comments', { count: answersCount })}
        />
      ) : null}
      {showAnswers ? (
        <Modal animationType='slide' onRequestClose={onRequestClose} visible={showAnswers}>
          <SafeAreaViewWrapper style={{ backgroundColor: white, flex: 1 }}>
            <PollModalHeader onPress={onRequestClose} title={t('Poll Comments')} />
            <PollAnswersList message={message} poll={poll} />
          </SafeAreaViewWrapper>
        </Modal>
      ) : null}
    </>
  );
};

export const SuggestOptionButton = (props: PollButtonProps) => {
  const { t } = useTranslationContext();
  const { message, poll } = usePollContext();
  const { addOption, allowUserSuggestedOptions, isClosed } = usePollState();
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddOptionDialog(true);
  }, [message, onPress, poll]);

  const onRequestClose = useCallback(() => {
    setShowAddOptionDialog(false);
  }, []);

  return (
    <>
      {!isClosed && allowUserSuggestedOptions ? (
        <GenericPollButton onPress={onPressHandler} title={t('Suggest an option')} />
      ) : null}
      {showAddOptionDialog ? (
        <PollInputDialog
          closeDialog={onRequestClose}
          onSubmit={addOption}
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
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  const { onPress } = props;

  const onPressHandler = useCallback(() => {
    if (onPress) {
      onPress({ message, poll });
      return;
    }

    setShowAddCommentDialog(true);
  }, [message, onPress, poll]);

  const onRequestClose = useCallback(() => {
    setShowAddCommentDialog(false);
  }, []);

  return (
    <>
      {!isClosed && allowAnswers ? (
        <GenericPollButton onPress={onPressHandler} title={t('Add a comment')} />
      ) : null}
      {showAddCommentDialog ? (
        <PollInputDialog
          closeDialog={onRequestClose}
          initialValue={ownAnswer?.answer_text ?? ''}
          onSubmit={addComment}
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

  return !isClosed && createdBy?.id === client.userID ? (
    <GenericPollButton onPress={endVote} title={t('End Vote')} />
  ) : null;
};

export const PollButtons = () => (
  <>
    <ShowAllOptionsButton />
    <ShowAllCommentsButton />
    <SuggestOptionButton />
    <AddCommentButton />
    <ViewResultsButton />
    <EndVoteButton />
  </>
);
