import React from 'react';
import { ThemeProvider } from '../contexts/themeContext/ThemeContext';

const Wrapper: React.FC = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

export default Wrapper;
