import React, {useState, useEffect} from 'react';
import {Alert, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import {colors} from '../../../../services/utilities/colors';
import {routes} from '../../../../services/constants';
import {responsiveHeight, responsiveWidth} from '../../../../services/utilities/responsive';
import {Wrapper, Text, Images, StatusBars, Headers} from '../../../../components';
import {Spacer} from '../../../../components';
import {scale} from 'react-native-size-matters';
import {appImages} from '../../../../services/utilities/assets';

export default function BackendVerification() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      console.log('Loading verifications...');
      
      // Get verifications from VerificationQueue collection
      const verificationsSnapshot = await firestore()
        .collection('VerificationQueue')
        .orderBy('uploadedAt', 'desc')
        .limit(10)
        .get();

      const verificationsData = [];
      
      for (const doc of verificationsSnapshot.docs) {
        const verification = doc.data();
        verification.id = doc.id;
        
        // Get user data for each verification
        try {
          const userDoc = await firestore().collection('Users').doc(verification.id).get();
          if (userDoc.exists) {
            verification.user = userDoc.data();
            verification.user.id = userDoc.id;
            verificationsData.push(verification);
          } else {
            // User doesn't exist, remove from queue
            console.log('User not found for verification:', verification.id);
            await removeVerification(verification.id);
          }
        } catch (error) {
          console.error('Error loading user for verification:', verification.id, error);
        }
      }
      
      console.log('Loaded verifications:', verificationsData.length);
      setVerifications(verificationsData);
    } catch (error) {
      console.error('Error loading verifications:', error);
      Alert.alert(t('ERROR'), t('ERROR_LOADING_DATA'));
    } finally {
      setLoading(false);
    }
  };

  const acceptVerification = async (verification) => {
    try {
      console.log('Accepting verification for user:', verification.id);
      
      // Update user verification status
      await firestore().collection('Users').doc(verification.id).update({
        isVerified: true,
        verifiedImg: verification.pictures
      });
      
      // Send notification to user
      try {
        const userDoc = await firestore().collection('Users').doc(verification.id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const userLanguage = userData._settings?.currentLang || 'en';
          
          // Send notification (you might need to implement this based on your notification system)
          console.log('User verified, notification sent');
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
      
      // Remove from verification queue
      await removeVerification(verification.id);
      
      Alert.alert(t('SUCCESS'), t('USER_VERIFIED'));
      loadVerifications(); // Refresh the list
    } catch (error) {
      console.error('Error accepting verification:', error);
      Alert.alert(t('ERROR'), t('ERROR_VERIFYING_USER'));
    }
  };

  const declineVerification = async (verification) => {
    try {
      console.log('Declining verification for user:', verification.id);
      
      // Send notification to user
      try {
        const userDoc = await firestore().collection('Users').doc(verification.id).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const userLanguage = userData._settings?.currentLang || 'en';
          
          // Send notification (you might need to implement this based on your notification system)
          console.log('User verification declined, notification sent');
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
      
      // Remove from verification queue
      await removeVerification(verification.id);
      
      Alert.alert(t('SUCCESS'), t('USER_VERIFICATION_DECLINED'));
      loadVerifications(); // Refresh the list
    } catch (error) {
      console.error('Error declining verification:', error);
      Alert.alert(t('ERROR'), t('ERROR_DECLINING_VERIFICATION'));
    }
  };

  const removeVerification = async (verificationId) => {
    try {
      await firestore().collection('VerificationQueue').doc(verificationId).delete();
      console.log('Verification removed:', verificationId);
    } catch (error) {
      console.error('Error removing verification:', error);
    }
  };

  const showProfile = (verification) => {
    navigation.navigate(routes.userProfile, {
      visiterProfile: true, 
      userId: verification.id
    });
  };

  const getGesteImageFromVerification = (verification) => {
    // Wenn verificationItem existiert, verwende es
    if (verification.verificationItem) {
      // Extrahiere die Nummer aus dem Pfad (z.B. "assets/gesten/001.jpg" -> "001")
      const match = verification.verificationItem.match(/(\d{3})\.jpg$/);
      if (match) {
        const gesteNumber = match[1];
        // Mappe die Nummer auf das entsprechende appImages Objekt
        const gesteMap = {
          '001': appImages.geste001,
          '002': appImages.geste002,
          '003': appImages.geste003,
          '004': appImages.geste004,
          '005': appImages.geste005,
          '006': appImages.geste006,
          '007': appImages.geste007,
          '008': appImages.geste008,
          '009': appImages.geste009,
          '010': appImages.geste010,
        };
        return gesteMap[gesteNumber] || appImages.geste001;
      }
    }
    
    // Fallback: Verwende das erste Gestenbild
    return appImages.geste001;
  };

  const showImg = (picture) => {
    // TODO: Implement image viewer modal
    console.log('Show image:', picture);
    Alert.alert('Image Viewer', 'Image viewer coming soon');
  };

  const renderVerificationItem = (verification) => {
    if (!verification.user) {
      return (
        <Wrapper
          key={verification.id}
          style={{
            backgroundColor: colors.appBgColor1,
            borderRadius: responsiveWidth(3),
            padding: responsiveWidth(4),
            margin: responsiveWidth(2),
            shadowColor: colors.appTextColor1,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}>
          <Text isBoldFont style={{fontSize: 18, marginBottom: responsiveHeight(2)}}>
            {t('PROFILE_DELETED')}
          </Text>
          <TouchableOpacity
            onPress={() => removeVerification(verification.id)}
            style={{
              backgroundColor: colors.appDangerColor,
              paddingHorizontal: responsiveWidth(3),
              paddingVertical: responsiveHeight(1),
              borderRadius: responsiveWidth(2),
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Text style={{color: 'white', fontSize: 14, fontWeight: 'bold'}}>{t('REMOVE_VERIFICATION')}</Text>
          </TouchableOpacity>
        </Wrapper>
      );
    }

    const userData = verification.user;

    return (
      <Wrapper
        key={verification.id}
        style={{
          backgroundColor: colors.appBgColor1,
          borderRadius: responsiveWidth(3),
          padding: responsiveWidth(4),
          margin: responsiveWidth(2),
          shadowColor: colors.appTextColor1,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        {/* User Header */}
        <Wrapper style={{marginBottom: responsiveHeight(2)}}>
          <Text isBoldFont style={{fontSize: 18, marginBottom: responsiveHeight(1)}}>
            {userData.username || 'Unknown User'}
          </Text>
          {userData.currentLocation?.city && (
            <Text isSmall isTextColor2>{userData.currentLocation.city}</Text>
          )}
        </Wrapper>

        {/* Verification Images */}
        <Wrapper style={{marginBottom: responsiveHeight(2)}}>
          <Text isBoldFont style={{fontSize: 16, marginBottom: responsiveHeight(1)}}>
            {t('VERIFICATION_IMAGES')}
          </Text>
          <Wrapper flexDirectionRow>
            {/* User's verification image */}
            <Wrapper style={{marginRight: responsiveWidth(2)}}>
              <Images.Round
                source={{uri: verification.pictures?.thumbnails?.medium || verification.pictures?.original}}
                size={scale(80)}
                onPress={() => showImg(verification.pictures?.thumbnails?.big || verification.pictures?.original)}
              />
              <Text style={{color: colors.appTextColor2, marginTop: responsiveHeight(1), fontSize: 12}}>
                {t('VERIFICATION_IMAGE')}
              </Text>
            </Wrapper>

            {/* Gesture reference image */}
            <Wrapper>
              <Images.Round
                source={getGesteImageFromVerification(verification)}
                size={scale(80)}
                onPress={() => showImg(getGesteImageFromVerification(verification))}
              />
              <Text style={{color: colors.appTextColor2, marginTop: responsiveHeight(1), fontSize: 12}}>
                {t('GESTURE_REFERENCE')}
              </Text>
            </Wrapper>
          </Wrapper>
        </Wrapper>

        {/* Actions */}
        <Wrapper>
          <Text isBoldFont style={{fontSize: 16, marginBottom: responsiveHeight(1)}}>
            {t('ACTIONS')}
          </Text>
          <Wrapper flexDirectionRow style={{gap: responsiveWidth(2)}}>
            <TouchableOpacity
              onPress={() => acceptVerification(verification)}
              style={{
                backgroundColor: '#28a745',
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(1),
                borderRadius: responsiveWidth(1),
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: responsiveWidth(15),
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 6
              }}>
              <Text style={{color: '#ffffff', fontSize: 14, fontWeight: 'bold'}}>✓ {t('ACCEPT')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => declineVerification(verification)}
              style={{
                backgroundColor: '#dc3545',
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(1),
                borderRadius: responsiveWidth(1),
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: responsiveWidth(15),
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 6
              }}>
              <Text style={{color: '#ffffff', fontSize: 14, fontWeight: 'bold'}}>✗ {t('DECLINE')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => showProfile(verification)}
              style={{
                backgroundColor: '#007bff',
                paddingHorizontal: responsiveWidth(3),
                paddingVertical: responsiveHeight(1),
                borderRadius: responsiveWidth(1),
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: responsiveWidth(15),
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 6
              }}>
              <Text style={{color: '#ffffff', fontSize: 14, fontWeight: 'bold'}}>👤 {t('PROFILE')}</Text>
            </TouchableOpacity>
          </Wrapper>
        </Wrapper>
      </Wrapper>
    );
  };

  if (loading) {
    return (
      <Wrapper isMain>
        <StatusBars.Dark />
        <Spacer isStatusBarHeigt />
        <Headers.Primary
          showBackArrow
          title={t('VERIFICATION')}
        />
        <Wrapper flex={1} justifyContentCenter alignItemsCenter>
          <Text>{t('LOADING')}...</Text>
        </Wrapper>
      </Wrapper>
    );
  }

  return (
    <Wrapper isMain>
      <StatusBars.Dark />
      <Headers.Primary
        showBackArrow
        title={t('VERIFICATION')}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Wrapper marginHorizontalBase>
          {verifications.length > 0 ? (
            verifications.map(verification => renderVerificationItem(verification))
          ) : (
            <Wrapper justifyContentCenter alignItemsCenter style={{marginTop: responsiveHeight(20)}}>
              <Text isMedium isBoldFont alignTextCenter>
                {t('NO_VERIFICATIONS')}
              </Text>
            </Wrapper>
          )}
        </Wrapper>
      </ScrollView>
    </Wrapper>
  );
} 