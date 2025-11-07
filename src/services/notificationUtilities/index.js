import firestore from '@react-native-firebase/firestore';

// Optional CometChat import - may not be available
let CometChat;
try {
  const cometChatModule = require('@cometchat/chat-sdk-javascript');
  CometChat = cometChatModule.CometChat;
} catch (e) {
  console.log('CometChat not available');
  CometChat = null;
}

/**
 * Calculate badge count for user
 * Includes: friend requests, unread messages, private gallery requests
 */
export const calculateBadge = async (user) => {
  let badge = 0;

  try {
    // Count friend requests
    if (user._friendRequests && Array.isArray(user._friendRequests)) {
      badge += user._friendRequests.length;
    }

    // Count unread messages from CometChat
    if (CometChat) {
      try {
        // Check if CometChat is initialized
        const isInitialized = typeof CometChat.isInitialized === 'function' 
          ? CometChat.isInitialized() 
          : true;
          
        if (isInitialized) {
          const unreadMessages = await CometChat.getUnreadMessageCountForAllUsers();
          if (unreadMessages) {
            badge += Object.keys(unreadMessages).length;
          }
        }
      } catch (chatError) {
        console.log('CometChat not available or error getting unread count:', chatError);
      }
    }

    // Count private gallery requests
    if (user._privateGalleryRequests && Array.isArray(user._privateGalleryRequests)) {
      badge += user._privateGalleryRequests.length;
    }
  } catch (error) {
    console.error('Error calculating badge:', error);
  }

  return badge;
};

/**
 * Send push notification via backend API
 */
export const sendPushNotification = async (sentTo, payload, type, data) => {
  try {
    // Check if user has device IDs
    if (!sentTo._deviceIds || sentTo._deviceIds.length === 0) {
      console.log('User has no device IDs, skipping notification');
      return false;
    }

    // Check notification settings
    if (type === 'friend' && !sentTo._settings?.notifications?.friendRequests) {
      console.log('User has friend request notifications disabled');
      return false;
    }
    if (type === 'messages' && !sentTo._settings?.notifications?.messages) {
      console.log('User has message notifications disabled');
      return false;
    }
    if (type === 'likes' && !sentTo._settings?.notifications?.likes) {
      console.log('User has likes notifications disabled');
      return false;
    }

    // Set default title
    if (!payload.title) {
      payload.title = 'Desires';
    }

    // Extract badge before creating notification (badge is not allowed in notification object)
    const badge = payload.badge;

    // Create notification object WITHOUT badge (badge causes error)
    // But WITH userId for backend processing
    const notification = {
      title: payload.title,
      body: payload.body,
      userId: sentTo.id,  // ✅ userId für Backend
      click_action: 'FCM_PLUGIN_ACTIVITY',
    };

    // Create request body
    const body = {
      registration_ids: sentTo._deviceIds,
      notification: notification,
    };
    
    // Add badge to body (backend will use it for apns payload)
    if (badge) {
      body.badge = badge;
    }

    // Add data if provided
    if (data) {
      body.data = data;
    }

    // Determine API URL (production)
    const apiUrl = 'https://push-sendMessage-ytbcdg7bga-uc.a.run.app';

    console.log('Sending push notification to:', apiUrl);
    console.log('Notification payload:', {
      registration_ids: sentTo._deviceIds.length + ' devices',
      notification: notification,
      data: data,
    });

    // Send notification
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send notification:', response.status, errorText);
      return false;
    }

    console.log('Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Get translations for a specific language
 */
export const getTranslationsForLanguage = async (lang, keys) => {
  try {
    const translations = {};
    
    // Load translation file dynamically
    let translationFile;
    switch (lang) {
      case 'de':
        translationFile = require('../../locales/de.json');
        break;
      case 'es':
        translationFile = require('../../locales/es.json');
        break;
      case 'fr':
        translationFile = require('../../locales/fr.json');
        break;
      default:
        translationFile = require('../../locales/en.json');
    }

    // Get requested keys
    if (Array.isArray(keys)) {
      keys.forEach(key => {
        translations[key] = translationFile[key] || key;
      });
    } else {
      return translationFile;
    }

    return translations;
  } catch (error) {
    console.error('Error loading translations:', error);
    return {};
  }
};

