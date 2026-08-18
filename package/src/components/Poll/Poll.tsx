import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PollOptionResponseData as PollOptionClass } from 'stream-chat';

import { PollOption, ShowAllOptionsButton } from './components';
import { PollUIStateProvider } from './contexts/PollUIStateContext';

import { useIsPollCreatedByCurrentUser } from './hook/useIsPollCreatedByCurrentUser';
import { usePollState } from './hooks/usePollState';

import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../contexts';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';

import { primitives } from '../../theme';
import { defaultPollOptionCount } from '../../utils/constants';

export type PollProps = Pick<PollContextValue, 'poll' | 'message'>;

export type PollContentProps = Record<string, never>;

export const PollHeader = () => {
  const styles = useStyles();
  const { t } = useTranslationContext();
  const { enforceUniqueVote, isClosed, maxVotesAllowed, name } = usePollState();

  const subtitle = useMemo(() => {
    if (isClosed) {
      return t('poll.subtitle.ended.text', 'Poll has ended');
    }
    if (enforceUniqueVote) {
      return t('poll.subtitle.selectOne.text', 'Select one');
    }
    if (maxVotesAllowed) {
      return t('poll.subtitle.selectUpTo.text', {
        count: maxVotesAllowed,
        defaultValue_one: 'Select up to {{count}}',
        defaultValue_other: 'Select up to {{count}}',
      });
    }
    return t('poll.subtitle.selectAny.text', 'Select one or more');
  }, [isClosed, t, enforceUniqueVote, maxVotesAllowed]);

  const {
    theme: {
      poll: {
        message: { header },
      },
    },
  } = useTheme();

  return (
    <View accessible accessibilityRole='text' style={styles.headerContainer}>
      <Text style={[styles.headerTitle, header.title]}>{name}</Text>
      <Text style={[styles.headerSubtitle, header.subtitle]}>{subtitle}</Text>
    </View>
  );
};

export const PollContent = () => {
  const { options } = usePollState();
  const styles = useStyles();
  const { PollButtons: PollButtonsComponent, PollHeader: PollHeaderComponent } =
    useComponentsContext();

  const {
    theme: {
      poll: {
        message: { container, optionsWrapper },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <PollHeaderComponent />
      <View style={[styles.optionsWrapper, optionsWrapper]}>
        {options?.slice(0, defaultPollOptionCount)?.map((option: PollOptionClass) => (
          <PollOption key={`message_poll_option_${option.id}`} option={option} />
        ))}
        <ShowAllOptionsButton />
      </View>
      <PollButtonsComponent />
    </View>
  );
};

export const Poll = ({ message, poll }: PollProps) => {
  const { PollContent: PollContentOverride } = useComponentsContext();
  return (
    <PollContextProvider
      value={{
        message,
        poll,
      }}
    >
      <PollUIStateProvider>
        {PollContentOverride ? <PollContentOverride /> : <PollContent />}
      </PollUIStateProvider>
    </PollContextProvider>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  const isPollCreatedByClient = useIsPollCreatedByCurrentUser();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        width: 256, // TODO: Fix this
        padding: primitives.spacingMd,
        gap: primitives.spacingLg,
      },
      headerContainer: { gap: primitives.spacingXxs },
      headerSubtitle: {
        color: isPollCreatedByClient ? semantics.chatTextOutgoing : semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeSm,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightTight,
        textAlign: 'left',
      },
      headerTitle: {
        color: isPollCreatedByClient ? semantics.chatTextOutgoing : semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'left',
      },
      optionsWrapper: {
        gap: primitives.spacingMd,
      },
    });
  }, [isPollCreatedByClient, semantics]);
};
