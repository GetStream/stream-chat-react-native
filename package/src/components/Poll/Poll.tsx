import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PollOption as PollOptionClass } from 'stream-chat';

import { PollButtons, PollOption, ShowAllOptionsButton } from './components';

import { usePollState } from './hooks/usePollState';

import {
  MessagesContextValue,
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../contexts';

import { primitives } from '../../theme';
import { defaultPollOptionCount } from '../../utils/constants';

export type PollProps = Pick<PollContextValue, 'poll' | 'message'> &
  Pick<MessagesContextValue, 'PollContent'>;

export type PollContentProps = {
  PollButtons?: React.ComponentType;
  PollHeader?: React.ComponentType;
};

export const PollHeader = () => {
  const styles = useStyles();
  const { t } = useTranslationContext();
  const { enforceUniqueVote, isClosed, maxVotesAllowed, name } = usePollState();

  const subtitle = useMemo(() => {
    if (isClosed) {
      return t('Poll has ended');
    }
    if (enforceUniqueVote) {
      return t('Select one');
    }
    if (maxVotesAllowed) {
      return t('Select up to {{count}}', { count: maxVotesAllowed });
    }
    return t('Select one or more');
  }, [isClosed, t, enforceUniqueVote, maxVotesAllowed]);

  const {
    theme: {
      poll: {
        message: { header },
      },
    },
  } = useTheme();

  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.headerTitle, header.title]}>{name}</Text>
      <Text style={[styles.headerSubtitle, header.subtitle]}>{subtitle}</Text>
    </View>
  );
};

export const PollContent = ({
  PollButtons: PollButtonsOverride,
  PollHeader: PollHeaderOverride,
}: PollContentProps) => {
  const { options } = usePollState();
  const styles = useStyles();

  const {
    theme: {
      poll: {
        message: { container, optionsWrapper },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      {PollHeaderOverride ? <PollHeaderOverride /> : <PollHeader />}
      <View style={[styles.optionsWrapper, optionsWrapper]}>
        {options
          ?.slice(0, defaultPollOptionCount)
          ?.map((option: PollOptionClass) => (
            <PollOption key={`message_poll_option_${option.id}`} option={option} />
          ))}
        <ShowAllOptionsButton />
      </View>
      {PollButtonsOverride ? <PollButtonsOverride /> : <PollButtons />}
    </View>
  );
};

export const Poll = ({ message, poll, PollContent: PollContentOverride }: PollProps) => (
  <PollContextProvider
    value={{
      message,
      poll,
    }}
  >
    {PollContentOverride ? <PollContentOverride /> : <PollContent />}
  </PollContextProvider>
);

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        width: 256, // TODO: Fix this
        padding: primitives.spacingMd,
        gap: primitives.spacingLg,
      },
      headerContainer: { gap: primitives.spacingXxs },
      headerSubtitle: {
        color: semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
      },
      headerTitle: {
        color: semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
      },
      optionsWrapper: {
        gap: primitives.spacingMd,
      },
    });
  }, [semantics]);
};
