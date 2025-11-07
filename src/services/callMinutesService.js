import firestore from '@react-native-firebase/firestore';
import { Alert } from 'react-native';

class CallMinutesService {
  constructor() {
    this.callInterval = null;
    this.currentCallId = null;
    this.onMinutesEmpty = null;
  }

  /**
   * Check if user has available call minutes
   * @param {object} user - User object
   * @returns {boolean}
   */
  hasCallMinutes(user) {
    if (!user) return false;
    
    const minutes = user.availableCallMinutes || 0;
    const parsedMinutes = typeof minutes === 'string' ? parseInt(minutes) : minutes;
    
    return parsedMinutes > 0;
  }

  /**
   * Get available call minutes for user
   * @param {object} user - User object
   * @returns {number}
   */
  getAvailableMinutes(user) {
    if (!user) return 0;
    
    const minutes = user.availableCallMinutes || 0;
    return typeof minutes === 'string' ? parseInt(minutes) : minutes;
  }

  /**
   * Start tracking call minutes
   * @param {string} userId - Current user ID
   * @param {string} callId - Call ID
   * @param {function} onMinutesEmptyCallback - Callback when minutes run out
   */
  async startCallMinutesTracking(userId, callId, onMinutesEmptyCallback) {
    console.log('CallMinutesService: Starting call minutes tracking for user:', userId, 'callId:', callId);
    
    // Prevent double start - if already tracking this call, skip
    if (this.callInterval && this.currentCallId === callId) {
      console.log('CallMinutesService: Already tracking this call, skipping');
      return;
    }
    
    // Stop any previous tracking
    if (this.callInterval) {
      console.log('CallMinutesService: Stopping previous tracking before starting new one');
      this.stopCallMinutesTracking();
    }
    
    this.currentCallId = callId;
    this.onMinutesEmpty = onMinutesEmptyCallback;

    // Reduce first minute immediately when call starts
    console.log('CallMinutesService: Reducing first minute immediately');
    await this.reduceMinute(userId);

    // Then reduce every 60 seconds
    this.callInterval = setInterval(async () => {
      await this.reduceMinute(userId);
    }, 60000); // 60 seconds
  }

  /**
   * Reduce one minute from user's available call minutes
   * @param {string} userId - User ID
   */
  async reduceMinute(userId) {
    try {
      const userRef = firestore().collection('Users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.error('CallMinutesService: User not found');
        return;
      }

      const user = userDoc.data();
      let currentMinutes = user.availableCallMinutes || 0;
      
      if (typeof currentMinutes === 'string') {
        currentMinutes = parseInt(currentMinutes);
      }

      if (currentMinutes > 0) {
        currentMinutes--;
        
        await userRef.update({
          availableCallMinutes: currentMinutes
        });
        
        console.log('CallMinutesService: Reduced minute. Remaining:', currentMinutes);

        // Check if minutes are empty
        if (currentMinutes === 0) {
          console.log('CallMinutesService: ⚠️ Minutes reached ZERO - stopping tracking and calling callback');
          this.stopCallMinutesTracking();
          
          if (this.onMinutesEmpty) {
            console.log('CallMinutesService: Calling onMinutesEmpty callback');
            this.onMinutesEmpty();
          } else {
            console.warn('CallMinutesService: No onMinutesEmpty callback registered!');
          }
        }
      } else {
        // No minutes left
        console.log('CallMinutesService: No minutes left');
        this.stopCallMinutesTracking();
        
        if (this.onMinutesEmpty) {
          this.onMinutesEmpty();
        }
      }
    } catch (error) {
      console.error('CallMinutesService: Error reducing minute:', error);
    }
  }

  /**
   * Stop tracking call minutes
   */
  stopCallMinutesTracking() {
    console.log('CallMinutesService: Stopping call minutes tracking');
    
    if (this.callInterval) {
      clearInterval(this.callInterval);
      this.callInterval = null;
    }
    
    this.currentCallId = null;
    this.onMinutesEmpty = null;
  }

  /**
   * Add call minutes to user
   * @param {string} userId - User ID
   * @param {number} minutes - Minutes to add
   */
  async addMinutesToUser(userId, minutes) {
    try {
      const userRef = firestore().collection('Users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const user = userDoc.data();
      let currentMinutes = user.availableCallMinutes || 0;
      
      if (typeof currentMinutes === 'string') {
        currentMinutes = parseInt(currentMinutes);
      }

      const newMinutes = currentMinutes + minutes;
      
      await userRef.update({
        availableCallMinutes: newMinutes
      });

      console.log('CallMinutesService: Added', minutes, 'minutes. New total:', newMinutes);
      
      return newMinutes;
    } catch (error) {
      console.error('CallMinutesService: Error adding minutes:', error);
      throw error;
    }
  }

  /**
   * Show alert when user has no call minutes
   * @param {function} onBuyPressed - Callback when buy button is pressed
   * @param {object} translations - Translation function
   */
  showNoMinutesAlert(onBuyPressed, t) {
    Alert.alert(
      t('NO_CALL_MINUTES_TITLE'),
      t('NO_CALL_MINUTES_MESSAGE'),
      [
        {
          text: t('BUY_MINUTES'),
          onPress: onBuyPressed,
        },
        {
          text: t('CANCEL'),
          style: 'cancel',
        },
      ]
    );
  }

  /**
   * Show alert when minutes run out during call
   * @param {function} onBuyPressed - Callback when buy button is pressed
   * @param {object} translations - Translation function
   */
  showMinutesEmptyAlert(onBuyPressed, t) {
    Alert.alert(
      t('CALL_MINUTES_EMPTY_TITLE'),
      t('CALL_MINUTES_EMPTY_MESSAGE'),
      [
        {
          text: t('BUY_MINUTES'),
          onPress: onBuyPressed,
        },
        {
          text: t('CANCEL'),
          style: 'cancel',
        },
      ]
    );
  }
}

export default new CallMinutesService();

