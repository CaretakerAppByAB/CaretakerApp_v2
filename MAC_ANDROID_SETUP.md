# AlzApp — Mac Android Setup Guide
### For Mac users who cannot install Xcode

If your Mac is incompatible with Xcode 26, you can still develop and run AlzApp using Android Studio and an Android emulator. The app code is identical — only the run command changes.

**Time required:** 45–90 minutes (mostly downloads)

---

## Step 1 — Install Homebrew

Homebrew is a package manager for Mac that makes installing developer tools much easier. If you already have it, skip this step.

Open **Terminal** and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow any prompts it gives you. When it finishes, close Terminal and open a new one.

Verify it worked:
```bash
brew --version
```

---

## Step 2 — Install Node.js

```bash
brew install node
```

Verify:
```bash
node -v
npm -v
```

Both should print version numbers.

---

## Step 3 — Install JDK 17

React Native requires Java 17 exactly. Do not install Java 21 or any other version.

```bash
brew install --cask zulu@17
```

Verify:
```bash
java -version
```

Should say `openjdk version "17.x.x"`

---

## Step 4 — Install Android Studio

1. Go to https://developer.android.com/studio
2. Download the Mac version (.dmg file)
3. Open the dmg and drag Android Studio to your Applications folder
4. Open Android Studio from Applications
5. In the setup wizard choose **Standard** installation
6. Let it download everything — this takes a while
7. When finished, leave it on the welcome screen

---

## Step 5 — Install Android SDK components

Inside Android Studio:

1. Click **More Actions** → **SDK Manager**
2. Click the **SDK Platforms** tab → check **Android 15 (API 35)**
3. Click the **SDK Tools** tab → make sure these are checked:
   - Android SDK Build-Tools 35
   - Android Emulator
   - Android SDK Platform-Tools
4. Click **Apply** → **OK** and let it download

---

## Step 6 — Set environment variables

You need to tell your Mac where the Android SDK lives. Open Terminal and run:

```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
source ~/.zshrc
```

Verify it worked:
```bash
adb --version
```

Should print `Android Debug Bridge version 1.x.x`. If it says "command not found", close Terminal and open a new one, then try again.

---

## Step 7 — Create an Android emulator

1. In Android Studio click **More Actions** → **Virtual Device Manager**
2. Click **Create Device**
3. Choose **Pixel 7** → click **Next**
4. Select **API 35** → click **Download** if needed → click **Next**
5. Leave defaults → click **Finish**
6. Click the **▶ Play** button next to your new device
7. Wait for it to fully boot to the Android home screen

---

## Step 8 — Download Gradle manually

React Native's build system needs to download Gradle, but the automatic download often times out. Downloading it manually through a browser is more reliable.

Open **Safari or Chrome** and paste this URL:
```
https://services.gradle.org/distributions/gradle-9.3.1-bin.zip
```

Wait for the full download (~130MB). It will save to your Downloads folder.

---

## Step 9 — Clone the repo

```bash
cd ~/Projects
git clone https://github.com/YOUR_REPO_URL/AlzApp.git
cd AlzApp
```

Replace `YOUR_REPO_URL` with the actual GitHub URL your team lead shared.

---

## Step 10 — Install packages

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

Ignore yellow warning messages — they are normal.

**Do not install:** react-native-reanimated, react-native-worklets, or @react-navigation/drawer. These were removed from the project because they break the build.

---

## Step 11 — Point the project to your local Gradle download

Open this file in any text editor:
```
~/Projects/AlzApp/android/gradle/wrapper/gradle-wrapper.properties
```

You can open it in Terminal with:
```bash
open -e ~/Projects/AlzApp/android/gradle/wrapper/gradle-wrapper.properties
```

Find this line:
```
distributionUrl=https\://services.gradle.org/distributions/gradle-9.3.1-bin.zip
```

Replace it with (adjust YOUR_USERNAME):
```
distributionUrl=file\:///Users/YOUR_USERNAME/Downloads/gradle-9.3.1-bin.zip
```

Save the file.

---

## Step 12 — Run the app

Make sure your Android emulator is open and showing the Android home screen.

Open **two Terminal windows**:

**Terminal 1:**
```bash
cd ~/Projects/AlzApp
npx react-native start --reset-cache
```

Wait until you see `Dev server ready` before continuing.

**Terminal 2:**
```bash
cd ~/Projects/AlzApp
npx react-native run-android
```

The first build takes 5–15 minutes. When it finishes, AlzApp will open on your emulator with a purple header and a hamburger menu in the top left.

---

## Daily workflow

1. Open Android Studio and start your emulator (Virtual Device Manager → ▶ Play)
2. Open two Terminal windows in the AlzApp folder

**Terminal 1:**
```bash
npx react-native start --reset-cache
```

**Terminal 2:**
```bash
npx react-native run-android
```

Press **R** in Terminal 1 to reload after code changes.

---

## Getting the latest team changes

```bash
git pull
npm install --legacy-peer-deps
npx react-native start --reset-cache
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

### "Downloading gradle...failed: timeout"
You skipped Step 8. Download the Gradle zip manually in your browser and follow Step 11.

### "adb: command not found"
Run `source ~/.zshrc` in a new Terminal window. If that doesn't fix it, check that the lines were added correctly to ~/.zshrc:
```bash
cat ~/.zshrc
```
You should see the three `export` lines from Step 6.

### "JAVA_HOME is not set"
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
npx react-native run-android
```

### "No emulators found"
Make sure your emulator is fully booted to the Android home screen. Run `adb devices` — your emulator should appear.

### Metro serving old code
Stop Metro (Ctrl+C) and restart:
```bash
npx react-native start --reset-cache
```

### Gradle errors after first successful build
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### App shows white screen on launch
Make sure Metro (Terminal 1) is running before you run `run-android` in Terminal 2.

---

## Summary — who uses which guide

| Situation | Guide to follow |
|---|---|
| Mac + Xcode 26 compatible | README.md (run-ios) |
| Mac + Xcode incompatible | This guide (run-android) |
| Windows | WINDOWS_ANDROID_SETUP.md (run-android) |

All three produce the same app. The only difference is which emulator/simulator it runs on.

---

## Environment reference

| Tool | Required Version |
|---|---|
| Node.js | 18 or higher |
| Java | 17 exactly |
| Android Studio | Latest |
| Android SDK | API 35 |
| Gradle | 9.3.1 (downloaded manually) |
| React Native | 0.86.0 |

