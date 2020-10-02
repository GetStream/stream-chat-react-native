import React from 'react';
import { ThemeProvider } from '../contexts/themeContext/ThemeContext';

const Wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

export default Wrapper;
