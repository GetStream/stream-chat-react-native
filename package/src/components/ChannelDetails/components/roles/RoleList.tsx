import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useComponentsContext } from '../../../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import type { RoleLabel } from '../../hooks/members/useMemberRoles';

export type RoleListProps = {
  roles: RoleLabel[];
};

/**
 * Renders the horizontal list of role badges shown next to a member row. Each badge is
 * rendered by the overridable `RoleItem` component. Returns `null` when there are no roles.
 *
 * @experimental This component is experimental and is subject to change.
 */
export const RoleList = ({ roles }: RoleListProps) => {
  const { RoleItem } = useComponentsContext();
  const {
    theme: {
      channelDetails: {
        roleList: { container: containerOverride },
      },
    },
  } = useTheme();
  const styles = useStyles();

  if (!roles.length) return null;

  return (
    <View style={[styles.container, containerOverride]}>
      {roles.map((role) => (
        <RoleItem key={role.key} role={role} />
      ))}
    </View>
  );
};

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
          gap: primitives.spacingXxs,
        },
      }),
    [],
  );
