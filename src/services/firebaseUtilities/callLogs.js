import firestore from '@react-native-firebase/firestore';

/**
 * Get call logs for a specific user
 * @param {string} userId - The user ID to get call logs for
 * @returns {Promise<Array>} Array of call log objects
 */
export const getCallLogs = async (userId) => {
  try {
    console.log(`Fetching call logs for user: ${userId}`);
    
    // Query CallLogs collection for calls involving this user
    const callLogsRef = firestore().collection('CallLogs');
    const query = callLogsRef
      .where('members', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .limit(20); // Limit to last 20 calls
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      console.log('No call logs found');
      return [];
    }
    
    const callLogs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      callLogs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || Date.now()
      });
    });
    
    // Filter and sort like in the old project
    const filteredLogs = callLogs.filter((log) => {
      // Filter out outgoing calls and rejected calls unless they were made by current user
      return log.status !== 'onOutgoing' && log.status !== 'rejected' ||
             ((log.status === 'onOutgoing' || log.status === 'rejected') && log.callerId === userId);
    });
    
    // Sort by creation date (newest first)
    filteredLogs.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt;
      return bTime - aTime;
    });
    
    console.log(`Found ${filteredLogs.length} call logs after filtering`);
    return filteredLogs;
    
  } catch (error) {
    console.error('Error fetching call logs:', error);
    throw error;
  }
};

/**
 * Add a new call log entry
 * @param {Object} callData - Call data to log
 * @returns {Promise<string>} ID of the created call log
 */
export const addCallLog = async (callData) => {
  try {
    const callLogRef = await firestore().collection('CallLogs').add({
      ...callData,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Call log created with ID: ${callLogRef.id}`);
    return callLogRef.id;
    
  } catch (error) {
    console.error('Error adding call log:', error);
    throw error;
  }
};

/**
 * Update an existing call log
 * @param {string} callLogId - ID of the call log to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateCallLog = async (callLogId, updateData) => {
  try {
    await firestore().collection('CallLogs').doc(callLogId).update({
      ...updateData,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Call log updated: ${callLogId}`);
    
  } catch (error) {
    console.error('Error updating call log:', error);
    throw error;
  }
};

/**
 * Remove a call log entry
 * @param {string} callLogId - ID of the call log to remove
 * @returns {Promise<void>}
 */
export const removeCallLog = async (callLogId) => {
  try {
    await firestore().collection('CallLogs').doc(callLogId).delete();
    
    console.log(`Call log removed: ${callLogId}`);
    
  } catch (error) {
    console.error('Error removing call log:', error);
    throw error;
  }
};

/**
 * Create a call log when call starts
 * @param {Object} params - Call parameters
 * @returns {Promise<string>} ID of the created call log
 */
export const createCallLog = async ({
  callerId,
  callerName,
  receiverId,
  receiverName,
  type, // 'audio' or 'video'
  avatar
}) => {
  try {
    const callLogData = {
      callerId,
      callerName,
      receiverId,
      receiverName,
      type,
      avatar,
      status: 'onOutgoing', // Initial status
      members: [callerId, receiverId],
      duration: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    const callLogRef = await firestore().collection('CallLogs').add(callLogData);
    console.log(`Call log created with ID: ${callLogRef.id}`);
    return callLogRef.id;
    
  } catch (error) {
    console.error('Error creating call log:', error);
    throw error;
  }
};

/**
 * Update call log status when call ends
 * @param {string} callLogId - ID of the call log
 * @param {Object} params - Update parameters
 * @returns {Promise<void>}
 */
export const updateCallLogStatus = async (callLogId, {
  status, // 'ended', 'rejected', 'missed'
  duration = 0
}) => {
  try {
    if (!callLogId) {
      console.warn('No callLogId provided to updateCallLogStatus');
      return;
    }
    
    await firestore().collection('CallLogs').doc(callLogId).update({
      status,
      duration,
      updatedAt: firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Call log ${callLogId} updated to status: ${status}, duration: ${duration}s`);
    
  } catch (error) {
    console.error('Error updating call log status:', error);
    throw error;
  }
}; 