import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { PortalHost } from 'react-native-teleport';

import { ClosingPortalLayoutEntry, useClosingPortalLayouts } from '../../state-store';

type ClosingPortalHostSlotProps = {
  closeCoverOpacity: SharedValue<number>;
  hostName: string;
  layout: ClosingPortalLayoutEntry['layout'];
};

const ClosingPortalHostSlot = ({
  closeCoverOpacity,
  hostName,
  layout,
}: ClosingPortalHostSlotProps) => {
  const style = useAnimatedStyle(() => {
    const value = layout.value;
    if (!value) return { opacity: closeCoverOpacity.value };

    return {
      height: value.h,
      left: value.x,
      opacity: closeCoverOpacity.value,
      top: value.y,
      width: value.w,
      position: 'absolute',
    };
  });

  return (
    <Animated.View pointerEvents='box-none' style={style}>
      <PortalHost name={hostName} style={StyleSheet.absoluteFillObject} />
    </Animated.View>
  );
};

type ClosingPortalHostsLayerProps = {
  closeCoverOpacity: SharedValue<number>;
};

export const ClosingPortalHostsLayer = ({ closeCoverOpacity }: ClosingPortalHostsLayerProps) => {
  const closingPortalLayouts = useClosingPortalLayouts();

  return (
    <>
      {Object.entries(closingPortalLayouts).map(([hostName, entry]) => (
        <ClosingPortalHostSlot
          closeCoverOpacity={closeCoverOpacity}
          hostName={hostName}
          key={hostName}
          layout={entry.layout}
        />
      ))}
    </>
  );
};
