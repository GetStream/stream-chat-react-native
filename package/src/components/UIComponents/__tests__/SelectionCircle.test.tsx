import React from 'react';
import { View } from 'react-native';

import { render } from '@testing-library/react-native';

import { ThemeProvider } from '../../../contexts/themeContext/ThemeContext';
import { defaultTheme } from '../../../contexts/themeContext/utils/theme';
import { Checkmark } from '../../../icons/checkmark-1';
import { SelectionCircle } from '../SelectionCircle';

const renderWithTheme = (
  ui: React.ReactElement,
  style?: Parameters<typeof ThemeProvider>[0]['style'],
) =>
  render(
    <ThemeProvider style={style} theme={defaultTheme}>
      {ui}
    </ThemeProvider>,
  );

describe('SelectionCircle', () => {
  it('renders the Checkmark child when selected', () => {
    const { UNSAFE_queryAllByType } = renderWithTheme(<SelectionCircle selected />);

    expect(UNSAFE_queryAllByType(Checkmark)).toHaveLength(1);
  });

  it('renders an empty circle when not selected', () => {
    const { UNSAFE_queryAllByType } = renderWithTheme(<SelectionCircle selected={false} />);

    expect(UNSAFE_queryAllByType(Checkmark)).toHaveLength(0);
  });

  it('applies theme.selectionCircle.circle override when not selected', () => {
    const { UNSAFE_getByType } = renderWithTheme(<SelectionCircle selected={false} />, {
      selectionCircle: { circle: { borderColor: 'red' } },
    });

    const view = UNSAFE_getByType(View);
    expect(JSON.stringify(view.props.style)).toContain('"borderColor":"red"');
  });

  it('applies theme.selectionCircle.circleSelected override when selected', () => {
    const { UNSAFE_getAllByType } = renderWithTheme(<SelectionCircle selected />, {
      selectionCircle: { circleSelected: { borderColor: 'pink' } },
    });

    const [view] = UNSAFE_getAllByType(View);
    expect(JSON.stringify(view.props.style)).toContain('"borderColor":"pink"');
  });
});
