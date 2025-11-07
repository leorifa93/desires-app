import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { auth } from '../../../firebaseConfig';
import { getDocumentById, updateDocument, getDocuments } from './firestore';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export const getCurrentUser = async () => {
    const currentUser = getAuth().currentUser;

    if (currentUser) {
        const user = await getDocumentById({collection: 'Users', id: currentUser.uid});

        return user;
    } else {
        return null;
    }
}

export const getUsersByDistance = async (currentLocation, distance = 10, filters = [], order = null, limitOffset = null, offset = null) => {
    try {
        if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
            throw new Error('Invalid currentLocation provided to getUsersByDistance');
        }
        
        const center = [currentLocation.lat, currentLocation.lng];
        const bounds = geohashQueryBounds(center, distance * 1000);
        const promises = [];

    for (const b of bounds) {
        let q = firestore().collection('Users');

        // Add filters
        if (filters && filters.length > 0) {
            for (let filter of filters) {
                if (filter.value !== undefined && filter.value !== null) {
                    q = q.where(filter.key, filter.opr, filter.value);
                }
            }
        }

            // Use geohash for location filtering (like old project)
        q = q.orderBy('currentLocation.hash', 'asc');
        q = q.startAt(b[0]);
        q = q.endAt(b[1]);
            
            // Only add limit if explicitly provided (like old project)
            if (limitOffset) {
                q = q.limit(limitOffset);
            }

        promises.push(q.get());
    }

    const snapshots = await Promise.all(promises);

        
        // Filter by distance and return unsorted users (like old project)
    const users = [];
        let totalDocs = 0;
        
    for (const snap of snapshots) {
            totalDocs += snap.docs.length;
        for (const doc of snap.docs) {
            const data = doc.data();
            const lat = data.currentLocation?.lat;
            const lng = data.currentLocation?.lng;

            if (lat && lng) {
                const distanceInKm = distanceBetween([lat, lng], center);
                const distanceInM = distanceInKm * 1000;

                if (distanceInM <= distance * 1000) {
                        users.push({...data, id: doc.id, distanceInMeters: distanceInM});
                    } else {
                    }
                }
            }
        }

        
        // Show distance statistics
        if (users.length > 0) {
            const distances = users.map(u => u.distanceInMeters / 1000);
            const maxDistance = Math.max(...distances);
            const minDistance = Math.min(...distances);
    }

        return users;
    } catch (error) {
        console.error('Error in getUsersByDistance:', error);
        return [];
    }
};

// Get users with proper sorting by membership and lastBoostAt (like old project)
export const getStandardUsers = async (limit = 10, filters = [], isOnSnapshot = false, callback = null) => {
    try {
        console.log('getStandardUsers called with:', { limit, filters, isOnSnapshot });
        
        let q = firestore().collection('Users');

        // Add filters
        if (filters && filters.length > 0) {
            for (let filter of filters) {
                if (filter.value !== undefined && filter.value !== null) {
                    if (filter.key === 'id') {
                        // Use documentId() for id field filtering
                        q = q.where(firestore.FieldPath.documentId(), filter.opr, filter.value);
                    } else {
                        q = q.where(filter.key, filter.opr, filter.value);
                    }
                }
            }
        }

        // Don't use orderBy when filtering by id (like old project - it also sorts in JavaScript)
        // This avoids index conflicts with 'id in [...]' filter
        q = q.limit(limit);

        console.log('Query created, executing...');
        console.log('Query filters:', filters);

        if (isOnSnapshot && callback) {
            console.log('Creating snapshot listener...');
            return q.onSnapshot(
                (snapshot) => {
                    console.log('Snapshot received:', snapshot.docs.length, 'docs');
                    
                    // Sort by membership first (desc), then by lastBoostAt (desc) - like old project for home page
                    const sortedDocs = snapshot.docs.sort((a, b) => {
                        const dataA = a.data();
                        const dataB = b.data();
                        
                        // First sort by membership (higher membership first)
                        if (dataA.membership !== dataB.membership) {
                            return (dataB.membership || 0) - (dataA.membership || 0);
                        }
                        // Then sort by lastBoostAt (more recent first)
                        return (dataB.lastBoostAt || 0) - (dataA.lastBoostAt || 0);
                    });
                    
                    console.log('Sorted', sortedDocs.length, 'docs by membership and lastBoostAt');
                    
                    // Create mock snapshot with sorted docs
                    const mockSnapshot = {
                        docs: sortedDocs,
                        docChanges: snapshot.docChanges,
                        metadata: snapshot.metadata,
                        query: snapshot.query,
                        size: snapshot.size,
                        empty: snapshot.empty
                    };
                    
                    callback(mockSnapshot);
                },
                (error) => {
                    console.error('Snapshot error:', error);
                    if (callback) callback({ docs: [] });
                }
            );
        } else {
            const snapshot = await q.get();
            const users = [];
            
            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                data.id = doc.id;
                data.doc = doc;
                users.push(data);
            });

            // Sort by membership first (desc), then by lastBoostAt (desc) - like old project for home page
            users.sort((a, b) => {
                // First sort by membership (higher membership first)
                if (a.membership !== b.membership) {
                    return (b.membership || 0) - (a.membership || 0);
                }
                // Then sort by lastBoostAt (more recent first)
                return (b.lastBoostAt || 0) - (a.lastBoostAt || 0);
            });

            console.log('getStandardUsers returning:', users.length, 'sorted users');
            return users;
        }
    } catch (error) {
        console.error('Error in getStandardUsers:', error);
        return [];
    }
};

