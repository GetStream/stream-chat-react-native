import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Checkmark } from '../../icons/checkmark-1';
import { primitives } from '../../theme';

export type SelectionCircleProps = {
  selected: boolean;
};

/**
 * @experimental This component is experimental and is subject to change.
 */
export const SelectionCircle = React.memo(({ selected }: SelectionCircleProps) => {
  const {
    theme: {
      selectionCircle: { circle, circleSelected },
      semantics,
    },
  } = useTheme();

  if (selected) {
    return (
      <View
        style={[
          styles.circle,
          { backgroundColor: semantics.accentPrimary, borderColor: semantics.accentPrimary },
          circleSelected,
        ]}
      >
        <Checkmark height={14} pathFill={semantics.textOnAccent} width={14} />
      </View>
    );
  }

  return <View style={[styles.circle, { borderColor: semantics.borderCoreDefault }, circle]} />;
});

SelectionCircle.displayName = 'SelectionCircle{selectionCircle}';

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    borderRadius: primitives.radiusMax,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
