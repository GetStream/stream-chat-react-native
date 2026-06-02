import React, { ReactNode, useMemo } from 'react';
import { ColorValue, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { primitives } from '../../../theme';

export type MentionTitleTextProps = {
  children: ReactNode;
  color: ColorValue;
  style?: StyleProp<TextStyle>;
  testID?: string;
};

/**
 * Title-text styling shared by the non-user mention rows (broadcast / role /
 * group). User rows have their own title flavor because they swap in tokenized
 * substring highlighting.
 */
export const MentionTitleText = ({ children, color, style, testID }: MentionTitleTextProps) => {
  const styles = useStyles();
  return (
    <Text style={[styles.title, { color }, style]} testID={testID}>
      {children}
    </Text>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        title: {
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [],
  );
