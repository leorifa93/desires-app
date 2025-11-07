import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { responsiveWidth, responsiveHeight } from '../../../services/utilities/responsive';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';
import DatePicker from 'react-native-date-picker';
import { Icon } from '@rneui/themed';
import { Svg, Path, Line, Defs, LinearGradient, Stop, G, ClipPath, Rect } from 'react-native-svg';

// Self-developed Components
import { Wrapper, Spacer, Modals, Text, Buttons } from '../../../components';
import { LocationIcon } from '../../../components/icons/ProfileIcons';
import { ImageCropModal } from '../../../components/modals';

// Self-developed Services
import { routes } from '../../../services/constants';
import { colors } from '../../../services';
import locationService from '../../../services/locationService';
import phoneVerificationService from '../../../services/phoneVerificationService';

// Self-developed Constants
import { STATUS_ACTIVE } from '../../../constants/User';

// Firebase Storage
import { uploadImage } from '../../../services/firebaseUtilities/storage';

// Firebase Auth & Firestore
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Redux Actions
import { setUser } from '../../../store/reducers/auth';

// Hooks
import { updateUserProfile, completeRegistration } from './hooks';

export default function RegisterSteps() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const me = useSelector(state => state.auth.user);
  const currentUser = useSelector(state => state.auth.user); // Get current user from Redux
  const insets = useSafeAreaInsets();
  
  // Fallback function for translations if i18n fails
  const safeT = (key) => {
    try {
      return t(key);
    } catch (error) {
      return key; // Return the key itself as fallback
    }
  };

  const [activeStep, setActiveStep] = useState(0);
  
  // Calculate exact date 18 years ago (today's date, 18 years back)
  const getEighteenYearsAgo = () => {
    const today = new Date();
    const eighteenYearsAgo = new Date(today);
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
    return eighteenYearsAgo;
  };
  
  const [formData, setFormData] = useState({
    username: me?.username || '',
    birthdate: me?.birthdate || getEighteenYearsAgo(),
    gender: me?.gender || null, // Will be stored as number (1, 2, 3)
    genderLookingFor: me?.genderLookingFor || [], // Will be stored as array of numbers [1, 2, 3]
    location: me?.currentLocation || null,
    profilePicture: null,
    publicPictures: [null, null, null, null, null], // 5 public pictures
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showImageCropModal, setShowImageCropModal] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(null); // 'profile' or 'public'
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // For public pictures
  const [nameError, setNameError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const setValue = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Force re-render for location to ensure display updates
    if (key === 'location') {
      setTimeout(() => {
        setFormData(prev => ({ ...prev, [key]: value }));
      }, 100);
    }
  };

  const onNameChanged = () => {
    setNameError(false);
  };
  // Prefill location via GPS if permission granted
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loc = await locationService.getCurrentLocation();
        if (isMounted && loc) {
          // Get city name from coordinates using reverse geocoding
          const cityName = await phoneVerificationService.getCityFromLatLng(loc.lat, loc.lng);
          // Set location with proper structure for display (same as modal)
          setValue('location', { 
            city: cityName, 
            placeId: 'gps_location',
            lat: loc.lat, 
            lng: loc.lng
          });
        }
      } catch (e) {
        // If permission denied or location unavailable, don't show alert automatically
        // User can manually request location later via the location button
        console.log('Location permission not granted on app start:', e);
      }
    })();
    return () => { isMounted = false; };
  }, []);


  const selectGender = (genderKey) => {
    setValue('gender', genderKey);
  };

  const selectGenderLookingFor = (genderKey) => {
    const current = [...formData.genderLookingFor];
    if (current.includes(genderKey)) {
      const newSelection = current.filter(g => g !== genderKey);
      setValue('genderLookingFor', newSelection);
    } else {
      setValue('genderLookingFor', [...current, genderKey]);
    }
  };

  const next = () => {
    if (activeStep < 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const prev = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const canProceed = () => {
    if (activeStep === 0) {
      return formData.username && formData.birthdate && formData.gender && 
             formData.genderLookingFor.length > 0 && formData.location;
    }
    if (activeStep === 1) {
      // Minimum 3 pictures required - 1 profile picture + 2 public pictures
      const publicPicturesCount = formData.publicPictures.filter(pic => pic !== null).length;
      return formData.profilePicture && publicPicturesCount >= 2;
    }
    return false;
  };

  const calculateAge = (birthdate) => {
    if (!birthdate) return 0;
    
    const birthDate = birthdate instanceof Date ? birthdate : new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const nextStep = async () => {
    if (activeStep < 1 && canProceed()) {
      // Validate age before proceeding to next step
      const age = calculateAge(formData.birthdate);
      if (age < 18) {
        Alert.alert(safeT('ERROR'), safeT('YOUMUSTBE18'));
        return;
      }
      setActiveStep(activeStep + 1);
    }
    // Check if minimum pictures are selected (1 profile + 2 public)
    if (activeStep === 1) {
      const publicPicturesCount = formData.publicPictures.filter(pic => pic !== null).length;
      if (!formData.profilePicture || publicPicturesCount < 2) {
        Alert.alert(safeT('ERROR'), safeT('MINIMUM3PICTURES') || 'Bitte lade mindestens 3 Bilder hoch (1 Profilbild + 2 öffentliche Bilder)');
        return;
      }
      await completeRegistrationAndNavigate();
    }
  };

  const completeRegistrationWithoutImages = async () => {
    try {
      console.log('[Register] Completing registration without images');
      
      // Final age validation before completing registration
      const age = calculateAge(formData.birthdate);
      if (age < 18) {
        Alert.alert(safeT('ERROR'), safeT('YOUMUSTBE18'));
        return;
      }
      
      // Complete registration with current form data
      // Filter out null values from publicPictures
      const validPublicPictures = (formData.publicPictures || []).filter(pic => pic !== null);
      
      const updatedUserData = await completeRegistration(me.id, {
        ...formData,
        publicPictures: validPublicPictures,
        publicPicturesUploading: false,
      });
      
      // Load fresh user data from Firestore to ensure all data is correct
      console.log('[Register] Loading fresh user data from Firestore...');
      const freshUserDoc = await firestore().collection('Users').doc(me.id).get();
      const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : updatedUserData;
      
      // Update Redux with fresh user data from database
      const updatedUser = {
        id: me.id,
        ...freshUserData,
      };
      
      console.log('[Register] Fresh user data from Firestore:', {
        username: freshUserData.username,
        birthday: freshUserData.birthday,
        gender: freshUserData.gender,
        currentLocation: freshUserData.currentLocation
      });
      
      console.log('[Register] Final user data for Redux:', {
        username: updatedUser.username,
        birthday: updatedUser.birthday,
        gender: updatedUser.gender,
        currentLocation: updatedUser.currentLocation
      });
      
      dispatch(setUser({ user: updatedUser, dataLoaded: true }));
      
      // Navigate to verification choice
      navigation.navigate(routes.verificationChoice);
    } catch (error) {
      console.error('Error completing registration:', error);
      Alert.alert(safeT('ERROR'), safeT('REGISTRATION_ERROR'));
    }
  };

  const completeRegistrationAndNavigate = async () => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      console.log('[Register] Starting completion flow');

      // Final age validation before completing registration
      const age = calculateAge(formData.birthdate);
      if (age < 18) {
        Alert.alert(safeT('ERROR'), safeT('YOUMUSTBE18'));
        setIsUploading(false);
        return;
      }

      const withTimeout = (promise, ms = 60000) =>
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('UPLOAD_TIMEOUT')), ms)),
        ]);
      
      // Immediately complete registration; upload all images in background
      // Filter out null values from publicPictures
      const validPublicPictures = formData.publicPictures.filter(pic => pic !== null);
      
      const updatedUserData = await completeRegistration(me.id, {
        ...formData,
        publicPictures: validPublicPictures,
        publicPicturesUploading: true,
      });
      
      // Load fresh user data from Firestore to ensure all data is correct
      setUploadProgress(85);
      console.log('[Register] Loading fresh user data from Firestore...');
      const freshUserDoc = await firestore().collection('Users').doc(me.id).get();
      const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : updatedUserData;
      
      // Update Redux with fresh user data from database
      setUploadProgress(90);
      const updatedUser = {
        id: me.id,
        ...freshUserData,
      };
      
      console.log('[Register] Fresh user data from Firestore:', {
        username: freshUserData.username,
        birthday: freshUserData.birthday,
        gender: freshUserData.gender,
        currentLocation: freshUserData.currentLocation
      });
      
      console.log('[Register] Final user data for Redux:', {
        username: updatedUser.username,
        birthday: updatedUser.birthday,
        gender: updatedUser.gender,
        currentLocation: updatedUser.currentLocation
      });
      
      dispatch(setUser({ user: updatedUser, dataLoaded: true }));
      
      setUploadProgress(100);
      
      // Navigate to verification choice
      navigation.navigate(routes.verificationChoice);

      // Start background uploads (profile + public)
      uploadAllImagesAsync();
    } catch (error) {
      console.error('Error completing registration:', error);
      const msgKey = error?.message === 'UPLOAD_TIMEOUT' ? 'UPLOAD_TIMEOUT' : 'REGISTRATION_ERROR';
      Alert.alert(safeT('ERROR'), safeT(msgKey));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const getPicture = async (type) => {
    if (type === 0) {
      // Profile picture - use crop modal
      setCurrentImageType('profile');
      setCurrentImageIndex(0);
      setShowImageCropModal(true);
    } else {
      // Public pictures - use multiple selection
      await selectMultiplePublicPictures();
    }
  };

  const handleImageSelected = async (image) => {
    if (currentImageType === 'profile') {
      setValue('profilePicture', image.path);
    } else {
      const newPublicPictures = [...formData.publicPictures];
      newPublicPictures[currentImageIndex] = image.path;
      setValue('publicPictures', newPublicPictures);
    }
  };

  // Select multiple public pictures at once with cropping
  const selectMultiplePublicPictures = async () => {
    try {
      // Calculate how many slots are still free
      const currentPublicPictures = formData.publicPictures.filter(pic => pic !== null).length;
      const availableSlots = 5 - currentPublicPictures;
      
      if (availableSlots === 0) {
        Alert.alert(safeT('ERROR'), safeT('MAX_PICTURES_REACHED') || 'Du hast bereits die maximale Anzahl an Bildern hochgeladen');
        return;
      }

      // Use react-native-image-crop-picker for multiple selection with cropping
      const images = await ImagePicker.openPicker({
        multiple: true,
        maxFiles: availableSlots,
        mediaType: 'photo',
        cropping: true,
        width: 1200,
        height: 1600,
        compressImageQuality: 0.8,
        includeBase64: false,
        freeStyleCropEnabled: false,
      });

      if (images && images.length > 0) {
        const newPublicPictures = [...formData.publicPictures];
        let insertIndex = 0;

        // Insert selected and cropped images into the first available slots
        for (const image of images) {
          while (insertIndex < 5 && newPublicPictures[insertIndex] !== null) {
            insertIndex++;
          }
          if (insertIndex < 5) {
            newPublicPictures[insertIndex] = image.path;
            insertIndex++;
          }
        }

        setValue('publicPictures', newPublicPictures);
      }
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('Error selecting images:', error);
        Alert.alert(safeT('ERROR'), safeT('IMAGE_SELECTION_ERROR') || 'Fehler beim Auswählen der Bilder');
      }
    }
  };



  // Upload profile and public images in background (called after navigation)
  const uploadAllImagesAsync = async () => {
    try {
      console.log('Starting async upload of all images...');
      
      // Upload profile picture
      let profilePictureData = null;
      if (formData.profilePicture) {
        const profileStoragePath = `${me.id}/Public/0/image`;
        console.log('[Register] Uploading profile picture to', profileStoragePath);
        profilePictureData = await uploadImage(formData.profilePicture, profileStoragePath);
        console.log('Profile picture uploaded successfully');
      }

      // Upload public pictures using timestamp-based unique filenames
      // Only upload non-null pictures
      const publicPicturesData = [];
      const validPublicPictures = formData.publicPictures.filter(pic => pic !== null);
      
      for (let i = 0; i < validPublicPictures.length; i++) {
        console.log(`Uploading public picture ${i + 1}...`);
        const timestamp = Date.now() + i; // Add i to ensure uniqueness even for simultaneous uploads
        const pictureData = await uploadImage(validPublicPictures[i], `${me.id}/publicAlbum/${timestamp}_${i}`);
        publicPicturesData.push(pictureData);
        console.log(`Public picture ${i + 1} uploaded successfully`);
      }

      // Update user with all images
      await firestore().collection('Users').doc(me.id).update({
        profilePictures: profilePictureData,
        publicAlbum: publicPicturesData,
        publicPicturesUploading: firestore.FieldValue.delete() // Remove the field once done
      });

      // Load fresh user data from Firestore after upload completion
      console.log('[Register] Background upload complete - loading fresh user data from Firestore...');
      const freshUserDoc = await firestore().collection('Users').doc(me.id).get();
      const freshUserData = freshUserDoc.exists ? freshUserDoc.data() : {};
      
      const updatedUser = {
        id: me.id,
        ...freshUserData,
      };

      console.log('[Register] Fresh user data after background upload:', {
        username: freshUserData.username,
        birthday: freshUserData.birthday,
        gender: freshUserData.gender,
        currentLocation: freshUserData.currentLocation,
        profilePictures: !!freshUserData.profilePictures,
        publicAlbum: freshUserData.publicAlbum?.length || 0
      });

      dispatch(setUser({
        user: updatedUser,
        dataLoaded: true,
      }));

      console.log('All images uploaded successfully in background and Redux updated with fresh data');
    } catch (error) {
      console.error('Error uploading all images:', error);
      // Mark as failed and remove the flag
      await firestore().collection('Users').doc(me.id).update({
        publicPicturesUploading: firestore.FieldValue.delete()
      });
      dispatch(setUser({
        user: {
          ...me,
          publicPicturesUploading: false,
          status: 1, // STATUS_ACTIVE - explicitly maintain the status
          // Preserve all important flags from current user state
          verifiedPhoneNumber: currentUser.verifiedPhoneNumber || true,
          hasMadeTemporaryChoice: currentUser.hasMadeTemporaryChoice || false,
          temporaryChoice: currentUser.temporaryChoice || null,
        },
        dataLoaded: true,
      }));
    }
  };

  const register = async () => {
    if (activeStep === 0) {
      return nextStep();
    }

    if (!canProceed()) {
      return;
    }

    // If we have minimum required pictures (1 profile + 2 public), complete registration
    const publicPicturesCount = formData.publicPictures.filter(pic => pic !== null).length;
    if (formData.profilePicture && publicPicturesCount >= 2) {
      await completeRegistrationAndNavigate();
    }
  };

  const cancelRegistration = async () => {
    Alert.alert(
      safeT('CONFIRM_CANCEL'),
      safeT('CANCEL_REGISTRATION_DESCRIPTION'),
      [
        { text: safeT('CANCEL'), style: 'cancel' },
        {
          text: safeT('OK'),
          onPress: async () => {
            try {
              // First, delete the user document from Firestore
              await firestore().collection('Users').doc(me.id).delete();
              
              // Then sign out the user from Firebase Auth
              await auth().signOut();
              
              // Clear Redux store
              dispatch(setUser({ user: null, dataLoaded: true }));
              
              // Navigate back to auth screen
              navigation.navigate(routes.auth);
            } catch (error) {
              console.error('Error canceling registration:', error);
              Alert.alert(safeT('ERROR'), safeT('CANCEL_REGISTRATION_ERROR'));
            }
          }
        }
      ]
    );
  };

  const requestLocationPermission = async () => {
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        console.log('GPS Location obtained:', loc);
        // Get city name from coordinates using reverse geocoding
        const cityName = await phoneVerificationService.getCityFromLatLng(loc.lat, loc.lng);
        console.log('City name from GPS:', cityName);
        const locationData = {
          city: cityName,
          placeId: 'gps_location',
          lat: loc.lat,
          lng: loc.lng,
        };
        // Update form data directly
        setFormData(prev => ({ ...prev, location: locationData }));
        return true; // Success
      }
    } catch (e) {
      console.error('Error getting location:', e);
      return false; // Failed
    }
    return false;
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const showLocations = () => {
    Alert.alert(
      t('SELECT_LOCATION'),
      '',
      [
        {
          text: t('USE_MY_LOCATION'),
          onPress: async () => {
            const success = await requestLocationPermission();
            if (!success) {
              // Permission denied or location unavailable
              Alert.alert(
                t('LOCATION_PERMISSION_TITLE'),
                t('LOCATION_PERMISSION_MESSAGE'),
                [
                  { text: t('CANCEL'), style: 'cancel' },
                  { text: t('SETTINGS'), onPress: openAppSettings }
                ]
              );
            }
          },
        },
        {
          text: t('SELECT_LOCATION'),
          onPress: () => setShowLocationModal(true),
        },
        { text: t('CANCEL'), style: 'cancel' },
      ]
    );
  };

  const renderStepIndicator = () => (
    <Wrapper flexDirectionRow justifyContentCenter alignItemsCenter marginTopSmall style={{ paddingTop: 4 }}>
      <Wrapper
        width={8}
        height={8}
        borderRadius={4}
        backgroundColor={activeStep === 0 ? colors.appPrimaryColor : colors.appBgColor2}
        marginHorizontal={3}
      />
      <Wrapper
        width={8}
        height={8}
        borderRadius={4}
        backgroundColor={activeStep === 1 ? colors.appPrimaryColor : colors.appBgColor2}
        marginHorizontal={3}
      />
    </Wrapper>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.appBgColor1 }}>
      <StatusBar barStyle="dark-content" />
      
      
      {/* Header */}
      <Wrapper 
        paddingVerticalSmall
        backgroundColor={colors.appBgColor1}
        style={styles.headerContainer}
      >
        <Wrapper flexDirectionRow justifyContentSpaceBetween alignItemsCenter marginHorizontalBase>
          <TouchableOpacity
            onPress={cancelRegistration}
            style={{ paddingVertical: 6, paddingHorizontal: 8 }}
          >
            <Text 
              isPrimaryColor 
              isSmall
              style={{ fontWeight: '500' }}
            >
              {t('CANCEL')}
            </Text>
          </TouchableOpacity>
          <Wrapper />
        </Wrapper>
        {/* Step Indicator */}
        {renderStepIndicator()}
      </Wrapper>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}>
        {activeStep === 0 ? (
          <>
            {/* Header Section */}
            <Wrapper alignItemsCenter marginBottomLarge>
              <Text isSmallTitle textAlignCenter>{t('PERSONALINFORMATION')}</Text>
              <Spacer height={4} />
              <Text isRegular textAlignCenter isTextColor2>{t('COMPLETEPROFILE')}</Text>
            </Wrapper>
            
            <Spacer height={20} />
      
            {/* Username */}
            <Wrapper marginBottomLarge>
              <Text isMedium marginBottomMedium isTextColor1>{t('USERNAME')} ({t('DISPLAYNAME')})</Text>
              <Spacer height={8} />
              <Wrapper style={styles.inputContainer}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                  <Path
                    d="M8.00903 6.5C8.00903 4.294 9.80303 2.5 12.009 2.5C14.215 2.5 16.009 4.294 16.009 6.5C16.009 8.706 14.215 10.5 12.009 10.5C9.80303 10.5 8.00903 8.706 8.00903 6.5ZM14 12.5H10C5.94 12.5 4.5 15.473 4.5 18.019C4.5 20.296 5.71105 21.5 8.00305 21.5H15.9969C18.2889 21.5 19.5 20.296 19.5 18.019C19.5 15.473 18.06 12.5 14 12.5Z"
                    fill="url(#paint0_linear_person)"
                  />
                  <Defs>
                    <LinearGradient id="paint0_linear_person" x1="12" y1="2.5" x2="12" y2="21.5" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                  </Defs>
                </Svg>
                <TextInput
                  placeholder={t('USERNAME')}
                  value={formData.username}
                  onChangeText={(text) => {
                    setValue('username', text);
                    setNameError(false);
                  }}
                  style={{ 
                    flex: 1, 
                    fontSize: responsiveWidth(4),
                    color: colors.appTextColor1,
                    paddingVertical: 0,
                  }}
                  placeholderTextColor={colors.appTextColor2}
                />
              </Wrapper>
              {nameError && (
                <Wrapper marginTopSmall>
                  <Text isSmall color={colors.appPrimaryColor}>{t('NONNAMEINFO')}</Text>
                </Wrapper>
              )}
            </Wrapper>
            
            <Spacer height={20} />

            {/* Birthdate */}
            <Wrapper marginBottomLarge>
              <Text isMedium marginBottomMedium isTextColor1>{t('BIRTHDAY')}</Text>
              <Spacer height={8} />
        <TouchableOpacity
                style={styles.inputContainer}
          onPress={() => setShowDatePicker(true)}
        >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                  <Path
                    d="M20.7 9.75H3.30005C3.13405 9.75 3 9.88405 3 10.05V18C3 20 4 21 6 21H18C20 21 21 20 21 18V10.05C21 9.88405 20.866 9.75 20.7 9.75ZM8.02002 18C7.46802 18 7.01489 17.552 7.01489 17C7.01489 16.448 7.45801 16 8.01001 16H8.02002C8.57302 16 9.02002 16.448 9.02002 17C9.02002 17.552 8.57202 18 8.02002 18ZM8.02002 14C7.46802 14 7.01489 13.552 7.01489 13C7.01489 12.448 7.45801 12 8.01001 12H8.02002C8.57302 12 9.02002 12.448 9.02002 13C9.02002 13.552 8.57202 14 8.02002 14ZM12.02 18C11.468 18 11.0149 17.552 11.0149 17C11.0149 16.448 11.458 16 12.01 16H12.02C12.573 16 13.02 16.448 13.02 17C13.02 17.552 12.572 18 12.02 18ZM12.02 14C11.468 14 11.0149 13.552 11.0149 13C11.0149 12.448 11.458 12 12.01 12H12.02C12.573 12 13.02 12.448 13.02 13C13.02 13.552 12.572 14 12.02 14ZM16.02 18C15.468 18 15.0149 17.552 15.0149 17C15.0149 16.448 15.458 16 16.01 16H16.02C16.573 16 17.02 16.448 17.02 17C17.02 17.552 16.572 18 16.02 18ZM16.02 14C15.468 14 15.0149 13.552 15.0149 13C15.0149 12.448 15.458 12 16.01 12H16.02C16.573 12 17.02 12.448 17.02 13C17.02 13.552 16.572 14 16.02 14ZM21 7.5V7.94995C21 8.11595 20.866 8.25 20.7 8.25H3.30005C3.13405 8.25 3 8.11595 3 7.94995V7.5C3 5.5 4 4.5 6 4.5H7.25V3C7.25 2.59 7.59 2.25 8 2.25C8.41 2.25 8.75 2.59 8.75 3V4.5H15.25V3C15.25 2.59 15.59 2.25 16 2.25C16.41 2.25 16.75 2.59 16.75 3V4.5H18C20 4.5 21 5.5 21 7.5Z"
                    fill="url(#paint0_linear_calendar)"
                  />
                  <Defs>
                    <LinearGradient id="paint0_linear_calendar" x1="12" y1="2.25" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                      <Stop stopColor="#C61323" />
                      <Stop offset="1" stopColor="#9B0207" />
                    </LinearGradient>
                  </Defs>
                </Svg>
                <Text isMedium color={formData.birthdate ? colors.appTextColor1 : colors.appTextColor2}>
                  {formData.birthdate
                    ? (() => {
                        try {
                          // Accept both string (e.g., 1998-09-09T09:24:00) and Date
                          const val = formData.birthdate;
                          if (typeof val === 'string') {
                            // Show YYYY-MM-DD from ISO-like string
                            const datePart = val.split('T')[0];
                            return datePart || val;
                          }
                          const d = val instanceof Date ? val : new Date(val);
                          if (!isNaN(d)) return d.toLocaleDateString('de-DE');
                          return t('SELECT_BIRTHDATE');
                        } catch {
                          return t('SELECT_BIRTHDATE');
                        }
                      })()
                    : t('SELECT_BIRTHDATE')}
                </Text>
        </TouchableOpacity>
            </Wrapper>
            
            <Spacer height={20} />

            {/* Gender */}
            <Wrapper marginBottomLarge>
              <Text isMedium marginBottomMedium isTextColor1>{t('GENDER')}</Text>
              <Spacer height={8} />
              <Wrapper flexDirectionRow justifyContentSpaceBetween>
                {[
                  { key: 1, value: 'MALE', icon: 'male' },
                  { key: 2, value: 'FEMALE', icon: 'female' },
                  { key: 3, value: 'TRANSSEXUAL', icon: 'transgender' }
          ].map((gender) => (
            <TouchableOpacity
              key={gender.key}
              style={[
                styles.genderButton,
                formData.gender === gender.key && styles.activeGenderButton
              ]}
                    onPress={() => selectGender(gender.key)}
                  >
                    <Wrapper alignItemsCenter paddingVertical={20}>
                      {gender.key === 1 && (
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <G clipPath="url(#clip0_male)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M19 4C19.5523 4 20 4.44772 20 5V10C20 10.5523 19.5523 11 19 11C18.4477 11 18 10.5523 18 10V7.41382L14.8906 10.5232C15.5891 11.5041 16 12.7041 16 14C16 17.3137 13.3137 20 10 20C6.68629 20 4 17.3137 4 14C4 10.6863 6.68629 8 10 8C11.2957 8 12.4955 8.41073 13.4763 9.10909L16.5854 6H14C13.4477 6 13 5.55228 13 5C13 4.44772 13.4477 4 14 4H18.9994H18.9998H19ZM6 14C6 11.7909 7.79086 10 10 10C12.2091 10 14 11.7909 14 14C14 16.2091 12.2091 18 10 18C7.79086 18 6 16.2091 6 14Z"
                              fill={formData.gender === gender.key ? '#FFFFFF' : "url(#paint0_linear_male)"}
                            />
                          </G>
                          <Defs>
                            <LinearGradient id="paint0_linear_male" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <ClipPath id="clip0_male">
                              <Rect width="24" height="24" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                      {gender.key === 2 && (
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <G clipPath="url(#clip0_female)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5ZM18 9C18 11.973 15.8377 14.441 13 14.917V17H15C15.5523 17 16 17.4477 16 18C16 18.5523 15.5523 19 15 19H13V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19H9C8.44772 19 8 18.5523 8 18C8 17.4477 8.44772 17 9 17H11V14.917C8.16229 14.441 6 11.973 6 9C6 5.68629 8.68629 3 12 3C15.3137 3 18 5.68629 18 9Z"
                              fill={formData.gender === gender.key ? '#FFFFFF' : "url(#paint0_linear_female)"}
                            />
                          </G>
                          <Defs>
                            <LinearGradient id="paint0_linear_female" x1="12" y1="3" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <ClipPath id="clip0_female">
                              <Rect width="24" height="24" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                      {gender.key === 3 && (
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <G clipPath="url(#clip0_transgender)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M21 1C21.5523 1 22 1.44772 22 2V7C22 7.55228 21.5523 8 21 8C20.4477 8 20 7.55228 20 7V4.41382L16.8906 7.52324C17.5891 8.5041 18 9.70407 18 11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11C6 7.68629 8.68629 5 12 5C13.2957 5 14.4955 5.41073 15.4763 6.10909L18.5854 3H16C15.4477 3 15 2.55228 15 2C15 1.44772 15.4477 1 16 1H20.9994H20.9998H21ZM8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11Z"
                              fill={formData.gender === gender.key ? '#FFFFFF' : "url(#paint0_linear_transgender)"}
                            />
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M3 1C2.44772 1 2 1.44772 2 2V7C2 7.55228 2.44771 8 3 8C3.55229 8 4 7.55228 4 7V4.41382L7.10942 7.52324C6.41086 8.5041 6 9.70407 6 11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11C18 7.68629 15.3137 5 12 5C10.7043 5 9.50447 5.41073 8.52369 6.10909L5.4146 3H8C8.55229 3 9 2.55228 9 2C9 1.44772 8.55229 1 8 1H3.00056H3.00022H3ZM16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11Z"
                              fill={formData.gender === gender.key ? '#FFFFFF' : "url(#paint1_linear_transgender)"}
                            />
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7ZM18 11C18 13.973 15.8377 16.441 13 16.917V19H15C15.5523 19 16 19.4477 16 20C16 20.5523 15.5523 21 15 21H13V23C13 23.5523 12.5523 24 12 24C11.4477 24 11 23.5523 11 23V21H9C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19H11V16.917C8.16229 16.441 6 13.973 6 11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11Z"
                              fill={formData.gender === gender.key ? colors.appBgColor1 : "url(#paint2_linear_transgender)"}
                            />
                          </G>
                          <Defs>
                            <LinearGradient id="paint0_linear_transgender" x1="14" y1="1" x2="14" y2="17" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <LinearGradient id="paint1_linear_transgender" x1="10" y1="1" x2="10" y2="17" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <LinearGradient id="paint2_linear_transgender" x1="12" y1="5" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <ClipPath id="clip0_transgender">
                              <Rect width="24" height="24" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                      <Spacer height={12} />
                      <Text
                        isSmall
                        style={{ 
                          fontWeight: formData.gender === gender.key ? 'bold' : 'normal',
                          color: formData.gender === gender.key ? '#FFFFFF' : '#000000'
                        }}
                      >
                        {t(gender.value)}
                      </Text>
                    </Wrapper>
            </TouchableOpacity>
          ))}
              </Wrapper>
            </Wrapper>
            
            <Spacer height={20} />

            {/* Gender Looking For */}
            <Wrapper marginBottomLarge>
              <Text isMedium marginBottomMedium isTextColor1>{t('GENDER_LOOKING_FOR')}</Text>
              <Spacer height={8} />
              <Wrapper flexDirectionRow justifyContentSpaceBetween>
                {[
                  { key: 1, value: 'MALE', icon: 'male' },
                  { key: 2, value: 'FEMALE', icon: 'female' },
                  { key: 3, value: 'TRANSSEXUAL', icon: 'transgender' }
          ].map((gender) => (
            <TouchableOpacity
              key={gender.key}
              style={[
                styles.genderButton,
                formData.genderLookingFor.includes(gender.key) && styles.activeGenderButton
              ]}
                    onPress={() => selectGenderLookingFor(gender.key)}
                  >
                    <Wrapper alignItemsCenter paddingVertical={20}>
                      {gender.key === 1 && (
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <G clipPath="url(#clip0_male_looking)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M19 4C19.5523 4 20 4.44772 20 5V10C20 10.5523 19.5523 11 19 11C18.4477 11 18 10.5523 18 10V7.41382L14.8906 10.5232C15.5891 11.5041 16 12.7041 16 14C16 17.3137 13.3137 20 10 20C6.68629 20 4 17.3137 4 14C4 10.6863 6.68629 8 10 8C11.2957 8 12.4955 8.41073 13.4763 9.10909L16.5854 6H14C13.4477 6 13 5.55228 13 5C13 4.44772 13.4477 4 14 4H18.9994H18.9998H19ZM6 14C6 11.7909 7.79086 10 10 10C12.2091 10 14 11.7909 14 14C14 16.2091 12.2091 18 10 18C7.79086 18 6 16.2091 6 14Z"
                              fill={formData.genderLookingFor.includes(gender.key) ? colors.appBgColor1 : "url(#paint0_linear_male_looking)"}
                            />
                          </G>
                          <Defs>
                            <LinearGradient id="paint0_linear_male_looking" x1="12" y1="4" x2="12" y2="20" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <ClipPath id="clip0_male_looking">
                              <Rect width="24" height="24" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                      {gender.key === 2 && (
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <G clipPath="url(#clip0_female_looking)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12 5C9.79086 5 8 6.79086 8 9C8 11.2091 9.79086 13 12 13C14.2091 13 16 11.2091 16 9C16 6.79086 14.2091 5 12 5ZM18 9C18 11.973 15.8377 14.441 13 14.917V17H15C15.5523 17 16 17.4477 16 18C16 18.5523 15.5523 19 15 19H13V21C13 21.5523 12.5523 22 12 22C11.4477 22 11 21.5523 11 21V19H9C8.44772 19 8 18.5523 8 18C8 17.4477 8.44772 17 9 17H11V14.917C8.16229 14.441 6 11.973 6 9C6 5.68629 8.68629 3 12 3C15.3137 3 18 5.68629 18 9Z"
                              fill={formData.genderLookingFor.includes(gender.key) ? colors.appBgColor1 : "url(#paint0_linear_female_looking)"}
                            />
                          </G>
                          <Defs>
                            <LinearGradient id="paint0_linear_female_looking" x1="12" y1="3" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <ClipPath id="clip0_female_looking">
                              <Rect width="24" height="24" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                      {gender.key === 3 && (
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <G clipPath="url(#clip0_transgender_looking)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M21 1C21.5523 1 22 1.44772 22 2V7C22 7.55228 21.5523 8 21 8C20.4477 8 20 7.55228 20 7V4.41382L16.8906 7.52324C17.5891 8.5041 18 9.70407 18 11C18 14.3137 15.3137 17 12 17C8.68629 17 6 14.3137 6 11C6 7.68629 8.68629 5 12 5C13.2957 5 14.4955 5.41073 15.4763 6.10909L18.5854 3H16C15.4477 3 15 2.55228 15 2C15 1.44772 15.4477 1 16 1H20.9994H20.9998H21ZM8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15C9.79086 15 8 13.2091 8 11Z"
                              fill={formData.genderLookingFor.includes(gender.key) ? colors.appBgColor1 : "url(#paint0_linear_transgender_looking)"}
                            />
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M3 1C2.44772 1 2 1.44772 2 2V7C2 7.55228 2.44771 8 3 8C3.55229 8 4 7.55228 4 7V4.41382L7.10942 7.52324C6.41086 8.5041 6 9.70407 6 11C6 14.3137 8.68629 17 12 17C15.3137 17 18 14.3137 18 11C18 7.68629 15.3137 5 12 5C10.7043 5 9.50447 5.41073 8.52369 6.10909L5.4146 3H8C8.55229 3 9 2.55228 9 2C9 1.44772 8.55229 1 8 1H3.00056H3.00022H3ZM16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11Z"
                              fill={formData.genderLookingFor.includes(gender.key) ? colors.appBgColor1 : "url(#paint1_linear_transgender_looking)"}
                            />
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7ZM18 11C18 13.973 15.8377 16.441 13 16.917V19H15C15.5523 19 16 19.4477 16 20C16 20.5523 15.5523 21 15 21H13V23C13 23.5523 12.5523 24 12 24C11.4477 24 11 23.5523 11 23V21H9C8.44772 21 8 20.5523 8 20C8 19.4477 8.44772 19 9 19H11V16.917C8.16229 16.441 6 13.973 6 11C6 7.68629 8.68629 5 12 5C15.3137 5 18 7.68629 18 11Z"
                              fill={formData.genderLookingFor.includes(gender.key) ? colors.appBgColor1 : "url(#paint2_linear_transgender_looking)"}
                            />
                          </G>
                          <Defs>
                            <LinearGradient id="paint0_linear_transgender_looking" x1="14" y1="1" x2="14" y2="17" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <LinearGradient id="paint1_linear_transgender_looking" x1="10" y1="1" x2="10" y2="17" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <LinearGradient id="paint2_linear_transgender_looking" x1="12" y1="5" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                            <ClipPath id="clip0_transgender_looking">
                              <Rect width="24" height="24" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                      <Spacer height={12} />
                      <Text
                        isSmall
                        style={{ 
                          fontWeight: formData.genderLookingFor.includes(gender.key) ? 'bold' : 'normal',
                          color: formData.genderLookingFor.includes(gender.key) ? '#FFFFFF' : '#000000'
                        }}
                      >
                        {t(gender.value)}
                      </Text>
                    </Wrapper>
            </TouchableOpacity>
          ))}
              </Wrapper>
            </Wrapper>
            
            <Spacer height={20} />

            {/* Location */}
            <Wrapper marginBottomBase>
              <Text isMedium marginBottomMedium isTextColor1>{t('LOCATION')}</Text>
              <Spacer height={8} />
        <TouchableOpacity
                style={styles.inputContainer}
                onPress={showLocations}
              >
                <Wrapper style={{ marginRight: 12 }}>
                  <LocationIcon size={24} color={colors.appPrimaryColor} />
                </Wrapper>
                <Text isMedium color={formData.location?.city ? colors.appTextColor1 : colors.appTextColor2}>
            {formData.location?.city || t('SELECT_LOCATION')}
          </Text>
        </TouchableOpacity>
            </Wrapper>
          </>
        ) : (
          <>
            {/* Header Section */}
            <Wrapper alignItemsCenter marginBottomBase>
              <Text isSmallTitle textAlignCenter>{t('UPLOADIMAGES') || 'Bilder hochladen'}</Text>
              <Spacer height={4} />
              <Text isRegular textAlignCenter isTextColor2>
                {t('UPLOAD_SUBTITLE') || 'Zeige dich von deiner besten Seite'}
              </Text>
            </Wrapper>
            
            <Spacer height={20} />
            
            {/* Pictures Grid */}
            <Wrapper>
              {/* Info Text - centered */}
              <Text isSmall isTextColor2 textAlignCenter marginBottomBase style={{ lineHeight: 20, paddingHorizontal: 20 }}>
                {t('UPLOADINFO_MULTIPLE') || 'Mindestens 3 Bilder erforderlich (1 Profilbild + 2 öffentliche)'}
              </Text>
              
              <Spacer height={16} />
              
              {/* All pictures - 3 per row */}
              <Wrapper flexDirectionRow justifyContentFlexStart style={{ flexWrap: 'wrap', gap: responsiveWidth(2) }}>
                
                {/* Profile Picture - first position with label */}
                <Wrapper alignItemsCenter>
                  <Wrapper 
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      zIndex: 10,
                      backgroundColor: colors.appPrimaryColor,
                      borderRadius: 8,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 7, color: '#FFFFFF', fontWeight: 'bold' }}>
                      {t('PROFILE')}
                    </Text>
                  </Wrapper>
                  <TouchableOpacity
                    style={styles.profilePictureHighlight}
                    onPress={() => getPicture(0)}
                  >
                    {formData.profilePicture ? (
                      <>
                        <Image source={{ uri: formData.profilePicture }} style={styles.previewImage} />
                        {/* Badge */}
                        <Wrapper 
                          style={styles.profileBadge}
                        >
                          <Text style={styles.profileBadgeText}>
                            PROFIL
                          </Text>
                        </Wrapper>
                      </>
                    ) : (
                      <Wrapper alignItemsCenter justifyContentCenter style={{ width: '100%', height: '100%' }}>
                        <Svg width={20} height={20} viewBox="0 0 42 42" fill="none">
                          <Path
                            d="M38.0625 19.25V29.75C38.0625 33.9815 35.7315 36.3125 31.5 36.3125H10.5C6.2685 36.3125 3.9375 33.9815 3.9375 29.75V12.25C3.9375 8.0185 6.2685 5.6875 10.5 5.6875H22.75C23.4745 5.6875 24.0625 6.2755 24.0625 7C24.0625 7.7245 23.4745 8.3125 22.75 8.3125H10.5C7.74025 8.3125 6.5625 9.49025 6.5625 12.25V28.4375L11.0076 23.9924C11.6901 23.3099 12.8099 23.3099 13.4924 23.9924L15.1375 25.6373C15.47 25.9698 16.03 25.9698 16.3625 25.6373L25.0076 16.9924C25.6901 16.3099 26.8099 16.3099 27.4924 16.9924L35.4375 24.9375V19.25C35.4375 18.5255 36.0255 17.9375 36.75 17.9375C37.4745 17.9375 38.0625 18.5255 38.0625 19.25ZM13.9878 13.5625C12.7821 13.5625 11.8125 14.5425 11.8125 15.75C11.8125 16.9575 12.7994 17.9375 14.0034 17.9375C15.2092 17.9375 16.1875 16.9575 16.1875 15.75C16.1875 14.5425 15.2109 13.5625 14.0034 13.5625H13.9878ZM29.75 10.0625H31.9375V12.25C31.9375 12.9745 32.5255 13.5625 33.25 13.5625C33.9745 13.5625 34.5625 12.9745 34.5625 12.25V10.0625H36.75C37.4745 10.0625 38.0625 9.4745 38.0625 8.75C38.0625 8.0255 37.4745 7.4375 36.75 7.4375H34.5625V5.25C34.5625 4.5255 33.9745 3.9375 33.25 3.9375C32.5255 3.9375 31.9375 4.5255 31.9375 5.25V7.4375H29.75C29.0255 7.4375 28.4375 8.0255 28.4375 8.75C28.4375 9.4745 29.0255 10.0625 29.75 10.0625Z"
                            fill="url(#paint0_linear_camera_profile_compact)"
                          />
                          <Defs>
                            <LinearGradient id="paint0_linear_camera_profile_compact" x1="21" y1="3.9375" x2="21" y2="36.3125" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                          </Defs>
                        </Svg>
                        <Spacer height={4} />
                        <Text style={styles.choosePictureTextCompact}>
                          {t('CHOOSEPICTURE')}
                        </Text>
                      </Wrapper>
                    )}
                  </TouchableOpacity>
                </Wrapper>
                
                {/* Public Pictures - 5 slots */}
                {[0, 1, 2, 3, 4].map((index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.publicPictureBoxInRow}
                    onPress={() => getPicture(index + 1)}
                  >
                    {formData.publicPictures[index] ? (
                      <Image source={{ uri: formData.publicPictures[index] }} style={styles.previewImage} />
                    ) : (
                      <Wrapper alignItemsCenter justifyContentCenter style={{ width: '100%', height: '100%' }}>
                        <Svg width={20} height={20} viewBox="0 0 42 42" fill="none">
                          <Path
                            d="M38.0625 19.25V29.75C38.0625 33.9815 35.7315 36.3125 31.5 36.3125H10.5C6.2685 36.3125 3.9375 33.9815 3.9375 29.75V12.25C3.9375 8.0185 6.2685 5.6875 10.5 5.6875H22.75C23.4745 5.6875 24.0625 6.2755 24.0625 7C24.0625 7.7245 23.4745 8.3125 22.75 8.3125H10.5C7.74025 8.3125 6.5625 9.49025 6.5625 12.25V28.4375L11.0076 23.9924C11.6901 23.3099 12.8099 23.3099 13.4924 23.9924L15.1375 25.6373C15.47 25.9698 16.03 25.9698 16.3625 25.6373L25.0076 16.9924C25.6901 16.3099 26.8099 16.3099 27.4924 16.9924L35.4375 24.9375V19.25C35.4375 18.5255 36.0255 17.9375 36.75 17.9375C37.4745 17.9375 38.0625 18.5255 38.0625 19.25ZM13.9878 13.5625C12.7821 13.5625 11.8125 14.5425 11.8125 15.75C11.8125 16.9575 12.7994 17.9375 14.0034 17.9375C15.2092 17.9375 16.1875 16.9575 16.1875 15.75C16.1875 14.5425 15.2109 13.5625 14.0034 13.5625H13.9878ZM29.75 10.0625H31.9375V12.25C31.9375 12.9745 32.5255 13.5625 33.25 13.5625C33.9745 13.5625 34.5625 12.9745 34.5625 12.25V10.0625H36.75C37.4745 10.0625 38.0625 9.4745 38.0625 8.75C38.0625 8.0255 37.4745 7.4375 36.75 7.4375H34.5625V5.25C34.5625 4.5255 33.9745 3.9375 33.25 3.9375C32.5255 3.9375 31.9375 4.5255 31.9375 5.25V7.4375H29.75C29.0255 7.4375 28.4375 8.0255 28.4375 8.75C28.4375 9.4745 29.0255 10.0625 29.75 10.0625Z"
                            fill="url(#paint0_linear_camera_public_compact)"
                          />
                          <Defs>
                            <LinearGradient id="paint0_linear_camera_public_compact" x1="21" y1="3.9375" x2="21" y2="36.3125" gradientUnits="userSpaceOnUse">
                              <Stop stopColor="#C61323" />
                              <Stop offset="1" stopColor="#9B0207" />
                            </LinearGradient>
                          </Defs>
                        </Svg>
                        <Spacer height={4} />
                        <Text style={styles.choosePictureTextCompact}>
                          {t('CHOOSEPICTURE')}
                        </Text>
                      </Wrapper>
                    )}
                  </TouchableOpacity>
                ))}
              </Wrapper>
            </Wrapper>
            
            <Spacer height={20} />
          </>
        )}

              <Spacer height={30} />
              
              {/* Upload Progress */}
              {isUploading && (
                <Wrapper 
                  alignItemsCenter 
                  marginBottomLarge
                  paddingVertical={20}
                  style={{
                    backgroundColor: colors.appPrimaryColor,
                    borderRadius: 16,
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 5
                  }}
                >
                  <Wrapper flexDirectionRow alignItemsCenter>
                    <ActivityIndicator size="small" color={colors.appBgColor1} />
                    <Spacer width={10} />
                    <Text isMedium style={{ color: colors.appBgColor1 }}>
                      {(() => {
                        const key = 'UPLOADING';
                        const val = safeT(key);
                        return val === key ? 'Bilder werden hochgeladen' : val;
                      })()}
                    </Text>
                    <Spacer width={6} />
                    <Text isSmall style={{ color: colors.appBgColor1 }}>{uploadProgress}%</Text>
                  </Wrapper>
                </Wrapper>
              )}
            </ScrollView>

            {/* Footer Navigation */}
      <Wrapper 
        backgroundColor={colors.appBgColor1}
        paddingHorizontal={20}
        paddingVertical={20}
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.appBgColor2,
        }}
      >
        <Wrapper flexDirectionRow justifyContentSpaceBetween>
                <Wrapper flex={1} marginRight={8}>
                  <Buttons.Bordered
                    text={safeT('BACK')}
                    onPress={prev}
                    disabled={activeStep === 0 || isUploading}
                    buttonStyle={{ 
                      opacity: (activeStep === 0 || isUploading) ? 0.3 : 1,
                      borderRadius: 12,
                      paddingVertical: 14,
                      backgroundColor: 'transparent',
                      borderColor: colors.appPrimaryColor,
                    }}
                    textStyle={{ color: colors.appPrimaryColor }}
                  />
                </Wrapper>
                <Wrapper flex={1} marginLeft={8}>
                  <Buttons.Colored
                    text={activeStep === 1 ? safeT('COMPLETE_PROFILE') : safeT('NEXT')}
                    onPress={register}
                    disabled={nameError || !canProceed() || isUploading}
                    buttonStyle={{ 
                      opacity: (nameError || !canProceed() || isUploading) ? 0.5 : 1,
                      borderRadius: 12,
                      paddingVertical: 14, // Same as BACK button
                    }}
                  />
                </Wrapper>
        </Wrapper>
      </Wrapper>

      {/* Date Picker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={(() => {
          // Always default to 18 years ago (maximum allowed age)
          const eighteenYearsAgo = new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000);
          const val = formData.birthdate;
          
          if (val instanceof Date && !isNaN(val)) return val;
          if (typeof val === 'string' || typeof val === 'number') {
            const d = new Date(val);
            if (!isNaN(d)) return d;
          }
          
          // Default: 18 years ago (minimum allowed age)
          return eighteenYearsAgo;
        })()}
        mode="date"
        maximumDate={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)}
        minimumDate={new Date(1900, 0, 1)}
        onConfirm={(date) => {
          const max = new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000);
          const clamped = date > max ? max : date;
          setValue('birthdate', clamped);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        title={t('SELECT_BIRTHDATE')}
      />

      {/* Location Modal */}
      <Modals.PlacesAutocomplete
        visible={showLocationModal}
        toggle={() => setShowLocationModal(false)}
        onPress={(data, details) => {
          if (details?.geometry?.location) {
            setValue('location', {
              city: data.description,
              placeId: data.place_id,
              lat: details.geometry.location.lat,
              lng: details.geometry.location.lng,
            });
            setShowLocationModal(false);
          }
        }}
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        visible={showImageCropModal}
        onClose={() => setShowImageCropModal(false)}
        onImageSelected={handleImageSelected}
        aspectRatio={[3, 4]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.appBgColor2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.appBgColor1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.appBgColor2,
    minHeight: 56,
  },
  genderButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.appBgColor2,
    borderRadius: 12,
    marginHorizontal: 6,
    backgroundColor: colors.appBgColor1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeGenderButton: {
    borderColor: colors.appPrimaryColor,
    backgroundColor: colors.appPrimaryColor,
    shadowColor: colors.appPrimaryColor,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  profilePictureHighlight: {
    width: responsiveWidth(28),
    aspectRatio: 3/4,
    borderWidth: 3,
    borderColor: colors.appPrimaryColor,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.appBgColor2,
    // Shadow for extra emphasis
    shadowColor: colors.appPrimaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  publicPictureBoxInRow: {
    width: responsiveWidth(28),
    aspectRatio: 3/4,
    borderWidth: 2,
    borderColor: colors.appPrimaryColor,
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.appBgColor2,
  },
  profileBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.appPrimaryColor,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  profileBadgeText: {
    fontSize: 7,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  choosePictureTextCompact: {
    fontSize: 7,
    color: colors.appPrimaryColor,
    marginTop: 4,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
}); 