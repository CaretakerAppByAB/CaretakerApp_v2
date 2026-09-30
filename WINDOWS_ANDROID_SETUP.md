# AlzApp — Windows Android Setup Guide

This guide gets you from a fresh Windows machine to a running AlzApp on an Android emulator. Follow every step in order. Do not skip anything.

**Time required:** 45–90 minutes (mostly downloads)

---

## What you are setting up

Since iOS and Xcode only run on Mac, Windows developers run AlzApp on an Android emulator instead. The app code is identical — only the run command changes.

---

## Step 1 — Install Node.js

1. Go to https://nodejs.org
2. Download the **LTS** version (the left button)
3. Run the installer, accept all defaults
4. When it asks about "Tools for Native Modules", check that box if it appears

Verify it worked — open **PowerShell** and run:
```
node -v
npm -v
```
Both should print a version number.

---

## Step 2 — Install JDK 17

React Native requires Java 17 exactly. Do not install Java 21 or any other version.

1. Go to https://www.microsoft.com/openjdk
2. Click **Download** and choose **JDK 17** → **Windows** → **x64** → **.msi**
3. Run the installer, accept all defaults

Verify it worked:
```
java -version
```
Should say something like `openjdk version "17.x.x"`

---

## Step 3 — Install Android Studio

Android Studio gives you the Android emulator and all the build tools you need.

1. Go to https://developer.android.com/studio
2. Download and run the installer
3. In the setup wizard, choose **Standard** installation when asked
4. Let it download everything — this takes a while on slower connections
5. When it finishes, **do not open a project** — just let it sit on the welcome screen

---

## Step 4 — Install Android SDK components

Inside Android Studio:

1. Click **More Actions** → **SDK Manager** (or from the menu: Tools → SDK Manager)
2. Click the **SDK Platforms** tab
3. Check **Android 15 (API 35)**
4. Click the **SDK Tools** tab
5. Make sure these are checked:
   - Android SDK Build-Tools 35
   - Android Emulator
   - Android SDK Platform-Tools
6. Click **Apply**, then **OK**, let it download

---

## Step 5 — Set environment variables

This is the step most people get wrong. Do it carefully.

1. Press **Windows key**, search for **"Edit the system environment variables"**, open it
2. Click **Environment Variables** at the bottom
3. Under **System variables** (the bottom section), click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
   - Replace `YOUR_USERNAME` with your actual Windows username
4. Find the **Path** variable in System variables, click **Edit**
5. Click **New** and add: `%ANDROID_HOME%\platform-tools`
6. Click **New** and add: `%ANDROID_HOME%\emulator`
7. Click **OK** on all three windows

**Verify it worked** — open a new PowerShell window (must be new, not the old one) and run:
```
adb --version
```
Should print something like `Android Debug Bridge version 1.x.x`

If it says "not recognized", the Path variable was not saved correctly. Go back and check Step 5.

---

## Step 6 — Create an Android emulator

1. In Android Studio, click **More Actions** → **Virtual Device Manager**
2. Click **Create Device**
3. Choose **Pixel 7** from the list, click **Next**
4. Select **API 35** (Tiramisu), click **Download** next to it if needed, then **Next**
5. Leave everything as default, click **Finish**
6. In the Virtual Device Manager, click the **▶ Play** button next to your new device
7. Wait for the emulator to fully boot to the Android home screen before continuing

---

## Step 7 — Clone the repo

Open PowerShell and run:
```
cd C:\Users\YOUR_USERNAME\Projects
git clone https://github.com/CaretakerAppByAB/CaretakerApp_v2.git AlzApp
cd AlzApp
```

You need access to the CaretakerAppByAB GitHub organization. Ask the team lead to add you.

If you don't have git installed, download it from https://git-scm.com and run the installer with all defaults.

---

## Step 8 — Install packages

```
npm install
```

This installs the exact versions in `package-lock.json`. Don't add packages one by one.

This will take a few minutes. Ignore any yellow warning messages — they are normal.

