import React from 'react';

import { StyleSheet } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '../../../../../contexts';
import { defaultTheme } from '../../../../../contexts/themeContext/utils/theme';
import type { RoleLabel } from '../../../hooks/members/useMemberRoles';
import { RoleItem, type RoleItemProps } from '../RoleItem';

const renderItem = (role: RoleLabel, props: Partial<RoleItemProps> = {}) =>
  render(
    <ThemeProvider theme={defaultTheme}>
      <RoleItem role={role} {...props} />
    </ThemeProvider>,
  );

const containerStyleOf = (label: string) =>
  StyleSheet.flatten(screen.getByText(label).parent?.parent?.props.style);

const textStyleOf = (label: string) => StyleSheet.flatten(screen.getByText(label).props.style);

const backgroundColorOf = (label: string) => containerStyleOf(label).backgroundColor;

describe('RoleItem', () => {
  it('renders the role label', () => {
    renderItem({ key: 'admin', label: 'Admin' });
    expect(screen.getByText('Admin')).toBeTruthy();
  });

  it('uses a distinct background color for owner vs other roles', () => {
    renderItem({ key: 'owner', label: 'Owner' });
    const ownerBg = backgroundColorOf('Owner');

    screen.unmount();

    renderItem({ key: 'admin', label: 'Admin' });
    const roleBg = backgroundColorOf('Admin');

    expect(ownerBg).toBeTruthy();
    expect(roleBg).toBeTruthy();
    expect(ownerBg).not.toBe(roleBg);
  });

  it('applies viewStyle to the container, taking precedence over the theme background', () => {
    renderItem(
      { key: 'admin', label: 'Admin' },
      { viewStyle: { backgroundColor: 'rgb(1, 2, 3)' } },
    );
    expect(backgroundColorOf('Admin')).toBe('rgb(1, 2, 3)');
  });

  it('applies textStyle to the label, taking precedence over the theme color', () => {
    renderItem({ key: 'admin', label: 'Admin' }, { textStyle: { color: 'rgb(4, 5, 6)' } });
    expect(textStyleOf('Admin').color).toBe('rgb(4, 5, 6)');
  });
});
