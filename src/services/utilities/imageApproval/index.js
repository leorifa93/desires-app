import { appImages } from '../assets';

/**
 * Checks if profile pictures are approved for display
 * @param {Object} profilePictures - The profile pictures object
 * @returns {boolean} - True if approved, false otherwise
 */
export const isApproved = (profilePictures) => {
  return typeof (profilePictures?.approved) !== 'boolean' || profilePictures?.approved;
};

/**
 * Gets the appropriate fallback image based on gender and approval status
 * @param {Object} profilePictures - The profile pictures object
 * @param {number} gender - User's gender (1 = male, 2 = female)
 * @param {string} currentUserId - Current user's ID
 * @param {string} targetUserId - Target user's ID (for comparison)
 * @returns {string|Object} - The image source (URI or require object)
 */
export const getApprovedImageSource = (profilePictures, gender, currentUserId, targetUserId) => {
  // If it's the current user's own profile, always show their image
  if (currentUserId === targetUserId) {
    return profilePictures?.original || profilePictures?.thumbnails?.big || appImages.image2;
  }
  
  // For other users, check approval status
  if (isApproved(profilePictures)) {
    return profilePictures?.original || profilePictures?.thumbnails?.big || appImages.image2;
  }
  
  // Return fallback image based on gender
  return gender === 1 ? appImages.notApprovedMale : appImages.notApprovedFemale;
};

/**
 * Gets the appropriate image source for public album images
 * @param {Object} publicImage - The public album image object
 * @param {number} gender - User's gender (1 = male, 2 = female)
 * @param {string} currentUserId - Current user's ID
 * @param {string} targetUserId - Target user's ID (for comparison)
 * @returns {string|Object} - The image source (URI or require object)
 */
export const getApprovedPublicImageSource = (publicImage, gender, currentUserId, targetUserId) => {
  // If it's the current user's own profile, always show their image
  if (currentUserId === targetUserId) {
    return publicImage?.original || publicImage?.thumbnails?.big || appImages.image2;
  }
  
  // For other users, check approval status
  if (isApproved(publicImage)) {
    return publicImage?.original || publicImage?.thumbnails?.big || appImages.image2;
  }
  
  // Return fallback image based on gender
  return gender === 1 ? appImages.notApprovedMale : appImages.notApprovedFemale;
};

/**
 * Gets the appropriate image source for private album images
 * @param {Object} privateImage - The private album image object
 * @param {number} gender - User's gender (1 = male, 2 = female)
 * @param {string} currentUserId - Current user's ID
 * @param {string} targetUserId - Target user's ID (for comparison)
 * @param {boolean} isAdmin - Whether the current user is an admin
 * @param {boolean} hasPrivateGalleryAccess - Whether the current user has access to private gallery
 * @returns {string|Object} - The image source (URI or require object)
 */
export const getApprovedPrivateImageSource = (privateImage, gender, currentUserId, targetUserId, isAdmin = false, hasPrivateGalleryAccess = false) => {
  // If it's the current user's own profile, always show their image
  if (currentUserId === targetUserId) {
    return privateImage?.original || privateImage?.thumbnails?.big || privateImage?.url || privateImage?.uri || appImages.image2;
  }
  
  // If user is admin, always show the real image (even if not approved)
  if (isAdmin) {
    return privateImage?.original || privateImage?.thumbnails?.big || privateImage?.url || privateImage?.uri || appImages.image2;
  }
  
  // If user has private gallery access (but is not admin), check approval status
  if (hasPrivateGalleryAccess) {
    if (isApproved(privateImage)) {
      return privateImage?.original || privateImage?.thumbnails?.big || privateImage?.url || privateImage?.uri || appImages.image2;
    }
    // If not approved, show "in review" image based on gender
    return gender === 1 ? appImages.notApprovedMale : appImages.notApprovedFemale;
  }
  
  // User has no access - show fallback image based on gender (shouldn't normally reach here)
  return gender === 1 ? appImages.notApprovedMale : appImages.notApprovedFemale;
};
