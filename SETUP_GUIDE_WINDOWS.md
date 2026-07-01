# AlzApp — Complete Setup Guide

This guide covers everything you need to get started, from creating a GitHub account to running the app on your device. Follow the section that matches your computer.

- **Mac** → GitHub Setup → Mac Setup → Daily Workflow
- **Windows** → GitHub Setup → Windows Setup → Daily Workflow

If you have never used GitHub or written code before, start at the very beginning. Every step is covered.

---

## Table of Contents

1. [What Is GitHub and Why Do We Use It](#1-what-is-github-and-why-do-we-use-it)
2. [GitHub Setup — Everyone Does This First](#2-github-setup--everyone-does-this-first)
3. [Mac Setup — iOS Development](#3-mac-setup--ios-development)
4. [Windows Setup — Android Development](#4-windows-setup--android-development)
5. [Daily Workflow — Running the App](#5-daily-workflow--running-the-app)
6. [Daily Workflow — Sharing Code With Your Teammate](#6-daily-workflow--sharing-code-with-your-teammate)
7. [Writing Screens That Work on Both Platforms](#7-writing-screens-that-work-on-both-platforms)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What Is GitHub and Why Do We Use It

GitHub is a website that stores your code online so the whole team can access it. Think of it like Google Drive but specifically for code. Instead of emailing files back and forth, everyone downloads the latest version, makes changes, and uploads them back. The system tracks every change ever made so you can always undo mistakes.

Key terms you will see:
- **Repository (repo):** The folder where all your project code lives on GitHub
- **Clone:** Downloading a copy of the repo to your computer
- **Commit:** Saving a snapshot of your changes with a description
- **Push:** Uploading your commits to GitHub so teammates can see them
- **Pull:** Downloading your teammates' latest changes to your computer

---

## 2. GitHub Setup — Everyone Does This First

### Step 2.1 — Create a GitHub Account

1. Go to https://github.com
2. Click **Sign up**
3. Enter your email, create a password, and choose a username
4. Verify your email address when GitHub sends you a confirmation

### Step 2.2 — Install Git on Your Computer

Git is the program that actually manages your code — GitHub is just the website that hosts it.

**On Mac:**

1. Open **Terminal** (press `Cmd + Space`, type `Terminal`, press Enter)
2. Type this and press Enter:

```bash
git --version
```

If a version number prints, Git is already installed — skip to Step 2.3.

If a dialog box appears asking you to install developer tools, click **Install** and wait for it to finish.

**On Windows:**

1. Go to https://git-scm.com/download/win
2. Download and run the installer
3. Accept all defaults — when asked about the default editor, you can choose **Notepad** if you are not familiar with any code editors
4. Open **Command Prompt** (press `Windows Key + R`, type `cmd`, press Enter)
5. Type this and press Enter:

```cmd
git --version
```

A version number should print.

### Step 2.3 — Tell Git Who You Are

This attaches your name to every change you make. Open Terminal (Mac) or Command Prompt (Windows) and run both of these, replacing the name and email with your own:

```bash
git config --global user.name "Your Name"
git config --global user.email "youremail@example.com"
```

Use the same email you signed up to GitHub with.

### Step 2.4 — Get Access to the Repo

One person on your team needs to be the **repo owner** and invite everyone else.

**If you are the repo owner (creating the repo for the first time):**

1. Log in to https://github.com
2. Click the **+** button in the top right corner → **New repository**
3. Name it `AlzApp`
4. Set it to **Private**
5. Do NOT check any of the "Initialize" options
6. Click **Create repository**
7. GitHub will show you a page with setup instructions — copy the URL shown (it looks like `https://github.com/yourusername/AlzApp.git`)
8. To invite your teammate: go to your repo page → **Settings** → **Collaborators** → **Add people** → enter their GitHub username or email

**If you are a teammate being invited:**

1. Check your email for an invitation from GitHub
2. Click **Accept invitation**
3. You now have access to the repo

### Step 2.5 — Clone the Repo to Your Computer

This downloads the project to your computer. Replace the URL with your actual repo URL.

**On Mac** — in Terminal:

```bash
mkdir -p ~/Projects
cd ~/Projects
git clone https://github.com/yourusername/AlzApp.git
cd AlzApp
```

**On Windows** — in Command Prompt:

```cmd
mkdir C:\Projects
cd C:\Projects
git clone https://github.com/yourusername/AlzApp.git
cd AlzApp
```

> **Note for the first time only:** If the repo is empty (just created), the clone will create an empty folder. That is fine — continue with your platform setup below and the code files will go into that folder.

---

## 3. Mac Setup — iOS Development

> **Before you start:** Make sure you have completed all of Section 2 first.

Follow every step in order. Do not skip or reorder them. Each step builds on the previous one.

### Step 3.1 — Install Xcode

Xcode is Apple's development tool. It is required to build iOS apps.

1. Open the **Mac App Store** (it is in your Dock or Applications folder)
2. Search for **Xcode** and click **Get** to install it
3. This is a large download (around 14 GB) — allow 20 to 60 minutes
4. Once installed, **open Xcode once** — it will prompt you to install additional components. Click **Install** and let it finish, then close Xcode
5. Open Terminal and run:

```bash
sudo xcode-select --install
```

If a dialog appears, click **Install** and wait for it to finish. If it says tools are already installed, that is fine.

6. Accept the Xcode license:

```bash
sudo xcodebuild -license accept
```

Press Enter and type `agree` if prompted.

### Step 3.2 — Install Homebrew

Homebrew is a tool that lets you install developer software easily on Mac.

First, check if it is already installed:

```bash
brew --version
```

If a version number prints, skip to Step 3.3.

If not, install it:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This will ask for your Mac password. Type it (nothing will appear on screen — that is normal) and press Enter.

> **If you have an M1, M2, M3, or M4 Mac (Apple Silicon):** After installation finishes, Homebrew will print two commands starting with `echo` and `eval`. You must run both of those commands in Terminal before continuing.

Verify the installation:

```bash
brew --version
```

### Step 3.3 — Install Node.js, Watchman, and CocoaPods

```bash
brew install node watchman
brew install cocoapods
```

Verify everything installed correctly:

```bash
node --version
watchman --version
pod --version
```

All three should print version numbers. Node should be version 18 or higher.

### Step 3.4 — Set Up the Project Files

If you already have the source files from a teammate, copy them into your `~/Projects/AlzApp` folder now.

The folder should look like this:

```
AlzApp/
├── App.tsx
├── index.js
├── babel.config.js
├── src/
│   └── (all your screen and navigation files)
├── ios/
├── android/
└── package.json
```

If you are the first person setting up the project from scratch:

```bash
cd ~/Projects
npx @react-native-community/cli@latest init AlzApp
cd AlzApp
```

Then copy in your source files.

### Step 3.5 — Install All npm Packages

Run this from inside your AlzApp folder:

```bash
cd ~/Projects/AlzApp
npm install --legacy-peer-deps \
  "@react-navigation/native@^7" \
  "@react-navigation/drawer@^7" \
  "@react-navigation/native-stack@^7" \
  "react-native-screens@latest" \
  "react-native-safe-area-context@^5" \
  "react-native-gesture-handler@^2" \
  "react-native-reanimated@^3" \
  "@react-native-async-storage/async-storage@^2"
```

Then:

```bash
npm install react-native-worklets
```

### Step 3.6 — Create the Hermes Compatibility Shim

This fixes a known build error with newer versions of Xcode and Hermes (the JavaScript engine React Native uses).

```bash
mkdir -p ~/Projects/AlzApp/ios/hermes-shims/hermes/inspector
cat > ~/Projects/AlzApp/ios/hermes-shims/hermes/inspector/RuntimeAdapter.h << 'EOF'
// Compatibility shim: hermes/inspector/RuntimeAdapter.h was removed in newer Hermes
#pragma once
#include <hermes/hermes.h>
namespace facebook {
namespace hermes {
namespace inspector {
class RuntimeAdapter {
 public:
  virtual ~RuntimeAdapter() = default;
  virtual ::facebook::hermes::HermesRuntime& getRuntime() = 0;
  virtual void tickleJs() {}
};
} // namespace inspector
} // namespace hermes
} // namespace facebook
EOF
```

### Step 3.7 — Configure the Podfile

This replaces the iOS Podfile with the correct version that includes all fixes:

```bash
cat > ~/Projects/AlzApp/ios/Podfile << 'EOF'
require Pod::Executable.execute_command('node', ['-p',
  'require.resolve(
    "react-native/scripts/react_native_pods.rb",
    {paths: [process.argv[1]]},
  )', __dir__]).strip

platform :ios, min_ios_version_supported
prepare_react_native_project!

linkage = ENV['USE_FRAMEWORKS']
if linkage != nil
  Pod::UI.puts "Configuring Pod with #{linkage}ally linked Frameworks".green
  use_frameworks! :linkage => linkage.to_sym
end

target 'AlzApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :app_path => "#{Pod::Config.instance.installation_root}/.."
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )
    shims_path = File.expand_path('../hermes-shims', __FILE__)
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        if ['RNReanimated', 'RNWorklets'].include?(target.name)
          paths = config.build_settings['HEADER_SEARCH_PATHS']
          entry = "\"#{shims_path}\""
          if paths.nil?
            config.build_settings['HEADER_SEARCH_PATHS'] = ['$(inherited)', entry]
          elsif paths.is_a?(Array)
            config.build_settings['HEADER_SEARCH_PATHS'] = paths + [entry] unless paths.include?(entry)
          else
            config.build_settings['HEADER_SEARCH_PATHS'] = [paths, entry] unless paths.include?(entry)
          end
        end
      end
    end
  end
end
EOF
```

### Step 3.8 — Install iOS Native Dependencies

```bash
cd ~/Projects/AlzApp/ios
rm -rf Pods Podfile.lock build
pod install --repo-update
cd ..
```

This takes 3 to 8 minutes. You will see a lot of output — that is normal.

### Step 3.9 — Clear Build Cache

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/AlzApp-*
```

### Step 3.10 — Set Up the iOS Simulator

1. Open **Xcode**
2. Go to **Xcode → Settings** (or press `Cmd + ,`)
3. Click the **Platforms** tab
4. Find **iOS** and click the download arrow next to it
5. Wait for the download to finish (5 to 10 minutes, one-time only)
6. Close Xcode

### Step 3.11 — Run the App for the First Time

You need **two separate Terminal windows** open at the same time.

**Terminal Window 1 — Start Metro (the JavaScript bundler):**

```bash
cd ~/Projects/AlzApp
npx react-native start --reset-cache
```

Leave this running. Wait until you see the message `Dev server ready`.

**Terminal Window 2 — Build and launch the app:**

```bash
cd ~/Projects/AlzApp
npx react-native run-ios
```

The iPhone Simulator will open on your screen. The first build takes 5 to 10 minutes. After that, subsequent builds are much faster.

You will see the AlzApp login screen. Type any email and password to log in — any credentials work in the current build.

**Setup is complete.** For daily usage, see Section 5.

---

## 4. Windows Setup — Android Development

> **Important:** iOS apps cannot be built on Windows. This is an Apple restriction with no workaround. Your Windows teammate works on Android. The screens and code you both write are identical — React Native automatically handles both platforms from the same source files.

> **Before you start:** Make sure you have completed all of Section 2 first.

Follow every step in order. Do not skip or reorder them.

### Step 4.1 — Install Node.js

1. Go to https://nodejs.org
2. Download the **LTS** version (the left button on the homepage)
3. Run the downloaded installer
4. Accept all defaults on every screen
5. Open **Command Prompt** (press `Windows Key + R`, type `cmd`, press Enter)
6. Verify:

```cmd
node --version
npm --version
```

Both should print version numbers. Node should be 18 or higher.

### Step 4.2 — Install JDK 17

React Native requires Java version 17 specifically.

1. Go to https://adoptium.net
2. Click the dropdown and select **Temurin 17 (LTS)**
3. Download the **Windows x64** `.msi` installer
4. Run the installer
5. On the feature selection screen, make sure **"Set JAVA_HOME variable"** is checked (it usually is by default)
6. Finish the installation
7. Open a **new** Command Prompt window and verify:

```cmd
java -version
```

The output should mention version `17`.

### Step 4.3 — Install Android Studio

1. Go to https://developer.android.com/studio
2. Click **Download Android Studio** and run the installer
3. Accept all defaults — make sure **Android Virtual Device** is checked during installation
4. Launch Android Studio after installation
5. The Setup Wizard will open automatically. Choose **Standard** and click through all the screens
6. Android Studio will download required components — this takes 10 to 20 minutes
7. When it finishes you will see the Android Studio Welcome screen

### Step 4.4 — Install the Android SDK

1. On the Welcome screen, click **More Actions** → **SDK Manager**
   (Or from the menu: **Tools → SDK Manager**)
2. Click the **SDK Platforms** tab
3. Check the box next to **Android 14.0 ("UpsideDownCake") API Level 34**
4. Click the **SDK Tools** tab
5. Make sure these are checked:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
6. Click **Apply**, then **OK** on the confirmation dialog
7. Wait for all downloads to finish

### Step 4.5 — Set Environment Variables

This tells Windows where to find the Android tools you just installed.

1. Press `Windows Key + S` and search for **Environment Variables**
2. Click **"Edit the system environment variables"**
3. Click the **"Environment Variables..."** button at the bottom
4. In the **top section** (User variables), click **New** and add:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   
   Replace `YourUsername` with your actual Windows username. You can find it by opening Command Prompt and typing `echo %USERNAME%`.

5. In the **top section** (User variables), find the variable called **Path**, click it, then click **Edit**
6. Click **New** and add each of these on a separate line:

```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

7. Click **OK** on all windows to save everything
8. **Close and reopen** Command Prompt (the changes only apply to new windows)
9. Verify:

```cmd
adb --version
```

Should print a version number. If it says "not recognized", double-check Step 4.5 and make sure you opened a fresh Command Prompt.

### Step 4.6 — Create an Android Emulator

An emulator is a fake Android phone that runs on your computer.

1. In Android Studio, click **More Actions** → **Virtual Device Manager**
   (Or from the menu: **Tools → Virtual Device Manager**)
2. Click **Create Device** (or the **+** button)
3. Select **Pixel 7** from the list and click **Next**
4. Find **API Level 34** in the system image list
   - If there is a download arrow next to it, click it and wait for it to download
5. Select it and click **Next**
6. Leave all settings as they are and click **Finish**
7. Back in the Virtual Device Manager, click the **Play ▶** button next to your new device
8. The emulator will open — wait for it to fully boot to the Android home screen before continuing

### Step 4.7 — Set Up the Project Files

Navigate to your project folder in Command Prompt:

```cmd
cd C:\Projects\AlzApp
```

If this folder is empty (fresh clone), you need to create the React Native project first:

```cmd
cd C:\Projects
npx @react-native-community/cli@latest init AlzApp
cd AlzApp
```

Then copy in your source files from your teammate (App.tsx, index.js, babel.config.js, and the src folder).

### Step 4.8 — Install All npm Packages

```cmd
cd C:\Projects\AlzApp
npm install --legacy-peer-deps "@react-navigation/native@^7" "@react-navigation/drawer@^7" "@react-navigation/native-stack@^7" "react-native-screens@latest" "react-native-safe-area-context@^5" "react-native-gesture-handler@^2" "react-native-reanimated@^3" "@react-native-async-storage/async-storage@^2"
```

Then:

```cmd
npm install react-native-worklets
```

### Step 4.9 — Run the App for the First Time

Make sure your Android emulator from Step 4.6 is open and has finished booting to the home screen.

You need **two separate Command Prompt windows** open at the same time.

**Command Prompt 1 — Start Metro (the JavaScript bundler):**

```cmd
cd C:\Projects\AlzApp
npx react-native start --reset-cache
```

Leave this running. Wait until you see the message `Dev server ready`.

**Command Prompt 2 — Build and launch the app:**

```cmd
cd C:\Projects\AlzApp
npx react-native run-android
```

The first build takes 5 to 10 minutes. The app will appear in your emulator. You will see the AlzApp login screen. Type any email and password to log in.

**Setup is complete.** For daily usage, see Section 5.

---

## 5. Daily Workflow — Running the App

Once you have completed your one-time setup, this is all you need to do every day.

### On Mac

Make sure you are in the right folder first. You need **two Terminal windows**.

**Terminal 1:**
```bash
cd ~/Projects/AlzApp
npx react-native start
```

**Terminal 2:**
```bash
cd ~/Projects/AlzApp
npx react-native run-ios
```

### On Windows

Make sure your Android emulator is open and booted first. You need **two Command Prompt windows**.

**Command Prompt 1:**
```cmd
cd C:\Projects\AlzApp
npx react-native start
```

**Command Prompt 2:**
```cmd
cd C:\Projects\AlzApp
npx react-native run-android
```

### Hot Reloading

Once the app is running, you can edit any source file and save it. The app will automatically update within a second or two — you do not need to rebuild every time. Rebuilding (running `run-ios` or `run-android`) is only needed after installing new packages or making changes to native configuration files.

---

## 6. Daily Workflow — Sharing Code With Your Teammate

This is how you use Git and GitHub to keep your code in sync. Do these steps every time you work on the project.

### Before You Start Working — Pull the Latest Changes

Always do this first to get any changes your teammate made:

**On Mac:**
```bash
cd ~/Projects/AlzApp
git pull
```

**On Windows:**
```cmd
cd C:\Projects\AlzApp
git pull
```

### After You Make Changes — Save and Share Them

When you are done working on something, follow these three steps:

**Step 1 — See what files you changed:**

```bash
git status
```

This shows you a list of files you have modified. Red files have not been saved to Git yet.

**Step 2 — Stage your changes (tell Git which files to include):**

To include everything:

```bash
git add .
```

Or to include specific files:

```bash
git add src/screens/HomeScreen.tsx
```

**Step 3 — Commit with a description:**

```bash
git commit -m "Add home screen layout"
```

The message in quotes should briefly describe what you did. Be specific — "Add home screen layout" is better than "changes".

**Step 4 — Push to GitHub:**

```bash
git push
```

Your teammate can now run `git pull` to get your changes.

### Handling Conflicts

If you and your teammate both edited the same file at the same time, Git will tell you there is a conflict when you try to push or pull. The file will show both versions with markers like `<<<<<<`, `=======`, and `>>>>>>>`. You need to manually edit the file to keep the correct version, then run `git add .` and `git commit -m "resolve conflict"` and `git push`.

If this is confusing, reach out to your teammate to coordinate who edits what, or use a tool like **VS Code** which has a built-in visual conflict resolver.

### What NOT to Push to GitHub

Some files and folders should never be committed. Create a file called `.gitignore` in your project root (if it does not already exist) with these contents:

```
node_modules/
android/build/
android/.gradle/
ios/Pods/
ios/build/
.env
*.keystore
```

The React Native CLI usually creates this file for you automatically.

---

## 7. Writing Screens That Work on Both Platforms

Almost everything you write works on both iOS and Android automatically. React Native components like `View`, `Text`, `TextInput`, `TouchableOpacity`, `FlatList`, and all the navigation libraries work identically on both platforms.

The only time you need to think about platforms is for small visual differences. Here is how to handle those when they come up:

```javascript
import { Platform, StyleSheet, View, Text } from 'react-native';

export default function MyScreen() {
  return (
    <View style={styles.container}>
      <Text>Hello from AlzApp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Give more top padding on iOS because of the notch
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
});
```

The `Platform.OS` value is either `'ios'` or `'android'`. That is the only tool you need for 95% of cross-platform differences.

Your Windows teammate writes screens normally. The Mac teammate runs those same screens on iOS and they will look correct. You will only need to coordinate on platform-specific tweaks, which are rare.

---

## 8. Troubleshooting

### "Metro bundler is already running"

Kill it by pressing `Ctrl + C` in the Terminal or Command Prompt where it was running, then start it again.

### "No devices found" on Android

Make sure your emulator is fully booted to the home screen before running `run-android`. You can check by running:

```cmd
adb devices
```

Your emulator should appear in the list.

### "Command not found: npx" or "Command not found: node"

Node.js is not installed or not on your PATH. Redo Step 3.3 (Mac) or Step 4.1 (Windows).

### "pod: command not found" on Mac

CocoaPods is not installed. Run `brew install cocoapods`.

### The app builds but crashes immediately on Android

Run this to see the error:

```cmd
npx react-native log-android
```

### Changes are not appearing in the app

Try shaking your phone or pressing `Cmd + D` (iOS Simulator) or `Ctrl + M` (Android Emulator) to open the developer menu, then tap **Reload**.

If that does not work, stop Metro, run it again with `--reset-cache`, and rebuild.

### Git says "Your branch is behind" when you try to push

Pull first, then push:

```bash
git pull
git push
```

### Git asks for a username and password every time

Set up a credential helper. On Mac:

```bash
git config --global credential.helper osxkeychain
```

On Windows, Git installs this automatically. If you are still prompted, try:

```cmd
git config --global credential.helper manager
```

---

*Last updated: July 2026*
