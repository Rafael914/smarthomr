# 🏠 Geofence Feature Setup & Usage Guide

## Overview
The geofence feature automatically turns off all relays when you move **500+ meters away** from your home location. This provides safety by ensuring your Smart Home devices are disabled when you're away.

## Features

✅ **Toggle On/Off** - Enable/disable geofence anytime  
✅ **Set Home Location** - Mark your home GPS coordinates  
✅ **Distance Tracking** - See real-time distance from home  
✅ **Adjustable Radius** - Choose 250m, 500m, or 1km radius  
✅ **Background Monitoring** - Tracks location even when app is closed  
✅ **Auto-Disable Relays** - Automatically turns off all relays when outside geofence  

## Installation & Setup

### Backend Setup

1. **Database**: Geofence settings are stored in PostgreSQL
   - Table: `geofence_settings`
   - Fields: user_id, home_latitude, home_longitude, geofence_enabled, radius_meters

2. **API Endpoints**:
   ```
   GET    /api/geofence/settings/:userId       - Get geofence settings
   POST   /api/geofence/set-home               - Set home location
   POST   /api/geofence/toggle                 - Enable/disable geofence
   POST   /api/geofence/check-distance         - Check distance from home
   POST   /api/geofence/update-radius          - Update geofence radius
   ```

3. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   # This installs expo-location and expo-task-manager
   ```

2. **Configure Permissions** (in app.json):
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-location",
           {
             "locationAlwaysAndWhenInUsePermissions": "Allow"
           }
         ]
       ]
     }
   }
   ```

3. **Start Frontend**:
   ```bash
   npm start
   # Then select android/ios/web
   ```

## How It Works

### 1. **Set Home Location**
   - Open the **Geofence** tab
   - Click "📍 Set Home Location"
   - App gets your current GPS coordinates and saves them as home

### 2. **Enable Geofence**
   - Toggle the "Enable Geofence" switch
   - Background location tracking starts
   - App will monitor your distance from home every 5 minutes or 50 meters moved

### 3. **Auto-Disable Relays**
   - When you move **> 500m** away, the geofence triggers
   - All 5 relays automatically turn **OFF**
   - You'll see a warning: "⚠️ You are outside geofence! Relays should be OFF"

### 4. **Manual Override**
   - You can manually toggle relays in the Outlets tab anytime
   - Geofence doesn't prevent manual control

## Usage Examples

### Example 1: Home to Work
```
1. At Home (set home location)
2. Leave for work (drive 2km away)
3. Phone detects you're 2000m away
4. All relays turn OFF automatically
```

### Example 2: Coming Home
```
1. Driving home (currently 800m away)
2. Relays are OFF (geofence active)
3. Arrive home (< 500m)
4. You can manually turn relays back ON
   OR toggle geofence OFF to keep them ON
```

### Example 3: Temporary Away
```
1. Going to nearby store (within 500m radius)
2. Relays stay ON (you're in geofence zone)
3. You have peace of mind - devices stay active
```

## API Request Examples

### Get Geofence Settings
```bash
curl -X GET http://localhost:8000/api/geofence/settings/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Set Home Location
```bash
curl -X POST http://localhost:8000/api/geofence/set-home \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Toggle Geofence
```bash
curl -X POST http://localhost:8000/api/geofence/toggle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "enabled": true
  }'
```

### Check Distance from Home
```bash
curl -X POST http://localhost:8000/api/geofence/check-distance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "currentLatitude": 40.7200,
    "currentLongitude": -74.0100
  }'
```

### Update Radius
```bash
curl -X POST http://localhost:8000/api/geofence/update-radius \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": 1,
    "radiusMeters": 1000
  }'
```

## File Structure

### Backend
```
backend/
├── controller/
│   ├── relayController.js
│   ├── geofenceController.js  ← NEW
│   └── ...
├── routes/
│   ├── relayRoutes.js
│   ├── geofenceRoutes.js      ← NEW
│   └── ...
└── server.js                   ← UPDATED
```

### Frontend
```
frontend/
├── app/
│   └── (tabs)/
│       ├── _layout.tsx         ← UPDATED (added geofence tab)
│       ├── index.tsx
│       ├── outlets.tsx
│       └── geofence.tsx        ← NEW
├── components/
│   ├── GeofenceSettings.tsx   ← NEW
│   └── ...
├── hooks/
│   └── useGeofence.ts          ← NEW
└── package.json                ← UPDATED (added expo-location)
```

## Features Breakdown

### Backend Controller (geofenceController.js)
- ✅ `initGeofenceTable()` - Creates database table
- ✅ `getGeofenceSettings()` - Fetches user settings
- ✅ `setHomeLocation()` - Saves home GPS coordinates
- ✅ `toggleGeofence()` - Enables/disables feature
- ✅ `checkGeofenceDistance()` - Calculates distance & determines if relays should be off
- ✅ `updateRadius()` - Changes geofence radius
- ✅ Distance calculation using Haversine formula

### Frontend Hook (useGeofence.ts)
- ✅ `startGeofenceTracking()` - Begins background location monitoring
- ✅ `stopGeofenceTracking()` - Stops background location tracking
- ✅ `getCurrentLocation()` - Gets current GPS position
- ✅ `checkGeofenceStatus()` - Fetches settings from backend
- ✅ `setHomeLocation()` - Saves current location as home
- ✅ `toggleGeofence()` - Enables/disables feature
- ✅ Background task that runs every 5 minutes or 50m movement

### Frontend Component (GeofenceSettings.tsx)
- ✅ Toggle switch to enable/disable
- ✅ Button to set home location
- ✅ Button to check current location
- ✅ Display home coordinates
- ✅ Display current location with accuracy
- ✅ Show distance from home
- ✅ Radius adjustment buttons (250m/500m/1km)
- ✅ Real-time status indicators

## Permissions Required (Android/iOS)

### Android
- `ACCESS_FINE_LOCATION` - Precise location
- `ACCESS_COARSE_LOCATION` - Approximate location
- `ACCESS_BACKGROUND_LOCATION` - Background tracking (Android 10+)

### iOS
- `NSLocationWhenInUseUsageDescription` - When app is in use
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Always + when in use

## Troubleshooting

### "Location Permission Denied"
- Go to Settings → App Permissions → Location
- Enable "Allow all the time" for background tracking

### "Geofence Not Triggering"
- Ensure geofence is enabled (toggle switch is ON)
- Check that home location is set
- Verify your phone has location services enabled
- Try manually checking distance: tap "🔍 Get Current Location"

### "Relays Not Turning Off When Away"
- Check if geofence is enabled
- Verify home location is set correctly
- Ensure app has background location permissions
- Check backend connectivity

### "Distance Shows as NULL"
- This means either:
  - Home location not set yet (set it first)
  - Current location couldn't be retrieved (poor GPS signal)
  - Try again in an open area without obstacles

## Future Enhancements

- [ ] Map view showing home location and geofence boundary
- [ ] Multiple geofence zones (work, gym, etc.)
- [ ] Notifications when entering/leaving geofence
- [ ] Geofence history/logs
- [ ] Webhook integration for third-party apps
- [ ] Time-based rules (e.g., disable only at night)
- [ ] Integration with HomeKit, Google Home

## Security Notes

- 🔒 Location data is only stored on your device and backend database
- 🔒 GPS coordinates are encrypted in transmission (HTTPS)
- 🔒 Background location tracking respects user permissions
- 🔒 No location data is shared with third parties
- 🔒 You can disable at any time

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `npm run dev` in backend folder
3. Check frontend console: `npx expo start`
4. Verify all dependencies are installed: `npm install`
