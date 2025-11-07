import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../navigation/rootNavigation';
import { routes } from './constants';
import localPushService from './localPushService';

class FCMService {
  constructor() {
    this.isInitialized = false;
    this.deviceToken = null;
  }

  /**
   * Initialize FCM service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('FCM: Initializing service...');
      
      // Initialize local push notification service
      localPushService.configurePushNotification();
      
      // Request permission (iOS only, Android handles it via local push notification service)
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('FCM: Permission not granted');
          return;
        }

        console.log('FCM: Authorization status:', authStatus);
      } else {
        console.log('FCM: Android - permissions handled by local push service');
      }

      // Set up message handlers first
      this.setupMessageHandlers();
      console.log('FCM: Message handlers set up');

      // Set up token refresh listener
      this.onTokenRefresh();
      console.log('FCM: Token refresh listener set up');

      // Try to get token
      console.log('FCM: Attempting to get token...');
      await this.getToken();
      console.log('FCM: Token retrieval completed');

      this.isInitialized = true;
      console.log('FCM: Service initialized successfully');
    } catch (error) {
      console.error('FCM: Error initializing service:', error);
      console.error('FCM: Initialize error details:', JSON.stringify(error));
      // Don't throw - allow app to continue even if FCM fails
      this.isInitialized = true; // Mark as initialized to prevent re-initialization loops
    }
  }


  /**
   * Register for push notifications and get token
   */
  async registerForPushNotificationsAsync(userId) {
    try {
      console.log('FCM: registerForPushNotificationsAsync called for userId:', userId);
      
      // On Android, skip permission request (handled by local push service)
      if (Platform.OS === 'android') {
        console.log('FCM: Android - skipping permission request in register');
      } else {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('FCM: Push permission not granted');
          return null;
        }
      }

      const fcmToken = await messaging().getToken();
      console.log('FCM: Got token in register:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'null');

      // Save token with delay to ensure user document exists
      if (userId && fcmToken) {
        console.log('FCM: Saving token to user:', userId);
        await this.saveTokenToUser(userId, fcmToken);
        console.log('FCM: Token saved successfully');
      }

      this.deviceToken = fcmToken;
      return fcmToken;
    } catch (error) {
      console.error('FCM: Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Check if push notifications are allowed
   */
  async checkNotificationPermission() {
    try {
      const authStatus = await messaging().hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('FCM: Error checking notification permission:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // Auto-registration is enabled by default on iOS

      const token = await messaging().getToken();
      
      if (token) {
        this.deviceToken = token;
        await AsyncStorage.setItem('fcm_token', token);
        }
        
        return { granted: true, token };
      } else {
        return { granted: false, token: null };
      }
    } catch (error) {
      console.error('FCM: Error requesting notification permission:', error);
      return { granted: false, token: null };
    }
  }

  /**
   * Save FCM token to user document in Firestore (using _deviceIds property like old project)
   */
  async saveTokenToUser(userId, token = null) {
    try {
      console.log('FCM: saveTokenToUser called with userId:', userId, 'token:', token ? token.substring(0, 20) + '...' : 'null');
      const fcmToken = token || this.deviceToken;
      
      if (!userId || !fcmToken) {
        console.warn('FCM: Cannot save token - missing userId or token');
        return false;
      }

      console.log('FCM: Waiting 1s for user document to exist...');
      // Wait a bit to ensure user document exists
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('FCM: Wait complete, fetching user document...');
      
      try {
      const userRef = firestore().collection('Users').doc(userId);
      console.log('FCM: Fetching user document for:', userId);
      const userDoc = await userRef.get();
      console.log('FCM: User document fetched, exists:', userDoc.exists);

      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('FCM: User data retrieved, has _deviceIds:', !!userData._deviceIds);
        
          // Status check is now done in auth state, not here
          
          // Initialize _deviceIds array if it doesn't exist (like old project)
        if (!userData._deviceIds) {
          userData._deviceIds = [];
        }

        // Add token if it's not already in the array
          if (!userData._deviceIds.includes(fcmToken)) {
            console.log('FCM: Adding new token to _deviceIds');
            userData._deviceIds.push(fcmToken);
          
          // Update user document
          console.log('FCM: Updating user document with new token...');
          await userRef.update({
            _deviceIds: userData._deviceIds
          });
          console.log('FCM: User document updated successfully');

          return true;
        } else {
          console.log('FCM: Token already exists in _deviceIds');
          return true;
        }
      } else {
        console.warn('FCM: User document does not exist:', userId);
          
          // Retry after another delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const retryUserDoc = await userRef.get();
            if (retryUserDoc.exists) {
              const userData = retryUserDoc.data();
              
              // Status check is now done in auth state, not here
              
              if (!userData._deviceIds) {
                userData._deviceIds = [];
              }

              if (!userData._deviceIds.includes(fcmToken)) {
                userData._deviceIds.push(fcmToken);
                
                await userRef.update({
                  _deviceIds: userData._deviceIds
                });

                return true;
              }
            }
          } catch (retryError) {
            console.error('FCM: Error saving token on retry:', retryError);
          }
        }
      } catch (error) {
        console.error('FCM: Error saving token:', error);
      }
      
      return false;
    } catch (error) {
      console.error('FCM: Error saving token to user:', error);
      return false;
    }
  }

  /**
   * Remove FCM token from user document
   */
  async removeTokenFromUser(userId) {
    try {
      if (!this.deviceToken || !userId) {
        return;
      }

      const userRef = firestore().collection('Users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        
        if (userData._deviceIds && userData._deviceIds.includes(this.deviceToken)) {
          const updatedDeviceIds = userData._deviceIds.filter(token => token !== this.deviceToken);
          
          await userRef.update({
            _deviceIds: updatedDeviceIds
          });

          console.log('FCM: Token removed from user document:', userId);
        }
      }
    } catch (error) {
      console.error('FCM: Error removing token from user:', error);
    }
  }

  /**
   * Get FCM token and store it
   */
  async getToken() {
    try {
      // Check if we have permission first (especially important for Android 13+)
      const hasPermission = await this.checkNotificationPermission();
      
      if (!hasPermission && Platform.OS === 'android') {
        console.log('FCM: No notification permission on Android, requesting...');
        const permissionResult = await this.requestNotificationPermission();
        if (!permissionResult.granted) {
          console.warn('FCM: Notification permission denied');
          return null;
        }
      }
      
      const token = await messaging().getToken();
      
      if (token) {
        this.deviceToken = token;
        
        // Store token locally
        await AsyncStorage.setItem('fcm_token', token);
        
        console.log('FCM: Token retrieved and stored:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.warn('FCM: No token returned from messaging().getToken()');
      }
    } catch (error) {
      console.error('FCM: Error getting token:', error);
    }
    return null;
  }

  /**
   * Set up message handlers
   */
  setupMessageHandlers() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('FCM: Message handled in the background:', remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('FCM: Message received in foreground:', remoteMessage);
      
      // Show local push notification for foreground messages
      this.showLocalPushNotification(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('FCM: Notification opened app:', remoteMessage);
      this.handleNotificationNavigation(remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('FCM: App opened from notification:', remoteMessage);
          this.handleNotificationNavigation(remoteMessage);
        }
      });
  }

  /**
   * Show local push notification for foreground messages
   */
  showLocalPushNotification(remoteMessage) {
    try {
      const notification = remoteMessage.notification;
      const data = remoteMessage.data;

      if (notification) {
        // Show local push notification instead of alert
        localPushService.showLocalNotification(
          notification.title || 'Desires',
          notification.body || 'You have a new message',
          data || {}
        );
      }
    } catch (error) {
      console.error('FCM: Error showing local push notification:', error);
    }
  }

  /**
   * Handle notification navigation based on data type (like old project)
   */
  handleNotificationNavigation(remoteMessage) {
    try {
      const data = remoteMessage.data || remoteMessage.notification?.data;
      
      if (!data) {
        console.log('FCM: No data found in notification');
        return;
      }

      console.log('FCM: Handling notification navigation with data:', data);

      // Navigate based on notification type (like old project)
      switch (data.type) {
        case 'FRIENDREQUEST':
        case 'friend':
        case 'friendRequest':
          console.log('FCM: Navigating to friend requests');
          navigate(routes.friendRequests);
          break;
          
        case 'LIKE':
        case 'like':
          console.log('FCM: Navigating to notifications');
          navigate(routes.notifications);
          break;
          
        case 'CHAT':
        case 'chat':
        case 'message':
          if (data.userId) {
            console.log('FCM: Navigating to chat with user:', data.userId);
            navigate(routes.chatScreen, { otherUserId: data.userId });
          } else {
            console.log('FCM: Navigating to chat list');
            navigate(routes.chat);
          }
          break;
          
        case 'PRIVATEGALLERY':
        case 'privateGallery':
          if (data.userId) {
            console.log('FCM: Navigating to user profile:', data.userId);
            navigate(routes.userProfile, { userId: data.userId });
          }
          break;
          
        case 'PRIVATEGALLERYREQUEST':
        case 'privateGalleryRequest':
          console.log('FCM: Navigating to InComingRequest page');
          navigate(routes.InComingRequest);
          break;
          
        case 'PRIVATEGALLERYANSWER':
        case 'privateGalleryAnswer':
          if (data.userId) {
            console.log('FCM: Navigating to user profile after gallery answer:', data.userId);
            navigate(routes.userProfile, { userId: data.userId });
          }
          break;
          
        case 'admin':
          console.log('FCM: Navigating to admin/backend');
          // Note: Admin routes might not be available in mobile app
          break;
          
        case 'call':
          if (data.callId) {
            console.log('FCM: Handling call notification - callId:', data.callId);
            console.log('FCM: Call data:', data);
            
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
            console.log('FCM: No callId in notification data');
          }
          break;
          
        case 'missedCall':
          console.log('FCM: Handling missed call notification');
          // Navigate to chat tab to show call logs
          navigate(routes.chat);
          break;
          
        default:
          console.log('FCM: Unknown notification type:', data.type);
          break;
      }
    } catch (error) {
      console.error('FCM: Error handling notification navigation:', error);
    }
  }

  /**
   * Subscribe to topic (for admin notifications)
   */
  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log('FCM: Subscribed to topic:', topic);
    } catch (error) {
      console.error('FCM: Error subscribing to topic:', error);
    }
  }

  /**
   * Unsubscribe from topic
   */
  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log('FCM: Unsubscribed from topic:', topic);
    } catch (error) {
      console.error('FCM: Error unsubscribing from topic:', error);
    }
  }

  /**
   * Handle token refresh
   */
  async onTokenRefresh() {
    messaging().onTokenRefresh(async token => {
      console.log('FCM: Token refreshed:', token);
      this.deviceToken = token;
      await AsyncStorage.setItem('fcm_token', token);
      
      // Save new token to user document if user is logged in
      // This will be called from auth actions
    });
  }

  /**
   * Get stored token
   */
  async getStoredToken() {
    try {
      return await AsyncStorage.getItem('fcm_token');
    } catch (error) {
      console.error('FCM: Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Clear stored token
   */
  async clearStoredToken() {
    try {
      await AsyncStorage.removeItem('fcm_token');
      this.deviceToken = null;
    } catch (error) {
      console.error('FCM: Error clearing stored token:', error);
    }
  }
}

export default new FCMService();