import React from 'react';
import { I18nManager, StyleSheet, Text, ViewProps } from 'react-native';

const styles = StyleSheet.create({
  defaultStyle: { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
});

export type WritingDirectionAwareTextProps = ViewProps;

export const WritingDirectionAwareText: React.FC<WritingDirectionAwareTextProps> = (props) => {
  const { children, style, ...rest } = props;
  return (
    <Text {...rest} style={[style, styles.defaultStyle]}>
      {children}
    </Text>
  );
};
