/**
 * AlzApp — Root Component
 *
 * Provider order matters:
 *  1. GestureHandlerRootView  — required by react-native-gesture-handler (drawer swipe)
 *  2. SafeAreaProvider        — required by react-native-safe-area-context
 *  3. AuthProvider            — app-level auth state
 *  4. NavigationContainer     — React Navigation root
 */

import React from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {AuthProvider} from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = (): React.JSX.Element => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
});

export default App;
