import firestore from '@react-native-firebase/firestore';
import { STATUS_ACTIVE } from '../../../../constants/User';

// Ensure no undefined values are sent to Firestore
const sanitizeForFirestore = (input) => {
  if (input === undefined) return null;
  if (input === null) return null;
  if (Array.isArray(input)) {
    return input.map((v) => sanitizeForFirestore(v));
    }
  if (typeof input === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue; // drop undefined keys
      out[key] = sanitizeForFirestore(value);
    }
    return out;
  }
  return input;
};

// Format birthdate to "YYYY-MM-DDTHH:mm:00" (no timezone suffix)
const formatBirthdayString = (value) => {
  if (!value) return null;
  let d = value;
  if (typeof value === 'string') {
    // Accept already formatted string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (!isNaN(parsed)) d = parsed;
  }
  if (d instanceof Date || typeof d === 'number') {
    const date = d instanceof Date ? d : new Date(d);
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}:00`;
  }
  return null;
};

export const updateUserProfile = async (userId, userData) => {
  try {
    // Sanitize and use set with merge to preserve existing data
    const sanitized = sanitizeForFirestore(userData);
    await firestore().collection('Users').doc(userId).set(sanitized, { merge: true });
    console.log('User profile updated successfully:', userData);
    return userData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const completeRegistration = async (userId, formData) => {
  try {
    // First, get the current user document to preserve existing data
    const userDoc = await firestore().collection('Users').doc(userId).get();
    const currentUserData = userDoc.exists ? userDoc.data() : {};
    
    console.log('[Registration] Current user data from Firestore:', {
      username: currentUserData.username,
      birthday: currentUserData.birthday,
      gender: currentUserData.gender
    });
    
    console.log('[Registration] Form data received:', {
      username: formData.username,
      birthdate: formData.birthdate,
      gender: formData.gender
    });
    
    // Prepare user data for completion - merge with existing data
    // Filter out null/undefined values to only keep actual pictures
    const publicAlbumArray = Array.isArray(formData.publicPictures)
      ? formData.publicPictures.filter(p => p !== null && p !== undefined)
      : [];

    // Ensure location has proper structure
    const locationData = formData.location ? {
      currentLocation: {
        lat: formData.location.lat || formData.location.latitude || 0,
        lng: formData.location.lng || formData.location.longitude || 0,
        city: formData.location.city || formData.location.description || '',
        placeId: formData.location.placeId || ''
      }
    } : {};

    // Ensure we have valid values for critical fields
    const finalUsername = formData.username || currentUserData.username || 'Unknown User';
    const finalBirthday = formatBirthdayString(formData.birthdate) || currentUserData.birthday || '1990-01-01T00:00:00';
    const finalGender = (formData.gender !== null && formData.gender !== undefined) ? formData.gender : (currentUserData.gender || 1);

    const userData = {
      ...currentUserData, // Preserve existing data (email, etc.)
      username: finalUsername,
      birthday: finalBirthday,
      gender: finalGender,
      genderLookingFor: Array.isArray(formData.genderLookingFor) ? formData.genderLookingFor : (currentUserData.genderLookingFor || []),
      ...locationData, // Spread location data
      // Do not overwrite profilePictures if not uploaded yet; keep existing and let background upload update it
      ...(formData.profilePicture ? { profilePictures: formData.profilePicture } : {}),
      publicAlbum: publicAlbumArray, // May contain placeholders; background upload will finalize
      stealthMode: formData.stealthMode !== undefined ? formData.stealthMode : currentUserData.stealthMode,
      status: STATUS_ACTIVE,
      profileCompleted: true,
      verificationChoiceMade: false,
      lastLogin: Date.now(),
      lastBoostAt: currentUserData?.lastBoostAt ? currentUserData.lastBoostAt : Date.now(),
    };

    console.log('[Registration] Complete user data:', {
      username: userData.username,
      birthday: userData.birthday,
      gender: userData.gender,
      currentLocation: userData.currentLocation
    });

    // Sanitize and use set with merge to ensure all data is preserved
    const sanitized = sanitizeForFirestore(userData);
    await firestore().collection('Users').doc(userId).set(sanitized, { merge: true });
    
    console.log('User registration completed successfully');
    return userData;
  } catch (error) {
    console.error('Error completing registration:', error);
    throw error;
  }
}; 