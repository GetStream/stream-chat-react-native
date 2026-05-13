import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useA11yLabel } from '../../../a11y/hooks/useA11yLabel';
import { useChannelDetailsContext } from '../../../contexts/channelDetailsContext/channelDetailsContext';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';
import { useIsDirectChat } from '../../ChannelList/hooks/useIsDirectChat';
import { useChannelDetailsActionItems } from '../hooks';

export const ChannelDetailsActionsSection = () => {
  const { channel } = useChannelDetailsContext();
  const {
    theme: {
      channelDetailsScreen: { sectionCard: sectionCardOverride },
      semantics,
    },
  } = useTheme();
  const { ChannelDetailsListItem } = useComponentsContext();
  const isDirect = useIsDirectChat(channel);
  const leaveHint = useA11yLabel(
    isDirect ? 'a11y/Removes you from this chat' : 'a11y/Removes you from this group',
  );
  const deleteHint = useA11yLabel(
    isDirect ? 'a11y/Deletes this chat permanently' : 'a11y/Deletes this group permanently',
  );
  const styles = useStyles();

  const items = useChannelDetailsActionItems();

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
        const accessibilityHint =
          item.id === 'leave' ? leaveHint : item.id === 'deleteChannel' ? deleteHint : undefined;

        return (
          <ChannelDetailsListItem
            accessibilityHint={accessibilityHint}
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
