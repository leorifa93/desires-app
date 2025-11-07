import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  Wrapper,
  Text,
  Icons,
  Spacer,
  Lines,
  Buttons,
  TextInputs,
  Images,
  Swipable,
  Labels,
  CheckBoxes,
  Switches,
  DropDowns,
} from '../';
import {
  colors,
  responsiveWidth,
  responsiveHeight,
  scale,
  fontSizes,
  sizes,
  appFonts,
} from '../../services';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useImagePicker } from '../../services/helper/hooks/useImagePicker';
import { updateUserDetails } from '../../services/firebase/firestore';
import { setUser } from '../../store/actions/auth';
import Countries from '../../constants/countries';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export function Popup({
  visible,
  toggle,
  children,
  title,
  showCloseButton = true,
  closeOnBackdrop = true,
}) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={toggle}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={closeOnBackdrop ? toggle : undefined}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colors.appBgColor1,
            borderRadius: scale(15),
            padding: scale(20),
            width: responsiveWidth(90),
            maxHeight: responsiveHeight(80),
          }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <Text
              style={{
                fontSize: fontSizes.large,
                fontFamily: appFonts.appTextBold,
                marginBottom: scale(15),
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
          )}
          {showCloseButton && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: scale(15),
                right: scale(15),
                zIndex: 1,
              }}
              onPress={toggle}
            >
              <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function PopupPrimary({
  visible,
  toggle,
  children,
  title,
  showCloseButton = true,
  closeOnBackdrop = true,
  maxHeight = responsiveHeight(80),
}) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={toggle}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={1}
        onPress={closeOnBackdrop ? toggle : undefined}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colors.appBgColor1,
            borderRadius: scale(15),
            padding: scale(20),
            width: responsiveWidth(90),
            maxHeight: maxHeight,
          }}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <Text
              style={{
                fontSize: fontSizes.large,
                fontFamily: appFonts.appTextBold,
                marginBottom: scale(15),
                textAlign: 'center',
              }}
            >
              {title}
            </Text>
          )}
          {showCloseButton && (
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: scale(15),
                right: scale(15),
                zIndex: 1,
              }}
              onPress={toggle}
            >
              <Text style={{ fontSize: fontSizes.large, color: colors.appTextColor1 }}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export function ImagePickerPopup({
  visible,
  toggle,
  onImageSelected,
  title = 'Select Image',
}) {
  const { openCamera, openLibrary } = useImagePicker();

  const handleCameraPress = async () => {
    try {
      const image = await openCamera();
      if (image) {
        onImageSelected(image);
        toggle();
      }
    } catch (error) {
      console.log('Camera error:', error);
    }
  };

  const handleLibraryPress = async () => {
    try {
      const image = await openLibrary();
      if (image) {
        onImageSelected(image);
        toggle();
      }
    } catch (error) {
      console.log('Library error:', error);
    }
  };

  return (
    <PopupPrimary visible={visible} toggle={toggle} title={title}>
      <Wrapper style={{ alignItems: 'center' }}>
        <Buttons.Colored
          title="Take Photo"
          onPress={handleCameraPress}
          style={{ marginBottom: scale(15), width: '100%' }}
        />
        <Buttons.Colored
          title="Choose from Library"
          onPress={handleLibraryPress}
          style={{ width: '100%' }}
        />
      </Wrapper>
    </PopupPrimary>
  );
}

