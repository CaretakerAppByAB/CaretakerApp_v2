/**
 * App.tsx  — root component
 *
 * Changes from previous version:
 *  - RootNavigator now shows an Auth stack (Login → Register) when logged out
 *  - Shows a loading spinner while Firebase restores a saved session
 */

import React from 'react';
import {StyleSheet, View, ActivityIndicator} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {AuthProvider, useAuth} from './src/context/AuthContext';
import AppNavigator   from './src/navigation/AppNavigator';
import LoginScreen    from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

const AuthStack = createNativeStackNavigator();

// Shown when the user is not logged in
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login"    component={LoginScreen}/>
      <AuthStack.Screen name="Register" component={RegisterScreen}/>
    </AuthStack.Navigator>
  );
}

// Decides which navigator to show based on auth state
function RootNavigator() {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B7EEE"/>
      </View>
    );
  }

  return user ? <AppNavigator/> : <AuthNavigator/>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator/>
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:    {flex: 1},
  loading: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF'},
});
