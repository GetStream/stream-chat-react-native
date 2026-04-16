import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type FileAttachmentGroupPropsWithContext = Pick<MessageContextValue, 'files' | 'message'> & {
  styles?: Partial<{
    attachmentContainer: StyleProp<ViewStyle>;
    container: StyleProp<ViewStyle>;
  }>;
};

const FileAttachmentGroupWithContext = (props: FileAttachmentGroupPropsWithContext) => {
  const { files, message, styles: stylesProp = {} } = props;
  const { Attachment } = useComponentsContext();

  const {
    theme: {
      messageItemView: {
        fileAttachmentGroup: { attachmentContainer, container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, {}, container, stylesProp.container]}>
      {files.map((file, index) => (
        <View
          key={`file-by-attachment-group-${message.id}-${index}`}
          style={[styles.item, stylesProp.attachmentContainer, attachmentContainer]}
        >
          <Attachment attachment={file} />
        </View>
      ))}
    </View>
  );
};

const areEqual = (
  prevProps: FileAttachmentGroupPropsWithContext,
  nextProps: FileAttachmentGroupPropsWithContext,
) => {
  const { files: prevFiles, message: prevMessage } = prevProps;
  const { files: nextFiles, message: nextMessage } = nextProps;

  const messageEqual = prevMessage?.id === nextMessage?.id;
  if (!messageEqual) {
    return false;
  }

  return prevFiles.length === nextFiles.length;
};

const MemoizedFileAttachmentGroup = React.memo(
  FileAttachmentGroupWithContext,
  areEqual,
) as typeof FileAttachmentGroupWithContext;

export type FileAttachmentGroupProps = Partial<FileAttachmentGroupPropsWithContext>;

export const FileAttachmentGroup = (props: FileAttachmentGroupProps) => {
  const { files: propFiles } = props;

  const { files: contextFiles, message } = useMessageContext();

  const files = propFiles || contextFiles;

  if (!files.length) {
    return null;
  }

  return (
    <MemoizedFileAttachmentGroup
      {...{
        files,
        message,
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: primitives.spacingXs,
  },
  item: {
    borderRadius: primitives.radiusLg,
    overflow: 'hidden',
  },
});

FileAttachmentGroup.displayName = 'FileAttachmentGroup{messageItemView{fileAttachmentGroup}}';
