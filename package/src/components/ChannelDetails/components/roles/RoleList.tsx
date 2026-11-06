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
 * The role badges shown next to a member row, each rendered by `RoleItem`. Renders nothing without
 * roles.
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
