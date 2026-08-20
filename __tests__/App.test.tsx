/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import {getFirstName} from '../src/screens/HomeScreen';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('gets the user first name from a full name', () => {
  expect(getFirstName('Mr. John Doe')).toBe('John');
  expect(getFirstName('Alice Smith')).toBe('Alice');
  expect(getFirstName('   ')).toBe('Friend');
});
