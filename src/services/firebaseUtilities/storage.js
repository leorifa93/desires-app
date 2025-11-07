import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

export const uploadImage = async (imageUri, storagePath, onProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Handle platform-specific URI modifications
      const uploadUri = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
      
      // Use exact filename pattern like old project (no extension) and set contentType
      const storageRef = storage().ref(`Dexxire/${storagePath}`);
      console.log('[Upload] Target path:', `Dexxire/${storagePath}`);
      
      // Upload the image file directly (prevents zero-size/corrupt objects)
      const uploadTask = storageRef.putFile(uploadUri, { contentType: 'image/jpeg' });

      // Wire progress listener
      const unsubscribe = uploadTask.on('state_changed', (taskSnapshot) => {
        try {
          const { bytesTransferred, totalBytes } = taskSnapshot;
          if (totalBytes > 0) {
            const percent = Math.max(0, Math.min(100, Math.round((bytesTransferred / totalBytes) * 100)));
            if (typeof onProgress === 'function') onProgress(percent);
          }
        } catch (_) {
          // no-op
        }
      });

      // Wait for upload to complete
      await uploadTask;

      // Cleanup listener
      if (typeof unsubscribe === 'function') unsubscribe();
      
      // Get original download URL
      const originalDownloadURL = await storageRef.getDownloadURL();
      
      // Return immediately with original image as thumbnails (thumbnails will be handled by cloud function later)
      const pictures = { 
        original: originalDownloadURL,
        thumbnails: {
          small: originalDownloadURL,
          medium: originalDownloadURL,
          big: originalDownloadURL
        },
        uploadAt: Date.now(),
        approved: false
      };
      
      console.log('[Upload] Upload completed, returning original image immediately');
      resolve(pictures);
      
    } catch (error) {
      console.error('[Upload] Error:', error);
      reject(error);
    }
  });
};

// Upload video to Firebase Storage
export const uploadVideo = async (videoUri, storagePath, onProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Handle platform-specific URI modifications
      const uploadUri = Platform.OS === 'ios' ? videoUri.replace('file://', '') : videoUri;
      
      const storageRef = storage().ref(`Dexxire/${storagePath}`);
      console.log('[Video Upload] Target path:', `Dexxire/${storagePath}`);
      
      // Upload the video file with video content type
      const uploadTask = storageRef.putFile(uploadUri, { contentType: 'video/mp4' });

      // Wire progress listener
      const unsubscribe = uploadTask.on('state_changed', (taskSnapshot) => {
        try {
          const { bytesTransferred, totalBytes } = taskSnapshot;
          if (totalBytes > 0) {
            const percent = Math.max(0, Math.min(100, Math.round((bytesTransferred / totalBytes) * 100)));
            if (typeof onProgress === 'function') onProgress(percent);
          }
        } catch (_) {
          // no-op
        }
      });

      // Wait for upload to complete
      await uploadTask;

      // Cleanup listener
      if (typeof unsubscribe === 'function') unsubscribe();
      
      // Get download URL
      const downloadURL = await storageRef.getDownloadURL();
      
      const videoData = { 
        original: downloadURL,
        uploadAt: Date.now(),
        approved: false
      };
      
      console.log('[Video Upload] Upload completed');
      resolve(videoData);
      
    } catch (error) {
      console.error('[Video Upload] Error:', error);
      reject(error);
    }
  });
};

// Delete all files in a folder (like old project's deleteAll)
export const deleteAll = async (refPath) => {
  try {
    const basePath = `Dexxire/${refPath}`;
    console.log('[deleteAll] Deleting all files in:', basePath);
    
    const listRef = storage().ref(basePath);
    const thumbnailsRef = storage().ref(basePath + '/thumbnails');
    
    const [imageResult, thumbnailResult] = await Promise.all([
      listRef.listAll().catch(() => ({ items: [] })),
      thumbnailsRef.listAll().catch(() => ({ items: [] }))
    ]);
    
    // Delete all images in base folder
    for (let item of imageResult.items) {
      console.log('[deleteAll] Deleting image:', item.fullPath);
      await item.delete();
    }
    
    // Delete all thumbnails
    for (let item of thumbnailResult.items) {
      console.log('[deleteAll] Deleting thumbnail:', item.fullPath);
      await item.delete();
    }
    
    console.log('[deleteAll] Successfully deleted all files');
  } catch (error) {
    console.error('[deleteAll] Error:', error);
    throw error;
  }
};

// Keep the deleteAllThumbnails function for future use
export const deleteAllThumbnails = async (basePath) => {
  try {
    const thumbnailsRef = storage().ref(basePath + '/thumbnails');
    const listResult = await thumbnailsRef.listAll();
    
    if (listResult.items && listResult.items.length > 0) {
      const deletePromises = listResult.items.map(item => item.delete());
      await Promise.all(deletePromises);
      console.log('[Upload] Deleted existing thumbnails');
    }
  } catch (error) {
    console.log('[Upload] No existing thumbnails to delete or error:', error.message);
  }
};