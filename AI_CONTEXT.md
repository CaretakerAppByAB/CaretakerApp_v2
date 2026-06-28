# AlzApp — AI Context Brief

Paste this entire document into any AI assistant before asking for help with this codebase. It gives the AI everything it needs to understand the project and give you accurate answers.

---

## What this app is

AlzApp is a React Native iOS app for Alzheimer's caregivers. It is a skeleton/prototype with placeholder screens. The goal is to give caregivers a central place to track mood, access resources, journal, connect with a community forum, and message other caregivers.

The app is built for internal team development. It is not yet in production. All screens are placeholders — the real feature content will be built out over time.

---

## Critical environment constraints

This app runs on **Xcode 26 / iOS 26.5 SDK**. This is important because:

- `react-native-reanimated` and `react-native-worklets` **do not compile** on Xcode 26 due to a Hermes inspector namespace change (`RuntimeAdapter` moved to `inspector::RuntimeAdapter`). These packages must never be added.
- `@react-navigation/drawer` requires reanimated and is therefore also banned.
- The navigation uses `@react-navigation/bottom-tabs` with the tab bar hidden, combined with a custom slide-in drawer built using React Native's built-in `Animated` API.
- Do not suggest any solution that involves installing `react-native-reanimated`, `react-native-worklets`, or `@react-navigation/drawer`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.86.0 (no Expo) |
| Language | TypeScript |
| Navigation | @react-navigation/native v7, @react-navigation/native-stack v7, @react-navigation/bottom-tabs v7 |
| Storage | @react-native-async-storage/async-storage v2 |
| Gesture support | react-native-gesture-handler v2 |
| Safe area | react-native-safe-area-context v5 |
| Screens | react-native-screens (latest) |
| Animations | React Native built-in Animated API only |
| Platform | iOS only (iPhone simulator, iPhone 17 Pro) |
| Node | v26+ |
| Xcode | 26.x |
| iOS SDK | 26.5 |

**Never suggest installing:**
- react-native-reanimated
- react-native-worklets
- @react-navigation/drawer
- Any library that lists reanimated as a peer dependency

---

## Project structure

```
AlzApp/
  App.tsx                          ← root component, contains NavigationContainer
  index.js                         ← entry point, registers App component
  babel.config.js                  ← only contains @react-native/babel-preset, no reanimated plugin
  app.json                         ← app name config
  package.json
  ios/                             ← native iOS project, do not edit manually
  src/
    navigation/
      AppNavigator.tsx             ← ALL navigation lives here
    screens/
      HomeScreen.tsx
      MoodScreen.tsx
      ResourceLibraryScreen.tsx
      JournalScreen.tsx
      CommunityForumScreen.tsx     ← named CommunityForumScreen, not ForumScreen
      PrivateMessagesScreen.tsx    ← named PrivateMessagesScreen, not MessagesScreen
      ThankYouScreen.tsx
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
    context/
      AuthContext.tsx              ← auth context, consumed in App.tsx not AppNavigator
    theme/
      colors.ts                    ← lavender palette, primary color #8B7EEE
```

---

## App.tsx

App.tsx is the root component. It wraps everything in:
1. `GestureHandlerRootView` (required by react-native-gesture-handler)
2. `SafeAreaProvider` (required by react-native-safe-area-context)
3. `AuthProvider` (from AuthContext)
4. `NavigationContainer` (from @react-navigation/native)
5. `AppNavigator`

**Important:** `NavigationContainer` lives in `App.tsx` only. It must not appear anywhere else, especially not in `AppNavigator.tsx`. Having two `NavigationContainer` components causes an immediate crash with the error "Looks like you have nested a NavigationContainer inside another."

---

## AppNavigator.tsx — the most important file

This is the most complex and fragile file in the project. Here is exactly what it does and why.

### Why it is structured this way

The app originally used `@react-navigation/drawer` for a side panel menu. That package requires `react-native-reanimated` which breaks on Xcode 26. The solution was to:

1. Use `@react-navigation/bottom-tabs` as the routing engine (because it works without reanimated)
2. Hide the tab bar entirely by returning `null` from the `tabBar` prop
3. Build a custom sliding drawer using only React Native's built-in `Animated` API
4. Capture the navigation object from the tab bar props using a ref, so the custom drawer can call `navigate()`

### What it renders

- The Tab.Navigator handles routing between screens (hidden tab bar)
- A purple header on every screen with a ☰ hamburger button in the top left
- A custom slide-in drawer panel that appears when the hamburger is tapped
- A dark semi-transparent overlay behind the drawer that dismisses it on tap

### Key rules for editing AppNavigator.tsx

1. Do not add `<NavigationContainer>` — App.tsx already has one
2. Do not add `useContext(AuthContext)` — auth is handled in App.tsx
3. Screen import names must match exact filenames: `CommunityForumScreen` not `ForumScreen`, `PrivateMessagesScreen` not `MessagesScreen`
4. Do not import anything from react-native-reanimated
5. After editing this file, always restart Metro with `--reset-cache` or you will see stale code

### Complete current AppNavigator.tsx

