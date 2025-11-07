# Android Push Notifications - Fix Summary

## Changes Made

### 1. AndroidManifest.xml
- ✅ Added `POST_NOTIFICATIONS` permission for Android 13+ (API 33+)

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### 2. localPushService.js
- ✅ Changed `requestPermissions: true` (was only for iOS)
- ✅ Added FCM fallback notification channel (`fcm_fallback_notification_channel`)
- ✅ Both channels use IMPORTANCE_HIGH (4) for better delivery

### 3. fcmService.js
- ✅ Request permission for both iOS and Android in `initialize()`
- ✅ Added permission check before getting token in `getToken()`
- ✅ Auto-request permission on Android if not granted
- ✅ Better logging for token retrieval

## Testing Checklist

### Step 1: Fresh Install
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Step 2: Check Permissions
- App should ask for notification permission on Android 13+
- Check logs for: `FCM: Authorization status:`
- Check logs for: `FCM: Token retrieved and stored:`

### Step 3: Verify Token
1. Open app
2. Check terminal logs for FCM token (should start with `d...` or `c...`)
3. Token should be saved to Firestore in Users/{userId}/_deviceIds array

### Step 4: Test Notification
Send test notification from Firebase Console:
- Go to Firebase Console → Cloud Messaging
- Click "Send test message"
- Add FCM token from logs
- Send notification
- Should appear on device

### Step 5: Check Firestore
```javascript
// User document should have:
{
  _deviceIds: ["token1", "token2", ...],
  _settings: {
    notifications: {
      messages: true,
      likes: true,
      friendRequests: true
    }
  }
}
```

## Common Issues & Solutions

### Issue: No permission dialog on Android
- **Solution**: Uninstall app completely, reinstall
- Check: `targetSdkVersion >= 33` in build.gradle

### Issue: Token is null
- **Solution**: Check `google-services.json` is present
- Verify Firebase Cloud Messaging API is enabled in Firebase Console
- Check Play Services are installed on device/emulator

### Issue: Notifications not arriving
1. Check user settings in Firestore (`_settings.notifications.*`)
2. Verify `_deviceIds` array contains valid tokens
3. Check server payload includes `android.notification` section:
```javascript
{
  token: deviceId,
  notification: {
    title: "Title",
    body: "Message"
  },
  android: {
    notification: {
      click_action: 'FCM_PLUGIN_ACTIVITY',
    },
  },
}
```

### Issue: Background notifications not working
- Ensure `setBackgroundMessageHandler` is set up (already done)
- Check notification channel exists
- Verify importance is HIGH (4)

## Debug Commands

### Check if app has notification permission:
```bash
adb shell dumpsys notification_listener
```

### Check notification channels:
```bash
adb shell dumpsys notification com.dating.desires
```

### Monitor Firebase logs:
```bash
adb logcat | grep -i fcm
```

## Production Checklist
- [ ] Firebase project has correct package name (`com.dating.desires`)
- [ ] `google-services.json` is up-to-date
- [ ] Server uses correct Server Key from Firebase Console
- [ ] Test on Android 13+ device (API 33+)
- [ ] Test on older Android (API 24-32)
- [ ] Verify background notifications work
- [ ] Verify foreground notifications work
- [ ] Test notification actions/deep links








