import 'react-native-gesture-handler';
import { AppRegistry, LogBox } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import { reportE2ECoverage } from './src/e2eCoverage';

// Debug builds only: LogBox's warning toast sits over the composer and swallows the e2e suite's taps.
LogBox.ignoreAllLogs();

reportE2ECoverage();

AppRegistry.registerComponent(appName, () => App);
