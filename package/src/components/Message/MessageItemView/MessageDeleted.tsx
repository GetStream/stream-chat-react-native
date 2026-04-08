import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { CircleBan } from '../../../icons/no-sign';
import { components, primitives } from '../../../theme';

type MessageDeletedComponentProps = {
  groupStyle: string;
  date?: string | Date;
};

type MessageDeletedPropsWithContext = Pick<MessageContextValue, 'alignment' | 'message'> &
  MessageDeletedComponentProps;

const MessageDeletedWithContext = (props: MessageDeletedPropsWithContext) => {
  const { alignment, date, groupStyle } = props;
  const { MessageFooter } = useComponentsContext();

  const {
    theme: {
      messageItemView: {
        deleted: { containerInner, deletedText, container },
      },
      semantics,
    },
  } = useTheme();
  const { t } = useTranslationContext();
  const styles = useStyles();

  return (
    <View
      style={[alignment === 'left' ? styles.leftAlignItems : styles.rightAlignItems, container]}
      testID='message-deleted'
    >
      <View
        style={[
          styles.containerInner,
          {
            borderBottomLeftRadius:
              groupStyle === 'left_bottom' || groupStyle === 'left_single'
                ? components.messageBubbleRadiusTail
                : components.messageBubbleRadiusGroupBottom,
            borderBottomRightRadius:
              groupStyle === 'right_bottom' || groupStyle === 'right_single'
                ? components.messageBubbleRadiusTail
                : components.messageBubbleRadiusGroupBottom,
          },
          containerInner,
        ]}
      >
        <CircleBan height={16} width={16} stroke={semantics.textSecondary} />
        <Text style={[styles.deletedText, deletedText]}>{t('Message deleted')}</Text>
      </View>
      <MessageFooter date={date} />
    </View>
  );
};

const areEqual = (
  prevProps: MessageDeletedPropsWithContext,
  nextProps: MessageDeletedPropsWithContext,
) => {
  const { alignment: prevAlignment, date: prevDate, message: prevMessage } = prevProps;
  const { alignment: nextAlignment, date: nextDate, message: nextMessage } = nextProps;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) {
    return false;
  }
  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) {
    return false;
  }

  const dateEqual = prevDate === nextDate;
  if (!dateEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageDeleted = React.memo(
  MessageDeletedWithContext,
  areEqual,
) as typeof MessageDeletedWithContext;

export type MessageDeletedProps = Partial<MessageDeletedPropsWithContext> & {
  groupStyle: string;
};

export const MessageDeleted = (props: MessageDeletedProps) => {
  const { alignment, message } = useMessageContext();

  return (
    <MemoizedMessageDeleted
      {...{
        alignment,
        message,
      }}
      {...props}
    />
  );
};

MessageDeleted.displayName = 'MessageDeleted{messageItemView{content}}';

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageItemView: {
        deleted: { containerInner, deletedText, container },
      },
    },
  } = useTheme();
  const { isMyMessage } = useMessageContext();

  return useMemo(() => {
    return StyleSheet.create({
      containerInner: {
        borderTopLeftRadius: components.messageBubbleRadiusGroupBottom,
        borderTopRightRadius: components.messageBubbleRadiusGroupBottom,
        paddingHorizontal: primitives.spacingSm,
        paddingVertical: primitives.spacingXs,
        backgroundColor: isMyMessage ? semantics.chatBgOutgoing : semantics.chatBgIncoming,
        flexDirection: 'row',
        alignItems: 'center',
        gap: primitives.spacingXxs,
        ...containerInner,
      },
      deletedText: {
        color: isMyMessage ? semantics.chatTextOutgoing : semantics.chatTextIncoming,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightRegular,
        lineHeight: primitives.typographyLineHeightNormal,
        ...deletedText,
      },
      leftAlignItems: {
        alignItems: 'flex-start',
        ...container,
      },
      rightAlignItems: {
        alignItems: 'flex-end',
        ...container,
      },
    });
  }, [isMyMessage, semantics, containerInner, deletedText, container]);
};
