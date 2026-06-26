import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';

export type FileAttachmentListSectionHeaderProps = {
  /** The already-formatted section title (e.g. "March 2026"). */
  title: string;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const FileAttachmentListSectionHeader = ({
  title,
}: FileAttachmentListSectionHeaderProps) => {
  const {
    theme: {
      channelDetails: { fileAttachmentList },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, fileAttachmentList.sectionHeader]}>
      <Text style={[styles.text, fileAttachmentList.sectionHeaderText]}>{title}</Text>
    </View>
  );
};

FileAttachmentListSectionHeader.displayName = 'FileAttachmentListSectionHeader{fileAttachmentList}';

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: semantics.backgroundCoreSurfaceSubtle,
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingXs,
        },
        text: {
          color: semantics.chatTextSystem,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [semantics],
  );
};
