import {Platform, Alert, Linking} from 'react-native';
import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

const TRACKING_ASKED_KEY = '@tracking_permission_asked';

class TrackingService {
  /**
   * Request App Tracking Transparency permission (iOS 14.5+)
   * Shows native iOS dialog asking user for tracking permission
   */
  async requestTrackingPermission() {
    try {
      // Only for iOS
      if (Platform.OS !== 'ios') {
        console.log('Tracking permission not needed on Android');
        return true;
      }

      // Check if we already asked
      const hasAsked = await AsyncStorage.getItem(TRACKING_ASKED_KEY);
      if (hasAsked === 'true') {
        console.log('Tracking permission already asked');
        const isGranted = await this.checkTrackingPermission();
        // Ensure Firebase Analytics is in the correct state
        if (isGranted) {
          await this.enableAnalytics();
        } else {
          await this.disableAnalytics();
        }
        return isGranted;
      }

      // Check current status first
      const currentStatus = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      
      if (currentStatus === RESULTS.GRANTED) {
        console.log('Tracking permission already granted');
        await AsyncStorage.setItem(TRACKING_ASKED_KEY, 'true');
        // Enable Firebase Analytics since permission is already granted
        await this.enableAnalytics();
        return true;
      }

      if (currentStatus === RESULTS.UNAVAILABLE) {
        console.log('Tracking permission unavailable (iOS < 14.5)');
        return true;
      }

      // Request permission
      console.log('Requesting tracking permission...');
      const result = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      
      // Mark as asked
      await AsyncStorage.setItem(TRACKING_ASKED_KEY, 'true');

      switch (result) {
        case RESULTS.GRANTED:
          console.log('Tracking permission granted');
          // Enable Firebase Analytics after permission is granted
          await this.enableAnalytics();
          return true;
        case RESULTS.DENIED:
          console.log('Tracking permission denied');
          // Keep Firebase Analytics disabled
          await this.disableAnalytics();
          return false;
        case RESULTS.BLOCKED:
          console.log('Tracking permission blocked');
          // Keep Firebase Analytics disabled
          await this.disableAnalytics();
          return false;
        default:
          console.log('Tracking permission:', result);
          return false;
      }
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      return false;
    }
  }

  /**
   * Check if tracking permission is granted
   */
  async checkTrackingPermission() {
    try {
      if (Platform.OS !== 'ios') {
        return true;
      }

      const status = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
      return status === RESULTS.GRANTED;
    } catch (error) {
      console.error('Error checking tracking permission:', error);
      return false;
    }
  }

  /**
   * Show settings dialog if user denied permission
   */
  showSettingsAlert(t) {
    Alert.alert(
      t('TRACKING_PERMISSION_TITLE') || 'Tracking-Berechtigung',
      t('TRACKING_PERMISSION_MESSAGE') || 'Für ein besseres Erlebnis benötigen wir deine Erlaubnis für Tracking. Bitte aktiviere dies in den Einstellungen.',
      [
        {
          text: t('CANCEL') || 'Abbrechen',
          style: 'cancel'
        },
        {
          text: t('OPEN_SETTINGS') || 'Einstellungen öffnen',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            }
          }
        }
      ]
    );
  }

  /**
   * Enable Firebase Analytics (when tracking permission is granted)
   */
  async enableAnalytics() {
    try {
      if (Platform.OS === 'ios') {
        await analytics().setAnalyticsCollectionEnabled(true);
        console.log('Firebase Analytics enabled');
      }
    } catch (error) {
      console.error('Error enabling Firebase Analytics:', error);
    }
  }

  /**
   * Disable Firebase Analytics (when tracking permission is denied/blocked)
   */
  async disableAnalytics() {
    try {
      if (Platform.OS === 'ios') {
        await analytics().setAnalyticsCollectionEnabled(false);
        console.log('Firebase Analytics disabled');
      }
    } catch (error) {
      console.error('Error disabling Firebase Analytics:', error);
    }
  }

  /**
   * Reset tracking permission asked flag (for testing)
   */
  async resetTrackingAsked() {
    await AsyncStorage.removeItem(TRACKING_ASKED_KEY);
    console.log('Tracking asked flag reset');
  }
}

export default new TrackingService();

