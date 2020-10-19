import { useContext } from 'react';

import { ThemeContext } from '../ThemeContext';

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  return {
    colors: theme.colors,
    theme,
  };
};
