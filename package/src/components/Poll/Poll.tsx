import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PollOption as PollOptionClass } from 'stream-chat';

import { PollOption, ShowAllOptionsButton } from './components';
import { PollUIStateProvider } from './contexts/PollUIStateContext';

import { usePollAccessibilityActions } from './hooks/usePollAccessibilityActions';
import { usePollAccessibilityLabel } from './hooks/usePollAccessibilityLabel';
import { usePollState } from './hooks/usePollState';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import {
  PollContextProvider,
  PollContextValue,
  useTheme,
  useTranslationContext,
} from '../../contexts';
import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
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

export const PollContent = () => {
  const { options } = usePollState();
  const styles = useStyles();
  const { PollButtons: PollButtonsComponent, PollHeader: PollHeaderComponent } =
    useComponentsContext();
  const { enabled: a11yEnabled } = useAccessibilityContext();
  const accessibilityHint = useA11yLabel('a11y/Double tap and hold to activate contextual menu');
  const accessibilityLabel = usePollAccessibilityLabel();
  const { accessibilityActions, onAccessibilityAction } = usePollAccessibilityActions();

  const {
    theme: {
      poll: {
        message: { container, optionsWrapper },
      },
    },
  } = useTheme();

  // NOTE: Android custom accessibilityActions are broken in RN < 0.83.2 —
  // see facebook/react-native#47268, fixed by PR #52724. On affected versions
  // the actions menu surfaces only a subset of the list and dispatch
  // announces "Action not supported". iOS works correctly on all versions.
  // Once the SDK's minimum RN reaches 0.83.2, wrap the descendants below in
  // <View importantForAccessibility='no-hide-descendants'> so Android
  // TalkBack groups them under the composite rather than exposing each
  // interactive child as a separate focus stop.
  return (
    <View
      accessibilityActions={accessibilityActions}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={a11yEnabled ? 'button' : undefined}
      accessible={a11yEnabled || undefined}
      onAccessibilityAction={onAccessibilityAction}
      style={[styles.container, container]}
    >
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
        textAlign: 'left',
      },
      headerTitle: {
        color: semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        textAlign: 'left',
      },
      optionsWrapper: {
        gap: primitives.spacingMd,
      },
    });
  }, [semantics]);
};
