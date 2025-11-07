import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';
import { navigate } from '../navigation/rootNavigation';
import { routes } from './constants';

class LocalPushService {
  constructor() {
    this.isInitialized = false;
    this.configurePushNotification();
  }

  /**
   * Configure push notification settings
   */
  configurePushNotification() {
    if (this.isInitialized) return;

    try {
      console.log('LocalPush: Configuring push notifications...');

      // Configure push notification
      PushNotification.configure({
        // (optional) Called when Token is generated (iOS and Android)
        onRegister: function (token) {
          console.log('LocalPush: TOKEN:', token);
        },

        // (required) Called when a remote or local notification is opened or received
        onNotification: function (notification) {
          console.log('LocalPush: NOTIFICATION:', notification);
          
          // Handle notification tap
          if (notification.userInteraction) {
            console.log('LocalPush: Notification tapped');
            LocalPushService.handleNotificationTap(notification);
          }
        },

        // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
        onAction: function (notification) {
          console.log('LocalPush: ACTION:', notification.action);
          console.log('LocalPush: NOTIFICATION:', notification);
        },

        // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
        onRegistrationError: function(err) {
          console.error('LocalPush: Registration error:', err);
        },

        // IOS ONLY (optional): default: all - Permissions to register.
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },

        // Should the initial notification be popped automatically
        // default: true
        popInitialNotification: true,

        /**
         * (optional) default: true
         * - Specified if permissions (ios) and token (android and ios) will requested or not,
         * - if not, you must call PushNotificationsHandler.requestPermissions() later
         * - if you are not using remote notification or do not have Firebase installed, use this:
         *     requestPermissions: Platform.OS === 'ios'
         */
        requestPermissions: true, // Request permissions for both iOS and Android
      });

      // Create notification channels for Android
      if (Platform.OS === 'android') {
        // Main channel for all notifications
        PushNotification.createChannel(
          {
            channelId: "desires-notifications",
            channelName: "Desires Notifications",
            channelDescription: "Notifications for Desires app",
            playSound: true,
            soundName: "default",
            importance: 4, // IMPORTANCE_HIGH
            vibrate: true,
          },
          (created) => console.log(`LocalPush: Main channel created: ${created}`)
        );
        
        // FCM default channel (required by Firebase)
        PushNotification.createChannel(
          {
            channelId: "fcm_fallback_notification_channel",
            channelName: "Miscellaneous",
            channelDescription: "Default notification channel for Firebase",
            playSound: true,
            soundName: "default",
            importance: 4,
            vibrate: true,
          },
          (created) => console.log(`LocalPush: FCM fallback channel created: ${created}`)
        );
      }

      this.isInitialized = true;
      console.log('LocalPush: Service initialized successfully');
    } catch (error) {
      console.error('LocalPush: Error configuring push notifications:', error);
    }
  }

  /**
   * Show local push notification
   */
  showLocalNotification(title, message, data = {}) {
    try {
      console.log('LocalPush: Showing notification:', { title, message, data });

      PushNotification.localNotification({
        /* Android Only Properties */
        channelId: "desires-notifications",
        
        /* iOS and Android properties */
        title: title,
        message: message,
        playSound: true,
        soundName: 'default',
        largeIcon: "ic_launcher",
        smallIcon: "ic_notification",
        
        /* iOS only properties */
        badge: 1,
        
        /* Android only properties */
        priority: 'high',
        visibility: 'public',
        importance: 'high',
        
        /* Custom data */
        userInfo: data,
        
        /* Actions for Android */
        actions: '["View", "Dismiss"]',
        
        /* Notification ID */
        id: Date.now(),
      });

      console.log('LocalPush: Notification sent successfully');
    } catch (error) {
      console.error('LocalPush: Error showing notification:', error);
    }
  }

  /**
   * Handle notification tap
   */
  static handleNotificationTap(notification) {
    try {
      const data = notification.userInfo || notification.data;
      
      if (!data) {
        console.log('LocalPush: No data found in notification');
        return;
      }

      console.log('LocalPush: Handling notification tap with data:', data);

      // Navigate based on notification type
      switch (data.type) {
        case 'FRIENDREQUEST':
        case 'friend':
        case 'friendRequest':
          console.log('LocalPush: Navigating to friend requests');
          navigate(routes.friendRequests);
          break;
          
        case 'LIKE':
        case 'like':
          console.log('LocalPush: Navigating to notifications');
          navigate(routes.notifications);
          break;
          
        case 'CHAT':
        case 'chat':
        case 'message':
          if (data.userId) {
            console.log('LocalPush: Navigating to chat with user:', data.userId);
            navigate(routes.chatScreen, { otherUserId: data.userId });
          } else {
            console.log('LocalPush: Navigating to chat list');
            navigate(routes.chat);
          }
          break;
          
        case 'PRIVATEGALLERY':
        case 'privateGallery':
          if (data.userId) {
            console.log('LocalPush: Navigating to user profile:', data.userId);
            navigate(routes.userProfile, { userId: data.userId });
          }
          break;
          
        case 'PRIVATEGALLERYREQUEST':
        case 'privateGalleryRequest':
          console.log('LocalPush: Navigating to InComingRequest page');
          navigate(routes.InComingRequest);
          break;
          
        case 'PRIVATEGALLERYANSWER':
        case 'privateGalleryAnswer':
          if (data.userId) {
            console.log('LocalPush: Navigating to user profile after gallery answer:', data.userId);
            navigate(routes.userProfile, { userId: data.userId });
          }
          break;
          
        case 'admin':
          console.log('LocalPush: Navigating to admin/backend');
          break;
          
        case 'call':
          if (data.callId) {
            console.log('LocalPush: Handling call notification - callId:', data.callId);
            console.log('LocalPush: Call data:', data);
            
            // Navigate to incoming call screen with call data
            navigate(routes.incomingCall, {
              callData: {
                callId: data.callId,
                channelName: data.channelName,
                callerId: data.callerId,
                isAudioOnly: data.isAudioOnly === 'true' || data.isAudioOnly === true,
              }
            });
          } else {
            console.log('LocalPush: No callId in notification data');
          }
          break;
          
        case 'missedCall':
          console.log('LocalPush: Handling missed call notification');
          // Navigate to chat tab to show call logs
          navigate(routes.chat);
          break;
          
        default:
          console.log('LocalPush: Unknown notification type:', data.type);
          break;
      }
    } catch (error) {
      console.error('LocalPush: Error handling notification tap:', error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications() {
    try {
      PushNotification.cancelAllLocalNotifications();
      console.log('LocalPush: All notifications cleared');
    } catch (error) {
      console.error('LocalPush: Error clearing notifications:', error);
    }
  }

  /**
   * Get notification permissions
   */
  async checkPermissions() {
    try {
      const permissions = await PushNotification.checkPermissions();
      console.log('LocalPush: Permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('LocalPush: Error checking permissions:', error);
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      const permissions = await PushNotification.requestPermissions();
      console.log('LocalPush: Requested permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('LocalPush: Error requesting permissions:', error);
      return null;
    }
  }

  /**
   * Cancel specific notification
   */
  cancelNotification(id) {
    try {
      PushNotification.cancelLocalNotifications({ id: id.toString() });
      console.log('LocalPush: Notification cancelled:', id);
    } catch (error) {
      console.error('LocalPush: Error cancelling notification:', error);
    }
  }

  /**
   * Set application badge count
   */
  setBadgeCount(count) {
    try {
      PushNotification.setApplicationIconBadgeNumber(count);
      console.log('LocalPush: Badge count set to:', count);
    } catch (error) {
      console.error('LocalPush: Error setting badge count:', error);
    }
  }

  /**
   * Get application badge count
   */
  getBadgeCount() {
    try {
      PushNotification.getApplicationIconBadgeNumber((badgeCount) => {
        console.log('LocalPush: Current badge count:', badgeCount);
        return badgeCount;
      });
    } catch (error) {
      console.error('LocalPush: Error getting badge count:', error);
      return 0;
    }
  }
}

export default new LocalPushService();








