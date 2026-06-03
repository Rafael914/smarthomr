const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_BASE_URL. Set it to your deployed backend URL before running or publishing the app."
  );
}

export const BASE_URL = API_BASE_URL.replace(/\/$/, "");