**Do not install:**
- react-native-reanimated
- react-native-worklets
- @react-navigation/drawer

These packages were removed from this project because they cause build failures. Do not add them back.

---

## Step 9 — Run the app

Make sure your Android emulator is open and showing the Android home screen.

Open **two PowerShell windows**:

**PowerShell 1 — Start Metro:**
```
cd C:\Users\YOUR_USERNAME\Projects\AlzApp
npx react-native start --reset-cache
```

Wait until you see `Dev server ready` before continuing.

**PowerShell 2 — Build and launch:**
```
cd C:\Users\YOUR_USERNAME\Projects\AlzApp
npx react-native run-android
```

The first build takes 5–15 minutes. You will see a lot of text scrolling. This is normal.

When it finishes, AlzApp will open on your emulator with a purple header and a hamburger menu (☰) in the top left.

---

## Daily workflow

Once set up, each day you need to:

1. Open Android Studio and start your emulator (Virtual Device Manager → ▶ Play)
2. Open two PowerShell windows in the AlzApp folder

**PowerShell 1:**
```
npx react-native start --reset-cache
```

**PowerShell 2:**
```
npx react-native run-android
```

Press **R** twice in PowerShell 1 to reload the app after making code changes.

---

## Getting the latest team changes

```
git pull
npm install
npx react-native start --reset-cache
```

---

## Saving and sharing your changes

```
git add .
git commit -m "brief description of what you changed"
git push
```

---

## Troubleshooting

### "adb not recognized" after setting environment variables
Close all PowerShell windows and open a new one. Environment variable changes only take effect in new windows. If it still doesn't work, double-check that `%ANDROID_HOME%\platform-tools` was added to System variables Path (not User variables Path).

### "SDK location not found"
The `ANDROID_HOME` variable is wrong. Open Android Studio → SDK Manager and look at the **Android SDK Location** at the top of the window. Use that exact path for `ANDROID_HOME`.

### Build fails with "JAVA_HOME is not set"
```
set JAVA_HOME=C:\Program Files\Microsoft\jdk-17.x.x.x-hotspot
npx react-native run-android
```
Replace the path with the actual JDK 17 install location on your machine (check `C:\Program Files\Microsoft\` for the folder name).

### "No emulators found" or app does not install
Make sure your emulator is fully booted to the Android home screen before running `run-android`. Run `adb devices` in PowerShell — your emulator should appear in the list.

### Metro serving old code after changes
Stop Metro (Ctrl+C in PowerShell 1) and restart with:
```
npx react-native start --reset-cache
```

### Build fails with Gradle errors
```
cd android
.\gradlew clean
cd ..
npx react-native run-android
```

### App crashes on launch with white screen
Make sure Metro is running in PowerShell 1 before you run `run-android` in PowerShell 2. The app needs Metro to serve the JavaScript bundle.

---

## Physical Android device (optional)

If you prefer to run on a real phone instead of the emulator:

1. On your Android phone go to **Settings → About Phone**
2. Tap **Build Number** seven times until you see "You are now a developer"
3. Go to **Settings → Developer Options**
4. Enable **USB Debugging**
5. Connect your phone to your PC with a USB cable
6. Accept the "Allow USB Debugging" prompt on your phone
7. Run `adb devices` — your phone should appear
8. Run `npx react-native run-android` as normal

---

## Note for Mac team members helping Windows users

The only differences between Mac and Windows for this project are:

| | Mac | Windows |
|---|---|---|
| Run command | `npx react-native run-ios` | `npx react-native run-android` |
| Pods | `cd ios && pod install` | Not needed — Android uses Gradle |
| Emulator | Xcode iPhone Simulator | Android Studio AVD |
| Shell | Terminal / zsh | PowerShell |

All JavaScript and TypeScript files are identical. There is no platform-specific code in the screens or navigation.

---

## Environment reference

| Tool | Required Version |
|---|---|
| Node.js | 18 or higher (LTS) |
| Java | 17 exactly |
| Android Studio | Latest |
| Android SDK | API 35 |
| React Native | 0.86.0 |

