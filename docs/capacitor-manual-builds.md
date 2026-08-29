# Capacitor Manual Builds

## Native Configuration

- App name: `XGame`
- Capacitor app ID / iOS bundle ID: `com.xgame.xgame.app`
- Android application ID: `com.xgame.app`
- Web directory: `dist`
- Capacitor config: `capacitor.config.ts`
- Android project: `android/`
- iOS project: `ios/`

The native apps load the built Vite app inside a Capacitor WebView, so there is no browser toolbar. The existing PWA setup stays intact. The service worker remains conservative and does not runtime-cache API, auth, wallet, support, SignalR, or game responses.

## Native App Icons

Icon generation script:

```text
scripts/generate-capacitor-icons.py
```

Source brand asset:

```text
public/icons/icon-512.png
```

The generator crops the visible logo, preserves aspect ratio, centers it on the
brand background, and adds launcher-mask safe area. It regenerates the PWA icon
files below so installed PWA icons and native launcher icons stay visually
consistent:

```text
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-icon-512.png
public/apple-touch-icon.png
```

- Android legacy launcher icons: opaque padded brand-background PNGs
- Android adaptive foreground icons: transparent padded foreground PNGs
- Android adaptive monochrome icons: transparent white foreground PNGs
- Android adaptive background color: `#264639`
- iOS AppIcon sizes: opaque padded brand-background PNGs

Android generated launcher outputs:

```text
android/app/src/main/res/mipmap-mdpi/ic_launcher.png
android/app/src/main/res/mipmap-hdpi/ic_launcher.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-mdpi/ic_launcher_monochrome.png
android/app/src/main/res/mipmap-hdpi/ic_launcher_monochrome.png
android/app/src/main/res/mipmap-xhdpi/ic_launcher_monochrome.png
android/app/src/main/res/mipmap-xxhdpi/ic_launcher_monochrome.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_monochrome.png
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml
android/app/src/main/res/values/ic_launcher_background.xml
```

The adaptive icon XML files reference `@mipmap/ic_launcher_foreground`,
`@color/ic_launcher_background`, and `@mipmap/ic_launcher_monochrome`.

iOS generated AppIcon outputs:

```text
ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

The iOS icon set includes iPhone, iPad, and `ios-marketing` sizes up to `AppIcon-1024.png`.

PWA install icon outputs:

```text
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/maskable-icon-512.png
public/apple-touch-icon.png
public/favicon.ico
```

The manifest uses `/icons/icon-192.png` and `/icons/icon-512.png` with
`purpose: "any"`, plus `/icons/maskable-icon-512.png` with
`purpose: "maskable"`. `index.html` also exposes PNG favicon links and a
180x180 Apple touch icon link for Safari Add to Home Screen.

When retesting installed PWA icons, remove the old home-screen app first. If a
device still shows the old or blank icon, clear Safari/Chrome site data for the
domain, redeploy, reopen the HTTPS URL, and add the app to the home screen again.

## Required Local Tooling

Android:

- JDK 11 or newer. JDK 17 is recommended.
- Android Studio or Android SDK command-line tools.
- Android SDK/platform/build-tools installed.
- USB debugging enabled on the Android device for manual install.

iOS:

- Full Xcode installation, not only Command Line Tools.
- Apple developer team selected in Xcode for real-device signing.
- Physical iPhone/iPad connected and trusted for manual run, or TestFlight setup for distributed testing.

## Common Sync Flow

Run this after web changes:

```bash
npm run build
npx cap sync
```

## Android Debug APK

Build:

```bash
cd android
./gradlew assembleDebug
```

APK output:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install manually:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Android Release APK

Build unsigned release APK:

```bash
cd android
./gradlew assembleRelease
```

Unsigned APK output:

```text
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

Align and sign for manual distribution:

```bash
zipalign -p -f 4 app/build/outputs/apk/release/app-release-unsigned.apk app/build/outputs/apk/release/xgame-release-aligned.apk
apksigner sign --ks /path/to/xgame-release.jks --out app/build/outputs/apk/release/xgame-release.apk app/build/outputs/apk/release/xgame-release-aligned.apk
apksigner verify app/build/outputs/apk/release/xgame-release.apk
```

Install signed release APK:

```bash
adb install -r app/build/outputs/apk/release/xgame-release.apk
```

## Android AAB Later

Build App Bundle:

```bash
cd android
./gradlew bundleRelease
```

AAB output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## iOS Manual Xcode Run

Open the iOS project:

```bash
npx cap open ios
```

In Xcode:

- Open the `App` target.
- Set the signing team.
- Confirm bundle identifier `com.xgame.xgame.app`.
- Select a connected real device.
- Press Run.

For TestFlight/manual beta distribution:

- Select `Any iOS Device`.
- Product > Archive.
- Distribute App through Xcode Organizer.
- Upload to App Store Connect and distribute with TestFlight.

## Online-Only Checks

- The global blocker is controlled by browser/WebView online state unless `VITE_HEALTHCHECK_URL` is explicitly configured.
- Production should configure `VITE_HEALTHCHECK_URL=https://api.xgame.game/api/HealthCheck`.
- `VITE_HEALTHCHECK_URL` remains optional. If it is empty, only browser/WebView offline state controls the global blocker.
- If configured, the app calls the health endpoint with `GET`, `cache: "no-store"`, and a 5 second timeout. It unblocks only when the response is HTTP 2xx and JSON `status` is `"Healthy"`.
- The app does not assume or append `/health`.
- API failures remain feature-level errors.
- `/Games` iframe files are copied into both native platforms during `npx cap sync`.
