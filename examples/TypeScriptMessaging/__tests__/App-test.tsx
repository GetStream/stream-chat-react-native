/**
 * @format
 */

import 'react-native';
import React from 'react';

import renderer from 'react-test-renderer';

import { it } from '@jest/globals';

import App from '../App';

// Note: import explicitly to use the types shipped with jest.

// Note: test renderer must be required after react-native.

it('renders correctly', () => {
  renderer.create(<App />);
});
