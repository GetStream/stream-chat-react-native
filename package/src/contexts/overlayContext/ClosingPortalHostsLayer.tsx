import React, { useMemo } from 'react';
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
    <Animated.View
      pointerEvents='box-none'
      style={style}
      testID={`closing-portal-host-slot-${hostName}`}
    >
      <PortalHost name={hostName} style={StyleSheet.absoluteFillObject} />
    </Animated.View>
  );
};

type ClosingPortalHostsLayerProps = {
  closeCoverOpacity: SharedValue<number>;
};

export const ClosingPortalHostsLayer = ({ closeCoverOpacity }: ClosingPortalHostsLayerProps) => {
  const closingPortalLayoutStacks = useClosingPortalLayouts();
  const closingPortalHosts = useMemo(() => {
    const topHosts: Array<{
      hostName: string;
      layout: ClosingPortalLayoutEntry['layout'];
    }> = [];

    Object.entries(closingPortalLayoutStacks).forEach(([hostName, entries]) => {
      const topEntry = entries[entries.length - 1];
      if (topEntry) {
        topHosts.push({ hostName, layout: topEntry.layout });
      }
    });

    return topHosts;
  }, [closingPortalLayoutStacks]);

  return (
    <>
      {closingPortalHosts.map(({ hostName, layout }) => (
        <ClosingPortalHostSlot
          closeCoverOpacity={closeCoverOpacity}
          hostName={hostName}
          key={hostName}
          layout={layout}
        />
      ))}
    </>
  );
};
