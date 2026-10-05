# Docker and ngrok

This setup runs the Express API on port 5000 and serves the exported Expo web app on port 8080. Nginx forwards browser requests under `/api/` to the API, so the web app and API use one origin.

## Start

Create `backend/.env` from `backend/.env.example` and fill in the Neon database values. Then run:

```powershell
docker compose up --build
```

Open `http://localhost:8080` for the web app. The API is also available at `http://localhost:5000`.

## Expose the web app with ngrok

With Docker running, expose the web entry point:

```powershell
ngrok http 8080
```

Open the HTTPS forwarding URL ngrok prints. This exposes the browser app and its `/api` calls through one tunnel. The ngrok URL changes between sessions unless you configure a reserved domain in your ngrok account.

## Mobile app and ESP32

The container serves the web export; it does not run Expo Go or build a native mobile app. For Expo Go/native development, run Expo on the host and set `EXPO_PUBLIC_API_BASE_URL` in `frontend/.env` to a reachable API URL before starting Expo. A public ngrok API URL can be used for remote phones; restart Expo after changing it because Expo embeds this value in the JavaScript bundle.

The ESP32 should use the computer's LAN IP and API port 5000, for example `http://<computer-lan-ip>:5000/api/relay` and `http://<computer-lan-ip>:5000/api/pzem`. It should remain on the same LAN as the computer. The current sketch's port 8000 URLs do not match the backend's default port. A temporary ngrok HTTPS address is not a drop-in replacement for the ESP32 URLs; remote ESP32 access needs HTTPS/TLS support and a stable tunnel address.

## Notes

- Docker requires Docker Desktop's Linux engine to be running.
- The backend uses the existing Neon PostgreSQL database; Compose does not start a local database.
- Rebuild the web image after changing frontend source or the Expo public API base URL.
