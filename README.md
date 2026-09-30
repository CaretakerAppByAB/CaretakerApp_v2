# AlzApp

Caregiver support app for Alzheimer's families.

- **Mac + iPhone simulator / iPhone:** follow this page.
- **Mac that can't run Xcode 26:** see [MAC_ANDROID_SETUP.md](MAC_ANDROID_SETUP.md).
- **Windows:** see [WINDOWS_ANDROID_SETUP.md](WINDOWS_ANDROID_SETUP.md).

---

## Getting Started (Mac, iOS)

### What you need installed first

| Tool | Check | Install |
|---|---|---|
| **Xcode 26** | open it once and accept the license | Mac App Store |
| **Node.js 22.11+** | `node -v` | https://nodejs.org (LTS) or `brew install node` |
| **CocoaPods** | `pod --version` | `brew install cocoapods` (or `sudo gem install cocoapods`) |
| **Watchman** (recommended) | `watchman -v` | `brew install watchman` |

You also need access to the **CaretakerAppByAB** GitHub organization. Ask the team lead to add you.

### Step 1: Clone the repo

```bash
git clone https://github.com/CaretakerAppByAB/CaretakerApp_v2.git AlzApp
cd AlzApp
```

### Step 2: Install JavaScript packages

```bash
npm install
```

This installs the exact versions in `package-lock.json`. **Don't install packages one by one** or use `@latest`, because that can pull versions that don't build.

### Step 3: Install iOS dependencies

```bash
cd ios
pod install
cd ..
```

This takes a few minutes. You should see "Pod installation complete!". If it fails, see Troubleshooting below.

### Step 4: Run the app in the simulator

Open **two terminal windows** in the `AlzApp` folder.

**Terminal 1:**
```bash
npm start -- --reset-cache
```

Wait until you see `Dev server ready`.

**Terminal 2:**
```bash
npm run ios
```

The first build takes 5–10 minutes. The app opens on an iPhone simulator at the login screen. Tap **Sign up** to create a test account.

> Firebase (login, database, storage) is already configured in `src/config/firebase.ts`. Everyone on the team uses the same Firebase project, so there are no keys or `.env` file to set up.

### Optional: Run on your own iPhone

1. Plug in your iPhone and trust the computer. On the phone, turn on **Settings → Privacy & Security → Developer Mode** (the phone will restart).
2. Open `ios/AlzApp.xcworkspace` in Xcode (the **.xcworkspace**, not the .xcodeproj).
3. Click **AlzApp** in the left sidebar → **Signing & Capabilities** tab:
   - **Team:** choose your own Apple ID (Xcode → Settings → Accounts to add one; a free account works).
   - **Bundle Identifier:** change `com.aaronquan.alzapp` to something unique, e.g. `com.yourname.alzapp`. **Don't commit this change.**
4. Pick your iPhone from the device list at the top of Xcode and press **▶ Run**.
5. The first time, the phone may say "Untrusted Developer". Go to **Settings → General → VPN & Device Management**, trust your Apple ID, and run again.

Metro (Terminal 1) must be running, and the phone must be on the same Wi-Fi as your Mac.

---

## Daily workflow

```bash
git pull
npm install            # only needed if package.json changed
cd ios && pod install && cd ..   # only needed if a native package was added
```

Then **Terminal 1:** `npm start`, **Terminal 2:** `npm run ios`.
Press **R** in the simulator (or Terminal 1) to reload after code changes.

### Saving and sharing your changes

```bash
git checkout -b my-feature
git add .
git commit -m "brief description of what you changed"
git push -u origin my-feature
```

Then open a pull request on GitHub.

---

## Mental Health Resources content

The resources page is driven by the CSVs in [`resources/`](resources/) (keywords → emotions → resources).
See [resources/README.md](resources/README.md) for how to edit them. After editing, run:

```bash
npm run build:resources
```

This validates the CSVs and regenerates `src/data/resourceData.generated.ts`. Commit both the CSVs and the generated file.

---

## Useful commands

| Command | What it does |
|---|---|
| `npm start` | Start Metro (the JS dev server) |
| `npm run ios` / `npm run android` | Build and launch the app |
| `npm test` | Run tests |
| `npm run lint` | Lint the code |
| `npm run build:resources` | Rebuild resource-page data from the CSVs |

---

## Troubleshooting

**Build fails with `RuntimeAdapter` error**

Do not install `react-native-reanimated`. It does not work with Xcode 26. If it somehow got installed:
```bash
npm uninstall react-native-reanimated react-native-worklets
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

**"Nested NavigationContainer" crash**

`AppNavigator.tsx` must not contain a `<NavigationContainer>` tag. `App.tsx` already has one and there can only be one.

**"Unable to resolve module" error**

Run `npm install`. If it persists, the filename in the import doesn't match the file on disk (check capitalization).

**App shows old code after you made changes**

Stop Metro and restart it with `npm start -- --reset-cache`.

**Pod install fails**

```bash
cd ios
rm -rf Pods build
pod repo update
pod install
cd ..
```

**"No bundle URL present" / red screen on launch**

Metro isn't running. Start it in Terminal 1, then press R.

---

## Important: do not install these packages

These packages break the build on Xcode 26 and must not be added:

- `react-native-reanimated`
- `react-native-worklets`
- `@react-navigation/drawer`

---

## Project structure

```
AlzApp/
  src/
    navigation/AppNavigator.tsx   ← tabs + stacks for all screens
    screens/                      ← one file per screen (auth/ for login/register)
    components/                   ← shared UI (ScreenHeader, Avatar, modals…)
    services/                     ← Firebase reads/writes, encryption, resource matching
    data/                         ← generated data (don't edit by hand)
    context/AuthContext.tsx       ← logged-in user
    config/firebase.ts            ← Firebase project config
    theme/colors.ts
  resources/                      ← CSVs for the Mental Health Resources page
  scripts/                        ← build scripts (build-resources.js)
  firestore.rules / storage.rules ← Firebase security rules
  ios/  android/                  ← native projects (edit via Xcode / Android Studio only)
  App.tsx                         ← root component
  index.js                        ← app entry point
```

---

## Tested environment

| | Version |
|---|---|
| React Native | 0.86.0 |
| Xcode | 26.x |
| iOS SDK | 26.5 |
| Node | 22.11+ (tested on 26.4) |
| CocoaPods | 1.16 |
