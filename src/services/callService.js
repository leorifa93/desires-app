import firestore from '@react-native-firebase/firestore';
import { sendPushNotification } from './notificationUtilities';
import callMinutesService from './callMinutesService';
import { createCallLog, updateCallLogStatus } from './firebaseUtilities/callLogs';

// Import all translations
const translations = {
  en: require('../locales/en.json'),
  de: require('../locales/de.json'),
  es: require('../locales/es.json'),
  fr: require('../locales/fr.json'),
};

// Helper to get translated text based on user's language
const getTranslation = (key, userLang = 'en') => {
  const lang = userLang?.toLowerCase() || 'en';
  return translations[lang]?.[key] || translations.en[key] || key;
};

class CallService {
  constructor() {
    this.activeCallListener = null;
  }

  /**
   * Initiate a call
   * @param {string} callerId - ID of the user making the call
   * @param {string} receiverId - ID of the user receiving the call
   * @param {object} callerData - Caller's user data
   * @param {boolean} isAudioOnly - true for audio call, false for video call
   * @returns {Promise<string>} - Call ID
   */
  async initiateCall(callerId, receiverId, callerData, isAudioOnly = false) {
    try {
      // Guard: require available free minutes before initiating a call
      if (!callMinutesService.hasCallMinutes(callerData)) {
        const err = new Error('No call minutes');
        err.code = 'NO_MINUTES';
        throw err;
      }

      // Create shorter channel name (max 64 chars for Agora)
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const callerShort = callerId.slice(0, 10);
      const receiverShort = receiverId.slice(0, 10);
      const channelName = `${callerShort}_${receiverShort}_${timestamp}`;
      
      // Get receiver data for call log and notifications
      const receiverDoc = await firestore().collection('Users').doc(receiverId).get();
      const receiverData = receiverDoc.data();
      
      // Create call log
      const callLogId = await createCallLog({
        callerId,
        callerName: callerData.username,
        receiverId,
        receiverName: receiverData?.username || 'Unknown',
        type: isAudioOnly ? 'audio' : 'video',
        avatar: receiverData?.profilePictures?.thumbnails?.medium || 
                receiverData?.profilePictures?.medium || 
                receiverData?.profilePictures?.original
      });
      
      console.log('Call: Call log created:', callLogId);
      
      // Create call document in Firestore
      const callRef = await firestore().collection('ActiveCalls').add({
        callerId,
        receiverId,
        channelName,
        isAudioOnly,
        status: 'ringing', // ringing, accepted, rejected, ended
        callLogId, // Link to call log
        createdAt: firestore.FieldValue.serverTimestamp(),
        callerData: {
          id: callerData.id,
          username: callerData.username,
          profilePicture: callerData.profilePictures?.thumbnails?.medium || null,
        },
        // Camera states for video calls (default: both cameras on)
        callerCameraEnabled: !isAudioOnly,
        receiverCameraEnabled: !isAudioOnly
      });

      console.log('Call: Call initiated with ID:', callRef.id);

      // Send push notification to receiver
      if (receiverData) {
        const receiverLang = receiverData._settings?.currentLang || 'en';
        
        const notificationPayload = {
          title: isAudioOnly 
            ? `📞 ${getTranslation('INCOMING_AUDIO_CALL', receiverLang)}`
            : `📹 ${getTranslation('INCOMING_VIDEO_CALL', receiverLang)}`,
          body: `${callerData.username} ${getTranslation('INCOMING_CALL_BODY', receiverLang)}`,
        };

        const notificationData = {
          type: 'call',
          callId: callRef.id,
          callerId,
          channelName,
          isAudioOnly: isAudioOnly.toString(),
        };

        await sendPushNotification(receiverData, notificationPayload, 'call', notificationData);
        console.log('Call: Push notification sent to receiver in language:', receiverLang);
      }

      // Auto-cancel call after 30 seconds if not answered
      setTimeout(async () => {
        const callDoc = await firestore().collection('ActiveCalls').doc(callRef.id).get();
        if (callDoc.exists && callDoc.data().status === 'ringing') {
          await this.endCall(callRef.id, 'missed');
          console.log('Call: Auto-cancelled after timeout - marked as missed');
          
          // Send missed call notification to receiver
          if (receiverData) {
            const receiverLang = receiverData._settings?.currentLang || 'en';
            
            const missedCallNotification = {
              title: isAudioOnly 
                ? `📞 ${getTranslation('MISSED_AUDIO_CALL', receiverLang)}`
                : `📹 ${getTranslation('MISSED_VIDEO_CALL', receiverLang)}`,
              body: `${getTranslation('MISSED_CALL_BODY', receiverLang)} ${callerData.username}`,
            };
            
            const notificationData = {
              type: 'missedCall',
              callerId,
              callerUsername: callerData.username,
            };
            
            await sendPushNotification(receiverData, missedCallNotification, 'missedCall', notificationData);
            console.log('Call: Missed call notification sent to receiver in language:', receiverLang);
          }
        }
      }, 30000);

      return {
        callId: callRef.id,
        channelName,
      };
    } catch (error) {
      console.error('Call: Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Accept a call
   * @param {string} callId - ID of the call
   */
  async acceptCall(callId) {
    try {
      const callDoc = await firestore().collection('ActiveCalls').doc(callId).get();
      
      // Check if document exists
      if (!callDoc.exists) {
        console.log('Call: Call document not found (already deleted):', callId);
        return; // Gracefully exit - call already ended/deleted
      }
      
      await firestore().collection('ActiveCalls').doc(callId).update({
        status: 'accepted',
        acceptedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Call: Call accepted:', callId);
    } catch (error) {
      console.error('Call: Error accepting call:', error);
      // Don't throw - allow cleanup to continue
    }
  }

  /**
   * Reject a call
   * @param {string} callId - ID of the call
   */
  async rejectCall(callId) {
    try {
      const callDoc = await firestore().collection('ActiveCalls').doc(callId).get();
      
      // Check if document exists
      if (!callDoc.exists) {
        console.log('Call: Call document not found (already deleted):', callId);
        return; // Gracefully exit - call already ended/deleted
      }
      
      const callData = callDoc.data();
      
      await firestore().collection('ActiveCalls').doc(callId).update({
        status: 'rejected',
        rejectedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Call: Call rejected:', callId);
      
      // Update call log
      if (callData?.callLogId) {
        await updateCallLogStatus(callData.callLogId, {
          status: 'rejected',
          duration: 0
        });
        console.log('Call: Call log updated to rejected');
      }

      // Delete call document after a delay
      setTimeout(async () => {
        try {
          await firestore().collection('ActiveCalls').doc(callId).delete();
        } catch (deleteError) {
          // Ignore deletion errors - document might already be deleted
          console.log('Call: Call document already deleted:', callId);
        }
      }, 5000);
    } catch (error) {
      console.error('Call: Error rejecting call:', error);
      // Don't throw - allow cleanup to continue
    }
  }

  /**
   * End a call
   * @param {string} callId - ID of the call
   * @param {string} reason - Reason for ending (ended, missed, etc.)
   */
  async endCall(callId, reason = 'ended') {
    try {
      const callDoc = await firestore().collection('ActiveCalls').doc(callId).get();
      
      // Check if document exists
      if (!callDoc.exists) {
        console.log('Call: Call document not found (already deleted):', callId);
        return; // Gracefully exit - call already ended/deleted
      }
      
      const callData = callDoc.data();
      
      await firestore().collection('ActiveCalls').doc(callId).update({
        status: reason,
        endedAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Call: Call ended:', callId, 'Reason:', reason);
      
      // Update call log if it was missed (timeout)
      if (callData?.callLogId && reason === 'missed') {
        await updateCallLogStatus(callData.callLogId, {
          status: 'missed',
          duration: 0
        });
        console.log('Call: Call log updated to missed');
      }
      // Note: 'ended' status is handled in the call screens with actual duration

      // Delete call document after a delay
      setTimeout(async () => {
        try {
          await firestore().collection('ActiveCalls').doc(callId).delete();
        } catch (deleteError) {
          // Ignore deletion errors - document might already be deleted
          console.log('Call: Call document already deleted:', callId);
        }
      }, 5000);
    } catch (error) {
      console.error('Call: Error ending call:', error);
      // Don't throw - allow cleanup to continue
    }
  }

  /**
   * Listen for incoming calls for a specific user
   * @param {string} userId - ID of the user
   * @param {function} onIncomingCall - Callback when incoming call is received
   */
  listenForIncomingCalls(userId, onIncomingCall) {
    console.log('Call: Setting up incoming call listener for user:', userId);

    // Remove existing listener if any
    if (this.activeCallListener) {
      this.activeCallListener();
    }

    // Set up new listener
    this.activeCallListener = firestore()
      .collection('ActiveCalls')
      .where('receiverId', '==', userId)
      .where('status', '==', 'ringing')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const callData = {
              callId: change.doc.id,
              ...change.doc.data(),
            };
            console.log('Call: Incoming call detected:', callData);
            onIncomingCall(callData);
          }
        });
      }, error => {
        console.error('Call: Error listening for incoming calls:', error);
      });
  }

  /**
   * Listen for call status changes (for caller)
   * @param {string} callId - ID of the call
   * @param {function} onStatusChange - Callback when status changes
   */
  listenForCallStatus(callId, onStatusChange) {
    console.log('Call: Setting up call status listener for call:', callId);

    return firestore()
      .collection('ActiveCalls')
      .doc(callId)
      .onSnapshot(doc => {
        if (doc.exists) {
          const callData = {
            callId: doc.id,
            ...doc.data(),
          };
          console.log('Call: Status changed:', callData.status);
          onStatusChange(callData);
        } else {
          console.log('Call: Call document deleted');
          onStatusChange({ status: 'ended' });
        }
      }, error => {
        console.error('Call: Error listening for call status:', error);
      });
  }

  /**
   * Remove incoming call listener
   */
  removeIncomingCallListener() {
    if (this.activeCallListener) {
      this.activeCallListener();
      this.activeCallListener = null;
      console.log('Call: Incoming call listener removed');
    }
  }
}

export default new CallService();

