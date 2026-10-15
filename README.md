# StudyQuest Android

Converted from the supplied StudyQuest web application using a thin Java + WebView shell.

## Architecture
- Android Studio / Java
- WebView loads the original web app from `app/src/main/assets/`
- Original HTML, CSS, JavaScript, images, and external Font Awesome dependency are preserved
- WebView DOM storage is enabled so the app's existing `localStorage` save (`studyquest_save`) persists normally
- Internet permission is included because the original page references Font Awesome from a CDN
- Android back navigation, WebView file chooser, and standard downloads are handled by the native shell

## Open in Android Studio
Open this folder as a Gradle Android project. The environment used to prepare this project did not include an Android SDK/Gradle installation, so APK compilation could not be verified in this environment.

Expected APK after a successful Android Studio build:
`app/build/outputs/apk/debug/app-debug.apk`