```tsx
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  StyleSheet, TouchableWithoutFeedback, SafeAreaView,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MoodScreen from '../screens/MoodScreen';
import ResourceLibraryScreen from '../screens/ResourceLibraryScreen';
import JournalScreen from '../screens/JournalScreen';
import CommunityForumScreen from '../screens/CommunityForumScreen';
import PrivateMessagesScreen from '../screens/PrivateMessagesScreen';

const Tab = createBottomTabNavigator();
const DRAWER_WIDTH = 270;

const MENU_ITEMS = [
  { name: 'Home',      label: 'Home',            icon: '🏠' },
  { name: 'Mood',      label: 'Mood Tracker',     icon: '😊' },
  { name: 'Resources', label: 'Resource Library', icon: '📚' },
  { name: 'Journal',   label: 'Journal',          icon: '📓' },
  { name: 'Forum',     label: 'Community Forum',  icon: '💬' },
  { name: 'Messages',  label: 'Messages',         icon: '✉️' },
];

export default function AppNavigator() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const navRef = useRef<any>(null);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0.45, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 260, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const navigate = (screenName: string) => {
    navRef.current?.navigate(screenName);
    closeDrawer();
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => {
          navRef.current = props.navigation;
          return null;
        }}
        screenOptions={{
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer} style={styles.hamburger}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#8B7EEE' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        }}
      >
        <Tab.Screen name="Home"      component={HomeScreen} />
        <Tab.Screen name="Mood"      component={MoodScreen} />
        <Tab.Screen name="Resources" component={ResourceLibraryScreen} />
        <Tab.Screen name="Journal"   component={JournalScreen} />
        <Tab.Screen name="Forum"     component={CommunityForumScreen} />
        <Tab.Screen name="Messages"  component={PrivateMessagesScreen} />
      </Tab.Navigator>

      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: overlayOpacity }]}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>AlzApp</Text>
            <Text style={styles.drawerSubtitle}>Caregiver Support</Text>
          </View>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.name}
              style={styles.drawerItem}
              onPress={() => navigate(item.name)}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hamburger: { marginLeft: 16, padding: 4, justifyContent: 'center', gap: 5 },
  bar: { width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2 },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH,
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, zIndex: 999,
  },
  drawerHeader: { backgroundColor: '#8B7EEE', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  drawerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  drawerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EBEBEB',
  },
  itemIcon: { fontSize: 20, marginRight: 18 },
  itemLabel: { fontSize: 16, color: '#333', fontWeight: '500' },
});
```

---

## Design system

- **Primary color:** `#8B7EEE` (lavender purple)
- **Background:** `#F5F3FF` (light lavender tint)
- **All headers:** purple background (`#8B7EEE`) with white text
- **Font style:** System font, bold headers
- Screen backgrounds should use `#F5F3FF` to stay consistent

When adding new screens, follow this pattern:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyNewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen Title</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8B7EEE' },
});
```

Then add the import and a new `<Tab.Screen>` entry in `AppNavigator.tsx`, and add the screen to `MENU_ITEMS`.

---

## Auth

`AuthContext.tsx` provides an `AuthProvider` and `useAuth` hook. Currently the auth is a skeleton — it accepts any credentials. The auth state is consumed in `App.tsx` to decide what to render. Do not consume `AuthContext` inside `AppNavigator.tsx` — this caused a crash during development because the context was not yet initialized when the navigator mounted.

---

## Common errors and what they mean

| Error message | Cause | Fix |
|---|---|---|
| `unknown type name 'RuntimeAdapter'` | reanimated or worklets is installed | Remove those packages |
| `Nested NavigationContainer` | AppNavigator.tsx has its own NavigationContainer | Remove it from AppNavigator.tsx |
| `Cannot read property '$$typeof' of undefined` | useContext called with undefined context | Remove useContext from AppNavigator.tsx |
| `Unable to resolve module ../screens/ForumScreen` | Wrong filename in import | Use CommunityForumScreen and PrivateMessagesScreen |
| App shows old code after changes | Metro cache | Restart with `npx react-native start --reset-cache` |

---

## How to add a new screen

1. Create `src/screens/YourScreenName.tsx`
2. Add the import to `AppNavigator.tsx`
3. Add a `<Tab.Screen name="YourScreen" component={YourScreenName} />` inside `Tab.Navigator`
4. Add an entry to the `MENU_ITEMS` array in `AppNavigator.tsx`
5. Restart Metro with `--reset-cache`

---

## How to run

```bash
# Terminal 1
npx react-native start --reset-cache

# Terminal 2
npx react-native run-ios
```

---

## What the AI should never suggest

- Installing `react-native-reanimated`
- Installing `react-native-worklets`
- Installing `@react-navigation/drawer`
- Adding a second `<NavigationContainer>` anywhere
- Adding `react-native-reanimated/plugin` to babel.config.js
- Adding `import 'react-native-gesture-handler'` to index.js
- Using `useSharedValue`, `useAnimatedStyle`, or any other reanimated hooks
- Any library whose README says it requires reanimated as a peer dependency

