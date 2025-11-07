import firestore from '@react-native-firebase/firestore';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';

/**
 * Get users by distance using Firestore geohash queries
 * Based on the old Angular project's user-collection.service.ts
 */
export const getUsersByDistance = async (
  currentLocation,
  distance = 10,
  filters = [],
  order = null,
  limitOffset = null,
  offset = null
) => {
  try {
    const center = [currentLocation.lat, currentLocation.lng];
    const bounds = geohashQueryBounds(center, distance * 1000);
    const promises = [];
    let queryFilters = [];
    let queryOrders = [];

    // Add filters
    if (filters && filters.length > 0) {
      for (let filter of filters) {
        queryFilters.push(
          firestore()
            .collection('Users')
            .where(filter.key, filter.opr, filter.value)
        );
      }
    }

    // Add ordering
    if (order) {
      if (typeof order === 'object') {
        for (let o of order) {
          queryOrders.push(firestore().collection('Users').orderBy(o.key, o.descending ? 'desc' : 'asc'));
        }
      } else {
        queryOrders.push(firestore().collection('Users').orderBy(order, 'desc'));
      }
    }

    // Add offset for pagination
    if (offset) {
      queryFilters.push(firestore().collection('Users').startAfter(offset));
    }

    // Add limit
    if (limitOffset) {
      queryFilters.push(firestore().collection('Users').limit(limitOffset));
    }

    // Create queries for each geohash bound
    for (const b of bounds) {
      let query = firestore().collection('Users');

      // Apply ordering (default to geohash, then membership, then lastBoostAt)
      query = query.orderBy('currentLocation.hash');
      query = query.orderBy('membership', 'desc');
      query = query.orderBy('lastBoostAt', 'desc');

      // Apply filters
      for (let filter of filters) {
        query = query.where(filter.key, filter.opr, filter.value);
      }

      // Apply geohash bounds
      if (!offset) {
        query = query.startAt(b[0]);
      }
      query = query.endAt(b[1]);

      promises.push(query.get());
    }

    const snapshots = await Promise.all(promises);

    const users = [];
    for (const snap of snapshots) {
      for (const doc of snap.docs) {
        const userData = doc.data();
        const lat = userData.currentLocation?.lat;
        const lng = userData.currentLocation?.lng;

        if (lat && lng) {
          const distanceInKm = distanceBetween([lat, lng], center);
          const distanceInM = distanceInKm * 1000;

          if (distanceInM <= distance * 1000) {
            users.push({
              id: doc.id,
              ...userData
            });
          }
        }
      }
    }

    return users;
  } catch (error) {
    console.error('Error getting users by distance:', error);
    return [];
  }
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  return distanceBetween([lat1, lng1], [lat2, lng2]) * 1000; // Return in meters
};























