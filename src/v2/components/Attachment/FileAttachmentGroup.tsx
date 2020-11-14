import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Attachment } from './Attachment';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});

export type FileAttachmentGroupPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'files'> & {
  /**
   * The unique id for the message with file attachments
   */
  messageId: string;
};

const FileAttachmentGroupWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { files, messageId } = props;

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      {files.map((file, index) => (
        <View
          key={`${messageId}-${index}`}
          style={{ paddingBottom: index !== files.length - 1 ? 4 : 0 }}
        >
          <Attachment<At, Ch, Co, Ev, Me, Re, Us> attachment={file} />
        </View>
      ))}
    </View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { files: prevFiles } = prevProps;
  const { files: nextFiles } = nextProps;

  const filesEqual = prevFiles.length === nextFiles.length;

  return filesEqual;
};

const MemoizedFileAttachmentGroup = React.memo(
  FileAttachmentGroupWithContext,
  areEqual,
) as typeof FileAttachmentGroupWithContext;

export type FileAttachmentGroupProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<
    FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'messageId'
  >
> &
  Pick<
    FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'messageId'
  >;

export const FileAttachmentGroup = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: FileAttachmentGroupProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { files: propFiles, messageId } = props;

  const { files: contextFiles } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const files = propFiles || contextFiles;

  if (!files.length) return null;

  return (
    <MemoizedFileAttachmentGroup
      {...{
        files,
        messageId,
      }}
    />
  );
};

FileAttachmentGroup.displayName =
  'FileAttachmentGroup{messageSimple{fileAttachmentGroup}}';