export function PlacesAutocomplete({ visible, toggle, OnMapPage, onPress }) {
  const [searchText, setSearchText] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPlaces = async (query) => {
    if (query.length < 3) {
      setPlaces([]);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - replace with actual places API
      const mockPlaces = [
        { id: 1, name: `${query} - Mock Place 1`, address: 'Mock Address 1' },
        { id: 2, name: `${query} - Mock Place 2`, address: 'Mock Address 2' },
      ];
      setPlaces(mockPlaces);
    } catch (error) {
      console.log('Places search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaces(searchText);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const handlePlaceSelect = (place) => {
    onPress(place);
    toggle();
  };

  return (
    <PopupPrimary visible={visible} toggle={toggle} title="Search Places">
      <Wrapper>
        <TextInputs.Primary
          placeholder="Search for a place..."
          value={searchText}
          onChangeText={setSearchText}
          style={{ marginBottom: scale(15) }}
        />
        
        {loading && (
          <Wrapper style={{ alignItems: 'center', marginVertical: scale(20) }}>
            <ActivityIndicator size="large" color={colors.appPrimaryColor} />
          </Wrapper>
        )}
        
        <ScrollView style={{ maxHeight: responsiveHeight(50) }}>
          {places.map((place) => (
            <TouchableOpacity
              key={place.id}
              onPress={() => handlePlaceSelect(place)}
              style={{
                padding: scale(15),
                borderBottomWidth: 1,
                borderBottomColor: colors.appBorderColor2,
              }}
            >
              <Text style={{ fontSize: fontSizes.regular, fontWeight: 'bold' }}>
                {place.name}
              </Text>
              <Text style={{ fontSize: fontSizes.small, color: colors.appTextColor2 }}>
                {place.address}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Wrapper>
    </PopupPrimary>
  );
}

export function EditProfile({ 
  visible, 
  toggle, 
  heightPickerVisible,
  setHeightPickerVisible,
  weightPickerVisible,
  setWeightPickerVisible,
  chestPickerVisible,
  setChestPickerVisible,
  waistPickerVisible,
  setWaistPickerVisible,
  hipsPickerVisible,
  setHipsPickerVisible,
  userData: externalUserData,
  setUserData: externalSetUserData
}) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { me } = useSelector((state) => state.auth);
  const { openLibrary } = useImagePicker();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState(externalUserData || {});
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageType, setSelectedImageType] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [interestsData, setInterestsData] = useState([]);
  const [lifestyleData, setLifestyleData] = useState([]);
  const [moreInfoData, setMoreInfoData] = useState([]);
  const [brandsData, setBrandsData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localImageUri, setLocalImageUri] = useState(null);
  const [newImageToUpload, setNewImageToUpload] = useState(null);
  const lastUploadedImageRef = useRef(null);
  const uploadProgressRef = useRef(0);
  const maxPictures = 6;
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [ethnicityPickerVisible, setEthnicityPickerVisible] = useState(false);
  const [nationalityPickerVisible, setNationalityPickerVisible] = useState(false);
  const [nationalitySearchText, setNationalitySearchText] = useState('');
  const [eyeColorPickerVisible, setEyeColorPickerVisible] = useState(false);
  const [hairColorPickerVisible, setHairColorPickerVisible] = useState(false);
  const [hairLengthPickerVisible, setHairLengthPickerVisible] = useState(false);

  const countryOptions = (Array.isArray(Countries) ? Countries : []).map(c => ({ 
    code: c.key || c.code || c.alpha2 || '', 
    country: c.country || c.name || '' 
  }));

  useEffect(() => {
    if (me && !me.details) {
      const updatedUser = {
        ...me,
        details: {
          nationality: { code: '' },
          moreinfo: [],
          lifestyle: [],
          interests: [],
          brands: []
        },
        _settings: {
          units: {
            lengthType: 'Cm',
            distanceType: 'Km',
            weightType: 'Kg'
          },
          currentLang: 'de',
          showInDiscover: false,
          showCall: true,
          notifications: {
            messages: true,
            matches: true,
            likes: true,
            superLikes: true,
            visits: true,
            messagesFromMatches: true,
            marketing: true,
            push: true
          }
        }
      };
      dispatch(setUser(updatedUser));
    }
  }, [me, dispatch]);

  useEffect(() => {
    if (me) {
      setUserData(me);
      if (externalSetUserData) {
        externalSetUserData(me);
      }
    }
  }, [me, externalSetUserData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserDetails(userData);
      dispatch(setUser(userData));
      if (externalSetUserData) {
        externalSetUserData(userData);
      }
      toggle();
    } catch (error) {
      console.log('Save error:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelect = async (type, index = null) => {
    try {
      const image = await openLibrary();
      if (image) {
        setSelectedImage(image);
        setSelectedImageType(type);
        setSelectedImageIndex(index);
        setLocalImageUri(image.uri);
        setNewImageToUpload(image);
      }
    } catch (error) {
      console.log('Image selection error:', error);
    }
  };

  const handleImageUpload = async (image, type, index = null) => {
    setUploading(true);
    setUploadingImageIndex(index);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        startTransition(() => {
          if (type === 'profile') {
            setUserData(prev => ({
              ...prev,
              profilePicture: image.uri
            }));
          } else if (type === 'public') {
            setUserData(prev => ({
              ...prev,
              publicPictures: [...(prev.publicPictures || []), image.uri]
            }));
          } else if (type === 'private') {
            setUserData(prev => ({
              ...prev,
              privatePictures: [...(prev.privatePictures || []), image.uri]
            }));
          }
          
          if (externalSetUserData) {
            externalSetUserData(userData);
          }
        });

        setUploading(false);
        setUploadingImageIndex(null);
        setUploadProgress(0);
        setLocalImageUri(null);
        setNewImageToUpload(null);
      }, 2000);
    } catch (error) {
      console.log('Upload error:', error);
      setUploading(false);
      setUploadingImageIndex(null);
      setUploadProgress(0);
    }
  };

  const handleImageDelete = async (type, index) => {
    try {
      if (type === 'profile') {
        setUserData(prev => ({
          ...prev,
          profilePicture: null
        }));
      } else if (type === 'public') {
        const newPictures = [...(userData.publicPictures || [])];
        newPictures.splice(index, 1);
        setUserData(prev => ({
          ...prev,
          publicPictures: newPictures
        }));
      } else if (type === 'private') {
        const newPictures = [...(userData.privatePictures || [])];
        newPictures.splice(index, 1);
        setUserData(prev => ({
          ...prev,
          privatePictures: newPictures
        }));
      }
      
      if (externalSetUserData) {
        externalSetUserData(userData);
      }
    } catch (error) {
      console.log('Delete error:', error);
    }
  };

  const handleImageReplace = async (type, index) => {
    try {
      const image = await openLibrary();
      if (image) {
        setSelectedImage(image);
        setSelectedImageType(type);
        setSelectedImageIndex(index);
        setLocalImageUri(image.uri);
        setNewImageToUpload(image);
        
        startTransition(() => {
          if (type === 'public') {
            const newPictures = [...(userData.publicPictures || [])];
            newPictures[index] = image.uri;
            setUserData(prev => ({
              ...prev,
              publicPictures: newPictures
            }));
          } else if (type === 'private') {
            const newPictures = [...(userData.privatePictures || [])];
            newPictures[index] = image.uri;
            setUserData(prev => ({
              ...prev,
              privatePictures: newPictures
            }));
          }
          
          if (externalSetUserData) {
            externalSetUserData(userData);
          }
        });
      }
    } catch (error) {
      console.log('Replace error:', error);
    }
  };

  const ImageWithFallback = React.memo(({ source, style, children, onPress, uploading, progress }) => (
    <TouchableOpacity onPress={onPress} style={style}>
      <Images.Round source={source} style={style} />
      {uploading && (
        <Wrapper style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: style?.borderRadius || 0,
        }}>
          <ActivityIndicator size="large" color={colors.appPrimaryColor} />
          <Text style={{ color: 'white', marginTop: scale(10) }}>
            {progress}%
          </Text>
        </Wrapper>
      )}
      {children}
    </TouchableOpacity>
  ));

  const SecondStep = () => {
    const profileFields = [
      { key: 'age', label: t('age'), type: 'number' },
      { key: 'eyeColor', label: t('eyeColor'), type: 'select' },
      { key: 'hairColor', label: t('hairColor'), type: 'select' },
      { key: 'hairLength', label: t('hairLength'), type: 'select' },
      { key: 'height', label: t('height'), type: 'select' },
      { key: 'weight', label: t('weight'), type: 'select' },
      { key: 'chest', label: t('chest'), type: 'select' },
      { key: 'waist', label: t('waist'), type: 'select' },
      { key: 'hips', label: t('hips'), type: 'select' },
      { key: 'nationality', label: t('nationality'), type: 'select' },
    ];

    return (
      <Wrapper>
        <Text style={{ fontSize: fontSizes.large, fontWeight: 'bold', marginBottom: scale(20) }}>
          {t('profileDetails')}
        </Text>
        
        {profileFields.map((field) => {
          const isSelectField = ['eyeColor', 'hairColor', 'hairLength', 'height', 'weight', 'chest', 'waist', 'hips', 'nationality'].includes(field.key);
          const currentValue = userData?.details?.[field.key];
          
          return (
            <Wrapper key={field.key} style={{ marginBottom: scale(15) }}>
              <Labels.Primary text={field.label} />
              <TouchableOpacity
                onPress={() => {
                  if (field.key === 'eyeColor') setEyeColorPickerVisible(true);
                  else if (field.key === 'hairColor') setHairColorPickerVisible(true);
                  else if (field.key === 'hairLength') setHairLengthPickerVisible(true);
                  else if (field.key === 'height') setHeightPickerVisible(true);
                  else if (field.key === 'weight') setWeightPickerVisible(true);
                  else if (field.key === 'chest') setChestPickerVisible(true);
                  else if (field.key === 'waist') setWaistPickerVisible(true);
                  else if (field.key === 'hips') setHipsPickerVisible(true);
                  else if (field.key === 'nationality') setNationalityPickerVisible(true);
                }}
                style={{
                  backgroundColor: colors.appBgColor2,
                  borderRadius: scale(8),
                  padding: scale(15),
                  borderWidth: 1,
                  borderColor: colors.appBorderColor1,
                }}
              >
                <Text style={{ 
                  fontSize: fontSizes.regular,
                  color: currentValue ? colors.appTextColor1 : colors.appTextColor2
                }}>
                  {field.key === 'nationality' && currentValue?.country 
                    ? currentValue.country 
                    : currentValue || t('select')}
                </Text>
              </TouchableOpacity>
            </Wrapper>
          );
        })}
      </Wrapper>
    );
  };

  return (
    <Swipable
      visible={visible}
      toggle={toggle}
      title={t('editProfile')}
      showCloseButton={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: scale(20) }}
        >
          <Wrapper style={{
            maxHeight: responsiveHeight(88),
            paddingHorizontal: scale(20),
            paddingTop: scale(20),
          }}>
            <SecondStep />
            
            <Spacer height={responsiveHeight(12)} />
            
            <Buttons.Colored
              title={saving ? t('saving') : t('save')}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              style={{ marginTop: scale(20) }}
            />
          </Wrapper>
        </ScrollView>
      </KeyboardAvoidingView>
    </Swipable>
  );
}

const ProgressBar = React.memo(({ CurrentStandIndex, setCurrentStage }) => {
  const CompletedStage = CurrentStandIndex - 1;
  const totalStages = 3;

  return (
    <Wrapper style={{ flexDirection: 'row', alignItems: 'center', marginVertical: scale(20) }}>
      {Array.from({ length: totalStages }, (_, index) => (
        <React.Fragment key={index}>
          <Wrapper
            style={{
              width: scale(30),
              height: scale(30),
              borderRadius: scale(15),
              backgroundColor: index <= CompletedStage ? colors.appPrimaryColor : colors.appBorderColor2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: index <= CompletedStage ? 'white' : colors.appTextColor2,
              fontSize: fontSizes.small,
              fontWeight: 'bold',
            }}>
              {index + 1}
            </Text>
          </Wrapper>
          {index < totalStages - 1 && (
            <Wrapper
              style={{
                flex: 1,
                height: 2,
                backgroundColor: index < CompletedStage ? colors.appPrimaryColor : colors.appBorderColor2,
                marginHorizontal: scale(10),
              }}
            />
          )}
        </React.Fragment>
      ))}
    </Wrapper>
  );
});

export { default as ImageCropModal } from './ImageCropModal';