// Separate function to filter users by distance
const filterUsersByDistance = (docs, center, maxDistance) => {
    const users = [];
    
    for (const doc of docs) {
        const data = doc.data();
        const lat = data.currentLocation?.lat;
        const lng = data.currentLocation?.lng;

        if (lat && lng) {
            const distanceInKm = distanceBetween([lat, lng], center);
            const distanceInM = distanceInKm * 1000;

            if (distanceInM <= maxDistance * 1000) {
                users.push({...data, distanceInMeters: distanceInM});
            }
        }
    }

    return users;
};

export const getUser = async (userId) => {
    try {
        const doc = await firestore()
            .collection('Users')
            .doc(userId)
            .get();

        if (doc.exists) {
            return {
                id: doc.id,
                ...doc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
};

export const updateUser = async (userId, userData) => {
    return await updateDocument({
        collection: 'Users',
        id: userId,
        data: userData
    });
};

export const getRangPosition = async (user, filter = { perimeterValue: 100 }) => {
    // Load fresh user data from Firestore to ensure we have the latest lastBoostAt
    let freshUserData = user;
    if (user?.id) {
        try {
            const userDoc = await firestore().collection('Users').doc(user.id).get();
            if (userDoc.exists) {
                freshUserData = { id: userDoc.id, ...userDoc.data() };
            }
        } catch (error) {
            // Fall back to provided user data
        }
    }
    
    // Always use currentLocation (like old project)
    const baseLocation = freshUserData?.currentLocation;
    
    if (!freshUserData || !baseLocation || !baseLocation.lat || !baseLocation.lng) {
        return 1;
    }

    // Only add filters if the values are defined, not null, and not empty strings
    const queryFilter = [];
    
    // Validate gender before adding to filter
    if (typeof freshUserData.gender === 'number' && freshUserData.gender >= 0) {
        queryFilter.push({
            key: 'gender',
            opr: '==',
            value: freshUserData.gender
        });
    }
    
    // Validate membership before adding to filter
    if (typeof freshUserData.membership === 'number' && freshUserData.membership >= 0) {
        const membershipFilter = freshUserData.membership === 1 ? 1 : freshUserData.membership;
        queryFilter.push({
            key: 'membership',
            opr: '==',
            value: membershipFilter
        });
    }

    try {
        let usersByDistance = await getUsersByDistance(
            baseLocation,
            filter.perimeterValue ? filter.perimeterValue : 100,
            queryFilter
        );

        // Sort users by lastBoostAt (desc) only - like old project
        usersByDistance = usersByDistance.sort((a, b) => {
            return a.lastBoostAt < b.lastBoostAt ? 1 : -1;
        });

        if (usersByDistance.length > 0) {
            let rang = 1;

            for (let userItem of usersByDistance) {
                if (userItem.id === freshUserData.id) {
                    break;
                }
                rang++;
            }

            return rang;
        } else {
            return 1;
        }
    } catch (error) {
        console.error('Error in getRangPosition:', error);
        return 1; // Return default position on error
    }
};

/**
 * Get multiple users by their IDs
 * @param {Array<string>} userIds - Array of user IDs to fetch
 * @returns {Promise<Array>} Array of user objects
 */
export const getUsersByIds = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    console.log(`Fetching ${userIds.length} users by IDs`);
    
    // Split into chunks of 10 (Firestore 'in' query limit)
    const chunks = [];
    for (let i = 0; i < userIds.length; i += 10) {
      chunks.push(userIds.slice(i, i + 10));
    }

    const promises = chunks.map(chunk => {
      const usersRef = firestore().collection('Users');
      const ids = chunk.map(id => String(id));
      const query = usersRef.where(firestore.FieldPath.documentId(), 'in', ids);
      return query.get();
    });

    const snapshots = await Promise.all(promises);
    
    const users = [];
    snapshots.forEach(snapshot => {
      snapshot.forEach(doc => {
        const userData = doc.data();
        
        // Ensure all required fields are present
        const user = {
          id: doc.id,
          username: userData.username || 'Unknown',
          age: userData.age || 0,
          currentLocation: userData.currentLocation || {},
          profilePictures: userData.profilePictures || {},
          ShowOnline: userData.ShowOnline || false,
          // Remove distance as it's not needed and causes display issues
          ...userData
        };
        
        // Ensure profilePictures has the correct structure
        if (!user.profilePictures.thumbnails) {
          user.profilePictures.thumbnails = {
            small: null,
            medium: null,
            big: null
          };
        }
        
        users.push(user);
      });
    });

    // Sort by username to match the old project behavior
    users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

    console.log(`Successfully fetched ${users.length} users`);
    return users;
    
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    throw error;
  }
};

/**
 * Send a friend request from one user to another
 * @param {Object} fromUser - The user sending the request
 * @param {Object} toUser - The user receiving the request
 * @returns {Promise<void>}
 */
export const sendFriendRequest = async (fromUser, toUser) => {
  try {
    const batch = firestore().batch();
    
    // Add to sender's sent requests
    const senderRef = firestore().collection('Users').doc(fromUser.id);
    batch.update(senderRef, {
      _sentFriendRequests: firestore.FieldValue.arrayUnion(toUser.id)
    });
    
    // Add to receiver's friend requests
    const receiverRef = firestore().collection('Users').doc(toUser.id);
    batch.update(receiverRef, {
      _friendRequests: firestore.FieldValue.arrayUnion(fromUser.id)
    });
    
    await batch.commit();
    console.log(`Friend request sent from ${fromUser.username} to ${toUser.username}`);
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 * @param {Object} fromUser - The user who sent the request
 * @param {Object} toUser - The user accepting the request
 * @returns {Promise<void>}
 */
export const acceptFriendRequest = async (fromUser, toUser) => {
  try {
    const batch = firestore().batch();
    
    // Remove from receiver's friend requests
    const receiverRef = firestore().collection('Users').doc(toUser.id);
    batch.update(receiverRef, {
      _friendRequests: firestore.FieldValue.arrayRemove(fromUser.id)
    });
    
    // Remove from sender's sent requests
    const senderRef = firestore().collection('Users').doc(fromUser.id);
    batch.update(senderRef, {
      _sentFriendRequests: firestore.FieldValue.arrayRemove(toUser.id)
    });
    
    // Add to both users' friends list
    batch.update(receiverRef, {
      _friendsList: firestore.FieldValue.arrayUnion(fromUser.id)
    });
    
    batch.update(senderRef, {
      _friendsList: firestore.FieldValue.arrayUnion(toUser.id)
    });
    
    await batch.commit();
    console.log(`Friend request accepted between ${fromUser.username} and ${toUser.username}`);
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Reject/remove a friend request
 * @param {Object} fromUser - The user who sent the request
 * @param {Object} toUser - The user rejecting the request
 * @returns {Promise<void>}
 */
export const rejectFriendRequest = async (fromUser, toUser) => {
  try {
    const batch = firestore().batch();
    
    // Remove from receiver's friend requests
    const receiverRef = firestore().collection('Users').doc(toUser.id);
    batch.update(receiverRef, {
      _friendRequests: firestore.FieldValue.arrayRemove(fromUser.id)
    });
    
    // Remove from sender's sent requests
    const senderRef = firestore().collection('Users').doc(fromUser.id);
    batch.update(senderRef, {
      _sentFriendRequests: firestore.FieldValue.arrayRemove(toUser.id)
    });
    
    await batch.commit();
    console.log(`Friend request rejected between ${fromUser.username} and ${toUser.username}`);
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

/**
 * Remove a friend request (cancel sent request)
 * @param {Object} fromUser - The user who sent the request
 * @param {Object} toUser - The user who received the request
 * @returns {Promise<void>}
 */
export const removeFriendRequest = async (fromUser, toUser) => {
  try {
    const batch = firestore().batch();
    
    // Remove from sender's sent requests
    const senderRef = firestore().collection('Users').doc(fromUser.id);
    batch.update(senderRef, {
      _sentFriendRequests: firestore.FieldValue.arrayRemove(toUser.id)
    });
    
    // Remove from receiver's friend requests
    const receiverRef = firestore().collection('Users').doc(toUser.id);
    batch.update(receiverRef, {
      _friendRequests: firestore.FieldValue.arrayRemove(fromUser.id)
    });
    
    await batch.commit();
    console.log(`Friend request removed between ${fromUser.username} and ${toUser.username}`);
  } catch (error) {
    console.error('Error removing friend request:', error);
    throw error;
  }
};

/**
 * End friendship between two users
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @returns {Promise<void>}
 */
export const endFriendship = async (user1, user2) => {
  try {
    const batch = firestore().batch();
    
    // Remove from both users' friends list
    const user1Ref = firestore().collection('Users').doc(user1.id);
    batch.update(user1Ref, {
      _friendsList: firestore.FieldValue.arrayRemove(user2.id)
    });
    
    const user2Ref = firestore().collection('Users').doc(user2.id);
    batch.update(user2Ref, {
      _friendsList: firestore.FieldValue.arrayRemove(user1.id)
    });
    
    await batch.commit();
    console.log(`Friendship ended between ${user1.username} and ${user2.username}`);
  } catch (error) {
    console.error('Error ending friendship:', error);
    throw error;
  }
};