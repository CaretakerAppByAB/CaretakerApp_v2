# AlzApp

Caregiver support app for Alzheimer's families.

---

## Getting Started

### What you need installed first

- **Xcode 26** — download from the Mac App Store, open it once to accept the license
- **Node.js** — check with `node -v`, install from https://nodejs.org if missing
- **CocoaPods** — check with `pod --version`, install with `sudo gem install cocoapods` if missing

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/AlzApp.git
cd AlzApp
```

---

### Step 2 — Install packages

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

---

### Step 3 — Install iOS dependencies

```bash
cd ios
pod repo update
pod install
cd ..
```

This takes a few minutes. You should see "Pod installation complete!" when it's done.

---

### Step 4 — Run the app

Open **two terminal windows**.

**Terminal 1:**
```bash
npx react-native start --reset-cache
```

Wait until you see `Dev server ready` before continuing.

**Terminal 2:**
```bash
npx react-native run-ios
```

The first build takes 5–10 minutes. After that it's much faster.

You should see the app open on an iPhone simulator with a purple header and a hamburger menu (☰) in the top left.

---

## Daily workflow

Once you're set up, you only need these commands each day:

**Terminal 1:**
```bash
npx react-native start --reset-cache
```

**Terminal 2:**
```bash
npx react-native run-ios
```

Press **R** in Terminal 1 to reload the app after making code changes.

---

## Getting the latest changes from the team

```bash
git pull
```

If someone added new packages, also run:
```bash
npm install --legacy-peer-deps
cd ios && pod install && cd ..
```

---

## Saving and sharing your changes

```bash
git add .
git commit -m "brief description of what you changed"
git push
```

---

## Troubleshooting

**Build fails with `RuntimeAdapter` error**

Do not install `react-native-reanimated` — it does not work with Xcode 26. If it somehow got installed:
```bash
npm uninstall react-native-reanimated react-native-worklets --legacy-peer-deps
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

**"Nested NavigationContainer" crash**

`AppNavigator.tsx` must not contain a `<NavigationContainer>` tag. `App.tsx` already has one and there can only be one.

**"Unable to resolve module" error**

The filename in the import doesn't match the actual file on disk. Check:
```bash
ls src/screens/
```
Make sure imports in `AppNavigator.tsx` match exactly.

**App shows old code after you made changes**

Stop Metro and restart it with:
```bash
npx react-native start --reset-cache
```

**Pod install fails**

```bash
cd ios
rm -rf Pods Podfile.lock build
pod repo update
pod install
cd ..
```

---

## Important — do not install these packages

These packages break the build on Xcode 26 and must not be added:

- `react-native-reanimated`
- `react-native-worklets`
- `@react-navigation/drawer`

---

## Project structure

```
AlzApp/
  src/
    navigation/
      AppNavigator.tsx     ← handles all screen navigation
    screens/
      HomeScreen.tsx
      MoodScreen.tsx
      ResourceLibraryScreen.tsx
      JournalScreen.tsx
      CommunityForumScreen.tsx
      PrivateMessagesScreen.tsx
      ThankYouScreen.tsx
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
    context/
      AuthContext.tsx
    theme/
      colors.ts
  ios/                     ← native iOS code, do not edit manually
  App.tsx                  ← root component
  babel.config.js          ← must not contain reanimated plugin
  index.js                 ← app entry point
```

---

## Tested environment

| | Version |
|---|---|
| React Native | 0.86.0 |
| Xcode | 26.x |
| iOS SDK | 26.5 |
| Node | v26+ |

