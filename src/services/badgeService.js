import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class BadgeService {
  constructor() {
    this.initialize();
  }

  initialize() {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      }).then((permissions) => {
        console.log('Badge permissions:', permissions);
      }).catch((error) => {
        console.error('Error requesting badge permissions:', error);
      });
    }
  }

  /**
   * Calculate total badge count from user data
   * @param {Object} user - User object with badges and requests
   * @returns {number} Total badge count
   */
  calculateBadgeCount(user) {
    if (!user) return 0;

    let badgeCount = 0;

    // Add likes badge count
    if (user._badges?.likes) {
      badgeCount += user._badges.likes;
    }

    // Add friend requests count
    if (user._friendRequests?.length) {
      badgeCount += user._friendRequests.length;
    }

    // Add private gallery requests count
    if (user._privateGalleryRequests?.length) {
      badgeCount += user._privateGalleryRequests.length;
    }

    // Note: Unread messages are handled separately in CometChat
    // and would need to be added here if needed

    return badgeCount;
  }

  /**
   * Set app icon badge count
   * @param {number} count - Badge count to set
   */
  setBadgeCount(count) {
    try {
      if (Platform.OS === 'ios') {
        PushNotificationIOS.setApplicationIconBadgeNumber(count);
      } else if (Platform.OS === 'android') {
        // Android badge setting using react-native-push-notification
        PushNotification.setApplicationIconBadgeNumber(count);
      }
      console.log('Badge count set to:', count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Clear app icon badge
   */
  clearBadge() {
    try {
      if (Platform.OS === 'ios') {
        PushNotificationIOS.setApplicationIconBadgeNumber(0);
      } else if (Platform.OS === 'android') {
        // Android badge clearing using react-native-push-notification
        PushNotification.setApplicationIconBadgeNumber(0);
      }
      console.log('Badge cleared');
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Update badge based on user data
   * @param {Object} user - User object
   */
  updateBadge(user) {
    const badgeCount = this.calculateBadgeCount(user);
    this.setBadgeCount(badgeCount);
    return badgeCount;
  }
}

export default new BadgeService();
