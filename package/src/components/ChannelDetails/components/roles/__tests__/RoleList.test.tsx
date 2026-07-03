import React from 'react';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../../contexts';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import type { RoleLabel } from '../../../hooks/members/useMemberRoles';
import { RoleList } from '../RoleList';

const renderList = (roles: RoleLabel[]) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <RoleList roles={roles} />
    </ThemeProvider>,
  );

describe('RoleList', () => {
  it('renders a badge for each role', () => {
    renderList([
      { key: 'owner', label: 'Owner' },
      { key: 'admin', label: 'Admin' },
    ]);
    expect(screen.getByText('Owner')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('renders nothing when there are no roles', () => {
    const { toJSON } = renderList([]);
    expect(toJSON()).toBeNull();
  });
});
