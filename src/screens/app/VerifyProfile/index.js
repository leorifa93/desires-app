import {Image, StyleSheet, TouchableOpacity, View, ActivityIndicator, Platform, StatusBar, Alert} from 'react-native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Buttons, Headers, Spacer, Text, Wrapper} from '../../../components';
import { useTranslation } from 'react-i18next';
import {
  appImages,
  colors,
  responsiveHeight,
  responsiveWidth,
} from '../../../services';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
} from 'react-native-vision-camera';
import {requestCameraPermission, requestPhotoLibraryPermission} from './hooks';
import { uploadImage } from '../../../services/firebaseUtilities/storage';
import firestore from '@react-native-firebase/firestore';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../../../store/actions/auth';
import {scale} from 'react-native-size-matters';
import { goBack } from '../../../navigation/rootNavigation';
import { useNavigation } from '@react-navigation/native';
import { routes } from '../../../services/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Index() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);
  const [cameraPermission, setCameraPermission] = useState(false);
  const device = useCameraDevice('front');
  const me = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const bannerTop = (insets?.top || (Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0)));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const gestures = useMemo(() => [
    appImages.geste001,
    appImages.geste002,
    appImages.geste003,
    appImages.geste004,
    appImages.geste005,
    appImages.geste006,
    appImages.geste007,
    appImages.geste008,
    appImages.geste009,
    appImages.geste010,
  ], []);
  const [gestureIndex] = useState(() => Math.floor(Math.random() * 10));

  useEffect(() => {
    const checkPermissions = async () => {
      const cameraStatus = await requestCameraPermission();
    };
    checkPermissions();
  }, []);

  const StartCamera = async () => {
    // Request camera permission again when taking a photo
    const cameraStatus = await requestCameraPermission();
    setCameraPermission(cameraStatus);
  };

  const takePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          quality: 1,
          skipMetadata: true,
        });
        // console.log(photo, photo.path);
        setPhoto(photo.path);
        setCameraPermission(false); // Set camera permission to false after taking the photo
      } else {
        console.error('Camera ref is not set');
        alert('Camera is not available');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('An error occurred while taking the photo. Please try again.');
    }
  };

  const onSend = async () => {
    try {
      if (!me?.id || !photo) {
        Alert.alert(t('ERROR'), t('PHOTO_REQUIRED') || 'Bitte nehmen Sie zuerst ein Foto auf');
        return;
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      console.log('[Verification] Starting upload for user:', me.id);
      console.log('[Verification] Photo path:', photo);
      
      // Ensure proper file:// prefix handling
      const photoPath = photo.startsWith('file://') ? photo : `file://${photo}`;
      console.log('[Verification] Formatted photo path:', photoPath);
      
      const storagePath = `Verifications/${me.id}/image`;
      console.log('[Verification] Storage path:', storagePath);
      
      try {
        const pictures = await uploadImage(photoPath, storagePath, (p) => {
          setUploadProgress(p);
          console.log('[Verification] Upload progress:', p);
        });
        
        console.log('[Verification] Upload successful, pictures:', pictures);
        
        await firestore().collection('Verifications').doc(me.id).set({
          uploadedAt: Date.now(),
          verificationItem: `00${gestureIndex + 1}`,
          pictures,
          id: me.id,
        });
        
        console.log('[Verification] Firestore document created');
        
        Alert.alert(t('SUCCESS'), t('ADDEDTOVERIFICATIONQUEUE') || 'Zur Verifizierungswarteschlange hinzugefügt');
        
        // Mark verification choice as made and update Redux
        await firestore().collection('Users').doc(me.id).update({
          verificationChoiceMade: true
        });
        
        // Update Redux to reflect the change immediately
        dispatch(setUser({
          user: {
            ...me,
            verificationChoiceMade: true
          },
          dataLoaded: true
        }));
        
        // Navigate to app stack (contains bottom tabs)
        navigation.navigate(routes.app);
        
      } catch (uploadError) {
        console.error('[Verification] Upload error:', uploadError);
        
        // More specific error messages
        let errorMessage = t('ERROR_UPLOADING_VERIFICATION') || 'Fehler beim Hochladen des Verifizierungsbildes';
        
        if (uploadError.message?.includes('Server is unavailable')) {
          errorMessage = t('SERVER_UNAVAILABLE') || 'Server ist nicht erreichbar. Bitte versuchen Sie es später erneut.';
        } else if (uploadError.message?.includes('storage/')) {
          errorMessage = t('STORAGE_ERROR') || 'Speicherfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
        }
        
        Alert.alert(t('ERROR'), errorMessage);
        throw uploadError; // Re-throw to be caught by outer catch
      }
      
    } catch (e) {
      console.error('[Verification] Upload failed:', e);
      // Error already handled in inner catch, or it's a different error
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Wrapper isMain>
      {/* Upload banner */}
      {isUploading && (
        <Wrapper
          backgroundColor={colors.appPrimaryColor}
          paddingVerticalSmall
          style={{ 
            position: 'absolute', 
            top: bannerTop, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4
          }}
        >
          <Wrapper flexDirectionRow alignItemsCenter justifyContentCenter>
            <ActivityIndicator size="small" color={colors.appBgColor1} />
            <Text isSmall isBoldFont style={{ color: '#FFFFFF', marginLeft: 8 }}>
              {`Bilder werden hochgeladen ${uploadProgress ? `(${uploadProgress}%)` : ''}`}
            </Text>
          </Wrapper>
        </Wrapper>
      )}
      <Wrapper marginHorizontalTiny={false}>
        <Headers.Primary
          showBackArrow
          title={t('VERIFICATION')}
          right={null}
          onPressBack={() => navigation.navigate(routes.verificationChoice)}
        />
      </Wrapper>
      <Spacer isBasic />
      <Wrapper marginHorizontalBase>
        <Text isRegular isRegularFont style={{width: responsiveWidth(75)}}>
          {t('MAKEVERIFICATIONGESTURE')}
        </Text>
      </Wrapper>
      <Spacer isBasic />
      <Wrapper marginHorizontalBase>
        {photo ? (
          <View>
            <Image
              source={{uri: `${'file://'}${photo}`}}
              style={styles.imageMainContainer}
            />
            <Spacer isSmall />
          </View>
        ) : null}
        <Image source={gestures[gestureIndex]} style={styles.imageMainContainer} />
      </Wrapper>
      <Wrapper flex={1} paddingVerticalBase justifyContentFlexend>
        {photo ? (
          <Wrapper>
            <Buttons.Colored text={t('VERIFY')} onPress={onSend} />
            <Spacer height={responsiveHeight(1)} />
            <Buttons.Bordered 
              text={t('RETAKE_PHOTO')} 
              onPress={() => setPhoto(null)} 
              buttonStyle={{ borderColor: colors.appPrimaryColor }}
              textStyle={{ color: colors.appPrimaryColor }}
            />
          </Wrapper>
        ) : (
          <Buttons.Colored text={t('START_CAMERA')} onPress={StartCamera} />
        )}
      </Wrapper>
      {cameraPermission ? (
        <View style={styles.camera}>
          <Camera
            style={styles.camera}
            device={device}
            isActive={cameraPermission}
            ref={cameraRef}
            photo={true}
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: responsiveHeight(2),
              left: responsiveWidth(41),
            }}
            onPress={takePhoto}>
            <Wrapper
              style={{
                height: scale(60),
                width: scale(60),
                borderRadius: 150,
                backgroundColor: colors.appBgColor1,
              }}
            />
          </TouchableOpacity>
        </View>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  imageMainContainer: {
    height: responsiveHeight(28),
    width: 'auto',
    borderRadius: responsiveWidth(5),
    overflow: 'hidden',
    resizeMode: 'cover',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  capturedImage: {
    height: responsiveHeight(28),
    width: 'auto',
    borderRadius: responsiveWidth(5),
    overflow: 'hidden',
    resizeMode: 'cover',
    marginTop: 20,
  },
});
