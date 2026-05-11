import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { GetChannelActionItems, useChannelActionItems } from '../../../hooks/useChannelActionItems';
import { primitives } from '../../../theme';

export const ChannelDetailsActionsSection = () => {
  const { channel, onAfterDeleteChat, onAfterLeaveGroup } = useChannelDetailsContext();
  const {
    theme: {
      channelDetailsScreen: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const { ChannelDetailsListItem } = useComponentsContext();
  const styles = useStyles();

  const getActionItemsForDetailsScreen = useCallback<GetChannelActionItems>(
    ({ defaultItems }) =>
      defaultItems.map((item) => {
        if (item.id === 'leave') {
          return {
            ...item,
            action: async () => {
              await item.action();
              onAfterLeaveGroup?.(channel);
            },
          };
        }
        if (item.id === 'deleteChannel') {
          return {
            ...item,
            action: async () => {
              await item.action();
              onAfterDeleteChat?.(channel);
            },
          };
        }
        return item;
      }),
    [channel, onAfterDeleteChat, onAfterLeaveGroup],
  );

  const items = useChannelActionItems({
    channel,
    getChannelActionItems: getActionItemsForDetailsScreen,
  });

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: semantics.backgroundCoreSurfaceCard },
        sectionCardOverride,
      ]}
    >
      {items.map((item) => {
        const testID = `channel-details-action-${item.id}`;

        return (
          <ChannelDetailsListItem
            destructive={item.type === 'destructive'}
            Icon={item.Icon}
            key={item.id}
            label={item.label}
            onPress={() => item.action()}
            testID={testID}
          />
        );
      })}
    </View>
  );
};

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        sectionCard: {
          borderRadius: primitives.radiusLg,
          overflow: 'hidden',
          paddingVertical: primitives.spacingXs,
        },
      }),
    [],
  );
};
