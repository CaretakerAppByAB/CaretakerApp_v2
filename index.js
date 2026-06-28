/**
 * IMPORTANT: 'react-native-gesture-handler' MUST be the very first import.
 * This is required for the drawer navigator's swipe gesture to work on iOS.
 */
import 'react-native-gesture-handler';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
