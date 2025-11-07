/**
 * Serializes Firestore data to make it compatible with Redux store
 * Converts Firestore timestamps and other special objects to plain JavaScript objects
 */

export const serializeFirestoreData = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  // Convert native Date objects to a serializable primitive (timestamp)
  if (data instanceof Date) {
    return data.getTime();
  }

  // Handle date strings (ISO format)
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
    try {
      const date = new Date(data);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
    } catch (e) {
      // If parsing fails, return the string as is
    }
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  // Handle Firestore Timestamp
  if (data && typeof data.toDate === 'function') {
    // Convert Firestore Timestamp -> Date -> timestamp (number)
    return data.toDate().getTime();
  }

  // Handle Firestore DocumentReference
  // Check for firestore property to distinguish from regular objects with id and path
  if (data && typeof data.path === 'string' && typeof data.id === 'string' && data.firestore) {
    return {
      id: data.id,
      path: data.path,
      isDocumentReference: true
    };
  }

  // Handle Firestore GeoPoint
  if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      isGeoPoint: true
    };
  }

  // Handle regular objects
  const serialized = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      serialized[key] = serializeFirestoreData(data[key]);
    }
  }

  return serialized;
};

export default serializeFirestoreData;
