import localPushService from './localPushService';

/**
 * Test function for Local Push Notifications
 * Call this function to test if local push notifications are working
 */
export const testLocalPushNotification = () => {
  try {
    console.log('Testing Local Push Notification...');
    
    // Test notification with different types
    const testNotifications = [
      {
        title: 'Test Message',
        message: 'This is a test message notification',
        data: { type: 'chat', userId: 'test-user-123' }
      },
      {
        title: 'Friend Request',
        message: 'You have a new friend request',
        data: { type: 'friendRequest' }
      },
      {
        title: 'New Like',
        message: 'Someone liked your profile',
        data: { type: 'like' }
      }
    ];

    // Show first test notification
    const testNotification = testNotifications[0];
    localPushService.showLocalNotification(
      testNotification.title,
      testNotification.message,
      testNotification.data
    );

    console.log('Test notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error testing local push notification:', error);
    return false;
  }
};

/**
 * Test all notification types
 */
export const testAllNotificationTypes = () => {
  try {
    console.log('Testing all notification types...');
    
    const notificationTypes = [
      { type: 'chat', title: 'New Message', message: 'You have a new message' },
      { type: 'friendRequest', title: 'Friend Request', message: 'You have a new friend request' },
      { type: 'like', title: 'New Like', message: 'Someone liked your profile' },
      { type: 'privateGallery', title: 'Gallery Access', message: 'Someone requested gallery access' },
      { type: 'call', title: 'Incoming Call', message: 'You have an incoming call' }
    ];

    notificationTypes.forEach((notification, index) => {
      setTimeout(() => {
        localPushService.showLocalNotification(
          notification.title,
          notification.message,
          { type: notification.type, userId: 'test-user-123' }
        );
      }, index * 2000); // 2 second delay between notifications
    });

    console.log('All notification types tested');
    return true;
  } catch (error) {
    console.error('Error testing all notification types:', error);
    return false;
  }
};

/**
 * Test notification permissions
 */
export const testNotificationPermissions = async () => {
  try {
    console.log('Testing notification permissions...');
    
    const permissions = await localPushService.checkPermissions();
    console.log('Current permissions:', permissions);
    
    if (!permissions || !permissions.alert) {
      console.log('Requesting permissions...');
      const requestedPermissions = await localPushService.requestPermissions();
      console.log('Requested permissions:', requestedPermissions);
      return requestedPermissions;
    }
    
    return permissions;
  } catch (error) {
    console.error('Error testing notification permissions:', error);
    return null;
  }
};

export default {
  testLocalPushNotification,
  testAllNotificationTypes,
  testNotificationPermissions
};








