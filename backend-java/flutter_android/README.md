# Android targets for the GoDam Java backend

This folder centralizes the Android workflow that uses the Java Spring backend in `backend-java`. Both the Web admin (`web-admin/.env` already points to `http://72.61.245.23:8081`) and this Flutter app now share the same API host.

## Scripts
- `run_emulator.sh`: boots Flutter on a connected emulator/device using the Java backend (`http://72.61.245.23:8081`).
- `run_local_emulator.sh`: same as above but targets your locally running Spring Boot backend (`http://localhost:8080`).
- `build_release_apk.sh`: runs a release build (`flutter build apk --release`) while ensuring the app points at `http://72.61.245.23:8081`.

All scripts call the Flutter project inside `../flutter` so you don’t have to leave the backend directory.

## Backend configuration

1. Verify `backend-java/src/main/resources/application.yml` or `GODAM_DB_URL` points at the SQLite file you want to use.
2. Ensure the Spring backend is running on either `localhost:8080` (local emulators) or `72.61.245.23:8081` (VPS).
3. Run `./run_emulator.sh` or `./run_local_emulator.sh`; both scripts set `API_BASE_URL` when invoking Flutter to guarantee the mobile client talks to the Java API.

## Handy checks

- `flutter/lib/app_mobile.dart` contains the base URLs for each platform (`_vpsBaseUrl` already set to `http://72.61.245.23:8081`).
- To switch the emulator to a different host, override `API_BASE_URL` via `--dart-define` inside these scripts (just edit the constant near the top of the script).
