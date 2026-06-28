# AlzApp — Developer Setup Guide
### Tested & Working on: Xcode 26.x · iOS 26.5 SDK · Node v26+ · macOS

---

## ⚠️ Critical Notes Before You Start

These instructions were hard-won through extensive debugging. **Do not skip any step or substitute any package.** The standard React Native navigation setup (with `react-native-reanimated` and `@react-navigation/drawer`) **does not compile** on Xcode 26 / iOS 26.5 due to a Hermes `RuntimeAdapter` namespace change. This setup works around that entirely.

**What we removed vs. what you might expect:**
| Removed (breaks Xcode 26) | Replaced with |
|---|---|
| `react-native-reanimated` | nothing — not needed |
| `react-native-worklets` | nothing — not needed |
| `@react-navigation/drawer` | custom slide-in drawer using React Native `Animated` |

---

## Prerequisites

- macOS with Xcode 26.x installed and opened at least once
- Node.js v18 or higher (`node -v` to check)
- CocoaPods (`pod --version` to check; install with `sudo gem install cocoapods` if missing)
- An iPhone simulator (iPhone 17 Pro or any iOS 26 simulator)

---

## Step 1 — Unzip and Enter the Project

```bash
cd ~/Projects   # or wherever you unzipped
cd AlzApp
```

---

## Step 2 — Install Node Packages

**Run this exact command — the package list matters:**

```bash
npm install --legacy-peer-deps \
  "@react-navigation/native@^7" \
  "@react-navigation/native-stack@^7" \
  "@react-navigation/bottom-tabs@^7" \
  "react-native-screens@latest" \
  "react-native-safe-area-context@^5" \
  "react-native-gesture-handler@^2" \
  "@react-native-async-storage/async-storage@^2"
```

**Do NOT install:**
- `react-native-reanimated` ← breaks Xcode 26
- `react-native-worklets` ← breaks Xcode 26
- `@react-navigation/drawer` ← requires reanimated, breaks Xcode 26

---

## Step 3 — iOS Pod Install

```bash
cd ios
pod repo update
pod install
cd ..
```

This takes 2–5 minutes. You should see "Pod installation complete!" with ~80 dependencies.

---

## Step 4 — Verify Key Source Files

Make sure these files match exactly what is shown below.

---

### `babel.config.js` (project root)

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

Do NOT add `react-native-reanimated/plugin` here. It will cause build errors.

---

### `index.js` (project root)

```js
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

Do NOT add `import 'react-native-gesture-handler'` as the first line.

---

### `src/navigation/AppNavigator.tsx`

This file implements a sliding hamburger drawer using only React Native's built-in Animated — no extra packages needed. The zip file already contains this file. If you ever need to restore it, here is the complete contents:

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
  { name: 'Home',      label: 'Home',             icon: '🏠' },
  { name: 'Mood',      label: 'Mood Tracker',      icon: '😊' },
  { name: 'Resources', label: 'Resource Library',  icon: '📚' },
  { name: 'Journal',   label: 'Journal',           icon: '📓' },
  { name: 'Forum',     label: 'Community Forum',   icon: '💬' },
  { name: 'Messages',  label: 'Messages',          icon: '✉️' },
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
  hamburger: {
    marginLeft: 16,
    padding: 4,
    justifyContent: 'center',
    gap: 5,
  },
  bar: {
    width: 22,
    height: 2.5,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginVertical: 2,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  drawerHeader: {
    backgroundColor: '#8B7EEE',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  drawerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  drawerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EBEBEB',
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 18,
  },
  itemLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
```

Three critical rules for this file:
1. No NavigationContainer wrapper — App.tsx already provides it. Two containers = crash.
2. No useContext(AuthContext) — auth is handled at the App.tsx level.
3. Screen import names must match exact filenames on disk (see below).

---

### Screen filenames — exact names required

```
src/screens/
  auth/
    LoginScreen.tsx
    RegisterScreen.tsx
  CommunityForumScreen.tsx      (NOT ForumScreen.tsx)
  HomeScreen.tsx
  JournalScreen.tsx
  MoodScreen.tsx
  PrivateMessagesScreen.tsx     (NOT MessagesScreen.tsx)
  ResourceLibraryScreen.tsx
  ThankYouScreen.tsx
```

---

## Step 5 — Run the App

Open two terminals:

**Terminal 1 — Start Metro:**
```bash
cd ~/Projects/AlzApp
npx react-native start --reset-cache
```

Wait until you see: `Dev server ready. Press Ctrl+C to exit.`

**Terminal 2 — Build and launch:**
```bash
cd ~/Projects/AlzApp
npx react-native run-ios
```

First build takes 3–8 minutes. You should see the app open with a purple header and a hamburger menu in the top-left corner.

---

## After Setup — What You Will See

- Every screen has a purple header with a hamburger icon (three bars) in the top-left
- Tapping the hamburger slides open a panel from the left with all 6 screens listed
- Tapping outside the panel or selecting a screen closes it smoothly
- No bottom tab bar is visible — navigation is entirely through the side panel

---

## Troubleshooting

### Build fails with `RuntimeAdapter` error
You have `react-native-reanimated` or `react-native-worklets` installed. Remove them:
```bash
npm uninstall react-native-reanimated react-native-worklets --legacy-peer-deps
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

### "Nested NavigationContainer" crash
Your AppNavigator.tsx has a `<NavigationContainer>` in it. Remove it — only App.tsx should have one.

### "Cannot read property '$$typeof' of undefined" crash
useContext is being called with an undefined context. Remove any `useContext(AuthContext)` from AppNavigator.tsx.

### "Unable to resolve module" error
Screen filename does not match the import. Run `ls ~/Projects/AlzApp/src/screens/` and make sure every import in AppNavigator.tsx matches the exact filename on disk.

### Metro serving old code after file changes
Always restart Metro with --reset-cache:
```bash
npx react-native start --reset-cache
```

### Pod install fails
```bash
cd ios
rm -rf Pods Podfile.lock build
pod repo update
pod install
cd ..
```

---

## Daily Development Workflow

```bash
# Terminal 1 — always use --reset-cache
npx react-native start --reset-cache

# Terminal 2
npx react-native run-ios
```

Press R in Terminal 1 to reload after JS-only changes.
Rerun run-ios only if you change native code or pods.

---

## Environment Reference

| Tool | Tested Version |
|---|---|
| React Native | 0.86.0 |
| Node | v26.4.0 |
| Xcode | 26.x |
| iOS SDK | 26.5 |
| CocoaPods | latest |
| @react-navigation/native | ^7 |
| @react-navigation/bottom-tabs | ^7 |
| @react-navigation/native-stack | ^7 |
| react-native-screens | latest |
| react-native-safe-area-context | ^5 |
| react-native-gesture-handler | ^2 |

---

*Last verified working: June 2026*
